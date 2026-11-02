-- Permitir suscripciones por producto arbitrario del catálogo (Camino B).
-- Los planes con product_id NULL conservan el comportamiento legacy (planes curados).

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.productos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;

-- Evitar planes duplicados por (producto, frecuencia).
CREATE UNIQUE INDEX IF NOT EXISTS subscription_plans_product_frequency_uidx
  ON public.subscription_plans (product_id, frequency)
  WHERE product_id IS NOT NULL;

-- Índice para lookup rápido por producto.
CREATE INDEX IF NOT EXISTS subscription_plans_product_id_idx
  ON public.subscription_plans (product_id)
  WHERE product_id IS NOT NULL;
