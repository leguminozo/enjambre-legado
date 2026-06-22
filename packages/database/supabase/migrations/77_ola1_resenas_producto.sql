-- Ola 1: reseñas duales (anónima + guardian) con moderación y claim post-registro

CREATE TABLE IF NOT EXISTS public.resenas_producto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  modo TEXT NOT NULL CHECK (modo IN ('anonima', 'guardian')),
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'oculta')),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comentario_corto TEXT,
  cristalizacion_percibida TEXT,
  familia_aromatica TEXT,
  intensidad_fondo INT CHECK (intensidad_fondo IS NULL OR intensidad_fondo BETWEEN 1 AND 10),
  notas_personales TEXT,
  momento_consumo TEXT,
  maridaje TEXT,
  venta_id TEXT REFERENCES public.ventas(id) ON DELETE SET NULL,
  lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  anon_hash TEXT,
  display_name TEXT,
  ciclos_otorgados NUMERIC NOT NULL DEFAULT 0 CHECK (ciclos_otorgados >= 0),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT resenas_guardian_requires_user CHECK (modo <> 'guardian' OR user_id IS NOT NULL),
  CONSTRAINT resenas_anonima_requires_hash CHECK (modo <> 'anonima' OR anon_hash IS NOT NULL),
  CONSTRAINT resenas_anonima_comment CHECK (
    modo <> 'anonima' OR (comentario_corto IS NOT NULL AND char_length(comentario_corto) <= 280)
  )
);

CREATE INDEX IF NOT EXISTS idx_resenas_producto_public
  ON public.resenas_producto (producto_id, created_at DESC)
  WHERE estado = 'aprobada';

CREATE INDEX IF NOT EXISTS idx_resenas_producto_pending
  ON public.resenas_producto (estado, created_at DESC)
  WHERE estado = 'pendiente';

CREATE INDEX IF NOT EXISTS idx_resenas_anon_rate
  ON public.resenas_producto (anon_hash, producto_id, created_at DESC)
  WHERE modo = 'anonima';

CREATE INDEX IF NOT EXISTS idx_resenas_user
  ON public.resenas_producto (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Migrar guardian legacy desde resenas_sensoriales (solo si hay producto vinculado por lote)
INSERT INTO public.resenas_producto (
  producto_id,
  modo,
  estado,
  rating,
  cristalizacion_percibida,
  familia_aromatica,
  intensidad_fondo,
  notas_personales,
  lote_id,
  user_id,
  display_name,
  created_at
)
SELECT
  p.id,
  'guardian',
  'aprobada',
  LEAST(5, GREATEST(1, COALESCE(ROUND(rs.intensidad_fondo::numeric / 2), 4)))::smallint,
  rs.cristalizacion_percibida,
  rs.familia_aromatica,
  rs.intensidad_fondo,
  rs.notas_personales,
  rs.lote_id,
  rs.user_id,
  prof.full_name,
  rs.created_at
FROM public.resenas_sensoriales rs
JOIN public.lotes l ON l.id = rs.lote_id
JOIN public.productos p ON p.lote_id = l.id
LEFT JOIN public.profiles prof ON prof.id = rs.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.resenas_producto rp
  WHERE rp.user_id = rs.user_id
    AND rp.lote_id = rs.lote_id
    AND rp.modo = 'guardian'
);

CREATE TABLE IF NOT EXISTS public.resenas_claim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resena_id UUID NOT NULL REFERENCES public.resenas_producto(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  claimed_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resenas_claim_resena
  ON public.resenas_claim_tokens (resena_id);

-- Moderación + ciclos idempotentes (service_role / gerente vía BFF)
CREATE OR REPLACE FUNCTION public.moderar_resena_producto(
  p_resena_id UUID,
  p_estado TEXT,
  p_moderator_id UUID,
  p_ciclos_guardian NUMERIC DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resena public.resenas_producto%ROWTYPE;
  v_ciclos NUMERIC := 0;
BEGIN
  IF p_estado NOT IN ('aprobada', 'rechazada', 'oculta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_estado');
  END IF;

  SELECT * INTO v_resena
  FROM public.resenas_producto
  WHERE id = p_resena_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;

  IF v_resena.estado = p_estado THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;

  UPDATE public.resenas_producto
  SET
    estado = p_estado,
    moderated_at = now(),
    moderated_by = p_moderator_id,
    updated_at = now()
  WHERE id = p_resena_id;

  IF p_estado = 'aprobada'
    AND v_resena.modo = 'guardian'
    AND v_resena.user_id IS NOT NULL
    AND v_resena.venta_id IS NOT NULL
    AND v_resena.ciclos_otorgados = 0
  THEN
    v_ciclos := GREATEST(p_ciclos_guardian, 0);

    IF v_ciclos > 0 THEN
      INSERT INTO public.ciclos (
        user_id,
        cantidad,
        tipo,
        referencia_id,
        referencia_tabla
      ) VALUES (
        v_resena.user_id,
        v_ciclos,
        'resena_sensorial',
        p_resena_id::text,
        'resenas_producto'
      );

      UPDATE public.resenas_producto
      SET ciclos_otorgados = v_ciclos
      WHERE id = p_resena_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'estado', p_estado,
    'ciclos_otorgados', v_ciclos
  );
END;
$$;

REVOKE ALL ON FUNCTION public.moderar_resena_producto(UUID, TEXT, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderar_resena_producto(UUID, TEXT, UUID, NUMERIC) TO service_role;

-- RLS
ALTER TABLE public.resenas_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resenas_claim_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS resenas_producto_public_read ON public.resenas_producto;
CREATE POLICY resenas_producto_public_read ON public.resenas_producto
  FOR SELECT USING (estado = 'aprobada');

DROP POLICY IF EXISTS resenas_producto_own_read ON public.resenas_producto;
CREATE POLICY resenas_producto_own_read ON public.resenas_producto
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS resenas_producto_guardian_insert ON public.resenas_producto;
CREATE POLICY resenas_producto_guardian_insert ON public.resenas_producto
  FOR INSERT WITH CHECK (
    modo = 'guardian'
    AND auth.uid() = user_id
    AND estado = 'pendiente'
  );

DROP POLICY IF EXISTS resenas_producto_admin_all ON public.resenas_producto;
CREATE POLICY resenas_producto_admin_all ON public.resenas_producto
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND (role = 'gerente' OR role = 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS resenas_claim_admin ON public.resenas_claim_tokens;
CREATE POLICY resenas_claim_admin ON public.resenas_claim_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND (role = 'gerente' OR role = 'tienda_admin')
    )
  );

COMMENT ON TABLE public.resenas_producto IS
  'Reseñas duales: anónima (rápida) y guardian (huella sensorial + compra verificada).';