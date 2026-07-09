# Arquitectura del Sistema de Costeo — OYZ

> Memoria y trazabilidad económica de cada frasco producido.
> Convalidado contra el schema existente (migrations 00–35, junio 2026).
> Axioma de diseño: registrar un lote en 3 toques o no se registra.

---

## 0. Diagnóstico del Estado Actual

### Lo que existe

| Tabla | Columnas relevantes | Observación |
|---|---|---|
| `productos` | `precio INT`, `ingredientes TEXT`, `peso_netos INT`, `stock INT` | No tiene `costo`, `margen`, ni `empresa_id`. `ingredientes` es texto libre, no estructurado. |
| `lotes` | `cosecha_ids UUID[]`, `kg_total DECIMAL`, `estado TEXT` | Es lote de cosecha (miel cruda), no lote de producción de SKU. Sin costos. |
| `ventas` | `total INT`, `channel TEXT`, `productos JSONB` | No tiene precio unitario ni costo unitario. Sin margen. |
| `proveedores` | `name TEXT`, `item TEXT`, `next_delivery TEXT` | Lista simple por usuario. Sin historial de precios. |
| `proveedores_config` | `empresa_id`, `rut`, `nombre`, `giro`, `moneda`, `con_iva` | Tabla contable formal, pero sin relación con ingredientes ni precios. |
| `terceros` | `empresa_id`, `rut`, `nombre`, `tipo` (cliente/proveedor/mixto) | Tabla contable unificada. `tipo='proveedor'` disponible. |
| `costos_colmena` | `colmena_id`, `horas_anuales`, `costo_hora`, `amortizacion_cajon`, `insumos_anuales`, `produccion_kg` | Costo operativo por colmena. No fluye hacia productos. Sin migración formal (creada fuera del sistema). |

### Lo que NO existe

- **Cero columnas de costo** en `productos`, `lotes`, o `ventas`
- **Cero margen** calculado o almacenado en ningún nivel
- **Cero relación** entre precio de insumo y margen de SKU
- **Cero trazabilidad** de producción por frasco (solo cosecha → lote de miel)
- **Cero historial** de precios de ingredientes
- **Cero receta/BOM** — `productos.ingredientes` es texto libre
- **Paquete `@enjambre/offline`** no existe (planificado, no implementado — campo usa Supabase directamente)
- **Cero funciones SQL** de costeo, margen, o alertas de precio

### Brecha exacta

La metodología de costeo de 7 capas (SKU, costo por frasco, gramaje por estado, competencia, piloto, compra adicional, registro) vive en conversaciones, no en la base de datos. El modelo de datos implícito existe pero no está persistido.

---

## 1. Principios Arquitectónicos

1. **3 toques o no existe.** Registrar un lote de producción debe tomar ≤3 interacciones significativas. Si toma más, no se usa.
2. **Cada capa es condición de la siguiente.** No construir Capa N sin que N-1 tenga datos reales.
3. **Relación viva, no archivo.** Un precio que cambia en `price_observations` recalcula automáticamente los márgenes de todos los SKUs afectados.
4. **Inflación conceptual cero.** No registrar lo que no se va a consultar. Cada tabla justifica su existencia con una decisión operativa que habilita.
5. **Multi-tenant desde el inicio.** Todas las tablas nuevas llevan `empresa_id` con `has_empresa_access()`.
6. **Numeración CLP.** Costos y precios en `INT` (pesos chilenos enteros) para consistencia con `productos.precio` y `ventas.total`. Gramajes y merma en `NUMERIC` para precisión.
7. **No duplicar `productos`.** Las tablas nuevas se relacionan con `productos` existente, no lo reemplazan.

---

## 2. Capa 1 — Fórmulas y Costeo

> Sin esto, nada funciona.

### 2.1 Tabla: `ingredients`

Insumos con precio de referencia vivo. Un ingrediente es cualquier materia prima que entra en un frasco.

```sql
CREATE TABLE ingredients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  unidad      TEXT NOT NULL CHECK (unidad IN ('g', 'kg', 'ml', 'l', 'unidad')),
  estado_default TEXT NOT NULL CHECK (estado_default IN ('crudo', 'procesado', 'tostado', 'molido', 'fresco', 'seco', 'desecado')),
  categoria   TEXT,
  precio_ref  INT,            -- CLP por unidad (g, ml, unidad). NULL si nunca se ha comprado.
  proveedor_ref UUID,         -- FK al tercero/proveedor de referencia
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ,
  UNIQUE(empresa_id, nombre)  -- Un ingrediente por empresa
);
```

**Decisiones:**
- `precio_ref` es `INT` (CLP) — consistencia con el resto del sistema.
- `estado_default` es el estado "base" del ingrediente para calcular conversiones de gramaje. La avellana cruda pesa distinto que la tostada.
- `proveedor_ref` apunta al proveedor habitual (puede ser NULL si se compra en varios lados).
- `unidad` restringida a las unidades que OYZ realmente usa. Se puede ampliar con ALTER.

### 2.2 Tabla: `price_observations`

Historial de precios por ingrediente. Cada observación es un punto en el tiempo.

```sql
CREATE TABLE price_observations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  proveedor_id  UUID REFERENCES terceros(id) ON DELETE SET NULL,
  precio        INT NOT NULL CHECK (precio > 0),   -- CLP por unidad del ingrediente
  unidad_reportada TEXT,      -- Si el proveedor cotiza en unidad distinta (ej: kg cuando el ingrediente es en g)
  fecha         DATE NOT NULL DEFAULT current_date,
  fuente        TEXT NOT NULL DEFAULT 'manual' CHECK (fuente IN ('manual', 'factura', 'cotizacion', 'feria', 'online')),
  notas         TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_obs_ingredient ON price_observations(ingredient_id, fecha DESC);
CREATE INDEX idx_price_obs_empresa ON price_observations(empresa_id);
```

**Relación viva:** Cuando se inserta un `price_observations` y es el más reciente para ese ingrediente, un trigger actualiza `ingredients.precio_ref` automáticamente.

### 2.3 Tabla: `recipes`

Una receta es la fórmula de un SKU. Vincula un `producto` con sus ingredientes y gramajes.

```sql
CREATE TABLE recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producto_id   UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  version       INT NOT NULL DEFAULT 1,    -- Versionado: si cambias la fórmula, creas versión nueva
  rendimiento_frascos INT NOT NULL CHECK (rendimiento_frascos > 0),  -- Cuántos frascos produce esta receta
  formato_frasco TEXT NOT NULL,             -- '250g', '500g', '1kg' (coincide con productos.formato)
  merma_pct     NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (merma_pct >= 0 AND merma_pct <= 100),
  costo_empaque INT NOT NULL DEFAULT 0,    -- CLP: frasco + etiqueta + tapa
  activa        BOOLEAN NOT NULL DEFAULT true,
  notas         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ,
  UNIQUE(empresa_id, producto_id, version)  -- Una versión activa por producto
);
```

**Decisiones:**
- `version` permite iterar la fórmula sin perder historia. Si la avellana sube y cambias la proporción, es versión 2.
- `rendimiento_frascos` es el denominador para el costo por frasco. Si la receta rinde 165 frascos de 500g, el costo total / 165 = costo por frasco.
- `merma_pct` es la merma teórica (evaporación, desperdicio). Se valida contra merma real en Capa 2.
- `costo_empaque` separa el costo del envase del costo de ingredientes. Es un INT porque en CLP no hay decimales.

### 2.4 Tabla: `recipe_lines`

Las líneas de la fórmula. Cada ingrediente con su gramaje y estado.

```sql
CREATE TABLE recipe_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  cantidad      NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),   -- Gramos (o la unidad del ingrediente)
  estado        TEXT NOT NULL CHECK (estado IN ('crudo', 'procesado', 'tostado', 'molido', 'fresco', 'seco', 'desecado')),
  factor_conversion NUMERIC(8,4) NOT NULL DEFAULT 1.0,  -- Ej: 1g crudo = 0.85g tostado
  orden         INT NOT NULL DEFAULT 0,    -- Orden de adición (para lectura)
  UNIQUE(recipe_id, ingredient_id)         -- Un ingrediente por línea de receta
);
```

**Decisiones:**
- `factor_conversion` captura la pérdida/ganancia por cambio de estado. La avellana cruda → tostada tiene factor ~0.85 (pierde 15% peso). Si necesito 100g de avellana tostada en el frasco, debo partir con 100/0.85 = 117.6g crudos.
- `estado` es el estado en el que se mide la `cantidad`. Si `estado='tostado'` y `cantidad=100`, son 100g de avellana tostada en el frasco.
- `cantidad` en `NUMERIC` porque los gramajes son precisos (100.5g).

### 2.5 Función SQL: `calcular_costo_receta(p_recipe_id UUID)`

Motor de costeo. Retorna JSONB con el desglose completo.

```sql
CREATE OR REPLACE FUNCTION calcular_costo_receta(p_recipe_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_receta RECORD;
  v_linea RECORD;
  v_precio_ingrediente INT;
  v_costo_linea INT;
  v_costo_ingredientes_total INT := 0;
  v_costo_merma INT := 0;
  v_costo_frasco INT := 0;
  v_margen_pct NUMERIC;
  v_precio_venta INT;
  v_detalle JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_receta FROM recipes WHERE id = p_recipe_id AND activa = true;
  IF NOT FOUND THEN RETURN '{"error": "receta no encontrada"}'::JSONB; END IF;

  SELECT precio INTO v_precio_venta FROM productos WHERE id = v_receta.producto_id;

  FOR v_linea IN
    SELECT rl.*, i.nombre, i.precio_ref, i.unidad
    FROM recipe_lines rl
    JOIN ingredients i ON i.id = rl.ingredient_id
    WHERE rl.recipe_id = p_recipe_id
    ORDER BY rl.orden
  LOOP
    v_precio_ingrediente := COALESCE(v_linea.precio_ref, 0);
    -- Costo = (cantidad / factor_conversion) × precio_por_unidad
    -- cantidad está en la unidad del ingrediente, precio_ref en CLP por unidad
    v_costo_linea := CEIL((v_linea.cantidad / v_linea.factor_conversion)::NUMERIC * v_precio_ingrediente);
    v_costo_ingredientes_total := v_costo_ingredientes_total + v_costo_linea;

    v_detalle := v_detalle || jsonb_build_object(
      'ingredient_id', v_linea.ingredient_id,
      'nombre', v_linea.nombre,
      'cantidad_receta', v_linea.cantidad,
      'estado', v_linea.estado,
      'factor_conversion', v_linea.factor_conversion,
      'cantidad_cruda', ROUND((v_linea.cantidad / v_linea.factor_conversion)::NUMERIC, 2),
      'precio_ref', v_precio_ingrediente,
      'costo_linea', v_costo_linea
    );
  END LOOP;

  -- Merma: el costo total × merma_pct
  v_costo_merma := CEIL((v_costo_ingredientes_total * v_receta.merma_pct / 100)::NUMERIC);

  -- Costo por frasco = (ingredientes + merma + empaque) / rendimiento
  v_costo_frasco := CEIL(
    (v_costo_ingredientes_total + v_costo_merma + v_receta.costo_empaque)::NUMERIC
    / v_receta.rendimiento_frascos
  );

  -- Margen
  v_margen_pct := CASE
    WHEN v_precio_venta > 0 AND v_costo_frasco > 0
    THEN ROUND(((v_precio_venta - v_costo_frasco)::NUMERIC / v_precio_venta) * 100, 1)
    ELSE NULL
  END;

  RETURN jsonb_build_object(
    'recipe_id', p_recipe_id,
    'producto_id', v_receta.producto_id,
    'version', v_receta.version,
    'costo_ingredientes', v_costo_ingredientes_total,
    'costo_merma', v_costo_merma,
    'merma_pct', v_receta.merma_pct,
    'costo_empaque', v_receta.costo_empaque,
    'costo_total_receta', v_costo_ingredientes_total + v_costo_merma + v_receta.costo_empaque,
    'rendimiento_frascos', v_receta.rendimiento_frascos,
    'costo_por_frasco', v_costo_frasco,
    'precio_venta', v_precio_venta,
    'margen_por_frasco', v_precio_venta - v_costo_frasco,
    'margen_pct', v_margen_pct,
    'detalle', v_detalle
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 2.6 Vista: `recipe_costing_view`

Vista materializable que calcula el costo de todas las recetas activas.

```sql
CREATE VIEW recipe_costing_view AS
SELECT
  r.id AS recipe_id,
  r.producto_id,
  p.nombre AS producto_nombre,
  p.precio AS precio_venta,
  p.formato,
  r.version,
  r.rendimiento_frascos,
  r.merma_pct,
  r.costo_empaque,
  (calcular_costo_receta(r.id))->>'costo_por_frasco' AS costo_frasco,
  (calcular_costo_receta(r.id))->>'margen_pct' AS margen_pct,
  (calcular_costo_receta(r.id))->>'margen_por_frasco' AS margen_frasco,
  (calcular_costo_receta(r.id))->>'costo_total_receta' AS costo_total,
  r.activa,
  r.updated_at
FROM recipes r
JOIN productos p ON p.id = r.producto_id
WHERE r.activa = true;
```

### 2.7 Trigger: actualizar `precio_ref` al insertar observación de precio

```sql
CREATE OR REPLACE FUNCTION update_ingredient_precio_ref()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ingredients
  SET precio_ref = NEW.precio,
      updated_at = now()
  WHERE id = NEW.ingredient_id
    AND (precio_ref IS NULL OR updated_at IS NULL OR NEW.fecha >= (SELECT MAX(fecha) FROM price_observations WHERE ingredient_id = NEW.ingredient_id AND fecha <= NEW.fecha));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_precio_ref
  AFTER INSERT ON price_observations
  FOR EACH ROW EXECUTE FUNCTION update_ingredient_precio_ref();
```

### 2.8 RLS — Capa 1

```sql
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_lines ENABLE ROW LEVEL SECURITY;

-- Ingredients: admin por empresa (is_admin() mapea a role = 'admin' post-consolidacion)
CREATE POLICY ingredients_select ON ingredients FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY ingredients_insert ON ingredients FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_admin());
CREATE POLICY ingredients_update ON ingredients FOR UPDATE USING (has_empresa_access(empresa_id) AND is_admin());
CREATE POLICY ingredients_delete ON ingredients FOR DELETE USING (has_empresa_access(empresa_id) AND is_admin());

-- Price observations: admin por empresa
CREATE POLICY price_obs_select ON price_observations FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY price_obs_insert ON price_observations FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_admin());
CREATE POLICY price_obs_update ON price_observations FOR UPDATE USING (has_empresa_access(empresa_id) AND is_admin());
CREATE POLICY price_obs_delete ON price_observations FOR DELETE USING (has_empresa_access(empresa_id) AND is_admin());

-- Recipes: admin por empresa
CREATE POLICY recipes_select ON recipes FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY recipes_insert ON recipes FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_admin());
CREATE POLICY recipes_update ON recipes FOR UPDATE USING (has_empresa_access(empresa_id) AND is_admin());
CREATE POLICY recipes_delete ON recipes FOR DELETE USING (has_empresa_access(empresa_id) AND is_admin());

-- Recipe lines: hereda de recipes
CREATE POLICY recipe_lines_select ON recipe_lines FOR SELECT USING (
  EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND has_empresa_access(r.empresa_id))
);
CREATE POLICY recipe_lines_insert ON recipe_lines FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND has_empresa_access(r.empresa_id) AND is_admin())
);
CREATE POLICY recipe_lines_update ON recipe_lines FOR UPDATE USING (
  EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND has_empresa_access(r.empresa_id) AND is_admin())
);
CREATE POLICY recipe_lines_delete ON recipe_lines FOR DELETE USING (
  EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND has_empresa_access(r.empresa_id) AND is_admin())
);
```

---

## 3. Capa 2 — Registro de Lotes de Producción

> Sin esto no hay trazabilidad. La diferencia entre costo real y costo teórico es la señal más valiosa del sistema.

### 3.1 Tabla: `production_batches`

Cada producción es un evento con fecha, fórmula, resultado y costo real vs teórico.

```sql
CREATE TABLE production_batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id        UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  recipe_id         UUID NOT NULL REFERENCES recipes(id),
  fecha             DATE NOT NULL DEFAULT current_date,
  frascos_producidos INT NOT NULL CHECK (frascos_producidos > 0),
  frascos_defectuosos INT NOT NULL DEFAULT 0,
  merma_real_pct    NUMERIC(5,2),           -- Merma real medida (vs teórica de la receta)
  costo_real_total  INT,                     -- CLP: costo real de esta producción (calculado o manual)
  costo_real_frasco INT GENERATED ALWAYS AS (CASE WHEN frascos_producidos > 0 THEN costo_real_total / frascos_producidos ELSE 0 END) STORED,
  notas             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prod_batch_recipe ON production_batches(recipe_id);
CREATE INDEX idx_prod_batch_empresa ON production_batches(empresa_id);
CREATE INDEX idx_prod_batch_fecha ON production_batches(empresa_id, fecha DESC);
```

### 3.2 Tabla: `batch_ingredient_usages`

Los ingredientes realmente usados en este lote (puede diferir de la receta teórica).

```sql
CREATE TABLE batch_ingredient_usages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
  ingredient_id     UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  cantidad_real     NUMERIC(10,2) NOT NULL CHECK (cantidad_real > 0),  -- Lo que realmente se pesó
  precio_pagado     INT,              -- CLP: precio efectivo pagado en esta compra
  costo_linea       INT GENERATED ALWAYS AS (CEIL((cantidad_real * COALESCE(precio_pagado, 0))::NUMERIC)) STORED,
  UNIQUE(batch_id, ingredient_id)
);
```

### 3.3 Función: `calcular_costo_real_lote(p_batch_id UUID)`

Calcula el costo real vs teórico de un lote.

```sql
CREATE OR REPLACE FUNCTION calcular_costo_real_lote(p_batch_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_batch RECORD;
  v_recipe_cost JSONB;
  v_costo_real INT := 0;
  v_costo_teorico INT := 0;
  v_desviacion_pct NUMERIC;
BEGIN
  SELECT * INTO v_batch FROM production_batches WHERE id = p_batch_id;
  IF NOT FOUND THEN RETURN '{"error": "lote no encontrado"}'::JSONB; END IF;

  -- Costo real: sumar usos de ingredientes + empaque
  SELECT COALESCE(SUM(costo_linea), 0) INTO v_costo_real
  FROM batch_ingredient_usages WHERE batch_id = p_batch_id;

  -- Agregar costo de empaque (de la receta)
  SELECT CEIL(costo_empaque * frascos_producidos / rendimiento_frascos) INTO v_costo_real
  FROM recipes WHERE id = v_batch.recipe_id;

  -- Actualizar costo_real_total
  UPDATE production_batches SET costo_real_total = v_costo_real WHERE id = p_batch_id;

  -- Costo teórico (de la receta × frascos producidos / rendimiento)
  v_recipe_cost := calcular_costo_receta(v_batch.recipe_id);
  v_costo_teorico := CEIL(((v_recipe_cost->>'costo_total_receta')::INT * v_batch.frascos_producidos)::NUMERIC
    / (v_recipe_cost->>'rendimiento_frascos')::INT);

  v_desviacion_pct := CASE
    WHEN v_costo_teorico > 0 THEN ROUND(((v_costo_real - v_costo_teorico)::NUMERIC / v_costo_teorico) * 100, 1)
    ELSE NULL
  END;

  RETURN jsonb_build_object(
    'batch_id', p_batch_id,
    'recipe_id', v_batch.recipe_id,
    'frascos_producidos', v_batch.frascos_producidos,
    'frascos_defectuosos', v_batch.frascos_defectuosos,
    'costo_real_total', v_costo_real,
    'costo_real_frasco', CASE WHEN v_batch.frascos_producidos > 0 THEN v_costo_real / v_batch.frascos_producidos ELSE 0 END,
    'costo_teorico_total', v_costo_teorico,
    'costo_teorico_frasco', CASE WHEN v_batch.frascos_producidos > 0 THEN v_costo_teorico / v_batch.frascos_producidos ELSE 0 END,
    'desviacion_pct', v_desviacion_pct,
    'merma_real_pct', v_batch.merma_real_pct
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.4 RLS — Capa 2

```sql
ALTER TABLE production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_ingredient_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY prod_batch_select ON production_batches FOR SELECT USING (has_empresa_access(empresa_id));
CREATE POLICY prod_batch_insert ON production_batches FOR INSERT WITH CHECK (has_empresa_access(empresa_id) AND is_admin());
CREATE POLICY prod_batch_update ON production_batches FOR UPDATE USING (has_empresa_access(empresa_id) AND is_admin());
CREATE POLICY prod_batch_delete ON production_batches FOR DELETE USING (has_empresa_access(empresa_id) AND is_admin());

CREATE POLICY batch_usage_select ON batch_ingredient_usages FOR SELECT USING (
  EXISTS (SELECT 1 FROM production_batches pb WHERE pb.id = batch_id AND has_empresa_access(pb.empresa_id))
);
CREATE POLICY batch_usage_insert ON batch_ingredient_usages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM production_batches pb WHERE pb.id = batch_id AND has_empresa_access(pb.empresa_id) AND is_admin())
);
CREATE POLICY batch_usage_update ON batch_ingredient_usages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM production_batches pb WHERE pb.id = batch_id AND has_empresa_access(pb.empresa_id) AND is_admin())
);
CREATE POLICY batch_usage_delete ON batch_ingredient_usages FOR DELETE USING (
  EXISTS (SELECT 1 FROM production_batches pb WHERE pb.id = batch_id AND has_empresa_access(pb.empresa_id) AND is_admin())
);
```

---

## 4. Capa 3 — Ventas y Canal

> Sin esto el margen es teórico. La rentabilidad real por canal (feria vs tienda vs online) sólo aparece aquí.

### 4.1 Extensión de `ventas` (ya existente)

La tabla `ventas` ya tiene `channel`, `total`, `productos JSONB`. Lo que falta:

```sql
-- Agregar costo unitario estimado al momento de la venta
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS costo_unitario_estimado INT;
-- Margen por venta = total - (costo_unitario × cantidad)
-- Se calcula vía BFF, no es columna generada (porque 'productos' es JSONB)

-- Agregar lote de producción (trazabilidad frasco → lote)
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS production_batch_id UUID REFERENCES production_batches(id);
```

**Nota:** `ventas.productos` es JSONB. El BFF debe calcular el costo al momento de la venta consultando `recipe_costing_view` y escribirlo en `costo_unitario_estimado`. Así el margen queda congelado al momento de la transacción, independiente de futuros cambios de precio.

### 4.2 Vista: `margin_by_channel_view`

Margen real por canal, congelado al momento de venta.

```sql
CREATE VIEW margin_by_channel_view AS
SELECT
  v.empresa_id,
  v.channel,
  DATE_TRUNC('month', v.created_at) AS mes,
  COUNT(*) AS num_ventas,
  SUM(v.total) AS revenue_total,
  SUM(v.costo_unitario_estimado * COALESCE((v.productos::jsonb->>'cantidad')::INT, 1)) AS costo_total,
  SUM(v.total) - SUM(v.costo_unitario_estimado * COALESCE((v.productos::jsonb->>'cantidad')::INT, 1)) AS margen_total,
  CASE WHEN SUM(v.total) > 0
    THEN ROUND(((SUM(v.total) - SUM(v.costo_unitario_estimado * COALESCE((v.productos::jsonb->>'cantidad')::INT, 1)))::NUMERIC / SUM(v.total)) * 100, 1)
    ELSE NULL
  END AS margen_pct
FROM ventas v
WHERE v.costo_unitario_estimado IS NOT NULL
  AND v.channel IS NOT NULL
GROUP BY v.empresa_id, v.channel, DATE_TRUNC('month', v.created_at);
```

### 4.3 No se crean tablas nuevas para ventas

La tabla `ventas` ya existe y es robusta (comisiones, channel, cash_session). Solo se agregan 2 columnas. El BFF de ventas existente (`rep-ventas.ts`) debe enriquecerse para calcular el costo al momento de la inserción.

---

## 5. Capa 4 — Proveedores y Mercado

> Sin esto no hay estrategia de compras. Historial de precios, variación temporal, alertas.

### 5.1 Extensión de `terceros` (ya existente)

La tabla `terceros` ya maneja proveedores con `tipo='proveedor'`, RUT, nombre, email, teléfono. No se duplica.

### 5.2 Vista: `supplier_price_history_view`

```sql
CREATE VIEW supplier_price_history_view AS
SELECT
  po.empresa_id,
  po.ingredient_id,
  i.nombre AS ingrediente,
  po.proveedor_id,
  t.nombre AS proveedor_nombre,
  po.precio,
  po.fecha,
  po.fuente,
  -- Variación vs precio anterior del mismo proveedor
  LAG(po.precio) OVER (PARTITION BY po.ingredient_id, po.proveedor_id ORDER BY po.fecha) AS precio_anterior,
  CASE
    WHEN LAG(po.precio) OVER (PARTITION BY po.ingredient_id, po.proveedor_id ORDER BY po.fecha) > 0
    THEN ROUND(((po.precio - LAG(po.precio) OVER (PARTITION BY po.ingredient_id, po.proveedor_id ORDER BY po.fecha))::NUMERIC
      / LAG(po.precio) OVER (PARTITION BY po.ingredient_id, po.proveedor_id ORDER BY po.fecha)) * 100, 1)
    ELSE NULL
  END AS variacion_pct
FROM price_observations po
JOIN ingredients i ON i.id = po.ingredient_id
LEFT JOIN terceros t ON t.id = po.proveedor_id
ORDER BY po.ingredient_id, po.fecha DESC;
```

### 5.3 Función: `alerta_precio_desviado(p_ingredient_id UUID, p_empresa_id UUID)`

Detecta cuando un nuevo precio se desvía más de un umbral del promedio histórico.

```sql
CREATE OR REPLACE FUNCTION alerta_precio_desviado(p_ingredient_id UUID, p_empresa_id UUID)
RETURNS TABLE(ingredient_id UUID, nombre TEXT, precio_nuevo INT, promedio_historico NUMERIC, desviacion_pct NUMERIC) AS $$
DECLARE
  v_umbral NUMERIC := 15.0;  -- 15% de desviación para alertar
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.nombre,
    po_latest.precio AS precio_nuevo,
    po_avg.promedio AS promedio_historico,
    ROUND(((po_latest.precio - po_avg.promedio) / po_avg.promedio * 100)::NUMERIC, 1) AS desviacion_pct
  FROM ingredients i
  CROSS JOIN LATERAL (
    SELECT precio FROM price_observations
    WHERE ingredient_id = p_ingredient_id AND empresa_id = p_empresa_id
    ORDER BY fecha DESC LIMIT 1
  ) po_latest
  CROSS JOIN LATERAL (
    SELECT AVG(precio) AS promedio FROM price_observations
    WHERE ingredient_id = p_ingredient_id AND empresa_id = p_empresa_id
      AND fecha >= current_date - INTERVAL '90 days'
  ) po_avg
  WHERE i.id = p_ingredient_id
    AND i.empresa_id = p_empresa_id
    AND po_avg.promedio > 0
    AND ABS((po_latest.precio - po_avg.promedio) / po_avg.promedio * 100) > v_umbral;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 5.4 No se crean tablas nuevas para proveedores

`terceros` + `proveedores_config` + `price_observations` cubren todo. Lo que falta es la UI para consultar el historial y las alertas, no más tablas.

---

## 6. Capa 5 — Tablero de Inteligencia

> El resultado de las cuatro anteriores. Margen real, rotación por canal, alertas automáticas.

### 6.1 Vista: `sku_profitability_view`

Rentabilidad por SKU, alimentada por Capa 1 + Capa 2 + Capa 3.

```sql
CREATE VIEW sku_profitability_view AS
SELECT
  p.id AS producto_id,
  p.nombre,
  p.precio AS precio_venta,
  p.formato,
  p.categoria,
  rcv.costo_frasco,
  rcv.margen_pct AS margen_teorico_pct,
  rcv.margen_frasco AS margen_teorico_frasco,
  -- Margen real promedio (de lotes producidos)
  COALESCE(pb_stats.avg_costo_real_frasco, 0) AS costo_real_frasco_promedio,
  COALESCE(pb_stats.avg_merma_real, 0) AS merma_real_promedio,
  COALESCE(pb_stats.num_lotes, 0) AS lotes_producidos,
  -- Ventas del último mes
  COALESCE(vs.ventas_mes, 0) AS ventas_ultimo_mes,
  COALESCE(vs.revenue_mes, 0) AS revenue_ultimo_mes
FROM productos p
LEFT JOIN recipe_costing_view rcv ON rcv.producto_id = p.id
LEFT JOIN LATERAL (
  SELECT
    AVG(costo_real_frasco) AS avg_costo_real_frasco,
    AVG(merma_real_pct) AS avg_merma_real,
    COUNT(*) AS num_lotes
  FROM production_batches pb
  JOIN recipes r ON r.id = pb.recipe_id
  WHERE r.producto_id = p.id
) pb_stats ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS ventas_mes, SUM(v.total) AS revenue_mes
  FROM ventas v
  WHERE v.created_at >= current_date - INTERVAL '30 days'
    AND v.empresa_id IS NOT NULL
) vs ON true;
```

### 6.2 Función: `sku_alertas(p_empresa_id UUID)`

Alertas automáticas que el sistema señala sin que se pregunten.

```sql
CREATE OR REPLACE FUNCTION sku_alertas(p_empresa_id UUID)
RETURNS TABLE(
  tipo TEXT,
  severidad TEXT,
  producto_nombre TEXT,
  detalle TEXT
) AS $$
BEGIN
  -- 1. SKU con margen por debajo del umbral
  RETURN QUERY
  SELECT
    'margen_bajo'::TEXT,
    CASE WHEN rcv.margen_pct::NUMERIC < 20 THEN 'critico' ELSE 'atencion' END,
    p.nombre,
    'Margen ' || rcv.margen_pct || '% (umbral: 30%)'
  FROM productos p
  JOIN recipe_costing_view rcv ON rcv.producto_id = p.id
  WHERE rcv.margen_pct::NUMERIC < 30;

  -- 2. Ingrediente con precio subido > 15% en últimos 30 días
  RETURN QUERY
  SELECT
    'precio_subido'::TEXT,
    'atencion'::TEXT,
    i.nombre,
    'Precio subió ' || sphv.variacion_pct || '% vs anterior'
  FROM ingredients i
  JOIN supplier_price_history_view sphv ON sphv.ingredient_id = i.id
  WHERE i.empresa_id = p_empresa_id
    AND sphv.variacion_pct > 15
    AND sphv.fecha >= current_date - INTERVAL '30 days';

  -- 3. Lote con desviación de costo > 10% vs teórico
  RETURN QUERY
  SELECT
    'desviacion_lote'::TEXT,
    'atencion'::TEXT,
    p.nombre,
    'Lote ' || pb.id::TEXT || ': desviación ' || calcular_costo_real_lote(pb.id)->>'desviacion_pct' || '%'
  FROM production_batches pb
  JOIN recipes r ON r.id = pb.recipe_id
  JOIN productos p ON p.id = r.producto_id
  WHERE pb.empresa_id = p_empresa_id
    AND pb.created_at >= current_date - INTERVAL '30 days'
    AND (calcular_costo_real_lote(pb.id)->>'desviacion_pct')::NUMERIC > 10;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

### 6.3 No hay tablas nuevas en Capa 5

Es puramente vistas + funciones. Los datos vienen de las capas anteriores.

---

## 7. Integración en Sidebar de Nucleo

### 7.1 Ubicación propuesta

Las herramientas de costeo se agregan en el grupo **"EL ENJAMBRE"**, después de `productos`:

```typescript
// En sidebar-config.ts, dentro del grupo 'enjambre':
{
  key: 'costeo',
  label: 'Costeo',
  icon: 'flask-conical',
  href: '/costeo',
  greeting: 'Alquimista del número',
  mission: 'Cada frasco sin costo es miel que se pierde',
},
{
  key: 'produccion',
  label: 'Producción',
  icon: 'factory',
  href: '/produccion',
  greeting: 'Maestro del panal',
  mission: 'Cada lote es una verdad del proceso',
},
```

### 7.2 Rutas en Nucleo

| Ruta | Componente | Función | Capa |
|---|---|---|---|
| `/costeo` | `CosteoPanel` | Dashboard de márgenes + alertas | 5 |
| `/costeo/ingredientes` | `IngredientesList` | CRUD ingredientes + precios | 1 |
| `/costeo/recetas` | `RecetasList` | CRUD recetas + líneas + costeo automático | 1 |
| `/costeo/precios` | `PreciosHistorial` | Historial de precios + variación + alertas | 4 |
| `/produccion` | `ProduccionPanel` | Registro rápido de lotes (3 toques) | 2 |
| `/produccion/historial` | `ProduccionHistorial` | Historial de lotes + real vs teórico | 2 |

### 7.3 Extensión del BFF

| Ruta | Método | Función |
|---|---|---|
| `/api/costeo/ingredientes` | GET/POST | CRUD ingredientes |
| `/api/costeo/ingredientes/[id]` | GET/PATCH/DELETE | Operaciones sobre ingrediente |
| `/api/costeo/precios` | POST | Registrar observación de precio |
| `/api/costeo/recetas` | GET/POST | CRUD recetas |
| `/api/costeo/recetas/[id]` | GET/PATCH/DELETE | Operaciones sobre receta |
| `/api/costeo/recetas/[id]/costo` | GET | `calcular_costo_receta()` |
| `/api/costeo/recetas/[id]/lineas` | POST/PATCH/DELETE | CRUD líneas de receta |
| `/api/produccion` | GET/POST | Listar/crear lotes de producción |
| `/api/produccion/[id]` | GET | Detalle + `calcular_costo_real_lote()` |
| `/api/produccion/[id]/ingredientes` | POST/PATCH | Ingredientes usados en lote |
| `/api/costeo/alertas` | GET | `sku_alertas()` |
| `/api/costeo/margenes` | GET | `recipe_costing_view` completo |
| `/api/costeo/canales` | GET | `margin_by_channel_view` |

---

## 8. Axioma 3 Toques — Diseño de Interfaz

### 8.1 Registro de lote de producción (el flujo más crítico)

Patrón: step-machine (clon de `QuickSaleButton` en Campo).

```
Toque 1: Seleccionar receta (producto) → auto-carga ingredientes de la fórmula
Toque 2: Confirmar frascos producidos (+/- stepper, default = rendimiento receta)
Toque 3: Confirmar → guardar lote
```

Si el usuario quiere ingresar datos más detallados (peso real de cada ingrediente, merma medida), puede expandir una sección "Detalle" DESPUÉS de confirmar. El lote queda registrado con los valores teóricos, y se pueden editar después.

### 8.2 Registro de precio de ingrediente

```
Toque 1: Seleccionar ingrediente (búsqueda con debounce, 2+ chars)
Toque 2: Ingresar precio (teclado numérico) + seleccionar fuente (5 iconos: manual/factura/cotización/feria/online)
Toque 3: Confirmar → guardar observación → trigger actualiza precio_ref
```

### 8.3 Creación de receta

Este es el flujo que más toques requiere y no se puede comprimir tanto. Diseño:

- **Paso 1:** Seleccionar producto existente + formato + rendimiento + merma + costo empaque
- **Paso 2:** Agregar ingredientes (búsqueda, cantidad, estado, factor conversión)
- **Paso 3:** Guardar → ver costo calculado automáticamente

Se optimiza con:
- Pre-fill: estado default del ingrediente, factor conversión = 1.0
- Auto-save: guardar receta como borrador al agregar primera línea
- Inline edit: no navegar a otra página para editar líneas

---

## 9. Secuencia de Implementación

Cada paso es verificable de forma independiente.

### Fase 1: Motor de costeo (1-2 días)
1. Migración: `ingredients`, `price_observations`, `recipes`, `recipe_lines` + RLS
2. Función: `calcular_costo_receta()` + trigger `update_ingredient_precio_ref()`
3. Vista: `recipe_costing_view`
4. Regenerar tipos: `cd packages/database && pnpm db:typegen`
5. BFF: rutas CRUD ingredientes + recetas + costeo
6. UI: `IngredientesList` + `RecetasList` en nucleo
7. Sidebar: agregar `costeo`
8. Verificar: `pnpm --filter @enjambre/nucleo build`

### Fase 2: Registro de lotes (1 día)
1. Migración: `production_batches`, `batch_ingredient_usages` + RLS
2. Función: `calcular_costo_real_lote()`
3. BFF: rutas CRUD producción
4. UI: `ProduccionPanel` con 3-toques step-machine
5. Sidebar: agregar `produccion`
6. Verificar: `pnpm --filter @enjambre/nucleo build`

### Fase 3: Margen por canal (medio día)
1. Migración: agregar `costo_unitario_estimado` + `production_batch_id` a `ventas`
2. Vista: `margin_by_channel_view`
3. BFF: enriquecer `rep-ventas.ts` para calcular costo al insertar venta
4. UI: sección de márgenes en dashboard de costeo
5. Verificar: `pnpm --filter @enjambre/nucleo build`

### Fase 4: Proveedores y alertas (1 día)
1. Vista: `supplier_price_history_view`
2. Función: `alerta_precio_desviado()`
3. BFF: rutas historial + alertas
4. UI: `PreciosHistorial` en nucleo
5. Verificar: `pnpm --filter @enjambre/nucleo build`

### Fase 5: Tablero de inteligencia (1 día)
1. Vista: `sku_profitability_view`
2. Función: `sku_alertas()`
3. BFF: rutas alertas + márgenes
4. UI: `CosteoPanel` (dashboard con cards de margen, alertas, tendencias)
5. Verificar: `pnpm --filter @enjambre/nucleo build`

### Fase 6 (futura): Offline en Campo
1. Crear `@enjambre/offline` con Dexie (tablas: ingredientes, recetas, lotes pendientes) — actualmente planificado, no implementado
2. Sync queue que drena al nucleo BFF cuando hay conexion
3. UI en campo: registro de lote con manos de miel (3 toques, sin teclado)

---

## 10. Mapa de Relaciones — Post-Implementación

```
empresas
└── ingredients (empresa_id)
    ├── price_observations (ingredient_id) → terceros (proveedor_id)
    └── recipe_lines (ingredient_id)
        └── recipes (recipe_id)
            ├── productos (producto_id) ← YA EXISTE
            ├── recipe_costing_view (recipe_id) ← VISTA
            └── production_batches (recipe_id)
                ├── batch_ingredient_usages (batch_id) → ingredients
                └── ventas (production_batch_id) ← EXTENSIÓN
                    └── margin_by_channel_view ← VISTA

sku_profitability_view ← VISTA (productos + recipe_costing + production_batches + ventas)
sku_alertas() ← FUNCIÓN (recorre todas las capas)
```

---

## 11. Resumen de Tablas Nuevas vs Existentes

| Tabla | Acción | Capa |
|---|---|---|
| `ingredients` | **NUEVA** | 1 |
| `price_observations` | **NUEVA** | 1 |
| `recipes` | **NUEVA** | 1 |
| `recipe_lines` | **NUEVA** | 1 |
| `production_batches` | **NUEVA** | 2 |
| `batch_ingredient_usages` | **NUEVA** | 2 |
| `ventas` | **EXTENDER** (+2 columnas) | 3 |
| `productos` | Sin cambios | — |
| `terceros` | Sin cambios (se usa como proveedores) | 4 |
| `proveedores_config` | Sin cambios | 4 |

**6 tablas nuevas + 2 columnas en tabla existente.**

---

*Este documento es el plano de la herramienta de vanguardia. Cada capa se construye cuando la anterior tiene datos reales.*
*Convalidado contra: migrations 00–35, database.types.ts (5952 líneas), sidebar-config.ts, ProductForm.tsx, QuickSaleButton.tsx.*
*Última actualización: Junio 2026.*
