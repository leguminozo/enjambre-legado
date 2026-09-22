'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { friendlyError, toast } from '@enjambre/ui';
import { Award, BookOpen, Plus, Trash2 } from 'lucide-react';

interface EscuelaMaterialRow {
  id: string;
  tipo: 'objecion' | 'guion' | 'quiz_pregunta';
  titulo: string;
  cuerpo: Record<string, unknown>;
  orden: number;
  activo: boolean;
}

interface QuizLog {
  detalle: Record<string, unknown>;
  producto_nombre: string;
  created_at: string;
}

const TIPO_LABEL: Record<EscuelaMaterialRow['tipo'], string> = {
  quiz_pregunta: 'Quiz',
  objecion: 'Objeción',
  guion: 'Guion',
};

function cuerpoResumen(tipo: EscuelaMaterialRow['tipo'], cuerpo: Record<string, unknown>): string {
  if (tipo === 'quiz_pregunta' && typeof cuerpo.pregunta === 'string') return cuerpo.pregunta;
  if (tipo === 'objecion' && typeof cuerpo.pregunta === 'string') return cuerpo.pregunta;
  if (tipo === 'guion' && typeof cuerpo.guion === 'string') return String(cuerpo.guion).slice(0, 120);
  return '—';
}

export function EscuelaMaterialPanel({ logs }: {
  logs: QuizLog[];
}) {
  const [material, setMaterial] = useState<EscuelaMaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo: 'quiz_pregunta' as EscuelaMaterialRow['tipo'],
    titulo: '',
    pregunta: '',
    opciones: ['', '', '', ''],
    correcta: 0,
    explicacion: '',
    respuesta: '',
  });

  const fetchMaterial = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('escuela_material')
        .select('id, tipo, titulo, cuerpo, orden, activo')
        .order('tipo')
        .order('orden');
      if (error) throw error;
      setMaterial((data ?? []) as EscuelaMaterialRow[]);
    } catch (err) {
      toast(friendlyError(err, 'No se pudo cargar el material'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMaterial();
  }, []);

  const quizLogs = logs.filter((l) => typeof l.detalle?.puntaje === 'number');
  const puntajes = quizLogs.map((l) => ({
    puntaje: Number(l.detalle.puntaje),
    total: Number(l.detalle.total ?? 0),
  }));
  const promedio = puntajes.length > 0
    ? puntajes.reduce((acc, p) => acc + (p.total > 0 ? p.puntaje / p.total : 0), 0) / puntajes.length
    : 0;
  const mejor = puntajes.length > 0 ? Math.max(...puntajes.map((p) => p.puntaje)) : null;

  const guardar = async () => {
    if (!form.titulo.trim() || !form.pregunta.trim()) {
      toast('Completa título y pregunta', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const cuerpo: Record<string, unknown> =
        form.tipo === 'quiz_pregunta'
          ? {
              pregunta: form.pregunta.trim(),
              opciones: form.opciones.map((o) => o.trim()),
              correcta: form.correcta,
              explicacion: form.explicacion.trim(),
            }
          : { pregunta: form.pregunta.trim(), respuesta: form.respuesta.trim() };
      const { error } = await supabase.from('escuela_material').insert({
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        cuerpo,
        orden: material.filter((m) => m.tipo === form.tipo).length + 1,
      });
      if (error) throw error;
      toast('Material publicado: Campo lo precarga con señal', { type: 'success' });
      setShowForm(false);
      setForm({
        tipo: 'quiz_pregunta', titulo: '', pregunta: '', opciones: ['', '', '', ''],
        correcta: 0, explicacion: '', respuesta: '',
      });
      await fetchMaterial();
    } catch (err) {
      toast(friendlyError(err, 'No se pudo guardar'), { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (row: EscuelaMaterialRow) => {
    try {
      const { error } = await supabase
        .from('escuela_material')
        .update({ activo: !row.activo, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (error) throw error;
      await fetchMaterial();
    } catch (err) {
      toast(friendlyError(err, 'No se pudo actualizar'), { type: 'error' });
    }
  };

  const eliminar = async (row: EscuelaMaterialRow) => {
    if (!window.confirm(`¿Eliminar "${row.titulo}"? Campo dejará de recibirlo.`)) return;
    try {
      const { error } = await supabase.from('escuela_material').delete().eq('id', row.id);
      if (error) throw error;
      await fetchMaterial();
    } catch (err) {
      toast(friendlyError(err, 'No se pudo eliminar'), { type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Quiz: rendimiento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-raised border border-border">
          <span className="text-xs text-muted-foreground block mb-1">Quiz completados</span>
          <span className="text-2xl font-bold text-foreground">{quizLogs.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-surface-raised border border-border">
          <span className="text-xs text-muted-foreground block mb-1">Acierto promedio</span>
          <span className="text-2xl font-bold text-primary">
            {quizLogs.length > 0 ? `${Math.round(promedio * 100)}%` : '—'}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-surface-raised border border-border">
          <span className="text-xs text-muted-foreground block mb-1">Mejor puntaje</span>
          <span className="text-2xl font-bold text-foreground flex items-center gap-1.5">
            <Award size={18} className="text-primary" /> {mejor ?? '—'}
          </span>
        </div>
      </div>

      {/* Banco de material */}
      <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h4 className="font-display text-sm font-semibold flex items-center gap-2 text-foreground">
            <BookOpen size={16} className="text-primary" /> Material de capacitación (Núcleo → Campo)
          </h4>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
          >
            <Plus size={13} /> Nuevo
          </button>
        </div>

        {showForm && (
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs">
                <span className="text-muted-foreground block mb-1">Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as EscuelaMaterialRow['tipo'] })}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                >
                  <option value="quiz_pregunta">Pregunta de quiz</option>
                  <option value="objecion">Objeción frecuente</option>
                  <option value="guion">Guion de apertura</option>
                </select>
              </label>
              <label className="block text-xs">
                <span className="text-muted-foreground block mb-1">Título</span>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej. Cristalización"
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                />
              </label>
            </div>
            <label className="block text-xs">
              <span className="text-muted-foreground block mb-1">Pregunta / enunciado</span>
              <textarea
                value={form.pregunta}
                onChange={(e) => setForm({ ...form, pregunta: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
              />
            </label>
            {form.tipo === 'quiz_pregunta' ? (
              <div className="space-y-2">
                {form.opciones.map((op, i) => (
                  <label key={i} className="flex items-center gap-2 text-xs">
                    <input
                      type="radio"
                      name="quiz-correcta"
                      checked={form.correcta === i}
                      onChange={() => setForm({ ...form, correcta: i })}
                      className="accent-primary"
                      aria-label={`Opción ${i + 1} es correcta`}
                    />
                    <input
                      value={op}
                      onChange={(e) => {
                        const next = [...form.opciones];
                        next[i] = e.target.value;
                        setForm({ ...form, opciones: next });
                      }}
                      placeholder={`Opción ${i + 1}${i === 0 ? ' (correcta)' : ''}`}
                      className="flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                    />
                  </label>
                ))}
                <label className="block text-xs">
                  <span className="text-muted-foreground block mb-1">Explicación (se muestra al terminar)</span>
                  <textarea
                    value={form.explicacion}
                    onChange={(e) => setForm({ ...form, explicacion: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                  />
                </label>
              </div>
            ) : (
              <label className="block text-xs">
                <span className="text-muted-foreground block mb-1">Respuesta / guion</span>
                <textarea
                  value={form.respuesta}
                  onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground"
                />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3.5 py-2 rounded-lg border border-border text-xs text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardar()}
                disabled={saving}
                className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Publicar'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-muted-foreground italic">Cargando material…</p>
        ) : material.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sin material publicado todavía.</p>
        ) : (
          <div className="space-y-2">
            {material.map((m) => (
              <div key={m.id} className="p-2.5 rounded-lg bg-surface-raised border border-border/80 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-foreground font-medium truncate">
                    <span className="text-primary font-semibold">[{TIPO_LABEL[m.tipo]}]</span> {m.titulo}
                    {!m.activo && <span className="text-muted-foreground"> (pausado)</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">«{cuerpoResumen(m.tipo, m.cuerpo)}»</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => void toggleActivo(m)}
                    className="px-2.5 py-1 rounded-lg border border-border text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {m.activo ? 'Pausar' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void eliminar(m)}
                    aria-label={`Eliminar ${m.titulo}`}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
