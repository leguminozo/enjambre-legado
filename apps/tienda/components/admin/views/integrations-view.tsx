'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Cable, ExternalLink, PlayCircle, Save, Send, Upload } from 'lucide-react';

type IntegrationRow = {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  updated_at: string;
  created_at: string;
  /** Indica si hay variables de entorno relevantes definidas en el servidor (sin revelar valores). */
  envSecretsConfigured?: boolean;
};

const defaultsByKey: Record<string, Record<string, unknown>> = {
  boletas: { provider: 'manual', notes: '' },
  bancos: { provider: 'manual', notes: '' },
  sii: { provider: 'manual', notes: '' },
  notificaciones: { provider: 'manual', notes: '' },
};

export function IntegrationsView() {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/integrations', { cache: 'no-store' });
    const json = (await res.json()) as { data?: IntegrationRow[]; error?: string };
    if (!res.ok) {
      setError(json.error || 'Error cargando integraciones');
      setLoading(false);
      return;
    }
    const data = (json.data ?? []).map((r) => ({
      ...r,
      config: r.config && typeof r.config === 'object' ? r.config : {},
    }));
    setRows(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const rowsByKey = useMemo(() => {
    const map = new Map<string, IntegrationRow>();
    rows.forEach((r) => map.set(r.key, r));
    return map;
  }, [rows]);

  const updateLocal = (key: string, patch: Partial<IntegrationRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const save = async (key: string) => {
    const row = rowsByKey.get(key);
    if (!row) return;
    setSavingKey(key);
    setError(null);
    const res = await fetch('/api/admin/integrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        enabled: row.enabled,
        config: row.config,
        name: row.name,
      }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'No se pudo guardar');
      setSavingKey(null);
      return;
    }
    await load();
    setSavingKey(null);
  };

  const uploadSourceFile = async (sourceType: string, file: File) => {
    setActionMsg(null);
    const fd = new FormData();
    fd.append('sourceType', sourceType);
    fd.append('file', file);
    const res = await fetch('/api/admin/sources/upload', {
      method: 'POST',
      body: fd,
    });
    const json = (await res.json()) as { error?: string; inserted?: number };
    if (!res.ok) {
      setError(json.error || 'Error subiendo archivo');
      return;
    }
    setActionMsg(
      `Archivo procesado para ${sourceType}. Registros insertados: ${json.inserted ?? 0}.`,
    );
  };

  const runSiiSync = async () => {
    setActionMsg(null);
    const res = await fetch('/api/admin/sii/sync', { method: 'POST' });
    const json = (await res.json()) as { error?: string; ok?: boolean; mode?: string; message?: string };
    if (!res.ok) {
      setError(json.error || 'No se pudo ejecutar sync SII');
      return;
    }
    setActionMsg(
      json.message ||
        (json.mode === 'stub'
          ? 'Job registrado (stub: sin API real al SII).'
          : 'Sincronización SII completada.'),
    );
  };

  const sendNotificationTest = async () => {
    setActionMsg(null);
    const res = await fetch('/api/admin/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'email' }),
    });
    const json = (await res.json()) as { error?: string; message?: string; mode?: string };
    if (!res.ok) {
      setError(json.error || 'No se pudo enviar notificación de prueba');
      return;
    }
    setActionMsg(
      json.message ||
        (json.mode === 'stub'
          ? 'Evento de prueba guardado (stub: sin envío real).'
          : 'Notificación de prueba registrada.'),
    );
  };

  const ensureDefaults = (key: string) => {
    const row = rowsByKey.get(key);
    if (!row) return;
    const defaults = defaultsByKey[key] ?? {};
    updateLocal(key, { config: { ...defaults, ...row.config } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Cable className="h-8 w-8 text-primary-600 shrink-0 mt-1" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integraciones</h1>
            <p className="text-gray-600">
              Configura los orígenes de información que nutren el ecosistema (boletas, bancos, SII, notificaciones).
            </p>
            <p className="mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <strong>No guardes secretos aquí</strong> (API keys, certificados, tokens). Este formulario solo admite
              datos no sensibles; las credenciales van en variables de entorno del servidor (Vercel / hosting). Consulta{' '}
              <code className="text-xs bg-amber-100 px-1 rounded">docs/VERCEL.md</code> y{' '}
              <code className="text-xs bg-amber-100 px-1 rounded">DEPLOY.md</code> en el repositorio.
            </p>
          </div>
        </div>
        <Link href="/dashboard" className="btn-secondary inline-flex items-center">
          Volver
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      {actionMsg ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{actionMsg}</div>
      ) : null}

      {loading ? (
        <div className="card">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="card">
          No hay integraciones sembradas en DB. Aplica la migración `04_integrations.sql` en Supabase.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {rows.map((row) => (
            <div key={row.key} className="card space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{row.name}</h2>
                  <p className="text-xs text-gray-500 font-mono">{row.key}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) => updateLocal(row.key, { enabled: e.target.checked })}
                  />
                  Habilitada
                </label>
              </div>

              <p className="text-xs text-gray-600">
                Variables de entorno (servidor):{' '}
                <span className="font-medium">
                  {row.envSecretsConfigured ? 'detectadas para esta integración' : 'no detectadas aún'}
                </span>
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Proveedor (no secreto)</label>
                  <input
                    className="input-field"
                    value={String((row.config?.provider as string) ?? '')}
                    onFocus={() => ensureDefaults(row.key)}
                    onChange={(e) =>
                      updateLocal(row.key, { config: { ...row.config, provider: e.target.value } })
                    }
                    placeholder="manual / api / ..."
                  />
                </div>
                <div>
                  <label className="form-label">Endpoint base público (opcional)</label>
                  <input
                    className="input-field"
                    value={String((row.config?.baseUrl as string) ?? '')}
                    onFocus={() => ensureDefaults(row.key)}
                    onChange={(e) =>
                      updateLocal(row.key, { config: { ...row.config, baseUrl: e.target.value } })
                    }
                    placeholder="https://api..."
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">Notas / modo</label>
                  <input
                    className="input-field"
                    value={String((row.config?.notes as string) ?? '')}
                    onFocus={() => ensureDefaults(row.key)}
                    onChange={(e) =>
                      updateLocal(row.key, { config: { ...row.config, notes: e.target.value } })
                    }
                    placeholder="Cómo se alimenta esta fuente, periodicidad, etc."
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-primary inline-flex items-center"
                  disabled={savingKey === row.key}
                  onClick={() => void save(row.key)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingKey === row.key ? 'Guardando…' : 'Guardar'}
                </button>
                <a
                  className="btn-secondary inline-flex items-center"
                  href="https://supabase.com/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Docs
                </a>
                {(row.key === 'boletas' || row.key === 'bancos') && (
                  <label className="btn-secondary inline-flex items-center cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir {row.key} (CSV/PDF/XML)
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.pdf,.xml,text/csv,application/pdf,text/xml,application/xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadSourceFile(row.key, file);
                      }}
                    />
                  </label>
                )}
                {row.key === 'sii' && (
                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <p className="text-xs text-gray-500 max-w-md">
                      Activa &quot;Habilitada&quot; arriba. El botón ejecuta el runner: hoy es{' '}
                      <strong>stub</strong> (registra <code className="text-xs">integration_job_runs</code>, sin
                      llamada real al SII).
                    </p>
                    <button type="button" className="btn-secondary inline-flex items-center w-fit" onClick={() => void runSiiSync()}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Ejecutar sync (stub)
                    </button>
                  </div>
                )}
                {row.key === 'notificaciones' && (
                  <button
                    type="button"
                    className="btn-secondary inline-flex items-center"
                    onClick={() => void sendNotificationTest()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar prueba
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

