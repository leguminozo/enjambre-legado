import { describe, it, expect } from 'vitest';
import { cleanQrSvgString } from './qr-export';

describe('cleanQrSvgString', () => {
  it('elimina el path de fondo blanco y normaliza dimensiones a 1200x1200', () => {
    const rawSvg =
      '<svg height="130" width="130" viewBox="0 0 29 29" role="img">' +
      '<path fill="#FFFFFF" d="M0,0 h29v29H0z" shape-rendering="crispEdges"></path>' +
      '<path fill="#1C1917" d="M0,0 h7v1H0zM8,0 h1v1H8z" shape-rendering="crispEdges"></path>' +
      '</svg>';

    const cleaned = cleanQrSvgString(rawSvg, 1200);

    // Fondo blanco eliminado
    expect(cleaned).not.toContain('fill="#FFFFFF"');
    expect(cleaned).not.toContain('d="M0,0 h29v29H0z"');

    // Módulos intactos
    expect(cleaned).toContain('fill="#1C1917"');
    expect(cleaned).toContain('d="M0,0 h7v1H0zM8,0 h1v1H8z"');

    // Dimensiones y namespace
    expect(cleaned).toContain('width="1200"');
    expect(cleaned).toContain('height="1200"');
    expect(cleaned).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('elimina el path de fondo transparente generado por qrcode.react', () => {
    const rawSvg =
      '<svg height="130" width="130" viewBox="0 0 29 29" role="img">' +
      '<path fill="transparent" d="M0,0 h29v29H0z" shape-rendering="crispEdges"></path>' +
      '<path fill="#1C1917" d="M0,0 h7v1H0zM8,0 h1v1H8z" shape-rendering="crispEdges"></path>' +
      '</svg>';

    const cleaned = cleanQrSvgString(rawSvg, 1200);

    expect(cleaned).not.toContain('fill="transparent"');
    expect(cleaned).not.toContain('d="M0,0 h29v29H0z"');
    expect(cleaned).toContain('fill="#1C1917"');
  });

  it('soporta tamaños personalizados', () => {
    const rawSvg = '<svg viewBox="0 0 21 21"><path fill="#000" d="M0,0 h1v1H0z"></path></svg>';
    const cleaned = cleanQrSvgString(rawSvg, 2400);

    expect(cleaned).toContain('width="2400"');
    expect(cleaned).toContain('height="2400"');
  });
});
