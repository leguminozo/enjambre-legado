import { useState } from 'react';
import { TreePine, Camera, MapPin, Leaf, Plus, ChevronDown } from 'lucide-react';

interface TreeRecord {
    id: string; species: string; count: number; date: string; location: string; co2: number; status: 'creciendo' | 'adulto' | 'joven';
}

const treeRecords: TreeRecord[] = [
    { id: 't1', species: 'Ulmo', count: 2800, date: '2008–2024', location: 'Ladera sur Pureo', co2: 140, status: 'adulto' },
    { id: 't2', species: 'Tepú', count: 800, date: '2012–2022', location: 'Borde estero Pureo', co2: 40, status: 'adulto' },
    { id: 't3', species: 'Tiaque', count: 400, date: '2018–2023', location: 'Sector norte Pureo', co2: 20, status: 'creciendo' },
    { id: 't4', species: 'Avellano', count: 300, date: '2020–2025', location: 'Yerba Loza', co2: 15, status: 'creciendo' },
    { id: 't5', species: 'Canelo', count: 500, date: '2015–2024', location: 'Quebrada central', co2: 25, status: 'adulto' },
    { id: 't6', species: 'Ulmo', count: 200, date: '2025–2026', location: 'Expansión Ancud', co2: 10, status: 'joven' },
];

export default function RegeneracionView() {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ species: '', count: '', location: '', notes: '' });
    const [records, setRecords] = useState(treeRecords);
    const [showAll, setShowAll] = useState(false);

    const totalTrees = records.reduce((s, r) => s + r.count, 0);
    const totalCO2 = records.reduce((s, r) => s + r.co2, 0);
    const displayed = showAll ? records : records.slice(0, 4);

    const handleSubmit = () => {
        if (!formData.species || !formData.count) return;
        const newRecord: TreeRecord = {
            id: `t${Date.now()}`, species: formData.species, count: parseInt(formData.count) || 0,
            date: '2026', location: formData.location || 'Sin especificar', co2: Math.round((parseInt(formData.count) || 0) * 0.05), status: 'joven'
        };
        setRecords(prev => [newRecord, ...prev]);
        setFormData({ species: '', count: '', location: '', notes: '' });
        setShowForm(false);
    };

    return (
        <div>
            <div className="hero-banner animate-in" style={{ background: 'linear-gradient(135deg, #062A1F 0%, #0A3D2F 50%, #0E5240 100%)' }}>
                <div className="hero-greeting">Módulo de Regeneración 🌿</div>
                <h1 className="hero-title">Cada árbol plantado es un legado que el tiempo honra</h1>
                <p className="hero-subtitle">22 años de reforestación nativa en Chiloé. Cada lote de miel está vinculado directamente a los árboles que alimentan a las abejas.</p>
            </div>

            <div className="stats-grid">
                {[
                    { icon: <TreePine size={20} />, val: totalTrees.toLocaleString(), label: 'Árboles plantados', trend: '+200' },
                    { icon: <Leaf size={20} />, val: `${totalCO2} ton`, label: 'CO₂ secuestrado', trend: '+10' },
                    { icon: <MapPin size={20} />, val: '5', label: 'Zonas reforestadas' },
                    { icon: <Camera size={20} />, val: '6', label: 'Especies nativas' },
                ].map((s, i) => (
                    <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
                        <div className="stat-header"><div className="stat-icon">{s.icon}</div>{s.trend && <span className="stat-trend up">{s.trend}</span>}</div>
                        <div className="stat-value">{s.val}</div><div className="stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="card animate-in delay-2" style={{ marginTop: 'var(--space-lg)' }}>
                <div className="section-header">
                    <div><div className="section-title">Registro de Reforestación</div><div className="section-subtitle">Trazabilidad directa: árbol ↔ colmena ↔ lote de miel</div></div>
                    <button className="btn btn-gold btn-sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Registrar plantación</button>
                </div>

                {showForm && (
                    <div style={{ padding: 'var(--space-lg)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', border: '1px solid rgba(212,160,23,0.2)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            {[
                                { label: 'Especie', key: 'species', ph: 'Ej: Ulmo, Tepú, Canelo...' },
                                { label: 'Cantidad', key: 'count', ph: 'Número de árboles' },
                                { label: 'Ubicación', key: 'location', ph: 'Sector o coordenada' },
                                { label: 'Notas', key: 'notes', ph: 'Observaciones (opcional)' },
                            ].map(field => (
                                <div key={field.key}>
                                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{field.label}</div>
                                    <input type={field.key === 'count' ? 'number' : 'text'} placeholder={field.ph} value={(formData as Record<string, string>)[field.key]} onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        style={{ width: '100%', padding: 'var(--space-sm) var(--space-md)', border: '1px solid rgba(10,61,47,0.15)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', background: 'white' }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Guardar registro</button>
                        </div>
                    </div>
                )}

                <div className="colmena-list">
                    {displayed.map(r => (
                        <div key={r.id} className="colmena-item">
                            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: r.status === 'adulto' ? 'rgba(46,204,113,0.12)' : r.status === 'creciendo' ? 'var(--oro-miel-glow)' : 'rgba(52,152,219,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🌳</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--bosque-ulmo)' }}>{r.species} × {r.count.toLocaleString()}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.location} · {r.date}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className={`badge ${r.status === 'adulto' ? 'badge-success' : r.status === 'creciendo' ? 'badge-gold' : 'badge-warning'}`}>{r.status === 'adulto' ? 'Adulto' : r.status === 'creciendo' ? 'Creciendo' : 'Joven'}</span>
                                <div style={{ fontSize: '0.72rem', color: 'var(--salud-optima)', marginTop: 4 }}>🌿 {r.co2} ton CO₂</div>
                            </div>
                        </div>
                    ))}
                </div>
                {records.length > 4 && (
                    <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>{showAll ? 'Ver menos' : `Ver todos (${records.length})`} <ChevronDown size={14} style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} /></button>
                    </div>
                )}
            </div>

            {/* Impact summary */}
            <div className="card animate-in delay-3" style={{ marginTop: 'var(--space-lg)', background: 'linear-gradient(135deg, var(--bosque-ulmo), var(--bosque-ulmo-dark))', color: 'var(--crema-natural)', border: 'none' }}>
                <div style={{ fontFamily: 'var(--font-existencial)', fontSize: '1.1rem', color: 'var(--oro-miel)', marginBottom: 'var(--space-md)' }}>Impacto Regenerativo</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', textAlign: 'center' }}>
                    <div><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--oro-miel)' }}>{totalTrees.toLocaleString()}</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Árboles vivos</div></div>
                    <div><div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--salud-optima)' }}>{totalCO2}</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Toneladas CO₂</div></div>
                    <div><div style={{ fontSize: '2rem', fontWeight: 700 }}>22</div><div style={{ fontSize: '0.78rem', opacity: 0.6 }}>Años de legado</div></div>
                </div>
            </div>
        </div>
    );
}
