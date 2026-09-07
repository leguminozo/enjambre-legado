# AGENTS.md — Enjambre Legado

> Cross-agent configuration file. Works with Claude, Cursor, Windsurf, Gemini, Copilot, Trae.
> Read BEFORE any code modification.

## Project Overview

**Enjambre Legado** — Biocultural regeneration operating system.
Monorepo managed by Turborepo + pnpm. 3 apps, all on Vercel + Supabase.

## Read First

1. `docs/README.md` — índice: ley vs vivo vs snapshot. **Empieza aquí.**
2. `docs/REPO_MAP.md` + `docs/GLOSSARY.md` + `docs/DOMAINS.md`
3. `docs/CONSTITUTION.md` + `system_invariants.md` + `docs/TRUST.md`
4. `docs/CROSS_APP.md` · `docs/MONEY_PATH.md` · `docs/PRODUCTION.md` si cruzas apps, plata o deploy
5. `docs/AGENT_INSTRUCTIONS.md`
6. Dominio: `docs/CAMPO_OFFLINE.md` · spec del dueño en `DOMAINS` · `docs/DATABASE_SCHEMA.md`

## Inviolable Rules

### Code Style
- Named exports only (`export function X`). No `export default` except Next.js pages.
- TypeScript strict. No `any`. Use `unknown` + type guards.
- Props always typed with `interface ComponentProps`.
- No comments unless explaining "why" (not "what").

### Styling
- Tailwind CSS semantic tokens only: `bg-background`, `text-foreground`, `text-primary`, `text-muted-foreground`, `bg-card`, `border-border`, `text-destructive`, `text-primary-foreground`, `bg-surface-raised`, `bg-surface-sunken`.
- No hardcoded hex colors in components. No `text-white`, `bg-black`, `text-stone-*`, `bg-gray-*`, etc.
- Dark mode default. Cormorant Garamond for display. GSAP for animations.
- Design tokens in `packages/ui`. Campo `tailwind.config.js` maps `@enjambre/ui` CSS vars to Tailwind classes.

### Database
- All schema changes via migrations in `packages/database/supabase/migrations/`.
- RLS mandatory for every table with user data.
- Use `current_role()`, `is_admin()`, `is_gerente()`, `has_empresa_access()`, `jwt_app_role()` for policies.
- Those helpers are `STABLE` + `SET search_path = ''`. `SECURITY DEFINER` is not a performance default — only when the body needs privilege **and** checks `auth.uid()` / `has_empresa_access()`.
- Regenerate types after migration: `cd packages/database && pnpm db:typegen`.

### Platform budget (Vercel Hobby + Supabase Free, Aug 2026)
- **Three Next apps, one Postgres, no fourth Vercel project.** Núcleo BFF is the only expensive write plane.
- Public reads: ISR / Dexie / Storage CDN. Do not SSR a catalog hit against Postgres on every visitor.
- `next/image` uses `cdn-image-loader` (`@enjambre/ui/cdn-image-loader`) — never Vercel Image Optimization (5k transforms/account/month). Origin is already WebP + `Cache-Control: 31536000`.
- Crons: daily only (`apps/nucleo/vercel.json` 08/13/14 UTC). Queue + fire-on-mutation for mail. No sub-hour crons on Hobby.
- Default data path is supabase-js HTTP. Direct Postgres in a function requires Transaction pooler (`6543`).
- Realtime is not the default. Allowed: feria monitor, caja, cart multi-device, notification bell. New dashboards: poll-on-focus.
- Server graph: `@enjambre/auth/server-index` (or `/middleware`, `/security-events`). `optimizePackageImports` must include `@enjambre/ui`. No GSAP/Leaflet/Cytoscape in Route Handlers.
- Hobby is non-commercial. $0 is runway, not a forever license for a store that sells honey. Code must still be cheap enough to live there as long as possible.

Canonical numbers and the full law: `docs/CONSTITUTION.md` § II.6.

## App Commands

```bash
pnpm install # Install all
pnpm dev # Dev all apps
pnpm --filter @enjambre/tienda dev # Tienda (Next.js 16)
pnpm --filter @enjambre/nucleo dev # Nucleo (Next.js 16, Hono BFF)
pnpm --filter @enjambre/campo dev # Campo (Next.js 16)
pnpm --filter @enjambre/<app> build # Build specific app
pnpm build # Build all
```

## Architecture Quick Map

Censo completo (17 packages, 235 migraciones, puertos, crons, lo que **no** existe): [`docs/REPO_MAP.md`](docs/REPO_MAP.md). Offline Campo: [`docs/CAMPO_OFFLINE.md`](docs/CAMPO_OFFLINE.md).

```
apps/tienda → D2C + perfil + CMS (Next 16 :3001, Flow/Transbank vía BFF, next-intl)
apps/nucleo → Dashboard + único BFF Hono + fiscal/contable (:3000)
apps/campo → POS feria, Dexie first (Next 16 :3002) — no patio; no @enjambre/offline
packages/* → 17 (database, auth, ui, contable, fiscal, pricing, logistica, banco-chile, sumup, wallet, resenas, calendar, rate-limit, sale-qr, shop-chrome, ciencia, impacto)
```

## Surgery Protocol

1. **Investigate** before editing (grep/glob for similar patterns)
2. **Plan** if change affects 3+ files
3. **Execute** minimal, verifiable changes
4. **Verify** with `pnpm --filter @enjambre/<app> build`
5. **Document** if schema or architecture changes

## Anti-Patterns (Forbidden)

| Don't | Do Instead |
|---|---|
| `export default function` | `export function Component` |
| `any` type | `unknown` + type guard |
| Hardcoded hex (`#fff`) | Semantic tokens (`bg-background`) |
| Hardcoded Tailwind (`text-white`, `bg-black`, `text-stone-*`) | Semantic tokens (`text-foreground`, `bg-background`, `text-muted-foreground`) |
| `catch(e) {}` | `toast.error()` + logging |
| Offline-First Sync Queues | Allowed and actively used in `apps/campo` — follow the existing Dexie-based implementation. Key references: `apps/campo/src/lib/offline/db.ts` (Dexie schema: `productos`, `sync_queue`), enqueue examples in `apps/campo/src/components/pos/cash-context.tsx`, and the sync processor in `apps/campo/src/hooks/use-sync-engine.ts`. Do NOT create ad-hoc Supabase service-role clients in apps; continue to use the `apps/*/lib` re-exports and `@enjambre/auth` entry points. |
| Default `next/image` optimizer | `loaderFile` → `@enjambre/ui/cdn-image-loader` |
| Cron más frecuente que diario | Outbox + trigger en la mutación; crons de Núcleo ya son diarios |
| `SECURITY DEFINER` para “ir más rápido” | Helper `STABLE` + `search_path = ''`; DEFINER solo con check de caller |
| Components at repo root | `packages/ui` or `apps/*/components` |
| Massive refactors | Surgical, minimal changes |
| Skip build verification | Always build after changes |
| `supabase.auth.getSession()` para verificar sesión | `supabase.auth.getUser()` (valida la firma del JWT con el servidor, previniendo falsificaciones) |
| Confiar en `user` / `user_metadata` para roles | Confiar únicamente en `app_metadata` o en la tabla `profiles` (el usuario puede autodeclarar `user_metadata` a través del cliente) |
| `100dvh`/`100svh` sin fallback | `min-h-[var(--vh-full)]` / `min-h-[var(--svh-full)]` / `h-[var(--vh-full)]` (token compartido en `packages/ui/src/tokens.css` con `@supports` → 100vh en iOS < 15.4, 100dvh/100svh en modernos). NO usar pares `min-h-screen min-h-[100dvh]`: Tailwind ordena las arbitrarias antes que las de tema y la regla 100vh ganaría en modernos. NO usar la forma v4 `min-h-(--vh-full)`: no genera CSS en los apps con tailwindcss ^3 (bug que colapsaba el hero/login/shells). |
| `:has()` funcional en CSS (barras fijas, overlays) | data-attributes seteados por React (ver `StickyBarSensor` en tienda). `:has()` es 15.4+; los cosméticos se documentan como mejora progresiva. |
| APIs modernas sin cubrir (`.at()`, `Object.hasOwn`, `structuredClone`…) | Verificar que estén en `LegacyBrowserPolyfills` o el build falla con `node scripts/compat-audit.mjs apps/<app>` |

## Compatibilidad de Navegadores (Safari/iOS 15)

**Matriz de soporte** (Next.js 16 exige oficialmente Safari 16.4+, pero el piso real soportado es iOS 15.4+, ej. iPhone 7):

| Nivel | Soporte |
|---|---|
| iOS 16+ / Safari 16.4+ | Full |
| iOS 15.4–15.8 (Safari 15.4+) | Soportado con la capa de compat: `LegacyBrowserPolyfills` + fallbacks CSS. Rendimiento según dispositivo (iPhone 7 = 2GB RAM: flujos core OK, dashboards 3D/mapas pesados) |
| iOS < 15.4 | Sin garantía; degrada (cosmético), no bloquea |

**Mecánica de la capa de compat** (`packages/ui`):
- `LegacyBrowserPolyfills` → script inline ES5 en `<head>` de los 3 root layouts (corre ANTES del runtime de Next) que instala con feature-detection: `Array.prototype.at`, `Object.hasOwn`, `findLast/findLastIndex`, `String.replaceAll`, `Promise.withResolvers`, `structuredClone` (fallback JSON), y ES2023/24: `toSorted/toReversed/toSpliced/with`, `isWellFormed/toWellFormed`, `Object.groupBy`, `Map.groupBy`.
- `LegacyDeviceDetect` → script inline ES5 en `<head>` que setea `data-legacy="true"` en `<html>` (UA iOS ≤ 15, o `deviceMemory ≤ 1` **y** `hardwareConcurrency ≤ 2`, o override `?legacy=1` / `localStorage.enj_legacy_override`) y `data-motion="reduce"` (`prefers-reduced-motion`). Consumir en componentes con `useLegacyDevice()` (packages/ui). La capa CSS `html[data-legacy='true']` aplana `backdrop-filter` y la clase `.enj-blur-orb` (orbes decorativos).
- `ErrorRevealHarness` → panel en pantalla cuando hay errores JS (solo dev/preview, verificado en los 3 layouts) + heartbeat de eviction: si la pestaña anterior murió sin unload limpio (probable OOM en 2GB), avisa en la siguiente carga. NO es cosmético: es la única forma de ver el error real.
- Regla de oro: **si el audit detecta una API nueva sin cubrir, se agrega a `LegacyBrowserPolyfills` con su unit test** (`packages/ui/src/components/legacy-browser-polyfills.test.ts`) y se marca `covered: true` en `compat-audit.mjs` — nunca silenciar el audit.
- `node scripts/compat-audit.mjs apps/<app>` escanea `.next/static` post-build y falla el build ante sintaxis no parseable (lookbehind, import attributes) o APIs runtime no cubiertas (`AbortSignal.timeout`, `fromAsync`, `URL.canParse`, `navigator.deviceMemory` sin guard…). Corre después de `next build` (encadenado en el script `build` de los 3 apps y en `vercel.json` de tienda/campo).
- Gates de rendimiento (tier legacy): ver `docs/LEGACY_TIER.md`. Criterio: canvas/WebGL/partículas/realtime/mapas → fallback estático; el CSS degrada blur; `MotionConfig reducedMotion` en nucleo.

**Service worker (@serwist en nucleo/campo)**: evaluado como NO factor de riesgo — assets con hash (sin stale-cache), HTML NetworkFirst, registro auto-guardado por feature-check. No agregar guardas UA que rompan PWA/offline sin evidencia nueva.

**Riesgo conocido (mitigado en dev/preview, no en producción)**: si un dispositivo legacy mata la pestaña por memoria (no es un error JS capturable), el harness no lo mostrará en el momento; el heartbeat de eviction lo detecta en la siguiente carga. Plan B: reducir payload del login o entry estático legacy.

## Auth Package Convention

`@enjambre/auth` tiene seis puntos de entrada:
- **`@enjambre/auth`** — browser/cliente: `createClient()`, `createAdminClient()` (service_role), `useAuthStore`, `useRoleBasedRedirect`, `logSecurityEvent`, `useAuthProvider`, `useSecurityAlerts`, `ALL_ADMIN_ROLES`, `ROUTE_ROLE_GUARDS`, `getRoleRedirectPath()`, `isRouteAllowed()`, types (`AuthUser`, `SecurityEventType`, `SecurityEvent`, `SecurityEventPayload`, `AppSource`)
- **`@enjambre/auth/browser`** — browser-only subset: `createClient()`, `createAdminClient()`, `getSupabaseUrl()`, `getSupabaseKey()`, `isSupabaseConfigured()`
- **`@enjambre/auth/server-index`** — server-only: `createServerClientFromCookies()`, `createAuthMiddleware()`, `createSupabaseUserClient()` (re-exporta `logSecurityEvent`, `fetchSecurityEvents`, `isRepeatedFailure` desde security-events)
- **`@enjambre/auth/middleware`** — Edge-safe: `createAuthMiddleware()` con role redirect + route guards + `access_denied` logging via BFF
- **`@enjambre/auth/security-events`** — server-safe (sin React hooks): `logSecurityEvent()`, `fetchSecurityEvents()`, `isRepeatedFailure()`, types (`SecurityEventType`, `SecurityEvent`, `SecurityEventPayload`, `AppSource`)
- **`@enjambre/auth/role-redirect`** — server-safe (sin React hooks): `LEGACY_ROLE_MAP`, `RoleKey`, `ROLE_REDIRECT_MAP`, `ALL_ADMIN_ROLES`, `ROUTE_ROLE_GUARDS`, `getRoleRedirectPath()`, `isRouteAllowed()`

Los archivos en `apps/*/lib/supabase*` son **re-exports** del package central. No crear clientes Supabase ad-hoc en apps.

**Patrones de integracion por app**:
- **Nucleo**: Usa `@enjambre/auth` via re-exports en `@/lib/` (71 consumidores, cero rotos). `useAuthProvider()` hook en root. Middleware usa `createAuthMiddleware()` de `@enjambre/auth/middleware`.
- **Tienda**: Middleware `middleware.ts` propio con `updateSession()` + CSRF + admin guard + `access_denied` logging (via `POST /api/security-events/internal`).
- **Campo**: Middleware propio con `logAccessDenied()` que posta a nucleo BFF (`POST /api/security-events/internal` con `x-internal-key`, camelCase payload). No usa `createAuthMiddleware` directamente.
- **Turbopack barrel issue**: Server-side code debe usar `env.ts` locales, no importar `@enjambre/auth` barrel (que incluye `hooks.tsx` con `useEffect`).

## Security Event Logging

Eventos de seguridad se registran en tabla `security_events` (RLS: admin leen, authenticated inserta, anon inserta solo pre-auth events).

| Ubicación | Eventos | Mecanismo |
|---|---|---|
| Login page | `login_success`, `login_failed`, `password_reset_requested`, `signup_success` | `logSecurityEvent(supabase, ...)` directo |
| Nucleo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` con `x-internal-key` |
| Campo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` (via BFF nucleo) |
| Tienda middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` (local origin) |
| Auth store `signOut()` | `session_revoked` | `logSecurityEvent(supabase, ...)` antes de signOut, con `appSource` dinámico |

BFF route: `POST /api/security-events` (Bearer auth) + `POST /api/security-events/internal` (x-internal-key = SUPABASE_SERVICE_ROLE_KEY)

## Roles

`admin` | `cliente` | `creador` | `rep_ventas` | `territorial`

> Roles de plataforma: `admin`, `apicultor` (patio), `territorial`, `rep_ventas`, `cliente`, `creador`. Legacy (`vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`) → `admin` vía `LEGACY_ROLE_MAP`. `apicultor` **no** se eleva a admin. Docs: `docs/ROLES_Y_ACCESO.md`, checklist ops: `docs/OPS_ROLES_CHECKLIST.md`.
> `territorial` (migration 997) es el rol de los participantes del Registro Territorial Apícola de Chiloé; home `/territorio`, guard `ROUTE_ROLE_GUARDS['/territorio']`.

## Environment Variables

| App | Variables |
|---|---|
| Tienda/Campo/Nucleo | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) |
| Server-only | `SUPABASE_SERVICE_ROLE_KEY`, `TRANSBANK_*` |

## Diseño — kit portable

Antes de tocar UI (CSS, JSX de presentación, landing, loaders, tokens):

1. Leer `.design/00-uso.md` y el overlay del proyecto (`.design/overlays/`).
2. Clasificar la superficie: `.design/07-superficie-vs-app.md`.
3. Refactorizar con `.design/05-playbook-refactor.md`. No “modernizar”.
4. Cerrar con `.design/06-checklist.md` en las pantallas tocadas.

Ley: tokens del repo ganan; el kit gana contra el default del modelo (indigo, Inter/Geist, orbe, Sparkles, trío de cards, lorem). No copiar marca de otro producto. Un PR = una pantalla o un patrón.

