-- =============================================================================
-- Migration 20260831162800: Bitácora Ledger Criptográfico (Append-Only)
-- Implementación del "Modelo de Amenazas" (docs/BLINDAJE_Y_AMENAZAS.md)
--
-- Introduce la tabla `bitacora_eventos` con Hash-Chaining para asegurar
-- inmutabilidad, trazabilidad criptográfica y prevenir condiciones de carrera
-- mediante Optimistic Concurrency Control (OCC) con `prev_hash`.
-- =============================================================================

-- Habilitar pgcrypto para la función digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- TABLA: bitacora_eventos (El Ledger Principal)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bitacora_eventos (
  id              UUID        PRIMARY KEY, -- client_request_id (Idempotency)
  colmena_id      UUID        NOT NULL REFERENCES colmenas(id) ON DELETE RESTRICT,
  apiario_id      UUID        NOT NULL REFERENCES apiarios(id) ON DELETE RESTRICT,
  schema_version  INT         NOT NULL DEFAULT 1,
  
  -- Core Event
  tipo_accion     VARCHAR(50) NOT NULL,
  payload         JSONB       NOT NULL,
  
  -- Socio-Técnico
  notas_oficio    TEXT,
  override_reason TEXT,
  
  -- Chain of Custody
  audio_path      TEXT,
  raw_transcript  TEXT        NOT NULL,
  
  -- Meta
  lat_lng         geometry(Point, 4326),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Blockchain (Merkle Log)
  prev_hash       TEXT,
  event_hash      TEXT        -- Generado automáticamente por trigger
);

-- Índices para lecturas y proyecciones CQRS
CREATE INDEX IF NOT EXISTS bitacora_eventos_colmena_idx ON bitacora_eventos(colmena_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bitacora_eventos_apiario_idx ON bitacora_eventos(apiario_id);
CREATE INDEX IF NOT EXISTS bitacora_eventos_tipo_idx    ON bitacora_eventos(tipo_accion);

-- -----------------------------------------------------------------------------
-- LÓGICA DE BLINDAJE: Hash-Chaining & OCC Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION bitacora_hash_and_validate_event()
RETURNS TRIGGER AS $$
DECLARE
  v_last_hash TEXT;
BEGIN
  -- 1. Obtener el último hash de esta colmena, asegurando lockeo transaccional (FOR UPDATE)
  --    para evitar race conditions en lecturas concurrentes
  SELECT event_hash INTO v_last_hash
  FROM bitacora_eventos
  WHERE colmena_id = NEW.colmena_id
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- 2. Validación OCC (Optimistic Concurrency Control)
  IF v_last_hash IS NOT NULL THEN
    IF NEW.prev_hash IS NULL OR NEW.prev_hash != v_last_hash THEN
      RAISE EXCEPTION 'Cryptographic chain validation failed. Expected prev_hash: %', v_last_hash;
    END IF;
  ELSE
    IF NEW.prev_hash IS NOT NULL THEN
      RAISE EXCEPTION 'First event for this colmena must have a null prev_hash.';
    END IF;
  END IF;

  -- 3. Calcular Hash Criptográfico (SHA256)
  -- Formato del hash: SHA256(prev_hash + payload + id + created_at + created_by)
  NEW.event_hash := encode(digest(
    COALESCE(NEW.prev_hash, '') ||
    NEW.payload::text ||
    NEW.id::text ||
    NEW.created_at::text ||
    NEW.created_by::text,
    'sha256'
  ), 'hex');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignar el trigger a la tabla
DROP TRIGGER IF EXISTS trg_bitacora_hash_event ON bitacora_eventos;
CREATE TRIGGER trg_bitacora_hash_event
  BEFORE INSERT ON bitacora_eventos
  FOR EACH ROW
  EXECUTE FUNCTION bitacora_hash_and_validate_event();

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (Zero Trust / Append Only)
-- -----------------------------------------------------------------------------
ALTER TABLE bitacora_eventos ENABLE ROW LEVEL SECURITY;

-- Impedir Mutaciones: Nadie, ni siquiera admin, puede hacer UPDATE o DELETE
-- (Por defecto al habilitar RLS y no proveer políticas de UPDATE/DELETE, ya están bloqueadas)
-- Explicitamos por auditoría:
-- NO CREATE POLICY for UPDATE
-- NO CREATE POLICY for DELETE

-- Política de Lectura: Territorial ve sus eventos, Admin/Gerente ve todo
CREATE POLICY "bitacora_select" ON bitacora_eventos
  FOR SELECT
  USING (
    public.is_admin() OR 
    public.is_gerente() OR 
    apiario_id IN (
      SELECT id FROM apiarios WHERE user_id = auth.uid() OR empresa_id IN (
        SELECT id FROM empresas WHERE owner_id = auth.uid()
      )
    )
  );

-- Política de Inserción: Solo pueden dictar eventos sobre apiarios propios o administrados
CREATE POLICY "bitacora_insert" ON bitacora_eventos
  FOR INSERT
  WITH CHECK (
    -- Validar identidad criptográfica
    created_by = auth.uid() AND
    (
      public.is_admin() OR 
      public.is_gerente() OR 
      apiario_id IN (
        SELECT id FROM apiarios WHERE user_id = auth.uid() OR empresa_id IN (
          SELECT id FROM empresas WHERE owner_id = auth.uid()
        )
      )
    )
  );

