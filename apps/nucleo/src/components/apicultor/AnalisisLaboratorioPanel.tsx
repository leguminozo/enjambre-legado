'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError } from '@enjambre/ui';
import { FlaskConical, FileUp, ShieldAlert, ShieldCheck } from 'lucide-react';

interface AnalisisRow {
  id: string;
  fecha: string;
  laboratorio: string;
  humedad_pct: number | null;
  hmf_mgkg: number | null;
  diastasa: number | null;
  cenizas_pct: number | null;
  conductividad_ms: number | null;
  conteo_polinico: Record<string, number>;
  certificado_path: string | null;
}

function veredicto(a: AnalisisRow): { ok: boolean; texto: string } {
  if (a.hmf_mgkg != null && a.hmf_mgkg > 40) {
    return { ok: false, texto: `HMF ${a.hmf_mgkg} sobre Codex (40): venta bloqueada` };
  }
  if (a.humedad_pct != null && a.humedad_pct > 20) {
    return { ok: false, texto: `Humedad ${a.humedad_pct}% sobre umbral (20%)` };
  }
  return { ok: true, texto: 'Dentro de norma' };
}

const numOrNull = (v: string): number | null => {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function AnalisisLaboratorioPanel({ loteId }: { loteId: string }) {
  const apiFetch = useApiFetch();
  const [rows, setRows] = useState<AnalisisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdf, setPdf] = useState<File | null>(null);
  const [form, setForm] = useState({
    laboratorio: '',
    fecha: new Date().toISOString().slice(0, 10),
    humedad_pct: '',
    hmf_mgkg: '',
    diastasa: '',
    cenizas_pct: '',
    conductividad_ms: '',
  });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/analisis-laboratorio/lote/${loteId}`);
      if (!res.ok) throw new Error('No se pudo cargar');
      const json = (await res.json()) as { data?: AnalisisRow[] };
      setRows(json.data ?? []);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [apiFetch, loteId]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const guardar = async () => {
    if (!form.laboratorio.trim()) {
      toast.error('Indica el laboratorio');
      return;
    }
    if (pdf && pdf.type !== 'application/pdf') {
      toast.error('El certificado debe ser PDF');
      return;
    }
    setSaving(true);
    try {
      let certificado_path: string | null = null;
      if (pdf) {
        const path = `${loteId}/${crypto.randomUUID()}.pdf`;
        const { error: upError } = await supabase.storage
          .from('analisis-laboratorio')
          .upload(path, pdf, { contentType: 'application/pdf', upsert: false });
        if (upError) throw new Error(`No se pudo subir el PDF: ${upError.message}`);
        certificado_path = path;
      }
      const res = await apiFetch('/api/analisis-laboratorio', {
        method: 'POST',
        body: JSON.stringify({
          lote_id: loteId,
          laboratorio: form.laboratorio.trim(),
          fecha: form.fecha,
          humedad_pct: numOrNull(form.humedad_pct),
          hmf_mgkg: numOrNull(form.hmf_mgkg),
          diastasa: numOrNull(form.diastasa),
          cenizas_pct: numOrNull(form.cenizas_pct),
          conductividad_ms: numOrNull(form.conductividad_ms),
          certificado_path,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'No se pudo registrar');
      }
      const json = (await res.json()) as { data?: AnalisisRow & { bloqueado_calidad?: boolean } };
      if (json.data?.bloqueado_calidad) {
        toast.error('HMF sobre Codex: venta del lote bloqueada y equipo avisado');
      } else {
        toast.success('Análisis registrado');
      }
      setShowForm(false);
      setPdf(null);
      await fetchRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 border-t border-border pt-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FlaskConical size={16} className="text-primary" /> Análisis de laboratorio
        </h4>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary"
        >
          {showForm ? 'Cerrar' : 'Nuevo análisis'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-surface-sunken/50 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs">
              <span className="text-muted-foreground block mb-1">Laboratorio *</span>
              <input
                value={form.laboratorio}
                onChange={(e) => setForm({ ...form, laboratorio: e.target.value })}
                placeholder="Ej. LABEN Chilolac"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
              />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground block mb-1">Fecha</span>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
              />
            </label>
            {([
              ['humedad_pct', 'Humedad %'],
              ['hmf_mgkg', 'HMF mg/kg'],
              ['diastasa', 'Diastasa'],
              ['cenizas_pct', 'Cenizas %'],
              ['conductividad_ms', 'Conductividad mS/cm'],
            ] as const).map(([key, label]) => (
              <label key={key} className="block text-xs">
                <span className="text-muted-foreground block mb-1">{label}</span>
                <input
                  type="number"
                  step="any"
                  min={0}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                />
              </label>
            ))}
            <label className="block text-xs sm:col-span-2">
              <span className="text-muted-foreground block mb-1">Certificado PDF</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              <FileUp size={14} /> {saving ? 'Guardando…' : 'Registrar análisis'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground italic">Cargando análisis…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sin análisis formales para este lote.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((a) => {
            const v = veredicto(a);
            return (
              <div key={a.id} className="rounded-xl border border-border/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">
                    {a.laboratorio} · {new Date(a.fecha).toLocaleDateString('es-CL')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                      v.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {v.ok ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />} {v.texto}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
                  {a.humedad_pct != null && <span>Humedad {a.humedad_pct}%</span>}
                  {a.hmf_mgkg != null && <span>HMF {a.hmf_mgkg} mg/kg</span>}
                  {a.diastasa != null && <span>Diastasa {a.diastasa}</span>}
                  {a.conductividad_ms != null && <span>Cond. {a.conductividad_ms} mS/cm</span>}
                  {a.cenizas_pct != null && <span>Cenizas {a.cenizas_pct}%</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
