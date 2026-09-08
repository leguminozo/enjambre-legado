import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const state = vi.hoisted(() => ({
  credentials: {
    ok: true,
    credentials: {
      p12Base64: 'p12-base64',
      p12Password: 'pass',
      siiClave: 'clave-tributaria',
      source: 'env',
    },
  } as { ok: boolean; code?: string; message?: string; credentials?: unknown },
  token: 'TOKEN-FAKE-123',
  fetchResponse: { ok: true, status: 200, text: '' },
}));

vi.mock('./sii-credentials', () => ({
  resolveSiiCredentials: vi.fn(async () => state.credentials),
}));

vi.mock('./sii-client', () => ({
  getSiiToken: vi.fn(async () => ({ token: state.token, expiresAt: Date.now() + 3600_000 })),
  signNode: vi.fn((xml: string) => xml.replace('</SolicitudDeFolios>', '<Signature>firma</Signature></SolicitudDeFolios>')),
}));

import { requestCaf } from './sii-caf-client';

const CAF_XML_FIXTURE = `<?xml version="1.0"?>
<AUTORIZACION>
  <CAF version="1.0">
    <DA>
      <RE>77777777-7</RE>
      <RS>LA OBRERA Y EL ZANGANO LTDA</RS>
      <TD>39</TD>
      <D>101</D>
      <H>200</H>
      <FA>2026-08-03</FA>
      <RSAPK><M>abc</M><E>10001</E></RSAPK>
      <IDK>0</IDK>
    </DA>
    <FRMA algoritmo="SHA1withRSA"><![CDATA[ZmlybWEtZml4dHVyZQ==]]></FRMA>
    <RSASK><![CDATA[Y2xhdmUtcHJpdmFkYQ==]]></RSASK>
    <RSAPUBK><![CDATA[Y2xhdmUtcHVibGljYQ==]]></RSAPUBK>
  </CAF>
</AUTORIZACION>`;

describe('requestCaf (movimiento 2: solicitud de folios)', () => {
  beforeEach(() => {
    vi.stubEnv('SII_CAF_URL_OVERRIDE', 'https://maullin.sii.cl');
    vi.stubEnv('SII_ENVIRONMENT', 'certificacion');
    state.credentials = {
      ok: true,
      credentials: {
        p12Base64: 'p12-base64',
        p12Password: 'pass',
        siiClave: 'clave-tributaria',
        source: 'env',
      },
    };
    state.fetchResponse = { ok: true, status: 200, text: CAF_XML_FIXTURE };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: state.fetchResponse.ok,
        status: state.fetchResponse.status,
        text: async () => state.fetchResponse.text,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const base = { supabase: {} as never, empresaId: 'emp-1', rutEmpresa: '77777777-7', tipoDte: 39, cantidad: 100 };

  it('flujo feliz: token + XML firmado + POST GetCaf → CAF parseado', async () => {
    const result = await requestCaf(base);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.caf.tipo_dte).toBe(39);
    expect(result.caf.folio_desde).toBe(101);
    expect(result.caf.folio_hasta).toBe(200);
    expect(result.caf.fecha_autorizacion).toBe('2026-08-03');
    expect(result.caf.firma_caf).toBe('ZmlybWEtZml4dHVyZQ==');

    const fetchMock = vi.mocked(fetch);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://maullin.sii.cl/cgi_dte/U.Certifica/GetCaf');
    expect((init.headers as Record<string, string>).Cookie).toContain('TOKEN-FAKE-123');
    const body = (init.body as string) ?? '';
    expect(body).toContain('SolicitudDeFolios');
    expect(body).toContain('archivo=');
    expect(body).toContain(encodeURIComponent('<Signature>firma</Signature>'));
  });

  it('credenciales faltantes → error sin llamar al SII', async () => {
    state.credentials = { ok: false, code: 'no_certificado', message: 'Sube un certificado P12 activo' };
    const result = await requestCaf(base);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('no_certificado');
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('HTTP error del SII → http_error', async () => {
    state.fetchResponse = { ok: false, status: 500, text: 'error' };
    const result = await requestCaf(base);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('http_error');
  });

  it('respuesta sin CAF válido → caf_parse_error', async () => {
    state.fetchResponse = { ok: true, status: 200, text: '<html>Página de error</html>' };
    const result = await requestCaf(base);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('caf_parse_error');
  });

  it('formatea el RUT sin puntos en la solicitud (formato SII)', async () => {
    const result = await requestCaf({ ...base, rutEmpresa: '77.777.777-7' });
    expect(result.ok).toBe(true);
    const fetchMock = vi.mocked(fetch);
    const body = decodeURIComponent((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body as string);
    expect(body).toContain('<RutSolicitante>77777777-7</RutSolicitante>');
    expect(body).toContain('<RutEmpresa>77777777-7</RutEmpresa>');
  });
});
