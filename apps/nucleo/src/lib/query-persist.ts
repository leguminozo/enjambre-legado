'use client';

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const SENSITIVE_ROOTS = new Set(['auth', 'session', 'security', 'profile', 'checkout']);

export function createNucleoPersister() {
  if (typeof window === 'undefined') return undefined;
  return createSyncStoragePersister({
    storage: window.sessionStorage,
    key: 'nucleo:react-query',
  });
}

/** Evita persistir queries de auth/seguridad; solo cache exitoso */
export function shouldPersistQuery(query: { queryKey: readonly unknown[]; state: { status: string } }) {
  const root = query.queryKey[0];
  if (typeof root === 'string' && SENSITIVE_ROOTS.has(root)) return false;
  return query.state.status === 'success';
}