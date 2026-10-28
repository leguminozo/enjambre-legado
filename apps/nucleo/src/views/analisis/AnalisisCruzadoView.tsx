'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Percent,
  Download,
  Store,
  Globe,
  Crown,
  Building2,
  RefreshCw,
  Info,
  MapPin,
  Repeat,
  Package,
} from 'lucide-react';
import { formatCLP, HexagonLoader, toast } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface ChannelMetrics {
  canal: string;
  nombre: string;
  descripcion: string;
  transacciones: number;
  ingresoBruto: number;
  ticketPromedio: number;
  comisionEstimada: number;
  comisionPorcentaje: number;
  ingresoNeto: number;
  costoMateriaPrimaEstimado: number;
  margenNetoEstimado: number;
  margenNetoPorcentaje: number;
  topProductos: { nombre: string; unidades: number; total: number }[];
  clientesUnicos: number;
}

interface MonthlyChannelPoint {
  mes: string;
  web: number;
  feria: number;
  club: number;
  b2b: number;
  total: number;
}

interface AnalyticsData {
  global: {
    ingresoTotal: number;
    transaccionesTotales: number;
    comisionesTotales: number;
    margenNetoTotal: number;
    margenPromedioPonderado: number;
    ticketPromedioPonderado: number;
  };
  canales: ChannelMetrics[];
  serieMensual: MonthlyChannelPoint[];
}

interface CohorteRow {
  cohorte: string;
  clientes: number;
  rep30: number;
  rep60: number;
  rep90: number;
}

interface GeoRow {
  ambito: string;
  ventas: number;
  ingreso: number;
}

interface VelocidadRow {
  id: string;
  nombre: string;
  stock: number;
  demanda_30d: number;
  dias_stock_estimado: number;
}

export function AnalisisCruzadoView() {
  const apiFetch = useApiFetch();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [cruce, setCruce] = useState<{ cohortes: CohorteRow[]; regiones: GeoRow[]; comunas: GeoRow[] } | null>(null);
  const [velocidad, setVelocidad] = useState<VelocidadRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resumenRes, cruceRes, prodRes] = await Promise.all([
        apiFetch('/api/analisis-multicanal/resumen'),
        apiFetch('/api/analisis-multicanal/cruce-avanzado'),
        apiFetch('/api/produccion/dashboard'),
      ]);
      if (resumenRes.ok) {
        const json = await resumenRes.json();
        setData(json.data);
      }
      if (cruceRes.ok) {
        const json = await cruceRes.json();
        setCruce(json.data);
      }
      if (prodRes.ok) {
        const json = await prodRes.json();
        const rows = ((json.data?.productos ?? []) as Array<{
          id: string; nombre: string; stock: number | null; demanda_30d: number; dias_stock_estimado: number;
        }>).map((p) => ({
          id: p.id,
          nombre: p.nombre,
          stock: Number(p.stock ?? 0),
          demanda_30d: Number(p.demanda_30d ?? 0),
          dias_stock_estimado: Number(p.dias_stock_estimado ?? 999),
        })).sort((a, b) => a.dias_stock_estimado - b.dias_stock_estimado);
        setVelocidad(rows);
      }
    } catch (err) {
      console.error('[AnalisisCruzado] Error al cargar datos:', err);
      toast.error('No se pudieron cargar los datos del análisis multicanal');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCSV = () => {
    if (!data) return;
    const headers = [
      'Canal',
      'Ingreso Bruto CLP',
      'Transacciones',
      'Ticket Promedio CLP',
      'Comision Estimada CLP',
      'Ingreso Neto CLP',
      'Margen Neto %',
      'Clientes Unicos',
    ];
    const rows = data.canales.map((c) => [
      `"${c.nombre}"`,
      c.ingresoBruto,
      c.transacciones,
      c.ticketPromedio,
      c.comisionEstimada,
      c.ingresoNeto,
      `${c.margenNetoPorcentaje}%`,
      c.clientesUnicos,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analisis_multicanal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChannelIcon = (canal: string) => {
    switch (canal) {
      case 'web':
        return <Globe className="w-5 h-5 text-primary" />;
      case 'feria':
        return <Store className="w-5 h-5 text-warning" />;
      case 'club':
        return <Crown className="w-5 h-5 text-success" />;
      case 'b2b':
        return <Building2 className="w-5 h-5 text-accent-text" />;
      default:
        return <Store className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Finanzas & Comercial"
        title="Análisis Multicanal & Margen Cruzado"
        subtitle="Auditoría de ingresos, absorción de comisiones y rentabilidad neta por canal comercial"
        icon={<TrendingUp size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="btn btn-outline min-h-10 px-3.5 text-xs flex items-center gap-1.5"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={exportCSV}
              disabled={!data || loading}
              className="btn btn-primary min-h-10 px-4 text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Auditoría CSV
            </button>
          </div>
        }
      />

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] gap-3">
          <HexagonLoader size="md" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Consolidando operaciones multicanal...
          </span>
        </div>
      ) : !data ? (
        <div className="card p-8 text-center text-muted-foreground">
          No fue posible cargar las métricas comerciales.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tarjetas Macro / Globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card card-accent p-5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Ingreso Bruto Consolidado
              </span>
              <div className="text-2xl font-mono font-bold text-foreground mt-1">
                {formatCLP(data.global.ingresoTotal)}
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span>{data.global.transaccionesTotales} órdenes registradas</span>
              </div>
            </div>

            <div className="card p-5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Margen Neto Ponderado
              </span>
              <div className="text-2xl font-mono font-bold text-success mt-1">
                {data.global.margenPromedioPonderado}%
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-primary" />
                <span>Utilidad neta: {formatCLP(data.global.margenNetoTotal)}</span>
              </div>
            </div>

            <div className="card p-5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Ticket Promedio Global
              </span>
              <div className="text-2xl font-mono font-bold text-foreground mt-1">
                {formatCLP(data.global.ticketPromedioPonderado)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Ponderado entre los 4 canales
              </div>
            </div>

            <div className="card p-5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Comisiones de Cobro
              </span>
              <div className="text-2xl font-mono font-bold text-destructive mt-1">
                {formatCLP(data.global.comisionesTotales)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Intermediación de pasarelas y POS
              </div>
            </div>
          </div>

          {/* Comparativa Detallada de los 4 Canales */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-foreground">
                Rendimiento Comercial y Absorción por Canal
              </h2>
              <span className="text-xs text-muted-foreground">
                Haz clic en una tarjeta para inspeccionar sus variedades
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {data.canales.map((canal) => {
                const isSelected = selectedCanal === canal.canal;
                const sharePct =
                  data.global.ingresoTotal > 0
                    ? ((canal.ingresoBruto / data.global.ingresoTotal) * 100).toFixed(1)
                    : '0';

                return (
                  <div
                    key={canal.canal}
                    onClick={() => setSelectedCanal(isSelected ? null : canal.canal)}
                    className={`card p-5 cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary shadow-lg bg-surface-raised'
                        : 'border-border hover:border-border-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getChannelIcon(canal.canal)}
                        <span className="font-display font-bold text-sm text-foreground">
                          {canal.nombre}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
                        {sharePct}% del total
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground mb-4 line-clamp-2 min-h-[32px]">
                      {canal.descripcion}
                    </p>

                    <div className="space-y-2.5 pt-3 border-t border-border/50 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Ventas Brutas</span>
                        <span className="font-mono font-bold text-foreground">
                          {formatCLP(canal.ingresoBruto)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Transacciones</span>
                        <span className="font-mono">{canal.transacciones}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Ticket Promedio</span>
                        <span className="font-mono">{formatCLP(canal.ticketPromedio)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Comisión Canal</span>
                        <span className="font-mono text-destructive">
                          -{formatCLP(canal.comisionEstimada)} ({canal.comisionPorcentaje}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-border/40">
                        <span className="font-semibold text-foreground">Margen Neto Real</span>
                        <span className="font-mono font-bold text-success">
                          {canal.margenNetoPorcentaje}% ({formatCLP(canal.margenNetoEstimado)})
                        </span>
                      </div>
                    </div>

                    {/* Variedades destacadas */}
                    {canal.topProductos.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1.5">
                          Variedad Líder
                        </span>
                        <div className="text-[11px] font-medium text-foreground truncate">
                          ✦ {canal.topProductos[0].nombre}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {canal.topProductos[0].unidades} frascos · {formatCLP(canal.topProductos[0].total)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico / Evolución Histórica de los 4 Canales */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg text-foreground">
                  Distribución Temporal por Canal (Últimos Meses)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Evolución del volumen facturado en pesos chilenos
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" /> Web D2C
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" /> Feria POS
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" /> Club
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-text inline-block" /> B2B
                </span>
              </div>
            </div>

            {data.serieMensual.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No hay historial de ventas en los últimos meses.
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const maxTotal = Math.max(...data.serieMensual.map((m) => m.total), 1);
                  return data.serieMensual.map((p) => {
                    const webPct = (p.web / maxTotal) * 100;
                    const feriaPct = (p.feria / maxTotal) * 100;
                    const clubPct = (p.club / maxTotal) * 100;
                    const b2bPct = (p.b2b / maxTotal) * 100;

                    return (
                      <div key={p.mes} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-medium text-foreground">{p.mes}</span>
                          <span className="font-mono text-muted-foreground">{formatCLP(p.total)}</span>
                        </div>
                        <div className="h-4 w-full bg-surface-sunken rounded-full overflow-hidden flex">
                          {p.web > 0 && (
                            <div
                              style={{ width: `${webPct}%` }}
                              className="bg-primary h-full transition-all"
                              title={`Web: ${formatCLP(p.web)}`}
                            />
                          )}
                          {p.feria > 0 && (
                            <div
                              style={{ width: `${feriaPct}%` }}
                              className="bg-warning h-full transition-all"
                              title={`Feria: ${formatCLP(p.feria)}`}
                            />
                          )}
                          {p.club > 0 && (
                            <div
                              style={{ width: `${clubPct}%` }}
                              className="bg-success h-full transition-all"
                              title={`Club: ${formatCLP(p.club)}`}
                            />
                          )}
                          {p.b2b > 0 && (
                            <div
                              style={{ width: `${b2bPct}%` }}
                              className="bg-accent-text h-full transition-all"
                              title={`B2B: ${formatCLP(p.b2b)}`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Cohortes de retención */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg text-foreground">
                Cohortes: ¿vuelven a comprar?
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Mes de primera compra → recompra dentro de 30 / 60 / 90 días. Últimas 6 cohortes.
            </p>
            {!cruce ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Cargando cohortes…</p>
            ) : cruce.cohortes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sin clientes identificables para cohortes (se requiere email o cuenta).
              </p>
            ) : (
              <div className="space-y-3">
                {cruce.cohortes.map((coh) => (
                  <div key={coh.cohorte} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-foreground">
                        {coh.cohorte} · {coh.clientes} clientes
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {coh.clientes > 0 ? Math.round((coh.rep90 / coh.clientes) * 100) : 0}% a 90d
                      </span>
                    </div>
                    <div className="flex gap-1 h-3.5 w-full bg-surface-sunken rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full"
                        style={{ width: `${coh.clientes > 0 ? (coh.rep30 / coh.clientes) * 100 : 0}%` }}
                        title={`30d: ${coh.rep30}`}
                      />
                      <div
                        className="bg-success h-full opacity-70"
                        style={{ width: `${coh.clientes > 0 ? ((coh.rep60 - coh.rep30) / coh.clientes) * 100 : 0}%` }}
                        title={`60d: ${coh.rep60}`}
                      />
                      <div
                        className="bg-warning h-full opacity-70"
                        style={{ width: `${coh.clientes > 0 ? ((coh.rep90 - coh.rep60) / coh.clientes) * 100 : 0}%` }}
                        title={`90d: ${coh.rep90}`}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      30d: {coh.rep30} · 60d: {coh.rep60} · 90d: {coh.rep90}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Geografía de la demanda */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {([
              { titulo: 'Por región', filas: cruce?.regiones ?? [] },
              { titulo: 'Por comuna', filas: cruce?.comunas ?? [] },
            ]).map((bloque) => {
              const max = Math.max(1, ...bloque.filas.map((f) => f.ingreso));
              return (
                <div key={bloque.titulo} className="card p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="font-display text-lg text-foreground">{bloque.titulo}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-5">
                    Web por dirección de envío; feria como punto agregado.
                  </p>
                  {!cruce ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Cargando…</p>
                  ) : bloque.filas.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">Sin datos.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {bloque.filas.map((f) => (
                        <div key={f.ambito} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-foreground truncate pr-2">{f.ambito}</span>
                            <span className="font-mono text-muted-foreground whitespace-nowrap">
                              {f.ventas} · {formatCLP(f.ingreso)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-surface-sunken rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full"
                              style={{ width: `${(f.ingreso / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Velocidad de inventario */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg text-foreground">
                Velocidad de inventario
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Días de stock por producto (demanda 30d). Los quiebres ya generan aviso automático.
            </p>
            {!velocidad ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Cargando…</p>
            ) : velocidad.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin productos visibles.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border/60">
                      <th className="py-2 pr-3 font-medium">Producto</th>
                      <th className="py-2 pr-3 font-medium text-right">Stock</th>
                      <th className="py-2 pr-3 font-medium text-right">Demanda 30d</th>
                      <th className="py-2 pr-3 font-medium text-right">Días stock</th>
                      <th className="py-2 font-medium text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {velocidad.slice(0, 20).map((p) => {
                      const critico = p.stock < 10 || p.dias_stock_estimado < 14;
                      const atencion = !critico && p.dias_stock_estimado < 30;
                      return (
                        <tr key={p.id}>
                          <td className="py-2 pr-3 text-foreground max-w-[220px] truncate">{p.nombre}</td>
                          <td className="py-2 pr-3 text-right font-mono">{p.stock}</td>
                          <td className="py-2 pr-3 text-right font-mono">{p.demanda_30d}</td>
                          <td className="py-2 pr-3 text-right font-mono">
                            {p.dias_stock_estimado >= 999 ? '—' : p.dias_stock_estimado}
                          </td>
                          <td className="py-2 text-right">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                                critico
                                  ? 'bg-destructive/10 text-destructive'
                                  : atencion
                                    ? 'bg-warning/10 text-warning'
                                    : 'bg-success/10 text-success'
                              }`}
                            >
                              {critico ? 'Quiebre' : atencion ? 'Reponer' : 'Sano'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Hallazgos Estratégicos de Margen */}
          <div className="card p-6 bg-surface-raised/40 border border-border">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-2 text-xs">
                <h4 className="font-display font-semibold text-foreground text-sm">
                  Hallazgos y Soberanía Financiera del Enjambre
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Canal Mayorista & Gourmet (B2B)</strong>:{' '}
                    Tiene 0% de intermediación por pasarela y el mayor ticket promedio. Asegura la rotación de
                    lotes en volumen sin pagar comisión adquirente.
                  </li>
                  <li>
                    <strong className="text-foreground">Club Legado (Suscripción)</strong>:{' '}
                    Genera el valor de vida (LTV) más alto y un costo de retención mínimo (2.8%),
                    proveyendo flujo de caja predecible en invierno.
                  </li>
                  <li>
                    <strong className="text-foreground">POS Feria Chiloé</strong>:{' '}
                    Absorbe mayor porcentaje (16.6% combinado con comisión de operador ferial), pero es el motor
                    de descubrimiento de marca y vinculación territorial directa.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
