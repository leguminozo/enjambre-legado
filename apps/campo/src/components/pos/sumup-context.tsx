'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@enjambre/auth';
import type { SumUpReader, SumUpCheckout, TerminalFlowStep, TerminalFlowResult, SumupMode } from './types';

interface SumUpContextValue {
  readers: SumUpReader[];
  readersLoading: boolean;
  readersError: string | null;
  fetchReaders: () => Promise<void>;
  startReaderCheckout: (
    readerId: string,
    amount: number,
    checkoutReference: string,
    description?: string,
  ) => Promise<{ checkoutId: string | null; alreadyPaid?: boolean; error?: string }>;
  pollCheckoutStatus: (checkoutId: string) => Promise<SumUpCheckout | null>;
  cancelReaderCheckout: (readerId: string) => Promise<boolean>;
  terminalStep: TerminalFlowStep;
  setTerminalStep: (step: TerminalFlowStep) => void;
  activeCheckoutId: string | null;
  activeReaderId: string | null;
  terminalResult: TerminalFlowResult | null;
  lastCheckoutError: string | null;
  sumupMode: SumupMode;
  setSumupMode: (mode: SumupMode) => void;
}

const SumUpContext = createContext<SumUpContextValue | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';

type SumupApiError = Error & {
  status?: number;
  code?: string;
  data?: Record<string, unknown>;
};

async function sumupFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}/api/sumup${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (body as { message?: string }).message || `SumUp API error ${res.status}`,
    ) as SumupApiError;
    err.status = res.status;
    err.code = (body as { code?: string }).code;
    err.data = (body as { data?: Record<string, unknown> }).data;
    throw err;
  }
  return body;
}

export function SumUpProvider({ children }: { children: React.ReactNode }) {
  const [readers, setReaders] = useState<SumUpReader[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [readersError, setReadersError] = useState<string | null>(null);
  const [terminalStep, setTerminalStep] = useState<TerminalFlowStep>('idle');
  const [activeCheckoutId, setActiveCheckoutId] = useState<string | null>(null);
  const [activeReaderId, setActiveReaderId] = useState<string | null>(null);
  const [terminalResult, setTerminalResult] = useState<TerminalFlowResult | null>(null);
  const [lastCheckoutError, setLastCheckoutError] = useState<string | null>(null);
  const [sumupMode, setSumupModeState] = useState<SumupMode>('connected');

  useEffect(() => {
    const savedMode = localStorage.getItem('sumup_mode') as SumupMode;
    if (savedMode === 'connected' || savedMode === 'manual') {
      setSumupModeState(savedMode);
    }
  }, []);

  const setSumupMode = useCallback((mode: SumupMode) => {
    setSumupModeState(mode);
    localStorage.setItem('sumup_mode', mode);
  }, []);

  const authSession = useAuthStore((s) => s.session);
  const token = authSession?.access_token ?? null;

  const fetchReaders = useCallback(async () => {
    if (!token) return;
    setReadersLoading(true);
    setReadersError(null);
    try {
      const res = await sumupFetch('/readers', token);
      setReaders(res.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener terminales';
      setReadersError(message);
      setReaders([]);
    } finally {
      setReadersLoading(false);
    }
  }, [token]);

  const startReaderCheckout = useCallback(async (
    readerId: string,
    amount: number,
    checkoutReference: string,
    description?: string,
  ): Promise<{ checkoutId: string | null; alreadyPaid?: boolean; error?: string }> => {
    if (!token) return { checkoutId: null, error: 'Sin sesión' };
    setLastCheckoutError(null);
    try {
      setActiveReaderId(readerId);
      const res = await sumupFetch('/readers/checkout', token, {
        method: 'POST',
        body: JSON.stringify({
          reader_id: readerId,
          amount,
          currency: 'CLP',
          checkout_reference: checkoutReference,
          description,
        }),
      });
      const checkoutId = res.data?.checkout_id ?? null;
      if (checkoutId) {
        setActiveCheckoutId(checkoutId);
      }
      return { checkoutId };
    } catch (err) {
      const e = err as SumupApiError;
      // Idempotent paid: complete sale without re-pushing terminal
      if (e.code === 'already_paid' && e.data?.checkout_id) {
        const checkoutId = String(e.data.checkout_id);
        setActiveCheckoutId(checkoutId);
        setTerminalResult({
          checkout_id: checkoutId,
          status: 'PAID',
        });
        return { checkoutId, alreadyPaid: true };
      }
      const message = e.message || 'Error al enviar cobro al terminal';
      console.error('[SumUpProvider] startReaderCheckout failed:', message);
      setLastCheckoutError(message);
      return { checkoutId: null, error: message };
    }
  }, [token]);

  const pollCheckoutStatus = useCallback(async (checkoutId: string): Promise<SumUpCheckout | null> => {
    if (!token) return null;
    try {
      const res = await sumupFetch(`/readers/checkout/${checkoutId}`, token);
      const checkout: SumUpCheckout = res.data;
      return checkout;
    } catch (err) {
      console.error('[SumUpProvider] pollCheckoutStatus failed:', err);
      return null;
    }
  }, [token]);

  const cancelReaderCheckout = useCallback(async (readerId: string): Promise<boolean> => {
    if (!token) return false;
    try {
      await sumupFetch(`/readers/checkout/${readerId}`, token, { method: 'DELETE' });
      setActiveCheckoutId(null);
      setActiveReaderId(null);
      return true;
    } catch (err) {
      console.error('[SumUpProvider] cancelReaderCheckout failed:', err);
      return false;
    }
  }, [token]);

  const value = useMemo(
    () => ({
      readers,
      readersLoading,
      readersError,
      fetchReaders,
      startReaderCheckout,
      pollCheckoutStatus,
      cancelReaderCheckout,
      terminalStep,
      setTerminalStep,
      activeCheckoutId,
      activeReaderId,
      terminalResult,
      lastCheckoutError,
      sumupMode,
      setSumupMode,
    }),
    [
      readers,
      readersLoading,
      readersError,
      fetchReaders,
      startReaderCheckout,
      pollCheckoutStatus,
      cancelReaderCheckout,
      terminalStep,
      activeCheckoutId,
      activeReaderId,
      terminalResult,
      lastCheckoutError,
      sumupMode,
      setSumupMode,
    ],
  );

  return <SumUpContext.Provider value={value}>{children}</SumUpContext.Provider>;
}

export function useSumUp() {
  const ctx = useContext(SumUpContext);
  if (!ctx) throw new Error('useSumUp debe usarse dentro de SumUpProvider');
  return ctx;
}
