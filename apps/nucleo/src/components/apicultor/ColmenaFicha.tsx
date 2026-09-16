import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Crown, Droplets, Scale, DollarSign, Link, AlertTriangle, CheckCircle2, ChevronRight, Plus, Anchor, ShieldCheck, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BOSQUE_ULMO, BOSQUE_ULMO_LIGHT, ORO_MIEL, TEXT_MUTED } from '@/lib/colors';
import { ChartBox } from '@/components/charts/ChartBox';
import type { ColmenaWithRelations, InspeccionRow, VarroaRow, PesoRow } from '@/lib/apicultor-types';
import type { HistorialColmena } from '@/lib/bitacora-types';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '../../lib/supabase';
import { toast, friendlyError, ImmersiveModal } from '@enjambre/ui';
import { ColmenaOrigenTab } from './ColmenaOrigenTab';
import { ColmenaBitacoraTab } from './ColmenaBitacoraTab';
import { ColmenaSanidadTab } from './ColmenaSanidadTab';
import { FASE_LABEL } from './bitacora-labels';
import { buildHiveState, type HiveStateContext } from '@/lib/hive-state';
import { HiveStateBadge, HiveStateDot } from './HiveStateBadge';
import { HiveWhatIfPanel } from './HiveWhatIfPanel';

type Tab = 'resumen' | 'inspecciones' | 'varroa' | 'peso' | 'costos' | 'origen' | 'bitacora' | 'sanidad' | 'blockchain';

interface Props {
    colmena: ColmenaWithRelations;
    colmenas: ColmenaWithRelations[];
    onClose: () => void;
    onUpdate: (updated: ColmenaWithRelations) => void;
    /** Navegación de linaje: abrir otra colmena (madre/hija) desde la ficha. */
    onOpenColmena?: (id: string) => void;
    hiveCtx?: HiveStateContext;
}

const varroaColor = (v: number) => v <= 1.5 ? 'hsl(var(--success))' : v <= 3 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

export function ColmenaFicha({ colmena, colmenas, onClose, onUpdate, onOpenColmena, hiveCtx }: Props) {
    const [tab, setTab] = useState<Tab>('resumen');
    const apiFetch = useApiFetch();
    const realId = Boolean(colmena.id && colmena.id.length >= 20);
    // RLS (mig 40): inspecciones/varroa/peso exigen user_id = auth.uid().
    // Sin esta columna el insert viola la policy para roles no-gerente.
    const [uid, setUid] = useState<string | null>(colmena.user_id ?? null);
    useEffect(() => {
        if (uid) return;
        void supabase.auth.getUser().then((res: { data: { user: { id?: string | null } | null } | null }) => {
            setUid(res.data?.user?.id ?? null);
        });
    }, [uid]);

    // B2: voz del comprador — reseñas aprobadas del lote activo de esta colmena.
    const loteActivoUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        colmena.lote_activo ?? '',
    );
    const [resenasLote, setResenasLote] = useState<{ total: number; promedio: number | null; familias: string[] } | null>(null);
    useEffect(() => {
        setResenasLote(null);
        if (!loteActivoUuid || !realId) return;
        apiFetch(`/api/resenas/lote-agregado?lote_id=${colmena.lote_activo}`)
            .then(async (res) => {
                if (!res.ok) return;
                const j = await res.json();
                setResenasLote(j.data ?? null);
            })
            .catch(() => undefined);
    }, [colmena.lote_activo, loteActivoUuid, realId, apiFetch]);

    const hiveState = useMemo(
        () =>
            buildHiveState(colmena, {
                ...hiveCtx,
                apiarioLat: hiveCtx?.apiarioLat ?? colmena.lat,
                apiarioLng: hiveCtx?.apiarioLng ?? colmena.lng,
            }),
        [colmena, hiveCtx],
    );

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

    // B3: costos reales persistidos en costos_colmena (antes solo display).
    const [editandoCostos, setEditandoCostos] = useState(false);
    const [costosForm, setCostosForm] = useState({ horas_anuales: '', costo_hora: '', amortizacion_cajon: '', insumos_anuales: '' });
    const [guardandoCostos, setGuardandoCostos] = useState(false);
    const abrirEdicionCostos = () => {
        setCostosForm({
            horas_anuales: String(colmena.costos?.horas_anuales ?? ''),
            costo_hora: String(colmena.costos?.costo_hora ?? ''),
            amortizacion_cajon: String(colmena.costos?.amortizacion_cajon ?? ''),
            insumos_anuales: String(colmena.costos?.insumos_anuales ?? ''),
        });
        setEditandoCostos(true);
    };
    const guardarCostos = async () => {
        if (!realId) {
            toast('Guarda primero la colmena para editar costos', { type: 'error' });
            return;
        }
        setGuardandoCostos(true);
        try {
            const res = await apiFetch(`/api/bitacora/costos/${colmena.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    horas_anuales: parseFloat(costosForm.horas_anuales) || 0,
                    costo_hora: parseFloat(costosForm.costo_hora) || 0,
                    amortizacion_cajon: parseFloat(costosForm.amortizacion_cajon) || 0,
                    insumos_anuales: parseFloat(costosForm.insumos_anuales) || 0,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || 'Error guardando costos');
            }
            onUpdate({
                ...colmena,
                costos: {
                    horas_anuales: parseFloat(costosForm.horas_anuales) || 0,
                    costo_hora: parseFloat(costosForm.costo_hora) || 0,
                    amortizacion_cajon: parseFloat(costosForm.amortizacion_cajon) || 12000,
                    insumos_anuales: parseFloat(costosForm.insumos_anuales) || 0,
                    produccion_kg: colmena.costos?.produccion_kg ?? 0,
                },
            });
            setEditandoCostos(false);
            toast('Costos guardados', { type: 'success' });
        } catch (e) {
            toast(friendlyError(e, 'Error guardando costos'), { type: 'error' });
        } finally {
            setGuardandoCostos(false);
        }
    };

    const [showPesoForm, setShowPesoForm] = useState(false);
    const [pesoForm, setPesoForm] = useState({ date: new Date().toISOString().split('T')[0], kg: 0, note: '' });

    const prodKg = (colmena.costos?.produccion_kg && colmena.costos.produccion_kg > 0)
        ? colmena.costos.produccion_kg
        : (colmena.production_total || 0);
    const costoProd = (colmena.costos?.horas_anuales || 0) * (colmena.costos?.costo_hora || 0)
        + (colmena.costos?.amortizacion_cajon || 0) + (colmena.costos?.insumos_anuales || 0);
    const costoKg = prodKg > 0
        ? Math.round(costoProd / prodKg)
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
            toast('Trazabilidad de la colmena sellada digitalmente', { type: 'success' });
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
        <ImmersiveModal
            open
            onClose={onClose}
            size="lg"
            eyebrow="Colmena"
            title={colmena.name}
            bodyClassName="!p-0"
        >
            {/* Subheader estado + tabs */}
            <div className="border-b border-border px-5 py-4 sm:px-6 bg-surface-sunken/40">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <HiveStateDot risk={hiveState.risk} color={hiveState.color} size={12} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                            <MapPin size={11} />
                            {colmena.apiario_name || 'Sin apiario'} · Lote: {colmena.lote_activo || 'N/A'}
                        </div>
                        <div style={{ marginTop: 6 }}>
                            <HiveStateBadge state={hiveState} size="sm" showAction />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>{colmena.production_total || 0} kg</div>
                        <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-foreground))' }}>Producción temporada</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                            style={{
                                background: tab === t.id ? 'hsl(var(--primary))' : 'hsl(var(--muted) / 0.5)',
                                color: tab === t.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                            }}
                        >
                            {t.icon} {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ overflow: 'auto', flex: 1, padding: 'var(--space-lg)', maxHeight: 'min(60vh, 520px)' }}>

                    {/* ── RESUMEN ── */}
                    {tab === 'resumen' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { label: 'Riesgo compuesto', value: hiveState.riskLabel, color: hiveState.color },
                                    { label: 'Alzas activas', value: `${colmena.alzas || 0} alzas`, color: 'hsl(var(--primary))' },
                                    { label: 'Señales', value: hiveState.signalQuality === 'rich' ? 'Ricas' : hiveState.signalQuality === 'partial' ? 'Parciales' : 'Escasas', color: hiveState.signalQuality === 'rich' ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' },
                                ].map((s, i) => (
                                    <div key={i} style={{ padding: 'var(--space-md)', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            {hiveState.primaryAction && (
                                <div
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-sm)',
                                        background: `${hiveState.color}18`,
                                        border: `1px solid ${hiveState.color}33`,
                                        fontSize: '0.8rem',
                                        color: hiveState.color,
                                        fontWeight: 500,
                                    }}
                                >
                                    Acción sugerida: {hiveState.primaryAction}
                                </div>
                            )}

                            <HiveWhatIfPanel state={hiveState} />
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
                        <ColmenaOrigenTab colmena={colmena} colmenas={colmenas} historial={historial} refetchHistorial={() => void refetchHistorial()} onUpdate={onUpdate} onOpenColmena={onOpenColmena} />
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
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
                                    <div className="flex flex-col sm:flex-row gap-2 mt-3 justify-end w-full">
                                        <button className="btn btn-ghost btn-sm w-full sm:w-auto" onClick={() => setShowInspeccionForm(false)}>Cancelar</button>
                                        <button className="btn btn-primary btn-sm w-full sm:w-auto" onClick={async () => {
                                            const newInspeccion = { ...inspeccionForm, inspector: 'Apicultor' } as InspeccionRow;

                                            // Write to Supabase first
                                            if (colmena.id) {
                                                const { error } = await supabase.from('inspecciones').insert({
                                                    colmena_id: colmena.id, date: newInspeccion.date, inspector: newInspeccion.inspector || 'Apicultor',
                                                    marcos_cria: newInspeccion.marcos_cria, marcos_miel: newInspeccion.marcos_miel, varroa: newInspeccion.varroa,
                                                    poblacion: newInspeccion.poblacion?.toLowerCase(), reina: newInspeccion.reina, enjambrazon_riesgo: newInspeccion.enjambrazon_riesgo, notes: newInspeccion.notes,
                                                    user_id: colmena.user_id ?? uid
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
                                                    colmena_id: colmena.id, date: varroaForm.date, level: varroaForm.level, method: varroaForm.method,
                                                    user_id: colmena.user_id ?? uid
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
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
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
                                                    colmena_id: colmena.id, date: pesoForm.date, kg: pesoForm.kg, note: pesoForm.note,
                                                    user_id: colmena.user_id ?? uid
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
                                {(() => {
                                    const pesoActual = colmena.peso_records?.at(-1)?.kg || 0;
                                    const pesoInicial = colmena.peso_records?.[0]?.kg || 0;
                                    const diff = pesoActual - pesoInicial;
                                    const gananciaLabel = diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`;
                                    return [
                                        { label: 'Peso actual', value: `${pesoActual} kg` },
                                        { label: 'Ganancia total', value: gananciaLabel },
                                        { label: 'Flujo diario est.', value: '~0.5 kg/d' },
                                    ];
                                })().map((s, i) => (
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
                                    { label: 'Producción', value: `${prodKg} kg`, color: 'hsl(var(--foreground))' },
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
                                <strong>Margen bruto colmena:</strong> ${(margenKg * prodKg).toLocaleString()} esta temporada
                            </div>

                            {editandoCostos ? (
                                <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', border: '1px solid hsl(var(--border) / 0.5)', borderRadius: 'var(--radius-sm)' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Editar costos de temporada</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <input type="number" min="0" className="input-field w-full" placeholder="Horas anuales" value={costosForm.horas_anuales} onChange={e => setCostosForm({ ...costosForm, horas_anuales: e.target.value })} />
                                        <input type="number" min="0" className="input-field w-full" placeholder="$ por hora" value={costosForm.costo_hora} onChange={e => setCostosForm({ ...costosForm, costo_hora: e.target.value })} />
                                        <input type="number" min="0" className="input-field w-full" placeholder="$ amortización cajón" value={costosForm.amortizacion_cajon} onChange={e => setCostosForm({ ...costosForm, amortizacion_cajon: e.target.value })} />
                                        <input type="number" min="0" className="input-field w-full" placeholder="$ insumos anuales" value={costosForm.insumos_anuales} onChange={e => setCostosForm({ ...costosForm, insumos_anuales: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditandoCostos(false)}>Cancelar</button>
                                        <button className="btn btn-primary btn-sm" onClick={() => void guardarCostos()} disabled={guardandoCostos}>
                                            {guardandoCostos ? 'Guardando…' : 'Guardar costos'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ marginTop: 'var(--space-md)' }}>
                                    <button className="btn btn-outline btn-sm" onClick={abrirEdicionCostos}>
                                        Editar costos
                                    </button>
                                </div>
                            )}
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

                            {/* Anclaje digital de trazabilidad */}
                            <div style={{ padding: 'var(--space-md)', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
                                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))', marginBottom: 'var(--space-sm)', lineHeight: 1.5 }}>
                                    Genera un sello digital inmutable del estado actual de la colmena para certificar su trazabilidad de origen.
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleAnclar} disabled={anclando || !realId}>
                                        <Anchor size={13} style={{ display: 'inline', marginRight: 6 }} />
                                        {anclando ? 'Sellando…' : 'Sellar trazabilidad digital'}
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
                                {resenasLote && resenasLote.total > 0 && (
                                    <div style={{ marginTop: 'var(--space-sm)', padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'hsl(var(--foreground))', borderLeft: '3px solid hsl(var(--gold, hsl(var(--primary))))' }}>
                                        <strong>Lo que dicen quienes la probaron:</strong> ★ {resenasLote.promedio} ({resenasLote.total} reseña{resenasLote.total === 1 ? '' : 's'})
                                        {resenasLote.familias.length > 0 && <> · {resenasLote.familias.join(', ')}</>}
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'hsl(var(--accent) / 0.07)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6 }}>
                                <ChevronRight size={12} style={{ display: 'inline', color: 'hsl(var(--accent))' }} />
                                {' '}Trazabilidad digital: el registro de este lote cuenta con un sello digital inmutable para certificar su origen e integridad en la cadena de trazabilidad territorial.
                            </div>
                        </div>
                    )}
                </div>
        </ImmersiveModal>
    );
}
