-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 101 — Hotfix Zero-Trust: habilitar RLS en lotes + checkout_stock_holds
-- CVE-L-011
--
-- Hallazgo: las policies definidas en 40_rls_hardening_audit.sql para `lotes`
-- son NO-OP porque NUNCA se ejecutó `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
--Resultado: cualquier cliente con grant a `lotes` lee/escribe hashes de
-- trazabilidad sin check; y `checkout_stock_holds` (creada en 79_ola3) se
-- quedó sin RLS en absoluto, permitiendo enumeración de pedidos en curso.
-- ═══════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- 1) lotes — habilitar RLS y reemplazar las policies no-op por variantes
-- endurecidas. La lectura sigue siendo abierta (modelo de negocio: la
-- trazabilidad blockchain es pública por diseño), pero la escritura queda
-- restringida a service_role (BFF autenticado) o admin verificado en BD.
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;

-- Las policies de 40_rls_hardening_audit.sql son no-op previas a este ALTER.
-- Las reemplazamos para explicitar el contrato:
DROP POLICY IF EXISTS lotes_select ON public.lotes;
DROP POLICY IF EXISTS lotes_insert ON public.lotes;
DROP POLICY IF EXISTS lotes_update ON public.lotes;
DROP POLICY IF EXISTS lotes_delete ON public.lotes;

-- Lectura pública (trazabilidad es visible por modelo de negocio).
CREATE POLICY lotes_read ON public.lotes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura: sólo service_role (BFF autenticado) o admin.
CREATE POLICY lotes_insert ON public.lotes
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    current_setting('role', true) = 'service_role'
    OR public.is_admin()
  );

CREATE POLICY lotes_update ON public.lotes
  FOR UPDATE
  TO authenticated, service_role
  USING (
    current_setting('role', true) = 'service_role'
    OR public.is_admin()
  )
  WITH CHECK (
    current_setting('role', true) = 'service_role'
    OR public.is_admin()
  );

CREATE POLICY lotes_delete ON public.lotes
  FOR DELETE
  TO authenticated, service_role
  USING (
    current_setting('role', true) = 'service_role'
    OR public.is_admin()
  );

-- ──────────────────────────────────────────────────────────────────────────
-- 2) checkout_stock_holds — la tabla se creó sin RLS en 79. Su parent
-- (checkout_sessions) está cerrada a service_role únicamente (38:48-49);
-- la hija debe seguir el mismo contrato. Revocamos de anon/authenticated
-- y damos acceso sólo a service_role (sin USING(true) decorativa).
-- ──────────────────────────────────────────────────────────────────────────
ALTER TABLE public.checkout_stock_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS checkout_stock_holds_read ON public.checkout_stock_holds;
DROP POLICY IF EXISTS checkout_stock_holds_write ON public.checkout_stock_holds;
DROP POLICY IF EXISTS checkout_stock_holds_delete ON public.checkout_stock_holds;

CREATE POLICY checkout_stock_holds_read ON public.checkout_stock_holds
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY checkout_stock_holds_insert ON public.checkout_stock_holds
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY checkout_stock_holds_update ON public.checkout_stock_holds
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY checkout_stock_holds_delete ON public.checkout_stock_holds
  FOR DELETE TO service_role
  USING (true);

REVOKE ALL ON public.checkout_stock_holds FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkout_stock_holds TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificación post-migration:
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('lotes','checkout_stock_holds');
--   Ambas: relrowsecurity = true
-- ═══════════════════════════════════════════════════════════════════════════
