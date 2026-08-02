-- 1003: Censo legal del Registro Territorial — campos exigidos por la Ley 21.489
-- y la ordenanza tipo (identidad, RUT, contacto, RUP, declaración de existencia
-- animal, prácticas sanitarias, método de control de varroa) + tabla de apiarios
-- declarados por cada actor (ubicación por sector/paraje y número de colmenas).

-- -----------------------------------------------------------------------------
-- 1. actores_registro: campos legales del censo
-- -----------------------------------------------------------------------------
ALTER TABLE public.actores_registro ADD COLUMN IF NOT EXISTS rut TEXT;
ALTER TABLE public.actores_registro ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.actores_registro ADD COLUMN IF NOT EXISTS practicas_sanitarias TEXT;
ALTER TABLE public.actores_registro ADD COLUMN IF NOT EXISTS metodo_control_varroa TEXT;
ALTER TABLE public.actores_registro ADD COLUMN IF NOT EXISTS declaracion_existencia_animal BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.actores_registro ADD COLUMN IF NOT EXISTS acepta_carta BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.actores_registro ADD COLUMN IF NOT EXISTS acepta_politica_datos BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.actores_registro ADD COLUMN IF NOT EXISTS completo BOOLEAN NOT NULL DEFAULT false;

-- -----------------------------------------------------------------------------
-- 2. apiarios_registro: apiarios declarados por cada actor del registro comunal
-- (residentes y mixtos). Las coordenadas son aproximadas (~1 km): el mapa
-- comunitario nunca expone la ubicación exacta de las colmenas.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.apiarios_registro (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id       UUID        NOT NULL REFERENCES public.actores_registro(id) ON DELETE CASCADE,
  nombre         TEXT,
  comuna         TEXT        NOT NULL,
  zona           TEXT        NOT NULL,                -- sector/paraje en texto
  lat_aproximada DOUBLE PRECISION,
  lng_aproximada DOUBLE PRECISION,
  n_colmenas     INTEGER     NOT NULL CHECK (n_colmenas > 0),
  categoria      TEXT        NOT NULL DEFAULT 'produccion'
                   CHECK (categoria IN ('produccion', 'polinizacion', 'seleccion_cria', 'otro')),
  activo         BOOLEAN     NOT NULL DEFAULT true,
  observaciones  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apiarios_registro_actor_id_idx   ON public.apiarios_registro (actor_id);
CREATE INDEX IF NOT EXISTS apiarios_registro_comuna_idx     ON public.apiarios_registro (comuna);
CREATE INDEX IF NOT EXISTS apiarios_registro_categoria_idx  ON public.apiarios_registro (categoria);

DROP TRIGGER IF EXISTS apiarios_registro_updated_at ON public.apiarios_registro;
CREATE TRIGGER apiarios_registro_updated_at
  BEFORE UPDATE ON public.apiarios_registro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: el actor gestiona los suyos; lectura comunitaria solo si consintió
-- el mapa comunitario (escalera de visibilidad de la Carta Constitutiva).
ALTER TABLE public.apiarios_registro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "apiarios_registro_own" ON public.apiarios_registro;
CREATE POLICY "apiarios_registro_own" ON public.apiarios_registro
  FOR ALL USING (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "apiarios_registro_community_read" ON public.apiarios_registro;
CREATE POLICY "apiarios_registro_community_read" ON public.apiarios_registro
  FOR SELECT USING (
    activo = true
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.actores_registro a
      WHERE a.id = actor_id
        AND a.consentimientos->>'mapa_comunitario' = 'true'
    )
  );

-- -----------------------------------------------------------------------------
-- 3. predios_facilitadores: rol catastral del predio (SII / nomenclatura)
-- -----------------------------------------------------------------------------
ALTER TABLE public.predios_facilitadores ADD COLUMN IF NOT EXISTS rol_predio TEXT;

-- -----------------------------------------------------------------------------
-- 4. Trigger de signup: leer aceptación de Carta y política de datos desde la
-- metadata del registro territorial (requisito de consentimiento informado).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_app_source text;
  v_referrer_id uuid;
BEGIN
  -- 1. Extraer metadata básica
  v_app_source := NEW.raw_user_meta_data->>'app_source';
  
  -- Si no existe app_source, inferir según dominios (legado) o forzar cliente
  IF v_app_source IS NULL THEN
    v_role := 'cliente';
  ELSIF v_app_source = 'tienda' THEN
    v_role := 'cliente';
  ELSIF v_app_source = 'campo' THEN
    v_role := 'rep_ventas';
  ELSIF v_app_source = 'nucleo_territorial' THEN
    v_role := 'territorial';
  ELSE
    v_role := 'cliente';
  END IF;

  -- Sobrescribir el rol si viene un rol duro para el equipo (solo para cuentas pre-autorizadas o fundadores)
  IF (NEW.email = 'gabriel.cuevas01@alumnos.uach.cl') THEN
    v_role := 'admin';
  END IF;

  -- 2. Insertar en profiles
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- 3. Lógica específica para administradores / dueños de empresa
  IF v_role = 'admin' THEN
    INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol)
    SELECT NEW.id, id, 'owner'
    FROM public.empresas
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. Lógica de Actor Territorial (si se registró por Núcleo Territorial)
  IF v_app_source = 'nucleo_territorial' THEN
    INSERT INTO public.actores_registro (
      user_id, 
      rol, 
      nombre_actor, 
      comuna, 
      region, 
      consentimientos,
      acepta_carta,
      acepta_politica_datos
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'territorial_rol', 'api_residente'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'territorial_comuna', 'Desconocida'),
      COALESCE(NEW.raw_user_meta_data->>'territorial_region', 'Los Lagos'),
      COALESCE((NEW.raw_user_meta_data->>'territorial_consentimientos')::jsonb, '{}'::jsonb),
      COALESCE((NEW.raw_user_meta_data->>'territorial_acepta_carta')::boolean, false),
      COALESCE((NEW.raw_user_meta_data->>'territorial_acepta_politica_datos')::boolean, false)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- 5. Sistema de Referidos (Invitaciones)
  -- Si el usuario ingresó un código de invitación (referrer_id) válido (UUID)
  IF NEW.raw_user_meta_data->>'referrer_id' IS NOT NULL THEN
    BEGIN
      v_referrer_id := (NEW.raw_user_meta_data->>'referrer_id')::uuid;
      -- Usar PERFORM en lugar de SELECT para ignorar el resultado de la función
      PERFORM public.complete_referral_signup(v_referrer_id, NEW.id);
    EXCEPTION WHEN OTHERS THEN
      -- Si el UUID es inválido o la función falla, ignorar para no interrumpir el registro
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;
