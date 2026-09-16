# CLAUDE.md — Enjambre Legado

> Context file for Claude Code. Read before every interaction.

## Project Identity

**Enjambre Legado** — A biocultural regeneration operating system. Monorepo multi-platform, multi-role, multi-agent.

## Mandatory Reading

1. `docs/README.md` — law vs snapshot vs audit. Start here.
2. `docs/REPO_MAP.md` — live topology (3 apps, 15 packages, crons).
3. `docs/CONSTITUTION.md` + `system_invariants.md`
4. `docs/CAMPO_OFFLINE.md` if you touch POS — Dexie is **implemented**, not planned.
5. `docs/AGENT_INSTRUCTIONS.md` · `docs/ARCHITECTURE.md` · `docs/DATABASE_SCHEMA.md`

Do not treat `MASTER_PLAN.md` as current state (June 2026 snapshot).

## Quick Reference

Censo completo: `docs/REPO_MAP.md`. No duplicar listas aquí.

```
apps/tienda  :3001  D2C + perfil (Flow/Transbank via Núcleo BFF)
apps/nucleo  :3000  dashboard + only BFF + fiscal
apps/campo   :3002  POS feria, Dexie first (not patio; no @enjambre/offline)
packages/*   15     see REPO_MAP
```

### Stack
- React 19, Next.js 16, Tailwind 3, tokens `@enjambre/ui`
- Supabase (Postgres 17 + PostGIS + RLS), supabase-js HTTP
- Zustand, TanStack Query, Hono BFF, Zod
- Pagos: Flow **y** Transbank (`PAYMENT_PROVIDER`)
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
5. **Offline-first for campo** — Planned (Dexie + sync queue). Currently uses Supabase directly.
6. **Premium aesthetics** — Dark mode, Cormorant Garamond, GSAP animations
7. **Surgery, not butchery** — Minimal, precise changes only
8. **Build verification** — Always run `pnpm --filter @enjambre/<app> build` after changes
9. **Recolección, JAMÁS Cosecha** — Prohibido usar `cosecha` en UI pública, textos y labels. Siempre `recolección` o `recolectado`.
10. **Poder silencioso y lujo de origen** — Prohibido usar `biocultural`, `custodia`, `oficio` (como sacrificio) o `regenerativo` en interfaces comerciales o públicas. Elegancia, maestría y hechos comprobables.

### Color Palette
| Token | Hex |
|---|---|
| Bosque Ulmo | `#0A3D2F` |
| Oro Miel | `#D4A017` |
| Crema Natural | `#FDFBF7` |
| Negro Tinta | `#1a1a1a` |

### Roles
`admin`, `cliente`, `creador`, `rep_ventas`

> Platform roles: `admin`, `apicultor` (patio), `territorial`, `rep_ventas`, `cliente`, `creador`. Legacy (`vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`) → `admin` via `LEGACY_ROLE_MAP`. `apicultor` is a first-class RoleKey (not elevated). See `docs/ROLES_Y_ACCESO.md`.

### Environment Variables
- Apps Next.js: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `TRANSBANK_*`
