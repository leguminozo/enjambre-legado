-- =============================================================================
-- Módulo Infusiones — trazabilidad de producción de hierbas (Obrera y Zángano)
--
-- Flujo cubierto (cada eslabón traza hacia atrás y tiene responsable asignable):
--
--   Recolección/Compra → Deshidratación → Stock seco → Fórmula → Lote de producción → Sachets
--
-- Decisiones de diseño:
--   · Prefijo `infusion_*` (patrón hidromiel_*): evita colisión con `lotes`
--     (miel comercial) y `proveedores` (despacho legacy).
--   · `rendimiento_pct` y `gramos_por_kg_mezcla` son columnas GENERATED:
--     el rendimiento fresca→seca y el gramaje por kg no pueden desincronizarse.
--   · `formulas.tipo` era "individual/egl" en el schema original — "egl" era una
--     transcripción corrupta de "en granel" (verificado: sin uso real en la
--     industria del té/infusiones). Normalizado a 'individual'/'granel'.
--   · Delegación por campo `responsable`/`recolector` (texto libre, sugerencias
--     en UI); roles formales por paso quedan para fase 2.
--   · `codigo_lote` (ej. MENTA-2026-001) se genera en el BFF como etiqueta
--     legible; la PK interna es el UUID.
--   · RLS patrón inventario: propietario de la fila o admin/gerente.
--   · Sin multi-tenant: producción de marca única (no se usa has_empresa_access).
-- =============================================================================

-- ── Catálogo: materias primas ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.infusion_materias_primas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'hierba' CHECK (tipo IN ('hierba', 'especia', 'otro')),
  unidad_medida TEXT NOT NULL DEFAULT 'kg',
  activa        BOOLEAN NOT NULL DEFAULT true,  -- soft delete (mantiene historial de lotes)
  notas         TEXT,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infusion_materias_primas_nombre
  ON public.infusion_materias_primas (nombre);

COMMENT ON TABLE public.infusion_materias_primas IS
  'Catálogo base del módulo Infusiones: hierbas, especias y otros insumos con unidad de medida.';

-- ── Catálogo: proveedores ─────────────────────────────────────────────────────
-- Sin materia_prima_id (mejora al schema original): un proveedor puede abastecer
-- varios insumos; el vínculo proveedor→materia prima vive en el lote de entrada.
CREATE TABLE IF NOT EXISTS public.infusion_proveedores (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  contacto   TEXT,
  ubicacion  TEXT,
  activa     BOOLEAN NOT NULL DEFAULT true,
  notas      TEXT,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infusion_proveedores_nombre
  ON public.infusion_proveedores (nombre);

COMMENT ON TABLE public.infusion_proveedores IS
  'Proveedores de materia prima del módulo Infusiones (independientes del catálogo de despacho).';

-- ── Lotes de entrada: el origen de todo ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.infusion_lotes_entrada (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_lote          TEXT UNIQUE NOT NULL,  -- MENTA-2026-001 (generado en BFF)
  materia_prima_id     UUID NOT NULL REFERENCES public.infusion_materias_primas(id),
  fecha                DATE NOT NULL,
  origen               TEXT NOT NULL DEFAULT 'recoleccion'
                       CHECK (origen IN ('recoleccion', 'compra', 'cultivo')),
  peso_fresco_kg       NUMERIC(8, 3) CHECK (peso_fresco_kg IS NULL OR peso_fresco_kg > 0),
  precio_compra_clp    NUMERIC(12, 0) CHECK (precio_compra_clp IS NULL OR precio_compra_clp >= 0),
  proveedor_id         UUID REFERENCES public.infusion_proveedores(id) ON DELETE SET NULL,
  recolector           TEXT,  -- delegación: quién recolectó (texto libre)
  ubicacion_recoleccion TEXT,
  notas                TEXT,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infusion_lotes_entrada_mp_fecha
  ON public.infusion_lotes_entrada (materia_prima_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_infusion_lotes_entrada_proveedor
  ON public.infusion_lotes_entrada (proveedor_id);

COMMENT ON TABLE public.infusion_lotes_entrada IS
  'Lotes de materia fresca que entran al sistema (recolección, compra o cultivo) — cuánto entra.';

-- ── Lotes deshidratados: el proceso ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.infusion_lotes_deshidratado (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_entrada_id UUID NOT NULL UNIQUE REFERENCES public.infusion_lotes_entrada(id),  -- 1:1 con la entrada
  fecha_inicio    DATE,
  fecha_fin       DATE,
  metodo          TEXT NOT NULL DEFAULT 'deshidratador'
                  CHECK (metodo IN ('horno', 'deshidratador', 'aire')),
  temperatura_c   NUMERIC(4, 1),
  peso_entrada_kg NUMERIC(8, 3) CHECK (peso_entrada_kg IS NULL OR peso_entrada_kg > 0),
  peso_salida_kg  NUMERIC(8, 3) CHECK (peso_salida_kg IS NULL OR peso_salida_kg > 0),
  -- Rendimiento fresca→seca calculado por la DB: no puede desincronizarse.
  rendimiento_pct NUMERIC(6, 2) GENERATED ALWAYS AS (
    CASE
      WHEN peso_entrada_kg IS NOT NULL AND peso_entrada_kg > 0 AND peso_salida_kg IS NOT NULL
      THEN ROUND((peso_salida_kg / peso_entrada_kg) * 100, 2)
      ELSE NULL
    END
  ) STORED,
  responsable     TEXT,  -- delegación: quién operó la deshidratación
  notas           TEXT,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.infusion_lotes_deshidratado IS
  'Proceso de deshidratado de un lote de entrada: método, temperatura y pesos antes/después con rendimiento calculado.';

-- ── Fórmulas (recetas con gramajes) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.infusion_formulas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT NOT NULL,
  descripcion      TEXT,
  gramaje_sachet_g NUMERIC(6, 2) NOT NULL CHECK (gramaje_sachet_g > 0),
  tipo             TEXT NOT NULL DEFAULT 'individual'
                   CHECK (tipo IN ('individual', 'granel')),
  activa           BOOLEAN NOT NULL DEFAULT true,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infusion_formulas_nombre
  ON public.infusion_formulas (nombre);

COMMENT ON TABLE public.infusion_formulas IS
  'Fórmulas de mezcla: gramaje por sachet y formato de venta (sachet individual o a granel).';
COMMENT ON COLUMN public.infusion_formulas.tipo IS
  'Formato de la fórmula. El schema original decía "individual/egl": "egl" era una transcripción corrupta de "en granel" (sin uso real en la industria), normalizada a granel.';

-- ── Ingredientes de fórmula (receta con porcentajes) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.infusion_formula_ingredientes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id           UUID NOT NULL REFERENCES public.infusion_formulas(id) ON DELETE CASCADE,
  materia_prima_id     UUID NOT NULL REFERENCES public.infusion_materias_primas(id),
  porcentaje           NUMERIC(5, 2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
  -- Gramos por kg de mezcla = porcentaje · 10 (calculado, no puede desincronizarse).
  gramos_por_kg_mezcla NUMERIC(8, 2) GENERATED ALWAYS AS (ROUND(porcentaje * 10, 2)) STORED,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (formula_id, materia_prima_id)
);

CREATE INDEX IF NOT EXISTS idx_infusion_formula_ingredientes_mp
  ON public.infusion_formula_ingredientes (materia_prima_id);

COMMENT ON TABLE public.infusion_formula_ingredientes IS
  'Ingredientes de una fórmula con porcentaje de mezcla; el gramaje por kg es columna calculada.';

-- ── Lotes de producción (sachets) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.infusion_lotes_produccion (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_id      UUID NOT NULL REFERENCES public.infusion_formulas(id),
  fecha           DATE NOT NULL,
  peso_mezcla_kg  NUMERIC(8, 3) CHECK (peso_mezcla_kg IS NULL OR peso_mezcla_kg > 0),
  cantidad_sachets INTEGER CHECK (cantidad_sachets IS NULL OR cantidad_sachets >= 0),
  responsable     TEXT,  -- delegación: quién operó la producción
  notas           TEXT,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_infusion_lotes_produccion_formula_fecha
  ON public.infusion_lotes_produccion (formula_id, fecha DESC);

COMMENT ON TABLE public.infusion_lotes_produccion IS
  'Lotes de producción: qué fórmula, cuánta mezcla y cuántos sachets se produjeron.';

-- ── Materiales consumidos (qué lote seco alimentó cada producción) ────────────
CREATE TABLE IF NOT EXISTS public.infusion_produccion_materiales (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_produccion_id   UUID NOT NULL REFERENCES public.infusion_lotes_produccion(id) ON DELETE CASCADE,
  lote_deshidratado_id UUID NOT NULL REFERENCES public.infusion_lotes_deshidratado(id),
  gramos_utilizados    NUMERIC(8, 2) NOT NULL CHECK (gramos_utilizados > 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lote_produccion_id, lote_deshidratado_id)
);

CREATE INDEX IF NOT EXISTS idx_infusion_produccion_materiales_deshidratado
  ON public.infusion_produccion_materiales (lote_deshidratado_id);

COMMENT ON TABLE public.infusion_produccion_materiales IS
  'Consumo de stock seco: cada lote de producción consume gramos de lotes deshidratados (trazabilidad del material).';

-- ── Vista de stock seco disponible ────────────────────────────────────────────
-- security_invoker: la vista respeta el RLS de las tablas base (Postgres 15+).
CREATE OR REPLACE VIEW public.v_infusion_stock_seco
WITH (security_invoker = true) AS
SELECT
  mp.id                       AS materia_prima_id,
  mp.nombre                   AS materia_prima,
  ROUND(COALESCE(SUM(ld.peso_salida_kg), 0), 3)                AS total_seco_kg,
  ROUND(COALESCE(SUM(pm.gramos_utilizados) / 1000.0, 0), 3)    AS consumido_kg,
  ROUND(COALESCE(SUM(ld.peso_salida_kg), 0)
        - COALESCE(SUM(pm.gramos_utilizados) / 1000.0, 0), 3)  AS stock_disponible_kg
FROM public.infusion_materias_primas mp
LEFT JOIN public.infusion_lotes_entrada le        ON le.materia_prima_id = mp.id
LEFT JOIN public.infusion_lotes_deshidratado ld   ON ld.lote_entrada_id = le.id
LEFT JOIN public.infusion_produccion_materiales pm ON pm.lote_deshidratado_id = ld.id
GROUP BY mp.id, mp.nombre
ORDER BY mp.nombre;

COMMENT ON VIEW public.v_infusion_stock_seco IS
  'Stock seco disponible por materia prima: total deshidratado menos consumido en producción (kg).';

-- ── updated_at (función compartida definida en 991) ──────────────────────────
DROP TRIGGER IF EXISTS infusion_materias_primas_updated_at ON public.infusion_materias_primas;
CREATE TRIGGER infusion_materias_primas_updated_at
  BEFORE UPDATE ON public.infusion_materias_primas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS infusion_proveedores_updated_at ON public.infusion_proveedores;
CREATE TRIGGER infusion_proveedores_updated_at
  BEFORE UPDATE ON public.infusion_proveedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS infusion_lotes_entrada_updated_at ON public.infusion_lotes_entrada;
CREATE TRIGGER infusion_lotes_entrada_updated_at
  BEFORE UPDATE ON public.infusion_lotes_entrada
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS infusion_lotes_deshidratado_updated_at ON public.infusion_lotes_deshidratado;
CREATE TRIGGER infusion_lotes_deshidratado_updated_at
  BEFORE UPDATE ON public.infusion_lotes_deshidratado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS infusion_formulas_updated_at ON public.infusion_formulas;
CREATE TRIGGER infusion_formulas_updated_at
  BEFORE UPDATE ON public.infusion_formulas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS infusion_lotes_produccion_updated_at ON public.infusion_lotes_produccion;
CREATE TRIGGER infusion_lotes_produccion_updated_at
  BEFORE UPDATE ON public.infusion_lotes_produccion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Patrón inventario: propietario de la fila o admin/gerente. Un delegado crea
-- sus filas (user_id = auth.uid()) y el admin ve y edita todo.

ALTER TABLE public.infusion_materias_primas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_lotes_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_lotes_deshidratado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_formula_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_lotes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_produccion_materiales ENABLE ROW LEVEL SECURITY;

-- Materias primas
DROP POLICY IF EXISTS infusion_materias_primas_own_p ON public.infusion_materias_primas;
CREATE POLICY infusion_materias_primas_own_p ON public.infusion_materias_primas
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_gerente());

-- Proveedores
DROP POLICY IF EXISTS infusion_proveedores_own_p ON public.infusion_proveedores;
CREATE POLICY infusion_proveedores_own_p ON public.infusion_proveedores
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_gerente());

-- Lotes de entrada
DROP POLICY IF EXISTS infusion_lotes_entrada_own_p ON public.infusion_lotes_entrada;
CREATE POLICY infusion_lotes_entrada_own_p ON public.infusion_lotes_entrada
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_gerente());

-- Lotes deshidratados
DROP POLICY IF EXISTS infusion_lotes_deshidratado_own_p ON public.infusion_lotes_deshidratado;
CREATE POLICY infusion_lotes_deshidratado_own_p ON public.infusion_lotes_deshidratado
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_gerente());

-- Fórmulas
DROP POLICY IF EXISTS infusion_formulas_own_p ON public.infusion_formulas;
CREATE POLICY infusion_formulas_own_p ON public.infusion_formulas
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_gerente());

-- Ingredientes de fórmula: acceso vía la fórmula (patrón hijas EXISTS)
DROP POLICY IF EXISTS infusion_formula_ingredientes_all_p ON public.infusion_formula_ingredientes;
CREATE POLICY infusion_formula_ingredientes_all_p ON public.infusion_formula_ingredientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.infusion_formulas f
      WHERE f.id = formula_id
        AND (f.user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.infusion_formulas f
      WHERE f.id = formula_id
        AND (f.user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
    )
  );

-- Lotes de producción
DROP POLICY IF EXISTS infusion_lotes_produccion_own_p ON public.infusion_lotes_produccion;
CREATE POLICY infusion_lotes_produccion_own_p ON public.infusion_lotes_produccion
  FOR ALL
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_gerente());

-- Materiales consumidos: acceso vía el lote de producción
DROP POLICY IF EXISTS infusion_produccion_materiales_all_p ON public.infusion_produccion_materiales;
CREATE POLICY infusion_produccion_materiales_all_p ON public.infusion_produccion_materiales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.infusion_lotes_produccion lp
      WHERE lp.id = lote_produccion_id
        AND (lp.user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.infusion_lotes_produccion lp
      WHERE lp.id = lote_produccion_id
        AND (lp.user_id = auth.uid() OR public.is_admin() OR public.is_gerente())
    )
  );
