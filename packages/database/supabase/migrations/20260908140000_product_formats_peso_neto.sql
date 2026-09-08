-- ============================================================
-- Migración: Añadir peso_neto_g a product_formats
-- Centraliza el gramaje base de cada formato para sincronización
-- automática con lotes a granel (46_stock_lote_sync.sql).
-- ============================================================

ALTER TABLE public.product_formats 
  ADD COLUMN IF NOT EXISTS peso_neto_g INT DEFAULT 0;

COMMENT ON COLUMN public.product_formats.peso_neto_g IS
  'Gramaje neto estándar del formato en gramos. Vincula el empaque comercial con el lote a granel (kg_total = kg_total - qty * peso_neto_g / 1000).';

-- Poblar valores base de acuerdo a los formatos canónicos
UPDATE public.product_formats SET peso_neto_g = 500 WHERE value = '500g' AND (peso_neto_g IS NULL OR peso_neto_g = 0);
UPDATE public.product_formats SET peso_neto_g = 250 WHERE value = '250g' AND (peso_neto_g IS NULL OR peso_neto_g = 0);
UPDATE public.product_formats SET peso_neto_g = 1000 WHERE value = '1kg' AND (peso_neto_g IS NULL OR peso_neto_g = 0);
UPDATE public.product_formats SET peso_neto_g = 450 WHERE value = '30x15g' AND (peso_neto_g IS NULL OR peso_neto_g = 0);
UPDATE public.product_formats SET peso_neto_g = 150 WHERE value = '10x15g' AND (peso_neto_g IS NULL OR peso_neto_g = 0);
UPDATE public.product_formats SET peso_neto_g = 200 WHERE value = 'Panal' AND (peso_neto_g IS NULL OR peso_neto_g = 0);
UPDATE public.product_formats SET peso_neto_g = 0 WHERE value IN ('Cofre', 'Kit') AND (peso_neto_g IS NULL);
