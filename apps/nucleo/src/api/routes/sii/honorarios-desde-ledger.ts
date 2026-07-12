import type { Context } from "hono";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";

const DesdeLedgerSchema = z.object({
  ledger_id: z.string().uuid(),
  fecha: z.string().min(1),
  tercero_rut: z.string().min(3),
  tercero_nombre: z.string().min(2),
  numero_bhe: z.string().optional(),
  tasa_retencion: z.number().min(0).max(1).optional(),
});

type HonorariosDesdeLedgerContext = Context<{ Variables: AppVariables }>;

/** Handler plano — evita límite de profundidad de tipos al montar sub-router Hono */
export async function postHonorarioDesdeLedger(c: HonorariosDesdeLedgerContext): Promise<Response> {
  if (c.get("profileRole") !== "admin") {
    return c.json({ code: "forbidden", message: "Rol insuficiente para esta operación" }, 403);
  }

  const empresaId = c.get("empresaId");
  const supabase = c.get("supabase");
  const parsed = DesdeLedgerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ code: "validation_error", message: parsed.error.message }, 400);
  }
  const body = parsed.data;

  const { data, error } = await supabase.rpc("preparar_honorario_desde_ledger", {
    p_ledger_id: body.ledger_id,
    p_empresa_id: empresaId,
    p_fecha: body.fecha,
    p_tercero_rut: body.tercero_rut,
    p_tercero_nombre: body.tercero_nombre,
    p_numero_bhe: body.numero_bhe ?? undefined,
    p_tasa_retencion: body.tasa_retencion ?? 0.1525,
  });

  if (error) {
    const status = error.message.includes("FORBIDDEN") ? 403 : 400;
    return c.json({ code: "honorario_bridge_failed", message: error.message }, status);
  }

  const bridge = data as { honorario_id?: string } | null;
  const honorarioId = bridge?.honorario_id;
  if (!honorarioId) {
    return c.json({ data }, 201);
  }

  const { data: honorario, error: fetchError } = await supabase
    .from("honorarios")
    .select("*, tercero:terceros(id, nombre, rut)")
    .eq("id", honorarioId)
    .single();

  if (fetchError) {
    return c.json({ data, bridge: data }, 201);
  }

  return c.json({ data: honorario, bridge: data }, 201);
}