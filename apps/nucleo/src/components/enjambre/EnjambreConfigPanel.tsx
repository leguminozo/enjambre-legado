'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Settings2 } from 'lucide-react';
import { toast, Skeleton } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface BeneficioRow {
  clave: string;
  valor_numerico: number;
  descripcion: string | null;
  updated_at: string;
}

const LABELS: Record<string, string> = {
  welcome_points: 'Puntos de bienvenida (Únete al Enjambre)',
  clp_gasto_por_punto: 'Pesos CLP gastados por cada punto acumulado',
  clp_por_punto: 'Pesos CLP gastados por cada punto acumulado',
  puntos_canje_bloque: 'Puntos canjeables por bloque de descuento',
  clp_descuento_bloque: 'Descuento en CLP obtenido por bloque de puntos',
  ciclos_por_resena: 'Ciclos del Néctar otorgados por reseña sensorial aprobada',
  clp_gasto_por_ciclo: 'Pesos CLP de compra por cada ciclo de trayectoria',
  ciclos_bienvenida_reposicion: 'Ciclos al activar la Reposición',
  reposicion_pts: 'Puntos de bienvenida al activar la Reposición',
  puntos_por_frasco: 'Puntos por frasco retornado (programa circular)',
  ciclos_por_frasco: 'Ciclos de trayectoria por frasco retornado',
  puntos_bono_hito10: 'Puntos extra por lote de 10 frascos retornados',
  ciclos_bono_hito10: 'Ciclos extra por lote de 10 frascos retornados',
  cart_abandonment_grace_minutes: 'Tiempo de gracia para carrito abandonado (minutos)',
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
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const query = useQuery<{ data: BeneficioRow[] }>({
    queryKey: ['enjambre', 'configuracion'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const res = await apiFetch('/api/enjambre/configuracion');
      if (!res.ok) throw new Error('Error al cargar beneficios del Enjambre');
      return res.json();
    },
  });

  if (query.isLoading) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4" aria-busy="true" aria-label="Cargando beneficios">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-5 h-5" />
          <Skeleton variant="text" className="w-48 h-5" />
        </div>
        <Skeleton variant="text" className="w-full max-w-md h-3.5" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-b border-border/30 last:border-b-0 gap-2"
            >
              <div className="space-y-1">
                <Skeleton variant="text" className="w-48 sm:w-64 h-4" />
                <Skeleton variant="text" className="w-32 sm:w-40 h-3" />
              </div>
              <Skeleton variant="rectangular" className="w-full sm:w-32 h-10 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (query.isError) return null;

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
      const body = (await res.json().catch(() => null)) as { data?: BeneficioRow[]; message?: string } | null;
      if (!res.ok) {
        throw new Error(body?.message ?? 'Error al guardar');
      }

      if (body?.data) {
        queryClient.setQueryData(['enjambre', 'configuracion'], { data: body.data });
      }

      toast('Beneficios del Enjambre actualizados. El hub y el checkout ya usan los nuevos valores.', {
        type: 'success',
      });
      setValues({});
      await queryClient.invalidateQueries({ queryKey: ['enjambre', 'configuracion'] });
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
        (multiplicadores por rol). Guardar aquí actualiza ambos de forma inmediata.
      </p>
      <div className="space-y-3">
        {rows.map((row) => {
          const title = LABELS[row.clave] || row.descripcion || row.clave.replace(/_/g, ' ');
          return (
            <div
              key={row.clave}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-1 border-b border-border/30 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{title}</p>
                {row.descripcion && row.descripcion !== title ? (
                  <p className="text-[0.65rem] text-muted-foreground">
                    {row.descripcion.replace(/Club Cosecha/gi, 'Club Legado')}
                  </p>
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
                aria-label={title}
              />
            </div>
          );
        })}
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
