'use client';

import { useSyncExternalStore } from 'react';
import { detectPwaStandalone, subscribePwaStandalone } from '@/lib/pwa/standalone';

export function usePwaStandalone(): boolean {
  return useSyncExternalStore(
    subscribePwaStandalone,
    detectPwaStandalone,
    () => false,
  );
}