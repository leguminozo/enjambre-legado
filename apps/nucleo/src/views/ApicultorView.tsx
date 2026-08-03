import { useState, useEffect } from 'react';
import { Hexagon, ThermometerSun, Droplets, TreePine, CalendarDays, LineChart, Activity, Map as MapIcon, MapPin } from 'lucide-react';
import type { ColmenaWithRelations, InspeccionRow, VarroaRow, PesoRow } from '@/lib/apicultor-types';
import type { Tables } from '@enjambre/database';
import { healthFromEstado, estadoFromHealth } from '@/types/ecosystem';
import { ViewLoading } from '@enjambre/ui';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { ViewShell } from '@/components/layout/ViewShell';
import { fetchPronostico } from '@/lib/meteo';
import { supabase } from '../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { WidgetRail } from '@/components/widgets/WidgetRail';
import dynamic from 'next/dynamic';

const ColmenaFicha = dynamic(
  () => import('../components/apicultor/ColmenaFicha').then((mod) => mod.ColmenaFicha),
  { ssr: false }
);
import { TrazabilidadPanel } from '../components/apicultor/TrazabilidadPanel';
import { ApiarioManager } from '../components/apicultor/ApiarioManager';
import { HeaderEcosistema } from '../components/apicultor/HeaderEcosistema';
import { GemeloApiario } from '../components/apicultor/GemeloApiario';
import { TerritorioUsuarioPanel } from '../components/apicultor/TerritorioUsuarioPanel';
import { CuadernoCampoPanel } from '../components/apicultor/CuadernoCampoPanel';

type ViewTab = 'colmenas' | 'apiarios' | 'calendario' | 'trazabilidad' | 'territorio' | 'sanidad';

/** Título y subtítulo por tab: la herramienta se nombra igual que en el sidebar */
const VIEW_TITLES: Record<ViewTab, string> = {
  colmenas: 'Colmenas',
  apiarios: 'Apiarios',
  sanidad: 'Cuaderno Campo',
  calendario: 'Calendario',
  trazabilidad: 'Trazabilidad',
  territorio: 'Mi Territorio',
}

const VIEW_SUBTITLES: Record<ViewTab, string> = {
  colmenas: 'Monitorea tus colmenas y su desarrollo',
  apiarios: 'Organiza tus apiarios en el territorio',
  sanidad: 'Cuaderno de campo: sanidad, varroa y peso',
  calendario: 'Agenda del ciclo: mes, día y eventos',
  trazabilidad: 'Lotes, QR y pasaporte público de tu miel',
  territorio: 'Tu presencia en el Registro Territorial de Chiloé',
}

/**
 * Vista del apiario. Cada tab puede abrirse como ruta propia desde la sidebar
 * (RECOLECCIÓN → /colmenas, /colmenas/apiarios, /colmenas/cuaderno, /colmenas/trazabilidad)
 * vía `initialView`; el tab bar permite moverse dentro del módulo sin recargar.
 */
export function ApicultorView({ initialView = 'colmenas' }: { initialView?: ViewTab } = {}) {
    const apiFetch = useApiFetch();
    const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null);
    const [treesCount, setTreesCount] = useState<number>(0);
    const [tempPureo, setTempPureo] = useState<string>('—');
    const [localColmenas, setLocalColmenas] = useState<ColmenaWithRelations[]>([]);
    const [apiarios, setApiarios] = useState<Tables<'apiarios'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedColmena, setSelectedColmena] = useState<ColmenaWithRelations | null>(null);
    const [activeView, setActiveView] = useState<ViewTab>(initialView);

    // Fetch data from Supabase
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const uid = user?.id;

                if (uid) {
                    const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).single();
                    setUserProfile(prof);

                    const treesRes = await apiFetch('/api/produccion/arboles');
                    if (treesRes.ok) {
                        const treesJson = await treesRes.json();
                        setTreesCount((treesJson.data ?? []).length);
                    }
                }

                const { data: apiariosData } = await supabase.from('apiarios').select('*');
                setApiarios((apiariosData as Tables<'apiarios'>[] | null) ?? []);
                const apiarioMap = new Map((apiariosData as Tables<'apiarios'>[] | null)?.map((a) => [a.id, a]) || []);

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
                            }
                        };
                    });
                    setLocalColmenas(mapped as ColmenaWithRelations[]);
                } else {
                    setLocalColmenas([]);
                }

            } catch (err) {
                console.error('Error loading Supabase data:', err);
                setLocalColmenas([]);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [apiFetch]);

    useEffect(() => {
        fetchPronostico().then((data) => {
            if (!data?.temperature_2m?.length) return;
            const hour = new Date().getHours();
            const temp = data.temperature_2m[hour] ?? data.temperature_2m[0];
            if (typeof temp === 'number') setTempPureo(`${Math.round(temp)}°C`);
        });
    }, []);

    const handleUpdateColmena = async (updated: ColmenaWithRelations) => {
        setLocalColmenas(prev => prev.map(c => c.id === updated.id ? updated : c));
        if (selectedColmena?.id === updated.id) setSelectedColmena(updated);

        if (!updated.id || updated.id.length < 20) return;
        try {
            const { error } = await supabase.from('colmenas').update({
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
            }).eq('id', updated.id);
            if (error) throw error;
        } catch (err) {
            console.error('Error syncing colmena:', err);
        }
    };

    const totalProduction = localColmenas.reduce((sum, c) => sum + (c.production_total || 0), 0);

    if (loading) {
        return <ViewLoading variant="view" label="Cargando colmenas" hideLabel />;
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="view-deep-header-bleed">
                <HeaderEcosistema />
            </div>

            {selectedColmena && (
                <ColmenaFicha colmena={selectedColmena} colmenas={localColmenas} onClose={() => setSelectedColmena(null)} onUpdate={handleUpdateColmena} />
            )}

            <ViewShell
                greeting={`¡Hola, ${userProfile?.full_name || 'Apicultor'}!`}
                title={VIEW_TITLES[activeView]}
                subtitle={VIEW_SUBTITLES[activeView]}
            />

            <div className="stats-grid">
                {[
                    { icon: <Hexagon size={20} />, val: localColmenas.length, label: 'Colmenas activas' },
                    { icon: <Droplets size={20} />, val: `${totalProduction} kg`, label: 'Producción temporada' },
                    { icon: <ThermometerSun size={20} />, val: tempPureo, label: 'Temp. Pureo ahora' },
                    { icon: <TreePine size={20} />, val: treesCount.toLocaleString('es-CL'), label: 'Árboles Pureo' },
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

            <ResponsiveTabBar
              variant="pill"
              layoutId="apicultor-tabs"
              className="mt-2 mb-2"
              tabs={[
                { id: 'colmenas', label: 'Colmenas', icon: <Activity size={16} /> },
                { id: 'apiarios', label: 'Apiarios', icon: <MapPin size={16} /> },
                { id: 'sanidad', label: 'Cuaderno Campo', icon: <Droplets size={16} /> },
                { id: 'calendario', label: 'Calendario', icon: <CalendarDays size={16} /> },
                { id: 'trazabilidad', label: 'Trazabilidad', icon: <LineChart size={16} /> },
                { id: 'territorio', label: 'Mi Territorio', icon: <MapIcon size={16} /> },
              ]}
              activeId={activeView}
              onChange={(id) => setActiveView(id as ViewTab)}
            />

            <div className="dashboard-grid dashboard-grid-2-1">
                {/* Left Column (Main Content based on tab) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {activeView === 'colmenas' && (
                        <div className="animate-in delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            <GemeloApiario colmenas={localColmenas} apiarioName={localColmenas[0]?.apiario_name} />
                            <ApiarioManager colmenas={localColmenas} setColmenas={setLocalColmenas} apiarios={apiarios} setApiarios={setApiarios} onSelectColmena={setSelectedColmena} />
                        </div>
                    )}

                    {activeView === 'apiarios' && (
                        <div className="animate-in delay-2">
                            <ApiarioManager colmenas={localColmenas} setColmenas={setLocalColmenas} apiarios={apiarios} setApiarios={setApiarios} onSelectColmena={setSelectedColmena} />
                        </div>
                    )}

                    {activeView === 'calendario' && (
                        <div className="animate-in delay-2 flex flex-col items-center justify-center p-12 bg-card border border-border/50 rounded-xl text-center">
                            <CalendarDays className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-xl font-display font-bold mb-2">Calendario Centralizado</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                El ciclo del bosque ahora se gestiona desde el nuevo OmniCalendar transversal.
                            </p>
                            <a href="/calendario?type=apicultura" className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors">
                                Abrir mes · Apicultura
                            </a>
                        </div>
                    )}

                    {activeView === 'trazabilidad' && (
                        <div className="animate-in delay-2">
                            <TrazabilidadPanel />
                        </div>
                    )}

                    {activeView === 'territorio' && (
                        <div className="animate-in delay-2">
                            <TerritorioUsuarioPanel />
                        </div>
                    )}

                    {activeView === 'sanidad' && (
                        <div className="animate-in delay-2">
                            <CuadernoCampoPanel colmenas={localColmenas} />
                        </div>
                    )}
                </div>

                {/* Right Column (Widgets registrados: oráculo, vuelo, bioacústica, voz, reflexión) */}
                <WidgetRail contexto="apicultor" />
            </div>
        </div>
    );
}
