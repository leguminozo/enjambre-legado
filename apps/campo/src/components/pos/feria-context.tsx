'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@enjambre/auth';

export type FeriaConsignacion = {
  id: string;
  producto_id: string;
  cantidad_entregada: number;
  cantidad_vendida: number;
  cantidad_devuelta: number;
  pendiente: number;
  productos?: { nombre: string | null } | null;
};

export type FeriaEvento = {
  id: string;
  nombre_evento: string;
  ubicacion: string | null;
  fecha_inicio: string | null;
  estado: string;
};

export type FeriaContrato = {
  id: string;
  tipo: string;
  comision_base_pct: number;
  score_confianza: number;
  bono_puntualidad_clp: number;
  estado: string;
};

type FeriaContextValue = {
  loading: boolean;
  active: boolean;
  contrato: FeriaContrato | null;
  evento: FeriaEvento | null;
  consignaciones: FeriaConsignacion[];
  pendienteFor: (productoId: string) => number;
  refresh: () => Promise<void>;
};

const FeriaContext = createContext<FeriaContextValue | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_NUCLEO_API_URL || '';

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error ${res.status}`);
  }
  return res.json();
}

export function FeriaProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [contrato, setContrato] = useState<FeriaContrato | null>(null);
  const [evento, setEvento] = useState<FeriaEvento | null>(null);
  const [consignaciones, setConsignaciones] = useState<FeriaConsignacion[]>([]);

  const authSession = useAuthStore((s) => s.session);
  const token = authSession?.access_token ?? null;

  const refresh = useCallback(async () => {
    if (!token) {
      setActive(false);
      setContrato(null);
      setEvento(null);
      setConsignaciones([]);
      setLoading(false);
      return;
    }

    try {
      if (!navigator.onLine) {
        const { db } = await import('@/lib/offline/db');
        const cached = await db.feria_context.get('current');
        if (cached) {
          setActive(cached.active);
          setContrato(null);
          setEvento(cached.evento as FeriaEvento | null);
          setConsignaciones(cached.consignaciones as FeriaConsignacion[]);
          return;
        }
      }

      const res = await apiFetch('/rep-ventas/feria-context', token);
      const data = res.data ?? {};
      setActive(Boolean(data.active));
      setContrato(data.contrato ?? null);
      setEvento(data.evento ?? null);
      setConsignaciones((data.consignaciones ?? []) as FeriaConsignacion[]);

      const { db } = await import('@/lib/offline/db');
      await db.feria_context.put({
        id: 'current',
        active: Boolean(data.active),
        evento: data.evento ?? null,
        consignaciones: (data.consignaciones ?? []) as FeriaConsignacion[],
        updated_at: Date.now(),
      });
    } catch (err) {
      console.error('[FeriaProvider] refresh failed:', err);
      try {
        const { db } = await import('@/lib/offline/db');
        const cached = await db.feria_context.get('current');
        if (cached) {
          setActive(cached.active);
          setEvento(cached.evento as FeriaEvento | null);
          setConsignaciones(cached.consignaciones as FeriaConsignacion[]);
          return;
        }
      } catch {
        // ignore cache read errors
      }
      setActive(false);
      setContrato(null);
      setEvento(null);
      setConsignaciones([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendienteMap = useMemo(
    () => new Map(consignaciones.map((c) => [c.producto_id, c.pendiente])),
    [consignaciones],
  );

  const pendienteFor = useCallback(
    (productoId: string) => pendienteMap.get(productoId) ?? 0,
    [pendienteMap],
  );

  const value = useMemo(
    () => ({
      loading,
      active,
      contrato,
      evento,
      consignaciones,
      pendienteFor,
      refresh,
    }),
    [loading, active, contrato, evento, consignaciones, pendienteFor, refresh],
  );

  return <FeriaContext.Provider value={value}>{children}</FeriaContext.Provider>;
}

export function useFeriaContext() {
  const ctx = useContext(FeriaContext);
  if (!ctx) throw new Error('useFeriaContext dentro de FeriaProvider');
  return ctx;
}

export type ConsignacionIssue = {
  producto_id: string;
  nombre: string;
  solicitado: number;
  pendiente: number;
  tipo: 'sin_consignacion' | 'stock_insuficiente';
};

export function getConsignacionIssues(
  lines: Array<{ producto_id: string; nombre: string; cantidad: number }>,
  consignaciones: FeriaConsignacion[],
  opts: { channel: string; eventoActivo: boolean },
): ConsignacionIssue[] {
  if (opts.channel !== 'feria' || !opts.eventoActivo) return [];

  const map = new Map(consignaciones.map((c) => [c.producto_id, c]));
  const issues: ConsignacionIssue[] = [];

  for (const line of lines) {
    const cons = map.get(line.producto_id);
    if (!cons) {
      issues.push({
        producto_id: line.producto_id,
        nombre: line.nombre,
        solicitado: line.cantidad,
        pendiente: 0,
        tipo: 'sin_consignacion',
      });
      continue;
    }
    if (line.cantidad > cons.pendiente) {
      issues.push({
        producto_id: line.producto_id,
        nombre: line.nombre,
        solicitado: line.cantidad,
        pendiente: cons.pendiente,
        tipo: 'stock_insuficiente',
      });
    }
  }

  return issues;
}