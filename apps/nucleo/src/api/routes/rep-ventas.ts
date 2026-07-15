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
import { fromLoose } from "@/api/lib/supabase-loose";
import { registerDeliveredQrCodes } from "@/lib/sale-qr";

const QuickSaleSchema = z.object({
  cash_session_id: z.string().uuid(),
  producto_id: z.string().uuid(),
  cantidad: z.number().int().min(1).default(1),
  metodo_pago: z.enum(["efectivo", "transferencia", "tarjeta", "pos_terminal", "mixto"]),
  channel: z.enum(["feria", "delivery", "local", "corporativo", "referido"]).optional(),
  cliente_id: z.string().uuid().optional(),
  is_new_client: z.boolean().default(true),
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
});

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
      .select("id, total, metodo_pago, channel, created_at, rep_commission_total")
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

  const { data: session } = await supabase
    .from("cash_sessions")
    .select("id, session_status")
    .eq("id", input.cash_session_id)
    .eq("rep_id", user.id)
    .single();

  if (!session || session.session_status !== "open") {
    return c.json({ code: "no_open_session", message: "No hay sesión de caja abierta" }, 400);
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
      items.push({
        producto_id: product.id,
        nombre: product.nombre ?? line.nombre,
        cantidad: line.cantidad,
        precio_unitario: product.precio ?? 0,
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

    items = [
      {
        producto_id: producto.id,
        nombre: producto.nombre ?? "",
        cantidad: input.cantidad,
        precio_unitario: producto.precio ?? 0,
        qr_codes: input.qr_codes ?? [],
      },
    ];
    total = (producto.precio ?? 0) * input.cantidad;
  }

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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error validando consignación feria";
    return c.json({ code: "feria_validation_failed", message }, 500);
  }

  // 0. Prevención de Ventas Ilegales: Bloquear si quedan < 10 folios de boleta (tipo 39)
  if (empresaId) {
    const { data: cafData, error: cafError } = await supabase
      .from('sii_caf')
      .select('folio_hasta, folio_actual')
      .eq('empresa_id', empresaId)
      .eq('tipo_dte', 39) // Boleta Electrónica
      .eq('activo', true)
      .maybeSingle();

    if (!cafError && cafData) {
      const foliosDisponibles = cafData.folio_hasta - cafData.folio_actual;
      if (foliosDisponibles < 10) {
        return c.json({ 
          code: "folios_exhausted", 
          message: 'El sistema de POS se encuentra en mantenimiento (código: folios). Por favor pide más boletas.' 
        }, 503);
      }
    }
  }

  // 1. Descontar stock de productos y obtener hash de trazabilidad
  const enrichedItems = [];
  const decremented: { productId: string; quantity: number }[] = [];
  for (const item of items) {
    const { data: stockData, error: stockErr } = await supabase.rpc("decrement_stock_force", {
      p_id: item.producto_id,
      p_qty: item.cantidad,
    });

    if (stockErr || !stockData || (stockData as unknown[]).length === 0) {
      for (const d of decremented) {
        const { data: product } = await supabase.from("productos").select("stock").eq("id", d.productId).maybeSingle();
        if (product?.stock != null) {
          await supabase.from("productos").update({ stock: product.stock + d.quantity }).eq("id", d.productId);
        }
      }
      return c.json({ code: "stock_insufficient", message: "Stock insuficiente en almacén" }, 409);
    }

    decremented.push({ productId: item.producto_id, quantity: item.cantidad });

    const dataAny = stockData as Array<{ traceability_hash?: string; lote_id?: string; stock?: number }>;
    const hash = dataAny[0]?.traceability_hash ?? null;
    const lote_id = dataAny[0]?.lote_id ?? null;
    const currentStock = dataAny[0]?.stock ?? 0;

    if (currentStock < 0) {
      console.warn(`[SyncEngine] Sobregiro de inventario en POS offline: producto ${item.producto_id} quedó con stock ${currentStock}.`);
    }

    enrichedItems.push({
      ...item,
      traceability_hash: hash,
      lote_id: lote_id,
    });
  }

  // 2. Crear venta — typegen exige `productos` (Json) y a veces `id`; runtime acepta omitir id
  const { data: venta, error: ventaError } = await fromLoose(supabase, "ventas")
    .insert({
      vendedor_id: user.id,
      empresa_id: empresaId,
      cash_session_id: input.cash_session_id,
      total,
      productos: enrichedItems as Json,
      metodo_pago: input.metodo_pago,
      channel,
      cliente_id: input.cliente_id ?? null,
      is_new_client: input.is_new_client,
      estado: "completada",
      origen: channel === "feria" || channel === "local" ? channel : "feria",
      buy_order: posBuyOrder,
      sumup_checkout_id: input.sumup_checkout_id ?? null,
      sumup_transaction_id: input.sumup_transaction_id ?? null,
    })
    .select("id, total, metodo_pago, channel, created_at, rep_commission_total")
    .single();

  if (ventaError) {
    for (const d of decremented) {
      const { data: product } = await supabase.from("productos").select("stock").eq("id", d.productId).maybeSingle();
      if (product?.stock != null) {
        await supabase.from("productos").update({ stock: product.stock + d.quantity }).eq("id", d.productId);
      }
    }
    return c.json({ code: "venta_create_failed", message: ventaError.message }, 400);
  }

  const ventaId = venta.id as string;
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

  let feriaMeta: Record<string, unknown> | null = null;
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
    for (const d of decremented) {
      const { data: product } = await supabase.from("productos").select("stock").eq("id", d.productId).maybeSingle();
      if (product?.stock != null) {
        await supabase.from("productos").update({ stock: product.stock + d.quantity }).eq("id", d.productId);
      }
    }
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
    .eq("session_id", input.cash_session_id);

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
    .eq("cash_session_id", input.cash_session_id);

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

  return c.json({
    data: {
      active: Boolean(evento),
      contrato,
      evento: evento ?? null,
      consignaciones,
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
    .select("total_commissions_earned, total_commissions_paid, total_sales_lifetime, total_revenue_lifetime, clients_captured, current_streak_days, best_streak_days, commission_tier")
    .eq("user_id", user.id)
    .single();

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
      profile: profile ?? null,
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
