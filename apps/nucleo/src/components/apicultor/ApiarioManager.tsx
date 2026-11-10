import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import {
    MapPin, Plus, Trash2, ChevronRight, Droplets, LocateFixed,
    ArrowLeft, Warehouse, Landmark, AlertTriangle, Tent,
    CheckSquare, MoveRight, X, ArrowUpRight, Check, Pencil, Crown, Compass
} from 'lucide-react';
import type { ApiarioRow, ColmenaWithRelations, RegistroApiarioEstado, InspeccionRow, VarroaRow } from '@/lib/apicultor-types';
import { supabase } from '../../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError, ImmersiveModal, ConfirmDialog } from '@enjambre/ui';
import { CHILE_COMUNAS_POR_REGION } from '@enjambre/logistica';
import { resolveComunaCoords } from '@/lib/cliente-coords';
import { nombreCanonicoComuna } from '@/lib/chiloe-comunas';
import { cn } from '@/lib/cn';

const ApiarioPickerMap = dynamic(() => import('./ApiarioPickerMapBase'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-72 sm:h-80 lg:h-[380px] xl:h-[420px] rounded-xl bg-surface-sunken border border-border animate-pulse flex flex-col items-center justify-center gap-2">
            <span className="text-base">🐝</span>
            <span className="text-xs text-muted-foreground font-mono">Cargando visor satelital de Chiloé…</span>
        </div>
    ),
});

const COMUNAS_CHILOE_APIARIOS = [
  'Castro',
  'Ancud',
  'Quellón',
  'Dalcahue',
  'Chonchi',
  'Queilén',
  'Quemchi',
  'Puqueldón',
  'Quinchao',
  'Curaco de Vélez',
] as const;
import {
    buildApiaryState,
    buildHiveState,
    type HiveStateContext,
    type RiskLevel,
    RISK_COLORS,
    RISK_LABELS,
} from '@/lib/hive-state';
import { HiveStateBadge, HiveStateDot } from './HiveStateBadge';

interface ApiarioManagerProps {
    colmenas: ColmenaWithRelations[];
    setColmenas: React.Dispatch<React.SetStateAction<ColmenaWithRelations[]>>;
    apiarios: ApiarioRow[];
    setApiarios: React.Dispatch<React.SetStateAction<ApiarioRow[]>>;
    onSelectColmena: (c: ColmenaWithRelations) => void;
    /** null = colección de apiarios; uuid = workspace del apiario */
    activeApiarioId: string | null;
    onEnterApiario: (id: string) => void;
    onLeaveApiario: () => void;
    /** Estado de cruce con el Registro Territorial (ley vs vivo). */
    registroMap?: Record<string, RegistroApiarioEstado>;
    onRegistroChange?: (map: Record<string, RegistroApiarioEstado>) => void;
    /** Contexto compartido con el gemelo 3D (alertas, meteo de zona). */
    hiveCtx?: HiveStateContext;
    /** Comuna de origen del usuario desde su registro inicial o perfil territorial */
    userComuna?: string | null;
}

export function parseApiarioDetails(detailsStr?: string | null): {
    comuna?: string;
    sector?: string;
    regimen?: 'fijo' | 'trashumante';
    observaciones: string;
} {
    if (!detailsStr) return { observaciones: '' };
    const match = detailsStr.match(/^\[Comuna:\s*([^|\]]+)(?:\|\s*Sector:\s*([^|\]]+))?(?:\|\s*Régimen:\s*([^|\]]+))?\]\s*(.*)$/is);
    if (match) {
        return {
            comuna: match[1]?.trim() || undefined,
            sector: match[2]?.trim() || undefined,
            regimen: match[3]?.trim().toLowerCase() === 'trashumante' ? 'trashumante' : 'fijo',
            observaciones: match[4]?.trim() || '',
        };
    }
    return { observaciones: detailsStr };
}

export function formatApiarioDetails(data: {
    comuna?: string;
    sector?: string;
    regimen?: 'fijo' | 'trashumante';
    observaciones?: string;
}): string {
    const parts: string[] = [];
    if (data.comuna) parts.push(`Comuna: ${data.comuna.trim()}`);
    if (data.sector) parts.push(`Sector: ${data.sector.trim()}`);
    if (data.regimen) parts.push(`Régimen: ${data.regimen}`);

    const header = parts.length > 0 ? `[${parts.join(' | ')}]` : '';
    const obs = data.observaciones?.trim() || '';
    if (header && obs) return `${header}\n${obs}`;
    return header || obs;
}

interface ApiarioDraft {
    id?: string;
    name: string;
    comuna?: string;
    sector?: string;
    regimen?: 'fijo' | 'trashumante';
    lat: string;
    lng: string;
    health?: 'optimal' | 'attention' | 'risk';
    details: string;
}

// Registro basal de la bitácora (docs/BITACORA_APICOLA.md §1.1): campos de la
// inspección inicial que se persisten como primera fila de `inspecciones`.
// Vacío por defecto — la inspección sólo se escribe si el apicultor ingresa datos.
interface InspeccionBasalForm {
    poblacion: 'Baja' | 'Media' | 'Alta' | '';
    marcos_cria: number;
    marcos_miel: number;
    varroa: number;
    enjambrazon_riesgo: 'bajo' | 'medio' | 'alto';
}

const INSPECCION_BASAL_INICIAL: InspeccionBasalForm = {
    poblacion: '',
    marcos_cria: 0,
    marcos_miel: 0,
    varroa: 0,
    enjambrazon_riesgo: 'bajo',
};

export function ApiarioManager({
    colmenas: localColmenas,
    setColmenas: setLocalColmenas,
    apiarios,
    setApiarios,
    onSelectColmena,
    activeApiarioId,
    onEnterApiario,
    onLeaveApiario,
    registroMap = {},
    onRegistroChange,
    hiveCtx,
    userComuna,
}: ApiarioManagerProps) {
    const apiFetch = useApiFetch();
    const queryClient = useQueryClient();
    const [editingColmena, setEditingColmena] = useState<ColmenaWithRelations | null>(null);
    const [inspeccionBasal, setInspeccionBasal] = useState<InspeccionBasalForm>(INSPECCION_BASAL_INICIAL);
    const [editingApiario, setEditingApiario] = useState<ApiarioDraft | null>(null);
    const [locatingGps, setLocatingGps] = useState(false);
    const [apiarioError, setApiarioError] = useState<string | null>(null);
    const [publicando, setPublicando] = useState<ApiarioRow | null>(null);
    const [pubComuna, setPubComuna] = useState('');
    const [pubZona, setPubZona] = useState('');
    const [pubCategoria, setPubCategoria] = useState('produccion');
    const [guardandoRegistro, setGuardandoRegistro] = useState(false);
    const [selectedColmenaIds, setSelectedColmenaIds] = useState<Set<string>>(new Set());
    const [showSalidaModal, setShowSalidaModal] = useState(false);
    const [showMoverModal, setShowMoverModal] = useState(false);
    const [targetApiarioId, setTargetApiarioId] = useState<string>('');
    const [trasladando, setTrasladando] = useState(false);
    const [apiarioToDelete, setApiarioToDelete] = useState<ApiarioRow | null>(null);
    const [colmenaToDelete, setColmenaToDelete] = useState<ColmenaWithRelations | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleSelectColmena = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedColmenaIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleMoverColmenas = async () => {
        if (!targetApiarioId || selectedColmenaIds.size === 0) return;
        setTrasladando(true);
        try {
            const ids = Array.from(selectedColmenaIds);
            const targetApiario = apiarios.find((a) => a.id === targetApiarioId);
            const { error } = await supabase
                .from('colmenas')
                .update({ apiario_id: targetApiarioId })
                .in('id', ids);

            if (error) throw error;

            setLocalColmenas((prev) =>
                prev.map((c) =>
                    selectedColmenaIds.has(c.id)
                        ? { ...c, apiario_id: targetApiarioId, apiario_name: targetApiario?.name ?? 'Sin apiario' }
                        : c,
                ),
            );
            toast.success(`${ids.length} colmena(s) trasladada(s) a ${targetApiario?.name ?? 'nuevo apiario'}`);
            setSelectedColmenaIds(new Set());
            setShowMoverModal(false);
        } catch (err) {
            toast.error(friendlyError(err));
        } finally {
            setTrasladando(false);
        }
    };

    const publicarEnRegistro = async () => {
        if (!publicando) return;
        if (pubComuna.trim().length < 2 || pubZona.trim().length < 2) {
            setApiarioError('Indica comuna y sector/paraje para declarar en el Registro.');
            return;
        }
        setGuardandoRegistro(true);
        setApiarioError(null);
        try {
            const res = await apiFetch('/api/registro-territorial/apiarios/sync-desde-operativo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiario_id: publicando.id,
                    comuna: pubComuna.trim(),
                    zona: pubZona.trim(),
                    categoria: pubCategoria,
                    lat_aproximada: typeof publicando.lat === 'number' ? publicando.lat : null,
                    lng_aproximada: typeof publicando.lng === 'number' ? publicando.lng : null,
                }),
            });
            if (!res.ok) {
                const data = (await res.json().catch(() => ({}))) as { error?: string };
                throw new Error(data.error || 'Error publicando en el Registro Territorial');
            }
            const json = (await res.json()) as { data: RegistroApiarioEstado };
            onRegistroChange?.({
                ...registroMap,
                [publicando.id]: { ...json.data, apiario_origen_id: publicando.id },
            });
            setPublicando(null);
            toast('Apiario publicado en el Registro Territorial', { type: 'success' });
        } catch (err) {
            console.error('Error publicando en registro', err);
            setApiarioError(friendlyError(err, 'Error al publicar en el Registro'));
        } finally {
            setGuardandoRegistro(false);
        }
    };

    const abrirPublicar = (row: ApiarioRow) => {
        setApiarioError(null);
        const prev = registroMap[row.id];
        const parsed = parseApiarioDetails(row.details);
        setPubComuna(prev?.comuna ?? parsed.comuna ?? userComuna ?? '');
        setPubZona(prev?.zona ?? parsed.sector ?? '');
        setPubCategoria(prev?.categoria ?? 'produccion');
        setPublicando(row);
    };

    const activeApiario = apiarios.find((a) => a.id === activeApiarioId) ?? null;
    const workspaceMode = Boolean(activeApiario);

    const colmenasWorkspace = useMemo(() => {
        if (!activeApiario) return [];
        return localColmenas.filter(
            (c) => c.apiario_id === activeApiario.id || c.apiario_name === activeApiario.name,
        );
    }, [localColmenas, activeApiario]);

    const workspaceCtx = useMemo<HiveStateContext>(
        () => ({
            ...hiveCtx,
            apiarioLat:
                hiveCtx?.apiarioLat ??
                (typeof activeApiario?.lat === 'number' ? activeApiario.lat : null),
            apiarioLng:
                hiveCtx?.apiarioLng ??
                (typeof activeApiario?.lng === 'number' ? activeApiario.lng : null),
        }),
        [hiveCtx, activeApiario],
    );

    const workspaceApiary = useMemo(
        () =>
            buildApiaryState(colmenasWorkspace, {
                apiarioId: activeApiario?.id ?? null,
                apiarioName: activeApiario?.name ?? undefined,
                ctx: workspaceCtx,
            }),
        [colmenasWorkspace, activeApiario, workspaceCtx],
    );

    const hiveById = useMemo(() => {
        const m = new Map(workspaceApiary.hives.map((h) => [h.id, h]));
        return m;
    }, [workspaceApiary.hives]);

    const riskSummary = workspaceApiary.riskSummary;
    const riskOrder: RiskLevel[] = ['critical', 'alert', 'watch', 'ok', 'unknown'];

    const openNewApiario = () => {
        setApiarioError(null);
        const initialComuna = nombreCanonicoComuna(userComuna || 'Castro');
        const coords = resolveComunaCoords(initialComuna);
        setEditingApiario({
            name: '',
            comuna: initialComuna,
            sector: '',
            regimen: 'fijo',
            lat: coords ? coords.lat.toFixed(6) : '',
            lng: coords ? coords.lng.toFixed(6) : '',
            health: 'optimal',
            details: '',
        });
    };

    const openEditApiario = (row: ApiarioRow, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setApiarioError(null);
        const parsed = parseApiarioDetails(row.details);
        const parsedComuna = parsed.comuna ? nombreCanonicoComuna(parsed.comuna) : null;
        setEditingApiario({
            id: row.id,
            name: row.name ?? '',
            comuna: parsedComuna || (userComuna ? nombreCanonicoComuna(userComuna) : 'Castro'),
            sector: parsed.sector ?? '',
            regimen: parsed.regimen ?? 'fijo',
            lat: row.lat != null ? String(row.lat) : '',
            lng: row.lng != null ? String(row.lng) : '',
            health: (row.health as ApiarioDraft['health']) || 'optimal',
            details: parsed.observaciones ?? '',
        });
    };

    const handleAddColmena = (apiario: string) => {
        const apiarioRow = apiarios.find(a => a.name === apiario);
        setInspeccionBasal(INSPECCION_BASAL_INICIAL);
        setEditingColmena({
            id: Date.now().toString(), // Mock ID
            apiario_id: apiarioRow?.id ?? null,
            name: '',
            apiario_name: apiario,
            health: 'optimal',
            queen: null,
            production_total: 0,
            floracion: '',
            inspecciones: [], varroa_records: [], peso_records: [],
            costos: { horas_anuales: 0, costo_hora: 0, amortizacion_cajon: 12000, insumos_anuales: 0, produccion_kg: 0 },
            alzas: 0
        } as unknown as ColmenaWithRelations);
    };

    const handleEditColmena = (c: ColmenaWithRelations) => {
        const lastIns = c.inspecciones?.length
            ? [...c.inspecciones].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
            : null;
        const lastV = c.varroa_records?.length
            ? [...c.varroa_records].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
            : null;

        const pob = lastIns?.poblacion
            ? (lastIns.poblacion.charAt(0).toUpperCase() + lastIns.poblacion.slice(1).toLowerCase())
            : '';
        const validPob = pob === 'Baja' || pob === 'Media' || pob === 'Alta' ? pob : '';

        setInspeccionBasal({
            poblacion: validPob as InspeccionBasalForm['poblacion'],
            marcos_cria: lastIns?.marcos_cria ?? 0,
            marcos_miel: lastIns?.marcos_miel ?? 0,
            varroa: lastV?.level ?? lastIns?.varroa ?? 0,
            enjambrazon_riesgo: (lastIns?.enjambrazon_riesgo as InspeccionBasalForm['enjambrazon_riesgo']) || 'bajo',
        });
        setEditingColmena({ ...c });
    };

    const handleUseMyLocation = () => {
        if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
            setApiarioError('Geolocalización no disponible en este navegador.');
            return;
        }
        setLocatingGps(true);
        setApiarioError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setEditingApiario(prev => prev ? {
                    ...prev,
                    lat: pos.coords.latitude.toFixed(6),
                    lng: pos.coords.longitude.toFixed(6),
                } : prev);
                setLocatingGps(false);
            },
            (err) => {
                setLocatingGps(false);
                setApiarioError(`No se pudo obtener la ubicación: ${err.message}`);
            },
            { timeout: 8000, enableHighAccuracy: true },
        );
    };

    const handleSaveApiario = async () => {
        if (!editingApiario) return;
        const name = editingApiario.name.trim();
        if (!name) {
            setApiarioError('El nombre del apiario es obligatorio.');
            return;
        }
        const nameTaken = apiarios.some(
            (a) => a.name === name && a.id !== editingApiario.id,
        );
        if (nameTaken) {
            setApiarioError(`Ya existe un apiario llamado "${name}".`);
            return;
        }
        const lat = editingApiario.lat === '' ? 0 : parseFloat(editingApiario.lat);
        const lng = editingApiario.lng === '' ? 0 : parseFloat(editingApiario.lng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            setApiarioError('Coordenadas inválidas: usa grados decimales o selecciónalas en el mapa.');
            return;
        }

        const detailsFormatted = formatApiarioDetails({
            comuna: editingApiario.comuna,
            sector: editingApiario.sector,
            regimen: editingApiario.regimen,
            observaciones: editingApiario.details,
        });

        setApiarioError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (editingApiario.id) {
                const { data: updated, error } = await supabase
                    .from('apiarios')
                    .update({
                        name,
                        lat,
                        lng,
                        health: 'optimal',
                        details: detailsFormatted || null,
                    })
                    .eq('id', editingApiario.id)
                    .select('*')
                    .single();
                if (error) throw error;
                if (updated) {
                    setApiarios((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
                    setLocalColmenas((prev) =>
                        prev.map((c) =>
                            c.apiario_id === updated.id
                                ? { ...c, apiario_name: updated.name ?? name }
                                : c,
                        ),
                    );
                }
                setEditingApiario(null);
                toast('Apiario actualizado', { type: 'success' });
                return;
            }

            const { data: newAp, error } = await supabase.from('apiarios').insert({
                name,
                lat,
                lng,
                health: 'optimal',
                details: detailsFormatted || null,
                user_id: user?.id ?? null,
            }).select('*').single();
            if (error) throw error;
            if (!newAp) {
                setApiarioError('No se pudo crear el apiario en la base de datos.');
                return;
            }

            setApiarios((prev) => [...prev, newAp]);
            setEditingApiario(null);
            toast('Apiario registrado — entrando…', { type: 'success' });
            onEnterApiario(newAp.id);
        } catch (err) {
            console.error('Error guardando apiario', err);
            setApiarioError(friendlyError(err, 'Error al guardar el apiario'));
        }
    };

    const executeDeleteApiario = async (row: ApiarioRow) => {
        try {
            setIsDeleting(true);
            const { error } = await supabase.from('apiarios').delete().eq('id', row.id);
            if (error) throw error;
            setApiarios((prev) => prev.filter((a) => a.id !== row.id));
            setLocalColmenas((prev) =>
                prev.map((c) =>
                    c.apiario_id === row.id || c.apiario_name === row.name
                        ? { ...c, apiario_name: 'Sin apiario', apiario_id: null }
                        : c,
                ),
            );
            if (activeApiarioId === row.id) onLeaveApiario();
            toast('Apiario eliminado', { type: 'success' });
            setApiarioToDelete(null);
        } catch (err) {
            console.error('Error eliminando apiario', err);
            toast(friendlyError(err, 'Error al eliminar el apiario'), { type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    // Inspección basal (BITACORA_APICOLA.md §1.1): sólo se escribe si hay datos
    // científicos; reina RV/SR alimenta el booleano `reina` de la ficha.
    const persistInspeccionBasal = async (
        colmenaId: string,
        uid: string | null,
        queen: string | null | undefined,
    ): Promise<{
        inspection?: InspeccionRow;
        varroa?: VarroaRow;
    }> => {
        const b = inspeccionBasal;
        const hasBasal =
            b.marcos_cria > 0 ||
            b.marcos_miel > 0 ||
            b.varroa > 0 ||
            b.poblacion !== '' ||
            b.enjambrazon_riesgo !== 'bajo';
        if (!hasBasal) return {};

        const date = new Date().toISOString().split('T')[0];
        const { data: insData, error: insErr } = await supabase
            .from('inspecciones')
            .insert({
                colmena_id: colmenaId,
                date,
                inspector: 'Apicultor',
                marcos_cria: b.marcos_cria > 0 ? b.marcos_cria : null,
                marcos_miel: b.marcos_miel > 0 ? b.marcos_miel : null,
                varroa: b.varroa > 0 ? b.varroa : null,
                poblacion: b.poblacion.toLowerCase() || null,
                reina: queen === 'RV' ? true : queen === 'SR' ? false : null,
                enjambrazon_riesgo: b.enjambrazon_riesgo,
                user_id: uid,
            })
            .select()
            .single();

        if (insErr) {
            console.error('Error registrando inspección basal', insErr);
            throw insErr;
        }

        let varroaRow: VarroaRow | undefined;
        if (b.varroa > 0) {
            const { data: vData } = await supabase
                .from('varroa_records')
                .insert({
                    colmena_id: colmenaId,
                    date,
                    level: b.varroa,
                    user_id: uid,
                })
                .select()
                .single();
            if (vData) {
                varroaRow = vData as VarroaRow;
            }
        }

        return {
            inspection: insData as InspeccionRow,
            varroa: varroaRow,
        };
    };

    const handleSaveColmena = async (c: ColmenaWithRelations) => {
        const cleanName = c.name?.trim() || 'Colmena';
        const colmenaClean = { ...c, name: cleanName };

        // Supabase persistence
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const uid = user?.id ?? null;
            if (!uid) {
                toast('Tu sesión expiró. Vuelve a iniciar sesión e intenta de nuevo.', { type: 'error' });
                return;
            }

            let apiarioId = (colmenaClean.apiario_id && colmenaClean.apiario_id.length >= 20) ? colmenaClean.apiario_id : null;
            // 1. Si la colmena no trae apiario_id, resolver o crear Apiario por nombre (location)
            if (!apiarioId) {
                const nombreApiario = (colmenaClean.apiario_name || '').trim();
                const { data: existingAp } = await supabase.from('apiarios').select('id').eq('name', nombreApiario).maybeSingle();
                if (existingAp) {
                    apiarioId = existingAp.id;
                } else if (nombreApiario) {
                    const { data: newAp, error: apError } = await supabase.from('apiarios').insert({
                        name: nombreApiario,
                        lat: typeof colmenaClean.lat === 'number' ? colmenaClean.lat : 0,
                        lng: typeof colmenaClean.lng === 'number' ? colmenaClean.lng : 0,
                        health: colmenaClean.health || 'optimal',
                        user_id: uid,
                    }).select().single();
                    if (apError) throw apError;
                    if (newAp) apiarioId = newAp.id;
                }
            }

            // 2. Insert or update Colmena
            const isNew = !colmenaClean.id || colmenaClean.id.includes('mock') || colmenaClean.id.length < 20;
            if (isNew && !apiarioId) {
                toast('No se pudo resolver el apiario de la colmena. Edita el apiario e intenta de nuevo.', { type: 'error' });
                return;
            }

            let finalId = colmenaClean.id;
            if (isNew && apiarioId) {
                const { data: newRow, error: insertError } = await supabase.from('colmenas').insert({
                    apiario_id: apiarioId,
                    name: colmenaClean.name,
                    health: colmenaClean.health || 'optimal',
                    user_id: uid,
                    floracion: colmenaClean.floracion,
                    last_inspection: colmenaClean.last_inspection || null,
                    alzas: typeof colmenaClean.alzas === 'number' && Number.isFinite(colmenaClean.alzas) ? Math.max(0, colmenaClean.alzas) : 0,
                    notes: colmenaClean.notes || '',
                    queen: colmenaClean.queen,
                }).select('id').single();
                if (insertError) throw insertError;
                if (newRow) finalId = newRow.id;
            } else if (!isNew) {
                const { error: updateError } = await supabase.from('colmenas').update({
                    name: colmenaClean.name,
                    health: colmenaClean.health || 'optimal',
                    floracion: colmenaClean.floracion,
                    last_inspection: colmenaClean.last_inspection || null,
                    alzas: typeof colmenaClean.alzas === 'number' && Number.isFinite(colmenaClean.alzas) ? Math.max(0, colmenaClean.alzas) : 0,
                    notes: colmenaClean.notes || '',
                    queen: colmenaClean.queen,
                    user_id: uid,
                }).eq('id', colmenaClean.id);
                if (updateError) throw updateError;
            }

            const basalResult = await persistInspeccionBasal(finalId, uid, colmenaClean.queen);

            setLocalColmenas(prev => {
                const exists = prev.find(p => p.id === c.id || p.id === finalId);
                const updatedItem: ColmenaWithRelations = {
                    ...colmenaClean,
                    id: finalId,
                    apiario_id: apiarioId ?? colmenaClean.apiario_id,
                    last_inspection: basalResult.inspection?.date ?? colmenaClean.last_inspection ?? null,
                    inspecciones: basalResult.inspection
                        ? [basalResult.inspection, ...(c.inspecciones?.filter(i => i.id !== basalResult.inspection?.id) ?? [])]
                        : (c.inspecciones ?? []),
                    varroa_records: basalResult.varroa
                        ? [basalResult.varroa, ...(c.varroa_records ?? [])]
                        : (c.varroa_records ?? []),
                };
                if (exists) {
                    return prev.map(p => (p.id === c.id || p.id === finalId) ? updatedItem : p);
                }
                return [...prev, updatedItem];
            });

            setEditingColmena(null);
            void queryClient.invalidateQueries({ queryKey: ['cuaderno-colmenas-direct'] });
            void queryClient.invalidateQueries({ queryKey: ['bitacora-hojas'] });
            void queryClient.invalidateQueries({ queryKey: ['bitacora-red'] });
            toast('Colmena guardada', { type: 'success' });
        } catch (err) {
            console.error("Error syncing colmena to Supabase", err);
            toast(friendlyError(err, 'Error al guardar la colmena'), { type: 'error' });
        }
    };

    const executeDeleteColmena = async (id: string) => {
        try {
            setIsDeleting(true);
            if (!id.includes('mock') && id.length >= 20) {
                const { error } = await supabase.from('colmenas').delete().eq('id', id);
                if (error) throw error;
            }
            setLocalColmenas(prev => prev.filter(c => c.id !== id));
            setSelectedColmenaIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            void queryClient.invalidateQueries({ queryKey: ['cuaderno-colmenas-direct'] });
            void queryClient.invalidateQueries({ queryKey: ['bitacora-hojas'] });
            void queryClient.invalidateQueries({ queryKey: ['bitacora-red'] });
            toast('Colmena eliminada', { type: 'success' });
            setColmenaToDelete(null);
        } catch (err) {
            console.error('Error eliminando colmena', err);
            toast(friendlyError(err, 'No se pudo eliminar la colmena'), { type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    // ── Colección: tarjetas de apiarios ──────────────────────────────────
    if (!workspaceMode) {
        return (
            <div className="animate-in delay-2">
                {apiarios.length === 0 ? (
                    <div className="max-w-2xl mx-auto my-6 sm:my-10 rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center backdrop-blur-sm relative overflow-hidden shadow-sm flex flex-col items-center">
                        <div className="size-14 sm:size-16 rounded-2xl bg-surface-raised border border-border/70 flex items-center justify-center mx-auto mb-5 text-accent shadow-sm">
                            <Warehouse size={28} className="text-accent" />
                        </div>
                        <h2 className="font-display text-2xl sm:text-3xl font-normal text-foreground mb-2">
                            Sin asentamientos apícolas registrados
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                            Registra tu primer apiario con coordenadas GPS y estado sanitario para desplegar el gemelo territorial y la bitácora biológica del bosque nativo.
                        </p>

                        <button
                            type="button"
                            className="btn btn-primary px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2"
                            onClick={openNewApiario}
                        >
                            <Plus size={16} /> Registrar primer apiario
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                                Asentamientos activos ({apiarios.length})
                            </h2>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm shrink-0 gap-1.5"
                                onClick={openNewApiario}
                            >
                                <Plus size={14} /> Nuevo apiario
                            </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {apiarios.map((row) => {
                            const cols = localColmenas.filter(
                                (c) => c.apiario_id === row.id || c.apiario_name === row.name,
                            );
                            const kg = cols.reduce((s, c) => s + (c.production_total || 0), 0);
                            const yard = buildApiaryState(cols, {
                                apiarioId: row.id,
                                apiarioName: row.name ?? undefined,
                                ctx: {
                                    ...hiveCtx,
                                    apiarioLat: typeof row.lat === 'number' ? row.lat : null,
                                    apiarioLng: typeof row.lng === 'number' ? row.lng : null,
                                },
                            });
                            const healthColor = RISK_COLORS[yard.worstRisk];
                            const hasCoords =
                                typeof row.lat === 'number' &&
                                typeof row.lng === 'number' &&
                                (row.lat !== 0 || row.lng !== 0);

                            const estado = registroMap[row.id];
                            const desfase = estado?.activo && cols.length !== estado.n_colmenas;

                            return (
                                <div
                                    key={row.id}
                                    className="group rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col transition-all duration-300 relative shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5"
                                >
                                    {/* Cabecera de la tarjeta: Estado biológico + Acciones rápidas en hover */}
                                    <div className="px-3 sm:px-4.5 pt-3 sm:pt-4 pb-2 space-y-2">
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                                <span
                                                    className="size-2 rounded-full shrink-0"
                                                    style={{ background: healthColor }}
                                                />
                                                <span
                                                    className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider truncate"
                                                    style={{
                                                        background: `${healthColor}15`,
                                                        color: healthColor,
                                                        border: `1px solid ${healthColor}35`,
                                                    }}
                                                >
                                                    {RISK_LABELS[yard.worstRisk]}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-0.5 sm:gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                                                <button
                                                    type="button"
                                                    className="p-1 sm:p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-raised transition-colors"
                                                    title={`Editar ${row.name}`}
                                                    aria-label={`Editar ${row.name}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditApiario(row, e);
                                                    }}
                                                >
                                                    <Pencil size={12} className="sm:size-[13px]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-1 sm:p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-raised transition-colors"
                                                    title={estado ? 'Actualizar en Registro Territorial' : 'Publicar en Registro Territorial'}
                                                    aria-label={`Publicar ${row.name}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        abrirPublicar(row);
                                                    }}
                                                >
                                                    <Landmark size={12} className={cn("sm:size-[13px]", estado && "text-primary")} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="p-1 sm:p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                                                    title={`Eliminar ${row.name}`}
                                                    aria-label={`Eliminar ${row.name}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setApiarioToDelete(row);
                                                    }}
                                                >
                                                    <Trash2 size={12} className="sm:size-[13px]" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Título y metadatos: clic para entrar */}
                                        <div
                                            onClick={() => onEnterApiario(row.id)}
                                            className="cursor-pointer block space-y-0.5"
                                        >
                                            <h3 className="font-display text-lg sm:text-xl font-bold leading-tight text-foreground group-hover:text-accent transition-colors truncate">
                                                {row.name}
                                            </h3>
                                            <p className="text-[11px] sm:text-xs text-muted-foreground truncate flex items-center gap-1">
                                                <MapPin size={11} className="shrink-0 text-muted-foreground/70" />
                                                <span className="truncate">
                                                    {hasCoords
                                                        ? `${row.lat!.toFixed(4)}, ${row.lng!.toFixed(4)}`
                                                        : 'Coordenadas pendientes'}
                                                </span>
                                            </p>
                                        </div>

                                        {/* Indicador de Registro Territorial / Desfase */}
                                        {estado && (
                                            <div className="pt-0.5">
                                                {desfase ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-mono truncate">
                                                        <AlertTriangle size={11} className="shrink-0" />
                                                        <span>vivo {cols.length} / sag {estado.n_colmenas}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-primary font-mono truncate">
                                                        <Landmark size={11} className="shrink-0" />
                                                        <span>Oficial en Registro</span>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tira de micro-métricas en cuadrícula limpia de 4 columnas (idéntica a colmenas) */}
                                    <div className="px-2 sm:px-3 py-2 mt-auto grid grid-cols-4 gap-0.5 sm:gap-1.5 bg-surface-sunken/40 border-t border-b border-border/40 font-datos text-center">
                                        <div>
                                            <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">COLMENAS</p>
                                            <p className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-snug text-foreground">
                                                {cols.length}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">PROD.</p>
                                            <p className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-snug text-foreground">
                                                {kg}k
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">SALUD</p>
                                            <p
                                                className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-snug truncate"
                                                style={{ color: healthColor }}
                                            >
                                                {RISK_LABELS[yard.worstRisk].slice(0, 5)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">REGISTRO</p>
                                            <p className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-snug text-foreground truncate">
                                                {estado ? 'Activo' : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pie de tarjeta: acción entrar al colmenar */}
                                    <div
                                        onClick={() => onEnterApiario(row.id)}
                                        className="px-3 sm:px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground cursor-pointer hover:bg-surface-raised/40 transition-colors"
                                    >
                                        <span className="truncate">
                                            {cols.length === 1 ? '1 colmena activa' : `${cols.length} colmenas activas`}
                                        </span>
                                        <span className="text-accent font-medium flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                                            <span>Ver colmenas</span>
                                            <ChevronRight size={13} />
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}

                {editingApiario && (
                    <ApiarioFormModal
                        draft={editingApiario}
                        setDraft={setEditingApiario}
                        error={apiarioError}
                        locatingGps={locatingGps}
                        onUseGps={handleUseMyLocation}
                        onSave={() => void handleSaveApiario()}
                        onClose={() => setEditingApiario(null)}
                        userComuna={userComuna}
                    />
                )}
                {publicando && (
                    <PublicarRegistroModal
                        apiario={publicando}
                        comuna={pubComuna}
                        setComuna={setPubComuna}
                        zona={pubZona}
                        setZona={setPubZona}
                        categoria={pubCategoria}
                        setCategoria={setPubCategoria}
                        error={apiarioError}
                        guardando={guardandoRegistro}
                        onPublicar={() => void publicarEnRegistro()}
                        onClose={() => setPublicando(null)}
                    />
                )}

                <ConfirmDialog
                    open={apiarioToDelete !== null}
                    onOpenChange={(open) => {
                        if (!open && !isDeleting) setApiarioToDelete(null);
                    }}
                    title={apiarioToDelete ? `¿Eliminar el apiario "${apiarioToDelete.name}"?` : '¿Eliminar apiario?'}
                    description="Sus colmenas no se eliminarán: quedarán sin apiario asignado y podrás reubicarlas cuando lo necesites."
                    confirmLabel="Eliminar apiario"
                    cancelLabel="Cancelar"
                    variant="destructive"
                    loading={isDeleting}
                    onConfirm={async () => {
                        if (apiarioToDelete) {
                            await executeDeleteApiario(apiarioToDelete);
                        }
                    }}
                />
            </div>
        );
    }

    // ── Workspace: colmenas del apiario activo ───────────────────────────
    const apiarioName = activeApiario!.name ?? 'Apiario';

    return (
        <div className="animate-in delay-2">
            {/* Barra de control del apiario: Navegación + Salud + Acciones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-border/40">
                {/* Lado izquierdo: Regreso a todos los apiarios + selector si hay varios + resumen de salud en línea */}
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm text-xs font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:bg-surface-raised"
                        onClick={onLeaveApiario}
                    >
                        <ArrowLeft size={14} className="mr-1" />
                        <span>Todos los apiarios</span>
                    </button>

                    {apiarios.length > 1 && (
                        <select
                            className="input-field text-xs py-1 px-2.5 max-w-[13rem] bg-surface-raised"
                            value={activeApiario!.id}
                            onChange={(e) => onEnterApiario(e.target.value)}
                            aria-label="Cambiar de apiario"
                        >
                            {apiarios.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Resumen de salud del apiario */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {riskOrder
                            .filter((r) => riskSummary[r] > 0)
                            .map((r) => (
                                <span
                                    key={r}
                                    className="text-[11px] font-medium font-mono px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                                    style={{
                                        color: RISK_COLORS[r],
                                        background: `${RISK_COLORS[r]}15`,
                                        border: `1px solid ${RISK_COLORS[r]}30`,
                                    }}
                                >
                                    <span className="size-1.5 rounded-full" style={{ background: RISK_COLORS[r] }} />
                                    <span>{riskSummary[r]} {RISK_LABELS[r].toLowerCase()}</span>
                                </span>
                            ))}
                        {workspaceApiary.hiveCount === 0 && (
                            <span className="text-xs text-muted-foreground">Sin colmenas</span>
                        )}
                    </div>
                </div>

                {/* Lado derecho: Acciones (Normal vs Selección Múltiple) */}
                {selectedColmenaIds.size > 0 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-semibold">
                            <CheckSquare size={13} />
                            <span>{selectedColmenaIds.size} seleccionada{selectedColmenaIds.size === 1 ? '' : 's'}</span>
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm text-xs py-1 px-2.5"
                            onClick={() => {
                                if (selectedColmenaIds.size === colmenasWorkspace.length) {
                                    setSelectedColmenaIds(new Set());
                                } else {
                                    setSelectedColmenaIds(new Set(colmenasWorkspace.map((c) => c.id)));
                                }
                            }}
                        >
                            {selectedColmenaIds.size === colmenasWorkspace.length
                                ? 'Deseleccionar todas'
                                : `Seleccionar todas (${colmenasWorkspace.length})`}
                        </button>
                        <button
                            type="button"
                            className="btn btn-gold btn-sm text-xs py-1 px-2.5"
                            onClick={() => setShowSalidaModal(true)}
                            title="Declarar salida trashumante de las colmenas seleccionadas"
                        >
                            <Tent size={13} className="mr-1" /> Declarar salida ({selectedColmenaIds.size})
                        </button>
                        {apiarios.length > 1 && (
                            <button
                                type="button"
                                className="btn btn-outline btn-sm text-xs py-1 px-2.5"
                                onClick={() => {
                                    const other = apiarios.find((a) => a.id !== activeApiario!.id);
                                    if (other) setTargetApiarioId(other.id);
                                    setShowMoverModal(true);
                                }}
                                title="Trasladar colmenas seleccionadas a otro apiario"
                            >
                                <MoveRight size={13} className="mr-1" /> Mover
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm text-xs text-muted-foreground hover:text-foreground py-1 px-2"
                            onClick={() => setSelectedColmenaIds(new Set())}
                        >
                            <X size={13} className="mr-1" /> Desmarcar
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:bg-surface-raised flex items-center gap-1.5"
                            onClick={() => openEditApiario(activeApiario!)}
                            title="Editar nombre y ubicación del apiario"
                        >
                            <Pencil size={13} />
                            <span>Editar</span>
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:bg-surface-raised flex items-center gap-1.5"
                            onClick={() => abrirPublicar(activeApiario!)}
                            title="Publicar o actualizar en el Registro Territorial"
                        >
                            <Landmark size={13} className={cn(registroMap[activeApiario!.id] && "text-primary")} />
                            <span>{registroMap[activeApiario!.id] ? 'Actualizar registro' : 'Publicar registro'}</span>
                        </button>
                        {colmenasWorkspace.length > 0 && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-sm text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:bg-surface-raised flex items-center gap-1.5"
                                onClick={() => setShowSalidaModal(true)}
                                title="Declarar salida trashumante desde este apiario"
                            >
                                <Tent size={13} />
                                <span className="hidden sm:inline">Declarar salida</span>
                                <span className="sm:hidden">Salida</span>
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-outline btn-sm flex items-center gap-1.5 font-medium"
                            onClick={() => handleAddColmena(apiarioName)}
                        >
                            <Plus size={14} />
                            <span>Colmena</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Listado de colmenas: 2 columnas en móvil, 3 columnas horizontales en escritorio */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {colmenasWorkspace.length === 0 ? (
                    <div className="col-span-full text-center py-12 rounded-2xl border border-dashed border-border/60 bg-surface-sunken/40 text-sm text-muted-foreground">
                        Este apiario aún no tiene colmenas registradas.
                        <div className="mt-3">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAddColmena(apiarioName)}
                            >
                                <Plus size={14} className="mr-1" /> Registrar primera colmena
                            </button>
                        </div>
                    </div>
                ) : (
                    colmenasWorkspace.map((c) => {
                        const state = hiveById.get(c.id) ?? buildHiveState(c, workspaceCtx);
                        const isSelected = selectedColmenaIds.has(c.id);
                        const trendSymbol =
                            state.weightTrend === 'up' ? '↑' : state.weightTrend === 'down' ? '↓' : '→';
                        const pesoLabel = state.weightKg != null ? `${state.weightKg.toFixed(1)}k` : '—';
                        const varroaLabel = state.varroaLevel != null ? `${state.varroaLevel}%` : '—';
                        const daysLabel = state.daysSinceInspection != null ? `${state.daysSinceInspection}d` : '—';

                        return (
                            <div
                                key={c.id}
                                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 160px' }}
                                className={cn(
                                    "group rounded-2xl border bg-card overflow-hidden flex flex-col transition-all duration-300 relative shadow-sm hover:shadow-lg",
                                    isSelected
                                        ? "border-accent/90 bg-accent/[0.04] ring-1 ring-accent/40"
                                        : "border-border/60 hover:border-accent/40 hover:-translate-y-0.5"
                                )}
                            >
                                {/* Cabecera de la tarjeta: Checkbox + Estado + Acciones */}
                                <div className="px-3 sm:px-4.5 pt-3 sm:pt-4 pb-2 space-y-2">
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                                            <button
                                                type="button"
                                                onClick={(e) => toggleSelectColmena(c.id, e)}
                                                className={cn(
                                                    "size-4.5 sm:size-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                                                    isSelected
                                                        ? "bg-accent border-accent text-accent-foreground shadow-sm"
                                                        : "border-border/80 bg-background/60 hover:border-accent/60"
                                                )}
                                                aria-label={`Seleccionar ${c.name}`}
                                            >
                                                {isSelected && <Check size={11} className="stroke-[3]" />}
                                            </button>
                                            <div className="flex items-center gap-1 min-w-0">
                                                <span
                                                    className="size-2 rounded-full shrink-0"
                                                    style={{ background: state.color }}
                                                />
                                                <span
                                                    className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider truncate"
                                                    style={{
                                                        background: `${state.color}15`,
                                                        color: state.color,
                                                        border: `1px solid ${state.color}35`,
                                                    }}
                                                >
                                                    {state.riskLabel}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-0.5 sm:gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                type="button"
                                                className="p-1 sm:p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-raised transition-colors"
                                                aria-label={`Editar ${c.name}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditColmena(c);
                                                }}
                                            >
                                                <Pencil size={12} className="sm:size-[13px]" />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1 sm:p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                                                aria-label={`Eliminar ${c.name}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setColmenaToDelete(c);
                                                }}
                                            >
                                                <Trash2 size={12} className="sm:size-[13px]" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Título y metadatos */}
                                    <div
                                        onClick={() => onSelectColmena(c)}
                                        className="cursor-pointer block space-y-0.5"
                                    >
                                        <h3 className="font-display text-lg sm:text-xl font-bold leading-tight text-foreground group-hover:text-accent transition-colors truncate">
                                            {c.name}
                                        </h3>
                                        <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                                            {state.floracion || c.floracion || 'Sin floración activa'}
                                            {c.origen_tipo ? ` · ${c.origen_tipo}` : ''}
                                        </p>
                                    </div>

                                    {/* Recomendación operativa destacada */}
                                    {state.primaryAction && (
                                        <div
                                            className="text-[11px] sm:text-xs italic leading-tight pt-0.5 line-clamp-1"
                                            style={{ color: state.color }}
                                        >
                                            «{state.primaryAction}»
                                        </div>
                                    )}
                                </div>

                                {/* Tira de micro-métricas en cuadrícula limpia de 4 columnas */}
                                <div className="px-2 sm:px-3.5 py-2 mt-auto grid grid-cols-4 gap-0.5 sm:gap-1.5 bg-surface-sunken/40 border-t border-b border-border/40 font-datos text-center">
                                    <div>
                                        <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">PESO</p>
                                        <p className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-snug text-foreground">
                                            {pesoLabel}
                                            {state.weightKg != null && (
                                                <span className="text-[9px] sm:text-[10px] text-accent ml-0.5 font-sans">{trendSymbol}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">VARROA</p>
                                        <p
                                            className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-snug"
                                            style={{
                                                color:
                                                    state.varroaLevel != null && state.varroaLevel > 3
                                                        ? 'hsl(var(--destructive))'
                                                        : 'hsl(var(--foreground))',
                                            }}
                                        >
                                            {varroaLabel}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">VISITA</p>
                                        <p className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-snug text-foreground">
                                            {daysLabel}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70">PROD.</p>
                                        <p className="text-xs sm:text-sm font-bold font-mono tabular-nums leading-snug text-foreground">
                                            {c.production_total || 0}k
                                        </p>
                                    </div>
                                </div>

                                {/* Pie de tarjeta: Estado reina y acción abrir ficha (sin emojis) */}
                                <div className="px-3 sm:px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground gap-1">
                                    <span className="truncate flex items-center gap-1">
                                        {state.queenPresent === true ? (
                                            <span className="text-foreground/90 font-medium flex items-center gap-1 truncate">
                                                <Crown size={12} className="text-accent shrink-0" />
                                                <span className="truncate">Reina activa</span>
                                            </span>
                                        ) : state.queenPresent === false ? (
                                            <span className="text-destructive font-medium flex items-center gap-1 truncate">
                                                <AlertTriangle size={12} className="text-destructive shrink-0" />
                                                <span className="truncate">Sin reina</span>
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground truncate">Sin registro</span>
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onSelectColmena(c)}
                                        className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary hover:text-accent transition-colors shrink-0 ml-auto"
                                    >
                                        <span className="hidden sm:inline">Abrir </span>
                                        <span>ficha</span>
                                        <ArrowUpRight size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Edit Modal */}
            <ImmersiveModal
                open={Boolean(editingColmena)}
                onClose={() => setEditingColmena(null)}
                size="md"
                eyebrow="Campo"
                title={
                    editingColmena && localColmenas.find((c) => c.id === editingColmena.id)
                        ? 'Editar Colmena'
                        : 'Nueva Colmena'
                }
                footer={
                    editingColmena ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
                            <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={() => setEditingColmena(null)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary w-full sm:w-auto"
                                onClick={() => handleSaveColmena(editingColmena)}
                            >
                                Guardar cambios
                            </button>
                        </div>
                    ) : null
                }
            >
                {editingColmena && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre identificador</label>
                                <input className="input-field w-full" value={editingColmena.name} onChange={e => setEditingColmena({ ...editingColmena, name: e.target.value })} placeholder="Ej. Colmena Reina Vieja" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Estado de salud</label>
                                    <select className="input-field w-full" value={editingColmena.health || 'optimal'} onChange={e => setEditingColmena({ ...editingColmena, health: e.target.value as ColmenaWithRelations['health'] })}>
                                        <option value="optimal" className="bg-card text-foreground">Óptima</option>
                                        <option value="attention" className="bg-card text-foreground">Atención</option>
                                        <option value="risk" className="bg-card text-foreground">Riesgo / Crítica</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Alzas melarias activas</label>
                                    <input
                                        className="input-field w-full"
                                        type="number"
                                        min={0}
                                        max={6}
                                        value={typeof editingColmena.alzas === 'number' ? editingColmena.alzas : 0}
                                        onChange={e => {
                                            const val = parseInt(e.target.value, 10);
                                            setEditingColmena({ ...editingColmena, alzas: Number.isNaN(val) ? 0 : Math.max(0, val) });
                                        }}
                                        placeholder="0 = solo cámara de cría"
                                    />
                                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                                        0 = cámara de cría única (sin alzas melarias puestas)
                                    </span>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: 'var(--space-md)', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                                Registro científico basal — se guarda como primera inspección
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Reina</label>
                                    <select className="input-field w-full" value={editingColmena.queen ?? ''} onChange={e => setEditingColmena({ ...editingColmena, queen: e.target.value || null })}>
                                        <option value="" className="bg-card text-foreground">—</option>
                                        <option value="RV" className="bg-card text-foreground">RV · Reina vista</option>
                                        <option value="NV" className="bg-card text-foreground">NV · No vista</option>
                                        <option value="SR" className="bg-card text-foreground">SR · Sin reina</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Población</label>
                                    <select className="input-field w-full" value={inspeccionBasal.poblacion} onChange={e => setInspeccionBasal({ ...inspeccionBasal, poblacion: e.target.value as InspeccionBasalForm['poblacion'] })}>
                                        <option value="" className="bg-card text-foreground">—</option>
                                        <option value="Baja" className="bg-card text-foreground">Baja</option>
                                        <option value="Media" className="bg-card text-foreground">Media</option>
                                        <option value="Alta" className="bg-card text-foreground">Alta</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Cuadros con cría</label>
                                    <input className="input-field w-full" type="number" min={0} max={40} value={inspeccionBasal.marcos_cria || ''} onChange={e => setInspeccionBasal({ ...inspeccionBasal, marcos_cria: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Cuadros con miel</label>
                                    <input className="input-field w-full" type="number" min={0} max={40} value={inspeccionBasal.marcos_miel || ''} onChange={e => setInspeccionBasal({ ...inspeccionBasal, marcos_miel: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Varroa (0-10)</label>
                                    <input className="input-field w-full" type="number" step="0.5" min={0} max={10} value={inspeccionBasal.varroa || ''} onChange={e => setInspeccionBasal({ ...inspeccionBasal, varroa: parseFloat(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Riesgo de enjambrazón</label>
                                    <select className="input-field w-full" value={inspeccionBasal.enjambrazon_riesgo} onChange={e => setInspeccionBasal({ ...inspeccionBasal, enjambrazon_riesgo: e.target.value as InspeccionBasalForm['enjambrazon_riesgo'] })}>
                                        <option value="bajo" className="bg-card text-foreground">Bajo</option>
                                        <option value="medio" className="bg-card text-foreground">Medio</option>
                                        <option value="alto" className="bg-card text-foreground">Alto</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Floración</label>
                                <input className="input-field w-full" value={editingColmena.floracion || ''} onChange={e => setEditingColmena({ ...editingColmena, floracion: e.target.value })} placeholder="Ej. Ulmo, Arrayán" />
                            </div>
                        </div>
                )}
            </ImmersiveModal>

            {/* Modal de Declaración de Salida con desglose de colmenas seleccionadas */}
            <ImmersiveModal
                open={showSalidaModal}
                onClose={() => setShowSalidaModal(false)}
                size="md"
                eyebrow="Trashumancia · Salida"
                title="Declarar Salida de Colmenas"
                footer={
                    <div className="flex items-center justify-end gap-2 w-full">
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setShowSalidaModal(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-gold btn-sm"
                            onClick={() => {
                                const ids = selectedColmenaIds.size > 0
                                    ? Array.from(selectedColmenaIds).join(',')
                                    : colmenasWorkspace.map((c) => c.id).join(',');
                                window.location.href = `/territorio/trashumancia?apiario_id=${activeApiario!.id}&colmenas=${ids}`;
                            }}
                        >
                            <Tent size={14} className="mr-1.5" /> Proceder con Declaración
                        </button>
                    </div>
                }
            >
                <div className="space-y-4 text-xs">
                    <div className="p-3 rounded-xl bg-surface-sunken border border-border/50">
                        <div className="text-muted-foreground text-[10px] uppercase font-mono tracking-wider">Apiario de origen</div>
                        <div className="text-sm font-bold text-foreground mt-0.5">{apiarioName}</div>
                    </div>

                    <div>
                        <div className="font-semibold text-foreground mb-2 flex items-center justify-between">
                            <span>
                                Colmenas a trasladar ({selectedColmenaIds.size > 0 ? selectedColmenaIds.size : colmenasWorkspace.length}):
                            </span>
                            {selectedColmenaIds.size === 0 && (
                                <span className="text-[11px] text-muted-foreground font-normal">
                                    (Todas las colmenas del apiario)
                                </span>
                            )}
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-xl border border-border/60 p-2 bg-background/50">
                            {(selectedColmenaIds.size > 0
                                ? colmenasWorkspace.filter((c) => selectedColmenaIds.has(c.id))
                                : colmenasWorkspace
                            ).map((c) => {
                                const state = hiveById.get(c.id) ?? buildHiveState(c, workspaceCtx);
                                return (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/40 text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ background: state.color }}
                                            />
                                            <span className="font-semibold text-foreground">{c.name}</span>
                                            <span className="text-muted-foreground">· {state.riskLabel}</span>
                                        </div>
                                        <span className="font-datos text-muted-foreground">
                                            {state.weightKg != null ? `${state.weightKg} kg` : 'sin peso'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Al continuar, serás redirigido al módulo de trashumancia con el lote de colmenas seleccionado para emitir el certificado SAG y registrar la ruta de traslado.
                    </p>
                </div>
            </ImmersiveModal>

            {/* Modal de Traslado a otro Apiario */}
            <ImmersiveModal
                open={showMoverModal}
                onClose={() => setShowMoverModal(false)}
                size="md"
                eyebrow="Traslado de patio"
                title="Mover Colmenas de Apiario"
                footer={
                    <div className="flex items-center justify-end gap-2 w-full">
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setShowMoverModal(false)}
                            disabled={trasladando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn btn-gold btn-sm"
                            onClick={handleMoverColmenas}
                            disabled={!targetApiarioId || trasladando}
                        >
                            {trasladando ? 'Trasladando…' : 'Confirmar Traslado'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4 text-xs">
                    <p className="text-muted-foreground">
                        Selecciona el apiario de destino para las <strong>{selectedColmenaIds.size}</strong> colmena(s) seleccionada(s):
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Apiario de Destino</label>
                        <select
                            className="input-field text-sm w-full"
                            value={targetApiarioId}
                            onChange={(e) => setTargetApiarioId(e.target.value)}
                        >
                            <option value="">Selecciona un apiario...</option>
                            {apiarios
                                .filter((a) => a.id !== activeApiario!.id)
                                .map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
            </ImmersiveModal>

            {editingApiario && (
                <ApiarioFormModal
                    draft={editingApiario}
                    setDraft={setEditingApiario}
                    error={apiarioError}
                    locatingGps={locatingGps}
                    onUseGps={handleUseMyLocation}
                    onSave={() => void handleSaveApiario()}
                    onClose={() => setEditingApiario(null)}
                    userComuna={userComuna}
                />
            )}
            {publicando && (
                <PublicarRegistroModal
                    apiario={publicando}
                    comuna={pubComuna}
                    setComuna={setPubComuna}
                    zona={pubZona}
                    setZona={setPubZona}
                    categoria={pubCategoria}
                    setCategoria={setPubCategoria}
                    error={apiarioError}
                    guardando={guardandoRegistro}
                    onPublicar={() => void publicarEnRegistro()}
                    onClose={() => setPublicando(null)}
                />
            )}

            <ConfirmDialog
                open={colmenaToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) setColmenaToDelete(null);
                }}
                title={colmenaToDelete ? `¿Eliminar la colmena "${colmenaToDelete.name}"?` : '¿Eliminar colmena?'}
                description="Se eliminará la colmena y todo su historial científico asociado. Esta acción no se puede deshacer."
                confirmLabel="Eliminar colmena"
                cancelLabel="Cancelar"
                variant="destructive"
                loading={isDeleting}
                onConfirm={async () => {
                    if (colmenaToDelete) {
                        await executeDeleteColmena(colmenaToDelete.id);
                    }
                }}
            />
        </div>
    );
}

function PublicarRegistroModal({
    apiario,
    comuna,
    setComuna,
    zona,
    setZona,
    categoria,
    setCategoria,
    error,
    guardando,
    onPublicar,
    onClose,
}: {
    apiario: ApiarioRow;
    comuna: string;
    setComuna: (v: string) => void;
    zona: string;
    setZona: (v: string) => void;
    categoria: string;
    setCategoria: (v: string) => void;
    error: string | null;
    guardando: boolean;
    onPublicar: () => void;
    onClose: () => void;
}) {
    const actualizando = Boolean((apiario as { apiario_registro_id?: string | null }).apiario_registro_id);
    return (
        <ImmersiveModal
            open
            onClose={onClose}
            size="md"
            eyebrow="Registro Territorial"
            title={actualizando ? 'Actualizar declaración en el Registro' : 'Publicar en el Registro Territorial'}
            footer={
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
                    <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={onClose} disabled={guardando}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={onPublicar} disabled={guardando}>
                        {guardando ? 'Publicando…' : actualizando ? 'Actualizar' : 'Publicar'}
                    </button>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <p className="text-sm text-muted-foreground">
                    El número de colmenas se cuenta en vivo desde tus colmenas. La ubicación se
                    proyecta como halo aproximado de ~2 km para proteger tu mapa comunitario.
                </p>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        Comuna *
                    </label>
                    <div className="flex flex-wrap gap-1 my-1">
                        {COMUNAS_CHILOE_APIARIOS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setComuna(c)}
                                className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                                    comuna.toLowerCase() === c.toLowerCase()
                                        ? "border-primary bg-primary/20 text-primary font-medium"
                                        : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                )}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <input
                        className="input-field w-full"
                        list="apiario-comunas-list"
                        value={comuna}
                        onChange={(e) => setComuna(e.target.value)}
                        placeholder="Ej. Castro"
                    />
                    <datalist id="apiario-comunas-list">
                        {Object.values(CHILE_COMUNAS_POR_REGION).flat().map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </div>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        Sector o paraje *
                    </label>
                    <input
                        className="input-field w-full"
                        value={zona}
                        onChange={(e) => setZona(e.target.value)}
                        placeholder="Ej. sector río, km 8"
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        Categoría
                    </label>
                    <select
                        className="input-field w-full"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                    >
                        <option value="produccion">Producción</option>
                        <option value="polinizacion">Polinización</option>
                        <option value="seleccion_cria">Selección y Cría</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
                {error && (
                    <div style={{ fontSize: '0.78rem', color: 'hsl(var(--destructive))' }}>{error}</div>
                )}
            </div>
        </ImmersiveModal>
    );
}

function ApiarioFormModal({
    draft,
    setDraft,
    error,
    locatingGps,
    onUseGps,
    onSave,
    onClose,
    userComuna,
}: {
    draft: ApiarioDraft;
    setDraft: (d: ApiarioDraft | null) => void;
    error: string | null;
    locatingGps: boolean;
    onUseGps: () => void;
    onSave: () => void;
    onClose: () => void;
    userComuna?: string | null;
}) {
    const isEdit = Boolean(draft.id);
    const latNum = draft.lat !== '' && !Number.isNaN(parseFloat(draft.lat)) ? parseFloat(draft.lat) : null;
    const lngNum = draft.lng !== '' && !Number.isNaN(parseFloat(draft.lng)) ? parseFloat(draft.lng) : null;

    const canonicalUserComuna = userComuna ? nombreCanonicoComuna(userComuna) : null;
    const currentComuna = nombreCanonicoComuna(draft.comuna || canonicalUserComuna || 'Castro');

    const handleMapPick = (lat: number, lng: number) => {
        setDraft({
            ...draft,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
        });
    };

    const handleComunaChange = (newComuna: string) => {
        const canonical = nombreCanonicoComuna(newComuna);
        const coords = resolveComunaCoords(canonical);
        setDraft({
            ...draft,
            comuna: canonical,
            lat: coords ? coords.lat.toFixed(6) : draft.lat,
            lng: coords ? coords.lng.toFixed(6) : draft.lng,
        });
    };

    const isUserOriginComuna = Boolean(
        canonicalUserComuna && currentComuna.toLowerCase() === canonicalUserComuna.toLowerCase()
    );

    return (
        <ImmersiveModal
            open
            onClose={onClose}
            size="xl"
            eyebrow="Campo"
            title={isEdit ? 'Editar apiario' : 'Registrar nuevo apiario'}
            footer={
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
                    <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={onSave}>
                        {isEdit ? 'Guardar cambios' : 'Registrar y entrar'}
                    </button>
                </div>
            }
        >
            <div className="text-foreground">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
                    {/* Columna Izquierda: Formulario de datos */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Nombre del apiario */}
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Nombre del apiario *
                            </label>
                            <input
                                className="input-field w-full"
                                value={draft.name}
                                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                placeholder="Ej. Valle Sur, El Canelo, Molulco..."
                                autoFocus
                            />
                        </div>

                        {/* Comuna de Chiloé y Sector rural */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-foreground">
                                        Comuna de Chiloé
                                    </label>
                                    {isUserOriginComuna && (
                                        <span className="inline-flex items-center gap-1 text-[0.68rem] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                                            <MapPin size={10} />
                                            Tu comuna
                                        </span>
                                    )}
                                </div>
                                <select
                                    className="input-field w-full text-xs"
                                    value={currentComuna}
                                    onChange={(e) => handleComunaChange(e.target.value)}
                                >
                                    {COMUNAS_CHILOE_APIARIOS.map((c) => (
                                        <option key={c} value={c}>
                                            {c} {canonicalUserComuna === c ? '— Comuna de tu registro' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1.5">
                                    Sector / Paraje rural
                                </label>
                                <input
                                    className="input-field w-full text-xs"
                                    value={draft.sector || ''}
                                    onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
                                    placeholder="Ej. Terao, Huillinco, Chepu, Llingua..."
                                />
                            </div>
                        </div>

                        {/* Régimen del apiario */}
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Régimen del apiario
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDraft({ ...draft, regimen: 'fijo' })}
                                    className={cn(
                                        'px-3 py-2 text-xs rounded-lg border text-left transition-colors flex items-center justify-between',
                                        (draft.regimen ?? 'fijo') === 'fijo'
                                            ? 'bg-primary/10 border-primary text-foreground font-medium'
                                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <span className="flex items-center gap-1.5 truncate">
                                        <span>🌲</span>
                                        <span>Fijo</span>
                                    </span>
                                    {(draft.regimen ?? 'fijo') === 'fijo' && <Check size={14} className="text-primary shrink-0" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDraft({ ...draft, regimen: 'trashumante' })}
                                    className={cn(
                                        'px-3 py-2 text-xs rounded-lg border text-left transition-colors flex items-center justify-between',
                                        draft.regimen === 'trashumante'
                                            ? 'bg-primary/10 border-primary text-foreground font-medium'
                                            : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    <span className="flex items-center gap-1.5 truncate">
                                        <span>🚚</span>
                                        <span>Trashumante</span>
                                    </span>
                                    {draft.regimen === 'trashumante' && <Check size={14} className="text-primary shrink-0" />}
                                </button>
                            </div>
                        </div>

                        {/* Detalles y notas del entorno */}
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                                Flora melífera y notas del entorno (opcional)
                            </label>
                            <textarea
                                className="input-field w-full text-xs"
                                rows={3}
                                value={draft.details}
                                onChange={(e) => setDraft({ ...draft, details: e.target.value })}
                                placeholder="Flora predominante (Ulmo, Tiaca, Tepú, Bosque nativo), accesibilidad o acuerdos del predio..."
                            />
                        </div>

                        {error && (
                            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Columna Derecha: Visor Satelital Amplio y Coordenadas */}
                    <div className="lg:col-span-7 flex flex-col space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Compass size={14} className="text-primary" />
                                Visor satelital (haz click en el mapa para fijar el apiario)
                            </label>
                            <button
                                type="button"
                                className="btn btn-outline btn-xs self-start sm:self-auto text-xs"
                                onClick={onUseGps}
                                disabled={locatingGps}
                            >
                                <LocateFixed size={12} className="inline mr-1" />
                                {locatingGps ? 'Obteniendo GPS…' : 'Usar mi ubicación GPS'}
                            </button>
                        </div>

                        <ApiarioPickerMap
                            lat={latNum}
                            lng={lngNum}
                            comuna={currentComuna}
                            onChange={handleMapPick}
                        />

                        {/* Coordenadas en fila limpia */}
                        <div className="grid grid-cols-2 gap-3 pt-0.5">
                            <div>
                                <label className="block text-[0.7rem] text-muted-foreground mb-0.5">Latitud GPS</label>
                                <input
                                    className="input-field w-full text-xs font-mono"
                                    type="number"
                                    step="any"
                                    placeholder="-42.480000"
                                    value={draft.lat}
                                    onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[0.7rem] text-muted-foreground mb-0.5">Longitud GPS</label>
                                <input
                                    className="input-field w-full text-xs font-mono"
                                    type="number"
                                    step="any"
                                    placeholder="-73.760000"
                                    value={draft.lng}
                                    onChange={(e) => setDraft({ ...draft, lng: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ImmersiveModal>
    );
}
