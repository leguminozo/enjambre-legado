# Deprecado

Los archivos SQL en esta carpeta (`phase2_schema.sql`, `phase4_schema.sql`, `schema.sql`, `auth_rls_schema.sql`) son **históricos**.

El esquema canónico y las migraciones versionadas viven en:

`packages/database/supabase/migrations/`

No dupliques cambios aquí; actualiza solo `packages/database` y aplica migraciones con Supabase CLI o el flujo de despliegue del proyecto.
