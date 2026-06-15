-- Link user-related tables directly to public.profiles(id) to expose relationships to PostgREST

-- 1. revendedor_profile
ALTER TABLE public.revendedor_profile
  DROP CONSTRAINT IF EXISTS revendedor_profile_user_id_fkey;

ALTER TABLE public.revendedor_profile
  ADD CONSTRAINT revendedor_profile_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. resenas_sensoriales
ALTER TABLE public.resenas_sensoriales
  DROP CONSTRAINT IF EXISTS resenas_sensoriales_user_id_fkey;

ALTER TABLE public.resenas_sensoriales
  ADD CONSTRAINT resenas_sensoriales_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. creadores
ALTER TABLE public.creadores
  DROP CONSTRAINT IF EXISTS creadores_user_id_fkey;

ALTER TABLE public.creadores
  ADD CONSTRAINT creadores_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. rep_profiles
ALTER TABLE public.rep_profiles
  DROP CONSTRAINT IF EXISTS rep_profiles_user_id_fkey;

ALTER TABLE public.rep_profiles
  ADD CONSTRAINT rep_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. suscriptor_config
ALTER TABLE public.suscriptor_config
  DROP CONSTRAINT IF EXISTS suscriptor_config_user_id_fkey;

ALTER TABLE public.suscriptor_config
  ADD CONSTRAINT suscriptor_config_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
