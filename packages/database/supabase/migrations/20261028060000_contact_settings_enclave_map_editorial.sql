-- ─── Contact Settings: Enclave Territorial y Mapa Editorial en /contacto ───
-- Permite editar desde el Editor de Tienda (CMS) el bloque panorámico del
-- enclave en el bosque de Chiloé (ceja, título, bajada, coordenadas, mapa).

UPDATE public.site_content
SET content = jsonb_build_object(
  'show_whatsapp_float', COALESCE((content->>'show_whatsapp_float')::boolean, true),
  'whatsapp_e164', COALESCE(content->>'whatsapp_e164', '56940831358'),
  'whatsapp_prefill', COALESCE(content->>'whatsapp_prefill', 'Hola, vengo de la tienda La Obrera y el Zángano.'),
  'whatsapp_prefill_en', COALESCE(content->>'whatsapp_prefill_en', 'Hi, I am writing from the La Obrera y el Zángano store.'),
  'email', COALESCE(content->>'email', 'contacto@obrerayzangano.cl'),
  'phone_display', COALESCE(content->>'phone_display', '+56 9 4083 1358'),
  'address', COALESCE(content->>'address', 'Pureo rural km 8560, Queilén, Chiloé, Chile'),
  'address_en', COALESCE(content->>'address_en', 'Pureo rural km 8560, Queilén, Chiloé, Chile'),
  'hours', COALESCE(content->>'hours', 'Lun–Vie 10:00–18:00 (CL)'),
  'hours_en', COALESCE(content->>'hours_en', 'Mon–Fri 10:00–18:00 (CL)'),
  'text_align', COALESCE(content->>'text_align', 'left'),
  'show_map', COALESCE((content->>'show_map')::boolean, true),
  'map_eyebrow', COALESCE(content->>'map_eyebrow', 'Presencia en el Territorio'),
  'map_eyebrow_en', COALESCE(content->>'map_eyebrow_en', 'Presence in the Territory'),
  'map_title', COALESCE(content->>'map_title', 'Nuestro enclave en el bosque de Chiloé'),
  'map_title_en', COALESCE(content->>'map_title_en', 'Our enclave in the forest of Chiloé'),
  'map_description', COALESCE(content->>'map_description', 'Pureo rural km 8560, Queilén. Encuentro entre el bosque nativo y el canal de Queilén.'),
  'map_description_en', COALESCE(content->>'map_description_en', 'Pureo rural km 8560, Queilén. Where native forest meets the Queilén channel.'),
  'map_badge_label', COALESCE(content->>'map_badge_label', 'Pureo rural km 8560 · Queilén'),
  'map_badge_coords', COALESCE(content->>'map_badge_coords', '42°51''18"S 73°40''41"W'),
  'map_lat', COALESCE((content->>'map_lat')::numeric, -42.854935),
  'map_lng', COALESCE((content->>'map_lng')::numeric, -73.67796),
  'map_zoom', COALESCE((content->>'map_zoom')::integer, 14),
  'map_popup_tag', COALESCE(content->>'map_popup_tag', 'Apiario Central'),
  'map_popup_title', COALESCE(content->>'map_popup_title', 'La Obrera & el Zángano'),
  'map_popup_subtitle', COALESCE(content->>'map_popup_subtitle', 'Pureo rural km 8560 · Queilén, Chiloé'),
  'directions_url', COALESCE(content->>'directions_url', '')
)
WHERE section_key = 'contact_settings';
