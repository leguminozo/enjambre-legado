'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout,
  CalendarDays,
  ScanLine,
  Flower2,
  Bell,
  Send,
  CheckCircle2,
  MapPin,
  Pencil,
  Trash2,
  Sliders,
  X,
  Loader2,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { overlayBackdropClassName, formatCalendarDate } from '@enjambre/ui';
import { CHILOE_SEASONS } from '@/lib/editorial-greeting';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import { CalibracionModal } from '@/components/fenologia/CalibracionModal';
import { UbicacionPickerModal } from '@/components/fenologia/UbicacionPickerModal';

interface Especie {
  id: string;
  nombre_cientifico: string;
  nombre_comun: string;
  familia: string | null;
  tbase_c: number;
  gdd_umbral: number | null;
  gdd_stddev: number | null;
  ventana_ini: number | null;
  ventana_fin: number | null;
  fuente: string;
  activo: boolean;
  origen?: 'nativa' | 'endemica' | 'introducida' | 'naturalizada';
  habito?: string;
  relevancia_apicola?: string;
  monitoreo_activo?: boolean;
  foto_url?: string | null;
}

interface Estacion {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  activo: boolean;
}

interface PronosticoEspecie {
  id: string;
  nombreCientifico: string;
  nombreComun: string;
  tbase: number;
  gddUmbral: number | null;
  gddActual: number;
  gddProyectado16d: number | null;
  progreso: number | null;
  diasEstimados: number | null;
  enFloracion: boolean;
  enVentana: boolean;
  origen?: string;
  habito?: string;
  relevanciaApicola?: string;
  fotoUrl?: string | null;
}

interface Observacion {
  id: string;
  especie_id: string;
  fecha: string;
  sector?: string | null;
  lat?: number | null;
  lng?: number | null;
  fenofase_bbch: number;
  status: string;
  intensidad: string | null;
  observador_id: string;
  apiario_id?: string | null;
  notas: string | null;
  especies_fenologicas?: { nombre_comun: string; nombre_cientifico: string } | null;
}

type Tab = 'pronostico' | 'observaciones';

const INTENSIDAD_LABEL: Record<string, string> = {
  menos_3: '<3 flores',
  '3_10': '3–10 flores',
  '11_100': '11–100 flores',
  '101_1000': '101–1.000 flores',
  '1001_10000': '1.001–10.000 flores',
  mas_10000: '>10.000 flores',
};

export function FenologiaView() {
  const apiFetch = useApiFetch();
  const [tab, setTab] = useState<Tab>('pronostico');
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [pronostico, setPronostico] = useState<PronosticoEspecie[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [alertasFloracion, setAlertasFloracion] = useState<
    {
      id: string;
      especie_id: string;
      fecha_predicha: string;
      gdd_calculado: number | null;
      estado: string;
      especies_fenologicas?: { nombre_comun: string } | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [estacionId, setEstacionId] = useState('');
  const [pronApiarioId, setPronApiarioId] = useState('');
  const [metaEstacion, setMetaEstacion] = useState<{ id: string; nombre: string } | null>(null);

  // Modal para emitir alertas a Tienda
  const [alertaModalOpen, setAlertaModalOpen] = useState(false);
  const [selectedEspecieId, setSelectedEspecieId] = useState('');
  const [alertaFecha, setAlertaFecha] = useState(new Date().toISOString().slice(0, 10));
  const [alertaGDD, setAlertaGDD] = useState('');
  const [alertaFeedback, setAlertaFeedback] = useState<string | null>(null);
  const [isEmitting, setIsEmitting] = useState(false);

  // Modal de calibración contextual
  const [calibracionEspecie, setCalibracionEspecie] = useState<Especie | null>(null);

  // Modal de ubicación en mapa
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);

  // Formulario de observación
  const [obsIdEdicion, setObsIdEdicion] = useState<string | null>(null);
  const [obsEspecie, setObsEspecie] = useState('');
  const [obsFecha, setObsFecha] = useState(new Date().toISOString().slice(0, 10));
  const [obsBBCH, setObsBBCH] = useState('65');
  const [obsIntensidad, setObsIntensidad] = useState('11_100');
  const [obsSector, setObsSector] = useState('');
  const [obsLat, setObsLat] = useState<number | null>(null);
  const [obsLng, setObsLng] = useState<number | null>(null);
  const [obsNotas, setObsNotas] = useState('');
  const [obsApiario, setObsApiario] = useState('');
  const [misApiarios, setMisApiarios] = useState<{ id: string; name: string | null; lat?: number | null; lng?: number | null }[]>([]);
  const [obsMensaje, setObsMensaje] = useState<string | null>(null);
  const [isSavingObs, setIsSavingObs] = useState(false);

  // Cargar apiarios
  useEffect(() => {
    supabase
      .from('apiarios')
      .select('id, name, lat, lng')
      .order('name')
      .then(({ data }: { data: { id: string; name: string | null; lat?: number | null; lng?: number | null }[] | null }) =>
        setMisApiarios(data ?? [])
      );
  }, []);

  const cargar = useCallback(async () => {
    const [especiesRes, pronosticoRes, obsRes, estacionesRes, alertasRes] = await Promise.all([
      apiFetch('/api/fenologia/especies/todas'),
      apiFetch('/api/fenologia/pronostico'),
      apiFetch('/api/fenologia/observaciones'),
      apiFetch('/api/fenologia/estaciones'),
      apiFetch('/api/fenologia/alertas'),
    ]);

    if (especiesRes.ok) {
      const j = await especiesRes.json();
      setEspecies(j.data ?? []);
    }
    if (pronosticoRes.ok) {
      const j = await pronosticoRes.json();
      setPronostico(j.data ?? []);
      const est = j.meta?.estacion ?? null;
      setMetaEstacion(est ?? null);
      if (est?.id) setEstacionId(est.id);
    }
    if (alertasRes.ok) {
      const j = await alertasRes.json();
      setAlertasFloracion(j.data ?? []);
    }
    if (obsRes.ok) {
      const j = await obsRes.json();
      setObservaciones(j.data ?? []);
    }
    if (estacionesRes.ok) {
      const j = await estacionesRes.json();
      setEstaciones(j.data ?? []);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cambiarEstacion = async (id: string) => {
    setEstacionId(id);
    await cargarPronostico(id, pronApiarioId);
  };

  const cambiarPronApiario = async (id: string) => {
    setPronApiarioId(id);
    await cargarPronostico(estacionId, id);
  };

  const cargarPronostico = async (estacion: string, apiario: string) => {
    const params = new URLSearchParams();
    if (apiario) params.set('apiario_id', apiario);
    else if (estacion) params.set('estacion', estacion);
    const res = await apiFetch(`/api/fenologia/pronostico?${params.toString()}`);
    if (res.ok) {
      const j = await res.json();
      setPronostico(j.data ?? []);
      setMetaEstacion(j.meta?.estacion ?? null);
    }
  };

  const reiniciarFormularioObs = () => {
    setObsIdEdicion(null);
    setObsEspecie('');
    setObsFecha(new Date().toISOString().slice(0, 10));
    setObsBBCH('65');
    setObsIntensidad('11_100');
    setObsSector('');
    setObsLat(null);
    setObsLng(null);
    setObsNotas('');
    setObsApiario('');
    setObsMensaje(null);
  };

  const iniciarEdicionObs = (o: Observacion) => {
    setObsIdEdicion(o.id);
    setObsEspecie(o.especie_id);
    setObsFecha(o.fecha);
    setObsBBCH(String(o.fenofase_bbch));
    setObsIntensidad(o.intensidad || '11_100');
    setObsSector(o.sector || '');
    setObsLat(o.lat ?? null);
    setObsLng(o.lng ?? null);
    setObsNotas(o.notas || '');
    setObsApiario(o.apiario_id || '');
    setObsMensaje(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarObservacion = async (id: string) => {
    if (!confirm('¿Deseas eliminar este registro de observación?')) return;
    const res = await apiFetch(`/api/fenologia/observaciones/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      if (obsIdEdicion === id) reiniciarFormularioObs();
      await cargar();
    }
  };

  const registrarObservacion = async () => {
    setObsMensaje(null);
    if (!obsEspecie) {
      setObsMensaje('Selecciona una especie botánica.');
      return;
    }

    setIsSavingObs(true);
    try {
      const payload = {
        especie_id: obsEspecie,
        fecha: obsFecha,
        fenofase_bbch: Number(obsBBCH),
        intensidad: obsIntensidad,
        sector: obsSector.trim() || null,
        lat: obsLat,
        lng: obsLng,
        notas: obsNotas.trim() || null,
        apiario_id: obsApiario || null,
      };

      const url = obsIdEdicion
        ? `/api/fenologia/observaciones/${obsIdEdicion}`
        : '/api/fenologia/observaciones';
      const method = obsIdEdicion ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setObsMensaje(obsIdEdicion ? 'Observación actualizada ✓' : 'Observación registrada ✓');
        reiniciarFormularioObs();
        await cargar();
      } else {
        const j = await res.json().catch(() => null);
        setObsMensaje(j?.message ?? 'Error al guardar la observación.');
      }
    } finally {
      setIsSavingObs(false);
    }
  };

  const handleEmitirAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEspecieId) return;
    setIsEmitting(true);
    setAlertaFeedback(null);
    try {
      const body = {
        especie_id: selectedEspecieId,
        fecha_predicha: alertaFecha,
        gdd_calculado: alertaGDD ? Number(alertaGDD) : null,
        estado: 'activo',
      };
      const res = await apiFetch('/api/fenologia/alertas', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setAlertaFeedback('¡Alerta de floración publicada en Tienda con éxito! ✓');
        setTimeout(() => {
          setAlertaModalOpen(false);
          setAlertaFeedback(null);
        }, 1200);
        await cargar();
      } else {
        const j = await res.json().catch(() => null);
        setAlertaFeedback(j?.message ?? 'Error al emitir alerta');
      }
    } finally {
      setIsEmitting(false);
    }
  };

  const stats = useMemo(() => {
    const enFloracion = pronostico.filter((p) => p.enFloracion).length;
    return {
      total: especies.length,
      monitoreadas: pronostico.length,
      observaciones: observaciones.length,
      enFloracion,
    };
  }, [especies, pronostico, observaciones]);

  const currentMonth = new Date().getMonth();
  const currentSeason = CHILOE_SEASONS[currentMonth] ?? CHILOE_SEASONS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Bosque · Ciencia"
        title="Oráculo Fenológico"
        subtitle="Monitoreo térmico GDD, radar de floración y bitácora territorial de campo."
        icon={<Sprout size={20} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/fenologia/especies"
              className="btn btn-primary text-xs inline-flex items-center gap-1.5 min-h-10 px-3.5"
            >
              <Flower2 size={15} />
              <span>Catálogo Botánico</span>
            </Link>
            <span className="text-xs font-mono uppercase tracking-widest text-primary px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 font-medium">
              {currentSeason.seasonName}
            </span>
          </div>
        }
      />

      {/* 2 Pestañas Limpias (Cero Redundancia) */}
      <ResponsiveTabBar
        variant="pill"
        layoutId="fenologia-tabs"
        tabs={[
          {
            id: 'pronostico',
            label: 'Pronóstico GDD',
            badge: stats.enFloracion > 0 ? `${stats.enFloracion} en flor` : undefined,
          },
          {
            id: 'observaciones',
            label: 'Registro de Campo',
            badge: stats.observaciones > 0 ? stats.observaciones : undefined,
          },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.p
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            Cargando fenología…
          </motion.p>
        ) : (
          <>
            {/* ── PESTAÑA 1: PRONÓSTICO GDD ── */}
            {tab === 'pronostico' && (
              <motion.div
                key="pronostico"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Selector de estación o apiario */}
                <div className="flex flex-wrap items-center justify-end gap-3 bg-surface-raised p-3 rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="pron-apiario"
                      className="text-xs uppercase tracking-wider text-muted-foreground font-medium"
                    >
                      Apiario
                    </label>
                    <select
                      id="pron-apiario"
                      value={pronApiarioId}
                      onChange={(e) => void cambiarPronApiario(e.target.value)}
                      className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                    >
                      <option value="">Estación de referencia</option>
                      {misApiarios.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name || 'Apiario sin nombre'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!pronApiarioId && (
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="estacion-fenologica"
                        className="text-xs uppercase tracking-wider text-muted-foreground font-medium"
                      >
                        Estación
                      </label>
                      <select
                        id="estacion-fenologica"
                        value={estacionId}
                        onChange={(e) => void cambiarEstacion(e.target.value)}
                        className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                      >
                        {estaciones.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Métricas Principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="En Monitoreo Activo" value={stats.monitoreadas} />
                  <StatCard label="Catálogo Completo" value={stats.total} />
                  <StatCard
                    label="En floración ahora"
                    value={stats.enFloracion}
                    accent={stats.enFloracion > 0}
                  />
                  <StatCard
                    label={metaEstacion ? `GDD acumulado (${metaEstacion.nombre})` : 'GDD acumulado'}
                    value={`${pronostico[0]?.gddActual ?? 0}°d`}
                  />
                </div>

                {/* Lista de Especies en Monitoreo */}
                <div className="space-y-3">
                  {pronostico.map((esp) => {
                    const progreso = esp.progreso ?? 0;
                    const espCompleta = especies.find((e) => e.id === esp.id);

                    return (
                      <div
                        key={esp.id}
                        className="card p-4 border border-border bg-surface-raised rounded-xl space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {esp.fotoUrl ? (
                              <img
                                src={esp.fotoUrl}
                                alt={esp.nombreComun}
                                className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-surface-sunken border border-border flex items-center justify-center text-sm shrink-0">
                                🌸
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-lg text-foreground font-semibold">
                                  {esp.nombreComun}
                                </span>
                                <span className="text-xs text-muted-foreground italic font-mono">
                                  {esp.nombreCientifico}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {esp.enFloracion && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 font-medium">
                                    ✨ Floración activa
                                  </span>
                                )}
                                {!esp.enFloracion && esp.enVentana && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 font-medium">
                                    En ventana mensual
                                  </span>
                                )}
                                {esp.origen && (
                                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-surface-sunken text-muted-foreground border border-border/50">
                                    {esp.origen}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-datos text-sm font-semibold text-foreground block">
                              {esp.gddActual} / {esp.gddUmbral != null ? `${esp.gddUmbral}°d` : '—'}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {esp.gddUmbral != null ? `${progreso}% del umbral` : 'Sin calibrar'}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progreso Térmico */}
                        <div className="h-2 w-full bg-surface-sunken rounded-full overflow-hidden border border-border/40">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${progreso}%`,
                              background: esp.enFloracion
                                ? 'hsl(var(--success))'
                                : 'hsl(var(--accent))',
                              opacity: esp.enFloracion ? 1 : 0.75,
                            }}
                          />
                        </div>

                        {/* Contexto y Acciones de la Especie */}
                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground flex-1">
                            {esp.enFloracion
                              ? 'Néctar y polen disponibles — floración en curso.'
                              : esp.diasEstimados != null
                              ? `Floración estimada en ~${esp.diasEstimados} días (Tbase ${esp.tbase}°C).`
                              : esp.gddUmbral != null
                              ? `Aún lejos del umbral térmico (${esp.gddUmbral}°d).`
                              : 'Umbral térmico pendiente de calibración territorial.'}
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Calibración Contextual */}
                            <button
                              type="button"
                              onClick={() => {
                                if (espCompleta) setCalibracionEspecie(espCompleta);
                              }}
                              className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded bg-surface-sunken text-foreground hover:bg-surface-raised border border-border transition-colors inline-flex items-center gap-1.5"
                              title="Calibrar umbral térmico"
                            >
                              <Sliders size={12} className="text-primary" />
                              <span>Calibrar</span>
                            </button>

                            {/* Emitir Alerta a Tienda */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEspecieId(esp.id);
                                setAlertaGDD(String(esp.gddActual));
                                setAlertaFecha(new Date().toISOString().slice(0, 10));
                                setAlertaModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors inline-flex items-center gap-1.5"
                              title="Publicar alerta para clientes en Tienda"
                            >
                              <Bell size={12} />
                              <span>Alerta Tienda</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Panel de Alertas Activas en Tienda */}
                <div className="card p-5 border border-border bg-surface-raised space-y-4 rounded-xl">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Alertas de Floración Publicadas en Tienda
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEspecieId(especies[0]?.id ?? '');
                        setAlertaGDD(String(pronostico[0]?.gddActual ?? ''));
                        setAlertaFecha(new Date().toISOString().slice(0, 10));
                        setAlertaModalOpen(true);
                      }}
                      className="btn btn-primary text-xs inline-flex items-center gap-1.5 min-h-8 px-3"
                    >
                      <Bell size={13} />
                      <span>Nueva Alerta</span>
                    </button>
                  </div>

                  {alertasFloracion.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-2">
                      No hay alertas activas emitidas hacia la Tienda.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {alertasFloracion.map((al) => (
                        <div
                          key={al.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-surface-sunken/60 border border-border/40 text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                al.estado === 'activo' ? 'bg-success' : 'bg-warning'
                              }`}
                            />
                            <span className="text-foreground font-medium">
                              {al.especies_fenologicas?.nombre_comun ?? 'Especie melífera'}
                            </span>
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                                al.estado === 'activo'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-warning/10 text-warning'
                              }`}
                            >
                              {al.estado}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            Fecha: {formatCalendarDate(al.fecha_predicha)}
                            {al.gdd_calculado != null && ` · ${al.gdd_calculado}°d GDD`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── PESTAÑA 2: REGISTRO DE CAMPO (BITÁCORA TERRITORIAL) ── */}
            {tab === 'observaciones' && (
              <motion.div
                key="observaciones"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid md:grid-cols-12 gap-6"
              >
                {/* Formulario enriquecido */}
                <div className="md:col-span-5 card p-5 border border-border bg-surface-raised space-y-4 rounded-xl h-fit">
                  <div className="flex items-center justify-between border-b border-border/50 pb-3">
                    <div className="section-title flex items-center gap-2 text-foreground font-semibold text-sm">
                      <ScanLine size={16} className="text-primary" />
                      <span>{obsIdEdicion ? 'Editar Floración' : 'Registrar Floración (BBCH 60–69)'}</span>
                    </div>
                    {obsIdEdicion && (
                      <button
                        type="button"
                        onClick={reiniciarFormularioObs}
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <X size={13} />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Especie */}
                    <label className="space-y-1 block">
                      <span className="text-muted-foreground uppercase font-medium">Especie Botánica</span>
                      <select
                        value={obsEspecie}
                        onChange={(e) => setObsEspecie(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground text-sm"
                      >
                        <option value="">Seleccionar especie…</option>
                        {especies.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nombre_comun} — {e.nombre_cientifico} ({e.origen ?? 'nativa'})
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Fecha y Fenofase BBCH */}
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-muted-foreground uppercase font-medium">Fecha</span>
                        <input
                          type="date"
                          value={obsFecha}
                          onChange={(e) => setObsFecha(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground text-sm font-mono"
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-muted-foreground uppercase font-medium">Fenofase BBCH</span>
                        <select
                          value={obsBBCH}
                          onChange={(e) => setObsBBCH(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground text-sm"
                        >
                          <option value="60">60 · primeras flores</option>
                          <option value="61">61 · ~10% abiertas</option>
                          <option value="62">62 · ~20% abiertas</option>
                          <option value="63">63 · ~30% abiertas</option>
                          <option value="64">64 · ~40% abiertas</option>
                          <option value="65">65 · plena floración</option>
                          <option value="67">67 · marchitándose</option>
                          <option value="69">69 · fin floración</option>
                        </select>
                      </label>
                    </div>

                    {/* Intensidad y Apiario */}
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-muted-foreground uppercase font-medium">Intensidad Floral</span>
                        <select
                          value={obsIntensidad}
                          onChange={(e) => setObsIntensidad(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground text-sm"
                        >
                          {Object.entries(INTENSIDAD_LABEL).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-muted-foreground uppercase font-medium">Apiario (Opcional)</span>
                        <select
                          value={obsApiario}
                          onChange={(e) => {
                            const val = e.target.value;
                            setObsApiario(val);
                            // Auto-rellenar coordenadas si el apiario las tiene y aún no se han fijado
                            const api = misApiarios.find((a) => a.id === val);
                            if (api?.lat && api?.lng && !obsLat) {
                              setObsLat(api.lat);
                              setObsLng(api.lng);
                              if (!obsSector && api.name) setObsSector(`Apiario ${api.name}`);
                            }
                          }}
                          className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground text-sm"
                        >
                          <option value="">Sin apiario — punto suelto</option>
                          {misApiarios.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name || 'Apiario sin nombre'}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* Georreferenciación Híbrida: Sector Textual + Pin en Mapa */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground uppercase font-medium">
                          Sector / Paraje Textual
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsUbicacionModalOpen(true)}
                          className="text-[11px] font-mono text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <MapPin size={12} />
                          <span>{obsLat != null ? 'Modificar en Mapa' : 'Fijar en Mapa / GPS'}</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Ej: Pureo Alto, ladera poniente cerca del estero"
                        value={obsSector}
                        onChange={(e) => setObsSector(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      />

                      {obsLat != null && obsLng != null && (
                        <div className="flex items-center justify-between text-[11px] font-mono bg-surface-sunken p-2 rounded-lg border border-border/50 text-muted-foreground">
                          <span>
                            📍 Coordenadas: {obsLat.toFixed(5)}, {obsLng.toFixed(5)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setObsLat(null);
                              setObsLng(null);
                            }}
                            className="text-xs text-muted-foreground hover:text-destructive"
                            title="Quitar coordenadas"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    <label className="space-y-1 block">
                      <span className="text-muted-foreground uppercase font-medium">Notas de Campo</span>
                      <textarea
                        rows={2}
                        value={obsNotas}
                        onChange={(e) => setObsNotas(e.target.value)}
                        placeholder="Vigor del árbol, insectos observados, estado del suelo…"
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>

                  {obsMensaje && (
                    <p
                      className={`text-xs ${
                        obsMensaje.includes('✓') ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {obsMensaje}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void registrarObservacion()}
                    disabled={isSavingObs}
                    className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
                  >
                    {isSavingObs ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>{obsIdEdicion ? 'Guardar Cambios' : 'Registrar Floración en Bitácora'}</span>
                  </button>
                </div>

                {/* Lista interactiva de observaciones recientes */}
                <div className="md:col-span-7 space-y-3">
                  <div className="section-title flex items-center justify-between text-foreground pb-1 border-b border-border/50">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <CalendarDays size={16} className="text-primary" />
                      <span>Observaciones Registradas ({observaciones.length})</span>
                    </div>
                  </div>

                  {observaciones.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">
                      Sin observaciones de campo registradas todavía.
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                      {observaciones.map((o) => (
                        <div
                          key={o.id}
                          className="card p-3.5 border border-border bg-surface-raised rounded-xl flex items-start justify-between gap-3 group hover:border-border/80 transition-all"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                {o.especies_fenologicas?.nombre_comun ?? 'Especie'}
                              </span>
                              <span className="text-xs italic text-muted-foreground font-mono">
                                {o.especies_fenologicas?.nombre_cientifico}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                BBCH {o.fenofase_bbch}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>📅 {o.fecha}</span>
                              {o.intensidad && (
                                <span>· {INTENSIDAD_LABEL[o.intensidad] ?? o.intensidad}</span>
                              )}
                              {o.sector && (
                                <span className="text-foreground/90 font-medium">
                                  · 📍 {o.sector}
                                </span>
                              )}
                            </div>

                            {o.notas && (
                              <p className="text-xs text-muted-foreground/90 italic pt-1 line-clamp-2">
                                «{o.notas}»
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pt-1">
                            <button
                              type="button"
                              onClick={() => iniciarEdicionObs(o)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
                              title="Editar observación"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void eliminarObservacion(o.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Eliminar observación"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* ── MODAL CONTEXTUAL: CALIBRACIÓN TÉRMICA ── */}
      <CalibracionModal
        especie={calibracionEspecie}
        isOpen={Boolean(calibracionEspecie)}
        onClose={() => setCalibracionEspecie(null)}
        onSaved={cargar}
      />

      {/* ── MODAL: GEORREFERENCIACIÓN Y MAPA ── */}
      <UbicacionPickerModal
        isOpen={isUbicacionModalOpen}
        onClose={() => setIsUbicacionModalOpen(false)}
        initialLat={obsLat}
        initialLng={obsLng}
        initialSector={obsSector}
        onConfirm={(data) => {
          setObsLat(data.lat);
          setObsLng(data.lng);
          if (data.sector) setObsSector(data.sector);
        }}
      />

      {/* ── MODAL: EMITIR ALERTA DE FLORACIÓN A TIENDA ── */}
      {alertaModalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayBackdropClassName}`}
        >
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                <h3 className="font-display text-lg text-foreground">
                  Emitir Alerta a Tienda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAlertaModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta alerta se publicará en el Radar de Floración de Tienda para todos los clientes y guardianes.
            </p>

            <form onSubmit={(e) => void handleEmitirAlerta(e)} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Especie en Floración
                </label>
                <select
                  value={selectedEspecieId}
                  onChange={(e) => setSelectedEspecieId(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  required
                >
                  <option value="">Selecciona especie</option>
                  {especies.map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nombre_comun} ({esp.nombre_cientifico})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Fecha Estimada
                  </label>
                  <input
                    type="date"
                    value={alertaFecha}
                    onChange={(e) => setAlertaFecha(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-datos"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    GDD Acumulado
                  </label>
                  <input
                    type="number"
                    value={alertaGDD}
                    onChange={(e) => setAlertaGDD(e.target.value)}
                    placeholder="Ej: 450"
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-datos"
                  />
                </div>
              </div>

              {alertaFeedback && (
                <div className="p-3 rounded-lg bg-surface-sunken border border-border text-xs text-foreground flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>{alertaFeedback}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setAlertaModalOpen(false)}
                  className="btn btn-outline text-xs min-h-9 px-3"
                  disabled={isEmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEmitting || !selectedEspecieId}
                  className="btn btn-primary text-xs min-h-9 px-4 inline-flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{isEmitting ? 'Emitiendo…' : 'Publicar Alerta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
  small = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="card p-3.5 border border-border bg-surface-raised rounded-xl">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <div
        className={`font-display mt-1 ${small ? 'text-base' : 'text-2xl'} ${
          accent ? 'text-success' : 'text-foreground'
        } font-semibold`}
      >
        {value}
      </div>
    </div>
  );
}
