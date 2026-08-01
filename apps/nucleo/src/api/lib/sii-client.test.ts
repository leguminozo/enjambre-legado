import { describe, expect, it, vi } from 'vitest';
import { consultarEstadoDteIndividual } from './sii-client';

describe('sii-client - consultarEstadoDteIndividual', () => {
  it('should parse DOK response correctly', async () => {
    const mockResponseText = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
 <soapenv:Body>
  <ns1:getEstDteResponse soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:ns1="https://maullin.sii.cl/DTEWS/QueryEstDte.jws">
   <getEstDteReturn xsi:type="xsd:string">&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;
 &lt;SII:RESPUESTA xmlns:SII=&quot;http://www.sii.cl/XMLSchema&quot;&gt;&lt;SII:RESP_HDR&gt;&lt;ESTADO&gt;DOK&lt;/ESTADO&gt;&lt;GLOSA_ESTADO&gt;DTE Recibido&lt;/GLOSA_ESTADO&gt;&lt;ERR_CODE&gt;0&lt;/ERR_CODE&gt;&lt;GLOSA_ERR&gt;Documento Recibido por el SII. Datos Coinciden con los Registrados&lt;/GLOSA_ERR&gt;&lt;NUM_ATENCION&gt;532&lt;/NUM_ATENCION&gt;&lt;/SII:RESP_HDR&gt;&lt;/SII:RESPUESTA&gt;</getEstDteReturn>
  </ns1:getEstDteResponse>
 </soapenv:Body>
</soapenv:Envelope>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockResponseText)
    } as any);

    const result = await consultarEstadoDteIndividual(
      'CERTIFICACION',
      'dummy-token',
      '76123456-K',
      '77123456-1',
      33,
      100,
      '01012025',
      10000
    );

    expect(result.estado).toBe('DOK');
    expect(result.glosa).toBe('DTE Recibido');
    expect(result.errCode).toBe('0');
    expect(result.glosaErr).toBe('Documento Recibido por el SII. Datos Coinciden con los Registrados');
    expect(result.numAtencion).toBe('532');
  });

  it('should parse DNK response correctly', async () => {
    const mockResponseText = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
 <soapenv:Body>
  <ns1:getEstDteResponse>
   <getEstDteReturn>&lt;SII:RESPUESTA&gt;&lt;SII:RESP_HDR&gt;&lt;ESTADO&gt;DNK&lt;/ESTADO&gt;&lt;GLOSA&gt;DTE Recibido&lt;/GLOSA&gt;&lt;ERR_CODE&gt;1&lt;/ERR_CODE&gt;&lt;GLOSA_ERR&gt;Documento Recibido pero Datos NO Coinciden&lt;/GLOSA_ERR&gt;&lt;NUM_ATENCION&gt;123&lt;/NUM_ATENCION&gt;&lt;/SII:RESP_HDR&gt;&lt;/SII:RESPUESTA&gt;</getEstDteReturn>
  </ns1:getEstDteResponse>
 </soapenv:Body>
</soapenv:Envelope>`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockResponseText)
    } as any);

    const result = await consultarEstadoDteIndividual(
      'CERTIFICACION',
      'dummy-token',
      '76123456-K',
      '77123456-1',
      33,
      100,
      '01012025',
      10000
    );

    expect(result.estado).toBe('DNK');
    expect(result.glosa).toBe('DTE Recibido');
    expect(result.errCode).toBe('1');
    expect(result.glosaErr).toBe('Documento Recibido pero Datos NO Coinciden');
    expect(result.numAtencion).toBe('123');
  });
});
