# @enjambre/nucleo

Dashboard de gestion + BFF + contable para Enjambre Legado.

## Stack

- Next.js 16 (App Router)
- Hono (BFF via `/api/[[...routes]]/route.ts`)
- Supabase (Postgres + Auth)
- TanStack Query
- Leaflet (mapa interactivo)
- Tailwind CSS (tokens semanticos de `@enjambre/ui`)

## Funcionalidades

- **Mapa**: Apiarios, arboles, ferias, ventas (Leaflet + PostGIS)
- **Caja**: Sesiones de caja, CSV export, alertas delta
- **Reps**: Gestion de reps de ventas, tier override
- **Comisiones**: Comisiones con Tier + Canal
- **Invitaciones**: Codigos de invitacion + redenciones
- **Reglas Comision**: 6 rule_types (base, channel_rate, volume_threshold, loyalty, streak, tier_bonus)
- **Leaderboard**: Ranking semanal
- **Contable**: Integracion contable via BFF (IVA 19%, RUT, DTE)
- **EIRL**: Contabilidad EIRL (absorbido de apps/eirl)
- **Banco Chile**: Dashboard de integracion bancaria
- **BFF**: API routes para tienda, contable, banco-chile, security-events

## Desarrollo

```bash
# Desde la raiz del monorepo
pnpm --filter @enjambre/nucleo dev

# Build
pnpm --filter @enjambre/nucleo build
```

## Auth

Usa `@enjambre/auth` via re-exports en `@/lib/`. Middleware usa `createAuthMiddleware()` de `@enjambre/auth/middleware`.

## Variables de Entorno

| Variable | Obligatoria | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Si | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Si | JWT anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Si | Server-only para BFF |
