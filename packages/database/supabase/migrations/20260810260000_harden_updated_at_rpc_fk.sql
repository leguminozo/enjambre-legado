-- =============================================================================
-- Perfeccionamiento integral de Supabase (auditoría 2026-08-10)
--
-- Correcciones aplicadas:
--   1. updated_at: 44 tablas con columna updated_at SIN trigger BEFORE UPDATE
--      (la columna se guardaba pero nunca se actualizaba). Se agrega el
--      trigger compartido public.update_updated_at_column() a todas.
--   2. RPC hardening: 78 funciones SECURITY DEFINER eran ejecutables por
--      anon/PUBLIC (riesgo de abuso: inventario_aplicar_movimiento,
--      agregar_puntos_usuario, decrement_stock_force...). Se revoca de
--      anon/PUBLIC y se concede a authenticated + service_role. La whitelist
--      conserva las RPC genuinamente públicas (claim de venta, censo, QR) y
--      los helpers de RLS (is_admin/is_gerente/current_role/has_empresa_access)
--      que las POLICIES necesitan para evaluar.
--   3. Índices: 90 FKs sin índice (joins y borrados con seq scan). Se crean
--      índices por (tabla, columna) de forma idempotente.
--
-- Verificado antes: las 7 tablas con RLS sin policies (default-deny) se
-- acceden solo vía service_role/RPC — sin fuga ni rotura; productos tiene
-- RLS (el GRANT ALL legacy es inofensivo).
-- =============================================================================

-- ── 1) Triggers updated_at para todas las tablas que lo necesitan ────────────
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public' AND col.table_name = c.relname
          AND col.column_name = 'updated_at'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_trigger tr
        WHERE tr.tgrelid = c.oid AND NOT tr.tgisinternal AND (tr.tgtype & 18) = 18
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t.relname || '_updated_at', t.relname);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      t.relname || '_updated_at', t.relname
    );
  END LOOP;
END $$;

-- ── 2) Hardening de RPC SECURITY DEFINER ─────────────────────────────────────
-- Whitelist: funciones que los flujos PÚBLICOS (anon) o las policies llaman.
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS proc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
      AND p.proname NOT IN (
        -- Flujos públicos legítimos
        'censo_stats_public',
        'generar_codigo_qr',
        'obtener_venta_por_claim_token',
        'reclamar_venta_por_claim_token',
        'verificar_integridad_audit_trail',
        -- Helpers que evalúan las POLICIES RLS (anon y authenticated los necesitan)
        'current_role',
        'is_admin',
        'is_gerente',
        'has_empresa_access'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f.proc);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.proc);
  END LOOP;
END $$;

-- ── 3) Índices para FKs sin índice ───────────────────────────────────────────
DO $$
DECLARE
  c record;
  col text;
  idx_name text;
BEGIN
  FOR c IN
    SELECT conrelid::regclass::text AS tabla, conname, conkey
    FROM pg_constraint
    WHERE contype = 'f' AND connamespace = 'public'::regnamespace
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = conrelid
          AND (SELECT array_agg(e::int) FROM unnest(i.indkey) e) @> (SELECT array_agg(e::int) FROM unnest(conkey) e)
      )
    ORDER BY 1
  LOOP
    FOR col IN SELECT a.attname FROM pg_attribute a
      WHERE a.attrelid = c.tabla::regclass AND a.attnum = ANY(c.conkey)
    LOOP
      -- Nombre de índice ≤ 63 chars (Postgres trunca, pero evitamos colisiones con un hash corto)
      idx_name := left('idx_' || c.tabla || '_' || col, 60) || '_' || right(md5(c.tabla || '_' || col), 4);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)', idx_name, c.tabla, col);
    END LOOP;
  END LOOP;
END $$;
