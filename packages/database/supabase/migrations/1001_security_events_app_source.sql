-- 1001: Ampliar app_source de security_events con orígenes del BFF (nucleo-bff)
-- y del registro territorial (nucleo_territorial).
-- El BFF envía "nucleo-bff" en eventos de rate-limit (route.ts); sin este valor
-- el insert violaba el CHECK y el evento se perdía silenciosamente.

ALTER TABLE public.security_events DROP CONSTRAINT IF EXISTS security_events_app_source_check;

ALTER TABLE public.security_events ADD CONSTRAINT security_events_app_source_check
  CHECK (app_source IN ('tienda', 'nucleo', 'campo', 'api', 'nucleo-bff', 'nucleo_territorial'));
