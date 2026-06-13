'use client';

import { useSyncEngine } from '@/hooks/use-sync-engine';

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useSyncEngine();
  return <>{children}</>;
}
