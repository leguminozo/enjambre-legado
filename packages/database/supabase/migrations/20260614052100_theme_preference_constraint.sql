-- Add CHECK constraint on theme_preference column in profiles table
ALTER TABLE public.profiles
ADD CONSTRAINT check_theme_preference
CHECK (theme_preference IN ('light', 'dark', 'system'));
