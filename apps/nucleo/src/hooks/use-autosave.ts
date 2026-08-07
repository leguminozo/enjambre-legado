'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions {
  /** Milisegundos de silencio antes de guardar (default 1200). */
  debounce?: number;
  /** Reporta cada transición (para el chip global de publicación). */
  onStatus?: (status: AutosaveStatus) => void;
}

/**
 * Autosave con debounce para el editor de tienda.
 * - No dispara save si el valor no cambió (comparación serializada: soporta objetos).
 * - Teclas durante el vuelo no se pierden: se encola un segundo save.
 * - `flush()` guarda ya (Cmd/Ctrl+S, upload de imagen, unmount).
 * - Si saveFn lanza, queda `error` y el snapshot pendiente se reintenta en el
 *   próximo flush/edición — nunca se descarta trabajo del operador.
 */
export function useAutosave<T>(
  value: T,
  saveFn: (value: T) => Promise<unknown> | void,
  options?: UseAutosaveOptions,
): { status: AutosaveStatus; isDirty: boolean; flush: (override?: T) => Promise<void> } {
  const { debounce = 1200, onStatus } = options ?? {};
  const [status, setStatus] = useState<AutosaveStatus>('idle');

  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  // Valor inicial como referencia: el mount no debe disparar un save falso
  const [initialSerialized] = useState(() => JSON.stringify(value));
  const prevSerializedRef = useRef(initialSerialized);
  const pendingRef = useRef<T | null>(null);
  const savingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSave = useCallback(async () => {
    if (pendingRef.current === null || savingRef.current) return;
    const snapshot = pendingRef.current;
    pendingRef.current = null;
    savingRef.current = true;
    setStatus('saving');
    try {
      await saveFnRef.current(snapshot);
      if (pendingRef.current !== null) {
        // Cambios llegaron durante el vuelo → guardar la cola
        void runSave();
      } else {
        setStatus('saved');
      }
    } catch {
      setStatus('error');
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

  // Valor nuevo → pending + timer (comparación serializada evita re-renders)
  useEffect(() => {
    const serialized = JSON.stringify(value);
    if (serialized === prevSerializedRef.current) return;
    prevSerializedRef.current = serialized;
    pendingRef.current = value;
    setStatus('pending');
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
    return () => {
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
  };
}
