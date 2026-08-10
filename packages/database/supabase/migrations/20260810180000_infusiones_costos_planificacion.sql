-- =============================================================================
-- Fase 3 — Costos por sachet + planificación por rendimiento histórico
--
-- Costo real de la materia seca por materia prima, calculado desde los lotes
-- de compra (precio_compra_clp) y el peso seco registrado en la deshidratación:
--
--   costo_seco_kg = Σ(precio compra) ÷ Σ(peso salida seco)
--
-- La recolección no tiene precio: solo entran los lotes CON precio (compra).
-- El rendimiento promedio (seco/fresco) es la base para sugerir cuánto
-- recolectar según las recetas planificadas (lo calcula el BFF).
-- =============================================================================

CREATE OR REPLACE VIEW public.v_infusion_costos
WITH (security_invoker = true) AS
SELECT
  mp.id    AS materia_prima_id,
  mp.nombre AS materia_prima,
  -- Costo CLP por kg de materia SECA: gasto real de compra ÷ peso seco obtenido.
  ROUND(SUM(le.precio_compra_clp) / NULLIF(SUM(ld.peso_salida_kg), 0), 0) AS costo_seco_kg_clp,
  -- Rendimiento promedio de TODOS los lotes deshidratados de la materia prima
  -- (independiente del precio: la recolección no tiene costo pero sí rendimiento).
  ROUND((
    SELECT AVG(ld2.rendimiento_pct)
    FROM public.infusion_lotes_deshidratado ld2
    JOIN public.infusion_lotes_entrada le2 ON le2.id = ld2.lote_entrada_id
    WHERE le2.materia_prima_id = mp.id AND ld2.rendimiento_pct IS NOT NULL
  ), 2) AS rendimiento_promedio_pct,
  COUNT(ld.id) AS lotes_con_costo
FROM public.infusion_materias_primas mp
LEFT JOIN public.infusion_lotes_entrada le
  ON le.materia_prima_id = mp.id AND le.precio_compra_clp IS NOT NULL
LEFT JOIN public.infusion_lotes_deshidratado ld
  ON ld.lote_entrada_id = le.id AND ld.peso_salida_kg IS NOT NULL
GROUP BY mp.id, mp.nombre
ORDER BY mp.nombre;

COMMENT ON VIEW public.v_infusion_costos IS
  'Costo por kg de materia seca (precio de compra ÷ peso seco) y rendimiento promedio por materia prima — base de costos y planificación de Infusiones.';
COMMENT ON COLUMN public.v_infusion_costos.costo_seco_kg_clp IS
  'CLP por kg de materia seca. Solo considera lotes de entrada CON precio de compra (la recolección no tiene); NULL si no hay compras registradas.';
