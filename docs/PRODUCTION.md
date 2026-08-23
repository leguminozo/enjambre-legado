# Producción — día 2

> **Clase: OPS.** Cómo se vive este sistema en real, en Hobby/Free, a largo horizonte.
> Setup inicial: [`../DEPLOY.md`](../DEPLOY.md) + [`VERCEL.md`](./VERCEL.md). Secretos: [`ENV-CHECKLIST.md`](./ENV-CHECKLIST.md). Cuotas: Constitución § II.6.

## Qué significa “producción” aquí

Tres deploys Vercel + un proyecto Supabase que **se pausa a los 7 días sin tráfico** (Free) y **no tiene backups automáticos**. Hobby **pausa** al quemar cuota (no factura overage). Hobby es **non-commercial**: una tienda con ventas reales no puede quedarse ahí para siempre.

El código está escrito para sobrevivir $0. El runbook asume que el techo es real.

## Orden de un release

```
1. PR a main/develop  →  CI (.github/workflows/ci.yml)
     unit packages + 3 apps + coverage gates
     build tienda + lint + e2e smoke tienda
2. Si hay SQL: aplicar migraciones ANTES de los deploys que las llaman
     pnpm go-live:verify-db
     pnpm go-live:db-push          # no revertir a ciegas
     cd packages/database && pnpm db:typegen
3. Vercel redeploy Núcleo → Tienda → Campo
     (Núcleo primero: BFF + crons)
4. Smoke
     pnpm go-live:check
     GET {NUCLEO}/api/health/live
     GET {NUCLEO}/api/health/deps     # presencia, no valores
     checkout sandbox + una venta Campo de $0/test
```

Rollback de app = redeploy del deployment anterior en Vercel. **No** bajes una migración que ya escribió ventas/DTE. Forward-fix.

## Scripts que existen (no los reescribas)

| Comando | Oficio |
|---|---|
| `pnpm go-live:check` | Presencia de env local, sin imprimir secretos |
| `pnpm env:check` / `env:check:prod` | Matriz / secrets prod |
| `pnpm go-live:verify-db` | Migraciones remotas |
| `pnpm go-live:db-push` | Apply SQL |
| `pnpm go-live:smoke` / `smoke:prod` | HTTP smoke |
| `pnpm feria:check` | Listo de feria |
| `pnpm check:loading` | Loaders legacy |

## Observabilidad (lo que hay, no lo que el deck promete)

| Señal | Dónde | Límite |
|---|---|---|
| Errores Tienda | Sentry (`sentry.*.config.ts`) | Solo Tienda hoy |
| Logs función | Vercel Runtime Logs | Hobby: **1 hora** |
| API/DB logs | Supabase | Free: **1 día** |
| Liveness | `GET /api/health/live` | público |
| Deps / env | `GET /api/health/deps`, UI Núcleo → Entorno | presencia |
| Seguridad | tabla `security_events` | admin lee |
| Colas | `notification_queue`, `sii` jobs | crons diarios |

No hay Pino global ni Sentry en Núcleo/Campo. Si no está en Sentry/tabla, **se evaporó** al pasar la ventana de logs. Ante un pago raro: mira `checkout_sessions` y el PSP, no el log de ayer.

## Backups y pausa Free

- Free: **sin backup diario**. Un `db reset` o un DELETE malo es irreversible.
- 500 MB → proyecto **read-only**.
- 7 días sin hits → **pause**. El primer request del día puede fallar mientras despierta.
- Antes de una migración destructiva: dump manual (`supabase db dump`) a un lugar que no sea el repo.

Cuando haya ingresos reales: Pro (Supabase backups 7 días + Vercel Pro por ToS).

## Incidentes frecuentes

| Síntoma | Mira primero | No hagas |
|---|---|---|
| Checkout 5xx / “pago ok, sin orden” | `checkout_sessions`, webhook, `fulfillCheckout` idempotente | Nuevo `init` con otra `buy_order` |
| Campo no sync | Dexie `sync_queue`, `NEXT_PUBLIC_NUCLEO_API_URL`, 409 consignación | Service role en el teléfono |
| Editor tienda no refresca | `CMS_REVALIDATE_SECRET`, ruta `/api/cms/revalidate` | Hard reload como “fix” de CMS |
| Boleta no sale | CAF, `SII_AUTO_EMIT_BOLETA`, cron fiscal 13:00 | Emitir a mano con folio inventado |
| 503 Supabase / lento | CPU RLS, 500 MB, pause, egress 5 GB | Abrir Postgres `:5432` desde funciones |
| Imágenes rotas / cuota | loader custom; no `/_next/image` | Reactivar optimizer “un ratito” |
| Cron “no corre” | Hobby + `vercel.json` diario; `CRON_SECRET` | Cron `*/5` |
| Bucle login tienda↔núcleo | `app_metadata.role` vs `profiles` (996), `NEXT_PUBLIC_URL_*` | Poner rol en `user_metadata` |
| IA cara / rara | `AI_ENABLED=false` | Meter `GROQ_*` en Tienda |

Detalle de exploits abiertos: [`AUDITORIA_PROFUNDA_2026-08.md`](./AUDITORIA_PROFUNDA_2026-08.md) — verificar en código, no asumir cerrado.

## Brecha de datos (Ley 21.719)

Si hay acceso indebido a datos de personas (no un 500 genérico):

1. Cortar el vector (`AI_ENABLED=false`, rotar `INTERNAL_API_SECRET`, revocar keys).
2. Conservar evidencia: Sentry (Tienda), `security_events`, dump de `checkout_sessions` si aplica. Logs Vercel Hobby duran **1 hora**.
3. Avisar a titulares afectados y, desde el 1 dic 2026, a la APD en el plazo legal (privacidad: 72 h una vez operativa).
4. Responsable: quien opera Núcleo (admin). Canal: contacto@obrerayzangano.cl.
5. Anotar fecha, alcance y qué se rotó. No publicar el vector.

## Kill switches

| Env | Efecto |
|---|---|
| `AI_ENABLED=false` | Apaga Groq |
| `SII_AUTO_EMIT_BOLETA` ≠ `true` | Checkout no emite 39 |
| `PAYMENT_PROVIDER` | Cambia Flow/TBK (no dejes vacío en prod) |
| `?legacy=1` / `enj_legacy_override` | Fuerza UI pobre (dispositivos 2 GB) |

## CI que manda

`.github/workflows/ci.yml` en `main`/`develop`: tests de **todos** los packages listados + 3 apps, coverage de módulos críticos, build+lint+e2e smoke de Tienda. Un verde de CI no prueba SII real ni un webhook Flow de producción.

Playwright local: `apps/*/e2e`. No sustituye el smoke de dinero.
