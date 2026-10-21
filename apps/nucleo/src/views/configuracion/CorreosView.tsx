'use client';

import { useEffect, useState } from 'react';
import { Mail, Send, RotateCw, PenSquare, Eye, Loader2, Radio } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, Button, ImmersiveModal } from '@enjambre/ui';

type EmailTemplate = {
  key: string;
  locale: string;
  segment: string;
  subject_template: string;
  body_template: string;
  enabled: boolean;
  mode: 'immediate' | 'queue';
  send_after_hours: number;
  updated_at: string;
};

const LOCALE_LABELS: Record<string, string> = { es: 'ES', en: 'EN', pt: 'PT' };

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

export type CorreosViewProps = Record<string, never>;

export function CorreosView(_props: CorreosViewProps = {}) {
  const apiFetch = useApiFetch();
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [log, setLog] = useState<EmailLogEntry[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testModalTarget, setTestModalTarget] = useState<{ key: string; locale: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');

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

  function rowId(tpl: Pick<EmailTemplate, 'key' | 'locale'>) {
    return `${tpl.key}:${tpl.locale}`;
  }

  function patchTemplate(key: string, locale: string, patch: Partial<EmailTemplate>) {
    setTemplates((prev) =>
      prev ? prev.map((t) => (t.key === key && t.locale === locale ? { ...t, ...patch } : t)) : prev,
    );
  }

  async function save(key: string, locale: string) {
    const tpl = templates?.find((t) => t.key === key && t.locale === locale);
    if (!tpl) return;
    setSavingKey(rowId(tpl));
    try {
      const res = await apiFetch(`/api/admin-email-templates/${key}?locale=${locale}`, {
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

  async function createVariant(key: string, locale: 'en' | 'pt') {
    const base = templates?.find((t) => t.key === key && t.locale === 'es');
    if (!base) return;
    setSavingKey(`${key}:${locale}`);
    try {
      const res = await apiFetch(`/api/admin-email-templates/${key}?locale=${locale}`, {
        method: 'PATCH',
        body: JSON.stringify({
          subject_template: base.subject_template,
          body_template: base.body_template,
          enabled: false,
          mode: base.mode,
          send_after_hours: base.send_after_hours,
        }),
      });
      if (!res.ok) throw new Error('Error creando variante');
      const json = (await res.json()) as { data?: EmailTemplate };
      if (json.data) {
        setTemplates((prev) => (prev ? [...prev, json.data as EmailTemplate] : [json.data as EmailTemplate]));
      }
      toast.success(`Variante ${LOCALE_LABELS[locale]} creada (revisa su texto)`);
    } catch {
      toast.error('No se pudo crear la variante');
    } finally {
      setSavingKey(null);
    }
  }

  function sendTest(key: string, locale: string) {
    setTestModalTarget({ key, locale });
    setTestEmail('');
  }

  async function handleConfirmSendTest(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!testModalTarget || !testEmail || !testEmail.includes('@')) {
      toast.error('Ingresa una dirección de correo válida');
      return;
    }
    const { key, locale } = testModalTarget;
    setTestingKey(rowId({ key, locale }));
    try {
      const res = await apiFetch(`/api/admin-email-templates/${key}/test?locale=${locale}`, {
        method: 'POST',
        body: JSON.stringify({ to: testEmail }),
      });
      if (!res.ok) throw new Error('Error de envío');
      toast.success('Correo de prueba enviado');
      setTestModalTarget(null);
    } catch {
      toast.error('No se pudo enviar la prueba');
    } finally {
      setTestingKey(null);
    }
  }

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSending, setComposerSending] = useState(false);
  const [composerTab, setComposerTab] = useState<'edit' | 'preview'>('edit');
  const [composerData, setComposerData] = useState({
    recipient: '',
    mode: 'individual' as 'individual' | 'segmento',
    segment: 'cliente' as 'cliente' | 'territorial' | 'creador' | 'rep_ventas' | 'todos',
    subject: '',
    body: '',
    context: 'tienda' as 'tienda' | 'pedidos' | 'territorio' | 'sistema',
    sendPushAlso: false,
  });

  async function dispatchCustomEmail(e: React.FormEvent) {
    e.preventDefault();
    if (
      !composerData.subject ||
      !composerData.body ||
      (composerData.mode === 'individual' && !composerData.recipient)
    ) {
      toast.error('Completa destinatario, asunto y mensaje');
      return;
    }
    setComposerSending(true);
    try {
      const res = await apiFetch('/api/admin-email-templates/compose', {
        method: 'POST',
        body: JSON.stringify(composerData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Fallo de envío');
      }
      const ok = (await res.json()) as { queued?: number };
      toast.success(
        typeof ok.queued === 'number'
          ? `Comunicado encolado a ${ok.queued} destinatarios`
          : 'Comunicado despachado exitosamente',
      );
      setComposerOpen(false);
      setComposerData({
        recipient: '',
        mode: 'individual',
        segment: 'cliente',
        subject: '',
        body: '',
        context: 'tienda',
        sendPushAlso: false,
      });
      const logRes = await apiFetch('/api/admin-email-templates/log');
      if (logRes.ok) {
        const json = (await logRes.json()) as { data?: EmailLogEntry[] };
        setLog(json.data ?? []);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al despachar comunicado');
    } finally {
      setComposerSending(false);
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
        actions={
          <Button
            size="sm"
            onClick={() => setComposerOpen(true)}
            className="gap-2 shadow-sm font-medium text-xs tracking-wider uppercase"
          >
            <PenSquare size={14} />
            <span>Redactar Comunicado</span>
          </Button>
        }
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
              key={rowId(tpl)}
              className="rounded-xl border border-border/70 bg-surface-sunken/50 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-muted-foreground font-mono">{tpl.key}</code>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] font-semibold text-foreground">
                    {LOCALE_LABELS[tpl.locale] ?? tpl.locale}
                  </span>
                  {tpl.locale === 'es' &&
                    !items.some((t) => t.key === tpl.key && t.locale === 'en') && (
                      <button
                        type="button"
                        onClick={() => createVariant(tpl.key, 'en')}
                        disabled={savingKey === `${tpl.key}:en`}
                        className="rounded-full border border-border px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground disabled:opacity-60"
                      >
                        + Variante EN
                      </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tpl.enabled}
                      onChange={(e) => patchTemplate(tpl.key, tpl.locale, { enabled: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                    />
                    Habilitado
                  </label>
                  <select
                    value={tpl.mode}
                    onChange={(e) => patchTemplate(tpl.key, tpl.locale, { mode: e.target.value as 'immediate' | 'queue' })}
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
                          patchTemplate(tpl.key, tpl.locale, { send_after_hours: Math.max(0, Number(e.target.value) || 0) })
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
                    onChange={(e) => patchTemplate(tpl.key, tpl.locale, { subject_template: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="block text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">
                      Cuerpo (placeholders: {'{{ campo }}'})
                    </span>
                    {tpl.key === 'pos_whatsapp_receipt' && (
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Plantilla Oficial Comprobante Campo POS
                      </span>
                    )}
                  </div>
                  {tpl.key === 'pos_whatsapp_receipt' && (
                    <div className="mb-2 p-2.5 rounded-lg bg-surface-raised border border-border/70 text-[11px] text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">Variables disponibles para el ticket de WhatsApp:</p>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-primary">
                        <span className="bg-background px-1.5 py-0.5 rounded border border-border">{'{{nombre_cliente}}'}</span>
                        <span className="bg-background px-1.5 py-0.5 rounded border border-border">{'{{productos_detalle}}'}</span>
                        <span className="bg-background px-1.5 py-0.5 rounded border border-border">{'{{monto_total}}'}</span>
                        <span className="bg-background px-1.5 py-0.5 rounded border border-border">{'{{link_pasaporte}}'}</span>
                      </div>
                    </div>
                  )}
                  <textarea
                    value={tpl.body_template}
                    onChange={(e) => patchTemplate(tpl.key, tpl.locale, { body_template: e.target.value })}
                    rows={tpl.key === 'pos_whatsapp_receipt' ? 10 : 5}
                    className={`${fieldClass} font-mono text-xs leading-relaxed`}
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => save(tpl.key, tpl.locale)}
                  disabled={savingKey === rowId(tpl)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60"
                >
                  {savingKey === rowId(tpl) ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => sendTest(tpl.key, tpl.locale)}
                  disabled={testingKey === rowId(tpl)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-4 text-xs font-medium text-foreground hover:bg-surface-raised disabled:opacity-60"
                >
                  {testingKey === rowId(tpl) ? (
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

      {/* Modal Compositor de Comunicados Directos */}
      <ImmersiveModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        eyebrow="Comunicados Directos"
        title="Compositor de Comunicados Directos"
      >
        <form onSubmit={dispatchCustomEmail} className="space-y-5 p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Identidad de Origen (Remitente)
              </label>
              <select
                value={composerData.context}
                onChange={(e) =>
                  setComposerData((prev) => ({
                    ...prev,
                    context: e.target.value as 'tienda' | 'pedidos' | 'territorio' | 'sistema',
                  }))
                }
                className={fieldClass}
              >
                <option value="tienda">Tienda Principal (contacto@laobrerayelzangano.cl)</option>
                <option value="pedidos">Despachos & Pedidos (pedidos@laobrerayelzangano.cl)</option>
                <option value="territorio">Registro Territorial (territorio@laobrerayelzangano.cl)</option>
                <option value="sistema">Sistema & Alertas (sistema@laobrerayelzangano.cl)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Destino
              </label>
              <div className="flex gap-1 bg-surface-sunken p-0.5 rounded-lg border border-border mb-2">
                {(['individual', 'segmento'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setComposerData((prev) => ({ ...prev, mode: m }))}
                    className={`flex-1 px-3 py-1.5 rounded text-xs transition-colors ${
                      composerData.mode === m
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m === 'individual' ? 'Un correo' : 'Segmento'}
                  </button>
                ))}
              </div>
              {composerData.mode === 'individual' ? (
                <input
                  type="email"
                  required
                  value={composerData.recipient}
                  onChange={(e) =>
                    setComposerData((prev) => ({ ...prev, recipient: e.target.value }))
                  }
                  placeholder="guardiano@ejemplo.com"
                  className={fieldClass}
                />
              ) : (
                <>
                  <select
                    value={composerData.segment}
                    onChange={(e) =>
                      setComposerData((prev) => ({
                        ...prev,
                        segment: e.target.value as typeof prev.segment,
                      }))
                    }
                    className={fieldClass}
                  >
                    <option value="cliente">Guardianes (clientes)</option>
                    <option value="territorial">Registro Territorial</option>
                    <option value="creador">Creadores</option>
                    <option value="rep_ventas">Representantes de venta</option>
                    <option value="todos">Todos los perfiles</option>
                  </select>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Se encola en la cola existente (máx. 200 por tanda) y la entrega la procesa el cron.
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Asunto del Mensaje
            </label>
            <input
              required
              value={composerData.subject}
              onChange={(e) => setComposerData((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Ej: Convocatoria privada: Apertura de recolección Ulmo 2027"
              className={fieldClass}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cuerpo del Comunicado
              </label>
              <div className="flex gap-1 bg-surface-sunken p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setComposerTab('edit')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    composerTab === 'edit'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Edición
                </button>
                <button
                  type="button"
                  onClick={() => setComposerTab('preview')}
                  className={`px-3 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                    composerTab === 'preview'
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye size={12} />
                  <span>Vista Previa</span>
                </button>
              </div>
            </div>

            {composerTab === 'edit' ? (
              <textarea
                required
                rows={8}
                value={composerData.body}
                onChange={(e) => setComposerData((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="Estimado/a guardián/a,&#10;&#10;Nos comunicamos directamente desde el apiario para compartir..."
                className={`${fieldClass} resize-none font-sans leading-relaxed`}
              />
            ) : (
              <div className="rounded-xl border border-border/80 bg-surface-sunken p-6 space-y-4 min-h-[200px]">
                <div className="border-b border-border/50 pb-3 text-xs space-y-1 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">De:</strong> {composerData.context}@laobrerayelzangano.cl
                  </p>
                  <p>
                    <strong className="text-foreground">Para:</strong>{' '}
                    {composerData.mode === 'segmento'
                      ? `Segmento: ${composerData.segment} (máx. 200)`
                      : composerData.recipient || 'destinatario@ejemplo.com'}
                  </p>
                  <p>
                    <strong className="text-foreground">Asunto:</strong> {composerData.subject || '(Sin asunto)'}
                  </p>
                </div>
                <div className="font-display text-base text-foreground/90 whitespace-pre-line leading-relaxed italic">
                  {composerData.body || 'Escribe el mensaje en la pestaña de Edición para previsualizar aquí.'}
                </div>
                <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground font-mono">
                  Enjambre Legado · Origen y Presencia Territorial · Chiloé, Chile
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Radio size={14} className="text-primary" />
                Vincular Notificación Push Inmediata
              </span>
              <p className="text-[11px] text-muted-foreground">
                Si el destinatario tiene dispositivos suscritos, recibirá una alerta instantánea en pantalla.
              </p>
            </div>
            <input
              type="checkbox"
              checked={composerData.sendPushAlso}
              onChange={(e) =>
                setComposerData((prev) => ({ ...prev, sendPushAlso: e.target.checked }))
              }
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setComposerOpen(false)}
              disabled={composerSending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={composerSending} className="gap-2">
              {composerSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Despachando...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Despachar Comunicado</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </ImmersiveModal>

      {/* Modal de Envío de Prueba */}
      <ImmersiveModal
        open={Boolean(testModalTarget)}
        onClose={() => setTestModalTarget(null)}
        eyebrow="Prueba de Plantilla"
        title="Enviar correo de prueba"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setTestModalTarget(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
              onClick={() => void handleConfirmSendTest()}
              disabled={!testEmail || !testEmail.includes('@') || testingKey !== null}
            >
              {testingKey ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send size={14} />}
              <span>Enviar prueba</span>
            </button>
          </>
        }
      >
        <div className="space-y-3 p-1">
          <p className="text-xs text-muted-foreground">
            Ingresa la dirección de correo a la que deseas enviar una muestra renderizada de la plantilla{' '}
            <code className="text-foreground font-mono font-semibold">{testModalTarget?.key}</code> ({testModalTarget?.locale.toUpperCase()}).
          </p>
          <label className="block text-xs font-semibold text-foreground">
            Correo electrónico
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="input-field w-full mt-1"
              autoFocus
            />
          </label>
        </div>
      </ImmersiveModal>
    </div>
  );
}