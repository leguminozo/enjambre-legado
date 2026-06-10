# @enjambre/database

Fuente de verdad del esquema Supabase para Enjambre Legado (nucleo, tienda, campo).

`supabase/config.toml` define el proyecto CLI (local + integracion GitHub en el dashboard). **Working directory** del enlace con GitHub: `packages/database`.

## Migraciones

50+ migraciones en `supabase/migrations/`. Las mas relevantes:

| # | Migracion | Dominio |
|---|---|---|
| 00 | Schema inicial | 20+ tablas base (identidad, apiarios, colmenas, productos, ventas, etc.) |
| 01 | RLS policies | Roles, funciones `current_role()`, `is_gerente()` |
| 02 | Storage buckets | colmenas, productos, arboles (public), fuentes (restringido) |
| 03 | Productos slug | Columna slug con indice unico parcial |
| 04 | Integrations | Tabla de configuracion de servicios externos |
| 05 | Contable core | Multi-empresa: empresas, usuarios_empresas, terceros, facturas |
| 06 | Contable RLS | `has_empresa_access()`, multi-tenant |
| 07 | Job runs | Audit log de integraciones con tracking de estado |
| 10 | Site content | CMS para contenido dinamico de la landing |
| 11 | Vanguard architecture | Estructura de vanguardia |
| 12 | POS claimable loyalty | Sistema de lealtad POS |
| 14 | Creadores | Codigo_ref, comisiones, portal auto-servicio |
| 21-22 | Banco Chile | Tablas banco_chile + conciliaciones |
| 23 | Security events | Tabla security_events |
| 25 | SII DTE facturas compra | Facturas compra SII |
| 26 | Gastos extranjeros | Gastos en moneda extranjera + conciliacion |
| 28 | Cierres de caja + comisiones + invitaciones | cash_sessions, commission_rules/records, invitation_codes/redemptions, rep_profiles, vistas, triggers, RLS, semilla |
| 29 | Tier automatico | evaluar_tier_rep(), tier_progress_rep(), tier_override |
| 30 | Tier bonus comision | calcular_comision_venta() con tier_multiplier |
| 31 | Channel rate comisiones | calcular_comision_venta() con channel_rate |
| 32 | RLS hardening | 6 parches: commission split, INSERT restrict, soft-delete, UPDATE restrict |
| 33 | Leaderboard semanal | weekly_leaderboard(), SECURITY DEFINER STABLE |
| 37 | Security events Phase 5 | CHECK event_type + access_denied/signup_success, RLS anon INSERT |
| 38 | Checkout sessions | Tabla checkout_sessions (reemplaza Map en memoria) |
| 39 | Admin role consolidation | 7 roles → 4 roles (admin, cliente, creador, rep_ventas) |
| 40 | RLS hardening audit | 8 tablas sin RLS + 6 views sin security_invoker + funciones SECURITY DEFINER |
| 41-47 | Canje impacto, subscriptions, CMS bucket, CRM, logistica, stock sync, SumUp POS |

Migraciones timestamped (pre-numbering): eirl_contable, ventas_web_columns, data_sources, vendedor_id_column, calendario_tasks_fix, ventas_rls_cleanup, integrations_rls, realtime, seed_empresa, profiles_role_default, costeo_core

Los scripts bajo `apps/nucleo/supabase/*.sql` estan **deprecados**; no usar como referencia de esquema activo.

## Tipos TypeScript

Con el CLI de Supabase vinculado al proyecto:

```bash
pnpm --filter @enjambre/database run db:typegen
```

## Notas

- `ventas` usa `items` (JSONB) y `vendedor_id` (UUID = `profiles.id`).
- CRM: tabla `clientes` con `user_id` = vendedor propietario del contacto.
- `cashflow` es tabla editable por mes (`user_id`, `month` unico).
- Roles activos: `admin`, `cliente`, `creador`, `rep_ventas` (migration 39).
