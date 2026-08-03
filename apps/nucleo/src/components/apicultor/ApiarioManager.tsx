import { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, ChevronRight, Droplets, LocateFixed } from 'lucide-react';
import type { ApiarioRow, ColmenaWithRelations } from '@/lib/apicultor-types';
import { estadoFromHealth } from '@/types/ecosystem';
import { supabase } from '../../lib/supabase';
import { toast, friendlyError } from '@enjambre/ui';

interface ApiarioManagerProps {
    colmenas: ColmenaWithRelations[];
    setColmenas: React.Dispatch<React.SetStateAction<ColmenaWithRelations[]>>;
    apiarios: ApiarioRow[];
    setApiarios: React.Dispatch<React.SetStateAction<ApiarioRow[]>>;
    onSelectColmena: (c: ColmenaWithRelations) => void;
}

interface ApiarioDraft {
    name: string;
    lat: string;
    lng: string;
    health: 'optimal' | 'attention' | 'risk';
    details: string;
}

// Registro basal de la bitácora (docs/BITACORA_APICOLA.md §1.1): campos de la
// inspección inicial que se persisten como primera fila de `inspecciones`.
// Vacío por defecto — la inspección sólo se escribe si el apicultor ingresa datos.
interface InspeccionBasalForm {
    poblacion: 'Baja' | 'Media' | 'Alta' | '';
    marcos_cria: number;
    marcos_miel: number;
    varroa: number;
    enjambrazon_riesgo: 'bajo' | 'medio' | 'alto';
}

const INSPECCION_BASAL_INICIAL: InspeccionBasalForm = {
    poblacion: '',
    marcos_cria: 0,
    marcos_miel: 0,
    varroa: 0,
    enjambrazon_riesgo: 'bajo',
};

export function ApiarioManager({ colmenas: localColmenas, setColmenas: setLocalColmenas, apiarios, setApiarios, onSelectColmena }: ApiarioManagerProps) {
    const [expandedApiarios, setExpandedApiarios] = useState<string[]>([]);
    const [editingColmena, setEditingColmena] = useState<ColmenaWithRelations | null>(null);
    const [inspeccionBasal, setInspeccionBasal] = useState<InspeccionBasalForm>(INSPECCION_BASAL_INICIAL);
    const [editingApiario, setEditingApiario] = useState<ApiarioDraft | null>(null);
    const [locatingGps, setLocatingGps] = useState(false);
    const [apiarioError, setApiarioError] = useState<string | null>(null);

    // Apiarios reales de la BD (pueden tener 0 colmenas) + grupos legacy de colmenas sin apiario asignado
    const apiarioNames = Array.from(new Set([
        ...apiarios.map(a => a.name).filter((n): n is string => Boolean(n)),
        ...localColmenas.map(c => c.apiario_name).filter((n): n is string => Boolean(n)),
    ]));

    const toggleApiario = (apiario: string) => {
        setExpandedApiarios(prev =>
            prev.includes(apiario) ? prev.filter(a => a !== apiario) : [...prev, apiario]
        );
    };

    const optimalCount = localColmenas.filter(c => c.health === 'optimal').length;
    const attentionCount = localColmenas.filter(c => c.health === 'attention').length;
    const riskCount = localColmenas.filter(c => c.health === 'risk').length;

    const handleAddColmena = (apiario: string) => {
        const apiarioRow = apiarios.find(a => a.name === apiario);
        setInspeccionBasal(INSPECCION_BASAL_INICIAL);
        setEditingColmena({
            id: Date.now().toString(), // Mock ID
            apiario_id: apiarioRow?.id ?? null,
            name: '',
            apiario_name: apiario,
            health: 'optimal',
            queen: null,
            production_total: 0,
            floracion: '',
            inspecciones: [], varroa_records: [], peso_records: [],
            costos: { horas_anuales: 0, costo_hora: 0, amortizacion_cajon: 12000, insumos_anuales: 0, produccion_kg: 0 },
            alzas: 1
        } as unknown as ColmenaWithRelations);
    };

    const handleEditColmena = (c: ColmenaWithRelations) => {
        setInspeccionBasal(INSPECCION_BASAL_INICIAL);
        setEditingColmena({ ...c });
    };

    const handleUseMyLocation = () => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            setApiarioError('Geolocalización no disponible en este navegador.');
            return;
        }
        setLocatingGps(true);
        setApiarioError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setEditingApiario(prev => prev ? {
                    ...prev,
                    lat: pos.coords.latitude.toFixed(6),
                    lng: pos.coords.longitude.toFixed(6),
                } : prev);
                setLocatingGps(false);
            },
            (err) => {
                setLocatingGps(false);
                setApiarioError(`No se pudo obtener la ubicación: ${err.message}`);
            },
            { timeout: 8000, enableHighAccuracy: true },
        );
    };

    const handleSaveApiario = async () => {
        if (!editingApiario) return;
        const name = editingApiario.name.trim();
        if (!name) {
            setApiarioError('El nombre del apiario es obligatorio.');
            return;
        }
        if (apiarioNames.includes(name)) {
            setApiarioError(`Ya existe un apiario llamado "${name}".`);
            return;
        }
        const lat = editingApiario.lat === '' ? 0 : parseFloat(editingApiario.lat);
        const lng = editingApiario.lng === '' ? 0 : parseFloat(editingApiario.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            setApiarioError('Coordenadas inválidas: usa grados decimales (ej. -42.483123, -73.743195).');
            return;
        }

        setApiarioError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: newAp, error } = await supabase.from('apiarios').insert({
                name,
                lat,
                lng,
                health: editingApiario.health,
                details: editingApiario.details.trim() || null,
                user_id: user?.id ?? null,
            }).select('*').single();
            if (error) throw error;
            if (!newAp) {
                setApiarioError('No se pudo crear el apiario en la base de datos.');
                return;
            }

            // El apiario es una entidad propia: se agrega a la lista real, sin colmena automática
            setApiarios(prev => [...prev, newAp]);
            setExpandedApiarios(p => [...p, name]);
            setEditingApiario(null);
            toast('Apiario registrado con coordenadas', { type: 'success' });
        } catch (err) {
            console.error('Error creando apiario', err);
            setApiarioError(friendlyError(err, 'Error al crear el apiario'));
        }
    };

    const handleDeleteApiario = async (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const row = apiarios.find(a => a.name === name);
        if (!row) return;
        if (!confirm(`¿Eliminar el apiario "${name}"? Sus colmenas quedarán sin apiario asignado.`)) return;
        try {
            const { error } = await supabase.from('apiarios').delete().eq('id', row.id);
            if (error) throw error;
            setApiarios(prev => prev.filter(a => a.id !== row.id));
            setExpandedApiarios(prev => prev.filter(n => n !== name));
            setLocalColmenas(prev => prev.map(c => c.apiario_name === name ? { ...c, apiario_name: 'Sin apiario', apiario_id: null } : c));
        } catch (err) {
            console.error('Error eliminando apiario', err);
            toast(friendlyError(err, 'Error al eliminar el apiario'), { type: 'error' });
        }
    };

    // Inspección basal (BITACORA_APICOLA.md §1.1): sólo se escribe si hay datos
    // científicos; reina RV/SR alimenta el booleano `reina` de la ficha.
    const persistInspeccionBasal = async (colmenaId: string, uid: string | null, queen: string | null | undefined) => {
        const b = inspeccionBasal;
        const hasBasal = b.marcos_cria > 0 || b.marcos_miel > 0 || b.varroa > 0 || b.poblacion !== '' || b.enjambrazon_riesgo !== 'bajo';
        if (!hasBasal) return;

        const date = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('inspecciones').insert({
            colmena_id: colmenaId, date, inspector: 'Apicultor',
            marcos_cria: b.marcos_cria > 0 ? b.marcos_cria : null,
            marcos_miel: b.marcos_miel > 0 ? b.marcos_miel : null,
            varroa: b.varroa > 0 ? b.varroa : null,
            poblacion: b.poblacion.toLowerCase() || null,
            reina: queen === 'RV' ? true : queen === 'SR' ? false : null,
            enjambrazon_riesgo: b.enjambrazon_riesgo,
            user_id: uid,
        });
        if (error) {
            console.error('Error registrando inspección basal', error);
            return;
        }
        // La bitácora ancla cada evento a su fecha; last_inspection la refleja
        await supabase.from('colmenas').update({ last_inspection: date }).eq('id', colmenaId);
    };

    const handleSaveColmena = async (c: ColmenaWithRelations) => {
        // Optimistic UI updates
        setLocalColmenas(prev => {
            const exists = prev.find(p => p.id === c.id);
            if (exists) return prev.map(p => p.id === c.id ? c : p);
            return [...prev, c];
        });
        if (c.apiario_name && !expandedApiarios.includes(c.apiario_name)) {
            setExpandedApiarios(prev => [...prev, c.apiario_name!]);
        }
        setEditingColmena(null);

        // Supabase persistence
        try {
            // El schema vivo usa colmenas.health (valores en inglés) y apiarios.user_id
            const { data: { user } } = await supabase.auth.getUser();
            const uid = user?.id ?? null;

            let apiarioId = (c.apiario_id && c.apiario_id.length >= 20) ? c.apiario_id : null;
            // 1. Si la colmena no trae apiario_id, resolver o crear Apiario por nombre (location)
            if (!apiarioId) {
              const { data: existingAp } = await supabase.from('apiarios').select('id').eq('name', c.apiario_name || '').single();
              if (existingAp) {
                apiarioId = existingAp.id;
              } else {
                const { data: newAp } = await supabase.from('apiarios').insert({
                  name: c.apiario_name || 'Nuevo Apiario',
                  lat: typeof c.lat === 'number' ? c.lat : 0,
                  lng: typeof c.lng === 'number' ? c.lng : 0,
                  health: c.health || 'optimal',
                  user_id: uid,
                }).select().single();
                if (newAp) apiarioId = newAp.id;
              }
            }

            // 2. Insert or update Colmena
            const isNew = !c.id || c.id.includes('mock') || c.id.length < 20; // Supabase uses UUIDs
            if (isNew && apiarioId) {
          const { data: newRow } = await supabase.from('colmenas').insert({
            apiario_id: apiarioId, name: c.name, health: c.health || 'optimal', user_id: uid,
            production_total: c.production_total || 0, floracion: c.floracion,
            last_inspection: c.last_inspection || null,
            alzas: c.alzas || 1, notes: c.notes || '', queen: c.queen
                }).select('id').single();

                // Update local ID behind the scenes
                if (newRow) {
                    setLocalColmenas(prev => prev.map(p => p.id === c.id ? { ...p, id: newRow.id } : p));
                    await persistInspeccionBasal(newRow.id, uid, c.queen);
                }
            } else if (!isNew) {
                await supabase.from('colmenas').update({
                    name: c.name,
                    health: c.health || 'optimal',
                    floracion: c.floracion,
                    last_inspection: c.last_inspection || null,
                    production_total: c.production_total || 0,
                    alzas: c.alzas || 1,
                    notes: c.notes || '',
                    queen: c.queen,
                }).eq('id', c.id);
                await persistInspeccionBasal(c.id, uid, c.queen);
            }
        } catch (err) {
            console.error("Error syncing colmena to Supabase", err);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta colmena y todo su historial científico?')) {
            // UI optimistic
            setLocalColmenas(prev => prev.filter(c => c.id !== id));
            // Supabase delete
            if (!id.includes('mock') && id.length >= 20) {
                await supabase.from('colmenas').delete().eq('id', id);
            }
        }
    };

    return (
        <div className="card animate-in delay-2">
            <div className="section-header">
                <div>
                    <div className="section-title">Gestión de Apiarios</div>
                    <div className="section-subtitle">
<span style={{ color: 'hsl(var(--success))' }}>● {optimalCount} óptimas</span>
{attentionCount > 0 && <span style={{ marginLeft: 12, color: 'hsl(var(--warning))' }}>● {attentionCount} atención</span>}
{riskCount > 0 && <span style={{ marginLeft: 12, color: 'hsl(var(--destructive))' }}>● {riskCount} riesgo</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                        setApiarioError(null);
                        setEditingApiario({ name: '', lat: '', lng: '', health: 'optimal', details: '' });
                    }}><MapPin size={14} /> Nuevo Apiario</button>
                    <button className="btn btn-gold btn-sm" onClick={() => handleAddColmena(apiarioNames[0] || 'Nuevo Apiario')}><Plus size={14} /> Colmena</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {apiarioNames.length === 0 && (
                    <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                        No hay apiarios registrados.
                    </div>
                )}

                {apiarioNames.map(apiario => {
                    const apiarioRow = apiarios.find(a => a.name === apiario);
                    const apiarioColmenas = localColmenas.filter(c => c.apiario_name === apiario);
                    const isExpanded = expandedApiarios.includes(apiario);
                    const hasCoords = !!apiarioRow && typeof apiarioRow.lat === 'number' && typeof apiarioRow.lng === 'number' && (apiarioRow.lat !== 0 || apiarioRow.lng !== 0);
const apiarioHealth = (apiarioRow?.health === 'risk' || apiarioColmenas.some(c => c.health === 'risk')) ? 'hsl(var(--destructive))'
: (apiarioRow?.health === 'attention' || apiarioColmenas.some(c => c.health === 'attention')) ? 'hsl(var(--warning))'
: 'hsl(var(--success))';

                    return (
                        <div key={apiario} style={{ border: '1px solid hsl(var(--border) / 0.5)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            {/* Apiario Header */}
                            <div
                                onClick={() => toggleApiario(apiario)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: 'var(--space-md)', background: isExpanded ? 'hsl(var(--muted) / 0.5)' : 'transparent',
                                    cursor: 'pointer', transition: 'background 150ms'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: apiarioHealth }} />
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', fontSize: '0.95rem' }}>{apiario}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>
                                            {apiarioColmenas.length} colmenas
                                            {hasCoords && apiarioRow ? ` · ${apiarioRow.lat.toFixed(4)}, ${apiarioRow.lng.toFixed(4)}` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ textAlign: 'right', display: 'flex', gap: 12 }}>
                                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}><Droplets size={12} style={{ display: 'inline', marginRight: 4, color: 'hsl(var(--accent))' }} />{apiarioColmenas.reduce((s, c) => s + (c.production_total || 0), 0)} kg</span>
                                    </div>
                                    {apiarioRow && (
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-sm"
                                          style={{ minWidth: 32, minHeight: 32, padding: 0, color: 'hsl(var(--destructive))' }}
                                          aria-label={`Eliminar apiario ${apiario}`}
                                          onClick={(e) => handleDeleteApiario(apiario, e)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <ChevronRight size={18} style={{ color: 'hsl(var(--muted-foreground))', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }} />
                                </div>
                            </div>

                            {/* Colmenas List */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', background: 'hsl(var(--muted) / 0.5)', padding: 'var(--space-sm)' }}>
                                    <div className="colmena-list" style={{ gap: 4 }}>
                                        {apiarioColmenas.map(c => (
                                            <div key={c.id} className="colmena-item" style={{ background: 'hsl(var(--card))', position: 'relative' }}>
                                                <div className={`colmena-status ${c.health}`} />
                                                <div style={{ flex: 1, cursor: 'pointer', minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} onClick={() => onSelectColmena(c)}>
                                                    <div className="colmena-name" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        {c.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', marginTop: 2, color: 'hsl(var(--muted-foreground))', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                        <span>{c.floracion || 'Sin floración'}</span>
                                                        <span>⚖️ {c.peso_records?.at(-1)?.kg || 0} kg</span>
                                                        <span>🔬 V {c.varroa_records?.at(-1)?.level || 0}/10</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="colmena-production" style={{ textAlign: 'right', marginRight: 8 }}>
                                                        <div className="colmena-production-value" style={{ fontSize: '0.9rem' }}>{c.production_total || 0}</div>
                                                        <div className="colmena-production-label" style={{ fontSize: '0.6rem' }}>kg</div>
                                                    </div>

                                                    {/* Context Menu Actions */}
                                                    <div style={{ display: 'flex', gap: 4 }}>
                                                        <button
                                                          type="button"
                                                          className="btn btn-ghost btn-sm"
                                                          style={{ minWidth: 44, minHeight: 44, padding: 0, color: 'hsl(var(--foreground))' }}
                                                          aria-label={`Editar ${c.name}`}
                                                          onClick={(e) => { e.stopPropagation(); handleEditColmena(c); }}
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                          type="button"
                                                          className="btn btn-ghost btn-sm"
                                                          style={{ minWidth: 44, minHeight: 44, padding: 0, color: 'hsl(var(--destructive))' }}
                                                          aria-label={`Eliminar ${c.name}`}
                                                          onClick={(e) => handleDelete(c.id, e)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="btn btn-outline btn-sm" onClick={() => handleAddColmena(apiario)} style={{ marginTop: 8, padding: '8px', borderStyle: 'dashed', color: 'hsl(var(--muted-foreground))', width: '100%' }}>
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
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingColmena(null)} />
                    <div className="card" style={{ position: 'relative', zIndex: 401, width: 400, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-xl)' }}>
                        <div className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
                            {localColmenas.find(c => c.id === editingColmena.id) ? 'Editar Colmena' : 'Nueva Colmena'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre identificador</label>
                                <input className="input-field w-full" value={editingColmena.name} onChange={e => setEditingColmena({ ...editingColmena, name: e.target.value })} placeholder="Ej. Colmena Reina Vieja" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Estado de salud</label>
                                    <select className="input-field w-full" value={editingColmena.health || 'optimal'} onChange={e => setEditingColmena({ ...editingColmena, health: e.target.value as ColmenaWithRelations['health'] })}>
                                        <option value="optimal" className="bg-card text-foreground">Óptima</option>
                                        <option value="attention" className="bg-card text-foreground">Atención</option>
                                        <option value="risk" className="bg-card text-foreground">Riesgo / Crítica</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Alzas activas</label>
                                    <input className="input-field w-full" type="number" min={0} max={6} value={editingColmena.alzas || 0} onChange={e => setEditingColmena({ ...editingColmena, alzas: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: 'var(--space-md)', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                                Registro científico basal — se guarda como primera inspección
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Reina</label>
                                    <select className="input-field w-full" value={editingColmena.queen ?? ''} onChange={e => setEditingColmena({ ...editingColmena, queen: e.target.value || null })}>
                                        <option value="" className="bg-card text-foreground">—</option>
                                        <option value="RV" className="bg-card text-foreground">RV · Reina vista</option>
                                        <option value="NV" className="bg-card text-foreground">NV · No vista</option>
                                        <option value="SR" className="bg-card text-foreground">SR · Sin reina</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Población</label>
                                    <select className="input-field w-full" value={inspeccionBasal.poblacion} onChange={e => setInspeccionBasal({ ...inspeccionBasal, poblacion: e.target.value as InspeccionBasalForm['poblacion'] })}>
                                        <option value="" className="bg-card text-foreground">—</option>
                                        <option value="Baja" className="bg-card text-foreground">Baja</option>
                                        <option value="Media" className="bg-card text-foreground">Media</option>
                                        <option value="Alta" className="bg-card text-foreground">Alta</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Cuadros con cría</label>
                                    <input className="input-field w-full" type="number" min={0} max={40} value={inspeccionBasal.marcos_cria || ''} onChange={e => setInspeccionBasal({ ...inspeccionBasal, marcos_cria: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Cuadros con miel</label>
                                    <input className="input-field w-full" type="number" min={0} max={40} value={inspeccionBasal.marcos_miel || ''} onChange={e => setInspeccionBasal({ ...inspeccionBasal, marcos_miel: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Varroa (0-10)</label>
                                    <input className="input-field w-full" type="number" step="0.5" min={0} max={10} value={inspeccionBasal.varroa || ''} onChange={e => setInspeccionBasal({ ...inspeccionBasal, varroa: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Riesgo de enjambrazón</label>
                                    <select className="input-field w-full" value={inspeccionBasal.enjambrazon_riesgo} onChange={e => setInspeccionBasal({ ...inspeccionBasal, enjambrazon_riesgo: e.target.value as InspeccionBasalForm['enjambrazon_riesgo'] })}>
                                        <option value="bajo" className="bg-card text-foreground">Bajo</option>
                                        <option value="medio" className="bg-card text-foreground">Medio</option>
                                        <option value="alto" className="bg-card text-foreground">Alto</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Floración</label>
                                <input className="input-field w-full" value={editingColmena.floracion || ''} onChange={e => setEditingColmena({ ...editingColmena, floracion: e.target.value })} placeholder="Ej. Ulmo, Arrayán" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-xl)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setEditingColmena(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={() => handleSaveColmena(editingColmena)}>Guardar cambios</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Registro científico de apiario */}
            {editingApiario && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingApiario(null)} />
                    <div className="card" style={{ position: 'relative', zIndex: 401, width: 460, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-xl)' }}>
                        <div className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
                            Registrar Nuevo Apiario
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre del apiario *</label>
                                <input className="input-field w-full" value={editingApiario.name} onChange={e => setEditingApiario({ ...editingApiario, name: e.target.value })} placeholder="Ej. Valle Sur" />
                                <div style={{ fontSize: '0.68rem', marginTop: 4, color: 'hsl(var(--muted-foreground))' }}>Nombre geográfico o de manejo del asentamiento.</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Coordenadas GPS (grados decimales)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <input className="input-field w-full" type="number" step="any" placeholder="Latitud (ej. -42.483123)" value={editingApiario.lat} onChange={e => setEditingApiario({ ...editingApiario, lat: e.target.value })} />
                                    <input className="input-field w-full" type="number" step="any" placeholder="Longitud (ej. -73.743195)" value={editingApiario.lng} onChange={e => setEditingApiario({ ...editingApiario, lng: e.target.value })} />
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} onClick={handleUseMyLocation} disabled={locatingGps}>
                                    <LocateFixed size={14} style={{ display: 'inline', marginRight: 6 }} />
                                    {locatingGps ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
                                </button>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Estado sanitario del apiario</label>
                                <select className="input-field w-full" value={editingApiario.health} onChange={e => setEditingApiario({ ...editingApiario, health: e.target.value as ApiarioDraft['health'] })}>
                                    <option value="optimal" className="bg-card text-foreground">Óptima</option>
                                    <option value="attention" className="bg-card text-foreground">Atención</option>
                                    <option value="risk" className="bg-card text-foreground">Riesgo / Crítica</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Detalles científicos</label>
                                <textarea className="input-field w-full" rows={4} value={editingApiario.details} onChange={e => setEditingApiario({ ...editingApiario, details: e.target.value })} placeholder="Entorno vegetacional, flora predominante, altitud, exposición, distancia a cursos de agua, antecedentes sanitarios…" />
                            </div>
                            {apiarioError && (
                                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--destructive))' }}>{apiarioError}</div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-xl)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setEditingApiario(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSaveApiario}>Registrar apiario</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
