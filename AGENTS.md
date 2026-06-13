# AGENTS.md — Enjambre Legado

> Cross-agent configuration file. Works with Claude, Cursor, Windsurf, Gemini, Copilot, Trae.
> Read BEFORE any code modification.

## Project Overview

**Enjambre Legado** — Biocultural regeneration operating system.
Monorepo managed by Turborepo + pnpm. 3 apps, all on Vercel + Supabase.

## Read First

1. `docs/00_EMPEZA_AQUI.md`
2. `docs/CONSTITUTION.md`
3. `docs/AGENT_INSTRUCTIONS.md`
4. `docs/ARCHITECTURE.md`

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
- Use `current_role()`, `is_admin()`, `is_gerente()`, `has_empresa_access()` for policies.
- Regenerate types after migration: `cd packages/database && pnpm db:typegen`.

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

```
apps/tienda → E-commerce + admin (Next.js 16, Transbank, GSAP)
apps/nucleo → Management dashboard + BFF + contable (Next.js 16 App Router, Hono BFF via /api/[[...routes]], Leaflet, TanStack Query)
apps/campo → POS completo (Next.js 16, CashProvider, QuickSale, TierBadge, Leaderboard, ClientLookup)
packages/database → Supabase migrations + types (Postgres 17 + PostGIS, 50+ migrations)
packages/contable → Chilean tax logic (IVA 19%, RUT, DTE XML, receipt parsers x7, tasa-cambio, gasto-extranjero)
packages/auth → Supabase clients (5 entry points: browser/browser/server/middleware/security-events/role-redirect) + Zustand store + role redirect + security events (13 types)
packages/ui → Design system (15 components, 3 hooks, 4 lib utils, Tailwind preset, tokens, 24 icons)
packages/sumup → SumUp POS integration (SumUpClient + types)
packages/banco-chile → Banco Chile Empresas API client (OAuth 2.0, 8 APIs)
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
| Components at repo root | `packages/ui` or `apps/*/components` |
| Massive refactors | Surgical, minimal changes |
| Skip build verification | Always build after changes |

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

`admin` | `cliente` | `creador` | `rep_ventas`

> Los roles granulares anteriores (`apicultor`, `vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`) fueron consolidados en `admin` via migration 39. Existe `LEGACY_ROLE_MAP` para compatibilidad.

## Environment Variables

| App | Variables |
|---|---|
| Tienda/Campo/Nucleo | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) |
| Server-only | `SUPABASE_SERVICE_ROLE_KEY`, `TRANSBANK_*` |
