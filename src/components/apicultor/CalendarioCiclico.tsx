import { useState } from 'react';
import { CalendarDays, CheckCircle2, Circle, Filter } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calendarioTasks, flowPredictions } from '../../data/mockData';
import type { CalendarioTask } from '../../data/mockData';

const categoryColors: Record<CalendarioTask['category'], string> = {
    inspeccion: 'var(--bosque-ulmo)', cosecha: 'var(--oro-miel-dark)',
    tratamiento: 'var(--salud-riesgo)', reforestacion: 'var(--salud-optima)',
    transhumancia: '#3498DB', cera: 'var(--text-muted)',
};
const categoryLabels: Record<CalendarioTask['category'], string> = {
    inspeccion: '🔍 Inspección', cosecha: '🍯 Cosecha',
    tratamiento: '⚕️ Tratamiento', reforestacion: '🌱 Reforestación',
    transhumancia: '🚛 Transhumancia', cera: '🕯️ Cera',
};
const priorityBadge = (p: string) =>
    p === 'alta' ? 'badge-danger' : p === 'media' ? 'badge-gold' : 'badge-warning';

export default function CalendarioCiclico() {
    const [tasks, setTasks] = useState(calendarioTasks);
    const [filterCat, setFilterCat] = useState<CalendarioTask['category'] | 'all'>('all');
    const [showMonth, setShowMonth] = useState<string>('Marzo');
    const months = ['Marzo', 'Abril', 'Mayo', 'Agosto', 'Septiembre'];

    const toggle = (id: string) =>
        setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

    const categories = ['all', 'inspeccion', 'cosecha', 'tratamiento', 'reforestacion', 'transhumancia', 'cera'] as const;

    const filtered = tasks.filter(t =>
        t.month === showMonth && (filterCat === 'all' || t.category === filterCat)
    );
    const doneCount = filtered.filter(t => t.done).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

            {/* Predicción flujo de néctar IA */}
            <div className="card" style={{ border: '1px solid rgba(212,160,23,0.15)' }}>
                <div className="section-header">
                    <div>
                        <div className="section-title">🌸 Predicción IA · Flujo de Néctar</div>
                        <div className="section-subtitle">Próximos 45 días · Chiloé · Confianza promedio 80%</div>
                    </div>
                    <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>IA activa</span>
                </div>
                <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={flowPredictions}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,61,47,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#8A9AAF"
                                tickFormatter={v => v.slice(5)} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#8A9AAF" />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, fontFamily: 'Inter', fontSize: '0.78rem' }}
                                formatter={(v: any, name: any) =>
                                    name === 'flujoIndex' ? [`${v}/100`, 'Flujo néctar'] : [v, name]}
                                labelFormatter={l => `📅 ${l}`}
                            />
                            <Area type="monotone" dataKey="flujoIndex" stroke="#D4A017"
                                fill="rgba(212,160,23,0.15)" strokeWidth={2} name="flujoIndex" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                    {flowPredictions.slice(0, 4).map((p, i) => (
                        <div key={i} style={{ padding: 8, background: `rgba(212,160,23,${0.05 + p.flujoIndex / 800})`, borderRadius: 6, textAlign: 'center' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--oro-miel-dark)' }}>{p.flujoIndex}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--bosque-ulmo)', fontWeight: 600 }}>{p.floracion.split('(')[0].trim()}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{p.date.slice(5)} · ~{p.prediccionKg}kg/d</div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'rgba(10,61,47,0.04)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--bosque-ulmo)' }}>✨ Recomendación IA:</strong>{' '}
                    El pico de flujo ocurrirá entre <strong>2 y 8 de marzo</strong> (tepú + ulmo simultáneos).
                    Coloca alzas extra en Pureo Norte <strong>ahora</strong> para maximizar captura.
                    Flujo cayendo en semana del 12: programar cosecha ese fin de semana.
                </div>
            </div>

            {/* Calendario de tareas */}
            <div className="card">
                <div className="section-header">
                    <div>
                        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarDays size={18} /> Ciclo del Bosque
                        </div>
                        <div className="section-subtitle">Planificador anual de tareas apícolas</div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--salud-optima)' }}>
                        {doneCount}/{filtered.length}
                    </span>
                </div>

                {/* Month tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                    {months.map(m => (
                        <button key={m} onClick={() => setShowMonth(m)}
                            className={`btn btn-sm ${showMonth === m ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ fontSize: '0.78rem' }}>{m}</button>
                    ))}
                </div>

                {/* Category filter */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Filter size={13} style={{ color: 'var(--text-muted)' }} />
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilterCat(c)}
                            style={{
                                padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                fontSize: '0.7rem', fontWeight: 500, fontFamily: 'var(--font-datos)',
                                background: filterCat === c ? 'var(--bosque-ulmo)' : 'rgba(10,61,47,0.06)',
                                color: filterCat === c ? 'white' : 'var(--text-secondary)',
                                transition: 'all 120ms'
                            }}>
                            {c === 'all' ? 'Todas' : categoryLabels[c as CalendarioTask['category']]}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Sin tareas para este período.
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filtered.map(task => (
                        <div key={task.id} onClick={() => toggle(task.id)}
                            style={{
                                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
                                padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)',
                                background: task.done ? 'rgba(46,204,113,0.05)' : 'rgba(10,61,47,0.02)',
                                border: `1px solid ${task.done ? 'rgba(46,204,113,0.15)' : 'transparent'}`,
                                cursor: 'pointer', transition: 'all 150ms', opacity: task.done ? 0.65 : 1,
                            }}>
                            <div style={{ paddingTop: 2, flexShrink: 0 }}>
                                {task.done
                                    ? <CheckCircle2 size={18} style={{ color: 'var(--salud-optima)' }} />
                                    : <Circle size={18} style={{ color: 'var(--crema-dark)' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColors[task.category], flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--bosque-ulmo)', textDecoration: task.done ? 'line-through' : 'none' }}>
                                        {task.title}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Semana {task.week}</span>
                                    <span style={{ fontSize: '0.68rem', color: categoryColors[task.category] }}>
                                        {categoryLabels[task.category]}
                                    </span>
                                    {task.colmena && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>· {task.colmena}</span>}
                                </div>
                            </div>
                            <span className={`badge ${priorityBadge(task.priority)}`} style={{ fontSize: '0.62rem', alignSelf: 'flex-start' }}>
                                {task.priority}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
