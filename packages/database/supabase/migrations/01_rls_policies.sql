-- RLS: roles desde tabla profiles (no JWT custom claims por defecto)

-- Helper: rol actual
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_gerente()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gerente');
$$;

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_own_profile ON profiles;
DROP POLICY IF EXISTS update_own_profile ON profiles;
CREATE POLICY read_own_profile ON profiles FOR SELECT USING (id = auth.uid() OR public.is_gerente());
CREATE POLICY update_own_profile ON profiles FOR UPDATE USING (id = auth.uid());

-- Apiarios / colmenas
ALTER TABLE apiarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS apiarios_select ON apiarios;
DROP POLICY IF EXISTS apiarios_all_apicultor ON apiarios;
CREATE POLICY apiarios_select ON apiarios FOR SELECT
  USING (created_by = auth.uid() OR public.is_gerente());
CREATE POLICY apiarios_mutate ON apiarios FOR ALL
  USING (created_by = auth.uid() OR public.is_gerente())
  WITH CHECK (created_by = auth.uid() OR public.is_gerente());

ALTER TABLE colmenas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS colmenas_select ON colmenas;
CREATE POLICY colmenas_select ON colmenas FOR SELECT
  USING (
    apiario_id IS NULL
    OR EXISTS (SELECT 1 FROM apiarios a WHERE a.id = colmenas.apiario_id AND (a.created_by = auth.uid() OR public.is_gerente()))
  );

ALTER TABLE inspecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE varroa_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE peso_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY inspecciones_select ON inspecciones FOR SELECT
  USING (EXISTS (SELECT 1 FROM colmenas c JOIN apiarios a ON a.id = c.apiario_id WHERE c.id = inspecciones.colmena_id AND (a.created_by = auth.uid() OR public.is_gerente())));
CREATE POLICY varroa_select ON varroa_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM colmenas c JOIN apiarios a ON a.id = c.apiario_id WHERE c.id = varroa_records.colmena_id AND (a.created_by = auth.uid() OR public.is_gerente())));
CREATE POLICY peso_select ON peso_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM colmenas c JOIN apiarios a ON a.id = c.apiario_id WHERE c.id = peso_records.colmena_id AND (a.created_by = auth.uid() OR public.is_gerente())));

-- Clientes CRM
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clientes_own ON clientes;
CREATE POLICY clientes_own ON clientes FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());

-- Productos (lectura pública autenticada)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS productos_read ON productos;
CREATE POLICY productos_read ON productos FOR SELECT USING (true);
CREATE POLICY productos_write ON productos FOR ALL USING (public.is_gerente() OR public.current_role() = 'tienda_admin');

-- Ventas
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ventas_select ON ventas;
DROP POLICY IF EXISTS ventas_insert ON ventas;
CREATE POLICY ventas_select ON ventas FOR SELECT
  USING (
    public.is_gerente()
    OR vendedor_id = auth.uid()
    OR cliente_id = auth.uid()
  );
CREATE POLICY ventas_insert ON ventas FOR INSERT
  WITH CHECK (vendedor_id = auth.uid() OR public.is_gerente());
CREATE POLICY ventas_update ON ventas FOR UPDATE
  USING (public.is_gerente() OR vendedor_id = auth.uid());

-- Integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS integrations_read ON integrations;
DROP POLICY IF EXISTS integrations_write ON integrations;
CREATE POLICY integrations_read ON integrations FOR SELECT
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin');
CREATE POLICY integrations_write ON integrations FOR ALL
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'tienda_admin');

-- Fuentes externas
ALTER TABLE source_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletas_ingest ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sii_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS source_files_rw ON source_files;
DROP POLICY IF EXISTS boletas_ingest_rw ON boletas_ingest;
DROP POLICY IF EXISTS bank_movements_rw ON bank_movements;
DROP POLICY IF EXISTS sii_sync_runs_rw ON sii_sync_runs;
DROP POLICY IF EXISTS notification_events_rw ON notification_events;

CREATE POLICY source_files_rw ON source_files FOR ALL
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'tienda_admin');
CREATE POLICY boletas_ingest_rw ON boletas_ingest FOR ALL
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'tienda_admin');
CREATE POLICY bank_movements_rw ON bank_movements FOR ALL
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'tienda_admin');
CREATE POLICY sii_sync_runs_rw ON sii_sync_runs FOR ALL
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'tienda_admin');
CREATE POLICY notification_events_rw ON notification_events FOR ALL
  USING (public.is_gerente() OR public.current_role() = 'tienda_admin')
  WITH CHECK (public.is_gerente() OR public.current_role() = 'tienda_admin');

-- Cashflow manual
ALTER TABLE cashflow ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cashflow_own ON cashflow;
CREATE POLICY cashflow_own ON cashflow FOR ALL
  USING (user_id = auth.uid() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid());

-- Calendario
ALTER TABLE calendario_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cal_tasks ON calendario_tasks;
CREATE POLICY cal_tasks ON calendario_tasks FOR ALL
  USING (user_id = auth.uid() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid());

-- Logística / marketing / pedidos
ALTER TABLE logistica_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflexiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY logistica_envios_p ON logistica_envios FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());
CREATE POLICY stock_centers_p ON stock_centers FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());
CREATE POLICY proveedores_p ON proveedores FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());
CREATE POLICY marketing_posts_p ON marketing_posts FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());
CREATE POLICY marketing_campaigns_p ON marketing_campaigns FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());
CREATE POLICY pedidos_cliente_p ON pedidos_cliente FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());
CREATE POLICY alerts_p ON alerts FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());
CREATE POLICY reflexiones_p ON reflexiones FOR ALL USING (user_id = auth.uid() OR public.is_gerente()) WITH CHECK (user_id = auth.uid());

-- Eventos / tickets
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_fidelizacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY eventos_read ON eventos FOR SELECT USING (true);
CREATE POLICY eventos_write ON eventos FOR ALL USING (public.is_gerente() OR public.current_role() = 'vendedor');
CREATE POLICY tickets_f ON tickets_fidelizacion FOR ALL USING (cliente_id = auth.uid() OR public.is_gerente() OR public.current_role() = 'vendedor');
