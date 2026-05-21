import type { AppVariables } from "../../types/hono";
import { Hono } from "hono";

export const conciliacionRouter = new Hono<{ Variables: AppVariables }>();

conciliacionRouter.get("/pendientes", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");

  const [txnsRes, ventasRes] = await Promise.all([
    supabase
      .from("sumup_transacciones")
      .select("id, sumup_id, fecha, monto, moneda, estado, producto, conciliado")
      .eq("empresa_id", empresaId)
      .eq("conciliado", false)
      .eq("estado", "successful")
      .order("fecha", { ascending: false })
      .limit(200),
    supabase
      .from("ventas")
      .select("id, total, fecha, estado, conciliado")
      .eq("empresa_id", empresaId)
      .eq("estado", "completada")
      .eq("conciliado", false)
      .order("fecha", { ascending: false })
      .limit(200),
  ]);

  const txns = txnsRes.data ?? [];
  const ventas = ventasRes.data ?? [];

  const sugerencias: Array<{
    transaccion: typeof txns[number];
    venta: typeof ventas[number];
    score: number;
    detalles: string[];
  }> = [];

  for (const txn of txns) {
    for (const venta of ventas) {
      const detalles: string[] = [];
      let score = 0;

      const montoTxn = Number(txn.monto);
      const montoVenta = Number(venta.total);
      const diffMonto = Math.abs(montoTxn - montoVenta);

      if (diffMonto === 0) {
        score += 50;
        detalles.push("Monto exacto");
      } else if (diffMonto / Math.max(montoTxn, montoVenta) < 0.02) {
        score += 30;
        detalles.push("Monto similar (±2%)");
      }

      const fechaTxn = new Date(txn.fecha);
      const fechaVenta = new Date(venta.fecha as string);
      const diffDays = Math.abs(fechaTxn.getTime() - fechaVenta.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays === 0) {
        score += 30;
        detalles.push("Misma fecha");
      } else if (diffDays <= 1) {
        score += 20;
        detalles.push("Fecha ±1 día");
      } else if (diffDays <= 3) {
        score += 10;
        detalles.push("Fecha ±3 días");
      }

      if (score >= 50) {
        sugerencias.push({ transaccion: txn, venta, score, detalles });
      }
    }
  }

  sugerencias.sort((a, b) => b.score - a.score);

  return c.json({
    data: sugerencias,
    meta: {
      transacciones_pendientes: txns.length,
      ventas_pendientes: ventas.length,
    },
  });
});

conciliacionRouter.post("/conciliar", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const userId = c.get("user").id;

  const body = await c.req.json<{
    transaccion_id: string;
    venta_id: string;
    tipo?: "auto" | "manual";
  }>();

  if (!body.transaccion_id || !body.venta_id) {
    return c.json({ code: "missing_ids", message: "transaccion_id y venta_id son requeridos" }, 400);
  }

  const { data: txn } = await supabase
    .from("sumup_transacciones")
    .select("id, monto, empresa_id")
    .eq("id", body.transaccion_id)
    .eq("empresa_id", empresaId)
    .single();

  if (!txn) {
    return c.json({ code: "txn_not_found", message: "Transaccion no encontrada" }, 404);
  }

  const { data: venta } = await supabase
    .from("ventas")
    .select("id, total, empresa_id")
    .eq("id", body.venta_id)
    .eq("empresa_id", empresaId)
    .single();

  if (!venta) {
    return c.json({ code: "venta_not_found", message: "Venta no encontrada" }, 404);
  }

  const montoTxn = Math.abs(Number(txn.monto));
  const montoVenta = Number(venta.total);
  const diferencia = Math.abs(montoTxn - montoVenta);

  const { data, error } = await supabase
    .from("conciliaciones")
    .insert({
      empresa_id: empresaId,
      venta_id: body.venta_id,
      tipo: body.tipo ?? "manual",
      monto_movimiento: montoTxn,
      monto_documento: montoVenta,
      diferencia,
      conciliado_por: userId,
    })
    .select("*")
    .single();

  if (error) {
    return c.json({ code: "conciliacion_failed", message: error.message }, 400);
  }

  await Promise.all([
    supabase
      .from("sumup_transacciones")
      .update({ conciliado: true, venta_id: body.venta_id })
      .eq("id", body.transaccion_id),
    supabase
      .from("ventas")
      .update({ conciliado: true })
      .eq("id", body.venta_id),
  ]);

  return c.json({ data }, 201);
});

conciliacionRouter.post("/desconciliar/:id", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const conciliacionId = c.req.param("id");

  const { data: conciliacion } = await supabase
    .from("conciliaciones")
    .select("id, venta_id")
    .eq("id", conciliacionId)
    .eq("empresa_id", empresaId)
    .single();

  if (!conciliacion) {
    return c.json({ code: "not_found", message: "Conciliacion no encontrada" }, 404);
  }

  const { error } = await supabase
    .from("conciliaciones")
    .update({ estado: "desconciliada" })
    .eq("id", conciliacionId);

  if (error) {
    return c.json({ code: "desconciliar_failed", message: error.message }, 500);
  }

  const ventaId = (conciliacion as Record<string, unknown>).venta_id as string | null;
  if (ventaId) {
    await supabase
      .from("ventas")
      .update({ conciliado: false })
      .eq("id", ventaId);
  }

  return c.json({ success: true });
});

conciliacionRouter.post("/auto-conciliar", async (c) => {
  const supabase = c.get("supabase");
  const empresaId = c.get("empresaId");
  const userId = c.get("user").id;
  const minScore = Number(c.req.query("min_score") ?? 70);

  const [txnsRes, ventasRes] = await Promise.all([
    supabase
      .from("sumup_transacciones")
      .select("id, sumup_id, fecha, monto, conciliado")
      .eq("empresa_id", empresaId)
      .eq("conciliado", false)
      .eq("estado", "successful"),
    supabase
      .from("ventas")
      .select("id, total, fecha, estado, conciliado")
      .eq("empresa_id", empresaId)
      .eq("estado", "completada")
      .eq("conciliado", false),
  ]);

  const txns = txnsRes.data ?? [];
  const ventas = ventasRes.data ?? [];
  const matchedVentaIds = new Set<string>();
  let conciliadas = 0;

  for (const txn of txns) {
    if (matchedVentaIds.size >= ventas.length) break;

    let bestVenta: typeof ventas[number] | null = null;
    let bestScore = 0;

    for (const venta of ventas) {
      if (matchedVentaIds.has(venta.id)) continue;

      let score = 0;
      const diffMonto = Math.abs(Number(txn.monto) - Number(venta.total));
      if (diffMonto === 0) score += 50;
      else if (diffMonto / Math.max(Number(txn.monto), Number(venta.total)) < 0.02) score += 30;

      const diffDays = Math.abs(
        new Date(txn.fecha).getTime() - new Date(venta.fecha as string).getTime()
      ) / (1000 * 60 * 60 * 24);
      if (diffDays === 0) score += 30;
      else if (diffDays <= 1) score += 20;
      else if (diffDays <= 3) score += 10;

      if (score > bestScore) {
        bestScore = score;
        bestVenta = venta;
      }
    }

    if (bestVenta && bestScore >= minScore) {
      const { error } = await supabase
        .from("conciliaciones")
        .insert({
          empresa_id: empresaId,
          venta_id: bestVenta.id,
          tipo: "auto",
          monto_movimiento: Math.abs(Number(txn.monto)),
          monto_documento: Number(bestVenta.total),
          diferencia: Math.abs(Number(txn.monto) - Number(bestVenta.total)),
          conciliado_por: userId,
        });

      if (!error) {
        await Promise.all([
          supabase
            .from("sumup_transacciones")
            .update({ conciliado: true, venta_id: bestVenta.id })
            .eq("id", txn.id),
          supabase
            .from("ventas")
            .update({ conciliado: true })
            .eq("id", bestVenta.id),
        ]);
        matchedVentaIds.add(bestVenta.id);
        conciliadas++;
      }
    }
  }

  return c.json({
    data: {
      conciliadas,
      transacciones_revisadas: txns.length,
      ventas_disponibles: ventas.length,
    },
  });
});
