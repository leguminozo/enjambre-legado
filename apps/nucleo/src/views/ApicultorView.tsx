import { useState, useEffect } from 'react';
import { Hexagon, ThermometerSun, Droplets, TreePine, AlertTriangle, CalendarDays, LineChart, Activity } from 'lucide-react';
import { colmenas as mockColmenas, roleGreetings } from '../data/mockData';
import type { Colmena } from '../data/mockData';
import { supabase } from '../lib/supabase';
import ColmenaFicha from '../components/apicultor/ColmenaFicha';
import CalendarioCiclico from '../components/apicultor/CalendarioCiclico';
import TrazabilidadPanel from '../components/apicultor/TrazabilidadPanel';
import ApiarioManager from '../components/apicultor/ApiarioManager';

type ViewTab = 'colmenas' | 'calendario' | 'trazabilidad';

export default function ApicultorView() {
    const { greeting, title, subtitle } = roleGreetings.apicultor;
    const [localColmenas, setLocalColmenas] = useState<Colmena[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedColmena, setSelectedColmena] = useState<Colmena | null>(null);
    const [activeView, setActiveView] = useState<ViewTab>('colmenas');

    // Phase 4 dynamic data
    const [alerts, setAlerts] = useState<any[]>([]);
    const [reflexion, setReflexion] = useState<any>(null);

    // Fetch data from Supabase
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const uid = session?.user?.id;

                // 1. Fetch apiarios
                const { data: apiarios } = await supabase.from('apiarios').select('*');
                const apiarioMap = new Map(apiarios?.map(a => [a.id, a.name]) || []);

                // 2. Fetch colmenas with related data
                const { data: colmenasData } = await supabase.from('colmenas').select(`
                    *,
                    inspecciones (*),
                    varroa_records (*),
                    peso_records (*)
                `);

                if (colmenasData) {
                    const mapped: Colmena[] = colmenasData.map(c => ({
                        id: c.id,
                        name: c.name,
                        location: c.apiario_id ? apiarioMap.get(c.apiario_id) || 'Desconocido' : 'Desconocido',
                        lat: 0, lng: 0, // Simplified
                        health: c.health,
                        queen: c.queen, // Simplified
                        reinaHistory: [],
                        lastInspection: c.last_inspection || '',
                        inspecciones: c.inspecciones?.map((i: any) => ({
                            date: i.date, inspector: i.inspector, marcos_cria: i.marcos_cria,
                            marcos_miel: i.marcos_miel, varroa: i.varroa, poblacion: i.poblacion,
                            reina: i.reina, enjambrazon_riesgo: i.enjambrazon_riesgo, notes: i.notes
                        })) || [],
                        production: parseFloat(c.production_total) || 0,
                        pesoHistory: c.peso_records?.map((p: any) => ({
                            date: p.date, kg: parseFloat(p.kg), note: p.note
                        })) || [],
                        varroaHistory: c.varroa_records?.map((v: any) => ({
                            date: v.date, level: parseFloat(v.level), method: v.method
                        })) || [],
                        floracion: c.floracion || '',
                        treatments: [],
                        notes: c.notes || '',
                        costos: { horas_anuales: 0, costo_hora: 0, amortizacion_cajon: 12000, insumos_anuales: 0, produccion_kg: 0 },
                        blockchainHash: c.blockchain_hash || '',
                        loteActivo: c.lote_activo || '',
                        alzas: c.alzas || 1,
                        nucleosCandidatos: c.nucleos_candidatos || false
                    }));
                    setLocalColmenas(mapped);
                } else {
                    setLocalColmenas(mockColmenas); // Fallback
                }

                if (uid) {
                    const [resA, resR] = await Promise.all([
                        supabase.from('alerts').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(3),
                        supabase.from('reflexiones').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1)
                    ]);

                    if (resA.data?.length) setAlerts(resA.data);
                    else setAlerts([
                        { id: '1', severity: 'warning', title: 'Avellano Sur', message: 'Varroa en nivel 3.0/10. Programar segundo tratamiento sublimado antes del 10 de marzo.' },
                        { id: '2', severity: 'critical', title: 'Quilineja Vieja', message: 'Confirmado sin reina. Población crítica. Se recomienda requeening urgente o fusión con núcleo fuerte.' },
                        { id: '3', severity: 'info', title: 'Predicción IA', message: 'El algoritmo indica que el flujo de néctar de tepú alcanzará su pico de 88/100 en 9 días. Asegura alzas vacías en el apiario Pureo Norte.' }
                    ]);

                    if (resR.data?.length) setReflexion(resR.data[0]);
                    else setReflexion({ date: '28 feb 2026', content: 'Hoy el bosque respira profundo. Las abejas de Canelo Ancestral trabajan con una calma que solo da la abundancia. Cada marco lleno es un año más de legado. Cada árbol plantado es una promesa que el tiempo honra sin que nadie se lo pida.' });
                }

            } catch (err) {
                console.error("Error loading Supabase data:", err);
                setLocalColmenas(mockColmenas); // Fallback
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
        return <div style={{ padding: 'var(--space-2xl)', textAlign: 'center', color: 'var(--bosque-ulmo)' }}>Sincronizando con el bosque...</div>;
    }

    return (
        <div>
            {selectedColmena && (
                <ColmenaFicha colmena={selectedColmena} onClose={() => setSelectedColmena(null)} onUpdate={handleUpdateColmena} />
            )}

            <div className="hero-banner animate-in">
                <div className="hero-greeting">{greeting}</div>
                <h1 className="hero-title">{title}</h1>
                <p className="hero-subtitle">{subtitle}</p>
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.78rem', padding: '4px 14px' }}>Floración Tepú: activa</span>
                    <span className="badge badge-gold" style={{ fontSize: '0.78rem', padding: '4px 14px' }}>Próxima luna: Cuarto menguante</span>
                </div>
            </div>

            <div className="stats-grid">
                {[
                    { icon: <Hexagon size={20} />, val: localColmenas.length, label: 'Colmenas activas', trend: '+1 nueva' },
                    { icon: <Droplets size={20} />, val: `${totalProduction} kg`, label: 'Producción temporada', trend: '+18%' },
                    { icon: <ThermometerSun size={20} />, val: '14°C', label: 'Temp. Pureo ahora' },
                    { icon: <TreePine size={20} />, val: '4.200', label: 'Árboles Pureo', trend: '+120' },
                ].map((s, i) => (
                    <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
                        <div className="stat-header">
                            <div className="stat-icon">{s.icon}</div>
                            {s.trend && <span className="stat-trend up">{s.trend}</span>}
                        </div>
                        <div className="stat-value">{s.val}</div>
                        <div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Main Feature Tabs */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-lg)', borderBottom: '1px solid rgba(10,61,47,0.1)' }}>
                {[
                    { id: 'colmenas', label: 'Mis Colmenas (IoT)', icon: <Activity size={16} /> },
                    { id: 'calendario', label: 'Ciclo del Bosque (IA)', icon: <CalendarDays size={16} /> },
                    { id: 'trazabilidad', label: 'Trazabilidad & Legado', icon: <LineChart size={16} /> },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveView(tab.id as ViewTab)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-md) var(--space-lg)',
                            background: activeView === tab.id ? 'var(--surface-card)' : 'transparent',
                            border: 'none', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)',
                            borderTop: activeView === tab.id ? '2px solid var(--oro-miel)' : '2px solid transparent',
                            color: activeView === tab.id ? 'var(--bosque-ulmo)' : 'var(--text-muted)',
                            fontWeight: activeView === tab.id ? 600 : 500, fontSize: '0.9rem', cursor: 'pointer',
                            marginBottom: -1, transition: 'all 150ms'
                        }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="dashboard-grid dashboard-grid-2-1">
                {/* Left Column (Main Content based on tab) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {activeView === 'colmenas' && (
                        <div className="animate-in delay-2">
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
                            <AlertTriangle size={16} style={{ color: 'var(--salud-atencion)' }} /> Voz de la Colmena
                        </div>
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                            {alerts.map((a, i) => (
                                <p key={a.id || i} style={{ marginBottom: i < alerts.length - 1 ? 'var(--space-md)' : 0 }}>
                                    <strong style={{ color: a.severity === 'critical' ? 'var(--salud-riesgo)' : a.severity === 'warning' ? 'var(--salud-atencion)' : 'var(--salud-optima)' }}>
                                        {a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '⚠' : '✨'} {a.title}:
                                    </strong> {a.message}
                                </p>
                            ))}
                        </div>
                    </div>

                    {reflexion && (
                        <div className="card animate-in delay-4" style={{ background: 'linear-gradient(135deg, var(--bosque-ulmo), var(--bosque-ulmo-dark))', color: 'var(--crema-natural)', border: 'none' }}>
                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--oro-miel)', marginBottom: 'var(--space-sm)' }}>
                                Última Reflexión · {reflexion.date || new Date().toLocaleDateString()}
                            </div>
                            <p style={{ fontFamily: 'var(--font-existencial)', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.6, color: 'rgba(253,251,247,0.85)' }}>
                                "{reflexion.content}"
                            </p>
                            <div style={{ marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'rgba(253,251,247,0.45)' }}>
                                — {reflexion.author || 'Generado automático posvisita'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
