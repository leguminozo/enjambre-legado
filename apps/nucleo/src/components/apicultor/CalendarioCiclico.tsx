'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, Circle, Filter, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { fromLoose } from '@/api/lib/supabase-loose';
import type { CalendarioTaskRow } from '@/lib/apicultor-types';

// colmena_id aún no está en el typegen (mig 20260822010000).
type TareaConCruce = CalendarioTaskRow & { colmena_id?: string | null };

const categoryColors: Record<CalendarioTaskRow['category'], string> = {
inspeccion: 'hsl(var(--primary))', cosecha: 'hsl(var(--accent))',
tratamiento: 'hsl(var(--destructive))', reforestacion: 'hsl(var(--success))',
transhumancia: 'hsl(var(--info))', cera: 'hsl(var(--muted-foreground))',
};
const categoryLabels: Record<CalendarioTaskRow['category'], string> = {
    inspeccion: '🔍 Inspección', cosecha: '🍯 Recolección',
    tratamiento: '⚕️ Tratamiento', reforestacion: '🌱 Reforestación',
    transhumancia: '🚛 Transhumancia', cera: '🕯️ Cera',
};
const priorityBadge = (p: string | null) =>
    p === 'alta' ? 'badge-danger' : p === 'media' ? 'badge-gold' : 'badge-warning';

export function CalendarioCiclico() {
    const [tasks, setTasks] = useState<TareaConCruce[]>([]);
    const [filterCat, setFilterCat] = useState<CalendarioTaskRow['category'] | 'all'>('all');
    const [showMonth, setShowMonth] = useState<string>('Marzo');
    const [showNewTaskForm, setShowNewTaskForm] = useState(false);
    const [newTaskForm, setNewTaskForm] = useState<Partial<CalendarioTaskRow>>({
        title: '', month: 'Marzo', week: 1, category: 'inspeccion', priority: 'media', colmena: ''
    });
    // Cruce con la herramienta operativa: la tarea puede anclarse a una colmena
    // real (calendario_tasks.colmena_id, mig 20260822010000).
    const [misColmenas, setMisColmenas] = useState<{ id: string; label: string }[]>([]);
    const [formColmenaId, setFormColmenaId] = useState('');
    const apiFetch = useApiFetch();
    // A6/A8: cierre de tarea con registro real asociado.
    const [cierreTarea, setCierreTarea] = useState<TareaConCruce | null>(null);
    const [cerrando, setCerrando] = useState(false);
    const [cierreForm, setCierreForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        principio_activo: '',
        especie: '',
        cantidad: '10',
        sector: '',
    });
    const months = ['Marzo', 'Abril', 'Mayo', 'Agosto', 'Septiembre'];
    // Meses fuera de temporada con tareas (ej. resguardo post-aplicación de
    // alertas en cualquier mes) deben ser visibles, no solo los canónicos.
    const mesesConTareas = Array.from(new Set(tasks.map((t) => t.month).filter(Boolean))) as string[];
    const monthsVisible = Array.from(new Set([...months, ...mesesConTareas]));

    useEffect(() => {
        async function loadColmenas() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('colmenas')
                .select('id, name, apiarios(name)')
                .eq('user_id', user.id)
                .order('name');
            const list = ((data ?? []) as Array<{ id: string; name: string | null; apiarios: { name: string | null } | null }>)
                .map((c) => ({
                    id: c.id,
                    label: `${c.name || 'Colmena'}${c.apiarios?.name ? ` — ${c.apiarios.name}` : ''}`,
                }));
            setMisColmenas(list);
        }
        void loadColmenas();
    }, []);

    useEffect(() => {
        async function loadTasks() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase.from('calendario_tasks')
                .select('*')
                .eq('user_id', user.id)
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

        // A6/A8: completar una tarea planificada abre su registro real
        // (inspección / tratamiento / plantación) en vez de solo tildar.
        if (
            !t.done &&
            ['inspeccion', 'tratamiento', 'reforestacion'].includes(String(t.category))
        ) {
            if (
                (String(t.category) === 'inspeccion' || String(t.category) === 'tratamiento') &&
                !t.colmena_id
            ) {
                await marcarDone(t);
                return;
            }
            setCierreTarea(t);
            return;
        }

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

    const marcarDone = async (t: CalendarioTaskRow) => {
        setTasks(prev => prev.map(task => task.id === t.id ? { ...task, done: true } : task));
        if (!String(t.id).includes('tmp')) {
            await fromLoose(supabase, 'calendario_tasks').update({ done: true }).eq('id', t.id);
        }
    };

    const confirmarCierre = async () => {
        const t = cierreTarea;
        if (!t) return;
        setCerrando(true);
        try {
            const categoria = String(t.category);
            if (categoria === 'inspeccion' && t.colmena_id) {
                const { data: { user } } = await supabase.auth.getUser();
                const { error } = await supabase.from('inspecciones').insert({
                    colmena_id: t.colmena_id,
                    date: cierreForm.fecha,
                    inspector: 'Apicultor',
                    notes: `Tarea programada completada: ${t.title}`,
                    user_id: user?.id ?? null,
                });
                if (error) throw error;
            } else if (categoria === 'tratamiento' && t.colmena_id) {
                const res = await apiFetch('/api/bitacora/tratamientos', {
                    method: 'POST',
                    body: JSON.stringify({
                        colmena_id: t.colmena_id,
                        fecha: cierreForm.fecha,
                        principio_activo: cierreForm.principio_activo.trim(),
                        enfermedad: 'varroa',
                    }),
                });
                if (!res.ok) throw new Error('No se pudo registrar el tratamiento');
            } else if (categoria === 'reforestacion') {
                const res = await apiFetch('/api/produccion/arboles', {
                    method: 'POST',
                    body: JSON.stringify({
                        especie: cierreForm.especie.trim(),
                        cantidad: parseInt(cierreForm.cantidad) || 1,
                        sector: cierreForm.sector.trim() || undefined,
                        fecha: cierreForm.fecha,
                    }),
                });
                if (!res.ok) throw new Error('No se pudo registrar la plantación');
            }
            await marcarDone(t);
            setCierreTarea(null);
        } catch (e) {
            console.error('Error cerrando tarea', e);
        } finally {
            setCerrando(false);
        }
    };

    const handleAddTask = async () => {
        if (!newTaskForm.title) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await fromLoose(supabase, 'calendario_tasks').insert({
                    user_id: user.id,
                    title: newTaskForm.title,
                    month: newTaskForm.month,
                    week: newTaskForm.week,
                    category: newTaskForm.category,
                    priority: newTaskForm.priority,
                    colmena: newTaskForm.colmena || null,
                    colmena_id: formColmenaId || null,
                    done: false
                }).select().single();

                if (data) {
                    setTasks(prev => [(data as unknown as CalendarioTaskRow), ...prev]);
                }
            }
        } catch (e) {
            console.error("Error creating task", e);
        }

        setShowNewTaskForm(false);
        setFormColmenaId('');
        setNewTaskForm({ title: '', month: showMonth, week: 1, category: 'inspeccion', priority: 'media', colmena: '' });
    };

    const categories = ['all', 'inspeccion', 'cosecha', 'tratamiento', 'reforestacion', 'transhumancia', 'cera'] as const;

    const filtered = tasks.filter(t =>
        t.month === showMonth && (filterCat === 'all' || t.category === filterCat)
    );
    const doneCount = filtered.filter(t => t.done).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

            {/* Calendario de tareas */}
            <div className="card">
                <div className="section-header">
                    <div>
                        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CalendarDays size={18} /> Ciclo del Año
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
                            <input autoFocus type="text" placeholder="Título de la tarea..." className="input-field w-full" value={newTaskForm.title || ''} onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                            <select className="input-field w-full" value={newTaskForm.month || ''} onChange={e => setNewTaskForm({ ...newTaskForm, month: e.target.value })}>
                                {monthsVisible.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select className="input-field w-full" value={newTaskForm.week || ''} onChange={e => setNewTaskForm({ ...newTaskForm, week: parseInt(e.target.value) })}>
                                {[1, 2, 3, 4].map(w => <option key={w} value={w}>Semana {w}</option>)}
                            </select>
                            <select className="input-field w-full" value={newTaskForm.category || ''} onChange={e => setNewTaskForm({ ...newTaskForm, category: e.target.value as CalendarioTaskRow['category'] })}>
                                <option value="inspeccion">Inspección</option>
                                <option value="tratamiento">Tratamiento</option>
                                <option value="cosecha">Recolección</option>
                                <option value="transhumancia">Transhumancia</option>
                                <option value="reforestacion">Reforestación</option>
                                <option value="cera">Cera</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            <select className="input-field w-full" value={newTaskForm.priority || ''} onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value as CalendarioTaskRow['priority'] })}>
                                <option value="baja">Prioridad Baja</option>
                                <option value="media">Prioridad Media</option>
                                <option value="alta">Prioridad Alta</option>
                            </select>
                            <select
                                className="input-field w-full"
                                value={formColmenaId}
                                aria-label="Colmena (opcional)"
                                onChange={e => {
                                    const id = e.target.value;
                                    setFormColmenaId(id);
                                    const hive = misColmenas.find(h => h.id === id);
                                    setNewTaskForm({ ...newTaskForm, colmena: hive ? hive.label : '' });
                                }}
                            >
                                <option value="">Apiario/Colmena opcional</option>
                                {misColmenas.map(h => (
                                    <option key={h.id} value={h.id}>{h.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary btn-sm" onClick={handleAddTask}>Programar</button>
                        </div>
                    </div>
                )}

                {/* Month tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                    {monthsVisible.map(m => (
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
                            {c === 'all' ? 'Todas' : categoryLabels[c as CalendarioTaskRow['category']]}
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
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColors[task.category as CalendarioTaskRow['category']], flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'hsl(var(--foreground))', textDecoration: task.done ? 'line-through' : 'none' }}>
                                        {task.title}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.68rem', color: 'hsl(var(--muted-foreground))' }}>Semana {task.week}</span>
                                    <span style={{ fontSize: '0.68rem', color: categoryColors[task.category as CalendarioTaskRow['category']] }}>
                                        {categoryLabels[task.category as CalendarioTaskRow['category']]}
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
                {cierreTarea && (
                    <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--accent) / 0.3)', position: 'relative' }}>
                        <button onClick={() => setCierreTarea(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}><X size={16} /></button>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
                            Completar y registrar: {cierreTarea.title}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                            <input type="date" className="input-field w-full" value={cierreForm.fecha} onChange={e => setCierreForm({ ...cierreForm, fecha: e.target.value })} />
                            {String(cierreTarea.category) === 'tratamiento' && (
                                <input className="input-field w-full" placeholder="Principio activo (ej. timol)" value={cierreForm.principio_activo} onChange={e => setCierreForm({ ...cierreForm, principio_activo: e.target.value })} />
                            )}
                            {String(cierreTarea.category) === 'reforestacion' && (
                                <>
                                    <input className="input-field w-full" placeholder="Especie (ej. ulmo)" value={cierreForm.especie} onChange={e => setCierreForm({ ...cierreForm, especie: e.target.value })} />
                                    <input type="number" min="1" className="input-field w-full" placeholder="Cantidad" value={cierreForm.cantidad} onChange={e => setCierreForm({ ...cierreForm, cantidad: e.target.value })} />
                                    <input className="input-field w-full" placeholder="Sector (opcional)" value={cierreForm.sector} onChange={e => setCierreForm({ ...cierreForm, sector: e.target.value })} />
                                </>
                            )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>
                            Se registrará en la bitácora de la colmena vinculada antes de marcar la tarea como hecha.
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setCierreTarea(null)}>Cancelar</button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => void confirmarCierre()}
                                disabled={
                                    cerrando ||
                                    (String(cierreTarea.category) === 'tratamiento' && cierreForm.principio_activo.trim().length < 1) ||
                                    (String(cierreTarea.category) === 'reforestacion' && cierreForm.especie.trim().length < 2)
                                }
                            >
                                {cerrando ? 'Registrando…' : 'Registrar y completar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
