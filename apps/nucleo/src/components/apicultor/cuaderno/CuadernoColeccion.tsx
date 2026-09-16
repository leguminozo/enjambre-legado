'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Search, Warehouse } from 'lucide-react';
import { Button, DropdownMenu, DropdownMenuItem, DropdownMenuSeparator, EmptyState, Input, Select, toast } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { HojaCuaderno, NodoRedCuaderno, RedCuaderno, TratamientoRow, MuestraRow, NodoManualRow } from '@/lib/bitacora-types';
import type { VarroaRow } from '@/lib/apicultor-types';
import { FASES_BITACORA } from '@/lib/bitacora-types';
import { FASE_LABEL } from '../bitacora-labels';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import { HOJA_PLANTILLAS } from './labels';
import { EscenaHud } from './EscenaHud';
import { HojaCard } from './HojaCard';
import { HojaForm } from './HojaForm';
import { VarroaForm } from './VarroaForm';
import { TratamientoForm } from './TratamientoForm';
import { MuestraForm } from './MuestraForm';
import { NodoManualForm } from './NodoManualForm';
import { AristaForm } from './AristaForm';
import { LienzoSemantico, type LayoutRed } from './LienzoSemantico';
import { PanelDetalleNodo } from './PanelDetalleNodo';
import { DockEscena } from './DockEscena';
import { RailCampo } from './RailCampo';
import { ViewShell } from '@/components/layout/ViewShell';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';

interface CuadernoColeccionProps {
  /** Presente cuando se monta dentro del tab de ApicultorView. */
  colmenas?: ColmenaWithRelations[];
  hideHeader?: boolean;
}

interface HojasResponse {
  data: HojaCuaderno[];
  meta: { total: number; colmenas: { id: string; name: string | null }[]; apiarios: { id: string; name: string | null }[] };
}

const ENDPOINT_ELIMINAR: Partial<Record<NodoRedCuaderno['kind'], string>> = {
  hoja: 'inspecciones',
  tratamiento: 'tratamientos',
  varroa: 'varroa',
  muestra: 'muestras',
  manual: 'nodos',
};

function AccionesCuadernoMenu({
  onHoja,
  onVarroa,
  onTratamiento,
  onMuestra,
}: {
  onHoja: (plantilla: (typeof HOJA_PLANTILLAS)[number] | null) => void;
  onVarroa: () => void;
  onTratamiento: () => void;
  onMuestra: () => void;
}) {
  return (
    <DropdownMenu
      trigger={
        <Button className="rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest">
          <Plus className="size-3.5 mr-1" /> Nueva hoja <ChevronDown className="size-3 ml-1" />
        </Button>
      }
    >
      <DropdownMenuItem onSelect={() => onHoja(null)}>Hoja en blanco</DropdownMenuItem>
      <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Plantillas</div>
      {HOJA_PLANTILLAS.map((p) => (
        <DropdownMenuItem key={p.id} onSelect={() => onHoja(p)}>
          {p.label}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Registro sanitario</div>
      <DropdownMenuItem onSelect={onVarroa}>Monitoreo varroa</DropdownMenuItem>
      <DropdownMenuItem onSelect={onTratamiento}>Tratamiento</DropdownMenuItem>
      <DropdownMenuItem onSelect={onMuestra}>Muestra de laboratorio</DropdownMenuItem>
    </DropdownMenu>
  );
}

/** Colección del cuaderno de campo: cada hoja es un "estudio" de la red
 *  semántica (workflow RSN de Trama adaptado). */
export function CuadernoColeccion({ colmenas, hideHeader }: CuadernoColeccionProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [vista, setVista] = useState<'hojas' | 'red'>('hojas');
  const [filtroFase, setFiltroFase] = useState('');
  const [filtroColmena, setFiltroColmena] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Forms
  const [hojaOpen, setHojaOpen] = useState(false);
  const [plantillaActiva, setPlantillaActiva] = useState<(typeof HOJA_PLANTILLAS)[number] | null>(null);
  const [hojaEditando, setHojaEditando] = useState<HojaCuaderno | null>(null);
  const [varroaOpen, setVarroaOpen] = useState(false);
  const [varroaEditando, setVarroaEditando] = useState<VarroaRow | null>(null);
  const [tratamientoOpen, setTratamientoOpen] = useState(false);
  const [tratamientoEditando, setTratamientoEditando] = useState<TratamientoRow | null>(null);
  const [muestraOpen, setMuestraOpen] = useState(false);
  const [muestraEditando, setMuestraEditando] = useState<MuestraRow | null>(null);
  const [nodoOpen, setNodoOpen] = useState(false);
  const [nodoEditando, setNodoEditando] = useState<Omit<NodoManualRow, 'user_id'> | null>(null);
  const [aristaOpen, setAristaOpen] = useState(false);
  const [modoConectar, setModoConectar] = useState(false);
  const [conectarOrigen, setConectarOrigen] = useState<string | null>(null);
  const [pendienteArista, setPendienteArista] = useState<{ source: string; sourceLabel: string; target: string; targetLabel: string } | null>(null);

  // Lienzo
  const [layout, setLayout] = useState<LayoutRed>('radial');
  const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoRedCuaderno | null>(null);
  const [redLocal, setRedLocal] = useState<RedCuaderno | null>(null);

  // Colmena pre-seleccionada al crear hoja desde un nodo de la red
  const [colmenaSeleccionadaNuevaHoja, setColmenaSeleccionadaNuevaHoja] = useState<string | null>(null);

  const { data: hojasData, isLoading: cargandoHojas } = useQuery<HojasResponse>({
    queryKey: ['bitacora-hojas'],
    queryFn: async () => {
      const res = await apiFetch('/api/bitacora/hojas');
      if (!res.ok) throw new Error('Error cargando hojas');
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: redData } = useQuery<RedCuaderno>({
    queryKey: ['bitacora-red'],
    queryFn: async () => {
      const res = await apiFetch('/api/bitacora/red');
      if (!res.ok) throw new Error('Error cargando red');
      const json = await res.json();
      return json.data ?? json;
    },
    staleTime: 30_000,
    enabled: vista === 'red',
  });

  // Consulta directa a supabase cuando el prop `colmenas` está vacío o ausente
  const { data: directColmenasData } = useQuery<{ id: string; name: string | null }[]>({
    queryKey: ['cuaderno-colmenas-direct'],
    queryFn: async () => {
      const { data, error } = await supabase.from('colmenas').select('id, name').order('name', { ascending: true });
      if (error) return [];
      return (data ?? []).map((c: { id: string; name: string | null }) => ({ id: c.id, name: c.name ?? null }));
    },
    staleTime: 30_000,
    enabled: !colmenas || colmenas.length === 0,
  });

  const { data: directApiariosData } = useQuery<{ id: string; name: string | null }[]>({
    queryKey: ['cuaderno-apiarios-direct'],
    queryFn: async () => {
      const { data, error } = await supabase.from('apiarios').select('id, name').order('name', { ascending: true });
      if (error) return [];
      return (data ?? []).map((a: { id: string; name: string | null }) => ({ id: a.id, name: a.name ?? null }));
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (redData) setRedLocal(redData);
  }, [redData]);

  const hojas = hojasData?.data ?? [];

  const colmenasForm = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const c of colmenas ?? []) {
      if (c.id) map.set(c.id, c.name ?? null);
    }
    for (const c of hojasData?.meta.colmenas ?? []) {
      if (c.id) map.set(c.id, c.name ?? null);
    }
    for (const c of directColmenasData ?? []) {
      if (c.id) map.set(c.id, c.name ?? null);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [colmenas, hojasData?.meta.colmenas, directColmenasData]);

  const apiariosForm = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const a of hojasData?.meta.apiarios ?? []) {
      if (a.id) map.set(a.id, a.name ?? null);
    }
    for (const a of directApiariosData ?? []) {
      if (a.id) map.set(a.id, a.name ?? null);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [hojasData?.meta.apiarios, directApiariosData]);

  const hojasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return hojas.filter((h) => {
      if (filtroFase && h.fase !== filtroFase) return false;
      if (filtroColmena && h.colmena_id !== filtroColmena) return false;
      if (q) {
        const texto = `${h.colmena?.name ?? ''} ${h.apiario_name ?? ''} ${h.notes ?? ''}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [hojas, filtroFase, filtroColmena, busqueda]);

  const brechasColmenaIds = useMemo(
    () => new Set((redLocal?.meta.brechas ?? []).map((b) => b.colmena_id)),
    [redLocal],
  );

  const abrirNuevaHoja = (plantilla: (typeof HOJA_PLANTILLAS)[number] | null, colmenaId?: string | null) => {
    setHojaEditando(null);
    setPlantillaActiva(plantilla);
    setColmenaSeleccionadaNuevaHoja(colmenaId ?? null);
    setHojaOpen(true);
  };

  const eliminarHoja = async (hoja: HojaCuaderno) => {
    if (!confirm(`¿Eliminar la hoja del ${hoja.date} de "${hoja.colmena?.name ?? 'colmena'}"? Esta acción no se puede deshacer.`)) return;
    const res = await apiFetch(`/api/bitacora/inspecciones/${hoja.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast(json.message ?? 'No se pudo eliminar la hoja', { type: 'error' });
      return;
    }
    toast('Hoja eliminada', { type: 'success' });
    queryClient.invalidateQueries({ queryKey: ['bitacora-hojas'] });
    queryClient.invalidateQueries({ queryKey: ['bitacora-red'] });
  };

  const eliminarRegistro = useMutation({
    mutationFn: async ({ tipo, rid }: { tipo: NodoRedCuaderno['kind']; rid: string }) => {
      const endpoint = ENDPOINT_ELIMINAR[tipo];
      if (!endpoint) throw new Error('Este nodo no se puede eliminar desde aquí');
      const res = await apiFetch(`/api/bitacora/${endpoint}/${rid}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message ?? 'No se pudo eliminar');
      }
      return { tipo, rid };
    },
    onSuccess: ({ tipo }) => {
      toast(tipo === 'hoja' ? 'Hoja eliminada' : 'Registro eliminado', { type: 'success' });
      setNodoSeleccionado(null);
      queryClient.invalidateQueries({ queryKey: ['bitacora-hojas'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-red'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-hoja'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-varroa'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-tratamientos'] });
      queryClient.invalidateQueries({ queryKey: ['bitacora-muestras'] });
    },
    onError: (e) => toast(e.message, { type: 'error' }),
  });

  const moverNodo = async (id: string, x: number, y: number) => {
    setRedLocal((prev) => {
      if (!prev) return prev;
      return { ...prev, nodos: prev.nodos.map((n) => (n.id === id ? { ...n, x, y } : n)) };
    });
    const res = await apiFetch(`/api/bitacora/nodos/${id}`, { method: 'PATCH', body: JSON.stringify({ x, y }) });
    if (!res.ok) toast('No se pudo guardar la posición', { type: 'error' });
  };

  const tapLienzo = (nodo: NodoRedCuaderno | null) => {
    // En modo conectar, tocar el fondo cancela el origen pendiente
    if (modoConectar && !nodo) {
      setConectarOrigen(null);
      return;
    }
    setNodoSeleccionado(nodo);
  };

  const tapConectar = (id: string) => {
    if (!conectarOrigen) {
      setConectarOrigen(id); // primer tap: origen
      return;
    }
    if (conectarOrigen === id) {
      setConectarOrigen(null); // deseleccionar
      return;
    }
    const origen = redLocal?.nodos.find((n) => n.id === conectarOrigen);
    const destino = redLocal?.nodos.find((n) => n.id === id);
    setPendienteArista({
      source: conectarOrigen,
      sourceLabel: origen?.label ?? '',
      target: id,
      targetLabel: destino?.label ?? '',
    });
    setConectarOrigen(null);
    setModoConectar(false);
    setAristaOpen(true);
  };

  const iniciarConectar = () => {
    setModoConectar((prev) => !prev);
    setConectarOrigen(null);
    setNodoSeleccionado(null);
  };

  const abrirVarroa = (initial: VarroaRow | null = null) => {
    setVarroaEditando(initial);
    setVarroaOpen(true);
  };
  const abrirTratamiento = (initial: TratamientoRow | null = null) => {
    setTratamientoEditando(initial);
    setTratamientoOpen(true);
  };
  const abrirMuestra = (initial: MuestraRow | null = null) => {
    setMuestraEditando(initial);
    setMuestraOpen(true);
  };

  const cargarRegistro = async <T,>(path: string, id: string): Promise<T | null> => {
    const res = await apiFetch(`/api/bitacora/${path}/${id}`);
    if (!res.ok) return null;
    const json = await res.json().catch(() => ({}));
    return (json.data ?? null) as T | null;
  };

  const editarNodoRed = async (nodo: NodoRedCuaderno) => {
    if (nodo.kind === 'manual') {
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
      return;
    }
    if (nodo.kind === 'hoja') {
      const hoja = hojas.find((h) => h.id === nodo.id);
      if (hoja) {
        setHojaEditando(hoja);
        setPlantillaActiva(null);
        setHojaOpen(true);
      } else {
        router.push(`/colmenas/cuaderno/${nodo.id}`);
      }
      return;
    }
    if (nodo.kind === 'varroa') {
      const row = await cargarRegistro<VarroaRow>('varroa', nodo.id);
      if (!row) {
        toast('No se encontró el monitoreo', { type: 'error' });
        return;
      }
      abrirVarroa(row);
      return;
    }
    if (nodo.kind === 'tratamiento') {
      const row = await cargarRegistro<TratamientoRow>('tratamientos', nodo.id);
      if (!row) {
        toast('No se encontró el tratamiento', { type: 'error' });
        return;
      }
      abrirTratamiento(row);
      return;
    }
    if (nodo.kind === 'muestra') {
      const row = await cargarRegistro<MuestraRow>('muestras', nodo.id);
      if (!row) {
        toast('No se encontró la muestra', { type: 'error' });
        return;
      }
      abrirMuestra(row);
    }
  };

  const confirmarEliminarNodo = (nodo: NodoRedCuaderno) => {
    if (!ENDPOINT_ELIMINAR[nodo.kind]) {
      toast('Este nodo no se puede eliminar desde aquí', { type: 'info' });
      return;
    }
    if (!confirm(`¿Eliminar "${nodo.label}"? Esta acción no se puede deshacer.`)) return;
    eliminarRegistro.mutate({ tipo: nodo.kind, rid: nodo.id });
  };

  const conteos = redLocal?.meta.conteos ?? {};
  const brechas = redLocal?.meta.brechas ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Canónico (patrón limpio editorial con controles en actions) */}
      {!hideHeader ? (
        <ViewShell
          variant="clean"
          title="Cuaderno de Campo"
          subtitle="La red viva de tus colmenas: cada hoja registra una visita y se conecta con su historia sanitaria, su linaje y lo que aún no se ha registrado."
          actions={
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/colmenas')}
                className="rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
              >
                <Warehouse className="size-3.5 mr-1" /> Colmenas
              </Button>
              <div className="flex items-center rounded-xl border border-border/60 overflow-hidden">
                {(['hojas', 'red'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVista(v)}
                    className={cn(
                      'px-4 h-9 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                      vista === v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                    )}
                  >
                    {v === 'hojas' ? 'Hojas' : 'Red'}
                  </button>
                ))}
              </div>
              <AccionesCuadernoMenu
                onHoja={(p) => abrirNuevaHoja(p)}
                onVarroa={() => abrirVarroa()}
                onTratamiento={() => abrirTratamiento()}
                onMuestra={() => abrirMuestra()}
              />
            </div>
          }
        />
      ) : (
        <div className="flex justify-end gap-2 shrink-0">
          <div className="flex items-center rounded-xl border border-border/60 overflow-hidden">
            {(['hojas', 'red'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={cn(
                  'px-4 h-9 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  vista === v ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                )}
              >
                {v === 'hojas' ? 'Hojas' : 'Red'}
              </button>
            ))}
          </div>
          <AccionesCuadernoMenu
            onHoja={(p) => abrirNuevaHoja(p)}
            onVarroa={() => abrirVarroa()}
            onTratamiento={() => abrirTratamiento()}
            onMuestra={() => abrirMuestra()}
          />
        </div>
      )}

      <RailCampo
        onNuevaHoja={() => abrirNuevaHoja(null)}
        onVarroa={() => abrirVarroa()}
        onTratamiento={() => abrirTratamiento()}
        onMuestra={() => abrirMuestra()}
        onNodo={() => {
          setNodoEditando(null);
          setNodoOpen(true);
        }}
        onConectar={iniciarConectar}
        conectando={modoConectar}
      />

      {/* HUD de la red */}
      {vista === 'red' && (
        <EscenaHud
          metricas={[
            { label: 'Colmenas', value: String(conteos.colmenas ?? 0) },
            { label: 'Hojas', value: String(conteos.hojas ?? 0) },
            { label: 'Tratamientos', value: String(conteos.tratamientos ?? 0) },
            { label: 'Varroa', value: String(conteos.varroa ?? 0) },
            { label: 'Nodos manuales', value: String(conteos.nodos_manuales ?? 0) },
            { label: 'Brechas', value: String(brechas.length), tone: brechas.length > 0 ? 'warning' : 'success' },
          ]}
        />
      )}



      {vista === 'hojas' ? (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={filtroFase}
              onValueChange={setFiltroFase}
              options={[{ value: '', label: 'Todas las fases' }, ...FASES_BITACORA.map((f) => ({ value: f, label: FASE_LABEL[f] }))]}
              className="w-56"
            />
            <Select
              value={filtroColmena}
              onValueChange={setFiltroColmena}
              options={[{ value: '', label: 'Todas las colmenas' }, ...colmenasForm.map((c) => ({ value: c.id, label: c.name ?? 'Sin nombre' }))]}
              searchable
              className="w-64"
            />
            <div className="relative flex-1 min-w-[14rem]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por colmena, apiario o notas…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
          </div>

          {cargandoHojas ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Cargando hojas…</p>
          ) : hojasFiltradas.length === 0 ? (
            <EmptyState
              theme="bosque"
              title={hojas.length === 0 ? 'Tu cuaderno está listo para comenzar' : 'Sin hojas para esta búsqueda'}
              description={
                hojas.length === 0
                  ? 'Registra tu primera visita, monitoreo de postura o tratamiento orgánico. Cada entrada enriquece la historia viva de tus colmenas.'
                  : 'Prueba buscando con otros términos o limpia el filtro de búsqueda.'
              }
              suggestion={hojas.length === 0 ? 'Puedes iniciar con una revisión general del estado de la cría o las reservas de miel.' : undefined}
              action={<Button onClick={() => abrirNuevaHoja(null)}><Plus className="size-4 mr-1" /> Nueva entrada de bitácora</Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {hojasFiltradas.map((h) => (
                <HojaCard
                  key={h.id}
                  hoja={h}
                  onVer={(id) => router.push(`/colmenas/cuaderno/${id}`)}
                  onEditar={(hoja) => {
                    setHojaEditando(hoja);
                    setPlantillaActiva(null);
                    setHojaOpen(true);
                  }}
                  onEliminar={eliminarHoja}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Vista Red: lienzo semántico global */
        <div className="relative h-[calc(var(--vh-full)-340px)] min-h-[420px] rounded-2xl border border-border/60 bg-card overflow-hidden">
          <LienzoSemantico
            nodos={redLocal?.nodos ?? []}
            aristas={redLocal?.aristas ?? []}
            layout={layout}
            resaltarColmenas={brechasColmenaIds}
            nodoSeleccionadoId={nodoSeleccionado?.id ?? null}
            modoConectar={modoConectar}
            onSelect={tapLienzo}
            onMoveManual={moverNodo}
            onConectarNodo={tapConectar}
          />
          <PanelDetalleNodo
            nodo={nodoSeleccionado}
            onClose={() => setNodoSeleccionado(null)}
            onEditar={editarNodoRed}
            onEliminar={confirmarEliminarNodo}
            onConectar={(nodo) => {
              setModoConectar(true);
              setConectarOrigen(nodo.id);
              setNodoSeleccionado(null);
            }}
            onNuevaHoja={(colmenaId) => {
              setNodoSeleccionado(null);
              abrirNuevaHoja(null, colmenaId);
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
              onConectar={iniciarConectar}
              conectando={modoConectar}
              onNodo={() => {
                setNodoEditando(null);
                setNodoOpen(true);
              }}
              onVarroa={() => abrirVarroa()}
              onTratamiento={() => abrirTratamiento()}
              onMuestra={() => abrirMuestra()}
              onNuevaHoja={() => abrirNuevaHoja(null)}
            />
          </div>
          {modoConectar && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-full border border-primary/40 bg-background/90 backdrop-blur px-4 py-1.5 text-[11px] font-semibold text-primary whitespace-nowrap">
              {conectarOrigen ? 'Toca el nodo de destino…' : 'Toca el nodo de origen…'}
            </div>
          )}
        </div>
      )}

      {/* Formularios */}
      <HojaForm
        open={hojaOpen}
        onOpenChange={(o) => {
          setHojaOpen(o);
          if (!o) setColmenaSeleccionadaNuevaHoja(null);
        }}
        colmenas={colmenasForm}
        colmenaIdFijo={colmenaSeleccionadaNuevaHoja}
        plantilla={plantillaActiva}
        initial={hojaEditando}
      />
      <VarroaForm
        open={varroaOpen}
        onOpenChange={(o) => {
          setVarroaOpen(o);
          if (!o) setVarroaEditando(null);
        }}
        colmenas={colmenasForm}
        initial={varroaEditando}
      />
      <TratamientoForm
        open={tratamientoOpen}
        onOpenChange={(o) => {
          setTratamientoOpen(o);
          if (!o) setTratamientoEditando(null);
        }}
        colmenas={colmenasForm}
        initial={tratamientoEditando}
      />
      <MuestraForm
        open={muestraOpen}
        onOpenChange={(o) => {
          setMuestraOpen(o);
          if (!o) setMuestraEditando(null);
        }}
        apiarios={apiariosForm}
        initial={muestraEditando}
      />
      <NodoManualForm open={nodoOpen} onOpenChange={setNodoOpen} colmenas={colmenasForm} initial={nodoEditando} />
      {pendienteArista && (
        <AristaForm
          open={aristaOpen}
          onOpenChange={setAristaOpen}
          sourceId={pendienteArista.source}
          sourceLabel={pendienteArista.sourceLabel}
          targetId={pendienteArista.target}
          targetLabel={pendienteArista.targetLabel}
          onSaved={() => {
            setPendienteArista(null);
            setConectarOrigen(null);
          }}
        />
      )}
    </div>
  );
}
