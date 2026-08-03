import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ShieldAlert, FlaskConical, AlertTriangle } from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { MuestraRow, TratamientoRow } from '@/lib/bitacora-types';
import type { ColmenaTabProps } from './colmena-tab-props';

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

    // ── Muestras del apiario (muestreo/contramuestreo §2.1) ───────────────────
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

    // ── Tratamientos ──────────────────────────────────────────────────────────
    const [showTratamientoForm, setShowTratamientoForm] = useState(false);
    const [tratForm, setTratForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        producto_comercial: '',
        principio_activo: '',
        dosis_recomendada: '',
        dosis_aplicada: '',
        enfermedad: 'varroa',
        via: '',
        retiro_fin: '',
    });
    const [savingTrat, setSavingTrat] = useState(false);
    const [tratAviso, setTratAviso] = useState<string | null>(null);
    const [tratError, setTratError] = useState<string | null>(null);

    const handleAddTratamiento = async () => {
        if (!realId) return;
        setSavingTrat(true);
        setTratAviso(null);
        setTratError(null);
        try {
            const res = await apiFetch('/api/bitacora/tratamientos', {
                method: 'POST',
                body: JSON.stringify({
                    colmena_id: colmena.id,
                    fecha: tratForm.fecha,
                    producto_comercial: tratForm.producto_comercial.trim() || undefined,
                    principio_activo: tratForm.principio_activo.trim(),
                    dosis_recomendada: tratForm.dosis_recomendada.trim() || undefined,
                    dosis_aplicada: tratForm.dosis_aplicada.trim() || undefined,
                    enfermedad: tratForm.enfermedad,
                    via: tratForm.via.trim() || undefined,
                    retiro_fin: tratForm.retiro_fin || undefined,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message ?? json.code ?? 'No se pudo registrar el tratamiento');
            if (json.meta?.aviso) setTratAviso(String(json.meta.aviso));
            await refetchHistorial();
            setShowTratamientoForm(false);
            setTratForm({ ...tratForm, producto_comercial: '', principio_activo: '', dosis_recomendada: '', dosis_aplicada: '', via: '', retiro_fin: '' });
            toast('Tratamiento registrado', { type: 'success' });
        } catch (err) {
            console.error('Error registrando tratamiento', err);
            setTratError(err instanceof Error ? err.message : 'Error al registrar');
        } finally {
            setSavingTrat(false);
        }
    };

    // ── Muestras ──────────────────────────────────────────────────────────────
    const [showMuestraForm, setShowMuestraForm] = useState(false);
    const [muestraForm, setMuestraForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'varroa',
        n_abejas: '',
        cuadros_muestreados: '',
        lab_nombre: '',
        lab_fecha: '',
        resultado: '',
        patogeno: '',
        es_contramuestra: false,
        confirmado_saneado: false,
    });
    const [savingMuestra, setSavingMuestra] = useState(false);
    const [muestraMensaje, setMuestraMensaje] = useState<string | null>(null);

    const handleAddMuestra = async () => {
        if (!apiarioId) return;
        setSavingMuestra(true);
        setMuestraMensaje(null);
        try {
            const res = await apiFetch('/api/bitacora/muestras', {
                method: 'POST',
                body: JSON.stringify({
                    apiario_id: apiarioId,
                    fecha: muestraForm.fecha,
                    tipo: muestraForm.tipo,
                    n_abejas: parseInt(muestraForm.n_abejas) || undefined,
                    cuadros_muestreados: parseInt(muestraForm.cuadros_muestreados) || undefined,
                    lab_nombre: muestraForm.lab_nombre.trim() || undefined,
                    lab_fecha: muestraForm.lab_fecha || undefined,
                    resultado: muestraForm.resultado.trim() || undefined,
                    patogeno: muestraForm.patogeno || null,
                    es_contramuestra: muestraForm.es_contramuestra,
                    confirmado_saneado: muestraForm.confirmado_saneado,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message ?? json.code ?? 'No se pudo registrar la muestra');
            if (json.meta?.mensaje) setMuestraMensaje(String(json.meta.mensaje));
            await refetchMuestras();
            setShowMuestraForm(false);
            setMuestraForm({ ...muestraForm, n_abejas: '', cuadros_muestreados: '', lab_nombre: '', lab_fecha: '', resultado: '', patogeno: '', es_contramuestra: false, confirmado_saneado: false });
            toast('Muestra registrada', { type: 'success' });
        } catch (err) {
            console.error('Error registrando muestra', err);
            toast(friendlyError(err, 'Error al registrar la muestra'), { type: 'error' });
        } finally {
            setSavingMuestra(false);
        }
    };

    const alertaRetiro = historial?.alerta_retiro;
    const tratamientos = historial?.tratamientos ?? [];
    const retiroVigente = alertaRetiro?.vigente ?? false;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* Alerta de período de retiro (§2.3) */}
            {alertaRetiro?.vigente && (
                <div style={{ padding: 'var(--space-md)', background: retiroVigente && (colmena.alzas ?? 0) > 1 ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--warning) / 0.1)', border: `1px solid ${retiroVigente && (colmena.alzas ?? 0) > 1 ? 'hsl(var(--destructive) / 0.3)' : 'hsl(var(--warning) / 0.3)'}`, borderRadius: 'var(--radius-sm)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <ShieldAlert size={16} style={{ color: retiroVigente && (colmena.alzas ?? 0) > 1 ? 'hsl(var(--destructive))' : 'hsl(var(--warning))', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>{alertaRetiro.mensaje}</div>
                </div>
            )}

            {/* ── Tratamientos fitosanitarios (archivo ≥5 años) ── */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>
                        Tratamientos fitosanitarios
                    </div>
                    <button className="btn btn-gold btn-sm" onClick={() => setShowTratamientoForm(!showTratamientoForm)} disabled={!realId}>
                        <Plus size={13} /> Tratamiento
                    </button>
                </div>

                {showTratamientoForm && (
                    <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                            <input type="date" className="input-field w-full" value={tratForm.fecha} onChange={e => setTratForm({ ...tratForm, fecha: e.target.value })} />
                            <select className="input-field w-full" value={tratForm.enfermedad} onChange={e => setTratForm({ ...tratForm, enfermedad: e.target.value })}>
                                {Object.entries(ENFERMEDAD_LABEL).map(([k, v]) => (
                                    <option key={k} value={k} className="bg-card text-foreground">{v}</option>
                                ))}
                            </select>
                            <input className="input-field w-full" placeholder="Producto comercial (ej. Bayvarol)" value={tratForm.producto_comercial} onChange={e => setTratForm({ ...tratForm, producto_comercial: e.target.value })} />
                            <input className="input-field w-full" placeholder="Principio activo * (ej. Flumetrina)" value={tratForm.principio_activo} onChange={e => setTratForm({ ...tratForm, principio_activo: e.target.value })} />
                            <input className="input-field w-full" placeholder="Dosis recomendada" value={tratForm.dosis_recomendada} onChange={e => setTratForm({ ...tratForm, dosis_recomendada: e.target.value })} />
                            <input className="input-field w-full" placeholder="Dosis aplicada" value={tratForm.dosis_aplicada} onChange={e => setTratForm({ ...tratForm, dosis_aplicada: e.target.value })} />
                            <input className="input-field w-full" placeholder="Vía (ej. tiras, sublimado)" value={tratForm.via} onChange={e => setTratForm({ ...tratForm, via: e.target.value })} />
                            <div>
                                <input type="date" className="input-field w-full" value={tratForm.retiro_fin} onChange={e => setTratForm({ ...tratForm, retiro_fin: e.target.value })} />
                                <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>Fin del período de retiro</div>
                            </div>
                        </div>
                        {tratAviso && (
                            <div style={{ marginBottom: 8, padding: 'var(--space-sm)', background: 'hsl(var(--warning) / 0.12)', border: '1px solid hsl(var(--warning) / 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'hsl(var(--warning))' }}>
                                {tratAviso}
                            </div>
                        )}
                        {tratError && (
                            <div style={{ marginBottom: 8, padding: 'var(--space-sm)', background: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'hsl(var(--destructive))' }}>
                                {tratError}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowTratamientoForm(false)}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={handleAddTratamiento} disabled={savingTrat || !tratForm.principio_activo.trim()}>
                                {savingTrat ? 'Guardando…' : 'Registrar tratamiento'}
                            </button>
                        </div>
                    </div>
                )}

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

            {/* ── Muestras y contramuestreo (archivo ≥2 años) ── */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>
                        <FlaskConical size={12} style={{ display: 'inline', marginRight: 6 }} />Muestras de laboratorio
                    </div>
                    <button className="btn btn-gold btn-sm" onClick={() => setShowMuestraForm(!showMuestraForm)} disabled={!apiarioId}>
                        <Plus size={13} /> Muestra
                    </button>
                </div>

                {!apiarioId && (
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Asigna un apiario a la colmena para registrar muestras (el muestreo es por apiario, §2.1).</div>
                )}

                {showMuestraForm && (
                    <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                            <input type="date" className="input-field w-full" value={muestraForm.fecha} onChange={e => setMuestraForm({ ...muestraForm, fecha: e.target.value })} />
                            <select className="input-field w-full" value={muestraForm.tipo} onChange={e => setMuestraForm({ ...muestraForm, tipo: e.target.value })}>
                                {Object.entries(TIPO_MUESTRA_LABEL).map(([k, v]) => (
                                    <option key={k} value={k} className="bg-card text-foreground">{v}</option>
                                ))}
                            </select>
                            <input type="number" min={1} className="input-field w-full" placeholder="N° abejas muestreadas" value={muestraForm.n_abejas} onChange={e => setMuestraForm({ ...muestraForm, n_abejas: e.target.value })} />
                            <input type="number" min={1} className="input-field w-full" placeholder="Cuadros muestreados" value={muestraForm.cuadros_muestreados} onChange={e => setMuestraForm({ ...muestraForm, cuadros_muestreados: e.target.value })} />
                            <input className="input-field w-full" placeholder="Laboratorio" value={muestraForm.lab_nombre} onChange={e => setMuestraForm({ ...muestraForm, lab_nombre: e.target.value })} />
                            <input type="date" className="input-field w-full" value={muestraForm.lab_fecha} onChange={e => setMuestraForm({ ...muestraForm, lab_fecha: e.target.value })} />
                            <input className="input-field w-full" placeholder="Resultado (% infestación / presencia)" value={muestraForm.resultado} onChange={e => setMuestraForm({ ...muestraForm, resultado: e.target.value })} />
                            <select className="input-field w-full" value={muestraForm.patogeno} onChange={e => setMuestraForm({ ...muestraForm, patogeno: e.target.value })}>
                                <option value="" className="bg-card text-foreground">Patógeno…</option>
                                {Object.entries(PATOGENO_LABEL).map(([k, v]) => (
                                    <option key={k} value={k} className="bg-card text-foreground">{v}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8, fontSize: '0.82rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" checked={muestraForm.es_contramuestra} onChange={e => setMuestraForm({ ...muestraForm, es_contramuestra: e.target.checked })} /> Contramuestra
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <input type="checkbox" checked={muestraForm.confirmado_saneado} onChange={e => setMuestraForm({ ...muestraForm, confirmado_saneado: e.target.checked })} /> Confirma saneamiento (levanta cuarentena)
                            </label>
                        </div>
                        {muestraMensaje && (
                            <div style={{ marginBottom: 8, padding: 'var(--space-sm)', background: 'hsl(var(--success) / 0.1)', border: '1px solid hsl(var(--success) / 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'hsl(var(--success))' }}>
                                {muestraMensaje}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowMuestraForm(false)}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={handleAddMuestra} disabled={savingMuestra}>
                                {savingMuestra ? 'Guardando…' : 'Registrar muestra'}
                            </button>
                        </div>
                    </div>
                )}

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
