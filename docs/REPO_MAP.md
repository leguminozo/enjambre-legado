# Mapa vivo del monorepo

> **Clase: VIVO.** Censo 2026-08-23. Si el código de `main` no coincide, gana el código y se corrige este archivo en el mismo cambio.
> Índice: [`README.md`](./README.md). Dominios: [`DOMAINS.md`](./DOMAINS.md). Contratos: [`CROSS_APP.md`](./CROSS_APP.md). Palabras: [`GLOSSARY.md`](./GLOSSARY.md). Cuotas: [`CONSTITUTION.md`](./CONSTITUTION.md) § II.6. Offline: [`CAMPO_OFFLINE.md`](./CAMPO_OFFLINE.md).

## Una frase

Tres apps Next.js 16 en **tres proyectos Vercel**, **un** Postgres Supabase, BFF Hono solo en Núcleo. No hay cuarta app. No hay `@enjambre/offline`. No hay `apps/eirl` (absorbido en Núcleo).

## Apps

| Filter | Dir | Dev | Qué es | Qué no es |
|---|---|---|---|---|
| `@enjambre/tienda` | `apps/tienda` | `:3001` | Storefront D2C + perfil guardian + CMS leído. Pagos vía BFF Núcleo (Flow / Transbank). `next-intl` (es + en). | Admin de productos vive en Núcleo. No es el BFF. |
| `@enjambre/nucleo` | `apps/nucleo` | `:3000` (default Next) | Dashboard multi-rol + **único BFF** (`app/api/[[...routes]]`, Hono) + contable/fiscal + patio apícola + editor de tienda. Crons. | No es Vite. `VITE_*` está muerto. |
| `@enjambre/campo` | `apps/campo` | `:3002` | POS `rep_ventas` / feria. PWA. **Offline-first Dexie.** | No es el patio (`apicultor` = Núcleo). No usa un package `offline`. |

Prohibido un cuarto proyecto Vercel en horizonte Hobby. Detalle de deploy: [`VERCEL.md`](./VERCEL.md), [`../DEPLOY.md`](../DEPLOY.md).

## Packages (`packages/*`) — 17

| Package | Para qué | Consumidores típicos |
|---|---|---|
| `@enjambre/database` | Migraciones SQL + `database.types.ts`. **226** archivos en `supabase/migrations/`. | typegen; nadie importa SQL en runtime |
| `@enjambre/auth` | Clientes Supabase y sesión. Exports: `.` `/browser` `/server-index` `/middleware` `/security-events` `/role-redirect` `/in-app-notifications` `/notification-preferences` `/internal-api-secret` | las 3 apps |
| `@enjambre/ui` | Design system (50+ componentes en `src/components/`), tokens, loaders de imagen CDN, polyfills iOS 15 | las 3 apps |
| `@enjambre/contable` | IVA, RUT, DTE XML, F29/F22/PPM, **15 parsers** de recibos en `src/domain/receipt-parsers/` | Núcleo, fiscal |
| `@enjambre/fiscal` | Emisión DTE nativa, jobs SII | Núcleo BFF |
| `@enjambre/pricing` | Multiplicadores, carrito, lealtad checkout | Tienda + Núcleo |
| `@enjambre/logistica` | Envíos / courier | Núcleo, Tienda |
| `@enjambre/banco-chile` | API Empresas + conciliación | Núcleo |
| `@enjambre/sumup` | Terminal POS | Campo / Núcleo |
| `@enjambre/wallet` | Apple/Google Wallet | Tienda / Núcleo |
| `@enjambre/resenas` | Anónima vs guardian | Tienda / Núcleo |
| `@enjambre/calendar` | Calendario compartido | Núcleo |
| `@enjambre/rate-limit` | Rate limit canónico | Tienda (y quien lo reexporte) |
| `@enjambre/impacto` | Metodología open-book (coeficientes, fórmulas, IRR) | Núcleo + Tienda (snapshot no público) |
| `@enjambre/ciencia` | Catálogo de afirmaciones científicas publicables (gate: solo trianguladas) | Tienda (páginas públicas) |
| `@enjambre/sale-qr` | QR de venta | Campo |
| `@enjambre/shop-chrome` | Chrome CMS de tienda (brand, menú, theme) | Tienda, editor en Núcleo |

### No existen (no los crees, no los documentes como hechos)

| Nombre fantasma | Qué hay en su lugar |
|---|---|
| `@enjambre/offline` | `apps/campo/src/lib/offline/` — ver [`CAMPO_OFFLINE.md`](./CAMPO_OFFLINE.md) |
| `apps/eirl` | Vistas en `apps/nucleo/src/views/eirl/` |
| Cliente SQL / `DATABASE_URL` | supabase-js HTTP. Pooler `6543` solo el día que nazca un cliente Postgres |

## Plano de datos

```
Tienda (ISR declarado; layout aún llama headers() → muchas rutas salen ƒ)
  → supabase-js (catálogo, CMS, perfil) + POST Núcleo /api/checkout/*

Campo
  → Dexie (lectura/escritura local) → sync_queue → BFF Núcleo / Supabase
  → no supabase.insert() desde UI

Núcleo
  → supabase-js server + service_role solo en BFF
  → Hono: caja, POS replay, fiscal, CMS write, pagos, seguridad

Postgres 17 + PostGIS + RLS
  → helpers: jwt_app_role(), current_role(), is_admin(), is_gerente(), has_empresa_access()
  → STABLE + search_path = '' (mig 20260814200000; aplicar en remoto)
  → app_metadata.role = plataforma; app_metadata.oyz_role = comercial (embajador/…)
```

Storage público (productos, CMS): WebP en origen + `Cache-Control: 31536000`. `<Image>` usa loader local `apps/*/image-loader.ts` (no optimizer de Vercel).

## Auth — puntos de entrada

Servidor **nunca** importa el barrel `@enjambre/auth` (trae hooks React). Usar:

- browser: `@enjambre/auth` o `/browser`
- server: `/server-index`
- middleware Edge: `/middleware`
- eventos: `/security-events`
- mapas de rol: `/role-redirect`

Roles de plataforma: `admin` | `apicultor` | `territorial` | `rep_ventas` | `cliente` | `creador`. Legacy (`gerente`, `vendedor`, …) → `admin` vía `LEGACY_ROLE_MAP`. `apicultor` **no** se eleva. Detalle: [`ROLES_Y_ACCESO.md`](./ROLES_Y_ACCESO.md).

## Crons (solo Núcleo)

Fuente: `apps/nucleo/vercel.json`. **Diarios.** Hobby no es un worker de 60 s.

| UTC | Path | Oficio |
|---|---|---|
| `0 8 * * *` | `/api/cron/notifications` | Barre `notification_queue`. El camino caliente es enqueue + trigger post-mutación. |
| `0 13 * * *` | `/api/cron/fiscal` | Jobs SII / CAF. |
| `0 14 * * *` | `/api/cron/checkout` | Reposición / dunning / abandono. |

## Realtime (allowlist)

Permitido: monitor de feria, caja, carrito multi-dispositivo (`carrito_items`), campana in-app. Un dashboard nuevo hace **poll-on-focus**. No suscribir `postgres_changes` “por si acaso”.

## Stack (versiones de trabajo)

| Capa | Hecho |
|---|---|
| Workspace | Turborepo + pnpm 10.32.1, Node 24.x en Vercel (local puede ser 22) |
| UI | React 19, Next 16.2, Tailwind 3, tokens `@enjambre/ui` |
| Datos | Supabase (Postgres 17 + PostGIS + RLS), supabase-js HTTP |
| BFF | Hono dentro de Next (Núcleo) |
| Pagos | `PAYMENT_PROVIDER`: Flow y/o Transbank. No “solo Transbank”. |
| i18n tienda | `next-intl`, `messages/es.json` + `en.json` |
| Tests | Vitest en packages y apps. Playwright `e2e/` en las 3 apps. |

## Comandos

```bash
pnpm install
pnpm --filter @enjambre/tienda dev    # :3001
pnpm --filter @enjambre/nucleo dev    # :3000
pnpm --filter @enjambre/campo dev     # :3002
pnpm --filter @enjambre/<app> build
pnpm test                             # unitario workspace
cd packages/database && pnpm db:typegen
pnpm go-live:db-push                  # aplica migraciones remotas
```

Tras cambiar schema: migración en `packages/database/supabase/migrations/` (prefijo **único**; la colisión `20260822000000` — apiario bidireccional + calendario isolation con igual prefijo — se resolvió renombrando a `20260822000001`; no copies ese patrón) → typegen → nota en `DATABASE_SCHEMA.md` si tocaste médula.

## Hueco conocido (no lo “arregles” de pasada)

El catálogo declara `export const revalidate = 120` pero `apps/tienda/app/layout.tsx` hace `await headers()` (nonce CSP) → el build marca casi toda la tienda como dinámica. La ley (lecturas públicas baratas) está por delante del layout. Sacar `headers()` sin otro camino de nonce es cambio de seguridad.

*Actualizar este archivo cuando nazca/muera un package, un cron, un entry de auth o una app.*
