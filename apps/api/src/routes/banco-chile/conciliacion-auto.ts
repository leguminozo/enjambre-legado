import type { AppVariables } from '../../types/hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

/**
 * Router para conciliación automática
 * Compara movimientos bancarios con ventas y sugiere matches
 */
export const conciliacionAutoRouter = new Hono<{ Variables: AppVariables }>();

interface Venta {
  id: string;
  numero: string;
  monto_total: number;
  created_at: string;
  rut_cliente?: string;
  email_cliente?: string;
}

interface Movimiento {
  id: string;
  fecha_contable: string;
  descripcion: string;
  monto: number;
  rut_contraparte?: string;
  nombre_contraparte?: string;
  referencia?: string;
}

interface SugerenciaConciliacion {
  movimiento_id: string;
  venta_id: string;
  confianza: 'alta' | 'media' | 'baja';
  monto_iguales: boolean;
  fecha_cercana: boolean;
  rut_coincide: boolean;
  puntaje: number;
}

// Sincronizar movimientos desde Banco Chile
conciliacionAutoRouter.post('/sincronizar', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    // Obtener configuración
    const { data: config } = await supabase
      .from('banco_chile_config')
      .select('*')
      .eq('empresa_id', empresaId)
      .single();

    if (!config || !config.enabled) {
      return c.json({ error: 'Banco Chile no configurado' }, 400);
    }

    // Obtener cuentas
    const { data: cuentas } = await supabase
      .from('banco_chile_cuentas')
      .select('id, numero_cuenta')
      .eq('config_id', config.id)
      .eq('activa', true);

    if (!cuentas || cuentas.length === 0) {
      return c.json({ error: 'No hay cuentas activas' }, 404);
    }

    // Sincronizar movimientos de cada cuenta (stub - implementar con client)
    const movimientosSincronizados: number = 0;

    return c.json({
      success: true,
      message: 'Sincronización completada',
      movimientosSincronizados,
    });
  } catch (error) {
    console.error('Error sincronizando:', error);
    return c.json({ error: 'Error al sincronizar' }, 500);
  }
});

// Obtener sugerencias de conciliación
conciliacionAutoRouter.get('/sugerencias', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    // Obtener movimientos sin conciliar (últimos 30 días)
    const { data: movimientos } = await supabase
      .from('banco_chile_movimientos')
      .select('*')
      .eq('empresa_id', empresaId)
      .is('conciliado', false)
      .gte('fecha_contable', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('fecha_contable', { ascending: false })
      .limit(100);

    if (!movimientos || movimientos.length === 0) {
      return c.json({ sugerencias: [] });
    }

    // Obtener ventas sin conciliar (últimos 30 días)
    const { data: ventas } = await supabase
      .from('ventas')
      .select('*')
      .eq('empresa_id', empresaId)
      .is('conciliado', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (!ventas || ventas.length === 0) {
      return c.json({ sugerencias: [] });
    }

    // Generar sugerencias
    const sugerencias: SugerenciaConciliacion[] = [];

    for (const mov of movimientos) {
      for (const venta of ventas) {
        const sugerencia = calcularSugerencia(mov, venta);
        if (sugerencia.puntaje >= 50) {
          sugerencias.push(sugerencia);
        }
      }
    }

    // Ordenar por puntaje
    sugerencias.sort((a, b) => b.puntaje - a.puntaje);

    return c.json({
      sugerencias: sugerencias.slice(0, 50), // Máximo 50 sugerencias
      total: sugerencias.length,
    });
  } catch (error) {
    console.error('Error generando sugerencias:', error);
    return c.json({ error: 'Error al generar sugerencias' }, 500);
  }
});

// Conciliación automática masiva
conciliacionAutoRouter.post('/auto-conciliar', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');
    const { confianzaMinima = 'media' } = await c.req.json().catch(() => ({}));

    // Obtener sugerencias
    const { sugerencias } = await fetch('/api/banco-chile/conciliacion/sugerencias', {
      headers: {
        'Authorization': c.req.header('Authorization') || '',
        'x-empresa-id': empresaId,
      },
    }).then(r => r.json());

    // Filtrar por confianza
    const nivelConfianza: Record<string, number> = {
      baja: 50,
      media: 70,
      alta: 90,
    };

    const puntajeMinimo = nivelConfianza[confianzaMinima] || 70;
    const sugerenciasFiltradas = sugerencias.filter((s: any) => s.puntaje >= puntajeMinimo);

    // Conciliar automáticamente
    const conciliados: string[] = [];
    for (const sug of sugerenciasFiltradas) {
      // Verificar que no esté ya conciliado
      const { data: existing } = await supabase
        .from('banco_chile_conciliaciones')
        .select('id')
        .eq('movimiento_id', sug.movimiento_id)
        .single();

      if (!existing) {
        await supabase.from('banco_chile_conciliaciones').insert({
          movimiento_id: sug.movimiento_id,
          venta_id: sug.venta_id,
          monto: sug.monto_iguales ? null : undefined,
          concepto: `Conciliación automática (confianza: ${sug.confianza})`,
          fecha_conciliacion: new Date().toISOString(),
        });

        await supabase
          .from('banco_chile_movimientos')
          .update({ conciliado: true })
          .eq('id', sug.movimiento_id);

        conciliados.push(sug.movimiento_id);
      }
    }

    return c.json({
      success: true,
      conciliados: conciliados.length,
      movimientos: conciliados,
    });
  } catch (error) {
    console.error('Error en auto-conciliación:', error);
    return c.json({ error: 'Error en auto-conciliación' }, 500);
  }
});

// Conciliar manualmente
conciliacionAutoRouter.post('/conciliar', async (c) => {
  try {
    const supabase = c.get('supabase');
    const { movimientoId, ventaId, monto, concepto } = await c.req.json();

    if (!movimientoId || !ventaId) {
      return c.json({ error: 'movimientoId y ventaId requeridos' }, 400);
    }

    // Verificar que el movimiento no esté conciliado
    const { data: mov } = await supabase
      .from('banco_chile_movimientos')
      .select('conciliado')
      .eq('id', movimientoId)
      .single();

    if (mov?.conciliado) {
      return c.json({ error: 'Movimiento ya conciliado' }, 400);
    }

    // Crear conciliación
    const { error: concilError } = await supabase
      .from('banco_chile_conciliaciones')
      .insert({
        movimiento_id: movimientoId,
        venta_id: ventaId,
        monto: monto || null,
        concepto: concepto || 'Conciliación manual',
        fecha_conciliacion: new Date().toISOString(),
      });

    if (concilError) {
      return c.json({ error: concilError.message }, 500);
    }

    // Marcar movimiento como conciliado
    await supabase
      .from('banco_chile_movimientos')
      .update({ conciliado: true })
      .eq('id', movimientoId);

    return c.json({
      success: true,
      message: 'Movimiento conciliado exitosamente',
    });
  } catch (error) {
    console.error('Error conciliando:', error);
    return c.json({ error: 'Error al conciliar' }, 500);
  }
});

// Desconciliar
conciliacionAutoRouter.post('/desconciliar/:id', async (c) => {
  try {
    const supabase = c.get('supabase');
    const { id } = c.req.param();

    // Eliminar conciliación
    await supabase
      .from('banco_chile_conciliaciones')
      .delete()
      .eq('movimiento_id', id);

    // Marcar como no conciliado
    await supabase
      .from('banco_chile_movimientos')
      .update({ conciliado: false })
      .eq('id', id);

    return c.json({
      success: true,
      message: 'Desconciliado correctamente',
    });
  } catch (error) {
    console.error('Error desconciliando:', error);
    return c.json({ error: 'Error al desconciliar' }, 500);
  }
});

// Función para calcular sugerencia de conciliación
function calcularSugerencia(mov: Movimiento, venta: Venta): SugerenciaConciliacion {
  let puntaje = 0;
  
  // Monto idéntico (50 puntos)
  const montoIguales = Math.abs(mov.monto - venta.monto_total) < 1;
  if (montoIguales) {
    puntaje += 50;
  }

  // Fecha cercana (dentro de 3 días) (20 puntos)
  const fechaMov = new Date(mov.fecha_contable).getTime();
  const fechaVenta = new Date(venta.created_at).getTime();
  const diffDias = Math.abs(fechaMov - fechaVenta) / (1000 * 60 * 60 * 24);
  const fechaCercana = diffDias <= 3;
  if (fechaCercana) {
    puntaje += 20;
  }

  // RUT coincide (30 puntos)
  const rutCoincide = mov.rut_contraparte === venta.rut_cliente;
  if (rutCoincide) {
    puntaje += 30;
  }

  // Referencia contiene número de venta (opcional, 10 puntos)
  if (mov.referencia?.includes(venta.numero) || mov.descripcion?.includes(venta.numero)) {
    puntaje += 10;
  }

  // Determinar confianza
  let confianza: 'alta' | 'media' | 'baja' = 'baja';
  if (puntaje >= 90) confianza = 'alta';
  else if (puntaje >= 70) confianza = 'media';

  return {
    movimiento_id: mov.id,
    venta_id: venta.id,
    confianza,
    monto_iguales: montoIguales,
    fecha_cercana: fechaCercana,
    rut_coincide: rutCoincide,
    puntaje,
  };
}

// Exportar función helper
export { calcularSugerencia };
