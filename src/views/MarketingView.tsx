import { Megaphone, Users, Instagram, Calendar, Gift, BookOpen, ArrowUpRight } from 'lucide-react';
import { roleGreetings } from '../data/mockData';

const posts = [
    { date: '3 mar', type: 'Reel', content: 'Cosecha de ulmo · Cristina en el bosque', status: 'Programado', platform: 'IG' },
    { date: '5 mar', type: 'Story', content: 'Detrás de escena: etiquetado artesanal', status: 'Borrador', platform: 'IG' },
    { date: '8 mar', type: 'Post', content: 'Día de la mujer: Cristina, la obrera del bosque', status: 'Programado', platform: 'IG+FB' },
    { date: '10 mar', type: 'Reel', content: 'Receta: tostada con panal + crema de cacao', status: 'Idea', platform: 'IG' },
];

export default function MarketingView() {
    const h = roleGreetings.marketing;
    return (
        <div>
            <div className="hero-banner animate-in">
                <div className="hero-greeting">{h.greeting}</div>
                <h1 className="hero-title">{h.title}</h1>
                <p className="hero-subtitle">{h.subtitle}</p>
            </div>
            <div className="stats-grid">
                {[
                    { icon: <Users size={20} />, val: '47', label: 'Guardianes del Club', trend: '+8' },
                    { icon: <Instagram size={20} />, val: '2.4K', label: 'Seguidores IG', trend: '+12%' },
                    { icon: <Gift size={20} />, val: '12', label: 'Suscripciones activas' },
                    { icon: <Megaphone size={20} />, val: '3', label: 'Campañas activas' },
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
                        <div className="section-header"><div><div className="section-title"><Calendar size={18} style={{ display: 'inline', marginRight: 8 }} />Calendario de Contenido</div><div className="section-subtitle">Marzo 2026</div></div></div>
                        <table className="data-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Contenido</th><th>Plataforma</th><th>Estado</th></tr></thead>
                            <tbody>{posts.map((p, i) => (<tr key={i}><td style={{ fontWeight: 500 }}>{p.date}</td><td><span className="badge badge-gold">{p.type}</span></td><td style={{ color: 'var(--bosque-ulmo)' }}>{p.content}</td><td style={{ fontSize: '0.8rem' }}>{p.platform}</td><td><span className={`badge ${p.status === 'Programado' ? 'badge-success' : p.status === 'Borrador' ? 'badge-warning' : 'badge-gold'}`}>{p.status}</span></td></tr>))}</tbody></table>
                    </div>
                    <div className="card animate-in delay-3">
                        <div className="section-header"><div><div className="section-title">🎁 Campañas Activas</div></div></div>
                        {[
                            { name: 'Regala un árbol con cada cofre', period: '1–31 marzo', impact: '60 árboles meta', status: 'Activa' },
                            { name: 'Club Legado: marzo gratis', period: '1–15 marzo', impact: '+15 suscriptores', status: 'Activa' },
                            { name: 'Sachet para colegios', period: 'Q2 2026', impact: '5.000 sachets', status: 'Planificando' },
                        ].map((c, i) => (
                            <div key={i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: i === 0 ? 'var(--oro-miel-glow)' : 'transparent', marginBottom: 'var(--space-sm)', border: i === 0 ? '1px solid rgba(212,160,23,0.2)' : '1px solid transparent' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><strong style={{ fontSize: '0.9rem', color: 'var(--bosque-ulmo)' }}>{c.name}</strong><span className={`badge ${c.status === 'Activa' ? 'badge-success' : 'badge-warning'}`}>{c.status}</span></div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>📅 {c.period} · 🌳 {c.impact}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    <div className="card animate-in delay-3">
                        <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>🌿 Club Legado del Bosque</div>
                        <div style={{ padding: 'var(--space-lg)', background: 'linear-gradient(135deg, var(--bosque-ulmo), var(--bosque-ulmo-dark))', borderRadius: 'var(--radius-md)', color: 'var(--crema-natural)', marginBottom: 'var(--space-md)' }}>
                            <div style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>47 Guardianes Activos</div>
                            <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>Suscripción desde $15.000/mes</div>
                            <div style={{ fontSize: '0.82rem', opacity: 0.7, marginTop: 4 }}>Revenue mensual: $705.000</div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            <p>Beneficios: miel mensual + acceso a cosechas exclusivas + nombre en bosque regenerado + contenido premium</p>
                        </div>
                    </div>
                    <div className="card animate-in delay-4">
                        <div className="section-title" style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}><BookOpen size={16} style={{ display: 'inline', marginRight: 8 }} />Biblioteca de Assets</div>
                        {['📸 Fotos de cosecha (48)', '🎬 Videos Cristina en Pureo (12)', '📝 Textos regenerativos (24)', '🏷️ Logos y marca (8)'].map((a, i) => (
                            <button key={i} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: 'var(--space-md)', marginBottom: 'var(--space-xs)' }}>
                                {a}<ArrowUpRight size={14} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
