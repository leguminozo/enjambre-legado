-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 20261016193000_harden_telemetria_escuela_venta_rls.sql
-- Hardening RLS telemetría escuela de venta:
-- Evita suplantación de identidad (user_id spoofing) en inserciones de logs.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "rep_ventas_capacitacion_logs_insert" ON public.rep_ventas_capacitacion_logs;

CREATE POLICY "rep_ventas_capacitacion_logs_insert" ON public.rep_ventas_capacitacion_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id IS NULL OR user_id = auth.uid()
    );
