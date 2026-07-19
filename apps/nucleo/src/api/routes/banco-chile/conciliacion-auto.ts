import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppVariables } from "@/api/lib/middleware";
import { createClient } from "@supabase/supabase-js";

// Esquemas de validación
// empresa_id optional: always resolve from tenant (config-en-UI / POS never send it)
const EjecutarConciliacionSchema = z.object({
  empresa_id: z.string().uuid().optional(),
  limite: z.number().int().positive().max(100).optional().default(50),
});

const AceptarPropuestaSchema = z.object({
  propuesta_id: z.string().uuid().optional(),
  tipo_entidad: z.enum(['venta', 'gasto']),
  entidad_id: z.string().uuid(),
  movimiento_id: z.string().uuid(),
  concepto: z.string().optional(),
  confianza: z.number().min(0).max(100).optional(),
});

const RechazarPropuestaSchema = z.object({
  propuesta_id: z.string().uuid().optional(),
  motivo: z.string().optional(),
});

const AutoAceptarSchema = z.object({
  empresa_id: z.string().uuid().optional(),
  umbral_confianza: z.number().min(80).max(100).optional().default(90),
  limite: z.number().int().positive().max(100).optional().default(50),
});

const ReglaConciliacionSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipo: z.enum(['venta', 'gasto', 'ambos']),
  campo_primario: z.enum(['monto', 'rut', 'concepto', 'referencia']),
  operador: z.enum(['igual', 'mayor_que', 'menor_que', 'entre', 'contiene', 'regex']),
  valor_primario: z.string().optional(),
  campo_secundario: z.enum(['fecha', 'monto', 'rut', 'concepto', 'referencia']).optional(),
  operador_secundario: z.enum(['igual', 'mayor_que', 'menor_que', 'entre', 'contiene', 'regex']).optional(),
  valor_secundario: z.string().optional(),
  valor_secundario_2: z.string().optional(),
  activo: z.boolean().optional().default(true),
  prioridad: z.number().int().min(0).max(100).optional().default(0),
});

export const conciliacionAutoRoutes = new Hono<{ Variables: AppVariables }>();

/** Tenant-bound empresa: never trust body override to another tenant. */
function resolveTenantEmpresaId(
  c: { get: (k: "empresaId") => string },
  bodyEmpresaId?: string,
): { ok: true; empresaId: string } | { ok: false; message: string } {
  const tenantId = c.get("empresaId");
  if (bodyEmpresaId && bodyEmpresaId !== tenantId) {
    return { ok: false, message: "empresa_id no coincide con el tenant de sesión" };
  }
  return { ok: true, empresaId: tenantId };
}

/**
 * Ejecutar conciliación automática para una empresa
 */
conciliacionAutoRoutes.post(
  "/ejecutar",
  zValidator("json", EjecutarConciliacionSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const resolved = resolveTenantEmpresaId(c, input.empresa_id);
      if (!resolved.ok) {
        return c.json({ code: "empresa_mismatch", message: resolved.message }, 403);
      }
      const empresaId = resolved.empresaId;
      const supabase = c.get("supabase");
      const limite = input.limite ?? 50;

      // Ejecutar la función de conciliación automática
      const { data: propuestas, error } = await supabase
        .rpc('aplicar_reglas_conciliacion', { p_empresa_id: empresaId })
        .limit(limite);

      if (error) {
        return c.json({ code: "ejecucion_fallida", message: error.message }, 500);
      }

      const list = Array.isArray(propuestas) ? propuestas.slice(0, limite) : [];

      // Enriquecer las propuestas con información de la entidad
      const propuestasEnriquecidas = [];
      for (const propuesta of list) {
        let entidadInfo = null;
        let tipoEntidad = propuesta.tipo_entidad;

        if (tipoEntidad === 'venta' && propuesta.entidad_id) {
          // Prefer facturas_emitidas; fallback ventas (checkout web / POS)
          const { data: facturaData } = await supabase
            .from("facturas_emitidas")
            .select("id, numero, fecha_emision, monto_total, estado")
            .eq("id", propuesta.entidad_id)
            .maybeSingle();
          if (facturaData) {
            entidadInfo = facturaData;
          } else {
            const { data: ventaData } = await supabase
              .from("ventas")
              .select("id, total, estado, created_at, buy_order")
              .eq("id", propuesta.entidad_id)
              .maybeSingle();
            if (ventaData) {
              entidadInfo = {
                id: ventaData.id,
                numero: ventaData.buy_order ?? ventaData.id.slice(0, 8),
                fecha_emision: ventaData.created_at,
                monto_total: ventaData.total,
                estado: ventaData.estado,
              };
            }
          }
        } else if (tipoEntidad === 'gasto' && propuesta.entidad_id) {
          const { data: gastoData } = await supabase
            .from("gastos")
            .select("id, fecha, monto_total, estado, categoria")
            .eq("id", propuesta.entidad_id)
            .maybeSingle();
          entidadInfo = gastoData;
        }

        // Obtener información del movimiento
        const { data: movimientoData } = await supabase
          .from("banco_chile_movimientos")
          .select("id, fecha_contable, monto, descripcion, cuenta_id, numero_operacion")
          .eq("id", propuesta.movimiento_id)
          .single();

        propuestasEnriquecidas.push({
          ...propuesta,
          movimiento: movimientoData,
          entidad: entidadInfo,
        });
      }

      return c.json({
        success: true,
        empresa_id: empresaId,
        total_propuestas: propuestasEnriquecidas.length,
        propuestas: propuestasEnriquecidas,
      });

    } catch (error) {
      console.error("[Conciliación Auto Ejecutar] Error:", error);
      return c.json({ 
        code: "ejecucion_error", 
        message: error instanceof Error ? error.message : "Error inesperado al ejecutar conciliación" 
      }, 500);
    }
  }
);

/**
 * Aceptar una propuesta de conciliación
 */
conciliacionAutoRoutes.post(
  "/aceptar",
  zValidator("json", AceptarPropuestaSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      // Verificar que la propuesta pertenezca a un movimiento de la empresa
      const { data: movimientoData, error: movimientoError } = await supabase
        .from("banco_chile_movimientos")
        .select("empresa_id, conciliado")
        .eq("id", input.movimiento_id)
        .single();

      if (movimientoError || !movimientoData) {
        return c.json({ code: "movimiento_no_encontrado", message: "Movimiento no encontrado" }, 404);
      }

      if (movimientoData.empresa_id !== empresaId) {
        return c.json({ code: "acceso_denegado", message: "No tiene acceso a este movimiento" }, 403);
      }

      if (movimientoData.conciliado) {
        return c.json({ code: "movimiento_ya_conciliado", message: "El movimiento ya está conciliado" }, 409);
      }

      // Crear la conciliación
      let entidadId: string | null = null;
      let entidadTipo: 'venta_id' | 'gasto_id' | null = null;

      if (input.tipo_entidad === 'venta') {
        entidadTipo = 'venta_id';
        entidadId = input.entidad_id;
      } else if (input.tipo_entidad === 'gasto') {
        entidadTipo = 'gasto_id';
        entidadId = input.entidad_id;
      }

      const conciliacionData: Record<string, any> = {
        movimiento_id: input.movimiento_id,
        monto: 0, // Se obtendrá del movimiento
        concepto: input.concepto ?? `Conciliación automática vía propuesta ${input.propuesta_id}`,
        fecha_conciliacion: new Date().toISOString(),
      };

      if (entidadTipo) {
        conciliacionData[entidadTipo] = entidadId;
      }

      // Obtener el monto del movimiento
      const { data: movimientoMonto } = await supabase
        .from("banco_chile_movimientos")
        .select("monto")
        .eq("id", input.movimiento_id)
        .single();

      if (movimientoMonto) {
        conciliacionData.monto = movimientoMonto.monto;
      }

      const { data: conciliacionDataResult, error: conciliacionError } = await supabase
        .from("banco_chile_conciliaciones")
        .insert(conciliacionData)
        .select()
        .single();

      if (conciliacionError) {
        return c.json({ code: "conciliacion_creacion_fallida", message: conciliacionError.message }, 500);
      }

      // Marcar movimiento como conciliado
      await supabase
        .from("banco_chile_movimientos")
        .update({ conciliado: true })
        .eq("id", input.movimiento_id);

      return c.json({
        success: true,
        message: "Propuesta aceptada y conciliación creada",
        data: conciliacionDataResult
      });

    } catch (error) {
      console.error("[Conciliación Auto Aceptar] Error:", error);
      return c.json({ 
        code: "aceptar_error", 
        message: error instanceof Error ? error.message : "Error inesperado al aceptar propuesta" 
      }, 500);
    }
  }
);

/**
  * Rechazar una propuesta de conciliación
  */
conciliacionAutoRoutes.post(
  "/rechazar",
  zValidator("json", RechazarPropuestaSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      // En una implementación real, guardaríamos las propuestas rechazadas para aprender
      // Por ahora, simplemente confirmamos el rechazo
      return c.json({
        success: true,
        message: "Propuesta rechazada",
        data: {
          propuesta_id: input.propuesta_id,
          motivo: input.motivo,
        }
      });

    } catch (error) {
      console.error("[Conciliación Auto Rechazar] Error:", error);
      return c.json({ 
        code: "rechazar_error", 
        message: error instanceof Error ? error.message : "Error inesperado al rechazar propuesta" 
      }, 500);
    }
  }
);

/**
 * Auto-aceptar propuestas de conciliación con alta confianza
 * Ejecuta aplicar_reglas_conciliacion y acepta automáticamente las que superen el umbral
 */
conciliacionAutoRoutes.post(
  "/auto-aceptar",
  zValidator("json", AutoAceptarSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const resolved = resolveTenantEmpresaId(c, input.empresa_id);
      if (!resolved.ok) {
        return c.json({ code: "empresa_mismatch", message: resolved.message }, 403);
      }
      const empresaId = resolved.empresaId;
      const supabase = c.get("supabase");
      const umbralConfianza = input.umbral_confianza ?? 90;
      const limite = input.limite ?? 50;

      // Ejecutar la función de conciliación automática
      const { data: propuestas, error } = await supabase
        .rpc('aplicar_reglas_conciliacion', { p_empresa_id: empresaId })
        .limit(limite);

      if (error) {
        return c.json({ code: "ejecucion_fallida", message: error.message }, 500);
      }

      const aceptadas: any[] = [];
      const pendientes: any[] = [];
      const errores: any[] = [];

      for (const propuesta of propuestas ?? []) {
        const confianza = Number(propuesta.confianza ?? 0);
        
        if (confianza >= umbralConfianza) {
          // Auto-aceptar
          try {
            const { data: movimientoData, error: movimientoError } = await supabase
              .from("banco_chile_movimientos")
              .select("empresa_id, conciliado, monto")
              .eq("id", propuesta.movimiento_id)
              .single();

            if (movimientoError || !movimientoData || movimientoData.empresa_id !== empresaId) {
              errores.push({ propuesta_id: propuesta.propuesta_id, error: "Movimiento no encontrado o sin acceso" });
              continue;
            }

            if (movimientoData.conciliado) {
              pendientes.push({ ...propuesta, motivo: "Ya conciliado" });
              continue;
            }

            let entidadId: string | null = null;
            let entidadTipo: 'venta_id' | 'gasto_id' | null = null;

            if (propuesta.tipo_entidad === 'venta') {
              entidadTipo = 'venta_id';
              entidadId = propuesta.entidad_id;
            } else if (propuesta.tipo_entidad === 'gasto') {
              entidadTipo = 'gasto_id';
              entidadId = propuesta.entidad_id;
            }

            const conciliacionData: Record<string, any> = {
              movimiento_id: propuesta.movimiento_id,
              monto: movimientoData.monto,
              concepto: `Conciliación automática (confianza: ${confianza.toFixed(1)}%) vía regla ${propuesta.propuesta_id}`,
              fecha_conciliacion: new Date().toISOString(),
              regla_id: propuesta.propuesta_id,
              confianza,
              tipo_conciliacion: 'automatico',
            };

            if (entidadTipo) {
              conciliacionData[entidadTipo] = entidadId;
            }

            const { data: conciliacionDataResult, error: conciliacionError } = await supabase
              .from("banco_chile_conciliaciones")
              .insert(conciliacionData)
              .select()
              .single();

            if (conciliacionError) {
              errores.push({ propuesta_id: propuesta.propuesta_id, error: conciliacionError.message });
              continue;
            }

            // Marcar movimiento como conciliado
            await supabase
              .from("banco_chile_movimientos")
              .update({ conciliado: true })
              .eq("id", propuesta.movimiento_id);

            aceptadas.push({ ...propuesta, conciliacion_id: conciliacionDataResult.id });

          } catch (err) {
            errores.push({ propuesta_id: propuesta.propuesta_id, error: err instanceof Error ? err.message : 'Error desconocido' });
          }
        } else {
          pendientes.push(propuesta);
        }
      }

      return c.json({
        success: true,
        empresa_id: empresaId,
        umbral_confianza: umbralConfianza,
        total_procesadas: propuestas?.length ?? 0,
        auto_aceptadas: aceptadas.length,
        pendientes_revision: pendientes.length,
        errores: errores.length,
        data: { aceptadas, pendientes, errores },
      });

    } catch (error) {
      console.error("[Conciliación Auto Auto-Aceptar] Error:", error);
      return c.json({ 
        code: "auto_aceptar_error", 
        message: error instanceof Error ? error.message : "Error inesperado en auto-aceptación" 
      }, 500);
    }
  }
);

/**
 * Obtener reglas de conciliación de una empresa
 */
conciliacionAutoRoutes.get(
  "/reglas",
  async (c) => {
    try {
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      const { data: reglas, error } = await supabase
        .from("reconciliation_rules")
        .select("id, nombre, tipo, campo_primario, operador, valor_primario, campo_secundario, operador_secundario, valor_secundario, valor_secundario_2, activo, prioridad, creado_en, actualizado_en")
        .eq("empresa_id", empresaId)
        .order("prioridad", { ascending: false })
        .order("creado_en", { ascending: true });

      if (error) {
        return c.json({ code: "list_reglas_fallida", message: error.message }, 500);
      }

      return c.json({ data: reglas });

    } catch (error) {
      console.error("[Conciliación Auto List Reglas] Error:", error);
      return c.json({ 
        code: "list_reglas_error", 
        message: error instanceof Error ? error.message : "Error inesperado al listar reglas" 
      }, 500);
    }
  }
);

/**
 * Crear una nueva regla de conciliación
 */
conciliacionAutoRoutes.post(
  "/reglas",
  zValidator("json", ReglaConciliacionSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      // Validar que si se especifica campo_secundario, también se especifique operador_secundario
      if ((input.campo_secundario && !input.operador_secundario) || 
          (!input.campo_secundario && input.operador_secundario)) {
        return c.json({ 
          code: "validacion_fallida", 
          message: "Si se especifica campo_secundario, también debe especificarse operador_secundario" 
        }, 400);
      }

      // Validar que si se especifica operador_secundario 'entre', se proporcionen dos valores
      if (input.operador_secundario === 'entre' && (!input.valor_secundario || !input.valor_secundario_2)) {
        return c.json({ 
          code: "validacion_fallida", 
          message: "Para operador 'entre' en campo_secundario, se requieren valor_secundario y valor_secundario_2" 
        }, 400);
      }

      const { data: reglaData, error } = await supabase
        .from("reconciliation_rules")
        .insert({
          empresa_id: empresaId,
          ...input,
          creado_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return c.json({ code: "creacion_regla_fallida", message: error.message }, 500);
      }

      return c.json({
        success: true,
        message: "Regla de conciliación creada correctamente",
        data: reglaData
      }, 201);

    } catch (error) {
      console.error("[Conciliación Auto Crear Regla] Error:", error);
      return c.json({ 
        code: "creacion_regla_error", 
        message: error instanceof Error ? error.message : "Error inesperado al crear regla" 
      }, 500);
    }
  }
);

/**
 * Actualizar una regla de conciliación
 */
conciliacionAutoRoutes.patch(
  "/reglas/:id",
  zValidator("json", ReglaConciliacionSchema),
  async (c) => {
    try {
      const reglaId = c.req.param("id");
      const empresaId = c.get("empresaId");
      const input = c.req.valid("json");
      const supabase = c.get("supabase");

      // Validaciones similares a la creación
      if ((input.campo_secundario && !input.operador_secundario) || 
          (!input.campo_secundario && input.operador_secundario)) {
        return c.json({ 
          code: "validacion_fallida", 
          message: "Si se especifica campo_secundario, también debe especificarse operador_secundario" 
        }, 400);
      }

      if (input.operador_secundario === 'entre' && (!input.valor_secundario || !input.valor_secundario_2)) {
        return c.json({ 
          code: "validacion_fallida", 
          message: "Para operador 'entre' en campo_secundario, se requieren valor_secundario y valor_secundario_2" 
        }, 400);
      }

      const { data: reglaData, error } = await supabase
        .from("reconciliation_rules")
        .update({
          ...input,
          actualizado_en: new Date().toISOString(),
        })
        .eq("id", reglaId)
        .eq("empresa_id", empresaId)
        .select()
        .single();

      if (error) {
        return c.json({ code: "actualizacion_regla_fallida", message: error.message }, 500);
      }

      if (!reglaData) {
        return c.json({ code: "not_found", message: "Regla no encontrada" }, 404);
      }

      return c.json({
        success: true,
        message: "Regla de conciliación actualizada correctamente",
        data: reglaData
      });

    } catch (error) {
      console.error("[Conciliación Auto Actualizar Regla] Error:", error);
      return c.json({ 
        code: "actualizacion_regla_error", 
        message: error instanceof Error ? error.message : "Error inesperado al actualizar regla" 
      }, 500);
    }
  }
);

/**
 * Eliminar una regla de conciliación
 */
conciliacionAutoRoutes.delete(
  "/reglas/:id",
  async (c) => {
    try {
      const reglaId = c.req.param("id");
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");

      const { error } = await supabase
        .from("reconciliation_rules")
        .delete()
        .eq("id", reglaId)
        .eq("empresa_id", empresaId);

      if (error) {
        return c.json({ code: "eliminacion_regla_fallida", message: error.message }, 500);
      }

      return c.json({
        success: true,
        message: "Regla de conciliación eliminada correctamente"
      });

    } catch (error) {
      console.error("[Conciliación Auto Eliminar Regla] Error:", error);
      return c.json({ 
        code: "eliminacion_regla_error", 
        message: error instanceof Error ? error.message : "Error inesperado al eliminar regla" 
      }, 500);
    }
  }
);

/**
 * Obtener historial de conciliaciones
 */
conciliacionAutoRoutes.get(
  "/historial",
  async (c) => {
    try {
      const empresaId = c.get("empresaId");
      const supabase = c.get("supabase");
      const limite = Number(c.req.query("limite")) || 50;
      const offset = Number(c.req.query("offset")) || 0;

      const { data: conciliaciones, error } = await supabase
        .from("banco_chile_conciliaciones")
        .select(`
          id,
          movimiento_id,
          venta_id,
          gasto_id,
          monto,
          concepto,
          fecha_conciliacion,
          tipo_conciliacion,
          regla_id,
          confianza,
          movimientos:banco_chile_movimientos!inner (
            id,
            fecha_contable,
            monto,
            descripcion,
            numero_operacion,
            empresa_id
          ),
          ventas:facturas_emitidas (
            id,
            numero,
            fecha_emision,
            monto_total
          ),
          gastos:gastos (
            id,
            fecha,
            monto_total,
            categoria
          ),
          reglas:reconciliation_rules (
            nombre,
            tipo
          )
        `)
        .eq("movimientos.empresa_id", empresaId)
        .order("fecha_conciliacion", { ascending: false })
        .range(offset, offset + limite - 1);

      if (error) {
        return c.json({ code: "historial_fallido", message: error.message }, 500);
      }

      // También obtener total para paginación
      const { count } = await supabase
        .from("banco_chile_conciliaciones")
        .select("id, movimientos:banco_chile_movimientos!inner(empresa_id)", { count: "exact", head: true })
        .eq("movimientos.empresa_id", empresaId);

      return c.json({
        data: conciliaciones,
        pagination: {
          total: count,
          limite,
          offset,
          tiene_mas: (offset + limite) < (count || 0)
        }
      });

    } catch (error) {
      console.error("[Conciliación Auto Historial] Error:", error);
      return c.json({ 
        code: "historial_error", 
        message: error instanceof Error ? error.message : "Error inesperado al obtener historial" 
      }, 500);
    }
  }
);

// Named export only, no default export
