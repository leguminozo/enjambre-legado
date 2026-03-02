import { useState } from 'react';
import { X, MapPin, Crown, Droplets, Scale, DollarSign, Link, AlertTriangle, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Colmena } from '../../data/mockData';
import { supabase } from '../../lib/supabase';

type Tab = 'resumen' | 'inspecciones' | 'varroa' | 'peso' | 'costos' | 'blockchain';

interface Props { colmena: Colmena; onClose: () => void; onUpdate: (updated: Colmena) => void; }

const varroaColor = (v: number) => v <= 1.5 ? 'var(--salud-optima)' : v <= 3 ? 'var(--salud-atencion)' : 'var(--salud-riesgo)';
const healthLabel = (h: string) => h === 'optimal' ? 'Óptima' : h === 'attention' ? 'Atención' : 'Riesgo';

export default function ColmenaFicha({ colmena, onClose, onUpdate }: Props) {
    const [tab, setTab] = useState<Tab>('resumen');

    // Modal forms states
    const [showInspeccionForm, setShowInspeccionForm] = useState(false);
    const [inspeccionForm, setInspeccionForm] = useState({ date: new Date().toLocaleDateString('es-CL'), marcos_cria: 0, marcos_miel: 0, varroa: 0, poblacion: 'Baja', reina: true, notes: '', enjambrazon_riesgo: 'bajo' as 'bajo' | 'medio' | 'alto' });

    const [showVarroaForm, setShowVarroaForm] = useState(false);
    const [varroaForm, setVarroaForm] = useState({ date: new Date().toLocaleDateString('es-CL'), level: 0, method: 'Alcohol' });

    const [showPesoForm, setShowPesoForm] = useState(false);
    const [pesoForm, setPesoForm] = useState({ date: new Date().toLocaleDateString('es-CL'), kg: 0, note: '' });

    const costoProd = colmena.costos.horas_anuales * colmena.costos.costo_hora
        + colmena.costos.amortizacion_cajon + colmena.costos.insumos_anuales;
    const costoKg = colmena.costos.produccion_kg > 0
        ? Math.round(costoProd / colmena.costos.produccion_kg)
        : 0;
    const precioVenta = 12000;
    const margenKg = precioVenta - costoKg;

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'resumen', label: 'Resumen', icon: '🐝' },
        { id: 'inspecciones', label: 'Inspecciones', icon: '📋' },
        { id: 'varroa', label: 'Varroa', icon: '🔬' },
        { id: 'peso', label: 'Peso', icon: '⚖️' },
        { id: 'costos', label: 'Costos', icon: '💰' },
        { id: 'blockchain', label: 'Trazabilidad', icon: '🔗' },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} onClick={onClose} />
            <div className="card" style={{
                position: 'relative', zIndex: 301, width: '95%', maxWidth: 680,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                padding: 0, overflow: 'hidden', animation: 'fadeInUp 0.3s ease'
            }}>
                {/* Header */}
                <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid rgba(10,61,47,0.08)', background: 'linear-gradient(135deg, var(--bosque-ulmo) 0%, #0E5240 100%)', color: 'var(--crema-natural)' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'white', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: colmena.health === 'optimal' ? 'var(--salud-optima)' : colmena.health === 'attention' ? 'var(--salud-atencion)' : 'var(--salud-riesgo)', boxShadow: '0 0 8px currentColor', flexShrink: 0 }} />
                        <div>
                            <h3 style={{ color: 'white', marginBottom: 2, fontSize: '1.15rem' }}>{colmena.name}</h3>
                            <div style={{ fontSize: '0.78rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{colmena.location} · Lote: {colmena.loteActivo}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--oro-miel)' }}>{colmena.production} kg</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Producción temporada</div>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{
                                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                fontSize: '0.75rem', fontWeight: 500, fontFamily: 'var(--font-datos)',
                                background: tab === t.id ? 'var(--oro-miel)' : 'rgba(255,255,255,0.12)',
                                color: tab === t.id ? 'var(--bosque-ulmo-dark)' : 'rgba(255,255,255,0.8)',
                                transition: 'all 150ms'
                            }}>{t.icon} {t.label}</button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={{ overflow: 'auto', flex: 1, padding: 'var(--space-lg)' }}>

                    {/* ── RESUMEN ── */}
                    {tab === 'resumen' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-md)' }}>
                                {[
                                    { label: 'Estado', value: healthLabel(colmena.health), color: colmena.health === 'optimal' ? 'var(--salud-optima)' : colmena.health === 'attention' ? 'var(--salud-atencion)' : 'var(--salud-riesgo)' },
                                    { label: 'Alzas activas', value: `${colmena.alzas} alzas`, color: 'var(--bosque-ulmo)' },
                                    { label: 'Núcleos', value: colmena.nucleosCandidatos ? 'Candidata ✓' : 'No aplica', color: colmena.nucleosCandidatos ? 'var(--salud-optima)' : 'var(--text-muted)' },
                                ].map((s, i) => (
                                    <div key={i} style={{ padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            {[
                                { icon: <Crown size={14} />, label: 'Reina activa', value: colmena.queen },
                                { icon: <Droplets size={14} />, label: 'Última inspección', value: colmena.lastInspection },
                                { icon: <span style={{ fontSize: '0.85rem' }}>🌸</span>, label: 'Floración', value: colmena.floracion },
                                { icon: <AlertTriangle size={14} />, label: 'Último varroa', value: `${colmena.varroaHistory.at(-1)?.level ?? '–'}/10 (${colmena.varroaHistory.at(-1)?.date ?? '–'})` },
                            ].map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid rgba(10,61,47,0.06)', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--oro-miel-dark)', width: 20 }}>{r.icon}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 130, flexShrink: 0 }}>{r.label}</span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{r.value}</span>
                                </div>
                            ))}
                            {colmena.notes && (
                                <div style={{ padding: 'var(--space-md)', background: 'rgba(212,160,23,0.07)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderLeft: '3px solid var(--oro-miel)' }}>
                                    {colmena.notes}
                                </div>
                            )}
                            {/* Reina history */}
                            <div>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>Linaje de Reinas</div>
                                {colmena.reinaHistory.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', background: r.status === 'activa' ? 'rgba(46,204,113,0.06)' : 'transparent', marginBottom: 4 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.status === 'activa' ? 'var(--salud-optima)' : r.status === 'ausente' ? 'var(--salud-riesgo)' : 'var(--text-muted)', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{r.generation}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Desde {r.since} · {r.origin}</div>
                                        </div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 500, color: r.status === 'activa' ? 'var(--salud-optima)' : 'var(--text-muted)' }}>{r.status.toUpperCase()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── INSPECCIONES ── */}
                    {tab === 'inspecciones' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--bosque-ulmo)' }}>Historial de inspecciones</div>
                                <button className="btn btn-gold btn-sm" onClick={() => setShowInspeccionForm(!showInspeccionForm)}><Plus size={13} /> Nueva</button>
                            </div>
                            {showInspeccionForm && (
                                <div style={{ padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid rgba(212,160,23,0.2)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-sm)' }}>Nueva inspección — {inspeccionForm.date}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 8 }}>
                                        <input type="number" placeholder="Marcos Cría" className="input-field" value={inspeccionForm.marcos_cria || ''} onChange={e => setInspeccionForm({ ...inspeccionForm, marcos_cria: parseInt(e.target.value) || 0 })} />
                                        <input type="number" placeholder="Marcos Miel" className="input-field" value={inspeccionForm.marcos_miel || ''} onChange={e => setInspeccionForm({ ...inspeccionForm, marcos_miel: parseInt(e.target.value) || 0 })} />
                                        <select className="input-field" value={inspeccionForm.poblacion} onChange={e => setInspeccionForm({ ...inspeccionForm, poblacion: e.target.value })}>
                                            <option value="Baja">Población: Baja</option>
                                            <option value="Media">Población: Media</option>
                                            <option value="Alta">Población: Alta</option>
                                        </select>
                                        <select className="input-field" value={inspeccionForm.enjambrazon_riesgo} onChange={e => setInspeccionForm({ ...inspeccionForm, enjambrazon_riesgo: e.target.value as any })}>
                                            <option value="bajo">Enjambración: Bajo</option>
                                            <option value="medio">Enjambración: Medio</option>
                                            <option value="alto">Enjambración: Alto</option>
                                        </select>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                                            <input type="checkbox" checked={inspeccionForm.reina} onChange={e => setInspeccionForm({ ...inspeccionForm, reina: e.target.checked })} /> Reina vista
                                        </div>
                                    </div>
                                    <textarea placeholder="Notas adicionales..." value={inspeccionForm.notes} onChange={e => setInspeccionForm({ ...inspeccionForm, notes: e.target.value })}
                                        style={{ width: '100%', minHeight: 60, padding: 'var(--space-sm)', border: '1px solid rgba(10,61,47,0.15)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', resize: 'vertical' }} />
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowInspeccionForm(false)}>Cancelar</button>
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            const newInspeccion = inspeccionForm as any;

                                            // Write to Supabase first
                                            if (colmena.id && !colmena.id.includes('mock')) {
                                                const { error } = await supabase.from('inspecciones').insert({
                                                    colmena_id: colmena.id, date: newInspeccion.date, inspector: newInspeccion.inspector || 'Apicultor',
                                                    marcos_cria: newInspeccion.marcos_cria, marcos_miel: newInspeccion.marcos_miel, varroa: newInspeccion.varroa,
                                                    poblacion: newInspeccion.poblacion, reina: newInspeccion.reina, enjambrazon_riesgo: newInspeccion.enjambrazon_riesgo, notes: newInspeccion.notes
                                                });
                                                if (error) console.error("Error saving inspeccion:", error);
                                            }

                                            onUpdate({ ...colmena, inspecciones: [newInspeccion, ...colmena.inspecciones] });
                                            setShowInspeccionForm(false);
                                        }}>Guardar</button>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {colmena.inspecciones.map((ins, i) => (
                                    <div key={i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(10,61,47,0.08)', background: i === 0 ? 'rgba(10,61,47,0.02)' : 'transparent' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--bosque-ulmo)' }}>{ins.date}</span>
                                            <span className={`badge ${ins.enjambrazon_riesgo === 'bajo' ? 'badge-success' : ins.enjambrazon_riesgo === 'medio' ? 'badge-gold' : 'badge-danger'}`}>
                                                Enjambr.: {ins.enjambrazon_riesgo}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 'var(--space-sm)' }}>
                                            {[
                                                { label: 'Cría', value: `${ins.marcos_cria} marcos` },
                                                { label: 'Miel', value: `${ins.marcos_miel} marcos` },
                                                { label: 'Varroa', value: `${ins.varroa}/10`, color: varroaColor(ins.varroa) },
                                                { label: 'Población', value: ins.poblacion },
                                            ].map((s, j) => (
                                                <div key={j} style={{ textAlign: 'center', padding: 6, background: 'rgba(10,61,47,0.04)', borderRadius: 6 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: s.color || 'var(--bosque-ulmo)' }}>{s.value}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            {ins.reina ? <CheckCircle2 size={13} style={{ color: 'var(--salud-optima)' }} /> : <AlertTriangle size={13} style={{ color: 'var(--salud-riesgo)' }} />}
                                            <span style={{ fontSize: '0.78rem', color: ins.reina ? 'var(--salud-optima)' : 'var(--salud-riesgo)' }}>{ins.reina ? 'Reina presente' : 'Sin reina'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.notes}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── VARROA ── */}
                    {tab === 'varroa' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Evolución Varroa (nivel 0–10)</div>
                                <button className="btn btn-gold btn-sm" onClick={() => setShowVarroaForm(!showVarroaForm)}><Plus size={13} /> Registro</button>
                            </div>

                            {showVarroaForm && (
                                <div style={{ padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid rgba(212,160,23,0.2)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <input type="number" step="0.5" className="input-field" placeholder="Nivel (0-10)" value={varroaForm.level || ''} onChange={e => setVarroaForm({ ...varroaForm, level: parseFloat(e.target.value) || 0 })} />
                                        <select className="input-field" value={varroaForm.method} onChange={e => setVarroaForm({ ...varroaForm, method: e.target.value })}>
                                            <option value="Lavado con alcohol">Lavado con alcohol</option>
                                            <option value="Caída natural">Caída natural</option>
                                            <option value="CO2">CO2</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowVarroaForm(false)}>Cancelar</button>
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            if (colmena.id && !colmena.id.includes('mock')) {
                                                const { error } = await supabase.from('varroa_records').insert({
                                                    colmena_id: colmena.id, date: varroaForm.date, level: varroaForm.level, method: varroaForm.method
                                                });
                                                if (error) console.error("Error saving varroa:", error);
                                            }
                                            onUpdate({ ...colmena, varroaHistory: [...colmena.varroaHistory, varroaForm] });
                                            setShowVarroaForm(false);
                                        }}>Registrar</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ height: 200, marginBottom: 'var(--space-lg)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={colmena.varroaHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#8A9AAF" />
                                        <YAxis domain={[0, 6]} tick={{ fontSize: 11 }} stroke="#8A9AAF" />
                                        <Tooltip contentStyle={{ borderRadius: 8, fontFamily: 'Inter', fontSize: '0.8rem' }} />
                                        <Line type="monotone" dataKey="level" stroke="#D4A017" strokeWidth={2} dot={{ fill: '#D4A017', r: 5 }} name="Varroa/10" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                {[{ label: '< 1.5 ✓ Óptimo', color: 'var(--salud-optima)' }, { label: '1.5–3 ⚠ Atención', color: 'var(--salud-atencion)' }, { label: '> 3 🔴 Riesgo', color: 'var(--salud-riesgo)' }].map((z, i) => (
                                    <div key={i} style={{ padding: '6px 12px', borderRadius: 20, background: `${z.color}18`, fontSize: '0.72rem', fontWeight: 500, color: z.color }}>{z.label}</div>
                                ))}
                            </div>
                            {colmena.varroaHistory.map((v, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid rgba(10,61,47,0.06)' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: varroaColor(v.level), flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', width: 100 }}>{v.date}</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: varroaColor(v.level), width: 50 }}>{v.level}</span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{v.method}</span>
                                </div>
                            ))}
                            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(212,160,23,0.07)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                <strong>Umbrales apicultura regenerativa:</strong> Tratar con timol (ácido timol) o ácido oxálico sublimado cuando supere nivel 2.5. Nunca usar amitraz. Registrar siempre la fecha y método.
                            </div>
                        </div>
                    )}

                    {/* ── PESO ── */}
                    {tab === 'peso' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Evolución de Peso (kg)</div>
                                <button className="btn btn-gold btn-sm" onClick={() => setShowPesoForm(!showPesoForm)}><Plus size={13} /> Peso</button>
                            </div>

                            {showPesoForm && (
                                <div style={{ padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid rgba(212,160,23,0.2)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <input type="number" step="0.1" className="input-field" placeholder="Peso en kg" value={pesoForm.kg || ''} onChange={e => setPesoForm({ ...pesoForm, kg: parseFloat(e.target.value) || 0 })} />
                                        <input type="text" className="input-field" placeholder="Nota opcional" value={pesoForm.note} onChange={e => setPesoForm({ ...pesoForm, note: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowPesoForm(false)}>Cancelar</button>
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            if (colmena.id && !colmena.id.includes('mock')) {
                                                const { error } = await supabase.from('peso_records').insert({
                                                    colmena_id: colmena.id, date: pesoForm.date, kg: pesoForm.kg, note: pesoForm.note
                                                });
                                                if (error) console.error("Error saving peso:", error);
                                            }
                                            onUpdate({ ...colmena, pesoHistory: [...colmena.pesoHistory, pesoForm] });
                                            setShowPesoForm(false);
                                        }}>Registrar</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ height: 200, marginBottom: 'var(--space-lg)' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={colmena.pesoHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#8A9AAF" />
                                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke="#8A9AAF" />
                                        <Tooltip contentStyle={{ borderRadius: 8, fontFamily: 'Inter', fontSize: '0.8rem' }} />
                                        <Line type="monotone" dataKey="kg" stroke="#0A3D2F" strokeWidth={2} dot={{ fill: '#0A3D2F', r: 4 }} name="Peso (kg)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                {[
                                    { label: 'Peso actual', value: `${colmena.pesoHistory.at(-1)?.kg} kg` },
                                    { label: 'Ganancia total', value: `+${((colmena.pesoHistory.at(-1)?.kg || 0) - (colmena.pesoHistory[0]?.kg || 0)).toFixed(1)} kg` },
                                    { label: 'Flujo diario est.', value: '~0.5 kg/d' },
                                ].map((s, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--bosque-ulmo)' }}>{s.value}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            {colmena.pesoHistory.map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '6px 0', borderBottom: '1px solid rgba(10,61,47,0.06)' }}>
                                    <Scale size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>{p.date}</span>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--bosque-ulmo)' }}>{p.kg} kg</span>
                                    {p.note && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 120 }}>{p.note}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── COSTOS ── */}
                    {tab === 'costos' && (
                        <div>
                            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>Contabilidad por colmena · Temporada 2026</div>
                            {[
                                { label: 'Horas trabajadas', value: `${colmena.costos.horas_anuales} h × $${colmena.costos.costo_hora.toLocaleString()}/h`, total: colmena.costos.horas_anuales * colmena.costos.costo_hora },
                                { label: 'Amortización cajón', value: '$12.000/año', total: colmena.costos.amortizacion_cajon },
                                { label: 'Insumos (timol, ácidos)', value: 'Anuales', total: colmena.costos.insumos_anuales },
                            ].map((row, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) var(--space-md)', borderBottom: '1px solid rgba(10,61,47,0.06)', fontSize: '0.85rem' }}>
                                    <div><div style={{ fontWeight: 500, color: 'var(--bosque-ulmo)' }}>{row.label}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.value}</div></div>
                                    <span style={{ fontWeight: 600 }}>${row.total.toLocaleString()}</span>
                                </div>
                            ))}
                            <div style={{ padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)', marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: 'var(--bosque-ulmo)' }}>
                                <span>Total costo temporada</span><span>${costoProd.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                {[
                                    { label: 'Producción', value: `${colmena.costos.produccion_kg} kg`, color: 'var(--bosque-ulmo)' },
                                    { label: 'Costo/kg real', value: `$${costoKg.toLocaleString()}`, color: 'var(--salud-atencion)' },
                                    { label: 'Margen/kg', value: `$${margenKg.toLocaleString()}`, color: 'var(--salud-optima)' },
                                ].map((s, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--oro-miel-dark)' }}>
                                <DollarSign size={14} style={{ display: 'inline', marginRight: 4 }} />
                                <strong>Margen bruto colmena:</strong> ${(margenKg * colmena.costos.produccion_kg).toLocaleString()} esta temporada
                            </div>
                        </div>
                    )}

                    {/* ── BLOCKCHAIN / TRAZABILIDAD ── */}
                    {tab === 'blockchain' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-lg)' }}>
                                <Link size={16} style={{ color: 'var(--bosque-ulmo)' }} />
                                <span style={{ fontWeight: 600, color: 'var(--bosque-ulmo)' }}>Trazabilidad del Lote</span>
                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Verificado</span>
                            </div>
                            {[
                                { label: 'Hash blockchain', value: colmena.blockchainHash, mono: true },
                                { label: 'Lote activo', value: colmena.loteActivo },
                                { label: 'Colmena origen', value: colmena.name },
                                { label: 'Apiario', value: colmena.location },
                                { label: 'Floración', value: colmena.floracion },
                                { label: 'Última cosecha', value: colmena.lastInspection },
                                { label: 'Producción lote', value: `${colmena.production} kg miel virgen` },
                            ].map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', padding: '8px 0', borderBottom: '1px solid rgba(10,61,47,0.06)', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 140, flexShrink: 0, paddingTop: 2 }}>{r.label}</span>
                                    <span style={{ fontSize: r.mono ? '0.72rem' : '0.85rem', fontWeight: 500, color: r.mono ? 'var(--salud-optima)' : 'var(--bosque-ulmo)', fontFamily: r.mono ? 'monospace' : undefined, wordBreak: 'break-all' }}>{r.value}</span>
                                </div>
                            ))}
                            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'rgba(46,204,113,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(46,204,113,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                <ChevronRight size={12} style={{ display: 'inline', color: 'var(--salud-optima)' }} />
                                {' '}Este lote está registrado de forma inmutable. El cliente puede escanear el QR del producto para ver esta ficha completa, el video de cosecha y los árboles plantados asociados.
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
