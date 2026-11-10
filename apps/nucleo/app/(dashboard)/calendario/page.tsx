'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendario,
  DayTimeline,
  EventEditorSheet,
  useCalendarioSync,
  eventTypeConfig,
  type CalendarioEvent,
  type CalendarioEventType,
  type CreateCalendarioEventInput,
  resolveEventToolLink,
} from '@enjambre/calendar';
import { CalendarioCiclico } from '@/components/apicultor/CalendarioCiclico';
import { ViewShell } from '@/components/layout/ViewShell';
import { cn } from '@/lib/cn';
import { createClient } from '@enjambre/auth/browser';
import { useAuthStore } from '@enjambre/auth';
import { useEmpresaId } from '@/hooks/use-empresa-id';
import { toast, friendlyError } from '@enjambre/ui';
import { CalendarioSkeleton } from '@/components/shared/skeletons';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isValid,
} from 'date-fns';

const TYPE_FILTERS: CalendarioEventType[] = [
  'personal',
  'reunion',
  'feria',
  'apicultura',
  'marketing',
  'logistica',
  'historico',
  'inspeccion',
  'tratamiento',
  'cosecha',
  'transhumancia',
  'reforestacion',
  'alerta',
  'otro',
];

function parseType(raw: string | null): CalendarioEventType | null {
  if (!raw) return null;
  return TYPE_FILTERS.includes(raw as CalendarioEventType)
    ? (raw as CalendarioEventType)
    : null;
}

export default function CalendarioPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const profileRole = user?.role;
  const sessionRole = useAuthStore((s) => s.session?.user?.app_metadata?.role);
  const userRole = (profileRole || sessionRole || 'admin') as string;
  const userId = user?.id ?? null;
  const { empresaId } = useEmpresaId();

  const initialDate = React.useMemo(() => {
    const d = searchParams.get('date');
    if (d) {
      const parsed = parseISO(d);
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  }, [searchParams]);

  const initialSelectedDate = React.useMemo(() => {
    const d = searchParams.get('date');
    if (d) {
      const parsed = parseISO(d);
      if (isValid(parsed)) return parsed;
    }
    return null;
  }, [searchParams]);

  const typeFilter = React.useMemo(
    () => parseType(searchParams.get('type')),
    [searchParams],
  );

  const [currentDate, setCurrentDate] = React.useState(initialDate);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(initialSelectedDate);
  const [viewMode, setViewMode] = React.useState<'agenda' | 'ciclo'>('agenda');

  React.useEffect(() => {
    const d = searchParams.get('date');
    if (!d) return;
    const parsed = parseISO(d);
    if (!isValid(parsed)) return;
    setCurrentDate(parsed);
    setSelectedDate(parsed);
  }, [searchParams]);

  const viewStart = React.useMemo(
    () => startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    [currentDate],
  );
  const viewEnd = React.useMemo(
    () => endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
    [currentDate],
  );

  const {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
  } = useCalendarioSync(
    // createClient() siempre devuelve cliente en apps configuradas; cast estable para hooks
    supabase as NonNullable<typeof supabase>,
    userRole,
    viewStart,
    viewEnd,
    userId,
    empresaId,
  );

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<'create' | 'edit'>('create');
  const [editingEvent, setEditingEvent] = React.useState<CalendarioEvent | null>(
    null,
  );
  const [defaultStartsAt, setDefaultStartsAt] = React.useState<Date | undefined>();
  const [isSaving, setIsSaving] = React.useState(false);

  const pushQuery = React.useCallback(
    (patch: { date?: Date | null; type?: CalendarioEventType | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.date !== undefined) {
        if (patch.date) params.set('date', format(patch.date, 'yyyy-MM-dd'));
        else params.delete('date');
      }
      if (patch.type !== undefined) {
        if (patch.type) params.set('type', patch.type);
        else params.delete('type');
      }
      const q = params.toString();
      router.replace(q ? `/calendario?${q}` : '/calendario', { scroll: false });
    },
    [router, searchParams],
  );

  const openCreate = (startsAt: Date) => {
    setEditorMode('create');
    setEditingEvent(null);
    setDefaultStartsAt(startsAt);
    setEditorOpen(true);
  };

  const openEdit = (evt: CalendarioEvent) => {
    if (evt.source.table === 'calendario_eventos') {
      setEditorMode('edit');
      setEditingEvent(evt);
      setDefaultStartsAt(undefined);
      setEditorOpen(true);
      return;
    }
    // Domain events → tool or read-only toast
    const href = evt.toolHref ?? resolveEventToolLink(evt.type).href;
    if (href && href !== '/calendario') {
      router.push(href);
    } else {
      toast(evt.title, {
        description: 'Registro de sistema (solo lectura en esta vista)',
      });
    }
  };

  const handleSave = async (
    input: CreateCalendarioEventInput & { id?: string },
  ) => {
    setIsSaving(true);
    try {
      if (input.id) {
        const res = await updateEvent({ ...input, id: input.id });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success('Evento actualizado');
      } else {
        const res = await createEvent({
          ...input,
          userId,
          empresaId: input.empresaId ?? (empresaId || null),
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success('Evento creado');
      }
      setEditorOpen(false);
      if (input.startsAt) {
        setSelectedDate(input.startsAt);
        setCurrentDate(input.startsAt);
        pushQuery({ date: input.startsAt });
      }
    } catch (err) {
      toast.error(friendlyError(err, 'No se pudo guardar'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || editingEvent.source.table !== 'calendario_eventos')
      return;
    setIsSaving(true);
    try {
      const res = await deleteEvent(editingEvent.source.originalId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Evento eliminado');
      setEditorOpen(false);
      setEditingEvent(null);
    } catch (err) {
      toast.error(friendlyError(err, 'No se pudo eliminar'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!supabase) {
    return (
      <div className="p-8 text-center text-destructive">
        Supabase no configurado. Revisa las variables de entorno.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-medium text-destructive">
          No fue posible cargar las actividades del calendario
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Ocurrió un problema al sincronizar con el servicio. Intenta recargar la página o vuelve a intentarlo más tarde.
        </p>
      </div>
    );
  }

  const isTerritorial = userRole === 'territorial' || userRole === 'apicultor';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="clean"
        title={isTerritorial ? 'Calendario de Campo y Territorio' : 'Calendario'}
        subtitle={
          isTerritorial
            ? 'Ciclo de temporada, resguardos fitosanitarios, trashumancia y manejo de colmenas del territorio.'
            : 'Planificación integral de actividades, eventos con franja horaria, seguimiento de ferias y campañas operativas del ecosistema.'
        }
        actions={
          <div className="flex items-center rounded-xl border border-border/60 overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={cn(
                'px-4 h-9 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                viewMode === 'agenda'
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setViewMode('ciclo')}
              className={cn(
                'px-4 h-9 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                viewMode === 'ciclo'
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
              )}
            >
              Ciclo del Año
            </button>
          </div>
        }
      />

      {viewMode === 'ciclo' ? (
        <CalendarioCiclico />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px] items-start">
          <div className="min-w-0">
            {isLoading && events.length === 0 ? (
              <CalendarioSkeleton />
            ) : (
              <Calendario
                events={events}
                currentDate={currentDate}
                selectedDate={selectedDate}
                userRole={userRole}
                onMonthChange={setCurrentDate}
                onSelectedDateChange={(d) => {
                  setSelectedDate(d);
                  pushQuery({ date: d });
                }}
                isLoading={isLoading}
                onEventClick={openEdit}
                onCreateEvent={openCreate}
                onOpenTool={(href) => router.push(href)}
                activeTypeFilter={typeFilter}
                onTypeFilterChange={(type) => pushQuery({ type })}
                hideLegend={true}
                dayPanel={
                  selectedDate ? (
                    <DayTimeline
                      date={selectedDate}
                      events={events}
                      onEventClick={openEdit}
                      onCreateAt={openCreate}
                      onClose={() => {
                        setSelectedDate(null);
                        pushQuery({ date: null });
                      }}
                    />
                  ) : null
                }
              />
            )}
          </div>

          {/* ── Panel lateral de Simbología ── */}
          <aside className="rounded-2xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <h3 className="font-display text-sm font-bold tracking-wide uppercase text-foreground">
                Simbología
              </h3>
              {typeFilter && (
                <button
                  type="button"
                  onClick={() => pushQuery({ type: null })}
                  className="text-[10px] uppercase font-semibold text-accent hover:underline"
                >
                  Limpiar filtro
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Haz clic en cualquier categoría para filtrar los eventos del calendario.
            </p>
            <div className="flex flex-col gap-1.5 mt-1">
              {(
                (isTerritorial
                  ? [
                      'apicultura',
                      'inspeccion',
                      'cosecha',
                      'tratamiento',
                      'transhumancia',
                      'reunion',
                      'personal',
                      'otro',
                    ]
                  : [
                      'apicultura',
                      'inspeccion',
                      'cosecha',
                      'tratamiento',
                      'transhumancia',
                      'reunion',
                      'personal',
                      'feria',
                      'marketing',
                      'logistica',
                      'otro',
                    ]) as CalendarioEventType[]
              ).map((catKey) => {
                const conf = eventTypeConfig[catKey] ?? {
                  dotClass: 'bg-muted-foreground',
                  label: catKey,
                };
                const isActive = typeFilter === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => pushQuery({ type: isActive ? null : catKey })}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-all border',
                      isActive
                        ? 'border-accent/50 bg-accent/15 text-accent font-semibold shadow-xs'
                        : typeFilter
                          ? 'border-transparent text-muted-foreground/60 hover:text-foreground hover:bg-muted/40'
                          : 'border-transparent text-foreground/80 hover:text-foreground hover:bg-muted/40',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', conf.dotClass)} />
                      <span className="truncate">{conf.label}</span>
                    </div>
                    {isActive && (
                      <span className="text-[9px] uppercase font-bold tracking-wider text-accent ml-2">
                        Filtro
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      <EventEditorSheet
        open={editorOpen}
        mode={editorMode}
        userRole={userRole}
        event={editingEvent}
        defaultStartsAt={defaultStartsAt}
        isSaving={isSaving}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        onDelete={
          editorMode === 'edit' &&
          editingEvent?.source.table === 'calendario_eventos'
            ? handleDelete
            : undefined
        }
      />
    </div>
  );
}
