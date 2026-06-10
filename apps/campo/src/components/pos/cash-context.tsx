'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@enjambre/auth';

interface CashSession {
  id: string;
  opened_at: string;
  opening_cash: number;
  session_status: string;
}

interface CommissionDetail {
  base: number;
  volume_multiplier: number;
  loyalty_bonus: number;
  streak_bonus: number;
  tier_multiplier: number;
  channel_rate: number | null;
  total: number;
}

interface CommissionMeta {
  accumulated_commission: number;
  day_total: number;
  next_threshold: { threshold: number; multiplier: number } | null;
  commission: CommissionDetail | null;
}

interface CartItem {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

interface QuickSaleResult {
  id: string;
  total: number;
  metodo_pago: string;
  channel: string;
  created_at: string;
  rep_commission_total: number;
  commission?: CommissionDetail;
}

interface ClienteResult {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  purchase_count: number;
}

type CashContextValue = {
  session: CashSession | null;
  loading: boolean;
  todayCommissions: number;
  todaySales: number;
  todayRevenue: number;
  nextThreshold: { threshold: number; multiplier: number } | null;
  lastCommission: CommissionDetail | null;
  selectedClient: ClienteResult | null;
  isNewClient: boolean;
  setSelectedClient: (client: ClienteResult | null) => void;
  setIsNewClient: (val: boolean) => void;
  searchClients: (query: string) => Promise<ClienteResult[]>;
  openSession: (openingCash: number) => Promise<void>;
  closeSession: (closingCashCounted: number, notas?: string) => Promise<Record<string, unknown> | null>;
  refreshStatus: () => Promise<void>;
  quickSale: (productoId: string, cantidad: number, metodoPago: string, channel?: string, sumupFields?: { sumup_checkout_id?: string; sumup_transaction_id?: string }) => Promise<QuickSaleResult | null>;
  cartSale: (items: CartItem[], metodoPago: string, channel?: string, sumupFields?: { sumup_checkout_id?: string; sumup_transaction_id?: string }) => Promise<QuickSaleResult | null>;
};

const CashContext = createContext<CashContextValue | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error ${res.status}`);
  }
  return res.json();
}

export function CashProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayCommissions, setTodayCommissions] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [nextThreshold, setNextThreshold] = useState<{ threshold: number; multiplier: number } | null>(null);
  const [lastCommission, setLastCommission] = useState<CommissionDetail | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClienteResult | null>(null);
  const [isNewClient, setIsNewClient] = useState(false);

  const authSession = useAuthStore((s) => s.session);
  const token = authSession?.access_token ?? null;

  const refreshStatus = useCallback(async () => {
    if (!token) return;
    try {
      const [activeRes, statusRes] = await Promise.all([
        apiFetch('/cash-sessions/active', token),
        apiFetch('/rep-ventas/commission-status', token),
      ]);
      setSession(activeRes.data ?? null);
      if (statusRes.data) {
        setTodayCommissions(statusRes.data.today.commissions);
        setTodaySales(statusRes.data.today.sales_count);
        setTodayRevenue(statusRes.data.today.revenue);
      }
    } catch (err) {
      console.error('[CashProvider] refreshStatus failed:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const openSession = useCallback(async (openingCash: number) => {
    if (!token) throw new Error('No autenticado');
    const res = await apiFetch('/cash-sessions', token, {
      method: 'POST',
      body: JSON.stringify({ opening_cash: openingCash }),
    });
    setSession(res.data);
    return res.data;
  }, [token]);

  const closeSession = useCallback(async (closingCashCounted: number, notas?: string) => {
    if (!token || !session) throw new Error('Sin sesión');
    const res = await apiFetch(`/cash-sessions/${session.id}/close`, token, {
      method: 'POST',
      body: JSON.stringify({ closing_cash_counted: closingCashCounted, notas }),
    });
    setSession(null);
    setTodayCommissions(0);
    setTodaySales(0);
    setTodayRevenue(0);
    setNextThreshold(null);
    setLastCommission(null);
    return res.summary ?? null;
  }, [token, session]);

  const quickSale = useCallback(async (productoId: string, cantidad: number, metodoPago: string, channel?: string, sumupFields?: { sumup_checkout_id?: string; sumup_transaction_id?: string }) => {
    if (!token || !session) throw new Error('Sin sesion abierta');
    const res = await apiFetch('/rep-ventas/quick', token, {
      method: 'POST',
      body: JSON.stringify({
        cash_session_id: session.id,
        producto_id: productoId,
        cantidad,
        metodo_pago: metodoPago,
        channel,
        cliente_id: selectedClient?.id ?? undefined,
        is_new_client: isNewClient,
        sumup_checkout_id: sumupFields?.sumup_checkout_id,
        sumup_transaction_id: sumupFields?.sumup_transaction_id,
      }),
    });
    setTodayCommissions(res.meta.accumulated_commission);
    setTodayRevenue(res.meta.day_total);
    setTodaySales((prev) => prev + 1);
    setNextThreshold(res.meta.next_threshold);
    setLastCommission(res.meta.commission ?? null);
    return { ...res.data, commission: res.meta.commission ?? undefined };
  }, [token, session, selectedClient, isNewClient]);

  const cartSale = useCallback(async (items: CartItem[], metodoPago: string, channel?: string, sumupFields?: { sumup_checkout_id?: string; sumup_transaction_id?: string }) => {
    if (!token || !session) throw new Error('Sin sesion abierta');
    const res = await apiFetch('/rep-ventas/quick', token, {
      method: 'POST',
      body: JSON.stringify({
        cash_session_id: session.id,
        producto_id: items[0]?.producto_id ?? '',
        cantidad: 1,
        metodo_pago: metodoPago,
        channel,
        cliente_id: selectedClient?.id ?? undefined,
        is_new_client: isNewClient,
        items_override: items,
        sumup_checkout_id: sumupFields?.sumup_checkout_id,
        sumup_transaction_id: sumupFields?.sumup_transaction_id,
      }),
    });
    setTodayCommissions(res.meta.accumulated_commission);
    setTodayRevenue(res.meta.day_total);
    setTodaySales((prev) => prev + 1);
    setNextThreshold(res.meta.next_threshold);
    setLastCommission(res.meta.commission ?? null);
    return { ...res.data, commission: res.meta.commission ?? undefined };
  }, [token, session, selectedClient, isNewClient]);

  const searchClients = useCallback(async (query: string): Promise<ClienteResult[]> => {
    if (!token || query.length < 2) return [];
    try {
      const data = await apiFetch(`/terceros?tipo=Cliente&search=${encodeURIComponent(query)}`, token);
      const results = Array.isArray(data) ? data : [];
      return results.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        full_name: (p.nombre as string) ?? null,
        email: (p.email as string | null) ?? null,
        phone: (p.telefono as string | null) ?? null,
        purchase_count: 0,
      }));
    } catch (err) {
      console.error('[CashProvider] searchClients failed:', err);
      return [];
    }
  }, [token]);

  const value = useMemo(
    () => ({
      session,
      loading,
      todayCommissions,
      todaySales,
      todayRevenue,
      nextThreshold,
      lastCommission,
      selectedClient,
      isNewClient,
      setSelectedClient,
      setIsNewClient,
      searchClients,
      openSession,
      closeSession,
      refreshStatus,
      quickSale,
      cartSale,
    }),
    [session, loading, todayCommissions, todaySales, todayRevenue, nextThreshold, lastCommission, selectedClient, isNewClient, searchClients, openSession, closeSession, refreshStatus, quickSale, cartSale],
  );

  return <CashContext.Provider value={value}>{children}</CashContext.Provider>;
}

export function useCashSession() {
  const ctx = useContext(CashContext);
  if (!ctx) throw new Error('useCashSession dentro de CashProvider');
  return ctx;
}
