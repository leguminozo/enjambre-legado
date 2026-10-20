'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Save, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast, ViewLoading, formatCLP } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

export interface GuardianTierRow {
  tier: string;
  nombre_display: string;
  icono: string;
  color_token: string;
  min_ciclos: number;
  min_spent: number;
  min_trees: number;
  priority: number;
  etiqueta_narrativa: string | null;
  activo: boolean;
  updated_at?: string;
}

export interface GuardianTiersConfigPanelProps {}

const FORBIDDEN_WORDS = [
  { word: 'cosecha', fix: 'recolección' },
  { word: 'cosechas', fix: 'recolecciones' },
  { word: 'custodia', fix: 'vínculo o trayectoria' },
  { word: 'biocultural', fix: 'territorial o de origen' },
  { word: 'oficio', fix: 'maestría o técnica apícola' },
];

export function GuardianTiersConfigPanel(_props: GuardianTiersConfigPanelProps = {}) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [tiers, setTiers] = useState<GuardianTierRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const query = useQuery<{ data: GuardianTierRow[] }>({
    queryKey: ['enjambre', 'guardian-tiers'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const res = await apiFetch('/api/enjambre/guardian-tiers');
      if (!res.ok) throw new Error('Error al cargar tiers de Guardián');
      return res.json();
    },
  });

  useEffect(() => {
    if (query.data?.data && !dirty) {
      setTiers(
        query.data.data.map((r) => ({
          ...r,
          nombre_display: r.nombre_display || r.tier,
          icono: r.icono || '🌱',
          color_token: r.color_token || 'accent',
          activo: r.activo ?? true,
        })),
      );
    }
  }, [query.data]); // Solo reacciona a cambios reales de datos, no a toggles de dirty

  if (query.isLoading) {
    return <ViewLoading variant="inline" label="Tiers de Guardián" />;
  }
  if (query.isError) return null;

  const handleFieldChange = (index: number, field: keyof GuardianTierRow, value: unknown) => {
    setDirty(true);
    setTiers((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleAddTier = () => {
    setDirty(true);
    const nextPriority = tiers.length > 0 ? Math.max(...tiers.map((t) => t.priority)) + 1 : 1;
    const newTierCode = `tier_${nextPriority}`;
    const newTier: GuardianTierRow = {
      tier: newTierCode,
      nombre_display: `Rango Superior ${nextPriority}`,
      icono: '✨',
      color_token: 'accent',
      min_ciclos: 1000 * nextPriority,
      min_spent: 100000 * nextPriority,
      min_trees: nextPriority * 2,
      priority: nextPriority,
      etiqueta_narrativa: 'Distinción exclusiva por lealtad y compromiso territorial.',
      activo: true,
    };
    setTiers((prev) => [...prev, newTier]);
  };

  const handleRemoveTier = (index: number) => {
    setDirty(true);
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const priorities = tiers.map((t) => t.priority);
      const uniquePriorities = new Set(priorities);
      if (priorities.length !== uniquePriorities.size) {
        throw new Error('Cada rango debe tener una prioridad numérica única.');
      }

      const payload = tiers.map((r) => ({
        tier: r.tier,
        nombre_display: r.nombre_display.trim() || r.tier,
        icono: r.icono.trim() || '🌱',
        color_token: r.color_token || 'accent',
        min_ciclos: Number(r.min_ciclos || 0),
        min_spent: Number(r.min_spent || 0),
        min_trees: Number(r.min_trees || 0),
        priority: Number(r.priority),
        etiqueta_narrativa: r.etiqueta_narrativa?.trim() || null,
        activo: r.activo ?? true,
      }));

      const res = await apiFetch('/api/enjambre/guardian-tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers: payload }),
      });

      const body = (await res.json().catch(() => null)) as { data?: GuardianTierRow[]; message?: string } | null;
      if (!res.ok) {
        throw new Error(body?.message ?? 'Error al guardar los tiers');
      }

      if (body?.data) {
        const fresh = body.data.map((r) => ({
          ...r,
          nombre_display: r.nombre_display || r.tier,
          icono: r.icono || '🌱',
          color_token: r.color_token || 'accent',
          activo: r.activo ?? true,
        }));
        queryClient.setQueryData(['enjambre', 'guardian-tiers'], { data: body.data });
        setTiers(fresh);
      }

      toast('Tiers de Guardián actualizados. Toda la plataforma aplicará estos nombres y cortes de inmediato.', {
        type: 'success',
      });
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ['enjambre', 'guardian-tiers'] });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-accent" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
              Tiers de Guardián (Club Legado)
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Control centralizado y dinámico. Define los nombres públicos de cada rango, sus íconos, requisitos y narrativa. Las promociones automáticas y las insignias de cliente se sincronizan en tiempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddTier}
          className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface-raised px-4 py-2 text-xs font-medium text-foreground hover:bg-accent/10 hover:text-accent hover:border-accent transition-colors"
        >
          <Plus size={14} />
          Añadir Rango
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.map((row, index) => {
          const warnings = FORBIDDEN_WORDS.filter((fw) =>
            (row.etiqueta_narrativa || '').toLowerCase().includes(fw.word) ||
            row.nombre_display.toLowerCase().includes(fw.word),
          );

          return (
            <div
              key={row.tier}
              className={`rounded-xl border p-4 space-y-4 transition-colors ${
                row.activo ? 'border-border bg-background' : 'border-border/40 bg-surface-sunken opacity-60'
              }`}
            >
              {/* Encabezado editable con badge preview */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={row.icono}
                    onChange={(e) => handleFieldChange(index, 'icono', e.target.value)}
                    title="Ícono / Emoji del Rango"
                    className="w-10 text-center rounded-lg border border-border bg-card py-1 text-lg text-foreground focus:outline-none focus:border-accent"
                  />
                  <div className="flex-1">
                    <label className="text-[0.65rem] text-muted-foreground block mb-0.5">Nombre Público del Rango</label>
                    <input
                      type="text"
                      value={row.nombre_display}
                      onChange={(e) => handleFieldChange(index, 'nombre_display', e.target.value)}
                      placeholder="Ej: Guardián de Selección"
                      className="w-full font-display font-semibold text-foreground text-sm tracking-wide rounded-md border border-border bg-card px-2.5 py-1 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <label className="text-[0.6rem] text-muted-foreground block">Prioridad</label>
                    <input
                      type="number"
                      min={1}
                      value={row.priority}
                      onChange={(e) => handleFieldChange(index, 'priority', Number(e.target.value))}
                      className="w-14 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground font-mono text-center focus:outline-none focus:border-accent"
                    />
                  </div>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      title="Eliminar este rango"
                      className="mt-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Vista previa en vivo del Badge de Cliente */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-sunken border border-border/40 text-xs">
                <span className="text-[0.65rem] text-muted-foreground">Insignia en Tienda:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-accent/40 bg-accent/10 text-accent-text font-medium text-[0.7rem] uppercase tracking-wider">
                  <span>{row.icono}</span>
                  <span>{row.nombre_display || 'Sin nombre'}</span>
                </span>
              </div>

              {/* Métricas requeridas */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[0.65rem] text-muted-foreground block mb-1">Mín. Ciclos</label>
                  <input
                    type="number"
                    min={0}
                    value={row.min_ciclos}
                    onChange={(e) => handleFieldChange(index, 'min_ciclos', Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-muted-foreground block mb-1">Gasto Acumulado</label>
                  <input
                    type="number"
                    min={0}
                    value={row.min_spent}
                    onChange={(e) => handleFieldChange(index, 'min_spent', Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-muted-foreground block mb-1">Árboles Plantados</label>
                  <input
                    type="number"
                    min={0}
                    value={row.min_trees}
                    onChange={(e) => handleFieldChange(index, 'min_trees', Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Etiqueta Narrativa */}
              <div>
                <label className="text-[0.65rem] text-muted-foreground block mb-1">Etiqueta Narrativa (Propuesta de Valor)</label>
                <input
                  type="text"
                  value={row.etiqueta_narrativa ?? ''}
                  onChange={(e) => handleFieldChange(index, 'etiqueta_narrativa', e.target.value)}
                  placeholder="Ej: Acceso preferente y asignación de lotes exclusivos..."
                  className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              {/* Advertencias de voz y vocabulario */}
              {warnings.length > 0 && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 border border-warning/30 text-[0.65rem] text-warning">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <div>
                    Sugerencia de tono de lujo: detectada palabra restringida ({warnings.map((w) => `"${w.word}"`).join(', ')}). Usa términos como {warnings.map((w) => `«${w.fix}»`).join(', ')}.
                  </div>
                </div>
              )}

              {/* Resumen de exigencia en lenguaje humano */}
              <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground pt-1 border-t border-border/40">
                <span>
                  Exige {row.min_ciclos} ciclos + {formatCLP(Number(row.min_spent))} invertidos + {row.min_trees} árboles.
                </span>
                <span className="font-mono text-[0.6rem] text-muted-foreground/60">
                  ID: {row.tier}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <p className="text-xs text-muted-foreground">
          {dirty ? 'Hay cambios sin guardar.' : 'Todos los rangos sincronizados con la base de datos.'}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent/15 px-6 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? 'Guardando…' : 'Guardar Tiers'}
        </button>
      </div>
    </section>
  );
}
