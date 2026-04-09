# Despliegue Enjambre Legado (monorepo)

## Requisitos

- Node 20+
- pnpm 10+
- Proyecto Supabase con migraciones aplicadas desde [`packages/database/supabase/migrations/`](packages/database/supabase/migrations/)

## Variables de entorno por app

| App | Variables |
|-----|-----------|
| **nucleo** (Vite) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, opcional: `VITE_PUBLIC_URL_TIENDA`, `VITE_PUBLIC_URL_CAMPO` |
| **nucleo** (landing Next opcional) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, opcional: `NEXT_PUBLIC_URL_TIENDA`, `NEXT_PUBLIC_URL_CAMPO` |
| **tienda** | `NEXT_PUBLIC_SUPABASE_*`, claves Transbank/Webpay según integración |
| **campo** | Mismas públicas Supabase + futuras claves sync |

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

## Puertos locales (desarrollo)

- `pnpm dev` ejecuta Turbo: **nucleo** (Vite, puerto por defecto 5173), **tienda** (Next, 3000), **campo** (Next, 3002). Si hay conflicto, ajustar scripts en cada `package.json`.

## Prueba de carga / feria

- Simular concurrencia en `ventas` y cola offline (`@enjambre/offline` + Dexie) antes de eventos masivos.
- Revisar límites de Supabase (conexiones, RLS) con usuarios de prueba por rol.
pued