-- =============================================================================
-- 20260812084000 — Seed catálogo de canje (loyalty_rewards)
--
-- El catálogo nació sin seed y /perfil/canje mostraba siempre "Aún no hay
-- recompensas activas" — un CTA del hub no puede prometer canje a una página
-- vacía. Seed inicial con los 4 tipos existentes; admin ajusta costos/estado
-- por SQL (sin UI aún, señalado en el inventario).
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_loyalty_rewards_name
  ON public.loyalty_rewards (name);

INSERT INTO public.loyalty_rewards (name, description, points_cost, reward_type, metadata, active)
VALUES
  ('Cosecha Exclusiva',
   'Acceso a un lote de cosecha exclusiva del Enjambre (ulmo/tiaca) con pasaporte del frasco.',
   500, 'exclusive_harvest', '{"temporada":"proxima"}'::jsonb, true),
  ('Contenido Territorial',
   'Acceso al contenido territorial de Chiloé: bitácoras de colmena y registros del bosque.',
   300, 'territorial_content', '{}'::jsonb, true),
  ('Acceso Anticipado',
   'Acceso anticipado a lanzamientos y reposiciones antes que el público.',
   800, 'early_access', '{}'::jsonb, true),
  ('Experiencia en Chiloé',
   'Experiencia apícola en el territorio (cata guiada en colmenar).',
   1500, 'experience', '{"incluye":"cata y recorrido"}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;
