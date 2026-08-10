-- =============================================================================
-- Capa 4 — Percepción semántica profunda (instrumento CATA + diferencial semántico)
--
-- Estado del arte (docs/MICROCANALES_CIENCIA_Y_GOBERNANZA.md §3):
--   · Instrumento de ~60s: 3 pares bipolares (Suave-Intenso · Dulce-Ácido ·
--     Líquida-Cremosa) + agrado 1–5 (medida hedónica que cierra el modelo) +
--     chips CATA progresivos (sabor/aroma obligatorios; textura/color/
--     persistencia opcionales) + abierta "¿A qué te recuerda?" + intención
--     de recompra.
--   · Chips en catálogo CONFIGURABLE (perc_chip_catalogos): la elicitación
--     local de Chiloé (fase 0) ajusta el vocabulario sin tocar código.
--     Sembrados con el léxico del estado del arte: 5 descriptores que
--     discriminan en mieles chilenas — ahumado, caramelo, damasco, propóleos,
--     vainilla — + flora endémica editable.
--   · Contrabalanceo: seed_orden randomiza el orden de chips por sesión
--     (efecto de orden documentado en CATA).
--   · tipo_evaluador (consumidor / semi_entrenado): preparado para el
--     protocolo de panel distribuido ST-CATA (kit de referentes físicos).
--   · Sesión ANÓNIMA válida (cliente_id nullable): la percepción no depende
--     de la identidad; la identidad solo suma puntos.
--   · Consentimiento explícito por sesión.
--   · RLS: un punto de venta ve SOLO sus sesiones (privacidad entre puntos);
--     los agregados globales solo para la marca.
-- =============================================================================

-- ── Catálogo de chips (configurable, sembrado con el estado del arte) ────────
CREATE TABLE IF NOT EXISTS public.perc_chip_catalogos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloque     TEXT NOT NULL CHECK (bloque IN ('sabor', 'aroma', 'textura', 'color')),
  chip       TEXT NOT NULL,
  activo     BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bloque, chip)
);

COMMENT ON TABLE public.perc_chip_catalogos IS
  'Catálogo configurable de chips CATA por bloque. Sembrado con el léxico del estado del arte (IHC/DLG + panel chileno); la elicitación local ajusta el vocabulario sin código.';

INSERT INTO public.perc_chip_catalogos (bloque, chip, sort_order) VALUES
  ('sabor', 'dulce', 10), ('sabor', 'acido', 20), ('sabor', 'amargo', 30),
  ('aroma', 'floral', 10), ('aroma', 'citrico', 20), ('aroma', 'frutal', 30),
  ('aroma', 'herbal', 40), ('aroma', 'ahumado', 50), ('aroma', 'caramelo', 60),
  ('aroma', 'propoleos', 70), ('aroma', 'mentolado', 80), ('aroma', 'especiado', 90),
  ('aroma', 'vainilla', 100), ('aroma', 'damasco', 110), ('aroma', 'tostado', 120),
  ('textura', 'fluida', 10), ('textura', 'espesa', 20), ('textura', 'cremosa', 30),
  ('textura', 'cristalina_fina', 40), ('textura', 'cristalina_gruesa', 50), ('textura', 'pegajosa', 60),
  ('color', 'blanquecina', 10), ('color', 'ambar_claro', 20), ('color', 'ambar', 30), ('color', 'oscura', 40)
ON CONFLICT (bloque, chip) DO NOTHING;

-- ── Sesiones ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perc_sesiones (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  punto_venta_id     UUID REFERENCES public.b2b_puntos_venta(id) ON DELETE SET NULL,
  producto_id        UUID REFERENCES public.productos(id) ON DELETE SET NULL,  -- qué probó (vincula a reseña)
  cliente_id         UUID REFERENCES public.fid_clientes(id) ON DELETE SET NULL,  -- nullable: sesión anónima válida
  codigo_punto       TEXT,  -- snapshot del código escaneado
  origen             TEXT NOT NULL DEFAULT 'qr' CHECK (origen IN ('qr', 'portal', 'web')),
  completo           BOOLEAN NOT NULL DEFAULT false,
  seed_orden         INT,  -- contrabalanceo: semilla del orden de chips
  agrado_1_5         INT CHECK (agrado_1_5 IS NULL OR agrado_1_5 BETWEEN 1 AND 5),
  intencion_recompra BOOLEAN,
  tipo_evaluador     TEXT NOT NULL DEFAULT 'consumidor' CHECK (tipo_evaluador IN ('consumidor', 'semi_entrenado')),
  consentimiento     BOOLEAN NOT NULL DEFAULT false,  -- percepción + contacto (explícito)
  moderada_flag      BOOLEAN NOT NULL DEFAULT false,  -- sesión ligada a reseña rechazada: sí queda en agregados anónimos
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perc_sesiones_punto ON public.perc_sesiones (punto_venta_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perc_sesiones_producto ON public.perc_sesiones (producto_id);
CREATE INDEX IF NOT EXISTS idx_perc_sesiones_cliente ON public.perc_sesiones (cliente_id);

COMMENT ON TABLE public.perc_sesiones IS
  'Sesión de percepción: una degustación calificada con el instrumento CATA + pares semánticos. Centraliza la percepción; las reseñas de tienda publican una proyección de la sesión.';

-- ── Pares semánticos (diferencial) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perc_pares (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id  UUID NOT NULL REFERENCES public.perc_sesiones(id) ON DELETE CASCADE,
  par        TEXT NOT NULL,  -- ej. 'suave/intenso'
  valor      INT NOT NULL CHECK (valor BETWEEN -3 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perc_pares_sesion ON public.perc_pares (sesion_id);

-- ── Chips seleccionados (snapshot del catálogo) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.perc_chips (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id  UUID NOT NULL REFERENCES public.perc_sesiones(id) ON DELETE CASCADE,
  bloque     TEXT NOT NULL,
  chip       TEXT NOT NULL,  -- snapshot (el catálogo puede evolucionar)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perc_chips_sesion ON public.perc_chips (sesion_id);
CREATE INDEX IF NOT EXISTS idx_perc_chips_chip ON public.perc_chips (bloque, chip);

-- ── Respuestas abiertas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perc_abiertas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesion_id  UUID NOT NULL REFERENCES public.perc_sesiones(id) ON DELETE CASCADE,
  pregunta   TEXT NOT NULL DEFAULT '¿A qué te recuerda?',
  texto      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perc_abiertas_sesion ON public.perc_abiertas (sesion_id);

-- ── updated_at ───────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS perc_sesiones_updated_at ON public.perc_sesiones;
CREATE TRIGGER perc_sesiones_updated_at
  BEFORE UPDATE ON public.perc_sesiones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.perc_chip_catalogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perc_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perc_pares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perc_chips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perc_abiertas ENABLE ROW LEVEL SECURITY;

-- Catálogo: lectura pública (el instrumento lo consume la landing)
DROP POLICY IF EXISTS perc_chip_catalogos_select_p ON public.perc_chip_catalogos;
CREATE POLICY perc_chip_catalogos_select_p ON public.perc_chip_catalogos
  FOR SELECT USING (true);

DROP POLICY IF EXISTS perc_chip_catalogos_admin_all_p ON public.perc_chip_catalogos;
CREATE POLICY perc_chip_catalogos_admin_all_p ON public.perc_chip_catalogos
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

-- Sesiones: admin todo · dueño del punto SOLO las suyas · el resto nada
-- (los flujos públicos escriben vía admin client del BFF con rate-limit)
DROP POLICY IF EXISTS perc_sesiones_admin_all_p ON public.perc_sesiones;
CREATE POLICY perc_sesiones_admin_all_p ON public.perc_sesiones
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS perc_sesiones_punto_select_p ON public.perc_sesiones;
CREATE POLICY perc_sesiones_punto_select_p ON public.perc_sesiones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  );

-- Hijas (pares/chips/abiertas): acceso vía la sesión (admin o dueño del punto)
DROP POLICY IF EXISTS perc_pares_admin_all_p ON public.perc_pares;
CREATE POLICY perc_pares_admin_all_p ON public.perc_pares
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS perc_pares_punto_select_p ON public.perc_pares;
CREATE POLICY perc_pares_punto_select_p ON public.perc_pares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.perc_sesiones s
      JOIN public.b2b_puntos_venta p ON p.id = s.punto_venta_id
      WHERE s.id = sesion_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS perc_chips_admin_all_p ON public.perc_chips;
CREATE POLICY perc_chips_admin_all_p ON public.perc_chips
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS perc_chips_punto_select_p ON public.perc_chips;
CREATE POLICY perc_chips_punto_select_p ON public.perc_chips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.perc_sesiones s
      JOIN public.b2b_puntos_venta p ON p.id = s.punto_venta_id
      WHERE s.id = sesion_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS perc_abiertas_admin_all_p ON public.perc_abiertas;
CREATE POLICY perc_abiertas_admin_all_p ON public.perc_abiertas
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS perc_abiertas_punto_select_p ON public.perc_abiertas;
CREATE POLICY perc_abiertas_punto_select_p ON public.perc_abiertas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.perc_sesiones s
      JOIN public.b2b_puntos_venta p ON p.id = s.punto_venta_id
      WHERE s.id = sesion_id AND p.user_id = auth.uid()
    )
  );
