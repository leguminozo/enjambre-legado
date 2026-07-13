'use client';

import * as React from 'react';
import { setHours, setMinutes } from 'date-fns';
import {
  USER_CATEGORIES,
  type CalendarioEvent,
  type CalendarioUserCategory,
  type CreateCalendarioEventInput,
} from '../types';
import { defaultEndFromStart } from './DayTimeline';
import {
  parseLocalDate,
  parseLocalDateTime,
  toDateInputValue,
  toDateTimeLocalValue,
} from '../lib/dates';

export interface EventEditorSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  defaultStartsAt?: Date;
  event?: CalendarioEvent | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (
    input: CreateCalendarioEventInput & { id?: string },
  ) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

function asUserCategory(t: string | undefined): CalendarioUserCategory {
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
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [allDay, setAllDay] = React.useState(false);
  const [category, setCategory] =
    React.useState<CalendarioUserCategory>('personal');
  const [startLocal, setStartLocal] = React.useState('');
  const [endLocal, setEndLocal] = React.useState('');
  const [startDateOnly, setStartDateOnly] = React.useState('');
  const [endDateOnly, setEndDateOnly] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      setFormError(null);
      return;
    }
    const s = event?.startDate ?? defaultStartsAt ?? new Date();
    const e = event?.endDate ?? defaultEndFromStart(s);
    setTitle(event?.title ?? '');
    setNotes(event?.notes ?? '');
    setLocation(event?.location ?? '');
    setAllDay(Boolean(event?.allDay));
    setCategory(asUserCategory(event?.type));
    setStartLocal(toDateTimeLocalValue(s));
    setEndLocal(toDateTimeLocalValue(e));
    setStartDateOnly(toDateInputValue(s));
    setEndDateOnly(toDateInputValue(e));
  }, [open, event, defaultStartsAt]);

  // Lock body scroll while sheet open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError('El título es obligatorio');
      return;
    }

    let startsAt: Date;
    let endsAt: Date;

    if (allDay) {
      startsAt = parseLocalDate(startDateOnly);
      endsAt = setMinutes(setHours(parseLocalDate(endDateOnly), 23), 59);
    } else {
      const s = parseLocalDateTime(startLocal);
      const en = parseLocalDateTime(endLocal);
      if (!s || !en) {
        setFormError('Fecha u hora inválida');
        return;
      }
      startsAt = s;
      endsAt = en;
    }

    if (endsAt < startsAt) {
      endsAt = defaultEndFromStart(startsAt);
    }

    const color =
      USER_CATEGORIES.find((c) => c.value === category)?.color ?? '#5AC8FA';

    void onSave({
      id:
        event?.source.table === 'calendario_eventos'
          ? event.source.originalId
          : undefined,
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
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" />

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
          {formError && (
            <p className="bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

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
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                  required
                />
              </label>
              <label className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Fin</span>
                <input
                  type="date"
                  value={endDateOnly}
                  onChange={(e) => setEndDateOnly(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                  required
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
                    const s = parseLocalDateTime(e.target.value);
                    if (s) setEndLocal(toDateTimeLocalValue(defaultEndFromStart(s)));
                  }}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                  required
                />
              </label>
              <label className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Fin</span>
                <input
                  type="datetime-local"
                  value={endLocal}
                  onChange={(e) => setEndLocal(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
                  required
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
            <div className="px-4 py-3">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isSaving}
                  className="w-full rounded-xl py-3 text-center text-sm font-semibold text-destructive hover:bg-destructive/5"
                >
                  Eliminar evento
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
                  >
                    No, cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete()}
                    disabled={isSaving}
                    className="flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground"
                  >
                    Sí, eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
