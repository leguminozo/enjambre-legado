-- El trigger de n_colmenas en vivo (20260823010000/20000) puede llegar a 0
-- (un apiario queda sin colmenas: todas retiradas o movidas). El CHECK
-- original exigía n_colmenas > 0, rompiendo el sync. Se relaja a >= 0:
-- 0 es un estado legítimo y visible (badge de desfase en /colmenas).
ALTER TABLE public.apiarios_registro
  DROP CONSTRAINT IF EXISTS apiarios_registro_n_colmenas_check;

ALTER TABLE public.apiarios_registro
  ADD CONSTRAINT apiarios_registro_n_colmenas_check
  CHECK (n_colmenas >= 0);
