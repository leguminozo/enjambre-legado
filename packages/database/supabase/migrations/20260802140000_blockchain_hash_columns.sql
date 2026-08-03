-- ============================================================
-- Migration 20260802140000: columnas blockchain_hash faltantes
-- anchor-entity.ts (anclaje on-chain de colmenas/lotes/cosechas/apiarios)
-- actualiza blockchain_hash en cosechas y apiarios, pero la columna
-- solo existía en colmenas y lotes (migración 00). La regeneración de
-- tipos desde prod reveló el drift: el código escribía en columnas
-- inexistentes (dead code nunca invocado). Se alinea el esquema.
-- ============================================================

ALTER TABLE public.cosechas ADD COLUMN IF NOT EXISTS blockchain_hash TEXT;
ALTER TABLE public.apiarios ADD COLUMN IF NOT EXISTS blockchain_hash TEXT;
