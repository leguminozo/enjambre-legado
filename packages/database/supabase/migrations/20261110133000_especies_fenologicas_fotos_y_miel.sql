-- Migration 20261110133000: Fotos botánicas y perfil melífero de flora nativa de Chiloé
-- Enriquece el catálogo con fotografías de alta resolución de las flores y
-- notas melíferas de las mieles monoflorales asociadas.

ALTER TABLE public.especies_fenologicas
  ADD COLUMN IF NOT EXISTS perfil_melifero TEXT;

-- 1. Canelo (Drimys winteri)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'Flor sagrada de primavera temprana. Néctar floral especiado y abundante polen cremoso para multiplicación de colonias.',
  relevancia_apicola = 'mixta'
WHERE nombre_cientifico = 'Drimys winteri';

-- 2. Notro / Ciruelillo (Embothrium coccineum)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'Flor tubular carmesí de gran flujo de néctar en primavera. Detona el pico de postura de la reina tras el invierno.',
  relevancia_apicola = 'nectar'
WHERE nombre_cientifico = 'Embothrium coccineum';

-- 3. Ulmo (Eucryphia cordifolia)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'La reina melífera de Chiloé. Miel blanca aperlada, aroma penetrante a jazmín y anís, de textura mantecosa fina.',
  relevancia_apicola = 'nectar'
WHERE nombre_cientifico = 'Eucryphia cordifolia';

-- 4. Tiaca (Caldcluvia paniculata)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'Miel monofloral de color ámbar extra claro, cristalización aterciopelada y bouquet floral fresco con notas balsámicas.',
  relevancia_apicola = 'mixta'
WHERE nombre_cientifico = 'Caldcluvia paniculata';

-- 5. Arrayán (Luma apiculata)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'Floración estival aromática de cuatro pétalos blancos. Miel ámbar cálido con notas resinosas y leve persistencia amaderada.',
  relevancia_apicola = 'mixta'
WHERE nombre_cientifico = 'Luma apiculata';

-- 6. Luma (Amomyrtus luma)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'Flores blancas solitarias de sotobosque con denso néctar azucarado y polen amarillo dorado de alta digestibilidad.',
  relevancia_apicola = 'mixta'
WHERE nombre_cientifico = 'Amomyrtus luma';

-- 7. Tepú (Tepualia stipularis)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'Pinceles carmesí de turberas y ñadis. Miel de tonalidad cobriza rojiza con notas terrosas minerales y alta tixotropía.',
  relevancia_apicola = 'nectar'
WHERE nombre_cientifico = 'Tepualia stipularis';

-- 8. Tineo (Weinmannia trichosperma)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'Racimos cilíndricos de flores cremosas de montaña. Miel dorada limpia, de sabor suave y aroma a hierbas silvestres.',
  relevancia_apicola = 'mixta'
WHERE nombre_cientifico = 'Weinmannia trichosperma';

-- 9. Patagua (Myrceugenia planipes)
UPDATE public.especies_fenologicas
SET 
  foto_url = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
  perfil_melifero = 'Floración de ribera y humedales de hoja perenne. Néctar límpido de verano tardío que complementa las cosechas del bosque.',
  relevancia_apicola = 'mixta'
WHERE nombre_cientifico = 'Myrceugenia planipes';
