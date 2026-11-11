'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Filter,
  Plus,
  X,
  Search,
  Droplets,
  ShieldAlert,
  TreePine,
  Truck,
  Check,
  Calendar,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { fromLoose } from '@/api/lib/supabase-loose';
import type { CalendarioTaskRow } from '@/lib/apicultor-types';
import { cn } from '@/lib/cn';

// colmena_id aún no está en el typegen (mig 20260822010000).
type TareaConCruce = CalendarioTaskRow & { colmena_id?: string | null };

const CATEGORY_META: Record<
  CalendarioTaskRow['category'],
  { label: string; icon: typeof Search; dotColor: string }
> = {
  inspeccion: {
    label: 'Inspección Sanitaria',
    icon: Search,
    dotColor: 'bg-primary',
  },
  cosecha: {
    label: 'Recolección Estacional',
    icon: Droplets,
    dotColor: 'bg-accent',
  },
  tratamiento: {
    label: 'Tratamiento / Resguardo',
    icon: ShieldAlert,
    dotColor: 'bg-destructive',
  },
  reforestacion: {
    label: 'Reforestación Melífera',
    icon: TreePine,
    dotColor: 'bg-emerald-500',
  },
  transhumancia: {
    label: 'Trashumancia',
    icon: Truck,
    dotColor: 'bg-sky-500',
  },
  cera: {
    label: 'Cera y Material',
    icon: Layers,
    dotColor: 'bg-amber-400',
  },
};

const ALL_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const ESTACIONES = [
  { nombre: 'Primavera', meses: ['Septiembre', 'Octubre', 'Noviembre'], descripcion: 'Despertar del colmenar, postura y primeras mieladas' },
  { nombre: 'Verano', meses: ['Diciembre', 'Enero', 'Febrero'], descripcion: 'Floración del Ulmo, pecoreo pleno y recolección' },
  { nombre: 'Otoño', meses: ['Marzo', 'Abril', 'Mayo'], descripcion: 'Tratamientos sanitarios y preparación de invernada' },
  { nombre: 'Invierno', meses: ['Junio', 'Julio', 'Agosto'], descripcion: 'Receso del enjambre, fundición de cera y mantención' },
];

export function CalendarioCiclico() {
  const [tasks, setTasks] = useState<TareaConCruce[]>([]);
  const [filterCat, setFilterCat] = useState<CalendarioTaskRow['category'] | 'all'>('all');

  // Mes actual del sistema
  const mesActualIndex = new Date().getMonth();
  const mesActualNombre = ALL_MONTHS[mesActualIndex] ?? 'Noviembre';

  const [showMonth, setShowMonth] = useState<string>(mesActualNombre);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<Partial<CalendarioTaskRow>>({
    title: '',
    month: mesActualNombre,
    week: 1,
    category: 'inspeccion',
    priority: 'media',
    colmena: '',
  });

  const [misColmenas, setMisColmenas] = useState<{ id: string; label: string }[]>([]);
  const [formColmenaId, setFormColmenaId] = useState('');
  const apiFetch = useApiFetch();

  const [cierreTarea, setCierreTarea] = useState<TareaConCruce | null>(null);
  const [cerrando, setCerrando] = useState(false);
  const [cierreForm, setCierreForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    principio_activo: '',
    especie: '',
    cantidad: '10',
    sector: '',
  });

  useEffect(() => {
    async function loadColmenas() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('colmenas')
        .select('id, name, apiarios(name)')
        .eq('user_id', user.id)
        .order('name');
      const list = ((data ?? []) as Array<{ id: string; name: string | null; apiarios: { name: string | null } | null }>).map(
        (c) => ({
          id: c.id,
          label: `${c.name || 'Colmena'}${c.apiarios?.name ? ` — ${c.apiarios.name}` : ''}`,
        }),
      );
      setMisColmenas(list);
    }
    void loadColmenas();
  }, []);

  useEffect(() => {
    async function loadTasks() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('calendario_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    }
    void loadTasks();
  }, []);

  const toggle = async (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;

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

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );

    try {
      if (!id.includes('tmp') && typeof id !== 'number') {
        await supabase.from('calendario_tasks').update({ done: !t.done }).eq('id', id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const marcarDone = async (t: CalendarioTaskRow) => {
    setTasks((prev) => prev.map((task) => (task.id === t.id ? { ...task, done: true } : task)));
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

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.title?.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await fromLoose(supabase, 'calendario_tasks')
          .insert({
            user_id: user.id,
            title: newTaskForm.title.trim(),
            month: newTaskForm.month || showMonth,
            week: newTaskForm.week || 1,
            category: newTaskForm.category || 'inspeccion',
            priority: newTaskForm.priority || 'media',
            colmena: newTaskForm.colmena || null,
            colmena_id: formColmenaId || null,
            done: false,
          })
          .select()
          .single();

        if (data) {
          setTasks((prev) => [(data as unknown as CalendarioTaskRow), ...prev]);
        }
      }
    } catch (e) {
      console.error('Error creating task', e);
    }

    setShowNewTaskForm(false);
    setFormColmenaId('');
    setNewTaskForm({
      title: '',
      month: showMonth,
      week: 1,
      category: 'inspeccion',
      priority: 'media',
      colmena: '',
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.month === showMonth && (filterCat === 'all' || t.category === filterCat),
    );
  }, [tasks, showMonth, filterCat]);

  const doneCount = filteredTasks.filter((t) => t.done).length;

  // Contador de tareas por mes para mostrar en los botones
  const taskCountPerMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.month) {
        map[t.month] = (map[t.month] ?? 0) + 1;
      }
    }
    return map;
  }, [tasks]);

  const estacionActual = useMemo(() => {
    return ESTACIONES.find((e) => e.meses.includes(showMonth)) ?? ESTACIONES[0];
  }, [showMonth]);

  const categories = ['all', 'inspeccion', 'cosecha', 'tratamiento', 'reforestacion', 'transhumancia', 'cera'] as const;

  return (
    <div className="space-y-6">
      {/* ── Header de Temporada y Métricas ── */}
      <section className="rounded-3xl border border-border/80 bg-card/60 p-6 shadow-sm backdrop-blur-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                Ciclo Anual de Chiloé
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Planificador Estacional del Apiario
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              {estacionActual?.nombre}: {estacionActual?.descripcion}. Organiza las labores apícolas por semanas del ciclo nativo.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-2.5 text-center">
              <span className="block text-lg font-bold font-display text-foreground">
                {doneCount} / {filteredTasks.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Tareas listas
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewTaskForm((prev) => ({ ...prev, month: showMonth }));
                setShowNewTaskForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-md transition hover:brightness-110 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Programar Tarea</span>
            </button>
          </div>
        </div>

        {/* ── Navegación Estacional de Meses ── */}
        <div className="mt-6 border-t border-border/60 pt-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {ALL_MONTHS.map((m) => {
              const count = taskCountPerMonth[m] ?? 0;
              const isSelected = showMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setShowMonth(m)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-2xl py-2 px-1 text-center transition-all border',
                    isSelected
                      ? 'border-accent bg-accent/15 text-accent font-bold shadow-xs'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40',
                  )}
                >
                  <span className="text-xs">{m.slice(0, 3)}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                        isSelected ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Formulario Expandible para Nueva Tarea ── */}
      {showNewTaskForm && (
        <form
          onSubmit={handleAddTask}
          className="rounded-3xl border border-accent/40 bg-card/90 p-6 shadow-xl backdrop-blur-md animate-in fade-in duration-200 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent animate-ping" />
              <h3 className="font-display text-lg font-bold text-foreground">
                Nueva Tarea Estacional ({newTaskForm.month || showMonth})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowNewTaskForm(false)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Título de la tarea apícola *
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Ej: Cambio de pisos sanitarios, Monitoreo de Varroa en Apiario Norte..."
              className="w-full rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-accent"
              value={newTaskForm.title || ''}
              onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mes del ciclo
              </label>
              <select
                className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                value={newTaskForm.month || showMonth}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, month: e.target.value })}
              >
                {ALL_MONTHS.map((m) => (
                  <option key={m} value={m} className="bg-card text-foreground">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Semana
              </label>
              <select
                className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                value={newTaskForm.week || 1}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, week: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4].map((w) => (
                  <option key={w} value={w} className="bg-card text-foreground">
                    Semana {w}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Labor / Categoría
              </label>
              <select
                className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                value={newTaskForm.category || 'inspeccion'}
                onChange={(e) =>
                  setNewTaskForm({
                    ...newTaskForm,
                    category: e.target.value as CalendarioTaskRow['category'],
                  })
                }
              >
                <option value="inspeccion">Inspección Sanitaria</option>
                <option value="cosecha">Recolección Estacional</option>
                <option value="tratamiento">Tratamiento / Resguardo</option>
                <option value="reforestacion">Reforestación Melífera</option>
                <option value="transhumancia">Trashumancia</option>
                <option value="cera">Cera y Material</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nivel de prioridad
              </label>
              <select
                className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                value={newTaskForm.priority || 'media'}
                onChange={(e) =>
                  setNewTaskForm({
                    ...newTaskForm,
                    priority: e.target.value as CalendarioTaskRow['priority'],
                  })
                }
              >
                <option value="baja">Prioridad Normal</option>
                <option value="media">Prioridad Media</option>
                <option value="alta">Prioridad Crítica / Urgente</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Colmena o Apiario vinculado (opcional)
              </label>
              <select
                className="w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                value={formColmenaId}
                onChange={(e) => {
                  const id = e.target.value;
                  setFormColmenaId(id);
                  const hive = misColmenas.find((h) => h.id === id);
                  setNewTaskForm({ ...newTaskForm, colmena: hive ? hive.label : '' });
                }}
              >
                <option value="">Todo el apiario / Sin colmena específica</option>
                {misColmenas.map((h) => (
                  <option key={h.id} value={h.id} className="bg-card text-foreground">
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowNewTaskForm(false)}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!newTaskForm.title?.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-md hover:brightness-110 disabled:opacity-40 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Programar en {newTaskForm.month || showMonth}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Filtros por Categoría de Labor ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" />
          <span>Labores:</span>
        </span>
        {categories.map((c) => {
          const isSelected = filterCat === c;
          const meta = c === 'all' ? null : CATEGORY_META[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFilterCat(c)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border',
                isSelected
                  ? 'border-accent bg-accent/15 text-accent font-semibold shadow-xs'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              {meta && <span className={cn('h-2 w-2 rounded-full', meta.dotColor)} />}
              <span>{c === 'all' ? 'Todas' : meta?.label ?? c}</span>
            </button>
          );
        })}
      </div>

      {/* ── Lista de Tareas del Mes ── */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-card/40 p-10 text-center space-y-3">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold text-foreground">
              Sin tareas programadas para {showMonth}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Planifica las revisiones del colmenar, postura de alzas melarias o tratamientos sanitarios para esta etapa estacional.
            </p>
            <button
              type="button"
              onClick={() => {
                setNewTaskForm((prev) => ({ ...prev, month: showMonth }));
                setShowNewTaskForm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Programar tarea en {showMonth}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filteredTasks.map((task) => {
              const meta = CATEGORY_META[task.category as CalendarioTaskRow['category']] ?? {
                label: task.category,
                icon: Layers,
                dotColor: 'bg-muted-foreground',
              };
              const IconComp = meta.icon;
              return (
                <div
                  key={task.id}
                  onClick={() => toggle(task.id)}
                  className={cn(
                    'group relative flex items-start gap-3.5 rounded-2xl border p-4 cursor-pointer transition-all',
                    task.done
                      ? 'border-border/40 bg-muted/20 opacity-60'
                      : 'border-border/80 bg-card/70 hover:border-accent/40 hover:bg-card/90 shadow-xs',
                  )}
                >
                  <div className="pt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent">
                    {task.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full shrink-0', meta.dotColor)} />
                      <h4
                        className={cn(
                          'text-sm font-semibold text-foreground truncate',
                          task.done && 'line-through text-muted-foreground',
                        )}
                      >
                        {task.title}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded-md bg-muted/40 px-2 py-0.5 font-medium">
                        Semana {task.week}
                      </span>
                      <span className="flex items-center gap-1 text-foreground/80">
                        <IconComp className="h-3 w-3" />
                        <span>{meta.label}</span>
                      </span>
                      {task.colmena && (
                        <span className="text-muted-foreground truncate">
                          · {task.colmena}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0',
                      task.priority === 'alta'
                        ? 'bg-destructive/15 text-destructive border border-destructive/30'
                        : task.priority === 'media'
                          ? 'bg-accent/15 text-accent border border-accent/30'
                          : 'bg-muted/60 text-muted-foreground border border-border',
                    )}
                  >
                    {task.priority === 'alta' ? 'Crítica' : task.priority === 'media' ? 'Media' : 'Normal'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Cierre de Tarea con Registro Real ── */}
        {cierreTarea && (
          <div className="rounded-3xl border border-accent/40 bg-card/95 p-6 shadow-xl backdrop-blur-md space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-accent" />
                <h4 className="font-display text-base font-bold text-foreground">
                  Completar y Registrar en Bitácora: {cierreTarea.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setCierreTarea(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Fecha de ejecución
                </label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                  value={cierreForm.fecha}
                  onChange={(e) => setCierreForm({ ...cierreForm, fecha: e.target.value })}
                />
              </div>

              {String(cierreTarea.category) === 'tratamiento' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Principio activo aplicado
                  </label>
                  <input
                    className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                    placeholder="Ej. Timol, Ácido Oxálico..."
                    value={cierreForm.principio_activo}
                    onChange={(e) => setCierreForm({ ...cierreForm, principio_activo: e.target.value })}
                  />
                </div>
              )}

              {String(cierreTarea.category) === 'reforestacion' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Especie nativa
                    </label>
                    <input
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                      placeholder="Ej. Ulmo, Tiaca, Avellano..."
                      value={cierreForm.especie}
                      onChange={(e) => setCierreForm({ ...cierreForm, especie: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Cantidad de árboles
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                      value={cierreForm.cantidad}
                      onChange={(e) => setCierreForm({ ...cierreForm, cantidad: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Esta labor se vinculará a la bitácora sanitaria o ambiental del apiario antes de marcarse como cumplida.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
                onClick={() => setCierreTarea(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-md hover:brightness-110 disabled:opacity-40 transition-all"
                onClick={() => void confirmarCierre()}
                disabled={
                  cerrando ||
                  (String(cierreTarea.category) === 'tratamiento' &&
                    cierreForm.principio_activo.trim().length < 1) ||
                  (String(cierreTarea.category) === 'reforestacion' &&
                    cierreForm.especie.trim().length < 2)
                }
              >
                <Check className="h-4 w-4" />
                <span>{cerrando ? 'Registrando…' : 'Registrar y Completar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
