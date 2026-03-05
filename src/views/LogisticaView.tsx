import { useState, useEffect } from 'react';
import { Truck, Package, MapPin, FileText, AlertCircle, ChevronRight, Clock, CheckCircle2, X } from 'lucide-react';
import { roleGreetings } from '../data/mockData';
import { supabase } from '../lib/supabase';



export default function LogisticaView() {
    const h = roleGreetings.logistica;
    const [shipments, setShipments] = useState<any[]>([]);
    const [stockCenters, setStockCenters] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);

    // Form state for new shipment
    const [showNewEnvio, setShowNewEnvio] = useState(false);
    const [envioForm, setEnvioForm] = useState({ tracking_code: `ENV-${Math.floor(Math.random() * 1000)}`, destino: '', items: '', status: 'Programado', eta: 'Pendiente', via: 'Terrestre' });

    useEffect(() => {
        async function loadData() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const uid = session.user.id;

            const [resE, resS, resP] = await Promise.all([
                supabase.from('logistica_envios').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
                supabase.from('stock_centers').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
                supabase.from('proveedores').select('*').eq('user_id', uid).order('created_at', { ascending: false })
            ]);

            if (resE.data?.length) setShipments(resE.data);
            else setShipments([{ id: 'mock-1', tracking_code: 'ENV-081', destino: 'Santiago', items: 'Sachets x400', status: 'En tránsito', eta: '4 marzo', via: 'Barco' }]); // fallback

            if (resS.data?.length) setStockCenters(resS.data);
            else setStockCenters([{ id: 'mock-2', name: 'Bodega Pureo', sachets: 1200, frascos: 280, cofres: 35, ok: true }]);

            if (resP.data?.length) setProviders(resP.data);
            else setProviders([{ id: 'mock-3', name: 'Envases del Sur', item: 'Frascos vidrio 250g', next_delivery: '10 mar', urgent: false }]);
        }
        loadData();
    }, []);

    const handleAddEnvio = async () => {
        if (!envioForm.destino || !envioForm.items) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('logistica_envios').insert({
                    user_id: session.user.id,
                    tracking_code: envioForm.tracking_code,
                    destino: envioForm.destino,
                    items: envioForm.items,
                    status: envioForm.status,
                    eta: envioForm.eta,
                    via: envioForm.via
                }).select().single();

                if (data) {
                    setShipments([data, ...shipments]);
                }
            }
        } catch (e) {
            console.error("Error creating shipment", e);
        }

        setShowNewEnvio(false);
        setEnvioForm({ tracking_code: `ENV-${Math.floor(Math.random() * 1000)}`, destino: '', items: '', status: 'Programado', eta: 'Pendiente', via: 'Terrestre' });
    };

    return (
        <div>
            <div className="hero-banner animate-in">
                <div className="hero-greeting">{h.greeting}</div>
                <h1 className="hero-title">{h.title}</h1>
                <p className="hero-subtitle">{h.subtitle}</p>
            </div>
            <div className="stats-grid">
                {[
                    { icon: <Truck size={20} />, val: '12', label: 'Envíos pendientes' },
                    { icon: <Package size={20} />, val: '3', label: 'Centros de stock', trend: 'Óptimo' },
                    { icon: <MapPin size={20} />, val: '2', label: 'Rutas activas hoy' },
                    { icon: <FileText size={20} />, val: '4', label: 'Proveedores activos' },
                ].map((s, i) => (
                    <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
                        <div className="stat-header"><div className="stat-icon">{s.icon}</div>{s.trend && <span className="stat-trend up">{s.trend}</span>}</div>
                        <div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="dashboard-grid dashboard-grid-2-1" style={{ marginTop: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div className="card animate-in delay-2">
                        <div className="section-header"><div><div className="section-title">Envíos Activos</div></div><button className="btn btn-primary btn-sm" onClick={() => setShowNewEnvio(true)}>+ Nuevo envío</button></div>

                        {showNewEnvio && (
                            <div style={{ padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', position: 'relative' }}>
                                <button onClick={() => setShowNewEnvio(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-sm)' }}>Registrar Envío</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input type="text" placeholder="Destino" className="input-field" value={envioForm.destino} onChange={e => setEnvioForm({ ...envioForm, destino: e.target.value })} />
                                    <input type="text" placeholder="Items enviados" className="input-field" value={envioForm.items} onChange={e => setEnvioForm({ ...envioForm, items: e.target.value })} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleAddEnvio}>Guardar</button>
                                </div>
                            </div>
                        )}

                        {shipments.map(s => (
                            <div key={s.id} className="colmena-item" style={{ marginBottom: 'var(--space-sm)' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: s.status === 'En tránsito' ? 'rgba(52,152,219,0.1)' : 'var(--oro-miel-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {s.status === 'En tránsito' ? <Truck size={18} style={{ color: 'var(--info)' }} /> : s.status === 'Empacando' ? <Package size={18} style={{ color: 'var(--oro-miel-dark)' }} /> : <Clock size={18} style={{ color: 'var(--text-muted)' }} />}
                                </div>
                                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--bosque-ulmo)' }}>{s.destino || s.dest}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.tracking_code || s.id} · {s.items} · Via: {s.via} · ETA: {s.eta}</div></div>
                                <span className={`badge ${s.status === 'En tránsito' ? 'badge-success' : s.status === 'Empacando' ? 'badge-gold' : 'badge-warning'}`}>{s.status}</span>
                                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                            </div>
                        ))}
                    </div>
                    <div className="card animate-in delay-3">
                        <div className="section-header"><div className="section-title">Stock Multicentro</div></div>
                        <table className="data-table"><thead><tr><th>Centro</th><th>Sachets</th><th>Frascos</th><th>Cofres</th><th>Estado</th></tr></thead>
                            <tbody>{stockCenters.map((sc, i) => (<tr key={i}><td style={{ fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{sc.name}</td><td>{sc.sachets.toLocaleString()}</td><td>{sc.frascos}</td><td>{sc.cofres}</td><td><span className={`badge ${sc.ok ? 'badge-success' : 'badge-danger'}`}>{sc.ok ? 'Óptimo' : 'Bajo'}</span></td></tr>))}</tbody></table>
                    </div>
                </div>
                <div className="card animate-in delay-3">
                    <div className="section-header"><div className="section-title">Proveedores</div></div>
                    {providers.map((p, i) => (
                        <div key={i} style={{ padding: 'var(--space-md)', borderBottom: i < providers.length - 1 ? '1px solid rgba(10,61,47,0.06)' : 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: p.urgent ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {p.urgent ? <AlertCircle size={16} style={{ color: 'var(--salud-riesgo)' }} /> : <CheckCircle2 size={16} style={{ color: 'var(--salud-optima)' }} />}
                            </div>
                            <div><div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--bosque-ulmo)' }}>{p.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.item} · Próx: {p.next_delivery || p.next}</div></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
