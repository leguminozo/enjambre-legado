import { describe, it, expect } from 'vitest';
import { parseReceiptOrchestrated } from '../domain/receipt-orchestrator';
import { PARSE_AUTO_EMIT_THRESHOLD } from '../domain/parse-confidence';

const META_FIXTURE = `Meta Ads Billing Statement
Meta for Business
Invoice # INV-META-2026-001
Ad account ID: 9876543210
Billing period: June 2026
Total: USD 150.00
June 15, 2026`;

const UBER_FIXTURE = `Uber Business
Trip ABC-12345
Date: 15/06/2026
From: Centro Castro
To: Aeropuerto Mocopulli
Total $8.900
Payment: Corporate account`;

describe('parseReceiptOrchestrated fixtures', () => {
  it('parses Meta Ads invoice fixture with high confidence', () => {
    const text = META_FIXTURE;
    const parsed = parseReceiptOrchestrated(text, { tasaCambio: 950 });
    expect(parsed).not.toBeNull();
    expect(parsed!.gasto.proveedorId).toBe('meta-ads');
    expect(parsed!.gasto.montoOriginal).toBe(150);
    expect(parsed!.confidence.score).toBeGreaterThanOrEqual(PARSE_AUTO_EMIT_THRESHOLD);
  });

  it('parses Uber Business trip fixture', () => {
    const text = UBER_FIXTURE;
    const parsed = parseReceiptOrchestrated(text, { tasaCambio: 1 });
    expect(parsed).not.toBeNull();
    expect(parsed!.gasto.proveedorId).toBe('uber');
    expect(parsed!.gasto.montoTotal).toBeGreaterThan(0);
  });

  it('uses generic parser when proveedor override is set', () => {
    const text = 'Custom SaaS Invoice XYZ-99 Total USD 29.99 January 10, 2026';
    const parsed = parseReceiptOrchestrated(text, {
      tasaCambio: 900,
      proveedorOverride: {
        id: 'custom-saas',
        nombre: 'CUSTOM SAAS INC',
        rut: '55555555-5',
        giro: 'SOFTWARE',
        moneda: 'USD',
        conIva: false,
        keywords: ['custom saas'],
      },
    });
    expect(parsed).not.toBeNull();
    expect(parsed!.confidence.parserId).toBe('generic');
    expect(parsed!.gasto.montoOriginal).toBeCloseTo(29.99, 2);
  });
});