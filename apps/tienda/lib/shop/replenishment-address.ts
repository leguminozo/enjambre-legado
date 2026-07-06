'use client';

import { REPLENISHMENT_ADDRESS_STORAGE_KEY } from '@/lib/shop/commerce-storage';

export function loadReplenishmentAddress(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REPLENISHMENT_ADDRESS_STORAGE_KEY) ?? '';
}

export function saveReplenishmentAddress(address: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REPLENISHMENT_ADDRESS_STORAGE_KEY, address.trim());
}