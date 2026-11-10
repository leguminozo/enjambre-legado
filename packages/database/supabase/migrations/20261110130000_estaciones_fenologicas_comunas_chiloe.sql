-- Migration 20261110130000: Estaciones fenológicas para comunas de Chiloé
-- Permite que el Oráculo Fenológico y el cálculo GDD se adapten dinámicamente
-- a la comuna y sector territorial del usuario en lugar de fijar Pureo.

INSERT INTO public.estaciones_fenologicas (nombre, lat, lng, activo)
SELECT v.nombre, v.lat, v.lng, v.activo
FROM (VALUES
  ('Castro, Chiloé', -42.472100, -73.773200, true),
  ('Ancud, Chiloé', -41.869700, -73.829000, true),
  ('Quellón, Chiloé', -43.118600, -73.616700, true),
  ('Chonchi, Chiloé', -42.623100, -73.774400, true),
  ('Dalcahue, Chiloé', -42.378900, -73.654200, true),
  ('Quemchi, Chiloé', -42.144400, -73.483300, true),
  ('Puqueldón (Isla Lemuy), Chiloé', -42.600000, -73.650000, true),
  ('Curaco de Vélez (Isla Quinchao), Chiloé', -42.433300, -73.600000, true),
  ('Quinchao (Achao), Chiloé', -42.466700, -73.500000, true)
) AS v(nombre, lat, lng, activo)
WHERE NOT EXISTS (
  SELECT 1 FROM public.estaciones_fenologicas ef WHERE ef.nombre = v.nombre
);
