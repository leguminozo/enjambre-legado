-- Reposición canónica: dirección en checkout + nombres de planes sin "Ritual"

ALTER TABLE public.subscription_checkout_sessions
  ADD COLUMN IF NOT EXISTS delivery_address text;

COMMENT ON COLUMN public.subscription_checkout_sessions.delivery_address IS
  'Dirección de entrega capturada en tienda antes del pago de reposición';

UPDATE public.subscription_plans
SET
  name = 'Reposición mensual',
  description = 'Una selección curada de mieles del bosque nativo, cada mes en tu puerta.'
WHERE key = 'monthly' AND name ILIKE '%ritual%mensual%';

UPDATE public.subscription_plans
SET
  name = 'Reposición trimestral',
  description = 'Tres meses de descubrimiento. Cada trimestre, mieles que reflejan la estación.'
WHERE key = 'quarterly' AND name ILIKE '%ritual%trimestral%';

UPDATE public.subscription_plans
SET name = 'Reposición anual'
WHERE key = 'annual' AND name = 'Legado Anual';