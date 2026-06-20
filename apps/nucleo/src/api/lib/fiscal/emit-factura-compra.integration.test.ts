import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/lib/sii-client', () => ({
  signDteXml: vi.fn().mockReturnValue('<signed/>'),
  stampDteXml: vi.fn().mockReturnValue('<stamped/>'),
  enviarDte: vi.fn().mockResolvedValue({
    trackId: 'TRACK-FC46',
    estado: 'EPR',
    glosa: 'OK',
  }),
  getSiiToken: vi.fn().mockResolvedValue({ token: 'sii-token' }),
}));

vi.mock('@/api/lib/sii-credentials', () => ({
  resolveSiiCredentials: vi.fn().mockResolvedValue({
    ok: true,
    credentials: { p12Base64: 'c2VydA==', p12Password: 'pass' },
  }),
  resolveSiiAmbiente: vi.fn().mockReturnValue('CERTIFICACION'),
}));

vi.mock('./caf-guard', () => ({
  assertCafAvailable: vi.fn().mockResolvedValue({ foliosRestantes: 25 }),
}));

import { emitFacturaCompraToSii } from './emit-factura-compra';
import { enviarDte } from '@/api/lib/sii-client';

describe('emitFacturaCompraToSii integration (mock SII)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits pending FC46 and updates facturas_compra', async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'facturas_compra') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'fc-1',
                folio: 42,
                fecha_emision: '2026-06-15',
                receptor_razon_social: 'Meta',
                receptor_giro: 'Ads',
                monto_neto: 0,
                monto_exento: 100000,
                monto_iva: 0,
                monto_total: 100000,
                descripcion: 'Meta Ads',
                estado_sii: 'pendiente',
              },
              error: null,
            }),
            update: vi.fn().mockReturnValue({ eq: updateEq }),
          };
        }
        if (table === 'empresas') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                rut: '76123456-7',
                razon_social: 'OYZ SpA',
                giro: 'Apicultura',
                direccion: 'Chiloé',
                comuna: 'Castro',
                ciudad: 'Castro',
                acteco: 472100,
                sii_ambiente: 'certificacion',
              },
              error: null,
            }),
          };
        }
        if (table === 'sii_caf') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{
                id: 'caf-1',
                folio_desde: 1,
                folio_hasta: 100,
                fecha_autorizacion: '2026-01-01',
                firma_caf: 'firma',
                private_key: 'priv',
                public_key: 'pub',
                nro_resol: 80,
                fch_resol: '2024-01-01',
              }],
            }),
          };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as any;

    const result = await emitFacturaCompraToSii(supabase, 'emp-1', 'fc-1');

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.trackId).toBe('TRACK-FC46');
    expect(result.estadoSii).toBe('enviado');
    expect(enviarDte).toHaveBeenCalledTimes(1);
    expect(updateEq).toHaveBeenCalledWith('id', 'fc-1');
  });
});