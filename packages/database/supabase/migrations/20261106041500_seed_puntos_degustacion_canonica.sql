-- =============================================================================
-- 20261106041500 — Puntos canónicos de degustación sensorial, feria y QR maestro
--
-- Siembra los canales permanentes de cata en vivo (FERIA, STAND, CHILE, DEGUSTACION,
-- CREACIONES, MIELES_CHILE, WEB) para garantizar que los QRs de atril y mesa
-- persistan sesiones en `public.perc_sesiones` sin depender de altas manuales.
-- =============================================================================

INSERT INTO public.b2b_puntos_venta (
  codigo_acceso,
  nombre,
  tipo,
  ciudad,
  estado,
  origen,
  publico,
  notas
) VALUES
  ('FERIA', 'Estación de Degustación en Vivo · Stand Feria', 'feria_evento', 'Chile', 'activo', 'marca', true, 'Punto maestro canónico para degustaciones y catas en vivo en ferias y eventos territoriales.'),
  ('STAND', 'Estación de Degustación en Vivo · Stand Feria', 'feria_evento', 'Chile', 'activo', 'marca', true, 'Punto maestro para atril de cata presencial.'),
  ('DEGUSTACION', 'Estación de Degustación en Vivo · Stand Feria', 'feria_evento', 'Chile', 'activo', 'marca', true, 'Punto maestro integral de degustaciones sensoriales.'),
  ('CREACIONES', 'Estación de Degustación en Vivo · Creaciones de Mesa', 'feria_evento', 'Chile', 'activo', 'marca', true, 'Punto de cata dedicado a creaciones de mesa y fortificaciones.'),
  ('CHILE', 'Atlas Botánico de Chile · Mieles Monoflorales', 'feria_evento', 'Chile', 'activo', 'marca', true, 'Pabellón Atlas Botánico de Chile para mieles monoflorales.'),
  ('MIELES_CHILE', 'Atlas Botánico de Chile · Mieles Monoflorales', 'feria_evento', 'Chile', 'activo', 'marca', true, 'Pabellón Atlas Botánico de Chile.'),
  ('WEB', 'Portal Web · Degustación Sensorial', 'feria_evento', 'Chile', 'activo', 'marca', true, 'Cata sensorial iniciada desde tienda web oficial.')
ON CONFLICT (codigo_acceso) DO UPDATE SET
  publico = true,
  estado = 'activo',
  updated_at = now();
