import type { SiiConnector, SiiSyncContext, SiiSyncOutcome } from './types';
import { liveSiiConnector, certSiiConnector } from './sii-connector';

/** Conector por defecto: no llama APIs externas; solo deja traza en integration_job_runs. */
const stubSiiConnector: SiiConnector = {
  id: 'stub',
  async sync(_ctx: SiiSyncContext): Promise<SiiSyncOutcome> {
    return {
      mode: 'stub',
      stats: { recordsImported: 0, externalCalls: 0 },
      detail:
        'Conector stub: no se invocó el SII ni terceros. Implementa un conector real y asigna credenciales en variables de entorno.',
    };
  },
};

/**
 * Resuelve implementación según `provider` en integrations.config (no secreto).
 * - 'live' o 'api': Conector real para producción
 * - 'cert': Conector para ambiente de certificación SII
 * - 'manual' o default: Conector stub
 */
export function resolveSiiConnector(provider: string | undefined): SiiConnector {
  const p = (provider ?? 'manual').trim().toLowerCase();
  if (p === 'live' || p === 'api') {
    return liveSiiConnector;
  }
  if (p === 'cert') {
    return certSiiConnector;
  }
  return stubSiiConnector;
}
