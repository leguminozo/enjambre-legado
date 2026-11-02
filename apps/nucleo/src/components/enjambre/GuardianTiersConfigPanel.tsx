'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Save, Plus, Trash2, AlertTriangle, X } from 'lucide-react';
import {
  toast,
  Skeleton,
  formatCLP,
  ClubTierIcon,
  CLUB_TIER_ICONS,
} from '@enjambre/ui';
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

export type GuardianTiersConfigPanelProps = Record<string, never>;

const FORBIDDEN_WORDS = [
  { word: 'cosecha', fix: 'recolección' },
  { word: 'cosechas', fix: 'recolecciones' },
  { word: 'custodia', fix: 'vínculo o trayectoria' },
  { word: 'biocultural', fix: 'territorial o de origen' },
  { word: 'oficio', fix: 'maestría o técnica apícola' },
  { word: 'guardián', fix: 'miembro, suscriptor o aliado' },
  { word: 'guardian', fix: 'miembro, suscriptor o aliado' },
];

interface TierIconPickerProps {
  value: string;
  onChange: (slug: string) => void;
  tierName?: string;
}

function TierIconPicker({ value, onChange, tierName }: TierIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Cambiar ícono de ${tierName || 'nivel'} (actual: ${value})`}
        aria-label={`Cambiar ícono de ${tierName || 'nivel'}`}
        className="flex items-center justify-center w-11 h-11 rounded-xl border border-border bg-card hover:border-accent hover:bg-accent/10 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer group"
      >
        <ClubTierIcon icon={value} size={22} className="text-accent group-hover:scale-110 transition-transform" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Catálogo de íconos del Club"
          className="absolute top-13 left-0 z-50 w-72 p-3 rounded-2xl border border-border bg-card shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/60 text-xs">
            <span className="font-semibold text-foreground tracking-wide">Íconos del Club Legado</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-raised cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {CLUB_TIER_ICONS.map((opt) => {
              const isSelected = value === opt.slug;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.slug}
                  type="button"
                  onClick={() => {
                    onChange(opt.slug);
                    setIsOpen(false);
                  }}
                  title={opt.label}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center group cursor-pointer ${
                    isSelected
                      ? 'border-accent bg-accent/20 text-accent font-semibold shadow-sm'
                      : 'border-border/60 bg-surface-sunken hover:border-accent/60 hover:bg-surface-raised text-foreground'
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      isSelected
                        ? 'text-accent'
                        : 'text-foreground/80 group-hover:text-accent group-hover:scale-110 transition-all'
                    }
                  />
                  <span className="text-[0.6rem] mt-1 text-muted-foreground group-hover:text-foreground truncate max-w-full">
                    {opt.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border/60">
            <label className="text-[0.6rem] text-muted-foreground block mb-1">
              O tipear slug Lucide / emoji:
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ej: tree-pine, crown, 🌱"
              className="w-full text-xs rounded-md border border-border bg-background px-2 py-1 text-foreground focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
      if (!res.ok) throw new Error('Error al cargar niveles de membresía');
      return res.json();
    },
  });

  useEffect(() => {
    if (query.data?.data && !dirty) {
      setTiers(
        query.data.data.map((r) => ({
          ...r,
          nombre_display: r.nombre_display || r.tier,
          icono: r.icono || 'sprout',
          color_token: r.color_token || 'accent',
          activo: r.activo ?? true,
        })),
      );
    }
  }, [query.data]);

  if (query.isLoading) {
    return (
      <section
        className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-6"
        aria-busy="true"
        aria-label="Cargando niveles de membresía"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" className="w-5 h-5" />
              <Skeleton variant="text" className="w-56 h-5" />
            </div>
            <Skeleton variant="text" className="w-96 max-w-full h-3.5" />
          </div>
          <Skeleton variant="rectangular" className="w-32 h-9 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Skeleton variant="rectangular" className="w-11 h-11 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton variant="text" className="w-20 h-2.5" />
                    <Skeleton variant="text" className="w-36 h-5" />
                  </div>
                </div>
                <Skeleton variant="rectangular" className="w-14 h-8 rounded-md" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton variant="rectangular" className="h-10 rounded-md" />
                <Skeleton variant="rectangular" className="h-10 rounded-md" />
                <Skeleton variant="rectangular" className="h-10 rounded-md" />
              </div>
              <Skeleton variant="text" className="w-full h-8 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    );
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
      nombre_display: `Nivel Superior ${nextPriority}`,
      icono: 'crown',
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
    // Protección: no permitir eliminar el nivel base (prioridad 1)
    if (tiers[index].priority <= 1) {
      toast('El nivel base no puede eliminarse para garantizar la asignación de nuevos miembros.', {
        type: 'error',
      });
      return;
    }
    setDirty(true);
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const priorities = tiers.map((t) => t.priority);
      const uniquePriorities = new Set(priorities);
      if (priorities.length !== uniquePriorities.size) {
        throw new Error('Cada nivel debe tener una prioridad numérica única.');
      }

      const payload = tiers.map((r) => ({
        tier: r.tier,
        nombre_display: r.nombre_display.trim() || r.tier,
        icono: r.icono.trim() || 'sprout',
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
        throw new Error(body?.message ?? 'Error al guardar los niveles');
      }

      if (body?.data) {
        const fresh = body.data.map((r) => ({
          ...r,
          nombre_display: r.nombre_display || r.tier,
          icono: r.icono || 'sprout',
          color_token: r.color_token || 'accent',
          activo: r.activo ?? true,
        }));
        queryClient.setQueryData(['enjambre', 'guardian-tiers'], { data: body.data });
        setTiers(fresh);
      }

      toast('Niveles de membresía actualizados. Toda la plataforma aplicará estos nombres y umbrales de inmediato.', {
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
            <Award size={18} className="text-accent" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
              Niveles de Membresía (Club Legado)
            </h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Configuración centralizada y dinámica. Define los nombres públicos de cada nivel, sus íconos representativos, requisitos de ascenso y propuesta narrativa. Los cambios se sincronizan en tiempo real con la tienda y el perfil de clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddTier}
          className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface-raised px-4 py-2 text-xs font-medium text-foreground hover:bg-accent/10 hover:text-accent hover:border-accent transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Añadir Nivel
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
              {/* Encabezado editable con selector de icono y prioridad */}
              <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5 flex-1">
                  <TierIconPicker
                    value={row.icono}
                    onChange={(slug) => handleFieldChange(index, 'icono', slug)}
                    tierName={row.nombre_display}
                  />
                  <div className="flex-1">
                    <label className="text-[0.65rem] text-muted-foreground block mb-0.5">
                      Nombre Público del Nivel
                    </label>
                    <input
                      type="text"
                      value={row.nombre_display}
                      onChange={(e) => handleFieldChange(index, 'nombre_display', e.target.value)}
                      placeholder="Ej: Iniciador, Aliado del Enjambre..."
                      className="w-full font-display font-semibold text-foreground text-sm tracking-wide rounded-md border border-border bg-card px-2.5 py-1.5 focus:outline-none focus:border-accent"
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
                  {row.priority > 1 && tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(index)}
                      title="Eliminar este nivel"
                      className="mt-3 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Vista previa en vivo de la insignia pública */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-sunken border border-border/40 text-xs">
                <span className="text-[0.65rem] text-muted-foreground">Insignia en Tienda & Perfil:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-accent/40 bg-accent/10 text-accent font-medium text-[0.7rem] uppercase tracking-wider">
                  <ClubTierIcon icon={row.icono} size={14} className="text-accent" />
                  <span>{row.nombre_display || 'Sin nombre'}</span>
                </span>
              </div>

              {/* Métricas requeridas de ascenso */}
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
                  <label className="text-[0.65rem] text-muted-foreground block mb-1">Gasto Acumulado (CLP)</label>
                  <input
                    type="number"
                    min={0}
                    value={row.min_spent}
                    onChange={(e) => handleFieldChange(index, 'min_spent', Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-muted-foreground block mb-1">Árboles Registrados</label>
                  <input
                    type="number"
                    min={0}
                    value={row.min_trees}
                    onChange={(e) => handleFieldChange(index, 'min_trees', Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Propuesta Narrativa de Valor */}
              <div>
                <label className="text-[0.65rem] text-muted-foreground block mb-1">
                  Propuesta Narrativa de Valor
                </label>
                <input
                  type="text"
                  value={row.etiqueta_narrativa ?? ''}
                  onChange={(e) => handleFieldChange(index, 'etiqueta_narrativa', e.target.value)}
                  placeholder="Ej: Acceso preferente y asignación de lotes de autor..."
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
                  Exige {row.min_ciclos} ciclos + {formatCLP(Number(row.min_spent))} invertidos + {row.min_trees} árboles vinculados.
                </span>
                <span className="font-mono text-[0.6rem] text-muted-foreground/60">
                  Código: {row.tier}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <p className="text-xs text-muted-foreground">
          {dirty ? 'Hay cambios sin guardar.' : 'Todos los niveles sincronizados con la base de datos.'}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent/15 px-6 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save size={14} />
          {saving ? 'Guardando…' : 'Guardar Niveles'}
        </button>
      </div>
    </section>
  );
}
