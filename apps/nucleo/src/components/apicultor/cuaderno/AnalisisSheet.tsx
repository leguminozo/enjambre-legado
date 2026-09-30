'use client';

import { useState } from 'react';
import { Badge, DataTable, ImmersiveModal, Tabs, TabPanel, type ColumnDef } from '@enjambre/ui';
import type { HojaDetalle, InspeccionCuadroRow } from '@/lib/bitacora-types';
import { BRECHA_LABEL, ESTADO_COLMENA_LABEL, faseLabel, varroaToken } from './labels';
import { CUERPO_LABEL, ORIGEN_LABEL, TIPO_CUADRO_LABEL } from '../bitacora-labels';
import { cn } from '@/lib/cn';

interface AnalisisSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detalle: HojaDetalle | null;
}

const CUADROS_COLUMNS: ColumnDef<InspeccionCuadroRow>[] = [
  { key: 'posicion', header: 'Pos.' },
  { key: 'cuerpo', header: 'Cuerpo', render: (r) => CUERPO_LABEL[r.cuerpo as keyof typeof CUERPO_LABEL] ?? r.cuerpo },
  { key: 'tipo', header: 'Tipo', render: (r) => TIPO_CUADRO_LABEL[r.tipo as keyof typeof TIPO_CUADRO_LABEL] ?? r.tipo },
  { key: 'notas', header: 'Notas', render: (r) => r.notas ?? '—' },
];

function varroaBadge(level: number | null): React.ReactNode {
  const v = level ?? 0;
  const tone = varroaToken(v);
  return (
    <Badge variant={tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'danger'}>
      {v} {v <= 1.5 ? '· óptimo' : v <= 3 ? '· atención' : '· riesgo'}
    </Badge>
  );
}

/** Sheet de análisis de la escena (patrón AnalysisTabs de Trama RSN). */
export function AnalisisSheet({ open, onOpenChange, detalle }: AnalisisSheetProps) {
  const [tab, setTab] = useState('hoja');
  const hoja = detalle?.hoja;
  const colmena = detalle?.colmena;

  return (
    <ImmersiveModal
      open={open}
      onClose={() => onOpenChange(false)}
      eyebrow="Análisis"
      title={hoja ? `Hoja · ${colmena?.name ?? ''} · ${hoja.date}` : 'Análisis'}
      size="xl"
      bodyClassName="flex flex-col"
    >
      <Tabs
        tabs={[
          { id: 'hoja', label: 'Hoja' },
          { id: 'varroa', label: 'Varroa' },
          { id: 'tratamientos', label: 'Tratamientos' },
          { id: 'muestras', label: 'Muestras' },
          { id: 'trazabilidad', label: 'Trazabilidad' },
        ]}
        activeTab={tab}
        onTabChange={setTab}
        className="shrink-0"
      >
        <div className="flex-1 min-h-0 overflow-y-auto p-1">
          <TabPanel id="hoja" className="space-y-4 p-2">
            {hoja && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Fase', value: hoja.fase ? faseLabel(hoja.fase) : '—' },
                    { label: 'Población', value: hoja.poblacion ?? '—' },
                    { label: 'Cría / Miel', value: `${hoja.marcos_cria ?? 0} / ${hoja.marcos_miel ?? 0}` },
                    { label: 'Reina', value: hoja.reina ? 'Vista' : 'No vista' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border/50 bg-muted/30 p-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">{s.label}</p>
                      <p className="text-lg font-bold font-mono tabular-nums">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Varroa</span>
                  {hoja.varroa !== null && hoja.varroa !== undefined ? varroaBadge(hoja.varroa) : <Badge variant="warning">sin dato</Badge>}
                  {detalle?.alerta_retiro?.vigente && (
                    <Badge variant="danger">{detalle.alerta_retiro.mensaje}</Badge>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 mb-2">Cuadros individualizados</p>
                  <DataTable
                    columns={CUADROS_COLUMNS}
                    rows={hoja.inspeccion_cuadros ?? []}
                    getId={(r) => r.id}
                    emptyState="Esta hoja no registró cuadros individualizados."
                  />
                </div>
                {hoja.notes && (
                  <div className="rounded-xl border border-border/50 bg-muted/30 p-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70 mb-1">Notas</p>
                    <p className="text-sm whitespace-pre-wrap">{hoja.notes}</p>
                  </div>
                )}
              </>
            )}
          </TabPanel>

          <TabPanel id="varroa" className="p-2">
            {!detalle || detalle.varroa.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin monitoreos de varroa para esta colmena.</p>
            ) : (
              <div className="space-y-2">
                {detalle.varroa.map((v) => (
                  <div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <span className="font-mono text-sm">{v.date}</span>
                    {varroaBadge(v.level)}
                    <span className="text-xs text-muted-foreground">{v.method ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          <TabPanel id="tratamientos" className="p-2">
            {!detalle || detalle.tratamientos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin tratamientos para esta colmena.</p>
            ) : (
              <div className="space-y-2">
                {detalle.tratamientos.map((t) => (
                  <div key={t.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{t.producto_comercial ?? t.principio_activo}</p>
                      <p className="text-xs text-muted-foreground capitalize">{t.enfermedad} · {t.fecha}</p>
                    </div>
                    {t.retiro_fin && (
                      <Badge variant={t.retiro_fin >= new Date().toISOString().slice(0, 10) ? 'danger' : 'default'}>
                        Retiro {t.retiro_fin}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          <TabPanel id="muestras" className="p-2">
            {!detalle || detalle.muestras.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin muestras para este apiario.</p>
            ) : (
              <div className="space-y-2">
                {detalle.muestras.map((m) => (
                  <div key={m.id} className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <p className="text-sm font-medium capitalize">{m.tipo} · {m.fecha}</p>
                      {m.es_contramuestra && <Badge variant="warning">contramuestra</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {m.lab_nombre ? `${m.lab_nombre} · ` : ''}
                      {m.patogeno ? `patógeno: ${m.patogeno}` : m.resultado ? m.resultado : 'resultado pendiente'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          <TabPanel id="trazabilidad" className="p-2 space-y-3">
            {colmena && (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Origen de la colmena</p>
                <p className="text-sm">
                  {colmena.origen_tipo ? ORIGEN_LABEL[colmena.origen_tipo as keyof typeof ORIGEN_LABEL] ?? colmena.origen_tipo : 'Sin origen registrado'}
                  {colmena.origen_fecha ? ` · ${colmena.origen_fecha}` : ''}
                </p>
                {colmena.origen_colmena_madre && <p className="text-xs text-muted-foreground">Deriva de la colmena madre {colmena.origen_colmena_madre.slice(0, 8)}…</p>}
                {colmena.estado && <p className="text-xs">Estado: <span className="font-medium">{ESTADO_COLMENA_LABEL[colmena.estado] ?? colmena.estado}</span></p>}
                {colmena.blockchain_hash && (
                  <p className="font-mono text-[10px] text-muted-foreground break-all">Sello digital de autenticidad: {colmena.blockchain_hash}</p>
                )}
              </div>
            )}
            {hoja && (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Registro de la hoja</p>
                <p className="text-xs text-muted-foreground">Hoja {hoja.date} · fase {hoja.fase ? faseLabel(hoja.fase) : '—'}</p>
                <p className="text-xs text-muted-foreground">Creada {new Date(hoja.created_at ?? Date.now()).toLocaleString('es-CL')}</p>
              </div>
            )}
            {detalle && detalle.red.meta.brechas.length > 0 && (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Brechas detectadas</p>
                {detalle.red.meta.brechas.map((b) => (
                  <p key={b.colmena_id} className="text-xs text-warning">
                    <span className="font-medium">{b.colmena_label}:</span> {BRECHA_LABEL[b.tipo].label} — {b.detalle}
                  </p>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/70">Red local</p>
              <p className="text-xs text-muted-foreground">
                {detalle?.red.nodos.length ?? 0} nodos · {detalle?.red.aristas.length ?? 0} conexiones
              </p>
            </div>
          </TabPanel>
        </div>
      </Tabs>
    </ImmersiveModal>
  );
}
