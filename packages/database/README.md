# @enjambre/database

Fuente de verdad del esquema Supabase para Enjambre Legado (núcleo, tienda, campo).

`supabase/config.toml` define el proyecto CLI (local + integración GitHub en el dashboard). **Working directory** del enlace con GitHub: `packages/database`.

## Migraciones

Aplicar en orden desde `supabase/migrations/`:

1. `00_initial_schema.sql` — tablas canónicas (perfiles, CRM `clientes`, `ventas` unificadas, `cashflow` manual, `calendario_tasks`, logística, marketing, cliente, alertas, reflexiones).
2. `01_rls_policies.sql` — RLS y funciones `current_role()` / `is_gerente()`.
3. `02_storage_buckets.sql` — buckets `colmenas`, `productos`, `arboles`.

Los scripts bajo `apps/nucleo/supabase/*.sql` están **deprecados**; no los uses como referencia de esquema activo.

## Tipos TypeScript

Con el CLI de Supabase vinculado al proyecto:

```bash
pnpm --filter @enjambre/database run db:typegen
```

## Notas

- `ventas` usa `items` (JSONB) y `vendedor_id` (UUID = `profiles.id`).
- CRM: tabla `clientes` con `user_id` = vendedor propietario del contacto.
- `cashflow` es tabla editable por mes (`user_id`, `month` único); ingresos agregados también pueden derivarse de `ventas` en la app.
