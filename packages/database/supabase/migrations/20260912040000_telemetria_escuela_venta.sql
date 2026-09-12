-- Migration: 20260912040000_telemetria_escuela_venta.sql
-- Registra telemetría de consulta de argumentario y notas de cata en terreno (Campo POS)
-- para control de capacitación y refuerzo de venta comercial.

CREATE TABLE IF NOT EXISTS public.rep_ventas_capacitacion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    producto_id UUID REFERENCES public.productos(id) ON DELETE CASCADE,
    producto_nombre TEXT NOT NULL,
    accion TEXT NOT NULL CHECK (accion IN ('apertura_guia_cata', 'consulta_objecion', 'modo_atril')),
    detalle JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.rep_ventas_capacitacion_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "rep_ventas_capacitacion_logs_insert" ON public.rep_ventas_capacitacion_logs;
CREATE POLICY "rep_ventas_capacitacion_logs_insert" ON public.rep_ventas_capacitacion_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "rep_ventas_capacitacion_logs_select" ON public.rep_ventas_capacitacion_logs;
CREATE POLICY "rep_ventas_capacitacion_logs_select" ON public.rep_ventas_capacitacion_logs
    FOR SELECT TO authenticated
    USING (
        is_admin() OR
        jwt_app_role() = 'admin' OR
        user_id = auth.uid()
    );

-- Índices de consulta rápida para el dashboard de analítica
CREATE INDEX IF NOT EXISTS idx_rep_ventas_capacitacion_prod_fecha
    ON public.rep_ventas_capacitacion_logs(producto_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rep_ventas_capacitacion_accion_fecha
    ON public.rep_ventas_capacitacion_logs(accion, created_at DESC);

COMMENT ON TABLE public.rep_ventas_capacitacion_logs IS
    'Registro de telemetría de consulta de argumentarios y notas de cata en terreno para el módulo de capacitación comercial.';
