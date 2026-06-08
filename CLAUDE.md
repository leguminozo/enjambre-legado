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
apps/tienda → Next.js 16 (e-commerce + admin)
apps/nucleo → Next.js 16 App Router (management dashboard, Hono BFF, contable)
apps/campo → Next.js 16 (field PWA, offline-first planned)
packages/database → Supabase migrations + types
packages/contable → Chilean tax logic (IVA, RUT)
packages/auth → Auth helpers + Zustand store
packages/ui → Design tokens
packages/sumup → SumUp POS integration
packages/banco-chile → Banco Chile Empresas API client
```

### Stack
- React 19, Next.js 16, Tailwind CSS 3/4
- Supabase (Postgres 17 + PostGIS + RLS)
- Zustand, TanStack Query
- GSAP, Framer Motion
- Transbank SDK (Webpay Chile)
- Hono (BFF), Zod
- Turborepo + pnpm

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
5. **Offline-first for campo** — Planned (Dexie + sync queue). Currently uses Supabase directly.
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
`admin`, `cliente`, `creador`, `rep_ventas`

> Legacy roles (`apicultor`, `vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`) consolidated into `admin` via migration 39.

### Environment Variables
- Apps Next.js: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `TRANSBANK_*`
