-- Phase 4 Schema: Erradicating remaining mocks
-- Tables for Logística, Marketing, Cliente, and Alerts

-- 1. Logística Tables
CREATE TABLE IF NOT EXISTS public.logistica_envios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    tracking_code TEXT NOT NULL,
    destino TEXT NOT NULL,
    items TEXT NOT NULL,
    status TEXT NOT NULL,
    eta TEXT,
    via TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.stock_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    sachets INTEGER DEFAULT 0,
    frascos INTEGER DEFAULT 0,
    cofres INTEGER DEFAULT 0,
    ok BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    item TEXT NOT NULL,
    next_delivery TEXT,
    urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Marketing Tables
CREATE TABLE IF NOT EXISTS public.marketing_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    post_date TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    period TEXT NOT NULL,
    impact TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Cliente Tables
CREATE TABLE IF NOT EXISTS public.pedidos_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    order_date TEXT NOT NULL,
    items TEXT NOT NULL,
    status TEXT NOT NULL,
    trees_planted NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Alerts / Voz de la Colmena
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.logistica_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create Policies (Only users can see/edit their own data)
CREATE POLICY "Users can manage their own logistica_envios" ON public.logistica_envios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own stock_centers" ON public.stock_centers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own proveedores" ON public.proveedores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own marketing_posts" ON public.marketing_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own marketing_campaigns" ON public.marketing_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own pedidos_cliente" ON public.pedidos_cliente FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own alerts" ON public.alerts FOR ALL USING (auth.uid() = user_id);
