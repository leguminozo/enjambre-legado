'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Loader2, Check, AlertTriangle, CloudUpload } from 'lucide-react';
import { useAutosave, type AutosaveStatus } from '@/hooks/use-autosave';

type StatusMap = Record<string, AutosaveStatus>;
export type AggregateStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface EditorSaveActions {
  setStatus: (key: string, status: AutosaveStatus) => void;
  registerFlush: (key: string, flush: () => Promise<void>) => void;
  unregisterFlush: (key: string) => void;
  flushAll: () => Promise<void>;
}

const EditorSaveActionsContext = createContext<EditorSaveActions | null>(null);
const EditorSaveStatusesContext = createContext<StatusMap>({});

/** Invoca cada flush registrado. allSettled sobre las funciones (sin llamarlas)
 *  era un no-op: Cmd+S y Reintentar no guardaban. */
export async function flushRegistered(
  flushes: Record<string, () => Promise<void>>,
): Promise<void> {
  await Promise.allSettled(Object.values(flushes).map((fn) => fn()));
}

export function deriveAggregateStatus(statuses: StatusMap): AggregateStatus {
  const values = Object.values(statuses);
  if (values.length === 0) return 'idle';
  if (values.includes('error')) return 'error';
  if (values.includes('saving')) return 'saving';
  if (values.includes('pending')) return 'pending';
  return 'saved';
}

/**
 * Agrega el estado de guardado de todos los editores activos del editor de
 * tienda → chip global de publicación en la top bar.
 *
 * Acciones y statuses van en contextos separados: si el value incluye
 * `statuses`, cada tecleo recrea el ctx y remonta todos los autosaves
 * (Maximum update depth).
 */
export function EditorSaveStatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<StatusMap>({});
  const flushesRef = useRef<Record<string, () => Promise<void>>>({});

  const setStatus = useCallback((key: string, status: AutosaveStatus) => {
    setStatuses((prev) => {
      if (status === 'idle') {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      if (prev[key] === status) return prev;
      return { ...prev, [key]: status };
    });
  }, []);

  const registerFlush = useCallback((key: string, flush: () => Promise<void>) => {
    flushesRef.current[key] = flush;
  }, []);

  const unregisterFlush = useCallback((key: string) => {
    delete flushesRef.current[key];
  }, []);

  const flushAll = useCallback(async () => {
    await flushRegistered(flushesRef.current);
  }, []);

  const actions = useMemo(
    () => ({ setStatus, registerFlush, unregisterFlush, flushAll }),
    [setStatus, registerFlush, unregisterFlush, flushAll],
  );

  return (
    <EditorSaveActionsContext.Provider value={actions}>
      <EditorSaveStatusesContext.Provider value={statuses}>
        {children}
      </EditorSaveStatusesContext.Provider>
    </EditorSaveActionsContext.Provider>
  );
}

/** Registra un editor por key: reporta su estado y su flush (para reintentar todo). */
export function useEditorSaveStatus(key: string, flush: () => Promise<void>) {
  const actions = useContext(EditorSaveActionsContext);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    if (!actions) return;
    actions.registerFlush(key, () => flushRef.current());
    return () => {
      actions.unregisterFlush(key);
      actions.setStatus(key, 'idle');
    };
  }, [actions, key]);

  return useCallback(
    (status: AutosaveStatus) => {
      actions?.setStatus(key, status);
    },
    [actions, key],
  );
}

/** Estado derivado de todos los editores: error > saving > pending > saved > idle. */
export function useEditorSaveAggregate(): { status: AggregateStatus; flushAll: () => Promise<void> } {
  const actions = useContext(EditorSaveActionsContext);
  const statuses = useContext(EditorSaveStatusesContext);
  return {
    status: deriveAggregateStatus(statuses),
    flushAll: actions?.flushAll ?? (async () => undefined),
  };
}

/**
 * Hook combinado para los settings editors: autosave con debounce + reporte
 * al chip global. `key` debe ser única entre editores montados (section key
 * o `card-${id}`).
 */
export function useAutosaveEditor<T>(
  key: string,
  value: T,
  saveFn: (value: T) => Promise<unknown> | void,
  options?: { debounce?: number },
): { status: AutosaveStatus; isDirty: boolean; flush: (override?: T) => Promise<void> } {
  const flushRef = useRef<(override?: T) => Promise<void>>(async () => undefined);
  // El registro usa un getter: flushRef.current siempre apunta al flush real
  const report = useEditorSaveStatus(key, () => flushRef.current());
  const { status, isDirty, flush } = useAutosave(value, saveFn, {
    onStatus: report,
    debounce: options?.debounce,
  });
  flushRef.current = flush;
  return { status, isDirty, flush };
}

/**
 * Chip de publicación global. "Publicado ✓" se desvanece solo tras ~2.5s;
 * "Error" ofrece reintentar (flushAll). Cero toasts para éxito — solo errores.
 */
export function EditorSaveStatusChip() {
  const { status, flushAll } = useEditorSaveAggregate();
  const [display, setDisplay] = useState<AggregateStatus>('idle');

  useEffect(() => {
    if (status === 'idle') {
      setDisplay('idle');
      return;
    }
    setDisplay(status);
    if (status === 'saved') {
      const t = setTimeout(() => setDisplay('idle'), 2500);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (display === 'idle') return null;

  const styles: Record<Exclude<AggregateStatus, 'idle'>, string> = {
    pending: 'text-muted-foreground border-border',
    saving: 'text-accent border-accent/30',
    saved: 'text-accent border-accent/30',
    error: 'text-destructive border-destructive/40',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-medium whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-300 ${
        display === 'error' ? 'bg-destructive/10' : 'bg-background/60 backdrop-blur'
      } ${styles[display]}`}
    >
      {display === 'saving' ? (
        <Loader2 size={12} className="animate-spin" />
      ) : display === 'saved' ? (
        <Check size={12} />
      ) : display === 'error' ? (
        <AlertTriangle size={12} />
      ) : (
        <CloudUpload size={12} />
      )}
      <span>
        {display === 'pending'
          ? 'Cambios pendientes…'
          : display === 'saving'
            ? 'Guardando…'
            : display === 'saved'
              ? 'Guardado ✓'
              : 'Error al guardar'}
      </span>
      {display === 'error' ? (
        <button
          type="button"
          onClick={() => void flushAll()}
          className="ml-1 underline underline-offset-2 hover:text-foreground transition-colors"
        >
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
