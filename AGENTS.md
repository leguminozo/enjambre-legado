# AGENTS.md — Enjambre Legado

> Cross-agent configuration file. Works with Claude, Cursor, Windsurf, Gemini, Copilot, Trae.
> Read BEFORE any code modification.

## Project Overview

**Enjambre Legado** — Biocultural regeneration operating system.
Monorepo managed by Turborepo + pnpm. Multi-platform (Next.js, Vite SPA, Hono BFF).

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
- Tailwind CSS semantic tokens only: `bg-background`, `text-foreground`, `text-primary`.
- No hardcoded hex colors in components.
- Dark mode default. Cormorant Garamond for display. GSAP for animations.
- Design tokens in `packages/ui`.

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
pnpm install                                       # Install all
pnpm dev                                           # Dev all apps
pnpm --filter @enjambre/tienda dev                 # Tienda (Next.js 16)
pnpm --filter @enjambre/nucleo dev                 # Nucleo (Vite 7)
pnpm --filter @enjambre/campo dev                  # Campo (Next.js 15)
pnpm --filter @enjambre/api dev                    # API (Hono)
pnpm --filter @enjambre/eirl dev                   # EIRL (Next.js + Prisma)
pnpm --filter @enjambre/<app> build                # Build specific app
pnpm build                                         # Build all
```

## Architecture Quick Map

```
apps/tienda    → E-commerce + admin (Next.js 16, Transbank, GSAP)
apps/nucleo    → Management dashboard (Vite SPA, PWA, Leaflet, TanStack Query)
apps/campo     → Field PWA (Next.js 15, offline-first, Dexie)
apps/api       → BFF (Hono, multi-tenant, JWT auth)
apps/eirl      → Accounting (Next.js + Prisma + SQLite, INDEPENDENT)
packages/database   → Supabase migrations + types (Postgres 17 + PostGIS)
packages/contable   → Chilean tax logic (IVA 19%, RUT validation, Zod schemas)
packages/auth       → Supabase client + Zustand store + role redirect
packages/offline    → Dexie IndexedDB + sync queue
packages/ui         → Design tokens (4 semantic tokens)
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
| `catch(e) {}` | `toast.error()` + logging |
| Direct Supabase in campo UI | Hook with sync queue |
| Components at repo root | `packages/ui` or `apps/*/components` |
| Massive refactors | Surgical, minimal changes |
| Skip build verification | Always build after changes |

## Roles

`apicultor` | `vendedor` | `gerente` | `logistica` | `marketing` | `tienda_admin` | `cliente`

## Environment Variables

| App | Variables |
|---|---|
| Tienda/Campo | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Nucleo | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| API | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Server-only | `SUPABASE_SERVICE_ROLE_KEY`, `TRANSBANK_*` |
