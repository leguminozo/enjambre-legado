import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { authMiddleware, tenantMiddleware } from "@/api/lib/middleware";

/**
 * Comisiones operativas y costo de empaque (BOM) referencial por canal comercial:
 * - web: Flow / Transbank Webpay (~3.1% + $100 fijo) + 28% BOM
 * - feria: SumUp POS (~16.6% promedio operativo con stand/traslado) + 28% BOM
 * - club: Suscripciones recurrentes (~2.8% + $50 fijo) + 28% BOM
 * - b2b: Venta institucional sin comisión de pasarela (0%) + 35% BOM (packaging reforzado/pallets)
 */
export const MULTICHANNEL_RATES = {
  web: { comisionPct: 0.031, fija: 100, bomPct: 0.28 },
  feria: { comisionPct: 0.166, fija: 0, bomPct: 0.28 },
  club: { comisionPct: 0.028, fija: 50, bomPct: 0.28 },
  b2b: { comisionPct: 0.0, fija: 0, bomPct: 0.35 },
} as const;

export const analisisMulticanalRoutes = new Hono<{
  Variables: AppVariables;
}>();

analisisMulticanalRoutes.use("*", authMiddleware, tenantMiddleware);

interface ChannelMetrics {
  canal: string;
  nombre: string;
  descripcion: string;
  transacciones: number;
  ingresoBruto: number;
  ticketPromedio: number;
  comisionEstimada: number;
  comisionPorcentaje: number;
  ingresoNeto: number;
  costoMateriaPrimaEstimado: number;
  margenNetoEstimado: number;
  margenNetoPorcentaje: number;
  topProductos: { nombre: string; unidades: number; total: number }[];
  clientesUnicos: number;
}

interface MonthlyChannelPoint {
  mes: string;
  web: number;
  feria: number;
  club: number;
  b2b: number;
  total: number;
}

analisisMulticanalRoutes.get("/resumen", async (c) => {
  const supabase = c.get("supabase");

  // Consultar ventas pagadas / confirmadas (acotado a 2000 registros para proteger presupuesto de plataforma)
  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id, origen, channel, total, productos, metodo_pago, created_at, cliente_id, buyer_email")
    .neq("estado", "cancelled")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("[analisis-multicanal] Error en resumen:", error);
    return c.json({ code: "query_failed", message: "Error al consultar resumen de ventas" }, 500);
  }

  const allVentas = ventas ?? [];

  // Clasificadores de canal
  const classifyVenta = (v: typeof allVentas[number]): "web" | "feria" | "club" | "b2b" => {
    const o = (v.origen ?? "").toLowerCase();
    const ch = (v.channel ?? "").toLowerCase();
    const m = (v.metodo_pago ?? "").toLowerCase();
    
    if (o === "b2b" || o === "corporativo" || ch === "b2b" || ch === "corporativo") return "b2b";
    if (
      o === "club" ||
      ch === "club" ||
      (v.productos && Array.isArray(v.productos) && v.productos.some((it: unknown) => {
        const item = it as Record<string, unknown>;
        return String(item.nombre ?? "").toLowerCase().includes("club") || String(item.nombre ?? "").toLowerCase().includes("reposición");
      }))
    ) {
      return "club";
    }
    if (o === "pos" || o === "feria" || ch === "feria" || ch === "pos" || m === "sumup" || m === "efectivo") return "feria";
    return "web";
  };

  const channelRates = MULTICHANNEL_RATES;

  const initChannel = (canal: string, nombre: string, descripcion: string): ChannelMetrics => ({
    canal,
    nombre,
    descripcion,
    transacciones: 0,
    ingresoBruto: 0,
    ticketPromedio: 0,
    comisionEstimada: 0,
    comisionPorcentaje: 0,
    ingresoNeto: 0,
    costoMateriaPrimaEstimado: 0,
    margenNetoEstimado: 0,
    margenNetoPorcentaje: 0,
    topProductos: [],
    clientesUnicos: 0,
  });

  const channels: Record<"web" | "feria" | "club" | "b2b", ChannelMetrics> = {
    web: initChannel("web", "Tienda Digital D2C", "Venta online directa con pasarela Flow / Transbank"),
    feria: initChannel("feria", "POS Feria Chiloé", "Venta presencial en ferias y eventos con POS SumUp y efectivo"),
    club: initChannel("club", "Club Legado (Suscripción)", "Reposición programada mensual y trimestral de guardianes"),
    b2b: initChannel("b2b", "Canal Mayorista & Gourmet", "Hotelería boutique, alta cocina y emporios con DTE 33"),
  };

  const productCounters: Record<"web" | "feria" | "club" | "b2b", Record<string, { unidades: number; total: number }>> = {
    web: {},
    feria: {},
    club: {},
    b2b: {},
  };

  const clientSets: Record<"web" | "feria" | "club" | "b2b", Set<string>> = {
    web: new Set(),
    feria: new Set(),
    club: new Set(),
    b2b: new Set(),
  };

  // Agrupación mensual
  const monthlyBuckets: Record<string, { web: number; feria: number; club: number; b2b: number }> = {};

  for (const v of allVentas) {
    const ch = classifyVenta(v);
    const monto = Number(v.total ?? 0);
    const metrics = channels[ch];

    metrics.transacciones += 1;
    metrics.ingresoBruto += monto;

    // Cliente único
    const clientId = v.cliente_id || v.buyer_email;
    if (clientId) {
      clientSets[ch].add(String(clientId));
    }

    // Mes YYYY-MM
    const dateStr = v.created_at ? v.created_at.slice(0, 7) : new Date().toISOString().slice(0, 7);
    if (!monthlyBuckets[dateStr]) {
      monthlyBuckets[dateStr] = { web: 0, feria: 0, club: 0, b2b: 0 };
    }
    monthlyBuckets[dateStr][ch] += monto;

    // Productos / Items
    if (v.productos && Array.isArray(v.productos)) {
      for (const rawItem of v.productos) {
        const item = rawItem as Record<string, unknown>;
        const name = String(item.nombre || item.name || "Miel Nativa de Chiloé");
        const qty = Number(item.cantidad || item.qty || 1);
        const sub = Number(item.precio_unitario || item.price || 0) * qty;

        if (!productCounters[ch][name]) {
          productCounters[ch][name] = { unidades: 0, total: 0 };
        }
        productCounters[ch][name].unidades += qty;
        productCounters[ch][name].total += sub > 0 ? sub : monto;
      }
    }
  }

  // Calcular métricas derivadas por canal
  for (const key of ["web", "feria", "club", "b2b"] as const) {
    const m = channels[key];
    const rate = channelRates[key];

    if (m.transacciones > 0) {
      m.ticketPromedio = Math.round(m.ingresoBruto / m.transacciones);
      m.comisionEstimada = Math.round(m.ingresoBruto * rate.comisionPct + m.transacciones * rate.fija);
      m.comisionPorcentaje = Number((rate.comisionPct * 100).toFixed(1));
      m.costoMateriaPrimaEstimado = Math.round(m.ingresoBruto * rate.bomPct);
      m.ingresoNeto = m.ingresoBruto - m.comisionEstimada;
      m.margenNetoEstimado = m.ingresoNeto - m.costoMateriaPrimaEstimado;
      m.margenNetoPorcentaje = m.ingresoBruto > 0 ? Number(((m.margenNetoEstimado / m.ingresoBruto) * 100).toFixed(1)) : 0;
      m.clientesUnicos = clientSets[key].size;

      // Top 3 productos
      m.topProductos = Object.entries(productCounters[key])
        .map(([nombre, stat]) => ({ nombre, unidades: stat.unidades, total: stat.total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
    }
  }

  // Ordenar serie mensual
  const sortedMonths = Object.keys(monthlyBuckets).sort();
  const serieMensual: MonthlyChannelPoint[] = sortedMonths.slice(-6).map((mes) => {
    const b = monthlyBuckets[mes];
    return {
      mes,
      web: b.web,
      feria: b.feria,
      club: b.club,
      b2b: b.b2b,
      total: b.web + b.feria + b.club + b.b2b,
    };
  });

  const ingresoTotal = Object.values(channels).reduce((acc, c) => acc + c.ingresoBruto, 0);
  const transaccionesTotales = Object.values(channels).reduce((acc, c) => acc + c.transacciones, 0);
  const comisionesTotales = Object.values(channels).reduce((acc, c) => acc + c.comisionEstimada, 0);
  const margenNetoTotal = Object.values(channels).reduce((acc, c) => acc + c.margenNetoEstimado, 0);
  const margenPromedioPonderado = ingresoTotal > 0 ? Number(((margenNetoTotal / ingresoTotal) * 100).toFixed(1)) : 0;

  return c.json({
    data: {
      global: {
        ingresoTotal,
        transaccionesTotales,
        comisionesTotales,
        margenNetoTotal,
        margenPromedioPonderado,
        ticketPromedioPonderado: transaccionesTotales > 0 ? Math.round(ingresoTotal / transaccionesTotales) : 0,
      },
      canales: Object.values(channels),
      serieMensual,
    },
  });
});

interface CohorteRow {
  cohorte: string;
  clientes: number;
  rep30: number;
  rep60: number;
  rep90: number;
}

interface GeoRow {
  ambito: string;
  ventas: number;
  ingreso: number;
}

// GET /api/analisis-multicanal/cruce-avanzado — cohortes de retención +
// geografía de demanda en un solo escaneo (admin, fail-soft por sección).
analisisMulticanalRoutes.get("/cruce-avanzado", async (c) => {
  const supabase = c.get("supabase");

  const { data: ventas, error } = await supabase
    .from("ventas")
    .select("id, cliente_id, buyer_email, user_id, total, created_at, direccion_envio, origen, channel")
    .neq("estado", "cancelled")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("[analisis-multicanal] Error en cruce avanzado:", error);
    return c.json({ code: "query_failed", message: "Error al consultar métricas avanzadas" }, 500);
  }

  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // ── Cohortes: mes de primera compra → recompra a 30/60/90 días ──
  const comprasPorCliente = new Map<string, number[]>();
  for (const v of ventas ?? []) {
    const id = v.cliente_id || v.buyer_email || v.user_id;
    if (!id || !v.created_at) continue;
    const key = String(id);
    const t = new Date(v.created_at).getTime();
    if (isNaN(t)) continue;
    if (!comprasPorCliente.has(key)) comprasPorCliente.set(key, []);
    comprasPorCliente.get(key)!.push(t);
  }

  const cohortesMap = new Map<string, { clientes: Set<string>; rep30: number; rep60: number; rep90: number }>();
  for (const [cliente, tiempos] of comprasPorCliente) {
    tiempos.sort((a, b) => a - b);
    const primera = tiempos[0]!;
    // Solo cohortes de los últimos 12 meses con ventana de observación.
    if (now - primera > 365 * DAY) continue;
    const mes = new Date(primera).toISOString().slice(0, 7);
    if (!cohortesMap.has(mes)) {
      cohortesMap.set(mes, { clientes: new Set(), rep30: 0, rep60: 0, rep90: 0 });
    }
    const cohorte = cohortesMap.get(mes)!;
    cohorte.clientes.add(cliente);
    if (tiempos.some((t) => t > primera && t - primera <= 30 * DAY)) cohorte.rep30 += 1;
    if (tiempos.some((t) => t > primera && t - primera <= 60 * DAY)) cohorte.rep60 += 1;
    if (tiempos.some((t) => t > primera && t - primera <= 90 * DAY)) cohorte.rep90 += 1;
  }

  const cohortes: CohorteRow[] = [...cohortesMap.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 6)
    .map(([cohorte, v]) => ({ cohorte, clientes: v.clientes.size, rep30: v.rep30, rep60: v.rep60, rep90: v.rep90 }));

  // ── Geografía: web por región/comuna de envío; feria como punto agregado ──
  const regiones = new Map<string, GeoRow>();
  const comunas = new Map<string, GeoRow>();
  const bump = (map: Map<string, GeoRow>, ambito: string, total: number) => {
    const row = map.get(ambito) ?? { ambito, ventas: 0, ingreso: 0 };
    row.ventas += 1;
    row.ingreso += total;
    map.set(ambito, row);
  };

  for (const v of ventas ?? []) {
    const total = Number(v.total ?? 0);
    const dir = (v.direccion_envio ?? {}) as { region?: unknown; comuna?: unknown };
    const region = typeof dir.region === 'string' && dir.region ? dir.region : null;
    const comuna = typeof dir.comuna === 'string' && dir.comuna ? dir.comuna : null;
    const o = String(v.origen ?? '').toLowerCase();
    const ch = String(v.channel ?? '').toLowerCase();
    const esFeria = o === 'pos' || o === 'feria' || ch === 'feria' || ch === 'pos';

    if (esFeria && !region) {
      bump(regiones, 'Feria presencial', total);
      bump(comunas, 'Feria presencial', total);
    } else if (region) {
      bump(regiones, region, total);
      bump(comunas, comuna ?? 'Sin comuna', total);
    } else {
      bump(regiones, 'Sin región registrada', total);
    }
  }

  const top = (map: Map<string, GeoRow>) =>
    [...map.values()].sort((a, b) => b.ingreso - a.ingreso).slice(0, 8);

  return c.json({
    data: { cohortes, regiones: top(regiones), comunas: top(comunas) },
  });
});
