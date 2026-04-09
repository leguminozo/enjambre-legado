# Checklist: proyecto Vercel `enjambre-legado.vercel.app`

Usa esta lista en **Vercel → Project → Settings → General / Build & Development** para alinear el despliegue con el monorepo.

## Proyecto principal (núcleo — SPA Vite)

Objetivo: servir el build de [`apps/nucleo`](../apps/nucleo) (React Router). [`apps/nucleo/vercel.json`](../apps/nucleo/vercel.json) añade rewrites para que rutas como `/gerente` no fallen al refrescar. Si el **Root Directory** es la raíz del repositorio (no `apps/nucleo`), Vercel lee [`vercel.json`](../vercel.json) en la raíz; ese archivo repite los mismos rewrites para el SPA.

| Configuración | Valor recomendado |
|---------------|-------------------|
| **Root Directory** | Vacío (raíz del repositorio) **o** `apps/nucleo` (ver nota abajo) |
| **Framework Preset** | Other / Vite (o Nixpacks si auto) |
| **Install Command** | Si root es repo: `pnpm install`. Si root es `apps/nucleo`: `cd ../.. && pnpm install` |
| **Build Command** | Desde **raíz del repo**: `pnpm exec turbo run build --filter=@enjambre/nucleo`. Desde `apps/nucleo`: `pnpm run build` (tras instalar workspace desde raíz) |
| **Output Directory** | `apps/nucleo/dist` (si Root = repo) **o** `dist` (si Root = `apps/nucleo`) |

**Variables de entorno (Production):** ver [`DEPLOY.md`](../DEPLOY.md#variables-de-entorno-vercel-núcleo).

## Proyecto adicional: tienda (Next.js)

| Configuración | Valor recomendado |
|---------------|-------------------|
| **Root Directory** | `apps/tienda` |
| **Install Command** | `cd ../.. && pnpm install` |
| **Build Command** | `cd ../.. && pnpm exec turbo run build --filter=@enjambre/tienda` **o** `pnpm run build` si el install ya dejó `node_modules` en la raíz |

Vercel detecta Next.js y usa el output correcto (`.next`).

## Proyecto adicional: campo (Next.js)

Igual que tienda con `apps/campo` y `--filter=@enjambre/campo`.

## Tras crear tienda y campo

Copia las URLs `*.vercel.app` de cada proyecto y configúralas en el proyecto del núcleo como `VITE_PUBLIC_URL_TIENDA` y `VITE_PUBLIC_URL_CAMPO` para que los enlaces del ecosistema apunten a los despliegues reales.
