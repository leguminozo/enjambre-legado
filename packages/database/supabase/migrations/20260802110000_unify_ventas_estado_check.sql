-- ============================================================
-- Migration 20260802110000: unificar CHECK de ventas.estado
--
-- Sincronía rota: 20260614050000 impuso
--   CHECK (estado IN ('pending','paid','failed','refunded','cancelled'))
-- (flujo web), pero el ÚNICO escritor de ventas del monorepo es el POS
-- de campo (apps/campo/src/app/api/pos/venta/route.ts), que inserta
-- 'confirmado' (default y explícito en carrito-view.tsx). Con el CHECK
-- vigente, toda venta POS viola la constraint; sin él aplicado, aplicar
-- la 20260614050000 más tarde rompería el POS en vivo.
--
-- Solución: reemplazar por un CHECK unificado que cubra web + POS +
-- estados legacy (filas históricas pueden contener 'completada'/'pendiente'
-- de la era anterior del POS).
-- ============================================================

ALTER TABLE public.ventas DROP CONSTRAINT IF EXISTS ventas_estado_check;

ALTER TABLE public.ventas
  ADD CONSTRAINT ventas_estado_check
  CHECK (estado IN (
    'pending', 'paid', 'failed', 'refunded', 'cancelled',  -- flujo web checkout
    'confirmado',                                          -- POS campo (escritor real)
    'completada', 'pendiente'                              -- legacy POS / comparaciones UI
  ));

COMMENT ON CONSTRAINT ventas_estado_check ON public.ventas IS
  'Estados unificados: web (pending/paid/failed/refunded/cancelled) + POS campo (confirmado) + legacy (completada/pendiente)';
