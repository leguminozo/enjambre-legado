'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, FileText, History, Network, Hexagon, ChevronLeft, ChevronRight, Printer, Trash2, MoreVertical } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { HojaDetalle, HojaCuaderno, NodoRedCuaderno, RedCuaderno, TratamientoRow, MuestraRow, NodoManualRow } from '@/lib/bitacora-types';
import type { VarroaRow } from '@/lib/apicultor-types';
import { faseLabel } from './labels';
import { FASE_LABEL, CUERPO_LABEL, TIPO_CUADRO_LABEL } from '../bitacora-labels';
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

/** Escena de una hoja de visita: Reporte clínico claro + historial + mapa relacional. */
export function EscenaHoja({ id }: EscenaHojaProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [vista, setVista] = useState<'reporte' | 'historial' | 'red'>('reporte');
  const [layout, setLayout] = useState<LayoutRed>('radial');
  const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoRedCuaderno | null>(null);
  const [analisisOpen, setAnalisisOpen] = useState(false);
  const [redLocal, setRedLocal] = useState<RedCuaderno | null>(null);
  const [modoConectar, setModoConectar] = useState(false);
  const [conectarOrigen, setConectarOrigen] = useState<string | null>(null);
  const [pendienteArista, setPendienteArista] = useState<{ source: string; sourceLabel: string; target: string; targetLabel: string } | null>(null);

  // Forms
  const [hojaOpen, setHojaOpen] = useState(false);
  const [editandoHojaActual, setEditandoHojaActual] = useState(false);
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
      const json = await res.json();
      return json.data ?? json;
    },
    staleTime: 15_000,
  });

  const colmenaId = detalle?.hoja?.colmena_id ?? null;

  const { data: hojasColmena } = useQuery<HojasColmenaResponse>({
    queryKey: ['bitacora-hojas-colmena', colmenaId],
    queryFn: async () => {
      const res = await apiFetch(`/api/bitacora/hojas?colmena_id=${colmenaId}`);
      if (!res.ok) throw new Error('Error cargando hojas');
      return res.json();
    },
    enabled: Boolean(colmenaId),
  });

  const navegacionHojas = useMemo(() => {
    const lista = hojasColmena?.data ?? [];
    if (lista.length <= 1) return null;
    const index = lista.findIndex((h) => h.id === id);
    if (index === -1) return null;
    return {
      anterior: index + 1 < lista.length ? lista[index + 1] : null,
      siguiente: index - 1 >= 0 ? lista[index - 1] : null,
      posicion: lista.length - index,
      total: lista.length,
    };
  }, [hojasColmena?.data, id]);

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
      if (!t) {
        toast('No se encontró el tratamiento', { type: 'error' });
        return;
      }
      setTratamientoEditando(t);
      setTratamientoOpen(true);
    } else if (nodo.kind === 'varroa') {
      const v = detalle?.varroa.find((x) => x.id === nodo.id) ?? null;
      if (!v) {
        toast('No se encontró el monitoreo', { type: 'error' });
        return;
      }
      setVarroaEditando(v);
      setVarroaOpen(true);
    } else if (nodo.kind === 'muestra') {
      const m = detalle?.muestras.find((x) => x.id === nodo.id) ?? null;
      if (!m) {
        toast('No se encontró la muestra', { type: 'error' });
        return;
      }
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
      setEditandoHojaActual(true);
      setHojaOpen(true);
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
      {/* Barra superior de navegación y paginación entre visitas */}
      <div className="flex items-center justify-between gap-3 text-xs border-b border-border/50 pb-2.5">
        <button
          type="button"
          onClick={() => router.push('/colmenas/cuaderno')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group py-1"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5 text-primary" />
          <span>Volver al cuaderno de campo</span>
        </button>

        {navegacionHojas && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-muted-foreground mr-1">
              Visita {navegacionHojas.posicion} de {navegacionHojas.total}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!navegacionHojas.anterior}
              onClick={() => navegacionHojas.anterior && router.push(`/colmenas/cuaderno/${navegacionHojas.anterior.id}`)}
              title={navegacionHojas.anterior ? `Visita previa: ${navegacionHojas.anterior.date}` : 'Sin visitas previas'}
              className="h-7 px-2.5 text-[11px] font-semibold rounded-lg"
            >
              <ChevronLeft className="size-3 mr-0.5" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!navegacionHojas.siguiente}
              onClick={() => navegacionHojas.siguiente && router.push(`/colmenas/cuaderno/${navegacionHojas.siguiente.id}`)}
              title={navegacionHojas.siguiente ? `Visita siguiente: ${navegacionHojas.siguiente.date}` : 'Es la visita más reciente'}
              className="h-7 px-2.5 text-[11px] font-semibold rounded-lg"
            >
              Siguiente <ChevronRight className="size-3 ml-0.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Header clínico de la escena */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
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
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl text-[10px] font-semibold uppercase tracking-wider"
            onClick={() => {
              setEditandoHojaActual(true);
              setHojaOpen(true);
            }}
          >
            <Pencil className="size-3 mr-1" /> Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl text-[10px] font-semibold uppercase tracking-wider hidden sm:inline-flex"
            onClick={() => window.print()}
            title="Imprimir ficha de visita foliada"
          >
            <Printer className="size-3 mr-1" /> Imprimir
          </Button>
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="h-8 w-8 shrink-0 rounded-xl border border-border/60 hover:bg-muted/40 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                title="Opciones de la hoja"
              >
                <MoreVertical className="size-3.5" />
              </button>
            }
            align="start"
          >
            <DropdownMenuItem onSelect={() => { setEditandoHojaActual(true); setHojaOpen(true); }}>
              <Pencil className="size-3.5 mr-2" /> Editar hoja
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => window.print()}>
              <Printer className="size-3.5 mr-2" /> Imprimir ficha
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => {
                if (confirm(`¿Eliminar la hoja de visita del ${hoja.date}? Esta acción no se puede deshacer.`)) {
                  eliminarRegistro.mutate({ tipo: 'hoja', rid: id });
                }
              }}
            >
              <Trash2 className="size-3.5 mr-2" /> Eliminar hoja
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
        <EscenaHud
          metricas={[
            {
              label: 'Cría / Miel',
              value: (hoja.marcos_cria != null || hoja.marcos_miel != null)
                ? `${hoja.marcos_cria ?? 0}/${hoja.marcos_miel ?? 0} cuadros`
                : '—',
            },
            {
              label: 'Varroa',
              value: hoja.varroa != null ? `${hoja.varroa}/10` : '—',
              tone: hoja.varroa != null && hoja.varroa > 3 ? 'danger' : hoja.varroa != null && hoja.varroa > 1.5 ? 'warning' : 'success',
            },
            {
              label: 'Población',
              value: hoja.poblacion === 'alta' ? 'Alta' : hoja.poblacion === 'media' ? 'Media' : hoja.poblacion === 'baja' ? 'Baja' : (hoja.poblacion || '—'),
            },
            { label: 'Cuadros', value: String(hoja.inspeccion_cuadros?.length ?? 0) },
            { label: 'Tratamientos', value: String(detalle.tratamientos.length) },
            { label: 'Alertas', value: String(brechas.length), tone: brechas.length > 0 ? 'warning' : 'success' },
          ]}
        />
      </div>

      {/* Switcher de vista: Reporte Clínico (default) / Historial / Mapa Relacional */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border/60 pb-3">
        <div className="flex items-center p-1 rounded-xl border border-border/60 bg-surface-sunken/60 gap-1">
          <button
            type="button"
            onClick={() => setVista('reporte')}
            className={cn(
              'px-3.5 h-8 text-[11px] font-semibold uppercase tracking-wider transition-all rounded-lg flex items-center gap-1.5',
              vista === 'reporte'
                ? 'bg-card text-foreground font-bold shadow-xs border border-border/70'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <FileText className="size-3.5" />
            Reporte de visita
          </button>
          <button
            type="button"
            onClick={() => setVista('historial')}
            className={cn(
              'px-3.5 h-8 text-[11px] font-semibold uppercase tracking-wider transition-all rounded-lg flex items-center gap-1.5',
              vista === 'historial'
                ? 'bg-card text-foreground font-bold shadow-xs border border-border/70'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <History className="size-3.5" />
            Historial de visitas
          </button>
          <button
            type="button"
            onClick={() => setVista('red')}
            className={cn(
              'px-3.5 h-8 text-[11px] font-semibold uppercase tracking-wider transition-all rounded-lg flex items-center gap-1.5',
              vista === 'red'
                ? 'bg-card text-foreground font-bold shadow-xs border border-border/70'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <Network className="size-3.5" />
            Mapa relacional
          </button>
        </div>

        {vista !== 'red' && (
          <RailCampo
            onNuevaHoja={() => {
              setEditandoHojaActual(false);
              setHojaOpen(true);
            }}
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
          />
        )}
      </div>

      {vista === 'reporte' && (
        <div className="space-y-4">
          {/* Tarjetas resumen de estado biológico y sanitario */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/80">Estado Biológico</span>
                {hoja.fase && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    {FASE_LABEL[hoja.fase as keyof typeof FASE_LABEL] ?? hoja.fase}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <div className="text-lg font-bold font-mono text-foreground">
                    {hoja.marcos_cria != null ? hoja.marcos_cria : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Cuadros de cría</div>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <div className="text-lg font-bold font-mono text-foreground">
                    {hoja.marcos_miel != null ? hoja.marcos_miel : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Cuadros de miel</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Población / Vigor:</span>
                <span className="font-semibold text-foreground capitalize">
                  {hoja.poblacion === 'alta' ? 'Alta' : hoja.poblacion === 'media' ? 'Media' : hoja.poblacion === 'baja' ? 'Baja' : (hoja.poblacion || 'No evaluada')}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/80">Sanidad en la Visita</span>
                {hoja.varroa != null ? (
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                    hoja.varroa > 3 ? 'text-destructive bg-destructive/10 border-destructive/30' :
                    hoja.varroa > 1.5 ? 'text-warning bg-warning/10 border-warning/30' :
                    'text-success bg-success/10 border-success/30'
                  )}>
                    {hoja.varroa > 3 ? 'Umbral Crítico' : hoja.varroa > 1.5 ? 'Vigilancia' : 'Óptimo'}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Sin muestreo</span>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-center">
                <div className="text-lg font-bold font-mono text-foreground">
                  {hoja.varroa != null ? `${hoja.varroa} / 10` : '—'}
                </div>
                <div className="text-[10px] text-muted-foreground">Índice Varroa destructor</div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Tratamientos registrados:</span>
                <span className="font-semibold text-foreground">
                  {detalle.tratamientos.length > 0 ? `${detalle.tratamientos.length} aplicado(s)` : 'Ninguno'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/80">Colmena Vinculada</span>
                <div className="mt-2">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-1.5">
                    <Hexagon className="size-4 text-primary shrink-0" />
                    <span>{detalle.colmena?.name ?? 'Colmena'}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{detalle.colmena?.apiario_name ?? 'Sin apiario asignado'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/colmenas')}
                  className="w-full text-xs font-semibold"
                >
                  Ver ficha completa de colmena →
                </Button>
              </div>
            </div>
          </div>

          {/* Grid inferior: Inspección anatómica y Notas / Intervenciones */}
          <div className="grid gap-4 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7 space-y-4">
              {/* Inspección Anatómica de Cuadros */}
              <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">Inspección Anatómica de Cuadros</h3>
                    <p className="text-[11px] text-muted-foreground">Estado biológico cuadro por cuadro verificado durante la revisión.</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {hoja.inspeccion_cuadros?.length ?? 0} cuadros registrados
                  </span>
                </div>

                {(!hoja.inspeccion_cuadros || hoja.inspeccion_cuadros.length === 0) ? (
                  <div className="p-8 text-center rounded-xl bg-muted/20 border border-dashed border-border/60 flex flex-col items-center justify-center gap-2.5">
                    <p className="text-xs text-muted-foreground">No se registraron cuadros individuales en esta visita.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold"
                      onClick={() => {
                        setEditandoHojaActual(true);
                        setHojaOpen(true);
                      }}
                    >
                      <Pencil className="size-3 mr-1.5" /> Registrar cuadros en esta visita
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {hoja.inspeccion_cuadros.map((cq) => (
                      <div key={cq.id} className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-primary mr-1.5">#{cq.posicion}</span>
                          <span className="text-xs text-foreground font-medium">{CUERPO_LABEL[cq.cuerpo] ?? cq.cuerpo}</span>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {TIPO_CUADRO_LABEL[cq.tipo] ?? cq.tipo}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {/* Acciones Sanitarias y Muestras */}
              {(detalle.tratamientos.length > 0 || detalle.muestras.length > 0) && (
                <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">Intervenciones Sanitarias en esta Fecha</h3>
                  <div className="space-y-2">
                    {detalle.tratamientos.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-foreground">{t.producto_comercial || t.principio_activo}</span>
                          <span className="text-muted-foreground ml-1.5">· {t.principio_activo} (dosis: {t.dosis_aplicada || 'estándar'})</span>
                        </div>
                        {t.retiro_fin && (
                          <span className="badge badge-gold text-[10px]">Retiro hasta {t.retiro_fin}</span>
                        )}
                      </div>
                    ))}
                    {detalle.muestras.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-foreground">Muestra de laboratorio: {m.tipo}</span>
                          <span className="text-muted-foreground ml-1.5">· {m.fecha}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas de Campo */}
              <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">Notas y Observaciones de Campo</h3>
                  {!hoja.notes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditandoHojaActual(true);
                        setHojaOpen(true);
                      }}
                    >
                      <Pencil className="size-3 mr-1" /> Añadir nota
                    </Button>
                  )}
                </div>
                {hoja.notes ? (
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/30 p-3.5 rounded-xl border border-border/40">
                    {hoja.notes}
                  </p>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-muted/20 border border-dashed border-border/60">
                    <p className="text-xs text-muted-foreground italic">Sin notas u observaciones adicionales registradas en esta visita.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {vista === 'historial' && (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 mb-4">
            Historial de Visitas de {detalle.colmena?.name ?? 'la colmena'}
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
              <p className="text-sm text-muted-foreground py-6 text-center">Sin otras hojas registradas para esta colmena.</p>
            )}
          </div>
        </div>
      )}

      {vista === 'red' && (
        <div className="relative h-[calc(var(--vh-full)-380px)] min-h-[420px] rounded-2xl border border-border/60 bg-card overflow-hidden">
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
            onNuevaHoja={() => {
              setEditandoHojaActual(false);
              setHojaOpen(true);
            }}
            onAbrirColmena={() => router.push('/colmenas')}
            onAbrirApiario={() => router.push('/colmenas')}
            brechaDetalle={brechas.find((b) => b.colmena_id === nodoSeleccionado?.id)?.detalle ?? null}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-2">
            <DockEscena
              vista="red"
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
              onNuevaHoja={() => {
                setEditandoHojaActual(false);
                setHojaOpen(true);
              }}
            />
          </div>
          {modoConectar && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-full border border-primary/40 bg-background/90 backdrop-blur px-4 py-1.5 text-[11px] font-semibold text-primary whitespace-nowrap">
              {conectarOrigen ? 'Toca el nodo de destino…' : 'Toca el nodo de origen…'}
            </div>
          )}
        </div>
      )}

      {/* Sheets y formularios */}
      <AnalisisSheet open={analisisOpen} onOpenChange={setAnalisisOpen} detalle={detalle} />

      <HojaForm
        open={hojaOpen}
        onOpenChange={(o) => {
          setHojaOpen(o);
          if (!o) setEditandoHojaActual(false);
        }}
        colmenas={detalle.hoja.colmena_id ? [{ id: detalle.hoja.colmena_id, name: detalle.colmena?.name ?? null }] : []}
        colmenaIdFijo={detalle.hoja.colmena_id}
        initial={editandoHojaActual ? hojaComoCuaderno : null}
      />
      <VarroaForm
        open={varroaOpen}
        onOpenChange={(o) => {
          setVarroaOpen(o);
          if (!o) setVarroaEditando(null);
        }}
        colmenas={detalle.hoja.colmena_id ? [{ id: detalle.hoja.colmena_id, name: detalle.colmena?.name ?? null }] : []}
        colmenaIdFijo={detalle.hoja.colmena_id}
        initial={varroaEditando}
      />
      <TratamientoForm
        open={tratamientoOpen}
        onOpenChange={(o) => {
          setTratamientoOpen(o);
          if (!o) setTratamientoEditando(null);
        }}
        colmenas={detalle.hoja.colmena_id ? [{ id: detalle.hoja.colmena_id, name: detalle.colmena?.name ?? null }] : []}
        colmenaIdFijo={detalle.hoja.colmena_id}
        initial={tratamientoEditando}
      />
      <MuestraForm
        open={muestraOpen}
        onOpenChange={(o) => {
          setMuestraOpen(o);
          if (!o) setMuestraEditando(null);
        }}
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
