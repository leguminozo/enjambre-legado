import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONTACT_SETTINGS,
  parseContactSettings,
} from './store-chrome';

describe('parseContactSettings', () => {
  it('devuelve defaults completos ante null o undefined', () => {
    expect(parseContactSettings(null)).toEqual(DEFAULT_CONTACT_SETTINGS);
    expect(parseContactSettings(undefined)).toEqual(DEFAULT_CONTACT_SETTINGS);
    expect(parseContactSettings({})).toEqual(DEFAULT_CONTACT_SETTINGS);
  });

  it('conserva valores de contacto y normaliza whatsapp e164', () => {
    const parsed = parseContactSettings({
      show_whatsapp_float: false,
      whatsapp_e164: '+56 9 1234 5678',
      whatsapp_prefill: 'Mensaje de prueba',
      whatsapp_prefill_en: 'Test message',
      email: 'info@bosque.cl',
      phone_display: '+56 9 1234 5678',
      address: 'Camino Costero 123',
      address_en: '123 Coastal Road',
      hours: 'Lun-Vie 9-17',
      hours_en: 'Mon-Fri 9-17',
      text_align: 'center',
    });

    expect(parsed.show_whatsapp_float).toBe(false);
    expect(parsed.whatsapp_e164).toBe('56912345678');
    expect(parsed.whatsapp_prefill).toBe('Mensaje de prueba');
    expect(parsed.whatsapp_prefill_en).toBe('Test message');
    expect(parsed.email).toBe('info@bosque.cl');
    expect(parsed.phone_display).toBe('+56 9 1234 5678');
    expect(parsed.address).toBe('Camino Costero 123');
    expect(parsed.address_en).toBe('123 Coastal Road');
    expect(parsed.hours).toBe('Lun-Vie 9-17');
    expect(parsed.hours_en).toBe('Mon-Fri 9-17');
    expect(parsed.text_align).toBe('center');
  });

  it('soporta campos del enclave territorial y mapa interactivo', () => {
    const parsed = parseContactSettings({
      show_map: false,
      map_eyebrow: 'Territorio Austral',
      map_eyebrow_en: 'Southern Territory',
      map_title: 'Apiario del Archipiélago',
      map_title_en: 'Archipelago Apiary',
      map_description: 'Bosque profundo y canal.',
      map_description_en: 'Deep forest and channel.',
      map_badge_label: 'Queilén Costero',
      map_badge_coords: '42°51\'S 73°40\'W',
      map_lat: -42.85,
      map_lng: -73.68,
      map_zoom: 16,
      map_popup_tag: 'Pabellón Apícola',
      map_popup_title: 'Santuario Pureo',
      map_popup_subtitle: 'Queilén Austral',
      directions_url: 'https://maps.google.com/?q=custom',
    });

    expect(parsed.show_map).toBe(false);
    expect(parsed.map_eyebrow).toBe('Territorio Austral');
    expect(parsed.map_eyebrow_en).toBe('Southern Territory');
    expect(parsed.map_title).toBe('Apiario del Archipiélago');
    expect(parsed.map_title_en).toBe('Archipelago Apiary');
    expect(parsed.map_description).toBe('Bosque profundo y canal.');
    expect(parsed.map_description_en).toBe('Deep forest and channel.');
    expect(parsed.map_badge_label).toBe('Queilén Costero');
    expect(parsed.map_badge_coords).toBe('42°51\'S 73°40\'W');
    expect(parsed.map_lat).toBe(-42.85);
    expect(parsed.map_lng).toBe(-73.68);
    expect(parsed.map_zoom).toBe(16);
    expect(parsed.map_popup_tag).toBe('Pabellón Apícola');
    expect(parsed.map_popup_title).toBe('Santuario Pureo');
    expect(parsed.map_popup_subtitle).toBe('Queilén Austral');
    expect(parsed.directions_url).toBe('https://maps.google.com/?q=custom');
  });

  it('aplica límites (clamp) para coordenadas y zoom fuera de rango', () => {
    const parsed = parseContactSettings({
      map_lat: 100, // fuera de [-90, 90]
      map_lng: -200, // fuera de [-180, 180]
      map_zoom: 30, // fuera de [3, 20]
    });

    expect(parsed.map_lat).toBe(90);
    expect(parsed.map_lng).toBe(-180);
    expect(parsed.map_zoom).toBe(20);
  });
});
