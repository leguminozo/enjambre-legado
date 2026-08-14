-- ============================================================
-- Migration 20260814120000: eliminar escalada de privilegios por signup
--
-- Auditoría profunda 2026-08-14 (docs/AUDITORIA_PROFUNDA_2026-08.md, C-1/C-2/C-3):
--   1. handle_new_user mapeaba raw_user_meta_data.app_source (controlado por el
--      cliente en signUp()) a roles privilegiados: 'campo' → rep_ventas,
--      'nucleo_apicultor' → apicultor. Cualquier anónimo podía firmar signup con
--      {data:{app_source:'campo'}} y obtener acceso al POS de Campo.
--   2. Email admin hardcodeado: gabriel.cuevas01@alumnos.uach.cl → admin.
--   3. invitation_codes: policy "Usuarios validan codigo" era FOR SELECT sin TO
--      (aplica a anónimos) y la tabla está en supabase_realtime → códigos
--      activos (incl. rol admin) legibles y canjeables por cualquiera.
--
-- Fix:
--   - Roles privilegiados SOLO desde raw_app_meta_data.role, que el cliente NO
--     puede forjar en signUp() (solo el Admin API server-side la setea). El
--     flujo público deliberado del Registro Territorial (app_source =
--     'nucleo_territorial' desde la página de inscripción) se conserva.
--   - Se elimina el backdoor de email.
--   - invitation_codes: lectura anónima eliminada; solo authenticated del
--     propio tenant; policy admin compatible con el rol 'admin' actual
--     (antes exigía roles legacy 'gerente'/'tienda_admin').
-- ============================================================

-- ---------------------------------------------------------------------------
-- 1. handle_new_user hardened
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
  v_meta_role text;
  v_referrer_id uuid;
BEGIN
  v_app_source := NEW.raw_user_meta_data->>'app_source';
  v_meta_role := NEW.raw_app_meta_data->>'role';

  -- Roles privilegiados únicamente desde app_metadata (seteada exclusivamente
  -- por el Admin API con service_role; el cliente no puede forjarla en
  -- signUp()). Cualquier app_source de user_metadata es desconfiable.
  IF v_meta_role IN ('admin', 'apicultor', 'territorial', 'rep_ventas', 'creador', 'cliente') THEN
    v_role := v_meta_role;
  ELSIF v_app_source = 'nucleo_territorial' THEN
    -- Registro Territorial Apícola de Chiloé: inscripción pública deliberada.
    v_role := 'territorial';
  ELSE
    v_role := 'cliente';
  END IF;

  -- Detección de intento de escalada: app_source privilegiado sin app_metadata.
  IF v_meta_role IS NULL
     AND v_app_source IN ('campo', 'nucleo_apicultor', 'nucleo_admin_created') THEN
    BEGIN
      INSERT INTO public.security_events (event_type, email, user_id, details, app_source)
      VALUES (
        'suspicious_activity',
        NEW.email,
        NEW.id,
        jsonb_build_object(
          'etapa', 'handle_new_user',
          'detalle', 'signup con app_source privilegiado sin app_metadata',
          'app_source', v_app_source,
          'rol_asignado', v_role
        ),
        'nucleo'
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- 2. Insertar en profiles — el signup nunca debe morir por un fallo aquí.
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

  -- 3. Membresía de empresa: solo alcanzable hoy vía cuentas creadas por el
  --    Admin API (los roles admin/apicultor/rep_ventas ya no se obtienen por
  --    user_metadata forjada).
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

  -- 4. Actor Territorial (inscripción pública del Registro Territorial)
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

  -- 5. Sistema de Referidos (Invitaciones)
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

-- ---------------------------------------------------------------------------
-- 2. invitation_codes: cerrar lectura anónima y alinear roles admin
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin gestiona invitaciones" ON invitation_codes;
CREATE POLICY "Admin gestiona invitaciones" ON invitation_codes
  FOR ALL TO authenticated
  USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente', 'tienda_admin')
    )
  );

-- Antes: FOR SELECT USING (active = true) sin TO → anónimos leían todos los
-- códigos activos (incl. rol admin) y Realtime los broadcastaba.
DROP POLICY IF EXISTS "Usuarios validan codigo" ON invitation_codes;
CREATE POLICY "Usuarios validan codigo" ON invitation_codes
  FOR SELECT TO authenticated
  USING (
    active = true
    AND empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );
