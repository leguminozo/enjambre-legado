-- =============================================================================
-- 20261025160000_b2b_kits_degustacion_potlatch_skus_reales.sql
--
-- Sincronización B2B CMS & Catálogo Maestro:
-- 1. Registro de insumos internos y testers de degustación en 'productos' (visible = false).
-- 2. Parametrización de los 3 Kits reales de Feria (25g, 150g, 900g) en 'b2b_sets_entrada'.
-- 3. Sincronización de 'site_content' (b2b_ferias y b2b_revendedores) con la
--    Estación de Degustación Masiva (Potlatch Botánico), microespátulas de bambú y
--    las 4 cremas reales, eliminando formatos inexistentes (300g, 500g, baldes)
--    y filtrando lenguaje residual de cafeterías.
-- 4. Actualización del rigor científico sobre la actividad enzimática peroxídica
--    del Ulmo en la evidencia de site_content.
-- =============================================================================

-- ── 1. Insumos Internos y Testers en 'productos' (visible = false) ───────────
INSERT INTO public.productos (slug, nombre, precio, stock, formato, categoria, visible, channels, descripcion_corta)
VALUES
  ('insumo-espatulas-bambu-150', 'Microespátulas de bambú biodegradables (Pack 150 un.)', 0, 1000, 'pack_150', 'insumos_b2b', false, ARRAY['b2b', 'feria'], 'Espátulas higiénicas de bambú para degustación masiva en 90 segundos'),
  ('insumo-espatulas-bambu-300', 'Microespátulas de bambú biodegradables (Pack 300 un.)', 0, 1000, 'pack_300', 'insumos_b2b', false, ARRAY['b2b', 'feria'], 'Espátulas higiénicas de bambú para eventos y ferias de fin de semana'),
  ('insumo-espatulas-bambu-600', 'Microespátulas de bambú biodegradables (Pack 600 un.)', 0, 1000, 'pack_600', 'insumos_b2b', false, ARRAY['b2b', 'feria'], 'Dotación mensual de espátulas para alto flujo peatonal'),
  ('insumo-exhibidor-madera-35x30', 'Exhibidor escalonado de mesón en madera nativa (35×30 cm)', 0, 50, 'unidad', 'material_punto_venta', false, ARRAY['b2b', 'feria'], 'Módulo compacto de mesón para co-expositores de ferias gourmet'),
  ('insumo-tester-150g-virgen', 'Tester 150g Crema de Miel Virgen (Muestra Degustación)', 0, 200, '150g', 'degustacion_b2b', false, ARRAY['b2b', 'feria'], 'Frasco tester bonificado para cata incondicional en stand'),
  ('insumo-tester-150g-avellana', 'Tester 150g Crema con Avellanas Chilenas (Muestra Degustación)', 0, 200, '150g', 'degustacion_b2b', false, ARRAY['b2b', 'feria'], 'Frasco tester bonificado para cata incondicional en stand'),
  ('insumo-tester-150g-polen', 'Tester 150g Crema con Polen Floral (Muestra Degustación)', 0, 200, '150g', 'degustacion_b2b', false, ARRAY['b2b', 'feria'], 'Frasco tester bonificado para cata incondicional en stand'),
  ('insumo-tester-150g-cacao', 'Tester 150g Crema con Cacao Nibs de Santander (Muestra Degustación)', 0, 200, '150g', 'degustacion_b2b', false, ARRAY['b2b', 'feria'], 'Frasco tester bonificado para cata incondicional en stand'),
  ('insumo-tarjeta-a6-qr', 'Tarjeta de mesón A6 en papel algodón con soporte de madera y QR', 0, 200, 'unidad', 'material_punto_venta', false, ARRAY['b2b', 'feria'], 'Tarjeta de trazabilidad y pago rápido móvil para mesón de feria'),
  ('insumo-bolsas-kraft', 'Bolsas kraft con fuelle para entrega en feria', 0, 1000, 'pack', 'material_punto_venta', false, ARRAY['b2b', 'feria'], 'Bolsas kraft de papel de alto gramaje para empaque de compras')
ON CONFLICT (slug) DO UPDATE
SET
  visible = false,
  channels = ARRAY['b2b', 'feria'],
  updated_at = NOW();

-- ── 2. Sets de Entrada de Feria en 'b2b_sets_entrada' ────────────────────────
INSERT INTO public.b2b_sets_entrada (
  nombre,
  descripcion,
  precio_clp,
  tipo_entorno,
  incluye_materiales,
  materiales_descripcion,
  pack_digital,
  activo,
  sort_order
)
VALUES
  (
    'Kit 1: Piloto «Córner de Autor»',
    'Módulo compacto de 35 × 30 cm para 1 fin de semana en mesón compartido. 44 frascos venta + 4 testers + 150 espátulas.',
    169000,
    'feria_evento',
    true,
    'Exhibidor madera nativa 35×30 cm, 150 microespátulas bambú, Tarjeta A6 con QR, 20 bolsas kraft y Guía plastificada de cata.',
    true,
    true,
    1
  ),
  (
    'Kit 2: «Estación Sensorial Pro» ★',
    'El balance óptimo para 2 fines de semana o ferias consolidadas. 88 frascos venta + 8 testers + 300 espátulas.',
    315000,
    'feria_evento',
    true,
    'Exhibidor madera nativa 35×30 cm, Paño de lino, 300 microespátulas bambú, 2 Tarjetas A6 con QR, 45 bolsas kraft y Guía plastificada.',
    true,
    true,
    2
  ),
  (
    'Kit 3: «Partner Circuito Oriente»',
    'Abastecimiento de mes completo para 4 ferias o festivales masivos con exclusividad de stand. 176 frascos venta + 12 testers + 600 espátulas.',
    590000,
    'feria_evento',
    true,
    '2 Exhibidores madera nativa, 2 Paños de lino, 600 microespátulas bambú, 3 Tarjetas A6 con QR, 90 bolsas kraft y Guía plastificada.',
    true,
    true,
    3
  )
ON CONFLICT DO NOTHING;

-- ── 3. Sincronización CMS: 'site_content' para b2b_ferias ────────────────────
UPDATE public.site_content
SET content = jsonb_set(
  content,
  '{kits}',
  '[
    {
      "id": "kit-corner-autor",
      "nombre": "Kit 1: Piloto «Córner de Autor»",
      "badge": "1 Fin de Semana · Mesón Compartido",
      "tier": "entrada",
      "tagline": "Módulo compacto de 35 × 30 cm para feriantes, queserías y panaderías",
      "descripcion": "Diseñado para operar en un ángulo de mesón compartido con cata masiva libre y stock de impulso en 25 g, frascos de mesa de 150 g y formato familiar de 900 g.",
      "precio_neto_clp": 169000,
      "pvp_estimado_clp": 331960,
      "margen_estimado_pct": 39,
      "moq_summary": "44 frascos venta + 4 testers + 150 espátulas",
      "sales_strategy": "44 piezas selladas de venta (16x 25g + 24x 150g + 4x 900g) respaldadas por 4 testers bonificados y 150 espátulas de bambú para cata incondicional sin goteo.",
      "componentes_fisicos": [
        { "cantidad": "16 un.", "item": "Mini frascos 25g de impulso", "detalle": "4 Virgen, 4 Avellana Chilena, 4 Polen Floral, 4 Cacao Nibs ($3.000 PVP c/u)" },
        { "cantidad": "24 un.", "item": "Frascos 150g de autor", "detalle": "6 Virgen, 6 Avellana Chilena, 6 Polen Floral, 6 Cacao Nibs ($8.000 PVP c/u)" },
        { "cantidad": "4 un.", "item": "Frascos 900g Reserva del Bosque", "detalle": "Crema de Miel Virgen de bosque nativo ($22.990 PVP c/u)" },
        { "cantidad": "4 un.", "item": "Testers 150g Bonificados ($0 costo)", "detalle": "1 frasco tester por variedad para ~120 degustaciones libres de compromiso" },
        { "cantidad": "150 un.", "item": "Microespátulas de bambú biodegradables", "detalle": "Para degustación masiva en 90 segundos sin goteo ni doble inmersión" },
        { "cantidad": "1 un.", "item": "Exhibidor escalonado en madera nativa (35×30 cm)", "detalle": "Ocupa un rincón discreto de mesón sin quitar espacio de venta" },
        { "cantidad": "1 un.", "item": "Tarjeta de mesón A6 en papel algodón con QR", "detalle": "Trazabilidad botánica de lote y pago móvil sin filas" },
        { "cantidad": "20 un.", "item": "Bolsas kraft con fuelle", "detalle": "Empaque de entrega para compras de clientes" },
        { "cantidad": "1 pack", "item": "Guía plastificada de cata para el vendedor", "detalle": "Secuencia sensorial de 90 segundos adherida tras el exhibidor" }
      ],
      "materiales_exhibicion": [
        "Exhibidor madera nativa 35×30 cm",
        "Tarjeta A6 algodón con QR",
        "Guía plastificada de cata"
      ],
      "integraciones_digitales": [
        { "titulo": "QR Dinámico con Atribución de Aliado", "descripcion": "Comisión pasiva del 10% en compras online futuras de quienes escaneen tu stand", "tag": "fidelizacion" },
        { "titulo": "Cobro Móvil Rápido en Terreno", "descripcion": "Terminal de pago o transferencia rápida con emisión de comprobante", "tag": "pricing" },
        { "titulo": "Trazabilidad Analítica del Lote", "descripcion": "Pasaporte botánico con floración, humedad <18% y análisis de laboratorio", "tag": "trazabilidad" }
      ],
      "recomendado_para": "Mercado Drugstore, Ecoferia La Reina, Plaza Perú, Plaza Ñuñoa y co-expositores de alimentos gourmet"
    },
    {
      "id": "kit-estacion-pro",
      "nombre": "Kit 2: «Estación Sensorial Pro» ★",
      "badge": "El Más Elegido · 2 Fines de Semana",
      "tier": "medio",
      "tagline": "Arsenal completo de cata masiva y rotación para ferias consolidadas",
      "descripcion": "El punto de equilibrio perfecto para ferias de alto flujo de sábado y domingo. Duplica el stock de venta con 88 frascos, 8 testers de cata y 300 espátulas de bambú.",
      "precio_neto_clp": 315000,
      "pvp_estimado_clp": 663920,
      "margen_estimado_pct": 44,
      "moq_summary": "88 frascos venta + 8 testers + 300 espátulas",
      "sales_strategy": "Inviertes $315.000 neto y recaudas $663.920 PVP. Margen del 43,5% y ROI del 77,1%, con capacidad para más de 240 degustaciones guiadas.",
      "componentes_fisicos": [
        { "cantidad": "32 un.", "item": "Mini frascos 25g de impulso", "detalle": "8 Virgen, 8 Avellana Chilena, 8 Polen Floral, 8 Cacao Nibs ($3.000 PVP c/u)" },
        { "cantidad": "48 un.", "item": "Frascos 150g de autor", "detalle": "12 Virgen, 12 Avellana Chilena, 12 Polen Floral, 12 Cacao Nibs ($8.000 PVP c/u)" },
        { "cantidad": "8 un.", "item": "Frascos 900g Reserva del Bosque", "detalle": "Crema de Miel Virgen familiar ($22.990 PVP c/u)" },
        { "cantidad": "8 un.", "item": "Testers 150g Bonificados ($0 costo)", "detalle": "2 sets completos de las 4 variedades para ~240 degustaciones continuas" },
        { "cantidad": "300 un.", "item": "Microespátulas de bambú biodegradables", "detalle": "Dotación para abastecer alto flujo peatonal" },
        { "cantidad": "1 un.", "item": "Exhibidor escalonado en madera nativa (35×30 cm) + Paño de lino", "detalle": "Montaje de alta gama para mesón de feria" },
        { "cantidad": "2 un.", "item": "Tarjetas de mesón A6 en papel algodón con QR", "detalle": "Pago rápido y registro de comensales" },
        { "cantidad": "45 un.", "item": "Bolsas kraft con fuelle", "detalle": "Empaque de entrega para clientes" },
        { "cantidad": "1 pack", "item": "Guía plastificada de cata para el vendedor", "detalle": "Secuencia sensorial de 90 segundos adherida tras el exhibidor" }
      ],
      "materiales_exhibicion": [
        "Exhibidor madera nativa 35×30 cm",
        "Paño de lino crudo",
        "2 Tarjetas A6 algodón con QR",
        "Guía plastificada de cata"
      ],
      "integraciones_digitales": [
        { "titulo": "QR Dinámico con Atribución de Aliado", "descripcion": "Comisión pasiva del 10% en compras online futuras de quienes escaneen tu stand", "tag": "fidelizacion" },
        { "titulo": "App Móvil de Terreno (POS Offline)", "descripcion": "Registro rápido de pedidos y combos incluso sin conexión a internet", "tag": "pricing" },
        { "titulo": "Trazabilidad Analítica del Lote", "descripcion": "Certificación de recolección en frío, polen y apicultor del lote", "tag": "trazabilidad" }
      ],
      "recomendado_para": "Mercado Mastica, Casa Gusto, María Mercado, Bazar ED y Lo Barnechea Emprende"
    },
    {
      "id": "kit-partner-circuito",
      "nombre": "Kit 3: «Partner Circuito Oriente»",
      "badge": "Mes Completo · Máximo Margen",
      "tier": "avanzado",
      "tagline": "Abastecimiento integral para ferias semanales, festivales masivos y exclusividad territorial",
      "descripcion": "Para operadores de ferias itinerantes o expositores con circuito permanente de 4 fines de semana al mes. Margen superior al 47% con 176 frascos de venta, 12 testers y 600 espátulas.",
      "precio_neto_clp": 590000,
      "pvp_estimado_clp": 1327840,
      "margen_estimado_pct": 47,
      "moq_summary": "176 frascos venta + 12 testers + 600 espátulas",
      "sales_strategy": "Facturación a público de $1.327.840 con utilidad líquida de más de $525.000 netos (+89,1% ROI). Incluye 2 exhibidores y reserva de exclusividad de stand en tu feria habitual.",
      "componentes_fisicos": [
        { "cantidad": "64 un.", "item": "Mini frascos 25g de impulso", "detalle": "16 Virgen, 16 Avellana Chilena, 16 Polen Floral, 16 Cacao Nibs ($3.000 PVP c/u)" },
        { "cantidad": "96 un.", "item": "Frascos 150g de autor", "detalle": "24 Virgen, 24 Avellana Chilena, 24 Polen Floral, 24 Cacao Nibs ($8.000 PVP c/u)" },
        { "cantidad": "16 un.", "item": "Frascos 900g Reserva del Bosque", "detalle": "Crema de Miel Virgen familiar ($22.990 PVP c/u)" },
        { "cantidad": "12 un.", "item": "Testers 150g Bonificados ($0 costo)", "detalle": "3 sets completos de las 4 variedades para ~360 degustaciones" },
        { "cantidad": "600 un.", "item": "Microespátulas de bambú biodegradables", "detalle": "Flujo masivo de cata durante todo el mes" },
        { "cantidad": "2 un.", "item": "Exhibidores escalonados en madera nativa (35×30 cm) + 2 Paños de lino", "detalle": "Cobertura de mesón amplio o dos puntos de contacto" },
        { "cantidad": "3 un.", "item": "Tarjetas de mesón A6 en papel algodón con QR", "detalle": "Pago rápido y registro de comensales" },
        { "cantidad": "90 un.", "item": "Bolsas kraft con fuelle", "detalle": "Empaque de entrega para compras de clientes" },
        { "cantidad": "1 pack", "item": "Guía plastificada de cata para el vendedor", "detalle": "Secuencia sensorial de 90 segundos adherida tras el exhibidor" }
      ],
      "materiales_exhibicion": [
        "2 Exhibidores madera nativa 35×30 cm",
        "2 Paños de lino crudo",
        "3 Tarjetas A6 algodón con QR",
        "Guía plastificada de cata"
      ],
      "integraciones_digitales": [
        { "titulo": "Exclusividad Territorial de Stand", "descripcion": "Protección de marca para ser el único expositor oficial de La Obrera y el Zángano en tu feria", "tag": "marketing" },
        { "titulo": "QR Dinámico con Atribución de Aliado", "descripcion": "Comisión pasiva del 10% en compras online de clientes de tu feria", "tag": "fidelizacion" },
        { "titulo": "App Móvil de Terreno & Reseñas en Vivo", "descripcion": "Gestión comercial completa en apps/campo con sincronización offline", "tag": "pricing" }
      ],
      "recomendado_para": "Festivales masivos (Bazar ED, Chile Wine Fest, Mercado Paula Gourmet) y expositores permanentes del sector oriente"
    }
  ]'::jsonb
)
WHERE section_key = 'b2b_ferias';

-- ── 4. Rigor Científico: Precisión en Evidencia de site_content ─────────────
UPDATE public.site_content
SET content = jsonb_set(
  content,
  '{texto}',
  '"Estudios agronómicos y microbiológicos respaldan la dominancia de especies endémicas del bosque valdiviano e insular con potente bioactividad antimicrobiana enzimática peroxídica de liberación lenta, un marcador dominante de pinocembrina (>230 mg/kg) y sinergia polifloral de bajo pH sin alteración térmica."'::jsonb
)
WHERE section_key = 'ciencia_evidencia' AND content->>'texto' LIKE '%no peróxica%';
