import { useState } from 'react';
import { Link, ChevronRight, CheckCircle2, ImageOff, Plus, X } from 'lucide-react';
import { arbolesPlantados, colmenas, reflexiones } from '../../data/mockData';

export default function TrazabilidadPanel() {
    const [selectedLote, setSelectedLote] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'arboles' | 'lotes' | 'reflexiones'>('arboles');

    const [localArboles, setLocalArboles] = useState(arbolesPlantados);
    const [localReflexiones, setLocalReflexiones] = useState(reflexiones);

    const [showArbolForm, setShowArbolForm] = useState(false);
    const [arbolForm, setArbolForm] = useState({ especie: 'Ulmo', cantidad: 0, sector: '' });

    const [showReflexionForm, setShowReflexionForm] = useState(false);
    const [reflexionForm, setReflexionForm] = useState({ colmena: '', texto: '' });

    const totalTrees = localArboles.reduce((s, a) => s + a.cantidad, 0);
    const totalCO2 = localArboles.reduce((s, a) => s + a.co2_ton, 0);

    const handleAddArbol = () => {
        if (!arbolForm.cantidad || !arbolForm.sector) return;
        setLocalArboles([{
            id: 'n_' + Date.now(),
            especie: arbolForm.especie,
            cantidad: arbolForm.cantidad,
            sector: arbolForm.sector,
            fecha: new Date().toLocaleDateString('es-CL'),
            status: 'creciendo',
            lotesMiel: ['Pendiente'],
            co2_ton: parseFloat((arbolForm.cantidad * 0.05).toFixed(2)),
            coordenadas: { lat: -42.6, lng: -73.8 }
        }, ...localArboles]);
        setShowArbolForm(false);
        setArbolForm({ especie: 'Ulmo', cantidad: 0, sector: '' });
    };

    const handleAddReflexion = () => {
        if (!reflexionForm.texto) return;
        setLocalReflexiones([{
            fecha: new Date().toLocaleDateString('es-CL'),
            colmena: reflexionForm.colmena || 'General',
            texto: reflexionForm.texto
        }, ...localReflexiones]);
        setShowReflexionForm(false);
        setReflexionForm({ colmena: '', texto: '' });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

            {/* Summary KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-md)' }}>
                {[
                    { val: totalTrees.toLocaleString(), label: 'Árboles vivos', color: 'var(--salud-optima)' },
                    { val: `${totalCO2} ton`, label: 'CO₂ secuestrado', color: 'var(--bosque-ulmo)' },
                    { val: colmenas.length, label: 'Lotes trazables', color: 'var(--oro-miel-dark)' },
                ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: 'var(--space-lg)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
                {([['arboles', '🌳 Bosque plantado'], ['lotes', '🍯 Lotes de miel'], ['reflexiones', '📖 Reflexiones']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.78rem' }}>{label}</button>
                ))}
            </div>

            {/* ── Bosque ── */}
            {activeTab === 'arboles' && (
                <div className="card">
                    <div className="section-header">
                        <div>
                            <div className="section-title">Registro de Reforestación</div>
                            <div className="section-subtitle">Árbol → Colmena → Lote de miel · Trazabilidad completa</div>
                        </div>
                        <button className="btn btn-gold btn-sm" onClick={() => setShowArbolForm(true)}><Plus size={14} style={{ marginRight: 4 }} /> Planta</button>
                    </div>

                    {showArbolForm && (
                        <div style={{ padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid rgba(212,160,23,0.3)', position: 'relative' }}>
                            <button onClick={() => setShowArbolForm(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-sm)' }}>Registrar Reforestación</div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                                <select className="input-field" value={arbolForm.especie} onChange={e => setArbolForm({ ...arbolForm, especie: e.target.value })}>
                                    <option value="Ulmo">Ulmo</option>
                                    <option value="Tepú">Tepú</option>
                                    <option value="Tiaca">Tiaca</option>
                                    <option value="Avellano">Avellano</option>
                                </select>
                                <input type="number" placeholder="Cantidad" className="input-field" value={arbolForm.cantidad || ''} onChange={e => setArbolForm({ ...arbolForm, cantidad: parseInt(e.target.value) || 0 })} />
                                <input type="text" placeholder="Sector" className="input-field" value={arbolForm.sector} onChange={e => setArbolForm({ ...arbolForm, sector: e.target.value })} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Proyección: ~{(arbolForm.cantidad * 0.05).toFixed(2)} ton CO₂/año</span>
                                <button className="btn btn-primary btn-sm" onClick={handleAddArbol}>Registrar Vida</button>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {localArboles.map(a => (
                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(10,61,47,0.06)', background: 'rgba(10,61,47,0.01)' }}>
                                <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>🌳</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: 'var(--bosque-ulmo)', fontSize: '0.9rem' }}>
                                        {a.especie} × {a.cantidad.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {a.sector} · {a.fecha}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--salud-optima)', marginTop: 2 }}>
                                        🍯 Lotes: {a.lotesMiel.join(', ')}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`badge ${a.status === 'adulto' ? 'badge-success' : a.status === 'creciendo' ? 'badge-gold' : 'badge-warning'}`}>
                                        {a.status}
                                    </span>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--salud-optima)', marginTop: 4 }}>
                                        🌿 {a.co2_ton} ton CO₂
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Lotes ── */}
            {activeTab === 'lotes' && (
                <div className="card">
                    <div className="section-header">
                        <div><div className="section-title">Lotes Activos</div>
                            <div className="section-subtitle">Hash blockchain · Colmena origen · Árboles vinculados</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {colmenas.map(c => (
                            <div key={c.id} onClick={() => setSelectedLote(selectedLote === c.loteActivo ? null : c.loteActivo)}
                                style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)', border: `1px solid ${selectedLote === c.loteActivo ? 'rgba(212,160,23,0.4)' : 'rgba(10,61,47,0.06)'}`, background: selectedLote === c.loteActivo ? 'var(--oro-miel-glow)' : 'transparent', cursor: 'pointer', transition: 'all 150ms' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--bosque-ulmo)', fontSize: '0.88rem' }}>{c.loteActivo}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.name} · {c.production} kg</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>
                                            <CheckCircle2 size={9} style={{ display: 'inline', marginRight: 3 }} />Verificado
                                        </span>
                                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', transform: selectedLote === c.loteActivo ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }} />
                                    </div>
                                </div>
                                {selectedLote === c.loteActivo && (
                                    <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid rgba(212,160,23,0.2)' }}>
                                        {[
                                            { label: 'Hash', value: c.blockchainHash },
                                            { label: 'Floración', value: c.floracion },
                                            { label: 'Última inspección', value: c.lastInspection },
                                        ].map((r, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', marginBottom: 4 }}>
                                                <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{r.label}</span>
                                                <span style={{ fontFamily: r.label === 'Hash' ? 'monospace' : undefined, color: r.label === 'Hash' ? 'var(--salud-optima)' : 'var(--bosque-ulmo)', fontWeight: 500, wordBreak: 'break-all' }}>{r.value}</span>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Link size={12} style={{ color: 'var(--salud-optima)' }} />
                                            <span style={{ fontSize: '0.72rem', color: 'var(--salud-optima)' }}>Registro inmutable en cadena — visible para el cliente vía QR</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Reflexiones ── */}
            {activeTab === 'reflexiones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

                    <button className="btn btn-gold" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => setShowReflexionForm(true)}>
                        <Plus size={16} /> Agregar Reflexión del Bosque
                    </button>

                    {showReflexionForm && (
                        <div style={{ padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(212,160,23,0.3)', position: 'relative' }}>
                            <button onClick={() => setShowReflexionForm(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-sm)' }}>Nueva Reflexión ({new Date().toLocaleDateString('es-CL')})</div>

                            <input type="text" placeholder="Colmena (opcional, ej. 'Quilineja Madre')" className="input-field" value={reflexionForm.colmena} onChange={e => setReflexionForm({ ...reflexionForm, colmena: e.target.value })} style={{ marginBottom: 8 }} />

                            <textarea placeholder="Qué observaste en la naturaleza, el comportamiento de las abejas o el clima hoy..." className="input-field" value={reflexionForm.texto} onChange={e => setReflexionForm({ ...reflexionForm, texto: e.target.value })} style={{ minHeight: 80, resize: 'vertical', marginBottom: 8 }} />

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-primary btn-sm" onClick={handleAddReflexion}>Guardar Legado</button>
                            </div>
                        </div>
                    )}

                    {localReflexiones.map((r, i) => (
                        <div key={i} className="card" style={{ background: i === 0 ? 'linear-gradient(135deg, var(--bosque-ulmo), var(--bosque-ulmo-dark))' : undefined, border: i === 0 ? 'none' : undefined, color: i === 0 ? 'var(--crema-natural)' : undefined }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: i === 0 ? 'var(--oro-miel)' : 'var(--text-muted)' }}>
                                    Reflexión del bosque · {r.fecha}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: i === 0 ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)' }}>{r.colmena}</div>
                            </div>
                            {/* Photo placeholder */}
                            <div style={{ height: i === 0 ? 120 : 80, background: i === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(10,61,47,0.05)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-md)', gap: 8 }}>
                                <ImageOff size={18} style={{ color: i === 0 ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)' }} />
                                <span style={{ fontSize: '0.75rem', color: i === 0 ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)' }}>Foto de visita · Toca para agregar</span>
                            </div>
                            <p style={{ fontFamily: 'var(--font-existencial)', fontSize: i === 0 ? '0.95rem' : '0.88rem', fontStyle: 'italic', lineHeight: 1.7, color: i === 0 ? 'rgba(253,251,247,0.85)' : 'var(--text-secondary)' }}>
                                {r.texto}
                            </p>
                            <div style={{ marginTop: 'var(--space-md)', fontSize: '0.7rem', color: i === 0 ? 'rgba(255,255,255,0.35)' : 'var(--text-muted)' }}>
                                — Generado por IA a partir de tus notas de visita
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
