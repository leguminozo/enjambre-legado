'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendario,
  DayTimeline,
  EventEditorSheet,
  useCalendarioSync,
  type CalendarioEvent,
  type CalendarioEventType,
  type CreateCalendarioEventInput,
  resolveEventToolLink,
} from '@enjambre/calendar';
import { createClient } from '@enjambre/auth/browser';
import { useAuthStore } from '@enjambre/auth';
import { ViewLoading, toast, friendlyError } from '@enjambre/ui';
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
  'historico',
  'inspeccion',
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

  const initialDate = React.useMemo(() => {
    const d = searchParams.get('date');
    if (d) {
      const parsed = parseISO(d);
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  }, [searchParams]);

  const typeFilter = React.useMemo(
    () => parseType(searchParams.get('type')),
    [searchParams],
  );

  const [currentDate, setCurrentDate] = React.useState(initialDate);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(initialDate);

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
          userId: user?.id ?? null,
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
          Error al sincronizar: {error.message}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          Si acabas de desplegar, aplica la migración{' '}
          <code className="text-xs">91_calendario_eventos.sql</code> en Supabase
          (SQL Editor o <code className="text-xs">pnpm db:push</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-1 pb-12 sm:px-0">
      <header className="shrink-0">
        <h1 className="font-display text-3xl font-bold tracking-wide text-foreground sm:text-4xl">
          Calendario
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Agenda estilo Apple: mes completo, toca un día para la línea de horas,
          crea eventos con inicio y fin. También ves ferias, cosechas y marketing
          de las otras herramientas.
        </p>
      </header>

      <div className="min-w-0">
        {isLoading && events.length === 0 ? (
          <ViewLoading label="Sincronizando calendario..." />
        ) : (
          <Calendario
            events={events}
            currentDate={currentDate}
            selectedDate={selectedDate}
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

      <EventEditorSheet
        open={editorOpen}
        mode={editorMode}
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
