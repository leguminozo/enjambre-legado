import { useState, useEffect } from 'react';
import { Megaphone, Users, Instagram, Calendar, Gift, BookOpen, ArrowUpRight, X } from 'lucide-react';
import { roleGreetings } from '../data/mockData';
import { supabase } from '../lib/supabase';

export default function MarketingView() {
    const h = roleGreetings.marketing;
    const [posts, setPosts] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    const [showNewPost, setShowNewPost] = useState(false);
    const [postForm, setPostForm] = useState({ post_date: '12 mar', type: 'Reel', content: '', status: 'Borrador', platform: 'IG' });

    useEffect(() => {
        async function loadData() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const uid = session.user.id;

            const [resP, resC] = await Promise.all([
                supabase.from('marketing_posts').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
                supabase.from('marketing_campaigns').select('*').eq('user_id', uid).order('created_at', { ascending: false })
            ]);

            if (resP.data?.length) setPosts(resP.data);
            else setPosts([{ id: 'm1', post_date: '3 mar', type: 'Reel', content: 'Cosecha de ulmo', status: 'Programado', platform: 'IG' }]); // fallback

            if (resC.data?.length) setCampaigns(resC.data);
            else setCampaigns([
                { id: 'c1', name: 'Regala un árbol', period: 'Marzo', impact: '60 árboles meta', status: 'Activa' },
                { id: 'c2', name: 'Club Legado', period: 'Q2', impact: '+15 suscriptores', status: 'Planificando' }
            ]);
        }
        loadData();
    }, []);

    const handleAddPost = async () => {
        if (!postForm.content) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('marketing_posts').insert({
                    user_id: session.user.id,
                    ...postForm
                }).select().single();

                if (data) setPosts([data, ...posts]);
            }
        } catch (e) {
            console.error(e);
        }
        setShowNewPost(false);
        setPostForm({ post_date: '12 mar', type: 'Reel', content: '', status: 'Borrador', platform: 'IG' });
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
                        <div className="section-header">
                            <div><div className="section-title"><Calendar size={18} style={{ display: 'inline', marginRight: 8 }} />Calendario de Contenido</div><div className="section-subtitle">Marzo 2026</div></div>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowNewPost(true)}>+ Contenido</button>
                        </div>

                        {showNewPost && (
                            <div style={{ padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', position: 'relative' }}>
                                <button onClick={() => setShowNewPost(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-sm)' }}>Programar Post</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 8 }}>
                                    <input type="text" placeholder="Idea de contenido..." className="input-field" value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input type="text" placeholder="Fecha (ej: 12 mar)" className="input-field" value={postForm.post_date} onChange={e => setPostForm({ ...postForm, post_date: e.target.value })} />
                                    <select className="input-field" value={postForm.type} onChange={e => setPostForm({ ...postForm, type: e.target.value })}>
                                        <option>Reel</option><option>Story</option><option>Post</option><option>Carrusel</option>
                                    </select>
                                    <select className="input-field" value={postForm.platform} onChange={e => setPostForm({ ...postForm, platform: e.target.value })}>
                                        <option>IG</option><option>TikTok</option><option>LinkedIn</option><option>FB</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleAddPost}>Guardar</button>
                                </div>
                            </div>
                        )}

                        <table className="data-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Contenido</th><th>Plataforma</th><th>Estado</th></tr></thead>
                            <tbody>{posts.map((p, i) => (<tr key={i}><td style={{ fontWeight: 500 }}>{p.post_date || p.date}</td><td><span className="badge badge-gold">{p.type}</span></td><td style={{ color: 'var(--bosque-ulmo)' }}>{p.content}</td><td style={{ fontSize: '0.8rem' }}>{p.platform}</td><td><span className={`badge ${p.status === 'Programado' ? 'badge-success' : p.status === 'Borrador' ? 'badge-warning' : 'badge-gold'}`}>{p.status}</span></td></tr>))}</tbody></table>
                    </div>
                    <div className="card animate-in delay-3">
                        <div className="section-header"><div><div className="section-title">🎁 Campañas Activas</div></div></div>
                        {campaigns.map((c, i) => (
                            <div key={c.id || i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', background: i === 0 ? 'var(--oro-miel-glow)' : 'transparent', marginBottom: 'var(--space-sm)', border: i === 0 ? '1px solid rgba(212,160,23,0.2)' : '1px solid transparent' }}>
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
