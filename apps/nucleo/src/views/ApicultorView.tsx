'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Hexagon, ThermometerSun, Droplets, Warehouse } from 'lucide-react';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import type { Tables } from '@enjambre/database';
import { ViewLoading } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { fetchPronostico } from '@/lib/meteo';
import { supabase } from '../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { WidgetRail } from '@/components/widgets/WidgetRail';
import dynamic from 'next/dynamic';

const ColmenaFicha = dynamic(
  () => import('../components/apicultor/ColmenaFicha').then((mod) => mod.ColmenaFicha),
  { ssr: false },
);
import { ApiarioManager } from '../components/apicultor/ApiarioManager';
import { HeaderEcosistema } from '../components/apicultor/HeaderEcosistema';
import { GemeloApiario } from '../components/apicultor/GemeloApiario';
import { CuadernoColeccion } from '../components/apicultor/cuaderno/CuadernoColeccion';
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
  const [treesCount, setTreesCount] = useState(0);
  const [tempPureo, setTempPureo] = useState('—');
  const [localColmenas, setLocalColmenas] = useState<ColmenaWithRelations[]>([]);
  const [apiarios, setApiarios] = useState<Tables<'apiarios'>[]>([]);
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

        if (uid) {
          const treesRes = await apiFetch('/api/produccion/arboles');
          if (treesRes.ok) {
            const treesJson = await treesRes.json();
            setTreesCount((treesJson.data ?? []).length);
          }
        }

        const { data: apiariosData } = await supabase.from('apiarios').select('*');
        const list = (apiariosData as Tables<'apiarios'>[] | null) ?? [];
        setApiarios(list);
        const apiarioMap = new Map(list.map((a) => [a.id, a]));

        const nested = await supabase.from('colmenas').select(`
                    *,
                    inspecciones (*),
                    varroa_records (*),
                    peso_records (*)
                `);
        let colmenasData = nested.data;
        if (nested.error) {
          const flat = await supabase.from('colmenas').select('*');
          colmenasData = flat.data;
        }

        if (colmenasData?.length) {
          const mapped = (colmenasData as Tables<'colmenas'>[]).map((c) => {
            const apiario = c.apiario_id ? apiarioMap.get(c.apiario_id) : null;
            return {
              ...c,
              apiario_name: apiario?.name || 'Sin apiario',
              lat: typeof apiario?.lat === 'number' ? apiario.lat : 0,
              lng: typeof apiario?.lng === 'number' ? apiario.lng : 0,
              costos: {
                horas_anuales: 0,
                costo_hora: 0,
                amortizacion_cajon: 12000,
                insumos_anuales: 0,
                produccion_kg: 0,
              },
            };
          });
          setLocalColmenas(mapped as ColmenaWithRelations[]);
        } else {
          setLocalColmenas([]);
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

  useEffect(() => {
    fetchPronostico().then((data) => {
      if (!data?.temperature_2m?.length) return;
      const hour = new Date().getHours();
      const temp = data.temperature_2m[hour] ?? data.temperature_2m[0];
      if (typeof temp === 'number') setTempPureo(`${Math.round(temp)}°C`);
    });
  }, []);

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
          production_total: updated.production_total,
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

  const isCuaderno = initialView === 'sanidad';
  const inWorkspace = !isCuaderno && Boolean(activeApiario);

  if (loading) {
    return <ViewLoading variant="view" label="Cargando colmenas" hideLabel />;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="view-deep-header-bleed">
        <HeaderEcosistema />
      </div>

      {selectedColmena && (
        <ColmenaFicha
          colmena={selectedColmena}
          colmenas={localColmenas}
          onClose={() => setSelectedColmena(null)}
          onUpdate={handleUpdateColmena}
        />
      )}

      <ViewShell
        title={isCuaderno ? 'Cuaderno de Campo' : inWorkspace ? activeApiario!.name || 'Apiario' : 'Colmenas'}
        subtitle={
          isCuaderno
            ? 'Visitas, sanidad, varroa y red semántica del ciclo'
            : inWorkspace
              ? 'Colmenas de este apiario · gemelo 3D · crear o editar colmenas'
              : 'Tus apiarios: entra a uno para ver colmenas. Con un solo apiario se abre solo.'
        }
        variant="clean"
        icon={isCuaderno ? undefined : inWorkspace ? <Warehouse size={20} /> : <Hexagon size={20} />}
      />

      {!isCuaderno && (
        <div className="stats-grid">
          {[
            {
              icon: <Warehouse size={20} />,
              val: apiarios.length,
              label: 'Apiarios',
            },
            {
              icon: <Hexagon size={20} />,
              val: (inWorkspace ? colmenasEnApiario : localColmenas).length,
              label: inWorkspace ? 'Colmenas en este apiario' : 'Colmenas activas',
            },
            {
              icon: <Droplets size={20} />,
              val: `${totalProduction} kg`,
              label: 'Producción temporada',
            },
            {
              icon: <ThermometerSun size={20} />,
              val: tempPureo,
              label: 'Temp. Pureo ahora',
            },
          ].map((s, i) => (
            <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
              <div className="stat-header">
                <div className="stat-icon">{s.icon}</div>
              </div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-grid dashboard-grid-2-1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {isCuaderno ? (
            <div className="animate-in delay-2">
              <CuadernoColeccion colmenas={localColmenas} hideHeader />
            </div>
          ) : (
            <div
              className="animate-in delay-2"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}
            >
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
              <ApiarioManager
                colmenas={localColmenas}
                setColmenas={setLocalColmenas}
                apiarios={apiarios}
                setApiarios={setApiarios}
                onSelectColmena={setSelectedColmena}
                activeApiarioId={activeApiarioId}
                onEnterApiario={enterApiario}
                onLeaveApiario={leaveApiario}
              />
            </div>
          )}
        </div>

        {!isCuaderno && (
          <WidgetRail contexto="apicultor" />
        )}
      </div>
    </div>
  );
}
