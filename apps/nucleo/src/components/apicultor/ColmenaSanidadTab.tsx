import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ShieldAlert, FlaskConical, AlertTriangle } from 'lucide-react';
import { Button } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { MuestraRow } from '@/lib/bitacora-types';
import type { ColmenaTabProps } from './colmena-tab-props';
import { TratamientoForm } from './cuaderno/TratamientoForm';
import { MuestraForm } from './cuaderno/MuestraForm';

const ENFERMEDAD_LABEL: Record<string, string> = {
    varroa: 'Varroa',
    nosema: 'Nosemosis',
    loque: 'Loque',
    otro: 'Otro',
};
const TIPO_MUESTRA_LABEL: Record<string, string> = {
    varroa: 'Varroa (~300 abejas)',
    nosema: 'Nosema (60 pecoreadoras)',
    otro: 'Otro',
};
const PATOGENO_LABEL: Record<string, string> = {
    varroa: 'Varroa destructor',
    nosema: 'Nosema',
    DWV: 'DWV',
    ABPV: 'ABPV',
    otro: 'Otro',
};

const isRetiroVigente = (retiroFin: string | null) => {
    if (!retiroFin) return false;
    return retiroFin >= new Date().toISOString().slice(0, 10);
};

/** Sanitario con trazabilidad legal: tratamientos (≥5 años) y muestras (≥2 años). */
export function ColmenaSanidadTab({ colmena, historial, refetchHistorial }: ColmenaTabProps) {
    const apiFetch = useApiFetch();
    const realId = Boolean(colmena.id && colmena.id.length >= 20);
    const apiarioId = colmena.apiario_id && colmena.apiario_id.length >= 20 ? colmena.apiario_id : null;

    const { data: muestras = [], refetch: refetchMuestras } = useQuery<MuestraRow[]>({
        queryKey: ['bitacora-muestras', apiarioId ?? 'sin-apiario'],
        queryFn: async () => {
            const q = apiarioId ? `?apiario_id=${apiarioId}` : '';
            const res = await apiFetch(`/api/bitacora/muestras${q}`);
            if (!res.ok) throw new Error('Error cargando muestras');
            const json = await res.json();
            return (json.data ?? []) as MuestraRow[];
        },
        enabled: Boolean(apiarioId),
    });

    const [tratamientoOpen, setTratamientoOpen] = useState(false);
    const [muestraOpen, setMuestraOpen] = useState(false);

    const alertaRetiro = historial?.alerta_retiro;
    const tratamientos = historial?.tratamientos ?? [];
    const retiroVigente = alertaRetiro?.vigente ?? false;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {alertaRetiro?.vigente && (
                <div style={{ padding: 'var(--space-md)', background: retiroVigente && (colmena.alzas ?? 0) > 1 ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--warning) / 0.1)', border: `1px solid ${retiroVigente && (colmena.alzas ?? 0) > 1 ? 'hsl(var(--destructive) / 0.3)' : 'hsl(var(--warning) / 0.3)'}`, borderRadius: 'var(--radius-sm)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <ShieldAlert size={16} style={{ color: retiroVigente && (colmena.alzas ?? 0) > 1 ? 'hsl(var(--destructive))' : 'hsl(var(--warning))', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>{alertaRetiro.mensaje}</div>
                </div>
            )}

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>
                        Tratamientos fitosanitarios
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setTratamientoOpen(true)} disabled={!realId}>
                        <Plus size={13} /> Tratamiento
                    </Button>
                </div>

                <TratamientoForm
                    open={tratamientoOpen}
                    onOpenChange={setTratamientoOpen}
                    colmenas={[{ id: colmena.id, name: colmena.name ?? null }]}
                    colmenaIdFijo={colmena.id}
                    onSaved={() => { void refetchHistorial(); }}
                />

                {tratamientos.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Sin tratamientos registrados. Conservar estos datos al menos 5 años (National Bee Unit).</div>
                )}
                {tratamientos.map(t => (
                    <div key={t.id} style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid hsl(var(--border) / 0.3)', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: isRetiroVigente(t.retiro_fin) ? 'hsl(var(--warning))' : 'hsl(var(--success))', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                                {t.producto_comercial || t.principio_activo} <span style={{ fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>· {t.principio_activo}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>
                                {t.fecha} · {ENFERMEDAD_LABEL[t.enfermedad] ?? t.enfermedad}
                                {t.dosis_aplicada && <> · dosis {t.dosis_aplicada}</>}
                                {t.retiro_fin && <> · retiro hasta {t.retiro_fin}</>}
                            </div>
                        </div>
                        {isRetiroVigente(t.retiro_fin) && <span className="badge badge-gold">Retiro vigente</span>}
                    </div>
                ))}
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>
                        <FlaskConical size={12} style={{ display: 'inline', marginRight: 6 }} />Muestras de laboratorio
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setMuestraOpen(true)} disabled={!apiarioId}>
                        <Plus size={13} /> Muestra
                    </Button>
                </div>

                {!apiarioId && (
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Asigna un apiario a la colmena para registrar muestras (el muestreo es por apiario, §2.1).</div>
                )}

                <MuestraForm
                    open={muestraOpen}
                    onOpenChange={setMuestraOpen}
                    apiarios={apiarioId ? [{ id: apiarioId, name: colmena.apiario_name ?? null }] : []}
                    apiarioIdFijo={apiarioId}
                    onSaved={() => { void refetchMuestras(); }}
                />

                {muestras.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Sin muestras del apiario. Conservar los resultados de laboratorio al menos 2 años.</div>
                )}
                {muestras.map(m => (
                    <div key={m.id} style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid hsl(var(--border) / 0.3)', alignItems: 'center' }}>
                        {m.es_contramuestra
                            ? <FlaskConical size={14} style={{ color: m.confirmado_saneado ? 'hsl(var(--success))' : 'hsl(var(--warning))', flexShrink: 0 }} />
                            : <AlertTriangle size={14} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />}
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                                {TIPO_MUESTRA_LABEL[m.tipo] ?? m.tipo}
                                {m.es_contramuestra && <span className="badge badge-gold" style={{ marginLeft: 8, fontSize: '0.6rem' }}>Contramuestra</span>}
                                {m.confirmado_saneado && <span className="badge badge-success" style={{ marginLeft: 4, fontSize: '0.6rem' }}>Saneado</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>
                                {m.fecha}
                                {m.n_abejas && <> · {m.n_abejas} abejas</>}
                                {m.lab_nombre && <> · {m.lab_nombre}</>}
                                {m.resultado && <> · <strong>{m.resultado}</strong></>}
                                {m.patogeno && <> · {PATOGENO_LABEL[m.patogeno] ?? m.patogeno}</>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
