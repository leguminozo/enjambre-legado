ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'gerente',
  ALTER COLUMN role DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'gerente')
  );
  RETURN new;
EXCEPTION WHEN others THEN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, '', 'gerente');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
