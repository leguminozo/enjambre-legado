import { Truck, Package, MapPin, FileText, AlertCircle, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { roleGreetings } from '../data/mockData';

const shipments = [
    { id: 'ENV-081', dest: 'Santiago – La Reina', items: 'Sachets x400 + Cofres x12', status: 'En tránsito', eta: '4 marzo', via: 'Barco + camión' },
    { id: 'ENV-082', dest: 'Castro – Tienda Gourmet', items: 'Mix completo x45', status: 'Empacando', eta: '2 marzo', via: 'Terrestre' },
    { id: 'ENV-083', dest: 'Ancud – Feria', items: 'Stand completo', status: 'Programado', eta: '14 marzo', via: 'Terrestre' },
];
const stockCenters = [
    { name: 'Bodega Pureo', sachets: 1200, frascos: 280, cofres: 35, ok: true },
    { name: 'Bodega Castro', sachets: 800, frascos: 120, cofres: 18, ok: true },
    { name: 'Stock Santiago', sachets: 400, frascos: 45, cofres: 7, ok: false },
];
const providers = [
    { name: 'Envases del Sur', item: 'Frascos vidrio 250g', next: '10 mar', urgent: false },
    { name: 'Imprenta Chiloé', item: 'Etiquetas adhesivas', next: '5 mar', urgent: false },
    { name: 'Cacao Premium', item: 'Cacao nibs 70%', next: '15 mar', urgent: true },
    { name: 'Avellanas Chiloé', item: 'Avellanas tostadas', next: '20 mar', urgent: false },
];

export default function LogisticaView() {
    const h = roleGreetings.logistica;
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
                        <div className="section-header"><div><div className="section-title">Envíos Activos</div></div><button className="btn btn-primary btn-sm">+ Nuevo envío</button></div>
                        {shipments.map(s => (
                            <div key={s.id} className="colmena-item" style={{ marginBottom: 'var(--space-sm)' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: s.status === 'En tránsito' ? 'rgba(52,152,219,0.1)' : 'var(--oro-miel-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {s.status === 'En tránsito' ? <Truck size={18} style={{ color: 'var(--info)' }} /> : s.status === 'Empacando' ? <Package size={18} style={{ color: 'var(--oro-miel-dark)' }} /> : <Clock size={18} style={{ color: 'var(--text-muted)' }} />}
                                </div>
                                <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--bosque-ulmo)' }}>{s.dest}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.id} · {s.items} · Via: {s.via} · ETA: {s.eta}</div></div>
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
                            <div><div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--bosque-ulmo)' }}>{p.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.item} · Próx: {p.next}</div></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
