import { describe, expect, it } from 'vitest';

import {
  parseSpanishNumber,
  parseVoiceTranscription,
} from './voice-parse';

describe('parseSpanishNumber', () => {
  it('convierte dígitos y palabras hasta 50', () => {
    expect(parseSpanishNumber('4')).toBe(4);
    expect(parseSpanishNumber('cinco')).toBe(5);
    expect(parseSpanishNumber('veinte')).toBe(20);
    expect(parseSpanishNumber('treinta y cinco')).toBe(35);
    expect(parseSpanishNumber('cincuenta')).toBe(50);
  });

  it('devuelve null ante texto no numérico', () => {
    expect(parseSpanishNumber('abeja')).toBeNull();
  });
});

describe('parseVoiceTranscription', () => {
  it('detecta colmena con número alto + campos del ejemplo canónico', () => {
    const parsed = parseVoiceTranscription(
      'Colmena 24. Población alta, reina vista, 5 marcos de cría y 4 de miel. Sin varroa.',
    );
    expect(parsed.colmenaQuery).toBe('24');
    expect(parsed.poblacion).toBe('Alta');
    expect(parsed.reinaVista).toBe(true);
    expect(parsed.varroa).toBe('0');
    expect(parsed.notasCompletas).toContain('Colmena 24');
  });

  it('parsea cuadros con cría operculada y fase', () => {
    const parsed = parseVoiceTranscription(
      'Colmena 3, cuatro cuadros con cría cerrada y dos con miel, en temporada.',
    );
    expect(parsed.colmenaQuery).toBe('3');
    expect(parsed.marcosCria).toBe(4);
    expect(parsed.marcosMiel).toBe(2);
    expect(parsed.fase).toBe('temporada');
    expect(parsed.cuadros?.length).toBe(6);
  });

  it('detecta reina no vista y varroa con nivel', () => {
    const parsed = parseVoiceTranscription('La 15, reina no vista, varroa media.');
    expect(parsed.reinaVista).toBe(false);
    expect(parsed.varroa).toBe('media');
  });

  it('parsea dictado de terreno con marcos y cuadro singular sin número', () => {
    const parsed = parseVoiceTranscription('cinco Marcos de cría y cuadro de miel');
    expect(parsed.marcosCria).toBe(5);
    expect(parsed.marcosMiel).toBe(1);
  });
});
