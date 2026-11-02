'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Mic, Pencil, Plus } from 'lucide-react';
import { Button } from '@enjambre/ui';
import type { FaseBitacora, HojaCuaderno, InspeccionCuadrosEnHistorial } from '@/lib/bitacora-types';
import { FASE_LABEL, CUERPO_LABEL, TIPO_CUADRO_LABEL } from './bitacora-labels';
import type { ColmenaTabProps } from './colmena-tab-props';
import { HojaForm } from './cuaderno/HojaForm';

/** Bitácora del ciclo de vida e historial de visitas de la colmena.
 *  Conectada directamente con el Cuaderno de Campo territorial. */
export function ColmenaBitacoraTab({ colmena, historial, refetchHistorial, onUpdate, onDictar }: ColmenaTabProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [hojaEditando, setHojaEditando] = useState<HojaCuaderno | null>(null);

  const realId = Boolean(colmena.id && colmena.id.length >= 20);
  const inspecciones = historial?.inspecciones ?? [];

  const handleEditarInspeccion = (ins: InspeccionCuadrosEnHistorial) => {
    const hoja: HojaCuaderno = {
      ...ins,
      colmena: {
        id: colmena.id,
        name: colmena.name ?? null,
        apiario_id: colmena.apiario_id ?? null,
        blockchain_hash: colmena.blockchain_hash ?? null,
        origen_tipo: colmena.origen_tipo ?? null,
        estado: colmena.health ?? null,
        alzas: colmena.alzas ?? null,
      },
      apiario_name: null,
      cuadros_count: ins.inspeccion_cuadros?.length ?? 0,
      tratamientos_count: 0,
      brechas: [],
    };
    setHojaEditando(hoja);
    setFormOpen(true);
  };

  const handleNuevaHoja = () => {
    setHojaEditando(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ciclo de vida y visitas registradas</h3>
          <p className="text-xs text-muted-foreground">
            Núcleo → traspaso → alzas → recolección → invernada → nueva temporada
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleNuevaHoja} disabled={!realId}>
          <Plus className="size-3.5 mr-1" /> Nueva visita
        </Button>
      </div>

      {!realId && (
        <div className="rounded-xl border border-border/60 bg-surface-sunken/40 p-3 text-xs text-muted-foreground">
          Guarda la colmena primero para registrar su historial de visitas en el cuaderno.
        </div>
      )}

      <HojaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setHojaEditando(null);
        }}
        colmenas={[{ id: colmena.id, name: colmena.name ?? null }]}
        colmenaIdFijo={colmena.id}
        initial={hojaEditando}
        onSaved={() => {
          onUpdate({
            ...colmena,
            last_inspection: new Date().toISOString().split('T')[0],
          });
          refetchHistorial();
        }}
      />

      <div className="space-y-3">
        {inspecciones.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">Primera visita de la temporada</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Dicta lo observado en la colmena para estructurarlo automáticamente o inicia un registro manual de la visita.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onDictar?.()}
                disabled={!realId}
              >
                <Mic className="size-3.5 mr-1" /> Dictar visita por voz
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNuevaHoja}
                disabled={!realId}
              >
                <Plus className="size-3.5 mr-1" /> Registro manual
              </Button>
            </div>
          </div>
        )}

        {inspecciones.map((ins, i) => (
          <div
            key={ins.id || i}
            className={`rounded-2xl border p-4 space-y-3 transition-colors ${
              i === 0 ? 'border-primary/40 bg-surface-raised/40' : 'border-border/60 bg-card/30 hover:bg-card/60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground font-mono">{ins.date}</span>
                {ins.fase && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {FASE_LABEL[ins.fase as FaseBitacora] ?? ins.fase}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEditarInspeccion(ins)}
                  aria-label={`Editar visita del ${ins.date}`}
                  title="Editar visita"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </Button>
                {ins.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 min-h-0 min-w-0 px-2 text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-primary/10"
                    onClick={() => router.push(`/colmenas/cuaderno/${ins.id}`)}
                    aria-label={`Abrir hoja del ${ins.date} en cuaderno`}
                  >
                    Ver hoja <ArrowUpRight className="size-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Cría', value: `${ins.marcos_cria ?? 0} marcos` },
                { label: 'Miel', value: `${ins.marcos_miel ?? 0} marcos` },
                { label: 'Varroa', value: ins.varroa != null ? `${ins.varroa}/10` : '—' },
                { label: 'Población', value: ins.poblacion ?? '—' },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 rounded-xl bg-surface-sunken/40 border border-border/40">
                  <div className="text-sm font-bold font-mono text-foreground">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {ins.inspeccion_cuadros && ins.inspeccion_cuadros.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ins.inspeccion_cuadros.map((cq) => (
                  <span
                    key={cq.id}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-surface-raised border border-border/50 text-foreground"
                  >
                    #{cq.posicion} {CUERPO_LABEL[cq.cuerpo]}: {TIPO_CUADRO_LABEL[cq.tipo]}
                  </span>
                ))}
              </div>
            )}

            {ins.notes && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                {ins.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
