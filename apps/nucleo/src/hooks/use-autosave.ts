'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
  /** Milisegundos de silencio antes de guardar (default 1200). */
  debounce?: number;
  /** Reporta cada transición (para el chip global de publicación). */
  onStatus?: (status: AutosaveStatus) => void;
  /** Identificador de la entidad/sección para aislar saveFn entre pestañas. */
  key?: string;
}

/**
 * Autosave con debounce para el editor de tienda.
 * - No dispara save si el valor no cambió (comparación serializada: soporta objetos).
 * - Teclas durante el vuelo no se pierden: se encola un segundo save.
 * - `flush()` guarda ya (Cmd/Ctrl+S, upload de imagen, unmount).
 * - `resetBaseline()` sincroniza desde servidor o cambio de pestaña sin marcar dirty.
 * - Si saveFn lanza, queda `error` y el snapshot pendiente se reintenta en el
 *   próximo flush/edición — nunca se descarta trabajo del operador.
 */
export function useAutosave<T>(
  value: T,
  saveFn: (value: T) => Promise<unknown> | void,
  options?: UseAutosaveOptions,
): {
  status: AutosaveStatus;
  isDirty: boolean;
  flush: (override?: T) => Promise<void>;
  resetBaseline: (nextValue: T) => void;
} {
  const { debounce = 1200, onStatus, key } = options ?? {};
  const [status, setStatus] = useState<AutosaveStatus>('idle');

  const activeKeyRef = useRef(key);
  const saveFnRef = useRef(saveFn);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  // Valor inicial como referencia: el mount no debe disparar un save falso
  const [initialSerialized] = useState(() => JSON.stringify(value));
  const prevSerializedRef = useRef(initialSerialized);
  const pendingRef = useRef<T | null>(null);
  const savingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Si cambia la key sin desmontar el componente: volcar pendiente en el saveFn
  // de la sección saliente ANTES de apuntar saveFnRef a la sección entrante.
  if (activeKeyRef.current !== key) {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingRef.current !== null && !savingRef.current) {
      const pendingSnapshot = pendingRef.current;
      const previousSaveFn = saveFnRef.current;
      pendingRef.current = null;
      void previousSaveFn(pendingSnapshot);
    } else {
      pendingRef.current = null;
    }
    activeKeyRef.current = key;
    saveFnRef.current = saveFn;
  } else {
    saveFnRef.current = saveFn;
  }

  const isMountedRef = useRef(true);

  const runSave = useCallback(async () => {
    if (pendingRef.current === null || savingRef.current) return;
    const snapshot = pendingRef.current;
    const targetSaveFn = saveFnRef.current;
    pendingRef.current = null;
    savingRef.current = true;
    if (isMountedRef.current) setStatus('saving');
    try {
      await targetSaveFn(snapshot);
      if (pendingRef.current !== null) {
        // Cambios llegaron durante el vuelo → guardar la cola (incluso si se desmontó)
        savingRef.current = false;
        void runSave();
        return;
      } else if (isMountedRef.current) {
        setStatus('saved');
      }
    } catch {
      if (isMountedRef.current) {
        setStatus('error');
      }
      // Reintento del mismo snapshot (el operador no pierde nada)
      pendingRef.current = snapshot;
    } finally {
      savingRef.current = false;
    }
  }, []);

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runSave();
    }, debounce);
  }, [debounce, runSave]);

  /**
   * Sincroniza la línea base con un valor proveniente del servidor o de otra
   * pestaña sin disparar un guardado falso ni marcar el estado como pendiente.
   */
  const resetBaseline = useCallback((nextValue: T) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const hadPending = pendingRef.current !== null;
    pendingRef.current = null;
    const nextSerialized = JSON.stringify(nextValue);
    const changed = prevSerializedRef.current !== nextSerialized;
    prevSerializedRef.current = nextSerialized;
    if (isMountedRef.current && (hadPending || changed)) {
      setStatus('idle');
    }
  }, []);

  // Valor nuevo → pending + timer (comparación serializada evita re-renders)
  useEffect(() => {
    const serialized = JSON.stringify(value);
    if (serialized === prevSerializedRef.current) return;
    prevSerializedRef.current = serialized;
    pendingRef.current = value;
    if (isMountedRef.current) setStatus('pending');
    schedule();
  }, [value, schedule]);

  // Reportar transiciones al exterior (chip global)
  useEffect(() => {
    onStatusRef.current?.(status);
  }, [status]);

  /**
   * Guarda ya. `override` sirve para flujos inmediatos (upload de imagen)
   * donde el valor aún no pasó por el effect de estado.
   */
  const flush = useCallback(
    async (override?: T) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (override !== undefined) {
        pendingRef.current = override;
        prevSerializedRef.current = JSON.stringify(override);
      }
      await runSave();
    },
    [runSave],
  );

  // Flush al desmontar (cambio de sección / cierre) — best effort
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current !== null && !savingRef.current) {
        void saveFnRef.current(pendingRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup una sola vez
  }, []);

  return {
    status,
    isDirty: status === 'pending' || status === 'saving' || status === 'error',
    flush,
    resetBaseline,
  };
}
