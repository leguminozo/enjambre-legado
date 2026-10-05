'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Hexagon, NotebookPen, ThermometerSun, Droplets, Warehouse, TreePine, ChevronDown } from 'lucide-react';
import type { ColmenaWithRelations, RegistroApiarioEstado } from '@/lib/apicultor-types';
import type { Tables } from '@enjambre/database';
import { ViewLoading, Button } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useRouter } from 'next/navigation';
import { fetchPronostico } from '@/lib/meteo';
import { resolveComunaCoords } from '@/lib/cliente-coords';
import { supabase } from '../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import dynamic from 'next/dynamic';

const ColmenaFicha = dynamic(
  () => import('../components/apicultor/ColmenaFicha').then((mod) => mod.ColmenaFicha),
  { ssr: false },
);
import { ApiarioManager } from '../components/apicultor/ApiarioManager';

import { GemeloApiario } from '../components/apicultor/GemeloApiario';
import type { TerritorialAlertInput } from '@/lib/hive-state';

type ViewTab = 'colmenas' | 'apiarios' | 'sanidad';

const ACTIVE_APIARIO_KEY = 'enjambre:active-apiario-id';

/**
 * CAMPO unificado:
 * - Colmenas: colección de apiarios → entrar al apiario (colmenas + gemelo).
 *   Con 1 apiario se entra solo; con varios se elige; siempre se puede crear/editar.
 * - /colmenas/apiarios redirige aquí (sin segunda herramienta duplicada).
 * - Cuaderno sigue en /colmenas/cuaderno.
 */
export function ApicultorView({ initialView = 'colmenas' }: { initialView?: ViewTab } = {}) {
  const apiFetch = useApiFetch();
  const router = useRouter();
  const [treesCount, setTreesCount] = useState(0);
  const [territoryWeather, setTerritoryWeather] = useState<{ temp: string; zone: string }>({
    temp: '—',
    zone: 'Pureo',
  });
  const [localColmenas, setLocalColmenas] = useState<ColmenaWithRelations[]>([]);
  const [apiarios, setApiarios] = useState<Tables<'apiarios'>[]>([]);
  const [registroMap, setRegistroMap] = useState<Record<string, RegistroApiarioEstado>>({});
  const [loading, setLoading] = useState(true);
  const [selectedColmena, setSelectedColmena] = useState<ColmenaWithRelations | null>(null);
  const [territorialAlerts, setTerritorialAlerts] = useState<TerritorialAlertInput[]>([]);
  const [activeApiarioId, setActiveApiarioId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(ACTIVE_APIARIO_KEY);
    } catch {
      return null;
    }
  });

  const enterApiario = useCallback((id: string) => {
    setActiveApiarioId(id);
    try {
      sessionStorage.setItem(ACTIVE_APIARIO_KEY, id);
    } catch {
      /* private mode */
    }
  }, []);

  const leaveApiario = useCallback(() => {
    setActiveApiarioId(null);
    try {
      sessionStorage.removeItem(ACTIVE_APIARIO_KEY);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const uid = user?.id;
        let resolvedZone = 'Pureo';
        let resolvedCoords: { lat: number; lng: number } | null = null;

        if (uid) {
          const treesRes = await apiFetch('/api/produccion/arboles');
          if (treesRes.ok) {
            const treesJson = await treesRes.json();
            const totalTrees = (treesJson.data ?? []).reduce(
              (sum: number, r: { cantidad?: number }) => sum + (Number(r.cantidad) || 0),
              0,
            );
            setTreesCount(totalTrees);
          }

          // Ubicación de registro del actor (comuna declarada al acceder a la infraestructura)
          const { data: actor } = await supabase
            .from('actores_registro')
            .select('comuna, region')
            .eq('user_id', uid)
            .maybeSingle();

          if (actor?.comuna && actor.comuna.toLowerCase() !== 'desconocida') {
            resolvedZone = actor.comuna;
            resolvedCoords = resolveComunaCoords(actor.comuna);
          }
        }

        const { data: apiariosData } = await supabase.from('apiarios').select('*');
        const list = (apiariosData as Tables<'apiarios'>[] | null) ?? [];
        setApiarios(list);
        const apiarioMap = new Map(list.map((a) => [a.id, a]));

        // Si hay apiario activo o apiario con coordenadas, priorizar su microclima
        const currentApiario = list.find((a) => a.id === activeApiarioId) || (list.length === 1 ? list[0] : null);
        if (currentApiario && typeof currentApiario.lat === 'number' && typeof currentApiario.lng === 'number' && currentApiario.lat !== 0) {
          resolvedZone = currentApiario.name || resolvedZone;
          resolvedCoords = { lat: currentApiario.lat, lng: currentApiario.lng };
        } else if (list.length > 0 && typeof list[0]?.lat === 'number' && typeof list[0]?.lng === 'number' && list[0].lat !== 0 && !resolvedCoords) {
          resolvedZone = list[0].name || resolvedZone;
          resolvedCoords = { lat: list[0].lat, lng: list[0].lng };
        }

        // Cargar pronóstico hiper-local del territorio del usuario
        fetchPronostico(resolvedCoords).then((data) => {
          if (!data?.temperature_2m?.length) return;
          const hour = new Date().getHours();
          const temp = data.temperature_2m[hour] ?? data.temperature_2m[0];
          if (typeof temp === 'number') {
            setTerritoryWeather({
              temp: `${Math.round(temp)}°C`,
              zone: resolvedZone,
            });
          }
        });

        // Cruce bidireccional: estado de cada apiario en el Registro Territorial.
        const estadoRes = await apiFetch('/api/registro-territorial/apiarios/estado-operativo');
        if (estadoRes.ok) {
          const estadoJson = (await estadoRes.json()) as { data: RegistroApiarioEstado[] };
          const map: Record<string, RegistroApiarioEstado> = {};
          for (const r of estadoJson.data ?? []) {
            map[r.apiario_origen_id] = r;
          }
          setRegistroMap(map);
        }

        // Regla estricta: Si el apicultor no tiene apiarios (list.length === 0), NO tiene colmenas activas.
        if (list.length === 0) {
          setLocalColmenas([]);
        } else {
          const apiarioIds = list.map((a) => a.id);
          const nested = await supabase
            .from('colmenas')
            .select(`
              *,
              inspecciones (*),
              varroa_records (*),
              peso_records (*),
              tratamientos (*)
            `)
            .in('apiario_id', apiarioIds);

          let colmenasData = nested.data;
          if (nested.error) {
            const flat = await supabase
              .from('colmenas')
              .select('*')
              .in('apiario_id', apiarioIds);
            colmenasData = flat.data;
          }

          // B3: costos reales por colmena (antes se fabricaban con ceros).
          const costosRes = await apiFetch('/api/bitacora/costos');
          const costosMap = new Map<
            string,
            { horas_anuales: number | null; costo_hora: number | null; amortizacion_cajon: number | null; insumos_anuales: number | null }
          >();
          if (costosRes.ok) {
            const cj = (await costosRes.json()) as {
              data: { colmena_id: string | null; horas_anuales: number | null; costo_hora: number | null; amortizacion_cajon: number | null; insumos_anuales: number | null }[];
            };
            for (const r of cj.data ?? []) {
              if (r.colmena_id) {
                costosMap.set(r.colmena_id, {
                  horas_anuales: r.horas_anuales,
                  costo_hora: r.costo_hora,
                  amortizacion_cajon: r.amortizacion_cajon,
                  insumos_anuales: r.insumos_anuales,
                });
              }
            }
          }
          const costosDe = (id: string | null) => {
            const r = id ? costosMap.get(id) : undefined;
            return {
              horas_anuales: Number(r?.horas_anuales ?? 0),
              costo_hora: Number(r?.costo_hora ?? 0),
              amortizacion_cajon: Number(r?.amortizacion_cajon ?? 12000),
              insumos_anuales: Number(r?.insumos_anuales ?? 0),
              produccion_kg: 0,
            };
          };

          if (colmenasData?.length) {
            const mapped = (colmenasData as Tables<'colmenas'>[])
              .filter((c) => c.apiario_id && apiarioMap.has(c.apiario_id))
              .map((c) => {
                const apiario = apiarioMap.get(c.apiario_id!);
                return {
                  ...c,
                  apiario_name: apiario?.name || 'Apiario',
                  lat: typeof apiario?.lat === 'number' ? apiario.lat : 0,
                  lng: typeof apiario?.lng === 'number' ? apiario.lng : 0,
                  costos: costosDe(c.id),
                };
              });
            setLocalColmenas(mapped as ColmenaWithRelations[]);
          } else {
            setLocalColmenas([]);
          }
        }

        // Alertas fitosanitarias activas → radio del gemelo (HiveState)
        const { data: alertasData, error: alertasErr } = await supabase
          .from('alertas_fitosanitarias')
          .select('lat_aproximada, lng_aproximada, radio_km, estado, fecha_programada')
          .in('estado', ['activa', 'programada']);
        setTerritorialAlerts(
          !alertasErr && alertasData ? (alertasData as TerritorialAlertInput[]) : [],
        );

        // Auto-entrada: un solo apiario → entrar; id guardado inválido → limpiar
        if (list.length === 1 && list[0]) {
          enterApiario(list[0].id);
        } else if (list.length === 0) {
          leaveApiario();
        } else {
          const stored = (() => {
            try {
              return sessionStorage.getItem(ACTIVE_APIARIO_KEY);
            } catch {
              return null;
            }
          })();
          if (stored && !list.some((a) => a.id === stored)) {
            leaveApiario();
          }
        }
      } catch (err) {
        console.error('Error loading Supabase data:', err);
        setLocalColmenas([]);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [apiFetch, enterApiario, leaveApiario]);

  const handleUpdateColmena = async (updated: ColmenaWithRelations) => {
    setLocalColmenas((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (selectedColmena?.id === updated.id) setSelectedColmena(updated);

    if (!updated.id || updated.id.length < 20) return;
    try {
      const { error } = await supabase
        .from('colmenas')
        .update({
          name: updated.name,
          health: updated.health,
          floracion: updated.floracion,
          last_inspection: updated.last_inspection || null,
          alzas: updated.alzas,
          notes: updated.notes || '',
          queen: updated.queen || null,
          nucleos_candidatos: updated.nucleos_candidatos,
          origen_tipo: updated.origen_tipo ?? null,
          origen_fecha: updated.origen_fecha ?? null,
          origen_colmena_madre: updated.origen_colmena_madre ?? null,
          origen_detalle: updated.origen_detalle ?? null,
        })
        .eq('id', updated.id);
      if (error) throw error;
    } catch (err) {
      console.error('Error syncing colmena:', err);
    }
  };

  const activeApiario = useMemo(
    () => apiarios.find((a) => a.id === activeApiarioId) ?? null,
    [apiarios, activeApiarioId],
  );

  const colmenasEnApiario = useMemo(() => {
    if (!activeApiario) return localColmenas;
    return localColmenas.filter(
      (c) => c.apiario_id === activeApiario.id || c.apiario_name === activeApiario.name,
    );
  }, [localColmenas, activeApiario]);

  const totalProduction = (activeApiario ? colmenasEnApiario : localColmenas).reduce(
    (sum, c) => sum + (c.production_total || 0),
    0,
  );

  const inWorkspace = Boolean(activeApiario);

  if (loading) {
    return <ViewLoading variant="view" label="Cargando colmenas" hideLabel />;
  }

  return (
    <div className="space-y-6 animate-in">

      {selectedColmena && (
        <ColmenaFicha
          colmena={selectedColmena}
          colmenas={localColmenas}
          onClose={() => setSelectedColmena(null)}
          onUpdate={handleUpdateColmena}
          onOpenColmena={(id) => {
            const c = localColmenas.find((x) => x.id === id);
            if (c) setSelectedColmena(c);
          }}
          hiveCtx={{
            ambientTempC:
              territoryWeather.temp !== '—'
                ? parseInt(territoryWeather.temp.replace(/[^\d-]/g, ''), 10) || null
                : null,
            apiarioLat:
              typeof activeApiario?.lat === 'number' ? activeApiario.lat : selectedColmena.lat,
            apiarioLng:
              typeof activeApiario?.lng === 'number' ? activeApiario.lng : selectedColmena.lng,
            territorialAlerts,
          }}
        />
      )}

      <ViewShell
        title={inWorkspace ? activeApiario!.name || 'Apiario' : 'Colmenas'}
        subtitle={
          inWorkspace
            ? 'Colmenas de este apiario · gestión y bitácora'
            : 'Tus apiarios: entra a uno para ver colmenas. Con un solo apiario se abre solo.'
        }
        variant="clean"
        icon={inWorkspace ? <Warehouse size={20} /> : <Hexagon size={20} />}
        actions={
          !inWorkspace ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/colmenas/cuaderno')}
              className="rounded-xl text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
            >
              <NotebookPen className="size-3.5 mr-1" /> Cuaderno de Campo
            </Button>
          ) : undefined
        }
      />

      <div className="animate-in delay-1 flex flex-wrap items-center gap-x-5 gap-y-1 px-1 py-2 text-xs text-muted-foreground border-b border-border mb-4">
        {!inWorkspace ? (
          <>
            <span className="flex items-center gap-1.5">
              <Warehouse size={13} className="shrink-0" />
              <span className="font-medium text-foreground">{apiarios.length}</span>{' '}
              {apiarios.length === 1 ? 'apiario' : 'apiarios'}
            </span>
            <span className="text-border select-none">·</span>
            <span className="flex items-center gap-1.5">
              <Hexagon size={13} className="shrink-0" />
              <span className="font-medium text-foreground">{localColmenas.length}</span>{' '}
              {localColmenas.length === 1 ? 'colmena activa' : 'colmenas activas'}
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            <Hexagon size={13} className="shrink-0" />
            <span className="font-medium text-foreground">{colmenasEnApiario.length}</span>{' '}
            {colmenasEnApiario.length === 1 ? 'colmena en este apiario' : 'colmenas en este apiario'}
          </span>
        )}
        <span className="text-border select-none">·</span>
        <span className="flex items-center gap-1.5">
          <Droplets size={13} className="shrink-0" />
          <span className="font-medium text-foreground">{totalProduction} kg</span> temporada
        </span>
        {territoryWeather.temp !== '—' && (
          <>
            <span className="text-border select-none">·</span>
            <span className="flex items-center gap-1.5" title={`Temperatura en ${territoryWeather.zone}`}>
              <ThermometerSun size={13} className="shrink-0" />
              <span className="font-medium text-foreground">{territoryWeather.temp}</span> {territoryWeather.zone}
            </span>
          </>
        )}
        {treesCount > 0 && (
          <>
            <span className="text-border select-none">·</span>
            <span className="flex items-center gap-1.5">
              <TreePine size={13} className="shrink-0" />
              <span className="font-medium text-foreground">{treesCount}</span> árboles nativos
            </span>
          </>
        )}
      </div>

      <div className="animate-in delay-2 flex flex-col gap-6">
        <ApiarioManager
          colmenas={localColmenas}
          setColmenas={setLocalColmenas}
          apiarios={apiarios}
          setApiarios={setApiarios}
          onSelectColmena={setSelectedColmena}
          activeApiarioId={activeApiarioId}
          onEnterApiario={enterApiario}
          onLeaveApiario={leaveApiario}
          registroMap={registroMap}
          onRegistroChange={setRegistroMap}
          hiveCtx={{
            ambientTempC:
              territoryWeather.temp !== '—'
                ? parseInt(territoryWeather.temp.replace(/[^\d-]/g, ''), 10) || null
                : null,
            apiarioLat:
              typeof activeApiario?.lat === 'number' ? activeApiario.lat : null,
            apiarioLng:
              typeof activeApiario?.lng === 'number' ? activeApiario.lng : null,
            territorialAlerts,
          }}
        />
        {inWorkspace && activeApiario && (
          <GemeloApiario
            colmenas={colmenasEnApiario}
            apiarioName={activeApiario.name ?? undefined}
            apiarioLat={typeof activeApiario.lat === 'number' ? activeApiario.lat : null}
            apiarioLng={typeof activeApiario.lng === 'number' ? activeApiario.lng : null}
            territorialAlerts={territorialAlerts}
            onSelectColmena={setSelectedColmena}
          />
        )}
      </div>
    </div>
  );
}
