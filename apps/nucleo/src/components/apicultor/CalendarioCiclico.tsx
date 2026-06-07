import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, Circle, Filter, Plus, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ORO_MIEL, TEXT_MUTED } from '@/lib/colors';
import { flowPredictions } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import type { CalendarioTask } from '../../data/mockData';

const categoryColors: Record<CalendarioTask['category'], string> = {
inspeccion: 'hsl(var(--primary))', cosecha: 'hsl(var(--accent))',
tratamiento: 'hsl(var(--destructive))', reforestacion: 'hsl(var(--success))',
transhumancia: 'hsl(var(--info))', cera: 'hsl(var(--muted-foreground))',
};
const categoryLabels: Record<CalendarioTask['category'], string> = {
    inspeccion: '🔍 Inspección', cosecha: '🍯 Cosecha',
    tratamiento: '⚕️ Tratamiento', reforestacion: '🌱 Reforestación',
    transhumancia: '🚛 Transhumancia', cera: '🕯️ Cera',
};
const priorityBadge = (p: string) =>
    p === 'alta' ? 'badge-danger' : p === 'media' ? 'badge-gold' : 'badge-warning';

export function CalendarioCiclico() {
    const [tasks, setTasks] = useState<CalendarioTask[]>([]);
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
                setTasks([]);
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
            <div className="card" style={{ border: '1px solid hsl(var(--accent) / 0.15)' }}>
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
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={TEXT_MUTED}
            tickFormatter={v => v.slice(5)} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, fontFamily: 'Inter', fontSize: '0.78rem' }}
formatter={(v, name) =>
              name === 'flujoIndex' ? [`${v}/100`, 'Flujo néctar'] : [v, name]}
                                labelFormatter={l => `📅 ${l}`}
                            />
                            <Area type="monotone" dataKey="flujoIndex" stroke={ORO_MIEL}
                                fill="hsl(var(--accent) / 0.2)" strokeWidth={2} name="flujoIndex" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                    {flowPredictions.slice(0, 4).map((p, i) => (
                        <div key={i} style={{ padding: 8, background: `hsl(var(--accent) / ${0.05 + p.flujoIndex / 800})`, borderRadius: 6, textAlign: 'center' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>{p.flujoIndex}</div>
                            <div style={{ fontSize: '0.65rem', color: 'hsl(var(--foreground))', fontWeight: 600 }}>{p.floracion.split('(')[0]!.trim()}</div>
                            <div style={{ fontSize: '0.6rem', color: 'hsl(var(--muted-foreground))' }}>{p.date.slice(5)} · ~{p.prediccionKg}kg/d</div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', lineHeight: 1.6, color: 'hsl(var(--muted-foreground))' }}>
                    <strong style={{ color: 'hsl(var(--foreground))' }}>✨ Recomendación IA:</strong>{' '}
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
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(var(--success))' }}>
                            {doneCount}/{filtered.length}
                        </span>
                        <button className="btn btn-gold btn-sm" onClick={() => setShowNewTaskForm(true)}><Plus size={14} style={{ marginRight: 4 }} /> Tarea</button>
                    </div>
                </div>

                {showNewTaskForm && (
                    <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid hsl(var(--accent) / 0.3)', position: 'relative' }}>
                        <button onClick={() => setShowNewTaskForm(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}><X size={16} /></button>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 'var(--space-sm)' }}>Programar Nueva Tarea</div>

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
                            <select className="input-field" value={newTaskForm.category} onChange={e => setNewTaskForm({ ...newTaskForm, category: e.target.value as CalendarioTask['category'] })}>
                                <option value="inspeccion">Inspección</option>
                                <option value="tratamiento">Tratamiento</option>
                                <option value="cosecha">Cosecha</option>
                                <option value="transhumancia">Transhumancia</option>
                                <option value="reforestacion">Reforestación</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            <select className="input-field" value={newTaskForm.priority} onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value as CalendarioTask['priority'] })}>
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
                    <Filter size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilterCat(c)}
                            style={{
                                padding: '3px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                fontSize: '0.7rem', fontWeight: 500, fontFamily: 'var(--font-datos)',
background: filterCat === c ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.5)',
color: filterCat === c ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                                transition: 'all 120ms'
                            }}>
                            {c === 'all' ? 'Todas' : categoryLabels[c as CalendarioTask['category']]}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
                        Sin tareas para este período.
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {filtered.map(task => (
                        <div key={task.id} onClick={() => toggle(task.id)}
                            style={{
                                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
                                padding: 'var(--space-md)', borderRadius: 'var(--radius-sm)',
background: task.done ? 'hsl(var(--success) / 0.05)' : 'hsl(var(--muted) / 0.5)',
border: `1px solid ${task.done ? 'hsl(var(--success) / 0.15)' : 'transparent'}`,
                                cursor: 'pointer', transition: 'all 150ms', opacity: task.done ? 0.65 : 1,
                            }}>
                            <div style={{ paddingTop: 2, flexShrink: 0 }}>
                                {task.done
? <CheckCircle2 size={18} style={{ color: 'hsl(var(--success))' }} />
: <Circle size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColors[task.category as CalendarioTask['category']], flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'hsl(var(--foreground))', textDecoration: task.done ? 'line-through' : 'none' }}>
                                        {task.title}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.68rem', color: 'hsl(var(--muted-foreground))' }}>Semana {task.week}</span>
                                    <span style={{ fontSize: '0.68rem', color: categoryColors[task.category as CalendarioTask['category']] }}>
                                        {categoryLabels[task.category as CalendarioTask['category']]}
                                    </span>
                                    {task.colmena && <span style={{ fontSize: '0.68rem', color: 'hsl(var(--muted-foreground))' }}>· {task.colmena}</span>}
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
