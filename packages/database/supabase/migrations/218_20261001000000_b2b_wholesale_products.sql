-- =============================================================================
-- 218_20261001000000 — Catálogo mayorista B2B editable (JSONB en reglas)
--
-- El panel de Núcleo editaba los PVPs/netos del catálogo mayorista solo en
-- memoria: el guardado persistía reglas y tramos pero perdía los productos,
-- y los portales públicos los leían de constantes del package. Esta columna
-- documental en el singleton b2b_wholesale_rules persiste el catálogo junto
-- a sus reglas (misma lectura atómica del GET) y todos los consumidores
-- caen a las constantes del package si la columna está vacía.
-- =============================================================================

ALTER TABLE public.b2b_wholesale_rules
  ADD COLUMN IF NOT EXISTS productos JSONB;

UPDATE public.b2b_wholesale_rules
SET productos = '[
  {"id":"crema-miel-sachet-15g","nombre":"Crema de Miel (sachet)","categoria":"sachet","formato":"15 g","pesoGramos":15,"pvpRecomendadoClp":990,"precioNetoBaseClp":400,"minimoCompraUnidades":500,"descripcion":"Sachet individual 15g de miel cruda cremada para servicio y barra."},
  {"id":"crema-miel-polen-avellana-sachet-15g","nombre":"Crema de Miel con Polen / Avellanas (sachet)","categoria":"sachet","formato":"15-20 g","pesoGramos":18,"pvpRecomendadoClp":1190,"precioNetoBaseClp":500,"minimoCompraUnidades":500,"descripcion":"Sachet individual infusionado con polen agroecológico o avellana tostada."},
  {"id":"crema-miel-frasco-mediano-150g","nombre":"Crema de Miel (frasco mediano)","categoria":"frasco_mediano","formato":"150 g","pesoGramos":150,"pvpRecomendadoClp":5990,"precioNetoBaseClp":2990,"minimoCompraUnidades":30,"descripcion":"Frasco mediano de vidrio, crema de miel pura del bosque patagónico."},
  {"id":"crema-miel-variedades-frasco-mediano-150g","nombre":"Crema de Miel con Polen / Avellanas / Cacao (frasco mediano)","categoria":"frasco_mediano","formato":"150 g","pesoGramos":150,"pvpRecomendadoClp":6490,"precioNetoBaseClp":3245,"minimoCompraUnidades":30,"descripcion":"Frasco mediano con superalimentos e ingredientes nobles."},
  {"id":"crema-miel-reserva-bosque-frasco-mayor-500g","nombre":"Crema de Miel ~ Reserva del Bosque (frasco mayor)","categoria":"frasco_mayor","formato":"500 g","pesoGramos":500,"pvpRecomendadoClp":21990,"precioNetoBaseClp":16655,"minimoCompraUnidades":15,"descripcion":"Edición mayor 500g, lote numerado de bosque nativo antiguo."},
  {"id":"miel-tradicional-reserva-bosque-frasco-mayor-500g","nombre":"Miel Tradicional ~ Reserva del Bosque (frasco mayor)","categoria":"frasco_mayor","formato":"500 g","pesoGramos":500,"pvpRecomendadoClp":14990,"precioNetoBaseClp":11100,"minimoCompraUnidades":15,"descripcion":"Miel líquida tradicional sin filtrar 500g con origen protegido."}
]'::jsonb
WHERE productos IS NULL AND id = 1;
