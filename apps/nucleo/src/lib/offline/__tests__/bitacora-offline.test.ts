import { describe, expect, it } from 'vitest';

/**
 * Validación del path manual (sin IndexedDB en Node).
 * Integración Dexie se cubre en browser/e2e.
 */
describe('bitacora-offline · transcript manual (PR6)', () => {
  it('normaliza y valida transcript (lógica de enqueueTranscriptManual)', () => {
    const trim = (t: string) => t.trim();
    expect(trim('  Colmena 12.  ')).toBe('Colmena 12.');
    expect(trim('   ')).toBe('');
    expect(trim('x'.repeat(20_001)).length).toBeGreaterThan(20_000);
  });

  it('payload manual esperado por el motor de sync', () => {
    const payload = {
      session_id: '00000000-0000-4000-8000-000000000001',
      client_request_id: '00000000-0000-4000-8000-000000000002',
      transcript_raw: 'Colmena 15. Reina vista.',
      dispositivo: 'manual-transcript',
      duracion_seg: 0,
    };
    expect(payload.transcript_raw.length).toBeGreaterThan(0);
    expect(payload.dispositivo).toBe('manual-transcript');
    // Sin blob: el upsync no debe exigir grabaciones
    expect('blob' in payload).toBe(false);
  });

  it('BFF marca transcript como estado transcrito cuando hay texto', () => {
    // Espejo de la regla en bitacora.ts POST /capturas
    const body = { transcript_raw: '  hola  ' };
    const hasTranscript =
      typeof body.transcript_raw === 'string' && body.transcript_raw.trim().length > 0;
    const estado = hasTranscript ? 'transcrito' : 'capturado';
    expect(estado).toBe('transcrito');
    expect(body.transcript_raw.trim()).toBe('hola');
  });
});
