-- =============================================================================
-- 217_20261001000000 — Economía de lealtad editable (engine ↔ beneficios_enjembre)
--
-- El motor canónico (packages/pricing/loyalty-engine.ts) corría con constantes
-- de código mientras el POS acreditaba frascos con su propia matemática local
-- (inventario.ts) y el checkout canjeaba puntos con bloques fijos. Esta
-- migración siembra TODAS las palancas en beneficios_enjembre — editable desde
-- Núcleo sin deploy — y el loader de Núcleo las pasa al engine.
--
-- Valores sembrados = comportamiento VIVO observado (no el ideal del package):
-- el retorno de frascos acredita 500 pts por frasco y 1.500 por lote de 10
-- (inventario.ts), no 50/150. Con esto el quote web del checkout muestra lo
-- mismo que el POS acredita, y todo queda en una sola fuente corregible.
-- =============================================================================

INSERT INTO public.beneficios_enjembre (clave, valor_numerico, descripcion) VALUES
  ('clp_gasto_por_ciclo',            1000, 'Pesos CLP de compra necesarios para acumular 1 ciclo de trayectoria'),
  ('ciclos_bienvenida_reposicion',   10,   'Ciclos de trayectoria acreditados al activar la Reposición'),
  ('puntos_por_frasco',              500,  'Puntos acreditados por frasco retornado (programa circular)'),
  ('ciclos_por_frasco',              2,    'Ciclos de trayectoria por frasco retornado (programa circular)'),
  ('puntos_bono_hito10',             1500, 'Puntos extra al completar un lote de 10 frascos retornados'),
  ('ciclos_bono_hito10',             10,   'Ciclos extra al completar un lote de 10 frascos retornados')
ON CONFLICT (clave) DO NOTHING;

-- El panel de configuración muestra esta descripción: sin jerga interna.
UPDATE public.beneficios_enjambre
SET descripcion = 'Multiplicador de precio Suscriptor (Club de Reposición)'
WHERE clave = 'mult_suscriptor' AND descripcion LIKE '%Cosecha%';
