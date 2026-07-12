'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendario,
  useCalendarioSync,
  type CalendarioEvent,
  type CalendarioEventType,
  resolveEventToolLink,
} from '@enjambre/calendar';
import { createClient } from '@enjambre/auth/browser';
import { useAuthStore } from '@enjambre/auth';
import {
  ViewLoading,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  toast,
  friendlyError,
} from '@enjambre/ui';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isValid,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';

const TYPE_FILTERS: CalendarioEventType[] = [
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
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileRole = useAuthStore((s) => s.user?.role);
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

  // Sync URL → state when navigating from other tools
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

  const { events, isLoading, error, updateEventDate } = useCalendarioSync(
    supabase,
    userRole,
    viewStart,
    viewEnd,
  );

  const [selectedEvent, setSelectedEvent] = React.useState<CalendarioEvent | null>(
    null,
  );
  const [editDate, setEditDate] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

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

  const handleMonthChange = (d: Date) => {
    setCurrentDate(d);
  };

  const handleSelectedDateChange = (d: Date | null) => {
    setSelectedDate(d);
    pushQuery({ date: d });
  };

  const handleEventClick = (evt: CalendarioEvent) => {
    setSelectedEvent(evt);
    setEditDate(format(evt.startDate, 'yyyy-MM-dd'));
  };

  const handleOpenTool = (href: string) => {
    router.push(href);
  };

  const handleSaveDate = async () => {
    if (!selectedEvent || !editDate) return;
    setIsUpdating(true);
    try {
      const newDate = parseISO(editDate);
      const success = await updateEventDate(selectedEvent, newDate);
      if (success) {
        toast.success('Reprogramado correctamente');
        setSelectedEvent(null);
        setSelectedDate(newDate);
        setCurrentDate(newDate);
        pushQuery({ date: newDate });
      } else {
        toast.error('No se pudo modificar la fecha');
      }
    } catch (err) {
      toast.error(friendlyError(err, 'Error al reprogramar'));
    } finally {
      setIsUpdating(false);
    }
  };

  const setTypeFilter = (t: CalendarioEventType | null) => {
    pushQuery({ type: t });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        <p className="font-medium">
          Error al sincronizar el calendario: {error.message}
        </p>
      </div>
    );
  }

  return (
    // Un solo scroll: el de .main-content. Sin max-h-screen / overflow-hidden anidados.
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-1 pb-10 sm:px-0">
      <header className="shrink-0">
        <h1 className="font-display text-3xl font-bold tracking-wide text-foreground sm:text-4xl">
          Calendario
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Vista del mes de todo el enjambre: ferias, colmenas, cosechas, marketing e
          inspecciones. Clic en un día para expandir el detalle y saltar a cada
          herramienta.
        </p>

        {/* Filtros por origen (bidireccional con tools) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className={[
              'rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition',
              !typeFilter
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border text-muted-foreground hover:border-accent/40 hover:text-accent',
            ].join(' ')}
          >
            Todo
          </button>
          {TYPE_FILTERS.map((t) => {
            const link = resolveEventToolLink(t);
            const active = typeFilter === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(active ? null : t)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition',
                  active
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/40 hover:text-accent',
                ].join(' ')}
                title={`Filtrar · abrir ${link.label}`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-w-0">
        {isLoading && events.length === 0 ? (
          <ViewLoading label="Sincronizando calendario..." />
        ) : (
          <Calendario
            events={events}
            currentDate={currentDate}
            selectedDate={selectedDate}
            onMonthChange={handleMonthChange}
            onSelectedDateChange={handleSelectedDateChange}
            isLoading={isLoading}
            onEventClick={handleEventClick}
            onOpenTool={handleOpenTool}
            activeTypeFilter={typeFilter}
          />
        )}
      </div>

      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-md border border-border bg-card text-foreground shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-accent">
              Detalle del registro
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest text-muted-foreground">
              Origen: {selectedEvent?.source.table}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="flex flex-col gap-5 py-2">
              <div>
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Actividad
                </span>
                <p className="text-lg font-medium">{selectedEvent.title}</p>
              </div>

              <div>
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                  Categoría
                </span>
                <p className="text-sm font-semibold capitalize text-accent">
                  {selectedEvent.type}
                </p>
              </div>

              {selectedEvent.editable ? (
                <div>
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                    Reprogramar fecha
                  </span>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1 rounded-lg border-border bg-background"
                  />
                </div>
              ) : (
                <div>
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                    Fecha registrada
                  </span>
                  <p className="text-sm">
                    {format(selectedEvent.startDate, "d 'de' MMMM, yyyy", {
                      locale: es,
                    })}
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full justify-between rounded-full"
                onClick={() => {
                  const href =
                    selectedEvent.toolHref ??
                    resolveEventToolLink(selectedEvent.type).href;
                  setSelectedEvent(null);
                  router.push(href);
                }}
              >
                <span>
                  Abrir{' '}
                  {selectedEvent.toolLabel ??
                    resolveEventToolLink(selectedEvent.type).label}
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Cerrar
            </Button>
            {selectedEvent?.editable && (
              <Button
                onClick={handleSaveDate}
                disabled={isUpdating || !editDate}
                className="font-bold"
              >
                {isUpdating ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
