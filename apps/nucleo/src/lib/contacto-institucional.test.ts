import { describe, expect, it } from 'vitest';
import {
  CONTACTO_INSTITUCIONAL,
  mailtoPresentacionUrl,
  whatsappPresentacionUrl,
} from './contacto-institucional';

describe('contacto institucional', () => {
  it('usa el correo y WhatsApp reales de la marca', () => {
    expect(CONTACTO_INSTITUCIONAL.email).toBe('obrerayzangano@gmail.com');
    expect(CONTACTO_INSTITUCIONAL.whatsappE164).toBe('56940831358');
    expect(whatsappPresentacionUrl()).toContain('wa.me/56940831358');
    expect(mailtoPresentacionUrl()).toContain('obrerayzangano@gmail.com');
  });
});
