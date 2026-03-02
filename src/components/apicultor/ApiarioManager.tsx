import { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, ChevronRight, Droplets } from 'lucide-react';
import type { Colmena } from '../../data/mockData';

interface ApiarioManagerProps {
    colmenas: Colmena[];
    setColmenas: React.Dispatch<React.SetStateAction<Colmena[]>>;
    onSelectColmena: (c: Colmena) => void;
}

export default function ApiarioManager({ colmenas: localColmenas, setColmenas: setLocalColmenas, onSelectColmena }: ApiarioManagerProps) {
    const [expandedApiarios, setExpandedApiarios] = useState<string[]>([]);
    const [editingColmena, setEditingColmena] = useState<Colmena | null>(null);

    // Group colmenas by location (Apiario)
    const apiarios = Array.from(new Set(localColmenas.map(c => c.location)));

    const toggleApiario = (apiario: string) => {
        setExpandedApiarios(prev =>
            prev.includes(apiario) ? prev.filter(a => a !== apiario) : [...prev, apiario]
        );
    };

    const optimalCount = localColmenas.filter(c => c.health === 'optimal').length;
    const attentionCount = localColmenas.filter(c => c.health === 'attention').length;
    const riskCount = localColmenas.filter(c => c.health === 'risk').length;

    const handleAddColmena = (apiario: string) => {
        setEditingColmena({
            id: Date.now().toString(), // Mock ID
            name: '',
            location: apiario,
            health: 'optimal',
            production: 0,
            floracion: '',
            reinaHistory: [], inspecciones: [], varroaHistory: [], pesoHistory: [],
            costos: { horas_anuales: 0, costo_hora: 0, amortizacion_cajon: 12000, insumos_anuales: 0, produccion_kg: 0 },
            alzas: 1
        } as unknown as Colmena);
    };

    const handleSaveColmena = (c: Colmena) => {
        setLocalColmenas(prev => {
            const exists = prev.find(p => p.id === c.id);
            if (exists) return prev.map(p => p.id === c.id ? c : p);
            return [...prev, c];
        });
        if (c.location && !expandedApiarios.includes(c.location)) {
            setExpandedApiarios(prev => [...prev, c.location]);
        }
        setEditingColmena(null);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta colmena y todo su historial científico?')) {
            setLocalColmenas(prev => prev.filter(c => c.id !== id));
        }
    };

    return (
        <div className="card animate-in delay-2">
            <div className="section-header">
                <div>
                    <div className="section-title">Gestión de Apiarios</div>
                    <div className="section-subtitle">
                        <span style={{ color: 'var(--salud-optima)' }}>● {optimalCount} óptimas</span>
                        {attentionCount > 0 && <span style={{ marginLeft: 12, color: 'var(--salud-atencion)' }}>● {attentionCount} atención</span>}
                        {riskCount > 0 && <span style={{ marginLeft: 12, color: 'var(--salud-riesgo)' }}>● {riskCount} riesgo</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                        const newName = prompt('Nombre del nuevo apiario (ej. "Valle Sur"):');
                        if (newName && !apiarios.includes(newName)) {
                            setLocalColmenas(prev => [...prev, {
                                id: Date.now().toString(), name: 'Nueva Colmena', location: newName, health: 'optimal', production: 0, floracion: 'Nueva', alzas: 1, reinaHistory: [], inspecciones: [], varroaHistory: [], pesoHistory: [], costos: { horas_anuales: 0, costo_hora: 0, amortizacion_cajon: 0, insumos_anuales: 0, produccion_kg: 0 }
                            } as unknown as Colmena]);
                            setExpandedApiarios(p => [...p, newName]);
                        }
                    }}><MapPin size={14} /> Nuevo Apiario</button>
                    <button className="btn btn-gold btn-sm" onClick={() => handleAddColmena(apiarios[0] || 'Nuevo Apiario')}><Plus size={14} /> Colmena</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {apiarios.length === 0 && (
                    <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay apiarios registrados.
                    </div>
                )}

                {apiarios.map(apiario => {
                    const apiarioColmenas = localColmenas.filter(c => c.location === apiario);
                    const isExpanded = expandedApiarios.includes(apiario);
                    const apiarioHealth = apiarioColmenas.some(c => c.health === 'risk') ? 'var(--salud-riesgo)'
                        : apiarioColmenas.some(c => c.health === 'attention') ? 'var(--salud-atencion)'
                            : 'var(--salud-optima)';

                    return (
                        <div key={apiario} style={{ border: '1px solid rgba(10,61,47,0.08)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            {/* Apiario Header */}
                            <div
                                onClick={() => toggleApiario(apiario)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: 'var(--space-md)', background: isExpanded ? 'rgba(10,61,47,0.02)' : 'transparent',
                                    cursor: 'pointer', transition: 'background 150ms'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: apiarioHealth }} />
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--bosque-ulmo)', fontSize: '0.95rem' }}>{apiario}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{apiarioColmenas.length} colmenas</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ textAlign: 'right', display: 'flex', gap: 12 }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}><Droplets size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--oro-miel-dark)' }} />{apiarioColmenas.reduce((s, c) => s + c.production, 0)} kg</span>
                                    </div>
                                    <ChevronRight size={18} style={{ color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }} />
                                </div>
                            </div>

                            {/* Colmenas List */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid rgba(10,61,47,0.06)', background: 'rgba(253,251,247,0.4)', padding: 'var(--space-sm)' }}>
                                    <div className="colmena-list" style={{ gap: 4 }}>
                                        {apiarioColmenas.map(c => (
                                            <div key={c.id} className="colmena-item" style={{ padding: '8px 12px', background: 'white', position: 'relative' }}>
                                                <div className={`colmena-status ${c.health}`} />
                                                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => onSelectColmena(c)}>
                                                    <div className="colmena-name" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {c.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', marginTop: 2, color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                                                        <span>{c.floracion || 'Sin floración'}</span>
                                                        <span>⚖️ {c.pesoHistory?.at(-1)?.kg || 0} kg</span>
                                                        <span>🔬 V {c.varroaHistory?.at(-1)?.level || 0}/10</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="colmena-production" style={{ textAlign: 'right', marginRight: 8 }}>
                                                        <div className="colmena-production-value" style={{ fontSize: '0.9rem' }}>{c.production}</div>
                                                        <div className="colmena-production-label" style={{ fontSize: '0.6rem' }}>kg</div>
                                                    </div>

                                                    {/* Context Menu Actions */}
                                                    <div style={{ display: 'flex', gap: 2 }}>
                                                        <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--bosque-ulmo)' }}
                                                            onClick={(e) => { e.stopPropagation(); setEditingColmena({ ...c }); }}>
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--salud-riesgo)' }}
                                                            onClick={(e) => handleDelete(c.id, e)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="btn btn-outline btn-sm" onClick={() => handleAddColmena(apiario)} style={{ marginTop: 8, padding: '8px', borderStyle: 'dashed', color: 'var(--text-muted)', width: '100%' }}>
                                            <Plus size={14} style={{ display: 'inline', marginRight: 6 }} /> Agregar colmena a este apiario
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Quick Edit Modal */}
            {editingColmena && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setEditingColmena(null)} />
                    <div className="card" style={{ position: 'relative', zIndex: 401, width: 400, padding: 'var(--space-xl)' }}>
                        <div className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
                            {localColmenas.find(c => c.id === editingColmena.id) ? 'Editar Colmena' : 'Nueva Colmena'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--bosque-ulmo)' }}>Nombre identificador</label>
                                <input className="input-field" value={editingColmena.name} onChange={e => setEditingColmena({ ...editingColmena, name: e.target.value })} placeholder="Ej. Colmena Reina Vieja" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--bosque-ulmo)' }}>Apiario destino</label>
                                <input className="input-field" value={editingColmena.location} onChange={e => setEditingColmena({ ...editingColmena, location: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--bosque-ulmo)' }}>Estado de salud</label>
                                    <select className="input-field" value={editingColmena.health} onChange={e => setEditingColmena({ ...editingColmena, health: e.target.value as any })}>
                                        <option value="optimal">Óptima</option>
                                        <option value="attention">Atención</option>
                                        <option value="risk">Riesgo / Critica</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--bosque-ulmo)' }}>Alzas activas</label>
                                    <input className="input-field" type="number" min={0} max={6} value={editingColmena.alzas} onChange={e => setEditingColmena({ ...editingColmena, alzas: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-xl)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setEditingColmena(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={() => handleSaveColmena(editingColmena)}>Guardar cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
