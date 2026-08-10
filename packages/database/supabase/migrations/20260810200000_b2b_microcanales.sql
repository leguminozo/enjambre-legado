-- =============================================================================
-- Capa 2 — B2B Microcanales: puntos de venta, revendedores, sets y pedidos
--
-- Estado del arte triangulado (docs/MICROCANALES_CIENCIA_Y_GOBERNANZA.md):
--   · Escalas por entorno: cafetería (experimental, volumen bajo), tienda
--     gourmet (medio), hotel (gran consumo — "regala"), feria/evento.
--   · Revendedores = personas (tienda/frutería/feria/espacio propio) que
--     promueven la marca; reciben retribución por compras al por mayor (Capa 3).
--   · Registro autónomo ligero (origen 'autonomo') + alta de la marca
--     (origen 'marca'); el código de acceso es un gatillante más, no el único.
--   · Holdout experimental (grupo_control + asignado_holdout_at): 5–10% de
--     nuevos revendedores sin incentivos para medir incrementality real.
--   · RLS invariante: un punto de venta ve SOLO lo suyo — nunca datos de
--     otros puntos ni del ledger global de clientes (política de privacidad).
-- =============================================================================

-- ── Puntos de venta ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2b_puntos_venta (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'cafeteria'
                  CHECK (tipo IN ('cafeteria', 'tienda_gourmet', 'hotel', 'feria_evento', 'otro')),
  ciudad          TEXT,
  contacto_nombre TEXT,
  contacto_email  TEXT,  -- NUNCA se expone públicamente
  estado          TEXT NOT NULL DEFAULT 'prospecto'
                  CHECK (estado IN ('prospecto', 'activo', 'pausado', 'retirado')),
  codigo_acceso   TEXT NOT NULL UNIQUE,  -- = payload del QR del pendón (generado en BFF)
  origen          TEXT NOT NULL DEFAULT 'marca' CHECK (origen IN ('autonomo', 'marca')),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- dueño (claim)
  publico         BOOLEAN NOT NULL DEFAULT false,  -- habilita la landing pública
  notas           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_puntos_venta_estado ON public.b2b_puntos_venta (estado);
CREATE INDEX IF NOT EXISTS idx_b2b_puntos_venta_user ON public.b2b_puntos_venta (user_id);

COMMENT ON TABLE public.b2b_puntos_venta IS
  'Puntos de venta (cafeterías, tiendas, hoteles, ferias): canales del microcanal con código de acceso propio (QR del pendón).';
COMMENT ON COLUMN public.b2b_puntos_venta.contacto_email IS
  'Contacto privado: la vista pública (v_b2b_puntos_publicos) no lo expone.';

-- ── Revendedores (personas) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2b_revendedores (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             TEXT NOT NULL,
  whatsapp           TEXT,  -- identidad ligera (gateway real documentado como futuro)
  tipo_espacio       TEXT NOT NULL DEFAULT 'otro'
                     CHECK (tipo_espacio IN ('tienda', 'fruteria', 'feria', 'espacio_propio', 'otro')),
  estado             TEXT NOT NULL DEFAULT 'prospecto'
                     CHECK (estado IN ('prospecto', 'activo', 'pausado')),
  codigo_revendedor  TEXT NOT NULL UNIQUE,  -- generado en BFF
  origen             TEXT NOT NULL DEFAULT 'marca' CHECK (origen IN ('autonomo', 'marca')),
  user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- claim
  -- Marco experimental: holdout 5–10% sin incentivos (medición de incrementality).
  grupo_control      BOOLEAN NOT NULL DEFAULT false,
  asignado_holdout_at TIMESTAMPTZ,
  notas              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_revendedores_estado ON public.b2b_revendedores (estado);

COMMENT ON TABLE public.b2b_revendedores IS
  'Segmento revendedor: personas que revenden la marca desde su espacio (tienda, frutería, feria) y reciben retribución por compras al por mayor (Capa 3).';

-- ── Sets de entrada ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2b_sets_entrada (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre               TEXT NOT NULL,
  descripcion          TEXT,
  precio_clp           INT NOT NULL DEFAULT 0 CHECK (precio_clp >= 0),
  tipo_entorno         TEXT NOT NULL DEFAULT 'cafeteria'
                       CHECK (tipo_entorno IN ('cafeteria', 'tienda_gourmet', 'hotel', 'feria_evento', 'revolvedor')),
  incluye_materiales   BOOLEAN NOT NULL DEFAULT true,  -- pendón + tarjetas (físicos)
  materiales_descripcion TEXT,
  pack_digital         BOOLEAN NOT NULL DEFAULT true,  -- stories, posts, textos (digitales)
  activo               BOOLEAN NOT NULL DEFAULT true,
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_sets_entorno ON public.b2b_sets_entrada (tipo_entorno, activo);

COMMENT ON TABLE public.b2b_sets_entrada IS
  'Sets de entrada por tipo de entorno: el set es una unidad narrativa y comercial (productos + materiales físicos + pack digital).';

-- ── Ítems de set (productos reales de tienda) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2b_set_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id         UUID NOT NULL REFERENCES public.b2b_sets_entrada(id) ON DELETE CASCADE,
  producto_id    UUID NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  cantidad       INT NOT NULL DEFAULT 1 CHECK (cantidad >= 1),
  es_degustacion BOOLEAN NOT NULL DEFAULT false,  -- miel/palitos para degustar
  notas          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (set_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_b2b_set_items_producto ON public.b2b_set_items (producto_id);

COMMENT ON TABLE public.b2b_set_items IS
  'Contenido del set: productos reales del catálogo de tienda (frascos, sachets) + ítems de degustación.';

-- ── Pedidos ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2b_pedidos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  punto_venta_id UUID REFERENCES public.b2b_puntos_venta(id) ON DELETE SET NULL,
  revendedor_id  UUID REFERENCES public.b2b_revendedores(id) ON DELETE SET NULL,
  set_id         UUID REFERENCES public.b2b_sets_entrada(id) ON DELETE SET NULL,
  fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
  estado         TEXT NOT NULL DEFAULT 'solicitado'
                 CHECK (estado IN ('solicitado', 'confirmado', 'enviado', 'entregado', 'cancelado')),
  monto_clp      INT NOT NULL DEFAULT 0 CHECK (monto_clp >= 0),  -- snapshot del set al pedir
  notas          TEXT,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (punto_venta_id IS NOT NULL OR revendedor_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_b2b_pedidos_punto ON public.b2b_pedidos (punto_venta_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_pedidos_revendedor ON public.b2b_pedidos (revendedor_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_pedidos_estado ON public.b2b_pedidos (estado);

COMMENT ON TABLE public.b2b_pedidos IS
  'Pedidos de sets: de un punto de venta o de un revendedor (compras al por mayor → retribución en Capa 3).';

-- ── Reseñas de revendedores (experiencia de vender la marca) ─────────────────
CREATE TABLE IF NOT EXISTS public.b2b_resenas_revendedor (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revendedor_id UUID NOT NULL REFERENCES public.b2b_revendedores(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  texto         TEXT NOT NULL,
  estado        TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_resenas_revendedor_estado ON public.b2b_resenas_revendedor (estado);

COMMENT ON TABLE public.b2b_resenas_revendedor IS
  'Experiencia de los revendedores vendiendo la marca — visible a otros revendedores (moderada).';

-- ── Vista pública de puntos de venta (sin contacto) ──────────────────────────
-- SIN security_invoker a propósito: la tabla base no tiene policy pública
-- (el contacto nunca debe exponerse ni siquiera por fila); la vista es la única
-- vía pública y solo proyecta columnas curadas.
CREATE OR REPLACE VIEW public.v_b2b_puntos_publicos AS
SELECT id, nombre, tipo, ciudad, codigo_acceso
FROM public.b2b_puntos_venta
WHERE publico = true AND estado = 'activo';

COMMENT ON VIEW public.v_b2b_puntos_publicos IS
  'Datos públicos de un punto de venta para la landing — contacto y datos internos NUNCA se exponen (la tabla base no tiene policy anónima).';

-- ── updated_at ───────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS b2b_puntos_venta_updated_at ON public.b2b_puntos_venta;
CREATE TRIGGER b2b_puntos_venta_updated_at
  BEFORE UPDATE ON public.b2b_puntos_venta
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS b2b_revendedores_updated_at ON public.b2b_revendedores;
CREATE TRIGGER b2b_revendedores_updated_at
  BEFORE UPDATE ON public.b2b_revendedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS b2b_sets_entrada_updated_at ON public.b2b_sets_entrada;
CREATE TRIGGER b2b_sets_entrada_updated_at
  BEFORE UPDATE ON public.b2b_sets_entrada
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS b2b_pedidos_updated_at ON public.b2b_pedidos;
CREATE TRIGGER b2b_pedidos_updated_at
  BEFORE UPDATE ON public.b2b_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS b2b_resenas_revendedor_updated_at ON public.b2b_resenas_revendedor;
CREATE TRIGGER b2b_resenas_revendedor_updated_at
  BEFORE UPDATE ON public.b2b_resenas_revendedor
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.b2b_puntos_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_revendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_sets_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_resenas_revendedor ENABLE ROW LEVEL SECURITY;

-- Puntos de venta: admin todo · dueño lo suyo · nada público en la tabla
-- (la lectura pública va por la vista v_b2b_puntos_publicos).
DROP POLICY IF EXISTS b2b_puntos_venta_admin_all_p ON public.b2b_puntos_venta;
CREATE POLICY b2b_puntos_venta_admin_all_p ON public.b2b_puntos_venta
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS b2b_puntos_venta_owner_p ON public.b2b_puntos_venta;
CREATE POLICY b2b_puntos_venta_owner_p ON public.b2b_puntos_venta
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Revendedores: admin todo · el revendedor lo suyo
DROP POLICY IF EXISTS b2b_revendedores_admin_all_p ON public.b2b_revendedores;
CREATE POLICY b2b_revendedores_admin_all_p ON public.b2b_revendedores
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS b2b_revendedores_owner_p ON public.b2b_revendedores;
CREATE POLICY b2b_revendedores_owner_p ON public.b2b_revendedores
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sets: admin todo · catálogo activo legible (público para portales)
DROP POLICY IF EXISTS b2b_sets_admin_all_p ON public.b2b_sets_entrada;
CREATE POLICY b2b_sets_admin_all_p ON public.b2b_sets_entrada
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS b2b_sets_publico_select_p ON public.b2b_sets_entrada;
CREATE POLICY b2b_sets_publico_select_p ON public.b2b_sets_entrada
  FOR SELECT USING (activo = true);

-- Ítems de set: admin todo · lectura vía el set activo
DROP POLICY IF EXISTS b2b_set_items_admin_all_p ON public.b2b_set_items;
CREATE POLICY b2b_set_items_admin_all_p ON public.b2b_set_items
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS b2b_set_items_publico_select_p ON public.b2b_set_items;
CREATE POLICY b2b_set_items_publico_select_p ON public.b2b_set_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.b2b_sets_entrada s WHERE s.id = set_id AND s.activo = true)
  );

-- Pedidos: admin · el que lo creó · el punto dueño · el revendedor dueño
DROP POLICY IF EXISTS b2b_pedidos_admin_all_p ON public.b2b_pedidos;
CREATE POLICY b2b_pedidos_admin_all_p ON public.b2b_pedidos
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS b2b_pedidos_owner_p ON public.b2b_pedidos;
CREATE POLICY b2b_pedidos_owner_p ON public.b2b_pedidos
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS b2b_pedidos_punto_p ON public.b2b_pedidos;
CREATE POLICY b2b_pedidos_punto_p ON public.b2b_pedidos
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

DROP POLICY IF EXISTS b2b_pedidos_revendedor_p ON public.b2b_pedidos;
CREATE POLICY b2b_pedidos_revendedor_p ON public.b2b_pedidos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.b2b_revendedores r
      WHERE r.id = revendedor_id AND r.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.b2b_revendedores r
      WHERE r.id = revendedor_id AND r.user_id = auth.uid()
    )
  );

-- Reseñas de revendedor: admin · el revendedor lo suyo · público las aprobadas
DROP POLICY IF EXISTS b2b_resenas_admin_all_p ON public.b2b_resenas_revendedor;
CREATE POLICY b2b_resenas_admin_all_p ON public.b2b_resenas_revendedor
  FOR ALL USING (public.is_admin() OR public.is_gerente())
  WITH CHECK (public.is_admin() OR public.is_gerente());

DROP POLICY IF EXISTS b2b_resenas_owner_p ON public.b2b_resenas_revendedor;
CREATE POLICY b2b_resenas_owner_p ON public.b2b_resenas_revendedor
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.b2b_revendedores r WHERE r.id = revendedor_id AND r.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.b2b_revendedores r WHERE r.id = revendedor_id AND r.user_id = auth.uid())
  );

DROP POLICY IF EXISTS b2b_resenas_publico_select_p ON public.b2b_resenas_revendedor;
CREATE POLICY b2b_resenas_publico_select_p ON public.b2b_resenas_revendedor
  FOR SELECT USING (estado = 'aprobada');
