import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Crown, Droplets, Scale, DollarSign, Link, AlertTriangle, CheckCircle2, ChevronRight, Plus, Anchor, ShieldCheck, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BOSQUE_ULMO, BOSQUE_ULMO_LIGHT, ORO_MIEL, TEXT_MUTED } from '@/lib/colors';
import { ChartBox } from '@/components/charts/ChartBox';
import type { ColmenaWithRelations, InspeccionRow, VarroaRow, PesoRow } from '@/lib/apicultor-types';
import type { HistorialColmena } from '@/lib/bitacora-types';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '../../lib/supabase';
import { toast, friendlyError } from '@enjambre/ui';
import { ColmenaOrigenTab } from './ColmenaOrigenTab';
import { ColmenaBitacoraTab } from './ColmenaBitacoraTab';
import { ColmenaSanidadTab } from './ColmenaSanidadTab';
import { FASE_LABEL } from './bitacora-labels';

type Tab = 'resumen' | 'inspecciones' | 'varroa' | 'peso' | 'costos' | 'origen' | 'bitacora' | 'sanidad' | 'blockchain';

interface Props { colmena: ColmenaWithRelations; colmenas: ColmenaWithRelations[]; onClose: () => void; onUpdate: (updated: ColmenaWithRelations) => void; }

const varroaColor = (v: number) => v <= 1.5 ? 'hsl(var(--success))' : v <= 3 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
const healthLabel = (h: string) => h === 'optimal' ? 'Óptima' : h === 'attention' ? 'Atención' : 'Riesgo';

export function ColmenaFicha({ colmena, colmenas, onClose, onUpdate }: Props) {
    const [tab, setTab] = useState<Tab>('resumen');
    const apiFetch = useApiFetch();
    const realId = Boolean(colmena.id && colmena.id.length >= 20);

    // Historial completo de la bitácora: inspecciones+cuadros, tratamientos,
    // reinas, alerta de retiro y origen (GET /api/bitacora/colmenas/:id)
    const { data: historial, refetch: refetchHistorial } = useQuery<HistorialColmena>({
        queryKey: ['bitacora-colmena', colmena.id],
        queryFn: async () => {
            const res = await apiFetch(`/api/bitacora/colmenas/${colmena.id}`);
            if (!res.ok) throw new Error('Error cargando bitácora');
            const json = await res.json();
            return json.data as HistorialColmena;
        },
        enabled: realId,
    });

    // Modal forms states
    const [showInspeccionForm, setShowInspeccionForm] = useState(false);
    const [inspeccionForm, setInspeccionForm] = useState({ date: new Date().toISOString().split('T')[0], marcos_cria: 0, marcos_miel: 0, varroa: 0, poblacion: 'Baja', reina: true, notes: '', enjambrazon_riesgo: 'bajo' as 'bajo' | 'medio' | 'alto' });

    const [showVarroaForm, setShowVarroaForm] = useState(false);
    const [varroaForm, setVarroaForm] = useState({ date: new Date().toISOString().split('T')[0], level: 0, method: 'Alcohol' });

    const [showPesoForm, setShowPesoForm] = useState(false);
    const [pesoForm, setPesoForm] = useState({ date: new Date().toISOString().split('T')[0], kg: 0, note: '' });

    const costoProd = (colmena.costos?.horas_anuales || 0) * (colmena.costos?.costo_hora || 0)
        + (colmena.costos?.amortizacion_cajon || 0) + (colmena.costos?.insumos_anuales || 0);
    const costoKg = (colmena.costos?.produccion_kg || 0) > 0
        ? Math.round(costoProd / colmena.costos!.produccion_kg)
        : 0;
    const precioVenta = 12000;
    const margenKg = precioVenta - costoKg;

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'resumen', label: 'Resumen', icon: '🐝' },
        { id: 'origen', label: 'Origen', icon: '🧬' },
        { id: 'bitacora', label: 'Bitácora', icon: '📔' },
        { id: 'sanidad', label: 'Sanidad', icon: '💊' },
        { id: 'inspecciones', label: 'Inspecciones', icon: '📋' },
        { id: 'varroa', label: 'Varroa', icon: '🔬' },
        { id: 'peso', label: 'Peso', icon: '⚖️' },
        { id: 'costos', label: 'Costos', icon: '💰' },
        { id: 'blockchain', label: 'Trazabilidad', icon: '🔗' },
    ];

    // ── Anclaje on-chain (testnet Polygon Amoy — sin costo real) ──────────────
    const [anclando, setAnclando] = useState(false);
    const [anclaError, setAnclaError] = useState<string | null>(null);
    const [anclaOk, setAnclaOk] = useState<{ tx_hash?: string; explorer_url?: string; data_hash?: string } | null>(null);
    const [verificando, setVerificando] = useState(false);
    const [verificacion, setVerificacion] = useState<{ confirmed?: boolean; block_number?: number; block_timestamp?: string } | null>(null);

    const { data: anclas = [], refetch: refetchAnclas } = useQuery<Array<{ id: string; tx_hash: string | null; chain: string | null; block_number: number | null; block_timestamp: string | null; data_hash: string | null; created_at: string | null }>>({
        queryKey: ['blockchain-anclas', colmena.id],
        queryFn: async () => {
            const res = await apiFetch(`/api/blockchain/anchors/colmena/${colmena.id}`);
            if (!res.ok) throw new Error('Error cargando anclas');
            const json = await res.json();
            return (json.data ?? []) as Array<{ id: string; tx_hash: string | null; chain: string | null; block_number: number | null; block_timestamp: string | null; data_hash: string | null; created_at: string | null }>;
        },
        enabled: realId,
    });

    const handleAnclar = async () => {
        setAnclando(true);
        setAnclaError(null);
        setAnclaOk(null);
        try {
            const res = await apiFetch('/api/blockchain/anchor', {
                method: 'POST',
                body: JSON.stringify({ entity_type: 'colmena', entity_id: colmena.id }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message ?? json.code ?? 'No se pudo anclar la colmena');
            setAnclaOk(json.data);
            await refetchAnclas();
            onUpdate({ ...colmena, blockchain_hash: json.data?.tx_hash ?? colmena.blockchain_hash });
            toast('Colmena anclada en Polygon Amoy (testnet)', { type: 'success' });
        } catch (err) {
            console.error('Error anclando colmena', err);
            setAnclaError(err instanceof Error ? err.message : 'Error al anclar');
        } finally {
            setAnclando(false);
        }
    };

    const handleVerificar = async (txHash: string) => {
        setVerificando(true);
        setVerificacion(null);
        try {
            const res = await apiFetch('/api/blockchain/verify', {
                method: 'POST',
                body: JSON.stringify({ tx_hash: txHash, chain: 'polygon-amoy' }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.message ?? json.code ?? 'No se pudo verificar');
            setVerificacion(json.data);
        } catch (err) {
            console.error('Error verificando ancla', err);
            toast(friendlyError(err, 'Error al verificar'), { type: 'error' });
        } finally {
            setVerificando(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
            <div className="card" style={{
                position: 'relative', zIndex: 301, width: '95%', maxWidth: 680,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                padding: 0, overflow: 'hidden', animation: 'fadeInUp 0.3s ease'
            }}>
                {/* Header */}
                <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid hsl(var(--border) / 0.5)', background: `linear-gradient(135deg, hsl(var(--primary)) 0%, ${BOSQUE_ULMO_LIGHT} 100%)`, color: 'hsl(var(--primary-foreground))' }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'hsl(var(--primary-foreground) / 0.15)', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'hsl(var(--primary-foreground))', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: colmena.health === 'optimal' ? 'hsl(var(--success))' : colmena.health === 'attention' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))', boxShadow: '0 0 8px currentColor', flexShrink: 0 }} />
                        <div>
                            <h3 style={{ color: 'hsl(var(--primary-foreground))', marginBottom: 2, fontSize: '1.15rem' }}>{colmena.name}</h3>
                            <div style={{ fontSize: '0.78rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} />{colmena.apiario_name || 'Sin apiario'} · Lote: {colmena.lote_activo || 'N/A'}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>{colmena.production_total || 0} kg</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Producción temporada</div>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{
                                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                fontSize: '0.75rem', fontWeight: 500, fontFamily: 'var(--font-datos)',
background: tab === t.id ? 'hsl(var(--accent))' : 'hsl(var(--primary-foreground) / 0.12)',
color: tab === t.id ? 'hsl(var(--primary))' : 'hsl(var(--primary-foreground) / 0.8)',
                                transition: 'all 150ms'
                            }}>{t.icon} {t.label}</button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div style={{ overflow: 'auto', flex: 1, padding: 'var(--space-lg)' }}>

                    {/* ── RESUMEN ── */}
                    {tab === 'resumen' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-md)' }}>
                                {[
                                    { label: 'Estado', value: healthLabel(colmena.health || 'risk'), color: colmena.health === 'optimal' ? 'hsl(var(--success))' : colmena.health === 'attention' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' },
                                    { label: 'Alzas activas', value: `${colmena.alzas || 0} alzas`, color: 'hsl(var(--primary))' },
                                    { label: 'Núcleos', value: colmena.nucleos_candidatos ? 'Candidata ✓' : 'No aplica', color: colmena.nucleos_candidatos ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' },
                                ].map((s, i) => (
                                    <div key={i} style={{ padding: 'var(--space-md)', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            {[
                                { icon: <Crown size={14} />, label: 'Reina activa', value: colmena.queen || 'N/A' },
                                { icon: <Droplets size={14} />, label: 'Última inspección', value: colmena.last_inspection || 'Sin inspección' },
                                { icon: <span style={{ fontSize: '0.85rem' }}>🌸</span>, label: 'Floración', value: colmena.floracion || 'N/A' },
                                { icon: <AlertTriangle size={14} />, label: 'Último varroa', value: `${colmena.varroa_records?.at(-1)?.level ?? '–'}/10 (${colmena.varroa_records?.at(-1)?.date ?? '–'})` },
                            ].map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid hsl(var(--border) / 0.3)', alignItems: 'center' }}>
                                    <span style={{ color: 'hsl(var(--accent))', width: 20 }}>{r.icon}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', width: 130, flexShrink: 0 }}>{r.label}</span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{r.value}</span>
                                </div>
                            ))}
                            {colmena.notes && (
                                <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.07)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, borderLeft: '3px solid hsl(var(--accent))' }}>
                                    {colmena.notes}
                                </div>
                            )}
                            {/* Reina history */}
                            <div>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-sm)' }}>Linaje de Reinas</div>
                                {(historial?.reinas ?? []).length === 0 && (
                                    <div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>Sin historial registrado</div>
                                )}
                                {(historial?.reinas ?? []).slice(0, 3).map((r, i) => (
                                    <div key={r.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: '0.78rem' }}>
                                        <span style={{ color: r.estado === 'RV' ? 'hsl(var(--success))' : r.estado === 'NV' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))', fontWeight: 700 }}>{r.estado}</span>
                                        <span style={{ color: 'hsl(var(--muted-foreground))' }}>{r.fecha}</span>
                                        {typeof (r.caracteristicas as Record<string, unknown> | null)?.color === 'string' && <span>· {(r.caracteristicas as Record<string, string>).color}</span>}
                                    </div>
                                ))}
                                <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, fontSize: '0.7rem' }} onClick={() => setTab('origen')}>Ver linaje completo →</button>
                            </div>
                        </div>
                    )}

                    {/* ── ORIGEN / PROVENANCE ── */}
                    {tab === 'origen' && (
                        <ColmenaOrigenTab colmena={colmena} colmenas={colmenas} historial={historial} refetchHistorial={() => void refetchHistorial()} onUpdate={onUpdate} />
                    )}

                    {/* ── BITÁCORA (ciclo de vida) ── */}
                    {tab === 'bitacora' && (
                        <ColmenaBitacoraTab colmena={colmena} colmenas={colmenas} historial={historial} refetchHistorial={() => void refetchHistorial()} onUpdate={onUpdate} />
                    )}

                    {/* ── SANIDAD ── */}
                    {tab === 'sanidad' && (
                        <ColmenaSanidadTab colmena={colmena} colmenas={colmenas} historial={historial} refetchHistorial={() => void refetchHistorial()} onUpdate={onUpdate} />
                    )}

                    {/* ── INSPECCIONES ── */}
                    {tab === 'inspecciones' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Historial de inspecciones</div>
                                <button className="btn btn-gold btn-sm" onClick={() => setShowInspeccionForm(!showInspeccionForm)}><Plus size={13} /> Nueva</button>
                            </div>
                            {showInspeccionForm && (
                                <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 'var(--space-sm)' }}>Nueva inspección — {inspeccionForm.date}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 8 }}>
                                        <input type="number" placeholder="Marcos Cría" className="input-field w-full" value={inspeccionForm.marcos_cria || ''} onChange={e => setInspeccionForm({ ...inspeccionForm, marcos_cria: parseInt(e.target.value) || 0 })} />
                                        <input type="number" placeholder="Marcos Miel" className="input-field w-full" value={inspeccionForm.marcos_miel || ''} onChange={e => setInspeccionForm({ ...inspeccionForm, marcos_miel: parseInt(e.target.value) || 0 })} />
                                        <select className="input-field w-full" value={inspeccionForm.poblacion} onChange={e => setInspeccionForm({ ...inspeccionForm, poblacion: e.target.value })}>
                                            <option value="Baja">Población: Baja</option>
                                            <option value="Media">Población: Media</option>
                                            <option value="Alta">Población: Alta</option>
                                        </select>
                                        <select className="input-field w-full" value={inspeccionForm.enjambrazon_riesgo} onChange={e => setInspeccionForm({ ...inspeccionForm, enjambrazon_riesgo: e.target.value as 'bajo' | 'medio' | 'alto' })}>
                                            <option value="bajo">Enjambración: Bajo</option>
                                            <option value="medio">Enjambración: Medio</option>
                                            <option value="alto">Enjambración: Alto</option>
                                        </select>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                                            <input type="checkbox" checked={inspeccionForm.reina} onChange={e => setInspeccionForm({ ...inspeccionForm, reina: e.target.checked })} /> Reina vista
                                        </div>
                                    </div>
                                    <textarea placeholder="Notas adicionales..." value={inspeccionForm.notes} onChange={e => setInspeccionForm({ ...inspeccionForm, notes: e.target.value })}
                                        style={{ width: '100%', minHeight: 60, padding: 'var(--space-sm)', border: '1px solid hsl(var(--input))', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-datos)', fontSize: '0.85rem', resize: 'vertical' }} />
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowInspeccionForm(false)}>Cancelar</button>
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            const newInspeccion = { ...inspeccionForm, inspector: 'Apicultor' } as InspeccionRow;

                                            // Write to Supabase first
                                            if (colmena.id) {
                                                const { error } = await supabase.from('inspecciones').insert({
                                                    colmena_id: colmena.id, date: newInspeccion.date, inspector: newInspeccion.inspector || 'Apicultor',
                                                    marcos_cria: newInspeccion.marcos_cria, marcos_miel: newInspeccion.marcos_miel, varroa: newInspeccion.varroa,
                                                    poblacion: newInspeccion.poblacion?.toLowerCase(), reina: newInspeccion.reina, enjambrazon_riesgo: newInspeccion.enjambrazon_riesgo, notes: newInspeccion.notes
                                                });
                                                if (error) {
                                                    toast(friendlyError(error, 'Error al guardar la inspección'), { type: 'error' });
                                                    return;
                                                }
                                                toast('Inspección guardada exitosamente', { type: 'success' });
                                            }

                                            onUpdate({ ...colmena, inspecciones: [newInspeccion, ...(colmena.inspecciones || [])] });
                                            setShowInspeccionForm(false);
                                        }}>Guardar</button>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {colmena.inspecciones?.map((ins, i) => (
                                    <div key={i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border) / 0.5)', background: i === 0 ? 'hsl(var(--muted) / 0.5)' : 'transparent' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--foreground))' }}>{ins.date}</span>
                                            <span className={`badge ${ins.enjambrazon_riesgo === 'bajo' ? 'badge-success' : ins.enjambrazon_riesgo === 'medio' ? 'badge-gold' : 'badge-danger'}`}>
                                                Enjambr.: {ins.enjambrazon_riesgo}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 'var(--space-sm)' }}>
                                            {[
                                                { label: 'Cría', value: `${ins.marcos_cria} marcos` },
                                                { label: 'Miel', value: `${ins.marcos_miel} marcos` },
                                                { label: 'Varroa', value: `${ins.varroa}/10`, color: varroaColor(ins.varroa ?? 0) },
                                                { label: 'Población', value: ins.poblacion },
                                            ].map((s, j) => (
                                                <div key={j} style={{ textAlign: 'center', padding: 6, background: 'hsl(var(--muted) / 0.5)', borderRadius: 6 }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: s.color || 'hsl(var(--foreground))' }}>{s.value}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            {ins.reina ? <CheckCircle2 size={13} style={{ color: 'hsl(var(--success))' }} /> : <AlertTriangle size={13} style={{ color: 'hsl(var(--destructive))' }} />}
                                            <span style={{ fontSize: '0.78rem', color: ins.reina ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>{ins.reina ? 'Reina presente' : 'Sin reina'}</span>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>{ins.notes}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── VARROA ── */}
                    {tab === 'varroa' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>Evolución Varroa (nivel 0–10)</div>
                                <button className="btn btn-gold btn-sm" onClick={() => setShowVarroaForm(!showVarroaForm)}><Plus size={13} /> Registro</button>
                            </div>

                            {showVarroaForm && (
                                <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <input type="number" step="0.5" className="input-field w-full" placeholder="Nivel (0-10)" value={varroaForm.level || ''} onChange={e => setVarroaForm({ ...varroaForm, level: parseFloat(e.target.value) || 0 })} />
                                        <select className="input-field w-full" value={varroaForm.method} onChange={e => setVarroaForm({ ...varroaForm, method: e.target.value })}>
                                            <option value="Lavado con alcohol">Lavado con alcohol</option>
                                            <option value="Caída natural">Caída natural</option>
                                            <option value="CO2">CO2</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowVarroaForm(false)}>Cancelar</button>
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            if (colmena.id) {
                                                const { error } = await supabase.from('varroa_records').insert({
                                                    colmena_id: colmena.id, date: varroaForm.date, level: varroaForm.level, method: varroaForm.method
                                                });
                                                if (error) {
                                                    toast(friendlyError(error, 'Error al guardar registro de varroa'), { type: 'error' });
                                                    return;
                                                }
                                                toast('Registro de varroa guardado exitosamente', { type: 'success' });
                                            }
                                            onUpdate({ ...colmena, varroa_records: [...(colmena.varroa_records || []), { date: varroaForm.date, level: varroaForm.level, method: varroaForm.method, id: Date.now().toString(), colmena_id: colmena.id } as VarroaRow] });
                                            setShowVarroaForm(false);
                                        }}>Registrar</button>
                                    </div>
                                </div>
                            )}

                            <ChartBox height={200} className="mb-[var(--space-lg)]">
                                <LineChart data={colmena.varroa_records || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                                    <YAxis domain={[0, 6]} tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontFamily: 'Inter', fontSize: '0.8rem' }} />
                                    <Line type="monotone" dataKey="level" stroke={ORO_MIEL} strokeWidth={2} dot={{ fill: ORO_MIEL, r: 5 }} name="Varroa/10" />
                                </LineChart>
                            </ChartBox>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                {[{ label: '< 1.5 ✓ Óptimo', color: 'hsl(var(--success))' }, { label: '1.5–3 ⚠ Atención', color: 'hsl(var(--warning))' }, { label: '> 3 🔴 Riesgo', color: 'hsl(var(--destructive))' }].map((z, i) => (
                                    <div key={i} style={{ padding: '6px 12px', borderRadius: 20, background: `${z.color}18`, fontSize: '0.72rem', fontWeight: 500, color: z.color }}>{z.label}</div>
                                ))}
                            </div>
                            {colmena.varroa_records?.map((v, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: varroaColor(v.level || 0), flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', width: 100 }}>{v.date}</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: varroaColor(v.level || 0), width: 50 }}>{v.level}</span>
                                    <span style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>{v.method}</span>
                                </div>
                            ))}
                            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.07)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', lineHeight: 1.6, color: 'hsl(var(--muted-foreground))' }}>
                                <strong>Umbrales apicultura regenerativa:</strong> Tratar con timol (ácido timol) o ácido oxálico sublimado cuando supere nivel 2.5. Nunca usar amitraz. Registrar siempre la fecha y método.
                            </div>
                        </div>
                    )}

                    {/* ── PESO ── */}
                    {tab === 'peso' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))' }}>Evolución de Peso (kg)</div>
                                <button className="btn btn-gold btn-sm" onClick={() => setShowPesoForm(!showPesoForm)}><Plus size={13} /> Peso</button>
                            </div>

                            {showPesoForm && (
                                <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <input type="number" step="0.1" className="input-field w-full" placeholder="Peso en kg" value={pesoForm.kg || ''} onChange={e => setPesoForm({ ...pesoForm, kg: parseFloat(e.target.value) || 0 })} />
                                        <input type="text" className="input-field w-full" placeholder="Nota opcional" value={pesoForm.note} onChange={e => setPesoForm({ ...pesoForm, note: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowPesoForm(false)}>Cancelar</button>
                                        <button className="btn btn-primary btn-sm" onClick={async () => {
                                            if (colmena.id) {
                                                const { error } = await supabase.from('peso_records').insert({
                                                    colmena_id: colmena.id, date: pesoForm.date, kg: pesoForm.kg, note: pesoForm.note
                                                });
                                                if (error) {
                                                    toast(friendlyError(error, 'Error al guardar registro de peso'), { type: 'error' });
                                                    return;
                                                }
                                                toast('Registro de peso guardado exitosamente', { type: 'success' });
                                            }
                                            onUpdate({ ...colmena, peso_records: [...(colmena.peso_records || []), { date: pesoForm.date, kg: pesoForm.kg, note: pesoForm.note, id: Date.now().toString(), colmena_id: colmena.id } as PesoRow] });
                                            setShowPesoForm(false);
                                        }}>Registrar</button>
                                    </div>
                                </div>
                            )}

                            <ChartBox height={200} className="mb-6">
                                <LineChart data={colmena.peso_records || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
                                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontFamily: 'Inter', fontSize: '0.8rem' }} />
                                    <Line type="monotone" dataKey="kg" stroke={BOSQUE_ULMO} strokeWidth={2} dot={{ fill: BOSQUE_ULMO, r: 4 }} name="Peso (kg)" />
                                </LineChart>
                            </ChartBox>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                {[
                                    { label: 'Peso actual', value: `${colmena.peso_records?.at(-1)?.kg || 0} kg` },
                                    { label: 'Ganancia total', value: `+${((colmena.peso_records?.at(-1)?.kg || 0) - (colmena.peso_records?.[0]?.kg || 0)).toFixed(1)} kg` },
                                    { label: 'Flujo diario est.', value: '~0.5 kg/d' },
                                ].map((s, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{s.value}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'hsl(var(--muted-foreground))' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            {colmena.peso_records?.map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: '6px 0', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                                    <Scale size={13} style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', flex: 1 }}>{p.date}</span>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>{p.kg} kg</span>
                                    {p.note && <span style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', maxWidth: 120 }}>{p.note}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── COSTOS ── */}
                    {tab === 'costos' && (
                        <div>
                            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-md)' }}>Contabilidad por colmena · Temporada 2026</div>
                            {[
                                { label: 'Horas trabajadas', value: `${colmena.costos?.horas_anuales || 0} h × $${(colmena.costos?.costo_hora || 0).toLocaleString()}/h`, total: (colmena.costos?.horas_anuales || 0) * (colmena.costos?.costo_hora || 0) },
                                { label: 'Amortización cajón', value: '$12.000/año', total: colmena.costos?.amortizacion_cajon || 0 },
                                { label: 'Insumos (timol, ácidos)', value: 'Anuales', total: colmena.costos?.insumos_anuales || 0 },
                            ].map((row, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) var(--space-md)', borderBottom: '1px solid hsl(var(--border) / 0.3)', fontSize: '0.85rem' }}>
                                    <div><div style={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>{row.label}</div><div style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>{row.value}</div></div>
                                    <span style={{ fontWeight: 600 }}>${row.total.toLocaleString()}</span>
                                </div>
                            ))}
                            <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-sm)', marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                <span>Total costo temporada</span><span>${costoProd.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                                {[
{ label: 'Producción', value: `${colmena.costos?.produccion_kg || 0} kg`, color: 'hsl(var(--foreground))' },
      { label: 'Costo/kg real', value: `$${costoKg.toLocaleString()}`, color: 'hsl(var(--warning))' },
      { label: 'Margen/kg', value: `$${margenKg.toLocaleString()}`, color: 'hsl(var(--success))' },
                                ].map((s, i) => (
                                    <div key={i} style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-sm)' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'hsl(var(--accent-foreground))' }}>
                                <DollarSign size={14} style={{ display: 'inline', marginRight: 4 }} />
                                <strong>Margen bruto colmena:</strong> ${(margenKg * (colmena.costos?.produccion_kg || 0)).toLocaleString()} esta temporada
                            </div>
                        </div>
                    )}

                    {/* ── BLOCKCHAIN / TRAZABILIDAD ── */}
                    {tab === 'blockchain' && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-md)' }}>
                                <Link size={16} style={{ color: 'hsl(var(--foreground))' }} />
                                <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>Trazabilidad de la colmena</span>
                                {colmena.blockchain_hash
                                    ? <span className="badge badge-success" style={{ fontSize: '0.65rem' }}><ShieldCheck size={10} style={{ display: 'inline', marginRight: 4 }} />Anclada</span>
                                    : <span className="badge" style={{ fontSize: '0.65rem' }}>Sin anclar</span>}
                            </div>

                            {/* Anclaje on-chain (testnet Polygon Amoy — sin costo real) */}
                            <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
                                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
                                    Ancla el estado actual de la colmena en blockchain (testnet Polygon Amoy, sin costo). El hash firmado queda inmutable y verificable.
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleAnclar} disabled={anclando || !realId}>
                                        <Anchor size={13} style={{ display: 'inline', marginRight: 6 }} />
                                        {anclando ? 'Anclando…' : 'Anclar en blockchain'}
                                    </button>
                                    {colmena.blockchain_hash && (
                                        <button className="btn btn-outline btn-sm" onClick={() => handleVerificar(colmena.blockchain_hash!)} disabled={verificando}>
                                            <ShieldCheck size={13} style={{ display: 'inline', marginRight: 6 }} />
                                            {verificando ? 'Verificando…' : 'Verificar integridad'}
                                        </button>
                                    )}
                                </div>
                                {anclaError && (
                                    <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'hsl(var(--destructive))' }}>{anclaError}</div>
                                )}
                                {anclaOk?.explorer_url && (
                                    <a href={anclaOk.explorer_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-sm)', fontSize: '0.75rem', color: 'hsl(var(--primary))' }}>
                                        Ver transacción en el explorador <ExternalLink size={12} />
                                    </a>
                                )}
                                {verificacion && (
                                    <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.78rem', color: verificacion.confirmed ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
                                        {verificacion.confirmed ? `✓ Confirmada en bloque ${verificacion.block_number}` : '✗ Transacción no confirmada'}
                                        {verificacion.block_timestamp && <> · {verificacion.block_timestamp}</>}
                                    </div>
                                )}
                            </div>

                            {/* Hash actual */}
                            <div style={{ display: 'flex', gap: 'var(--space-md)', padding: '8px 0', borderBottom: '1px solid hsl(var(--border) / 0.3)', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', width: 140, flexShrink: 0, paddingTop: 2 }}>Hash blockchain</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: colmena.blockchain_hash ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    {colmena.blockchain_hash || 'Pendiente — ancla la colmena para firmar su estado'}
                                </span>
                            </div>

                            {/* Historial de anclas */}
                            {anclas.length > 0 && (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Anclas registradas</div>
                                    {anclas.map(a => (
                                        <div key={a.id} style={{ display: 'flex', gap: 'var(--space-md)', padding: '6px 0', borderBottom: '1px solid hsl(var(--border) / 0.2)', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', width: 90, flexShrink: 0 }}>{a.block_timestamp?.slice(0, 10) ?? '—'}</span>
                                            <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'hsl(var(--foreground))', wordBreak: 'break-all', flex: 1 }}>{a.tx_hash}</span>
                                            <span style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>{a.chain}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Ficha del lote (contexto comercial) */}
                            <div style={{ marginTop: 'var(--space-lg)' }}>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}>Lote activo</div>
                                {[
                                    { label: 'Lote activo', value: colmena.lote_activo || 'Sin lote activo' },
                                    { label: 'Apiario', value: colmena.apiario_name || 'Desconocido' },
                                    { label: 'Floración', value: colmena.floracion || 'N/A' },
                                    { label: 'Producción temporada', value: `${colmena.production_total || 0} kg miel virgen` },
                                ].map((r, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', padding: '8px 0', borderBottom: '1px solid hsl(var(--border) / 0.3)', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))', width: 140, flexShrink: 0, paddingTop: 2 }}>{r.label}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'hsl(var(--foreground))' }}>{r.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.07)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                                <ChevronRight size={12} style={{ display: 'inline', color: 'hsl(var(--accent))' }} />
                                {' '}El anclaje usa testnet Polygon Amoy: cuesta 0 CLP y no consume cuota de Supabase ni Vercel. El hash se recomputa desde <code>data_payload</code> para verificar que el estado firmado no fue alterado.
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}
