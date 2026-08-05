-- ============================================================
-- Migration 1013: cola de envíos operativa de la empresa
--
-- La cola de DESPACHO filtraba logistica_envios por user_id del
-- admin, pero los envíos automáticos del checkout de Tienda
-- (checkout-fulfill.ts) llevan user_id = comprador (o NULL en
-- guest). Resultado: envíos automáticos invisibles en la cola,
-- no actualizables, y detección "ya enviado" rota (duplicados).
--
-- Solución: la cola es de la empresa (empresa_id), no personal.
-- 1) RLS org-scoped: miembros de la empresa + admin + dueño.
-- 2) Backfill: envíos manuales legacy (empresa_id NULL) se
--    asignan a la empresa de su creador vía usuarios_empresas.
-- 3) ventas.estado: el CHECK unificado (20260802110000) no
--    incluye 'despachado', que logistica.ts ya intenta setear
--    al despachar; se agrega al CHECK.
-- ============================================================

-- 1) RLS org-scoped -------------------------------------------
DROP POLICY IF EXISTS logistica_envios_p ON logistica_envios;

CREATE POLICY logistica_envios_empresa_p ON logistica_envios
  FOR ALL
  USING (
    user_id = auth.uid()
    OR public.is_gerente()
    OR public.has_empresa_access(empresa_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_empresa_access(empresa_id)
  );

-- 2) Backfill envíos legacy ------------------------------------
UPDATE logistica_envios
SET empresa_id = ue.empresa_id
FROM usuarios_empresas ue
WHERE logistica_envios.empresa_id IS NULL
  AND logistica_envios.user_id = ue.user_id;

-- 3) CHECK ventas.estado incluye 'despachado' ------------------
ALTER TABLE public.ventas DROP CONSTRAINT IF EXISTS ventas_estado_check;

ALTER TABLE public.ventas
  ADD CONSTRAINT ventas_estado_check
  CHECK (estado IN (
    'pending', 'paid', 'failed', 'refunded', 'cancelled',  -- flujo web checkout
    'confirmado',                                          -- POS campo (escritor real)
    'completada', 'pendiente',                             -- legacy POS / comparaciones UI
    'despachado'                                           -- logística (logistica.ts PATCH/POST)
  ));

COMMENT ON CONSTRAINT ventas_estado_check ON public.ventas IS
  'Estados unificados: web (pending/paid/failed/refunded/cancelled) + POS campo (confirmado) + legacy (completada/pendiente) + logística (despachado)';

-- 4) Índice para la cola por empresa ---------------------------
CREATE INDEX IF NOT EXISTS idx_logistica_envios_empresa_status
  ON logistica_envios (empresa_id, status);
