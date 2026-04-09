import type { SupabaseClient } from '@supabase/supabase-js';
import type { IntegrationsEnv } from '@/lib/integrations-env';

export type IntegrationSyncMode = 'stub' | 'live';

export type SiiSyncContext = {
  supabase: SupabaseClient;
  userId: string;
  integrationConfig: Record<string, unknown>;
  env: IntegrationsEnv;
};

export type SiiSyncOutcome = {
  mode: IntegrationSyncMode;
  stats: Record<string, unknown>;
  detail: string;
};

export type SiiConnector = {
  id: string;
  sync(ctx: SiiSyncContext): Promise<SiiSyncOutcome>;
};

export type RunSiiSyncJobResult =
  | {
      ok: true;
      mode: IntegrationSyncMode;
      jobRun: Record<string, unknown>;
      httpStatus: 200 | 202;
    }
  | { ok: false; error: 'disabled' | 'not_found' | 'db'; message: string };
