import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, Circle, Filter, Plus, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calendarioTasks, flowPredictions } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
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
    const [tasks, setTasks] = useState<any[]>([]);
    const [filterCat, setFilterCat] = useState<CalendarioTask['category'] | 'all'>('all');
    const [showMonth, setShowMonth] = useState<string>('Marzo');
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [newTaskForm, setNewTaskForm] = useState<Partial<CalendarioTask>>({
        title: '', month: 'Marzo', week: 1, category: 'inspeccion', priority: 'media', colmena: ''
    });
    const months = ['Marzo', 'Abril', 'Mayo', 'Agosto', 'Septiembre'];

    useEffect(() => {
        async function loadTasks() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase.from('calendario_tasks')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            if (data && data.length > 0) {
                setTasks(data);
            } else {
                setTasks(calendarioTasks); // fallback to mock visual
            }
        }
        loadTasks();
    }, []);

    const toggle = async (id: string) => {
        const t = tasks.find(x => x.id === id);
        if (!t) return;

        // Optimistic UI update
        setTasks(prev => prev.map(task => task.id === id ? { ...task, done: !task.done } : task));

        try {
            // Only update supabase if it's not a local mock ID
            if (!id.includes('tmp') && typeof id !== 'number') {
                await supabase.from('calendario_tasks').update({ done: !t.done }).eq('id', id);
            }
        } catch (e) {
            console.error(e);
            // Ignore rollback for demo
        }
    };

    const handleAddTask = async () => {
        if (!newTaskForm.title) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase.from('calendario_tasks').insert({
                    user_id: session.user.id,
                    title: newTaskForm.title,
                    month: newTaskForm.month,
                    week: newTaskForm.week,
                    category: newTaskForm.category,
                    priority: newTaskForm.priority,
                    colmena: newTaskForm.colmena,
                    done: false
                }).select().single();

                if (data) {
                    setTasks(prev => [data, ...prev]);
                }
            }
        } catch (e) {
            console.error("Error creating task", e);
        }

        setShowNewTaskForm(false);
        setNewTaskForm({ title: '', month: showMonth, week: 1, category: 'inspeccion', priority: 'media', colmena: '' });
    };

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
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--salud-optima)' }}>
                            {doneCount}/{filtered.length}
                        </span>
                        <button className="btn btn-gold btn-sm" onClick={() => setShowNewTaskForm(true)}><Plus size={14} style={{ marginRight: 4 }} /> Tarea</button>
                    </div>
                </div>

                {showNewTaskForm && (
                    <div style={{ padding: 'var(--space-md)', background: 'var(--oro-miel-glow)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid rgba(212,160,23,0.3)', position: 'relative' }}>
                        <button onClick={() => setShowNewTaskForm(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bosque-ulmo)', marginBottom: 'var(--space-sm)' }}>Programar Nueva Tarea</div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 8 }}>
                            <input autoFocus type="text" placeholder="Título de la tarea..." className="input-field" value={newTaskForm.title} onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                            <select className="input-field" value={newTaskForm.month} onChange={e => setNewTaskForm({ ...newTaskForm, month: e.target.value })}>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select className="input-field" value={newTaskForm.week} onChange={e => setNewTaskForm({ ...newTaskForm, week: parseInt(e.target.value) })}>
                                {[1, 2, 3, 4].map(w => <option key={w} value={w}>Semana {w}</option>)}
                            </select>
                            <select className="input-field" value={newTaskForm.category} onChange={e => setNewTaskForm({ ...newTaskForm, category: e.target.value as any })}>
                                <option value="inspeccion">Inspección</option>
                                <option value="tratamiento">Tratamiento</option>
                                <option value="cosecha">Cosecha</option>
                                <option value="transhumancia">Transhumancia</option>
                                <option value="reforestacion">Reforestación</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            <select className="input-field" value={newTaskForm.priority} onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}>
                                <option value="baja">Prioridad Baja</option>
                                <option value="media">Prioridad Media</option>
                                <option value="alta">Prioridad Alta</option>
                            </select>
                            <input type="text" placeholder="Apiario/Colmena opcional" className="input-field" value={newTaskForm.colmena} onChange={e => setNewTaskForm({ ...newTaskForm, colmena: e.target.value })} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary btn-sm" onClick={handleAddTask}>Programar</button>
                        </div>
                    </div>
                )}

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
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColors[task.category as CalendarioTask['category']], flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--bosque-ulmo)', textDecoration: task.done ? 'line-through' : 'none' }}>
                                        {task.title}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Semana {task.week}</span>
                                    <span style={{ fontSize: '0.68rem', color: categoryColors[task.category as CalendarioTask['category']] }}>
                                        {categoryLabels[task.category as CalendarioTask['category']]}
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
