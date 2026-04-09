# Despliegue Enjambre Legado (monorepo)

## Requisitos

- Node 20+ local; en Vercel usar **24.x** alineado con `engines` de `apps/*`
- pnpm 10+
- Proyecto Supabase con migraciones aplicadas desde [`packages/database/supabase/migrations/`](packages/database/supabase/migrations/)

## Variables de entorno por app

| App | Variables |
|-----|-----------|
| **nucleo** (Vite) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, opcional: `VITE_API_BASE_URL` (BFF, por defecto `http://localhost:3001`), `VITE_PUBLIC_URL_TIENDA`, `VITE_PUBLIC_URL_CAMPO` |
| **api** (BFF Hono) | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, opcional: `PORT` (por defecto `3001`) |
| **nucleo** (landing Next opcional) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, opcional: `NEXT_PUBLIC_URL_TIENDA`, `NEXT_PUBLIC_URL_CAMPO` |
| **tienda** | `NEXT_PUBLIC_SUPABASE_*`, Transbank (`TRANSBANK_*`), opcional integraciones (`SII_*`, `BANK_*`, `NOTIFY_*`, `BOLETAS_*`, `DTE_*`, `INTEGRATIONS_CRON_SECRET`) — ver sección *Integraciones (tienda)* |
| **campo** | `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` **o** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (obligatorias en Vercel; ver tabla en [`docs/VERCEL.md`](docs/VERCEL.md)); futuras claves sync offline |

Copiar [`apps/nucleo/.env.example`](apps/nucleo/.env.example) a `.env` local.

### Variables de entorno Vercel (núcleo — `enjambre-legado.vercel.app`)

En el proyecto de Vercel que sirve el SPA del núcleo (misma instancia Supabase que tienda y campo):

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima pública |
| `VITE_PUBLIC_URL_TIENDA` | URL absoluta del despliegue de tienda (p. ej. `https://xxx.vercel.app`) |
| `VITE_PUBLIC_URL_CAMPO` | URL absoluta del despliegue de campo |

Tras crear los proyectos de **tienda** y **campo**, copia sus URLs `*.vercel.app` aquí para los enlaces “Ecosistema” en login y panel.

Si usas la landing Next (`pnpm dev:landing` / build de `app/`), define también `NEXT_PUBLIC_URL_TIENDA` y `NEXT_PUBLIC_URL_CAMPO` con los mismos valores para la tarjeta “Comunidad Guardián”.

## Vercel (recomendado)

El monorepo se despliega como **tres proyectos Vercel** (mismo repo, distinto **Root Directory**), salvo que uses una arquitectura multi-zona más avanzada.

1. **Núcleo (SPA Vite):** Root `apps/nucleo` **o** raíz del repo con **Output Directory** `apps/nucleo/dist` y build con Turbo (`--filter=@enjambre/nucleo`). Incluye [`apps/nucleo/vercel.json`](apps/nucleo/vercel.json) (rewrites SPA). Si el Root es la raíz del repositorio, también aplica [`vercel.json`](vercel.json) en la raíz para los mismos rewrites.
2. **Tienda:** Root `apps/tienda`, install desde monorepo (`cd ../.. && pnpm install`), build `pnpm exec turbo run build --filter=@enjambre/tienda` (o equivalente).
3. **Campo:** Root `apps/campo`, mismas pautas con `--filter=@enjambre/campo`.
4. Variables `NEXT_PUBLIC_SUPABASE_*` en tienda y campo; en el núcleo, tabla de arriba.

Checklist detallada: [`docs/VERCEL.md`](docs/VERCEL.md).

5. Dominios sugeridos (opcional, tras estabilizar `*.vercel.app`):
   - Tienda: `obrerayzangano.com` o subdominio `tienda.*`
   - Núcleo: `app.obrerayzangano.com`
   - Campo: `campo.obrerayzangano.com`

## Webpay / Transbank

Usar `transbank-sdk` en **API Routes** de Next (`apps/tienda`) o Edge Functions; nunca exponer secretos en el cliente. Documentar `COMMERCE_CODE`, `API_KEY` solo en servidor.

## Integraciones (tienda): SII, bancos, notificaciones

### Matriz: base de datos vs variables de entorno

| Ubicación | Contenido permitido |
|-----------|---------------------|
| Tabla `integrations`, columna `config` | Solo datos **no secretos**: proveedor (`provider`), URL pública de API (`baseUrl`), notas operativas (`notes`). El API admin **rechaza** claves tipo `apiKey`, `token`, `password`, etc., y **redacta** respuestas `GET` por si hubiera datos legados. |
| `process.env` / Vercel / hosting | Credenciales: `SII_*`, `BANK_*`, `NOTIFY_*` (p. ej. `NOTIFY_SMTP_PASS`, `NOTIFY_SENDGRID_API_KEY`), `BOLETAS_API_KEY`, `DTE_API_TOKEN`, `TRANSBANK_*`. Lista en [`apps/tienda/.env.example`](apps/tienda/.env.example). |
| Tabla `integration_job_runs` | Auditoría de jobs (`manual` / futuro `cron`). Aplicar migración [`07_integration_job_runs.sql`](packages/database/supabase/migrations/07_integration_job_runs.sql). |

El panel `/integrations` muestra un indicador **“variables de entorno detectadas”** por integración (booleano); **nunca** expone valores.

### Comportamiento actual (stubs)

- **SII:** `POST /api/admin/sii/sync` ejecuta el runner en [`apps/tienda/lib/integrations/run-sii-sync.ts`](apps/tienda/lib/integrations/run-sii-sync.ts). El conector registrado hoy es **stub**: escribe en `integration_job_runs` pero **no** llama al SII. Respuesta HTTP **202** con `mode: "stub"` cuando aplica.
- **Notificaciones:** `POST /api/admin/notifications/test` registra un evento de prueba; **202** y `mode: "stub"` hasta configurar env real de envío.

### Riesgos y expectativas (Chile)

- **SII / DTE:** suelen exigir certificado digital, flujos oficiales o proveedor certificado; no basta con una URL en el panel.
- **Bancos:** APIs reguladas (p. ej. Open Finance) requieren consentimiento del titular y acuerdos por institución; la carga **CSV** en el admin sigue siendo un camino válido para conciliación sin API.

### Cron / jobs programados (futuro)

1. Definir `INTEGRATIONS_CRON_SECRET` solo en el servidor.
2. Opción A: **Vercel Cron** que haga `POST` a una ruta interna (p. ej. bajo `apps/tienda/app/api/...`) enviando header `x-cron-secret` o `Authorization: Bearer <INTEGRATIONS_CRON_SECRET>`.
3. Opción B: **Supabase `pg_cron`** + `net.http_post` hacia la misma ruta protegida.
4. Los jobs deben insertar filas en `integration_job_runs` con `trigger_type: 'cron'` para distinguirlos de ejecuciones manuales desde el panel.

## Puertos locales (desarrollo)

- `pnpm dev` ejecuta Turbo: **nucleo** (Vite, puerto por defecto 5173), **tienda** (Next, 3000), **campo** (Next, 3002), **api** (Hono, `3001` si añades el script al pipeline). Si hay conflicto, ajustar scripts en cada `package.json`.
- BFF contable: `pnpm --filter @enjambre/api dev` → `GET /api/health/live` (público), `GET /api/health/ready` (requiere `Authorization: Bearer <access_token>`). Las rutas `/api/contable/*` usan el mismo JWT en cada request para que **RLS de Supabase** aplique con `auth.uid()`.

## Mudanza desde otro repo (p. ej. `trama` / `APP MAYOr`)

El **monorepo canónico** del producto Enjambre + módulo contable vive en esta carpeta (`enjambre-legado` / app OYZ). Lo implementado aquí (`packages/contable`, `apps/api`, migraciones en `packages/database/supabase/migrations/05_*` y `06_*`, ruta `/contable` en `apps/nucleo`) sustituye la necesidad de mantener un proyecto Next+Prisma separado solo para contabilidad. Tras copiar/verificar que no queda código único en el repo antiguo, puedes **archivar o eliminar** el otro proyecto; antes: aplicar migraciones Supabase en el proyecto destino y poblar `usuarios_empresas` + empresa de prueba.

## Prueba de carga / feria

- Simular concurrencia en `ventas` y cola offline (`@enjambre/offline` + Dexie) antes de eventos masivos.
- Revisar límites de Supabase (conexiones, RLS) con usuarios de prueba por rol.