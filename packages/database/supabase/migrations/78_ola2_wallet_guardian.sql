-- Ola 2: Wallet Guardian — programas sello por producto + progreso + pass registrations

CREATE TABLE IF NOT EXISTS public.guardian_stamp_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  unidades_requeridas INT NOT NULL CHECK (unidades_requeridas > 0),
  unidad_gratis INT NOT NULL DEFAULT 1 CHECK (unidad_gratis > 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  canales TEXT[] NOT NULL DEFAULT ARRAY['web', 'feria', 'local'],
  wallet_label TEXT,
  imagen_url TEXT,
  bonus_resena BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stamp_programs_producto
  ON public.guardian_stamp_programs (producto_id)
  WHERE activo = true;

CREATE TABLE IF NOT EXISTS public.guardian_stamp_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.guardian_stamp_programs(id) ON DELETE CASCADE,
  unidades_acumuladas INT NOT NULL DEFAULT 0 CHECK (unidades_acumuladas >= 0),
  unidades_canjeadas INT NOT NULL DEFAULT 0 CHECK (unidades_canjeadas >= 0),
  ultima_venta_id TEXT REFERENCES public.ventas(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_stamp_progress_user
  ON public.guardian_stamp_progress (user_id);

CREATE TABLE IF NOT EXISTS public.guardian_stamp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.guardian_stamp_programs(id) ON DELETE CASCADE,
  venta_id TEXT REFERENCES public.ventas(id) ON DELETE SET NULL,
  resena_id UUID REFERENCES public.resenas_producto(id) ON DELETE SET NULL,
  unidades INT NOT NULL CHECK (unidades > 0),
  source TEXT NOT NULL CHECK (source IN ('web', 'feria', 'local', 'resena', 'qr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT stamp_event_ref CHECK (venta_id IS NOT NULL OR resena_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stamp_events_venta_program
  ON public.guardian_stamp_events (venta_id, program_id)
  WHERE venta_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stamp_events_resena_program
  ON public.guardian_stamp_events (resena_id, program_id)
  WHERE resena_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.wallet_pass_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('apple', 'google')),
  serial_number TEXT NOT NULL,
  pass_type_identifier TEXT,
  authentication_token TEXT NOT NULL,
  device_library_identifier TEXT,
  push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, serial_number, device_library_identifier)
);

CREATE INDEX IF NOT EXISTS idx_wallet_pass_user
  ON public.wallet_pass_registrations (user_id);

-- Incremento idempotente de sellos por líneas de venta
CREATE OR REPLACE FUNCTION public.increment_guardian_stamps(
  p_user_id UUID,
  p_venta_id TEXT,
  p_channel TEXT,
  p_lineas JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_line JSONB;
  v_product_id UUID;
  v_qty INT;
  v_program RECORD;
  v_updated JSONB := '[]'::jsonb;
BEGIN
  IF p_user_id IS NULL OR p_lineas IS NULL OR jsonb_typeof(p_lineas) <> 'array' THEN
    RETURN jsonb_build_object('success', true, 'skipped', true);
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lineas)
  LOOP
    v_product_id := COALESCE(
      NULLIF(v_line->>'productId', '')::uuid,
      NULLIF(v_line->>'producto_id', '')::uuid
    );
    v_qty := GREATEST(COALESCE((v_line->>'quantity')::int, (v_line->>'cantidad')::int, 1), 0);

    IF v_product_id IS NULL OR v_qty <= 0 THEN
      CONTINUE;
    END IF;

    FOR v_program IN
      SELECT *
      FROM guardian_stamp_programs
      WHERE producto_id = v_product_id
        AND activo = true
        AND (p_channel = ANY(canales) OR p_channel IS NULL)
    LOOP
      IF EXISTS (
        SELECT 1 FROM guardian_stamp_events
        WHERE venta_id = p_venta_id AND program_id = v_program.id
      ) THEN
        CONTINUE;
      END IF;

      INSERT INTO guardian_stamp_progress (user_id, program_id, unidades_acumuladas, ultima_venta_id)
      VALUES (p_user_id, v_program.id, v_qty, p_venta_id)
      ON CONFLICT (user_id, program_id) DO UPDATE
      SET
        unidades_acumuladas = guardian_stamp_progress.unidades_acumuladas + EXCLUDED.unidades_acumuladas,
        ultima_venta_id = EXCLUDED.ultima_venta_id,
        updated_at = now();

      INSERT INTO guardian_stamp_events (user_id, program_id, venta_id, unidades, source)
      VALUES (
        p_user_id,
        v_program.id,
        p_venta_id,
        v_qty,
        CASE
          WHEN p_channel IN ('feria', 'local') THEN p_channel
          ELSE 'web'
        END
      );

      v_updated := v_updated || jsonb_build_object(
        'program_id', v_program.id,
        'producto_id', v_product_id,
        'unidades', v_qty
      );
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_guardian_stamps(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_guardian_stamps(UUID, TEXT, TEXT, JSONB) TO service_role;

-- +1 sello simbólico al aprobar reseña guardian (si programa lo permite)
CREATE OR REPLACE FUNCTION public.bonus_stamp_resena(
  p_user_id UUID,
  p_producto_id UUID,
  p_resena_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program RECORD;
BEGIN
  FOR v_program IN
    SELECT *
    FROM guardian_stamp_programs
    WHERE producto_id = p_producto_id
      AND activo = true
      AND bonus_resena = true
  LOOP
    IF EXISTS (
      SELECT 1 FROM guardian_stamp_events
      WHERE resena_id = p_resena_id AND program_id = v_program.id
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO guardian_stamp_progress (user_id, program_id, unidades_acumuladas)
    VALUES (p_user_id, v_program.id, 1)
    ON CONFLICT (user_id, program_id) DO UPDATE
    SET
      unidades_acumuladas = guardian_stamp_progress.unidades_acumuladas + 1,
      updated_at = now();

    INSERT INTO guardian_stamp_events (user_id, program_id, resena_id, unidades, source)
    VALUES (p_user_id, v_program.id, p_resena_id, 1, 'resena');
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.bonus_stamp_resena(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bonus_stamp_resena(UUID, UUID, UUID) TO service_role;

-- Trigger: sellos al reclamar venta POS
CREATE OR REPLACE FUNCTION public.trigger_stamps_on_claim()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lineas JSONB;
BEGIN
  IF NEW.claim_status = 'claimed'
    AND (OLD.claim_status IS NULL OR OLD.claim_status = 'pending')
    AND NEW.claimed_by IS NOT NULL
  THEN
    v_lineas := COALESCE(NEW.productos, NEW.items, '[]'::jsonb);
    PERFORM increment_guardian_stamps(
      NEW.claimed_by,
      NEW.id,
      COALESCE(NEW.channel, NEW.origen, 'feria'),
      v_lineas
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_stamps_on_claim ON public.ventas;
CREATE TRIGGER trigger_stamps_on_claim
  AFTER UPDATE OF claim_status ON public.ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_stamps_on_claim();

-- Extender moderación reseña: bonus sello
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
        user_id, cantidad, tipo, referencia_id, referencia_tabla
      ) VALUES (
        v_resena.user_id, v_ciclos, 'resena_sensorial', p_resena_id::text, 'resenas_producto'
      );

      UPDATE public.resenas_producto
      SET ciclos_otorgados = v_ciclos
      WHERE id = p_resena_id;
    END IF;
  END IF;

  IF p_estado = 'aprobada'
    AND v_resena.modo = 'guardian'
    AND v_resena.user_id IS NOT NULL
  THEN
    PERFORM bonus_stamp_resena(v_resena.user_id, v_resena.producto_id, p_resena_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'estado', p_estado,
    'ciclos_otorgados', v_ciclos
  );
END;
$$;

-- RLS
ALTER TABLE public.guardian_stamp_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_stamp_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_stamp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_pass_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stamp_programs_public_read ON public.guardian_stamp_programs;
CREATE POLICY stamp_programs_public_read ON public.guardian_stamp_programs
  FOR SELECT USING (activo = true);

DROP POLICY IF EXISTS stamp_programs_admin ON public.guardian_stamp_programs;
CREATE POLICY stamp_programs_admin ON public.guardian_stamp_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'gerente' OR role = 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS stamp_progress_own ON public.guardian_stamp_progress;
CREATE POLICY stamp_progress_own ON public.guardian_stamp_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS stamp_progress_admin ON public.guardian_stamp_progress;
CREATE POLICY stamp_progress_admin ON public.guardian_stamp_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'gerente' OR role = 'tienda_admin')
    )
  );

DROP POLICY IF EXISTS stamp_events_own ON public.guardian_stamp_events;
CREATE POLICY stamp_events_own ON public.guardian_stamp_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS wallet_pass_own ON public.wallet_pass_registrations;
CREATE POLICY wallet_pass_own ON public.wallet_pass_registrations
  FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE public.guardian_stamp_programs IS
  'Programas buy-X-get-Y por producto para Wallet Guardian.';