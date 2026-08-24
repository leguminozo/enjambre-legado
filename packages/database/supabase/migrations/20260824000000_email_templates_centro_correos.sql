-- =============================================================================
-- Migration 20260824000000: Centro de Correos — plantillas editables
-- Envuelve los emails transaccionales del BFF en datos editables desde Núcleo:
-- subject/body por tipo (source), segmento, toggle, modo (immediate/queue)
-- y horas de diferido. El enqueue lee esta tabla con fallback al código.
-- RLS: solo admin (patrón 1003). Sin cambios en notification_queue.
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  key                TEXT PRIMARY KEY,
  segment            TEXT NOT NULL DEFAULT 'sistema'
                       CHECK (segment IN ('cliente','b2b','interno','territorial','sistema')),
  subject_template   TEXT NOT NULL,
  body_template      TEXT NOT NULL,
  enabled            BOOLEAN NOT NULL DEFAULT true,
  mode               TEXT NOT NULL DEFAULT 'queue'
                       CHECK (mode IN ('immediate','queue')),
  send_after_hours   INTEGER NOT NULL DEFAULT 0
                       CHECK (send_after_hours >= 0),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_templates_admin_all" ON email_templates;
CREATE POLICY "email_templates_admin_all" ON email_templates
  FOR ALL USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed: textos canónicos actuales del código (placeholders {{ campo }})
-- ---------------------------------------------------------------------------
INSERT INTO email_templates (key, segment, subject_template, body_template, enabled, mode, send_after_hours) VALUES
('checkout_paid', 'cliente',
 'Pedido confirmado — {{ buyOrder }}',
 'Tu pago fue procesado correctamente.
Orden: {{ buyOrder }}
Total: {{ total }}
Seguimiento: {{ trackingCode }}
Puedes ver el estado en tu perfil de pedidos.',
 true, 'immediate', 0),
('shipment_dispatched', 'cliente',
 'Despacho en camino{{ orderRef }}',
 'Tu pedido salió hacia destino.
Destino: {{ destino }}
Seguimiento: {{ trackingCode }}
Estado: {{ status }}
Revisa el detalle en tu perfil de pedidos.',
 true, 'immediate', 0),
('review_invitation', 'cliente',
 '¿Cómo estuvo tu miel?',
 'Tu pedido llegó y queremos saber cómo lo viviste.

{{ productos }}

Tu opinión verificada alimenta el territorio: reseñas que se pueden rastrear hasta el apiario.
Puedes dejar tu huella desde tu perfil en la tienda.',
 true, 'queue', 48),
('alerta_fitosanitaria', 'territorial',
 'Aviso fitosanitario en {{ sector }}',
 'Se programó una aplicación de {{ producto }}{{ radio }} en {{ sector }}.
Fecha programada: {{ fecha }}.
Mantén tus colmenas resguardadas y confirma recepción desde tu panel territorial.
{{ carencia }}',
 true, 'immediate', 0),
('cart_abandonment', 'cliente',
 'Tu carrito te espera en Enjambre Legado',
 'Notaste algo en la tienda y quedó esperándote.

Cuando quieras, tu carrito sigue ahí. La miel del bosque nativo no se apura; se disfruta.',
 true, 'queue', 0),
('caf_low_folios', 'interno',
 '{{ titulo }}',
 'Empresa: {{ empresaNombre }}
Documento: {{ tipoLabel }} (tipo {{ tipoDte }})
Rango CAF: {{ folioDesde }}–{{ folioHasta }}
Folios restantes: {{ foliosRestantes }}
{{ cuerpo }}
Este aviso es idempotente por lote CAF activo.',
 true, 'queue', 0),
('stock_critico', 'interno',
 '{{ titulo }}',
 '{{ cuerpo }}
Revisa Inventario en Núcleo.',
 true, 'queue', 0)
ON CONFLICT (key) DO NOTHING;