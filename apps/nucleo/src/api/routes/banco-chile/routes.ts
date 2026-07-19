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

const TIPOS_MOV = new Set([
  'abono',
  'cargo',
  'traspaso',
  'nota_debito',
  'nota_credito',
]);

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

function normalizeTipo(raw: unknown): string {
  const t = String(raw ?? 'abono')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
  if (TIPOS_MOV.has(t)) return t;
  // API variants
  if (t.includes('cargo') || t === 'debit' || t === 'd') return 'cargo';
  if (t.includes('abono') || t === 'credit' || t === 'c') return 'abono';
  if (t.includes('traspaso') || t.includes('transfer')) return 'traspaso';
  return 'abono';
}

/** Stable idempotency key for upsert (mig 98 external_key). */
export function buildMovimientoExternalKey(m: {
  numero_operacion?: string | null;
  fecha_contable: string;
  monto: number;
  tipo: string;
  descripcion: string;
}): string {
  const op = m.numero_operacion?.trim();
  if (op) return op;
  // Fallback when bank omits operation number
  const desc = m.descripcion.slice(0, 120);
  return `h:${m.fecha_contable}|${m.monto}|${m.tipo}|${desc}`;
}

export function mapMovimientoRow(
  mov: Record<string, unknown>,
  localCuentaId: string,
  empresaId: string,
  fallbackFecha: string,
) {
  const fechaContable = String(
    mov.fechaContable ?? mov.fecha_contable ?? fallbackFecha,
  ).slice(0, 10);
  const fechaValor = String(
    mov.fechaValor ?? mov.fecha_valor ?? fechaContable,
  ).slice(0, 10);
  const monto = Number(mov.monto ?? 0);
  const tipo = normalizeTipo(mov.tipo);
  const descripcion = String(mov.descripcion ?? '');
  const numeroOperacion = (mov.numeroOperacion ?? mov.numero_operacion ?? null) as
    | string
    | null;

  const external_key = buildMovimientoExternalKey({
    numero_operacion: numeroOperacion,
    fecha_contable: fechaContable,
    monto,
    tipo,
    descripcion,
  });

  return {
    cuenta_id: localCuentaId,
    empresa_id: empresaId,
    fecha_contable: fechaContable,
    fecha_valor: fechaValor,
    descripcion: descripcion || 'Movimiento bancario',
    descripcion_detallada: (mov.descripcionDetallada ??
      mov.descripcion_detallada ??
      null) as string | null,
    monto,
    moneda: String(mov.moneda ?? 'CLP'),
    tipo,
    categoria: (mov.categoria ?? null) as string | null,
    subcategoria: (mov.subcategoria ?? null) as string | null,
    referencia: (mov.referencia ?? null) as string | null,
    rut_contraparte: (mov.rutContraparte ?? mov.rut_contraparte ?? null) as string | null,
    nombre_contraparte: (mov.nombreContraparte ?? mov.nombre_contraparte ?? null) as
      | string
      | null,
    banco_contraparte: (mov.bancoContraparte ?? mov.banco_contraparte ?? null) as
      | string
      | null,
    numero_operacion: numeroOperacion,
    saldo_posterior: (mov.saldoPosterior ?? mov.saldo_posterior ?? null) as number | null,
    external_key,
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
      const cuentas = result.data
        .map((cuenta) => mapCuentaRow(cuenta as never, resolved.config.id, empresaId))
        .filter((r) => r.numero_cuenta);

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
    const body = (await c.req.json().catch(() => ({}))) as { dias?: number; limite?: number };
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

    const cuentas = cuentasRes.data
      .map((cuenta) => mapCuentaRow(cuenta as never, resolved.config.id, empresaId))
      .filter((r) => r.numero_cuenta);

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

    const byNumero = new Map((localCuentas ?? []).map((r) => [r.numero_cuenta, r.id]));

    const desde = new Date(Date.now() - dias * 86400_000).toISOString().slice(0, 10);
    const hasta = new Date().toISOString().slice(0, 10);
    let movimientosUpserted = 0;
    let movimientosErrors = 0;

    for (const cta of cuentas) {
      const localId = byNumero.get(cta.numero_cuenta);
      if (!localId) continue;

      const movRes = await resolved.client.getMovimientos(cta.numero_cuenta, {
        desde,
        hasta,
        limite,
      });
      if (!movRes.success || !movRes.data.length) continue;

      const rows = movRes.data.map((mov) =>
        mapMovimientoRow(mov as Record<string, unknown>, localId, empresaId, hasta),
      );

      // Dedupe within batch by external_key
      const byKey = new Map<string, (typeof rows)[0]>();
      for (const row of rows) {
        byKey.set(row.external_key, row);
      }
      const uniqueRows = Array.from(byKey.values());

      const { error, count } = await supabase
        .from('banco_chile_movimientos')
        .upsert(uniqueRows, {
          onConflict: 'cuenta_id,external_key',
          ignoreDuplicates: false,
          count: 'exact',
        });
      if (!error) movimientosUpserted += count ?? uniqueRows.length;
      else {
        movimientosErrors += 1;
        console.warn('[banco-chile/sync] mov upsert:', error.message);
        // Fallback without unique (pre-mig 98): still try insert-ignore style batch
        if (error.message.includes('external_key') || error.code === '42P10') {
          for (const row of uniqueRows) {
            const { error: insErr } = await supabase.from('banco_chile_movimientos').insert(row);
            if (!insErr) movimientosUpserted += 1;
          }
        }
      }
    }

    await supabase
      .from('banco_chile_config')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', resolved.config.id);

    return c.json({
      data: {
        cuentas: cuentas.length,
        movimientosUpserted,
        movimientosErrors,
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
      limite: z.string()
        .transform((v) => (v ? parseInt(v) : undefined))
        .optional(),
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
      let localCuentaUuid: string | null = null;
      const { data: localCta } = await supabase
        .from('banco_chile_cuentas')
        .select('id, numero_cuenta')
        .eq('empresa_id', empresaId)
        .or(`id.eq.${cuentaId},numero_cuenta.eq.${cuentaId}`)
        .maybeSingle();
      if (localCta?.numero_cuenta) {
        apiCuentaId = localCta.numero_cuenta;
        localCuentaUuid = localCta.id;
      }

      const result = await resolved.client.getMovimientos(apiCuentaId, { desde, hasta, limite });

      if (!result.success) {
        return c.json({ code: 'movimientos_failed', message: result.error.message }, 502);
      }

      if (result.data.length > 0 && localCuentaUuid) {
        const fallbackFecha = new Date().toISOString().slice(0, 10);
        const movimientos = result.data.map((mov) =>
          mapMovimientoRow(
            mov as unknown as Record<string, unknown>,
            localCuentaUuid!,
            empresaId,
            fallbackFecha,
          ),
        );
        const byKey = new Map(movimientos.map((r) => [r.external_key, r]));
        const { error } = await supabase
          .from('banco_chile_movimientos')
          .upsert(Array.from(byKey.values()), {
            onConflict: 'cuenta_id,external_key',
            ignoreDuplicates: false,
          });
        if (error) {
          console.warn('[banco-chile/movimientos] upsert:', error.message);
        }
      }

      return c.json({ data: result.data, movimientos: result.data });
    } catch (error) {
      console.error('Error getting movimientos:', error);
      return c.json({ code: 'movimientos_error', message: 'Error al obtener movimientos' }, 500);
    }
  },
);
