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
- Use `current_role()`, `is_gerente()`, `has_empresa_access()` for policies.
- Regenerate types after migration: `cd packages/database && pnpm db:typegen`.

### Offline (Campo)
- Dexie (IndexedDB) first. Supabase second.
- Never direct `supabase.insert()` from campo UI components.
- Use `@enjambre/offline` sync queue.

## App Commands

```bash
pnpm install # Install all
pnpm dev # Dev all apps
pnpm --filter @enjambre/tienda dev # Tienda (Next.js 16)
pnpm --filter @enjambre/nucleo dev # Nucleo (Next.js 16, Hono BFF)
pnpm --filter @enjambre/campo dev # Campo (Next.js 15)
pnpm --filter @enjambre/<app> build # Build specific app
pnpm build # Build all
```

## Architecture Quick Map

```
apps/tienda → E-commerce + admin (Next.js 16, Transbank, GSAP)
apps/nucleo → Management dashboard + BFF + contable (Next.js 16 App Router, Hono BFF via /api/[[...routes]], Leaflet, TanStack Query)
apps/campo → Field PWA (Next.js 15, offline-first, Dexie)
packages/database → Supabase migrations + types (Postgres 17 + PostGIS)
packages/contable → Chilean tax logic (IVA 19%, RUT validation, Zod schemas)
packages/auth → Supabase clients (browser/server/middleware/BFF) + Zustand store + role redirect + security events
packages/offline → Dexie IndexedDB + sync queue
packages/ui → Design tokens (4 semantic tokens)
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
| Direct Supabase in campo UI | Hook with sync queue |
| Components at repo root | `packages/ui` or `apps/*/components` |
| Massive refactors | Surgical, minimal changes |
| Skip build verification | Always build after changes |

## Auth Package Convention

`@enjambre/auth` tiene cuatro puntos de entrada:
- **`@enjambre/auth`** — browser/cliente: `createClient()`, `useAuthStore`, `useRoleBasedRedirect`, `logSecurityEvent`
- **`@enjambre/auth/server-index`** — server-only: `createServerClientFromCookies()`, `createAuthMiddleware()`, `createSupabaseUserClient()`
- **`@enjambre/auth/middleware`** — Edge-safe: `createAuthMiddleware()` con role redirect + route guards + `access_denied` logging via BFF
- **`@enjambre/auth/security-events`** — server-safe (sin React hooks): `logSecurityEvent()`, `fetchSecurityEvents()`, `isRepeatedFailure()`

Los archivos en `apps/*/lib/supabase*` son **re-exports** del package central. No crear clientes Supabase ad-hoc en apps.

**Patrones de integracion por app**:
- **Nucleo**: Usa `@enjambre/auth` via re-exports en `@/lib/` (71 consumidores, cero rotos). `useAuthProvider()` hook en root.
- **Tienda**: `auth-context.tsx` wrapesa `useAuthStore` + expone `useAuth()` compatible con `TiendaUser`. `onAuthStateChange` con cliente local. `appSource: 'tienda'`.
- **Campo**: `CampoAuthProvider` sincroniza `onAuthStateChange` → `useAuthStore` con cliente local. `appSource: 'campo'`. Middleware protege `/pos/*` + logea `access_denied` via BFF internal.
- **Turbopack barrel issue**: Server-side code debe usar `env.ts` locales, no importar `@enjambre/auth` barrel (que incluye `hooks.tsx` con `useEffect`).

## Security Event Logging

Eventos de seguridad se registran en tabla `security_events` (RLS: gerente/tienda_admin leen, authenticated inserta, anon inserta solo pre-auth events).

| Ubicación | Eventos | Mecanismo |
|---|---|---|
| Login page | `login_success`, `login_failed`, `password_reset_requested`, `signup_success` | `logSecurityEvent(supabase, ...)` directo |
| Nucleo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` con `x-internal-key` |
| Campo middleware | `access_denied` | Fire-and-forget `POST /api/security-events/internal` (via BFF nucleo) |
| Tienda middleware | `access_denied` | Supabase REST API directa con service role key (sin BFF dependency) |
| Auth store `signOut()` | `session_revoked` | `logSecurityEvent(supabase, ...)` antes de signOut, con `appSource` dinámico |

BFF route: `POST /api/security-events` (Bearer auth) + `POST /api/security-events/internal` (x-internal-key = SUPABASE_SERVICE_ROLE_KEY)

## Roles

`apicultor` | `vendedor` | `gerente` | `logistica` | `marketing` | `tienda_admin` | `cliente`

## Environment Variables

| App | Variables |
|---|---|
| Tienda/Campo/Nucleo | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Server-only | `SUPABASE_SERVICE_ROLE_KEY`, `TRANSBANK_*` |
