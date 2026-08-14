'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Save, Settings2 } from 'lucide-react';
import { toast, ViewLoading } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface BeneficioRow {
  clave: string;
  valor_numerico: number;
  descripcion: string | null;
  updated_at: string;
}

const LABELS: Record<string, string> = {
  welcome_points: 'Puntos de bienvenida (Únete al Enjambre)',
  clp_por_punto: 'CLP por punto (1 punto por cada $X)',
  mult_embajador: 'Multiplicador Embajador — 0.70 = 30% off',
  mult_revendedor: 'Multiplicador Revendedor — 0.80 = 20% off',
  mult_suscriptor: 'Multiplicador Suscriptor — 0.90 = 10% off',
  mult_volumen: 'Multiplicador volumen — 0.95 = +5%',
  volumen_pedidos: 'Pedidos mínimos para aplicar volumen',
};

/**
 * Panel admin de beneficios del Enjambre: edita la tabla beneficios_enjambre
 * que consumen el hub de la tienda (/perfil/enjambre) y el pricing del
 * checkout — una sola fuente, corregible sin deploy.
 */
export function EnjambreConfigPanel() {
  const apiFetch = useApiFetch();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const query = useQuery<{ data: BeneficioRow[] }>({
    queryKey: ['enjambre', 'configuracion'],
    queryFn: async () => {
      const res = await apiFetch('/api/enjambre/configuracion');
      if (!res.ok) throw new Error('Error al cargar beneficios del Enjambre');
      return res.json();
    },
  });

  if (query.isLoading) {
    return <ViewLoading variant="inline" label="Beneficios del Enjambre" />;
  }
  if (query.isError) return null; // silencioso: el resto de la configuración sigue

  const rows = query.data?.data ?? [];

  async function handleSave() {
    setSaving(true);
    try {
      const patch: Record<string, number> = {};
      for (const [clave, raw] of Object.entries(values)) {
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          toast(`Valor inválido en ${LABELS[clave] ?? clave}`, { type: 'error' });
          setSaving(false);
          return;
        }
        patch[clave] = num;
      }
      if (Object.keys(patch).length === 0) {
        toast('Sin cambios', { type: 'info' });
        setSaving(false);
        return;
      }
      const res = await apiFetch('/api/enjambre/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Error al guardar');
      }
      toast('Beneficios del Enjambre actualizados. El hub y el checkout ya usan los nuevos valores.', {
        type: 'success',
      });
      setValues({});
      query.refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al guardar', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 size={16} className="text-accent-text" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
          Beneficios del Enjambre
        </h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
        Valores que muestran el hub «Únete al Enjambre» de la tienda y que aplica el checkout
        (multiplicadores por rol). Guardar aquí actualiza ambos sin deploy.
      </p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.clave}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">{LABELS[row.clave] ?? row.clave}</p>
              {row.descripcion ? (
                <p className="text-[0.65rem] text-muted-foreground">{row.descripcion}</p>
              ) : null}
            </div>
            <input
              type="number"
              step="any"
              min={0}
              value={values[row.clave] ?? String(row.valor_numerico)}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [row.clave]: e.target.value }))
              }
              className="w-full min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent sm:w-32"
              aria-label={LABELS[row.clave] ?? row.clave}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent/10 px-6 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-60"
      >
        <Save size={14} />
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </section>
  );
}
