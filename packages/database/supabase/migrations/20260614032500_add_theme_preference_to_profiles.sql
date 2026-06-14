-- Add theme_preference column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system' NOT NULL;

COMMENT ON COLUMN public.profiles.theme_preference IS 'Preferencia de tema del usuario (light, dark, system)';
