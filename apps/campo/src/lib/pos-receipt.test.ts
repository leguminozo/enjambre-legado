import { describe, expect, it } from 'vitest';
import {
  generateWhatsAppReceiptText,
  buildWhatsAppShareUrl,
  DEFAULT_WHATSAPP_RECEIPT_TEMPLATE,
} from './pos-receipt';

describe('pos-receipt', () => {
  it('genera texto por defecto con variables reemplazadas', () => {
    const text = generateWhatsAppReceiptText({
      clienteNombre: 'Valentina',
      total: 35000,
      lines: [
        { nombre: 'Miel de Ulmo Virgen (500g)', cantidad: 2 },
        { nombre: 'Miel de Tiaca (300g)', cantidad: 1 },
      ],
      claimToken: 'abc-123',
    });

    expect(text).toContain('Estimado/a Valentina:');
    expect(text).toContain('• 2x Miel de Ulmo Virgen (500g)');
    expect(text).toContain('• 1x Miel de Tiaca (300g)');
    expect(text).toContain('Predio Pureo, Archipiélago de Chiloé');
    expect(text).not.toContain('cosecha');
    expect(text).not.toContain('CO2');
    expect(text).toContain('/claim/abc-123');
  });

  it('soporta plantilla personalizada desde Núcleo', () => {
    const custom = 'Hola {{nombre_cliente}}! Compraste: {{productos_detalle}}. Link: {{link_pasaporte}}';
    const text = generateWhatsAppReceiptText({
      clienteNombre: 'Rodrigo',
      total: 15000,
      lines: [{ nombre: 'Miel de Ulmo', cantidad: 1 }],
      customTemplate: custom,
    });

    expect(text).toBe('Hola Rodrigo! Compraste: • 1x Miel de Ulmo. Link: https://obrerayzangano.cl');
  });

  it('formatea url de wa.me con número chileno 9 dígitos anteponiendo 56', () => {
    const url = buildWhatsAppShareUrl('Hola', '987654321');
    expect(url).toBe('https://wa.me/56987654321?text=Hola');
  });

  it('formatea url de wa.me con número ya formateado con código 569', () => {
    const url = buildWhatsAppShareUrl('Hola', '+56 9 8765 4321');
    expect(url).toBe('https://wa.me/56987654321?text=Hola');
  });

  it('genera url general si no hay número de teléfono válido', () => {
    const url = buildWhatsAppShareUrl('Hola', null);
    expect(url).toBe('https://wa.me/?text=Hola');

    const urlShort = buildWhatsAppShareUrl('Hola', '123');
    expect(urlShort).toBe('https://wa.me/?text=Hola');
  });
});
