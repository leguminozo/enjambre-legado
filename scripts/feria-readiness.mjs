#!/usr/bin/env node
/**
 * E3 — Checklist operativo feria (readiness + playbook)
 *
 * Valida el circuito admin → campo POS → claim → ledger sin login manual.
 *
 * Uso:
 *   pnpm feria:check
 *   FERIA_REP_TOKEN=eyJ... pnpm feria:check   # valida feria-context del rep
 *   NUCLEO_URL=... node scripts/feria-readiness.mjs
 */
import { PRODUCTION_URLS } from './lib/vercel-auth.mjs';
import { parseEnvFile, loadSupabaseAdminConfig } from './lib/parse-env.mjs';
import { supabaseSelect } from './lib/supabase-rest.mjs';
import { runSmokeTarget } from './lib/ecosystem-smoke.mjs';

const NUCLEO = process.env.NUCLEO_URL ?? PRODUCTION_URLS.nucleo;
const TIENDA = process.env.TIENDA_URL ?? process.env.NEXT_PUBLIC_URL_TIENDA ?? PRODUCTION_URLS.tienda;
const CAMPO = process.env.CAMPO_URL ?? process.env.NEXT_PUBLIC_URL_CAMPO ?? PRODUCTION_URLS.campo;
const REP_TOKEN = process.env.FERIA_REP_TOKEN?.trim();

const results = [];
let failed = 0;

function record(id, ok, detail, hint) {
  results.push({ id, ok, detail, hint });
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} [${id}] ${detail}`);
  if (!ok && hint) console.log(`    → ${hint}`);
}

async function probeRoute(name, url, expectStatus = 200) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const ok = res.status === expectStatus || (expectStatus === 'auth' && [301, 302, 307, 308].includes(res.status));
    record(name, ok, `${url} → ${res.status}`, ok ? undefined : 'Ruta no responde como se espera');
    return ok;
  } catch (err) {
    record(name, false, `${url} — ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

console.log('\n=== E3 Feria readiness ===\n');
console.log(`Núcleo: ${NUCLEO}`);
console.log(`Tienda: ${TIENDA}`);
console.log(`Campo:  ${CAMPO}\n`);

console.log('— Infraestructura —\n');

await probeRoute('routes-nucleo-operadores', `${NUCLEO}/operadores-feria`, 'auth');
await probeRoute('routes-nucleo-mi-feria', `${NUCLEO}/mi-feria`, 'auth');
await probeRoute('routes-campo-pos', `${CAMPO}/pos`, 'auth');
await probeRoute('routes-tienda-claim', `${TIENDA}/claim/__feria_check__`, 200);

const isLocalProbe = NUCLEO.includes('localhost') || CAMPO.includes('localhost');
const campoVars = parseEnvFile('apps/campo/.env.local').vars;
const campoTienda =
  process.env.NEXT_PUBLIC_URL_TIENDA ??
  campoVars.NEXT_PUBLIC_URL_TIENDA ??
  campoVars.NEXT_PUBLIC_TIENDA_URL;
if (isLocalProbe) {
  record(
    'env-campo-tienda-url',
    Boolean(campoTienda?.length),
    campoTienda ? `NEXT_PUBLIC_URL_TIENDA=${campoTienda}` : 'NEXT_PUBLIC_URL_TIENDA no configurada en campo',
    'pnpm go-live:bootstrap',
  );
} else {
  console.log(
    `○ [env-campo-tienda-url] Prod — verificar NEXT_PUBLIC_URL_TIENDA=${TIENDA} en proyecto campo (pnpm go-live:vercel-env)\n`,
  );
}

const feriaNoAuth = await runSmokeTarget({
  name: 'bff-feria-context-auth',
  url: `${NUCLEO}/api/rep-ventas/feria-context`,
  expectStatus: 401,
  expectJson: { code: 'unauthorized' },
});
record('bff-feria-context-auth', feriaNoAuth.ok, 'feria-context rechaza sin token (401)');

if (REP_TOKEN) {
  try {
    const res = await fetch(`${NUCLEO}/api/rep-ventas/feria-context`, {
      headers: { Authorization: `Bearer ${REP_TOKEN}` },
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();
    const active = Boolean(json?.data?.active);
    const consCount = Array.isArray(json?.data?.consignaciones) ? json.data.consignaciones.length : 0;
    record(
      'bff-feria-context-rep',
      res.ok,
      res.ok
        ? `active=${active} · consignaciones=${consCount} · contrato=${json?.data?.contrato ? 'sí' : 'no'}`
        : `HTTP ${res.status}`,
      res.ok ? undefined : 'Token inválido o rep sin contrato activo',
    );
    if (res.ok && !active) {
      record(
        'feria-evento-en-curso',
        false,
        'Rep autenticado pero sin evento en_curso',
        'Admin: activar evento en /operadores-feria',
      );
    } else if (res.ok && active && consCount === 0) {
      record(
        'feria-consignacion',
        false,
        'Evento activo sin líneas de consignación',
        'Admin: registrar consignación antes de vender en feria',
      );
    } else if (res.ok && active) {
      record('feria-evento-en-curso', true, 'Evento feria en_curso para el rep');
      record('feria-consignacion', consCount > 0, `${consCount} línea(s) consignadas`);
    }
  } catch (err) {
    record('bff-feria-context-rep', false, err instanceof Error ? err.message : String(err));
  }
} else {
  console.log('○ [bff-feria-context-rep] Omitido — exporta FERIA_REP_TOKEN para validar contexto del rep\n');
}

const { url: supabaseUrl, key: serviceKey } = loadSupabaseAdminConfig();

if (supabaseUrl && serviceKey) {
  console.log('\n— Base de datos (service_role) —\n');

  const contratos = await supabaseSelect({
    url: supabaseUrl,
    serviceKey,
    table: 'participante_contrato',
    filters: { estado: 'eq.activo' },
    select: 'id,user_id,tipo,score_confianza',
  });

  record(
    'db-contratos-activos',
    contratos.ok && contratos.total > 0,
    `${contratos.total} contrato(s) activo(s)`,
    'Admin: /operadores-feria → activar contrato + términos',
  );

  const eventos = await supabaseSelect({
    url: supabaseUrl,
    serviceKey,
    table: 'participante_evento',
    filters: { estado: 'eq.en_curso' },
    select: 'id,nombre_evento,contrato_id,ubicacion',
  });

  record(
    'db-eventos-en-curso',
    eventos.ok && eventos.total > 0,
    `${eventos.total} evento(s) en_curso`,
    'Admin: iniciar evento en /operadores-feria',
  );

  if (eventos.ok && eventos.data.length > 0) {
    for (const ev of eventos.data) {
      const cons = await supabaseSelect({
        url: supabaseUrl,
        serviceKey,
        table: 'participante_consignacion',
        filters: { evento_id: `eq.${ev.id}` },
        select: 'id,producto_id,cantidad_entregada,cantidad_vendida,cantidad_devuelta',
      });
      const withStock = cons.data.filter(
        (r) => Number(r.cantidad_entregada ?? 0) > Number(r.cantidad_vendida ?? 0) + Number(r.cantidad_devuelta ?? 0),
      );
      record(
        `db-consignacion-${ev.id.slice(0, 8)}`,
        cons.total > 0,
        `"${ev.nombre_evento}": ${cons.total} SKU(s), ${withStock.length} con pendiente > 0`,
        'Admin: registrar_consignacion_feria',
      );
    }
  }

  const ledger = await supabaseSelect({
    url: supabaseUrl,
    serviceKey,
    table: 'incentivo_ledger',
    filters: { estado: 'eq.pendiente' },
    select: 'id,tipo,monto,user_id',
  });

  record(
    'db-ledger-pendiente',
    true,
    `${ledger.total} registro(s) pendiente(s) de aprobación (informativo)`,
  );

  const ventasFeria = await supabaseSelect({
    url: supabaseUrl,
    serviceKey,
    table: 'ventas',
    filters: { channel: 'eq.feria', 'created_at': `gte.${new Date(Date.now() - 7 * 86400000).toISOString()}` },
    select: 'id,total,created_at,claim_token',
  });

  record(
    'db-ventas-feria-7d',
    true,
    `${ventasFeria.total} venta(s) channel=feria últimos 7 días`,
  );
} else {
  console.log('\n— Base de datos —\n');
  console.log('○ Omitida — SUPABASE_SERVICE_ROLE_KEY no disponible (pnpm go-live:bootstrap)\n');
}

console.log('\n— Playbook operativo (manual) —\n');
const playbook = [
  { step: 1, who: 'Admin', action: 'Contrato activo + evento en_curso + consignación', url: `${NUCLEO}/operadores-feria` },
  { step: 2, who: 'Rep', action: 'Abrir caja y vender channel=feria en Campo POS', url: `${CAMPO}/pos` },
  { step: 3, who: 'Rep', action: 'Devolver stock no vendido (si aplica)', url: `${NUCLEO}/mi-feria` },
  { step: 4, who: 'Rep', action: 'Cerrar arqueo al fin del evento', url: `${NUCLEO}/mi-feria` },
  { step: 5, who: 'Cliente', action: 'Escanear QR claim en tienda', url: `${TIENDA}/claim/{token}` },
  { step: 6, who: 'Admin', action: 'Aprobar ledger → Preparar honorarios → F29', url: `${NUCLEO}/operadores-feria` },
  { step: 7, who: 'Admin', action: 'Impuestos / bandeja fiscal SII', url: `${NUCLEO}/sii` },
];

for (const row of playbook) {
  console.log(`${row.step}. [${row.who}] ${row.action}`);
  console.log(`   ${row.url}`);
}

console.log(failed ? `\n${failed} check(s) crítico(s) fallaron\n` : '\nFeria lista para operar (E3)\n');
process.exit(failed ? 1 : 0);