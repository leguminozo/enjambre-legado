'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bug,
  ClipboardList,
  ShieldAlert,
  CheckCircle2,
  FlaskConical,
  Pill,
  AlertTriangle,
} from 'lucide-react';
import type { ColmenaWithRelations, InspeccionRow, VarroaRow } from '@/lib/apicultor-types';
import type { TratamientoRow, MuestraRow } from '@/lib/bitacora-types';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { RecorderVoz } from './RecorderVoz';
import { CuraduriaBitacoraPanel } from './CuraduriaBitacoraPanel';

interface Props {
  colmenas: ColmenaWithRelations[];
}

interface TratamientosResponse {
  data: TratamientoRow[];
  alerta_retiro: unknown;
}

interface MuestrasResponse {
  data: MuestraRow[];
}

export function CuadernoCampoPanel({ colmenas }: Props) {
  const apiFetch = useApiFetch();

  // Tratamientos y muestras vienen del BFF de bitácora (RLS: solo lo propio)
  const { data: tratamientosData } = useQuery<TratamientosResponse>({
    queryKey: ['bitacora-tratamientos'],
    queryFn: async () => {
      const res = await apiFetch('/api/bitacora/tratamientos');
      if (!res.ok) throw new Error('Error cargando tratamientos');
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: muestrasData } = useQuery<MuestrasResponse>({
    queryKey: ['bitacora-muestras'],
    queryFn: async () => {
      const res = await apiFetch('/api/bitacora/muestras');
      if (!res.ok) throw new Error('Error cargando muestras');
      return res.json();
    },
    staleTime: 60_000,
  });

  const tratamientos = tratamientosData?.data ?? [];
  const muestras = muestrasData?.data ?? [];

  const allVarroa = useMemo(() => {
    const list: (VarroaRow & { colmenaName: string; apiarioName: string })[] = [];
    colmenas.forEach((c) => {
      if (c.varroa_records) {
        c.varroa_records.forEach((v) => {
          list.push({ ...v, colmenaName: c.name || 'Sin nombre', apiarioName: c.apiario_name || 'Desconocido' });
        });
      }
    });
    return list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [colmenas]);

  const allInspecciones = useMemo(() => {
    const list: (InspeccionRow & { colmenaName: string; apiarioName: string })[] = [];
    colmenas.forEach((c) => {
      if (c.inspecciones) {
        c.inspecciones.forEach((ins) => {
          list.push({ ...ins, colmenaName: c.name || 'Sin nombre', apiarioName: c.apiario_name || 'Desconocido' });
        });
      }
    });
    return list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [colmenas]);

  const varroaColor = (v: number) => v <= 1.5 ? 'hsl(var(--success))' : v <= 3 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  // Regla §2.3: retiro vigente si retiro_fin >= hoy (no cosechar con alzas puestas)
  const retiroVigente = (retiroFin: string | null) => {
    if (!retiroFin) return false;
    const hoy = new Date().toISOString().slice(0, 10);
    return retiroFin >= hoy;
  };

  return (
    <div className="space-y-8">
      {/* Captura por voz: mano libre, offline-first (§3/§5) */}
      <RecorderVoz />

      {/* Curaduría en escritorio: revisar hipótesis de atribución (§3.4) */}
      <CuraduriaBitacoraPanel colmenas={colmenas} />

      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Bug size={120} />
        </div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Vigilancia Varroa</h2>
            <p className="text-sm text-muted-foreground">Registro global sanitario de ácaros (Varroa destructor)</p>
          </div>
        </div>

        {allVarroa.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl relative z-10">
            No hay registros sanitarios de Varroa.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
            {allVarroa.slice(0, 9).map((v, i) => (
              <div key={i} className="p-4 bg-secondary/30 border border-border/50 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-sm">{v.colmenaName}</h4>
                    <span className="text-[10px] text-muted-foreground">{v.apiarioName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-muted-foreground">{v.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: varroaColor(v.level || 0) }}>
                    {v.level}
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground">{v.method}</p>
                    <p style={{ color: varroaColor(v.level || 0) }} className="font-medium">
                      {(v.level || 0) <= 1.5 ? 'Óptimo' : (v.level || 0) <= 3 ? 'Atención' : 'Riesgo alto'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tratamientos fitosanitarios (§2.3/§2.4): archivo legal ≥5 años */}
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-warning/10 text-warning rounded-lg">
            <Pill size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Tratamientos fitosanitarios</h2>
            <p className="text-sm text-muted-foreground">Aplicaciones con período de retiro y rotación de principio activo</p>
          </div>
        </div>

        {tratamientos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl relative z-10">
            No hay tratamientos registrados.
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {tratamientos.slice(0, 10).map((t) => {
              const vigente = retiroVigente(t.retiro_fin);
              return (
                <div key={t.id} className="p-4 bg-secondary/20 border border-border/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h4 className="font-semibold text-sm text-foreground">{t.producto_comercial || t.principio_activo}</h4>
                      <span className="badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase badge-primary">{t.principio_activo}</span>
                      <span className="text-xs font-mono text-muted-foreground">{t.fecha}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enfermedad: <span className="capitalize">{t.enfermedad}</span>
                      {t.dosis_aplicada && <> · Dosis aplicada: {t.dosis_aplicada}</>}
                      {t.via && <> · Vía: {t.via}</>}
                    </p>
                    {t.retiro_fin && (
                      <p className={`text-xs mt-1 font-medium ${vigente ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {vigente && <AlertTriangle size={12} className="inline mr-1" />}
                        Período de retiro hasta {t.retiro_fin} — {vigente ? 'VIGENTE: no cosechar ni poner alzas' : 'vencido'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Muestras y contramuestreo (§2.1/§2.2): archivo ≥2 años */}
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <FlaskConical size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Muestras de laboratorio</h2>
            <p className="text-sm text-muted-foreground">Muestreo, contramuestreo y resultados (archivo mínimo 2 años)</p>
          </div>
        </div>

        {muestras.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl relative z-10">
            No hay muestras registradas.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 relative z-10">
            {muestras.slice(0, 9).map((m) => (
              <div key={m.id} className="p-4 bg-secondary/30 border border-border/50 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-sm capitalize">{m.tipo}</h4>
                    <span className="text-[10px] text-muted-foreground">{m.lab_nombre || 'Sin laboratorio'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-muted-foreground">{m.fecha}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {m.n_abejas && <span className="text-xs text-muted-foreground">{m.n_abejas} abejas</span>}
                  {m.patogeno && <span className="badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase badge-primary">{m.patogeno}</span>}
                  {m.es_contramuestra && <span className="badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase badge-warning">contramuestra</span>}
                  {m.confirmado_saneado && (
                    <span className="badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase badge-success flex items-center gap-1">
                      <CheckCircle2 size={10} /> saneado
                    </span>
                  )}
                </div>
                {m.resultado && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{m.resultado}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Bitácora de Inspecciones</h2>
            <p className="text-sm text-muted-foreground">Registros rutinarios metodológicos</p>
          </div>
        </div>

        {allInspecciones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/50 rounded-xl relative z-10">
            No hay inspecciones registradas.
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {allInspecciones.slice(0, 10).map((ins, i) => (
              <div key={i} className="p-4 bg-secondary/20 border border-border/50 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-sm text-foreground">{ins.colmenaName}</h4>
                    <span className="text-xs text-muted-foreground hidden md:inline-block">({ins.apiarioName})</span>
                    <span className="text-xs font-mono text-muted-foreground ml-auto md:ml-0">{ins.date}</span>
                  </div>
                  {ins.notes && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{ins.notes}</p>}
                </div>

                <div className="flex gap-4 md:gap-6 flex-wrap">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Cría / Miel</p>
                    <p className="text-sm font-semibold">{ins.marcos_cria} / {ins.marcos_miel}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Población</p>
                    <p className="text-sm font-semibold capitalize">{ins.poblacion || 'N/A'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Reina</p>
                    <p className="text-sm font-semibold">
                      {ins.reina ? <CheckCircle2 size={16} className="inline text-success mx-auto" /> : <ShieldAlert size={16} className="inline text-destructive mx-auto" />}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Enjambración</p>
                    <span className={`badge px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${ins.enjambrazon_riesgo === 'bajo' ? 'badge-success' : ins.enjambrazon_riesgo === 'medio' ? 'badge-warning' : 'badge-danger'}`}>
                      {ins.enjambrazon_riesgo || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
