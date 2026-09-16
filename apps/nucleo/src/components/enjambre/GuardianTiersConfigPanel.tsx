'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Save } from 'lucide-react';
import { toast, ViewLoading, formatCLP } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface GuardianTierRow {
  tier: 'OBRERA' | 'ZÁNGANO' | 'REINA' | 'COLMENA';
  min_ciclos: number;
  min_spent: number;
  min_trees: number;
  priority: number;
  etiqueta_narrativa: string | null;
  updated_at: string;
}

const TIER_ICONS: Record<string, string> = {
  OBRERA: '🌱',
  ZÁNGANO: '🌿',
  REINA: '👑',
  COLMENA: '✨',
};

export function GuardianTiersConfigPanel() {
  const apiFetch = useApiFetch();
  const [editedTiers, setEditedTiers] = useState<Record<string, Partial<GuardianTierRow>>>({});
  const [saving, setSaving] = useState(false);

  const query = useQuery<{ data: GuardianTierRow[] }>({
    queryKey: ['enjambre', 'guardian-tiers'],
    queryFn: async () => {
      const res = await apiFetch('/api/enjambre/guardian-tiers');
      if (!res.ok) throw new Error('Error al cargar tiers de Guardián');
      return res.json();
    },
  });

  if (query.isLoading) {
    return <ViewLoading variant="inline" label="Tiers de Guardián" />;
  }
  if (query.isError) return null;

  const rows = query.data?.data ?? [];

  const handleFieldChange = (tier: string, field: keyof GuardianTierRow, value: unknown) => {
    setEditedTiers((prev) => ({
      ...prev,
      [tier]: {
        ...prev[tier],
        [field]: value,
      },
    }));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const payload = rows.map((r) => {
        const edits = editedTiers[r.tier] || {};
        return {
          tier: r.tier,
          min_ciclos: Number(edits.min_ciclos ?? r.min_ciclos),
          min_spent: Number(edits.min_spent ?? r.min_spent),
          min_trees: Number(edits.min_trees ?? r.min_trees),
          priority: r.priority,
          etiqueta_narrativa: (edits.etiqueta_narrativa !== undefined ? edits.etiqueta_narrativa : r.etiqueta_narrativa) as string | null,
        };
      });

      const res = await apiFetch('/api/enjambre/guardian-tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers: payload }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Error al guardar los tiers');
      }

      toast('Tiers de Guardián actualizados. Las promociones automáticas ahora usarán los nuevos umbrales.', {
        type: 'success',
      });
      setEditedTiers({});
      query.refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-accent-text" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
            Tiers de Guardián (Ciclos del Néctar)
          </h3>
        </div>
      </div>
      <p className="mb-6 text-xs text-muted-foreground leading-relaxed">
        Configura los cortes numéricos de Ciclos, inversión mínima y árboles plantados requeridos para ascender en la jerarquía biocultural. El sistema aplicará estos cortes de forma inmediata.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((row) => {
          const edits = editedTiers[row.tier] || {};
          const minCiclos = edits.min_ciclos !== undefined ? edits.min_ciclos : row.min_ciclos;
          const minSpent = edits.min_spent !== undefined ? edits.min_spent : row.min_spent;
          const minTrees = edits.min_trees !== undefined ? edits.min_trees : row.min_trees;
          const narrativa = (edits.etiqueta_narrativa !== undefined ? edits.etiqueta_narrativa : row.etiqueta_narrativa) ?? '';

          return (
            <div key={row.tier} className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TIER_ICONS[row.tier] || '🛡️'}</span>
                  <span className="font-display font-semibold text-foreground text-sm tracking-wide">
                    {row.tier}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Prioridad #{row.priority}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[0.65rem] text-muted-foreground block mb-1">Mín. Ciclos</label>
                  <input
                    type="number"
                    min={0}
                    value={minCiclos}
                    onChange={(e) => handleFieldChange(row.tier, 'min_ciclos', Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-muted-foreground block mb-1">Gasto Acum.</label>
                  <input
                    type="number"
                    min={0}
                    value={minSpent}
                    onChange={(e) => handleFieldChange(row.tier, 'min_spent', Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-muted-foreground block mb-1">Árboles</label>
                  <input
                    type="number"
                    min={0}
                    value={minTrees}
                    onChange={(e) => handleFieldChange(row.tier, 'min_trees', Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] text-muted-foreground block mb-1">Etiqueta Narrativa</label>
                <input
                  type="text"
                  value={narrativa}
                  onChange={(e) => handleFieldChange(row.tier, 'etiqueta_narrativa', e.target.value)}
                  placeholder="Descripción del nivel..."
                  className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <p className="text-[0.65rem] text-muted-foreground">
                Exige {minCiclos} ciclos + {formatCLP(Number(minSpent))} invertidos + {minTrees} árboles.
              </p>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent/10 px-6 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-60"
      >
        <Save size={14} />
        {saving ? 'Guardando…' : 'Guardar Tiers'}
      </button>
    </section>
  );
}
