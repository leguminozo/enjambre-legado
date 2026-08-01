'use client';

import { useMemo } from 'react';
import { Activity, Bug, ClipboardList, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { ColmenaWithRelations, InspeccionRow, VarroaRow } from '@/lib/apicultor-types';

interface Props {
  colmenas: ColmenaWithRelations[];
}

export function CuadernoCampoPanel({ colmenas }: Props) {
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

  return (
    <div className="space-y-8">
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
