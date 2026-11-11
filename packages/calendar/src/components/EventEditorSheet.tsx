'use client';

import * as React from 'react';
import { setHours, setMinutes } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  X,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  USER_CATEGORIES,
  TERRITORIAL_USER_CATEGORIES,
  MACRO_USER_CATEGORIES,
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
import { overlayBackdropClassName } from '@enjambre/ui';

export interface EventEditorSheetProps {
  open: boolean;
  mode: 'create' | 'edit';
  userRole?: string;
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
  const valid: CalendarioUserCategory[] = [
    'personal',
    'reunion',
    'feria',
    'apicultura',
    'marketing',
    'logistica',
    'inspeccion',
    'tratamiento',
    'cosecha',
    'transhumancia',
    'reforestacion',
    'otro',
  ];
  if (t && valid.includes(t as CalendarioUserCategory)) {
    return t as CalendarioUserCategory;
  }
  return 'personal';
}

export function EventEditorSheet({
  open,
  mode,
  userRole,
  defaultStartsAt,
  event,
  isSaving,
  onClose,
  onSave,
  onDelete,
}: EventEditorSheetProps) {
  const isTerritorialRole = userRole === 'territorial' || userRole === 'apicultor';
  const availableCategories = isTerritorialRole
    ? TERRITORIAL_USER_CATEGORIES
    : MACRO_USER_CATEGORIES;

  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [allDay, setAllDay] = React.useState(false);
  const [category, setCategory] = React.useState<CalendarioUserCategory>(
    isTerritorialRole ? 'apicultura' : 'personal',
  );
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
    setCategory(
      event?.type
        ? asUserCategory(event.type)
        : isTerritorialRole
          ? 'apicultura'
          : 'personal',
    );
    setStartLocal(toDateTimeLocalValue(s));
    setEndLocal(toDateTimeLocalValue(e));
    setStartDateOnly(toDateInputValue(s));
    setEndDateOnly(toDateInputValue(e));
  }, [open, event, defaultStartsAt, isTerritorialRole]);

  // Lock body scroll while modal open
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
      setFormError('El título de la actividad es obligatorio');
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
        setFormError('Indica una fecha y hora válidas');
        return;
      }
      startsAt = s;
      endsAt = en;
    }

    if (endsAt < startsAt) {
      endsAt = defaultEndFromStart(startsAt);
    }

    const color =
      availableCategories.find((c) => c.value === category)?.color ??
      USER_CATEGORIES.find((c) => c.value === category)?.color ??
      '#5AC8FA';

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
      className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal
      aria-labelledby="event-editor-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className={`fixed inset-0 ${overlayBackdropClassName} transition-opacity`}
        aria-label="Cerrar modal"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-[1] flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-border/70 px-6 py-4 bg-muted/20">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                {isTerritorialRole ? 'Registro Territorial' : 'Planificación'}
              </p>
            </div>
            <h2
              id="event-editor-title"
              className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground"
            >
              {mode === 'create' ? 'Nueva Actividad de Campo' : 'Editar Actividad'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6 overscroll-contain">
          {formError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Campo Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Título de la actividad *
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Revisión sanitaria de colmenas, Recolección estacional, Traslado a predio..."
              className="w-full rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-base font-medium text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-accent focus:ring-1 focus:ring-accent/40"
              maxLength={200}
              required
            />
          </div>

          {/* Categoría Territorial Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categoría {isTerritorialRole ? 'Territorial' : 'Operativa'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {availableCategories.map((c) => {
                const isSelected = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={[
                      'group relative flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all',
                      isSelected
                        ? 'border-accent/80 bg-accent/15 shadow-xs ring-1 ring-accent/40'
                        : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40',
                    ].join(' ')}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: c.color }}
                        />
                        <span
                          className={[
                            'text-xs font-bold leading-tight',
                            isSelected ? 'text-accent' : 'text-foreground/90',
                          ].join(' ')}
                        >
                          {c.label}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                      )}
                    </div>
                    {c.description && (
                      <span className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                        {c.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horario y Fechas */}
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Jornada completa
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={allDay}
                onClick={() => setAllDay(!allDay)}
                className={[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  allDay ? 'bg-accent' : 'bg-muted',
                ].join(' ')}
              >
                <span
                  className={[
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-md ring-0 transition duration-200 ease-in-out',
                    allDay ? 'translate-x-5' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>

            {allDay ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Fecha de inicio</span>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={startDateOnly}
                      onChange={(e) => setStartDateOnly(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Fecha de término</span>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={endDateOnly}
                      onChange={(e) => setEndDateOnly(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Inicio de actividad</span>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={startLocal}
                      onChange={(e) => {
                        setStartLocal(e.target.value);
                        const s = parseLocalDateTime(e.target.value);
                        if (s) setEndLocal(toDateTimeLocalValue(defaultEndFromStart(s)));
                      }}
                      className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Término estimado</span>
                  <div className="relative flex items-center">
                    <Clock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="datetime-local"
                      value={endLocal}
                      onChange={(e) => setEndLocal(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ubicación y Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Colmenar o ubicación
              </label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Apiario San Juan, Sector Las Lomas"
                  className="w-full rounded-2xl border border-border/70 bg-background/60 pl-10 pr-4 py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notas y bitácora
              </label>
              <div className="relative flex items-center">
                <FileText className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles de manejo, dosis o fenología..."
                  className="w-full rounded-2xl border border-border/70 bg-background/60 pl-10 pr-4 py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between border-t border-border/70 px-6 py-4 bg-muted/20">
          <div>
            {mode === 'edit' && onDelete && (
              !confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onDelete()}
                    disabled={isSaving}
                    className="rounded-xl bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:brightness-110"
                  >
                    Confirmar eliminación
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-xl px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-md transition hover:brightness-110 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSaving ? 'Guardando…' : mode === 'create' ? 'Programar Actividad' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
