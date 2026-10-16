import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Json } from "@enjambre/database/database.types";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, requireProfileRole, tenantMiddleware } from "@/api/lib/middleware";
import {
  applyFeriaPostVenta,
  formatFeriaValidationError,
  validateFeriaConsignacion,
  type FeriaSaleItem,
} from "@/api/lib/feria-pos";
import { fromLoose, rpcLoose } from "@/api/lib/supabase-loose";
import {
  buildBatchStockPayload,
  decrementoSerialFallback,
  mapStockRows,
  restaurarStock,
  type StockMapping,
} from "@/api/lib/rep-ventas-stock";
import { fetchBloqueadosPorProducto } from "@/api/lib/stock/cart-stock";
import { registerDeliveredQrCodes } from "@/lib/sale-qr";
import { registrarEventoFid, resolverPuntoVendedor } from "./b2b";
import { getCafMinFolios, getFoliosRestantes } from "@/api/lib/fiscal/caf-guard";
import { createAdminClient } from "@enjambre/auth/server-index";
import { calcularNetoDesdeTotal } from "@enjambre/contable";

const BankDetailsSchema = z.object({
  banco: z.string().min(2).max(60),
  tipo_cuenta: z.enum(["vista_cuentarut", "corriente", "ahorro"]),
  numero_cuenta: z.string().min(4).max(30),
  rut: z.string().min(8).max(12),
  titular: z.string().min(3).max(80),
}).strict();

const QuickSaleSchema = z.object({
  cash_session_id: z.string().uuid(),
  producto_id: z.string().uuid(),
  cantidad: z.number().int().min(1).default(1),
  metodo_pago: z.enum(["efectivo", "transferencia", "tarjeta", "pos_terminal", "mixto"]),
  channel: z.enum(["feria", "delivery", "local", "corporativo", "referido"]).optional(),
  cliente_id: z.string().uuid().optional(),
  tercero_id: z.string().uuid().optional(),
  is_new_client: z.boolean().default(true),
  /** Identidad del cliente final del microcanal (tarjeta QR / email / whatsapp):
   *  la compra acredita sellos/puntos en el punto de venta del vendedor. */
  fid_identidad: z.string().max(120).optional().nullable(),
  qr_codes: z.array(z.string()).optional(),
  /** Client-generated UUID — idempotency for offline sync retries (stored as ventas.buy_order). */
  client_request_id: z.string().uuid().optional(),
  items_override: z
    .array(
      z.object({
        producto_id: z.string().uuid(),
        nombre: z.string(),
        cantidad: z.number().int().min(1),
        precio_unitario: z.number().min(0),
        qr_codes: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  sumup_checkout_id: z.string().optional(),
  sumup_transaction_id: z.string().optional(),
  /** Descuento POS feria: % 0–50 (preferido) o monto fijo CLP. Servidor recalcula; no confiar en total cliente. */
  descuento_pct: z.number().min(0).max(50).optional(),
  descuento_clp: z.number().min(0).optional(),
});

const POS_MAX_DISCOUNT_PCT = 50;

function applyPosDiscount(
  subtotal: number,
  descuentoPct?: number,
  descuentoClp?: number,
): { subtotal: number; descuentoClp: number; total: number; descuentoPct: number | null } {
  const sub = Math.max(0, Math.round(subtotal));
  if (descuentoPct != null && descuentoPct > 0) {
    const pct = Math.min(POS_MAX_DISCOUNT_PCT, Math.max(0, descuentoPct));
    const d = Math.min(sub, Math.round((sub * pct) / 100));
    return { subtotal: sub, descuentoClp: d, total: sub - d, descuentoPct: pct };
  }
  if (descuentoClp != null && descuentoClp > 0) {
    const d = Math.min(sub, Math.max(0, Math.round(descuentoClp)));
    const pct = sub > 0 ? Math.round((d / sub) * 1000) / 10 : null;
    return { subtotal: sub, descuentoClp: d, total: sub - d, descuentoPct: pct };
  }
  return { subtotal: sub, descuentoClp: 0, total: sub, descuentoPct: null };
}

function extractVentaLines(productos: unknown): Array<{
  producto_id: string;
  nombre?: string;
  cantidad: number;
  precio_unitario?: number;
}> {
  if (!Array.isArray(productos)) return [];
  return productos.filter((line): line is {
    producto_id: string;
    nombre?: string;
    cantidad: number;
    precio_unitario?: number;
  } => {
    if (!line || typeof line !== "object") return false;
    const r = line as Record<string, unknown>;
    if (r._tipo === "pos_descuento") return false;
    return typeof r.producto_id === "string";
  });
}

export const repVentasRoutes = new Hono<{ Variables: AppVariables }>();

repVentasRoutes.use("*", authMiddleware, tenantMiddleware, requireProfileRole("rep_ventas", "admin"));

const quickSaleLimiter = new Map<string, { count: number; resetAt: number }>();
const QUICK_SALE_LIMIT = 30;
const QUICK_SALE_WINDOW_MS = 60_000;
const RATE_LIMITER_MAX_ENTRIES = 10_000;

function cleanupRateLimiter(now: number) {
  if (quickSaleLimiter.size > RATE_LIMITER_MAX_ENTRIES) {
    for (const [key, entry] of quickSaleLimiter) {
      if (now > entry.resetAt) quickSaleLimiter.delete(key);
    }
  }
}

repVentasRoutes.post("/quick", zValidator("json", QuickSaleSchema), async (c) => {
  const user = c.get("user");
  const now = Date.now();
  cleanupRateLimiter(now);
  const entry = quickSaleLimiter.get(user.id);
  if (!entry || now > entry.resetAt) {
    quickSaleLimiter.set(user.id, { count: 1, resetAt: now + QUICK_SALE_WINDOW_MS });
  } else {
    entry.count++;
    if (entry.count > QUICK_SALE_LIMIT) {
      return c.json({ code: "rate_limited", message: "Demasiadas ventas rápidas, espera un momento" }, 429);
    }
  }

  const input = c.req.valid("json");
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const channel = input.channel ?? "feria";
  const posBuyOrder = input.client_request_id
    ? `POS-${input.client_request_id}`
    : null;

  // Idempotency: offline sync may retry after ambiguous network success.
  if (posBuyOrder) {
    const { data: existing } = await supabase
      .from("ventas")
      .select("id, total, metodo_pago, channel, created_at, rep_commission_total, claim_token")
      .eq("buy_order", posBuyOrder)
      .eq("vendedor_id", user.id)
      .maybeSingle();
    if (existing) {
      return c.json({
        data: existing,
        meta: {
          feria: { applied: true },
          already_processed: true,
          accumulated_commission: null,
          day_total: null,
          next_threshold: null,
          commission: null,
        },
      }, 200);
    }
  }

  let activeSessionId = input.cash_session_id;

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, session_status")
    .eq("id", input.cash_session_id)
    .eq("rep_id", user.id)
    .maybeSingle();

  if (!session || session.session_status !== "open") {
    // Si la sesión enviada no existe o no está abierta (ej. venta offline sincronizada antes de la sesión),
    // buscar si el rep tiene alguna sesión abierta vigente
    const { data: fallbackOpen } = await supabase
      .from("cash_sessions")
      .select("id, session_status")
      .eq("rep_id", user.id)
      .eq("session_status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackOpen) {
      activeSessionId = fallbackOpen.id;
    } else if (input.cash_session_id) {
      // Auto-provisionar la sesión offline para asegurar la persistencia de la venta
      const { data: newSession, error: createSessionErr } = await supabase
        .from("cash_sessions")
        .insert({
          id: input.cash_session_id,
          empresa_id: empresaId,
          rep_id: user.id,
          opening_cash: 0,
          session_status: "open",
        })
        .select("id, session_status")
        .maybeSingle();

      if (createSessionErr || !newSession) {
        return c.json({ code: "no_open_session", message: "No hay sesión de caja abierta" }, 400);
      }
      activeSessionId = newSession.id;
    } else {
      return c.json({ code: "no_open_session", message: "No hay sesión de caja abierta" }, 400);
    }
  }

  let items: { producto_id: string; nombre: string; cantidad: number; precio_unitario: number; qr_codes?: string[] }[];
  let total: number;

  if (input.items_override && input.items_override.length > 0) {
    // Never trust client unit prices — reprice from productos.
    const ids = input.items_override.map((i) => i.producto_id);
    const { data: products, error: prodErr } = await supabase
      .from("productos")
      .select("id, nombre, precio")
      .in("id", ids);
    if (prodErr || !products?.length) {
      return c.json({ code: "product_not_found", message: "Productos no encontrados" }, 404);
    }
    const productMap = new Map(products.map((p) => [p.id, p]));
    items = [];
    for (const line of input.items_override) {
      const product = productMap.get(line.producto_id);
      if (!product) {
        return c.json({
          code: "product_not_found",
          message: `Producto ${line.nombre} no encontrado`,
        }, 404);
      }
      const unit = Number(product.precio);
      const precio_unitario = Number.isFinite(unit) ? Math.max(0, Math.round(unit)) : 0;
      items.push({
        producto_id: product.id,
        nombre: product.nombre ?? line.nombre,
        cantidad: line.cantidad,
        precio_unitario,
        qr_codes: line.qr_codes,
      });
    }
    total = items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0);
  } else {
    const { data: producto } = await supabase
      .from("productos")
      .select("id, nombre, precio")
      .eq("id", input.producto_id)
      .single();

    if (!producto) {
      return c.json({ code: "product_not_found", message: "Producto no encontrado" }, 404);
    }

    const unit = Number(producto.precio);
    const precio_unitario = Number.isFinite(unit) ? Math.max(0, Math.round(unit)) : 0;
    items = [
      {
        producto_id: producto.id,
        nombre: producto.nombre ?? "",
        cantidad: input.cantidad,
        precio_unitario,
        qr_codes: input.qr_codes ?? [],
      },
    ];
    total = precio_unitario * input.cantidad;
  }

  const priced = applyPosDiscount(total, input.descuento_pct, input.descuento_clp);
  total = priced.total;

  const feriaItems: FeriaSaleItem[] = items.map((i) => ({
    producto_id: i.producto_id,
    nombre: i.nombre,
    cantidad: i.cantidad,
    precio_unitario: i.precio_unitario,
  }));

  try {
    const feriaValidation = await validateFeriaConsignacion(supabase, user.id, feriaItems, channel);
    if (feriaValidation.required && !feriaValidation.ok) {
      return c.json(
        {
          code: "consignacion_insuficiente",
          message: formatFeriaValidationError(feriaValidation),
          details: feriaValidation.errors ?? [],
        },
        409,
      );
    }

    // Kill-switch: bloquear ventas si la feria está pausada por admin (WIP feria)
    if (feriaValidation.required && feriaValidation.evento_id) {
      const { data: paused, error: pauseErr } = await supabase.rpc("es_feria_pausada", {
        p_evento_id: feriaValidation.evento_id,
      });
      if (pauseErr) {
        console.warn("[rep-ventas] Error checking feria pause:", pauseErr.message);
      } else if (paused) {
        return c.json(
          {
            code: "feria_pausada",
            message: "Esta feria ha sido pausada por administración. No se pueden registrar ventas.",
          },
          403,
        );
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error validando consignación feria";
    return c.json({ code: "feria_validation_failed", message }, 500);
  }

  // 0b. Bloqueo de calidad: lotes observados (HMF sobre Codex) no se venden en POS.
  const bloqueadosPos = await fetchBloqueadosPorProducto(
    supabase,
    items.map((i: { producto_id: string }) => i.producto_id),
  );
  if (bloqueadosPos.size > 0) {
    return c.json(
      {
        code: "calidad_bloqueada",
        message: "Uno o más productos están bloqueados por control de calidad. Revisa Producción → Lotes.",
      },
      409,
    );
  }

  // 0. CAF fail-closed: si la auto-emisión de boletas está habilitada y es efectivo/transferencia
  // (pagos con tarjeta POS / SumUp están amparados por voucher válido como boleta bajo Res. Ex. 176).
  const autoEmitBoleta = process.env.SII_AUTO_EMIT_BOLETA === "true";
  const requiereBoletaSii = input.metodo_pago === "efectivo" || input.metodo_pago === "transferencia";
  if (empresaId && autoEmitBoleta && requiereBoletaSii) {
    const minFolios = getCafMinFolios();
    const restantes = await getFoliosRestantes(supabase, empresaId, 39);
    if (restantes < minFolios) {
      return c.json(
        {
          code: "folios_exhausted",
          message:
            "El sistema de POS se encuentra en mantenimiento (código: folios). Por favor pide más boletas.",
          foliosRestantes: restantes,
          minFolios,
        },
        503,
      );
    }
  }

  // 1. Descontar stock de productos y obtener hash de trazabilidad.
  //    Un solo RPC batch (atómico: cualquier error revierte todo) en vez de N
  //    llamadas seriales a decrement_stock_force. Si la función batch aún no
  //    está en la DB (orden de despliegue), fallback serial legacy.
  type CartLine = (typeof items)[number];
  let mapping: StockMapping<CartLine>;

  const { data: stockRows, error: stockErr } = await rpcLoose(supabase, "decrement_stock_force_batch", {
    p_items: buildBatchStockPayload(items),
  });

  if (stockErr || !Array.isArray(stockRows)) {
    const fb = await decrementoSerialFallback(supabase, items);
    if (!fb.ok || !fb.mapping) {
      return c.json({ code: "stock_insufficient", message: "Stock insuficiente en almacén" }, 409);
    }
    mapping = fb.mapping;
  } else {
    mapping = mapStockRows(items, stockRows as unknown as Array<{
      id?: string;
      stock?: number | null;
      lote_id?: string | null;
      traceability_hash?: string | null;
    }>);
  }

  const { enriched: enrichedItems, decremented, negativeStock } = mapping;

  for (const n of negativeStock) {
    console.warn(`[SyncEngine] Sobregiro de inventario en POS offline: producto ${n.productId} quedó con stock ${n.stock}.`);
  }

  // Meta de descuento al final del array (auditable; consumidores filtran por producto_id)
  const productosPayload: unknown[] = [...enrichedItems];
  if (priced.descuentoClp > 0) {
    productosPayload.push({
      _tipo: "pos_descuento",
      descuento_clp: priced.descuentoClp,
      descuento_pct: priced.descuentoPct,
      subtotal_bruto: priced.subtotal,
      total_neto: priced.total,
    });
  }

  // 2. Crear venta — typegen exige `productos` (Json) y a veces `id`; runtime acepta omitir id
  // cliente_id es FK a profiles: si el emisor manda un id de otra tabla (tercero),
  // el insert fallaría y el sync offline quedaría en error. Sanear antes de insertar.
  let clienteIdSafe: string | null = input.cliente_id ?? null;
  if (clienteIdSafe) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", clienteIdSafe)
      .maybeSingle();
    if (!prof) clienteIdSafe = null;
  }
  const { data: venta, error: ventaError } = await fromLoose(supabase, "ventas")
    .insert({
      vendedor_id: user.id,
      empresa_id: empresaId,
      cash_session_id: activeSessionId,
      total,
      productos: productosPayload as Json,
      metodo_pago: input.metodo_pago,
      channel,
      cliente_id: clienteIdSafe,
      tercero_id: input.tercero_id ?? null,
      is_new_client: input.is_new_client,
      estado: "completada",
      origen: channel === "feria" || channel === "local" ? channel : "feria",
      buy_order: posBuyOrder,
      sumup_checkout_id: input.sumup_checkout_id ?? null,
      sumup_transaction_id: input.sumup_transaction_id ?? null,
    })
    .select("id, total, metodo_pago, channel, created_at, rep_commission_total, claim_token")
    .single();

  if (ventaError) {
    await restaurarStock(supabase, decremented);

    // Idempotencia segura en concurrencia: si otra petición insertó el mismo buy_order primero
    if (
      posBuyOrder &&
      (ventaError.code === "23505" ||
        ventaError.message?.includes("duplicate key") ||
        ventaError.message?.includes("idx_ventas_buy_order"))
    ) {
      const { data: existing } = await supabase
        .from("ventas")
        .select("id, total, metodo_pago, channel, created_at, rep_commission_total, claim_token")
        .eq("buy_order", posBuyOrder)
        .eq("vendedor_id", user.id)
        .maybeSingle();

      if (existing) {
        return c.json(
          {
            data: existing,
            meta: {
              feria: { applied: true },
              already_processed: true,
              accumulated_commission: null,
              day_total: null,
              next_threshold: null,
              commission: null,
            },
          },
          200,
        );
      }
    }

    return c.json({ code: "venta_create_failed", message: ventaError.message }, 400);
  }

  const ventaId = venta.id as string;

  // Boleta electrónica DTE 39 (asíncrono, no bloquea la confirmación rápida del POS)
  if (empresaId && autoEmitBoleta && requiereBoletaSii) {
    const montoNeto = Math.round(calcularNetoDesdeTotal(total));
    const montoIva = total - montoNeto;
    const docNumero = `POS-B-${ventaId.slice(0, 8).toUpperCase()}`;
    const fechaEmision = new Date().toISOString().slice(0, 10);
    void (async () => {
      try {
        const { data: feRow } = await supabase
          .from("facturas_emitidas")
          .insert({
            empresa_id: empresaId,
            tercero_id: input.tercero_id ?? null,
            numero: docNumero,
            fecha_emision: fechaEmision,
            monto_neto: montoNeto,
            monto_iva: montoIva,
            monto_total: total,
            monto_exento: 0,
            monto_iva_usado: 0,
            tipo_documento: "Boleta",
            tipo_dte: 39,
            descripcion: `Venta POS Feria - ${posBuyOrder ?? ventaId.slice(0, 8)}`,
            estado: "pendiente",
            estado_sii: "pendiente",
            idempotency_key: `venta_pos:${ventaId}`,
          })
          .select("id")
          .single();

        if (feRow?.id) {
          const { maybeEmitBoletaPostCheckout } = await import("@/lib/fiscal/checkout-dte");
          await maybeEmitBoletaPostCheckout(supabase, {
            empresaId,
            facturaEmitidaId: feRow.id,
            ventaId,
            buyOrder: posBuyOrder ?? ventaId,
            receptorNombre: "Cliente POS Feria",
            cart: items.map((i) => ({
              productId: i.producto_id,
              slug: (i as { slug?: string }).slug || i.producto_id,
              name: i.nombre,
              quantity: i.cantidad,
              unitPrice: i.precio_unitario,
            })),
            fechaEmision,
          });
        }
      } catch (feErr: unknown) {
        console.warn("[rep-ventas] DTE boleta background error:", feErr);
      }
    })();
  }
  // Audit trail QR (best-effort)
  await registerDeliveredQrCodes(
    async (args) => {
      const { error } = await supabase.rpc("registrar_escaneo_qr", {
        p_codigo: args.p_codigo,
        p_evento: args.p_evento,
        p_metadata: args.p_metadata as Json | undefined,
      });
      return { error };
    },
    items,
    ventaId,
  );

  // Fidelización del microcanal: la identidad del cliente viaja con la venta
  // (online y offline — el payload enqueueado la lleva y quick la procesa).
  let fidMeta: Record<string, unknown> | null = null;
  if (input.fid_identidad) {
    try {
      const punto = await resolverPuntoVendedor(supabase, user.id);
      if (punto) {
        const res = await registrarEventoFid(supabase, punto.id, input.fid_identidad, Number(venta.total), "pos");
        fidMeta = { punto: punto.nombre, puntos_ganados: res.puntos_ganados, ok: res.ok };
      }
    } catch (err) {
      console.warn("[rep-ventas] fid:", err);
    }
  }

  let feriaMeta: Record<string, unknown> | null;
  try {
    feriaMeta = (await applyFeriaPostVenta(
      supabase,
      user.id,
      venta.id,
      feriaItems,
      total,
      channel,
    )) as Record<string, unknown>;
  } catch (err) {
    await supabase.from("ventas").delete().eq("id", venta.id);
    await restaurarStock(supabase, decremented);
    const message = err instanceof Error ? err.message : "Error aplicando consignación feria";
    return c.json({ code: "feria_apply_failed", message }, 409);
  }

  const { data: lastCommission } = await supabase
    .from("commission_records")
    .select("base_commission, volume_multiplier, loyalty_bonus, streak_bonus, tier_multiplier, channel_rate, total_commission")
    .eq("venta_id", venta.id)
    .single();

  const { data: sessionCommissions } = await supabase
    .from("commission_records")
    .select("total_commission")
    .eq("session_id", activeSessionId);

  const accumulatedCommission = (sessionCommissions ?? []).reduce(
    (s: number, r: { total_commission: number }) => s + Number(r.total_commission),
    0,
  );

  const { data: rules } = await supabase
    .from("commission_rules")
    .select("rule_type, parameter")
    .eq("empresa_id", empresaId)
    .eq("active", true)
    .eq("rule_type", "volume_threshold")
    .order("priority", { ascending: true });

  const sessionTotal = await supabase
    .from("ventas")
    .select("total")
    .eq("cash_session_id", activeSessionId);

  const dayTotal = (sessionTotal.data ?? []).reduce((s: number, v: { total: number }) => s + v.total, 0);

  let nextThreshold: { threshold: number; multiplier: number } | null = null;
  if (rules) {
    for (const rule of rules) {
      const param = rule.parameter as Record<string, unknown> | null;
      const threshold = Number(param?.threshold ?? 0);
      const multiplier = Number(param?.multiplier ?? 1);
      if (dayTotal < threshold) {
        nextThreshold = { threshold, multiplier };
        break;
      }
    }
  }

  return c.json({
    data: venta,
    meta: {
      feria: feriaMeta,
      fid: fidMeta,
      accumulated_commission: accumulatedCommission,
      day_total: dayTotal,
      next_threshold: nextThreshold,
      commission: lastCommission
        ? {
            base: Number(lastCommission.base_commission),
            volume_multiplier: Number(lastCommission.volume_multiplier),
            loyalty_bonus: Number(lastCommission.loyalty_bonus),
            streak_bonus: Number(lastCommission.streak_bonus),
            tier_multiplier: Number(lastCommission.tier_multiplier),
            channel_rate: lastCommission.channel_rate ? Number(lastCommission.channel_rate) : null,
            total: Number(lastCommission.total_commission),
          }
        : null,
    },
  }, 201);
});

repVentasRoutes.get("/session/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, rep_id")
    .eq("id", sessionId)
    .single();

  if (!session || session.rep_id !== user.id) {
    return c.json({ code: "forbidden", message: "No tienes acceso a esta sesión" }, 403);
  }

  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id, total, metodo_pago, channel, created_at, items, rep_commission_total")
    .eq("cash_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: ventas ?? [] });
});

repVentasRoutes.get("/feria-context", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: contrato } = await supabase
    .from("participante_contrato")
    .select("id, tipo, comision_base_pct, score_confianza, bono_puntualidad_clp, estado")
    .eq("user_id", user.id)
    .eq("estado", "activo")
    .maybeSingle();

  if (!contrato) {
    return c.json({
      data: {
        active: false,
        contrato: null,
        evento: null,
        consignaciones: [],
      },
    });
  }

  const { data: evento } = await supabase
    .from("participante_evento")
    .select("id, nombre_evento, ubicacion, fecha_inicio, estado")
    .eq("contrato_id", contrato.id)
    .eq("estado", "en_curso")
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  let consignaciones: unknown[] = [];
  if (evento) {
    const { data: cons } = await supabase
      .from("participante_consignacion")
      .select("id, producto_id, cantidad_entregada, cantidad_vendida, cantidad_devuelta, productos(nombre)")
      .eq("evento_id", evento.id);
    consignaciones = (cons ?? []).map((row: Record<string, unknown>) => {
      const entregada = Number(row.cantidad_entregada ?? 0);
      const vendida = Number(row.cantidad_vendida ?? 0);
      const devuelta = Number(row.cantidad_devuelta ?? 0);
      return {
        ...row,
        pendiente: entregada - vendida - devuelta,
      };
    });
  }

  let whatsappTemplate: string | null = null;
  try {
    const { data: waTpl } = await fromLoose(supabase, "email_templates")
      .select("body_template, enabled")
      .eq("key", "pos_whatsapp_receipt")
      .maybeSingle();
    const row = waTpl as { body_template?: string | null; enabled?: boolean | null } | null;
    if (row && row.enabled !== false && typeof row.body_template === "string") {
      whatsappTemplate = row.body_template;
    }
  } catch {
    // Ignorar si tabla aún no tiene la clave
  }

  // Configuración de combos y upselling de feria gobernados desde Núcleo
  const defaultCombosConfig = [
    {
      id: 'trio_recoleccion',
      nombre: 'Pack Colección (3+ frascos)',
      min_units: 3,
      min_unique: 1,
      descuento_pct: 10,
      descripcion: 'Descuento especial del 10% por llevar 3 o más unidades de feria.',
    },
    {
      id: 'duo_bienestar',
      nombre: 'Dúo Bienestar de Feria',
      min_units: 2,
      min_unique: 2,
      descuento_pct: 5,
      descripcion: 'Descuento del 5% por combinar 2 variedades distintas.',
    },
  ];

  let combosConfig = defaultCombosConfig;
  try {
    const { data: cmsCombos } = await fromLoose(supabase, 'site_content')
      .select('content')
      .eq('key', 'pos_feria_combos')
      .maybeSingle();
    const parsed = cmsCombos as { content?: unknown } | null;
    if (parsed?.content && Array.isArray(parsed.content)) {
      combosConfig = parsed.content as typeof defaultCombosConfig;
    }
  } catch {
    // fallback al default
  }

  return c.json({
    data: {
      active: Boolean(evento),
      contrato,
      evento: evento ?? null,
      consignaciones,
      whatsapp_template: whatsappTemplate,
      combos_config: combosConfig,
    },
  });
});

repVentasRoutes.get("/commission-status", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");

  const { data: repProfile } = await supabase
    .from("rep_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!repProfile) {
    return c.json({ code: "not_rep", message: "No eres rep de ventas" }, 404);
  }

  const { data: activeSession } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, opening_cash")
    .eq("rep_id", user.id)
    .eq("session_status", "open")
    .maybeSingle();

  let todayCommissions = 0;
  let todaySales = 0;
  let todayRevenue = 0;

  if (activeSession) {
    const { data: commissions } = await supabase
      .from("commission_records")
      .select("total_commission")
      .eq("session_id", activeSession.id);

    todayCommissions = (commissions ?? []).reduce(
      (s: number, r: { total_commission: number }) => s + Number(r.total_commission),
      0,
    );

    const { data: sales } = await supabase
      .from("ventas")
      .select("total")
      .eq("cash_session_id", activeSession.id);

    todaySales = sales?.length ?? 0;
    todayRevenue = (sales ?? []).reduce((s: number, v: { total: number }) => s + v.total, 0);
  }

  const { data: rules } = await supabase
    .from("commission_rules")
    .select("rule_type, name, parameter")
    .eq("empresa_id", empresaId)
    .eq("active", true)
    .order("priority", { ascending: true });

  return c.json({
    data: {
      profile: repProfile,
      active_session: activeSession ?? null,
      today: {
        commissions: todayCommissions,
        sales_count: todaySales,
        revenue: todayRevenue,
      },
      rules: rules ?? [],
    },
  });
});

repVentasRoutes.get("/history", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const empresaId = c.get("empresaId");
  const range = c.req.query("range") || "week";

  const now = new Date();
  let fromDate: Date;
  if (range === "month") {
    fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  } else if (range === "quarter") {
    fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  } else {
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }

  const { data: sessions } = await supabase
    .from("cash_sessions")
    .select("id, opened_at, closed_at, opening_cash, closing_cash_counted, cash_difference, session_status")
    .eq("rep_id", user.id)
    .eq("empresa_id", empresaId)
    .gte("opened_at", fromDate.toISOString())
    .order("opened_at", { ascending: false });

  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id);

  const { data: commissions } = await supabase
    .from("commission_records")
      .select("id, session_id, venta_id, base_commission, volume_multiplier, loyalty_bonus, streak_bonus, tier_multiplier, channel_rate, total_commission, paid, created_at")
    .eq("rep_id", user.id)
    .in("session_id", sessionIds.length > 0 ? sessionIds : ["00000000-0000-0000-0000-000000000000"])
    .gte("created_at", fromDate.toISOString())
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("rep_profiles")
    .select("total_commissions_earned, total_commissions_paid, total_sales_lifetime, total_revenue_lifetime, clients_captured, current_streak_days, best_streak_days, commission_tier, notas")
    .eq("user_id", user.id)
    .single();

  let bankDetails: Record<string, unknown> | null = null;
  if (profile?.notas) {
    try {
      const parsed = JSON.parse(profile.notas);
      if (parsed && typeof parsed === "object" && parsed.bank_details) {
        bankDetails = parsed.bank_details as Record<string, unknown>;
      }
    } catch {
      // not json
    }
  }

  const totalEarned = (commissions ?? []).reduce((s: number, r: { total_commission: number }) => s + Number(r.total_commission), 0);
  const totalPending = (commissions ?? []).filter((r: { paid: boolean }) => !r.paid).reduce((s: number, r: { total_commission: number }) => s + Number(r.total_commission), 0);

  const dailyMap = new Map<string, { revenue: number; commissions: number; sales: number }>();
  for (const c of (commissions ?? [])) {
    const day = (c as { created_at: string }).created_at.slice(0, 10);
    const entry = dailyMap.get(day) || { revenue: 0, commissions: 0, sales: 0 };
    entry.commissions += Number((c as { total_commission: number }).total_commission);
    entry.sales += 1;
    dailyMap.set(day, entry);
  }

  return c.json({
    data: {
      profile: profile ? { ...profile, bank_details: bankDetails } : null,
      sessions: sessions ?? [],
      commissions: commissions ?? [],
      summary: {
        total_earned: totalEarned,
        total_pending: totalPending,
        session_count: sessions?.length ?? 0,
      },
      daily: Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date)),
    },
  });
});

repVentasRoutes.get("/bank-details", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data: rep } = await supabase
    .from("rep_profiles")
    .select("notas")
    .eq("user_id", user.id)
    .maybeSingle();

  let bankDetails: Record<string, unknown> | null = null;
  if (rep?.notas) {
    try {
      const parsed = JSON.parse(rep.notas);
      if (parsed && typeof parsed === "object" && parsed.bank_details) {
        bankDetails = parsed.bank_details as Record<string, unknown>;
      }
    } catch {
      // not json
    }
  }

  return c.json({ data: bankDetails });
});

repVentasRoutes.post("/bank-details", zValidator("json", BankDetailsSchema), async (c) => {
  const input = c.req.valid("json");
  const user = c.get("user");
  const admin = createAdminClient();

  const { data: current } = await admin
    .from("rep_profiles")
    .select("notas")
    .eq("user_id", user.id)
    .maybeSingle();

  let currentObj: Record<string, unknown> = {};
  if (current?.notas) {
    try {
      const p = JSON.parse(current.notas);
      if (p && typeof p === "object") currentObj = p;
    } catch {
      currentObj = { prev_notas: current.notas };
    }
  }

  currentObj.bank_details = input;
  currentObj.bank_updated_at = new Date().toISOString();

  const { error: upErr } = await admin
    .from("rep_profiles")
    .update({ notas: JSON.stringify(currentObj) })
    .eq("user_id", user.id);

  if (upErr) {
    return c.json({ code: "save_failed", message: upErr.message }, 500);
  }

  return c.json({ ok: true, data: input });
});

/** Contrato de prestación de servicios mercantiles del agente comercial. */
repVentasRoutes.get("/contrato", async (c) => {
  const admin = createAdminClient();
  const user = c.get("user");

  const { data: contrato, error } = await admin
    .from("participante_contrato")
    .select(
      "id, tipo, estado, comision_base_pct, bono_puntualidad_clp, documento_plantilla_url, documento_firmado_url, documento_firmado_at, documento_version, acepto_terminos_at, acepto_terminos_version, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({ data: contrato });
});

const ContratoAcceptSchema = z
  .object({
    version: z.string().min(1).default("2026-v1"),
    declaracion_segunda_categoria: z.boolean().refine((val) => val === true, {
      message: "Debe confirmar su condición de prestador independiente de 2da categoría",
    }),
  })
  .strict();

/** Aceptación electrónica de términos (Ley 19.799 Firma Electrónica / SII 2da Categoría). */
repVentasRoutes.post("/contrato/accept", zValidator("json", ContratoAcceptSchema), async (c) => {
  const admin = createAdminClient();
  const user = c.get("user");
  const { version } = c.req.valid("json");
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("participante_contrato")
    .select("id, documento_version, estado")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const targetVersion = version || existing?.documento_version || "2026-v1";

  if (existing) {
    const { data: updated, error: upErr } = await admin
      .from("participante_contrato")
      .update({
        acepto_terminos_at: now,
        acepto_terminos_version: targetVersion,
        estado: "activo",
        updated_at: now,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (upErr) {
      return c.json({ code: "update_failed", message: upErr.message }, 500);
    }
    return c.json({ ok: true, data: updated });
  }

  const { data: created, error: insErr } = await admin
    .from("participante_contrato")
    .insert({
      user_id: user.id,
      tipo: "feria",
      estado: "activo",
      acepto_terminos_at: now,
      acepto_terminos_version: targetVersion,
      comision_base_pct: 10.0,
    })
    .select()
    .single();

  if (insErr) {
    return c.json({ code: "insert_failed", message: insErr.message }, 500);
  }

  return c.json({ ok: true, data: created });
});

/** Adjuntar URL de contrato firmado subido por el agente comercial. */
repVentasRoutes.post(
  "/contrato/attach-signed",
  zValidator("json", z.object({ storage_path: z.string().min(5) }).strict()),
  async (c) => {
    const { storage_path } = c.req.valid("json");
    const admin = createAdminClient();
    const user = c.get("user");
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from("participante_contrato")
      .select("id, documento_version")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await admin
        .from("participante_contrato")
        .update({
          documento_firmado_url: storage_path,
          documento_firmado_at: now,
          updated_at: now,
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        return c.json({ code: "update_failed", message: error.message }, 500);
      }
      return c.json({ ok: true, data: updated });
    }

    const { data: created, error: insErr } = await admin
      .from("participante_contrato")
      .insert({
        user_id: user.id,
        tipo: "feria",
        estado: "borrador",
        documento_firmado_url: storage_path,
        documento_firmado_at: now,
        comision_base_pct: 10.0,
      })
      .select()
      .single();

    if (insErr) {
      return c.json({ code: "insert_failed", message: insErr.message }, 500);
    }

    return c.json({ ok: true, data: created });
  },
);

const BheDeclareSchema = z
  .object({
    folio_bhe: z.number().int().positive(),
    monto_bruto: z.number().positive(),
    periodo: z.string().optional(),
    notas: z.string().max(200).optional(),
  })
  .strict();

/** Declaración de Boleta de Honorarios Electrónica (BHE) emitida en sii.cl por el agente comercial. */
repVentasRoutes.post("/bhe-declare", zValidator("json", BheDeclareSchema), async (c) => {
  const input = c.req.valid("json");
  const user = c.get("user");
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: current } = await admin
    .from("rep_profiles")
    .select("notas")
    .eq("user_id", user.id)
    .maybeSingle();

  let currentObj: Record<string, unknown> = {};
  if (current?.notas) {
    try {
      const p = JSON.parse(current.notas);
      if (p && typeof p === "object") currentObj = p;
    } catch {
      currentObj = { prev_notas: current.notas };
    }
  }

  const prevDeclaraciones = Array.isArray(currentObj.declaraciones_bhe)
    ? (currentObj.declaraciones_bhe as Record<string, unknown>[])
    : [];
  const nuevaDeclaracion = {
    ...input,
    declarado_at: now,
    tasa_retencion: 0.1525,
    monto_liquido: Math.round(input.monto_bruto * (1 - 0.1525)),
    retencion_clp: Math.round(input.monto_bruto * 0.1525),
    estado: "declarada",
  };

  currentObj.declaraciones_bhe = [nuevaDeclaracion, ...prevDeclaraciones].slice(0, 12);
  currentObj.ultima_bhe_declarada = nuevaDeclaracion;

  const { error: upErr } = await admin
    .from("rep_profiles")
    .update({ notas: JSON.stringify(currentObj) })
    .eq("user_id", user.id);

  if (upErr) {
    return c.json({ code: "save_failed", message: upErr.message }, 500);
  }

  return c.json({ ok: true, data: nuevaDeclaracion });
});

const MermaSchema = z
  .object({
    producto_id: z.string().uuid(),
    cantidad: z.number().int().min(1),
    motivo: z.enum(["degustacion", "rotura_transporte", "defecto_empaque", "otro"]),
    evento_id: z.string().uuid().optional(),
    notas: z.string().max(250).optional(),
  })
  .strict();

/** Registro justificado de merma / degustación promocional ferial (Art. 8 letra d Ley de IVA). */
repVentasRoutes.post("/merma", zValidator("json", MermaSchema), async (c) => {
  const input = c.req.valid("json");
  const user = c.get("user");
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: producto } = await admin
    .from("productos")
    .select("id, nombre, stock")
    .eq("id", input.producto_id)
    .maybeSingle();

  if (!producto) {
    return c.json({ code: "product_not_found", message: "Producto no encontrado" }, 404);
  }

  const { data: eventoActivo } = await admin
    .from("participante_evento")
    .select("id, nombre_evento, contrato_id")
    .eq("estado", "en_curso")
    .order("fecha_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin.rpc("decrement_stock_force", {
    p_product_id: input.producto_id,
    p_qty: input.cantidad,
  });

  await admin.from("rep_ventas_capacitacion_logs").insert({
    producto_id: input.producto_id,
    producto_nombre: producto.nombre,
    user_id: user.id,
    accion: `merma_${input.motivo}`,
    detalle: {
      cantidad: input.cantidad,
      motivo: input.motivo,
      notas: input.notas ?? null,
      evento_id: input.evento_id ?? eventoActivo?.id ?? null,
      evento_nombre: eventoActivo?.nombre_evento ?? null,
      registrado_at: now,
      justificacion_tributaria:
        input.motivo === "degustacion"
          ? "Gasto de degustación promocional (Art. 31 LIR)"
          : "Merma fortuita justificada (Art. 8 letra d Ley de IVA)",
    },
  });

  return c.json({
    ok: true,
    data: {
      producto: producto.nombre,
      cantidad: input.cantidad,
      motivo: input.motivo,
      registrado_at: now,
    },
  });
});

/** Ventas de la sesión de caja abierta (para anular en feria). */
repVentasRoutes.get("/session-ventas", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const sessionId = c.req.query("cash_session_id");
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return c.json({ code: "invalid_session", message: "cash_session_id requerido" }, 400);
  }

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, session_status, rep_id")
    .eq("id", sessionId)
    .eq("rep_id", user.id)
    .maybeSingle();
  if (!session) {
    return c.json({ code: "session_not_found", message: "Sesión no encontrada" }, 404);
  }

  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id, total, metodo_pago, channel, estado, created_at, productos, rep_commission_total")
    .eq("cash_session_id", sessionId)
    .eq("vendedor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return c.json({ code: "query_failed", message: error.message }, 500);
  }

  return c.json({
    data: (ventas ?? []).map((v) => ({
      ...v,
      lines: extractVentaLines(v.productos),
    })),
  });
});

/**
 * Anula una venta POS del rep (misma sesión o < 24 h).
 * Restaura stock, revierte consignación feria si aplica, marca estado=anulada.
 * Las commission_records son inmutables: quedan como deuda de ajuste operativo.
 */
const ReciboSchema = z.object({
  venta_id: z.string().uuid().optional(),
  buy_order: z.string().min(1).max(120).optional(),
  canal: z.enum(["whatsapp", "email", "sms", "share", "copiado", "impreso"]),
}).refine((v) => v.venta_id || v.buy_order, { message: "venta_id o buy_order requerido" });

// POST /api/rep-ventas/ventas/recibo — marca comprobante compartido (métrica).
// Acepta id o buy_order (el POS offline sincroniza después con el mismo buy_order).
repVentasRoutes.post("/ventas/recibo", zValidator("json", ReciboSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const input = c.req.valid("json");

  let query = fromLoose(supabase, "ventas").select("id, vendedor_id, recibo_canal");
  query = input.venta_id ? query.eq("id", input.venta_id) : query.eq("buy_order", input.buy_order!);
  const { data: venta, error: vErr } = await query.maybeSingle();

  if (vErr || !venta) {
    return c.json({ code: "not_found", message: "Venta no encontrada (sincroniza primero si fue offline)" }, 404);
  }
  const row = venta as { id: string; vendedor_id: string | null; recibo_canal: string | null };
  const isAdmin = (user.app_metadata as { role?: string } | undefined)?.role === "admin";
  if (row.vendedor_id !== user.id && !isAdmin) {
    return c.json({ code: "forbidden", message: "Solo el vendedor puede marcar su comprobante" }, 403);
  }
  if (row.recibo_canal) {
    return c.json({ data: { id: row.id, recibo_canal: row.recibo_canal, deduped: true } });
  }

  const { error: uErr } = await fromLoose(supabase, "ventas")
    .update({ recibo_canal: input.canal, recibo_enviado_at: new Date().toISOString() })
    .eq("id", row.id);

  if (uErr) return c.json({ code: "update_failed", message: uErr.message }, 500);
  return c.json({ data: { id: row.id, recibo_canal: input.canal } });
});

repVentasRoutes.post("/ventas/:id/anular", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const ventaId = c.req.param("id");
  if (!/^[0-9a-f-]{36}$/i.test(ventaId)) {
    return c.json({ code: "invalid_id", message: "ID de venta inválido" }, 400);
  }

  const { data: venta, error: vErr } = await supabase
    .from("ventas")
    .select(
      "id, total, estado, productos, vendedor_id, cash_session_id, channel, participante_evento_id, created_at",
    )
    .eq("id", ventaId)
    .maybeSingle();

  if (vErr || !venta) {
    return c.json({ code: "not_found", message: "Venta no encontrada" }, 404);
  }
  if (venta.vendedor_id !== user.id) {
    return c.json({ code: "forbidden", message: "Solo el vendedor puede anular" }, 403);
  }
  if (venta.estado === "anulada") {
    return c.json({ code: "already_void", message: "La venta ya está anulada" }, 400);
  }

  const created = venta.created_at ? Date.parse(venta.created_at) : 0;
  const ageMs = Date.now() - created;
  const within24h = ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000;

  if (venta.cash_session_id) {
    const { data: sess } = await supabase
      .from("cash_sessions")
      .select("id, session_status, rep_id")
      .eq("id", venta.cash_session_id)
      .maybeSingle();
    const sessionOpen = sess?.session_status === "open" && sess.rep_id === user.id;
    if (!sessionOpen && !within24h) {
      return c.json(
        {
          code: "void_window_closed",
          message: "Solo se puede anular con sesión abierta o dentro de 24 h",
        },
        400,
      );
    }
  } else if (!within24h) {
    return c.json(
      { code: "void_window_closed", message: "Solo se puede anular dentro de 24 h" },
      400,
    );
  }

  const lines = extractVentaLines(venta.productos);
  if (lines.length === 0) {
    return c.json({ code: "no_lines", message: "La venta no tiene ítems anulables" }, 400);
  }

  // Restaurar stock
  for (const line of lines) {
    const qty = Math.max(0, Math.floor(Number(line.cantidad) || 0));
    if (!qty) continue;
    const { data: product } = await supabase
      .from("productos")
      .select("stock")
      .eq("id", line.producto_id)
      .maybeSingle();
    if (product?.stock != null) {
      await supabase
        .from("productos")
        .update({ stock: Number(product.stock) + qty })
        .eq("id", line.producto_id);
    }
  }

  // Revertir consignación feria
  if (venta.participante_evento_id && venta.channel === "feria") {
    const itemsJson = lines.map((l) => ({
      producto_id: l.producto_id,
      cantidad: l.cantidad,
    }));
    try {
      await rpcLoose(supabase, "revertir_consignacion_feria", {
        p_evento_id: venta.participante_evento_id,
        p_items: itemsJson,
      });
    } catch (err) {
      console.warn("[rep-ventas] revertir_consignacion_feria:", err);
    }
  }

  const { error: upErr } = await supabase
    .from("ventas")
    .update({ estado: "anulada" })
    .eq("id", ventaId);

  if (upErr) {
    return c.json({ code: "void_failed", message: upErr.message }, 500);
  }

  return c.json({
    data: {
      id: ventaId,
      estado: "anulada",
      restored_lines: lines.length,
      note: "Comisión original permanece en ledger (inmutable); ajustar pago de comisiones a mano si aplica.",
    },
  });
});

repVentasRoutes.get("/tier-progress", async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  const { data, error } = await supabase.rpc("tier_progress_rep", {
    p_rep_id: user.id,
  });

  if (error) {
    return c.json({ code: "tier_progress_failed", message: error.message }, 500);
  }

  return c.json({ data });
});

repVentasRoutes.get("/leaderboard", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const { data, error } = await supabase.rpc("weekly_leaderboard", {
    p_empresa_id: empresaId,
  });

  if (error) {
    return c.json({ code: "leaderboard_failed", message: error.message }, 500);
  }

  return c.json({ data: data ?? [] });
});

// Admin: pausar/reanudar feria
repVentasRoutes.post(
  "/admin/feria/:eventoId/pause",
  requireProfileRole("admin"),
  zValidator(
    "json",
    z.object({
      pausar_hasta: z.string().datetime().optional(), // si no se envía, pausa indefinida
    }),
  ),
  async (c) => {
    const eventoId = c.req.param("eventoId");
    const empresaId = c.get("empresaId");
    const { pausar_hasta } = c.req.valid("json");
    const supabase = c.get("supabase");

    // Zero-Trust: scoping por empresa SIEMPRE, sin importar RLS del client.
    const { error, count } = await supabase
      .from("eventos")
      .update({ pausada_hasta: pausar_hasta ?? null }, { count: "exact" })
      .eq("id", eventoId)
      .eq("empresa_id", empresaId!);

    if (error) {
      return c.json({ code: "pause_failed", message: error.message }, 500);
    }
    if (count === 0) {
      return c.json({ code: "not_found", message: "Evento no pertenece a la empresa" }, 404);
    }
    return c.json({ ok: true, pausada_hasta: pausar_hasta ?? null });
  },
);

repVentasRoutes.post(
  "/admin/feria/:eventoId/resume",
  requireProfileRole("admin"),
  async (c) => {
    const eventoId = c.req.param("eventoId");
    const empresaId = c.get("empresaId");
    const supabase = c.get("supabase");

    const { error, count } = await supabase
      .from("eventos")
      .update({ pausada_hasta: null }, { count: "exact" })
      .eq("id", eventoId)
      .eq("empresa_id", empresaId!);

    if (error) {
      return c.json({ code: "resume_failed", message: error.message }, 500);
    }
    if (count === 0) {
      return c.json({ code: "not_found", message: "Evento no pertenece a la empresa" }, 404);
    }
    return c.json({ ok: true });
  },
);

// Admin: actualizar meta de feria
repVentasRoutes.patch(
  "/admin/feria/:eventoId/meta",
  requireProfileRole("admin"),
  zValidator(
    "json",
    z.object({
      meta_ventas: z.number().int().min(0).optional(),
      meta_ingresos: z.number().int().min(0).optional(),
    }),
  ),
  async (c) => {
    const eventoId = c.req.param("eventoId");
    const empresaId = c.get("empresaId");
    const { meta_ventas, meta_ingresos } = c.req.valid("json");
    const supabase = c.get("supabase");

    const { error, count } = await supabase
      .from("eventos")
      .update({ meta: { meta_ventas, meta_ingresos } }, { count: "exact" })
      .eq("id", eventoId)
      .eq("empresa_id", empresaId!);

    if (error) {
      return c.json({ code: "meta_update_failed", message: error.message }, 500);
    }
    if (count === 0) {
      return c.json({ code: "not_found", message: "Evento no pertenece a la empresa" }, 404);
    }
    return c.json({ ok: true });
  },
);
