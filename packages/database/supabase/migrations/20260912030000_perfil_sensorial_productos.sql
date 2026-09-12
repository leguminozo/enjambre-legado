-- =============================================================================
-- 20260912030000 — Perfil sensorial y organoléptico por producto
--
-- Permite que cada producto del catálogo tenga su perfil de cata canónico
-- configurable por el administrador desde Núcleo (intensidad, dulzor/acidez,
-- textura, notas aromáticas, maridajes y momento de consumo).
-- =============================================================================

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS perfil_sensorial JSONB DEFAULT NULL;

COMMENT ON COLUMN public.productos.perfil_sensorial IS
  'Perfil organoléptico y sensorial canónico (intensidad 0-100, dulzor_acidez 0-100, textura 0-100, descriptores, notas_aromaticas, maridajes, momento_consumo). Administrado en Núcleo, consumido en Tienda PDP y Campo POS.';
