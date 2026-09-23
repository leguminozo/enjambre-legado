-- Migración 1022: Actualización de textos por defecto para Club Legado hacia membresía de cliente, privilegios y poder silencioso
-- Idempotente: actualiza filas existentes si conservan los defaults anteriores e inserta si no existían.

-- 1. club_legado_settings
UPDATE site_content
SET content = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        content,
        '{title}',
        '"Membresía y privilegios de cliente"'
      ),
      '{title_en}',
      '"Membership and client privileges"'
    ),
    '{subtitle}',
    '"Al registrarte en la tienda formas parte del Club Legado. Una cuenta personal que activa beneficios exclusivos: reposición a tu ritmo, acceso preferente a reservas y microlotes, retorno de frascos con saldo a favor y trazabilidad de origen en cada entrega."'
  ),
  '{subtitle_en}',
  '"By registering in the store you join the Legacy Club. A personal account unlocking exclusive perks: flexible replenishment, priority reservations, jar return store credits, and verified origin traceability."'
)
WHERE section_key = 'club_legado_settings'
  AND (content->>'title' = 'Vínculo y recolecciones de temporada' OR content->>'title' IS NULL);

INSERT INTO site_content (section_key, item_order, content)
SELECT 'club_legado_settings', 0,
'{
  "kicker": "Club Legado del Bosque",
  "kicker_en": "Forest Legacy Club",
  "title": "Membresía y privilegios de cliente",
  "title_en": "Membership and client privileges",
  "subtitle": "Al registrarte en la tienda formas parte del Club Legado. Una cuenta personal que activa beneficios exclusivos: reposición a tu ritmo, acceso preferente a reservas y microlotes, retorno de frascos con saldo a favor y trazabilidad de origen en cada entrega.",
  "subtitle_en": "By registering in the store you join the Legacy Club. A personal account unlocking exclusive perks: flexible replenishment, priority reservations, jar return store credits, and verified origin traceability.",
  "button_text": "Unirme al Club",
  "button_text_en": "Join the Club",
  "button_href": "/club-legado-del-bosque"
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'club_legado_settings');

-- 2. club_page_settings
UPDATE site_content
SET content = content || '{
  "hero_kicker": "Club Legado del Bosque",
  "hero_kicker_en": "Forest Legacy Club",
  "hero_badge": "Membresía de Cliente",
  "hero_badge_en": "Client Membership",
  "hero_subtitle": "Al registrarte en la tienda formas parte del Club Legado del Bosque. Tu cuenta activa un universo dedicado de privilegios: reposición periódica a tu medida, acceso prioritario a ediciones limitadas, trazabilidad botánica de cada frasco e invitaciones a catas privadas de autor.",
  "hero_subtitle_en": "By registering in the store you become part of the Forest Legacy Club. Your account unlocks a dedicated universe of privileges: flexible replenishment, priority reservations, botanical traceability, and invitations to private author tastings.",
  "hero_cta_label": "Unirme al Club",
  "hero_cta_label_en": "Join the Club",
  "hero_cta_href": "/perfil",
  "hero_secondary_label": "Explorar privilegios",
  "hero_secondary_label_en": "Explore privileges",
  "hero_secondary_href": "#beneficios",
  "step1_text": "Registro libre en la tienda: Al crear tu cuenta quedas acreditado automáticamente en el Club Legado del Bosque, sin costos de membresía ni permanencias forzadas.",
  "step1_text_en": "Free store registration: By creating your account you automatically join the Forest Legacy Club with no fees or lock-ins.",
  "step2_text": "Reposición y reservas a tu medida: Configura entregas periódicas para tus variedades favoritas a tu propio ritmo, o asegura cupos preferentes en floraciones limitadas.",
  "step2_text_en": "Replenishment and reservations tailored to you: Set periodic deliveries for your favorite honeys at your own pace, or secure priority spots in limited seasonal blooms.",
  "step3_text": "Entrega directa con pasaporte de lote: Cada frasco llega directamente desde Chiloé acompañado de su pasaporte digital, análisis de laboratorio y relato de colmena.",
  "step3_text_en": "Direct delivery with batch passport: Every jar arrives directly from Chiloé accompanied by its digital passport, lab analysis, and hive narrative.",
  "step4_text": "Beneficios acumulables y economía circular: Suma ciclos de lealtad en cada compra, retorna tus frascos limpios con saldo a favor en tu cuenta y accede a catas privadas de autor.",
  "step4_text_en": "Accumulated benefits and circular economy: Earn loyalty cycles with each order, return clean jars for store credit, and enjoy invitations to private author tastings.",
  "custodia_badge": "Presencia Territorial y Origen",
  "custodia_badge_en": "Territorial Presence and Origin",
  "custodia_title": "Apiarios propios en el bosque templado de Chiloé",
  "custodia_title_en": "Dedicated apiaries in the temperate rainforest of Chiloé",
  "custodia_text": "Cada miel de La Obrera y el Zángano proviene exclusivamente de apiarios emplazados en el bosque nativo de Chiloé. Ser miembro del Club te conecta directamente con este territorio: sin intermediarios, con trazabilidad botánica y respeto absoluto por los ciclos naturales de la colmena.",
  "custodia_text_en": "Every honey from La Obrera y el Zángano originates exclusively from our own apiaries in the native forest of Chiloé. Joining the Club connects you directly with this territory: no middlemen, full botanical traceability, and absolute respect for natural hive cycles.",
  "tiers_title": "Cuatro ciclos de permanencia y reciprocidad",
  "tiers_title_en": "Four cycles of permanence and reciprocity",
  "tiers_subtitle": "En el bosque austral la lealtad es un círculo vivo. Cada entrega recibida, cada frasco retornado y cada año de permanencia suma ciclos que profundizan tu vínculo con los apiarios.",
  "tiers_subtitle_en": "In the southern forest loyalty is a living circle. Each delivery, returned jar, and year of permanence adds cycles that deepen your bond with our apiaries."
}'::jsonb
WHERE section_key = 'club_page_settings'
  AND (
    content->>'custodia_title' = 'Cada membresía financia el bosque que nos sobrevivirá'
    OR content->>'hero_badge' = 'Recolección Estacional Activa'
    OR content->>'custodia_badge' = 'Presencia Territorial Activa'
    OR content->>'custodia_badge' = 'Vínculo Territorial Activo'
  );

INSERT INTO site_content (section_key, item_order, content)
SELECT 'club_page_settings', 0,
'{
  "hero_title": "Club Legado del Bosque",
  "hero_title_en": "Forest Legacy Club",
  "hero_kicker": "Club Legado del Bosque",
  "hero_kicker_en": "Forest Legacy Club",
  "hero_badge": "Membresía de Cliente",
  "hero_badge_en": "Client Membership",
  "hero_subtitle": "Al registrarte en la tienda formas parte del Club Legado del Bosque. Tu cuenta activa un universo dedicado de privilegios: reposición periódica a tu medida, acceso prioritario a ediciones limitadas, trazabilidad botánica de cada frasco e invitaciones a catas privadas de autor.",
  "hero_subtitle_en": "By registering in the store you become part of the Forest Legacy Club. Your account unlocks a dedicated universe of privileges: flexible replenishment, priority reservations, botanical traceability, and invitations to private author tastings.",
  "hero_cta_label": "Unirme al Club",
  "hero_cta_label_en": "Join the Club",
  "hero_cta_href": "/perfil",
  "hero_secondary_label": "Explorar privilegios",
  "hero_secondary_label_en": "Explore privileges",
  "hero_secondary_href": "#beneficios",
  "how_it_works_title": "Cómo funciona",
  "how_it_works_title_en": "How it works",
  "step1_text": "Registro libre en la tienda: Al crear tu cuenta quedas acreditado automáticamente en el Club Legado del Bosque, sin costos de membresía ni permanencias forzadas.",
  "step1_text_en": "Free store registration: By creating your account you automatically join the Forest Legacy Club with no fees or lock-ins.",
  "step2_text": "Reposición y reservas a tu medida: Configura entregas periódicas para tus variedades favoritas a tu propio ritmo, o asegura cupos preferentes en floraciones limitadas.",
  "step2_text_en": "Replenishment and reservations tailored to you: Set periodic deliveries for your favorite honeys at your own pace, or secure priority spots in limited seasonal blooms.",
  "step3_text": "Entrega directa con pasaporte de lote: Cada frasco llega directamente desde Chiloé acompañado de su pasaporte digital, análisis de laboratorio y relato de colmena.",
  "step3_text_en": "Direct delivery with batch passport: Every jar arrives directly from Chiloé accompanied by its digital passport, lab analysis, and hive narrative.",
  "step4_text": "Beneficios acumulables y economía circular: Suma ciclos de lealtad en cada compra, retorna tus frascos limpios con saldo a favor en tu cuenta y accede a catas privadas de autor.",
  "step4_text_en": "Accumulated benefits and circular economy: Earn loyalty cycles with each order, return clean jars for store credit, and enjoy invitations to private author tastings.",
  "custodia_badge": "Presencia Territorial y Origen",
  "custodia_badge_en": "Territorial Presence and Origin",
  "custodia_title": "Apiarios propios en el bosque templado de Chiloé",
  "custodia_title_en": "Dedicated apiaries in the temperate rainforest of Chiloé",
  "custodia_text": "Cada miel de La Obrera y el Zángano proviene exclusivamente de apiarios emplazados en el bosque nativo de Chiloé. Ser miembro del Club te conecta directamente con este territorio: sin intermediarios, con trazabilidad botánica y respeto absoluto por los ciclos naturales de la colmena.",
  "custodia_text_en": "Every honey from La Obrera y el Zángano originates exclusively from our own apiaries in the native forest of Chiloé. Joining the Club connects you directly with this territory: no middlemen, full botanical traceability, and absolute respect for natural hive cycles.",
  "tiers_title": "Cuatro ciclos de permanencia y reciprocidad",
  "tiers_title_en": "Four cycles of permanence and reciprocity",
  "tiers_subtitle": "En el bosque austral la lealtad es un círculo vivo. Cada entrega recibida, cada frasco retornado y cada año de permanencia suma ciclos que profundizan tu vínculo con los apiarios.",
  "tiers_subtitle_en": "In the southern forest loyalty is a living circle. Each delivery, returned jar, and year of permanence adds cycles that deepen your bond with our apiaries."
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM site_content WHERE section_key = 'club_page_settings');
