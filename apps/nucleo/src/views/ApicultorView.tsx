import { useState, useEffect } from 'react';
import { Hexagon, ThermometerSun, Droplets, TreePine, AlertTriangle, CalendarDays, LineChart, Activity } from 'lucide-react';
import type { Colmena, InspeccionRecord, VarroaRecord, PesoRecord } from '../data/mockData';
import { SegmentControl } from '../components/ui/SegmentControl';

function healthFromEstado(estado: string | null | undefined): Colmena['health'] {
    if (estado === 'optima') return 'optimal';
    if (estado === 'atencion') return 'attention';
    return 'risk';
}
import { mapInAppNotificationToAlertItem } from '@enjambre/auth';
import { supabase } from '../lib/supabase';
import { ColmenaFicha } from '../components/apicultor/ColmenaFicha';
import { CalendarioCiclico } from '../components/apicultor/CalendarioCiclico';
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
    const [userProfile, setUserProfile] = useState<{ full_name?: string } | null>(null);
    const [treesCount, setTreesCount] = useState<number>(0);
    const [localColmenas, setLocalColmenas] = useState<Colmena[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedColmena, setSelectedColmena] = useState<Colmena | null>(null);
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

                    const { count: trees } = await supabase.from('arboles_plantados').select('id', { count: 'exact', head: true });
                    setTreesCount(trees ?? 0);
                }

                const { data: apiarios } = await supabase.from('apiarios').select('*');
                const apiarioMap = new Map(apiarios?.map((a: Record<string, unknown>) => [a.id, (a as { name?: string }).name]) || []);

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
                    const mapped = colmenasData.map((c: Record<string, unknown>) => ({
                        id: String(c.id),
                        name: (c.name as string) || 'Colmena',
                        location: c.apiario_id
                            ? String(apiarioMap.get(c.apiario_id as string) || 'Sin apiario')
                            : 'Sin apiario',
                        lat: typeof c.lat === 'number' ? c.lat : 0,
                        lng: typeof c.lng === 'number' ? c.lng : 0,
                        health: healthFromEstado(c.estado as string),
                        queen: (c.queen as string) || '',
                        reinaHistory: [],
                        lastInspection: String(c.last_inspection || c.ultima_inspeccion || ''),
          inspecciones:
            (c.inspecciones as Record<string, unknown>[])?.map((i: Record<string, unknown>) => ({
    date: String(i.date ?? ''),
    inspector: String(i.inspector ?? ''),
    marcos_cria: Number(i.marcos_cria ?? 0),
    marcos_miel: Number(i.marcos_miel ?? 0),
    varroa: Number(i.varroa ?? 0),
    poblacion: (['alta', 'media', 'baja'].includes(String(i.poblacion)) ? String(i.poblacion) : 'media') as InspeccionRecord['poblacion'],
    reina: String(i.reina ?? ''),
    enjambrazon_riesgo: Number(i.enjambrazon_riesgo ?? 0),
    notes: String(i.notes ?? ''),
  })) || [],
                        production: parseFloat(String(c.production_total ?? 0)) || 0,
          pesoHistory:
            (c.peso_records as Record<string, unknown>[])?.map((p: Record<string, unknown>) => ({
                                date: p.date,
                                kg: parseFloat(String(p.kg)),
                                note: p.note as string | undefined,
                            })) || [],
          varroaHistory:
            (c.varroa_records as Record<string, unknown>[])?.map((v: Record<string, unknown>) => ({
                                date: v.date,
                                level: parseFloat(String(v.level)),
                                method: v.method as string,
                            })) || [],
                        floracion: (c.floracion as string) || '',
                        treatments: [],
                        notes: (c.notes as string) || '',
                        costos: {
                            horas_anuales: 0,
                            costo_hora: 0,
                            amortizacion_cajon: 12000,
                            insumos_anuales: 0,
                            produccion_kg: 0,
                        },
                        blockchainHash: (c.blockchain_hash as string) || '',
                        loteActivo: (c.lote_activo as string) || '',
                        alzas: (c.alzas as number) || 1,
                        nucleosCandidatos: Boolean(c.nucleos_candidatos),
  }));
  setLocalColmenas(mapped as Colmena[]);
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
                        supabase.from('reflexiones').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
                    ]);

                    setAlerts((resA.data ?? []).map(mapInAppNotificationToAlertItem));
                    const row = resR.data?.[0];
                    if (row) {
                        setReflexion({
                            ...row,
                            date: row.date_display || row.created_at,
                            content: row.content,
                        });
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
    }, []);

    const handleUpdateColmena = async (updated: Colmena) => {
        // Optimistic update in UI
        setLocalColmenas(prev => prev.map(c => c.id === updated.id ? updated : c));
        if (selectedColmena?.id === updated.id) setSelectedColmena(updated);

        // We would ideally write back to Supabase here
        // Ex: supabase.from('colmenas').update({ name: updated.name }).eq('id', updated.id)
    };

    const totalProduction = localColmenas.reduce((sum, c) => sum + c.production, 0);

    if (loading) {
        return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'hsl(var(--foreground))' }}>Sincronizando con el bosque...</div>;
    }

    return (
        <div>
            <div style={{ margin: 'calc(-1 * var(--space-xl)) calc(-1 * var(--space-xl)) var(--space-xl) calc(-1 * var(--space-xl))' }}>
                <HeaderEcosistema />
            </div>

            {selectedColmena && (
                <ColmenaFicha colmena={selectedColmena} onClose={() => setSelectedColmena(null)} onUpdate={handleUpdateColmena} />
            )}

            <div className="hero-banner animate-in">
                <div className="hero-greeting">¡Hola, {userProfile?.full_name || 'Apicultor'}!</div>
                <h1 className="hero-title">Estás conectado al Bosque Nativo</h1>
                <p className="hero-subtitle">Monitorea colmenas y analiza flujos de floración</p>
            </div>

            <div className="stats-grid">
                {[
                    { icon: <Hexagon size={20} />, val: localColmenas.length, label: 'Colmenas activas' },
                    { icon: <Droplets size={20} />, val: `${totalProduction} kg`, label: 'Producción temporada' },
                    { icon: <ThermometerSun size={20} />, val: '--', label: 'Temp. Pureo ahora' },
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

            <SegmentControl
              options={[
                { value: 'colmenas', label: 'Mis Colmenas (IoT)', icon: <Activity size={16} /> },
                { value: 'calendario', label: 'Ciclo del Bosque (IA)', icon: <CalendarDays size={16} /> },
                { value: 'trazabilidad', label: 'Trazabilidad & Legado', icon: <LineChart size={16} /> },
              ]}
              selectedValue={activeView}
              onChange={(val) => setActiveView(val as ViewTab)}
              className="mt-6 mb-6"
            />

            <div className="dashboard-grid dashboard-grid-2-1">
                {/* Left Column (Main Content based on tab) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {activeView === 'colmenas' && (
                        <div className="animate-in delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                            <GemeloApiario />
                            <ApiarioManager colmenas={localColmenas} setColmenas={setLocalColmenas} onSelectColmena={setSelectedColmena} />
                        </div>
                    )}

                    {activeView === 'calendario' && (
                        <div className="animate-in delay-2">
                            <CalendarioCiclico />
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
