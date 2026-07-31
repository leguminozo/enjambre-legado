-- =============================================================================
-- Migration 100: Registro Territorial Apícola
-- Red Apícola Territorial de Chiloé — Módulo Núcleo
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: actores_registro
-- Todos los actores del ecosistema apícola territorial (residentes, trashumantes,
-- propietarios facilitadores, agricultores, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actores_registro (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  rol          TEXT        NOT NULL CHECK (rol IN (
                             'api_residente',
                             'api_trashumante',
                             'api_mixto',
                             'prop_facilitador',
                             'agri_fitosanitario',
                             'agri_aplicador',
                             'comercial_acopio',
                             'tecnico_inspector',
                             'institucion_publica'
                           )),
  rup          TEXT,                                  -- Registro Único Pecuario SAG
  nombre_actor TEXT        NOT NULL,
  comuna       TEXT        NOT NULL,
  region       TEXT        NOT NULL DEFAULT 'Los Lagos',
  estado       TEXT        NOT NULL DEFAULT 'activo'
                             CHECK (estado IN ('activo', 'suspendido', 'cancelado')),
  nivel_acreditacion TEXT  NOT NULL DEFAULT 'base'
                             CHECK (nivel_acreditacion IN (
                               'base', 'trazable', 'comprometido', 'referente'
                             )),
  -- Consentimientos granulares: qué acepta el actor compartir
  consentimientos JSONB    NOT NULL DEFAULT '{
    "mapa_comunitario": false,
    "alertas_fitosanitarias": true,
    "catalogo_infraestructura": false,
    "acopio_cooperativo": false
  }'::jsonb,
  observaciones TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS actores_registro_user_id_idx ON actores_registro(user_id);
CREATE INDEX IF NOT EXISTS actores_registro_comuna_idx  ON actores_registro(comuna);
CREATE INDEX IF NOT EXISTS actores_registro_rol_idx     ON actores_registro(rol);
CREATE INDEX IF NOT EXISTS actores_registro_estado_idx  ON actores_registro(estado);

-- -----------------------------------------------------------------------------
-- TABLA: predios_facilitadores
-- Predios disponibles para recibir apiarios externos o trashumantes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predios_facilitadores (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id        UUID        NOT NULL REFERENCES actores_registro(id) ON DELETE CASCADE,
  nombre          TEXT,
  comuna          TEXT        NOT NULL,
  zona            TEXT        NOT NULL,                 -- sector/paraje en texto
  -- Coordenadas con precisión reducida (~1 km) para mapa comunitario
  lat_aproximada  DOUBLE PRECISION,
  lng_aproximada  DOUBLE PRECISION,
  superficie_ha   NUMERIC     CHECK (superficie_ha > 0),
  disponible_desde DATE,
  disponible_hasta DATE,
  condiciones     TEXT,                                -- texto libre de condiciones
  activo          BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS predios_actor_id_idx ON predios_facilitadores(actor_id);
CREATE INDEX IF NOT EXISTS predios_comuna_idx   ON predios_facilitadores(comuna);
CREATE INDEX IF NOT EXISTS predios_activo_idx   ON predios_facilitadores(activo);

-- -----------------------------------------------------------------------------
-- TABLA: apiarios_externos
-- Apiarios de trashumantes o actores no residentes que declaran ingreso
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS apiarios_externos (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id              UUID        NOT NULL REFERENCES actores_registro(id) ON DELETE CASCADE,
  predio_id             UUID        REFERENCES predios_facilitadores(id) ON DELETE SET NULL,
  nombre                TEXT,
  n_colmenas            INTEGER     NOT NULL CHECK (n_colmenas > 0),
  comuna_origen         TEXT        NOT NULL,           -- de dónde vienen
  comuna_destino        TEXT        NOT NULL,           -- en Chiloé
  zona_destino          TEXT        NOT NULL,           -- sector aproximado
  -- Coordenadas con precisión reducida para mapa comunitario
  lat_aproximada        DOUBLE PRECISION,
  lng_aproximada        DOUBLE PRECISION,
  fecha_ingreso         DATE        NOT NULL,
  fecha_salida          DATE,
  -- Documentación sanitaria
  cert_sanitaria_url    TEXT,
  cert_sanitaria_fecha  DATE,
  cert_sanitaria_lab    TEXT,
  -- Medidas de bioseguridad declaradas
  bioseguridad_declarada TEXT,
  estado                TEXT        NOT NULL DEFAULT 'declarado'
                                      CHECK (estado IN (
                                        'declarado', 'activo', 'retirado', 'suspendido'
                                      )),
  observaciones         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apiarios_ext_actor_id_idx  ON apiarios_externos(actor_id);
CREATE INDEX IF NOT EXISTS apiarios_ext_estado_idx    ON apiarios_externos(estado);
CREATE INDEX IF NOT EXISTS apiarios_ext_comuna_idx    ON apiarios_externos(comuna_destino);
CREATE INDEX IF NOT EXISTS apiarios_ext_ingreso_idx   ON apiarios_externos(fecha_ingreso);

-- -----------------------------------------------------------------------------
-- TABLA: alertas_fitosanitarias
-- Sistema de avisos de plaguicidas y riesgos que pueden afectar apiarios cercanos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas_fitosanitarias (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id                 UUID        NOT NULL REFERENCES actores_registro(id) ON DELETE CASCADE,
  comuna                   TEXT        NOT NULL,
  zona                     TEXT        NOT NULL,
  -- Coordenadas del predio de aplicación (aproximadas)
  lat_aproximada           DOUBLE PRECISION,
  lng_aproximada           DOUBLE PRECISION,
  radio_km                 NUMERIC     NOT NULL DEFAULT 3 CHECK (radio_km > 0),
  -- Detalles de la aplicación
  producto                 TEXT        NOT NULL,
  tipo_producto            TEXT        CHECK (tipo_producto IN (
                                         'herbicida', 'fungicida', 'insecticida',
                                         'acaricida', 'fertilizante', 'otro'
                                       )),
  metodo_aplicacion        TEXT,
  fecha_programada         TIMESTAMPTZ NOT NULL,
  periodo_carencia_horas   INTEGER     CHECK (periodo_carencia_horas >= 0),
  -- Confirmaciones de apicultores notificados [{actor_id, confirmado_at}]
  confirmaciones           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  estado                   TEXT        NOT NULL DEFAULT 'activa'
                                         CHECK (estado IN ('activa', 'ejecutada', 'cancelada')),
  observaciones            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alertas_actor_id_idx  ON alertas_fitosanitarias(actor_id);
CREATE INDEX IF NOT EXISTS alertas_estado_idx    ON alertas_fitosanitarias(estado);
CREATE INDEX IF NOT EXISTS alertas_comuna_idx    ON alertas_fitosanitarias(comuna);
CREATE INDEX IF NOT EXISTS alertas_fecha_idx     ON alertas_fitosanitarias(fecha_programada);

-- Índice espacial aproximado por coordenadas (para queries de radio)
CREATE INDEX IF NOT EXISTS alertas_lat_lng_idx ON alertas_fitosanitarias(lat_aproximada, lng_aproximada)
  WHERE lat_aproximada IS NOT NULL AND lng_aproximada IS NOT NULL;

-- -----------------------------------------------------------------------------
-- TRIGGER: updated_at automático
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'actores_registro_updated_at') THEN
    CREATE TRIGGER actores_registro_updated_at
      BEFORE UPDATE ON actores_registro
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'predios_facilitadores_updated_at') THEN
    CREATE TRIGGER predios_facilitadores_updated_at
      BEFORE UPDATE ON predios_facilitadores
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'apiarios_externos_updated_at') THEN
    CREATE TRIGGER apiarios_externos_updated_at
      BEFORE UPDATE ON apiarios_externos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'alertas_fitosanitarias_updated_at') THEN
    CREATE TRIGGER alertas_fitosanitarias_updated_at
      BEFORE UPDATE ON alertas_fitosanitarias
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE actores_registro       ENABLE ROW LEVEL SECURITY;
ALTER TABLE predios_facilitadores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE apiarios_externos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_fitosanitarias ENABLE ROW LEVEL SECURITY;

-- actores_registro: cada actor ve/edita su propio perfil; admin ve todo
DROP POLICY IF EXISTS "actores_own_select"  ON actores_registro;
DROP POLICY IF EXISTS "actores_own_insert"  ON actores_registro;
DROP POLICY IF EXISTS "actores_own_update"  ON actores_registro;
DROP POLICY IF EXISTS "actores_admin_all"   ON actores_registro;

CREATE POLICY "actores_own_select" ON actores_registro
  FOR SELECT USING (user_id = auth.uid() OR public.is_gerente());

CREATE POLICY "actores_own_insert" ON actores_registro
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "actores_own_update" ON actores_registro
  FOR UPDATE USING (user_id = auth.uid() OR public.is_gerente())
  WITH CHECK (user_id = auth.uid() OR public.is_gerente());

-- predios_facilitadores: propietario ve/edita los suyos; lectura comunitaria si activo y consentimiento
DROP POLICY IF EXISTS "predios_own"             ON predios_facilitadores;
DROP POLICY IF EXISTS "predios_community_read"  ON predios_facilitadores;

CREATE POLICY "predios_own" ON predios_facilitadores
  FOR ALL USING (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_gerente()
  )
  WITH CHECK (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_gerente()
  );

-- Lectura comunitaria de predios activos para actores autenticados
CREATE POLICY "predios_community_read" ON predios_facilitadores
  FOR SELECT USING (
    activo = true AND auth.role() = 'authenticated'
  );

-- apiarios_externos: actor ve/edita los suyos; lectura comunitaria de activos/declarados
DROP POLICY IF EXISTS "apiarios_ext_own"            ON apiarios_externos;
DROP POLICY IF EXISTS "apiarios_ext_community_read" ON apiarios_externos;

CREATE POLICY "apiarios_ext_own" ON apiarios_externos
  FOR ALL USING (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_gerente()
  )
  WITH CHECK (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_gerente()
  );

CREATE POLICY "apiarios_ext_community_read" ON apiarios_externos
  FOR SELECT USING (
    estado IN ('declarado', 'activo') AND auth.role() = 'authenticated'
  );

-- alertas_fitosanitarias: el emisor gestiona las suyas; cualquier autenticado lee activas
DROP POLICY IF EXISTS "alertas_own"            ON alertas_fitosanitarias;
DROP POLICY IF EXISTS "alertas_community_read" ON alertas_fitosanitarias;

CREATE POLICY "alertas_own" ON alertas_fitosanitarias
  FOR ALL USING (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_gerente()
  )
  WITH CHECK (
    actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid())
    OR public.is_gerente()
  );

CREATE POLICY "alertas_community_read" ON alertas_fitosanitarias
  FOR SELECT USING (
    estado = 'activa' AND auth.role() = 'authenticated'
  );

-- -----------------------------------------------------------------------------
-- RPC: alertas_en_radio
-- Devuelve alertas activas dentro de radio_km de una coordenada dada
-- Usa cálculo haversine aproximado (sin PostGIS extension requerida)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION alertas_en_radio(
  p_lat   DOUBLE PRECISION,
  p_lng   DOUBLE PRECISION,
  p_radio DOUBLE PRECISION DEFAULT 5
)
RETURNS SETOF alertas_fitosanitarias
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM alertas_fitosanitarias
  WHERE estado = 'activa'
    AND lat_aproximada IS NOT NULL
    AND lng_aproximada IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(lat_aproximada)) *
        cos(radians(lng_aproximada) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(lat_aproximada))
      )
    ) <= p_radio
  ORDER BY fecha_programada ASC;
$$;
