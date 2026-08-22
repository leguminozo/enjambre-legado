'use client';

import { useCallback, useEffect, useState } from 'react';
import { Flower2, Sprout, Check, Pencil } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface Especie {
  id: string;
  nombre_comun: string;
  nombre_cientifico: string;
  gdd_umbral: number | null;
  t_base: number;
  mes_inicio_floracion: number | null;
  mes_fin_floracion: number | null;
  importancia_apicola: string | null;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function EspeciesNativasView() {
  const apiFetch = useApiFetch();
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUmbral, setEditUmbral] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    const res = await apiFetch('/api/fenologia/especies');
    if (res.ok) {
      const j = await res.json();
      setEspecies(j.data ?? []);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardarUmbral = async (esp: Especie) => {
    const valor = Number(editUmbral[esp.id]);
    if (!Number.isFinite(valor) || valor < 0) return;
    const res = await apiFetch(`/api/fenologia/especies/${esp.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ gdd_umbral: valor }),
    });
    if (res.ok) await cargar();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="Bosque · Botánica"
        title="Especies Nativas de Chiloé"
        subtitle="Catastro botánico melífero: umbrales térmicos (GDD), ventanas de floración y relevancia apícola."
        icon={<Flower2 size={20} />}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando catálogo botánico…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {especies.map((esp) => {
            const mesIni = esp.mes_inicio_floracion ? MESES[esp.mes_inicio_floracion - 1] : '—';
            const mesFin = esp.mes_fin_floracion ? MESES[esp.mes_fin_floracion - 1] : '—';
            return (
              <div key={esp.id} className="card p-5 border border-border bg-surface-raised space-y-3 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{esp.nombre_comun}</h3>
                    <p className="text-xs italic text-muted-foreground">{esp.nombre_cientifico}</p>
                  </div>
                  {esp.importancia_apicola && (
                    <span className="badge px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-accent/15 text-accent border border-accent/30">
                      {esp.importancia_apicola}
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1.5 border-t border-border/50 pt-2.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ventana de floración</span>
                    <span className="font-medium text-foreground">{mesIni} – {mesFin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temperatura base</span>
                    <span className="font-mono text-foreground">{esp.t_base}°C</span>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Umbral GDD</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder={esp.gdd_umbral != null ? String(esp.gdd_umbral) : 'Sin calibrar'}
                      value={editUmbral[esp.id] ?? ''}
                      onChange={(e) => setEditUmbral((prev) => ({ ...prev, [esp.id]: e.target.value }))}
                      className="w-24 bg-background border border-border rounded px-2 py-1 text-xs text-right font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => void guardarUmbral(esp)}
                      className="p-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      title="Guardar umbral"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
