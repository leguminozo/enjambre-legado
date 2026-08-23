import { useState, useEffect } from 'react';
import { Crown, Save, Plus, GitBranch } from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '../../lib/supabase';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import type { ReinaHistoryRow, TipoOrigen } from '@/lib/bitacora-types';
import { TIPOS_ORIGEN } from '@/lib/bitacora-types';
import { ORIGEN_LABEL } from './bitacora-labels';
import type { ColmenaTabProps } from './colmena-tab-props';

const ESTADO_REINA_LABEL: Record<ReinaHistoryRow['estado'], string> = {
  RV: 'Reina vista',
  NV: 'Reina no vista',
  SR: 'Sin reina',
};
const ESTADO_REINA_COLOR: Record<ReinaHistoryRow['estado'], string> = {
  RV: 'hsl(var(--success))',
  NV: 'hsl(var(--warning))',
  SR: 'hsl(var(--destructive))',
};

/** Provenance del núcleo/colmena + linaje de reinas (docs/BITACORA_APICOLA.md §7.3, §1.4). */
export function ColmenaOrigenTab({ colmena, colmenas, historial, refetchHistorial, onUpdate, onOpenColmena }: ColmenaTabProps) {
    const apiFetch = useApiFetch();

    // Formulario de origen — sincroniza con la colmena (que persiste el BFF PATCH)
    const [form, setForm] = useState({
        origen_tipo: (colmena.origen_tipo ?? '') as TipoOrigen | '',
        origen_fecha: colmena.origen_fecha ?? '',
        origen_colmena_madre: colmena.origen_colmena_madre ?? '',
        origen_detalle: colmena.origen_detalle ?? '',
    });
    const [savingOrigen, setSavingOrigen] = useState(false);

    useEffect(() => {
        setForm({
            origen_tipo: (colmena.origen_tipo ?? '') as TipoOrigen | '',
            origen_fecha: colmena.origen_fecha ?? '',
            origen_colmena_madre: colmena.origen_colmena_madre ?? '',
            origen_detalle: colmena.origen_detalle ?? '',
        });
    }, [colmena.origen_tipo, colmena.origen_fecha, colmena.origen_colmena_madre, colmena.origen_detalle]);

    const madre = colmenas.find(c => c.id === form.origen_colmena_madre);

    // A9: hijas directas de esta colmena (navegación de linaje).
    const [hijas, setHijas] = useState<{ id: string; name: string | null }[]>([]);
    useEffect(() => {
        if (!colmena.id || colmena.id.length < 20) return;
        supabase
            .from('colmenas')
            .select('id, name')
            .eq('origen_colmena_madre', colmena.id)
            .then(({ data }: { data: { id: string; name: string | null }[] | null }) => setHijas(data ?? []));
    }, [colmena.id, colmenas.length]);

    const handleSaveOrigen = async () => {
        setSavingOrigen(true);
        try {
            const res = await apiFetch(`/api/bitacora/colmenas/${colmena.id}/origen`, {
                method: 'PATCH',
                body: JSON.stringify({
                    origen_tipo: form.origen_tipo || null,
                    origen_fecha: form.origen_fecha || null,
                    origen_colmena_madre: form.origen_colmena_madre || null,
                    origen_detalle: form.origen_detalle.trim() || null,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message ?? json.code ?? 'No se pudo guardar el origen');
            onUpdate({ ...colmena, ...json.data });
            toast('Origen de la colmena guardado', { type: 'success' });
        } catch (err) {
            console.error('Error guardando origen', err);
            toast(friendlyError(err, 'Error al guardar el origen'), { type: 'error' });
        } finally {
            setSavingOrigen(false);
        }
    };

    // ── Linaje de reinas ──────────────────────────────────────────────────────
    const reinas = historial?.reinas ?? [];
    const [showReinaForm, setShowReinaForm] = useState(false);
    const [reinaForm, setReinaForm] = useState({
        fecha: new Date().toISOString().split('T')[0],
        estado: 'RV' as ReinaHistoryRow['estado'],
        color: '',
        vigor: '',
        postura: '',
        notas: '',
    });
    const [savingReina, setSavingReina] = useState(false);

    const handleAddReina = async () => {
        setSavingReina(true);
        try {
            const res = await apiFetch('/api/bitacora/reinas', {
                method: 'POST',
                body: JSON.stringify({
                    colmena_id: colmena.id,
                    fecha: reinaForm.fecha,
                    estado: reinaForm.estado,
                    caracteristicas: {
                        color: reinaForm.color.trim() || null,
                        vigor: reinaForm.vigor.trim() || null,
                        postura: reinaForm.postura.trim() || null,
                        notas: reinaForm.notas.trim() || null,
                    },
                    reemplazada_por: null,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message ?? json.code ?? 'No se pudo registrar la reina');
            await refetchHistorial();
            setShowReinaForm(false);
            setReinaForm({ ...reinaForm, color: '', vigor: '', postura: '', notas: '' });
            toast('Registro de reina guardado', { type: 'success' });
        } catch (err) {
            console.error('Error registrando reina', err);
            toast(friendlyError(err, 'Error al registrar la reina'), { type: 'error' });
        } finally {
            setSavingReina(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {/* ── Provenance ── */}
            <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>
                    Origen del núcleo / colmena
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Tipo de origen</label>
                        <select className="input-field w-full" value={form.origen_tipo} onChange={e => setForm({ ...form, origen_tipo: e.target.value as TipoOrigen | '' })}>
                            <option value="">— Selecciona —</option>
                            {TIPOS_ORIGEN.map(t => (
                                <option key={t} value={t} className="bg-card text-foreground">{ORIGEN_LABEL[t]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Fecha de origen</label>
                        <input type="date" className="input-field w-full" value={form.origen_fecha} onChange={e => setForm({ ...form, origen_fecha: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Colmena madre (división/traspaso)</label>
                        <select className="input-field w-full" value={form.origen_colmena_madre} onChange={e => setForm({ ...form, origen_colmena_madre: e.target.value })}>
                            <option value="">— Sin madre —</option>
                            {colmenas.filter(c => c.id !== colmena.id).map(c => (
                                <option key={c.id} value={c.id} className="bg-card text-foreground">{c.name} · {c.apiario_name || 'Sin apiario'}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Detalle</label>
                        <input className="input-field w-full" placeholder="Criadero, proveedor, paraje de captura…" value={form.origen_detalle} onChange={e => setForm({ ...form, origen_detalle: e.target.value })} />
                    </div>
                </div>
                <div style={{ marginTop: 'var(--space-md)' }}>
                    <button className="btn btn-primary btn-sm" onClick={handleSaveOrigen} disabled={savingOrigen || !colmena.id || colmena.id.length < 20}>
                        <Save size={13} style={{ display: 'inline', marginRight: 6 }} />{savingOrigen ? 'Guardando…' : 'Guardar origen'}
                    </button>
                </div>
                {form.origen_tipo && (
                    <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.07)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, borderLeft: '3px solid hsl(var(--accent))' }}>
                        <strong>{ORIGEN_LABEL[form.origen_tipo as TipoOrigen]}</strong>
                        {form.origen_fecha && <> · desde {form.origen_fecha}</>}
                        {madre && (
                            <>
                                {' · hija de '}
                                {onOpenColmena ? (
                                    <button
                                        type="button"
                                        onClick={() => onOpenColmena(madre.id)}
                                        className="text-primary hover:underline font-semibold"
                                    >
                                        {madre.name}
                                    </button>
                                ) : (
                                    <strong>{madre.name}</strong>
                                )}
                            </>
                        )}
                        {form.origen_detalle && <div style={{ marginTop: 4 }}>{form.origen_detalle}</div>}
                    </div>
                )}

                {hijas.length > 0 && onOpenColmena && (
                    <div style={{ marginTop: 'var(--space-md)' }}>
                        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>
                            <GitBranch size={12} style={{ display: 'inline', marginRight: 6 }} />Hijas de esta colmena
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {hijas.map((h) => (
                                <button
                                    key={h.id}
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => onOpenColmena(h.id)}
                                >
                                    {h.name || 'Colmena'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Linaje de reinas ── */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>
                        <Crown size={12} style={{ display: 'inline', marginRight: 6 }} />Linaje de reinas
                    </div>
                    <button className="btn btn-gold btn-sm" onClick={() => setShowReinaForm(!showReinaForm)} disabled={!colmena.id || colmena.id.length < 20}>
                        <Plus size={13} /> Registrar reina
                    </button>
                </div>

                {showReinaForm && (
                    <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                            <input type="date" className="input-field w-full" value={reinaForm.fecha} onChange={e => setReinaForm({ ...reinaForm, fecha: e.target.value })} />
                            <select className="input-field w-full" value={reinaForm.estado} onChange={e => setReinaForm({ ...reinaForm, estado: e.target.value as ReinaHistoryRow['estado'] })}>
                                <option value="RV" className="bg-card text-foreground">RV — Reina vista</option>
                                <option value="NV" className="bg-card text-foreground">NV — Reina no vista</option>
                                <option value="SR" className="bg-card text-foreground">SR — Sin reina</option>
                            </select>
                            <input className="input-field w-full" placeholder="Color (ej. marcada amarillo)" value={reinaForm.color} onChange={e => setReinaForm({ ...reinaForm, color: e.target.value })} />
                            <input className="input-field w-full" placeholder="Vigor (ej. fuerte)" value={reinaForm.vigor} onChange={e => setReinaForm({ ...reinaForm, vigor: e.target.value })} />
                            <input className="input-field w-full" placeholder="Postura (ej. compacta)" value={reinaForm.postura} onChange={e => setReinaForm({ ...reinaForm, postura: e.target.value })} />
                            <input className="input-field w-full" placeholder="Notas" value={reinaForm.notas} onChange={e => setReinaForm({ ...reinaForm, notas: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowReinaForm(false)}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={handleAddReina} disabled={savingReina}>
                                {savingReina ? 'Guardando…' : 'Guardar registro'}
                            </button>
                        </div>
                    </div>
                )}

                {reinas.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Sin historial registrado. Registra cada reina por temporada para documentar el linaje.</div>
                )}
                {reinas.map((r, i) => {
                    const car = (r.caracteristicas ?? {}) as Record<string, unknown>;
                    return (
                        <div key={r.id || i} style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid hsl(var(--border) / 0.3)', alignItems: 'flex-start' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: ESTADO_REINA_COLOR[r.estado], marginTop: 5, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{r.fecha}</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: ESTADO_REINA_COLOR[r.estado] }}>{ESTADO_REINA_LABEL[r.estado]}</span>
                                    {r.reemplazada_por && <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>→ reemplazada</span>}
                                </div>
                                {Boolean(car.color || car.vigor || car.postura) && (
                                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                                        {[car.color, car.vigor, car.postura].filter(Boolean).join(' · ')}
                                    </div>
                                )}
                                {Boolean(car.notas) && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{String(car.notas)}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
