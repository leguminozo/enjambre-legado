-- Migration: 20261102000000_purge_mock_producto_variantes.sql
-- Purga de variantes de prueba generadas automáticamente por semillas históricas (SKUs CM-* de demo).
-- Devuelve los productos a estado neutro para permitir vinculaciones manuales y reales por parte del operador.

DELETE FROM public.producto_variantes
WHERE sku IN (
  'CM-VIRGEN-25G',
  'CM-POLEN-25G',
  'CM-AVELLANA-25G',
  'CM-CACAO-25G',
  'CM-VIRGEN-250G',
  'CM-POLEN-250G',
  'CM-AVELLANA-250G',
  'CM-CACAO-250G'
);
