'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  TrendingUp,
  Target,
  Calendar,
  Plus,
  Loader2,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  GripVertical,
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast } from '@enjambre/ui';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ViewShell } from '@/components/layout/ViewShell';

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

export function PipelineView() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [selectedEtapa, setSelectedEtapa] = useState<string>('all');
  const [showNewLead, setShowNewLead] = useState(false);
  const [showNewTarea, setShowNewTarea] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<{ data: PipelineDashboard }>({
    queryKey: ['pipeline', 'dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/pipeline/dashboard');
      if (!res.ok) throw new Error('Failed to fetch pipeline');
      return res.json();
    },
    staleTime: 30_000,
  });

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !result.source) return;

    const leadId = result.draggableId;
    const nuevaEtapa = result.destination.droppableId;

    if (result.source.droppableId !== nuevaEtapa) {
      moveLeadMutation.mutate({ leadId, nuevaEtapa });
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Ventas"
        title="Pipeline de Ventas"
        subtitle="Gestión de leads, oportunidades y tareas de seguimiento"
      />

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
        <div className="section-header">
          <div>
            <div className="section-title">Pipeline por Etapa</div>
            <div className="section-subtitle">Arrastra leads entre etapas para actualizar</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewLead(true)}>
            <Plus size={14} className="mr-1" />
            Nuevo Lead
          </button>
        </div>

        <div className="filter-chips-scroll mb-6">
          <button
            onClick={() => setSelectedEtapa('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedEtapa === 'all'
                ? 'bg-accent text-accent-foreground'
                : 'bg-surface-sunken border border-border text-muted-foreground hover:border-accent/50'
            }`}
          >
            Todas ({stats?.totalLeads ?? 0})
          </button>
          {ETAPAS_PIPELINE.map((etapa) => (
            <button
              key={etapa.key}
              onClick={() => setSelectedEtapa(etapa.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedEtapa === etapa.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'bg-surface-sunken border-border text-muted-foreground hover:border-accent/50'
              }`}
            >
              {etapa.label} ({stats?.byEtapa[etapa.key] ?? 0})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        ) : filteredLeads.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={selectedEtapa === 'all' ? 'all' : selectedEtapa}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {filteredLeads.map((lead, index) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 rounded-xl bg-surface-sunken border border-border hover:border-accent/30 transition-colors ${
                            snapshot.isDragging ? 'shadow-lg border-accent' : ''
                          }`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground">
                            <GripVertical size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-foreground truncate">{lead.nombre}</div>
                              {lead.empresa && (
                                <span className="text-xs text-muted-foreground">· {lead.empresa}</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {lead.email || lead.telefono || 'Sin contacto'}
                              {lead.valor_estimado && ` · $${lead.valor_estimado.toLocaleString('es-CL')}`}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-muted-foreground mb-1">Probabilidad</div>
                            <div className="text-sm font-medium text-foreground">{lead.probabilidad_cierre}%</div>
                          </div>
                          <div className="shrink-0">
                            <select
                              value={lead.etapa_pipeline}
                              onChange={(e) => moveLeadMutation.mutate({ leadId: lead.id, nuevaEtapa: e.target.value })}
                              className="text-xs bg-surface border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                              disabled={moveLeadMutation.isPending}
                            >
                              {ETAPAS_PIPELINE.map((etapa) => (
                                <option key={etapa.key} value={etapa.key}>
                                  {etapa.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            Sin leads en esta etapa
          </div>
        )}
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
    </div>
  );
}
