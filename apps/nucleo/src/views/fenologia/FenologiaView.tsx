'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, FlaskConical, CalendarDays, ScanLine, Activity } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { CHILOE_SEASONS } from '@/lib/editorial-greeting';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';

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
}

interface Observacion {
  id: string;
  especie_id: string;
  fecha: string;
  fenofase_bbch: number;
  status: string;
  intensidad: string | null;
  observador_id: string;
  notas: string | null;
  especies_fenologicas?: { nombre_comun: string; nombre_cientifico: string } | null;
}

type Tab = 'pronostico' | 'especies' | 'observaciones' | 'calibracion';

const INTENSIDAD_LABEL: Record<string, string> = {
  menos_3: '<3 flores',
  '3_10': '3–10',
  '11_100': '11–100',
  '101_1000': '101–1.000',
  '1001_10000': '1.001–10.000',
  mas_10000: '>10.000',
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function FenologiaView() {
  const apiFetch = useApiFetch();
  const [tab, setTab] = useState<Tab>('pronostico');
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [pronostico, setPronostico] = useState<PronosticoEspecie[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [alertasFloracion, setAlertasFloracion] = useState<
    { id: string; especie_id: string; fecha_predicha: string; gdd_calculado: number | null; estado: string; especies_fenologicas?: { nombre_comun: string } | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editUmbral, setEditUmbral] = useState<Record<string, string>>({});
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [estacionId, setEstacionId] = useState('');
  const [metaEstacion, setMetaEstacion] = useState<{ id: string; nombre: string } | null>(null);

  // Formulario de observación
  const [obsEspecie, setObsEspecie] = useState('');
  const [obsFecha, setObsFecha] = useState(new Date().toISOString().slice(0, 10));
  const [obsBBCH, setObsBBCH] = useState('65');
  const [obsIntensidad, setObsIntensidad] = useState('11_100');
  const [obsNotas, setObsNotas] = useState('');
  const [obsApiario, setObsApiario] = useState('');
  const [misApiarios, setMisApiarios] = useState<{ id: string; name: string | null }[]>([]);
  const [obsMensaje, setObsMensaje] = useState<string | null>(null);

  // Cruce con la herramienta operativa: anclar la observación a un apiario.
  useEffect(() => {
    supabase
      .from('apiarios')
      .select('id, name')
      .order('name')
      .then(({ data }: { data: { id: string; name: string | null }[] | null }) =>
        setMisApiarios(data ?? []),
      );
  }, []);

  const cargar = useCallback(async () => {
    const [especiesRes, pronosticoRes, obsRes, estacionesRes, alertasRes] = await Promise.all([
      apiFetch('/api/fenologia/especies'),
      apiFetch('/api/fenologia/pronostico'),
      apiFetch('/api/fenologia/observaciones?todas=1'),
      apiFetch('/api/fenologia/estaciones'),
      apiFetch('/api/fenologia/alertas?estado=pendiente'),
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

  const [pronApiarioId, setPronApiarioId] = useState('');

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

  const registrarObservacion = async () => {
    setObsMensaje(null);
    if (!obsEspecie) {
      setObsMensaje('Selecciona una especie');
      return;
    }
    let lat: number | null = null;
    let lng: number | null = null;
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        /* GPS no disponible: la observación se registra sin coordenadas */
      }
    }
    const res = await apiFetch('/api/fenologia/observaciones', {
      method: 'POST',
      body: JSON.stringify({
        especie_id: obsEspecie,
        fecha: obsFecha,
        fenofase_bbch: Number(obsBBCH),
        intensidad: obsIntensidad,
        notas: obsNotas || null,
        apiario_id: obsApiario || null,
        lat,
        lng,
      }),
    });
    if (res.ok) {
      setObsMensaje('Observación registrada ✓');
      setObsNotas('');
      setObsApiario('');
      await cargar();
    } else {
      const j = await res.json().catch(() => null);
      setObsMensaje(j?.message ?? 'Error al registrar');
    }
  };

  const stats = useMemo(() => {
    const conUmbral = especies.filter((e) => e.gdd_umbral != null);
    return {
      total: especies.length,
      conUmbral: conUmbral.length,
      observaciones: observaciones.length,
      enFloracion: pronostico.filter((p) => p.enFloracion).length,
    };
  }, [especies, observaciones, pronostico]);

  const currentMonth = new Date().getMonth();
  const currentSeason = CHILOE_SEASONS[currentMonth] ?? CHILOE_SEASONS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Bosque · Ciencia"
        title="Oráculo Fenológico"
        subtitle="GDD por estación, calibrado con datos abiertos: GBIF, iNaturalist y ERA5."
        icon={<Sprout size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-primary px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 font-medium">
              {currentSeason.seasonName}
            </span>
          </div>
        }
      />

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
          {
            id: 'calibracion',
            label: 'Calibración Científica',
            badge: `${stats.conUmbral}/${stats.total}`,
          },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.p key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
            Cargando fenología…
          </motion.p>
        ) : (
          <>
            {tab === 'pronostico' && (
              <motion.div key="pronostico" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <label htmlFor="pron-apiario" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Mi apiario
                  </label>
                  <select
                    id="pron-apiario"
                    value={pronApiarioId}
                    onChange={(e) => void cambiarPronApiario(e.target.value)}
                    className="bg-background border border-border rounded px-3 py-1.5 text-sm"
                  >
                    <option value="">Estación de referencia</option>
                    {misApiarios.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || 'Apiario sin nombre'}
                      </option>
                    ))}
                  </select>
                  {!pronApiarioId && (
                    <>
                      <label htmlFor="estacion-fenologica" className="text-xs uppercase tracking-wider text-muted-foreground">
                        Estación
                      </label>
                      <select
                        id="estacion-fenologica"
                        value={estacionId}
                        onChange={(e) => void cambiarEstacion(e.target.value)}
                        className="bg-background border border-border rounded px-3 py-1.5 text-sm"
                      >
                    {estaciones.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombre}
                      </option>
                    ))}
                      </select>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Especies activas" value={stats.total} />
                  <StatCard label="Con umbral calibrado" value={stats.conUmbral} />
                  <StatCard label="En floración ahora" value={stats.enFloracion} accent={stats.enFloracion > 0} />
                  <StatCard
                    label={metaEstacion ? `GDD acumulado (${metaEstacion.nombre})` : 'GDD acumulado'}
                    value={`${pronostico[0]?.gddActual ?? 0}°d`}
                  />
                </div>
                {pronostico.map((esp) => {
                  const progreso = esp.progreso ?? 0;
                  return (
                    <div key={esp.id} className="card p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-lg text-foreground">{esp.nombreComun}</span>
                          <span className="text-xs text-muted-foreground italic">{esp.nombreCientifico}</span>
                          {esp.enFloracion && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">✨ Floración activa</span>
                          )}
                          {!esp.enFloracion && esp.enVentana && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">En ventana</span>
                          )}
                        </div>
                        <span className="font-datos text-sm text-muted-foreground">
                          {esp.gddActual} / {esp.gddUmbral ?? '—'} GDD
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-foreground/5 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-1000"
                          style={{
                            width: `${progreso}%`,
                            background: esp.enFloracion ? 'hsl(var(--success))' : 'hsl(var(--accent))',
                            opacity: esp.enFloracion ? 1 : 0.6,
                          }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {esp.enFloracion
                          ? 'Néctar disponible — migración y recolección posibles.'
                          : esp.diasEstimados != null
                            ? `Floración estimada en ~${esp.diasEstimados} días (Tbase ${esp.tbase}°C).`
                            : esp.gddUmbral != null
                              ? `Aún lejos del umbral (${esp.gddUmbral} GDD) — sin fecha estimada en 16 días.`
                              : 'Umbral sin calibrar.'}
                      </div>
                    </div>
                  );
                })}
                {alertasFloracion.length > 0 && (
                  <div className="card p-4 border border-warning/30 bg-warning/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity size={16} className="text-warning" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Alertas de floración (GDD)
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {alertasFloracion.map((al) => (
                        <div key={al.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground font-medium">
                            {al.especies_fenologicas?.nombre_comun ?? 'Especie'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Predicha: {new Date(al.fecha_predicha).toLocaleDateString('es-CL')}
                            {al.gdd_calculado != null && ` · ${al.gdd_calculado} GDD`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'especies' && (
              <motion.div key="especies" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                        <th className="py-2 pr-3">Especie</th>
                        <th className="py-2 pr-3">Umbral GDD</th>
                        <th className="py-2 pr-3">Dispersión</th>
                        <th className="py-2 pr-3">Ventana</th>
                        <th className="py-2 pr-3">Fuente</th>
                        <th className="py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {especies.map((esp) => (
                        <tr key={esp.id} className="border-b border-border/40">
                          <td className="py-2.5 pr-3">
                            <span className="font-medium text-foreground">{esp.nombre_comun}</span>
                            <span className="ml-2 text-xs text-muted-foreground italic">{esp.nombre_cientifico}</span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                value={editUmbral[esp.id] ?? esp.gdd_umbral ?? ''}
                                onChange={(e) => setEditUmbral((m) => ({ ...m, [esp.id]: e.target.value }))}
                                className="w-20 bg-background border border-border rounded px-2 py-1 font-datos text-sm"
                                aria-label={`Umbral GDD de ${esp.nombre_comun}`}
                              />
                              <button
                                type="button"
                                onClick={() => void guardarUmbral(esp)}
                                className="px-2 py-1 text-xs rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                              >
                                Guardar
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 font-datos text-muted-foreground">
                            {esp.gdd_stddev != null ? `±${esp.gdd_stddev}` : '—'}
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground">
                            {esp.ventana_ini != null
                              ? `${MESES[esp.ventana_ini - 1]} – ${MESES[(esp.ventana_fin ?? esp.ventana_ini) - 1]}`
                              : '—'}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                              {esp.fuente}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className={`text-xs ${esp.activo ? 'text-success' : 'text-muted-foreground'}`}>
                              {esp.activo ? 'activa' : 'inactiva'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === 'observaciones' && (
              <motion.div key="observaciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid md:grid-cols-2 gap-6">
                <div className="card p-4 border border-border space-y-3">
                  <div className="section-title flex items-center gap-2 text-foreground">
                    <ScanLine size={16} className="text-accent" /> Registrar floración (BBCH 60–69)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="space-y-1 col-span-2">
                      <span className="text-xs text-muted-foreground">Especie</span>
                      <select
                        value={obsEspecie}
                        onChange={(e) => setObsEspecie(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-2 text-sm"
                      >
                        <option value="">Seleccionar…</option>
                        {especies.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nombre_comun} — {e.nombre_cientifico}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">Fecha</span>
                      <input
                        type="date"
                        value={obsFecha}
                        onChange={(e) => setObsFecha(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-2 text-sm"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">Fenofase BBCH</span>
                      <select
                        value={obsBBCH}
                        onChange={(e) => setObsBBCH(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-2 text-sm"
                      >
                        <option value="60">60 · primeras flores</option>
                        <option value="61">61 · ~10%</option>
                        <option value="62">62 · ~20%</option>
                        <option value="63">63 · ~30%</option>
                        <option value="64">64 · ~40%</option>
                        <option value="65">65 · plena floración</option>
                        <option value="67">67 · marchitándose</option>
                        <option value="69">69 · fin de floración</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-muted-foreground">Intensidad</span>
                      <select
                        value={obsIntensidad}
                        onChange={(e) => setObsIntensidad(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-2 text-sm"
                      >
                        {Object.entries(INTENSIDAD_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v} flores
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 col-span-2">
                      <span className="text-xs text-muted-foreground">Apiario (opcional)</span>
                      <select
                        value={obsApiario}
                        onChange={(e) => setObsApiario(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-2 text-sm"
                      >
                        <option value="">Sin apiario — punto suelto</option>
                        {misApiarios.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name || 'Apiario sin nombre'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 col-span-2">
                      <span className="text-xs text-muted-foreground">Notas</span>
                      <input
                        value={obsNotas}
                        onChange={(e) => setObsNotas(e.target.value)}
                        placeholder="Estado del árbol, contexto…"
                        className="w-full bg-background border border-border rounded px-2 py-2 text-sm"
                      />
                    </label>
                  </div>
                  {obsMensaje && (
                    <p className={`text-xs ${obsMensaje.includes('✓') ? 'text-success' : 'text-destructive'}`}>{obsMensaje}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void registrarObservacion()}
                    className="w-full py-2 rounded-md bg-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    Registrar (con GPS si está disponible)
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="section-title flex items-center gap-2 text-foreground">
                    <CalendarDays size={16} className="text-accent" /> Recientes ({observaciones.length})
                  </div>
                  {observaciones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin observaciones todavía.</p>
                  ) : (
                    observaciones.slice(0, 12).map((o) => (
                      <div key={o.id} className="card p-3 border border-border/60 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm text-foreground">
                            {o.especies_fenologicas?.nombre_comun ?? '—'}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">BBCH {o.fenofase_bbch}</span>
                          {o.intensidad && (
                            <span className="ml-2 text-xs text-muted-foreground">{INTENSIDAD_LABEL[o.intensidad]}</span>
                          )}
                        </div>
                        <span className="font-datos text-xs text-muted-foreground">{o.fecha}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {tab === 'calibracion' && (
              <motion.div key="calibracion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Especies" value={stats.total} />
                  <StatCard label="Umbrales calibrados" value={stats.conUmbral} />
                  <StatCard label="Observaciones" value={stats.observaciones} />
                  <StatCard label="Fuentes" value="GBIF · iNat · ERA5" small />
                </div>
                <div className="card p-4 border border-border">
                  <div className="section-title text-foreground">Método</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Umbral GDD = mediana del GDD acumulado (desde 1-jul, Tbase 5°C) hasta cada evento floral
                    anotado en iNaturalist (fenofase «Flowers»), reforzado con la ventana mensual de ocurrencias
                    GBIF en Chiloé. Recalibración pasiva: <code className="font-datos">npx tsx apps/nucleo/scripts/fenologia/calibrar.ts</code>.
                    Validación activa: formulario BBCH en la pestaña Observaciones (protocolo USA-NPN).
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {especies
                    .filter((e) => e.gdd_umbral != null)
                    .sort((a, b) => (b.gdd_umbral ?? 0) - (a.gdd_umbral ?? 0))
                    .map((e) => (
                      <div key={e.id} className="card p-3 border border-border/60 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{e.nombre_comun}</span>
                        <span className="font-datos text-sm text-muted-foreground">
                          {e.gdd_umbral} ± {e.gdd_stddev ?? 0} GDD
                        </span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, accent = false, small = false }: { label: string; value: string | number; accent?: boolean; small?: boolean }) {
  return (
    <div className="card p-3 border border-border">
      <div className={`text-xs uppercase tracking-wider text-muted-foreground`}>{label}</div>
      <div className={`font-display mt-1 ${small ? 'text-base' : 'text-2xl'} ${accent ? 'text-success' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}
