-- ============================================================
-- Migration 20260802120000: columna eventos.estado
--
-- La app consulta eventos.estado (FeriaMonitorView.tsx filtra
-- .in('estado', ['Programada','En curso']) y VendedorView la lee),
-- pero NINGUNA migración crea la columna → la query falla en una
-- base fresca ("column eventos.estado does not exist"). En prod la
-- columna existe solo por DDL no versionado.
--
-- Se agrega de forma permisiva (sin CHECK ni default): el monitor
-- solo la lee y ningún flujo actual la escribe.
-- ============================================================

ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS estado TEXT;

COMMENT ON COLUMN public.eventos.estado IS
  'Estado mostrado por FeriaMonitor/VendedorView (p.ej. ''Programada'', ''En curso''). Leída por la UI; sin escritor versionado.';
