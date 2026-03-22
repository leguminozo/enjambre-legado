import { useState, useEffect } from 'react';
import { TreePine, Package, QrCode, BookOpen, Heart, Star, X, ChevronRight } from 'lucide-react';
import { roleGreetings } from '../data/mockData';
import { supabase } from '../lib/supabase';

const educContent: Record<string, string> = {
    '¿Por qué la miel de ulmo es única?': 'La miel de ulmo (Eucryphia cordifolia) es una de las mieles más valoradas del mundo. Su color ámbar claro, sabor suave y propiedades antibacterianas la hacen única. El ulmo florece solo durante 6-8 semanas en verano en los bosques templados de la Patagonia chilena. Su producción se limita a zonas prístinas de Chiloé y la región de Los Lagos.',
    'Recetas: 5 formas de usar el panal': '1) Tostada de masa madre con panal y queso de cabra. 2) Tabla de quesos con trozos de panal y nueces. 3) Yogur natural con panal desmenuzado y frambuesas. 4) Agua tibia con limón y un trozo de panal (energizante matutino). 5) Postre: higos asados con crema de cacao nibs y miel de panal.',
    'Qué es la apicultura regenerativa': 'La apicultura regenerativa va más allá de lo orgánico: no solo evita dañar, sino que restaura activamente el ecosistema. Implica plantar árboles nativos para alimentar a las abejas, usar tratamientos naturales contra varroa, y medir el impacto positivo neto (CO₂ secuestrado, biodiversidad aumentada). En Enjambre Legado, cada kilo de miel está vinculado a árboles plantados.',
    'El ciclo de las abejas en Chiloé': 'En Chiloé, el ciclo apícola sigue las floraciones nativas: ulmo (enero-febrero), tepú (febrero-marzo), tiaque (marzo-abril) y avellano (abril-mayo). El invierno austral (junio-agosto) es de reposo. La humedad de Chiloé requiere manejos especiales: ventilación de colmenas, control de humedad en la miel, y protección contra vientos del Pacífico.',
};

export default function ClienteView() {
    const h = roleGreetings.cliente;
    const [showQR, setShowQR] = useState(false);
    const [showArticle, setShowArticle] = useState<string | null>(null);
    const [pedidos, setPedidos] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase.from('pedidos_cliente').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });

            if (data && data.length > 0) {
                setPedidos(data);
            } else {
                // Fallback for visual mock
                setPedidos([
                    { order_date: '22 feb', items: 'Cofre Legado + Sachets x10', status: 'Entregado', trees_planted: 5.3 },
                    { order_date: '15 ene', items: 'Crema Cacao Nibs x2', status: 'Entregado', trees_planted: 2.4 },
                    { order_date: '20 dic', items: 'Miel Virgen 500g', status: 'Entregado', trees_planted: 2.0 },
                ]);
            }
        }
        loadData();
    }, []);

    return (
        <div>
            {/* QR Scanner Modal */}
            {showQR && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} onClick={() => setShowQR(false)} />
                    <div className="card" style={{ position: 'relative', zIndex: 201, width: '90%', maxWidth: 420, padding: 'var(--space-xl)', animation: 'fadeInUp 0.3s ease', textAlign: 'center' }}>
                        <button onClick={() => setShowQR(false)} className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 12, right: 12 }}><X size={18} /></button>
                        <div style={{ width: 200, height: 200, margin: '0 auto var(--space-lg)', background: 'var(--crema-warm)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--bosque-ulmo)' }}>
                            <div style={{ textAlign: 'center' }}><QrCode size={48} style={{ color: 'var(--bosque-ulmo)', marginBottom: 8 }} /><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Apunta la cámara al QR</div></div>
                        </div>
                        <h3 style={{ marginBottom: 'var(--space-sm)' }}>Trazabilidad del Lote</h3>
                        <div style={{ padding: 'var(--space-lg)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-md)', textAlign: 'left', marginTop: 'var(--space-md)' }}>
                            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>Ejemplo: Lote #2026-ULM-047</div>
                            {[
                                { label: 'Colmena', value: 'Ulmo Mayor · Apiario Pureo Norte' },
                                { label: 'Cosecha', value: '28 febrero 2026' },
                                { label: 'Floración', value: 'Ulmo + Tepú' },
                                { label: 'Árboles', value: '2 árboles plantados con esta compra' },
                                { label: 'CO₂', value: '0.1 ton secuestrado' },
                            ].map((r, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 4 ? '1px solid rgba(10,61,47,0.06)' : 'none', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                                    <span style={{ fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Article Modal */}
            {showArticle && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }} onClick={() => setShowArticle(null)} />
                    <div className="card" style={{ position: 'relative', zIndex: 201, width: '90%', maxWidth: 520, padding: 'var(--space-xl)', animation: 'fadeInUp 0.3s ease', maxHeight: '80vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowArticle(null)} className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 12, right: 12 }}><X size={18} /></button>
                        <h3 style={{ marginBottom: 'var(--space-lg)', paddingRight: 'var(--space-xl)' }}>{showArticle}</h3>
                        <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>{educContent[showArticle]}</p>
                    </div>
                </div>
            )}

            <div className="hero-banner animate-in"><div className="hero-greeting">{h.greeting}</div><h1 className="hero-title">{h.title}</h1><p className="hero-subtitle">{h.subtitle}</p></div>
            <div className="stats-grid">
                {[
                    { icon: <TreePine size={20} />, val: '12', label: 'Árboles regenerados' },
                    { icon: <Package size={20} />, val: '8', label: 'Pedidos realizados' },
                    { icon: <Heart size={20} />, val: '0.6 ton', label: 'CO₂ compensado' },
                    { icon: <Star size={20} />, val: 'Plata', label: 'Nivel Guardián' },
                ].map((s, i) => (
                    <div key={i} className={`stat-card animate-in delay-${i + 1}`}><div className="stat-header"><div className="stat-icon">{s.icon}</div></div><div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div></div>
                ))}
            </div>
            <div className="dashboard-grid dashboard-grid-2" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="card animate-in delay-2" style={{ background: 'linear-gradient(135deg, var(--bosque-ulmo), #041A13)', color: 'var(--crema-natural)', border: 'none' }}>
                    <div style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.3rem', marginBottom: 'var(--space-lg)', color: 'var(--oro-miel)' }}>🌳 Mi Bosque Personal</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-md)', textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                        <div><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--oro-miel)' }}>12</div><div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Árboles</div></div>
                        <div><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--salud-optima)' }}>0.6</div><div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Ton CO₂</div></div>
                        <div><div style={{ fontSize: '2rem', fontWeight: 700 }}>3</div><div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Años</div></div>
                    </div>
                    <div style={{ padding: 'var(--space-md)', background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                        <p style={{ fontStyle: 'italic', color: 'rgba(253,251,247,0.8)' }}>"Tus 12 árboles crecen en la ladera sur de Pureo, junto al estero. En 15 años serán ulmos adultos que alimentarán a miles de abejas."</p>
                    </div>
                </div>
                <div className="card animate-in delay-3">
                    <div className="section-header"><div className="section-title">Mis Pedidos</div></div>
                    {pedidos.map((o, i) => (
                        <div key={i} className="colmena-item" style={{ marginBottom: 'var(--space-sm)' }}>
                            <div><div style={{ fontWeight: 500, color: 'var(--bosque-ulmo)', fontSize: '0.9rem' }}>{o.items}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.order_date || o.date}</div></div>
                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}><span className="badge badge-success">{o.status}</span><div style={{ fontSize: '0.7rem', color: 'var(--salud-optima)', marginTop: 4 }}>🌳 {o.trees_planted || o.trees} árboles</div></div>
                        </div>
                    ))}
                </div>
                <div className="card animate-in delay-4">
                    <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}><QrCode size={18} style={{ display: 'inline', marginRight: 8 }} />Escáner de Trazabilidad</div>
                    <div style={{ padding: 'var(--space-xl)', background: 'var(--crema-warm)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <QrCode size={48} style={{ color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-md)' }} />
                        <p style={{ fontSize: '0.88rem', color: 'var(--bosque-ulmo)', fontWeight: 500 }}>Escanea el QR de tu producto</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>Descubre la historia exacta de tu lote.</p>
                        <button className="btn btn-gold" style={{ marginTop: 'var(--space-lg)' }} onClick={() => setShowQR(true)}>📱 Activar cámara</button>
                    </div>
                </div>
                <div className="card animate-in delay-5">
                    <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}><BookOpen size={18} style={{ display: 'inline', marginRight: 8 }} />Aprende del Bosque</div>
                    {Object.keys(educContent).map((title, i) => (
                        <div key={i} onClick={() => setShowArticle(title)} style={{ padding: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)', borderBottom: i < 3 ? '1px solid rgba(10,61,47,0.06)' : 'none', cursor: 'pointer', transition: 'background 150ms' }} className="colmena-item">
                            <span style={{ fontSize: '1.5rem' }}>{['🍯', '🎬', '🌿', '🐝'][i]}</span>
                            <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--bosque-ulmo)' }}>{title}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{['Artículo', 'Video', 'Artículo', 'Infografía'][i]}</div></div>
                            <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
