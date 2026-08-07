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

interface EditorSaveStatusContextValue {
  statuses: StatusMap;
  setStatus: (key: string, status: AutosaveStatus) => void;
  registerFlush: (key: string, flush: () => Promise<void>) => void;
  flushAll: () => Promise<void>;
}

const EditorSaveStatusContext = createContext<EditorSaveStatusContextValue | null>(null);

/**
 * Agrega el estado de guardado de todos los editores activos del editor de
 * tienda → chip global de publicación en la top bar.
 */
export function EditorSaveStatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<StatusMap>({});
  const flushesRef = useRef<Record<string, () => Promise<void>>>({});

  const setStatus = useCallback((key: string, status: AutosaveStatus) => {
    setStatuses((prev) => {
      const next = { ...prev };
      if (status === 'idle') {
        delete next[key];
      } else {
        next[key] = status;
      }
      return next;
    });
  }, []);

  const registerFlush = useCallback((key: string, flush: () => Promise<void>) => {
    flushesRef.current[key] = flush;
  }, []);

  const flushAll = useCallback(async () => {
    await Promise.allSettled(Object.values(flushesRef.current));
  }, []);

  const value = useMemo(
    () => ({ statuses, setStatus, registerFlush, flushAll }),
    [statuses, setStatus, registerFlush, flushAll],
  );

  return (
    <EditorSaveStatusContext.Provider value={value}>{children}</EditorSaveStatusContext.Provider>
  );
}

/** Registra un editor por key: reporta su estado y su flush (para reintentar todo). */
export function useEditorSaveStatus(key: string, flush: () => Promise<void>) {
  const ctx = useContext(EditorSaveStatusContext);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    if (!ctx) return;
    ctx.registerFlush(key, () => flushRef.current());
    return () => {
      ctx.setStatus(key, 'idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registrar una sola vez
  }, [ctx, key]);

  return useCallback(
    (status: AutosaveStatus) => {
      ctx?.setStatus(key, status);
    },
    [ctx, key],
  );
}

/** Estado derivado de todos los editores: error > saving > pending > saved > idle. */
export function useEditorSaveAggregate(): { status: AggregateStatus; flushAll: () => Promise<void> } {
  const ctx = useContext(EditorSaveStatusContext);
  const [status, setStatus] = useState<AggregateStatus>('idle');

  useEffect(() => {
    if (!ctx) return;
    const values = Object.values(ctx.statuses);
    if (values.length === 0) {
      setStatus('idle');
      return;
    }
    const next: AggregateStatus = values.includes('error')
      ? 'error'
      : values.includes('saving')
        ? 'saving'
        : values.includes('pending')
          ? 'pending'
          : 'saved';
    setStatus(next);
  }, [ctx]);

  if (!ctx) return { status: 'idle', flushAll: async () => undefined };
  return { status, flushAll: ctx.flushAll };
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
            ? 'Publicando…'
            : display === 'saved'
              ? 'Publicado ✓'
              : 'Error al publicar'}
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
