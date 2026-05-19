-- 18: Drop old ventas_insert policy from migration 01
-- Migration 12 introduced ventas_full_pos which replaces it.
-- The old policy allowed any authenticated user to insert ventas,
-- conflicting with the more restrictive ventas_full_pos policy.

DROP POLICY IF EXISTS "ventas_insert" ON ventas;
