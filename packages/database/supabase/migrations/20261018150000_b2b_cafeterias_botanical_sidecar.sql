-- Migración 20261018150000: Actualización canónica de b2b_cafeterias en site_content.
-- Implementa la Arquitectura Comercial B2B para Cafeterías de Especialidad y Tostadurías:
-- 1. Estandarización en 2 Formatos (25 g Sidecar y 150 g Vitrina) x 4 Formulaciones Botánicas.
-- 2. Eliminación de baldes de 5 kg, potes de 500 g y frascos de 300 g.
-- 3. Protocolo «Botanical Sidecar» (<40 °C) en bandeja para cata secuencial sin intervenir la taza.
-- 4. Reducción a 3 Kits exactos según Ley de Hick: Piloto de Validación ($78.400), Tracción Barista ($204.000) y Ecosistema ($377.600).
-- 5. Rigor bioquímico: 23,1 Schade, reología tixotrópica, teobromina pura, aminoácidos y polen nativo a 42°S.

DO $$
DECLARE
  v_content jsonb := $json$
{
  "slug": "cafeterias",
  "tipo": "cafeteria",
  "kicker": "ALIANZAS B2B · CAFETERÍAS DE ESPECIALIDAD & TOSTADURÍAS",
  "kicker_en": "B2B ALLIANCES · SPECIALTY COFFEE SHOPS & ROASTERIES",
  "headline": "El café de especialidad no se endulza en taza. Se acompaña en mesa.",
  "headline_en": "Specialty coffee is not sweetened in the cup. It is paired at the table.",
  "subheadline": "Cuatro cremas de miel cruda batida en frío recolectadas en el bosque nativo de Chiloé (42°S), formuladas científicamente para el ritual de cata secuencial (Sidecar de 25 g) y la venta de impulso en mostrador (Reserva de 150 g). Cero alteración de tu curva de tueste. +41% a +48% de margen neto real para tu barra.",
  "subheadline_en": "Four cold-churned raw honey creams harvested in the native forest of Chiloé (42°S), scientifically formulated for the sequential tasting ritual (25 g Sidecar) and impulse takeaway sales (150 g Reserve). Zero alteration of your roast profile. +41% to +48% real net margin for your coffee bar.",
  "hero_image": "https://hdhamxiblwwskvvqbcfo.supabase.co/storage/v1/object/public/cms/cms/b2b_cafeterias/1edc4694-eff1-4b44-9718-4c5a4a9043cd.webp",
  "suggested_products_copy": "ARQUITECTURA DE MARIDAJE MOLECULAR. Disponibles exclusivamente en Pieza de Cata de Mesa (25 g) y Reserva de Vitrina (150 g). Cuatro matrices botánicas diseñadas para resonar con el método de extracción y perfil de tueste de tu barra.",
  "suggested_products_copy_en": "MOLECULAR PAIRING ARCHITECTURE. Exclusively available in Table Tasting Pieces (25 g) and Display Reserve (150 g). Four botanical matrices crafted to resonate with your brew method and roast profile.",
  "cta_text": "Activar Kit Piloto ($78.400 neto)",
  "cta_text_en": "Activate Pilot Kit ($78,400 net)",
  "cta_href": "#registro",
  "value_props": [
    {
      "icon": "Coffee",
      "title": "Protocolo Botanical Sidecar (<40°C)",
      "description": "Se sirve en frasco de 25 g con microespátula junto a la taza, jamás dentro de la infusión. Permite cata secuencial sin romper la microespuma ni desnaturalizar enzimas bioactivas."
    },
    {
      "icon": "ShieldCheck",
      "title": "Reología Tixotrópica y Emulsión en Frío",
      "description": "Textura cremosa y untable lograda mediante microcristalización mecánica a menos de 20°C. Sólida en reposo, funde a 36°C en paladar liberando aromas retronasales."
    },
    {
      "icon": "QrCode",
      "title": "Trazabilidad Analítica y QR por Lote",
      "description": "Cada unidad enlaza al análisis de laboratorio oficial (humedad <17.5%, 23,1 unidades Schade de diastasa, HMF <10 mg/kg) y geolocalización botánica a 42°S."
    }
  ],
  "stats": [
    { "value": "23,1 Schade", "label": "Actividad Enzimática Viva" },
    { "value": "< 40 °C", "label": "Temperatura Preservación" },
    { "value": "41% a 48%", "label": "Margen Neto Real en Barra" },
    { "value": "Chiloé 42°S", "label": "Bosque Templado Lluvioso" }
  ],
  "process": [
    {
      "step": "01",
      "title": "25 g — Botanical Sidecar de Mesa",
      "desc": "Servicio en bandeja junto a la taza con microespátula. Cata secuencial que complementa la acidez málica sin intervenir el café."
    },
    {
      "step": "02",
      "title": "150 g — Reserva de Vitrina",
      "desc": "Exhibición en mostrador para compra por impulso al pedir la cuenta. Formato takeaway calibrado al valor de una bolsa de café."
    },
    {
      "step": "03",
      "title": "Trazabilidad Digital de Lote",
      "desc": "QR en cada pieza con curva analítica de laboratorio y perfil aromático para baristas y comensales en el protocolo ST-CATA."
    }
  ],
  "faq": [
    {
      "question": "¿Por qué no se debe disolver la miel dentro del café caliente?",
      "answer": "La temperatura del espresso o filtrado (65°C a 90°C) desnaturaliza aceleradamente enzimas bioactivas (diastasa, invertasa y glucosa oxidasa) a partir de los 40°C y evapora terpenos volátiles. Además, el ácido glucónico altera la acidez de la taza y los sólidos de avellana o cacao colapsan la microespuma de la leche."
    },
    {
      "question": "¿Cómo se presenta el ritual «Botanical Sidecar» en mesa?",
      "answer": "El café se entrega limpio. En la bandeja se acompaña el frasco de 25 g cerrado y una microespátula de bambú. El barista invita: «Te dejamos este Botanical Sidecar: prueba una pizca en la espátula y luego un sorbo de café para sentir el contrapunto floral»."
    },
    {
      "question": "¿Cuál es el tiempo de entrega y vida útil del producto en barra?",
      "answer": "Despacho directo desde Chiloé en 48-72 h hábiles con seguro de carga. La miel cruda batida en frío tiene una estabilidad superior a 24 meses conservada a temperatura ambiente (15°C a 22°C), manteniendo su textura untable sin fermentar gracias a su humedad analítica certificada menor al 17,5%."
    }
  ],
  "commercial_strategy": {
    "titulo": "Ritual «Botanical Sidecar» y Conversión Cruzada Mesa-Vitrina",
    "titulo_en": "Botanical Sidecar Ritual and Table-to-Retail Cross-Conversion",
    "bajada": "El frasco de 25 g actúa como acompañante de cata secuencial en bandeja (<40°C), activando por impulso la venta del frasco cerrado de 150 g en el mostrador.",
    "aumento_ticket": "Upsell de $2.500–$2.900 en mesa & $9.500 PVP en vitrina",
    "herramienta_clave": "Código QR de Lote, Tarjeta A6 & Frascos Tester Bonificados",
    "mecanica_ventas": [
      "Paso 1: Servicio en bandeja con pieza de 25 g y microespátula junto a la taza, preservando enzimas y acidez.",
      "Paso 2: Cata secuencial en paladar antes del sorbo de espresso o filtrado, liberando aromas retronasales.",
      "Paso 3: Microcatas de 5 segundos en mesón de pago con frascos Tester de 150 g bonificados.",
      "Paso 4: Venta de frascos de 150 g en vitrina con precio psicológico equivalente a una bolsa de café de 250 g."
    ]
  },
  "molecular_pairings": [
    {
      "id": "miel-virgen-cruda-ulmo",
      "nombre": "Miel Virgen Cruda de Ulmo",
      "subtitulo": "23,1 Schade · Vitalidad Enzimática Intacta",
      "formato": "25 g (Pieza de Mesa / Sidecar) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel monofloral de Eucryphia cordifolia batida en frío. Textura aterciopelada, notas de jazmín, anís estrella, fondo mentolado y frescor balsámico.",
      "perfil_bioquimico": "Actividad diastásica de 23,1 unidades Schade (frescura y vitalidad enzimática), glucosa oxidasa activa y alta capacidad bactericida natural.",
      "par_en_barra": "Cafés lavados de alta altitud y acidez brillante (Etiopía Yirgacheffe, Kenia Nyeri, Colombia Huila).",
      "neurogastronomia": "La microdosis en espátula estimula receptores gustativos del tercio anterior de la lengua y retronasales florales. Al beber el café, la acidez corta la untuosidad de la miel provocando un reset sensorial limpio (cleansing effect) sin alterar la taza.",
      "badge": "Formulación 01 · Floral & Cítrico",
      "badge_bioquimico": "Enzimas Vivas"
    },
    {
      "id": "avellana-chilena-gevuina",
      "nombre": "Crema Batida con Avellana Chilena Tostada",
      "subtitulo": "Gevuina avellana silvestre · Perfil Lipídico Tixotrópico",
      "formato": "25 g (Pieza de Mesa / Sidecar) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda emulsionada con harina fina de avellana chilena silvestre tostada a baja temperatura. Notas cálidas de madera tostada, praliné profundo y toque terroso.",
      "perfil_bioquimico": "Ácido palmitoleico (omega-7) y ácido oleico (omega-9). Reología tixotrópica: sólida untable en reposo, funde a 36 °C en paladar liberando volátiles pirazínicos.",
      "par_en_barra": "Bebidas lácteas texturizadas (Flat White, Cappuccino, Cortado) y espressos de tueste medio (proceso natural / honey).",
      "neurogastronomia": "Consumida en sidecar entre sorbos de flat white, los lípidos interactúan con las micelas de caseína de la leche creando mouthfeel enhancement sin romper la microespuma en la taza.",
      "badge": "Formulación 02 · Lácteo & Tostado",
      "badge_bioquimico": "Omega 7 & 9"
    },
    {
      "id": "nibs-cacao-crudo-santander",
      "nombre": "Crema Batida con Nibs de Cacao Crudo de Santander",
      "subtitulo": "Granulometría calibrada 150-250 µm · Teobromina Pura",
      "formato": "25 g (Pieza de Mesa / Sidecar) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda combinada con nibs de cacao criollo/trinitario de Santander molidos en frío. Contrapunto amargo noble, notas de frutos rojos secos, mora silvestre y astringencia noble.",
      "perfil_bioquimico": "Teobromina (alcaloide purínico vasodilatador suave sin sobreestimulación cardíaca) y flavonoides antioxidantes (epicatequinas y procianidinas).",
      "par_en_barra": "Espressos dobles intensos, Cold Brew de extracción lenta (18 h) y cafés de proceso anaeróbico o fermentación prolongada.",
      "neurogastronomia": "La teobromina sinergiza con la cafeína suavizando la curva de atención. El amargor y taninos limpian la dulzura, preparando los receptores de amargor (TAS2Rs) para apreciar los matices vinosos y achocolatados del café natural.",
      "badge": "Formulación 03 · Amargo & Vinoso",
      "badge_bioquimico": "Teobromina"
    },
    {
      "id": "polen-floral-nativo",
      "nombre": "Crema Batida con Polen Floral Nativo de Chiloé",
      "subtitulo": "22-28% Proteína Vegetal · Estimulación Trigeminal Háptica",
      "formato": "25 g (Pieza de Mesa / Sidecar) · 150 g (Reserva de Vitrina)",
      "perfil_sensorial": "Miel cruda con microcápsulas de polen apícola de bosque templado lluvioso. Notas minerales, cereal tostado, umami dulce y textura crujiente suave (micro-crunch).",
      "perfil_bioquimico": "22-28% proteína vegetal rica en aminoácidos esenciales (leucina, valina, lisina), rutina antioxidante y complejo vitamínico B biodisponible.",
      "par_en_barra": "Variedades botánicas exóticas (Geisha, Pacamara, Sidra, Pink Bourbon) en pour over (V60, Origami) y bebidas de especialidad (Matcha Ceremonial Uji, Hojicha).",
      "neurogastronomia": "La estimulación trigeminal del micro-crunch activa una respuesta háptica en boca que rompe la monotonía líquida del filtrado. Los aminoácidos interactúan con receptores umami (T1R1/T1R3), potenciando cuerpo y persistencia en el retrogusto.",
      "badge": "Formulación 04 · Exótico & Pour Over",
      "badge_bioquimico": "Aminoácidos & Rutina"
    }
  ],
  "kits": [
    {
      "id": "piloto-validacion",
      "nombre": "KIT 01: Piloto de Validación (15 Días)",
      "badge": "Iniciación · Sin Riesgo",
      "tier": "starter",
      "tagline": "Validar rotación en mesa y vitrina con riesgo financiero mínimo",
      "descripcion": "Una selección ágil y sin fricción de las 4 formulaciones botánicas en 25 g y 150 g para comprobar la aceptación en mesa y vitrina con soporte técnico y exhibidor de mostrador.",
      "precio_neto_clp": 78400,
      "pvp_estimado_clp": 159200,
      "margen_estimado_pct": 41,
      "moq_summary": "32 piezas 25g + 8 frascos 150g + exhibidor",
      "sales_strategy": "Inversión: $78.400 neto (~$93.296 IVA inc.). Venta total: $159.200 PVP ($133.782 venta neta). Utilidad neta limpia: +$55.382 netos (41,4% margen real, +70,6% ROI).",
      "componentes_fisicos": [
        { "cantidad": "32 un.", "item": "Piezas de Mesa 25g", "detalle": "8 Virgen Ulmo, 8 Avellana Chilena, 8 Cacao Santander, 8 Polen Floral" },
        { "cantidad": "8 un.", "item": "Reserva de Vitrina 150g", "detalle": "2 Virgen Ulmo, 2 Avellana Chilena, 2 Cacao Santander, 2 Polen Floral" },
        { "cantidad": "1 un.", "item": "Exhibidor de Mostrador", "detalle": "Madera noble reciclada con capacidad para 8 frascos de vitrina" },
        { "cantidad": "4 un.", "item": "Fichas Técnicas A6", "detalle": "Respaldo analítico y notas de cata para mesa y mostrador" }
      ],
      "herramientas_servicio": [
        "100 microespátulas de bambú para servicio higiénico en bandeja",
        "Guía de servicio en mesa para personal de sala",
        "Ficha plastificada para barra con temperaturas y tiempos"
      ],
      "materiales_exhibicion": [
        "Exhibidor compacto de mesón (huella 25x15 cm)",
        "Stickers de sellado de origen para frascos de vitrina",
        "Lámina enmarcable de trazabilidad territorial"
      ],
      "integraciones_digitales": [
        { "titulo": "QR de Lote y Perfil Aromático", "descripcion": "Enlace directo al informe de laboratorio oficial por cada floración.", "tag": "trazabilidad" },
        { "titulo": "Sello de Autenticidad Digital", "descripcion": "Garantía de origen botánico verificable en línea por comensales.", "tag": "marketing" },
        { "titulo": "Fidelización en Club Legado", "descripcion": "Acumulación de beneficios directos para clientes recurrentes.", "tag": "fidelizacion" }
      ],
      "recomendado_para": "Cafeterías de especialidad de 1 local que incorporan la propuesta por primera vez con riesgo acotado."
    },
    {
      "id": "traccion-barista",
      "nombre": "KIT 02: Tracción Barista (Mensual · Recomendado)",
      "badge": "Más Elegido · Barra Activa",
      "tier": "growth",
      "tagline": "Ritual Botanical Sidecar completo en mesa y rotación continua en vitrina",
      "descripcion": "El estándar operativo para barras de alto flujo con personal capacitado. Incluye las 4 formulaciones botánicas, exhibidor de vitrina, herramientas de servicio completas y 4 frascos de 150g bonificados para degustación en barra.",
      "precio_neto_clp": 204000,
      "pvp_estimado_clp": 436000,
      "margen_estimado_pct": 44,
      "moq_summary": "96 piezas 25g + 24 frascos 150g + 4 testers",
      "sales_strategy": "Inversión: $204.000 neto (~$242.760 IVA inc.). Venta total: $436.000 PVP ($366.387 venta neta). Utilidad neta limpia: +$162.387 netos (44,3% margen real, +79,6% ROI). +4 Testers bonificados ($38.000 PVP).",
      "componentes_fisicos": [
        { "cantidad": "96 un.", "item": "Piezas de Mesa 25g", "detalle": "24 Virgen Ulmo, 24 Avellana Chilena, 24 Cacao Santander, 24 Polen Floral" },
        { "cantidad": "24 un.", "item": "Reserva de Vitrina 150g", "detalle": "6 Virgen Ulmo, 6 Avellana Chilena, 6 Cacao Santander, 6 Polen Floral" },
        { "cantidad": "4 un.", "item": "Frascos Tester 150g (Bonificados)", "detalle": "1 de cada variedad para degustación en barra sin costo para el local" },
        { "cantidad": "1 un.", "item": "Exhibidor Premium de Barra", "detalle": "Capacidad para 12 frascos de vitrina + espacio para testers" }
      ],
      "herramientas_servicio": [
        "250 microespátulas de bambú biodegradables",
        "Bandeja de cata en barra para degustación guiada",
        "Guía plastificada de maridaje con 12 orígenes de café comunes",
        "Sesión de calibración remota de 30 min con el equipo de baristas"
      ],
      "materiales_exhibicion": [
        "Exhibidor de barra en madera nativa tratada",
        "8 atriles de mesa A6 con código QR de cata para comensales",
        "Dossier técnico impreso de laboratorio para el mostrador"
      ],
      "integraciones_digitales": [
        { "titulo": "Página de Local Verificado", "descripcion": "Presencia como barra aliada en la plataforma oficial de Enjambre Legado.", "tag": "marketing" },
        { "titulo": "Membresía Digital en Apple/Google Wallet", "descripcion": "Tus clientes guardan la tarjeta de tu local sin descargar apps.", "tag": "fidelizacion" },
        { "titulo": "Trazabilidad de Lote por QR", "descripcion": "Acceso a espectro polínico, actividad diastásica y mapa del bosque nativo.", "tag": "trazabilidad" }
      ],
      "recomendado_para": "Cafeterías consolidadas con flujo diario de 80+ espressos y filtrados que buscan una experiencia diferenciadora."
    },
    {
      "id": "ecosistema-tostaduria",
      "nombre": "KIT 03: Ecosistema Tostaduría (Alta Rotación)",
      "badge": "Escala · Máximo Margen",
      "tier": "scale",
      "tagline": "Para tostadurías con barra propia, múltiples puntos o alto volumen retail",
      "descripcion": "El paquete de mayor escala y rentabilidad neta. Diseñado para tostadurías de especialidad que maridan sus propios lotes de café con miel nativa y comercializan producto empacado para llevar.",
      "precio_neto_clp": 377600,
      "pvp_estimado_clp": 872000,
      "margen_estimado_pct": 48,
      "moq_summary": "192 piezas 25g + 48 frascos 150g + 8 testers",
      "sales_strategy": "Inversión: $377.600 neto (~$449.344 IVA inc.). Venta total: $872.000 PVP ($732.773 venta neta). Utilidad neta limpia: +$355.173 netos (48,5% margen real, +94,1% ROI). +8 Testers bonificados ($76.000 PVP).",
      "componentes_fisicos": [
        { "cantidad": "192 un.", "item": "Piezas de Mesa 25g", "detalle": "48 Virgen Ulmo, 48 Avellana Chilena, 48 Cacao Santander, 48 Polen Floral" },
        { "cantidad": "48 un.", "item": "Reserva de Vitrina 150g", "detalle": "12 Virgen Ulmo, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Floral" },
        { "cantidad": "8 un.", "item": "Frascos Tester 150g (Bonificados)", "detalle": "2 de cada variedad para degustación continua en mesón y barra" },
        { "cantidad": "2 un.", "item": "Exhibidores Premium de Barra", "detalle": "Para barra principal y vitrina de café para llevar" }
      ],
      "herramientas_servicio": [
        "500 microespátulas de bambú biodegradables",
        "Kit completo de cata profesional: espátulas de cata, fichas sensoriales",
        "Sesión de calibración sensorial personalizada de 60 min",
        "Acceso directo al equipo técnico para consultas de formulación"
      ],
      "materiales_exhibicion": [
        "2 exhibidores de barra en madera nativa",
        "16 atriles de mesa A6 con QR de lote y marca de tu tostaduría",
        "Material editorial completo de bosque nativo para exhibición en tienda"
      ],
      "integraciones_digitales": [
        { "titulo": "Destacado en Red de Barras Aliadas", "descripcion": "Posicionamiento prioritario en el directorio de especialidad de Chiloé.", "tag": "marketing" },
        { "titulo": "Co-Branding en Fichas de Mesa", "descripcion": "Nombre y perfil de tu tostaduría en las tarjetas digitales de cata.", "tag": "marketing" },
        { "titulo": "Módulo de Trazabilidad Avanzada", "descripcion": "Certificados analíticos descargables en PDF para compartir con clientes.", "tag": "trazabilidad" }
      ],
      "recomendado_para": "Tostadurías con barra propia, cafeterías con más de una sucursal o barras con alto volumen de venta en mostrador."
    }
  ],
  "seo_title": "Maridaje Botánico B2B para Cafeterías de Especialidad · Enjambre Legado",
  "seo_description": "Protocolo Botanical Sidecar para barismo de tercera ola. Miel cruda de Chiloé (42°S) y cremas batidas en frío para cata secuencial en barra."
}
$json$::jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM site_content WHERE section_key = 'b2b_cafeterias') THEN
    UPDATE site_content
    SET content = v_content,
        draft_content = NULL,
        updated_at = NOW()
    WHERE section_key = 'b2b_cafeterias';
  ELSE
    INSERT INTO site_content (section_key, item_order, content, is_active, created_at, updated_at)
    VALUES ('b2b_cafeterias', 0, v_content, true, NOW(), NOW());
  END IF;
END $$;
