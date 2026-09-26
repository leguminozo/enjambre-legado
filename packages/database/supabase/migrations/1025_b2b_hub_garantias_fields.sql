-- Migración 1025: Sembrar campos por defecto de las 4 Garantías del Canal Directo en b2b_hub_settings
-- Permite edición desde el CMS en Núcleo preservando contenido existente y evitando sobrescrituras.

UPDATE site_content
SET content = content || '{
  "garantia1_title": "Pureza Certificada",
  "garantia1_title_en": "Certified Purity",
  "garantia1_desc": "Cada lote cuenta con análisis de laboratorio acreditado: humedad controlada (<18%), HMF Codex y pureza botánica documentada en nuestra sección de ciencia.",
  "garantia1_desc_en": "Every batch features accredited laboratory analysis: controlled moisture (<18%), Codex HMF levels, and botanical purity documented in our science section.",
  "garantia2_title": "Despacho Nacional",
  "garantia2_title_en": "Nationwide Shipping",
  "garantia2_desc": "Envíos protegidos a todo Chile con courier prioritario y reposición asegurada en caso de quiebre o demora.",
  "garantia2_desc_en": "Secure shipments across Chile via priority courier with guaranteed replacement in case of breakage or delay.",
  "garantia3_title": "Facturación Formal",
  "garantia3_title_en": "Commercial Invoicing",
  "garantia3_desc": "Emisión inmediata de Factura Electrónica (afecta o exenta según el producto) con RUT de empresa y soporte tributario.",
  "garantia3_desc_en": "Immediate electronic invoice issuance with company tax ID and corporate tax compliance support.",
  "garantia4_title": "Soporte de Marca",
  "garantia4_title_en": "Brand Support",
  "garantia4_desc": "Material gráfico, fichas técnicas de origen y apoyo en el relato de producto para capacitar a tu equipo de atención.",
  "garantia4_desc_en": "Marketing collateral, origin technical datasheets, and storytelling support to train your customer-facing staff."
}'::jsonb
WHERE section_key = 'b2b_hub_settings'
  AND (content->>'garantia1_title' IS NULL);
