-- =============================================================================
-- Migration 1003: Alambique — Bitácora de destilación (Obrera y Zángano)
-- Cuaderno de bitácora digital del destilador: materia prima vegetal →
-- destilaciones → productos envasados. Módulo admin-only de Núcleo.
-- Entrelazado: QR público de trazabilidad (publico = true) y venta con stock
-- (productos_destilacion.producto_id → productos).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: plantas_destilacion
-- Materia prima vegetal registrada antes de entrar al alambique
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plantas_destilacion (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_comun      TEXT        NOT NULL,
  nombre_cientifico TEXT,
  parte_usada       TEXT        NOT NULL DEFAULT 'hojas'
                                  CHECK (parte_usada IN (
                                    'hojas', 'flores', 'corteza', 'raices',
                                    'semillas', 'frutos', 'ramas', 'otra'
                                  )),
  estado_material   TEXT        NOT NULL DEFAULT 'fresco'
                                  CHECK (estado_material IN (
                                    'fresco', 'seco', 'semicresco'
                                  )),
  cantidad_kg       NUMERIC(8,3) NOT NULL CHECK (cantidad_kg > 0),
  origen            TEXT,                        -- sector/paraje en texto libre
  lat               NUMERIC(10,6),               -- GPS opcional (origen)
  lng               NUMERIC(10,6),
  fecha_recoleccion DATE,
  observaciones     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS plantas_destilacion_nombre_idx  ON plantas_destilacion(nombre_comun);
CREATE INDEX IF NOT EXISTS plantas_destilacion_fecha_idx   ON plantas_destilacion(fecha_recoleccion);

-- -----------------------------------------------------------------------------
-- TABLA: destilaciones
-- Cada corrida del alambique: un lote de proceso con sus variables controladas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS destilaciones (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                   TEXT        UNIQUE,    -- DST-YYYY-#### (generado en BFF)
  planta_id                UUID        NOT NULL REFERENCES plantas_destilacion(id) ON DELETE RESTRICT,
  metodo                   TEXT        NOT NULL DEFAULT 'arrastre_vapor'
                                       CHECK (metodo IN ('hidrodestilacion', 'arrastre_vapor')),
  fecha_inicio             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_fin                TIMESTAMPTZ,
  carga_kg                 NUMERIC(8,3) NOT NULL CHECK (carga_kg > 0),
  agua_l                   NUMERIC(6,2) CHECK (agua_l > 0),
  duracion_min             INTEGER     CHECK (duracion_min > 0),
  temperatura_promedio     NUMERIC(4,1),          -- °C
  rendimiento_hidrolato_ml NUMERIC(8,1) CHECK (rendimiento_hidrolato_ml >= 0),
  rendimiento_aceite_ml    NUMERIC(8,1) CHECK (rendimiento_aceite_ml >= 0),
  analisis_organoleptico   JSONB,                 -- {color, olor, sabor, textura}
  observaciones            TEXT,
  estado                   TEXT        NOT NULL DEFAULT 'finalizada'
                                       CHECK (estado IN (
                                         'planificada', 'en_proceso', 'finalizada', 'descartada'
                                       )),
  publico                  BOOLEAN     NOT NULL DEFAULT false,  -- habilita QR público
  relato_publico           TEXT,                                -- historia para la página pública
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS destilaciones_planta_idx   ON destilaciones(planta_id);
CREATE INDEX IF NOT EXISTS destilaciones_fecha_idx    ON destilaciones(fecha_inicio);
CREATE INDEX IF NOT EXISTS destilaciones_estado_idx   ON destilaciones(estado);
CREATE INDEX IF NOT EXISTS destilaciones_publico_idx  ON destilaciones(publico)
  WHERE publico = true;

-- -----------------------------------------------------------------------------
-- TABLA: productos_destilacion
-- Envasado final: hidrolatos y aceites esenciales listos para venta o uso propio
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos_destilacion (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destilacion_id     UUID        NOT NULL REFERENCES destilaciones(id) ON DELETE CASCADE,
  tipo               TEXT        NOT NULL CHECK (tipo IN (
                               'hidrolato', 'aceite_esencial', 'otro'
                             )),
  volumen_ml         NUMERIC(8,1) NOT NULL CHECK (volumen_ml > 0),
  envase             TEXT,                        -- ej. "frasco vidrio ámbar 100ml"
  unidades           INTEGER     NOT NULL DEFAULT 1 CHECK (unidades > 0),
  fecha_envasado     DATE,
  destino            TEXT        NOT NULL DEFAULT 'venta'
                                   CHECK (destino IN (
                                     'venta', 'uso_propio', 'regalo', 'investigacion'
                                   )),
  producto_id        UUID        REFERENCES productos(id) ON DELETE SET NULL,  -- venta con stock
  precio_sugerido_clp INTEGER    CHECK (precio_sugerido_clp >= 0),
  observaciones      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prod_dest_destilacion_idx ON productos_destilacion(destilacion_id);
CREATE INDEX IF NOT EXISTS prod_dest_producto_idx    ON productos_destilacion(producto_id);
CREATE INDEX IF NOT EXISTS prod_dest_tipo_idx        ON productos_destilacion(tipo);

-- -----------------------------------------------------------------------------
-- TRIGGER: updated_at automático (reutiliza función compartida del proyecto)
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'plantas_destilacion_updated_at') THEN
    CREATE TRIGGER plantas_destilacion_updated_at
      BEFORE UPDATE ON plantas_destilacion
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'destilaciones_updated_at') THEN
    CREATE TRIGGER destilaciones_updated_at
      BEFORE UPDATE ON destilaciones
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'productos_destilacion_updated_at') THEN
    CREATE TRIGGER productos_destilacion_updated_at
      BEFORE UPDATE ON productos_destilacion
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RLS: módulo admin-only (nadie más lee ni escribe la bitácora)
-- -----------------------------------------------------------------------------
ALTER TABLE plantas_destilacion     ENABLE ROW LEVEL SECURITY;
ALTER TABLE destilaciones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_destilacion   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plantas_destilacion_admin_all" ON plantas_destilacion;
CREATE POLICY "plantas_destilacion_admin_all" ON plantas_destilacion
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "destilaciones_admin_all" ON destilaciones;
CREATE POLICY "destilaciones_admin_all" ON destilaciones
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "productos_destilacion_admin_all" ON productos_destilacion;
CREATE POLICY "productos_destilacion_admin_all" ON productos_destilacion
  FOR ALL USING (public.is_admin());
