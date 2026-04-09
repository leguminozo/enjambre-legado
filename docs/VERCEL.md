# Checklist: proyecto Vercel `enjambre-legado.vercel.app`

Usa esta lista en **Vercel → Project → Settings → General / Build & Development** para alinear el despliegue con el monorepo.

## Proyecto principal (núcleo — SPA Vite)

Objetivo: servir el build de [`apps/nucleo`](../apps/nucleo) (React Router). La fuente de verdad de install/build/output es [`apps/nucleo/vercel.json`](../apps/nucleo/vercel.json) (rewrites SPA + monorepo).

### Recrear / alinear proyecto «nucleo» en Vercel

1. **Conectar** el repo `guillermoc2710-cmd/enjambre-legado`, rama `main`.
2. **Root Directory:** `apps/nucleo` (sin barra final).
3. **Framework Preset:** Vite.
4. **Node.js:** 24.x (en *Settings → General* y `engines` en `apps/nucleo/package.json`; alineado con el monorepo).
5. **Build & Development:** activa **Override** en los tres y pega exactamente (evita el «default» que solo instala en la subcarpeta):

| Campo | Valor |
|--------|--------|
| **Install Command** | `cd ../.. && npx pnpm@10.32.1 install --frozen-lockfile` |
| **Build Command** | `cd ../.. && npx pnpm@10.32.1 exec turbo run build --filter=@enjambre/nucleo` |
| **Output Directory** | `dist` |

Si los overrides están **apagados**, Vercel debería leer igualmente `vercel.json`; si el build falla, fuerza los overrides de arriba.

6. **Variables de entorno (Production)** — copia la URL y la clave **tal cual** desde Supabase → *Settings → API* (un carácter mal y falla el cliente):

| Clave | Valor |
|--------|--------|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` (ej. `hdhamxiblwwskvvqbcfo.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | clave publishable `sb_publishable_...` **o** |
| `VITE_SUPABASE_ANON_KEY` | JWT anon `eyJ...` (solo una de las dos claves hace falta) |

No uses `NEXT_PUBLIC_*` solo para el SPA Vite salvo que también compiles la landing Next en el mismo proyecto.

**Antigua referencia (root = repo vs `apps/nucleo`):** si el Root Directory fuera la raíz del monorepo, Output sería `apps/nucleo/dist` y los comandos usarían la raíz sin `cd ../..`.

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

Variables: `NEXT_PUBLIC_SUPABASE_*`, Transbank solo servidor (ver `DEPLOY.md`).

## Proyecto adicional: campo (Next.js)

Igual patrón que tienda: añade [`apps/campo/vercel.json`](../apps/campo/vercel.json) con `--filter=@enjambre/campo` si aún no existe; **Root** `apps/campo`, Node 24.x, mismos comandos `npx pnpm@10.32.1`.

## Tras crear tienda y campo

Copia las URLs `*.vercel.app` de cada proyecto y configúralas en el proyecto del núcleo como `VITE_PUBLIC_URL_TIENDA` y `VITE_PUBLIC_URL_CAMPO` para que los enlaces del ecosistema apunten a los despliegues reales.
