import { useMemo, useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, ChevronRight, Droplets, LocateFixed, ArrowLeft, Warehouse, Landmark, AlertTriangle, Tent } from 'lucide-react';
import type { ApiarioRow, ColmenaWithRelations, RegistroApiarioEstado } from '@/lib/apicultor-types';
import { supabase } from '../../lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError, ImmersiveModal } from '@enjambre/ui';
import {
    buildApiaryState,
    buildHiveState,
    type HiveStateContext,
    type RiskLevel,
    RISK_COLORS,
    RISK_LABELS,
} from '@/lib/hive-state';
import { HiveStateBadge, HiveStateDot } from './HiveStateBadge';
import { YardActionFeed } from './YardActionFeed';

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
}

interface ApiarioDraft {
    id?: string;
    name: string;
    lat: string;
    lng: string;
    health: 'optimal' | 'attention' | 'risk';
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
}: ApiarioManagerProps) {
    const apiFetch = useApiFetch();
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
        setPubComuna(prev?.comuna ?? '');
        setPubZona(prev?.zona ?? '');
        setPubCategoria(prev?.categoria ?? 'produccion');
        setPublicando(row);
    };

    const activeApiario = apiarios.find((a) => a.id === activeApiarioId) ?? null;
    const workspaceMode = Boolean(activeApiario);

    const colmenasWorkspace = activeApiario
        ? localColmenas.filter(
            (c) => c.apiario_id === activeApiario.id || c.apiario_name === activeApiario.name,
          )
        : [];

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
        setEditingApiario({ name: '', lat: '', lng: '', health: 'optimal', details: '' });
    };

    const openEditApiario = (row: ApiarioRow, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setApiarioError(null);
        setEditingApiario({
            id: row.id,
            name: row.name ?? '',
            lat: row.lat != null ? String(row.lat) : '',
            lng: row.lng != null ? String(row.lng) : '',
            health: (row.health as ApiarioDraft['health']) || 'optimal',
            details: row.details ?? '',
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
            alzas: 1
        } as unknown as ColmenaWithRelations);
    };

    const handleEditColmena = (c: ColmenaWithRelations) => {
        setInspeccionBasal(INSPECCION_BASAL_INICIAL);
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
            setApiarioError('Coordenadas inválidas: usa grados decimales (ej. -42.483123, -73.743195).');
            return;
        }

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
                        health: editingApiario.health,
                        details: editingApiario.details.trim() || null,
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
                health: editingApiario.health,
                details: editingApiario.details.trim() || null,
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

    const handleDeleteApiario = async (row: ApiarioRow, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`¿Eliminar el apiario "${row.name}"? Sus colmenas quedarán sin apiario asignado.`)) return;
        try {
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
        } catch (err) {
            console.error('Error eliminando apiario', err);
            toast(friendlyError(err, 'Error al eliminar el apiario'), { type: 'error' });
        }
    };

    // Inspección basal (BITACORA_APICOLA.md §1.1): sólo se escribe si hay datos
    // científicos; reina RV/SR alimenta el booleano `reina` de la ficha.
    const persistInspeccionBasal = async (colmenaId: string, uid: string | null, queen: string | null | undefined) => {
        const b = inspeccionBasal;
        const hasBasal = b.marcos_cria > 0 || b.marcos_miel > 0 || b.varroa > 0 || b.poblacion !== '' || b.enjambrazon_riesgo !== 'bajo';
        if (!hasBasal) return;

        const date = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('inspecciones').insert({
            colmena_id: colmenaId, date, inspector: 'Apicultor',
            marcos_cria: b.marcos_cria > 0 ? b.marcos_cria : null,
            marcos_miel: b.marcos_miel > 0 ? b.marcos_miel : null,
            varroa: b.varroa > 0 ? b.varroa : null,
            poblacion: b.poblacion.toLowerCase() || null,
            reina: queen === 'RV' ? true : queen === 'SR' ? false : null,
            enjambrazon_riesgo: b.enjambrazon_riesgo,
            user_id: uid,
        });
        if (error) {
            console.error('Error registrando inspección basal', error);
            return;
        }
        // last_inspection lo mantiene el trigger trg_inspecciones_last_inspection.
    };

    const handleSaveColmena = async (c: ColmenaWithRelations) => {
        const cleanName = c.name?.trim() || 'Colmena';
        const colmenaClean = { ...c, name: cleanName };

        // Optimistic UI updates
        setLocalColmenas(prev => {
            const exists = prev.find(p => p.id === c.id);
            if (exists) return prev.map(p => p.id === c.id ? colmenaClean : p);
            return [...prev, colmenaClean];
        });
        setEditingColmena(null);

        // Supabase persistence
        try {
            // El schema vivo usa colmenas.health (valores en inglés) y apiarios.user_id
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
            const isNew = !colmenaClean.id || colmenaClean.id.includes('mock') || colmenaClean.id.length < 20; // Supabase uses UUIDs
            if (isNew && !apiarioId) {
                // Antes esto se salteaba en silencio mostrando "guardada": pérdida de datos.
                toast('No se pudo resolver el apiario de la colmena. Edita el apiario e intenta de nuevo.', { type: 'error' });
                return;
            }
            if (isNew && apiarioId) {
          const { data: newRow, error: insertError } = await supabase.from('colmenas').insert({
            apiario_id: apiarioId, name: colmenaClean.name, health: colmenaClean.health || 'optimal', user_id: uid,
            floracion: colmenaClean.floracion,
            last_inspection: colmenaClean.last_inspection || null,
            alzas: colmenaClean.alzas || 1, notes: colmenaClean.notes || '', queen: colmenaClean.queen
          }).select('id').single();
          if (insertError) throw insertError;

          // Update local ID behind the scenes
          if (newRow) {
              setLocalColmenas(prev => prev.map(p => p.id === colmenaClean.id ? { ...p, id: newRow.id } : p));
              await persistInspeccionBasal(newRow.id, uid, colmenaClean.queen);
          }
            } else if (!isNew) {
                const { error: updateError } = await supabase.from('colmenas').update({
                    name: colmenaClean.name,
                    health: colmenaClean.health || 'optimal',
                    floracion: colmenaClean.floracion,
                    last_inspection: colmenaClean.last_inspection || null,
                    alzas: colmenaClean.alzas || 1,
                    notes: colmenaClean.notes || '',
                    queen: colmenaClean.queen,
                }).eq('id', colmenaClean.id);
                if (updateError) throw updateError;
                await persistInspeccionBasal(colmenaClean.id, uid, colmenaClean.queen);
            }
            toast('Colmena guardada', { type: 'success' });
        } catch (err) {
            console.error("Error syncing colmena to Supabase", err);
            toast(friendlyError(err, 'Error al guardar la colmena'), { type: 'error' });
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta colmena y todo su historial científico?')) {
            // UI optimistic
            setLocalColmenas(prev => prev.filter(c => c.id !== id));
            // Supabase delete
            if (!id.includes('mock') && id.length >= 20) {
                await supabase.from('colmenas').delete().eq('id', id);
            }
        }
    };

    // ── Colección: tarjetas de apiarios ──────────────────────────────────
    if (!workspaceMode) {
        return (
            <div className="card animate-in delay-2">
                <div className="section-header">
                    <div>
                        <div className="section-title">Tus apiarios</div>
                        <div className="section-subtitle">
                            Entrá a un apiario para ver sus colmenas. Con uno solo se abre solo.
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary btn-sm" onClick={openNewApiario}>
                        <MapPin size={14} /> Nuevo apiario
                    </button>
                </div>

                {apiarios.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <Warehouse size={36} className="mx-auto mb-3 text-muted-foreground/40" />
                        <p className="font-medium text-foreground mb-1">Aún no hay apiarios</p>
                        <p className="text-sm text-muted-foreground mb-4">
                            Creá el primero: nombre, GPS y estado sanitario. Luego sumás colmenas adentro.
                        </p>
                        <button type="button" className="btn btn-primary" onClick={openNewApiario}>
                            <Plus size={14} className="mr-1" /> Registrar primer apiario
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
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

                            return (
                                <div
                                    key={row.id}
                                    className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors"
                                >
                                    <button
                                        type="button"
                                        className="text-left flex items-start gap-3 min-h-11"
                                        onClick={() => onEnterApiario(row.id)}
                                    >
                                        <HiveStateDot
                                            risk={yard.worstRisk}
                                            color={healthColor}
                                            size={10}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-foreground truncate">
                                                {row.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {cols.length} colmena{cols.length === 1 ? '' : 's'}
                                                {' · '}
                                                <span style={{ color: healthColor }}>
                                                    {RISK_LABELS[yard.worstRisk]}
                                                </span>
                                                {hasCoords
                                                    ? ` · ${row.lat!.toFixed(4)}, ${row.lng!.toFixed(4)}`
                                                    : ''}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Droplets size={12} className="text-accent" />
                                                {kg} kg temporada
                                            </div>
                                            {(() => {
                                                const estado = registroMap[row.id];
                                                if (!estado) return null;
                                                const desfase = estado.activo && cols.length !== estado.n_colmenas;
                                                return (
                                                    <div className="mt-1 flex items-center gap-1 text-xs">
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                                                            <Landmark size={11} /> Declarado en Registro
                                                        </span>
                                                        {desfase && (
                                                            <span className="inline-flex items-center gap-1 text-destructive">
                                                                <AlertTriangle size={11} /> vivo {cols.length} / declarado {estado.n_colmenas}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <ChevronRight size={18} className="text-muted-foreground shrink-0 mt-1" />
                                    </button>
                                    <div className="flex gap-2 border-t border-border/40 pt-2">
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm flex-1"
                                            onClick={(e) => openEditApiario(row, e)}
                                        >
                                            <Edit2 size={14} className="mr-1" /> Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                abrirPublicar(row);
                                            }}
                                            title="Publicar o actualizar en el Registro Territorial"
                                        >
                                            <Landmark size={14} className="mr-1" />
                                            {registroMap[row.id] ? 'Actualizar' : 'Publicar'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-sm text-destructive"
                                            aria-label={`Eliminar ${row.name}`}
                                            onClick={(e) => void handleDeleteApiario(row, e)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
            </div>
        );
    }

    // ── Workspace: colmenas del apiario activo ───────────────────────────
    const apiarioName = activeApiario!.name ?? 'Apiario';

    return (
        <div className="card animate-in delay-2">
            <div className="section-header">
                <div className="flex flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={onLeaveApiario}
                        >
                            <ArrowLeft size={14} className="mr-1" />
                            Todos los apiarios
                        </button>
                        {apiarios.length > 1 && (
                            <select
                                className="input-field text-sm max-w-[14rem]"
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
                    </div>
                    <div>
                        <div className="section-title">{apiarioName}</div>
                        <div className="section-subtitle" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                            {riskOrder
                                .filter((r) => riskSummary[r] > 0)
                                .map((r) => (
                                    <span key={r} style={{ color: RISK_COLORS[r] }}>
                                        ● {riskSummary[r]} {RISK_LABELS[r].toLowerCase()}
                                    </span>
                                ))}
                            {workspaceApiary.hiveCount === 0 && (
                                <span className="text-muted-foreground">Sin colmenas</span>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openEditApiario(activeApiario!)}
                    >
                        <Edit2 size={14} /> Editar apiario
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => abrirPublicar(activeApiario!)}
                        title="Publicar o actualizar en el Registro Territorial"
                    >
                        <Landmark size={14} /> {registroMap[activeApiario!.id] ? 'Actualizar registro' : 'Publicar en registro'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                            window.location.href = `/territorio/trashumancia?apiario_id=${activeApiario!.id}`;
                        }}
                        title="Declarar salida trashumante desde este apiario"
                    >
                        <Tent size={14} /> Declarar salida
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={openNewApiario}>
                        <MapPin size={14} /> Otro apiario
                    </button>
                    <button
                        type="button"
                        className="btn btn-gold btn-sm"
                        onClick={() => handleAddColmena(apiarioName)}
                    >
                        <Plus size={14} /> Colmena
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: 12 }}>
                <YardActionFeed
                    hives={workspaceApiary.hives}
                    onSelectColmenaId={(id) => {
                        const c = colmenasWorkspace.find((x) => x.id === id);
                        if (c) onSelectColmena(c);
                    }}
                />
            </div>

            <div className="colmena-list" style={{ gap: 4 }}>
                {colmenasWorkspace.length === 0 ? (
                    <div className="text-center py-10 text-sm text-muted-foreground">
                        Este apiario aún no tiene colmenas.
                        <div className="mt-3">
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAddColmena(apiarioName)}
                            >
                                <Plus size={14} className="mr-1" /> Primera colmena
                            </button>
                        </div>
                    </div>
                ) : (
                    colmenasWorkspace.map((c) => {
                        const state =
                            hiveById.get(c.id) ?? buildHiveState(c, workspaceCtx);
                        const pesoLabel =
                            state.weightKg != null ? `${state.weightKg} kg` : 'sin peso';
                        const varroaLabel =
                            state.varroaLevel != null
                                ? `V ${state.varroaLevel}`
                                : 'sin varroa';
                        return (
                        <div key={c.id} className="colmena-item" style={{ background: 'hsl(var(--card))', position: 'relative' }}>
                            <div
                                className="colmena-status"
                                style={{ background: state.color }}
                                title={state.riskLabel}
                            />
                            <div
                                style={{
                                    flex: 1,
                                    cursor: 'pointer',
                                    minHeight: 44,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    gap: 4,
                                    minWidth: 0,
                                }}
                                onClick={() => onSelectColmena(c)}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <div className="colmena-name" style={{ fontSize: '0.85rem' }}>
                                        {c.name}
                                    </div>
                                    <HiveStateBadge state={state} size="sm" />
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.68rem',
                                        color: 'hsl(var(--muted-foreground))',
                                        display: 'flex',
                                        gap: 10,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <span>{state.floracion || c.floracion || 'Sin floración'}</span>
                                    <span>⚖️ {pesoLabel}</span>
                                    <span>🔬 {varroaLabel}</span>
                                    {state.weightTrend === 'down' && (
                                        <span style={{ color: RISK_COLORS.alert }}>peso ↓</span>
                                    )}
                                </div>
                                {state.primaryAction && (
                                    <div
                                        style={{
                                            fontSize: '0.62rem',
                                            color: state.color,
                                            opacity: 0.9,
                                        }}
                                    >
                                        {state.primaryAction}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="colmena-production" style={{ textAlign: 'right', marginRight: 8 }}>
                                    <div className="colmena-production-value" style={{ fontSize: '0.9rem' }}>
                                        {c.production_total || 0}
                                    </div>
                                    <div className="colmena-production-label" style={{ fontSize: '0.6rem' }}>
                                        kg
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        style={{ minWidth: 44, minHeight: 44, padding: 0 }}
                                        aria-label={`Editar ${c.name}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditColmena(c);
                                        }}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        style={{
                                            minWidth: 44,
                                            minHeight: 44,
                                            padding: 0,
                                            color: 'hsl(var(--destructive))',
                                        }}
                                        aria-label={`Eliminar ${c.name}`}
                                        onClick={(e) => handleDelete(c.id, e)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        );
                    })
                )}
                {colmenasWorkspace.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleAddColmena(apiarioName)}
                        style={{
                            marginTop: 8,
                            padding: '8px',
                            borderStyle: 'dashed',
                            color: 'hsl(var(--muted-foreground))',
                            width: '100%',
                        }}
                    >
                        <Plus size={14} style={{ display: 'inline', marginRight: 6 }} /> Agregar colmena
                    </button>
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
                        <>
                            <button type="button" className="btn btn-ghost" onClick={() => setEditingColmena(null)}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleSaveColmena(editingColmena)}
                            >
                                Guardar cambios
                            </button>
                        </>
                    ) : null
                }
            >
                {editingColmena && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Nombre identificador</label>
                                <input className="input-field w-full" value={editingColmena.name} onChange={e => setEditingColmena({ ...editingColmena, name: e.target.value })} placeholder="Ej. Colmena Reina Vieja" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Estado de salud</label>
                                    <select className="input-field w-full" value={editingColmena.health || 'optimal'} onChange={e => setEditingColmena({ ...editingColmena, health: e.target.value as ColmenaWithRelations['health'] })}>
                                        <option value="optimal" className="bg-card text-foreground">Óptima</option>
                                        <option value="attention" className="bg-card text-foreground">Atención</option>
                                        <option value="risk" className="bg-card text-foreground">Riesgo / Crítica</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Alzas activas</label>
                                    <input className="input-field w-full" type="number" min={0} max={6} value={editingColmena.alzas || 0} onChange={e => setEditingColmena({ ...editingColmena, alzas: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid hsl(var(--border) / 0.5)', paddingTop: 'var(--space-md)', fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>
                                Registro científico basal — se guarda como primera inspección
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Cuadros con cría</label>
                                    <input className="input-field w-full" type="number" min={0} max={40} value={inspeccionBasal.marcos_cria || ''} onChange={e => setInspeccionBasal({ ...inspeccionBasal, marcos_cria: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>Cuadros con miel</label>
                                    <input className="input-field w-full" type="number" min={0} max={40} value={inspeccionBasal.marcos_miel || ''} onChange={e => setInspeccionBasal({ ...inspeccionBasal, marcos_miel: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

            {editingApiario && (
                <ApiarioFormModal
                    draft={editingApiario}
                    setDraft={setEditingApiario}
                    error={apiarioError}
                    locatingGps={locatingGps}
                    onUseGps={handleUseMyLocation}
                    onSave={() => void handleSaveApiario()}
                    onClose={() => setEditingApiario(null)}
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
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose} disabled={guardando}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={onPublicar} disabled={guardando}>
                        {guardando ? 'Publicando…' : actualizando ? 'Actualizar' : 'Publicar'}
                    </button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <p className="text-sm text-muted-foreground">
                    El número de colmenas se cuenta en vivo desde tus colmenas. La ubicación se
                    degrada a ~1 km para proteger tu mapa comunitario.
                </p>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                        Comuna *
                    </label>
                    <input
                        className="input-field w-full"
                        value={comuna}
                        onChange={(e) => setComuna(e.target.value)}
                        placeholder="Ej. Castro"
                    />
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
}: {
    draft: ApiarioDraft;
    setDraft: (d: ApiarioDraft | null) => void;
    error: string | null;
    locatingGps: boolean;
    onUseGps: () => void;
    onSave: () => void;
    onClose: () => void;
}) {
    const isEdit = Boolean(draft.id);
    return (
        <ImmersiveModal
            open
            onClose={onClose}
            size="md"
            eyebrow="Campo"
            title={isEdit ? 'Editar apiario' : 'Registrar nuevo apiario'}
            footer={
                <>
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="button" className="btn btn-primary" onClick={onSave}>
                        {isEdit ? 'Guardar cambios' : 'Registrar y entrar'}
                    </button>
                </>
            }
        >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                            Nombre del apiario *
                        </label>
                        <input
                            className="input-field w-full"
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                            placeholder="Ej. Valle Sur"
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                            Coordenadas GPS (grados decimales)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <input
                                className="input-field w-full"
                                type="number"
                                step="any"
                                placeholder="Latitud"
                                value={draft.lat}
                                onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
                            />
                            <input
                                className="input-field w-full"
                                type="number"
                                step="any"
                                placeholder="Longitud"
                                value={draft.lng}
                                onChange={(e) => setDraft({ ...draft, lng: e.target.value })}
                            />
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ marginTop: 8 }}
                            onClick={onUseGps}
                            disabled={locatingGps}
                        >
                            <LocateFixed size={14} style={{ display: 'inline', marginRight: 6 }} />
                            {locatingGps ? 'Obteniendo ubicación…' : 'Usar mi ubicación actual'}
                        </button>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                            Estado sanitario del apiario
                        </label>
                        <select
                            className="input-field w-full"
                            value={draft.health}
                            onChange={(e) =>
                                setDraft({ ...draft, health: e.target.value as ApiarioDraft['health'] })
                            }
                        >
                            <option value="optimal">Óptima</option>
                            <option value="attention">Atención</option>
                            <option value="risk">Riesgo / Crítica</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                            Detalles
                        </label>
                        <textarea
                            className="input-field w-full"
                            rows={4}
                            value={draft.details}
                            onChange={(e) => setDraft({ ...draft, details: e.target.value })}
                            placeholder="Entorno, flora, altitud, antecedentes sanitarios…"
                        />
                    </div>
                    {error && (
                        <div style={{ fontSize: '0.78rem', color: 'hsl(var(--destructive))' }}>{error}</div>
                    )}
                </div>
        </ImmersiveModal>
    );
}
