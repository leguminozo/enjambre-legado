-- Club de la Cosecha: planes por floración (mov. 13).
-- Idempotente por key UNIQUE.

INSERT INTO public.subscription_plans (name, key, price_clp, frequency, description, included_items, active)
SELECT v.name, v.key, v.price_clp, v.frequency, v.description, v.included_items::jsonb, true
FROM (VALUES
  (
    'Club Ulmo',
    'club_ulmo',
    24990,
    'quarterly',
    'Cosecha de ulmo (Eucryphia cordifolia): floral, vainilla, cuerpo ligero. Envío en ventana enero–marzo y reservas maduras el resto del año.',
    '[{"type":"floracion","value":"ulmo"},{"type":"cata","note":"Guía de cata digital"},{"type":"trazabilidad","note":"Pasaporte de lote cuando esté publicado"}]'
  ),
  (
    'Club Tiaca',
    'club_tiaca',
    24990,
    'quarterly',
    'Cosecha de tiaca: ámbar, herbácea, mayor cuerpo. Cierra el verano austral.',
    '[{"type":"floracion","value":"tiaca"},{"type":"cata","note":"Guía de cata digital"},{"type":"trazabilidad","note":"Pasaporte de lote cuando esté publicado"}]'
  ),
  (
    'Club Quillay',
    'club_quillay',
    22990,
    'quarterly',
    'Cosecha de quillay de primavera: floral intenso. Ideal para entrar al club.',
    '[{"type":"floracion","value":"quillay"},{"type":"cata","note":"Guía de cata digital"},{"type":"trazabilidad","note":"Pasaporte de lote cuando esté publicado"}]'
  )
) AS v(name, key, price_clp, frequency, description, included_items)
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscription_plans p WHERE p.key = v.key
);
