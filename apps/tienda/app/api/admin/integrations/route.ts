import {
  findForbiddenConfigKeys,
  redactIntegrationConfig,
} from '@/lib/integration-config-security';
import { getSecretsPresenceForIntegrationKey } from '@/lib/integrations-env';
import { requireAdmin } from '@/lib/require-admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type IntegrationRow = {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updated_at: string;
  created_at: string;
  envSecretsConfigured: boolean;
};

function toPublicRow(row: {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  config: unknown;
  updated_at: string;
  created_at: string;
}): IntegrationRow {
  const cfg =
    row.config && typeof row.config === 'object' && !Array.isArray(row.config)
      ? (row.config as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    enabled: row.enabled,
    config: redactIntegrationConfig(cfg),
    updated_at: row.updated_at,
    created_at: row.created_at,
    envSecretsConfigured: getSecretsPresenceForIntegrationKey(row.key),
  };
}

const IntegrationPatchSchema = z.object({
  key: z.string().min(1).max(100),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  name: z.string().min(1).max(200).optional(),
});

export async function GET() {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const { data, error } = await supabase
    .from('integrations')
    .select('id, key, name, enabled, config, updated_at, created_at')
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((r) => toPublicRow(r));
  return NextResponse.json({ data: rows });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const raw = await req.json();
  const parsed = IntegrationPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const body = parsed.data;

  if (body.config !== undefined) {
    const forbidden = findForbiddenConfigKeys(body.config);
    if (forbidden.length > 0) {
      return NextResponse.json(
        {
          error:
            'No se permiten secretos en config (usa variables de entorno en el servidor). Claves rechazadas: ' +
            forbidden.join(', '),
        },
        { status: 400 },
      );
    }
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.enabled !== undefined) patch.enabled = body.enabled;
  if (body.config !== undefined) patch.config = body.config;
  if (body.name !== undefined) patch.name = body.name;

  const { data, error } = await supabase
    .from('integrations')
    .update(patch)
    .eq('key', body.key)
    .select('id, key, name, enabled, config, updated_at, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: toPublicRow(data) });
}
