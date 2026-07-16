import { useState, useEffect } from 'react';
import { Hexagon, ThermometerSun, Droplets, TreePine, AlertTriangle, CalendarDays, LineChart, Activity } from 'lucide-react';
import type { ColmenaWithRelations, InspeccionRow, VarroaRow, PesoRow } from '@/lib/apicultor-types';
import { healthFromEstado, estadoFromHealth } from '@/types/ecosystem';
import { ViewLoading } from '@enjambre/ui';
import { ResponsiveTabBar } from '@/components/layout/ResponsiveTabBar';
import { ViewShell } from '@/components/layout/ViewShell';
import { NectarRail } from '@/components/layout/NectarRail';
import { fetchPronostico } from '@/lib/meteo';
import { mapInAppNotificationToAlertItem } from '@enjambre/auth';
import { supabase } from '../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ColmenaFicha } from '../components/apicultor/ColmenaFicha';
import { TrazabilidadPanel } from '../components/apicultor/TrazabilidadPanel';
import { ApiarioManager } from '../components/apicultor/ApiarioManager';
import { HeaderEcosistema } from '../components/apicultor/HeaderEcosistema';
import { OraculoFloracion } from '../components/apicultor/OraculoFloracion';
import { VentanasDeVuelo } from '../components/apicultor/VentanasDeVuelo';
import { GemeloApiario } from '../components/apicultor/GemeloApiario';
import { EspectroVivo } from '../components/apicultor/EspectroVivo';

interface AlertItem {
  id?: string | number;
  severity: 'critical' | 'warning' | 'success';
  title: string;
  message: string;
}

interface ReflexionData {
  date: string;
  content: string;
  author?: string;
  date_display?: string;
  created_at?: string;
}

type ViewTab = 'colmenas' | 'calendario' | 'trazabilidad';

export function ApicultorView() {
    const apiFetch = useApiFetch();
    const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null);
    const [treesCount, setTreesCount] = useState<number>(0);
    const [tempPureo, setTempPureo] = useState<string>('—');
    const [localColmenas, setLocalColmenas] = useState<ColmenaWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedColmena, setSelectedColmena] = useState<ColmenaWithRelations | null>(null);
    const [activeView, setActiveView] = useState<ViewTab>('colmenas');

    // Phase 4 dynamic data
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [reflexion, setReflexion] = useState<ReflexionData | null>(null);

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

                const { data: apiarios } = await supabase.from('apiarios').select('*');
                const apiarioMap = new Map<string, any>(apiarios?.map((a: any) => [a.id, a]) || []);

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
                    const mapped = colmenasData.map((c: any) => {
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

                if (uid) {
                    const [resA, resR] = await Promise.all([
                        supabase
                            .from('notification_events')
                            .select('*')
                            .eq('created_by', uid)
                            .eq('channel', 'in_app')
                            .order('created_at', { ascending: false })
                            .limit(3),
                        apiFetch('/api/produccion/reflexiones'),
                    ]);

                    setAlerts((resA.data ?? []).map(mapInAppNotificationToAlertItem));
                    if (resR.ok) {
                        const reflexJson = await resR.json();
                        const row = (reflexJson.data ?? [])[0] as
                          | { fecha?: string; texto?: string; colmena?: string }
                          | undefined;
                        if (row) {
                            setReflexion({
                                date: row.fecha ?? '',
                                content: row.texto ?? '',
                                date_display: row.colmena,
                            });
                        } else {
                            setReflexion(null);
                        }
                    } else {
                        setReflexion(null);
                    }
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
                <ColmenaFicha colmena={selectedColmena} onClose={() => setSelectedColmena(null)} onUpdate={handleUpdateColmena} />
            )}

            <ViewShell
                greeting={`¡Hola, ${userProfile?.full_name || 'Apicultor'}!`}
                title="Estás conectado al Bosque Nativo"
                subtitle="Monitorea colmenas y analiza flujos de floración"
            />
            <NectarRail current="/colmenas" />

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
                { id: 'colmenas', label: 'Mis Colmenas', icon: <Activity size={16} /> },
                { id: 'calendario', label: 'Ciclo del Bosque', icon: <CalendarDays size={16} /> },
                { id: 'trazabilidad', label: 'Trazabilidad', icon: <LineChart size={16} /> },
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
                            <ApiarioManager colmenas={localColmenas} setColmenas={setLocalColmenas} onSelectColmena={setSelectedColmena} />
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
                </div>

                {/* Right Column (Siempre visible: Voz de la colmena & Reflexiones rápidas) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div className="card card-accent animate-in delay-3">
                        <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={16} style={{ color: 'hsl(var(--warning))' }} /> Voz de la Colmena
                        </div>
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'hsl(var(--muted-foreground))' }}>
                            {alerts.map((a, i) => (
                                <p key={a.id || i} style={{ marginBottom: i < alerts.length - 1 ? 'var(--space-md)' : 0 }}>
                                    <strong style={{ color: a.severity === 'critical' ? 'hsl(var(--destructive))' : a.severity === 'warning' ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>
                                        {a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '⚠' : '✨'} {a.title}:
                                    </strong> {a.message}
                                </p>
                            ))}
                        </div>
                    </div>
                    
                    <VentanasDeVuelo />
                    <OraculoFloracion />
                    <EspectroVivo />

                    {reflexion && (
                        <div className="card animate-in delay-4" style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))', color: 'hsl(var(--primary-foreground))', border: 'none' }}>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'hsl(var(--accent))', marginBottom: 'var(--space-sm)' }}>
                                Última Reflexión · {reflexion.date || new Date().toLocaleDateString()}
                            </div>
                            <p style={{ fontFamily: 'var(--font-existencial)', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.6, color: 'hsl(var(--primary-foreground) / 0.85)' }}>
                                "{reflexion.content}"
                            </p>
                            <div style={{ marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'hsl(var(--primary-foreground) / 0.45)' }}>
                                — {reflexion.author || 'Generado automático posvisita'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
