'use client';

import { useEffect, useState } from 'react';
import { Mail, Send, RotateCw } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast } from '@enjambre/ui';

type EmailTemplate = {
  key: string;
  segment: string;
  subject_template: string;
  body_template: string;
  enabled: boolean;
  mode: 'immediate' | 'queue';
  send_after_hours: number;
  updated_at: string;
};

type EmailLogEntry = {
  id: string;
  channel: string;
  recipient: string;
  subject: string | null;
  status: string;
  created_at: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  cliente: 'Cliente (tienda)',
  b2b: 'B2B / mayorista',
  interno: 'Operativo interno',
  territorial: 'Registro Territorial',
  sistema: 'Sistema',
};

const SEGMENT_ORDER = ['cliente', 'b2b', 'interno', 'territorial', 'sistema'];

const fieldClass =
  'w-full rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors';

export function CorreosView() {
  const apiFetch = useApiFetch();
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [log, setLog] = useState<EmailLogEntry[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [tplRes, logRes] = await Promise.all([
        apiFetch('/api/admin-email-templates'),
        apiFetch('/api/admin-email-templates/log'),
      ]);
      if (tplRes.ok) {
        const json = (await tplRes.json()) as { data?: EmailTemplate[] };
        setTemplates(json.data ?? []);
      }
      if (logRes.ok) {
        const json = (await logRes.json()) as { data?: EmailLogEntry[] };
        setLog(json.data ?? []);
      }
    })().catch(() => toast.error('No se pudo cargar el Centro de Correos'));
  }, [apiFetch]);

  function patchTemplate(key: string, patch: Partial<EmailTemplate>) {
    setTemplates((prev) =>
      prev ? prev.map((t) => (t.key === key ? { ...t, ...patch } : t)) : prev,
    );
  }

  async function save(key: string) {
    const tpl = templates?.find((t) => t.key === key);
    if (!tpl) return;
    setSavingKey(key);
    try {
      const res = await apiFetch(`/api/admin-email-templates/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subject_template: tpl.subject_template,
          body_template: tpl.body_template,
          enabled: tpl.enabled,
          mode: tpl.mode,
          send_after_hours: tpl.send_after_hours,
        }),
      });
      if (!res.ok) throw new Error('Error guardando');
      toast.success('Plantilla guardada');
    } catch {
      toast.error('No se pudo guardar la plantilla');
    } finally {
      setSavingKey(null);
    }
  }

  async function sendTest(key: string) {
    const to = window.prompt('Correo de prueba:');
    if (!to) return;
    setTestingKey(key);
    try {
      const res = await apiFetch(`/api/admin-email-templates/${key}/test`, {
        method: 'POST',
        body: JSON.stringify({ to }),
      });
      if (!res.ok) throw new Error('Error de envío');
      toast.success('Correo de prueba enviado');
    } catch {
      toast.error('No se pudo enviar la prueba');
    } finally {
      setTestingKey(null);
    }
  }

  const grouped = SEGMENT_ORDER.map((seg) => ({
    segment: seg,
    items: (templates ?? []).filter((t) => t.segment === seg),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Centro de Correos"
        title="Correos"
        subtitle="Plantillas transaccionales editables: cliente, territorial e interno"
        icon={<Mail size={20} />}
      />

      {!templates && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Cargando plantillas…
        </p>
      )}

      {grouped.map(({ segment, items }) => (
        <section key={segment} className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            {SEGMENT_LABELS[segment] ?? segment}
          </h3>
          {items.map((tpl) => (
            <div
              key={tpl.key}
              className="rounded-xl border border-border/70 bg-surface-sunken/50 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <code className="text-xs text-muted-foreground font-mono">{tpl.key}</code>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tpl.enabled}
                      onChange={(e) => patchTemplate(tpl.key, { enabled: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                    />
                    Habilitado
                  </label>
                  <select
                    value={tpl.mode}
                    onChange={(e) => patchTemplate(tpl.key, { mode: e.target.value as 'immediate' | 'queue' })}
                    className={`${fieldClass} w-auto py-1.5 text-xs`}
                    aria-label="Modo de envío"
                  >
                    <option value="immediate">Inmediato</option>
                    <option value="queue">Cola (diferido)</option>
                  </select>
                  {tpl.mode === 'queue' && (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Esperar</span>
                      <input
                        type="number"
                        min={0}
                        max={720}
                        value={tpl.send_after_hours}
                        onChange={(e) =>
                          patchTemplate(tpl.key, { send_after_hours: Math.max(0, Number(e.target.value) || 0) })
                        }
                        className={`${fieldClass} w-20 py-1.5 text-xs`}
                      />
                      <span>h</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">
                    Asunto
                  </span>
                  <input
                    value={tpl.subject_template}
                    onChange={(e) => patchTemplate(tpl.key, { subject_template: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">
                    Cuerpo (placeholders: {'{{ campo }}'})
                  </span>
                  <textarea
                    value={tpl.body_template}
                    onChange={(e) => patchTemplate(tpl.key, { body_template: e.target.value })}
                    rows={5}
                    className={`${fieldClass} font-mono text-xs leading-relaxed`}
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => save(tpl.key)}
                  disabled={savingKey === tpl.key}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60"
                >
                  {savingKey === tpl.key ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => sendTest(tpl.key)}
                  disabled={testingKey === tpl.key}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-4 text-xs font-medium text-foreground hover:bg-surface-raised disabled:opacity-60"
                >
                  {testingKey === tpl.key ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Enviar prueba
                </button>
              </div>
            </div>
          ))}
        </section>
      ))}

      <section className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
          Historial de envíos (últimos 50)
        </h3>
        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin envíos registrados todavía.</p>
        ) : (
          <div className="rounded-xl border border-border/70 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-sunken/70">
                <tr className="text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Fecha</th>
                  <th className="px-4 py-2.5 font-medium">Asunto</th>
                  <th className="px-4 py-2.5 font-medium">Destinatario</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {log.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5 max-w-[240px] truncate">{entry.subject ?? '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{entry.recipient}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                          entry.status === 'sent'
                            ? 'bg-primary/10 text-primary'
                            : entry.status === 'error'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-surface-sunken text-muted-foreground'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}