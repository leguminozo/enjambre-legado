-- Migración 20261018160000: Actualización canónica de b2b_hoteles en site_content.
-- Implementa la Auditoría Científica, Formulación Bioactiva y Arquitectura Comercial B2B para Hospitalidad de Lujo:
-- 1. Estandarización absoluta en 2 Calibres: 25 g (Vector de Experiencia) y 150 g (Vector de Conversión Retail Cabin-Safe).
-- 2. Eliminación de formatos dispersos (baldes 5 kg, panales 2 kg, potes 500 g).
-- 3. Matriz Cuádruple Bioactiva: Ulmo Puro APF, Avellana Chilena Omega-7, Polen Floral Biomimético y Cacao Nibs Santander Trail Fuel.
-- 4. Modelo Financiero de Costo Neto Cero: 2 Kits Piloto a 30 Días (Ritual & Cata $168.000 y Ecosistema Circular $295.000).
-- 5. Resolución de la Paradoja Aeronáutica: Envase 150 g calibrado a Net Vol. 98 ml / 3.3 fl oz (Cabin & TSA Approved).
-- 6. Concierge B2B de Guante Blanco con Caja Científica de Criterio para Gerentes Generales y Directores de A&B.

DO $$
DECLARE
  v_content jsonb := $json$
{
  "slug": "hoteles",
  "tipo": "hotel",
  "kicker": "ALIANZAS B2B · HOSPITALIDAD DE AUTOR & LODGES",
  "kicker_en": "B2B ALLIANCES · BOUTIQUE HOSPITALITY & LODGES",
  "headline": "Bio-Gastronomía del Bosque Lluvioso de Chiloé (42°S) para Hotelería de Autor",
  "headline_en": "Rainforest Bio-Gastronomy from Chiloé (42°S) for Signature Hospitality",
  "subheadline": "Sistema modular en calibres de 25 g (Amenidad & Cata en Mesa) y 150 g (Reserva de Recepción Cabin-Safe). Cuatro formulaciones bioactivas certificadas bajo norma NCh2981 que transforman el gasto de hospitalidad en retorno retail auto-liquidable.",
  "subheadline_en": "Modular system in 25 g (Amenity & Table Tasting Flight) and 150 g (Cabin-Safe Lobby Reserve) formats. Four bioactive matrices certified under NCh2981 transforming hospitality expenses into self-liquidating retail return.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp",
  "suggested_products_copy": "MATRIZ CUÁDRUPLE BIOACTIVA. Disponibles exclusivamente en Calibre 25 g (Amenidad & Cata en Mesa) y Calibre 150 g (Reserva de Recepción Cabin-Safe). Cuatro sinergias botánicas de Chiloé (42°S) diseñadas para turndown service, catas en desayuno y expediciones.",
  "suggested_products_copy_en": "QUADRUPLE BIOACTIVE MATRIX. Exclusively available in 25 g (Amenity & Table Tasting Flight) and 150 g (Cabin-Safe Lobby Reserve) calibres. Four botanical synergies from Chiloé (42°S) designed for turndown service, breakfast tastings, and field expeditions.",
  "cta_text": "Solicitar Caja Científica de Criterio",
  "cta_text_en": "Request Scientific Criterion Sample Box",
  "cta_href": "#registro",
  "value_props": [
    {
      "icon": "ShieldCheck",
      "title": "Bioactividad Fenólica frente al Paradigma Manuka",
      "description": "Potencia biológica certificada Active Patagonia Factor (APF) respaldada por investigaciones de la PUC. Extracto fenólico rico en flavonoides y bactericida natural bajo norma NCh2981 (>45% polen monofloral), con cremado en frío (<20 µm) para textura untable sin goteo."
    },
    {
      "icon": "Layers",
      "title": "Calibres 25 g / 150 g & Resolución Aeronáutica",
      "description": "El formato 25 g resuelve con elegancia el turndown service y la cata en mesa sin mermas. El formato de 150 g está calibrado a Net Vol. 98 ml (3.3 fl oz · Cabin & TSA Approved) para que el huésped internacional lo lleve en su equipaje de mano sin retención aeroportuaria."
    },
    {
      "icon": "TrendingUp",
      "title": "Modelo Financiero de Costo Neto Cero",
      "description": "Erradicamos la falacia de prometer margen sobre amenidades de cortesía. En el Kit Piloto II, la comercialización de 28 frascos de 150 g en recepción recauda $336.000 CLP netos, amortizando el 100% de la factura del hotel y liberando 80 experiencias de habitación a costo cero."
    },
    {
      "icon": "QrCode",
      "title": "Rigor Analítico & Trazabilidad de Lote",
      "description": "Cada pieza enlaza al informe de laboratorio oficial por lote: actividad de agua aw < 0.60, humedad < 18%, coordenadas exactas del apiario en Pureo (42°53'S) y perfil de compuestos bioactivos dominantes en formato bilingüe."
    }
  ],
  "stats": [
    { "value": "25 g", "label": "Vector de Experiencia (Turndown & Mesa)" },
    { "value": "150 g", "label": "Cabin-Safe (TSA & OACI 98 ml)" },
    { "value": "$0 CLP", "label": "Costo Neto Final (Auto-Liquidable)" },
    { "value": "NCh2981", "label": "Pureza Monofloral Certificada (>45%)" }
  ],
  "process": [
    {
      "step": "01",
      "title": "25 g — Vector de Experiencia en Habitación & Mesa",
      "desc": "Servicio nocturno de apertura de cama (turndown ritual), cata horizontal en regleta de madera nativa para desayuno y combustible de bolsillo para excursiones."
    },
    {
      "step": "02",
      "title": "150 g — Vector de Conversión Retail Cabin-Safe",
      "desc": "Exhibición en el glorificador de recepción. Formato de reserva calibrado a 98 ml para cruzar controles de rayos X aeroportuarios en equipaje de cabina."
    },
    {
      "step": "03",
      "title": "Costo Neto Cero — Auto-Liquidación de Factura",
      "desc": "La venta de los 28 frascos de 150 g en el checkout recauda $336.000 netos, cubriendo los $295.000 de toda la factura y entregando $41.000 de utilidad más 80 amenidades gratuitas."
    }
  ],
  "faq": [
    {
      "question": "¿Cómo resuelve el envase de 150 g la restricción de líquidos y geles en vuelos internacionales?",
      "answer": "Debido a que la miel tiene una densidad de ~1,42 g/ml, 150 g superan los 100 ml de capacidad máxima permitida por TSA, DGAC y OACI. Para garantizar el libre tránsito de los huéspedes que vuelan desde Mocopulli o Tepual, nuestra línea hotelera calibra el llenado a Net Vol. 98 ml (3.3 fl oz) con certificación impresa frontal Cabin & TSA Approved, o incorpora el estuche tubular rígido Jet-Safe para equipaje facturado."
    },
    {
      "question": "¿Por qué la miel de Ulmo de Chiloé supera en criterio científico al referente de Manuka?",
      "answer": "A diferencia del metilglioxal (MGO) de la Manuka neozelandesa, la potencia biológica de la miel de Ulmo (cuantificada bajo factor APF) radica en la sinergia de su extracto fenólico tisular específico y la liberación enzimática de peróxido de hidrógeno. Investigaciones de la PUC demuestran halos de inhibición frente a E. coli y S. aureus superiores a antibióticos sintéticos, cumpliendo la norma oficial NCh2981 con más del 45% de dominancia polínica."
    },
    {
      "question": "¿Cómo se evita la separación de fases o rancidez en la Miel con Avellana Chilena?",
      "answer": "Aplicamos el estándar reológico de Liedl y Rowe: molienda micronizada donde más del 90% de las partículas es menor a 40 µm, inactivación térmica de la lipoxigenasa y control estricto de la actividad de agua en aw 0,45 (zona segura entre oxidación lipídica y límite microbiológico), suspendida en una matriz tixotrópica cremada en frío que no se separa durante más de 180 días."
    },
    {
      "question": "¿Cómo se solicita la Caja Científica de Criterio antes de emitir una orden de compra?",
      "answer": "A través de nuestro Concierge B2B en esta página. Despachamos a Gerentes Generales y Directores de A&B una caja ejecutiva con las 4 variedades en 25 g, 1 frasco de 150 g, el certificado melisopalinológico NCh2981 del lote vigente y la ficha de rentabilidad circular, sin costo de producto y coordinada en menos de 2 horas hábiles."
    }
  ],
  "commercial_strategy": {
    "titulo": "Modelo Financiero de Costo Neto Cero: Auto-Liquidación de Amenidades",
    "titulo_en": "Zero Net Cost Financial Model: Self-Liquidating Amenities",
    "bajada": "La comercialización en la vitrina de recepción de tan solo 28 frascos de 150 g Cabin-Safe financia el 100% de la factura del hotel y genera un excedente líquido inmediato, entregando 80 experiencias de cortesía con costo neto cero.",
    "aumento_ticket": "Recaudación neta de $336.000 CLP en recepción (28 uds. x $12.000 neto), amortizando la factura completa de $295.000 CLP con +$41.000 CLP de utilidad líquida.",
    "herramienta_clave": "Glorificador de Mesón de Checkout, Pasaportes de Habitación Bilingües & Frascos Cabin-Safe 98 ml",
    "mecanica_ventas": [
      "Paso 1: Disposición del frasco de 25 g en turndown nocturno o mesa de desayuno junto a su Pasaporte Botánico bilingüe.",
      "Paso 2: El huésped valida la textura sedosa y la bioactividad del lote, descubriendo que la miel no gotea ni empalaga.",
      "Paso 3: El pasaporte indica explícitamente que la reserva de 150 g (calibrada para cabina de avión) está disponible en recepción.",
      "Paso 4: En el checkout, el glorificador de mesón permite al huésped llevarse la reserva como recuerdo de viaje, amortizando la factura total del hotel."
    ]
  },
  "molecular_pairings": [
    {
      "id": "miel-cruda-pura-ulmo",
      "nombre": "Miel Cruda Pura de Ulmo & Tiaca (42°S)",
      "subtitulo": "Factor APF · Extracto Fenólico Tisular Bactericida",
      "formato": "25 g (Amenidad / Turndown) · 150 g (Reserva de Recepción Cabin-Safe)",
      "perfil_sensorial": "Miel monofloral de Eucryphia cordifolia cremada en frío (<20 µm). Textura sedosa sin goteo, notas de jazmín blanco, anís estrella, sutil fondo mentolado y frescor balsámico.",
      "perfil_bioquimico": "Extracto fenólico tisular activo rico en flavonoides y liberación enzimática de peróxido de hidrógeno. Certificación NCh2981 (>45% polen de Ulmo). Halos de inhibición bacteriana frente a E. coli y S. aureus superiores a penicilina y estreptomicina.",
      "par_en_barra": "Ritual Nocturno (Turndown Service) & Tinas de Inmersión: Acompañamiento junto a infusión herbal tibia antes del descanso para inducir relajación y protección tisular.",
      "neurogastronomia": "La glucosa de asimilación controlada optimiza los depósitos de glucógeno hepático durante el sueño, mientras los aromas volátiles balsámicos activan respuestas neurosensoriales de calma.",
      "badge": "Matriz 01 · Pureza & Ritual Nocturno",
      "badge_bioquimico": "Factor APF Certificado"
    },
    {
      "id": "miel-avellana-chilena-gevuina",
      "nombre": "Miel con Avellana Chilena Tostada (Gevuina avellana)",
      "subtitulo": "Ácido Palmitoleico C16:1 ω-7 (17–27%) · Reología Micronizada",
      "formato": "25 g (Cata en Desayuno) · 150 g (Boutique Lobby Cabin-Safe)",
      "perfil_sensorial": "Emulsión untable de miel cruda y avellana chilena silvestre recién tostada. Notas cálidas de praliné nativo, madera noble tostada y un fondo envolvente de toffee natural.",
      "perfil_bioquimico": "70% a 81% de ácidos grasos insaturados con alta concentración de ácido palmitoleico (omega-7) para regeneración de membranas mucosas. Molienda micronizada (<40 µm) y aw estabilizada en 0,45 para inhibir autoxidación lipídica sin separación de fases.",
      "par_en_barra": "Gastronomía Matinal & Cata de Mesa: Untable de lujo para pan de masa madre, quesos maduros y yogurt artesanal en desayunos de autor.",
      "neurogastronomia": "Los ácidos grasos omega-7 y tocoferoles interactúan con las papilas gustativas aportando untuosidad rica (mouthfeel) sin pesadez grasa, balanceando notas lácteas y ácidas.",
      "badge": "Matriz 02 · Gastronomía Matinal",
      "badge_bioquimico": "Omega-7 & Tocoferoles"
    },
    {
      "id": "miel-polen-floral-apicola",
      "nombre": "Miel con Polen Floral Apícola Nativo",
      "subtitulo": "Ruptura Osmótica de la Exina · 28% Proteína & Minerales",
      "formato": "25 g (Estación Bienestar) · 150 g (Boutique Lobby Cabin-Safe)",
      "perfil_sensorial": "Miel cruda con microgránulos de polen floral en suspensión biomimética. Textura perlada y aterciopelada, notas florales silvestres, cereal tostado y umami dulce.",
      "perfil_bioquimico": "Maceración osmótica que replica el proceso natural del pan de abeja, debilitando la pared de exina para superar el límite del 62% de digestibilidad del polen seco. Humedad < 18% y aw < 0,60 para impedir fermentaciones osmofílicas indeseadas.",
      "par_en_barra": "Tónico de Inmunidad & Despertar: Consumo directo en ayunas o estación de bienestar del spa para nutrición celular antes de iniciar la jornada.",
      "neurogastronomia": "La biodisponibilidad mineral (K, Mg, Cu, Ca, Fe, Zn) y aminoácidos libres estimulan receptores de vitalidad celular y proveen saciedad limpia sin picos glucémicos.",
      "badge": "Matriz 03 · Vitalidad & Spa",
      "badge_bioquimico": "Exina Biomimética"
    },
    {
      "id": "miel-cacao-nibs-santander",
      "nombre": "Miel con Cacao Nibs de Santander (7°N × 42°S)",
      "subtitulo": "Diálogo Latitudinal · Teobromina & Flavan-3-oles Ergogénicos",
      "formato": "25 g (Trail Fuel de Excursión) · 150 g (Boutique Lobby Cabin-Safe)",
      "perfil_sensorial": "Miel del bosque templado combinada con nibs tostados de cacao criollo/trinitario de Santander. Contraste de texturas (cremosa y crujiente), notas de frutos rojos, mora silvestre y chocolate noble.",
      "perfil_bioquimico": "Matriz lipídica sólida de manteca de cacao que impermeabiliza el fragmento impidiendo que se ablande. Alta densidad de teobromina (estimulante y vasodilatador periférico suave) y catequinas antioxidantes.",
      "par_en_barra": "Combustible Pre-Excursión (Trail Fuel): Amenidad de bolsillo entregada al huésped antes de travesías en kayak por fiordos, cabalgatas o caminatas en el bosque lluvioso.",
      "neurogastronomia": "La teobromina induce vasodilatación periférica y mejora la oxigenación muscular sin la vasoconstricción ni la taquicardia asociada a dosis altas de cafeína.",
      "badge": "Matriz 04 · Excursión & Deporte",
      "badge_bioquimico": "Teobromina & Bioenergía"
    }
  ],
  "kits": [
    {
      "id": "kit-piloto-i-ritual-cata",
      "nombre": "Kit Piloto I: Ritual & Cata Horizontal",
      "badge": "Tracción Operativa · Solo 25 g",
      "tier": "entrada",
      "tagline": "Validación de experiencia del huésped en turndown, excursiones y desayuno VIP sin compromiso de tienda",
      "descripcion": "Dotación concentrada de 120 amenidades de 25 g distribuidas equilibradamente en las cuatro formulaciones bioactivas, complementadas con 3 regletas de cata en madera nativa, pasaportes bilingües y protocolo de servicio.",
      "precio_neto_clp": 168000,
      "pvp_estimado_clp": 280000,
      "margen_estimado_pct": 40,
      "moq_summary": "120 piezas 25 g + 3 regletas cata + 60 pasaportes",
      "sales_strategy": "Costo por habitación ocupada de apenas $1.400 CLP (~$1,50 USD), una fracción marginal frente al costo laboral de $9 USD de un turndown de lujo en lodges que cobran más de $500 USD por noche.",
      "componentes_fisicos": [
        { "cantidad": "120 un.", "item": "Mini Frascos de Cortesía 25 g", "detalle": "30× Ulmo Puro APF, 30× Avellana Chilena ω-7, 30× Polen Biomimético, 30× Cacao Nibs Santander" },
        { "cantidad": "3 un.", "item": "Regletas de Cata Horizontal", "detalle": "Madera nativa cepillada con 4 cavidades calibradas para Tasting Flights en suites o salón" },
        { "cantidad": "60 un.", "item": "Pasaportes Botánicos A6", "detalle": "Papel algodón bilingüe (ES/EN) con relato bioactivo del bosque a 42°S y QR de trazabilidad" },
        { "cantidad": "1 un.", "item": "Protocolo Técnico de Servicio", "detalle": "Ficha impermeable de 1 página para garzones y housekeeping con temperaturas y maridajes" }
      ],
      "herramientas_servicio": [
        "3 Regletas de cata horizontal en madera nativa para Tasting Flights",
        "Protocolo técnico plastificado para equipo de sala y camareras",
        "Guía de servicio para turndown nocturno e infusiones de autor"
      ],
      "materiales_exhibicion": [
        "60 Pasaportes Botánicos de Habitación A6 en papel algodón",
        "Atriles de mesa minimalistas para desayuno",
        "Certificado analítico NCh2981 del lote vigente enmarcable"
      ],
      "integraciones_digitales": [
        { "titulo": "Cata Sensorial Bilingüe en Suite", "descripcion": "El huésped escanea el QR del frasco y explora la curva aromática y el factor APF.", "tag": "trazabilidad" },
        { "titulo": "Trazabilidad Oficial NCh2981", "descripcion": "Informe melisopalinológico y análisis de pureza descargable.", "tag": "marketing" }
      ],
      "recomendado_para": "Directores de Alimentos & Bebidas y Gobernanta que buscan validar la respuesta sensorial de sus huéspedes con riesgo cero de inventario."
    },
    {
      "id": "kit-piloto-ii-ecosistema-circular",
      "nombre": "Kit Piloto II: Ecosistema Circular Auto-Liquidable",
      "badge": "Costo Neto Cero · 25 g + 150 g",
      "tier": "avanzado",
      "tagline": "Financiar el 100% de las amenidades de cortesía mediante la venta del formato 150 g en recepción",
      "descripcion": "Ecosistema comercial cerrado: combina 80 frascos de 25 g para bienvenidas y catas con 28 frascos de 150 g Cabin-Safe para vitrina de checkout. La venta de los 28 frascos de 150 g recauda $336.000 netos, recuperando el 100% de la factura del hotel y generando $41.000 netos de excedente más 80 amenidades gratuitas.",
      "precio_neto_clp": 295000,
      "pvp_estimado_clp": 479840,
      "margen_estimado_pct": 38,
      "moq_summary": "80 piezas 25 g + 28 frascos 150 g + glorificador",
      "sales_strategy": "Inversión neta: $295.000 CLP. Venta de 28 frascos de 150 g a PVP $14.280 IVA inc. ($12.000 neto): recauda $336.000 netos. Amortiza el 100% de la factura ($295.000), genera +$41.000 CLP de utilidad líquida y 80 amenidades de 25 g resultan 100% gratuitas.",
      "componentes_fisicos": [
        { "cantidad": "80 un.", "item": "Piezas de Cortesía 25 g", "detalle": "20× Ulmo Puro APF, 20× Avellana ω-7, 20× Polen, 20× Cacao Nibs" },
        { "cantidad": "28 un.", "item": "Reserva de Recepción 150 g (Cabin-Safe)", "detalle": "7× Ulmo Puro, 7× Avellana ω-7, 7× Polen, 7× Cacao Nibs (Net Vol. 98 ml TSA Approved)" },
        { "cantidad": "1 un.", "item": "Glorificador Minimalista de Recepción", "detalle": "Exhibidor de mesón para las 4 variedades de 150 g con frascos probadores de aroma" },
        { "cantidad": "2 un.", "item": "Regletas de Cata Horizontal", "detalle": "Para servicio de desayuno en mesa y suites preferentes" },
        { "cantidad": "80 un.", "item": "Pasaportes Botánicos de Habitación", "detalle": "Con llamado explícito al huésped a adquirir la reserva de 150 g en recepción antes de su vuelo" }
      ],
      "herramientas_servicio": [
        "1 Glorificador minimalista de lobby para mesón de recepción y checkout",
        "2 Regletas de cata horizontal en madera nativa para desayuno VIP",
        "Briefing Card rígida e impermeable para personal de recepción y salón"
      ],
      "materiales_exhibicion": [
        "80 Pasaportes Botánicos A6 bilingües con invitación a boutique de recepción",
        "Frascos probadores tester de 150 g para mesón de checkout",
        "Lámina enmarcable de certificación melisopalinológica de origen"
      ],
      "integraciones_digitales": [
        { "titulo": "Conversión Cruzada Suite a Recepción", "descripcion": "Pasaporte de habitación con QR que invita a retirar la reserva de 150 g antes del vuelo.", "tag": "marketing" },
        { "titulo": "Certificación Cabin & TSA Approved", "descripcion": "Garantía volumétrica de 98 ml para tránsito aeroportuario sin decomiso.", "tag": "trazabilidad" },
        { "titulo": "Membresía Digital para Huéspedes", "descripcion": "Pase digital para Apple/Google Wallet con trazabilidad y beneficios en próximas visitas.", "tag": "fidelizacion" }
      ],
      "recomendado_para": "Gerentes Generales, Propietarios y Directores de Finanzas que exigen un retorno de inversión transparente e inmediato sin gasto muerto."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-pasaporte-habitacion",
      "package_name": "@enjambre/sale-qr",
      "titulo": "Pasaporte Botánico de Habitación A6 Bilingüe",
      "titulo_en": "Bilingual A6 Room Botanical Passport",
      "descripcion": "Pieza editorial impresa en papel algodón de 350 g con QR de detección automática de idioma (ES/EN). Explica en 3 líneas la bioactividad del lote e invita al huésped a retirar su reserva de 150 g en recepción.",
      "descripcion_en": "Fine editorial piece printed on 350 g cotton paper with auto-detect bilingual QR (EN/ES). Explains batch bioactivity and invites guests to collect their 150 g reserve at front desk.",
      "badge": "Activo Editorial de Suite",
      "beneficio_comercial": "Genera el puente de conversión directo entre el amenity gratuito de 25 g y la compra de impulso del frasco de 150 g en recepción.",
      "beneficio_comercial_en": "Creates a direct conversion bridge from the 25 g room amenity to the 150 g checkout purchase at reception."
    },
    {
      "id": "modulo-briefing-card",
      "package_name": "@enjambre/ui",
      "titulo": "Ficha de Criterio para Equipo de Salón (Staff Briefing Card)",
      "titulo_en": "Staff Briefing Card for Service Team",
      "descripcion": "Lámina rígida e impermeable para cocina y recepción con argumentos técnicos en 30 segundos: poder bactericida del Ulmo vs Manuka, omega-7 de la avellana y biodisponibilidad del polen.",
      "descripcion_en": "Rigid waterproof card for kitchen and front desk with 30-second technical talking points: Ulmo vs Manuka antibacterial power, hazelnut omega-7, and pollen bioavailability.",
      "badge": "Capacitación Operativa",
      "beneficio_comercial": "Entrega al personal argumentos de venta y servicio de alto nivel sin capacitaciones complejas.",
      "beneficio_comercial_en": "Equips floor staff with high-end storytelling and sales confidence without lengthy training."
    },
    {
      "id": "modulo-caja-criterio",
      "package_name": "@enjambre/pricing",
      "titulo": "Caja Científica de Criterio (Muestreo Ejecutivo)",
      "titulo_en": "Scientific Criterion Executive Sample Box",
      "descripcion": "Cofre de evaluación ejecutiva con las 4 formulaciones en 25 g, 1 frasco de reserva de 150 g, certificado melisopalinológico NCh2981 del lote vigente y dossier financiero circular.",
      "descripcion_en": "Executive tasting box containing the 4 formulations in 25 g, 1 150 g reserve jar, NCh2981 certificate of the active batch, and the circular financial model dossier.",
      "badge": "Herramienta de Cierre",
      "beneficio_comercial": "Permite al Gerente General y Chef Ejecutivo validar la textura y el rigor bioquímico antes de emitir la orden de compra.",
      "beneficio_comercial_en": "Enables General Managers and Executive Chefs to validate texture and biochemical rigor before issuing a purchase order."
    },
    {
      "id": "modulo-fiscal",
      "package_name": "@enjambre/fiscal",
      "titulo": "Facturación Electrónica DTE Automatizada con RUT Empresa",
      "titulo_en": "Automated Electronic DTE Invoicing with Corporate Tax ID",
      "descripcion": "Integración contable de emisión directa de facturas exentas y afectas a IVA 19%, órdenes de compra corporativas y despacho programado continuo.",
      "descripcion_en": "Direct accounting integration issuing electronic tax invoices with Chilean 19% VAT, corporate purchase orders, and scheduled replenishment.",
      "badge": "Operación Corporativa",
      "beneficio_comercial": "Simplifica los procesos de compras y finanzas del hotel con conciliación bancaria instantánea y despacho prioritario sin demoras.",
      "beneficio_comercial_en": "Streamlines procurement and hotel accounting with instant bank reconciliation and uninterrupted priority supply."
    }
  ],
  "seo_title": "Hospitalidad de Lujo & Bio-Gastronomía · Enjambre Legado",
  "seo_title_en": "Luxury Hospitality & Bio-Gastronomy · Enjambre Legado",
  "seo_description": "Bio-gastronomía del bosque lluvioso de Chiloé (42°S) para hotelería de autor y lodges. Sistema modular en 25g y 150g con modelo financiero de costo neto cero.",
  "seo_description_en": "Rainforest bio-gastronomy from Chiloé (42°S) for signature hospitality and luxury lodges. Modular 25g and 150g system with zero net cost financial model."
}
$json$::jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_hoteles') THEN
    UPDATE site_content
    SET content = v_content,
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_hoteles';
  ELSE
    INSERT INTO site_content (section_key, item_order, content, is_active, created_at, updated_at)
    VALUES ('b2b_hoteles', 0, v_content, true, NOW(), NOW());
  END IF;
END $$;
