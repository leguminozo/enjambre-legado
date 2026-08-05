-- 1011_inventario_operativo.sql
-- Inventario multi-clase OYZ: insumos, etiquetas, envases, material apícola, destilación.
-- Productos de venta siguen en `productos.stock`; esta tabla cubre el resto del enjambre.
-- Trazabilidad: cada entrada/salida/ajuste deja fila en inventario_movimientos.

-- ── Clase de ítem (ampliable con CHECK + app enum) ───────────────────────────
-- producto_venta no vive aquí (es productos.*); el resto sí.

CREATE TABLE IF NOT EXISTS public.inventario_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  -- Categoría operativa
  clase           TEXT NOT NULL CHECK (clase IN (
                    'insumo',       -- miel a granel comprada, azúcar, polen, tratamientos, cera
                    'etiqueta',     -- rollos / planchas de etiqueta por SKU
                    'envase',       -- frascos, tapas, sachets, cajas, cofres
                    'apicola',      -- alzas, marcos, cera estampada, núcleos, equipo
                    'destilacion'   -- materia vegetal, botellas, tapas hidrolato
                  )),
  nombre          TEXT NOT NULL,
  sku_code        TEXT,
  unidad          TEXT NOT NULL DEFAULT 'unidad'
                    CHECK (unidad IN ('unidad', 'kg', 'g', 'l', 'ml', 'rollo', 'plancha', 'caja')),
  stock           NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo    NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  -- Costo unitario en CLP (entero; 0 = sin costear)
  costo_unitario  INT NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
  -- Vínculo opcional a catálogo de venta o a costeo
  producto_id     UUID REFERENCES public.productos(id) ON DELETE SET NULL,
  ingredient_id   UUID, -- ingredients puede no existir en todos los envs; sin FK rígida
  proveedor_nota  TEXT,
  notas           TEXT,
  activo          BOOLEAN NOT NULL DEFAULT true,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventario_items_clase
  ON public.inventario_items (clase) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_inventario_items_user
  ON public.inventario_items (user_id);
CREATE INDEX IF NOT EXISTS idx_inventario_items_empresa
  ON public.inventario_items (empresa_id);
CREATE INDEX IF NOT EXISTS idx_inventario_items_alerta
  ON public.inventario_items (user_id)
  WHERE activo = true AND stock <= stock_minimo;

COMMENT ON TABLE public.inventario_items IS
  'Inventario operativo multi-clase (insumos, etiquetas, envases, apícola, destilación). Productos de tienda: productos.stock.';

-- ── Movimientos (trazabilidad) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventario_movimientos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES public.inventario_items(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN (
                    'entrada',   -- compra / recepción
                    'salida',    -- consumo en producción o despacho
                    'ajuste',    -- reformulación / inventario físico
                    'merma'      -- pérdida / rotura
                  )),
  cantidad        NUMERIC(14, 3) NOT NULL CHECK (cantidad > 0),
  stock_antes     NUMERIC(14, 3) NOT NULL,
  stock_despues   NUMERIC(14, 3) NOT NULL,
  motivo          TEXT,
  ref_tipo        TEXT,  -- lote | receta | destilacion | compra | manual
  ref_id          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventario_mov_item
  ON public.inventario_movimientos (item_id, created_at DESC);

COMMENT ON TABLE public.inventario_movimientos IS
  'Trazabilidad de movimientos de inventario operativo (quién, cuánto, por qué).';

-- ── updated_at ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.inventario_items_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventario_items_updated ON public.inventario_items;
CREATE TRIGGER trg_inventario_items_updated
  BEFORE UPDATE ON public.inventario_items
  FOR EACH ROW
  EXECUTE FUNCTION public.inventario_items_touch_updated_at();

-- ── RPC: aplicar movimiento atómico (service_role o admin) ───────────────────
CREATE OR REPLACE FUNCTION public.inventario_aplicar_movimiento(
  p_item_id UUID,
  p_tipo TEXT,
  p_cantidad NUMERIC,
  p_motivo TEXT DEFAULT NULL,
  p_ref_tipo TEXT DEFAULT NULL,
  p_ref_id TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock NUMERIC;
  v_nuevo NUMERIC;
  v_uid UUID := auth.uid();
BEGIN
  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    RAISE EXCEPTION 'cantidad inválida' USING ERRCODE = '22023';
  END IF;
  IF p_tipo NOT IN ('entrada', 'salida', 'ajuste', 'merma') THEN
    RAISE EXCEPTION 'tipo inválido' USING ERRCODE = '22023';
  END IF;

  SELECT stock INTO v_stock
  FROM public.inventario_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ítem no encontrado' USING ERRCODE = 'P0002';
  END IF;

  IF p_tipo = 'entrada' THEN
    v_nuevo := v_stock + p_cantidad;
  ELSIF p_tipo = 'ajuste' THEN
    -- cantidad = stock final deseado
    v_nuevo := p_cantidad;
  ELSE
    -- salida / merma
    v_nuevo := v_stock - p_cantidad;
    IF v_nuevo < 0 THEN
      RAISE EXCEPTION 'stock insuficiente' USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE public.inventario_items
  SET stock = v_nuevo
  WHERE id = p_item_id;

  INSERT INTO public.inventario_movimientos (
    item_id, user_id, tipo, cantidad, stock_antes, stock_despues, motivo, ref_tipo, ref_id
  ) VALUES (
    p_item_id,
    v_uid,
    p_tipo,
    CASE WHEN p_tipo = 'ajuste' THEN ABS(v_nuevo - v_stock) ELSE p_cantidad END,
    v_stock,
    v_nuevo,
    p_motivo,
    p_ref_tipo,
    p_ref_id
  );

  RETURN json_build_object(
    'item_id', p_item_id,
    'stock_antes', v_stock,
    'stock_despues', v_nuevo,
    'tipo', p_tipo
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.inventario_aplicar_movimiento(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.inventario_aplicar_movimiento(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.inventario_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventario_items_select ON public.inventario_items;
CREATE POLICY inventario_items_select ON public.inventario_items
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin() OR public.is_gerente()
  );

DROP POLICY IF EXISTS inventario_items_write ON public.inventario_items;
CREATE POLICY inventario_items_write ON public.inventario_items
  FOR ALL USING (
    user_id = auth.uid() OR public.is_admin() OR public.is_gerente()
  ) WITH CHECK (
    user_id = auth.uid() OR public.is_admin() OR public.is_gerente()
  );

DROP POLICY IF EXISTS inventario_mov_select ON public.inventario_movimientos;
CREATE POLICY inventario_mov_select ON public.inventario_movimientos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.inventario_items i
      WHERE i.id = item_id
        AND (i.user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
    )
  );

DROP POLICY IF EXISTS inventario_mov_insert ON public.inventario_movimientos;
CREATE POLICY inventario_mov_insert ON public.inventario_movimientos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventario_items i
      WHERE i.id = item_id
        AND (i.user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
    )
  );
