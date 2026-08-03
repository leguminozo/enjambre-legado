'use client';

// Curaduría en escritorio (§3.4): el apicultor revisa las hipótesis de
// atribución de cada captura ("estas frases parecen pertenecer a la colmena
// 15, ¿confirmas?") y confirma — o corrige — sin reescribir nada.
// El parseo ocurrió en el backend (POST /capturas/:id/procesar); este panel
// solo presenta y materializa la confirmación.

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Sparkles, ShieldAlert, Loader2 } from 'lucide-react';
import type { CapturaVozRow, AtribucionHipotesis, FaseBitacora } from '@/lib/bitacora-types';
import { FASES_BITACORA } from '@/lib/bitacora-types';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface Props {
  colmenas: ColmenaWithRelations[];
}

interface CapturasResponse {
  data: CapturaVozRow[];
}

const ESTADOS_CURADURIA: CapturaVozRow['estado'][] = ['procesado', 'en_revision', 'transcrito'];

export function CuraduriaBitacoraPanel({ colmenas }: Props) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [fases, setFases] = useState<Record<string, FaseBitacora>>({});

  const { data: capturasData, refetch } = useQuery<CapturasResponse>({
    queryKey: ['bitacora-capturas'],
    queryFn: async () => {
      const res = await apiFetch('/api/bitacora/capturas');
      if (!res.ok) throw new Error('Error cargando capturas');
      return res.json();
    },
    staleTime: 30_000,
  });

  const capturas = useMemo(
    () => (capturasData?.data ?? []).filter((c) => ESTADOS_CURADURIA.includes(c.estado)),
    [capturasData]
  );

  const nombreColmena = (id: string | null) =>
    id ? colmenas.find((c) => c.id === id)?.name ?? 'Colmena desconocida' : null;

  const procesar = async (capturaId: string) => {
    const res = await apiFetch(`/api/bitacora/capturas/${capturaId}/procesar`, { method: 'POST' });
    if (!res.ok) return;
    await refetch();
  };

  const confirmar = async (capturaId: string, hip: AtribucionHipotesis) => {
    if (!hip.colmena_id) return;
    setConfirmando(capturaId);
    try {
      const body: Record<string, unknown> = { colmena_id: hip.colmena_id };
      if (hip.resultado) {
        const fase = fases[capturaId] ?? hip.resultado.fase ?? 'temporada';
        body.inspeccion = {
          fase,
          poblacion: hip.resultado.poblacion ?? undefined,
          reina: hip.resultado.reina && hip.resultado.reina !== 'SR' ? true : undefined,
          marcos_cria: hip.resultado.marcos_cria > 0 ? hip.resultado.marcos_cria : undefined,
          marcos_miel: hip.resultado.marcos_miel > 0 ? hip.resultado.marcos_miel : undefined,
          cuadros: hip.resultado.cuadros.map((c, i) => ({ posicion: i + 1, cuerpo: c.cuerpo, tipo: c.tipo })),
          notas: hip.resultado.notas || undefined,
        };
      }
      if (hip.resultado?.reina) body.reina = { estado: hip.resultado.reina };
      await apiFetch(`/api/bitacora/capturas/${capturaId}/confirmar`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await queryClient.invalidateQueries({ queryKey: ['bitacora-capturas'] });
    } finally {
      setConfirmando(null);
    }
  };

  if (capturas.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Curaduría de capturas</h3>
          <p className="text-xs text-muted-foreground">
            Revisa y confirma la atribución de las capturas por voz (§3.4)
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {capturas.map((cap) => (
          <div key={cap.id} className="p-4 bg-secondary/20 border border-border/50 rounded-xl">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{new Date(cap.created_at).toLocaleString()}</span>
                {cap.duracion_seg ? <span>· {cap.duracion_seg}s</span> : null}
              </div>
              <span className="badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase badge-warning">
                {cap.estado === 'transcrito' ? 'sin procesar' : cap.estado}
              </span>
            </div>

            {cap.estado === 'transcrito' ? (
              <button
                onClick={() => void procesar(cap.id)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
              >
                Procesar transcripción
              </button>
            ) : cap.atribucion_hipotesis.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sin marcadores de colmena detectados — revisa la transcripción manualmente.
              </p>
            ) : (
              <div className="space-y-3">
                {cap.atribucion_hipotesis.map((hip, i) => {
                  const asignado = nombreColmena(hip.colmena_id);
                  return (
                    <div key={i} className="flex flex-col md:flex-row md:items-center gap-3 bg-card border border-border/50 rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">“{hip.etiqueta}”</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${hip.confianza >= 0.85 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {Math.round(hip.confianza * 100)}%
                          </span>
                          {asignado && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 size={10} className="text-success" /> {asignado}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{hip.fragmento}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={hip.colmena_id ?? ''}
                          onChange={(e) => {
                            // Corrección de atribución: se materializa en el confirm
                            hip.colmena_id = e.target.value || null;
                          }}
                          className="bg-secondary/30 border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground"
                        >
                          <option value="">Sin asignar</option>
                          {colmenas.map((c) => (
                            <option key={c.id} value={c.id}>{c.name || 'Sin nombre'}</option>
                          ))}
                        </select>

                        {hip.resultado && (
                          <select
                            value={fases[cap.id] ?? hip.resultado.fase ?? 'temporada'}
                            onChange={(e) => setFases((prev) => ({ ...prev, [cap.id]: e.target.value as FaseBitacora }))}
                            className="bg-secondary/30 border border-border/50 rounded-lg px-2 py-1.5 text-xs text-foreground"
                          >
                            {FASES_BITACORA.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        )}

                        <button
                          onClick={() => void confirmar(cap.id, hip)}
                          disabled={!hip.colmena_id || confirmando === cap.id}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 disabled:opacity-40"
                        >
                          {confirmando === cap.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Confirmar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1">
        <ShieldAlert size={10} />
        La confirmación materializa la inspección en la colmena asignada; el audio original queda como respaldo.
      </p>
    </div>
  );
}
