-- =============================================================================
-- 20260929120000 — Vigencia temporal de colmena en suscriptor_config y asignación rotativa
--
-- 1. Agrega campos de vigencia temporal y estado a suscriptor_config.
-- 2. Agrega flag is_centinela a colmenas para vitrina pública de referencia.
-- 3. Habilita políticas RLS para lectura de telemetría (peso_records e inspecciones).
-- 4. Define función asignar_colmena_rotativa() para asignación automática al pagar.
-- =============================================================================

-- 1. Campos de vigencia y ciclo de vida en suscriptor_config
ALTER TABLE public.suscriptor_config
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vigente_hasta TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'expirada')),
  ADD COLUMN IF NOT EXISTS asignado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_suscriptor_config_vigencia
  ON public.suscriptor_config(user_id, vigente_hasta, estado);

-- 2. Flag is_centinela en colmenas para vitrina pública
ALTER TABLE public.colmenas
  ADD COLUMN IF NOT EXISTS is_centinela BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_colmenas_is_centinela
  ON public.colmenas(is_centinela) WHERE is_centinela = true;

-- Designar Colmena Centinela si ya existe alguna colmena en la base
UPDATE public.colmenas
SET is_centinela = true
WHERE id = (
  SELECT id FROM public.colmenas
  WHERE name ILIKE '%centinela%' OR name ILIKE '%04%'
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM public.colmenas WHERE is_centinela = true);

-- Si no hubo match por nombre, marcar la primera activa
UPDATE public.colmenas
SET is_centinela = true
WHERE id = (
  SELECT id FROM public.colmenas
  ORDER BY created_at ASC
  LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM public.colmenas WHERE is_centinela = true);

-- 3. Políticas RLS para telemetría de suscriptor y centinela pública

-- Suscriptores pueden leer los registros de peso de su colmena
DROP POLICY IF EXISTS peso_records_suscriptor_select ON public.peso_records;
CREATE POLICY peso_records_suscriptor_select ON public.peso_records
  FOR SELECT USING (
    colmena_id IN (
      SELECT colmena_id FROM public.suscriptor_config
      WHERE user_id = auth.uid()
        AND (vigente_hasta IS NULL OR vigente_hasta >= NOW())
        AND estado = 'activa'
    )
  );

-- Suscriptores pueden leer inspecciones (bitácora) de su colmena
DROP POLICY IF EXISTS inspecciones_suscriptor_select ON public.inspecciones;
CREATE POLICY inspecciones_suscriptor_select ON public.inspecciones
  FOR SELECT USING (
    colmena_id IN (
      SELECT colmena_id FROM public.suscriptor_config
      WHERE user_id = auth.uid()
        AND (vigente_hasta IS NULL OR vigente_hasta >= NOW())
        AND estado = 'activa'
    )
  );

-- Lectura pública para la Colmena Centinela de muestra
DROP POLICY IF EXISTS colmenas_centinela_public_select ON public.colmenas;
CREATE POLICY colmenas_centinela_public_select ON public.colmenas
  FOR SELECT USING (is_centinela = true);

DROP POLICY IF EXISTS apiarios_centinela_public_select ON public.apiarios;
CREATE POLICY apiarios_centinela_public_select ON public.apiarios
  FOR SELECT USING (
    id IN (SELECT apiario_id FROM public.colmenas WHERE is_centinela = true)
  );

DROP POLICY IF EXISTS peso_records_centinela_public_select ON public.peso_records;
CREATE POLICY peso_records_centinela_public_select ON public.peso_records
  FOR SELECT USING (
    colmena_id IN (SELECT id FROM public.colmenas WHERE is_centinela = true)
  );

DROP POLICY IF EXISTS inspecciones_centinela_public_select ON public.inspecciones;
CREATE POLICY inspecciones_centinela_public_select ON public.inspecciones
  FOR SELECT USING (
    colmena_id IN (SELECT id FROM public.colmenas WHERE is_centinela = true)
  );

-- 4. Función de asignación rotativa balanceada
CREATE OR REPLACE FUNCTION public.asignar_colmena_rotativa(
    p_user_id UUID,
    p_subscription_id UUID DEFAULT NULL,
    p_vigencia_dias INT DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_colmena_id UUID;
    v_vigencia TIMESTAMPTZ;
BEGIN
    -- Calcular fecha de vigencia
    v_vigencia := NOW() + (GREATEST(p_vigencia_dias, 1) || ' days')::INTERVAL;

    -- 1. Seleccionar colmena activa con salud óptima,
    -- balanceando la carga (menor número de suscriptores activos)
    SELECT c.id INTO v_colmena_id
    FROM public.colmenas c
    LEFT JOIN public.suscriptor_config sc
      ON sc.colmena_id = c.id
      AND (sc.vigente_hasta IS NULL OR sc.vigente_hasta >= NOW())
      AND sc.estado = 'activa'
    WHERE c.health = 'optimal' OR c.health = 'buena' OR c.health IS NULL
    GROUP BY c.id, c.created_at
    ORDER BY COUNT(sc.user_id) ASC, c.created_at ASC
    LIMIT 1;

    -- Fallback si no encuentra con filtro de salud: primera disponible
    IF v_colmena_id IS NULL THEN
        SELECT id INTO v_colmena_id
        FROM public.colmenas
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    -- Si no hay colmenas en el apiario todavía, salir
    IF v_colmena_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- 2. Upsert en suscriptor_config
    INSERT INTO public.suscriptor_config (
        user_id,
        colmena_id,
        subscription_id,
        vigente_hasta,
        estado,
        asignado_en
    ) VALUES (
        p_user_id,
        v_colmena_id,
        p_subscription_id,
        v_vigencia,
        'activa',
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        colmena_id = EXCLUDED.colmena_id,
        subscription_id = COALESCE(EXCLUDED.subscription_id, public.suscriptor_config.subscription_id),
        vigente_hasta = EXCLUDED.vigente_hasta,
        estado = 'activa',
        asignado_en = NOW();

    RETURN v_colmena_id;
END;
$$;

COMMENT ON FUNCTION public.asignar_colmena_rotativa(UUID, UUID, INT)
  IS 'Asigna o renueva automáticamente una colmena del bosque nativo a un suscriptor activo con vigencia temporal balanceada.';
