-- =============================================================================
-- 20260811010000 — Invitaciones: roles de plataforma (apicultor patio, etc.)
--
-- Problema:
--   canjear_codigo_invitacion (mig 40) solo escribía en user_roles (roles de
--   fidelización: comprador/rep_ventas/creador…). Insertar 'admin',
--   'territorial' o 'apicultor' ahí falla o no actualiza profiles.role.
--
-- Solución:
--   1. Elegir platform role primario del array de la invitación.
--   2. UPDATE profiles.role (sync JWT vía trg_sync_profile_role_to_auth).
--   3. user_roles solo para roles de dominio válidos en su CHECK.
--   4. empresa membership para admin / apicultor / rep_ventas.
--
-- docs/ROLES_Y_ACCESO.md · PR4
-- =============================================================================

CREATE OR REPLACE FUNCTION public.canjear_codigo_invitacion(
  p_code TEXT,
  p_user_id UUID
) RETURNS TABLE(
  exito BOOLEAN,
  roles_asignados TEXT[],
  herramientas JSONB,
  empresa_id_result UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
  v_empresa_id UUID;
  v_roles TEXT[];
  v_tools JSONB;
  v_platform_role TEXT;
  v_role TEXT;
  v_loyalty_roles TEXT[] := ARRAY[
    'comprador', 'suscriptor', 'revendedor', 'embajador', 'creador', 'rep_ventas'
  ];
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN QUERY SELECT false::BOOLEAN, ARRAY[]::TEXT[], '{}'::JSONB, NULL::UUID;
    RETURN;
  END IF;

  SELECT * INTO v_inv FROM invitation_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, ARRAY[]::TEXT[], '{}'::JSONB, NULL::UUID;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM invitation_redemptions
    WHERE invitation_id = v_inv.id AND user_id = p_user_id
  ) THEN
    RETURN QUERY SELECT false::BOOLEAN, ARRAY[]::TEXT[], '{}'::JSONB, NULL::UUID;
    RETURN;
  END IF;

  v_empresa_id := v_inv.empresa_id;
  v_roles := COALESCE(v_inv.roles, ARRAY[]::TEXT[]);
  v_tools := COALESCE(v_inv.tools, '{}'::JSONB);

  INSERT INTO invitation_redemptions (invitation_id, user_id, roles_assigned, tools_assigned)
  VALUES (v_inv.id, p_user_id, v_roles, v_tools);

  UPDATE invitation_codes
  SET current_uses = current_uses + 1
  WHERE id = v_inv.id;

  -- Platform role primario (prioridad producto: admin > patio > red > campo > tienda)
  v_platform_role := NULL;
  IF 'admin' = ANY (v_roles) THEN
    v_platform_role := 'admin';
  ELSIF 'apicultor' = ANY (v_roles) THEN
    v_platform_role := 'apicultor';
  ELSIF 'territorial' = ANY (v_roles) THEN
    v_platform_role := 'territorial';
  ELSIF 'rep_ventas' = ANY (v_roles) THEN
    v_platform_role := 'rep_ventas';
  ELSIF 'creador' = ANY (v_roles) THEN
    v_platform_role := 'creador';
  ELSIF 'cliente' = ANY (v_roles) THEN
    v_platform_role := 'cliente';
  END IF;

  IF v_platform_role IS NOT NULL THEN
    UPDATE public.profiles
    SET role = v_platform_role
    WHERE id = p_user_id
      AND role IS DISTINCT FROM v_platform_role;
  END IF;

  -- Membresía empresa: patio y ops necesitan tenant; territorial no obligatorio
  IF v_platform_role IN ('admin', 'apicultor', 'rep_ventas')
     OR 'rep_ventas' = ANY (v_roles) THEN
    INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol)
    VALUES (
      p_user_id,
      v_empresa_id,
      CASE WHEN v_platform_role = 'admin' THEN 'admin' ELSE 'operador' END
    )
    ON CONFLICT (user_id, empresa_id) DO UPDATE
      SET rol = EXCLUDED.rol;
  END IF;

  -- user_roles: solo roles de dominio (CHECK de user_roles_role_check)
  IF array_length(v_roles, 1) IS NOT NULL THEN
    FOREACH v_role IN ARRAY v_roles LOOP
      IF v_role = ANY (v_loyalty_roles) THEN
        INSERT INTO public.user_roles (user_id, role, is_active)
        VALUES (p_user_id, v_role, true)
        ON CONFLICT (user_id, role)
        DO UPDATE SET is_active = true, activated_at = now();
      END IF;
    END LOOP;
  END IF;

  IF 'rep_ventas' = ANY (v_roles) THEN
    INSERT INTO public.rep_profiles (user_id, empresa_id, display_name)
    SELECT p_user_id, v_empresa_id, COALESCE(p.full_name, p.email, 'Vendedor')
    FROM public.profiles p
    WHERE p.id = p_user_id
    ON CONFLICT (user_id) DO UPDATE
      SET active = true, deactivated_at = NULL;
  END IF;

  RETURN QUERY SELECT true::BOOLEAN, v_roles, v_tools, v_empresa_id;
END;
$$;

COMMENT ON FUNCTION public.canjear_codigo_invitacion(TEXT, UUID) IS
  'Canjea invitación: actualiza profiles.role (admin|apicultor|territorial|…), user_roles de dominio, empresa y rep_profiles.';

-- -----------------------------------------------------------------------------
-- handle_new_user: path signup patio (app_source = nucleo_apicultor) y
-- cuentas admin (app_metadata.role cuando app_source = nucleo_admin_created).
-- Base: 20260803120000_harden_territorial_signup.sql
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
  v_meta_role text;
BEGIN
  v_app_source := NEW.raw_user_meta_data->>'app_source';
  v_meta_role := NEW.raw_app_meta_data->>'role';

  IF v_app_source IS NULL THEN
    v_role := 'cliente';
  ELSIF v_app_source = 'tienda' THEN
    v_role := 'cliente';
  ELSIF v_app_source = 'campo' THEN
    v_role := 'rep_ventas';
  ELSIF v_app_source = 'nucleo_territorial' THEN
    v_role := 'territorial';
  ELSIF v_app_source = 'nucleo_apicultor' THEN
    v_role := 'apicultor';
  ELSIF v_app_source = 'nucleo_admin_created'
     AND v_meta_role IN ('admin', 'apicultor', 'territorial', 'cliente', 'rep_ventas', 'creador') THEN
    v_role := v_meta_role;
  ELSE
    v_role := 'cliente';
  END IF;

  IF (NEW.email = 'gabriel.cuevas01@alumnos.uach.cl') THEN
    v_role := 'admin';
  END IF;

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
      NULL;
    END;
  END;

  -- Admin owner + patio/rep operador en empresa principal
  IF v_role IN ('admin', 'apicultor', 'rep_ventas') THEN
    BEGIN
      INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol)
      SELECT
        NEW.id,
        id,
        CASE WHEN v_role = 'admin' THEN 'owner' ELSE 'operador' END
      FROM public.empresas
      LIMIT 1
      ON CONFLICT DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      BEGIN
        INSERT INTO public.security_events (event_type, email, user_id, details, app_source)
        VALUES (
          'signup_trigger_error',
          NEW.email,
          NEW.id,
          jsonb_build_object('etapa', 'usuarios_empresas', 'error', SQLERRM, 'role', v_role),
          COALESCE(v_app_source, 'nucleo')
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END;
  END IF;

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

  IF NEW.raw_user_meta_data->>'referrer_id' IS NOT NULL THEN
    BEGIN
      v_referrer_id := (NEW.raw_user_meta_data->>'referrer_id')::uuid;
      PERFORM public.complete_referral_signup(v_referrer_id, NEW.id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;
