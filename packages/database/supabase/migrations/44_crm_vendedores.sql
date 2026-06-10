-- CRM de Vendedores: interaction logging, feria assignments, enriched clientes

-- 1. Enrich clientes with CRM fields
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS telefono TEXT,
  ADD COLUMN IF NOT EXISTS empresa TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fuente TEXT CHECK (fuente IN ('feria','referido','web','visita','cold_call','red_social','otro')),
  ADD COLUMN IF NOT EXISTS ultimo_contacto TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_clientes_vendedor ON clientes(vendedor_id) WHERE vendedor_id IS NOT NULL;

-- 2. Interacciones table (interaction log)
CREATE TABLE IF NOT EXISTS interacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('llamada','email','visita','feria','whatsapp','reunion','seguimiento','otro')),
  notas TEXT,
  resultado TEXT CHECK (resultado IN ('positivo','neutral','negativo','pendiente','seguimiento')),
  proximo_seguimiento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interacciones_cliente ON interacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_rep ON interacciones(rep_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_empresa ON interacciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_interacciones_seguimiento ON interacciones(proximo_seguimiento) WHERE proximo_seguimiento IS NOT NULL;

ALTER TABLE interacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY interacciones_read ON interacciones
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY interacciones_insert ON interacciones
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()) AND rep_id = auth.uid());

CREATE POLICY interacciones_update ON interacciones
  FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()) AND rep_id = auth.uid());

CREATE POLICY interacciones_delete ON interacciones
  FOR DELETE TO authenticated
  USING (rep_id = auth.uid() OR public.is_admin());

-- 3. Evento-rep assignments (feria agenda)
CREATE TABLE IF NOT EXISTS evento_rep_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  rol_evento TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol_evento IN ('vendedor','coordinador','soporte')),
  meta_ventas NUMERIC(19,4) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(evento_id, rep_id)
);

CREATE INDEX IF NOT EXISTS idx_evento_rep_assignments_evento ON evento_rep_assignments(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_rep_assignments_rep ON evento_rep_assignments(rep_id);

ALTER TABLE evento_rep_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY evento_rep_read ON evento_rep_assignments
  FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY evento_rep_insert ON evento_rep_assignments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY evento_rep_delete ON evento_rep_assignments
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Enable realtime for interacciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.interacciones;
