-- =============================================================================
-- Migration 1006: Bitácora Apícola (especificación docs/BITACORA_APICOLA.md §7)
-- Registro longitudinal del ciclo de vida de la colmena: núcleo → traspaso →
-- alzas → cosecha → invernada → nueva temporada, más componente sanitario
-- (tratamientos con período de retiro, muestras y contramuestreos) y captura
-- por voz con sesiones.
--
-- Reglas:
--   * Todas las tablas llevan user_id (ownership) para RLS uniforme — mismo
--     patrón que inspecciones/varroa_records/peso_records (01_rls_policies).
--   * Escritura solo vía BFF (bitacora.ts); lectura owner o gerente/admin.
--   * El audio vive en storage (bucket bitacora-audio); acá solo la URL.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLA: sesiones_bitacora
-- Una sesión de inspección agrupa múltiples colmenas (voz libre no correlativa).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones_bitacora (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  apiario_id     UUID        REFERENCES apiarios(id) ON DELETE SET NULL,
  fecha          DATE        NOT NULL DEFAULT CURRENT_DATE,
  contexto       TEXT,                                  -- "revisión de primavera"
  audio_url      TEXT,                                  -- bucket bitacora-audio
  duracion_seg   INT,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  sincronizado_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sesiones_apiario_idx ON sesiones_bitacora(apiario_id);
CREATE INDEX IF NOT EXISTS sesiones_user_idx    ON sesiones_bitacora(user_id);
CREATE INDEX IF NOT EXISTS sesiones_fecha_idx   ON sesiones_bitacora(fecha);

-- -----------------------------------------------------------------------------
-- TABLA: voice_inspection_captures
-- El audio es la fuente de verdad; transcripción y campos son derivados.
-- colmena_id es NULL hasta la atribución semántica (hipótesis → curaduría).
-- client_request_id da idempotencia de replay (patrón ventas.buy_order).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voice_inspection_captures (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID        NOT NULL REFERENCES sesiones_bitacora(id) ON DELETE CASCADE,
  colmena_id          UUID        REFERENCES colmenas(id) ON DELETE SET NULL,
  client_request_id   UUID        NOT NULL UNIQUE,
  audio_url           TEXT,
  transcript_raw      TEXT,
  estado              TEXT        NOT NULL DEFAULT 'capturado'
                                  CHECK (estado IN (
                                    'capturado', 'transcrito', 'procesado',
                                    'en_revision', 'confirmado', 'descartado'
                                  )),
  atribucion_hipotesis JSONB      NOT NULL DEFAULT '[]'::jsonb,
                                  -- [{colmena_id, fragmento, confianza}]
  dispositivo         TEXT,
  duracion_seg        INT,
  user_id             UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS captures_session_idx   ON voice_inspection_captures(session_id);
CREATE INDEX IF NOT EXISTS captures_colmena_idx   ON voice_inspection_captures(colmena_id);
CREATE INDEX IF NOT EXISTS captures_estado_idx    ON voice_inspection_captures(estado);
CREATE INDEX IF NOT EXISTS captures_user_idx      ON voice_inspection_captures(user_id);

-- -----------------------------------------------------------------------------
-- TABLA: inspeccion_cuadros
-- Individualización de cada cuadro (esquema basal del núcleo y fases):
-- C = cría, L = cera labrada, E = cera estampada, V = vacío, M = miel.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspeccion_cuadros (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inspeccion_id  UUID        NOT NULL REFERENCES inspecciones(id) ON DELETE CASCADE,
  posicion       INT         NOT NULL CHECK (posicion > 0),
  cuerpo         TEXT        NOT NULL DEFAULT 'camara'
                             CHECK (cuerpo IN (
                               'nucleo', 'camara', 'alza_1', 'alza_2', 'alza_3'
                             )),
  tipo           TEXT        NOT NULL CHECK (tipo IN (
                             'cria_abierta', 'cria_cerrada', 'miel',
                             'cera_labrada', 'cera_estampada', 'vacio', 'polen'
                           )),
  notas          TEXT,
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cuadros_inspeccion_idx ON inspeccion_cuadros(inspeccion_id);

-- -----------------------------------------------------------------------------
-- TABLA: reina_history
-- Historia de reinas por colmena (características por temporada; exigida por
-- la bitácora §1.4; referenciada en ColmenaFicha.tsx como tabla futura).
--
-- NOTA DE DRIFT: en la BD real esta tabla YA EXISTE con shape distinto
-- (generation/origin/since/status — stub creado manualmente, nunca canonicado).
-- El CREATE cubre bases frescas; los ALTER IF NOT EXISTS convergen la tabla
-- real sin perder las columnas legacy (se conservan por convergencia de typegen).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reina_history (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  colmena_id      UUID        NOT NULL REFERENCES colmenas(id) ON DELETE CASCADE,
  fecha           DATE        NOT NULL DEFAULT CURRENT_DATE,
  estado          TEXT        NOT NULL CHECK (estado IN ('RV', 'NV', 'SR')),
                              -- RV = reina vista, NV = no vista, SR = sin reina
  caracteristicas JSONB,      -- {color, vigor, postura, notas}
  reemplazada_por UUID,       -- reina siguiente (encadenar historia)
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Columnas legacy del drift (stub): se conservan por convergencia de typegen
  generation      TEXT,
  origin          TEXT,
  since           TEXT,
  status          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convergencia con la BD real (tabla ya existente con shape distinto)
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS fecha DATE;
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS caracteristicas JSONB;
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS reemplazada_por UUID;
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS generation TEXT;
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS origin TEXT;
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS since TEXT;
ALTER TABLE reina_history ADD COLUMN IF NOT EXISTS status TEXT;
-- El stub real exige generation NOT NULL sin default; se libera para que los
-- inserts del BFF (que no la usan) funcionen sobre la BD migrada.
ALTER TABLE reina_history ALTER COLUMN generation DROP NOT NULL;

CREATE INDEX IF NOT EXISTS reina_history_colmena_idx ON reina_history(colmena_id);

-- -----------------------------------------------------------------------------
-- TABLA: muestras
-- Muestreo/contramuestreo de laboratorio: archivo ≥2 años.
-- es_contramuestra + confirmado_saneado habilitan levantar una cuarentena.
-- (Se crea antes que tratamientos porque ésta la referencia vía FK.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS muestras (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  apiario_id           UUID        REFERENCES apiarios(id) ON DELETE SET NULL,
  fecha                DATE        NOT NULL DEFAULT CURRENT_DATE,
  tipo                 TEXT        NOT NULL CHECK (tipo IN ('varroa', 'nosema', 'otro')),
  n_abejas             INT,
  cuadros_muestreados  INT,
  lab_nombre           TEXT,
  lab_fecha            DATE,
  resultado            TEXT,      -- % infestación | presencia/ausencia
  patogeno             TEXT       CHECK (patogeno IN ('varroa', 'nosema', 'DWV', 'ABPV', 'otro')),
  es_contramuestra     BOOLEAN    NOT NULL DEFAULT false,
  confirmado_saneado   BOOLEAN    NOT NULL DEFAULT false,
  user_id              UUID       REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS muestras_apiario_idx ON muestras(apiario_id);
CREATE INDEX IF NOT EXISTS muestras_user_idx    ON muestras(user_id);

-- -----------------------------------------------------------------------------
-- TABLA: tratamientos
-- Aplicaciones fitosanitarias: archivo legal ≥5 años (National Bee Unit).
-- principio_activo alimenta la rotación anti-resistencia de Varroa destructor.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tratamientos (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  colmena_id         UUID        NOT NULL REFERENCES colmenas(id) ON DELETE CASCADE,
  fecha              DATE        NOT NULL DEFAULT CURRENT_DATE,
  producto_comercial TEXT,
  principio_activo   TEXT        NOT NULL,
  dosis_recomendada  TEXT,
  dosis_aplicada     TEXT,
  enfermedad         TEXT        NOT NULL DEFAULT 'varroa'
                                 CHECK (enfermedad IN (
                                   'varroa', 'nosema', 'loque', 'otro'
                                 )),
  via                TEXT,
  forma              TEXT,
  retiro_fin         DATE,      -- fin del período de retiro (alerta si alza puesta)
  contramuestreo_id  UUID REFERENCES muestras(id) ON DELETE SET NULL,
  user_id            UUID       REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tratamientos_colmena_idx ON tratamientos(colmena_id);
CREATE INDEX IF NOT EXISTS tratamientos_retiro_idx  ON tratamientos(retiro_fin);
CREATE INDEX IF NOT EXISTS tratamientos_activo_idx  ON tratamientos(principio_activo);

-- -----------------------------------------------------------------------------
-- RLS — mismo patrón que el registro territorial: owner o gerente; admin total
-- -----------------------------------------------------------------------------
ALTER TABLE sesiones_bitacora         ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_inspection_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspeccion_cuadros        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reina_history             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratamientos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE muestras                  ENABLE ROW LEVEL SECURITY;

-- sesiones_bitacora
DROP POLICY IF EXISTS "sesiones_own" ON sesiones_bitacora;
CREATE POLICY "sesiones_own" ON sesiones_bitacora
  FOR ALL USING (
    user_id = auth.uid() OR public.is_gerente()
  )
  WITH CHECK (user_id = auth.uid() OR public.is_gerente());

-- voice_inspection_captures
DROP POLICY IF EXISTS "captures_own" ON voice_inspection_captures;
CREATE POLICY "captures_own" ON voice_inspection_captures
  FOR ALL USING (
    user_id = auth.uid() OR public.is_gerente()
  )
  WITH CHECK (user_id = auth.uid() OR public.is_gerente());

-- inspeccion_cuadros (heredan ownership de la inspección padre)
DROP POLICY IF EXISTS "cuadros_own" ON inspeccion_cuadros;
CREATE POLICY "cuadros_own" ON inspeccion_cuadros
  FOR ALL USING (
    user_id = auth.uid()
    OR public.is_gerente()
    OR inspeccion_id IN (
      SELECT i.id FROM inspecciones i
      WHERE i.user_id = auth.uid() OR public.is_gerente()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_gerente()
    OR inspeccion_id IN (
      SELECT i.id FROM inspecciones i
      WHERE i.user_id = auth.uid() OR public.is_gerente()
    )
  );

-- reina_history
DROP POLICY IF EXISTS "reina_history_own" ON reina_history;
CREATE POLICY "reina_history_own" ON reina_history
  FOR ALL USING (
    user_id = auth.uid() OR public.is_gerente()
  )
  WITH CHECK (user_id = auth.uid() OR public.is_gerente());

-- tratamientos
DROP POLICY IF EXISTS "tratamientos_own" ON tratamientos;
CREATE POLICY "tratamientos_own" ON tratamientos
  FOR ALL USING (
    user_id = auth.uid() OR public.is_gerente()
  )
  WITH CHECK (user_id = auth.uid() OR public.is_gerente());

-- muestras
DROP POLICY IF EXISTS "muestras_own" ON muestras;
CREATE POLICY "muestras_own" ON muestras
  FOR ALL USING (
    user_id = auth.uid() OR public.is_gerente()
  )
  WITH CHECK (user_id = auth.uid() OR public.is_gerente());
