-- =============================================================================
-- Migration 20260924010000: Default biológico de alzas a 0 (cámara de cría única)
--
-- En apicultura, una colmena nueva (núcleo, enjambre o división) inicia
-- biológicamente con 0 alzas melarias (cámara de cría basal única).
-- Las alzas melarias se incorporan progresivamente durante la mielada según
-- el vigor del nido y la floración, y se retiran para la invernada.
-- =============================================================================

ALTER TABLE public.colmenas
  ALTER COLUMN alzas SET DEFAULT 0;
