-- 1. Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('apicultor', 'vendedor', 'gerente', 'logistica', 'marketing', 'cliente')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists and drop if it does, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Add user_id to existing tables and enable RLS
-- We will add user_id to tables and set them to cascade delete if the user is deleted.

-- APIARIOS
ALTER TABLE public.apiarios ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.apiarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own apiarios" ON public.apiarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own apiarios" ON public.apiarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own apiarios" ON public.apiarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own apiarios" ON public.apiarios FOR DELETE USING (auth.uid() = user_id);

-- COLMENAS
ALTER TABLE public.colmenas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.colmenas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own colmenas" ON public.colmenas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own colmenas" ON public.colmenas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own colmenas" ON public.colmenas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own colmenas" ON public.colmenas FOR DELETE USING (auth.uid() = user_id);

-- INSPECCIONES
ALTER TABLE public.inspecciones ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.inspecciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inspecciones" ON public.inspecciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inspecciones" ON public.inspecciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inspecciones" ON public.inspecciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inspecciones" ON public.inspecciones FOR DELETE USING (auth.uid() = user_id);

-- VARROA RECORDS
ALTER TABLE public.varroa_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.varroa_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own varroa_records" ON public.varroa_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own varroa_records" ON public.varroa_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own varroa_records" ON public.varroa_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own varroa_records" ON public.varroa_records FOR DELETE USING (auth.uid() = user_id);

-- PESO RECORDS
ALTER TABLE public.peso_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.peso_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own peso_records" ON public.peso_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own peso_records" ON public.peso_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own peso_records" ON public.peso_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own peso_records" ON public.peso_records FOR DELETE USING (auth.uid() = user_id);

-- ARBOLES PLANTADOS
ALTER TABLE public.arboles_plantados ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.arboles_plantados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own arboles_plantados" ON public.arboles_plantados FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own arboles_plantados" ON public.arboles_plantados FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own arboles_plantados" ON public.arboles_plantados FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own arboles_plantados" ON public.arboles_plantados FOR DELETE USING (auth.uid() = user_id);

-- REFLEXIONES
ALTER TABLE public.reflexiones ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reflexiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reflexiones" ON public.reflexiones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflexiones" ON public.reflexiones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reflexiones" ON public.reflexiones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reflexiones" ON public.reflexiones FOR DELETE USING (auth.uid() = user_id);

-- CALENDARIO TASKS
ALTER TABLE public.calendario_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.calendario_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own calendario_tasks" ON public.calendario_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendario_tasks" ON public.calendario_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendario_tasks" ON public.calendario_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendario_tasks" ON public.calendario_tasks FOR DELETE USING (auth.uid() = user_id);

-- CLIENTES
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clientes" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clientes" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clientes" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clientes" ON public.clientes FOR DELETE USING (auth.uid() = user_id);

-- VENTAS
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ventas" ON public.ventas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ventas" ON public.ventas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ventas" ON public.ventas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ventas" ON public.ventas FOR DELETE USING (auth.uid() = user_id);

-- CASHFLOW
ALTER TABLE public.cashflow ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.cashflow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cashflow" ON public.cashflow FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cashflow" ON public.cashflow FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cashflow" ON public.cashflow FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cashflow" ON public.cashflow FOR DELETE USING (auth.uid() = user_id);
