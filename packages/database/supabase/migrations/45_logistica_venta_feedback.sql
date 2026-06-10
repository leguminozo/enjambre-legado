-- Migración 45: Relación Logística-Venta y Mejoras en Trazabilidad
-- Añade vínculo opcional entre envíos y ventas para retroalimentación tienda-núcleo

ALTER TABLE logistica_envios ADD COLUMN IF NOT EXISTS venta_id TEXT REFERENCES ventas(id) ON DELETE SET NULL;
ALTER TABLE logistica_envios ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- Comentario para documentar el propósito
COMMENT ON COLUMN logistica_envios.venta_id IS 'Vínculo con la venta de origen (tienda o POS) para trazabilidad logística.';

-- Asegurar que lotes tenga campos para trazabilidad extendida si no existen
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS nombre_lote TEXT;
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS fecha_envasado DATE;

-- Vista para facilitar la retroalimentación en el dashboard de logística
CREATE OR REPLACE VIEW ventas_pendientes_logistica AS
SELECT 
    v.id as venta_id,
    v.created_at,
    v.total,
    v.items,
    v.origen,
    v.metodo_pago,
    p.full_name as cliente_nombre,
    NOT EXISTS (SELECT 1 FROM logistica_envios le WHERE le.venta_id = v.id) as pendiente_envio
FROM ventas v
LEFT JOIN profiles p ON v.cliente_id = p.id
WHERE v.estado = 'completada' OR v.estado = 'pagada';
