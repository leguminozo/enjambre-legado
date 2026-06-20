import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enqueueSiiDocumentJob, processSiiDocumentJobs } from '../sii-document-jobs';

describe('sii-document-jobs', () => {
  describe('enqueueSiiDocumentJob', () => {
    it('returns ok with id on success', async () => {
      const supabase = {
        from: vi.fn(() => ({
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null }),
        })),
      } as any;

      const result = await enqueueSiiDocumentJob(supabase, {
        empresaId: 'emp-1',
        sourceType: 'gasto_extranjero',
        sourceId: 'gasto-1',
        tipoDte: 46,
        idempotencyKey: 'emit-fc46-fc-1',
        payload: { facturaCompraId: 'fc-1' },
      });

      expect(result).toEqual({ ok: true, id: 'job-1' });
    });

    it('returns error message on failure', async () => {
      const supabase = {
        from: vi.fn(() => ({
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'new row violates row-level security policy' },
          }),
        })),
      } as any;

      const result = await enqueueSiiDocumentJob(supabase, {
        empresaId: 'emp-1',
        sourceType: 'gasto_extranjero',
        sourceId: 'gasto-1',
        tipoDte: 46,
        idempotencyKey: 'emit-fc46-fc-1',
      });

      expect(result).toEqual({
        ok: false,
        error: 'new row violates row-level security policy',
      });
    });
  });

  describe('processSiiDocumentJobs', () => {
    const mockEmit = vi.fn();
    const gastosUpdates: Array<{ id: string; estado: string }> = [];

    beforeEach(() => {
      vi.clearAllMocks();
      gastosUpdates.length = 0;
      mockEmit.mockResolvedValue({
        ok: true,
        trackId: 'track-1',
        estadoSii: 'aceptado',
      });
    });

    function makeSupabase(jobs: Record<string, unknown>[]) {
      return {
        from: vi.fn((table: string) => {
          if (table === 'sii_document_jobs') {
            return {
              select: vi.fn().mockReturnThis(),
              in: vi.fn().mockReturnThis(),
              lte: vi.fn().mockReturnThis(),
              lt: vi.fn().mockReturnThis(),
              order: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({ data: jobs, error: null }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === 'gastos_extranjeros') {
            return {
              update: vi.fn().mockImplementation((payload: { estado: string }) => ({
                eq: vi.fn().mockImplementation((col: string, id: string) => {
                  if (col === 'id') gastosUpdates.push({ id, estado: payload.estado });
                  return Promise.resolve({ error: null });
                }),
              })),
            };
          }
          throw new Error(`unexpected table ${table}`);
        }),
      } as any;
    }

    it('updates gasto estado when emission completes', async () => {
      const supabase = makeSupabase([
        {
          id: 'job-1',
          empresa_id: 'emp-1',
          source_type: 'gasto_extranjero',
          source_id: 'gasto-1',
          attempts: 0,
          payload: { facturaCompraId: 'fc-1' },
        },
      ]);

      const result = await processSiiDocumentJobs(supabase, {
        emitFacturaCompra: mockEmit,
      });

      expect(result.completed).toBe(1);
      expect(gastosUpdates).toEqual([{ id: 'gasto-1', estado: 'aceptado_sii' }]);
    });
  });
});