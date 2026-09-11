import { formatCLP } from '@enjambre/ui';
import { buildClaimUrl, getTiendaOrigin } from './public-urls';

export interface PosReceiptItem {
  nombre: string;
  cantidad: number;
  precio_unitario?: number;
}

export interface PosReceiptData {
  clienteNombre?: string | null;
  total: number;
  lines: PosReceiptItem[];
  claimToken?: string | null;
  customTemplate?: string | null;
}

export const DEFAULT_WHATSAPP_RECEIPT_TEMPLATE = `✦ ENJAMBRE LEGADO · CHILOÉ
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
{{link_pasaporte}}`;

/**
 * Genera el texto formateado para el comprobante de WhatsApp.
 * Si se proporciona customTemplate (desde Núcleo), lo usa reemplazando las variables.
 */
export function generateWhatsAppReceiptText(data: PosReceiptData): string {
  const template = data.customTemplate?.trim() || DEFAULT_WHATSAPP_RECEIPT_TEMPLATE;
  const nombre = data.clienteNombre?.trim() || 'Cliente';

  const productosDetalle = data.lines
    .map((l) => `• ${l.cantidad}x ${l.nombre}`)
    .join('\n');

  const claimUrl = data.claimToken ? buildClaimUrl(data.claimToken) : getTiendaOrigin();
  const montoTotal = formatCLP(data.total);

  return template
    .replace(/\{\{\s*nombre_cliente\s*\}\}/g, nombre)
    .replace(/\{\{\s*productos_detalle\s*\}\}/g, productosDetalle)
    .replace(/\{\{\s*monto_total\s*\}\}/g, montoTotal)
    .replace(/\{\{\s*link_pasaporte\s*\}\}/g, claimUrl);
}

/**
 * Genera el enlace wa.me para abrir el chat de WhatsApp.
 * Si el teléfono del cliente está presente, abre directamente su chat personal.
 */
export function buildWhatsAppShareUrl(text: string, phone?: string | null): string {
  const cleanPhone = phone?.replace(/\D/g, '') || '';
  const encoded = encodeURIComponent(text);

  if (cleanPhone.length >= 8) {
    // Si es teléfono móvil chileno sin código de país (ej. 912345678), anteponer 56
    const fullPhone =
      cleanPhone.length === 9 && cleanPhone.startsWith('9') ? `56${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${encoded}`;
  }

  return `https://wa.me/?text=${encoded}`;
}
