'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Lock, Loader2, Check } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface FilaLibro {
  id: string;
  fecha: string;
  detalle: string;
  neto: number | null;
  iva: number | null;
  total: number | null;
  fuente: string;
}

interface Periodo {
  id: string;
  anio: number;
  mes: number;
  estado: 'abierto' | 'cerrado';
}

function formatCLP(v: number | null): string {
  if (v == null) return '—';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const FUENTE_LABEL: Record<string, string> = {
  dte: 'DTE',
  operacion: 'Venta',
  gasto: 'Gasto',
  boleta_sii: 'Boleta SII',
};

/** Libro de compras/ventas mensual + cierre de período. */
export function LibrosView() {
  const apiFetch = useApiFetch();
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [tipo, setTipo] = useState<'ventas' | 'compras'>('ventas');
  const [filas, setFilas] = useState<FilaLibro[]>([]);
  const [totales, setTotales] = useState<{ neto: number; iva: number; total: number } | null>(null);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [libroRes, periodosRes] = await Promise.all([
        apiFetch(`/api/contable/libro?tipo=${tipo}&anio=${anio}&mes=${mes}`),
        apiFetch(`/api/contable/periodos?anio=${anio}`),
      ]);
      if (libroRes.ok) {
        const j = await libroRes.json();
        setFilas(j.data?.filas ?? []);
        setTotales(j.data?.totales ?? null);
      }
      if (periodosRes.ok) {
        const j = await periodosRes.json();
        setPeriodos(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch, tipo, anio, mes]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const cerrarPeriodo = async () => {
    setCerrando(true);
    setMensaje(null);
    try {
      const res = await apiFetch('/api/contable/periodos/cerrar', {
        method: 'POST',
        body: JSON.stringify({ anio, mes }),
      });
      if (res.ok) {
        setMensaje(`Período ${MESES[mes - 1]} ${anio} cerrado ✓`);
        await cargar();
      } else {
        const j = await res.json().catch(() => null);
        setMensaje(j?.message ?? 'Error al cerrar período');
      }
    } catch {
      setMensaje('Error de red al cerrar período');
    } finally {
      setCerrando(false);
    }
  };

  const periodoActual = periodos.find((p) => p.mes === mes);
  const cerrado = periodoActual?.estado === 'cerrado';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-accent" />
          <span className="section-title text-foreground">Libro Contable</span>
        </div>
        <div className="flex gap-1 ml-auto">
          {(['ventas', 'compras'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                tipo === t ? 'bg-accent text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'ventas' ? 'Libro de Ventas' : 'Libro de Compras'}
            </button>
          ))}
        </div>
        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="bg-background border border-border rounded px-2 py-1.5 text-sm">
          {[hoy.getFullYear(), hoy.getFullYear() - 1, hoy.getFullYear() - 2].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="bg-background border border-border rounded px-2 py-1.5 text-sm">
          {MESES.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <span className={`text-xs px-2 py-1 rounded-full ${cerrado ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
          {cerrado ? 'Período cerrado' : 'Período abierto'}
        </span>
      </div>

      {mensaje && (
        <p className={`text-sm ${mensaje.includes('✓') ? 'text-success' : 'text-destructive'}`}>{mensaje}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando libro…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 border border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Neto</div>
              <div className="font-datos text-lg text-foreground">{formatCLP(totales?.neto ?? 0)}</div>
            </div>
            <div className="card p-3 border border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">IVA</div>
              <div className="font-datos text-lg text-foreground">{formatCLP(totales?.iva ?? 0)}</div>
            </div>
            <div className="card p-3 border border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
              <div className="font-datos text-lg text-accent">{formatCLP(totales?.total ?? 0)}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Detalle</th>
                  <th className="py-2 pr-3">Fuente</th>
                  <th className="py-2 pr-3 text-right">Neto</th>
                  <th className="py-2 pr-3 text-right">IVA</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground text-sm">
                      Sin movimientos en {MESES[mes - 1]} {anio}.
                    </td>
                  </tr>
                ) : (
                  filas.map((f) => (
                    <tr key={f.id} className="border-b border-border/40">
                      <td className="py-2 pr-3 font-datos text-xs text-muted-foreground">{f.fecha.slice(0, 10)}</td>
                      <td className="py-2 pr-3 text-foreground">{f.detalle}</td>
                      <td className="py-2 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">
                          {FUENTE_LABEL[f.fuente] ?? f.fuente}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right font-datos">{formatCLP(f.neto)}</td>
                      <td className="py-2 pr-3 text-right font-datos">{formatCLP(f.iva)}</td>
                      <td className="py-2 text-right font-datos">{formatCLP(f.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={cerrado || cerrando}
              onClick={() => void cerrarPeriodo()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-40 text-sm"
            >
              {cerrando ? <Loader2 size={16} className="animate-spin" /> : cerrado ? <Check size={16} /> : <Lock size={16} />}
              {cerrado ? 'Período cerrado' : `Cerrar período ${MESES[mes - 1]} ${anio}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
