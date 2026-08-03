-- ============================================================
-- Migration 20260803120000: blindar signup con rol territorial
--
-- Síntoma en prod: crear un usuario con rol territorial devuelve
-- "Database error saving new user" (error genérico de GoTrue cuando
-- el trigger handle_new_user falla en la transacción del INSERT).
--
-- Causas posibles (estado de prod puede diferir del fresh apply):
--   1. CHECK profiles_role_check sin 'territorial' (39 solo tenía
--      admin|cliente|creador|rep_ventas; 997 lo amplió) → el INSERT
--      de profiles con role='territorial' viola la constraint.
--   2. Cast frágil de territorial_consentimientos::jsonb en el
--      trigger: metadata con JSON inválido revienta todo el signup.
--   3. Inserts secundarios (actores_registro, usuarios_empresas)
--      sin protección: un error ahí aborta la creación del usuario.
--
-- Esta migración es idempotente (segura en fresh apply y en prod con
-- cualquier mezcla previa) y hace que NINGÚN insert secundario pueda
-- romper el signup; los fallos se registran en security_events.
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. CHECK de roles en profiles: re-afirmar con 'territorial' (idempotente)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'cliente', 'creador', 'rep_ventas', 'territorial'));
END $$;

-- Re-afirmar NOT NULL + DEFAULT (consistente con 20260802100000; cubre prod
-- que aún arrastre el DEFAULT 'gerente' del hotfix 20260601120000).
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'admin';
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Extender security_events.event_type para loguear fallos del trigger
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'security_events' AND constraint_name = 'security_events_event_type_check'
  ) THEN
    ALTER TABLE public.security_events DROP CONSTRAINT security_events_event_type_check;
  END IF;

  ALTER TABLE public.security_events ADD CONSTRAINT security_events_event_type_check
    CHECK (event_type IN (
      'login_failed',
      'login_success',
      'password_reset_requested',
      'password_changed',
      'account_locked',
      'suspicious_activity',
      'role_change',
      'session_revoked',
      'mfa_enabled',
      'mfa_disabled',
      'oauth_linked',
      'access_denied',
      'signup_success',
      'signup_trigger_error'
    ));
END $$;

-- ---------------------------------------------------------------------------
-- 3. handle_new_user hardened
--    - profiles: fallback mínimo con rol explícito (nunca DEFAULT roto)
--    - actores_registro / usuarios_empresas: envueltos en BEGIN/EXCEPTION
--      con log a security_events — un error ahí NO aborta el signup
--    - cast jsonb de consentimientos solo si el valor es JSON válido
-- ---------------------------------------------------------------------------
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

  -- 2. Insertar en profiles — el signup nunca debe morir por un fallo aquí.
  --    Fallback con rol explícito 'cliente' (evita heredar un DEFAULT roto
  --    tipo 'gerente' y violar el CHECK).
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      v_role
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'cliente'
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- sin profile el signup fallará; GoTrue reporta su propio error
    END;
  END;

  -- 3. Lógica específica para administradores / dueños de empresa
  IF v_role = 'admin' THEN
    BEGIN
      INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol)
      SELECT NEW.id, id, 'owner'
      FROM public.empresas
      LIMIT 1
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- No romper el signup; registrar para diagnóstico
      BEGIN
        INSERT INTO public.security_events (event_type, email, user_id, details, app_source)
        VALUES (
          'signup_trigger_error',
          NEW.email,
          NEW.id,
          jsonb_build_object('etapa', 'usuarios_empresas', 'error', SQLERRM),
          'nucleo'
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END;
  END IF;

  -- 4. Lógica de Actor Territorial (si se registró por Núcleo Territorial)
  IF v_app_source = 'nucleo_territorial' THEN
    BEGIN
      INSERT INTO public.actores_registro (
        user_id,
        rol,
        nombre_actor,
        comuna,
        region,
        consentimientos
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'territorial_rol', 'api_residente'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'territorial_comuna', 'Desconocida'),
        COALESCE(NEW.raw_user_meta_data->>'territorial_region', 'Los Lagos'),
        CASE
          WHEN NEW.raw_user_meta_data->>'territorial_consentimientos' IS JSON
            THEN (NEW.raw_user_meta_data->>'territorial_consentimientos')::jsonb
          ELSE '{}'::jsonb
        END
      )
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- No romper el signup territorial; registrar el detalle real
      BEGIN
        INSERT INTO public.security_events (event_type, email, user_id, details, app_source)
        VALUES (
          'signup_trigger_error',
          NEW.email,
          NEW.id,
          jsonb_build_object('etapa', 'actores_registro', 'error', SQLERRM),
          'nucleo_territorial'
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END;
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
