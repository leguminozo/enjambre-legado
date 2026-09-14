-- Migración 1017: Seeding default club_legado_settings y club_page_settings (idempotent)
-- Permite editar el bloque del Club Legado en el Home y la página /club-legado-del-bosque desde Núcleo CMS.

INSERT INTO site_content (section_key, item_order, content)
SELECT 'club_legado_settings', 0,
'{
  "kicker": "Club Legado del Bosque",
  "kicker_en": "Forest Legacy Club",
  "title": "Custodia y recolecciones de temporada",
  "title_en": "Seasonal custody and harvests",
  "subtitle": "Como miembro acreditado, accede a las floraciones limitadas del Predio Pureo: ulmo, tiaca y quillay con trazabilidad de colmena y cata de origen.",
  "subtitle_en": "As an accredited member, access limited blooms from Predio Pureo: ulmo, tiaca and quillay with hive traceability and origin tasting.",
  "button_text": "Unirme al Club",
  "button_text_en": "Join the Club",
  "button_href": "/club-legado-del-bosque"
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'club_legado_settings');

INSERT INTO site_content (section_key, item_order, content)
SELECT 'club_page_settings', 0,
'{
  "hero_title": "Club Legado del Bosque",
  "hero_title_en": "Forest Legacy Club",
  "hero_subtitle": "Al registrarte en la tienda formas parte del Club Legado del Bosque. Desde aquí accedes a suscripciones de reposición recurrente y reservas anticipadas de las próximas recolecciones de miel nativa.",
  "hero_subtitle_en": "By registering in the store you become part of the Forest Legacy Club. From here you can access replenishment subscriptions and advance reservations for upcoming native honey harvests.",
  "how_it_works_title": "Cómo funciona",
  "how_it_works_title_en": "How it works",
  "step1_text": "Al registrarte en la tienda formas parte activa del Club Legado del Bosque como guardián acreditado.",
  "step1_text_en": "By registering in the store you actively join the Forest Legacy Club as an accredited guardian.",
  "step2_text": "Eliges tu suscripción de reposición recurrente o reservas tu cupo para las próximas recolecciones de temporada (Ulmo, Tiaca, Quillay o selección trimestral).",
  "step2_text_en": "Choose your recurring replenishment subscription or reserve your spot for the next seasonal harvests (Ulmo, Tiaca, Quillay or quarterly selection).",
  "step3_text": "En la ventana de recolección preparamos tu entrega con el lote directo del Predio Pureo, acompañado de pasaporte de origen y trazabilidad de colmena.",
  "step3_text_en": "During the harvest window we prepare your delivery with a batch directly from Predio Pureo, accompanied by origin passport and hive traceability.",
  "step4_text": "Puedes pagar como reserva única o activar tu suscripción recurrente para despreocuparte.",
  "step4_text_en": "You can pay as a single reservation or activate your recurring subscription for peace of mind.",
  "custodia_badge": "Custodia Territorial Activa",
  "custodia_badge_en": "Active Territorial Custody",
  "custodia_title": "Cada membresía financia el bosque que nos sobrevivirá",
  "custodia_title_en": "Every membership funds the forest that will outlive us",
  "custodia_text": "Al suscribirte a una recolección del Club, tu aporte financia directamente la siembra, cuidado y censo de árboles nativos en los predios apícolas de Chiloé. La apicultura no extrae: devuelve vida al bosque valdiviano.",
  "custodia_text_en": "By subscribing to a Club harvest, your contribution directly finances planting, tending, and census of native trees in Chiloé apiary sectors. Beekeeping does not extract: it restores life to the Valdivian rainforest."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'club_page_settings');
