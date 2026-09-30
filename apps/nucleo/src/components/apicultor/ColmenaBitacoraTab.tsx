import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@enjambre/ui';
import type { FaseBitacora } from '@/lib/bitacora-types';
import { FASE_LABEL } from './bitacora-labels';
import type { ColmenaTabProps } from './colmena-tab-props';
import { HojaForm } from './cuaderno/HojaForm';
import { CUERPO_LABEL, TIPO_CUADRO_LABEL } from './bitacora-labels';

/** Bitácora del ciclo de vida: núcleo → traspaso → alzas → recolección → invernada → temporada.
 *  Reutiliza HojaForm del cuaderno (misma fuente de verdad para crear/editar hojas). */
export function ColmenaBitacoraTab({ colmena, historial, refetchHistorial, onUpdate, onDictar }: ColmenaTabProps) {
    const [formOpen, setFormOpen] = useState(false);

    const realId = Boolean(colmena.id && colmena.id.length >= 20);
    const inspecciones = historial?.inspecciones ?? [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Ciclo de vida de la colmena</div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>Núcleo → traspaso → alzas → recolección → invernada → nueva temporada</div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setFormOpen(true)} disabled={!realId}>
                    <Plus size={13} /> Nueva entrada
                </Button>
            </div>

            {!realId && (
                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Guarda la colmena primero para registrar su bitácora.</div>
            )}

            <HojaForm
                open={formOpen}
                onOpenChange={setFormOpen}
                colmenas={[{ id: colmena.id, name: colmena.name ?? null }]}
                colmenaIdFijo={colmena.id}
                onSaved={() => {
                    onUpdate({
                        ...colmena,
                        last_inspection: new Date().toISOString().split('T')[0],
                    });
                    refetchHistorial();
                }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {inspecciones.length === 0 && (
                    <div style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', border: '1px dashed hsl(var(--border) / 0.5)', background: 'hsl(var(--muted) / 0.3)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '0.25rem' }}>
                            Primera inspección de la temporada
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
                            Dicta lo observado en la colmena para estructurarlo automáticamente o inicia un registro manual de la visita.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-md)', background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground, var(--background)))', fontSize: '0.78rem', fontWeight: 700, border: 'none', cursor: realId ? 'pointer' : 'not-allowed', opacity: realId ? 1 : 0.5 }}
                                onClick={() => onDictar?.()}
                                disabled={!realId}
                            >
                                🎙 Dictar inspección
                            </button>
                            <button
                                type="button"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'hsl(var(--muted-foreground))', fontSize: '0.78rem', fontWeight: 600, border: '1px solid hsl(var(--border) / 0.6)', cursor: realId ? 'pointer' : 'not-allowed', opacity: realId ? 1 : 0.5 }}
                                onClick={() => setFormOpen(true)}
                                disabled={!realId}
                            >
                                + Registro manual
                            </button>
                        </div>
                    </div>
                )}
                {inspecciones.map((ins, i) => (
                    <div key={ins.id || i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)', background: i === 0 ? 'hsl(var(--muted) / 0.5)' : 'transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}>{ins.date}</span>
                            {ins.fase && <span className="badge badge-gold">{FASE_LABEL[ins.fase as FaseBitacora] ?? ins.fase}</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 'var(--space-sm)' }}>
                            {[
                                { label: 'Cría', value: `${ins.marcos_cria ?? 0} marcos` },
                                { label: 'Miel', value: `${ins.marcos_miel ?? 0} marcos` },
                                { label: 'Varroa', value: `${ins.varroa ?? 0}/10` },
                                { label: 'Población', value: ins.poblacion ?? '—' },
                            ].map((s, j) => (
                                <div key={j} style={{ textAlign: 'center', padding: 6, background: 'hsl(var(--muted) / 0.5)', borderRadius: 6 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{s.value}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                        {ins.inspeccion_cuadros && ins.inspeccion_cuadros.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                                {ins.inspeccion_cuadros.map(cq => (
                                    <span key={cq.id} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 12, background: 'hsl(var(--accent) / 0.12)', color: 'hsl(var(--foreground))' }}>
                                        #{cq.posicion} {CUERPO_LABEL[cq.cuerpo]}: {TIPO_CUADRO_LABEL[cq.tipo]}
                                    </span>
                                ))}
                            </div>
                        )}
                        <div style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>{ins.notes}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
