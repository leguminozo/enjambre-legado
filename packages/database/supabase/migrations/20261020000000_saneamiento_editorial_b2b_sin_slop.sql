-- Migración 20261020000000: Saneamiento editorial canónico de los 5 segmentos B2B en site_content.
-- Elimina jerga pseudo-científica (TAS2Rs, T1R1/T1R3, reología tixotrópica, cleansing effect, comparaciones antibióticas ilegales).
-- Estandariza la voz editorial en poder silencioso, hospitalidad de autor y maridaje botánico sensorial fundamentado.
-- Elimina uso de términos prohibidos ('custodio') y alinea formatos canónicos (25g, 150g, 500g).

DO $$
BEGIN

  -- Actualizar b2b_cafeterias
  IF EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_cafeterias') THEN
    UPDATE site_content
    SET content = '{
  "slug": "cafeterias",
  "tipo": "cafeteria",
  "kicker": "ALIANZAS B2B · CAFETERÍAS DE ESPECIALIDAD & TOSTADURÍAS",
  "kicker_en": "B2B ALLIANCES · SPECIALTY COFFEE SHOPS & ROASTERIES",
  "headline": "El café de especialidad no se endulza en taza. Se acompaña en mesa.",
  "headline_en": "Specialty coffee is not sweetened in the cup. It is paired at the table.",
  "subheadline": "Cuatro cremas de miel cruda batida en frío recolectadas en el bosque nativo de Chiloé (42°S), presentadas en piezas individuales de 25 g para servicio en mesa y frascos de 150 g para venta en mostrador. Respaldo analítico de origen y margen comercial del 41% al 48% para tu barra.",
  "subheadline_en": "Four cold-churned raw honey creams harvested in the native forest of Chiloé (42°S), presented in 25 g individual table-service pieces and 150 g retail display jars. Analytical origin certification and 41% to 48% net margin for your coffee bar.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp",
  "suggested_products_copy": "Disponibles en Pieza de Mesa (25 g) y Reserva de Vitrina (150 g). Cuatro expresiones botánicas diseñadas para armonizar con el método de extracción y perfil de tueste de tu barra.",
  "suggested_products_copy_en": "Available in Table Tasting Pieces (25 g) and Display Reserve (150 g). Four botanical expressions crafted to harmonize with your brew method and roast profile.",
  "cta_text": "Activar Kit Piloto ($78.400 neto)",
  "cta_text_en": "Activate Pilot Kit ($78,400 net)",
  "cta_href": "#registro",
  "commercial_strategy": {
    "titulo": "Dinámica de Mesa & Venta en Vitrina",
    "titulo_en": "Table Experience and Retail Display Dynamics",
    "bajada": "El frasco de 25 g acompaña la cata en bandeja junto a la taza, activando por impulso la venta del frasco de 150 g en el mostrador.",
    "bajada_en": "The 25 g jar accompanies the tray tasting alongside the cup, driving impulse purchases of the 150 g jar at the register.",
    "aumento_ticket": "Upsell de $2.500–$2.900 en mesa & $9.500 PVP en vitrina",
    "aumento_ticket_en": "Table upsell of $2,500–$2,900 & $9,500 retail at checkout",
    "mecanica_ventas": [
      "Paso 1: Servicio en bandeja con pieza de 25 g y microespátula junto a la taza, preservando acidez y aromas florales.",
      "Paso 2: Cata en paladar antes o entre sorbos de espresso o filtrado, disfrutando el contrapunto botánico.",
      "Paso 3: Degustaciones ágiles en mesón de pago con frascos Tester de 150 g bonificados.",
      "Paso 4: Venta de frascos de 150 g en vitrina con precio equivalente a una bolsa de café de 250 g."
    ],
    "herramienta_clave": "Código QR de Lote, Tarjeta A6 & Frascos Tester Bonificados",
    "herramienta_clave_en": "Batch QR Code, A6 Table Card & Free Tester Jars"
  },
  "molecular_pairings": [
    {
      "id": "miel-virgen-cruda-ulmo",
      "nombre": "Miel Virgen Cruda de Ulmo",
      "subtitulo": "Floración de Eucryphia cordifolia · Chiloé 42°S",
      "formato": "25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel monofloral de Ulmo batida en frío. Textura aterciopelada, notas de jazmín, anís estrella, sutil fondo mentolado y frescor balsámico.",
      "perfil_bioquimico": "Servicio en bandeja con microespátula fuera de la taza. Acompañamiento limpio que resalta los aromas florales sin alterar la acidez ni la temperatura de extracción.",
      "par_en_barra": "Cafés lavados de alta altitud y acidez limpia (Etiopía Yirgacheffe, Kenia Nyeri, Colombia Huila).",
      "neurogastronomia": "La microdosis en espátula aporta frescor balsámico y notas florales que limpian el paladar entre sorbos de café de alta acidez.",
      "badge": "Formulación 01 · Floral & Cítrico",
      "badge_bioquimico": "Ulmo Monofloral"
    },
    {
      "id": "avellana-chilena-gevuina",
      "nombre": "Crema Batida con Avellana Chilena Tostada",
      "subtitulo": "Gevuina avellana silvestre tostada en frío",
      "formato": "25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda emulsionada con harina fina de avellana chilena silvestre tostada a baja temperatura. Notas cálidas de madera tostada, praliné profundo y toque terroso.",
      "perfil_bioquimico": "Textura untable y cremosa que no se separa a temperatura ambiente. Ideal para acompañar bebidas lácteas sin romper la microespuma.",
      "par_en_barra": "Bebidas con leche texturizada (Flat White, Cappuccino, Cortado) y espressos de tueste medio (proceso natural / honey).",
      "neurogastronomia": "Armonía cálida de avellana tostada y notas de praliné que complementa la dulzura natural de la leche emulsionada.",
      "badge": "Formulación 02 · Lácteo & Tostado",
      "badge_bioquimico": "Avellana Silvestre"
    },
    {
      "id": "nibs-cacao-crudo-santander",
      "nombre": "Crema Batida con Nibs de Cacao Crudo",
      "subtitulo": "Cacao criollo molido en frío · Astringencia Noble",
      "formato": "25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda combinada con nibs de cacao criollo molidos en frío. Contrapunto amargo noble, notas de frutos rojos secos y mora silvestre.",
      "perfil_bioquimico": "Molienda fina integrada en frío que preserva los flavonoides naturales del cacao y aporta textura crujiente sutil.",
      "par_en_barra": "Espressos dobles intensos, Cold Brew de extracción lenta y cafés de proceso anaeróbico o fermentación prolongada.",
      "neurogastronomia": "El contrapunto amargo noble del cacao limpia el dulzor y prepara el paladar para apreciar los matices achocolatados y vinosos del espresso.",
      "badge": "Formulación 03 · Amargo & Vinoso",
      "badge_bioquimico": "Cacao Criollo"
    },
    {
      "id": "polen-floral-nativo",
      "nombre": "Crema Batida con Polen Floral Nativo de Chiloé",
      "subtitulo": "Polen apícola de bosque templado lluvioso",
      "formato": "25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda con microgránulos de polen floral de bosque templado lluvioso. Notas minerales, cereal tostado, umami dulce y textura crujiente suave.",
      "perfil_bioquimico": "Suspensión natural de polen floral nativo rico en aminoácidos y minerales, integrado mecánicamente sin calor.",
      "par_en_barra": "Variedades botánicas delicadas en pour over (Geisha, Pacamara, Sidra) y bebidas de especialidad (Matcha Ceremonial, Hojicha).",
      "neurogastronomia": "Textura crujiente suave y notas de cereal tostado que rompen la monotonía líquida y prolongan el retrogusto del filtrado.",
      "badge": "Formulación 04 · Exótico & Pour Over",
      "badge_bioquimico": "Polen Nativo"
    }
  ],
  "tools": [],
  "kits": [
    {
      "id": "piloto-validacion",
      "nombre": "KIT 01: Piloto de Validación (15 Días)",
      "nombre_en": "KIT 01: Validation Pilot (15 Days)",
      "badge": "Iniciación · Sin Riesgo",
      "tier": "entrada",
      "tagline": "Validar rotación en mesa y vitrina con riesgo financiero mínimo",
      "tagline_en": "Validate table and retail rotation with minimal financial risk",
      "descripcion": "Una selección ágil y sin fricción de las 4 formulaciones botánicas en 25 g y 150 g para comprobar la aceptación en mesa y vitrina con soporte técnico y exhibidor de mostrador.",
      "descripcion_en": "A frictionless selection of all 4 botanical formulations in 25 g and 150 g to validate table and retail adoption with counter display and A6 technical cards.",
      "precio_neto_clp": 78400,
      "pvp_estimado_clp": 159200,
      "margen_estimado_pct": 41,
      "moq_summary": "32 piezas 25g + 8 frascos 150g + exhibidor",
      "sales_strategy": "Inversión: $78.400 neto (~$93.296 IVA inc.). Venta total: $159.200 PVP ($133.782 venta neta). Utilidad neta limpia: +$55.382 netos (41,4% margen real, +70,6% ROI).",
      "sales_strategy_en": "Net investment: $78,400 CLP. Total sales: $159,200 CLP ($133,782 net). Clean net profit: +$55,382 CLP (41.4% real margin, +70.6% ROI).",
      "componentes_fisicos": [
        {
          "cantidad": "32 un.",
          "item": "Piezas de Mesa 25g",
          "detalle": "8 Virgen Ulmo, 8 Avellana Chilena, 8 Cacao Santander, 8 Polen Floral"
        },
        {
          "cantidad": "8 un.",
          "item": "Reserva de Vitrina 150g",
          "detalle": "2 Virgen Ulmo, 2 Avellana Chilena, 2 Cacao Santander, 2 Polen Floral"
        },
        {
          "cantidad": "1 un.",
          "item": "Exhibidor Minimalista",
          "detalle": "Display de mostrador compacto para mesón de pago"
        },
        {
          "cantidad": "12 un.",
          "item": "Tarjetas de Mesa A6",
          "detalle": "Fichas de mesa con protocolo de cata y QR de lote"
        }
      ],
      "materiales_exhibicion": [
        "Exhibidor minimalista de mostrador",
        "12 tarjetas de mesa A6 con QR de lote y protocolo de maridaje"
      ],
      "integraciones_digitales": [
        {
          "titulo": "Trazabilidad Analítica QR por Lote",
          "titulo_en": "Batch Analytical QR Traceability",
          "descripcion": "Acceso directo a análisis de laboratorio (humedad <18%, HMF 2,76 mg/kg, diastasa 23,1 Schade)",
          "descripcion_en": "Direct access to laboratory certificates (moisture <18%, HMF 2.76 mg/kg, diastase 23.1 Schade)",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Protocolo Barista Botanical Sidecar",
          "titulo_en": "Botanical Sidecar Barista Protocol",
          "descripcion": "Guía técnica para servir la crema en frío (<40°C) sin alterar el pH del café",
          "descripcion_en": "Technical protocol for sequential tasting under 40°C preserving cup extraction",
          "tag": "marketing"
        }
      ],
      "recomendado_para": "Barras de especialidad y tostadurías independientes que inician validación en mesa y vitrina",
      "recomendado_para_en": "Specialty coffee bars and independent roasteries initiating table and retail validation"
    },
    {
      "id": "traccion-barista",
      "nombre": "KIT 02: Tracción Barista (Mensual · Recomendado)",
      "nombre_en": "KIT 02: Barista Traction (Monthly · Recommended)",
      "badge": "Más Elegido · Recomendado",
      "tier": "medio",
      "tagline": "Abastecimiento mensual estándar para 1 local con impulso activo de baristas",
      "tagline_en": "Standard monthly supply for 1 location with active barista advocacy",
      "descripcion": "El equilibrio perfecto entre rotación de salón y venta retail. Incluye 4 frascos Tester bonificados de 150 g para ofrecer microcatas gratuitas de 5 segundos en caja.",
      "descripcion_en": "The ideal balance between salon rotation and retail sales. Includes 4 complimentary 150 g Tester jars for 5-second counter tastings.",
      "precio_neto_clp": 204000,
      "pvp_estimado_clp": 436000,
      "margen_estimado_pct": 44,
      "moq_summary": "80 piezas 25g + 24 frascos 150g + 4 Testers bonificados",
      "sales_strategy": "Inversión: $204.000 neto (~$242.760 IVA inc.). Venta total: $436.000 PVP ($366.387 venta neta). Utilidad neta limpia: +$162.387 netos (44,3% margen real, +79,6% ROI).",
      "sales_strategy_en": "Net investment: $204,000 CLP. Total sales: $436,000 CLP ($366,387 net). Clean net profit: +$162,387 CLP (44.3% real margin, +79.6% ROI).",
      "componentes_fisicos": [
        {
          "cantidad": "80 un.",
          "item": "Piezas de Mesa 25g",
          "detalle": "20 Virgen Ulmo, 20 Avellana Chilena, 20 Cacao Santander, 20 Polen Floral"
        },
        {
          "cantidad": "24 un.",
          "item": "Reserva de Vitrina 150g",
          "detalle": "6 Virgen Ulmo, 6 Avellana Chilena, 6 Cacao Santander, 6 Polen Floral"
        },
        {
          "cantidad": "4 un.",
          "item": "Frascos 150g Tester de Barra",
          "detalle": "Bonificados sin costo (1 por variedad) para microdegustaciones al ordenar"
        },
        {
          "cantidad": "1 un.",
          "item": "Exhibidor de Mostrador + Accesorios",
          "detalle": "25 tarjetas A6 plastificadas + 20 microespátulas de cata"
        }
      ],
      "materiales_exhibicion": [
        "Exhibidor de mostrador de madera noble",
        "25 tarjetas de mesa A6 plastificadas",
        "20 microespátulas de cata para barra"
      ],
      "integraciones_digitales": [
        {
          "titulo": "Módulo QR Interactivo para Carta Digital",
          "titulo_en": "Interactive QR Module for Digital Menu",
          "descripcion": "Pasaporte botánico interactivo enlazable a la carta digital de tu cafetería",
          "descripcion_en": "Interactive botanical passport linked to your digital menu",
          "tag": "marketing"
        },
        {
          "titulo": "Activación en Directorio de Cafeterías Aliadas",
          "titulo_en": "Specialty Coffee Shop Directory Listing",
          "descripcion": "Visibilidad oficial para comensales en el mapa público de aliados de Enjambre Legado",
          "descripcion_en": "Official listing on Enjambre Legado public partner map",
          "tag": "resenas"
        }
      ],
      "recomendado_para": "Cafeterías de especialidad de flujo regular con prescripción activa del equipo de barra",
      "recomendado_para_en": "Specialty coffee shops with steady foot traffic and active barista advocacy"
    },
    {
      "id": "ecosistema-tostaduria",
      "nombre": "KIT 03: Ecosistema Tostaduría (Alta Rotación)",
      "nombre_en": "KIT 03: Roastery Ecosystem (High Rotation)",
      "badge": "Escala & Tostadurías",
      "tier": "avanzado",
      "tagline": "Suministro integral para tostadurías, flagships o locales de alto flujo con co-branding",
      "tagline_en": "Comprehensive supply for roasteries, flagships, or high-volume stores with co-branding",
      "descripcion": "La solución total de máxima escala y rentabilidad. Incluye 8 frascos Tester bonificados, doble exhibidor y personalización de marca (co-branding en tarjetas A6) calibrado con tus cafés de la casa.",
      "descripcion_en": "The comprehensive volume and profitability package. Includes 8 free Tester jars, dual display, and co-branding on A6 cards calibrated to your house beans.",
      "precio_neto_clp": 377600,
      "pvp_estimado_clp": 872000,
      "margen_estimado_pct": 49,
      "moq_summary": "160 piezas 25g + 48 frascos 150g + 8 Testers bonificados",
      "sales_strategy": "Inversión: $377.600 neto (~$449.344 IVA inc.). Venta total: $872.000 PVP ($732.773 venta neta). Utilidad neta limpia: +$355.173 netos (48,5% margen real, +94,1% ROI).",
      "sales_strategy_en": "Net investment: $377,600 CLP. Total sales: $872,000 CLP ($732,773 net). Clean net profit: +$355,173 CLP (48.5% real margin, +94.1% ROI).",
      "componentes_fisicos": [
        {
          "cantidad": "160 un.",
          "item": "Piezas de Mesa 25g",
          "detalle": "40 Virgen Ulmo, 40 Avellana Chilena, 40 Cacao Santander, 40 Polen Floral"
        },
        {
          "cantidad": "48 un.",
          "item": "Reserva de Vitrina 150g",
          "detalle": "12 Virgen Ulmo, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Floral"
        },
        {
          "cantidad": "8 un.",
          "item": "Frascos 150g Tester de Barra",
          "detalle": "Bonificados sin costo (2 por variedad) para cata activa en barra y sala"
        },
        {
          "cantidad": "1 pack",
          "item": "Doble Exhibidor + Co-Branding A6",
          "detalle": "50 tarjetas A6 con el logo de tu cafetería y calibración sensorial de tueste"
        }
      ],
      "materiales_exhibicion": [
        "Doble exhibidor de mostrador y vitrina",
        "50 tarjetas de mesa A6 con co-branding (logo de la cafetería)"
      ],
      "integraciones_digitales": [
        {
          "titulo": "Calibración Sensorial de Tueste con Granos de la Casa",
          "titulo_en": "Roast Profile Calibration with House Beans",
          "descripcion": "Estudio de resonancia fitoquímica entre tus lotes de café y nuestras 4 matrices botánicas",
          "descripcion_en": "Phytochemical resonance mapping between your coffee beans and our 4 botanical matrices",
          "tag": "marketing"
        },
        {
          "titulo": "Acceso Preferente a Tramos Mayoristas",
          "titulo_en": "Priority Wholesale Tier Access",
          "descripcion": "Reposición continua prioritaria directo desde Chiloé con condiciones comerciales de escala",
          "descripcion_en": "Priority continuous restocking directly from Chiloé under volume terms",
          "tag": "pricing"
        }
      ],
      "recomendado_para": "Tostadurías, cafeterías con múltiples barras o locales insignia de alto volumen",
      "recomendado_para_en": "Roasteries, multi-bar coffee shops, or high-volume flagship venues"
    }
  ],
  "value_props": [
    {
      "icon": "Droplets",
      "title": "01. Servicio al Lado de la Taza (< 40 °C)",
      "description": "Servido en pieza cilíndrica de vidrio de 25 g junto a la taza. El comensal degusta la crema batida en frío en paladar antes o entre sorbos de café, preservando los aromas botánicos y la extracción calibrada del barista."
    },
    {
      "icon": "Layers",
      "title": "02. Textura Cremada Sin Goteo",
      "description": "Microcristalización mecánica en frío a menos de 20 °C (< 18% de humedad controlada). Textura sedosa que mantiene en suspensión homogénea la avellana chilena, el cacao y el polen nativo, sin goteos ni mermas en barra."
    },
    {
      "icon": "QrCode",
      "title": "03. Trazabilidad Analítica QR por Lote",
      "description": "Cada frasco de 25 g y 150 g integra acceso digital al apiario de origen en Pureo (Queilén, Chiloé), porcentaje de polen nativo, fecha de recolección y notas de cata para tu equipo."
    }
  ],
  "stats": [
    {
      "value": "< 18%",
      "label": "Humedad Certificada"
    },
    {
      "value": "0% Calor",
      "label": "Cruda y sin pasteurizar"
    },
    {
      "value": "25g / 150g",
      "label": "Mesa y Vitrina"
    },
    {
      "value": "41–48%",
      "label": "Margen neto real"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "25 g — Pieza de mesa (Sidecar)",
      "desc": "Servido en bandeja junto a la taza con microespátula de cata. El comensal degusta la crema en paladar antes o entre sorbos de café, preservando aromas florales sin alterar la extracción."
    },
    {
      "step": "02",
      "title": "150 g — Reserva de vitrina (Retail)",
      "desc": "Exhibido en el mesón de caja junto a las bolsas de café de 250 g. Captura la compra por impulso del cliente que acaba de probar el maridaje en mesa."
    },
    {
      "step": "03",
      "title": "Tester de barra bonificado",
      "desc": "A partir del Kit Tracción Barista, frascos de 150 g sin costo para que tu equipo ofrezca microdegustaciones de 5 segundos al ordenar, activando la rotación orgánica."
    }
  ],
  "faq": [
    {
      "question": "¿Por qué servir el formato de 25 g junto a la taza (Sidecar) y no disuelto adentro?",
      "answer": "Porque las altas temperaturas evaporan los aromas florales más sutiles de la miel cruda y alteran el equilibrio de acidez de una extracción calibrada. La degustación secuencial con microespátula respeta al 100% el trabajo del barista y permite disfrutar ambos perfiles en contrapunto."
    },
    {
      "question": "¿Se endurece o separa la miel en la barra?",
      "answer": "No. Nuestro proceso de cremado mecánico en frío a menos de 20 °C genera cristales microscópicos homogéneos, manteniendo una textura suave y untable que no se separa ni endurece a temperatura ambiente."
    },
    {
      "question": "¿Cómo se capacita al equipo de baristas para asegurar la rotación?",
      "answer": "Cada kit incluye fichas técnicas de cata A6 y, a partir del Kit Tracción Barista, incorporamos frascos Tester de 150 g sin costo para que tu equipo ofrezca microcatas en barra en 5 segundos, disparando la venta en mesa y vitrina."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-sale-qr",
      "package_name": "@enjambre/sale-qr",
      "titulo": "Pasaporte Digital de Lote & Trazabilidad en Mesa",
      "titulo_en": "Batch Digital Passport & Table Traceability",
      "descripcion": "Genera códigos QR dinámicos para cartas y mesas. Los comensales escanean directamente para descubrir el origen botánico, fecha de recolección y análisis de pureza de la miel que acompaña su café.",
      "descripcion_en": "Generates dynamic QR codes for menus and tables. Patrons scan directly to explore botanical origin maps, collection dates, and laboratory purity metrics of their honey.",
      "badge": "Trazabilidad Dinámica",
      "beneficio_comercial": "Aporta valor tangible a la experiencia de café de especialidad y convierte comensales en compradores de frascos para llevar.",
      "beneficio_comercial_en": "Adds tangible value to the specialty coffee experience, converting patrons into takeaway retail jar buyers."
    },
    {
      "id": "modulo-resenas",
      "package_name": "@enjambre/resenas",
      "titulo": "Motor de Reseñas Verificadas de Cata",
      "titulo_en": "Verified Tasting Review Engine",
      "descripcion": "Sistema de calificación sensorial en escala chilena 1–7 que captura notas de maridaje de tus baristas y comensales en tiempo real, publicándolas de forma transparente.",
      "descripcion_en": "Sensory evaluation engine on the Chilean 1–7 scale capturing real-time coffee-and-honey pairing notes from your baristas and guests.",
      "badge": "Prueba Social",
      "beneficio_comercial": "Genera validación social inmediata en barra y posiciona a tu cafetería como referente en maridaje de café de especialidad.",
      "beneficio_comercial_en": "Builds immediate social proof at the counter, positioning your coffee shop as a premier specialty pairing destination."
    },
    {
      "id": "modulo-wallet",
      "package_name": "@enjambre/wallet",
      "titulo": "Pase Digital Apple & Google Wallet con Retorno de Frascos",
      "titulo_en": "Apple & Google Digital Wallet Pass with Jar Return",
      "descripcion": "Permite a tus clientes guardar su tarjeta de membresía en su smartphone sin descargar aplicaciones. Acumulan sellos por cada café con miel y reciben abonos por devolver frascos de vidrio vacíos.",
      "descripcion_en": "Enables customers to save their membership pass on smartphones with zero app downloads. They collect stamps per coffee and receive credits for returning empty glass jars.",
      "badge": "Fidelización & Circularidad",
      "beneficio_comercial": "Multiplica la retención de clientes recurrentes e impulsa un ciclo de reciclaje noble con incentivo de consumo en tu local.",
      "beneficio_comercial_en": "Drives repeat patron retention while fueling a circular packaging loop that incentivizes spending in your store."
    },
    {
      "id": "modulo-ciencia",
      "package_name": "@enjambre/ciencia",
      "titulo": "Dossier Técnico & Triangulación de Laboratorio",
      "titulo_en": "Technical Laboratory Dossier & Calibration",
      "descripcion": "Acceso directo a análisis físico-químicos (humedad <18%, índice HMF, espectro polínico NCh2981) para calibrar recetas de autor, extracción espresso y emulsionado en frío.",
      "descripcion_en": "Direct access to physico-chemical analyses (moisture <18%, HMF index, pollen profile) to calibrate signature recipes, espresso extractions, and cold churning.",
      "badge": "Estándar Científico",
      "beneficio_comercial": "Garantiza estabilidad técnica en cocina y barra sin fermentación ni azúcares adulterados, asegurando consistencia en cada taza.",
      "beneficio_comercial_en": "Guarantees technical kitchen and bar stability with zero fermentation or adulterated sugars, ensuring consistency in every cup."
    }
  ],
  "seo_title": "Creaciones para Cafeterías de Especialidad · La Obrera y el Zángano",
  "seo_description": "Cuatro cremas de miel cruda de Chiloé (Bosque, Avellana, Cacao, Polen) servidas en 25g. Transforma una infusión en un gesto de origen."
}'::jsonb,
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_cafeterias';
  ELSE
    INSERT INTO site_content (section_key, item_order, content, is_active, created_at, updated_at)
    VALUES ('b2b_cafeterias', 0, '{
  "slug": "cafeterias",
  "tipo": "cafeteria",
  "kicker": "ALIANZAS B2B · CAFETERÍAS DE ESPECIALIDAD & TOSTADURÍAS",
  "kicker_en": "B2B ALLIANCES · SPECIALTY COFFEE SHOPS & ROASTERIES",
  "headline": "El café de especialidad no se endulza en taza. Se acompaña en mesa.",
  "headline_en": "Specialty coffee is not sweetened in the cup. It is paired at the table.",
  "subheadline": "Cuatro cremas de miel cruda batida en frío recolectadas en el bosque nativo de Chiloé (42°S), presentadas en piezas individuales de 25 g para servicio en mesa y frascos de 150 g para venta en mostrador. Respaldo analítico de origen y margen comercial del 41% al 48% para tu barra.",
  "subheadline_en": "Four cold-churned raw honey creams harvested in the native forest of Chiloé (42°S), presented in 25 g individual table-service pieces and 150 g retail display jars. Analytical origin certification and 41% to 48% net margin for your coffee bar.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp",
  "suggested_products_copy": "Disponibles en Pieza de Mesa (25 g) y Reserva de Vitrina (150 g). Cuatro expresiones botánicas diseñadas para armonizar con el método de extracción y perfil de tueste de tu barra.",
  "suggested_products_copy_en": "Available in Table Tasting Pieces (25 g) and Display Reserve (150 g). Four botanical expressions crafted to harmonize with your brew method and roast profile.",
  "cta_text": "Activar Kit Piloto ($78.400 neto)",
  "cta_text_en": "Activate Pilot Kit ($78,400 net)",
  "cta_href": "#registro",
  "commercial_strategy": {
    "titulo": "Dinámica de Mesa & Venta en Vitrina",
    "titulo_en": "Table Experience and Retail Display Dynamics",
    "bajada": "El frasco de 25 g acompaña la cata en bandeja junto a la taza, activando por impulso la venta del frasco de 150 g en el mostrador.",
    "bajada_en": "The 25 g jar accompanies the tray tasting alongside the cup, driving impulse purchases of the 150 g jar at the register.",
    "aumento_ticket": "Upsell de $2.500–$2.900 en mesa & $9.500 PVP en vitrina",
    "aumento_ticket_en": "Table upsell of $2,500–$2,900 & $9,500 retail at checkout",
    "mecanica_ventas": [
      "Paso 1: Servicio en bandeja con pieza de 25 g y microespátula junto a la taza, preservando acidez y aromas florales.",
      "Paso 2: Cata en paladar antes o entre sorbos de espresso o filtrado, disfrutando el contrapunto botánico.",
      "Paso 3: Degustaciones ágiles en mesón de pago con frascos Tester de 150 g bonificados.",
      "Paso 4: Venta de frascos de 150 g en vitrina con precio equivalente a una bolsa de café de 250 g."
    ],
    "herramienta_clave": "Código QR de Lote, Tarjeta A6 & Frascos Tester Bonificados",
    "herramienta_clave_en": "Batch QR Code, A6 Table Card & Free Tester Jars"
  },
  "molecular_pairings": [
    {
      "id": "miel-virgen-cruda-ulmo",
      "nombre": "Miel Virgen Cruda de Ulmo",
      "subtitulo": "Floración de Eucryphia cordifolia · Chiloé 42°S",
      "formato": "25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel monofloral de Ulmo batida en frío. Textura aterciopelada, notas de jazmín, anís estrella, sutil fondo mentolado y frescor balsámico.",
      "perfil_bioquimico": "Servicio en bandeja con microespátula fuera de la taza. Acompañamiento limpio que resalta los aromas florales sin alterar la acidez ni la temperatura de extracción.",
      "par_en_barra": "Cafés lavados de alta altitud y acidez limpia (Etiopía Yirgacheffe, Kenia Nyeri, Colombia Huila).",
      "neurogastronomia": "La microdosis en espátula aporta frescor balsámico y notas florales que limpian el paladar entre sorbos de café de alta acidez.",
      "badge": "Formulación 01 · Floral & Cítrico",
      "badge_bioquimico": "Ulmo Monofloral"
    },
    {
      "id": "avellana-chilena-gevuina",
      "nombre": "Crema Batida con Avellana Chilena Tostada",
      "subtitulo": "Gevuina avellana silvestre tostada en frío",
      "formato": "25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda emulsionada con harina fina de avellana chilena silvestre tostada a baja temperatura. Notas cálidas de madera tostada, praliné profundo y toque terroso.",
      "perfil_bioquimico": "Textura untable y cremosa que no se separa a temperatura ambiente. Ideal para acompañar bebidas lácteas sin romper la microespuma.",
      "par_en_barra": "Bebidas con leche texturizada (Flat White, Cappuccino, Cortado) y espressos de tueste medio (proceso natural / honey).",
      "neurogastronomia": "Armonía cálida de avellana tostada y notas de praliné que complementa la dulzura natural de la leche emulsionada.",
      "badge": "Formulación 02 · Lácteo & Tostado",
      "badge_bioquimico": "Avellana Silvestre"
    },
    {
      "id": "nibs-cacao-crudo-santander",
      "nombre": "Crema Batida con Nibs de Cacao Crudo",
      "subtitulo": "Cacao criollo molido en frío · Astringencia Noble",
      "formato": "25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda combinada con nibs de cacao criollo molidos en frío. Contrapunto amargo noble, notas de frutos rojos secos y mora silvestre.",
      "perfil_bioquimico": "Molienda fina integrada en frío que preserva los flavonoides naturales del cacao y aporta textura crujiente sutil.",
      "par_en_barra": "Espressos dobles intensos, Cold Brew de extracción lenta y cafés de proceso anaeróbico o fermentación prolongada.",
      "neurogastronomia": "El contrapunto amargo noble del cacao limpia el dulzor y prepara el paladar para apreciar los matices achocolatados y vinosos del espresso.",
      "badge": "Formulación 03 · Amargo & Vinoso",
      "badge_bioquimico": "Cacao Criollo"
    },
    {
      "id": "polen-floral-nativo",
      "nombre": "Crema Batida con Polen Floral Nativo de Chiloé",
      "subtitulo": "Polen apícola de bosque templado lluvioso",
      "formato": "25 g (Pieza de Mesa) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda con microgránulos de polen floral de bosque templado lluvioso. Notas minerales, cereal tostado, umami dulce y textura crujiente suave.",
      "perfil_bioquimico": "Suspensión natural de polen floral nativo rico en aminoácidos y minerales, integrado mecánicamente sin calor.",
      "par_en_barra": "Variedades botánicas delicadas en pour over (Geisha, Pacamara, Sidra) y bebidas de especialidad (Matcha Ceremonial, Hojicha).",
      "neurogastronomia": "Textura crujiente suave y notas de cereal tostado que rompen la monotonía líquida y prolongan el retrogusto del filtrado.",
      "badge": "Formulación 04 · Exótico & Pour Over",
      "badge_bioquimico": "Polen Nativo"
    }
  ],
  "tools": [],
  "kits": [
    {
      "id": "piloto-validacion",
      "nombre": "KIT 01: Piloto de Validación (15 Días)",
      "nombre_en": "KIT 01: Validation Pilot (15 Days)",
      "badge": "Iniciación · Sin Riesgo",
      "tier": "entrada",
      "tagline": "Validar rotación en mesa y vitrina con riesgo financiero mínimo",
      "tagline_en": "Validate table and retail rotation with minimal financial risk",
      "descripcion": "Una selección ágil y sin fricción de las 4 formulaciones botánicas en 25 g y 150 g para comprobar la aceptación en mesa y vitrina con soporte técnico y exhibidor de mostrador.",
      "descripcion_en": "A frictionless selection of all 4 botanical formulations in 25 g and 150 g to validate table and retail adoption with counter display and A6 technical cards.",
      "precio_neto_clp": 78400,
      "pvp_estimado_clp": 159200,
      "margen_estimado_pct": 41,
      "moq_summary": "32 piezas 25g + 8 frascos 150g + exhibidor",
      "sales_strategy": "Inversión: $78.400 neto (~$93.296 IVA inc.). Venta total: $159.200 PVP ($133.782 venta neta). Utilidad neta limpia: +$55.382 netos (41,4% margen real, +70,6% ROI).",
      "sales_strategy_en": "Net investment: $78,400 CLP. Total sales: $159,200 CLP ($133,782 net). Clean net profit: +$55,382 CLP (41.4% real margin, +70.6% ROI).",
      "componentes_fisicos": [
        {
          "cantidad": "32 un.",
          "item": "Piezas de Mesa 25g",
          "detalle": "8 Virgen Ulmo, 8 Avellana Chilena, 8 Cacao Santander, 8 Polen Floral"
        },
        {
          "cantidad": "8 un.",
          "item": "Reserva de Vitrina 150g",
          "detalle": "2 Virgen Ulmo, 2 Avellana Chilena, 2 Cacao Santander, 2 Polen Floral"
        },
        {
          "cantidad": "1 un.",
          "item": "Exhibidor Minimalista",
          "detalle": "Display de mostrador compacto para mesón de pago"
        },
        {
          "cantidad": "12 un.",
          "item": "Tarjetas de Mesa A6",
          "detalle": "Fichas de mesa con protocolo de cata y QR de lote"
        }
      ],
      "materiales_exhibicion": [
        "Exhibidor minimalista de mostrador",
        "12 tarjetas de mesa A6 con QR de lote y protocolo de maridaje"
      ],
      "integraciones_digitales": [
        {
          "titulo": "Trazabilidad Analítica QR por Lote",
          "titulo_en": "Batch Analytical QR Traceability",
          "descripcion": "Acceso directo a análisis de laboratorio (humedad <18%, HMF 2,76 mg/kg, diastasa 23,1 Schade)",
          "descripcion_en": "Direct access to laboratory certificates (moisture <18%, HMF 2.76 mg/kg, diastase 23.1 Schade)",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Protocolo Barista Botanical Sidecar",
          "titulo_en": "Botanical Sidecar Barista Protocol",
          "descripcion": "Guía técnica para servir la crema en frío (<40°C) sin alterar el pH del café",
          "descripcion_en": "Technical protocol for sequential tasting under 40°C preserving cup extraction",
          "tag": "marketing"
        }
      ],
      "recomendado_para": "Barras de especialidad y tostadurías independientes que inician validación en mesa y vitrina",
      "recomendado_para_en": "Specialty coffee bars and independent roasteries initiating table and retail validation"
    },
    {
      "id": "traccion-barista",
      "nombre": "KIT 02: Tracción Barista (Mensual · Recomendado)",
      "nombre_en": "KIT 02: Barista Traction (Monthly · Recommended)",
      "badge": "Más Elegido · Recomendado",
      "tier": "medio",
      "tagline": "Abastecimiento mensual estándar para 1 local con impulso activo de baristas",
      "tagline_en": "Standard monthly supply for 1 location with active barista advocacy",
      "descripcion": "El equilibrio perfecto entre rotación de salón y venta retail. Incluye 4 frascos Tester bonificados de 150 g para ofrecer microcatas gratuitas de 5 segundos en caja.",
      "descripcion_en": "The ideal balance between salon rotation and retail sales. Includes 4 complimentary 150 g Tester jars for 5-second counter tastings.",
      "precio_neto_clp": 204000,
      "pvp_estimado_clp": 436000,
      "margen_estimado_pct": 44,
      "moq_summary": "80 piezas 25g + 24 frascos 150g + 4 Testers bonificados",
      "sales_strategy": "Inversión: $204.000 neto (~$242.760 IVA inc.). Venta total: $436.000 PVP ($366.387 venta neta). Utilidad neta limpia: +$162.387 netos (44,3% margen real, +79,6% ROI).",
      "sales_strategy_en": "Net investment: $204,000 CLP. Total sales: $436,000 CLP ($366,387 net). Clean net profit: +$162,387 CLP (44.3% real margin, +79.6% ROI).",
      "componentes_fisicos": [
        {
          "cantidad": "80 un.",
          "item": "Piezas de Mesa 25g",
          "detalle": "20 Virgen Ulmo, 20 Avellana Chilena, 20 Cacao Santander, 20 Polen Floral"
        },
        {
          "cantidad": "24 un.",
          "item": "Reserva de Vitrina 150g",
          "detalle": "6 Virgen Ulmo, 6 Avellana Chilena, 6 Cacao Santander, 6 Polen Floral"
        },
        {
          "cantidad": "4 un.",
          "item": "Frascos 150g Tester de Barra",
          "detalle": "Bonificados sin costo (1 por variedad) para microdegustaciones al ordenar"
        },
        {
          "cantidad": "1 un.",
          "item": "Exhibidor de Mostrador + Accesorios",
          "detalle": "25 tarjetas A6 plastificadas + 20 microespátulas de cata"
        }
      ],
      "materiales_exhibicion": [
        "Exhibidor de mostrador de madera noble",
        "25 tarjetas de mesa A6 plastificadas",
        "20 microespátulas de cata para barra"
      ],
      "integraciones_digitales": [
        {
          "titulo": "Módulo QR Interactivo para Carta Digital",
          "titulo_en": "Interactive QR Module for Digital Menu",
          "descripcion": "Pasaporte botánico interactivo enlazable a la carta digital de tu cafetería",
          "descripcion_en": "Interactive botanical passport linked to your digital menu",
          "tag": "marketing"
        },
        {
          "titulo": "Activación en Directorio de Cafeterías Aliadas",
          "titulo_en": "Specialty Coffee Shop Directory Listing",
          "descripcion": "Visibilidad oficial para comensales en el mapa público de aliados de Enjambre Legado",
          "descripcion_en": "Official listing on Enjambre Legado public partner map",
          "tag": "resenas"
        }
      ],
      "recomendado_para": "Cafeterías de especialidad de flujo regular con prescripción activa del equipo de barra",
      "recomendado_para_en": "Specialty coffee shops with steady foot traffic and active barista advocacy"
    },
    {
      "id": "ecosistema-tostaduria",
      "nombre": "KIT 03: Ecosistema Tostaduría (Alta Rotación)",
      "nombre_en": "KIT 03: Roastery Ecosystem (High Rotation)",
      "badge": "Escala & Tostadurías",
      "tier": "avanzado",
      "tagline": "Suministro integral para tostadurías, flagships o locales de alto flujo con co-branding",
      "tagline_en": "Comprehensive supply for roasteries, flagships, or high-volume stores with co-branding",
      "descripcion": "La solución total de máxima escala y rentabilidad. Incluye 8 frascos Tester bonificados, doble exhibidor y personalización de marca (co-branding en tarjetas A6) calibrado con tus cafés de la casa.",
      "descripcion_en": "The comprehensive volume and profitability package. Includes 8 free Tester jars, dual display, and co-branding on A6 cards calibrated to your house beans.",
      "precio_neto_clp": 377600,
      "pvp_estimado_clp": 872000,
      "margen_estimado_pct": 49,
      "moq_summary": "160 piezas 25g + 48 frascos 150g + 8 Testers bonificados",
      "sales_strategy": "Inversión: $377.600 neto (~$449.344 IVA inc.). Venta total: $872.000 PVP ($732.773 venta neta). Utilidad neta limpia: +$355.173 netos (48,5% margen real, +94,1% ROI).",
      "sales_strategy_en": "Net investment: $377,600 CLP. Total sales: $872,000 CLP ($732,773 net). Clean net profit: +$355,173 CLP (48.5% real margin, +94.1% ROI).",
      "componentes_fisicos": [
        {
          "cantidad": "160 un.",
          "item": "Piezas de Mesa 25g",
          "detalle": "40 Virgen Ulmo, 40 Avellana Chilena, 40 Cacao Santander, 40 Polen Floral"
        },
        {
          "cantidad": "48 un.",
          "item": "Reserva de Vitrina 150g",
          "detalle": "12 Virgen Ulmo, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Floral"
        },
        {
          "cantidad": "8 un.",
          "item": "Frascos 150g Tester de Barra",
          "detalle": "Bonificados sin costo (2 por variedad) para cata activa en barra y sala"
        },
        {
          "cantidad": "1 pack",
          "item": "Doble Exhibidor + Co-Branding A6",
          "detalle": "50 tarjetas A6 con el logo de tu cafetería y calibración sensorial de tueste"
        }
      ],
      "materiales_exhibicion": [
        "Doble exhibidor de mostrador y vitrina",
        "50 tarjetas de mesa A6 con co-branding (logo de la cafetería)"
      ],
      "integraciones_digitales": [
        {
          "titulo": "Calibración Sensorial de Tueste con Granos de la Casa",
          "titulo_en": "Roast Profile Calibration with House Beans",
          "descripcion": "Estudio de resonancia fitoquímica entre tus lotes de café y nuestras 4 matrices botánicas",
          "descripcion_en": "Phytochemical resonance mapping between your coffee beans and our 4 botanical matrices",
          "tag": "marketing"
        },
        {
          "titulo": "Acceso Preferente a Tramos Mayoristas",
          "titulo_en": "Priority Wholesale Tier Access",
          "descripcion": "Reposición continua prioritaria directo desde Chiloé con condiciones comerciales de escala",
          "descripcion_en": "Priority continuous restocking directly from Chiloé under volume terms",
          "tag": "pricing"
        }
      ],
      "recomendado_para": "Tostadurías, cafeterías con múltiples barras o locales insignia de alto volumen",
      "recomendado_para_en": "Roasteries, multi-bar coffee shops, or high-volume flagship venues"
    }
  ],
  "value_props": [
    {
      "icon": "Droplets",
      "title": "01. Servicio al Lado de la Taza (< 40 °C)",
      "description": "Servido en pieza cilíndrica de vidrio de 25 g junto a la taza. El comensal degusta la crema batida en frío en paladar antes o entre sorbos de café, preservando los aromas botánicos y la extracción calibrada del barista."
    },
    {
      "icon": "Layers",
      "title": "02. Textura Cremada Sin Goteo",
      "description": "Microcristalización mecánica en frío a menos de 20 °C (< 18% de humedad controlada). Textura sedosa que mantiene en suspensión homogénea la avellana chilena, el cacao y el polen nativo, sin goteos ni mermas en barra."
    },
    {
      "icon": "QrCode",
      "title": "03. Trazabilidad Analítica QR por Lote",
      "description": "Cada frasco de 25 g y 150 g integra acceso digital al apiario de origen en Pureo (Queilén, Chiloé), porcentaje de polen nativo, fecha de recolección y notas de cata para tu equipo."
    }
  ],
  "stats": [
    {
      "value": "< 18%",
      "label": "Humedad Certificada"
    },
    {
      "value": "0% Calor",
      "label": "Cruda y sin pasteurizar"
    },
    {
      "value": "25g / 150g",
      "label": "Mesa y Vitrina"
    },
    {
      "value": "41–48%",
      "label": "Margen neto real"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "25 g — Pieza de mesa (Sidecar)",
      "desc": "Servido en bandeja junto a la taza con microespátula de cata. El comensal degusta la crema en paladar antes o entre sorbos de café, preservando aromas florales sin alterar la extracción."
    },
    {
      "step": "02",
      "title": "150 g — Reserva de vitrina (Retail)",
      "desc": "Exhibido en el mesón de caja junto a las bolsas de café de 250 g. Captura la compra por impulso del cliente que acaba de probar el maridaje en mesa."
    },
    {
      "step": "03",
      "title": "Tester de barra bonificado",
      "desc": "A partir del Kit Tracción Barista, frascos de 150 g sin costo para que tu equipo ofrezca microdegustaciones de 5 segundos al ordenar, activando la rotación orgánica."
    }
  ],
  "faq": [
    {
      "question": "¿Por qué servir el formato de 25 g junto a la taza (Sidecar) y no disuelto adentro?",
      "answer": "Porque las altas temperaturas evaporan los aromas florales más sutiles de la miel cruda y alteran el equilibrio de acidez de una extracción calibrada. La degustación secuencial con microespátula respeta al 100% el trabajo del barista y permite disfrutar ambos perfiles en contrapunto."
    },
    {
      "question": "¿Se endurece o separa la miel en la barra?",
      "answer": "No. Nuestro proceso de cremado mecánico en frío a menos de 20 °C genera cristales microscópicos homogéneos, manteniendo una textura suave y untable que no se separa ni endurece a temperatura ambiente."
    },
    {
      "question": "¿Cómo se capacita al equipo de baristas para asegurar la rotación?",
      "answer": "Cada kit incluye fichas técnicas de cata A6 y, a partir del Kit Tracción Barista, incorporamos frascos Tester de 150 g sin costo para que tu equipo ofrezca microcatas en barra en 5 segundos, disparando la venta en mesa y vitrina."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-sale-qr",
      "package_name": "@enjambre/sale-qr",
      "titulo": "Pasaporte Digital de Lote & Trazabilidad en Mesa",
      "titulo_en": "Batch Digital Passport & Table Traceability",
      "descripcion": "Genera códigos QR dinámicos para cartas y mesas. Los comensales escanean directamente para descubrir el origen botánico, fecha de recolección y análisis de pureza de la miel que acompaña su café.",
      "descripcion_en": "Generates dynamic QR codes for menus and tables. Patrons scan directly to explore botanical origin maps, collection dates, and laboratory purity metrics of their honey.",
      "badge": "Trazabilidad Dinámica",
      "beneficio_comercial": "Aporta valor tangible a la experiencia de café de especialidad y convierte comensales en compradores de frascos para llevar.",
      "beneficio_comercial_en": "Adds tangible value to the specialty coffee experience, converting patrons into takeaway retail jar buyers."
    },
    {
      "id": "modulo-resenas",
      "package_name": "@enjambre/resenas",
      "titulo": "Motor de Reseñas Verificadas de Cata",
      "titulo_en": "Verified Tasting Review Engine",
      "descripcion": "Sistema de calificación sensorial en escala chilena 1–7 que captura notas de maridaje de tus baristas y comensales en tiempo real, publicándolas de forma transparente.",
      "descripcion_en": "Sensory evaluation engine on the Chilean 1–7 scale capturing real-time coffee-and-honey pairing notes from your baristas and guests.",
      "badge": "Prueba Social",
      "beneficio_comercial": "Genera validación social inmediata en barra y posiciona a tu cafetería como referente en maridaje de café de especialidad.",
      "beneficio_comercial_en": "Builds immediate social proof at the counter, positioning your coffee shop as a premier specialty pairing destination."
    },
    {
      "id": "modulo-wallet",
      "package_name": "@enjambre/wallet",
      "titulo": "Pase Digital Apple & Google Wallet con Retorno de Frascos",
      "titulo_en": "Apple & Google Digital Wallet Pass with Jar Return",
      "descripcion": "Permite a tus clientes guardar su tarjeta de membresía en su smartphone sin descargar aplicaciones. Acumulan sellos por cada café con miel y reciben abonos por devolver frascos de vidrio vacíos.",
      "descripcion_en": "Enables customers to save their membership pass on smartphones with zero app downloads. They collect stamps per coffee and receive credits for returning empty glass jars.",
      "badge": "Fidelización & Circularidad",
      "beneficio_comercial": "Multiplica la retención de clientes recurrentes e impulsa un ciclo de reciclaje noble con incentivo de consumo en tu local.",
      "beneficio_comercial_en": "Drives repeat patron retention while fueling a circular packaging loop that incentivizes spending in your store."
    },
    {
      "id": "modulo-ciencia",
      "package_name": "@enjambre/ciencia",
      "titulo": "Dossier Técnico & Triangulación de Laboratorio",
      "titulo_en": "Technical Laboratory Dossier & Calibration",
      "descripcion": "Acceso directo a análisis físico-químicos (humedad <18%, índice HMF, espectro polínico NCh2981) para calibrar recetas de autor, extracción espresso y emulsionado en frío.",
      "descripcion_en": "Direct access to physico-chemical analyses (moisture <18%, HMF index, pollen profile) to calibrate signature recipes, espresso extractions, and cold churning.",
      "badge": "Estándar Científico",
      "beneficio_comercial": "Garantiza estabilidad técnica en cocina y barra sin fermentación ni azúcares adulterados, asegurando consistencia en cada taza.",
      "beneficio_comercial_en": "Guarantees technical kitchen and bar stability with zero fermentation or adulterated sugars, ensuring consistency in every cup."
    }
  ],
  "seo_title": "Creaciones para Cafeterías de Especialidad · La Obrera y el Zángano",
  "seo_description": "Cuatro cremas de miel cruda de Chiloé (Bosque, Avellana, Cacao, Polen) servidas en 25g. Transforma una infusión en un gesto de origen."
}'::jsonb, true, NOW(), NOW());
  END IF;

  -- Actualizar b2b_hoteles
  IF EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_hoteles') THEN
    UPDATE site_content
    SET content = '{
  "slug": "hoteles",
  "tipo": "hotel",
  "kicker": "ALIANZAS B2B · HOSPITALIDAD DE AUTOR & LODGES",
  "kicker_en": "B2B ALLIANCES · BOUTIQUE HOSPITALITY & LODGES",
  "headline": "Miel Cruda de Bosque Nativo de Chiloé (42°S) para Hotelería de Autor",
  "headline_en": "Native Rainforest Raw Honey from Chiloé (42°S) for Signature Hospitality",
  "subheadline": "Formatos en 25 g para amenidad de bienvenida y cata en mesa de desayuno, y frascos de 150 g para vitrina de recepción y boutique. Miel cruda certificada de bosque nativo que transforma la cortesía en un recuerdo de viaje.",
  "subheadline_en": "Modular formats in 25 g for welcome amenities and breakfast tastings, and 150 g jars for front-desk retail and hotel boutique. Certified raw native honey turning courtesy into a travel memory.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp",
  "suggested_products_copy": "Disponibles en Formato 25 g (Amenidad & Desayuno) y Frasco 150 g (Boutique de Recepción). Cuatro variedades botánicas de Chiloé diseñadas para bienvenida en suite, mesa de desayuno y boutique.",
  "suggested_products_copy_en": "Available in 25 g (Amenity & Breakfast Tasting) and 150 g (Front Desk Boutique). Four botanical varieties from Chiloé designed for in-suite welcome, breakfast tables, and retail boutique.",
  "cta_text": "Solicitar Muestras de Degustación",
  "cta_text_en": "Request Tasting Samples",
  "cta_href": "#registro",
  "value_props": [
    {
      "icon": "ShieldCheck",
      "title": "Amenidad de Bienvenida en Habitación (25 g)",
      "description": "Frasco individual de vidrio con apertura sellada para turndown nocturno o bandeja de llegada, sin plásticos de un solo uso."
    },
    {
      "icon": "Layers",
      "title": "Cata en Salón de Desayuno",
      "description": "Formato para mesa de desayuno de autor que acompaña quesos de campo, bollería de masa madre e infusiones nativas con textura untable sin goteo."
    },
    {
      "icon": "TrendingUp",
      "title": "Frasco de Recuerdo en Recepción (150 g)",
      "description": "Producto de alta rotación en el checkout para que el huésped lleve el sabor del bosque consigo. Formato apto para equipaje de mano en vuelos nacionales e internacionales."
    },
    {
      "icon": "QrCode",
      "title": "Trazabilidad y Análisis de Lote",
      "description": "Cada frasco enlaza al pasaporte de lote oficial: humedad < 18%, análisis de polen nativo y coordenadas exactas del apiario en Chiloé."
    }
  ],
  "stats": [
    {
      "value": "25 g",
      "label": "Amenidad de Habitación"
    },
    {
      "value": "150 g",
      "label": "Formato Souvenir Boutique"
    },
    {
      "value": "< 18%",
      "label": "Humedad Controlada"
    },
    {
      "value": "Chiloé 42°S",
      "label": "Apiarios Fijos de Bosque"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "25 g — Amenidad en Habitación & Mesa",
      "desc": "Servicio nocturno de apertura de cama (turndown ritual), cata en mesa de desayuno y acompañamiento para infusiones nativas."
    },
    {
      "step": "02",
      "title": "150 g — Formato de Recuerdo en Recepción",
      "desc": "Exhibición en el atril de mesón de recepción. Formato de reserva para que el huésped lo adquiera como souvenir gastronómico."
    },
    {
      "step": "03",
      "title": "Retorno y Sostenibilidad del Servicio",
      "desc": "La rotación en el checkout y boutique amortiza el costo de las amenidades de bienvenida, ofreciendo una experiencia memorable de alto estándar."
    }
  ],
  "faq": [
    {
      "question": "¿Cómo se presenta el envase de 150 g para huéspedes que viajan?",
      "answer": "Nuestros frascos de 150 g están herméticamente sellados con lacre y etiqueta de alta resistencia. Su volumen y dimensiones son aptos para transporte seguro en equipaje de viaje."
    },
    {
      "question": "¿Cuál es el origen y estándar botánico de la miel de Ulmo?",
      "answer": "Miel cruda monofloral de Eucryphia cordifolia recolectada en apiarios fijos del bosque nativo de Chiloé, bajo norma chilena NCh2981 con más del 45% de dominancia polínica y humedad natural menor al 18%."
    },
    {
      "question": "¿Cómo se conserva la Miel con Avellana Chilena?",
      "answer": "Elaboramos una emulsión mecánica en frío que integra avellana chilena silvestre tostada en la miel cruda, manteniendo una textura cremada homogénea sin separación de fases ni conservantes artificiales durante más de 12 meses."
    },
    {
      "question": "¿Cómo solicitar muestras de degustación antes de emitir una orden?",
      "answer": "A través del formulario de esta página. Despachamos a gerencia general o jefatura de alimentos y bebidas una selección de degustación para validar texturas, notas aromáticas y presentación de sala."
    }
  ],
  "commercial_strategy": {
    "titulo": "Dinámica de Experiencia en Habitación y Venta en Recepción",
    "titulo_en": "Room Experience and Front Desk Retail Dynamics",
    "bajada": "La disposición del frasco de 25 g como cortesía activa el descubrimiento del producto y estimula la compra del frasco de 150 g en el checkout como recuerdo de viaje.",
    "bajada_en": "The 25 g jar courtesy amenity drives product discovery and encourages guests to purchase the 150 g retail jar at checkout as a travel souvenir.",
    "aumento_ticket": "Recaudación complementaria en recepción que amortiza la inversión en amenidades y entrega utilidad líquida.",
    "aumento_ticket_en": "Complementary front-desk retail revenue that amortizes amenity investments while delivering net profit.",
    "herramienta_clave": "Atril de Mesón de Recepción, Pasaportes de Habitación Bilingües & Frascos de 150 g",
    "herramienta_clave_en": "Front Desk Display, Bilingual Room Botanical Passports & 150 g Jars",
    "mecanica_ventas": [
      "Paso 1: Disposición del frasco de 25 g en turndown nocturno o mesa de desayuno junto a su Pasaporte Botánico.",
      "Paso 2: El huésped degusta la textura sedosa y los aromas de bosque nativo.",
      "Paso 3: El pasaporte indica que el frasco de 150 g para llevar está disponible en recepción.",
      "Paso 4: En el checkout, el atril de mesón permite al huésped llevarse el frasco como recuerdo auténtico de su viaje."
    ]
  },
  "tools": [],
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
        {
          "cantidad": "120 un.",
          "item": "Mini Frascos de Cortesía 25 g",
          "detalle": "30× Ulmo Puro APF, 30× Avellana Chilena ω-7, 30× Polen Biomimético, 30× Cacao Nibs Santander"
        },
        {
          "cantidad": "3 un.",
          "item": "Regletas de Cata Horizontal",
          "detalle": "Madera nativa cepillada con 4 cavidades calibradas para Tasting Flights en suites o salón"
        },
        {
          "cantidad": "60 un.",
          "item": "Pasaportes Botánicos A6",
          "detalle": "Papel algodón bilingüe (ES/EN) con relato bioactivo del bosque a 42°S y QR de trazabilidad"
        },
        {
          "cantidad": "1 un.",
          "item": "Protocolo Técnico de Servicio",
          "detalle": "Ficha impermeable de 1 página para garzones y housekeeping con temperaturas y maridajes"
        }
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
        {
          "titulo": "Cata Sensorial Bilingüe en Suite",
          "descripcion": "El huésped escanea el QR del frasco y explora la curva aromática y el factor APF.",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Trazabilidad Oficial NCh2981",
          "descripcion": "Informe melisopalinológico y análisis de pureza descargable.",
          "tag": "marketing"
        }
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
        {
          "cantidad": "80 un.",
          "item": "Piezas de Cortesía 25 g",
          "detalle": "20× Ulmo Puro APF, 20× Avellana ω-7, 20× Polen, 20× Cacao Nibs"
        },
        {
          "cantidad": "28 un.",
          "item": "Reserva de Recepción 150 g (Cabin-Safe)",
          "detalle": "7× Ulmo Puro, 7× Avellana ω-7, 7× Polen, 7× Cacao Nibs (Net Vol. 98 ml TSA Approved)"
        },
        {
          "cantidad": "1 un.",
          "item": "Glorificador Minimalista de Recepción",
          "detalle": "Exhibidor de mesón para las 4 variedades de 150 g con frascos probadores de aroma"
        },
        {
          "cantidad": "2 un.",
          "item": "Regletas de Cata Horizontal",
          "detalle": "Para servicio de desayuno en mesa y suites preferentes"
        },
        {
          "cantidad": "80 un.",
          "item": "Pasaportes Botánicos de Habitación",
          "detalle": "Con llamado explícito al huésped a adquirir la reserva de 150 g en recepción antes de su vuelo"
        }
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
        {
          "titulo": "Conversión Cruzada Suite a Recepción",
          "descripcion": "Pasaporte de habitación con QR que invita a retirar la reserva de 150 g antes del vuelo.",
          "tag": "marketing"
        },
        {
          "titulo": "Certificación Cabin & TSA Approved",
          "descripcion": "Garantía volumétrica de 98 ml para tránsito aeroportuario sin decomiso.",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Membresía Digital para Huéspedes",
          "descripcion": "Pase digital para Apple/Google Wallet con trazabilidad y beneficios en próximas visitas.",
          "tag": "fidelizacion"
        }
      ],
      "recomendado_para": "Gerentes Generales, Propietarios y Directores de Finanzas que exigen un retorno de inversión transparente e inmediato sin gasto muerto."
    }
  ],
  "molecular_pairings": [
    {
      "id": "miel-cruda-pura-ulmo",
      "nombre": "Miel Cruda Pura de Ulmo & Tiaca (42°S)",
      "subtitulo": "Floración monofloral de bosque nativo",
      "formato": "25 g (Amenidad / Turndown) · 150 g (Boutique de Recepción)",
      "perfil_sensorial": "Miel monofloral de Ulmo cremada en frío. Textura sedosa sin goteo, notas de jazmín blanco, anís estrella, sutil fondo mentolado y frescor balsámico.",
      "perfil_bioquimico": "Miel pura sin pasteurizar con textura cremada en frío. Ideal para el servicio de turndown en suites junto a una infusión de autor o descanso nocturno.",
      "par_en_barra": "Ritual Nocturno (Turndown Service) & Infusiones: Acompañamiento en habitación para inducir descanso natural.",
      "neurogastronomia": "Aromas balsámicos y notas florales suaves que reconfortan el paladar en la tranquilidad de la suite.",
      "badge": "Variedad 01 · Pureza & Ritual Nocturno",
      "badge_bioquimico": "Ulmo Monofloral"
    },
    {
      "id": "miel-avellana-chilena-gevuina",
      "nombre": "Miel con Avellana Chilena Tostada",
      "subtitulo": "Gevuina avellana silvestre tostada en frío",
      "formato": "25 g (Cata en Desayuno) · 150 g (Boutique de Recepción)",
      "perfil_sensorial": "Emulsión untable de miel cruda y avellana chilena silvestre recién tostada. Notas cálidas de praliné nativo, madera noble tostada y un fondo envolvente de toffee natural.",
      "perfil_bioquimico": "Emulsión suave y untable de miel cruda y avellana chilena silvestre tostada, perfecta para el salón de desayuno.",
      "par_en_barra": "Gastronomía Matinal & Cata de Mesa: Para acompañar pan de masa madre, quesos de campo y frutas en el desayuno de autor.",
      "neurogastronomia": "Notas cálidas de praliné nativo y avellana tostada que equilibran preparaciones lácteas y ácidas.",
      "badge": "Variedad 02 · Gastronomía Matinal",
      "badge_bioquimico": "Avellana Silvestre"
    },
    {
      "id": "miel-polen-floral-apicola",
      "nombre": "Miel con Polen Floral Apícola Nativo",
      "subtitulo": "Polen apícola de bosque templado lluvioso",
      "formato": "25 g (Estación Bienestar) · 150 g (Boutique de Recepción)",
      "perfil_sensorial": "Miel cruda con microgránulos de polen floral nativo. Textura perlada y aterciopelada, notas florales silvestres, cereal tostado y umami dulce.",
      "perfil_bioquimico": "Miel cruda con microgránulos de polen floral nativo rico en nutrientes naturales y textura perlada.",
      "par_en_barra": "Estación Saludable & Spa: Consumo directo en ayunas o en el buffet de bienestar antes de iniciar la jornada.",
      "neurogastronomia": "Notas de cereal tostado y umami dulce que aportan energía limpia y persistencia en boca.",
      "badge": "Variedad 03 · Bienestar & Desayuno",
      "badge_bioquimico": "Polen Floral Nativo"
    },
    {
      "id": "miel-cacao-nibs-santander",
      "nombre": "Miel con Cacao Nibs de Santander",
      "subtitulo": "Cacao criollo con notas de mora silvestre",
      "formato": "25 g (Acompañamiento Excursión) · 150 g (Boutique de Recepción)",
      "perfil_sensorial": "Miel del bosque templado combinada con nibs tostados de cacao criollo. Contraste de texturas (cremosa y crujiente), notas de frutos rojos, mora silvestre y chocolate noble.",
      "perfil_bioquimico": "Contraste crujiente de nibs de cacao criollo y miel de bosque, ideal como colación de energía para excursiones.",
      "par_en_barra": "Acompañamiento de Excursiones: Amenidad para huéspedes antes de caminatas, navegaciones o cabalgatas.",
      "neurogastronomia": "Contrapunto amargo y achocolatado que entrega vitalidad sostenida en actividades al aire libre.",
      "badge": "Variedad 04 · Excursión & Boutique",
      "badge_bioquimico": "Cacao Criollo"
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
}'::jsonb,
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_hoteles';
  ELSE
    INSERT INTO site_content (section_key, item_order, content, is_active, created_at, updated_at)
    VALUES ('b2b_hoteles', 0, '{
  "slug": "hoteles",
  "tipo": "hotel",
  "kicker": "ALIANZAS B2B · HOSPITALIDAD DE AUTOR & LODGES",
  "kicker_en": "B2B ALLIANCES · BOUTIQUE HOSPITALITY & LODGES",
  "headline": "Miel Cruda de Bosque Nativo de Chiloé (42°S) para Hotelería de Autor",
  "headline_en": "Native Rainforest Raw Honey from Chiloé (42°S) for Signature Hospitality",
  "subheadline": "Formatos en 25 g para amenidad de bienvenida y cata en mesa de desayuno, y frascos de 150 g para vitrina de recepción y boutique. Miel cruda certificada de bosque nativo que transforma la cortesía en un recuerdo de viaje.",
  "subheadline_en": "Modular formats in 25 g for welcome amenities and breakfast tastings, and 150 g jars for front-desk retail and hotel boutique. Certified raw native honey turning courtesy into a travel memory.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_hoteles/b5a4e451-35a5-4cd0-9ea3-a479d40fced3.webp",
  "suggested_products_copy": "Disponibles en Formato 25 g (Amenidad & Desayuno) y Frasco 150 g (Boutique de Recepción). Cuatro variedades botánicas de Chiloé diseñadas para bienvenida en suite, mesa de desayuno y boutique.",
  "suggested_products_copy_en": "Available in 25 g (Amenity & Breakfast Tasting) and 150 g (Front Desk Boutique). Four botanical varieties from Chiloé designed for in-suite welcome, breakfast tables, and retail boutique.",
  "cta_text": "Solicitar Muestras de Degustación",
  "cta_text_en": "Request Tasting Samples",
  "cta_href": "#registro",
  "value_props": [
    {
      "icon": "ShieldCheck",
      "title": "Amenidad de Bienvenida en Habitación (25 g)",
      "description": "Frasco individual de vidrio con apertura sellada para turndown nocturno o bandeja de llegada, sin plásticos de un solo uso."
    },
    {
      "icon": "Layers",
      "title": "Cata en Salón de Desayuno",
      "description": "Formato para mesa de desayuno de autor que acompaña quesos de campo, bollería de masa madre e infusiones nativas con textura untable sin goteo."
    },
    {
      "icon": "TrendingUp",
      "title": "Frasco de Recuerdo en Recepción (150 g)",
      "description": "Producto de alta rotación en el checkout para que el huésped lleve el sabor del bosque consigo. Formato apto para equipaje de mano en vuelos nacionales e internacionales."
    },
    {
      "icon": "QrCode",
      "title": "Trazabilidad y Análisis de Lote",
      "description": "Cada frasco enlaza al pasaporte de lote oficial: humedad < 18%, análisis de polen nativo y coordenadas exactas del apiario en Chiloé."
    }
  ],
  "stats": [
    {
      "value": "25 g",
      "label": "Amenidad de Habitación"
    },
    {
      "value": "150 g",
      "label": "Formato Souvenir Boutique"
    },
    {
      "value": "< 18%",
      "label": "Humedad Controlada"
    },
    {
      "value": "Chiloé 42°S",
      "label": "Apiarios Fijos de Bosque"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "25 g — Amenidad en Habitación & Mesa",
      "desc": "Servicio nocturno de apertura de cama (turndown ritual), cata en mesa de desayuno y acompañamiento para infusiones nativas."
    },
    {
      "step": "02",
      "title": "150 g — Formato de Recuerdo en Recepción",
      "desc": "Exhibición en el atril de mesón de recepción. Formato de reserva para que el huésped lo adquiera como souvenir gastronómico."
    },
    {
      "step": "03",
      "title": "Retorno y Sostenibilidad del Servicio",
      "desc": "La rotación en el checkout y boutique amortiza el costo de las amenidades de bienvenida, ofreciendo una experiencia memorable de alto estándar."
    }
  ],
  "faq": [
    {
      "question": "¿Cómo se presenta el envase de 150 g para huéspedes que viajan?",
      "answer": "Nuestros frascos de 150 g están herméticamente sellados con lacre y etiqueta de alta resistencia. Su volumen y dimensiones son aptos para transporte seguro en equipaje de viaje."
    },
    {
      "question": "¿Cuál es el origen y estándar botánico de la miel de Ulmo?",
      "answer": "Miel cruda monofloral de Eucryphia cordifolia recolectada en apiarios fijos del bosque nativo de Chiloé, bajo norma chilena NCh2981 con más del 45% de dominancia polínica y humedad natural menor al 18%."
    },
    {
      "question": "¿Cómo se conserva la Miel con Avellana Chilena?",
      "answer": "Elaboramos una emulsión mecánica en frío que integra avellana chilena silvestre tostada en la miel cruda, manteniendo una textura cremada homogénea sin separación de fases ni conservantes artificiales durante más de 12 meses."
    },
    {
      "question": "¿Cómo solicitar muestras de degustación antes de emitir una orden?",
      "answer": "A través del formulario de esta página. Despachamos a gerencia general o jefatura de alimentos y bebidas una selección de degustación para validar texturas, notas aromáticas y presentación de sala."
    }
  ],
  "commercial_strategy": {
    "titulo": "Dinámica de Experiencia en Habitación y Venta en Recepción",
    "titulo_en": "Room Experience and Front Desk Retail Dynamics",
    "bajada": "La disposición del frasco de 25 g como cortesía activa el descubrimiento del producto y estimula la compra del frasco de 150 g en el checkout como recuerdo de viaje.",
    "bajada_en": "The 25 g jar courtesy amenity drives product discovery and encourages guests to purchase the 150 g retail jar at checkout as a travel souvenir.",
    "aumento_ticket": "Recaudación complementaria en recepción que amortiza la inversión en amenidades y entrega utilidad líquida.",
    "aumento_ticket_en": "Complementary front-desk retail revenue that amortizes amenity investments while delivering net profit.",
    "herramienta_clave": "Atril de Mesón de Recepción, Pasaportes de Habitación Bilingües & Frascos de 150 g",
    "herramienta_clave_en": "Front Desk Display, Bilingual Room Botanical Passports & 150 g Jars",
    "mecanica_ventas": [
      "Paso 1: Disposición del frasco de 25 g en turndown nocturno o mesa de desayuno junto a su Pasaporte Botánico.",
      "Paso 2: El huésped degusta la textura sedosa y los aromas de bosque nativo.",
      "Paso 3: El pasaporte indica que el frasco de 150 g para llevar está disponible en recepción.",
      "Paso 4: En el checkout, el atril de mesón permite al huésped llevarse el frasco como recuerdo auténtico de su viaje."
    ]
  },
  "tools": [],
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
        {
          "cantidad": "120 un.",
          "item": "Mini Frascos de Cortesía 25 g",
          "detalle": "30× Ulmo Puro APF, 30× Avellana Chilena ω-7, 30× Polen Biomimético, 30× Cacao Nibs Santander"
        },
        {
          "cantidad": "3 un.",
          "item": "Regletas de Cata Horizontal",
          "detalle": "Madera nativa cepillada con 4 cavidades calibradas para Tasting Flights en suites o salón"
        },
        {
          "cantidad": "60 un.",
          "item": "Pasaportes Botánicos A6",
          "detalle": "Papel algodón bilingüe (ES/EN) con relato bioactivo del bosque a 42°S y QR de trazabilidad"
        },
        {
          "cantidad": "1 un.",
          "item": "Protocolo Técnico de Servicio",
          "detalle": "Ficha impermeable de 1 página para garzones y housekeeping con temperaturas y maridajes"
        }
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
        {
          "titulo": "Cata Sensorial Bilingüe en Suite",
          "descripcion": "El huésped escanea el QR del frasco y explora la curva aromática y el factor APF.",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Trazabilidad Oficial NCh2981",
          "descripcion": "Informe melisopalinológico y análisis de pureza descargable.",
          "tag": "marketing"
        }
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
        {
          "cantidad": "80 un.",
          "item": "Piezas de Cortesía 25 g",
          "detalle": "20× Ulmo Puro APF, 20× Avellana ω-7, 20× Polen, 20× Cacao Nibs"
        },
        {
          "cantidad": "28 un.",
          "item": "Reserva de Recepción 150 g (Cabin-Safe)",
          "detalle": "7× Ulmo Puro, 7× Avellana ω-7, 7× Polen, 7× Cacao Nibs (Net Vol. 98 ml TSA Approved)"
        },
        {
          "cantidad": "1 un.",
          "item": "Glorificador Minimalista de Recepción",
          "detalle": "Exhibidor de mesón para las 4 variedades de 150 g con frascos probadores de aroma"
        },
        {
          "cantidad": "2 un.",
          "item": "Regletas de Cata Horizontal",
          "detalle": "Para servicio de desayuno en mesa y suites preferentes"
        },
        {
          "cantidad": "80 un.",
          "item": "Pasaportes Botánicos de Habitación",
          "detalle": "Con llamado explícito al huésped a adquirir la reserva de 150 g en recepción antes de su vuelo"
        }
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
        {
          "titulo": "Conversión Cruzada Suite a Recepción",
          "descripcion": "Pasaporte de habitación con QR que invita a retirar la reserva de 150 g antes del vuelo.",
          "tag": "marketing"
        },
        {
          "titulo": "Certificación Cabin & TSA Approved",
          "descripcion": "Garantía volumétrica de 98 ml para tránsito aeroportuario sin decomiso.",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Membresía Digital para Huéspedes",
          "descripcion": "Pase digital para Apple/Google Wallet con trazabilidad y beneficios en próximas visitas.",
          "tag": "fidelizacion"
        }
      ],
      "recomendado_para": "Gerentes Generales, Propietarios y Directores de Finanzas que exigen un retorno de inversión transparente e inmediato sin gasto muerto."
    }
  ],
  "molecular_pairings": [
    {
      "id": "miel-cruda-pura-ulmo",
      "nombre": "Miel Cruda Pura de Ulmo & Tiaca (42°S)",
      "subtitulo": "Floración monofloral de bosque nativo",
      "formato": "25 g (Amenidad / Turndown) · 150 g (Boutique de Recepción)",
      "perfil_sensorial": "Miel monofloral de Ulmo cremada en frío. Textura sedosa sin goteo, notas de jazmín blanco, anís estrella, sutil fondo mentolado y frescor balsámico.",
      "perfil_bioquimico": "Miel pura sin pasteurizar con textura cremada en frío. Ideal para el servicio de turndown en suites junto a una infusión de autor o descanso nocturno.",
      "par_en_barra": "Ritual Nocturno (Turndown Service) & Infusiones: Acompañamiento en habitación para inducir descanso natural.",
      "neurogastronomia": "Aromas balsámicos y notas florales suaves que reconfortan el paladar en la tranquilidad de la suite.",
      "badge": "Variedad 01 · Pureza & Ritual Nocturno",
      "badge_bioquimico": "Ulmo Monofloral"
    },
    {
      "id": "miel-avellana-chilena-gevuina",
      "nombre": "Miel con Avellana Chilena Tostada",
      "subtitulo": "Gevuina avellana silvestre tostada en frío",
      "formato": "25 g (Cata en Desayuno) · 150 g (Boutique de Recepción)",
      "perfil_sensorial": "Emulsión untable de miel cruda y avellana chilena silvestre recién tostada. Notas cálidas de praliné nativo, madera noble tostada y un fondo envolvente de toffee natural.",
      "perfil_bioquimico": "Emulsión suave y untable de miel cruda y avellana chilena silvestre tostada, perfecta para el salón de desayuno.",
      "par_en_barra": "Gastronomía Matinal & Cata de Mesa: Para acompañar pan de masa madre, quesos de campo y frutas en el desayuno de autor.",
      "neurogastronomia": "Notas cálidas de praliné nativo y avellana tostada que equilibran preparaciones lácteas y ácidas.",
      "badge": "Variedad 02 · Gastronomía Matinal",
      "badge_bioquimico": "Avellana Silvestre"
    },
    {
      "id": "miel-polen-floral-apicola",
      "nombre": "Miel con Polen Floral Apícola Nativo",
      "subtitulo": "Polen apícola de bosque templado lluvioso",
      "formato": "25 g (Estación Bienestar) · 150 g (Boutique de Recepción)",
      "perfil_sensorial": "Miel cruda con microgránulos de polen floral nativo. Textura perlada y aterciopelada, notas florales silvestres, cereal tostado y umami dulce.",
      "perfil_bioquimico": "Miel cruda con microgránulos de polen floral nativo rico en nutrientes naturales y textura perlada.",
      "par_en_barra": "Estación Saludable & Spa: Consumo directo en ayunas o en el buffet de bienestar antes de iniciar la jornada.",
      "neurogastronomia": "Notas de cereal tostado y umami dulce que aportan energía limpia y persistencia en boca.",
      "badge": "Variedad 03 · Bienestar & Desayuno",
      "badge_bioquimico": "Polen Floral Nativo"
    },
    {
      "id": "miel-cacao-nibs-santander",
      "nombre": "Miel con Cacao Nibs de Santander",
      "subtitulo": "Cacao criollo con notas de mora silvestre",
      "formato": "25 g (Acompañamiento Excursión) · 150 g (Boutique de Recepción)",
      "perfil_sensorial": "Miel del bosque templado combinada con nibs tostados de cacao criollo. Contraste de texturas (cremosa y crujiente), notas de frutos rojos, mora silvestre y chocolate noble.",
      "perfil_bioquimico": "Contraste crujiente de nibs de cacao criollo y miel de bosque, ideal como colación de energía para excursiones.",
      "par_en_barra": "Acompañamiento de Excursiones: Amenidad para huéspedes antes de caminatas, navegaciones o cabalgatas.",
      "neurogastronomia": "Contrapunto amargo y achocolatado que entrega vitalidad sostenida en actividades al aire libre.",
      "badge": "Variedad 04 · Excursión & Boutique",
      "badge_bioquimico": "Cacao Criollo"
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
}'::jsonb, true, NOW(), NOW());
  END IF;

  -- Actualizar b2b_tiendas_gourmet
  IF EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_tiendas_gourmet') THEN
    UPDATE site_content
    SET content = '{
  "slug": "tiendas-gourmet",
  "tipo": "tienda_gourmet",
  "kicker": "Para Tiendas Gourmet",
  "kicker_en": "For Gourmet Stores",
  "headline": "El frasco que tus clientes buscan",
  "headline_en": "The jar your customers are searching for",
  "subheadline": "Miel cruda de bosque nativo con un ecosistema completo para retail: trazabilidad desde la colmena, fondos de co-marketing y lealtad digital encadenada.",
  "subheadline_en": "Raw native honey with a full retail ecosystem: hive-to-table traceability, co-op marketing and digital customer loyalty.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_tiendas_gourmet/baab6ecc-8801-4fe5-a257-9c813393c3e1.webp",
  "suggested_products_copy": "Para retail gourmet recomendamos el espectro completo: mini frascos de 25g para compra de impulso/regalos, y los formatos de 150g y 500g para los entusiastas de la gastronomía.",
  "cta_text": "Solicitar catálogo",
  "cta_text_en": "Request catalog",
  "cta_href": "#registro",
  "commercial_strategy": {
    "titulo": "Estrategia de Rotación Acelerada & Maridaje Cruzado",
    "titulo_en": "Rapid Turnover & Cross-Merchandising Strategy",
    "bajada": "Ubica la miel junto a quesos maduros y charcutería fina. Una sola gota de degustación en el mostrador convierte al 80% de los visitantes en compradores.",
    "bajada_en": "Position honey beside aged cheeses and fine charcuterie. A single sample at the counter converts 80% of browsing visitors into buyers.",
    "aumento_ticket": "+$8.500 CLP por ticket promedio mediante venta cruzada gourmet",
    "aumento_ticket_en": "+$8,500 CLP average basket increase via gourmet cross-merchandising",
    "mecanica_ventas": [
      "Cata activa de mesón: El expositor de degustación permite al cliente probar una gota en paleta compostable sin esperar al dependiente.",
      "Cross-merchandising: Fichas de maridaje que sugieren combinar Miel Cruda con queso azul o de cabra, y Crema con Avellana sobre pan de masa madre.",
      "Escala de formatos: Mini frascos de 25g junto a la caja para impulso rápido ($2.500 CLP) y frascos de 150g/500g en góndola principal.",
      "Estuches de presentación: Sets de regalo preparados para fechas clave y ocasiones especiales que incrementan la rotación de tienda."
    ],
    "herramienta_clave": "Exhibidor Escalonado de Mostrador & Muestrario de Degustación",
    "herramienta_clave_en": "Tiered Counter Stand & Active Tasting Bar"
  },
  "tools": [],
  "kits": [
    {
      "id": "vitrina-autor",
      "nombre": "Set Piloto Vitrina & Sello Botánico",
      "badge": "Iniciación Gourmet",
      "tier": "entrada",
      "tagline": "El set indispensable para probar rotación en tu mostrador con respaldo analítico",
      "descripcion": "Selección de 24 frascos de 150g en las variedades más apreciadas para mesón de venta y rotación ágil, con displays A6 de vitrina con sello analítico Codex.",
      "precio_neto_clp": 75000,
      "pvp_estimado_clp": 130000,
      "margen_estimado_pct": 42,
      "moq_summary": "24 frascos 150g surtidos + displays A6",
      "sales_strategy": "Coloca los 24 frascos en el mostrador o mesón de cobro para compras de impulso con margen del 42%.",
      "componentes_fisicos": [
        {
          "cantidad": "24 un.",
          "item": "Frascos 150g surtidos",
          "detalle": "8 Miel Cruda Floral, 8 Crema con Avellana, 4 Crema con Cacao, 4 Crema con Polen"
        },
        {
          "cantidad": "1 pack",
          "item": "Displays A6 de Vitrina (Shelf-Talkers)",
          "detalle": "Fichas con garantía analítica Codex (<17.5% humedad, invertasa viva) y QR de trazabilidad"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Reseñas Verificadas de Cata",
          "descripcion": "Tus clientes escanean y comprueban las opiniones reales de otros compradores",
          "tag": "resenas"
        },
        {
          "titulo": "Trazabilidad de Lote y Colmenar",
          "descripcion": "Verificación digital en tiempo real del análisis de polen y trayectoria apícola del bosque",
          "tag": "trazabilidad"
        }
      ],
      "recomendado_para": "Tiendas gourmet, emporios barriales, vinotecas y panaderías artesanales"
    },
    {
      "id": "emporio-selecto",
      "nombre": "Reserva Emporio Maestro & Colección",
      "badge": "Abastecimiento Completo",
      "tier": "avanzado",
      "tagline": "El mix completo de formatos de 150g y 500g Reserva para clientes habituales",
      "descripcion": "Surtido balanceado de frascos de 150g y frascos de 500g Reserva del Bosque para abastecer consumo de mesa y amantes de la miel tradicional con margen protegido del 43%+.",
      "precio_neto_clp": 249000,
      "pvp_estimado_clp": 435000,
      "margen_estimado_pct": 43,
      "moq_summary": "60 frascos 150g + 16 frascos 500g + material vitrina",
      "sales_strategy": "La combinación de 150g y 500g cubre tanto la compra de impulso como el cliente habitual de cocina, generando recompra recurrente cada 3 semanas.",
      "componentes_fisicos": [
        {
          "cantidad": "60 un.",
          "item": "Frascos 150g vitrina",
          "detalle": "20 Miel Cruda Floral, 20 Crema Avellana, 10 Crema Cacao, 10 Crema Polen"
        },
        {
          "cantidad": "16 un.",
          "item": "Frascos 500g Reserva del Bosque",
          "detalle": "Edición mayor con numeración de lote y origen botánico protegido"
        },
        {
          "cantidad": "1 pack",
          "item": "Material Completo de Exhibición",
          "detalle": "Atril de madera nativa + fichas analíticas enmarcables de laboratorio"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Trazabilidad Analítica y Reseñas",
          "descripcion": "Acceso directo a fichas de ciencia y pureza de laboratorio para clientes informados",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Reposición Ágil con Factura Inmediata",
          "descripcion": "Reordenamiento en 1 clic desde el portal con condiciones comerciales mayoristas blindadas",
          "tag": "pricing"
        }
      ],
      "recomendado_para": "Emporios consolidados, tiendas de vinos y quesos, y locales de autor"
    }
  ],
  "value_props": [
    {
      "icon": "Shield",
      "title": "Trazabilidad verificable por lote",
      "description": "Cada frasco lleva número de lote y origen botánico verificado. Tu cliente accede a la trazabilidad y respalda una economía de preservación."
    },
    {
      "icon": "Award",
      "title": "Fondos de Co-Marketing (Co-op)",
      "description": "Nuestra relación es bidireccional. Las recompras rápidas y altos volúmenes generan fondos de co-marketing y rebates porcentuales que invertimos juntos en activar ventas en tu tienda."
    },
    {
      "icon": "Users",
      "title": "Kit de Entrada y Pack Digital",
      "description": "Tu primer pedido viene como un ''Set de Entrada''. Incluye material impreso y un pack digital listo para desplegar en tus redes sociales y góndola."
    },
    {
      "icon": "Package",
      "title": "Línea completa",
      "description": "Mini frascos de 25g para regalo/impulso, frascos de 150g y frascos mayores de 500g Reserva del Bosque."
    }
  ],
  "stats": [
    {
      "value": "3 formatos",
      "label": "Presentaciones 25g, 150g y 500g"
    },
    {
      "value": "35–45%",
      "label": "Margen comercial proyectado"
    },
    {
      "value": "SAG",
      "label": "Certificación sanitaria oficial"
    },
    {
      "value": "Alta",
      "label": "Recompra documentada en retail"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Set de Entrada",
      "desc": "Inicia con un Set diseñado para rotar rápido, acompañado de tu pack digital."
    },
    {
      "step": "02",
      "title": "Onboarding de Clientes",
      "desc": "A través de un código QR, tus consumidores se unen a nuestro programa de fidelidad, ganando su primer sello solo por visitar tu local."
    },
    {
      "step": "03",
      "title": "Crecimiento de Tier",
      "desc": "Tus recompras rápidas desbloquean rebates, fondos de co-marketing y el status Guardián de exclusividad territorial."
    }
  ],
  "faq": [
    {
      "question": "¿Cómo funcionan los fondos de co-marketing (Co-op)?",
      "answer": "Premiamos tu velocidad y volumen. Ciertos umbrales de compra activan fondos que La Obrera y el Zángano re-invierte en publicidad local, eventos en tu tienda o degustaciones para ayudarte a rotar el inventario aún más rápido."
    },
    {
      "question": "¿Qué es el Pack Digital del Set de Entrada?",
      "answer": "Junto a tus primeros frascos, te enviamos material fotográfico profesional, videos cortos e historias del bosque optimizadas para que alimentes las redes sociales de tu tienda inmediatamente."
    },
    {
      "question": "¿Cómo funciona la exclusividad territorial?",
      "answer": "Al alcanzar el tier de ''Guardián'' en nuestro programa de Aliados del Bosque, te otorgamos exclusividad de radio (ej. única tienda autorizada en 5km a la redonda)."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-directorio-mapa",
      "package_name": "@enjambre/shop-chrome",
      "titulo": "Directorio Oficial de Embajadas & Geolocalización",
      "titulo_en": "Official Partner Directory & Map Geolocation",
      "descripcion": "Inclusión destacada de tu emporio o tienda en el mapa oficial de puntos de venta de Enjambre Legado. Los comensales que buscan miel cruda en tu ciudad son guiados a tu dirección física.",
      "descripcion_en": "Featured listing on the official Enjambre Legado partner map. Discerning shoppers searching for raw honey in your city are directed straight to your doorstep.",
      "badge": "Tráfico Cualificado",
      "beneficio_comercial": "Canaliza clientes con alta intención de compra directamente a tu tienda física sin costos publicitarios adicionales.",
      "beneficio_comercial_en": "Channels high-intent gourmet shoppers directly into your retail shop without extra advertising ad spend."
    },
    {
      "id": "modulo-tienda-resenas",
      "package_name": "@enjambre/resenas",
      "titulo": "QR de Reseñas de Mesón & Validación en Góndola",
      "titulo_en": "Counter Review QR & Shelf Proof Validation",
      "descripcion": "Material POP inteligente con código QR que muestra a los compradores notas de cata y calificaciones de clientes reales justo en el punto de decisión de compra.",
      "descripcion_en": "Smart shelf display material linking directly to verified tasting notes and customer ratings right at the point of decision.",
      "badge": "Conversión Retail",
      "beneficio_comercial": "Multiplica la velocidad de rotación en estantería al eliminar dudas sobre el sabor o la pureza frente a marcas convencionales.",
      "beneficio_comercial_en": "Accelerates shelf turnover by eliminating doubts regarding authenticity and taste versus conventional brands."
    },
    {
      "id": "modulo-pricing",
      "package_name": "@enjambre/pricing",
      "titulo": "Motor de Márgenes Escalonados (40%–45%) & Rebates Co-Op",
      "titulo_en": "Tiered Wholesale Margins (40%–45%) & Co-Op Rebates",
      "descripcion": "Algoritmo de precios mayoristas con cálculo dinámico de márgenes y asignación automática de fondos de co-marketing al mantener recompras regulares.",
      "descripcion_en": "Wholesale pricing algorithm calculating real-time margins and allocating co-op marketing rebates for timely store restocks.",
      "badge": "Rentabilidad Protegida",
      "beneficio_comercial": "Garantiza un margen comercial protegido superior al 40% y financia degustaciones o publicidad local compartida para tu tienda.",
      "beneficio_comercial_en": "Guarantees protected 40%+ margins while co-funding in-store tastings and shared local advertising."
    },
    {
      "id": "modulo-tienda-sale-qr",
      "package_name": "@enjambre/sale-qr",
      "titulo": "Trazabilidad de Recolección & Certificado Botánico por Lote",
      "titulo_en": "Harvest Provenance & Batch Botanical Certificate",
      "descripcion": "Cada frasco en tu vitrina porta un sello de trazabilidad que conecta con los predios protegidos de Chiloé, fecha de recolección y análisis de laboratorio.",
      "descripcion_en": "Each jar on your display carries a traceability seal linking to the Chiloé protected apiary, collection date, and lab tests.",
      "badge": "Origen Auténtico",
      "beneficio_comercial": "Justifica un PVP gourmet de alto valor frente a mieles industriales de supermercado, fidelizando a clientes de paladar exigente.",
      "beneficio_comercial_en": "Justifies a premium gourmet retail price over supermarket industrial honeys, building loyalty with demanding food lovers."
    }
  ],
  "seo_title": "Miel Artesanal para Tiendas Gourmet · La Obrera y el Zángano",
  "seo_description": "Miel cruda para tiendas gourmet. Trazabilidad completa, formatos de 25g, 150g y 500g, y un programa de fidelidad y referidos."
}'::jsonb,
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_tiendas_gourmet';
  ELSE
    INSERT INTO site_content (section_key, item_order, content, is_active, created_at, updated_at)
    VALUES ('b2b_tiendas_gourmet', 0, '{
  "slug": "tiendas-gourmet",
  "tipo": "tienda_gourmet",
  "kicker": "Para Tiendas Gourmet",
  "kicker_en": "For Gourmet Stores",
  "headline": "El frasco que tus clientes buscan",
  "headline_en": "The jar your customers are searching for",
  "subheadline": "Miel cruda de bosque nativo con un ecosistema completo para retail: trazabilidad desde la colmena, fondos de co-marketing y lealtad digital encadenada.",
  "subheadline_en": "Raw native honey with a full retail ecosystem: hive-to-table traceability, co-op marketing and digital customer loyalty.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_tiendas_gourmet/baab6ecc-8801-4fe5-a257-9c813393c3e1.webp",
  "suggested_products_copy": "Para retail gourmet recomendamos el espectro completo: mini frascos de 25g para compra de impulso/regalos, y los formatos de 150g y 500g para los entusiastas de la gastronomía.",
  "cta_text": "Solicitar catálogo",
  "cta_text_en": "Request catalog",
  "cta_href": "#registro",
  "commercial_strategy": {
    "titulo": "Estrategia de Rotación Acelerada & Maridaje Cruzado",
    "titulo_en": "Rapid Turnover & Cross-Merchandising Strategy",
    "bajada": "Ubica la miel junto a quesos maduros y charcutería fina. Una sola gota de degustación en el mostrador convierte al 80% de los visitantes en compradores.",
    "bajada_en": "Position honey beside aged cheeses and fine charcuterie. A single sample at the counter converts 80% of browsing visitors into buyers.",
    "aumento_ticket": "+$8.500 CLP por ticket promedio mediante venta cruzada gourmet",
    "aumento_ticket_en": "+$8,500 CLP average basket increase via gourmet cross-merchandising",
    "mecanica_ventas": [
      "Cata activa de mesón: El expositor de degustación permite al cliente probar una gota en paleta compostable sin esperar al dependiente.",
      "Cross-merchandising: Fichas de maridaje que sugieren combinar Miel Cruda con queso azul o de cabra, y Crema con Avellana sobre pan de masa madre.",
      "Escala de formatos: Mini frascos de 25g junto a la caja para impulso rápido ($2.500 CLP) y frascos de 150g/500g en góndola principal.",
      "Estuches de presentación: Sets de regalo preparados para fechas clave y ocasiones especiales que incrementan la rotación de tienda."
    ],
    "herramienta_clave": "Exhibidor Escalonado de Mostrador & Muestrario de Degustación",
    "herramienta_clave_en": "Tiered Counter Stand & Active Tasting Bar"
  },
  "tools": [],
  "kits": [
    {
      "id": "vitrina-autor",
      "nombre": "Set Piloto Vitrina & Sello Botánico",
      "badge": "Iniciación Gourmet",
      "tier": "entrada",
      "tagline": "El set indispensable para probar rotación en tu mostrador con respaldo analítico",
      "descripcion": "Selección de 24 frascos de 150g en las variedades más apreciadas para mesón de venta y rotación ágil, con displays A6 de vitrina con sello analítico Codex.",
      "precio_neto_clp": 75000,
      "pvp_estimado_clp": 130000,
      "margen_estimado_pct": 42,
      "moq_summary": "24 frascos 150g surtidos + displays A6",
      "sales_strategy": "Coloca los 24 frascos en el mostrador o mesón de cobro para compras de impulso con margen del 42%.",
      "componentes_fisicos": [
        {
          "cantidad": "24 un.",
          "item": "Frascos 150g surtidos",
          "detalle": "8 Miel Cruda Floral, 8 Crema con Avellana, 4 Crema con Cacao, 4 Crema con Polen"
        },
        {
          "cantidad": "1 pack",
          "item": "Displays A6 de Vitrina (Shelf-Talkers)",
          "detalle": "Fichas con garantía analítica Codex (<17.5% humedad, invertasa viva) y QR de trazabilidad"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Reseñas Verificadas de Cata",
          "descripcion": "Tus clientes escanean y comprueban las opiniones reales de otros compradores",
          "tag": "resenas"
        },
        {
          "titulo": "Trazabilidad de Lote y Colmenar",
          "descripcion": "Verificación digital en tiempo real del análisis de polen y trayectoria apícola del bosque",
          "tag": "trazabilidad"
        }
      ],
      "recomendado_para": "Tiendas gourmet, emporios barriales, vinotecas y panaderías artesanales"
    },
    {
      "id": "emporio-selecto",
      "nombre": "Reserva Emporio Maestro & Colección",
      "badge": "Abastecimiento Completo",
      "tier": "avanzado",
      "tagline": "El mix completo de formatos de 150g y 500g Reserva para clientes habituales",
      "descripcion": "Surtido balanceado de frascos de 150g y frascos de 500g Reserva del Bosque para abastecer consumo de mesa y amantes de la miel tradicional con margen protegido del 43%+.",
      "precio_neto_clp": 249000,
      "pvp_estimado_clp": 435000,
      "margen_estimado_pct": 43,
      "moq_summary": "60 frascos 150g + 16 frascos 500g + material vitrina",
      "sales_strategy": "La combinación de 150g y 500g cubre tanto la compra de impulso como el cliente habitual de cocina, generando recompra recurrente cada 3 semanas.",
      "componentes_fisicos": [
        {
          "cantidad": "60 un.",
          "item": "Frascos 150g vitrina",
          "detalle": "20 Miel Cruda Floral, 20 Crema Avellana, 10 Crema Cacao, 10 Crema Polen"
        },
        {
          "cantidad": "16 un.",
          "item": "Frascos 500g Reserva del Bosque",
          "detalle": "Edición mayor con numeración de lote y origen botánico protegido"
        },
        {
          "cantidad": "1 pack",
          "item": "Material Completo de Exhibición",
          "detalle": "Atril de madera nativa + fichas analíticas enmarcables de laboratorio"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Trazabilidad Analítica y Reseñas",
          "descripcion": "Acceso directo a fichas de ciencia y pureza de laboratorio para clientes informados",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Reposición Ágil con Factura Inmediata",
          "descripcion": "Reordenamiento en 1 clic desde el portal con condiciones comerciales mayoristas blindadas",
          "tag": "pricing"
        }
      ],
      "recomendado_para": "Emporios consolidados, tiendas de vinos y quesos, y locales de autor"
    }
  ],
  "value_props": [
    {
      "icon": "Shield",
      "title": "Trazabilidad verificable por lote",
      "description": "Cada frasco lleva número de lote y origen botánico verificado. Tu cliente accede a la trazabilidad y respalda una economía de preservación."
    },
    {
      "icon": "Award",
      "title": "Fondos de Co-Marketing (Co-op)",
      "description": "Nuestra relación es bidireccional. Las recompras rápidas y altos volúmenes generan fondos de co-marketing y rebates porcentuales que invertimos juntos en activar ventas en tu tienda."
    },
    {
      "icon": "Users",
      "title": "Kit de Entrada y Pack Digital",
      "description": "Tu primer pedido viene como un ''Set de Entrada''. Incluye material impreso y un pack digital listo para desplegar en tus redes sociales y góndola."
    },
    {
      "icon": "Package",
      "title": "Línea completa",
      "description": "Mini frascos de 25g para regalo/impulso, frascos de 150g y frascos mayores de 500g Reserva del Bosque."
    }
  ],
  "stats": [
    {
      "value": "3 formatos",
      "label": "Presentaciones 25g, 150g y 500g"
    },
    {
      "value": "35–45%",
      "label": "Margen comercial proyectado"
    },
    {
      "value": "SAG",
      "label": "Certificación sanitaria oficial"
    },
    {
      "value": "Alta",
      "label": "Recompra documentada en retail"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Set de Entrada",
      "desc": "Inicia con un Set diseñado para rotar rápido, acompañado de tu pack digital."
    },
    {
      "step": "02",
      "title": "Onboarding de Clientes",
      "desc": "A través de un código QR, tus consumidores se unen a nuestro programa de fidelidad, ganando su primer sello solo por visitar tu local."
    },
    {
      "step": "03",
      "title": "Crecimiento de Tier",
      "desc": "Tus recompras rápidas desbloquean rebates, fondos de co-marketing y el status Guardián de exclusividad territorial."
    }
  ],
  "faq": [
    {
      "question": "¿Cómo funcionan los fondos de co-marketing (Co-op)?",
      "answer": "Premiamos tu velocidad y volumen. Ciertos umbrales de compra activan fondos que La Obrera y el Zángano re-invierte en publicidad local, eventos en tu tienda o degustaciones para ayudarte a rotar el inventario aún más rápido."
    },
    {
      "question": "¿Qué es el Pack Digital del Set de Entrada?",
      "answer": "Junto a tus primeros frascos, te enviamos material fotográfico profesional, videos cortos e historias del bosque optimizadas para que alimentes las redes sociales de tu tienda inmediatamente."
    },
    {
      "question": "¿Cómo funciona la exclusividad territorial?",
      "answer": "Al alcanzar el tier de ''Guardián'' en nuestro programa de Aliados del Bosque, te otorgamos exclusividad de radio (ej. única tienda autorizada en 5km a la redonda)."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-directorio-mapa",
      "package_name": "@enjambre/shop-chrome",
      "titulo": "Directorio Oficial de Embajadas & Geolocalización",
      "titulo_en": "Official Partner Directory & Map Geolocation",
      "descripcion": "Inclusión destacada de tu emporio o tienda en el mapa oficial de puntos de venta de Enjambre Legado. Los comensales que buscan miel cruda en tu ciudad son guiados a tu dirección física.",
      "descripcion_en": "Featured listing on the official Enjambre Legado partner map. Discerning shoppers searching for raw honey in your city are directed straight to your doorstep.",
      "badge": "Tráfico Cualificado",
      "beneficio_comercial": "Canaliza clientes con alta intención de compra directamente a tu tienda física sin costos publicitarios adicionales.",
      "beneficio_comercial_en": "Channels high-intent gourmet shoppers directly into your retail shop without extra advertising ad spend."
    },
    {
      "id": "modulo-tienda-resenas",
      "package_name": "@enjambre/resenas",
      "titulo": "QR de Reseñas de Mesón & Validación en Góndola",
      "titulo_en": "Counter Review QR & Shelf Proof Validation",
      "descripcion": "Material POP inteligente con código QR que muestra a los compradores notas de cata y calificaciones de clientes reales justo en el punto de decisión de compra.",
      "descripcion_en": "Smart shelf display material linking directly to verified tasting notes and customer ratings right at the point of decision.",
      "badge": "Conversión Retail",
      "beneficio_comercial": "Multiplica la velocidad de rotación en estantería al eliminar dudas sobre el sabor o la pureza frente a marcas convencionales.",
      "beneficio_comercial_en": "Accelerates shelf turnover by eliminating doubts regarding authenticity and taste versus conventional brands."
    },
    {
      "id": "modulo-pricing",
      "package_name": "@enjambre/pricing",
      "titulo": "Motor de Márgenes Escalonados (40%–45%) & Rebates Co-Op",
      "titulo_en": "Tiered Wholesale Margins (40%–45%) & Co-Op Rebates",
      "descripcion": "Algoritmo de precios mayoristas con cálculo dinámico de márgenes y asignación automática de fondos de co-marketing al mantener recompras regulares.",
      "descripcion_en": "Wholesale pricing algorithm calculating real-time margins and allocating co-op marketing rebates for timely store restocks.",
      "badge": "Rentabilidad Protegida",
      "beneficio_comercial": "Garantiza un margen comercial protegido superior al 40% y financia degustaciones o publicidad local compartida para tu tienda.",
      "beneficio_comercial_en": "Guarantees protected 40%+ margins while co-funding in-store tastings and shared local advertising."
    },
    {
      "id": "modulo-tienda-sale-qr",
      "package_name": "@enjambre/sale-qr",
      "titulo": "Trazabilidad de Recolección & Certificado Botánico por Lote",
      "titulo_en": "Harvest Provenance & Batch Botanical Certificate",
      "descripcion": "Cada frasco en tu vitrina porta un sello de trazabilidad que conecta con los predios protegidos de Chiloé, fecha de recolección y análisis de laboratorio.",
      "descripcion_en": "Each jar on your display carries a traceability seal linking to the Chiloé protected apiary, collection date, and lab tests.",
      "badge": "Origen Auténtico",
      "beneficio_comercial": "Justifica un PVP gourmet de alto valor frente a mieles industriales de supermercado, fidelizando a clientes de paladar exigente.",
      "beneficio_comercial_en": "Justifies a premium gourmet retail price over supermarket industrial honeys, building loyalty with demanding food lovers."
    }
  ],
  "seo_title": "Miel Artesanal para Tiendas Gourmet · La Obrera y el Zángano",
  "seo_description": "Miel cruda para tiendas gourmet. Trazabilidad completa, formatos de 25g, 150g y 500g, y un programa de fidelidad y referidos."
}'::jsonb, true, NOW(), NOW());
  END IF;

  -- Actualizar b2b_ferias
  IF EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_ferias') THEN
    UPDATE site_content
    SET content = '{
  "slug": "ferias",
  "tipo": "feria_evento",
  "kicker": "Para Ferias y Eventos",
  "kicker_en": "For Fairs & Events",
  "headline": "Del bosque al encuentro",
  "headline_en": "From the forest to the gathering",
  "subheadline": "Formatos ideales para venta directa e impulso: destácate con nuestros mini frascos de 25g y gana beneficios inmediatos al rotar inventario.",
  "subheadline_en": "Ideal formats for direct and impulse sales: stand out with our 25g jars and unlock immediate restocking perks.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/814aaec5-330b-4ff2-8872-0c540b0e7825.webp",
  "suggested_products_copy": "Para eventos sugerimos una fuerte presencia de mini frascos de 25g, son altamente atractivos y tienen excelente margen en formato de regalo.",
  "cta_text": "Pedir kit de feria",
  "cta_text_en": "Order fair kit",
  "cta_href": "#registro",
  "commercial_strategy": {
    "titulo": "Estrategia de Impacto de Flujo Rápido & Conversión en 45 Segundos",
    "titulo_en": "Rapid-Flow Impact & 45-Second Conversion Strategy",
    "bajada": "En ferias y encuentros gastronómicos, la prueba sensorial directa permite conectar inmediatamente con el origen botánico y cerrar con pago ágil.",
    "bajada_en": "In high-traffic events, direct sensory tasting connects immediately with botanical origin, closing sales with mobile payment speed.",
    "aumento_ticket": "Ticket promedio de $15.000 CLP · Tiempo de atención <60 segundos",
    "aumento_ticket_en": "Average basket of $15,000 CLP · Service cycle <60 seconds",
    "mecanica_ventas": [
      "Degustación activa: Muestras guiadas de las variedades (Cruda, Avellana, Cacao) para el público asistente.",
      "Precio accesible y escala: Mini frascos de 25g como compra por impulso accesible ($2.500 CLP) y pack de 3 por $6.900 CLP para asegurar volumen.",
      "Pago QR sin fricción: Soporte QR visible; el cliente escanea y paga en segundos sin filas.",
      "Fidelización in situ: El cliente registra su contacto para ganar su primer sello digital, facilitando ventas posteriores."
    ],
    "herramienta_clave": "Set de Degustación Sensorial & Pagos Móviles",
    "herramienta_clave_en": "Sensory Tasting Set & Mobile QR Checkout"
  },
  "tools": [],
  "kits": [
    {
      "id": "stand-degustacion",
      "nombre": "Set Piloto Stand & Degustación en Vivo",
      "badge": "Presencia en Eventos",
      "tier": "entrada",
      "tagline": "Montaje ágil para ferias gastronómicas y mercados de diseño",
      "descripcion": "Diseñado para montajes temporales con formatos de degustación de impulso de 25g y frascos de 150g listos para venta inmediata al paso.",
      "precio_neto_clp": 89000,
      "pvp_estimado_clp": 155000,
      "margen_estimado_pct": 42,
      "moq_summary": "72 mini frascos 25g + 18 frascos 150g",
      "sales_strategy": "Los mini frascos de impulso y frascos de mesa garantizan un flujo ininterrumpido de ventas sin objeción de precio.",
      "componentes_fisicos": [
        {
          "cantidad": "72 un.",
          "item": "Mini frascos 25g de impulso",
          "detalle": "Surtido de 4 variedades con tapa dorada para degustación y venta ágil"
        },
        {
          "cantidad": "18 un.",
          "item": "Frascos 150g de autor",
          "detalle": "Variedades surtidas para venta directa de mesa"
        },
        {
          "cantidad": "1 pack",
          "item": "Guía de Cata en Vivo para Mesón",
          "detalle": "Ficha plastificada para degustación sensorial con comensales"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "QR de Cobro y Registro Rápido",
          "descripcion": "Cobro ágil y captura de comensales para el programa de fidelización",
          "tag": "fidelizacion"
        },
        {
          "titulo": "Puntos de Bienvenida en Feria",
          "descripcion": "El cliente registra su cata in situ y gana sus primeros 25 puntos Club Legado",
          "tag": "marketing"
        }
      ],
      "recomendado_para": "Productores, feriantes gourmet y activaciones de fin de semana"
    },
    {
      "id": "encuentro-gastronomico",
      "nombre": "Pabellón Gastronómico & Activación Masiva",
      "badge": "Activación de Alto Flujo",
      "tier": "avanzado",
      "tagline": "Para festivales gastronómicos, pabellones de autor y pop-ups de alto flujo",
      "descripcion": "Capacidad para atender degustaciones continuas y ofrecer frascos de mesa y familiares con excelente margen, respaldado por la app de venta móvil en terreno.",
      "precio_neto_clp": 249000,
      "pvp_estimado_clp": 435000,
      "margen_estimado_pct": 43,
      "moq_summary": "144 mini frascos 25g + 36 frascos 150g + 12 frascos 500g",
      "sales_strategy": "Cobertura total del evento: degustación masiva en 25g, frascos de 150g para compra al paso y frascos de 500g para amantes de la miel tradicional.",
      "componentes_fisicos": [
        {
          "cantidad": "144 un.",
          "item": "Mini frascos 25g de impulso",
          "detalle": "Para degustación y venta ágil en eventos masivos"
        },
        {
          "cantidad": "36 un.",
          "item": "Frascos 150g de autor",
          "detalle": "Surtido completo de bosque nativo"
        },
        {
          "cantidad": "12 un.",
          "item": "Frascos 500g Reserva del Bosque",
          "detalle": "Para compradores exigentes de ferias"
        },
        {
          "cantidad": "1 pack",
          "item": "Display Completo de Stand",
          "detalle": "Atril de mesón + guías de cata en vivo plastificadas"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Acceso a App Móvil de Terreno",
          "descripcion": "POS offline en apps/campo con cobro rápido y sincronización automática",
          "tag": "pricing"
        },
        {
          "titulo": "Reseñas de Evento en Vivo",
          "descripcion": "Los asistentes dejan comentarios en vivo durante el evento",
          "tag": "resenas"
        }
      ],
      "recomendado_para": "Participantes en ferias gastronómicas, festivales de café y pabellones"
    }
  ],
  "value_props": [
    {
      "icon": "Package",
      "title": "El magneto de miradas",
      "description": "Los mini frascos de 25g con tapa dorada son la compra por impulso perfecta para visitantes de ferias y eventos."
    },
    {
      "icon": "TrendingUp",
      "title": "Retorno Inmediato",
      "description": "Cada frasco individualizado que adquieres para la feria te acerca a bonificaciones de stock para tu próximo evento."
    },
    {
      "icon": "BarChart3",
      "title": "Levantamiento de Datos",
      "description": "Durante la feria, los visitantes escanean tu QR para calificar la miel y ganar puntos. Tú te quedas con un registro de contactos calificados."
    },
    {
      "icon": "ShoppingBag",
      "title": "Set de Entrada Físico",
      "description": "Material gráfico, displays y tarjetas de producto. Todo lo que necesitas para que el stand cuente la historia del bosque por ti."
    }
  ],
  "stats": [
    {
      "value": "25 g",
      "label": "Degustación y regalo"
    },
    {
      "value": "3 formatos",
      "label": "Mix completo para stand"
    },
    {
      "value": "Alta",
      "label": "Conversión comprobada en cata guiada"
    },
    {
      "value": "24–48h",
      "label": "Respuesta y coordinación para eventos"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Planifica",
      "desc": "Cuéntanos la fecha y magnitud de tu evento para sugerir el mix adecuado de inventario."
    },
    {
      "step": "02",
      "title": "Equípate",
      "desc": "Recibe tu Set de Entrada con los frascos y el material de exhibición físico y digital."
    },
    {
      "step": "03",
      "title": "Interactúa",
      "desc": "Usa el sistema de Catas Digitales en tu stand. Atrae público y multiplica ventas."
    }
  ],
  "faq": [
    {
      "question": "¿Con cuánta anticipación debo solicitar el kit para mi feria?",
      "answer": "Recomendamos coordinar con 5 a 7 días hábiles de anticipación para despachos a regiones, asegurando que tu material y frascos lleguen a tiempo para el montaje."
    },
    {
      "question": "¿Qué formato tiene mayor rotación en eventos masivos?",
      "answer": "Los mini frascos de 25g son el producto de mayor velocidad. Se compran en packs de 3 o como recuerdo accesible, generando volumen sin resistencia de precio."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-campo-pos",
      "package_name": "apps/campo",
      "titulo": "Terminal POS 100% Offline-First (Dexie DB)",
      "titulo_en": "100% Offline-First POS Engine (Dexie DB)",
      "descripcion": "Motor de punto de venta optimizado para ferias rurales y pabellones cerrados. Opera sin internet, registrando transacciones localmente con sincronización automática en cola cuando vuelve la red.",
      "descripcion_en": "Point-of-sale engine engineered for remote rural fairs and enclosed exhibition pavilions. Operates 100% offline with auto-syncing queues.",
      "badge": "Cero Caídas Offline",
      "beneficio_comercial": "Nunca pierdes una venta por falta de señal móvil o caída de red en medio de un evento masivo.",
      "beneficio_comercial_en": "Never lose a high-traffic sale due to poor mobile reception or network outages during crowded expo weekends."
    },
    {
      "id": "modulo-sumup",
      "package_name": "@enjambre/sumup",
      "titulo": "Cobro Rápido con Tarjeta & Pasarela Portátil",
      "titulo_en": "Express Card Payments & Portable Gateway",
      "descripcion": "Integración fluida con lectores móviles de tarjeta y soporte de débito/crédito chileno en segundos, reduciendo la fila del stand al mínimo.",
      "descripcion_en": "Seamless integration with mobile card readers handling Chilean debit/credit in seconds, keeping stand queues ultra-short.",
      "badge": "Cobro sin Fricción",
      "beneficio_comercial": "Reduce el tiempo de atención a menos de 45 segundos por transacción, capturando todas las compras de impulso del pasillo.",
      "beneficio_comercial_en": "Cuts service cycle to under 45 seconds per buyer, capturing every impulse purchase from the passing crowd."
    },
    {
      "id": "modulo-ferias-qr",
      "package_name": "@enjambre/sale-qr",
      "titulo": "Cobro Inmediato con QR & Catas Digitales en Stand",
      "titulo_en": "Instant QR Payments & In-Booth Digital Tastings",
      "descripcion": "Código QR visible para pagos directos y registro sensorial guiado mientras el visitante prueba las variedades botánicas.",
      "descripcion_en": "Visible QR display for direct payments alongside guided sensory feedback while visitors sample botanical varieties.",
      "badge": "Interacción Interactiva",
      "beneficio_comercial": "Multiplica por 4 las degustaciones efectivas y captura el contacto digital de cada comprador para ventas posteriores.",
      "beneficio_comercial_en": "Quadruples successful tastings and captures digital contact info from every buyer for post-event reorders."
    },
    {
      "id": "modulo-logistica",
      "package_name": "@enjambre/logistica",
      "titulo": "Reposición Express para Eventos & Alerta de Stock Crítico",
      "titulo_en": "Event Restock Automation & Stock-Out Alerts",
      "descripcion": "Monitoreo de inventario con despacho preferente en 24-48 horas para ferias de múltiples días con alta demanda no planificada.",
      "descripcion_en": "Inventory monitoring with 24-48h rush replenishment for multi-day fairs with unexpected high demand.",
      "badge": "Respaldo Ininterrumpido",
      "beneficio_comercial": "Garantiza no quedarse sin producto en el día de mayor asistencia, maximizando la facturación neta de todo el fin de semana.",
      "beneficio_comercial_en": "Ensures you never run out of inventory during peak foot-traffic days, maximizing gross revenue."
    }
  ],
  "seo_title": "Miel para Ferias y Eventos Gourmet · La Obrera y el Zángano",
  "seo_description": "Formatos de 25g y 150g para stands de ferias gastronómicas. Venta directa por impulso y herramientas de degustación para maximizar tus ventas."
}'::jsonb,
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_ferias';
  ELSE
    INSERT INTO site_content (section_key, item_order, content, is_active, created_at, updated_at)
    VALUES ('b2b_ferias', 0, '{
  "slug": "ferias",
  "tipo": "feria_evento",
  "kicker": "Para Ferias y Eventos",
  "kicker_en": "For Fairs & Events",
  "headline": "Del bosque al encuentro",
  "headline_en": "From the forest to the gathering",
  "subheadline": "Formatos ideales para venta directa e impulso: destácate con nuestros mini frascos de 25g y gana beneficios inmediatos al rotar inventario.",
  "subheadline_en": "Ideal formats for direct and impulse sales: stand out with our 25g jars and unlock immediate restocking perks.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_ferias/814aaec5-330b-4ff2-8872-0c540b0e7825.webp",
  "suggested_products_copy": "Para eventos sugerimos una fuerte presencia de mini frascos de 25g, son altamente atractivos y tienen excelente margen en formato de regalo.",
  "cta_text": "Pedir kit de feria",
  "cta_text_en": "Order fair kit",
  "cta_href": "#registro",
  "commercial_strategy": {
    "titulo": "Estrategia de Impacto de Flujo Rápido & Conversión en 45 Segundos",
    "titulo_en": "Rapid-Flow Impact & 45-Second Conversion Strategy",
    "bajada": "En ferias y encuentros gastronómicos, la prueba sensorial directa permite conectar inmediatamente con el origen botánico y cerrar con pago ágil.",
    "bajada_en": "In high-traffic events, direct sensory tasting connects immediately with botanical origin, closing sales with mobile payment speed.",
    "aumento_ticket": "Ticket promedio de $15.000 CLP · Tiempo de atención <60 segundos",
    "aumento_ticket_en": "Average basket of $15,000 CLP · Service cycle <60 seconds",
    "mecanica_ventas": [
      "Degustación activa: Muestras guiadas de las variedades (Cruda, Avellana, Cacao) para el público asistente.",
      "Precio accesible y escala: Mini frascos de 25g como compra por impulso accesible ($2.500 CLP) y pack de 3 por $6.900 CLP para asegurar volumen.",
      "Pago QR sin fricción: Soporte QR visible; el cliente escanea y paga en segundos sin filas.",
      "Fidelización in situ: El cliente registra su contacto para ganar su primer sello digital, facilitando ventas posteriores."
    ],
    "herramienta_clave": "Set de Degustación Sensorial & Pagos Móviles",
    "herramienta_clave_en": "Sensory Tasting Set & Mobile QR Checkout"
  },
  "tools": [],
  "kits": [
    {
      "id": "stand-degustacion",
      "nombre": "Set Piloto Stand & Degustación en Vivo",
      "badge": "Presencia en Eventos",
      "tier": "entrada",
      "tagline": "Montaje ágil para ferias gastronómicas y mercados de diseño",
      "descripcion": "Diseñado para montajes temporales con formatos de degustación de impulso de 25g y frascos de 150g listos para venta inmediata al paso.",
      "precio_neto_clp": 89000,
      "pvp_estimado_clp": 155000,
      "margen_estimado_pct": 42,
      "moq_summary": "72 mini frascos 25g + 18 frascos 150g",
      "sales_strategy": "Los mini frascos de impulso y frascos de mesa garantizan un flujo ininterrumpido de ventas sin objeción de precio.",
      "componentes_fisicos": [
        {
          "cantidad": "72 un.",
          "item": "Mini frascos 25g de impulso",
          "detalle": "Surtido de 4 variedades con tapa dorada para degustación y venta ágil"
        },
        {
          "cantidad": "18 un.",
          "item": "Frascos 150g de autor",
          "detalle": "Variedades surtidas para venta directa de mesa"
        },
        {
          "cantidad": "1 pack",
          "item": "Guía de Cata en Vivo para Mesón",
          "detalle": "Ficha plastificada para degustación sensorial con comensales"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "QR de Cobro y Registro Rápido",
          "descripcion": "Cobro ágil y captura de comensales para el programa de fidelización",
          "tag": "fidelizacion"
        },
        {
          "titulo": "Puntos de Bienvenida en Feria",
          "descripcion": "El cliente registra su cata in situ y gana sus primeros 25 puntos Club Legado",
          "tag": "marketing"
        }
      ],
      "recomendado_para": "Productores, feriantes gourmet y activaciones de fin de semana"
    },
    {
      "id": "encuentro-gastronomico",
      "nombre": "Pabellón Gastronómico & Activación Masiva",
      "badge": "Activación de Alto Flujo",
      "tier": "avanzado",
      "tagline": "Para festivales gastronómicos, pabellones de autor y pop-ups de alto flujo",
      "descripcion": "Capacidad para atender degustaciones continuas y ofrecer frascos de mesa y familiares con excelente margen, respaldado por la app de venta móvil en terreno.",
      "precio_neto_clp": 249000,
      "pvp_estimado_clp": 435000,
      "margen_estimado_pct": 43,
      "moq_summary": "144 mini frascos 25g + 36 frascos 150g + 12 frascos 500g",
      "sales_strategy": "Cobertura total del evento: degustación masiva en 25g, frascos de 150g para compra al paso y frascos de 500g para amantes de la miel tradicional.",
      "componentes_fisicos": [
        {
          "cantidad": "144 un.",
          "item": "Mini frascos 25g de impulso",
          "detalle": "Para degustación y venta ágil en eventos masivos"
        },
        {
          "cantidad": "36 un.",
          "item": "Frascos 150g de autor",
          "detalle": "Surtido completo de bosque nativo"
        },
        {
          "cantidad": "12 un.",
          "item": "Frascos 500g Reserva del Bosque",
          "detalle": "Para compradores exigentes de ferias"
        },
        {
          "cantidad": "1 pack",
          "item": "Display Completo de Stand",
          "detalle": "Atril de mesón + guías de cata en vivo plastificadas"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Acceso a App Móvil de Terreno",
          "descripcion": "POS offline en apps/campo con cobro rápido y sincronización automática",
          "tag": "pricing"
        },
        {
          "titulo": "Reseñas de Evento en Vivo",
          "descripcion": "Los asistentes dejan comentarios en vivo durante el evento",
          "tag": "resenas"
        }
      ],
      "recomendado_para": "Participantes en ferias gastronómicas, festivales de café y pabellones"
    }
  ],
  "value_props": [
    {
      "icon": "Package",
      "title": "El magneto de miradas",
      "description": "Los mini frascos de 25g con tapa dorada son la compra por impulso perfecta para visitantes de ferias y eventos."
    },
    {
      "icon": "TrendingUp",
      "title": "Retorno Inmediato",
      "description": "Cada frasco individualizado que adquieres para la feria te acerca a bonificaciones de stock para tu próximo evento."
    },
    {
      "icon": "BarChart3",
      "title": "Levantamiento de Datos",
      "description": "Durante la feria, los visitantes escanean tu QR para calificar la miel y ganar puntos. Tú te quedas con un registro de contactos calificados."
    },
    {
      "icon": "ShoppingBag",
      "title": "Set de Entrada Físico",
      "description": "Material gráfico, displays y tarjetas de producto. Todo lo que necesitas para que el stand cuente la historia del bosque por ti."
    }
  ],
  "stats": [
    {
      "value": "25 g",
      "label": "Degustación y regalo"
    },
    {
      "value": "3 formatos",
      "label": "Mix completo para stand"
    },
    {
      "value": "Alta",
      "label": "Conversión comprobada en cata guiada"
    },
    {
      "value": "24–48h",
      "label": "Respuesta y coordinación para eventos"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Planifica",
      "desc": "Cuéntanos la fecha y magnitud de tu evento para sugerir el mix adecuado de inventario."
    },
    {
      "step": "02",
      "title": "Equípate",
      "desc": "Recibe tu Set de Entrada con los frascos y el material de exhibición físico y digital."
    },
    {
      "step": "03",
      "title": "Interactúa",
      "desc": "Usa el sistema de Catas Digitales en tu stand. Atrae público y multiplica ventas."
    }
  ],
  "faq": [
    {
      "question": "¿Con cuánta anticipación debo solicitar el kit para mi feria?",
      "answer": "Recomendamos coordinar con 5 a 7 días hábiles de anticipación para despachos a regiones, asegurando que tu material y frascos lleguen a tiempo para el montaje."
    },
    {
      "question": "¿Qué formato tiene mayor rotación en eventos masivos?",
      "answer": "Los mini frascos de 25g son el producto de mayor velocidad. Se compran en packs de 3 o como recuerdo accesible, generando volumen sin resistencia de precio."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-campo-pos",
      "package_name": "apps/campo",
      "titulo": "Terminal POS 100% Offline-First (Dexie DB)",
      "titulo_en": "100% Offline-First POS Engine (Dexie DB)",
      "descripcion": "Motor de punto de venta optimizado para ferias rurales y pabellones cerrados. Opera sin internet, registrando transacciones localmente con sincronización automática en cola cuando vuelve la red.",
      "descripcion_en": "Point-of-sale engine engineered for remote rural fairs and enclosed exhibition pavilions. Operates 100% offline with auto-syncing queues.",
      "badge": "Cero Caídas Offline",
      "beneficio_comercial": "Nunca pierdes una venta por falta de señal móvil o caída de red en medio de un evento masivo.",
      "beneficio_comercial_en": "Never lose a high-traffic sale due to poor mobile reception or network outages during crowded expo weekends."
    },
    {
      "id": "modulo-sumup",
      "package_name": "@enjambre/sumup",
      "titulo": "Cobro Rápido con Tarjeta & Pasarela Portátil",
      "titulo_en": "Express Card Payments & Portable Gateway",
      "descripcion": "Integración fluida con lectores móviles de tarjeta y soporte de débito/crédito chileno en segundos, reduciendo la fila del stand al mínimo.",
      "descripcion_en": "Seamless integration with mobile card readers handling Chilean debit/credit in seconds, keeping stand queues ultra-short.",
      "badge": "Cobro sin Fricción",
      "beneficio_comercial": "Reduce el tiempo de atención a menos de 45 segundos por transacción, capturando todas las compras de impulso del pasillo.",
      "beneficio_comercial_en": "Cuts service cycle to under 45 seconds per buyer, capturing every impulse purchase from the passing crowd."
    },
    {
      "id": "modulo-ferias-qr",
      "package_name": "@enjambre/sale-qr",
      "titulo": "Cobro Inmediato con QR & Catas Digitales en Stand",
      "titulo_en": "Instant QR Payments & In-Booth Digital Tastings",
      "descripcion": "Código QR visible para pagos directos y registro sensorial guiado mientras el visitante prueba las variedades botánicas.",
      "descripcion_en": "Visible QR display for direct payments alongside guided sensory feedback while visitors sample botanical varieties.",
      "badge": "Interacción Interactiva",
      "beneficio_comercial": "Multiplica por 4 las degustaciones efectivas y captura el contacto digital de cada comprador para ventas posteriores.",
      "beneficio_comercial_en": "Quadruples successful tastings and captures digital contact info from every buyer for post-event reorders."
    },
    {
      "id": "modulo-logistica",
      "package_name": "@enjambre/logistica",
      "titulo": "Reposición Express para Eventos & Alerta de Stock Crítico",
      "titulo_en": "Event Restock Automation & Stock-Out Alerts",
      "descripcion": "Monitoreo de inventario con despacho preferente en 24-48 horas para ferias de múltiples días con alta demanda no planificada.",
      "descripcion_en": "Inventory monitoring with 24-48h rush replenishment for multi-day fairs with unexpected high demand.",
      "badge": "Respaldo Ininterrumpido",
      "beneficio_comercial": "Garantiza no quedarse sin producto en el día de mayor asistencia, maximizando la facturación neta de todo el fin de semana.",
      "beneficio_comercial_en": "Ensures you never run out of inventory during peak foot-traffic days, maximizing gross revenue."
    }
  ],
  "seo_title": "Miel para Ferias y Eventos Gourmet · La Obrera y el Zángano",
  "seo_description": "Formatos de 25g y 150g para stands de ferias gastronómicas. Venta directa por impulso y herramientas de degustación para maximizar tus ventas."
}'::jsonb, true, NOW(), NOW());
  END IF;

  -- Actualizar b2b_revendedores
  IF EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_revendedores') THEN
    UPDATE site_content
    SET content = '{
  "slug": "revendedores",
  "tipo": "otro",
  "kicker": "Para Revendedores",
  "kicker_en": "For Independent Resellers",
  "headline": "Comienza tu propio negocio con miel de bosque nativo",
  "headline_en": "Launch your own venture with native forest honey",
  "subheadline": "Distribuye miel cruda premium en tu círculo cercano. Sin cuotas de entrada, con herramientas de venta digital, incentivos por recompra y fidelización automatizada.",
  "subheadline_en": "Distribute premium raw honey within your network. Zero entry fees, digital selling tools, rapid restock bonuses, and automated customer loyalty.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/bd874e95-611d-4d04-ad3a-d28a7fd7d6f5.webp",
  "suggested_products_copy": "Para revendedores recomendamos iniciar con un mix de frascos de 150g y 500g, complementado con mini frascos de 25g ideales para dar a probar a nuevos clientes.",
  "cta_text": "Comenzar ahora",
  "cta_text_en": "Start now",
  "cta_href": "#registro",
  "commercial_strategy": {
    "titulo": "Estrategia de Venta por Recomendación & Micro-Catas Privadas",
    "titulo_en": "Relationship Selling & Private Micro-Tastings Strategy",
    "bajada": "La recomendación directa y la degustación guiada en reuniones y círculos cercanos permiten dar a conocer el bosque nativo y cerrar pedidos con confianza.",
    "bajada_en": "Direct recommendation and guided tasting in personal gatherings introduce the native forest and build trusted recurring orders.",
    "aumento_ticket": "Pedido medio de $28.000 CLP · 40% a 45% de margen directo",
    "aumento_ticket_en": "Average order of $28,000 CLP · 40% to 45% direct profit margin",
    "mecanica_ventas": [
      "Degustación cercana: Presenta las 4 variedades explicando el origen botánico y pureza del bosque nativo de Chiloé.",
      "Pedidos inmediatos con stock de mano: Entrega los frascos en el acto cobrando al contado o transferencia directa.",
      "Trazabilidad con código personal: Cada cliente escanea tu QR asignado para ver el pasaporte de lote, registrando su contacto bajo tu cuenta.",
      "Recompra rápida bonificada: Si repones tu inventario dentro de 30 días, desbloqueas unidades adicionales de cortesía que aumentan tu ganancia neta."
    ],
    "herramienta_clave": "Set de Muestras de Autor con Tarjetas QR de Lote",
    "herramienta_clave_en": "Author Sample Tasting Set with Batch QR Cards"
  },
  "tools": [],
  "kits": [
    {
      "id": "maletin-embajador",
      "nombre": "Set Piloto Embajador Territorial",
      "badge": "Iniciación de Representante",
      "tier": "entrada",
      "tagline": "El set esencial de formatos de mano para iniciar tu red personal",
      "descripcion": "Stock inicial de 18 frascos de 150g para entrega inmediata, muestras de degustación y código de revendedor asignado con enlace personalizado en la plataforma.",
      "precio_neto_clp": 65000,
      "pvp_estimado_clp": 115000,
      "margen_estimado_pct": 43,
      "moq_summary": "18 frascos 150g surtidos + muestras",
      "sales_strategy": "Inicia ventas en tu red cercana; recupera la inversión total del kit en mano y genera tus primeros ingresos de inmediato.",
      "componentes_fisicos": [
        {
          "cantidad": "18 un.",
          "item": "Frascos 150g de autor",
          "detalle": "Variedades de mayor demanda para entrega inmediata (6 Cruda, 6 Avellana, 3 Cacao, 3 Polen)"
        },
        {
          "cantidad": "1 pack",
          "item": "Muestras de Degustación en Frío",
          "detalle": "Frasquitos y paletas para dar a probar a potenciales clientes"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Enlace de Embajador Asignado",
          "descripcion": "Enlace personalizado con código integrado para compartir en WhatsApp y redes",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Pack Digital de Ventas",
          "descripcion": "Fotografías en alta resolución, fichas botánicas y textos listos para compartir",
          "tag": "marketing"
        }
      ],
      "recomendado_para": "Nuevos representantes territoriales y distribuidores independientes"
    },
    {
      "id": "stock-rotacion",
      "nombre": "Stock de Distribución & Rotación Zonal",
      "badge": "Ruta Activa & Escala",
      "tier": "avanzado",
      "tagline": "Volumen para abastecer clientes frecuentes y ventas directas con margen del 44%+",
      "descripcion": "El balance perfecto de frascos de 150g, frascos de 500g Reserva y piezas de 25g de apertura para cerrar pedidos recurrentes en tu zona.",
      "precio_neto_clp": 219000,
      "pvp_estimado_clp": 390000,
      "margen_estimado_pct": 44,
      "moq_summary": "54 frascos 150g + 14 frascos 500g + 50 minis 25g",
      "sales_strategy": "Atiende pedidos recurrentes de familias y comercios locales con frascos de 150g y 500g, utilizando las piezas de 25g para abrir nuevos clientes.",
      "componentes_fisicos": [
        {
          "cantidad": "54 un.",
          "item": "Frascos 150g surtidos",
          "detalle": "Miel pura y cremas botánicas de alta demanda"
        },
        {
          "cantidad": "14 un.",
          "item": "Frascos 500g Reserva del Bosque",
          "detalle": "Edición mayor para compras familiares y amantes de la miel pura"
        },
        {
          "cantidad": "50 un.",
          "item": "Mini frascos 25g cortesía",
          "detalle": "Para degustación y apertura de nuevos compradores"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Crédito de Retribución en Portal",
          "descripcion": "Seguimiento de compras acumuladas a 12 meses y crédito descontable en nuevos pedidos",
          "tag": "pricing"
        },
        {
          "titulo": "Herramienta de Reposición Móvil",
          "descripcion": "Gestión ágil de pedidos desde tu teléfono con escala de descuentos mayorista",
          "tag": "fidelizacion"
        }
      ],
      "recomendado_para": "Revendedores activos con cartera de clientes y rutas comerciales"
    }
  ],
  "value_props": [
    {
      "icon": "TrendingUp",
      "title": "Bonus de Recompra Rápida",
      "description": "Aceleramos tu negocio: si agotas tu stock y re-ordenas en menos de 30 días, desbloqueas rebajas automáticas y producto bonificado."
    },
    {
      "icon": "Shield",
      "title": "Respaldo analítico y de marca",
      "description": "Vendes un producto con identidad territorial genuina, pureza comprobada y análisis de laboratorio certificados documentados en nuestra sección de ciencia."
    },
    {
      "icon": "Package",
      "title": "Set de Entrada y Pack Digital",
      "description": "Tu primera orden es un ''Set de Entrada'' que incluye un kit de activos para redes sociales listos para que empieces a vender de inmediato."
    },
    {
      "icon": "Award",
      "title": "Programa de tiers",
      "description": "Avanza en la red de guardianes según tu volumen y regularidad de reposición. Desbloquea mayores márgenes y acceso prioritario a floraciones limitadas."
    }
  ],
  "stats": [
    {
      "value": "30 días",
      "label": "Ciclo preferente de reposición"
    },
    {
      "value": "0 costo",
      "label": "Sin cobro de incorporación"
    },
    {
      "value": "Escalable",
      "label": "Margen comercial según volumen"
    },
    {
      "value": "Kit digital",
      "label": "Activos fotográficos de apoyo"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Únete",
      "desc": "Regístrate sin costo, obtén tu código de revendedor y descarga tu Pack Digital de ventas."
    },
    {
      "step": "02",
      "title": "Distribuye",
      "desc": "Ofrece los formatos disponibles e invita a tus clientes a escanear tu código para acceder a la trazabilidad y cata de origen."
    },
    {
      "step": "03",
      "title": "Acelera",
      "desc": "Haz pedidos de reposición regulares para acceder a bonificaciones comerciales y condiciones preferentes."
    }
  ],
  "faq": [
    {
      "question": "¿Cómo funciona el Bonus de Recompra Rápida?",
      "answer": "El sistema mide la cadencia de tus pedidos. Si mantienes reposición continua dentro del plazo establecido, se aplica automáticamente una bonificación comercial o unidades de cortesía."
    },
    {
      "question": "¿Cómo mis clientes acceden a la trazabilidad conmigo?",
      "answer": "Te asignamos un código único de representación. Cuando entregas un frasco, tus clientes escanean el código para acceder al pasaporte de lote y registrar su percepción sensorial."
    },
    {
      "question": "¿Qué incluye el Pack Digital?",
      "answer": "Al registrarte, descargas un paquete con fotografías profesionales de los frascos, textos de venta probados y gráficos para redes sociales."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-portal-embajador",
      "package_name": "@enjambre/auth",
      "titulo": "Portal Privado de Embajador & Código de Atribución",
      "titulo_en": "Private Ambassador Portal & Attribution Codes",
      "descripcion": "Panel digital personal con código único de representación. Cada frasco o tarjeta que entregas enlaza a tu perfil, asegurando comisiones transparentes por cada recompra de tus contactos.",
      "descripcion_en": "Personal digital portal with dedicated reseller code. Every jar or card you hand out links to your account, securing commissions on every downstream reorder.",
      "badge": "Comisión Garantizada",
      "beneficio_comercial": "Construye un ingreso recurrente sin depender de volver a cobrar manualmente: tus clientes recompran en la tienda y la comisión es tuya.",
      "beneficio_comercial_en": "Builds recurring income without manual debt chasing: your contacts repurchase online and you earn your commission."
    },
    {
      "id": "modulo-revendedor-wallet",
      "package_name": "@enjambre/wallet",
      "titulo": "Pase de Membresía Móvil & Fidelización Automatizada",
      "titulo_en": "Mobile Membership Pass & Automated Retention",
      "descripcion": "Tus clientes agregan su tarjeta a Apple Wallet o Google Wallet y acumulan sellos por cada compra que te hacen, motivando la recompra periódica del formato de 500g.",
      "descripcion_en": "Your clients save their pass to Apple Wallet or Google Wallet, earning reward stamps on every purchase to drive steady 500g reorders.",
      "badge": "Retención sin Fricción",
      "beneficio_comercial": "Fideliza a tu círculo cercano con incentivos digitales reales que generan una tasa de recompra cada 3 semanas.",
      "beneficio_comercial_en": "Retains your network with digital incentives that generate recurring orders every 3 weeks."
    },
    {
      "id": "modulo-revendedor-pricing",
      "package_name": "@enjambre/pricing",
      "titulo": "Bonus de Recompra Rápida & Escala de Márgenes (41%–45%)",
      "titulo_en": "Rapid Restock Bonus & Margin Scale (41%–45%)",
      "descripcion": "Sistema que premia la velocidad de rotación: al reponer inventario en menos de 30 días, el motor desbloquea unidades de cortesía y descuentos crecientes.",
      "descripcion_en": "Turnover incentive system: restock within 30 days and unlock complimentary bonus jars plus progressive volume discounts.",
      "badge": "Rentabilidad Creciente",
      "beneficio_comercial": "Aumenta tu ganancia neta por frasco a medida que construyes una base fiel de consumidores en tu comuna.",
      "beneficio_comercial_en": "Boosts your net profit per jar as you grow a steady customer base in your neighborhood."
    },
    {
      "id": "modulo-contable",
      "package_name": "@enjambre/contable",
      "titulo": "Liquidación Transparente & Respaldo Tributario Inmediato",
      "titulo_en": "Transparent Settlement & Instant Tax Invoicing",
      "descripcion": "Módulo contable que genera resúmenes claros de ventas, márgenes obtenidos y emisión de boletas o facturas con un clic.",
      "descripcion_en": "Accounting module providing clear summaries of sales, realized margins, and one-click receipt and invoice generation.",
      "badge": "Control Financiero Total",
      "beneficio_comercial": "Maneja tu negocio independiente con orden financiero impecable, cero enredos y total certeza de tus márgenes de ganancia.",
      "beneficio_comercial_en": "Run your independent venture with pristine bookkeeping, zero accounting hassles, and complete margin transparency."
    }
  ],
  "seo_title": "Programa de Revendedores · La Obrera y el Zángano",
  "seo_description": "Revende miel cruda premium. Accede a bonus de recompra rápida, pack digital de ventas y un programa de fidelidad en app para retener a tus propios clientes."
}'::jsonb,
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_revendedores';
  ELSE
    INSERT INTO site_content (section_key, item_order, content, is_active, created_at, updated_at)
    VALUES ('b2b_revendedores', 0, '{
  "slug": "revendedores",
  "tipo": "otro",
  "kicker": "Para Revendedores",
  "kicker_en": "For Independent Resellers",
  "headline": "Comienza tu propio negocio con miel de bosque nativo",
  "headline_en": "Launch your own venture with native forest honey",
  "subheadline": "Distribuye miel cruda premium en tu círculo cercano. Sin cuotas de entrada, con herramientas de venta digital, incentivos por recompra y fidelización automatizada.",
  "subheadline_en": "Distribute premium raw honey within your network. Zero entry fees, digital selling tools, rapid restock bonuses, and automated customer loyalty.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_revendedores/bd874e95-611d-4d04-ad3a-d28a7fd7d6f5.webp",
  "suggested_products_copy": "Para revendedores recomendamos iniciar con un mix de frascos de 150g y 500g, complementado con mini frascos de 25g ideales para dar a probar a nuevos clientes.",
  "cta_text": "Comenzar ahora",
  "cta_text_en": "Start now",
  "cta_href": "#registro",
  "commercial_strategy": {
    "titulo": "Estrategia de Venta por Recomendación & Micro-Catas Privadas",
    "titulo_en": "Relationship Selling & Private Micro-Tastings Strategy",
    "bajada": "La recomendación directa y la degustación guiada en reuniones y círculos cercanos permiten dar a conocer el bosque nativo y cerrar pedidos con confianza.",
    "bajada_en": "Direct recommendation and guided tasting in personal gatherings introduce the native forest and build trusted recurring orders.",
    "aumento_ticket": "Pedido medio de $28.000 CLP · 40% a 45% de margen directo",
    "aumento_ticket_en": "Average order of $28,000 CLP · 40% to 45% direct profit margin",
    "mecanica_ventas": [
      "Degustación cercana: Presenta las 4 variedades explicando el origen botánico y pureza del bosque nativo de Chiloé.",
      "Pedidos inmediatos con stock de mano: Entrega los frascos en el acto cobrando al contado o transferencia directa.",
      "Trazabilidad con código personal: Cada cliente escanea tu QR asignado para ver el pasaporte de lote, registrando su contacto bajo tu cuenta.",
      "Recompra rápida bonificada: Si repones tu inventario dentro de 30 días, desbloqueas unidades adicionales de cortesía que aumentan tu ganancia neta."
    ],
    "herramienta_clave": "Set de Muestras de Autor con Tarjetas QR de Lote",
    "herramienta_clave_en": "Author Sample Tasting Set with Batch QR Cards"
  },
  "tools": [],
  "kits": [
    {
      "id": "maletin-embajador",
      "nombre": "Set Piloto Embajador Territorial",
      "badge": "Iniciación de Representante",
      "tier": "entrada",
      "tagline": "El set esencial de formatos de mano para iniciar tu red personal",
      "descripcion": "Stock inicial de 18 frascos de 150g para entrega inmediata, muestras de degustación y código de revendedor asignado con enlace personalizado en la plataforma.",
      "precio_neto_clp": 65000,
      "pvp_estimado_clp": 115000,
      "margen_estimado_pct": 43,
      "moq_summary": "18 frascos 150g surtidos + muestras",
      "sales_strategy": "Inicia ventas en tu red cercana; recupera la inversión total del kit en mano y genera tus primeros ingresos de inmediato.",
      "componentes_fisicos": [
        {
          "cantidad": "18 un.",
          "item": "Frascos 150g de autor",
          "detalle": "Variedades de mayor demanda para entrega inmediata (6 Cruda, 6 Avellana, 3 Cacao, 3 Polen)"
        },
        {
          "cantidad": "1 pack",
          "item": "Muestras de Degustación en Frío",
          "detalle": "Frasquitos y paletas para dar a probar a potenciales clientes"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Enlace de Embajador Asignado",
          "descripcion": "Enlace personalizado con código integrado para compartir en WhatsApp y redes",
          "tag": "trazabilidad"
        },
        {
          "titulo": "Pack Digital de Ventas",
          "descripcion": "Fotografías en alta resolución, fichas botánicas y textos listos para compartir",
          "tag": "marketing"
        }
      ],
      "recomendado_para": "Nuevos representantes territoriales y distribuidores independientes"
    },
    {
      "id": "stock-rotacion",
      "nombre": "Stock de Distribución & Rotación Zonal",
      "badge": "Ruta Activa & Escala",
      "tier": "avanzado",
      "tagline": "Volumen para abastecer clientes frecuentes y ventas directas con margen del 44%+",
      "descripcion": "El balance perfecto de frascos de 150g, frascos de 500g Reserva y piezas de 25g de apertura para cerrar pedidos recurrentes en tu zona.",
      "precio_neto_clp": 219000,
      "pvp_estimado_clp": 390000,
      "margen_estimado_pct": 44,
      "moq_summary": "54 frascos 150g + 14 frascos 500g + 50 minis 25g",
      "sales_strategy": "Atiende pedidos recurrentes de familias y comercios locales con frascos de 150g y 500g, utilizando las piezas de 25g para abrir nuevos clientes.",
      "componentes_fisicos": [
        {
          "cantidad": "54 un.",
          "item": "Frascos 150g surtidos",
          "detalle": "Miel pura y cremas botánicas de alta demanda"
        },
        {
          "cantidad": "14 un.",
          "item": "Frascos 500g Reserva del Bosque",
          "detalle": "Edición mayor para compras familiares y amantes de la miel pura"
        },
        {
          "cantidad": "50 un.",
          "item": "Mini frascos 25g cortesía",
          "detalle": "Para degustación y apertura de nuevos compradores"
        }
      ],
      "integraciones_digitales": [
        {
          "titulo": "Crédito de Retribución en Portal",
          "descripcion": "Seguimiento de compras acumuladas a 12 meses y crédito descontable en nuevos pedidos",
          "tag": "pricing"
        },
        {
          "titulo": "Herramienta de Reposición Móvil",
          "descripcion": "Gestión ágil de pedidos desde tu teléfono con escala de descuentos mayorista",
          "tag": "fidelizacion"
        }
      ],
      "recomendado_para": "Revendedores activos con cartera de clientes y rutas comerciales"
    }
  ],
  "value_props": [
    {
      "icon": "TrendingUp",
      "title": "Bonus de Recompra Rápida",
      "description": "Aceleramos tu negocio: si agotas tu stock y re-ordenas en menos de 30 días, desbloqueas rebajas automáticas y producto bonificado."
    },
    {
      "icon": "Shield",
      "title": "Respaldo analítico y de marca",
      "description": "Vendes un producto con identidad territorial genuina, pureza comprobada y análisis de laboratorio certificados documentados en nuestra sección de ciencia."
    },
    {
      "icon": "Package",
      "title": "Set de Entrada y Pack Digital",
      "description": "Tu primera orden es un ''Set de Entrada'' que incluye un kit de activos para redes sociales listos para que empieces a vender de inmediato."
    },
    {
      "icon": "Award",
      "title": "Programa de tiers",
      "description": "Avanza en la red de guardianes según tu volumen y regularidad de reposición. Desbloquea mayores márgenes y acceso prioritario a floraciones limitadas."
    }
  ],
  "stats": [
    {
      "value": "30 días",
      "label": "Ciclo preferente de reposición"
    },
    {
      "value": "0 costo",
      "label": "Sin cobro de incorporación"
    },
    {
      "value": "Escalable",
      "label": "Margen comercial según volumen"
    },
    {
      "value": "Kit digital",
      "label": "Activos fotográficos de apoyo"
    }
  ],
  "process": [
    {
      "step": "01",
      "title": "Únete",
      "desc": "Regístrate sin costo, obtén tu código de revendedor y descarga tu Pack Digital de ventas."
    },
    {
      "step": "02",
      "title": "Distribuye",
      "desc": "Ofrece los formatos disponibles e invita a tus clientes a escanear tu código para acceder a la trazabilidad y cata de origen."
    },
    {
      "step": "03",
      "title": "Acelera",
      "desc": "Haz pedidos de reposición regulares para acceder a bonificaciones comerciales y condiciones preferentes."
    }
  ],
  "faq": [
    {
      "question": "¿Cómo funciona el Bonus de Recompra Rápida?",
      "answer": "El sistema mide la cadencia de tus pedidos. Si mantienes reposición continua dentro del plazo establecido, se aplica automáticamente una bonificación comercial o unidades de cortesía."
    },
    {
      "question": "¿Cómo mis clientes acceden a la trazabilidad conmigo?",
      "answer": "Te asignamos un código único de representación. Cuando entregas un frasco, tus clientes escanean el código para acceder al pasaporte de lote y registrar su percepción sensorial."
    },
    {
      "question": "¿Qué incluye el Pack Digital?",
      "answer": "Al registrarte, descargas un paquete con fotografías profesionales de los frascos, textos de venta probados y gráficos para redes sociales."
    }
  ],
  "code_modules": [
    {
      "id": "modulo-portal-embajador",
      "package_name": "@enjambre/auth",
      "titulo": "Portal Privado de Embajador & Código de Atribución",
      "titulo_en": "Private Ambassador Portal & Attribution Codes",
      "descripcion": "Panel digital personal con código único de representación. Cada frasco o tarjeta que entregas enlaza a tu perfil, asegurando comisiones transparentes por cada recompra de tus contactos.",
      "descripcion_en": "Personal digital portal with dedicated reseller code. Every jar or card you hand out links to your account, securing commissions on every downstream reorder.",
      "badge": "Comisión Garantizada",
      "beneficio_comercial": "Construye un ingreso recurrente sin depender de volver a cobrar manualmente: tus clientes recompran en la tienda y la comisión es tuya.",
      "beneficio_comercial_en": "Builds recurring income without manual debt chasing: your contacts repurchase online and you earn your commission."
    },
    {
      "id": "modulo-revendedor-wallet",
      "package_name": "@enjambre/wallet",
      "titulo": "Pase de Membresía Móvil & Fidelización Automatizada",
      "titulo_en": "Mobile Membership Pass & Automated Retention",
      "descripcion": "Tus clientes agregan su tarjeta a Apple Wallet o Google Wallet y acumulan sellos por cada compra que te hacen, motivando la recompra periódica del formato de 500g.",
      "descripcion_en": "Your clients save their pass to Apple Wallet or Google Wallet, earning reward stamps on every purchase to drive steady 500g reorders.",
      "badge": "Retención sin Fricción",
      "beneficio_comercial": "Fideliza a tu círculo cercano con incentivos digitales reales que generan una tasa de recompra cada 3 semanas.",
      "beneficio_comercial_en": "Retains your network with digital incentives that generate recurring orders every 3 weeks."
    },
    {
      "id": "modulo-revendedor-pricing",
      "package_name": "@enjambre/pricing",
      "titulo": "Bonus de Recompra Rápida & Escala de Márgenes (41%–45%)",
      "titulo_en": "Rapid Restock Bonus & Margin Scale (41%–45%)",
      "descripcion": "Sistema que premia la velocidad de rotación: al reponer inventario en menos de 30 días, el motor desbloquea unidades de cortesía y descuentos crecientes.",
      "descripcion_en": "Turnover incentive system: restock within 30 days and unlock complimentary bonus jars plus progressive volume discounts.",
      "badge": "Rentabilidad Creciente",
      "beneficio_comercial": "Aumenta tu ganancia neta por frasco a medida que construyes una base fiel de consumidores en tu comuna.",
      "beneficio_comercial_en": "Boosts your net profit per jar as you grow a steady customer base in your neighborhood."
    },
    {
      "id": "modulo-contable",
      "package_name": "@enjambre/contable",
      "titulo": "Liquidación Transparente & Respaldo Tributario Inmediato",
      "titulo_en": "Transparent Settlement & Instant Tax Invoicing",
      "descripcion": "Módulo contable que genera resúmenes claros de ventas, márgenes obtenidos y emisión de boletas o facturas con un clic.",
      "descripcion_en": "Accounting module providing clear summaries of sales, realized margins, and one-click receipt and invoice generation.",
      "badge": "Control Financiero Total",
      "beneficio_comercial": "Maneja tu negocio independiente con orden financiero impecable, cero enredos y total certeza de tus márgenes de ganancia.",
      "beneficio_comercial_en": "Run your independent venture with pristine bookkeeping, zero accounting hassles, and complete margin transparency."
    }
  ],
  "seo_title": "Programa de Revendedores · La Obrera y el Zángano",
  "seo_description": "Revende miel cruda premium. Accede a bonus de recompra rápida, pack digital de ventas y un programa de fidelidad en app para retener a tus propios clientes."
}'::jsonb, true, NOW(), NOW());
  END IF;
END $$;
