-- Migración 1023: Campos de opacidad de hero y bloques configurables para Club Legado
-- Idempotente: agrega defaults para hero_image_opacity y nuevos bloques si no existen.

UPDATE site_content
SET content = content || '{
  "hero_image_opacity": 35,
  "hero_cta_label": "Crear mi cuenta",
  "hero_cta_label_en": "Create account",
  "show_hero_card": true,
  "hero_card_kicker": "Club Legado",
  "hero_card_kicker_en": "Legacy Club",
  "hero_card_badge_top": "Membresía de Cliente",
  "hero_card_badge_top_en": "Client Membership",
  "hero_card_title": "Tu espacio reservado en el enjambre",
  "hero_card_title_en": "Your dedicated place in the swarm",
  "hero_card_text": "Al crear tu cuenta en la tienda accedes a reposición flexible a tu ritmo, reservas prioritarias de floraciones escasas, pasaporte botánico en cada entrega y retorno circular de frascos con saldo a favor.",
  "hero_card_text_en": "By creating your store account you access flexible replenishment at your pace, priority reservations for scarce blooms, a botanical passport with every delivery, and circular jar returns with store credit.",
  "hero_card_badge_bottom": "Registro Libre",
  "hero_card_badge_bottom_en": "Free Registration",
  "hero_card_link_label": "Ver 4 Ciclos →",
  "hero_card_link_label_en": "View 4 Cycles →",
  "hero_card_link_href": "#niveles",
  "show_beneficios": true,
  "beneficios_kicker": "Privilegios del Club",
  "beneficios_kicker_en": "Club Privileges",
  "beneficios_title": "Todas las posibilidades de ser parte del Club Legado",
  "beneficios_title_en": "All possibilities of joining the Legacy Club",
  "beneficios_subtitle": "El Club no impone cobros de entrada: al crear tu cuenta en la tienda accedes a una experiencia dedicada, diseñada para acompañar tu consumo consciente con rigor, comodidad y origen directo.",
  "beneficios_subtitle_en": "The Club imposes no membership fees: by creating your store account you access a dedicated experience designed to accompany your conscious consumption with rigor, ease, and direct origin.",
  "wallet_title": "Credencial de Guardián",
  "wallet_title_en": "Guardian Credential",
  "wallet_text": "Tu cuenta genera un QR personal y una credencial descargable con tus ciclos acumulados, sellos de temporada y acceso en ferias y encuentros del bosque.",
  "wallet_text_en": "Your account generates a personal QR and downloadable credential with your accumulated cycles, seasonal stamps, and access to forest gatherings and fairs.",
  "seasons_kicker": "Catálogo Estacional",
  "seasons_kicker_en": "Seasonal Catalog",
  "seasons_title": "Floraciones y Recolecciones de Temporada",
  "seasons_title_en": "Seasonal Blooms and Harvests",
  "seasons_subtitle": "Como miembro registrado, accedes a reservas anticipadas y suscripciones de reposición para las floraciones nativas a medida que maduran en las colmenas.",
  "seasons_subtitle_en": "As a registered member, you access early reservations and replenishment subscriptions for native blooms as they mature in the hives."
}'::jsonb
WHERE section_key = 'club_page_settings'
  AND (content->>'hero_image_opacity' IS NULL OR content->>'show_hero_card' IS NULL);
