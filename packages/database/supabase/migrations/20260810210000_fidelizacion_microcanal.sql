-- =============================================================================
-- Capa 3 — Fidelización del microcanal (clientes finales)
--
-- Sistema CANÓNICO del microcanal, paralelo a los sistemas web/POS existentes
-- (puntos_fidelizacion, ciclos/loyalty, guardian_stamps) — no los toca.
-- Mapa del caos → taxonomía (documentado):
--   · puntos_fidelizacion (checkout web)  → queda como está (canal web)
--   · ciclos + loyalty_rewards (POS/tienda) → queda como está (canal tienda)
--   · guardian_stamp_programs (sellos)    → queda como está (canal tienda)
--   · fid_* (este módulo)                 → canal microcanal (cafés/tiendas/hoteles)
-- La unificación de ledgers es un proyecto aparte (riesgo de tocar checkout/POS).
--
-- Decisiones de estado del arte:
--   · Identidad GLOBAL del cliente final (multi-café): email o whatsapp o
--     tarjeta QR (codigo_cliente). La tarjeta se usa UNA vez para vincular;
--     después la identidad es whatsapp/email (rate-limit en claim).
--   · Saldo por café en fid_membresias (sellos_iniciales = endowed progress:
--     la tarjeta parte con 1–2 sellos de bienvenida — Nunes & Drèze 2006).
--   · fid_eventos es UN LEDGER inmutable (sin UPDATE/DELETE): los ledgers no
--     se borran, se compensan.
--   · Re-enganche post-canje: al canjear se otorga el primer sello del
--     siguiente ciclo (el gradiente se resetea en el canje — Kivetz 2006).
--   · Holdout experimental (grupo_control) en membresías para incrementality.
--   · RLS invariante: un punto de venta ve solo SU membresía/eventos —
--     nunca el ledger global del cliente (privacidad entre puntos).
-- =============================================================================

-- ── Clientes (identidad global) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fid_clientes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT,  -- UNIQUE parcial cuando no es null
  whatsapp         TEXT,  -- identidad de baja fricción (gateway real: futuro)
  codigo_cliente   TEXT NOT NULL UNIQUE,  -- tarjeta QR personal (generado en BFF)
  nombre           TEXT,
  consentimiento   BOOLEAN NOT NULL DEFAULT false,  -- percepción + contacto (explícito)
  consentimiento_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS fid_clientes_email_uidx ON public.fid_clientes (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS fid_clientes_whatsapp_uidx ON public.fid_clientes (whatsapp) WHERE whatsapp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fid_clientes_codigo ON public.fid_clientes (codigo_cliente);

COMMENT ON TABLE public.fid_clientes IS
  'Identidad GLOBAL del cliente final del microcanal: acumula en cualquier café con la misma identidad (email / whatsapp / tarjeta QR).';

-- ── Membresías (saldo por café) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fid_membresias (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID NOT NULL REFERENCES public.fid_clientes(id) ON DELETE CASCADE,
  punto_venta_id    UUID NOT NULL REFERENCES public.b2b_puntos_venta(id) ON DELETE CASCADE,
  saldo_sellos      INT NOT NULL DEFAULT 0 CHECK (saldo_sellos >= 0),
  saldo_puntos      INT NOT NULL DEFAULT 0 CHECK (saldo_puntos >= 0),
  sellos_iniciales  INT NOT NULL DEFAULT 0,  -- endowed progress (bienvenida)
  grupo_control     BOOLEAN NOT NULL DEFAULT false,  -- holdout experimental
  asignado_holdout_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, punto_venta_id)
);

CREATE INDEX IF NOT EXISTS idx_fid_membresias_punto ON public.fid_membresias (punto_venta_id);

COMMENT ON TABLE public.fid_membresias IS
  'Saldo del cliente POR CAFÉ (sellos o puntos). El cliente es global; el saldo es local al punto de venta.';

-- ── Programas (configurables por punto, presets por escala de entorno) ───────
CREATE TABLE IF NOT EXISTS public.fid_programas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  punto_venta_id UUID NOT NULL REFERENCES public.b2b_puntos_venta(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL DEFAULT 'sellos' CHECK (tipo IN ('sellos', 'puntos')),
  nombre         TEXT NOT NULL,
  regla          TEXT NOT NULL,  -- explicada en DOS oraciones (test de aceptación)
  umbral         INT NOT NULL DEFAULT 6 CHECK (umbral > 0),  -- sellos: N compras · puntos: costo de la recompensa
  recompensa     TEXT NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fid_programas_punto ON public.fid_programas (punto_venta_id);

COMMENT ON TABLE public.fid_programas IS
  'Programa de fidelización por punto de venta: sellos (X compras → recompensa) o puntos (por monto). Presets por escala de entorno en el BFF.';

-- ── Ledger único de eventos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fid_eventos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id     UUID NOT NULL REFERENCES public.fid_clientes(id) ON DELETE CASCADE,
  punto_venta_id UUID NOT NULL REFERENCES public.b2b_puntos_venta(id) ON DELETE CASCADE,
  membresia_id   UUID REFERENCES public.fid_membresias(id) ON DELETE SET NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN ('compra', 'feedback_rapido', 'feedback_semantico', 'ajuste')),
  cantidad       INT NOT NULL DEFAULT 0,  -- sellos o puntos (positivo gana, negativo compensa)
  origen         TEXT NOT NULL DEFAULT 'qr' CHECK (origen IN ('portal', 'manual', 'pos', 'qr')),
  ref_id         TEXT,  -- id de la sesión de percepción, venta, etc.
  notas          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fid_eventos_cliente ON public.fid_eventos (cliente_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fid_eventos_punto ON public.fid_eventos (punto_venta_id, created_at DESC);

COMMENT ON TABLE public.fid_eventos IS
  'LEDGER inmutable de eventos del microcanal (compra/feedback): los ledgers no se borran ni editan, se compensan.';

-- ── Canjes ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fid_canjes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id     UUID NOT NULL REFERENCES public.fid_clientes(id) ON DELETE CASCADE,
  punto_venta_id UUID NOT NULL REFERENCES public.b2b_puntos_venta(id) ON DELETE CASCADE,
  membresia_id   UUID REFERENCES public.fid_membresias(id) ON DELETE SET NULL,
  programa_id    UUID REFERENCES public.fid_programas(id) ON DELETE SET NULL,
  recompensa     TEXT NOT NULL,
  costo          INT NOT NULL DEFAULT 0 CHECK (costo >= 0),
  estado         TEXT NOT NULL DEFAULT 'solicitado' CHECK (estado IN ('solicitado', 'aprobado', 'rechazado')),
  fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fid_canjes_cliente ON public.fid_canjes (cliente_id, created_at DESC);

COMMENT ON TABLE public.fid_canjes IS
  'Canjes del cliente final. Al aprobar un canje de sellos, el BFF otorga el primer sello del siguiente ciclo (re-enganche post-canje).';

-- ── updated_at ───────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS fid_clientes_updated_at ON public.fid_clientes;
CREATE TRIGGER fid_clientes_updated_at
  BEFORE UPDATE ON public.fid_clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS fid_membresias_updated_at ON public.fid_membresias;
CREATE TRIGGER fid_membresias_updated_at
  BEFORE UPDATE ON public.fid_membresias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS fid_programas_updated_at ON public.fid_programas;
CREATE TRIGGER fid_programas_updated_at
  BEFORE UPDATE ON public.fid_programas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS fid_canjes_updated_at ON public.fid_canjes;
CREATE TRIGGER fid_canjes_updated_at
  BEFORE UPDATE ON public.fid_canjes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Invariante de privacidad: el punto de venta (dueño) ve SOLO sus membresías,
-- eventos y canjes; el cliente (anon) no accede directo — todo pasa por el BFF
-- (admin client) en los flujos públicos, con rate-limit.
ALTER TABLE public.fid_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fid_membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fid_programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fid_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fid_canjes ENABLE ROW LEVEL SECURITY;

-- Clientes: solo admin (los clientes finales no tienen cuenta en este sistema)
DROP POLICY IF EXISTS fid_clientes_admin_all_p ON public.fid_clientes;
CREATE POLICY fid_clientes_admin_all_p ON public.fid_clientes
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

-- Membresías: admin · dueño del punto (solo las de SU punto)
DROP POLICY IF EXISTS fid_membresias_admin_all_p ON public.fid_membresias;
CREATE POLICY fid_membresias_admin_all_p ON public.fid_membresias
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS fid_membresias_punto_p ON public.fid_membresias;
CREATE POLICY fid_membresias_punto_p ON public.fid_membresias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  );

-- Programas: admin · dueño del punto
DROP POLICY IF EXISTS fid_programas_admin_all_p ON public.fid_programas;
CREATE POLICY fid_programas_admin_all_p ON public.fid_programas
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS fid_programas_punto_p ON public.fid_programas;
CREATE POLICY fid_programas_punto_p ON public.fid_programas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  );

-- Eventos (ledger inmutable): admin lee/todo · dueño del punto lee los suyos ·
-- nadie edita ni borra
DROP POLICY IF EXISTS fid_eventos_admin_select_p ON public.fid_eventos;
CREATE POLICY fid_eventos_admin_select_p ON public.fid_eventos
  FOR SELECT USING (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS fid_eventos_punto_select_p ON public.fid_eventos;
CREATE POLICY fid_eventos_punto_select_p ON public.fid_eventos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS fid_eventos_admin_insert_p ON public.fid_eventos;
CREATE POLICY fid_eventos_admin_insert_p ON public.fid_eventos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS fid_eventos_punto_insert_p ON public.fid_eventos;
CREATE POLICY fid_eventos_punto_insert_p ON public.fid_eventos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  );

-- Canjes: admin · dueño del punto (los de su punto)
DROP POLICY IF EXISTS fid_canjes_admin_all_p ON public.fid_canjes;
CREATE POLICY fid_canjes_admin_all_p ON public.fid_canjes
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS fid_canjes_punto_p ON public.fid_canjes;
CREATE POLICY fid_canjes_punto_p ON public.fid_canjes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.b2b_puntos_venta p
      WHERE p.id = punto_venta_id AND p.user_id = auth.uid()
    )
  );
