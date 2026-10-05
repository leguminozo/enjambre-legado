-- 20261004120000_stock_centers_logistics_metadata.sql
-- Enriquecer centros de stock con atributos logísticos y territoriales reales.
-- Erradica la necesidad de inventar stock en la creación y dota a cada centro de rol operativo, custodio y territorio.

ALTER TABLE public.stock_centers
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'bodega',
  ADD COLUMN IF NOT EXISTS comuna TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS responsable TEXT,
  ADD COLUMN IF NOT EXISTS contacto TEXT,
  ADD COLUMN IF NOT EXISTS notas TEXT;

COMMENT ON COLUMN public.stock_centers.tipo IS 'Clasificación logística: bodega, despacho, acopio, feria, consignacion, otro';
COMMENT ON COLUMN public.stock_centers.comuna IS 'Comuna o territorio del centro de stock';
COMMENT ON COLUMN public.stock_centers.responsable IS 'Nombre del custodio o encargado del recinto';
COMMENT ON COLUMN public.stock_centers.contacto IS 'Teléfono o correo de contacto del responsable';
COMMENT ON COLUMN public.stock_centers.notas IS 'Instrucciones operativas o condiciones de almacenamiento';
