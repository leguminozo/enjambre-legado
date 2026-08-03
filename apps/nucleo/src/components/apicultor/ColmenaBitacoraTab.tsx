import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import type { CuerpoCuadro, FaseBitacora, TipoCuadro } from '@/lib/bitacora-types';
import { CUERPOS_CUADRO, TIPOS_CUADRO, FASES_BITACORA } from '@/lib/bitacora-types';
import { CUERPO_LABEL, FASE_LABEL, TIPO_CUADRO_LABEL } from './bitacora-labels';
import type { ColmenaTabProps } from './colmena-tab-props';

interface CuadroDraft {
    posicion: number;
    cuerpo: CuerpoCuadro;
    tipo: TipoCuadro;
    notas: string;
}

const POBLACIONES = ['Baja', 'Media', 'Alta'];

/** Bitácora del ciclo de vida: núcleo → traspaso → alzas → cosecha → invernada → temporada. */
export function ColmenaBitacoraTab({ colmena, historial, refetchHistorial, onUpdate }: ColmenaTabProps) {
    const apiFetch = useApiFetch();

    const [showForm, setShowForm] = useState(false);
    const [fase, setFase] = useState<FaseBitacora>('nucleo');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [poblacion, setPoblacion] = useState('Media');
    const [reinaVista, setReinaVista] = useState(true);
    const [marcosCria, setMarcosCria] = useState(0);
    const [marcosMiel, setMarcosMiel] = useState(0);
    const [varroa, setVarroa] = useState(0);
    const [notas, setNotas] = useState('');
    const [cuadros, setCuadros] = useState<CuadroDraft[]>([{ posicion: 1, cuerpo: 'camara', tipo: 'vacio', notas: '' }]);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardado, setGuardado] = useState(false);

    const realId = Boolean(colmena.id && colmena.id.length >= 20);

    const updateCuadro = (i: number, patch: Partial<CuadroDraft>) => {
        setCuadros(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));
    };

    const handleSave = async () => {
        if (!realId) return;
        setSaving(true);
        setFormError(null);
        setGuardado(false);
        try {
            const res = await apiFetch('/api/bitacora/inspecciones', {
                method: 'POST',
                body: JSON.stringify({
                    colmena_id: colmena.id,
                    fecha,
                    fase,
                    poblacion,
                    reina: reinaVista,
                    marcos_cria: marcosCria,
                    marcos_miel: marcosMiel,
                    varroa,
                    cuadros: cuadros.filter(c => c.tipo),
                    notas: notas.trim() || undefined,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                // 409 retiro_vigente: la regla §2.3 bloquea alza durante retiro
                throw new Error(json.message ?? json.code ?? 'No se pudo guardar la inspección');
            }
            // Alzas derivadas del cuerpo máximo (misma lógica del BFF)
            const maxAlza = Math.max(1, ...cuadros
                .map(c => Number(String(c.cuerpo).replace('alza_', '')))
                .filter(n => Number.isFinite(n)));
            onUpdate({
                ...colmena,
                last_inspection: fecha,
                alzas: fase === 'alza' ? Math.max(1, maxAlza) : colmena.alzas,
            });
            await refetchHistorial();
            setShowForm(false);
            setGuardado(true);
            toast('Entrada de bitácora guardada', { type: 'success' });
        } catch (err) {
            console.error('Error guardando entrada de bitácora', err);
            setFormError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const inspecciones = historial?.inspecciones ?? [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Ciclo de vida de la colmena</div>
                    <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>Núcleo → traspaso → alzas → cosecha → invernada → nueva temporada</div>
                </div>
                <button className="btn btn-gold btn-sm" onClick={() => setShowForm(!showForm)} disabled={!realId}>
                    <Plus size={13} /> Nueva entrada
                </button>
            </div>

            {!realId && (
                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Guarda la colmena primero para registrar su bitácora.</div>
            )}

            {showForm && (
                <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <select className="input-field w-full" value={fase} onChange={e => setFase(e.target.value as FaseBitacora)}>
                            {FASES_BITACORA.map(f => (
                                <option key={f} value={f} className="bg-card text-foreground">{FASE_LABEL[f]}</option>
                            ))}
                        </select>
                        <input type="date" className="input-field w-full" value={fecha} onChange={e => setFecha(e.target.value)} />
                        <select className="input-field w-full" value={poblacion} onChange={e => setPoblacion(e.target.value)}>
                            {POBLACIONES.map(p => (
                                <option key={p} value={p} className="bg-card text-foreground">Población: {p}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                        <input type="number" min={0} className="input-field w-full" placeholder="Marcos cría" value={marcosCria || ''} onChange={e => setMarcosCria(parseInt(e.target.value) || 0)} />
                        <input type="number" min={0} className="input-field w-full" placeholder="Marcos miel" value={marcosMiel || ''} onChange={e => setMarcosMiel(parseInt(e.target.value) || 0)} />
                        <input type="number" min={0} step="0.5" className="input-field w-full" placeholder="Varroa (0-10)" value={varroa || ''} onChange={e => setVarroa(parseFloat(e.target.value) || 0)} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                            <input type="checkbox" checked={reinaVista} onChange={e => setReinaVista(e.target.checked)} /> Reina vista
                        </label>
                    </div>

                    {/* Cuadros individualizados (C/L/E/V/M, §1.1–1.2) */}
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>
                        Cuadros individualizados
                    </div>
                    {cuadros.map((c, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr 32px', gap: 8, marginBottom: 6 }}>
                            <input type="number" min={1} className="input-field w-full" placeholder="Pos." value={c.posicion || ''} onChange={e => updateCuadro(i, { posicion: parseInt(e.target.value) || 0 })} />
                            <select className="input-field w-full" value={c.cuerpo} onChange={e => updateCuadro(i, { cuerpo: e.target.value as CuerpoCuadro })}>
                                {CUERPOS_CUADRO.map(cb => (
                                    <option key={cb} value={cb} className="bg-card text-foreground">{CUERPO_LABEL[cb]}</option>
                                ))}
                            </select>
                            <select className="input-field w-full" value={c.tipo} onChange={e => updateCuadro(i, { tipo: e.target.value as TipoCuadro })}>
                                {TIPOS_CUADRO.map(t => (
                                    <option key={t} value={t} className="bg-card text-foreground">{TIPO_CUADRO_LABEL[t]}</option>
                                ))}
                            </select>
                            <input className="input-field w-full" placeholder="Nota (opcional)" value={c.notas} onChange={e => updateCuadro(i, { notas: e.target.value })} />
                            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'hsl(var(--destructive))' }} onClick={() => setCuadros(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                        </div>
                    ))}
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setCuadros(prev => [...prev, { posicion: prev.length + 1, cuerpo: 'camara', tipo: 'vacio', notas: '' }])}>
                        <Plus size={13} style={{ display: 'inline', marginRight: 4 }} /> Agregar cuadro
                    </button>

                    <textarea
                        placeholder="Notas de la visita…"
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        style={{ width: '100%', minHeight: 56, marginTop: 8, padding: 'var(--space-sm)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', resize: 'vertical', background: 'hsl(var(--surface-sunken) / 0.6)' }}
                    />
                    {formError && (
                        <div style={{ marginTop: 8, padding: 'var(--space-sm)', background: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive) / 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'hsl(var(--destructive))' }}>
                            {formError}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                            {saving ? 'Guardando…' : 'Guardar entrada'}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {inspecciones.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>Sin entradas de bitácora. Cada fase del ciclo se registra con el mismo esquema para comparar temporadas.</div>
                )}
                {inspecciones.map((ins, i) => (
                    <div key={ins.id || i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)', background: i === 0 ? 'hsl(var(--muted) / 0.5)' : 'transparent' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}>{ins.date}</span>
                            {ins.fase && <span className="badge badge-gold">{FASE_LABEL[ins.fase]}</span>}
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
