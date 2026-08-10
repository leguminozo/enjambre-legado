-- =============================================================================
-- Capa 3 — Fidelización de revendedores: retribución al por mayor
--
-- Estado del arte FMCG (docs/MICROCANALES_CIENCIA_Y_GOBERNANZA.md §2):
--   · Rebate retrospectivo por volumen con escalones (3/5/8%) — el estándar.
--   · Bonus de velocidad (velocity: recompra rápida) y de rango (depth: SKUs
--     activos) — se premia sell-OUT proxy, no sell-in puro.
--   · Fondo co-op (1–3% de compras) para marketing local compartido.
--   · Crédito LOCK-IN: los puntos solo se gastan en la marca (efecto
--     "ya lo gané") — acreditado al instante, aplicable al próximo pedido.
--   · Ciclos cortos: liquidación por pedido o trimestre (≤90 días); el estatus
--     anual (tiers) es aspiracional y SEPARADO del dinero.
--   · Tiers con ventana MÓVIL de 12 meses (un revendedor que parte en marzo
--     no queda estructuralmente fuera del estatus).
--   · Ledger con ciclo de vida (calculada/acreditada/aplicada/revertida) y
--     CONTRA-ASIENTO en cancelaciones: los ledgers no se borran, se compensan.
--   · fid_valores = configuración central editable (ordena el "caos de puntos").
-- =============================================================================

-- ── Configuración central de valores (editable desde la herramienta) ─────────
CREATE TABLE IF NOT EXISTS public.fid_valores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave       TEXT NOT NULL UNIQUE,
  nombre      TEXT NOT NULL,
  valor       INT NOT NULL DEFAULT 0,
  activo      BOOLEAN NOT NULL DEFAULT true,
  descripcion TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fid_valores IS
  'Configuración central de puntos del microcanal, editable desde el admin (ordena el caos: cada origen escribe a su sistema, aquí se configuran los valores del canon).';

INSERT INTO public.fid_valores (clave, nombre, valor, activo, descripcion) VALUES
  ('feedback_rapido_puntos',     'Puntos por feedback rápido',       10, true,  'Recompensa por responder la evaluación rápida (pulso corto).'),
  ('feedback_semantico_puntos',  'Puntos por pulso semántico',       25, true,  'Recompensa por completar el instrumento de percepción profunda.'),
  ('revendedor_puntos_por_clp',  'CLP por punto de revendedor',     100, true,  'Cada $100 comprados al por mayor = 1 punto de retribución (~1%).'),
  ('revendedor_puntos_bienvenida','Puntos de bienvenida revendedor', 200, true, 'Endowed progress al activar un revendedor (primeros puntos).')
ON CONFLICT (clave) DO NOTHING;

-- ── Reglas de retribución (configurables) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fid_retribucion_reglas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           TEXT NOT NULL CHECK (tipo IN ('puntos_por_clp', 'rebate_porcentual', 'bonus_recompra_rapida', 'bonus_rango', 'co_op')),
  nombre         TEXT NOT NULL,
  valor          NUMERIC(8, 2) NOT NULL DEFAULT 0,  -- puntos por CLP · % de rebate · % co-op · puntos bonus
  umbral_min_clp INT,  -- tramo inferior (rebate escalonado)
  umbral_max_clp INT,  -- tramo superior
  dias_max       INT,  -- bonus_recompra_rapida: pedido siguiente en ≤ N días
  skus_min       INT,  -- bonus_rango: ≥ K SKUs en el pedido
  activo         BOOLEAN NOT NULL DEFAULT true,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fid_retribucion_reglas_activas ON public.fid_retribucion_reglas (activo, sort_order);

COMMENT ON TABLE public.fid_retribucion_reglas IS
  'Reglas de retribución al por mayor: base (puntos por CLP o rebate %) + velocity + depth + co-op. La regla de cada recompensa se explica en DOS oraciones (test de aceptación).';

INSERT INTO public.fid_retribucion_reglas (tipo, nombre, valor, umbral_min_clp, umbral_max_clp, dias_max, skus_min, sort_order) VALUES
  ('puntos_por_clp',        'Puntos por compra',            0.01, NULL, NULL, NULL, NULL, 10),  -- 1 pt por $100
  ('rebate_porcentual',     'Rebate 3%',                     3.00, 500000, 999999, NULL, NULL, 20),
  ('rebate_porcentual',     'Rebate 5%',                     5.00, 1000000, 1999999, NULL, NULL, 21),
  ('rebate_porcentual',     'Rebate 8%',                     8.00, 2000000, NULL, NULL, NULL, 22),
  ('bonus_recompra_rapida', 'Bonus recompra rápida',       200.00, NULL, NULL, 30, NULL, 30),   -- +200 pts si recompra ≤ 30 días
  ('bonus_rango',           'Bonus rango de SKUs',         150.00, NULL, NULL, NULL, 5, 40),    -- +150 pts con ≥ 5 SKUs
  ('co_op',                 'Fondo co-marketing',            2.00, NULL, NULL, NULL, NULL, 50)  -- 2% de compras → fondo local
ON CONFLICT DO NOTHING;

-- ── Tiers de revendedor (estatus aspiracional, ventana móvil 12 meses) ───────
CREATE TABLE IF NOT EXISTS public.fid_retribucion_tiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  umbral_anual_clp INT NOT NULL DEFAULT 0,  -- compras en ventana móvil de 12 meses
  beneficio       TEXT NOT NULL,  -- aspiracional: acceso, visita, reconocimiento
  sort_order      INT NOT NULL DEFAULT 0,
  activo          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fid_retribucion_tiers IS
  'Estatus aspiracional del revendedor por compras en ventana MÓVIL de 12 meses — separado del dinero (que liquida por pedido/trimestre).';

INSERT INTO public.fid_retribucion_tiers (nombre, umbral_anual_clp, beneficio, sort_order) VALUES
  ('Bronce', 0,          'Acceso al catálogo mayorista y retribución por compras.', 10),
  ('Plata',  1000000,    'Acceso a edición limitada de miel + prioridad de stock.', 20),
  ('Oro',    2500000,    'Visita al apiario + reconocimiento público "Revendedor del mes".', 30)
ON CONFLICT DO NOTHING;

-- ── Ledger de retribuciones (con contra-asiento) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.fid_retribuciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedor_id   UUID NOT NULL REFERENCES public.b2b_revendedores(id) ON DELETE CASCADE,
  pedido_id       UUID NOT NULL REFERENCES public.b2b_pedidos(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('puntos', 'rebate', 'co_op', 'bonus')),
  cantidad        INT NOT NULL,  -- puntos (positivo) o CLP de rebate/co-op; negativo = contra-asiento
  pct_aplicado    NUMERIC(6, 2),  -- % aplicado (rebate/bonus/co-op) al momento del cálculo
  estado          TEXT NOT NULL DEFAULT 'calculada'
                  CHECK (estado IN ('calculada', 'acreditada', 'aplicada', 'revertida')),
  contra_parte_id UUID REFERENCES public.fid_retribuciones(id),  -- enlace del contra-asiento
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fid_retribuciones_revendedor ON public.fid_retribuciones (revendedor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fid_retribuciones_pedido ON public.fid_retribuciones (pedido_id);

COMMENT ON TABLE public.fid_retribuciones IS
  'Ledger de retribución del revendedor: calculada al confirmar el pedido mayorista, acreditada como crédito lock-in, aplicada al próximo pedido. Las cancelaciones NO borran: generan contra-asiento (cantidad negativa, estado revertida).';

-- ── updated_at ───────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS fid_valores_updated_at ON public.fid_valores;
CREATE TRIGGER fid_valores_updated_at
  BEFORE UPDATE ON public.fid_valores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS fid_retribucion_reglas_updated_at ON public.fid_retribucion_reglas;
CREATE TRIGGER fid_retribucion_reglas_updated_at
  BEFORE UPDATE ON public.fid_retribucion_reglas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS fid_retribucion_tiers_updated_at ON public.fid_retribucion_tiers;
CREATE TRIGGER fid_retribucion_tiers_updated_at
  BEFORE UPDATE ON public.fid_retribucion_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- La retribución es administrada por la marca (admin) y VISIBLE para el
-- revendedor dueño (su propio progreso — el goal-gradient es el mecanismo).
ALTER TABLE public.fid_valores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fid_retribucion_reglas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fid_retribucion_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fid_retribuciones ENABLE ROW LEVEL SECURITY;

-- Valores y reglas: lectura pública (reglas visibles = confianza), escritura admin
DROP POLICY IF EXISTS fid_valores_select_p ON public.fid_valores;
CREATE POLICY fid_valores_select_p ON public.fid_valores
  FOR SELECT USING (true);

DROP POLICY IF EXISTS fid_valores_admin_all_p ON public.fid_valores;
CREATE POLICY fid_valores_admin_all_p ON public.fid_valores
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS fid_retribucion_reglas_select_p ON public.fid_retribucion_reglas;
CREATE POLICY fid_retribucion_reglas_select_p ON public.fid_retribucion_reglas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS fid_retribucion_reglas_admin_all_p ON public.fid_retribucion_reglas;
CREATE POLICY fid_retribucion_reglas_admin_all_p ON public.fid_retribucion_reglas
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS fid_retribucion_tiers_select_p ON public.fid_retribucion_tiers;
CREATE POLICY fid_retribucion_tiers_select_p ON public.fid_retribucion_tiers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS fid_retribucion_tiers_admin_all_p ON public.fid_retribucion_tiers;
CREATE POLICY fid_retribucion_tiers_admin_all_p ON public.fid_retribucion_tiers
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

-- Retribuciones: admin todo · el revendedor ve las suyas (lectura)
DROP POLICY IF EXISTS fid_retribuciones_admin_all_p ON public.fid_retribuciones;
CREATE POLICY fid_retribuciones_admin_all_p ON public.fid_retribuciones
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS fid_retribuciones_revendedor_select_p ON public.fid_retribuciones;
CREATE POLICY fid_retribuciones_revendedor_select_p ON public.fid_retribuciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.b2b_revendedores r
      WHERE r.id = revendedor_id AND r.user_id = auth.uid()
    )
  );
