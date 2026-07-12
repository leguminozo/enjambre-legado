'use client';

import * as React from 'react';
import { format, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';
import {
  USER_CATEGORIES,
  type CalendarioEvent,
  type CalendarioUserCategory,
  type CreateCalendarioEventInput,
} from '../types';
import { defaultEndFromStart } from './DayTimeline';

export interface EventEditorSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  /** Prefill for create */
  defaultStartsAt?: Date;
  event?: CalendarioEvent | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (input: CreateCalendarioEventInput & { id?: string }) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

function toLocalInput(d: Date): string {
  // yyyy-MM-ddTHH:mm for datetime-local
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInput(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function EventEditorSheet({
  open,
  mode,
  defaultStartsAt,
  event,
  isSaving,
  onClose,
  onSave,
  onDelete,
}: EventEditorSheetProps) {
  const initialStart = event?.startDate ?? defaultStartsAt ?? new Date();
  const initialEnd =
    event?.endDate ??
    defaultEndFromStart(event?.startDate ?? defaultStartsAt ?? new Date());

  const [title, setTitle] = React.useState(event?.title ?? '');
  const [notes, setNotes] = React.useState(event?.notes ?? '');
  const [location, setLocation] = React.useState(event?.location ?? '');
  const [allDay, setAllDay] = React.useState(Boolean(event?.allDay));
  const [category, setCategory] = React.useState<CalendarioUserCategory>(() => {
    const t = event?.type;
    if (
      t === 'personal' ||
      t === 'reunion' ||
      t === 'feria' ||
      t === 'apicultura' ||
      t === 'marketing' ||
      t === 'logistica' ||
      t === 'otro'
    )
      return t;
    return 'personal';
  });
  const [startLocal, setStartLocal] = React.useState(toLocalInput(initialStart));
  const [endLocal, setEndLocal] = React.useState(toLocalInput(initialEnd));
  const [startDateOnly, setStartDateOnly] = React.useState(
    toDateInput(initialStart),
  );
  const [endDateOnly, setEndDateOnly] = React.useState(toDateInput(initialEnd));

  React.useEffect(() => {
    if (!open) return;
    const s = event?.startDate ?? defaultStartsAt ?? new Date();
    const e =
      event?.endDate ?? defaultEndFromStart(s);
    setTitle(event?.title ?? '');
    setNotes(event?.notes ?? '');
    setLocation(event?.location ?? '');
    setAllDay(Boolean(event?.allDay));
    const t = event?.type;
    setCategory(
      t === 'personal' ||
        t === 'reunion' ||
        t === 'feria' ||
        t === 'apicultura' ||
        t === 'marketing' ||
        t === 'logistica' ||
        t === 'otro'
        ? t
        : 'personal',
    );
    setStartLocal(toLocalInput(s));
    setEndLocal(toLocalInput(e));
    setStartDateOnly(toDateInput(s));
    setEndDateOnly(toDateInput(e));
  }, [open, event, defaultStartsAt]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let startsAt: Date;
    let endsAt: Date;

    if (allDay) {
      startsAt = startOfDay(parseISO(startDateOnly));
      endsAt = setMinutes(setHours(startOfDay(parseISO(endDateOnly)), 23), 59);
    } else {
      startsAt = new Date(startLocal);
      endsAt = new Date(endLocal);
    }

    if (endsAt < startsAt) {
      endsAt = defaultEndFromStart(startsAt);
    }

    const color =
      USER_CATEGORIES.find((c) => c.value === category)?.color ?? '#5AC8FA';

    void onSave({
      id: event?.source.table === 'calendario_eventos' ? event.source.originalId : undefined,
      title: title.trim(),
      notes: notes.trim() || undefined,
      location: location.trim() || undefined,
      startsAt,
      endsAt,
      allDay,
      category,
      color,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="event-editor-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-[1] flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl"
      >
        {/* Apple-style grabber + nav */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-accent"
          >
            Cancelar
          </button>
          <h2
            id="event-editor-title"
            className="font-semibold text-foreground"
          >
            {mode === 'create' ? 'Nuevo evento' : 'Editar evento'}
          </h2>
          <button
            type="submit"
            disabled={isSaving || !title.trim()}
            className="text-sm font-bold text-accent disabled:opacity-40"
          >
            {isSaving ? '…' : 'Guardar'}
          </button>
        </div>

        <div className="flex-1 space-y-0 overflow-y-auto overscroll-contain">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="w-full border-b border-border bg-transparent px-4 py-4 text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground"
            maxLength={200}
            required
          />

          <label className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm text-foreground">Todo el día</span>
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-5 w-9 accent-accent"
            />
          </label>

          {allDay ? (
            <>
              <label className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Inicio</span>
                <input
                  type="date"
                  value={startDateOnly}
                  onChange={(e) => setStartDateOnly(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                />
              </label>
              <label className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Fin</span>
                <input
                  type="date"
                  value={endDateOnly}
                  onChange={(e) => setEndDateOnly(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                />
              </label>
            </>
          ) : (
            <>
              <label className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Inicio</span>
                <input
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => {
                    setStartLocal(e.target.value);
                    const s = new Date(e.target.value);
                    if (!Number.isNaN(s.getTime())) {
                      setEndLocal(toLocalInput(defaultEndFromStart(s)));
                    }
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                />
              </label>
              <label className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Fin</span>
                <input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
                />
              </label>
            </>
          )}

          <div className="border-b border-border px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categoría
            </p>
            <div className="flex flex-wrap gap-2">
              {USER_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                    category === c.value
                      ? 'border-transparent text-white'
                      : 'border-border text-muted-foreground hover:border-accent/40',
                  ].join(' ')}
                  style={
                    category === c.value
                      ? { backgroundColor: c.color }
                      : undefined
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ubicación"
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas"
            rows={3}
            className="w-full resize-none border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />

          {mode === 'edit' && onDelete && (
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={isSaving}
              className="w-full px-4 py-4 text-center text-sm font-semibold text-destructive hover:bg-destructive/5"
            >
              Eliminar evento
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
