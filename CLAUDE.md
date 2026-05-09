# CLAUDE.md — Enjambre Legado

> Context file for Claude Code. Read before every interaction.

## Project Identity

**Enjambre Legado** — A biocultural regeneration operating system. Monorepo multi-platform, multi-role, multi-agent.

## Mandatory Reading

1. `docs/CONSTITUTION.md` — Inviolable principles
2. `docs/AGENT_INSTRUCTIONS.md` — Operating rules for AI agents
3. `docs/ARCHITECTURE.md` — Monorepo structure and data flow
4. `docs/DATABASE_SCHEMA.md` — Canonical database schema

## Quick Reference

### Monorepo Structure
```
apps/tienda    → Next.js 16  (e-commerce + admin)
apps/nucleo    → Vite 7 SPA  (management dashboard, PWA)
apps/campo     → Next.js 15  (field PWA, offline-first)
apps/api       → Hono        (BFF, accounting, integrations)
apps/eirl      → Next.js 15  (EIRL accounting, INDEPENDENT)
packages/database  → Supabase migrations + types
packages/contable  → Chilean tax logic (IVA, RUT)
packages/auth      → Auth helpers + Zustand store
packages/offline   → Dexie sync queue
packages/ui        → Design tokens
```

### Stack
- React 19, Next.js 15/16, Vite 7, Tailwind CSS 3/4
- Supabase (Postgres 17 + PostGIS + RLS)
- Zustand, TanStack Query, Dexie
- GSAP, Framer Motion
- Transbank SDK (Webpay Chile)
- Hono (BFF), Zod
- Turborepo + pnpm 10.32.1

### Commands
```bash
pnpm install                                    # Install all
pnpm dev                                        # Dev all apps
pnpm --filter @enjambre/tienda dev              # Dev specific app
pnpm --filter @enjambre/tienda build            # Build specific app
pnpm build                                      # Build everything
cd packages/database && pnpm db:typegen          # Regenerate DB types
```

### Critical Rules
1. **Named exports only** — No `export default` (except Next.js pages)
2. **No `any`** — Use `unknown` + type guards
3. **Tailwind tokens** — No hex colors, use semantic tokens (`bg-background`, `text-foreground`)
4. **RLS always** — Every new table needs Row Level Security
5. **Offline-first for campo** — Dexie before Supabase
6. **Premium aesthetics** — Dark mode, Cormorant Garamond, GSAP animations
7. **Surgery, not butchery** — Minimal, precise changes only
8. **Build verification** — Always run `pnpm --filter @enjambre/<app> build` after changes

### Color Palette
| Token | Hex |
|---|---|
| Bosque Ulmo | `#0A3D2F` |
| Oro Miel | `#D4A017` |
| Crema Natural | `#FDFBF7` |
| Negro Tinta | `#1a1a1a` |

### Roles
`apicultor`, `vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`, `cliente`

### Environment Variables
- Apps Next.js: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Nucleo (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- API (Hono): `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `TRANSBANK_*`
