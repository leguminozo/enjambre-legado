'use client';

/**
 * Un solo motor de sync de bitácora en el árbol (evita doble listener online
 * entre banner y RecorderVoz).
 */

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { useBitacoraSyncEngine } from '@/hooks/use-bitacora-sync-engine';

type BitacoraSyncContextValue = {
  triggerSync: () => Promise<void> | void
};

const BitacoraSyncContext = createContext<BitacoraSyncContextValue | null>(null);

export function BitacoraSyncProvider({ children }: { children: ReactNode }) {
  const engine = useBitacoraSyncEngine();
  return (
    <BitacoraSyncContext.Provider value={{ triggerSync: engine.triggerSync }}>
      {children}
    </BitacoraSyncContext.Provider>
  );
}

export function useBitacoraSync(): BitacoraSyncContextValue {
  const ctx = useContext(BitacoraSyncContext);
  if (!ctx) {
    // Fuera del provider: no silenciar del todo — log en dev
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[bitacora-sync] useBitacoraSync fuera de BitacoraSyncProvider — triggerSync no-op',
      );
    }
    return { triggerSync: async () => {} };
  }
  return ctx;
}
