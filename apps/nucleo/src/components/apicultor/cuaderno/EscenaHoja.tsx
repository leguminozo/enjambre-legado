'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { HojaDetalle, HojaCuaderno, NodoRedCuaderno, RedCuaderno, TratamientoRow, MuestraRow, NodoManualRow } from '@/lib/bitacora-types';
import type { VarroaRow } from '@/lib/apicultor-types';
import { faseLabel } from './labels';
import { FASE_LABEL } from '../bitacora-labels';
import { EscenaHud } from './EscenaHud';
import { RailCampo } from './RailCampo';
import { DockEscena } from './DockEscena';
import { LienzoSemantico, type LayoutRed } from './LienzoSemantico';
import { PanelDetalleNodo } from './PanelDetalleNodo';
import { AnalisisSheet } from './AnalisisSheet';
import { HojaForm } from './HojaForm';
import { VarroaForm } from './VarroaForm';
import { TratamientoForm } from './TratamientoForm';
import { MuestraForm } from './MuestraForm';
import { NodoManualForm } from './NodoManualForm';
import { AristaForm } from './AristaForm';
import { cn } from '@/lib/cn';

interface EscenaHojaProps {
  id: string;
}

interface HojasColmenaResponse {
  data: HojaCuaderno[];
}

/** Escena de una hoja (patrón RSN study detail de Trama): HUD + rail + lienzo
 *  semántico local + dock + sheets. */
export function EscenaHoja({ id }: EscenaHojaProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [vista, setVista] = useState<'red' | 'hojas'>('red');
  const [layout, setLayout] = useState<LayoutRed>('radial');
  const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoRedCuaderno | null>(null);
  const [analisisOpen, setAnalisisOpen] = useState(false);
  const [redLocal, setRedLocal] = useState<RedCuaderno | null>(null);
  const [modoConectar, setModoConectar] = useState(false);
  const [conectarOrigen, setConectarOrigen] = useState<string | null>(null);
  const [pendienteArista, setPendienteArista] = useState<{ source: string; sourceLabel: string; target: string; targetLabel: string } | null>(null);

  // Forms
  const [hojaOpen, setHojaOpen] = useState(false);
  const [varroaOpen, setVarroaOpen] = useState(false);
  const [varroaEditando, setVarroaEditando] = useState<VarroaRow | null>(null);
  const [tratamientoOpen, setTratamientoOpen] = useState(false);
  const [tratamientoEditando, setTratamientoEditando] = useState<TratamientoRow | null>(null);
  const [muestraOpen, setMuestraOpen] = useState(false);
  const [muestraEditando, setMuestraEditando] = useState<MuestraRow | null>(null);
  const [nodoOpen, setNodoOpen] = useState(false);
  const [nodoEditando, setNodoEditando] = useState<Omit<NodoManualRow, 'user_id'> | null>(null);
  const [aristaOpen, setAristaOpen] = useState(false);

  const { data: detalle, isLoading } = useQuery<HojaDetalle>({
    queryKey: ['bitacora-hoja', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/bitacora/hojas/${id}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (res.status === 404) throw new Error('not_found');
        throw new Error(json.message ?? 'Error cargando la hoja');
      }
      return res.json();
    },
    staleTime: 15_000,
  });

  const colmenaId = detalle?.hoja.colmena_id ?? null;

  const { data: hojasColmena } = useQuery<HojasColmenaResponse>({
    queryKey: ['bitacora-hojas-colmena', colmenaId],
    queryFn: async () => {
      const res = await apiFetch(`/api/bitacora/hojas?colmena_id=${colmenaId}`);
      if (!res.ok) throw new Error('Error cargando hojas');
      return res.json();
    },
    enabled: Boolean(colmenaId) && vista === 'hojas',
  });

  useEffect(() => {
    if (detalle?.red) setRedLocal(detalle.red);
  }, [detalle?.red]);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['bitacora-hoja', id] });
    queryClient.invalidateQueries({ queryKey: ['bitacora-red'] });
    queryClient.invalidateQueries({ queryKey: ['bitacora-hojas'] });
    queryClient.invalidateQueries({ queryKey: ['bitacora-hojas-colmena'] });
  };

  const ENDPOINT_ELIMINAR: Record<string, string> = {
    hoja: 'inspecciones',
    tratamiento: 'tratamientos',
    varroa: 'varroa',
    muestra: 'muestras',
    nodo: 'nodos',
  };

  const eliminarRegistro = useMutation({
    mutationFn: async ({ tipo, rid }: { tipo: keyof typeof ENDPOINT_ELIMINAR; rid: string }) => {
      const res = await apiFetch(`/api/bitacora/${ENDPOINT_ELIMINAR[tipo]}/${rid}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message ?? 'No se pudo eliminar');
      }
      return { tipo, rid };
    },
    onSuccess: ({ tipo }) => {
      toast(tipo === 'hoja' ? 'Hoja eliminada' : 'Registro eliminado', { type: 'success' });
      setNodoSeleccionado(null);
      if (tipo === 'hoja') router.push('/colmenas/cuaderno');
      else invalidar();
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const confirmarEliminar = (nodo: NodoRedCuaderno) => {
    if (!confirm(`¿Eliminar "${nodo.label}"? Esta acción no se puede deshacer.`)) return;
    if (nodo.kind === 'hoja') eliminarRegistro.mutate({ tipo: 'hoja', rid: nodo.id });
    else if (nodo.kind === 'tratamiento') eliminarRegistro.mutate({ tipo: 'tratamiento', rid: nodo.id });
    else if (nodo.kind === 'varroa') eliminarRegistro.mutate({ tipo: 'varroa', rid: nodo.id });
    else if (nodo.kind === 'muestra') eliminarRegistro.mutate({ tipo: 'muestra', rid: nodo.id });
    else if (nodo.kind === 'manual') eliminarRegistro.mutate({ tipo: 'nodo', rid: nodo.id });
    else toast('Este nodo no se puede eliminar directamente', { type: 'info' });
  };

  const editarNodo = (nodo: NodoRedCuaderno) => {
    if (nodo.kind === 'tratamiento') {
      const t = detalle?.tratamientos.find((x) => x.id === nodo.id) ?? null;
      setTratamientoEditando(t);
      setTratamientoOpen(true);
    } else if (nodo.kind === 'varroa') {
      const v = detalle?.varroa.find((x) => x.id === nodo.id) ?? null;
      setVarroaEditando(v);
      setVarroaOpen(true);
    } else if (nodo.kind === 'muestra') {
      const m = detalle?.muestras.find((x) => x.id === nodo.id) ?? null;
      setMuestraEditando(m);
      setMuestraOpen(true);
    } else if (nodo.kind === 'manual') {
      setNodoEditando({
        id: nodo.id,
        colmena_id: nodo.colmena_id ?? null,
        tipo: (nodo.estado as NodoManualRow['tipo']) ?? 'observacion',
        label: nodo.label,
        descripcion: nodo.descripcion ?? null,
        x: nodo.x ?? null,
        y: nodo.y ?? null,
        created_at: nodo.created_at ?? '',
        updated_at: '',
      });
      setNodoOpen(true);
    } else if (nodo.kind === 'hoja' && detalle) {
      setHojaOpen(true); // HojaForm con initial construido
    }
  };

  const hojaComoCuaderno = useMemo<HojaCuaderno | null>(() => {
    if (!detalle) return null;
    const h = detalle.hoja;
    return {
      ...h,
      colmena: detalle.colmena
        ? {
            id: detalle.colmena.id,
            name: detalle.colmena.name,
            apiario_id: detalle.colmena.apiario_id,
            blockchain_hash: detalle.colmena.blockchain_hash,
            origen_tipo: detalle.colmena.origen_tipo,
            estado: detalle.colmena.estado,
            alzas: detalle.colmena.alzas,
          }
        : null,
      apiario_name: detalle.colmena?.apiario_name ?? null,
      cuadros_count: h.inspeccion_cuadros?.length ?? 0,
      tratamientos_count: detalle.tratamientos.length,
      brechas: [],
    };
  }, [detalle]);

  const moverNodo = async (nid: string, x: number, y: number) => {
    setRedLocal((prev) => {
      if (!prev) return prev;
      return { ...prev, nodos: prev.nodos.map((n) => (n.id === nid ? { ...n, x, y } : n)) };
    });
    const res = await apiFetch(`/api/bitacora/nodos/${nid}`, { method: 'PATCH', body: JSON.stringify({ x, y }) });
    if (!res.ok) toast('No se pudo guardar la posición', { type: 'error' });
  };

  const tapConectar = (nid: string) => {
    if (!conectarOrigen) {
      setConectarOrigen(nid);
      return;
    }
    if (conectarOrigen === nid) {
      setConectarOrigen(null);
      return;
    }
    const origen = redLocal?.nodos.find((n) => n.id === conectarOrigen);
    const destino = redLocal?.nodos.find((n) => n.id === nid);
    setPendienteArista({ source: conectarOrigen, sourceLabel: origen?.label ?? '', target: nid, targetLabel: destino?.label ?? '' });
    setConectarOrigen(null);
    setModoConectar(false);
    setAristaOpen(true);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-16 text-center animate-pulse">Abriendo la hoja…</p>;
  }
  if (!detalle) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-foreground">Hoja no encontrada.</p>
        <Button variant="outline" onClick={() => router.push('/colmenas/cuaderno')}>Volver al cuaderno</Button>
      </div>
    );
  }

  const hoja = detalle.hoja;
  const brechas = detalle.red.meta.brechas;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header compacto de la escena */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" className="h-9 w-9 shrink-0" onClick={() => router.push('/colmenas/cuaderno')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display italic text-2xl font-normal tracking-tight text-foreground truncate">
              Hoja · {detalle.colmena?.name ?? 'Colmena'} · <span className="font-mono text-xl">{hoja.date}</span>
            </h1>
            <p className="text-xs text-muted-foreground">{detalle.colmena?.apiario_name ?? 'Sin apiario'}</p>
          </div>
          {hoja.fase && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full shrink-0">
              {FASE_LABEL[hoja.fase as keyof typeof FASE_LABEL] ?? hoja.fase}
            </span>
          )}
        </div>
        <EscenaHud
          metricas={[
            { label: 'Cría / Miel', value: `${hoja.marcos_cria ?? 0}/${hoja.marcos_miel ?? 0}` },
            { label: 'Varroa', value: hoja.varroa != null ? String(hoja.varroa) : '—', tone: hoja.varroa != null && hoja.varroa > 3 ? 'danger' : hoja.varroa != null && hoja.varroa > 1.5 ? 'warning' : 'success' },
            { label: 'Población', value: hoja.poblacion?.[0] ?? '—' },
            { label: 'Cuadros', value: String(hoja.inspeccion_cuadros?.length ?? 0) },
            { label: 'Tratamientos', value: String(detalle.tratamientos.length) },
            { label: 'Brechas', value: String(brechas.length), tone: brechas.length > 0 ? 'warning' : 'success' },
          ]}
        />
      </div>

      <RailCampo
        onNuevaHoja={() => setHojaOpen(true)}
        onVarroa={() => {
          setVarroaEditando(null);
          setVarroaOpen(true);
        }}
        onTratamiento={() => {
          setTratamientoEditando(null);
          setTratamientoOpen(true);
        }}
        onMuestra={() => {
          setMuestraEditando(null);
          setMuestraOpen(true);
        }}
        onNodo={() => {
          setNodoEditando(null);
          setNodoOpen(true);
        }}
        onConectar={() => {
          setModoConectar((prev) => !prev);
          setConectarOrigen(null);
          setNodoSeleccionado(null);
        }}
        conectando={modoConectar}
      />

      {vista === 'red' ? (
        <div className="relative h-[calc(100dvh-380px)] min-h-[420px] rounded-2xl border border-border/60 bg-card overflow-hidden">
          <LienzoSemantico
            nodos={redLocal?.nodos ?? []}
            aristas={redLocal?.aristas ?? []}
            layout={layout}
            resaltarColmenas={new Set()}
            nodoSeleccionadoId={nodoSeleccionado?.id ?? null}
            modoConectar={modoConectar}
            onSelect={(nodo) => {
              if (modoConectar && !nodo) setConectarOrigen(null);
              setNodoSeleccionado(nodo);
            }}
            onMoveManual={moverNodo}
            onConectarNodo={tapConectar}
          />
          <PanelDetalleNodo
            nodo={nodoSeleccionado}
            onClose={() => setNodoSeleccionado(null)}
            onEditar={editarNodo}
            onEliminar={confirmarEliminar}
            onConectar={(nodo) => {
              setModoConectar(true);
              setConectarOrigen(nodo.id);
              setNodoSeleccionado(null);
            }}
            onNuevaHoja={(colmenaId) => setHojaOpen(true)}
            onAbrirColmena={(colmenaId) => router.push('/colmenas')}
            brechaDetalle={brechas.find((b) => b.colmena_id === nodoSeleccionado?.id)?.detalle ?? null}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-2">
            <DockEscena
              vista={vista}
              onVista={setVista}
              layout={layout}
              onLayout={setLayout}
              onAnalisis={() => setAnalisisOpen(true)}
              onConectar={() => {
                setModoConectar((prev) => !prev);
                setConectarOrigen(null);
              }}
              conectando={modoConectar}
              onNodo={() => {
                setNodoEditando(null);
                setNodoOpen(true);
              }}
              onNuevaHoja={() => setHojaOpen(true)}
            />
          </div>
          {modoConectar && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-full border border-primary/40 bg-background/90 backdrop-blur px-4 py-1.5 text-[11px] font-semibold text-primary whitespace-nowrap">
              {conectarOrigen ? 'Toca el nodo de destino…' : 'Toca el nodo de origen…'}
            </div>
          )}
        </div>
      ) : (
        /* Vista Hojas: historia de la colmena (timeline) */
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 mb-4">
            Historia de {detalle.colmena?.name ?? 'la colmena'}
          </p>
          <div className="space-y-2">
            {(hojasColmena?.data ?? []).map((h) => (
              <button
                key={h.id}
                onClick={() => router.push(`/colmenas/cuaderno/${h.id}`)}
                className={cn(
                  'w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                  h.id === id ? 'border-primary/40 bg-primary/5' : 'border-border/50 bg-muted/20 hover:bg-muted/40',
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{h.date}</p>
                  <p className="text-xs text-muted-foreground truncate">{h.notes || faseLabel(h.fase ?? null)}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  {h.fase ? faseLabel(h.fase) : '—'}
                </span>
              </button>
            ))}
            {(hojasColmena?.data ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin otras hojas para esta colmena.</p>
            )}
          </div>
        </div>
      )}

      {/* Sheets y formularios */}
      <AnalisisSheet open={analisisOpen} onOpenChange={setAnalisisOpen} detalle={detalle} />

      <HojaForm
        open={hojaOpen}
        onOpenChange={setHojaOpen}
        colmenas={detalle.hoja.colmena_id ? [{ id: detalle.hoja.colmena_id, name: detalle.colmena?.name ?? null }] : []}
        colmenaIdFijo={detalle.hoja.colmena_id}
        initial={hojaOpen ? hojaComoCuaderno : null}
      />
      <VarroaForm
        open={varroaOpen}
        onOpenChange={setVarroaOpen}
        colmenas={detalle.hoja.colmena_id ? [{ id: detalle.hoja.colmena_id, name: detalle.colmena?.name ?? null }] : []}
        colmenaIdFijo={detalle.hoja.colmena_id}
        initial={varroaEditando}
      />
      <TratamientoForm
        open={tratamientoOpen}
        onOpenChange={setTratamientoOpen}
        colmenas={detalle.hoja.colmena_id ? [{ id: detalle.hoja.colmena_id, name: detalle.colmena?.name ?? null }] : []}
        colmenaIdFijo={detalle.hoja.colmena_id}
        initial={tratamientoEditando}
      />
      <MuestraForm
        open={muestraOpen}
        onOpenChange={setMuestraOpen}
        apiarios={detalle.colmena?.apiario_id ? [{ id: detalle.colmena.apiario_id, name: detalle.colmena.apiario_name }] : []}
        apiarioIdFijo={detalle.colmena?.apiario_id ?? null}
        initial={muestraEditando}
      />
      <NodoManualForm open={nodoOpen} onOpenChange={setNodoOpen} colmenaIdFijo={detalle.hoja.colmena_id} initial={nodoEditando} />
      {pendienteArista && (
        <AristaForm
          open={aristaOpen}
          onOpenChange={setAristaOpen}
          sourceId={pendienteArista.source}
          sourceLabel={pendienteArista.sourceLabel}
          targetId={pendienteArista.target}
          targetLabel={pendienteArista.targetLabel}
          onSaved={() => setPendienteArista(null)}
        />
      )}
    </div>
  );
}
