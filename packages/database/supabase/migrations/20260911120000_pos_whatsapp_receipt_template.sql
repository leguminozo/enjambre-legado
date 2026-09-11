-- =============================================================================
-- Migration 20260911000000: Plantilla oficial comprobante WhatsApp POS (Campo)
-- Registra en email_templates la plantilla para que sea editable desde Núcleo.
-- =============================================================================

INSERT INTO email_templates (key, segment, subject_template, body_template, enabled, mode, send_after_hours)
VALUES (
  'pos_whatsapp_receipt',
  'cliente',
  'Comprobante WhatsApp POS (Campo)',
  '✦ ENJAMBRE LEGADO · CHILOÉ
Certificado de Origen y Entrega Oficial

Estimado/a {{nombre_cliente}}:
Gracias por respaldar la apicultura virgen de bosque nativo en Chiloé.

📦 Detalle de tu selección:
{{productos_detalle}}
Total: {{monto_total}}

🌳 Impacto Territorial:
Tu compra respalda directamente el protocolo de custodia y conteo de especies nativas en el Predio Pureo, Archipiélago de Chiloé.

✨ Pasaporte Digital de Origen:
Conoce la composición botánica y activa tus beneficios de cliente aquí:
{{link_pasaporte}}',
  true,
  'immediate',
  0
)
ON CONFLICT (key) DO NOTHING;
