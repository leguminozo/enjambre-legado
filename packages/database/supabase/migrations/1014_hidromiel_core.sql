-- =============================================================================
-- 1014_hidromiel_core.sql — Módulo Hidromiel (herramienta libre de construcción)
--
-- Principio de diseño: nada de catálogos cerrados ni transiciones forzadas.
-- El usuario construye su proceso desde la raíz:
--   · estado  → TEXT libre (desviación intencional de la convención TEXT+CHECK)
--   · mediciones → tipo/unidad libres (densidad, temperatura, pH, Brix, ...)
--   · ingredientes → nombre/cantidad/unidad libres (miel, agua, frutos, ...)
--   · etapas → línea de tiempo libre (bitácora de campo, sin orden obligatorio)
-- La UI ofrece sugerencias (chips/datalist) que solo rellenan el input.
-- =============================================================================

-- ── Lotes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hidromiel_lotes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT UNIQUE,          -- HM-YYYY-#### (generado en BFF; solo etiqueta)
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id            UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre                TEXT,                 -- nombre libre del lote
  miel_lote_id          UUID REFERENCES public.lotes(id) ON DELETE SET NULL, -- trazabilidad OPCIONAL
  fecha_inicio          TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado                TEXT NOT NULL DEFAULT 'fermentando', -- libre, sin CHECK
  volumen_litros        NUMERIC(6, 2) CHECK (volumen_litros IS NULL OR volumen_litros > 0),
  densidad_inicial      NUMERIC(6, 4) CHECK (densidad_inicial IS NULL OR densidad_inicial BETWEEN 0.980 AND 1.200),
  densidad_final        NUMERIC(6, 4) CHECK (densidad_final IS NULL OR densidad_final BETWEEN 0.980 AND 1.200),
  levadura_cepa         TEXT,                 -- texto libre (silvestre, EC-1118, ...)
  co2_target_vol        NUMERIC(4, 2) CHECK (co2_target_vol IS NULL OR co2_target_vol BETWEEN 0 AND 6),
  presion_target_bar    NUMERIC(4, 2) CHECK (presion_target_bar IS NULL OR presion_target_bar >= 0),
  temperatura_fermentacion NUMERIC(4, 1),
  n_botellas            INT CHECK (n_botellas IS NULL OR n_botellas >= 0),
  costo_insumos         INT NOT NULL DEFAULT 0 CHECK (costo_insumos >= 0), -- CLP
  costo_envases         INT NOT NULL DEFAULT 0 CHECK (costo_envases >= 0), -- CLP
  nota_personal         INT CHECK (nota_personal IS NULL OR nota_personal BETWEEN 1 AND 10),
  observaciones         TEXT,
  publico               BOOLEAN NOT NULL DEFAULT false,  -- habilita pasaporte QR público
  relato_publico        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hidromiel_lotes_empresa_fecha
  ON public.hidromiel_lotes (empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hidromiel_lotes_estado
  ON public.hidromiel_lotes (estado);
CREATE INDEX IF NOT EXISTS idx_hidromiel_lotes_miel
  ON public.hidromiel_lotes (miel_lote_id);

COMMENT ON TABLE public.hidromiel_lotes IS
  'Lotes de hidromiel: construcción libre del proceso (estado, parámetros, costos y trazabilidad opcional al lote de miel).';

-- ── Ingredientes (receta libre) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hidromiel_ingredientes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id    UUID NOT NULL REFERENCES public.hidromiel_lotes(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,               -- libre (miel, agua, frutos del bosque, ...)
  cantidad   NUMERIC(10, 3),              -- libre (kg, L, g, ...)
  unidad     TEXT,                        -- unidad libre
  nota       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hidromiel_ingredientes_lote
  ON public.hidromiel_ingredientes (lote_id);

COMMENT ON TABLE public.hidromiel_ingredientes IS
  'Receta del lote: ingredientes de nombre/cantidad/unidad libres (sin catálogo).';

-- ── Mediciones (diario científico libre) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hidromiel_mediciones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id    UUID NOT NULL REFERENCES public.hidromiel_lotes(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,               -- libre (densidad, temperatura, pH, presión, Brix, ...)
  valor      NUMERIC(10, 4),              -- numérico libre; NULL = observación sin número
  unidad     TEXT,                        -- unidad libre
  fecha      TIMESTAMPTZ NOT NULL DEFAULT now(),
  nota       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hidromiel_mediciones_lote_tipo_fecha
  ON public.hidromiel_mediciones (lote_id, tipo, fecha);

COMMENT ON TABLE public.hidromiel_mediciones IS
  'Mediciones de tipo/valor/unidad libres por lote — la curva grafica cualquier tipo numérico registrado.';

-- ── Etapas (línea de tiempo libre) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hidromiel_etapas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id    UUID NOT NULL REFERENCES public.hidromiel_lotes(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,               -- libre (inicio, trasiego, embotellado, degüelle, ...)
  fecha      TIMESTAMPTZ NOT NULL DEFAULT now(),
  nota       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hidromiel_etapas_lote_fecha
  ON public.hidromiel_etapas (lote_id, fecha);

COMMENT ON TABLE public.hidromiel_etapas IS
  'Bitácora de etapas del lote: línea de tiempo libre, sin transiciones obligatorias.';

-- ── updated_at (función compartida definida en 991) ──────────────────────────
DROP TRIGGER IF EXISTS hidromiel_lotes_updated_at ON public.hidromiel_lotes;
CREATE TRIGGER hidromiel_lotes_updated_at
  BEFORE UPDATE ON public.hidromiel_lotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.hidromiel_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidromiel_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidromiel_mediciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidromiel_etapas ENABLE ROW LEVEL SECURITY;

-- Lotes: acceso org-scoped (patrón 1013)
DROP POLICY IF EXISTS hidromiel_lotes_own_p ON public.hidromiel_lotes;
CREATE POLICY hidromiel_lotes_own_p ON public.hidromiel_lotes
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

-- Lotes públicos: lectura anónima para el pasaporte QR (patrón lotes)
DROP POLICY IF EXISTS hidromiel_lotes_publico_p ON public.hidromiel_lotes;
CREATE POLICY hidromiel_lotes_publico_p ON public.hidromiel_lotes
  FOR SELECT USING (publico = true);

-- Hijas: acceso vía el lote (patrón inventario_movimientos) + lectura pública
DROP POLICY IF EXISTS hidromiel_ingredientes_all_p ON public.hidromiel_ingredientes;
CREATE POLICY hidromiel_ingredientes_all_p ON public.hidromiel_ingredientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hidromiel_lotes l
      WHERE l.id = lote_id
        AND (l.user_id = auth.uid() OR public.is_gerente() OR public.has_empresa_access(l.empresa_id))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hidromiel_lotes l
      WHERE l.id = lote_id
        AND (l.user_id = auth.uid() OR public.has_empresa_access(l.empresa_id))
    )
  );

DROP POLICY IF EXISTS hidromiel_ingredientes_publico_p ON public.hidromiel_ingredientes;
CREATE POLICY hidromiel_ingredientes_publico_p ON public.hidromiel_ingredientes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hidromiel_lotes l WHERE l.id = lote_id AND l.publico = true)
  );

DROP POLICY IF EXISTS hidromiel_mediciones_all_p ON public.hidromiel_mediciones;
CREATE POLICY hidromiel_mediciones_all_p ON public.hidromiel_mediciones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hidromiel_lotes l
      WHERE l.id = lote_id
        AND (l.user_id = auth.uid() OR public.is_gerente() OR public.has_empresa_access(l.empresa_id))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hidromiel_lotes l
      WHERE l.id = lote_id
        AND (l.user_id = auth.uid() OR public.has_empresa_access(l.empresa_id))
    )
  );

DROP POLICY IF EXISTS hidromiel_mediciones_publico_p ON public.hidromiel_mediciones;
CREATE POLICY hidromiel_mediciones_publico_p ON public.hidromiel_mediciones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hidromiel_lotes l WHERE l.id = lote_id AND l.publico = true)
  );

DROP POLICY IF EXISTS hidromiel_etapas_all_p ON public.hidromiel_etapas;
CREATE POLICY hidromiel_etapas_all_p ON public.hidromiel_etapas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hidromiel_lotes l
      WHERE l.id = lote_id
        AND (l.user_id = auth.uid() OR public.is_gerente() OR public.has_empresa_access(l.empresa_id))
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hidromiel_lotes l
      WHERE l.id = lote_id
        AND (l.user_id = auth.uid() OR public.has_empresa_access(l.empresa_id))
    )
  );

DROP POLICY IF EXISTS hidromiel_etapas_publico_p ON public.hidromiel_etapas;
CREATE POLICY hidromiel_etapas_publico_p ON public.hidromiel_etapas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.hidromiel_lotes l WHERE l.id = lote_id AND l.publico = true)
  );

-- ── Realtime (patrón 20260804000000: idempotente) ────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.hidromiel_lotes;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.hidromiel_ingredientes;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.hidromiel_mediciones;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.hidromiel_etapas;
EXCEPTION WHEN duplicate_object THEN NULL;
END$$;
