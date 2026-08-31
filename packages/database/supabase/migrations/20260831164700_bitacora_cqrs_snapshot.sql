-- Migración: CQRS Projection Table para el Ledger Apícola
-- Representa la "vista viva" materializada desde los eventos inmutables.

CREATE TABLE bitacora_colmena_snapshots (
  colmena_id UUID PRIMARY KEY REFERENCES colmenas(id) ON DELETE CASCADE,
  fecha_calculo TIMESTAMPTZ NOT NULL,
  
  poblacion_cuadros INT NOT NULL DEFAULT 0,
  cria_abierta INT NOT NULL DEFAULT 0,
  cria_sellada INT NOT NULL DEFAULT 0,
  miel INT NOT NULL DEFAULT 0,
  polen INT NOT NULL DEFAULT 0,
  vacios_trabajados INT NOT NULL DEFAULT 0,
  
  reina_estado TEXT NOT NULL CHECK (reina_estado IN ('PRESENTE', 'HUERFANA', 'CELDA_REAL', 'VIRGEN', 'DESCONOCIDA')),
  ultima_inspeccion_fecha TIMESTAMPTZ,
  ultimo_tratamiento_fecha TIMESTAMPTZ,
  ultimo_tratamiento_nombre TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Mismas políticas que colmenas
ALTER TABLE bitacora_colmena_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura de snapshots por dueños" 
ON bitacora_colmena_snapshots FOR SELECT 
USING (
  colmena_id IN (
    SELECT id FROM colmenas WHERE apiario_id IN (
      SELECT id FROM apiarios WHERE has_empresa_access(empresa_id)
    )
  )
);

CREATE POLICY "Escritura interna via service_role/triggers" 
ON bitacora_colmena_snapshots FOR ALL 
USING (true) WITH CHECK (true);
