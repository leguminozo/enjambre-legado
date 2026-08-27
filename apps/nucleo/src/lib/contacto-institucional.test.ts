import { describe, expect, it } from 'vitest';
import {
  CONTACTO_INSTITUCIONAL,
  lineaProveedor,
  mailtoPresentacionUrl,
  notaDistincionProductiva,
  whatsappPresentacionUrl,
} from './contacto-institucional';

describe('contacto institucional', () => {
  it('identifica a Trama SpA como operador B2G, no a la EIRL de miel', () => {
    expect(CONTACTO_INSTITUCIONAL.proveedor).toBe('Trama SpA');
    expect(CONTACTO_INSTITUCIONAL.rut).toBe('78.500.141-9');
    expect(CONTACTO_INSTITUCIONAL.chileProveedores).toBe('en-tramite');
    expect(CONTACTO_INSTITUCIONAL.inicioActividadesSii).toBe('en-tramite');
    expect(lineaProveedor()).toBe('Trama SpA · RUT 78.500.141-9');
    expect(CONTACTO_INSTITUCIONAL.proveedor).not.toMatch(/Obrera|Zángano/i);
  });

  it('conserva el buzón y WhatsApp operativos', () => {
    expect(CONTACTO_INSTITUCIONAL.email).toBe('obrerayzangano@gmail.com');
    expect(CONTACTO_INSTITUCIONAL.whatsappE164).toBe('56940831358');
    expect(whatsappPresentacionUrl()).toContain('wa.me/56940831358');
    expect(whatsappPresentacionUrl()).toContain('90');
    expect(mailtoPresentacionUrl()).toContain('obrerayzangano@gmail.com');
    expect(mailtoPresentacionUrl()).toContain(encodeURIComponent('Piloto 90 días'));
  });

  it('la nota de distinción nombra a Trama y no presenta la EIRL como proveedor municipal', () => {
    const nota = notaDistincionProductiva();
    expect(nota).toContain('Trama SpA');
    expect(nota).toMatch(/EIRL/);
    expect(nota).toMatch(/distinta/);
  });
});
