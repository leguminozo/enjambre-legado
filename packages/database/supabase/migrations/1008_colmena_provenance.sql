-- =============================================================================
-- Migration 1008: Provenance de la colmena (docs/BITACORA_APICOLA.md §7.3)
-- El origen del núcleo/colmena como entidad: la opción "colmenas con subtipo"
-- de la spec (el núcleo comprado es una colmena con origen_tipo = 'nucleo').
-- origen_colmena_madre encadena el linaje para divisiones/traspasos: la
-- trazabilidad del origen se lee recorriendo la cadena hacia atrás.
-- =============================================================================

ALTER TABLE public.colmenas
  ADD COLUMN IF NOT EXISTS origen_tipo TEXT
    CHECK (origen_tipo IN ('nucleo', 'division', 'enjambre', 'compra', 'traspaso', 'otro'));

ALTER TABLE public.colmenas
  ADD COLUMN IF NOT EXISTS origen_fecha DATE;

ALTER TABLE public.colmenas
  ADD COLUMN IF NOT EXISTS origen_colmena_madre UUID
    REFERENCES public.colmenas(id) ON DELETE SET NULL;

ALTER TABLE public.colmenas
  ADD COLUMN IF NOT EXISTS origen_detalle TEXT;

CREATE INDEX IF NOT EXISTS colmenas_origen_madre_idx ON public.colmenas(origen_colmena_madre);

COMMENT ON COLUMN public.colmenas.origen_tipo IS 'Tipo de origen: nucleo (comprado/propio), division de colmena madre, enjambre capturado, compra, traspaso.';
COMMENT ON COLUMN public.colmenas.origen_fecha IS 'Fecha de origen del núcleo/colmena (línea de referencia, §1.1).';
COMMENT ON COLUMN public.colmenas.origen_colmena_madre IS 'Colmena madre en divisiones/traspasos: encadena el linaje de trazabilidad.';
COMMENT ON COLUMN public.colmenas.origen_detalle IS 'Criadero/proveedor/paraje de captura y antecedentes del origen.';
