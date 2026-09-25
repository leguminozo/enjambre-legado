import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    MapPin,
    Crown,
    Droplets,
    Scale,
    DollarSign,
    Link as LinkIcon,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Anchor,
    ShieldCheck,
    ExternalLink,
    Mic,
    Sparkles,
    LayoutDashboard,
    BookOpen,
    HeartPulse,
    Dna,
    Flower2,
    Star,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { BOSQUE_ULMO, ORO_MIEL, TEXT_MUTED } from '@/lib/colors';
import { ChartBox } from '@/components/charts/ChartBox';
import type { ColmenaWithRelations, VarroaRow, PesoRow } from '@/lib/apicultor-types';
import type { HistorialColmena } from '@/lib/bitacora-types';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '../../lib/supabase';
import { toast, friendlyError, ImmersiveModal } from '@enjambre/ui';
import { ColmenaOrigenTab } from './ColmenaOrigenTab';
import { ColmenaBitacoraTab } from './ColmenaBitacoraTab';
import { ColmenaSanidadTab } from './ColmenaSanidadTab';
import { HojaForm } from './cuaderno/HojaForm';
import { VarroaForm } from './cuaderno/VarroaForm';
import { BitacoraVozModal, type ParsedInspeccionVoice } from './cuaderno/BitacoraVozModal';
import { buildHiveState, type HiveStateContext } from '@/lib/hive-state';
import { HiveStateBadge, HiveStateDot } from './HiveStateBadge';
import { ColmenaArquitectura, type SelectedCuadroInfo } from './ColmenaArquitectura';
import { HiveWhatIfPanel } from './HiveWhatIfPanel';
import type { CuerpoCuadro, TipoCuadro } from '@/lib/bitacora-types';

type Tab = 'resumen' | 'bitacora' | 'sanidad' | 'produccion' | 'origen';

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
    const [selectedCuadro, setSelectedCuadro] = useState<SelectedCuadroInfo | null>(null);
    const apiFetch = useApiFetch();
    const realId = Boolean(colmena.id && colmena.id.length >= 20);

    const [uid, setUid] = useState<string | null>(colmena.user_id ?? null);
    useEffect(() => {
        if (uid) return;
        void supabase.auth.getUser().then((res: { data: { user: { id?: string | null } | null } | null }) => {
            setUid(res.data?.user?.id ?? null);
        });
    }, [uid]);

    // Reseñas del lote activo de esta colmena
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

    // Historial completo de la bitácora: inspecciones, tratamientos, reinas, alertas
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

    const [showInspeccionForm, setShowInspeccionForm] = useState(false);
    const [showVarroaForm, setShowVarroaForm] = useState(false);
    const [showVozModal, setShowVozModal] = useState(false);
    const [voiceParsed, setVoiceParsed] = useState<ParsedInspeccionVoice | null>(null);

    const { data: varroaFromApi } = useQuery<VarroaRow[]>({
        queryKey: ['bitacora-varroa', colmena.id],
        queryFn: async () => {
            const res = await apiFetch(`/api/bitacora/varroa?colmena_id=${colmena.id}`);
            if (!res.ok) throw new Error('Error cargando varroa');
            const json = await res.json();
            return (json.data ?? []) as VarroaRow[];
        },
        enabled: realId,
    });
    const varroaList = varroaFromApi ?? colmena.varroa_records ?? [];

    const latestInspeccion = useMemo(() => {
        if (historial?.inspecciones && historial.inspecciones.length > 0) {
            return historial.inspecciones[0];
        }
        if (colmena.inspecciones && colmena.inspecciones.length > 0) {
            return colmena.inspecciones[colmena.inspecciones.length - 1];
        }
        return null;
    }, [historial?.inspecciones, colmena.inspecciones]);

    const latestVarroa = useMemo(() => {
        if (varroaList && varroaList.length > 0) {
            return varroaList[varroaList.length - 1];
        }
        return null;
    }, [varroaList]);

    // Costos reales persistidos
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

    // 5 módulos consolidados de alto estatus con iconografía técnica refinada
    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'resumen', label: 'Resumen', icon: <LayoutDashboard size={14} className="shrink-0" /> },
        { id: 'bitacora', label: 'Bitácora', icon: <BookOpen size={14} className="shrink-0" /> },
        { id: 'sanidad', label: 'Sanidad', icon: <HeartPulse size={14} className="shrink-0" /> },
        { id: 'produccion', label: 'Producción', icon: <Scale size={14} className="shrink-0" /> },
        { id: 'origen', label: 'Origen & Sello', icon: <Dna size={14} className="shrink-0" /> },
    ];

    // Sello digital de trazabilidad y autenticidad
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
            if (!res.ok) throw new Error(json.message ?? json.code ?? 'No se pudo generar el sello digital');
            setAnclaOk(json.data);
            await refetchAnclas();
            onUpdate({ ...colmena, blockchain_hash: json.data?.tx_hash ?? colmena.blockchain_hash });
            toast('Sello digital de autenticidad emitido exitosamente', { type: 'success' });
        } catch (err) {
            console.error('Error sellando colmena', err);
            setAnclaError(err instanceof Error ? err.message : 'Error al sellar');
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
            console.error('Error verificando sello digital', err);
            toast(friendlyError(err, 'Error al verificar'), { type: 'error' });
        } finally {
            setVerificando(false);
        }
    };

    return (
        <ImmersiveModal
            open
            onClose={onClose}
            size="xl"
            eyebrow="Colmena"
            title={colmena.name}
            bodyClassName="!p-0 flex flex-col h-full overflow-hidden"
        >
            {/* Subheader: Estado, telemetría territorial, acciones rápidas apícolas y producción */}
            <div className="border-b border-border px-5 py-3.5 sm:px-6 bg-surface-sunken/40 shrink-0">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Identidad territorial y estado de salud */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <HiveStateDot risk={hiveState.risk} color={hiveState.color} size={12} />
                        <div className="min-w-0">
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                <MapPin size={12} />
                                <span>{colmena.apiario_name || 'Sin apiario'}</span>
                                <span>·</span>
                                <span>Lote: {colmena.lote_activo || 'N/A'}</span>
                            </div>
                            <div className="mt-1">
                                <HiveStateBadge state={hiveState} size="sm" />
                            </div>
                        </div>
                    </div>

                    {/* Acciones principales apícolas + Producción temporada */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        {/* Botones de acción rápida apícola integrados en el comando superior */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowVozModal(true)}
                                disabled={!realId}
                                className="btn btn-gold flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium shadow-sm transition-all"
                                title="Dictar inspección por voz apícola con Groq AI"
                            >
                                <Mic size={14} />
                                <span className="hidden sm:inline">Dictar inspección por voz</span>
                                <span className="sm:hidden">Dictar voz</span>
                                <span className="text-[10px] opacity-80 font-mono hidden md:flex items-center gap-1">
                                    <Sparkles size={11} /> Groq AI
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setVoiceParsed(null);
                                    setShowInspeccionForm(true);
                                }}
                                disabled={!realId}
                                className="btn btn-outline flex items-center gap-1.5 py-1.5 px-2.5 text-xs"
                                title="Ingresar inspección de forma manual"
                            >
                                <Plus size={14} />
                                <span>Manual</span>
                            </button>
                        </div>

                        <div className="text-right shrink-0 border-l border-border/60 pl-3.5">
                            <div className="text-xl sm:text-2xl font-bold font-display text-accent">{colmena.production_total || 0} kg</div>
                            <div className="text-[10px] sm:text-[11px] text-muted-foreground">Producción temporada</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Espacio de trabajo dual: Mapa de Campo / Arquitectura a la izquierda + Panel de Control a la derecha */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                {/* ── COLUMNA IZQUIERDA: Anatomía & Mapa de Campo Cuadro por Cuadro ── */}
                <div className="w-full lg:w-[470px] xl:w-[490px] shrink-0 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto p-4 sm:p-5 bg-surface-sunken/20 space-y-4">
                    <ColmenaArquitectura
                        colmena={colmena}
                        latestInspeccion={latestInspeccion}
                        latestVarroa={latestVarroa}
                        selectedCuadro={selectedCuadro}
                        onSelectCuadro={setSelectedCuadro}
                        onAccionCuadro={(cuadro, accion) => {
                            if (accion === 'dictar') {
                                setShowVozModal(true);
                            } else {
                                const cuerpoKey: CuerpoCuadro = cuadro.cuerpo === 'camara' ? 'camara' : cuadro.cuerpo.startsWith('alza') ? (cuadro.cuerpo as CuerpoCuadro) : 'camara';
                                const tipoKey: TipoCuadro = cuadro.tipo === 'cria' ? 'cria_cerrada' : (cuadro.tipo as TipoCuadro);
                                setVoiceParsed({
                                    cuadros: [{ cuerpo: cuerpoKey, tipo: tipoKey }],
                                    notasCompletas: `Inspección enfocada: ${cuadro.cuerpoLabel}, marco #${cuadro.posicion} (${cuadro.tipoLabel})`,
                                });
                                setShowInspeccionForm(true);
                            }
                        }}
                    />

                    {/* Telemetría Biológica Rápida */}
                    <div className="rounded-xl border border-border/60 bg-card/70 p-3.5 space-y-2.5">
                        <div className="text-[11px] uppercase tracking-wider font-mono text-muted-foreground flex items-center justify-between">
                            <span>Telemetría de Campo Rápida</span>
                            <span className="text-[10px] text-accent font-semibold">{colmena.health || 'Estable'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-sunken/40 border border-border/20">
                                <Crown size={14} className="text-accent shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[10px] text-muted-foreground">Reina activa</div>
                                    <div className="font-medium truncate text-foreground">{colmena.queen || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-sunken/40 border border-border/20">
                                <Droplets size={14} className="text-accent shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[10px] text-muted-foreground">Última inspección</div>
                                    <div className="font-medium truncate text-foreground">{colmena.last_inspection || 'Sin inspección'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-sunken/40 border border-border/20">
                                <Flower2 size={14} className="text-accent shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[10px] text-muted-foreground">Floración</div>
                                    <div className="font-medium truncate text-foreground">{colmena.floracion || 'N/A'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-sunken/40 border border-border/20">
                                <AlertTriangle size={14} className="text-accent shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[10px] text-muted-foreground">Último Varroa</div>
                                    <div className="font-medium truncate text-foreground">
                                        {colmena.varroa_records?.at(-1)?.level != null ? `${colmena.varroa_records.at(-1)?.level}/10` : '–'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── COLUMNA DERECHA: Navegador de módulos + Contenido detallado ── */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-card">
                    {/* Selector de módulos estilo segmented switcher */}
                    <div className="border-b border-border/70 p-3 sm:px-5 bg-surface-sunken/20 shrink-0">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                            {tabs.map((t) => {
                                const isActive = tab === t.id;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTab(t.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-left border ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                                                : 'bg-surface-raised/40 text-muted-foreground border-border/40 hover:bg-surface-raised hover:text-foreground'
                                        }`}
                                    >
                                        <span className={isActive ? 'text-primary-foreground' : 'text-accent'}>{t.icon}</span>
                                        <span className="truncate">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contenedor scrolleable del módulo activo */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
                        {/* ── 1. RESUMEN ── */}
                        {tab === 'resumen' && (
                            <div className="space-y-5">
                                {/* Métricas clave */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { label: 'Riesgo compuesto', value: hiveState.riskLabel, color: hiveState.color },
                                        { label: 'Alzas activas', value: (colmena.alzas ?? 0) === 0 ? '0 (cámara única)' : `${colmena.alzas} ${colmena.alzas === 1 ? 'alza' : 'alzas'}`, color: 'hsl(var(--primary))' },
                                        { label: 'Calidad señales', value: hiveState.signalQuality === 'rich' ? 'Ricas' : hiveState.signalQuality === 'partial' ? 'Parciales' : 'Escasas', color: hiveState.signalQuality === 'rich' ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' },
                                    ].map((s, i) => (
                                        <div key={i} className="p-3.5 bg-muted/40 rounded-xl text-center border border-border/30">
                                            <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Banner contextual si hay un marco seleccionado */}
                                {selectedCuadro && (
                                    <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-primary" />
                                                <span>Marco seleccionado: {selectedCuadro.cuerpoLabel} · Posición #{selectedCuadro.posicion}</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Estado biológico: <strong>{selectedCuadro.tipoLabel}</strong>. Puedes registrar inspección manual o dictar con IA.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCuadro(null)}
                                            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                )}

                                {/* Motor de Decisión: Simulación What-If */}
                                <HiveWhatIfPanel state={hiveState} defaultExpanded={false} />

                                {colmena.notes && (
                                    <div className="p-3 bg-accent/5 rounded-xl text-xs text-muted-foreground leading-relaxed border-l-2 border-accent">
                                        {colmena.notes}
                                    </div>
                                )}

                                {/* Linaje de Reinas resumido */}
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] uppercase tracking-wider font-mono text-muted-foreground">Linaje de Reinas</span>
                                        <button
                                            type="button"
                                            onClick={() => setTab('origen')}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            Ver genealogía completa →
                                        </button>
                                    </div>
                                    {(historial?.reinas ?? []).length === 0 ? (
                                        <p className="text-xs text-muted-foreground">Sin historial de reinas registrado.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {(historial?.reinas ?? []).slice(0, 3).map((r, i) => (
                                                <div key={r.id || i} className="flex items-center gap-3 text-xs py-1">
                                                    <span className={`font-bold ${r.estado === 'RV' ? 'text-success' : r.estado === 'NV' ? 'text-warning' : 'text-destructive'}`}>
                                                        {r.estado}
                                                    </span>
                                                    <span className="text-muted-foreground">{r.fecha}</span>
                                                    {typeof (r.caracteristicas as Record<string, unknown> | null)?.color === 'string' && (
                                                        <span className="text-muted-foreground">· Color: {(r.caracteristicas as Record<string, string>).color}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                {/* ── 2. BITÁCORA (ciclo de vida e inspecciones) ── */}
                {tab === 'bitacora' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-surface-raised border border-border/50">
                            <div>
                                <h4 className="text-xs font-semibold text-foreground">Registro de Campo</h4>
                                <p className="text-[11px] text-muted-foreground">Inspecciona y registra datos directamente con dictado o entrada manual.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowVozModal(true)}
                                disabled={!realId}
                                className="btn btn-gold btn-sm flex items-center gap-1.5 shrink-0"
                            >
                                <Mic size={13} />
                                <span>Dictar por voz</span>
                            </button>
                        </div>

                        <ColmenaBitacoraTab
                            colmena={colmena}
                            colmenas={colmenas}
                            historial={historial}
                            refetchHistorial={() => void refetchHistorial()}
                            onUpdate={onUpdate}
                        />
                    </div>
                )}

                {/* ── 3. SANIDAD (Varroa + Tratamientos + Alertas de Retiro) ── */}
                {tab === 'sanidad' && (
                    <div className="space-y-6">
                        {/* Sección Varroa: gráfico y registros */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Evolución Varroa (Nivel 0–10)</h4>
                                    <p className="text-[11px] text-muted-foreground">Monitoreo continuo para mantener la colonia bajo umbrales biológicos seguros.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-gold btn-sm flex items-center gap-1.5"
                                    onClick={() => setShowVarroaForm(true)}
                                    disabled={!realId}
                                >
                                    <Plus size={13} />
                                    <span>Registrar Varroa</span>
                                </button>
                            </div>

                            <VarroaForm
                                open={showVarroaForm}
                                onOpenChange={setShowVarroaForm}
                                colmenas={[{ id: colmena.id, name: colmena.name ?? null }]}
                                colmenaIdFijo={colmena.id}
                                onSaved={() => {
                                    void refetchHistorial();
                                    onUpdate({ ...colmena, varroa_records: varroaList });
                                }}
                            />

                            <ChartBox height={190} className="mb-3">
                                <LineChart data={varroaList}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                                    <Line type="monotone" dataKey="level" stroke={ORO_MIEL} strokeWidth={2} dot={{ fill: ORO_MIEL, r: 4 }} name="Varroa/10" />
                                </LineChart>
                            </ChartBox>

                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { label: '< 1.5 · Óptimo', color: 'hsl(var(--success))' },
                                    { label: '1.5–3 · Vigilancia', color: 'hsl(var(--warning))' },
                                    { label: '> 3 · Umbral crítico', color: 'hsl(var(--destructive))' },
                                ].map((z, i) => (
                                    <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border" style={{ background: `${z.color}15`, color: z.color, borderColor: `${z.color}30` }}>
                                        <span className="size-1.5 rounded-full shrink-0" style={{ background: z.color }} />
                                        <span>{z.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tratamientos fitosanitarios y muestras biológicas */}
                        <div className="pt-4 border-t border-border/50">
                            <ColmenaSanidadTab
                                colmena={colmena}
                                colmenas={colmenas}
                                historial={historial}
                                refetchHistorial={() => void refetchHistorial()}
                                onUpdate={onUpdate}
                            />
                        </div>
                    </div>
                )}

                {/* ── 4. PRODUCCIÓN (Rendimiento, Peso y Márgenes) ── */}
                {tab === 'produccion' && (
                    <div className="space-y-6">
                        {/* Monitor de Peso y Curva de Flujo */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Monitoreo de Peso (kg)</h4>
                                    <p className="text-[11px] text-muted-foreground">Evolución de peso del cajón y llenado de alzas melarias.</p>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-gold btn-sm flex items-center gap-1.5"
                                    onClick={() => setShowPesoForm(!showPesoForm)}
                                >
                                    <Plus size={13} />
                                    <span>Registrar peso</span>
                                </button>
                            </div>

                            {showPesoForm && (
                                <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="input-field w-full text-sm"
                                            placeholder="Peso en kg"
                                            value={pesoForm.kg || ''}
                                            onChange={(e) => setPesoForm({ ...pesoForm, kg: parseFloat(e.target.value) || 0 })}
                                        />
                                        <input
                                            type="text"
                                            className="input-field w-full text-sm"
                                            placeholder="Nota opcional"
                                            value={pesoForm.note}
                                            onChange={(e) => setPesoForm({ ...pesoForm, note: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button className="btn btn-ghost btn-sm" onClick={() => setShowPesoForm(false)}>
                                            Cancelar
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={async () => {
                                                if (colmena.id) {
                                                    const { error } = await supabase.from('peso_records').insert({
                                                        colmena_id: colmena.id,
                                                        date: pesoForm.date,
                                                        kg: pesoForm.kg,
                                                        note: pesoForm.note,
                                                        user_id: colmena.user_id ?? uid,
                                                    });
                                                    if (error) {
                                                        toast(friendlyError(error, 'Error al guardar registro de peso'), { type: 'error' });
                                                        return;
                                                    }
                                                    toast('Registro de peso guardado exitosamente', { type: 'success' });
                                                }
                                                onUpdate({
                                                    ...colmena,
                                                    peso_records: [
                                                        ...(colmena.peso_records || []),
                                                        { date: pesoForm.date, kg: pesoForm.kg, note: pesoForm.note, id: Date.now().toString(), colmena_id: colmena.id } as PesoRow,
                                                    ],
                                                });
                                                setShowPesoForm(false);
                                            }}
                                        >
                                            Guardar peso
                                        </button>
                                    </div>
                                </div>
                            )}

                            <ChartBox height={190} className="mb-3">
                                <LineChart data={colmena.peso_records || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={TEXT_MUTED} />
                                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} stroke={TEXT_MUTED} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                                    <Line type="monotone" dataKey="kg" stroke={BOSQUE_ULMO} strokeWidth={2} dot={{ fill: BOSQUE_ULMO, r: 4 }} name="Peso (kg)" />
                                </LineChart>
                            </ChartBox>

                            <div className="grid grid-cols-3 gap-2.5">
                                {(() => {
                                    const pesoActual = colmena.peso_records?.at(-1)?.kg || 0;
                                    const pesoInicial = colmena.peso_records?.[0]?.kg || 0;
                                    const diff = pesoActual - pesoInicial;
                                    const gananciaLabel = diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`;
                                    return [
                                        { label: 'Peso actual', value: `${pesoActual} kg` },
                                        { label: 'Ganancia neta', value: gananciaLabel },
                                        { label: 'Flujo diario est.', value: '~0.5 kg/d' },
                                    ];
                                })().map((s, i) => (
                                    <div key={i} className="p-3 bg-muted/40 rounded-xl text-center border border-border/30">
                                        <div className="text-sm sm:text-base font-bold text-foreground">{s.value}</div>
                                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contabilidad y Costos de Temporada */}
                        <div className="pt-4 border-t border-border/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Economía de la Colmena</h4>
                                    <p className="text-[11px] text-muted-foreground">Márgenes y costos operativos directos por colmena.</p>
                                </div>
                                <button className="btn btn-outline btn-sm" onClick={abrirEdicionCostos}>
                                    Editar costos
                                </button>
                            </div>

                            {editandoCostos && (
                                <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
                                    <div className="text-xs font-semibold text-foreground">Actualizar costos operativos de la temporada</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="text-[10px] uppercase text-muted-foreground font-mono">Horas anuales</label>
                                            <input type="number" min="0" className="input-field w-full text-sm" value={costosForm.horas_anuales} onChange={(e) => setCostosForm({ ...costosForm, horas_anuales: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-muted-foreground font-mono">Costo por hora ($)</label>
                                            <input type="number" min="0" className="input-field w-full text-sm" value={costosForm.costo_hora} onChange={(e) => setCostosForm({ ...costosForm, costo_hora: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-muted-foreground font-mono">Amortización cajón ($)</label>
                                            <input type="number" min="0" className="input-field w-full text-sm" value={costosForm.amortizacion_cajon} onChange={(e) => setCostosForm({ ...costosForm, amortizacion_cajon: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-muted-foreground font-mono">Insumos anuales ($)</label>
                                            <input type="number" min="0" className="input-field w-full text-sm" value={costosForm.insumos_anuales} onChange={(e) => setCostosForm({ ...costosForm, insumos_anuales: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditandoCostos(false)}>
                                            Cancelar
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={() => void guardarCostos()} disabled={guardandoCostos}>
                                            {guardandoCostos ? 'Guardando…' : 'Guardar costos'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {[
                                    { label: 'Producción total', value: `${prodKg} kg`, color: 'hsl(var(--foreground))' },
                                    { label: 'Costo unitario real', value: `$${costoKg.toLocaleString()}/kg`, color: 'hsl(var(--warning))' },
                                    { label: 'Margen neto', value: `$${margenKg.toLocaleString()}/kg`, color: 'hsl(var(--success))' },
                                ].map((s, i) => (
                                    <div key={i} className="p-3 bg-muted/40 rounded-xl text-center border border-border/30">
                                        <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
                                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">Margen bruto estimado temporada:</span>
                                <span className="font-bold text-foreground">${(margenKg * prodKg).toLocaleString()} CLP</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── 5. ORIGEN & SELLO DIGITAL (Genealogía + Autenticidad Territorial) ── */}
                {tab === 'origen' && (
                    <div className="space-y-6">
                        {/* Linaje genético y trazabilidad biológica */}
                        <ColmenaOrigenTab
                            colmena={colmena}
                            colmenas={colmenas}
                            historial={historial}
                            refetchHistorial={() => void refetchHistorial()}
                            onUpdate={onUpdate}
                            onOpenColmena={onOpenColmena}
                        />

                        {/* Sello de Autenticidad Digital Territorial (Clean Voice) */}
                        <div className="pt-4 border-t border-border/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                    <h4 className="text-xs uppercase tracking-wider font-mono text-foreground font-semibold">
                                        Sello Digital de Autenticidad Territorial
                                    </h4>
                                </div>
                                {colmena.blockchain_hash ? (
                                    <span className="badge badge-success text-[10px]">
                                        <ShieldCheck size={11} className="inline mr-1" />
                                        Certificado emitido
                                    </span>
                                ) : (
                                    <span className="badge text-[10px]">Sin certificación</span>
                                )}
                            </div>

                            <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Genera un sello digital inmutable del estado actual de la colmena para certificar su trazabilidad de origen y autenticidad territorial en el bosque nativo.
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm flex items-center gap-1.5"
                                        onClick={handleAnclar}
                                        disabled={anclando || !realId}
                                    >
                                        <Anchor size={13} />
                                        <span>{anclando ? 'Sellando digitalmente…' : 'Emitir sello de autenticidad'}</span>
                                    </button>
                                    {colmena.blockchain_hash && (
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm flex items-center gap-1.5"
                                            onClick={() => handleVerificar(colmena.blockchain_hash!)}
                                            disabled={verificando}
                                        >
                                            <ShieldCheck size={13} />
                                            <span>{verificando ? 'Verificando…' : 'Verificar autenticidad'}</span>
                                        </button>
                                    )}
                                </div>

                                {anclaError && (
                                    <div className="text-xs text-destructive">{anclaError}</div>
                                )}
                                {anclaOk?.explorer_url && (
                                    <a
                                        href={anclaOk.explorer_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                                    >
                                        <span>Ver registro público oficial</span>
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                                {verificacion && (
                                    <div className={`text-xs ${verificacion.confirmed ? 'text-success' : 'text-destructive'}`}>
                                        {verificacion.confirmed
                                            ? `✓ Certificado oficial verificado con éxito`
                                            : '✗ Certificado pendiente de confirmación'}
                                        {verificacion.block_timestamp && <> · {verificacion.block_timestamp}</>}
                                    </div>
                                )}
                            </div>

                            {/* Reseñas comunitarias del lote activo */}
                            {resenasLote && resenasLote.total > 0 && (
                                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                                    <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                                        <span>Evaluación del lote {colmena.lote_activo}:</span>
                                        <Star size={12} className="inline fill-accent text-accent ml-1" />
                                        <span>{resenasLote.promedio} ({resenasLote.total} reseña{resenasLote.total === 1 ? '' : 's'})</span>
                                    </div>
                                    {resenasLote.familias.length > 0 && (
                                        <p className="text-[11px] text-muted-foreground">
                                            Familias: {resenasLote.familias.join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                    </div>
                </div>
            </div>

            {/* Modal de Dictado por Voz apícola con Groq AI */}
            <BitacoraVozModal
                open={showVozModal}
                onOpenChange={setShowVozModal}
                onApply={(parsed) => {
                    setVoiceParsed(parsed);
                    setShowInspeccionForm(true);
                }}
                colmenasDisponibles={[{ id: colmena.id, name: colmena.name ?? null }]}
            />

            {/* Modal de Hoja de Inspección */}
            <HojaForm
                open={showInspeccionForm}
                onOpenChange={(openState) => {
                    setShowInspeccionForm(openState);
                    if (!openState) setVoiceParsed(null);
                }}
                colmenas={[{ id: colmena.id, name: colmena.name ?? null }]}
                colmenaIdFijo={colmena.id}
                initialParsed={voiceParsed}
                onSaved={() => {
                    void refetchHistorial();
                    onUpdate({ ...colmena, last_inspection: new Date().toISOString().split('T')[0] });
                }}
            />
        </ImmersiveModal>
    );
}
