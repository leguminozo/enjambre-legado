'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Flower2,
  Plus,
  Search,
  Sliders,
  ScanLine,
  CalendarDays,
  MapPin,
  Pencil,
  Trash2,
  X,
  Loader2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ImmersiveModal, ConfirmDialog } from '@enjambre/ui';
import { CHILOE_SEASONS } from '@/lib/editorial-greeting';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import { TaxaSearchModal } from '@/components/fenologia/TaxaSearchModal';
import { CalibracionModal } from '@/components/fenologia/CalibracionModal';
import { UbicacionPickerModal } from '@/components/fenologia/UbicacionPickerModal';
import { EspecieCard } from '@/components/fenologia/EspecieCard';
import { FenologiaGuiaModal } from '@/components/fenologia/FenologiaGuiaModal';

interface Especie {
  id: string;
  nombre_cientifico: string;
  nombre_comun: string;
  familia: string | null;
  tbase_c?: number;
  t_base?: number;
  gdd_umbral: number | null;
  gdd_stddev: number | null;
  ventana_ini?: number | null;
  ventana_fin?: number | null;
  mes_inicio_floracion?: number | null;
  mes_fin_floracion?: number | null;
  fuente?: string;
  activo?: boolean;
  origen?: 'nativa' | 'endemica' | 'introducida' | 'naturalizada';
  habito?: string;
  relevancia_apicola?: string;
  monitoreo_activo?: boolean;
  foto_url?: string | null;
  perfil_melifero?: string | null;
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

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const INTENSIDAD_LABEL: Record<string, string> = {
  menos_3: '<3 flores',
  '3_10': '3–10 flores',
  '11_100': '11–100 flores',
  '101_1000': '101–1.000 flores',
  '1001_10000': '1.001–10.000 flores',
  mas_10000: '>10.000 flores',
};

type FilterType = 'todas' | 'en_floracion' | 'nativas' | 'introducidas' | 'monitoreadas';

export function FenologiaView() {
  const apiFetch = useApiFetch();
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [pronostico, setPronostico] = useState<PronosticoEspecie[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [metaEstacion, setMetaEstacion] = useState<{ id: string; nombre: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todas');

  // Modales
  const [isTaxaModalOpen, setIsTaxaModalOpen] = useState(false);
  const [calibracionEspecie, setCalibracionEspecie] = useState<Especie | null>(null);
  const [isRegistroCampoOpen, setIsRegistroCampoOpen] = useState(false);
  const [isUbicacionModalOpen, setIsUbicacionModalOpen] = useState(false);
  const [isGuiaModalOpen, setIsGuiaModalOpen] = useState(false);
  const [obsToDeleteId, setObsToDeleteId] = useState<string | null>(null);

  // Formulario de observación de campo
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
  const [selectedApiarioId, setSelectedApiarioId] = useState<string>('');
  const [obsMensaje, setObsMensaje] = useState<string | null>(null);
  const [isSavingObs, setIsSavingObs] = useState(false);

  // Cargar apiarios del usuario para el registro de campo
  useEffect(() => {
    supabase
      .from('apiarios')
      .select('id, name, lat, lng')
      .order('name')
      .then(({ data }: { data: { id: string; name: string | null; lat?: number | null; lng?: number | null }[] | null }) => {
        setMisApiarios(data ?? []);
      });
  }, []);

  const cargar = useCallback(async () => {
    const pronosticoUrl = selectedApiarioId
      ? `/api/fenologia/pronostico?apiario_id=${encodeURIComponent(selectedApiarioId)}`
      : '/api/fenologia/pronostico';
    const [especiesRes, pronosticoRes, obsRes] = await Promise.all([
      apiFetch('/api/fenologia/especies/todas'),
      apiFetch(pronosticoUrl),
      apiFetch('/api/fenologia/observaciones'),
    ]);

    if (especiesRes.ok) {
      const j = await especiesRes.json();
      setEspecies(j.data ?? []);
    }
    if (pronosticoRes.ok) {
      const j = await pronosticoRes.json();
      setPronostico(j.data ?? []);
      setMetaEstacion(j.meta?.estacion ?? null);
    }
    if (obsRes.ok) {
      const j = await obsRes.json();
      setObservaciones(j.data ?? []);
    }
    setLoading(false);
  }, [apiFetch, selectedApiarioId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const toggleMonitoreo = async (esp: Especie, e: React.MouseEvent) => {
    e.stopPropagation();
    const nuevoEstado = !esp.monitoreo_activo;
    setEspecies((prev) =>
      prev.map((item) => (item.id === esp.id ? { ...item, monitoreo_activo: nuevoEstado } : item))
    );
    await apiFetch(`/api/fenologia/especies/${esp.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ monitoreo_activo: nuevoEstado }),
    });
  };

  const pronosticoById = useMemo(
    () => new Map(pronostico.map((p) => [p.id, p])),
    [pronostico]
  );

  const stats = useMemo(() => {
    const enFloracion = pronostico.filter((p) => p.enFloracion).length;
    const nativas = especies.filter(
      (e) => e.origen === 'nativa' || e.origen === 'endemica' || !e.origen
    ).length;
    const introducidas = especies.filter(
      (e) => e.origen === 'introducida' || e.origen === 'naturalizada'
    ).length;
    const monitoreadas = especies.filter((e) => e.monitoreo_activo !== false).length;
    const gddActual = pronostico[0]?.gddActual ?? 0;
    return {
      total: especies.length,
      monitoreadas,
      nativas,
      introducidas,
      enFloracion,
      gddActual,
      observaciones: observaciones.length,
    };
  }, [especies, pronostico, observaciones]);

  const filteredEspecies = useMemo(() => {
    return especies.filter((esp) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        esp.nombre_comun.toLowerCase().includes(q) ||
        esp.nombre_cientifico.toLowerCase().includes(q) ||
        (esp.familia && esp.familia.toLowerCase().includes(q));

      if (!matchSearch) return false;

      const pron = pronosticoById.get(esp.id);

      if (filterType === 'en_floracion') {
        return Boolean(pron?.enFloracion);
      }
      if (filterType === 'nativas') {
        return esp.origen === 'nativa' || esp.origen === 'endemica' || !esp.origen;
      }
      if (filterType === 'introducidas') {
        return esp.origen === 'introducida' || esp.origen === 'naturalizada';
      }
      if (filterType === 'monitoreadas') {
        return esp.monitoreo_activo !== false;
      }
      return true;
    });
  }, [especies, search, filterType, pronosticoById]);

  // Formulario y gestión de observaciones
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
  };

  const eliminarObservacion = async (id: string) => {
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

  const currentMonth = new Date().getMonth();
  const currentSeason = CHILOE_SEASONS[currentMonth] ?? CHILOE_SEASONS[0];

  const especiesEnFloracion = useMemo(() => {
    return pronostico.filter((p) => p.enFloracion);
  }, [pronostico]);

  const proximaFloracion = useMemo(() => {
    const candidatas = pronostico
      .filter((p) => !p.enFloracion && p.progreso !== null && p.progreso < 100)
      .sort((a, b) => (b.progreso ?? 0) - (a.progreso ?? 0));
    return candidatas[0] ?? null;
  }, [pronostico]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Encabezado Principal Unificado ── */}
      <ViewShell
        variant="compact"
        eyebrow="Bosque · Botánica"
        title={
          <div className="flex items-center gap-2.5">
            <span>Catálogo Botánico Melífero</span>
            <button
              type="button"
              onClick={() => setIsGuiaModalOpen(true)}
              className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 hover:scale-105 transition-all text-xs font-bold leading-none cursor-pointer"
              title="¿Cómo funciona el Oráculo Fenológico y los Grados-Día (GDD)?"
              aria-label="Abrir guía explicativa del Oráculo Fenológico"
            >
              ?
            </button>
          </div>
        }
        subtitle="Colección botánica melífera de Chile: umbrales térmicos (GDD), floración activa y bitácora territorial."
        icon={<Flower2 size={20} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRegistroCampoOpen(true)}
              className="btn btn-outline text-xs inline-flex items-center gap-1.5 min-h-10 px-3.5"
              title="Abrir bitácora y registros de floración en terreno"
            >
              <ScanLine size={15} className="text-muted-foreground" />
              <span>Registro de Campo</span>
              {stats.observaciones > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-surface-sunken border border-border text-[10px] font-mono font-bold text-accent">
                  {stats.observaciones}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsTaxaModalOpen(true)}
              className="btn btn-primary text-xs inline-flex items-center gap-1.5 min-h-10 px-3.5"
            >
              <Plus size={15} />
              <span>Añadir Especie</span>
            </button>
          </div>
        }
      />

      {/* ── Resumen de Contexto Territorial (Métricas Clave) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Floración Activa */}
        <div
          onClick={() => setFilterType((prev) => (prev === 'en_floracion' ? 'todas' : 'en_floracion'))}
          className={`card p-3.5 border rounded-xl transition-all cursor-pointer relative overflow-hidden ${
            filterType === 'en_floracion'
              ? 'bg-success/5 border-success/40 ring-1 ring-success/30'
              : 'bg-surface-raised border-border hover:border-border/80'
          }`}
          title="Toca para filtrar especies en floración activa"
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wider font-medium">
            <span className={stats.enFloracion > 0 ? 'text-success' : 'text-muted-foreground'}>
              Floración Activa
            </span>
            {stats.enFloracion > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
            )}
          </div>
          <div className="font-display mt-1 text-2xl font-semibold text-foreground flex items-baseline gap-1.5">
            <span className={stats.enFloracion > 0 ? 'text-success' : 'text-foreground'}>
              {stats.enFloracion}
            </span>
            <span className="text-xs font-sans text-muted-foreground font-normal">
              {stats.enFloracion === 1 ? 'especie' : 'especies'}
            </span>
          </div>
          {especiesEnFloracion.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {especiesEnFloracion.slice(0, 3).map((e) => (
                <span
                  key={e.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20 truncate max-w-[130px]"
                >
                  {e.nombreComun}
                </span>
              ))}
              {especiesEnFloracion.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{especiesEnFloracion.length - 3}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground truncate">
              En receso vegetativo invernal
            </p>
          )}
        </div>

        {/* Card 2: Próxima Floración */}
        <div className="card p-3.5 border border-border bg-surface-raised rounded-xl">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium truncate flex items-center justify-between">
            <span>Próxima Floración</span>
            <TrendingUp size={13} className="text-primary/70 shrink-0" />
          </div>
          <div className="font-display mt-1 text-xl font-semibold text-foreground truncate">
            {proximaFloracion ? proximaFloracion.nombreComun : 'Ciclo Completo'}
          </div>
          {proximaFloracion && proximaFloracion.progreso !== null ? (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                <span>{Math.round(proximaFloracion.progreso)}% acumulado</span>
                <span>
                  -{Math.max(0, Math.round((proximaFloracion.gddUmbral ?? 0) - proximaFloracion.gddActual))}°d
                </span>
              </div>
              <div className="w-full bg-surface-sunken h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(proximaFloracion.progreso))}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground truncate">
              Especies en floración o sin umbral
            </p>
          )}
        </div>

        {/* Card 3: Evidencia en Terreno (Bitácora Territorial) */}
        <div
          onClick={() => setIsRegistroCampoOpen(true)}
          className="card p-3.5 border border-border bg-surface-raised rounded-xl cursor-pointer hover:border-border/80 transition-all group"
          title="Abrir bitácora y registros territoriales de floración"
        >
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium truncate flex items-center justify-between">
            <span>Bitácora Territorial</span>
            <ChevronRight size={13} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </div>
          <div className="font-display mt-1 text-2xl font-semibold text-foreground flex items-baseline gap-1.5">
            <span>{stats.observaciones}</span>
            <span className="text-xs font-sans text-muted-foreground font-normal">
              {stats.observaciones === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          {observaciones.length > 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground truncate">
              Última: {observaciones[0].fecha} · {observaciones[0].especies_fenologicas?.nombre_comun ?? 'Especie'}
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-accent truncate">
              + Registrar observación en terreno
            </p>
          )}
        </div>

        {/* Card 4: Dinámica Térmica (GDD) */}
        <div className="card p-3.5 border border-border bg-surface-raised rounded-xl">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium truncate flex items-center justify-between">
            <span>Dinámica Térmica</span>
            <span className="text-[10px] font-mono font-normal text-muted-foreground">Tbase 5°C</span>
          </div>
          <div className="font-display mt-1 text-2xl font-semibold text-foreground flex items-baseline gap-1.5">
            <span>{stats.gddActual}°d</span>
            <span className="text-xs font-sans text-muted-foreground font-normal">acumulados</span>
          </div>
          <div className="mt-1.5">
            {misApiarios.length > 1 ? (
              <select
                value={selectedApiarioId}
                onChange={(e) => setSelectedApiarioId(e.target.value)}
                className="w-full text-[11px] bg-surface-sunken border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate"
                title="Cambiar apiario de referencia para cálculo GDD"
              >
                <option value="">{metaEstacion ? metaEstacion.nombre : 'Sector Territorial'}</option>
                {misApiarios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? 'Apiario'}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[11px] text-muted-foreground truncate" title={metaEstacion?.nombre ?? 'Sector Territorial'}>
                {metaEstacion ? metaEstacion.nombre : 'Pureo, Chiloé'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Barra de Filtros y Búsqueda ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por nombre común, científico o familia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('todas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'todas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('en_floracion')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'en_floracion'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            En Floración ({stats.enFloracion})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('nativas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'nativas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Nativas ({stats.nativas})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('introducidas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'introducidas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Introducidas ({stats.introducidas})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('monitoreadas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'monitoreadas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            En Oráculo ({stats.monitoreadas})
          </button>
        </div>
      </div>

      {/* ── Cuadrícula Principal de Tarjetas Botánicas ── */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando catálogo botánico y floración…</p>
      ) : filteredEspecies.length === 0 ? (
        <div className="card p-8 border border-border rounded-xl text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No se encontraron especies con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={() => setIsTaxaModalOpen(true)}
            className="btn btn-outline text-xs inline-flex items-center gap-1.5 mx-auto"
          >
            <Flower2 size={14} className="text-primary" />
            <span>Incorporar una nueva especie botánica</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEspecies.map((esp) => {
            const pron = pronosticoById.get(esp.id);
            return (
              <EspecieCard
                key={esp.id}
                especie={esp}
                pronostico={pron}
                onObservar={(espId) => {
                  reiniciarFormularioObs();
                  setObsEspecie(espId);
                  setIsRegistroCampoOpen(true);
                }}
                onCalibrar={(espParaCalibrar) => setCalibracionEspecie(espParaCalibrar)}
                onToggleMonitoreo={(espParaToggle, e) => void toggleMonitoreo(espParaToggle, e)}
              />
            );
          })}
        </div>
      )}

      {/* ── Modal Secundario: Registro de Campo (Bitácora Territorial) ── */}
      <ImmersiveModal
        open={isRegistroCampoOpen}
        onClose={() => setIsRegistroCampoOpen(false)}
        eyebrow="Bitácora Fenológica Territorial"
        title="Registro de Campo (Escala BBCH 60–69)"
        size="xl"
      >
        <div className="grid md:grid-cols-12 gap-6 p-4 sm:p-6">
          {/* Formulario de Registro */}
          <div className="md:col-span-5 card p-5 border border-border bg-surface-raised space-y-4 rounded-xl h-fit">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="section-title flex items-center gap-2 text-foreground font-semibold text-sm">
                <ScanLine size={16} className="text-primary" />
                <span>{obsIdEdicion ? 'Editar Floración' : 'Registrar Floración en Terreno'}</span>
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
              {/* Selector de Especie */}
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

              {/* Sector y Geolocalización */}
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

              {/* Notas de Campo */}
              <label className="space-y-1 block">
                <span className="text-muted-foreground uppercase font-medium">Notas de Campo</span>
                <textarea
                  rows={2}
                  value={obsNotas}
                  onChange={(e) => setObsNotas(e.target.value)}
                  placeholder="Vigor de la floración, insectos observados, humedad…"
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

          {/* Lista de Observaciones Registradas */}
          <div className="md:col-span-7 space-y-3">
            <div className="section-title flex items-center justify-between text-foreground pb-1 border-b border-border/50">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CalendarDays size={16} className="text-primary" />
                <span>Observaciones Registradas ({observaciones.length})</span>
              </div>
            </div>

            {observaciones.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-6 text-center">
                Sin observaciones de campo registradas todavía. Puedes registrar la primera floración observada en terreno.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
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
                          <span className="text-foreground/90 font-medium">· 📍 {o.sector}</span>
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
                        onClick={() => setObsToDeleteId(o.id)}
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
        </div>
      </ImmersiveModal>

      {/* ── Modal de Búsqueda Taxonómica Asistida (+ Añadir Especie) ── */}
      <TaxaSearchModal
        isOpen={isTaxaModalOpen}
        onClose={() => setIsTaxaModalOpen(false)}
        onEspecieCreada={cargar}
      />

      {/* ── Modal Contextual de Calibración Térmica (GDD) ── */}
      <CalibracionModal
        especie={calibracionEspecie}
        isOpen={Boolean(calibracionEspecie)}
        onClose={() => setCalibracionEspecie(null)}
        onSaved={cargar}
      />

      {/* ── Modal: Georreferenciación y Mapa para Observaciones ── */}
      <UbicacionPickerModal
        isOpen={isUbicacionModalOpen}
        onClose={() => setIsUbicacionModalOpen(false)}
        initialLat={obsLat}
        initialLng={obsLng}
        initialSector={obsSector}
        onConfirm={(data) => {
          setObsLat(data.lat);
          setObsLng(data.lng);
          setObsSector(data.sector);
          setIsUbicacionModalOpen(false);
        }}
      />

      {/* ── Modal de Confirmación para Eliminar Observación de Campo ── */}
      <ConfirmDialog
        open={obsToDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setObsToDeleteId(null);
        }}
        title="¿Eliminar observación de campo?"
        description="Se eliminará este registro de floración de la bitácora territorial. Esta acción no se puede deshacer."
        confirmLabel="Eliminar registro"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={async () => {
          if (obsToDeleteId) {
            await eliminarObservacion(obsToDeleteId);
            setObsToDeleteId(null);
          }
        }}
      />

      {/* ── Modal Guía: Oráculo Fenológico y Grados-Día (GDD) ── */}
      <FenologiaGuiaModal
        isOpen={isGuiaModalOpen}
        onClose={() => setIsGuiaModalOpen(false)}
      />
    </div>
  );
}
