'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Target,
  Calendar,
  Plus,
  Loader2,
  GripVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, ImmersiveModal, DatePicker } from '@enjambre/ui';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ViewShell } from '@/components/layout/ViewShell';
import { ToolActionRail } from '@/components/layout/ToolActionRail';

type Lead = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  origen: string;
  estado: string;
  etapa_pipeline: string;
  valor_estimado: number | null;
  probabilidad_cierre: number | null;
  fecha_cierre_estimada: string | null;
  notas: string | null;
  created_at: string;
};

type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  fecha_vencimiento: string;
  prioridad: string;
  estado: string;
  lead_id: string | null;
};

type PipelineDashboard = {
  leads: Lead[];
  tareas: Tarea[];
  stats: {
    totalLeads: number;
    byEtapa: Record<string, number>;
    valorTotalPipeline: number;
    tareasVencidas: number;
    tareasPendientes: number;
  };
};

const ETAPAS_PIPELINE = [
  { key: 'prospecto', label: 'Prospecto', color: 'bg-surface-sunken' },
  { key: 'cualificado', label: 'Cualificado', color: 'bg-info/15' },
  { key: 'reunion_agendada', label: 'Reunión Agendada', color: 'bg-warning/15' },
  { key: 'propuesta_enviada', label: 'Propuesta Enviada', color: 'bg-accent/15' },
  { key: 'negociacion', label: 'Negociación', color: 'bg-primary/15' },
  { key: 'cerrado', label: 'Cerrado', color: 'bg-success/15' },
] as const;

const PRIORIDAD_CONFIG = {
  baja: { color: 'bg-surface-sunken text-muted-foreground' },
  media: { color: 'bg-warning/15 text-warning' },
  alta: { color: 'bg-destructive/15 text-destructive' },
  urgente: { color: 'bg-destructive text-destructive-foreground' },
} as const;

const ORIGEN_OPTIONS = ['web', 'feria', 'referido', 'redes', 'directo', 'otro'] as const;
const TAREA_TIPOS = ['llamada', 'email', 'reunion', 'visita', 'otro'] as const;

const defaultLeadForm = {
  nombre: '',
  email: '',
  telefono: '',
  empresa: '',
  origen: 'directo' as (typeof ORIGEN_OPTIONS)[number],
  etapa_pipeline: 'prospecto' as (typeof ETAPAS_PIPELINE)[number]['key'],
  valor_estimado: '',
  probabilidad_cierre: '10',
  notas: '',
};

const defaultTareaForm = {
  titulo: '',
  descripcion: '',
  tipo: 'otro' as (typeof TAREA_TIPOS)[number],
  fecha_vencimiento: new Date().toISOString().split('T')[0],
  prioridad: 'media' as 'baja' | 'media' | 'alta' | 'urgente',
  lead_id: '',
};

export function PipelineView() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [selectedEtapa, setSelectedEtapa] = useState<string>('all');
  const [showNewLead, setShowNewLead] = useState(false);
  const [showNewTarea, setShowNewTarea] = useState(false);
  const [leadForm, setLeadForm] = useState(defaultLeadForm);
  const [tareaForm, setTareaForm] = useState(defaultTareaForm);

  const { data, isLoading } = useQuery<{ data: PipelineDashboard }>({
    queryKey: ['pipeline', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/pipeline/dashboard');
      if (!res.ok) throw new Error('Failed to fetch pipeline');
      return res.json();
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('pipeline_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pipeline', 'dashboard'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tareas' }, () => {
        queryClient.invalidateQueries({ queryKey: ['pipeline', 'dashboard'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const dashboard = data?.data;
  const stats = dashboard?.stats;

  const filteredLeads =
    selectedEtapa === 'all'
      ? dashboard?.leads ?? []
      : dashboard?.leads.filter((l) => l.etapa_pipeline === selectedEtapa) ?? [];

  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, nuevaEtapa }: { leadId: string; nuevaEtapa: string }) => {
      const res = await apiFetch(`/api/pipeline/leads/${leadId}/mover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nueva_etapa: nuevaEtapa }),
      });
      if (!res.ok) throw new Error('Failed to move lead');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', 'dashboard'] });
      toast('Lead movido exitosamente', { type: 'success' });
    },
    onError: (error) => {
      toast('Error al mover lead: ' + (error instanceof Error ? error.message : 'Unknown error'), { type: 'error' });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/pipeline/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: leadForm.nombre.trim(),
          email: leadForm.email.trim() || undefined,
          telefono: leadForm.telefono.trim() || undefined,
          empresa: leadForm.empresa.trim() || undefined,
          origen: leadForm.origen,
          etapa_pipeline: leadForm.etapa_pipeline,
          valor_estimado: leadForm.valor_estimado ? Number(leadForm.valor_estimado) : undefined,
          probabilidad_cierre: leadForm.probabilidad_cierre ? Number(leadForm.probabilidad_cierre) : undefined,
          notas: leadForm.notas.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al crear lead');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', 'dashboard'] });
      toast('Lead creado', { type: 'success' });
      setShowNewLead(false);
      setLeadForm(defaultLeadForm);
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : 'Error al crear lead', { type: 'error' });
    },
  });

  const createTareaMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/pipeline/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: tareaForm.titulo.trim(),
          descripcion: tareaForm.descripcion.trim() || undefined,
          tipo: tareaForm.tipo,
          fecha_vencimiento: tareaForm.fecha_vencimiento,
          prioridad: tareaForm.prioridad,
          lead_id: tareaForm.lead_id || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al crear tarea');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', 'dashboard'] });
      toast('Tarea creada', { type: 'success' });
      setShowNewTarea(false);
      setTareaForm(defaultTareaForm);
    },
    onError: (error) => {
      toast(error instanceof Error ? error.message : 'Error al crear tarea', { type: 'error' });
    },
  });

  const completeTareaMutation = useMutation({
    mutationFn: async (tareaId: string) => {
      const res = await apiFetch(`/api/pipeline/tareas/${tareaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'completada' }),
      });
      if (!res.ok) throw new Error('Error al completar tarea');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', 'dashboard'] });
      toast('Tarea completada', { type: 'success' });
    },
    onError: () => toast('No se pudo completar la tarea', { type: 'error' }),
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !result.source) return;

    const leadId = result.draggableId;
    const nuevaEtapa = result.destination.droppableId;

    if (result.source.droppableId !== nuevaEtapa) {
      moveLeadMutation.mutate({ leadId, nuevaEtapa });
    }
  };

  const pendingTareas = dashboard?.tareas.filter((t) => t.estado === 'pendiente') ?? [];

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Ventas"
        title="Pipeline de Ventas"
        subtitle="Gestión de leads, oportunidades y tareas de seguimiento"
      />
      <ToolActionRail context="pipeline" current="/pipeline" />

      {stats && (
        <div className="stats-grid">
          {[
            { icon: <Users size={20} />, val: String(stats.totalLeads), label: 'Total Leads' },
            { icon: <Target size={20} />, val: `$${stats.valorTotalPipeline.toLocaleString('es-CL')}`, label: 'Valor Pipeline' },
            { icon: <Clock size={20} />, val: String(stats.tareasVencidas), label: 'Tareas Vencidas', accent: stats.tareasVencidas > 0 },
            { icon: <CheckCircle2 size={20} />, val: String(stats.tareasPendientes), label: 'Tareas Pendientes' },
          ].map((s, i) => (
            <div key={i} className={`stat-card animate-in delay-${i + 1}`}>
              <div className="stat-header">
                <div className="stat-icon">{s.icon}</div>
              </div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="section-header border-b border-border pb-4">
          <div>
            <div className="section-title">Kanban de Ventas</div>
            <div className="section-subtitle">Gestiona tus leads a través del embudo comercial</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewLead(true)}>
            <Plus size={14} className="mr-1" />
            Nuevo Lead
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin mt-4">
              {ETAPAS_PIPELINE.map((etapa) => {
                const leadsInEtapa = dashboard?.leads.filter((l) => l.etapa_pipeline === etapa.key) ?? [];
                
                return (
                  <div key={etapa.key} className="w-[85vw] sm:w-[320px] shrink-0 snap-center flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="font-semibold text-sm text-foreground">{etapa.label}</span>
                      <span className="text-xs bg-surface-sunken/80 px-2 py-0.5 rounded-full border border-border">
                        {leadsInEtapa.length}
                      </span>
                    </div>
                    <Droppable droppableId={etapa.key}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 rounded-xl p-2 overflow-y-auto transition-colors ${
                            snapshot.isDraggingOver
                              ? 'bg-accent/10 border border-dashed border-accent/40'
                              : 'bg-surface-sunken/40 border border-border/50'
                          }`}
                        >
                          <div className="space-y-3 min-h-full">
                            {leadsInEtapa.map((lead, index) => (
                              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`p-4 rounded-xl bg-background border transition-all ${
                                      snapshot.isDragging
                                        ? 'shadow-xl border-accent scale-[1.02] rotate-1 z-50'
                                        : 'shadow-sm border-border hover:border-accent/40'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="font-medium text-sm text-foreground leading-tight">
                                        {lead.nombre}
                                      </div>
                                      <div className="text-[10px] font-bold px-1.5 py-0.5 bg-surface-sunken rounded text-muted-foreground shrink-0">
                                        {lead.probabilidad_cierre}%
                                      </div>
                                    </div>
                                    {lead.empresa && (
                                      <div className="text-xs text-muted-foreground mb-2">
                                        {lead.empresa}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                      <div className="text-xs font-semibold text-accent">
                                        {lead.valor_estimado != null ? `$${lead.valor_estimado.toLocaleString('es-CL')}` : '--'}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <div className="section-title">Tareas de seguimiento</div>
            <div className="section-subtitle">Llamadas, reuniones y recordatorios vinculados al pipeline</div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowNewTarea(true)}>
            <Plus size={14} className="mr-1" />
            Nueva tarea
          </button>
        </div>
        <div className="space-y-2">
          {pendingTareas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin tareas pendientes</p>
          ) : (
            pendingTareas.map((tarea) => {
              const vencida = new Date(tarea.fecha_vencimiento) < new Date();
              return (
                <div
                  key={tarea.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    vencida ? 'bg-destructive/5 border-destructive/20' : 'bg-surface-sunken border-border'
                  }`}
                >
                  {vencida ? (
                    <AlertCircle size={16} className="text-destructive shrink-0" />
                  ) : (
                    <Calendar size={16} className="text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{tarea.titulo}</div>
                    <div className="text-xs text-muted-foreground">
                      {tarea.tipo} · vence {tarea.fecha_vencimiento}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${
                      PRIORIDAD_CONFIG[tarea.prioridad as keyof typeof PRIORIDAD_CONFIG]?.color
                    }`}
                  >
                    {tarea.prioridad}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm shrink-0"
                    disabled={completeTareaMutation.isPending}
                    onClick={() => completeTareaMutation.mutate(tarea.id)}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {stats && stats.tareasVencidas > 0 && (
        <div className="card border-destructive/50">
          <div className="section-header">
            <div className="section-title text-destructive">Tareas Vencidas</div>
          </div>
          <div className="space-y-2">
            {dashboard?.tareas
              .filter((t) => t.estado === 'pendiente' && new Date(t.fecha_vencimiento) < new Date())
              .slice(0, 5)
              .map((tarea) => (
                <div
                  key={tarea.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                >
                  <AlertCircle size={16} className="text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{tarea.titulo}</div>
                    <div className="text-xs text-muted-foreground">Vencida: {tarea.fecha_vencimiento}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      PRIORIDAD_CONFIG[tarea.prioridad as keyof typeof PRIORIDAD_CONFIG]?.color
                    }`}
                  >
                    {tarea.prioridad}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <ImmersiveModal
        open={showNewLead}
        onClose={() => setShowNewLead(false)}
        eyebrow="CRM"
        title="Nuevo lead"
        size="lg"
        footer={
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowNewLead(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={createLeadMutation.isPending || !leadForm.nombre.trim()}
              onClick={() => createLeadMutation.mutate()}
            >
              {createLeadMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Crear lead'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Nombre *</label>
            <input
              className="input-field text-sm w-full"
              value={leadForm.nombre}
              onChange={(e) => setLeadForm({ ...leadForm, nombre: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Email</label>
            <input
              type="email"
              className="input-field text-sm w-full"
              value={leadForm.email}
              onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Teléfono</label>
            <input
              className="input-field text-sm w-full"
              value={leadForm.telefono}
              onChange={(e) => setLeadForm({ ...leadForm, telefono: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Empresa</label>
            <input
              className="input-field text-sm w-full"
              value={leadForm.empresa}
              onChange={(e) => setLeadForm({ ...leadForm, empresa: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Origen</label>
            <select
              className="input-field text-sm w-full"
              value={leadForm.origen}
              onChange={(e) => setLeadForm({ ...leadForm, origen: e.target.value as typeof leadForm.origen })}
            >
              {ORIGEN_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Etapa inicial</label>
            <select
              className="input-field text-sm w-full"
              value={leadForm.etapa_pipeline}
              onChange={(e) => setLeadForm({ ...leadForm, etapa_pipeline: e.target.value as typeof leadForm.etapa_pipeline })}
            >
              {ETAPAS_PIPELINE.map((e) => (
                <option key={e.key} value={e.key}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Valor estimado CLP</label>
            <input
              type="number"
              min={0}
              className="input-field text-sm w-full"
              value={leadForm.valor_estimado}
              onChange={(e) => setLeadForm({ ...leadForm, valor_estimado: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Probabilidad cierre %</label>
            <input
              type="number"
              min={0}
              max={100}
              className="input-field text-sm w-full"
              value={leadForm.probabilidad_cierre}
              onChange={(e) => setLeadForm({ ...leadForm, probabilidad_cierre: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Notas</label>
            <textarea
              className="input-field text-sm w-full min-h-[80px] resize-y"
              value={leadForm.notas}
              onChange={(e) => setLeadForm({ ...leadForm, notas: e.target.value })}
            />
          </div>
        </div>
      </ImmersiveModal>

      <ImmersiveModal
        open={showNewTarea}
        onClose={() => setShowNewTarea(false)}
        eyebrow="CRM"
        title="Nueva tarea"
        size="md"
        footer={
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowNewTarea(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={createTareaMutation.isPending || !tareaForm.titulo.trim()}
              onClick={() => createTareaMutation.mutate()}
            >
              {createTareaMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Crear tarea'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Título *</label>
            <input
              className="input-field text-sm w-full"
              value={tareaForm.titulo}
              onChange={(e) => setTareaForm({ ...tareaForm, titulo: e.target.value })}
            />
          </div>
          <div>
            <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Descripción</label>
            <textarea
              className="input-field text-sm w-full min-h-[72px] resize-y"
              value={tareaForm.descripcion}
              onChange={(e) => setTareaForm({ ...tareaForm, descripcion: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Tipo</label>
              <select
                className="input-field text-sm w-full"
                value={tareaForm.tipo}
                onChange={(e) => setTareaForm({ ...tareaForm, tipo: e.target.value as typeof tareaForm.tipo })}
              >
                {TAREA_TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Prioridad</label>
              <select
                className="input-field text-sm w-full"
                value={tareaForm.prioridad}
                onChange={(e) => setTareaForm({ ...tareaForm, prioridad: e.target.value as typeof tareaForm.prioridad })}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Vencimiento</label>
              <DatePicker
                className="w-full"
                value={tareaForm.fecha_vencimiento}
                onChange={(val) => setTareaForm({ ...tareaForm, fecha_vencimiento: val })}
              />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase text-muted-foreground tracking-wider block mb-1">Lead vinculado</label>
              <select
                className="input-field text-sm w-full"
                value={tareaForm.lead_id}
                onChange={(e) => setTareaForm({ ...tareaForm, lead_id: e.target.value })}
              >
                <option value="">Sin vincular</option>
                {(dashboard?.leads ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </ImmersiveModal>
    </div>
  );
}