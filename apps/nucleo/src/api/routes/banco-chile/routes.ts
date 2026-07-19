import type { AppVariables } from '@/api/lib/middleware';
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import {
  ensureBancoChileAuth,
  resolveBancoChileClient,
} from '@/api/lib/banco-chile-client';

/**
 * Router para operaciones generales de Banco Chile
 */
export const bancoChileRouter = new Hono<{ Variables: AppVariables }>();

function mapCuentaRow(
  cuenta: {
    id?: string;
    numeroCuenta?: string;
    numero_cuenta?: string;
    tipoCuenta?: string;
    tipo_cuenta?: string;
    moneda?: string;
    saldoDisponible?: number;
    saldo_disponible?: number;
    saldoContable?: number;
    saldo_contable?: number;
    fechaActualizacion?: string;
    ultimo_movimiento?: string;
    activa?: boolean;
  },
  configId: string,
  empresaId: string,
) {
  return {
    config_id: configId,
    empresa_id: empresaId,
    numero_cuenta: String(cuenta.numeroCuenta ?? cuenta.numero_cuenta ?? cuenta.id ?? ''),
    tipo_cuenta: String(cuenta.tipoCuenta ?? cuenta.tipo_cuenta ?? 'corriente'),
    moneda: String(cuenta.moneda ?? 'CLP'),
    saldo_disponible: Number(cuenta.saldoDisponible ?? cuenta.saldo_disponible ?? 0),
    saldo_contable: Number(cuenta.saldoContable ?? cuenta.saldo_contable ?? 0),
    ultimo_movimiento: cuenta.fechaActualizacion ?? cuenta.ultimo_movimiento ?? null,
    activa: cuenta.activa !== false,
  };
}

// Obtener cuentas (API + upsert local)
bancoChileRouter.get('/cuentas', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');

    const resolved = await resolveBancoChileClient(supabase, empresaId);
    if (!resolved.ok) {
      return c.json({ code: resolved.code, message: resolved.message }, 400);
    }

    const ensured = await ensureBancoChileAuth(supabase, resolved);
    if (!ensured.ok) {
      return c.json({ code: 'auth_failed', message: ensured.message }, 502);
    }

    const result = await resolved.client.getCuentas();

    if (!result.success) {
      return c.json({ code: 'cuentas_failed', message: result.error.message }, 502);
    }

    if (result.data.length > 0) {
      const cuentas = result.data.map((cuenta) =>
        mapCuentaRow(cuenta as never, resolved.config.id, empresaId),
      ).filter((r) => r.numero_cuenta);

      await supabase.from('banco_chile_cuentas').upsert(cuentas, {
        onConflict: 'config_id,numero_cuenta',
        ignoreDuplicates: false,
      });
    }

    await supabase
      .from('banco_chile_config')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', resolved.config.id);

    return c.json({ data: result.data, cuentas: result.data });
  } catch (error) {
    console.error('Error getting cuentas:', error);
    return c.json({ code: 'cuentas_error', message: 'Error al obtener cuentas' }, 500);
  }
});

/**
 * Sync go-live: cuentas + movimientos (últimos N días) en un solo POST.
 */
bancoChileRouter.post('/sync', async (c) => {
  try {
    const supabase = c.get('supabase');
    const empresaId = c.get('empresaId');
    const body = await c.req.json().catch(() => ({})) as { dias?: number; limite?: number };
    const dias = Math.min(Math.max(Number(body.dias) || 30, 1), 90);
    const limite = Math.min(Math.max(Number(body.limite) || 100, 1), 500);

    const resolved = await resolveBancoChileClient(supabase, empresaId);
    if (!resolved.ok) {
      return c.json({ code: resolved.code, message: resolved.message }, 400);
    }

    const ensured = await ensureBancoChileAuth(supabase, resolved);
    if (!ensured.ok) {
      return c.json({ code: 'auth_failed', message: ensured.message }, 502);
    }

    const cuentasRes = await resolved.client.getCuentas();
    if (!cuentasRes.success) {
      return c.json({ code: 'cuentas_failed', message: cuentasRes.error.message }, 502);
    }

    const cuentas = cuentasRes.data.map((cuenta) =>
      mapCuentaRow(cuenta as never, resolved.config.id, empresaId),
    ).filter((r) => r.numero_cuenta);

    if (cuentas.length > 0) {
      await supabase.from('banco_chile_cuentas').upsert(cuentas, {
        onConflict: 'config_id,numero_cuenta',
        ignoreDuplicates: false,
      });
    }

    // Load local ids for movimientos FK
    const { data: localCuentas } = await supabase
      .from('banco_chile_cuentas')
      .select('id, numero_cuenta')
      .eq('empresa_id', empresaId);

    const byNumero = new Map(
      (localCuentas ?? []).map((r) => [r.numero_cuenta, r.id]),
    );

    const desde = new Date(Date.now() - dias * 86400_000).toISOString().slice(0, 10);
    const hasta = new Date().toISOString().slice(0, 10);
    let movimientosUpserted = 0;

    for (const cta of cuentas) {
      const localId = byNumero.get(cta.numero_cuenta);
      if (!localId) continue;

      const movRes = await resolved.client.getMovimientos(cta.numero_cuenta, {
        desde,
        hasta,
        limite,
      });
      if (!movRes.success || !movRes.data.length) continue;

      const rows = movRes.data.map((mov) => {
        const m = mov as Record<string, unknown>;
        return {
          cuenta_id: localId,
          empresa_id: empresaId,
          fecha_contable: String(m.fechaContable ?? m.fecha_contable ?? hasta),
          fecha_valor: (m.fechaValor ?? m.fecha_valor ?? null) as string | null,
          descripcion: String(m.descripcion ?? ''),
          descripcion_detallada: (m.descripcionDetallada ?? m.descripcion_detallada ?? null) as
            | string
            | null,
          monto: Number(m.monto ?? 0),
          moneda: String(m.moneda ?? 'CLP'),
          tipo: String(m.tipo ?? 'abono'),
          categoria: (m.categoria ?? null) as string | null,
          subcategoria: (m.subcategoria ?? null) as string | null,
          referencia: (m.referencia ?? null) as string | null,
          rut_contraparte: (m.rutContraparte ?? m.rut_contraparte ?? null) as string | null,
          nombre_contraparte: (m.nombreContraparte ?? m.nombre_contraparte ?? null) as
            | string
            | null,
          banco_contraparte: (m.bancoContraparte ?? m.banco_contraparte ?? null) as string | null,
          numero_operacion: (m.numeroOperacion ?? m.numero_operacion ?? null) as string | null,
          saldo_posterior: (m.saldoPosterior ?? m.saldo_posterior ?? null) as number | null,
        };
      });

      const { error } = await supabase.from('banco_chile_movimientos').upsert(rows);
      if (!error) movimientosUpserted += rows.length;
      else console.warn('[banco-chile/sync] mov upsert:', error.message);
    }

    await supabase
      .from('banco_chile_config')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', resolved.config.id);

    return c.json({
      data: {
        cuentas: cuentas.length,
        movimientosUpserted,
        desde,
        hasta,
      },
    });
  } catch (error) {
    console.error('Error sync banco chile:', error);
    return c.json({ code: 'sync_error', message: 'Error en sync bancario' }, 500);
  }
});

// Obtener movimientos
bancoChileRouter.get(
  '/movimientos/:cuentaId',
  zValidator(
    'query',
    z.object({
      desde: z.string().optional(),
      hasta: z.string().optional(),
      limite: z.string().transform((v) => (v ? parseInt(v) : undefined)).optional(),
    }),
  ),
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const empresaId = c.get('empresaId');
      const { cuentaId } = c.req.param();
      const { desde, hasta, limite } = c.req.valid('query');

      const resolved = await resolveBancoChileClient(supabase, empresaId);
      if (!resolved.ok) {
        return c.json({ code: resolved.code, message: resolved.message }, 400);
      }

      const ensured = await ensureBancoChileAuth(supabase, resolved);
      if (!ensured.ok) {
        return c.json({ code: 'auth_failed', message: ensured.message }, 502);
      }

      // Allow local UUID or bank account number
      let apiCuentaId = cuentaId;
      const { data: localCta } = await supabase
        .from('banco_chile_cuentas')
        .select('id, numero_cuenta')
        .eq('empresa_id', empresaId)
        .or(`id.eq.${cuentaId},numero_cuenta.eq.${cuentaId}`)
        .maybeSingle();
      if (localCta?.numero_cuenta) {
        apiCuentaId = localCta.numero_cuenta;
      }

      const result = await resolved.client.getMovimientos(apiCuentaId, { desde, hasta, limite });

      if (!result.success) {
        return c.json({ code: 'movimientos_failed', message: result.error.message }, 502);
      }

      if (result.data.length > 0) {
        const movimientos = result.data.map((mov) => ({
          cuenta_id: cuentaId,
          empresa_id: empresaId,
          fecha_contable: mov.fechaContable,
          fecha_valor: mov.fechaValor,
          descripcion: mov.descripcion,
          descripcion_detallada: mov.descripcionDetallada,
          monto: mov.monto,
          moneda: mov.moneda,
          tipo: mov.tipo,
          categoria: mov.categoria,
          subcategoria: mov.subcategoria,
          referencia: mov.referencia,
          rut_contraparte: mov.rutContraparte,
          nombre_contraparte: mov.nombreContraparte,
          banco_contraparte: mov.bancoContraparte,
          numero_operacion: mov.numeroOperacion,
          saldo_posterior: mov.saldoPosterior,
        }));

        await supabase.from('banco_chile_movimientos').upsert(movimientos);
      }

      return c.json({ data: result.data, movimientos: result.data });
    } catch (error) {
      console.error('Error getting movimientos:', error);
      return c.json({ code: 'movimientos_error', message: 'Error al obtener movimientos' }, 500);
    }
  },
);
