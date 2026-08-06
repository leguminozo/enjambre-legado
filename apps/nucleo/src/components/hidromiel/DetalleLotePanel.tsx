'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  MoneyInput,
  QRCode,
  Select,
  Switch,
  Textarea,
  toast,
} from '@enjambre/ui';
import { Check, Copy, Download, FlaskConical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { formatDate } from '@/lib/format';
import {
  ESTADOS_SUGERIDOS,
  INGREDIENTES_SUGERIDOS,
  TIPOS_MEDICION_SUGERIDOS,
  UNIDADES_SUGERIDAS,
  calcularABV,
  mielKgDesdeIngredientes,
} from '@/lib/hidromiel';
import { useHidromielDetalle } from '@/components/hidromiel/use-hidromiel-data';
import { CalculadoraABV, CalculadoraCostos, CalculadoraPriming } from '@/components/hidromiel/calculadoras';
import { CurvaMediciones } from '@/components/hidromiel/CurvaMediciones';
import type { HidromielEtapa, HidromielIngrediente, HidromielMedicion, LoteMielOpcion } from '@/components/hidromiel/types';

interface DetalleLotePanelProps {
  loteId: string;
  onClose: () => void;
  onDeleted: () => void;
}

function parseNum(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fechaLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ESTADO_VARIANTE: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'gold' | 'info'> = {
  fermentando: 'info',
  embotellado: 'default',
  carbonatando: 'warning',
  listo: 'success',
  degustado: 'gold',
  descartada: 'destructive',
};

function estadoVariant(estado: string): 'default' | 'success' | 'warning' | 'destructive' | 'gold' | 'info' {
  return ESTADO_VARIANTE[estado.toLowerCase()] ?? 'default';
}

interface ParamsDraft {
  volumen: string;
  densidadInicial: string;
  densidadFinal: string;
  levadura: string;
  temperatura: string;
  co2Target: string;
  presionTarget: string;
  nBotellas: string;
  notaPersonal: string;
  costoInsumos: number | null;
  costoEnvases: number | null;
  observaciones: string;
}

/** Panel completo de un lote: diario libre, instrumentos y pasaporte. */
export function DetalleLotePanel({ loteId, onClose, onDeleted }: DetalleLotePanelProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const { detalle, isLoading, refetch } = useHidromielDetalle(loteId);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['hidromiel'] });

  /* ── Estado (texto libre + sugerencias) ── */
  const [estadoDraft, setEstadoDraft] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  useEffect(() => {
    if (detalle) setEstadoDraft(detalle.lote.estado ?? '');
  }, [detalle?.lote.estado]);

  /* ── Parámetros editables ── */
  const [params, setParams] = useState<ParamsDraft | null>(null);
  const [guardandoParams, setGuardandoParams] = useState(false);
  useEffect(() => {
    if (detalle) {
      const l = detalle.lote;
      setParams({
        volumen: l.volumen_litros != null ? String(l.volumen_litros) : '',
        densidadInicial: l.densidad_inicial != null ? String(l.densidad_inicial) : '',
        densidadFinal: l.densidad_final != null ? String(l.densidad_final) : '',
        levadura: l.levadura_cepa ?? '',
        temperatura: l.temperatura_fermentacion != null ? String(l.temperatura_fermentacion) : '',
        co2Target: l.co2_target_vol != null ? String(l.co2_target_vol) : '',
        presionTarget: l.presion_target_bar != null ? String(l.presion_target_bar) : '',
        nBotellas: l.n_botellas != null ? String(l.n_botellas) : '',
        notaPersonal: l.nota_personal != null ? String(l.nota_personal) : '',
        costoInsumos: l.costo_insumos,
        costoEnvases: l.costo_envases,
        observaciones: l.observaciones ?? '',
      });
    }
  }, [detalle?.lote.id]);

  /* ── Trazabilidad y pasaporte ── */
  const [mielLoteId, setMielLoteId] = useState('');
  const [publico, setPublico] = useState(false);
  const [relato, setRelato] = useState('');
  useEffect(() => {
    if (detalle) {
      setMielLoteId(detalle.lote.miel_lote_id ?? '');
      setPublico(detalle.lote.publico);
      setRelato(detalle.lote.relato_publico ?? '');
    }
  }, [detalle?.lote.id]);

  /* ── Formularios hijos (flags separados: cada uno guarda su propio envío) ── */
  const [medicion, setMedicion] = useState({ tipo: '', valor: '', unidad: '', fecha: '', nota: '' });
  const [ingrediente, setIngrediente] = useState({ nombre: '', cantidad: '', unidad: '', nota: '' });
  const [etapa, setEtapa] = useState({ nombre: '', fecha: '', nota: '' });
  const [medicionEnviando, setMedicionEnviando] = useState(false);
  const [ingredienteEnviando, setIngredienteEnviando] = useState(false);
  const [etapaEnviando, setEtapaEnviando] = useState(false);

  /* ── Edición inline de registros ── */
  const [editandoMedicion, setEditandoMedicion] = useState<HidromielMedicion | null>(null);
  const [editandoIngrediente, setEditandoIngrediente] = useState<HidromielIngrediente | null>(null);
  const [editandoEtapa, setEditandoEtapa] = useState<HidromielEtapa | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const lotesMiel = useQuery<{ data: LoteMielOpcion[] }>({
    queryKey: ['produccion', 'lotes'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/lotes');
      if (!res.ok) throw new Error('Error cargando lotes de miel');
      return res.json();
    },
    staleTime: 60_000,
  });

  const opcionesMiel = useMemo(() => {
    const opciones = (lotesMiel.data?.data ?? []).map((l) => ({
      value: l.id,
      label: [l.nombre_lote, l.variedad_floral ? `· ${l.variedad_floral}` : '', l.kg_total != null ? `· ${l.kg_total} kg` : '']
        .filter(Boolean)
        .join(' '),
    }));
    return [{ value: '', label: 'Sin lote de miel (no vinculado)' }, ...opciones];
  }, [lotesMiel.data]);

  const abv = useMemo(() => {
    if (!detalle) return null;
    const { densidad_inicial, densidad_final } = detalle.lote;
    if (densidad_inicial == null || densidad_final == null) return null;
    return calcularABV(densidad_inicial, densidad_final);
  }, [detalle?.lote.densidad_inicial, detalle?.lote.densidad_final]);

  // Miel para costeo: derivada de la receta (nunca del volumen).
  const mielKg = useMemo(
    () => mielKgDesdeIngredientes(detalle?.ingredientes ?? []),
    [detalle?.ingredientes],
  );

  if (isLoading || !detalle || !params) {
    return (
      <div className="px-4 pb-6">
        <div className="animate-pulse rounded-2xl bg-surface-sunken h-40" />
      </div>
    );
  }

  const lote = detalle.lote;

  async function guardarEstado() {
    const nuevo = estadoDraft.trim();
    if (nuevo === '' || nuevo === lote.estado || guardandoEstado) return;
    setGuardandoEstado(true);
    try {
      const res = await apiFetch(`/api/hidromiel/lotes/${loteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error actualizando estado');
      toast.success('Estado actualizado');
      invalidar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error actualizando estado');
    } finally {
      setGuardandoEstado(false);
    }
  }

  async function guardarParams() {
    if (!params || guardandoParams) return;
    setGuardandoParams(true);
    try {
      const res = await apiFetch(`/api/hidromiel/lotes/${loteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volumen_litros: parseNum(params.volumen),
          densidad_inicial: parseNum(params.densidadInicial),
          densidad_final: parseNum(params.densidadFinal),
          levadura_cepa: params.levadura.trim() || null,
          temperatura_fermentacion: parseNum(params.temperatura),
          co2_target_vol: parseNum(params.co2Target),
          presion_target_bar: parseNum(params.presionTarget),
          n_botellas: parseNum(params.nBotellas),
          nota_personal: parseNum(params.notaPersonal),
          costo_insumos: params.costoInsumos ?? 0,
          costo_envases: params.costoEnvases ?? 0,
          observaciones: params.observaciones.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error guardando parámetros');
      toast.success('Parámetros guardados');
      invalidar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error guardando parámetros');
    } finally {
      setGuardandoParams(false);
    }
  }

  async function guardarPasaporte() {
    try {
      const res = await apiFetch(`/api/hidromiel/lotes/${loteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          miel_lote_id: mielLoteId || null,
          publico,
          relato_publico: relato.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error guardando pasaporte');
      toast.success(publico ? 'Pasaporte público activado' : 'Pasaporte privado');
      invalidar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error guardando pasaporte');
    }
  }

  /** PATCH genérico para mediciones / ingredientes / etapas. */
  async function guardarEdicion(path: string, body: Record<string, unknown>, okMsg: string) {
    if (guardandoEdicion) return false;
    setGuardandoEdicion(true);
    try {
      const res = await apiFetch(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error al guardar');
      toast.success(okMsg);
      invalidar();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
      return false;
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function guardarMedicionEdit() {
    if (!editandoMedicion) return;
    const ok = await guardarEdicion(`/api/hidromiel/mediciones/${editandoMedicion.id}`, {
      tipo: editandoMedicion.tipo.trim(),
      valor: editandoMedicion.valor,
      unidad: editandoMedicion.unidad?.trim() || null,
      nota: editandoMedicion.nota?.trim() || null,
    }, 'Medición actualizada');
    if (ok) setEditandoMedicion(null);
  }

  async function guardarIngredienteEdit() {
    if (!editandoIngrediente) return;
    const ok = await guardarEdicion(`/api/hidromiel/ingredientes/${editandoIngrediente.id}`, {
      nombre: editandoIngrediente.nombre.trim(),
      cantidad: editandoIngrediente.cantidad,
      unidad: editandoIngrediente.unidad?.trim() || null,
      nota: editandoIngrediente.nota?.trim() || null,
    }, 'Ingrediente actualizado');
    if (ok) setEditandoIngrediente(null);
  }

  async function guardarEtapaEdit() {
    if (!editandoEtapa) return;
    const ok = await guardarEdicion(`/api/hidromiel/etapas/${editandoEtapa.id}`, {
      nombre: editandoEtapa.nombre.trim(),
      nota: editandoEtapa.nota?.trim() || null,
    }, 'Etapa actualizada');
    if (ok) setEditandoEtapa(null);
  }

  async function agregarMedicion(e: React.FormEvent) {
    e.preventDefault();
    if (!medicion.tipo.trim() || medicionEnviando) return;
    setMedicionEnviando(true);
    try {
      const res = await apiFetch(`/api/hidromiel/lotes/${loteId}/mediciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: medicion.tipo.trim(),
          valor: parseNum(medicion.valor),
          unidad: medicion.unidad.trim() || null,
          fecha: medicion.fecha ? new Date(medicion.fecha).toISOString() : undefined,
          nota: medicion.nota.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error registrando medición');
      toast.success('Medición registrada');
      setMedicion((m) => ({ ...m, valor: '', fecha: '', nota: '' }));
      invalidar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error registrando medición');
    } finally {
      setMedicionEnviando(false);
    }
  }

  async function agregarIngrediente(e: React.FormEvent) {
    e.preventDefault();
    if (!ingrediente.nombre.trim() || ingredienteEnviando) return;
    setIngredienteEnviando(true);
    try {
      const res = await apiFetch(`/api/hidromiel/lotes/${loteId}/ingredientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: ingrediente.nombre.trim(),
          cantidad: parseNum(ingrediente.cantidad),
          unidad: ingrediente.unidad.trim() || null,
          nota: ingrediente.nota.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error agregando ingrediente');
      toast.success('Ingrediente agregado');
      setIngrediente({ nombre: '', cantidad: '', unidad: '', nota: '' });
      invalidar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error agregando ingrediente');
    } finally {
      setIngredienteEnviando(false);
    }
  }

  async function agregarEtapa(e: React.FormEvent) {
    e.preventDefault();
    if (!etapa.nombre.trim() || etapaEnviando) return;
    setEtapaEnviando(true);
    try {
      const res = await apiFetch(`/api/hidromiel/lotes/${loteId}/etapas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: etapa.nombre.trim(),
          fecha: etapa.fecha ? new Date(etapa.fecha).toISOString() : undefined,
          nota: etapa.nota.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error agregando etapa');
      toast.success('Etapa registrada');
      setEtapa({ nombre: '', fecha: '', nota: '' });
      invalidar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error agregando etapa');
    } finally {
      setEtapaEnviando(false);
    }
  }

  async function eliminar(path: string, mensaje: string) {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      const res = await apiFetch(path, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error al eliminar');
      toast.success(mensaje);
      invalidar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  async function eliminarLote() {
    if (!window.confirm(`¿Descartar el lote ${lote.codigo ?? ''}? Se eliminan también sus mediciones, ingredientes y etapas.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/hidromiel/lotes/${loteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error eliminando lote');
      toast.success('Lote eliminado');
      invalidar();
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error eliminando lote');
    }
  }

  /** Réplica del lote: repite el proceso con control, sin mediciones pasadas. */
  async function clonarLote() {
    try {
      const res = await apiFetch('/api/hidromiel/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: lote.nombre ? `${lote.nombre} (réplica)` : null,
          miel_lote_id: lote.miel_lote_id,
          estado: 'fermentando',
          volumen_litros: lote.volumen_litros,
          densidad_inicial: lote.densidad_inicial,
          levadura_cepa: lote.levadura_cepa,
          co2_target_vol: lote.co2_target_vol,
          presion_target_bar: lote.presion_target_bar,
          temperatura_fermentacion: lote.temperatura_fermentacion,
          costo_insumos: lote.costo_insumos,
          costo_envases: lote.costo_envases,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Error creando réplica');
      toast.success(`Réplica ${json.data?.codigo ?? ''} creada — fermentando`);
      invalidar();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error creando réplica');
    }
  }

  function exportarJSON() {
    const blob = new Blob([JSON.stringify({ ...detalle, exportado_en: new Date().toISOString() }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hidromiel-${lote.codigo ?? lote.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="border-t border-border px-4 sm:px-6 py-5 space-y-5 animate-in fade-in slide-in-from-top-2">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">{lote.codigo}</span>
        {lote.nombre && <span className="font-display italic text-lg text-foreground">{lote.nombre}</span>}
        <Badge variant={estadoVariant(lote.estado)} className="capitalize">{lote.estado}</Badge>
        {abv !== null && <Badge variant="info">{abv.toLocaleString('es-CL', { maximumFractionDigits: 1 })}% vol</Badge>}
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={clonarLote} title="Crear réplica de este lote">
            <Copy className="w-3.5 h-3.5" /> Réplica
          </Button>
          <Button variant="outline" size="sm" onClick={exportarJSON}>
            <Download className="w-3.5 h-3.5" /> JSON
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={eliminarLote}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar detalle">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Estado libre */}
      <div className="space-y-2">
        <Label htmlFor="hm-estado">Estado del lote</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="hm-estado"
            className="max-w-xs"
            value={estadoDraft}
            onChange={(e) => setEstadoDraft(e.target.value)}
            maxLength={120}
          />
          <Button variant="outline" size="sm" onClick={guardarEstado} disabled={guardandoEstado || estadoDraft.trim() === lote.estado}>
            {guardandoEstado ? 'Guardando…' : 'Guardar estado'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ESTADOS_SUGERIDOS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setEstadoDraft(s)}
              className={`px-2 py-1 rounded-full text-[0.7rem] font-semibold capitalize transition-colors border ${
                estadoDraft === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface-raised text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="self-center text-xs text-muted-foreground">— texto libre, escribe el tuyo</span>
        </div>
      </div>

      {/* Instrumentos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CalculadoraPriming volumenInicial={lote.volumen_litros} />
        <div className="grid gap-4">
          <CalculadoraABV ogInicial={lote.densidad_inicial} fgInicial={lote.densidad_final} />
          <CalculadoraCostos
            mielKgInicial={mielKg}
            mielKgFuente={mielKg != null ? `${mielKg.toLocaleString('es-CL')} kg (de la receta)` : null}
            costoInsumosInicial={lote.costo_insumos}
            costoEnvasesInicial={lote.costo_envases}
            nBotellasInicial={lote.n_botellas}
          />
        </div>
      </div>

      {/* Curva + mediciones */}
      <Card className="rounded-2xl border-border">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Curva de fermentación</p>
          <CurvaMediciones mediciones={detalle.mediciones} />

          <form onSubmit={agregarMedicion} className="grid gap-3 sm:grid-cols-[1.2fr_1fr_0.8fr_1fr_1fr_auto] items-end">
            <div className="space-y-1.5">
              <Label htmlFor="hm-med-tipo">Tipo</Label>
              <Input id="hm-med-tipo" list="hm-tipos" value={medicion.tipo} onChange={(e) => setMedicion((m) => ({ ...m, tipo: e.target.value }))} placeholder="densidad" required />
              <datalist id="hm-tipos">
                {TIPOS_MEDICION_SUGERIDOS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-med-valor">Valor</Label>
              <Input id="hm-med-valor" inputMode="decimal" value={medicion.valor} onChange={(e) => setMedicion((m) => ({ ...m, valor: e.target.value }))} placeholder="1.004" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-med-unidad">Unidad</Label>
              <Input id="hm-med-unidad" list="hm-unidades" value={medicion.unidad} onChange={(e) => setMedicion((m) => ({ ...m, unidad: e.target.value }))} placeholder="g/L" />
              <datalist id="hm-unidades">
                {UNIDADES_SUGERIDAS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-med-fecha">Fecha</Label>
              <Input id="hm-med-fecha" type="datetime-local" value={medicion.fecha} onChange={(e) => setMedicion((m) => ({ ...m, fecha: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-med-nota">Nota</Label>
              <Input id="hm-med-nota" value={medicion.nota} onChange={(e) => setMedicion((m) => ({ ...m, nota: e.target.value }))} placeholder="opcional" />
            </div>
            <Button type="submit" size="sm" disabled={medicionEnviando || !medicion.tipo.trim()}>
              <Plus className="w-3.5 h-3.5" /> Medir
            </Button>
          </form>

          {detalle.mediciones.length > 0 && (
            <div className="rounded-xl border border-border divide-y divide-border">
              {detalle.mediciones.map((m) =>
                editandoMedicion?.id === m.id ? (
                  <div key={m.id} className="px-3 py-3 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_0.8fr_1fr_auto] items-end">
                      <Input value={editandoMedicion.tipo} onChange={(e) => setEditandoMedicion({ ...editandoMedicion, tipo: e.target.value })} aria-label="Tipo de medición" />
                      <Input inputMode="decimal" value={editandoMedicion.valor != null ? String(editandoMedicion.valor) : ''} onChange={(e) => setEditandoMedicion({ ...editandoMedicion, valor: parseNum(e.target.value) })} aria-label="Valor" />
                      <Input value={editandoMedicion.unidad ?? ''} onChange={(e) => setEditandoMedicion({ ...editandoMedicion, unidad: e.target.value })} aria-label="Unidad" />
                      <Input value={editandoMedicion.nota ?? ''} onChange={(e) => setEditandoMedicion({ ...editandoMedicion, nota: e.target.value })} aria-label="Nota" />
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={guardarMedicionEdit} disabled={guardandoEdicion || !editandoMedicion.tipo.trim()}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditandoMedicion(null)} aria-label="Cancelar edición">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="capitalize font-medium text-foreground w-28 shrink-0">{m.tipo}</span>
                    <span className="tabular-nums font-semibold w-24 shrink-0">
                      {m.valor != null ? m.valor.toLocaleString('es-CL') : '—'}
                      {m.unidad ? <span className="text-muted-foreground font-normal"> {m.unidad}</span> : null}
                    </span>
                    <span className="text-xs text-muted-foreground w-32 shrink-0">{fechaCorta(m.fecha)}</span>
                    {m.nota && <span className="text-xs text-muted-foreground truncate flex-1">{m.nota}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" onClick={() => setEditandoMedicion({ ...m })} className="text-muted-foreground hover:text-foreground" aria-label="Editar medición">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => eliminar(`/api/hidromiel/mediciones/${m.id}`, 'Medición eliminada')} className="text-muted-foreground hover:text-destructive" aria-label="Eliminar medición">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receta libre */}
      <Card className="rounded-2xl border-border">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Receta</p>
          <form onSubmit={agregarIngrediente} className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_auto] items-end">
            <div className="space-y-1.5">
              <Label htmlFor="hm-ing-nombre">Ingrediente</Label>
              <Input id="hm-ing-nombre" value={ingrediente.nombre} onChange={(e) => setIngrediente((i) => ({ ...i, nombre: e.target.value }))} placeholder="miel de ulmo" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-ing-cantidad">Cantidad</Label>
              <Input id="hm-ing-cantidad" inputMode="decimal" value={ingrediente.cantidad} onChange={(e) => setIngrediente((i) => ({ ...i, cantidad: e.target.value }))} placeholder="3.5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-ing-unidad">Unidad</Label>
              <Input id="hm-ing-unidad" list="hm-unidades" value={ingrediente.unidad} onChange={(e) => setIngrediente((i) => ({ ...i, unidad: e.target.value }))} placeholder="kg" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-ing-nota">Nota</Label>
              <Input id="hm-ing-nota" value={ingrediente.nota} onChange={(e) => setIngrediente((i) => ({ ...i, nota: e.target.value }))} placeholder="opcional" />
            </div>
            <Button type="submit" size="sm" disabled={ingredienteEnviando || !ingrediente.nombre.trim()}>
              <Plus className="w-3.5 h-3.5" /> Agregar
            </Button>
          </form>
          <div className="flex flex-wrap gap-1.5">
            {INGREDIENTES_SUGERIDOS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIngrediente((ing) => ({ ...ing, nombre: i }))}
                className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-raised text-muted-foreground border border-border hover:text-foreground"
              >
                + {i}
              </button>
            ))}
          </div>
          {detalle.ingredientes.length > 0 && (
            <div className="rounded-xl border border-border divide-y divide-border">
              {detalle.ingredientes.map((i) =>
                editandoIngrediente?.id === i.id ? (
                  <div key={i.id} className="px-3 py-3 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_auto] items-end">
                      <Input value={editandoIngrediente.nombre} onChange={(e) => setEditandoIngrediente({ ...editandoIngrediente, nombre: e.target.value })} aria-label="Nombre" />
                      <Input inputMode="decimal" value={editandoIngrediente.cantidad != null ? String(editandoIngrediente.cantidad) : ''} onChange={(e) => setEditandoIngrediente({ ...editandoIngrediente, cantidad: parseNum(e.target.value) })} aria-label="Cantidad" />
                      <Input value={editandoIngrediente.unidad ?? ''} onChange={(e) => setEditandoIngrediente({ ...editandoIngrediente, unidad: e.target.value })} aria-label="Unidad" />
                      <Input value={editandoIngrediente.nota ?? ''} onChange={(e) => setEditandoIngrediente({ ...editandoIngrediente, nota: e.target.value })} aria-label="Nota" />
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={guardarIngredienteEdit} disabled={guardandoEdicion || !editandoIngrediente.nombre.trim()}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditandoIngrediente(null)} aria-label="Cancelar edición">
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={i.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{i.nombre}</span>
                    {i.cantidad != null && (
                      <span className="text-muted-foreground tabular-nums">
                        {i.cantidad.toLocaleString('es-CL')} {i.unidad ?? ''}
                      </span>
                    )}
                    {i.nota && <span className="text-xs text-muted-foreground truncate">{i.nota}</span>}
                    <div className="ml-auto flex items-center gap-1">
                      <button type="button" onClick={() => setEditandoIngrediente({ ...i })} className="text-muted-foreground hover:text-foreground" aria-label="Editar ingrediente">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => eliminar(`/api/hidromiel/ingredientes/${i.id}`, 'Ingrediente eliminado')} className="text-muted-foreground hover:text-destructive" aria-label="Eliminar ingrediente">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Línea de tiempo */}
      <Card className="rounded-2xl border-border">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Línea de tiempo</p>
          <form onSubmit={agregarEtapa} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] items-end">
            <div className="space-y-1.5">
              <Label htmlFor="hm-et-nombre">Etapa</Label>
              <Input id="hm-et-nombre" value={etapa.nombre} onChange={(e) => setEtapa((x) => ({ ...x, nombre: e.target.value }))} placeholder="embotellado, trasiego, degüelle…" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-et-fecha">Fecha</Label>
              <Input id="hm-et-fecha" type="datetime-local" value={etapa.fecha} onChange={(e) => setEtapa((x) => ({ ...x, fecha: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-et-nota">Nota</Label>
              <Input id="hm-et-nota" value={etapa.nota} onChange={(e) => setEtapa((x) => ({ ...x, nota: e.target.value }))} placeholder="opcional" />
            </div>
            <Button type="submit" size="sm" disabled={etapaEnviando || !etapa.nombre.trim()}>
              <Plus className="w-3.5 h-3.5" /> Registrar
            </Button>
          </form>
          {detalle.etapas.length > 0 && (
            <ol className="relative border-l border-border ml-2 space-y-4 pt-1">
              {detalle.etapas.map((et) => (
                <li key={et.id} className="pl-4 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary" />
                  {editandoEtapa?.id === et.id ? (
                    <div className="space-y-2 pb-1">
                      <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] items-end">
                        <Input value={editandoEtapa.nombre} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, nombre: e.target.value })} aria-label="Nombre de etapa" />
                        <Input type="datetime-local" value={editandoEtapa.fecha ? fechaLocalInput(editandoEtapa.fecha) : ''} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, fecha: e.target.value ? new Date(e.target.value).toISOString() : editandoEtapa.fecha })} aria-label="Fecha de etapa" />
                        <Input value={editandoEtapa.nota ?? ''} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, nota: e.target.value })} aria-label="Nota" />
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={guardarEtapaEdit} disabled={guardandoEdicion || !editandoEtapa.nombre.trim()}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditandoEtapa(null)} aria-label="Cancelar edición">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground capitalize">{et.nombre}</span>
                        <span className="text-xs text-muted-foreground">{fechaCorta(et.fecha)}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <button type="button" onClick={() => setEditandoEtapa({ ...et })} className="text-muted-foreground hover:text-foreground" aria-label="Editar etapa">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => eliminar(`/api/hidromiel/etapas/${et.id}`, 'Etapa eliminada')} className="text-muted-foreground hover:text-destructive" aria-label="Eliminar etapa">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {et.nota && <p className="text-xs text-muted-foreground mt-0.5">{et.nota}</p>}
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Parámetros */}
      <Card className="rounded-2xl border-border">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Parámetros del lote</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-vol">Volumen (L)</Label>
              <Input id="hm-p-vol" inputMode="decimal" value={params.volumen} onChange={(e) => setParams({ ...params, volumen: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-og">Densidad inicial (OG)</Label>
              <Input id="hm-p-og" inputMode="decimal" value={params.densidadInicial} onChange={(e) => setParams({ ...params, densidadInicial: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-fg">Densidad final (FG)</Label>
              <Input id="hm-p-fg" inputMode="decimal" value={params.densidadFinal} onChange={(e) => setParams({ ...params, densidadFinal: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-cepa">Levadura / cepa</Label>
              <Input id="hm-p-cepa" value={params.levadura} onChange={(e) => setParams({ ...params, levadura: e.target.value })} placeholder="silvestre del apiario" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-temp">Temperatura fermentación (°C)</Label>
              <Input id="hm-p-temp" inputMode="decimal" value={params.temperatura} onChange={(e) => setParams({ ...params, temperatura: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-co2">CO₂ objetivo (vol)</Label>
              <Input id="hm-p-co2" inputMode="decimal" value={params.co2Target} onChange={(e) => setParams({ ...params, co2Target: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-bar">Presión objetivo (bar)</Label>
              <Input id="hm-p-bar" inputMode="decimal" value={params.presionTarget} onChange={(e) => setParams({ ...params, presionTarget: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-bot">Botellas</Label>
              <Input id="hm-p-bot" inputMode="numeric" value={params.nBotellas} onChange={(e) => setParams({ ...params, nBotellas: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-nota">Nota personal (1–10)</Label>
              <Input id="hm-p-nota" inputMode="numeric" value={params.notaPersonal} onChange={(e) => setParams({ ...params, notaPersonal: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-insumos">Costo insumos (CLP)</Label>
              <MoneyInput id="hm-p-insumos" value={params.costoInsumos} onValueChange={(v) => setParams({ ...params, costoInsumos: v })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hm-p-envases">Costo envases (CLP)</Label>
              <MoneyInput id="hm-p-envases" value={params.costoEnvases} onValueChange={(v) => setParams({ ...params, costoEnvases: v })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hm-p-obs">Observaciones</Label>
            <Textarea id="hm-p-obs" rows={3} value={params.observaciones} onChange={(e) => setParams({ ...params, observaciones: e.target.value })} placeholder="Diario de campo del lote…" />
          </div>
          <Button variant="outline" size="sm" onClick={guardarParams} disabled={guardandoParams}>
            {guardandoParams ? 'Guardando…' : 'Guardar parámetros'}
          </Button>
        </CardContent>
      </Card>

      {/* Pasaporte y trazabilidad */}
      <Card className="rounded-2xl border-border">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Pasaporte y trazabilidad</p>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Lote de miel de OYZ (opcional)</Label>
                <Select value={mielLoteId} onValueChange={setMielLoteId} options={opcionesMiel} placeholder="Sin lote de miel" searchable />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunken px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Pasaporte público</p>
                  <p className="text-xs text-muted-foreground">Cualquiera con el QR verá la historia del lote.</p>
                </div>
                <Switch checked={publico} onCheckedChange={setPublico} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hm-relato">Relato público</Label>
                <Textarea id="hm-relato" rows={3} value={relato} onChange={(e) => setRelato(e.target.value)} placeholder="La historia de este lote para quien escanee el QR…" />
              </div>
              <Button variant="outline" size="sm" onClick={guardarPasaporte}>
                Guardar pasaporte
              </Button>
            </div>
            <div className="flex flex-col items-center gap-2 justify-center">
              <QRCode value={`${window.location.origin}/hidromiel/${lote.id}`} size={96} className="p-1.5 shrink-0" />
              <p className="text-[0.65rem] text-muted-foreground text-center max-w-[120px]">
                {publico ? 'Pasaporte visible' : 'Solo visible si el pasaporte es público'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>
              Iniciado {formatDate(lote.fecha_inicio)} · Registrado {formatDate(lote.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
