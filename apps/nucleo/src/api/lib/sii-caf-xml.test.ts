import { describe, expect, it } from 'vitest';
import { parseCafXml } from './sii-caf-xml';
import { isValidChileanRut, normalizeRut } from './sii-crypto';

const SAMPLE = `<?xml version="1.0"?>
<AUTORIZACION>
  <CAF version="1.0">
    <DA>
      <RE>76123456-7</RE>
      <RS>EMPRESA DEMO</RS>
      <TD>39</TD>
      <RNG><D>1</D><H>100</H></RNG>
      <FA>2024-06-01</FA>
      <RSAPK><M>abc</M><E>AQAB</E></RSAPK>
      <IDK>100</IDK>
    </DA>
    <FRMA algoritmo="SHA1withRSA">firmaBase64Ejemplo==</FRMA>
  </CAF>
  <RSASK>-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA
-----END RSA PRIVATE KEY-----</RSASK>
  <RSAPUBK>-----BEGIN PUBLIC KEY-----
MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJB
-----END PUBLIC KEY-----</RSAPUBK>
</AUTORIZACION>`;

describe('parseCafXml', () => {
  it('extracts tipo, range, keys and firma', () => {
    const r = parseCafXml(SAMPLE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.caf.tipo_dte).toBe(39);
    expect(r.caf.folio_desde).toBe(1);
    expect(r.caf.folio_hasta).toBe(100);
    expect(r.caf.fecha_autorizacion).toBe('2024-06-01');
    expect(r.caf.firma_caf).toContain('firmaBase64');
    expect(r.caf.private_key).toContain('PRIVATE KEY');
    expect(r.caf.public_key).toContain('PUBLIC KEY');
    expect(r.caf.rut_emisor).toBe('76123456-7');
  });

  it('rejects incomplete CAF', () => {
    const r = parseCafXml('<CAF><TD>39</TD></CAF>');
    expect(r.ok).toBe(false);
  });
});

describe('chilean RUT', () => {
  it('validates known good RUT', () => {
    expect(isValidChileanRut('11.111.111-1')).toBe(true);
    expect(isValidChileanRut('11111111-1')).toBe(true);
    expect(isValidChileanRut('11.111.111-9')).toBe(false);
    expect(isValidChileanRut('123')).toBe(false);
    expect(normalizeRut('11.111.111-1')).toBe('11111111-1');
  });
});
