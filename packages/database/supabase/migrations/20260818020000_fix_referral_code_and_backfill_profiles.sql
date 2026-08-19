-- El trigger generate_referral_code leía NEW.nombre, columna que no existe
-- (es full_name). Eso abortaba TODO insert en profiles: handle_new_user
-- tragaba el error y el usuario quedaba sin perfil → Núcleo lo trata como
-- cliente y lo manda al catálogo.
--
-- No re-aplica 21–999. Solo repara la función y completa filas faltantes.

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base TEXT;
  v_code TEXT;
  v_attempt INT := 0;
  v_seed TEXT;
BEGIN
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_seed := regexp_replace(
    COALESCE(NULLIF(btrim(NEW.full_name), ''), NEW.email, 'USER'),
    '[^a-zA-Z0-9]',
    '',
    'g'
  );
  IF v_seed = '' THEN
    v_seed := 'USER';
  END IF;

  v_base := 'OYZ-' || UPPER(SUBSTRING(v_seed, 1, 4));
  v_code := v_base || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');

  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_code);
    v_attempt := v_attempt + 1;
    IF v_attempt > 10 THEN
      v_code := v_base || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
      EXIT;
    END IF;
    v_code := v_base || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
  END LOOP;

  NEW.referral_code := v_code;
  RETURN NEW;
END;
$$;

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  CASE
    WHEN u.raw_user_meta_data->>'app_source' = 'nucleo_territorial' THEN 'territorial'
    WHEN u.raw_app_meta_data->>'role' IN (
      'admin', 'apicultor', 'territorial', 'cliente', 'creador', 'rep_ventas'
    ) THEN u.raw_app_meta_data->>'role'
    ELSE 'cliente'
  END
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (user_id, rol, nombre_actor, comuna, region)
SELECT
  u.id,
  CASE
    WHEN u.raw_user_meta_data->>'territorial_rol' IN (
      'api_residente', 'api_trashumante', 'api_mixto', 'prop_facilitador',
      'agri_fitosanitario', 'agri_aplicador', 'comercial_acopio',
      'tecnico_inspector', 'institucion_publica'
    ) THEN u.raw_user_meta_data->>'territorial_rol'
    ELSE 'api_residente'
  END,
  COALESCE(
    NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(u.email, '@', 1),
    'Apicultor/a'
  ),
  COALESCE(NULLIF(u.raw_user_meta_data->>'territorial_comuna', ''), 'Desconocida'),
  COALESCE(NULLIF(u.raw_user_meta_data->>'territorial_region', ''), 'Los Lagos')
FROM auth.users u
WHERE u.raw_user_meta_data->>'app_source' = 'nucleo_territorial'
  AND NOT EXISTS (
    SELECT 1 FROM public.actores_registro a WHERE a.user_id = u.id
  );
