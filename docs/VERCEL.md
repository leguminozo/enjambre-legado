# Checklist: proyecto Vercel `enjambre-legado.vercel.app`

Usa esta lista en **Vercel → Project → Settings → General / Build & Development** para alinear el despliegue con el monorepo.

## Proyecto principal (nucleo — Next.js 16)

Objetivo: servir el build de [`apps/nucleo`](../apps/nucleo) (Next.js 16 App Router + Hono BFF). La fuente de verdad de install/build/output es [`apps/nucleo/next.config.ts`](../apps/nucleo/next.config.ts).

### Recrear / alinear proyecto «nucleo» en Vercel

1. **Conectar** el repo `guillermoc2710-cmd/enjambre-legado`, rama `main`.
2. **Root Directory:** `apps/nucleo` (sin barra final).
3. **Framework Preset:** Next.js.
4. **Node.js:** 24.x (en *Settings → General* y `engines` en `apps/nucleo/package.json`; alineado con el monorepo).
5. **Build & Development:** activa **Override** en los tres y pega exactamente (evita el «default» que solo instala en la subcarpeta):

| Campo | Valor |
|--------|--------|
| **Install Command** | `cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile` |
| **Build Command** | `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=@enjambre/nucleo` |
| **Output Directory** | Dejar default (Next / `.next`) |

Si los overrides están **apagados**, Vercel debería leer `next.config.ts`; si el build falla, fuerza los overrides de arriba.

6. **Variables de entorno (Production)** — copia la URL y la clave **tal cual** desde Supabase → *Settings → API* (un carácter mal y falla el cliente):

| Clave | Valor |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` (ej. `hdhamxiblwwskvvqbcfo.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT anon `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (para BFF routes) |

**Nota historica:** Nucleo migro de Vite SPA a Next.js 16. Las variables `VITE_*` ya no aplican; usar `NEXT_PUBLIC_*` para client-side y sin prefijo para server-only.

### BFF (Nucleo)

- Las rutas BFF estan en `apps/nucleo/src/app/api/[[...routes]]/route.ts` (Hono dentro de Next.js).
- Endpoints: `/api/tienda/*`, `/api/banco-chile/*`, `/api/contable/*`, `/api/security-events/*`, etc.
- Health checks: `GET /api/health/live` (liveness), `GET /api/health/ready` (readiness con Bearer)

## Proyecto adicional: tienda (Next.js)

Fuente de verdad: [`apps/tienda/vercel.json`](../apps/tienda/vercel.json).

| Configuración | Valor |
|---------------|--------|
| **Root Directory** | `apps/tienda` |
| **Framework** | Next.js |
| **Node.js** | 24.x (`engines` en `apps/tienda/package.json`) |
| **Install Command** (override) | `cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile` |
| **Build Command** (override) | `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=@enjambre/tienda` |
| **Output** | Dejar default (Next / `.next`) |

Variables: `NEXT_PUBLIC_SUPABASE_*`, Transbank solo servidor (`TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_KEY`). Opcional: integraciones **solo servidor** (`SII_*`, `BANK_*`, `NOTIFY_*`, `BOLETAS_*`, `DTE_*`, `INTEGRATIONS_CRON_SECRET` para cron futuro). No pongas secretos en `integrations.config` en Supabase; ver matriz en [`DEPLOY.md`](../DEPLOY.md) → *Integraciones (tienda)*.

**Rutas:** `/` landing, `/catalogo`, `/impacto`, `/login` (demo `admin@verano.com` / `password`), panel `/dashboard`, `/products`, `/orders`, `/customers`, `/collections`.

## Proyecto adicional: campo (Next.js)

Fuente de verdad: [`apps/campo/vercel.json`](../apps/campo/vercel.json).

| Configuración | Valor |
|---------------|--------|
| **Root Directory** | `apps/campo` (obligatorio; si es la raíz del repo, el build puede ser otra app o faltar variables). |
| **Framework** | Next.js |
| **Node.js** | 24.x (`engines` en `apps/campo/package.json`) |
| **Install Command** (override) | `cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile` |
| **Build Command** (override) | `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=@enjambre/campo` |
| **Output** | Dejar default (Next / `.next`) |

### Variables de entorno (Production y Preview)

Copiar desde Supabase → *Settings → API* (mismo proyecto que tienda si comparten backend):

| Variable | Obligatoria | Notas |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Una de las dos | Clave publishable `sb_publishable_...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Una de las dos | JWT anon `eyJ...` (equivalente público) |

Tras guardar, **Redeploy** (sin caché si el error persiste).

### Si ves `500` con `MIDDLEWARE_INVOCATION_FAILED`

Suele ser el middleware de Next que lanza antes (p. ej. variables `NEXT_PUBLIC_SUPABASE_*` ausentes en Edge). En código actual:

- Si faltan esas variables, el middleware **no lanza**: reescribe a [`/setup-error`](../apps/campo/src/app/setup-error/page.tsx) y las rutas `/api/*` responden **503** JSON.
- Si tras desplegar sigue un 500, revisa **Deployment → Functions / Logs** del middleware y confirma **Root Directory** = `apps/campo`.

**Rutas útiles:** `/` landing, `/login`, `/pos/catalogo`, `/pos/carrito`, `POST /api/pos/venta` (requiere sesión y fila en `profiles` para `vendedor_id`).

## Tras crear tienda y campo

Copia las URLs `*.vercel.app` de cada proyecto. Nucleo ya no necesita `VITE_PUBLIC_URL_TIENDA` ni `VITE_PUBLIC_URL_CAMPO` (migro a Next.js con SSR). Si se requieren URLs cross-app, configurar como `NEXT_PUBLIC_*` en nucleo.

## Raíz del repo y `vercel.json`

En la raíz del monorepo hay un [`vercel.json`](../vercel.json) orientado al nucleo (legacy del Vite SPA). **No** uses ese proyecto Vercel como sustituto de **tienda** o **campo** (Next): cada app Next debe ser un **proyecto Vercel separado** con su **Root Directory** (`apps/tienda` o `apps/campo`) y sus variables.
