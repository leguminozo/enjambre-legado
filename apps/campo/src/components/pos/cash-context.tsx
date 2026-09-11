'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { getNucleoApiUrl } from '@/lib/public-urls';
import { db } from '@/lib/offline/db';

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
  qr_codes?: string[];
}

interface QuickSaleResult {
  id: string;
  total: number;
  metodo_pago: string;
  channel: string;
  created_at: string;
  rep_commission_total: number;
  claim_token?: string | null;
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
  createClient: (data: { name: string; telefono?: string; email?: string }) => Promise<ClienteResult>;
  openSession: (openingCash: number) => Promise<void>;
  closeSession: (closingCashCounted: number, notas?: string) => Promise<Record<string, unknown> | null>;
  refreshStatus: () => Promise<void>;
  quickSale: (productoId: string, cantidad: number, metodoPago: string, channel?: string, sumupFields?: { sumup_checkout_id?: string; sumup_transaction_id?: string }) => Promise<QuickSaleResult | null>;
  cartSale: (
    items: CartItem[],
    metodoPago: string,
    channel?: string,
    sumupFields?: { sumup_checkout_id?: string; sumup_transaction_id?: string },
    discount?: { descuento_pct?: number; descuento_clp?: number },
    /** Identidad del cliente final del microcanal (tarjeta QR / email / whatsapp). */
    fidIdentidad?: string,
  ) => Promise<QuickSaleResult | null>;
};

const CashContext = createContext<CashContextValue | null>(null);

const API_BASE = getNucleoApiUrl();

async function validateOfflineFeriaBeforeQueue(
  payload: Record<string, unknown>,
): Promise<void> {
  const channel = (payload.channel as string | undefined) ?? 'feria';
  if (channel !== 'feria') return;

  const { extractSaleItemsFromPayload, validateOfflineFeriaSale, decrementOfflineFeriaStock } = await import('@/lib/offline/feria-offline');

  const snapshot = await db.feria_context.get('current');
  if (!snapshot) return;

  const items = extractSaleItemsFromPayload(payload);
  const snapForValidation = {
    active: snapshot.active,
    evento: snapshot.evento,
    consignaciones: snapshot.consignaciones,
    updated_at: snapshot.updated_at,
  };

  const check = validateOfflineFeriaSale(items, channel, snapForValidation);

  if (!check.ok) {
    throw new Error(check.message ?? 'Stock consignado insuficiente para venta offline');
  }

  // Optimistic stock deduction in local DB
  const updatedSnapshot = decrementOfflineFeriaStock(items, snapForValidation);
  await db.feria_context.put({
    id: 'current',
    active: updatedSnapshot.active,
    evento: updatedSnapshot.evento,
    consignaciones: updatedSnapshot.consignaciones,
    updated_at: Date.now(),
  });
}

function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ApiFetchError extends Error {
  status?: number;
  code?: string;
}

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
    const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string; error?: string };
    const err = new Error(body.message || body.error || `API error ${res.status}`) as ApiFetchError;
    err.status = res.status;
    err.code = body.code;
    throw err;
  }
  return res.json();
}

const CASH_SESSION_STORAGE_KEY = 'enjambre_campo_active_cash_session';

export function CashProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CashSession | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CASH_SESSION_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CashSession;
          if (parsed && parsed.session_status === 'open') return parsed;
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  });
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
      const activeSession = activeRes.data ?? null;
      setSession(activeSession);
      if (typeof window !== 'undefined') {
        if (activeSession) {
          localStorage.setItem(CASH_SESSION_STORAGE_KEY, JSON.stringify(activeSession));
        } else {
          localStorage.removeItem(CASH_SESSION_STORAGE_KEY);
        }
      }
      if (statusRes.data) {
        setTodayCommissions(statusRes.data.today.commissions);
        setTodaySales(statusRes.data.today.sales_count);
        setTodayRevenue(statusRes.data.today.revenue);
      }
    } catch (err) {
      console.warn('[CashProvider] refreshStatus fallback to cached session if offline:', err);
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(CASH_SESSION_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as CashSession;
            if (parsed && parsed.session_status === 'open') {
              setSession(parsed);
            }
          }
        } catch {
          /* ignore */
        }
      }
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
    if (typeof window !== 'undefined' && res.data) {
      localStorage.setItem(CASH_SESSION_STORAGE_KEY, JSON.stringify(res.data));
    }
    return res.data;
  }, [token]);

  const closeSession = useCallback(async (closingCashCounted: number, notas?: string) => {
    if (!token || !session) throw new Error('Sin sesión');
    const res = await apiFetch(`/cash-sessions/${session.id}/close`, token, {
      method: 'POST',
      body: JSON.stringify({ closing_cash_counted: closingCashCounted, notas }),
    });
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CASH_SESSION_STORAGE_KEY);
    }
    setTodayCommissions(0);
    setTodaySales(0);
    setTodayRevenue(0);
    setNextThreshold(null);
    setLastCommission(null);
    return res.summary ?? null;
  }, [token, session]);

  const quickSale = useCallback(async (productoId: string, cantidad: number, metodoPago: string, channel?: string, sumupFields?: { sumup_checkout_id?: string; sumup_transaction_id?: string }) => {
    if (!token || !session) throw new Error('Sin sesion abierta');
    const client_request_id = safeRandomUUID();
    const payload = {
      cash_session_id: session.id,
      producto_id: productoId,
      cantidad,
      metodo_pago: metodoPago,
      channel,
      tercero_id: selectedClient?.id ?? undefined,
      is_new_client: isNewClient,
      client_request_id,
      sumup_checkout_id: sumupFields?.sumup_checkout_id,
      sumup_transaction_id: sumupFields?.sumup_transaction_id,
    };

    if (!navigator.onLine) {
      await validateOfflineFeriaBeforeQueue(payload);
      await db.sync_queue.add({
        payload,
        status: 'pending',
        created_at: Date.now(),
      });
      await db.productos
        .where('id')
        .equals(productoId)
        .modify((p) => {
          p.stock = Math.max(0, (p.stock ?? 0) - cantidad);
        });
      // Optimistic increment
      setTodaySales((prev) => prev + 1);
      setSelectedClient(null);
      setIsNewClient(false);
      return {
        id: `offline-${Date.now()}`,
        total: 0,
        metodo_pago: metodoPago,
        channel: channel || '',
        created_at: new Date().toISOString(),
        rep_commission_total: 0,
        claim_token: null,
      };
    }

    try {
      const res = await apiFetch('/rep-ventas/quick', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTodayCommissions(res.meta.accumulated_commission);
      setTodayRevenue(res.meta.day_total);
      setTodaySales((prev) => prev + 1);
      setNextThreshold(res.meta.next_threshold);
      setLastCommission(res.meta.commission ?? null);
      setSelectedClient(null);
      setIsNewClient(false);
      return {
        ...res.data,
        claim_token: res.data?.claim_token ?? null,
        commission: res.meta.commission ?? undefined,
        rep_commission_total: Number(res.data?.rep_commission_total ?? res.meta?.commission?.total ?? 0),
      };
    } catch (err: unknown) {
      const apiErr = err as ApiFetchError;
      // Ante fallo ambiguo de red o timeout en vuelo, asegurar la venta encolándola offline
      if (!navigator.onLine || !apiErr?.status || apiErr.status >= 500) {
        await validateOfflineFeriaBeforeQueue(payload);
        const { db } = await import('@/lib/offline/db');
        await db.sync_queue.add({
          payload,
          status: 'pending',
          created_at: Date.now(),
        });
        setTodaySales((prev) => prev + 1);
        setSelectedClient(null);
        setIsNewClient(false);
        return {
          id: `offline-${Date.now()}`,
          total: 0,
          metodo_pago: metodoPago,
          channel: channel || '',
          created_at: new Date().toISOString(),
          rep_commission_total: 0,
          claim_token: null,
        };
      }
      throw err;
    }
  }, [token, session, selectedClient, isNewClient]);

  const cartSale = useCallback(async (
    items: CartItem[],
    metodoPago: string,
    channel?: string,
    sumupFields?: { sumup_checkout_id?: string; sumup_transaction_id?: string },
    discount?: { descuento_pct?: number; descuento_clp?: number },
    fidIdentidad?: string,
  ) => {
    if (!token || !session) throw new Error('Sin sesion abierta');
    const client_request_id = safeRandomUUID();
    const payload = {
      cash_session_id: session.id,
      producto_id: items[0]?.producto_id ?? '',
      cantidad: 1,
      metodo_pago: metodoPago,
      channel,
      tercero_id: selectedClient?.id ?? undefined,
      is_new_client: isNewClient,
      client_request_id,
      fid_identidad: fidIdentidad || undefined,
      items_override: items,
      sumup_checkout_id: sumupFields?.sumup_checkout_id,
      sumup_transaction_id: sumupFields?.sumup_transaction_id,
      ...(discount?.descuento_pct != null && discount.descuento_pct > 0
        ? { descuento_pct: discount.descuento_pct }
        : {}),
      ...(discount?.descuento_clp != null && discount.descuento_clp > 0
        ? { descuento_clp: discount.descuento_clp }
        : {}),
    };

    if (!navigator.onLine) {
      await validateOfflineFeriaBeforeQueue(payload);
      const { db } = await import('@/lib/offline/db');
      await db.sync_queue.add({
        payload,
        status: 'pending',
        created_at: Date.now(),
      });
      for (const item of items) {
        await db.productos
          .where('id')
          .equals(item.producto_id)
          .modify((p) => {
            p.stock = Math.max(0, (p.stock ?? 0) - item.cantidad);
          });
      }
      setTodaySales((prev) => prev + items.length);
      setSelectedClient(null);
      setIsNewClient(false);
      return {
        id: `offline-${Date.now()}`,
        total: 0,
        metodo_pago: metodoPago,
        channel: channel || '',
        created_at: new Date().toISOString(),
        rep_commission_total: 0,
        claim_token: null,
      };
    }

    try {
      const res = await apiFetch('/rep-ventas/quick', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTodayCommissions(res.meta.accumulated_commission);
      setTodayRevenue(res.meta.day_total);
      setTodaySales((prev) => prev + items.length);
      setNextThreshold(res.meta.next_threshold);
      setLastCommission(res.meta.commission ?? null);
      setSelectedClient(null);
      setIsNewClient(false);
      return {
        ...res.data,
        claim_token: res.data?.claim_token ?? null,
        commission: res.meta.commission ?? undefined,
        rep_commission_total: Number(res.data?.rep_commission_total ?? res.meta?.commission?.total ?? 0),
      };
    } catch (err: unknown) {
      const apiErr = err as ApiFetchError;
      // Ante fallo ambiguo de red o timeout en vuelo, asegurar la venta encolándola offline
      if (!navigator.onLine || !apiErr?.status || apiErr.status >= 500) {
        await validateOfflineFeriaBeforeQueue(payload);
        const { db } = await import('@/lib/offline/db');
        await db.sync_queue.add({
          payload,
          status: 'pending',
          created_at: Date.now(),
        });
        setTodaySales((prev) => prev + items.length);
        setSelectedClient(null);
        setIsNewClient(false);
        return {
          id: `offline-${Date.now()}`,
          total: 0,
          metodo_pago: metodoPago,
          channel: channel || '',
          created_at: new Date().toISOString(),
          rep_commission_total: 0,
          claim_token: null,
        };
      }
      throw err;
    }
  }, [token, session, selectedClient, isNewClient]);

  const searchClients = useCallback(async (query: string): Promise<ClienteResult[]> => {
    if (!token || query.length < 2) return [];
    try {
      // 1. Consultar clientes en CRM de Núcleo (registrados por reps/feria)
      try {
        const crmRes = await apiFetch(`/crm/clientes?q=${encodeURIComponent(query)}`, token);
        const crmData = crmRes?.data;
        if (Array.isArray(crmData) && crmData.length > 0) {
          return crmData.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            full_name: (c.name as string) ?? null,
            email: (c.email as string | null) ?? null,
            phone: (c.telefono as string | null) ?? null,
            purchase_count: c.total_spent ? 1 : 0,
          }));
        }
      } catch {
        // Continuar a fallback de terceros
      }

      // 2. Fallback a terceros (clientes con RUT / contables)
      const data = await apiFetch(`/terceros?tipo=cliente&search=${encodeURIComponent(query)}`, token);
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

  const createClient = useCallback(
    async (data: { name: string; telefono?: string; email?: string }): Promise<ClienteResult> => {
      if (!token) throw new Error('No autenticado');
      const res = await apiFetch('/crm/clientes', token, {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          telefono: data.telefono?.trim() || null,
          email: data.email?.trim() || null,
          type: 'Particular',
          fuente: 'feria',
          status: 'activo',
        }),
      });
      const c = res.data ?? res;
      const result: ClienteResult = {
        id: c.id,
        full_name: c.name ?? null,
        email: c.email ?? null,
        phone: c.telefono ?? null,
        purchase_count: 0,
      };
      setSelectedClient(result);
      setIsNewClient(false);
      return result;
    },
    [token],
  );

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
      createClient,
      openSession,
      closeSession,
      refreshStatus,
      quickSale,
      cartSale,
    }),
    [session, loading, todayCommissions, todaySales, todayRevenue, nextThreshold, lastCommission, selectedClient, isNewClient, searchClients, createClient, openSession, closeSession, refreshStatus, quickSale, cartSale],
  );

  return <CashContext.Provider value={value}>{children}</CashContext.Provider>;
}

export function useCashSession() {
  const ctx = useContext(CashContext);
  if (!ctx) throw new Error('useCashSession dentro de CashProvider');
  return ctx;
}

export function useOptionalCashSession(): CashContextValue | null {
  return useContext(CashContext);
}
