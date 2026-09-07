-- =============================================================================
-- Migration 20260907000000: Ley de Marca Inviolable — Recolección en loyalty_rewards
-- =============================================================================

UPDATE public.loyalty_rewards
SET name = 'Recolección Exclusiva',
    description = 'Acceso a un lote de recolección exclusiva del Enjambre (ulmo/tiaca) con pasaporte del frasco.'
WHERE name = 'Cosecha Exclusiva';
