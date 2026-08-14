-- =============================================================================
-- 20260812081000 — Configuración central de beneficios del Enjambre
--
-- Única fuente de verdad de los valores de negocio que el hub "Únete al
-- Enjambre" promete y que el checkout aplica: multiplicadores por rol
-- comercial (antes hardcodeados en packages/pricing/cart-pricing.ts) y los
-- puntos de bienvenida. Editable desde núcleo (PATCH /api/enjambre/
-- configuracion) sin deploy, para corregir o perfeccionar beneficios.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.beneficios_enjambre (
  clave TEXT PRIMARY KEY,
  valor_numerico NUMERIC NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: mismos valores que cart-pricing tenía hardcodeados (0.70/0.80/0.90/
-- 0.95, umbral 10) y el monto de bienvenida que el copy de la tienda ya
-- prometía ("100 pts al activar la Reposición").
INSERT INTO public.beneficios_enjambre (clave, valor_numerico, descripcion) VALUES
  ('welcome_points',  100,   'Puntos de bienvenida al unirse al Enjambre'),
  ('mult_embajador',  0.70,  'Multiplicador de precio Embajador (creador)'),
  ('mult_revendedor', 0.80,  'Multiplicador de precio Revendedor (mayorista B2B)'),
  ('mult_suscriptor', 0.90,  'Multiplicador de precio Suscriptor (Club Cosecha)'),
  ('mult_volumen',    0.95,  'Multiplicador adicional por volumen (revendedor/embajador)'),
  ('volumen_pedidos', 10,    'Pedidos mínimos para aplicar mult_volumen')
ON CONFLICT (clave) DO NOTHING;

ALTER TABLE public.beneficios_enjambre ENABLE ROW LEVEL SECURITY;

-- Los descuentos y montos no son secretos: lectura pública (anon + auth).
CREATE POLICY "beneficios_enjambre_lectura_publica"
  ON public.beneficios_enjambre FOR SELECT
  USING (true);

-- Solo admin puede corregir los valores (panel de núcleo).
CREATE POLICY "beneficios_enjambre_escritura_admin"
  ON public.beneficios_enjambre FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON public.beneficios_enjambre TO anon, authenticated;
-- Escritura permitida a authenticated pero filtrada por RLS (is_admin()).
GRANT INSERT, UPDATE, DELETE ON public.beneficios_enjambre TO authenticated;
