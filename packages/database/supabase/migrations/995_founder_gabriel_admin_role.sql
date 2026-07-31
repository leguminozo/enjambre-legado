-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 103 — Elevación de Fundador Gabriel Cuevas a Administrador/Owner
-- y blindaje en registros futuros
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Actualizar guard_profiles_role para permitir migraciones de service_role/postgres sin bloqueo de inmutabilidad
CREATE OR REPLACE FUNCTION public.guard_profiles_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (public.is_admin() OR current_user IN ('postgres', 'service_role', 'supabase_admin', 'supabase_auth_admin')) THEN
      RAISE EXCEPTION 'ROLE_IMMUTABLE';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Elevar perfil existente de gabriel.cuevas01@alumnos.uach.cl (si ya se registró en profiles)
UPDATE public.profiles
SET role = 'admin',
    tier_override = 'COLMENA',
    updated_at = now()
WHERE LOWER(email) = 'gabriel.cuevas01@alumnos.uach.cl';

-- 3. Vincular como owner en usuarios_empresas a la empresa principal (Enjambre Legado SpA)
INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol)
SELECT
  p.id,
  'b1e2f3a4-5678-9abc-def0-1234567890ab'::uuid,
  'owner'
FROM public.profiles p
WHERE LOWER(p.email) = 'gabriel.cuevas01@alumnos.uach.cl'
ON CONFLICT (user_id, empresa_id)
DO UPDATE SET rol = 'owner';

-- 4. Blindar handle_new_user() para que cualquier registro futuro o re-registro
-- de Gabriel Cuevas (o fundadores whitelisteados) obtenga automáticamente
-- role='admin', tier_override='COLMENA' y rol empresa='owner'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := 'cliente';
  v_guardian text := 'brotes';
  v_email_clean text;
BEGIN
  v_email_clean := LOWER(TRIM(NEW.email));

  -- Whitelist inmutable de Fundadores / Administradores raíz
  IF v_email_clean IN (
    'gabriel.cuevas01@alumnos.uach.cl',
    'contacto@enjambrelegado.cl'
  ) THEN
    v_role := 'admin';
    v_guardian := 'COLMENA';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, tier_override)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    v_role,
    v_guardian
  );

  -- Si es fundador/admin, vincularlo como owner en usuarios_empresas
  IF v_role = 'admin' THEN
    INSERT INTO public.usuarios_empresas (user_id, empresa_id, rol)
    VALUES (NEW.id, 'b1e2f3a4-5678-9abc-def0-1234567890ab'::uuid, 'owner')
    ON CONFLICT (user_id, empresa_id)
    DO UPDATE SET rol = 'owner';
  END IF;

  RETURN NEW;
EXCEPTION WHEN others THEN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, '', 'cliente');
  RETURN NEW;
END;
$$;
