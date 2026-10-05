import { useState, useEffect, useMemo } from 'react';
import {
  TreePine,
  Camera,
  MapPin,
  Leaf,
  Plus,
  ChevronDown,
  Edit3,
  Trash2,
  UploadCloud,
  ShieldCheck,
  Flower2,
  Filter,
  CheckCircle2,
  Compass,
  Layers,
  Info,
  Search,
} from 'lucide-react';

import { toast, friendlyError, ViewLoading, ImmersiveModal, cn } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { ViewShell } from '@/components/layout/ViewShell';
import {
  IMPACTO_METODOLOGIA_VERSION,
  computeIrrSimplificado,
  ESPECIES_ALOMETRIA_CHILOE,
  FACTORES_ESTADIO,
  META_CENSO_2026_2027,
  CAMPANA_CENSO_DEFAULT,
  calcularBiomasaYCO2,
  normalizarClaveEspecie,
  type RegimenInventario,
  type EstadioCrecimiento,
} from '@enjambre/impacto';

interface TreeRecord {
  id: string;
  species: string;
  count: number;
  date: string;
  location: string;
  co2: number;
  co2_anual_kg: number;
  status: EstadioCrecimiento;
  regimen: RegimenInventario;
  campana: string;
  parcela: string | null;
  apiario_id: string | null;
  apiario_nombre: string | null;
  dap_cm: number | null;
  altura_m: number | null;
  notas: string | null;
  lat: number | null;
  lng: number | null;
  user_id?: string | null;
}

interface ApiarioOption {
  id: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
}

type ArbolApiRow = {
  id: string;
  especie: string;
  cantidad: number;
  sector?: string | null;
  fecha?: string | null;
  status?: string | null;
  regimen?: string | null;
  campana?: string | null;
  parcela?: string | null;
  apiario_id?: string | null;
  apiario_nombre?: string | null;
  dap_cm?: number | null;
  altura_m?: number | null;
  co2_ton?: number | null;
  co2_anual_kg?: number | null;
  notas?: string | null;
  lat?: number | null;
  lng?: number | null;
};

function mapRowToTreeRecord(r: ArbolApiRow | Record<string, unknown>): TreeRecord {
  const fecha = String((r as ArbolApiRow).fecha ?? '');
  const rawStatus = String((r as ArbolApiRow).status ?? 'joven');
  const validStatus: EstadioCrecimiento = [
    'plantula',
    'joven',
    'creciendo',
    'adulto',
    'monumental',
  ].includes(rawStatus)
    ? (rawStatus as EstadioCrecimiento)
    : 'joven';

  const rawRegimen = String((r as ArbolApiRow).regimen ?? 'preservacion');
  const validRegimen: RegimenInventario =
    rawRegimen === 'reforestacion' ? 'reforestacion' : 'preservacion';

  return {
    id: String(r.id),
    species: String((r as ArbolApiRow).especie ?? ''),
    count: Number((r as ArbolApiRow).cantidad) || 0,
    date: fecha === '—' ? '' : fecha,
    location: String((r as ArbolApiRow).sector ?? ''),
    co2: Number((r as ArbolApiRow).co2_ton) || 0,
    co2_anual_kg: Number((r as ArbolApiRow).co2_anual_kg) || 0,
    status: validStatus,
    regimen: validRegimen,
    campana: String((r as ArbolApiRow).campana ?? CAMPANA_CENSO_DEFAULT),
    parcela: (r as ArbolApiRow).parcela ? String((r as ArbolApiRow).parcela) : null,
    apiario_id: (r as ArbolApiRow).apiario_id ? String((r as ArbolApiRow).apiario_id) : null,
    apiario_nombre: (r as ArbolApiRow).apiario_nombre ? String((r as ArbolApiRow).apiario_nombre) : null,
    dap_cm: (r as ArbolApiRow).dap_cm != null ? Number((r as ArbolApiRow).dap_cm) : null,
    altura_m: (r as ArbolApiRow).altura_m != null ? Number((r as ArbolApiRow).altura_m) : null,
    notas: (r as ArbolApiRow).notas ? String((r as ArbolApiRow).notas) : null,
    lat: (r as ArbolApiRow).lat != null ? Number((r as ArbolApiRow).lat) : null,
    lng: (r as ArbolApiRow).lng != null ? Number((r as ArbolApiRow).lng) : null,
  };
}

interface CensoFormData {
  species: string;
  count: string;
  regimen: RegimenInventario;
  status: EstadioCrecimiento;
  campana: string;
  apiario_id: string;
  parcela: string;
  location: string;
  dap_cm: string;
  altura_m: string;
  lat: string;
  lng: string;
  date: string;
  notes: string;
}

const INITIAL_FORM_DATA: CensoFormData = {
  species: 'Ulmo',
  count: '25',
  regimen: 'preservacion',
  status: 'adulto',
  campana: CAMPANA_CENSO_DEFAULT,
  apiario_id: '',
  parcela: 'Parcela Ladera Pureo',
  location: 'Pureo Rural km 8560',
  dap_cm: '45',
  altura_m: '22',
  lat: '-42.612450',
  lng: '-73.654320',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

export interface RegeneracionViewProps {}

export function RegeneracionView(_props: RegeneracionViewProps = {}) {
  const apiFetch = useApiFetch();
  const [records, setRecords] = useState<TreeRecord[]>([]);
  const [apiarios, setApiarios] = useState<ApiarioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Filters
  const [filterRegimen, setFilterRegimen] = useState<'todos' | RegimenInventario>('todos');
  const [filterApiario, setFilterApiario] = useState<string>('todos');
  const [filterCampana, setFilterCampana] = useState<string>(CAMPANA_CENSO_DEFAULT);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CensoFormData>(INITIAL_FORM_DATA);

  const [editingRecord, setEditingRecord] = useState<TreeRecord | null>(null);
  const [editFormData, setEditFormData] = useState<CensoFormData>(INITIAL_FORM_DATA);

  const [recordToDelete, setRecordToDelete] = useState<TreeRecord | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [arbolesRes, apiariosRes] = await Promise.all([
          apiFetch('/api/produccion/arboles'),
          apiFetch('/api/produccion/apiarios').catch(() => null),
        ]);

        if (arbolesRes.status === 429) {
          throw new Error('Demasiadas solicitudes. Espera un momento y recarga la página.');
        }
        if (!arbolesRes.ok) throw new Error('Error al cargar censo biofísico');
        const json = await arbolesRes.json();
        setRecords((json.data ?? []).map((r: ArbolApiRow) => mapRowToTreeRecord(r)));

        if (apiariosRes && apiariosRes.ok) {
          const apiariosJson = await apiariosRes.json();
          setApiarios(
            (apiariosJson.data ?? []).map((a: { id: string; name?: string; lat?: number; lng?: number }) => ({
              id: a.id,
              name: a.name || 'Apiario sin nombre',
              lat: a.lat,
              lng: a.lng,
            })),
          );
        }
      } catch (err) {
        toast(friendlyError(err, 'Error al inicializar centro de mando biofísico'), {
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [apiFetch]);

  // Set default apiario in form once apiarios are loaded
  useEffect(() => {
    if (apiarios.length > 0 && !formData.apiario_id) {
      const pureoApiario =
        apiarios.find((a) => a.name.toLowerCase().includes('pureo')) ?? apiarios[0];
      setFormData((prev) => ({
        ...prev,
        apiario_id: pureoApiario.id,
        lat: pureoApiario.lat ? String(pureoApiario.lat) : prev.lat,
        lng: pureoApiario.lng ? String(pureoApiario.lng) : prev.lng,
      }));
    }
  }, [apiarios, formData.apiario_id]);

  // Live allometric preview in create modal
  const livePreview = useMemo(() => {
    const countNum = parseInt(formData.count) || 0;
    const dapNum = formData.dap_cm ? parseFloat(formData.dap_cm) : null;
    return calcularBiomasaYCO2({
      especie: formData.species,
      cantidad: countNum,
      estadio: formData.status,
      dapCm: dapNum,
      regimen: formData.regimen,
    });
  }, [formData.species, formData.count, formData.status, formData.dap_cm, formData.regimen]);

  // Live allometric preview in edit modal
  const liveEditPreview = useMemo(() => {
    const countNum = parseInt(editFormData.count) || 0;
    const dapNum = editFormData.dap_cm ? parseFloat(editFormData.dap_cm) : null;
    return calcularBiomasaYCO2({
      especie: editFormData.species,
      cantidad: countNum,
      estadio: editFormData.status,
      dapCm: dapNum,
      regimen: editFormData.regimen,
    });
  }, [
    editFormData.species,
    editFormData.count,
    editFormData.status,
    editFormData.dap_cm,
    editFormData.regimen,
  ]);

  // Aggregate metrics
  const totalTrees = records.reduce((s, r) => s + r.count, 0);
  const totalCO2StockTon = parseFloat(
    records.reduce((s, r) => s + r.co2, 0).toFixed(2),
  );
  const totalCO2AnualKg = Math.round(
    records.reduce((s, r) => s + r.co2_anual_kg, 0),
  );
  const treesPreservacion = records
    .filter((r) => r.regimen !== 'reforestacion')
    .reduce((s, r) => s + r.count, 0);
  const treesReforestacion = records
    .filter((r) => r.regimen === 'reforestacion')
    .reduce((s, r) => s + r.count, 0);

  const uniqueZones = new Set(records.map((r) => r.location).filter(Boolean)).size;
  const uniqueSpecies = new Set(records.map((r) => r.species).filter(Boolean)).size;

  const currentYear = new Date().getFullYear();
  const foundationYear = 2004;
  const anosLegado = currentYear - foundationYear;

  // Census campaign progress
  const metaCenso = META_CENSO_2026_2027;
  const metaProgresoPct =
    metaCenso.arbolesObjetivo > 0
      ? parseFloat(((totalTrees / metaCenso.arbolesObjetivo) * 100).toFixed(1))
      : 0;

  // Dynamic IRR
  const irrNum = computeIrrSimplificado(totalCO2StockTon, totalTrees);
  const irrValue = irrNum != null ? String(irrNum) : '—';

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterRegimen !== 'todos' && r.regimen !== filterRegimen) return false;
      if (filterApiario !== 'todos' && r.apiario_id !== filterApiario) return false;
      if (filterCampana !== 'todas' && r.campana !== filterCampana) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSpecies = r.species.toLowerCase().includes(q);
        const matchesLocation = r.location.toLowerCase().includes(q);
        const matchesParcela = (r.parcela ?? '').toLowerCase().includes(q);
        const matchesApiario = (r.apiario_nombre ?? '').toLowerCase().includes(q);
        if (!matchesSpecies && !matchesLocation && !matchesParcela && !matchesApiario) {
          return false;
        }
      }
      return true;
    });
  }, [records, filterRegimen, filterApiario, filterCampana, searchQuery]);

  const displayedRecords = showAll ? filteredRecords : filteredRecords.slice(0, 6);

  // GPS Capture Helper
  const captureGps = (target: 'create' | 'edit') => {
    if (!navigator.geolocation) {
      toast('La geolocalización no está soportada en este navegador', { type: 'error' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latStr = pos.coords.latitude.toFixed(6);
        const lngStr = pos.coords.longitude.toFixed(6);
        if (target === 'create') {
          setFormData((prev) => ({ ...prev, lat: latStr, lng: lngStr }));
        } else {
          setEditFormData((prev) => ({ ...prev, lat: latStr, lng: lngStr }));
        }
        toast('Coordenadas GPS de terreno capturadas con éxito', { type: 'success' });
      },
      (err) => {
        toast(friendlyError(err, 'No se pudo obtener la posición GPS de campo'), {
          type: 'error',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleCreateSubmit = async () => {
    if (!formData.species || !formData.count) return;
    const count = parseInt(formData.count) || 0;
    try {
      const res = await apiFetch('/api/produccion/arboles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especie: formData.species,
          cantidad: count,
          regimen: formData.regimen,
          status: formData.status,
          campana: formData.campana || CAMPANA_CENSO_DEFAULT,
          parcela: formData.parcela || null,
          apiario_id: formData.apiario_id || null,
          dap_cm: formData.dap_cm ? parseFloat(formData.dap_cm) : null,
          altura_m: formData.altura_m ? parseFloat(formData.altura_m) : null,
          sector: formData.location || null,
          lat: formData.lat ? parseFloat(formData.lat) : null,
          lng: formData.lng ? parseFloat(formData.lng) : null,
          fecha: formData.date || undefined,
          notas: formData.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al registrar censo forestal');
      }
      const json = await res.json();
      if (json.data) {
        setRecords((prev) => [mapRowToTreeRecord(json.data as ArbolApiRow), ...prev]);
        toast('Censo forestal registrado con alometría verificada', { type: 'success' });
      }
      setShowCreateModal(false);
    } catch (err) {
      toast(friendlyError(err, 'Error al registrar censo forestal'), { type: 'error' });
    }
  };

  const handleEditClick = (r: TreeRecord) => {
    setEditingRecord(r);
    setEditFormData({
      species: r.species,
      count: String(r.count),
      regimen: r.regimen,
      status: r.status,
      campana: r.campana,
      apiario_id: r.apiario_id ?? '',
      parcela: r.parcela ?? '',
      location: r.location,
      dap_cm: r.dap_cm != null ? String(r.dap_cm) : '',
      altura_m: r.altura_m != null ? String(r.altura_m) : '',
      lat: r.lat != null ? String(r.lat) : '',
      lng: r.lng != null ? String(r.lng) : '',
      date: r.date,
      notes: r.notas ?? '',
    });
  };

  const handleUpdate = async () => {
    if (!editingRecord || !editFormData.species || !editFormData.count) return;
    const count = parseInt(editFormData.count) || 0;
    try {
      const res = await apiFetch(`/api/produccion/arboles/${editingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especie: editFormData.species,
          cantidad: count,
          regimen: editFormData.regimen,
          status: editFormData.status,
          campana: editFormData.campana || CAMPANA_CENSO_DEFAULT,
          parcela: editFormData.parcela || null,
          apiario_id: editFormData.apiario_id || null,
          dap_cm: editFormData.dap_cm ? parseFloat(editFormData.dap_cm) : null,
          altura_m: editFormData.altura_m ? parseFloat(editFormData.altura_m) : null,
          sector: editFormData.location || null,
          lat: editFormData.lat ? parseFloat(editFormData.lat) : null,
          lng: editFormData.lng ? parseFloat(editFormData.lng) : null,
          fecha: editFormData.date || undefined,
          notas: editFormData.notes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al actualizar registro de censo');
      }
      const json = await res.json();
      if (json.data) {
        setRecords((prev) =>
          prev.map((item) =>
            item.id === editingRecord.id ? mapRowToTreeRecord(json.data as ArbolApiRow) : item,
          ),
        );
        toast('Registro de censo actualizado exitosamente', { type: 'success' });
        setEditingRecord(null);
      }
    } catch (err) {
      toast(friendlyError(err, 'Error al actualizar censo forestal'), { type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      const res = await apiFetch(`/api/produccion/arboles/${recordToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al eliminar registro');
      }
      setRecords((prev) => prev.filter((item) => item.id !== recordToDelete.id));
      toast('Registro de censo eliminado exitosamente', { type: 'success' });
      setRecordToDelete(null);
    } catch (err) {
      toast(friendlyError(err, 'Error al eliminar censo'), { type: 'error' });
    }
  };

  const handlePublishSnapshot = async () => {
    setIsPublishing(true);
    try {
      const res = await apiFetch('/api/produccion/impacto/publicar', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Error al congelar snapshot oficial');
      }
      toast(
        `Snapshot biofísico v${IMPACTO_METODOLOGIA_VERSION} publicado exitosamente en la tienda abierta`,
        { type: 'success' },
      );
      setShowPublishModal(false);
    } catch (err) {
      toast(friendlyError(err, 'No se pudo publicar el balance de impacto'), { type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return <ViewLoading variant="view" label="Censo forestal biofísico" hideLabel />;
  }

  return (
    <div className="space-y-6 animate-in">
      <ViewShell
        eyebrow="Regeneración Biofísica & MRV"
        title="Censo Forestal y Captura de Carbono"
        subtitle={`${anosLegado} años de preservación y custodia en Chiloé. Centro de mando biofísico para el monitoreo alométrico árbol a árbol conectado en tiempo real con el Apiario Principal y la tienda pública.`}
      />

      {/* ── BANNER DE CAMPAÑA OFICIAL CENSO 2026–2027 ── */}
      <div className="rounded-2xl border border-primary/20 bg-card/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Campaña Oficial Censo 2026–2027
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                v{IMPACTO_METODOLOGIA_VERSION}
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Inventario biofísico de bosque nativo en el Predio Pureo y área de pecoreo del Apiario Principal.
              Alometría de bosque templado lluvioso: Ulmo, Tiaca, Melí, Tepú, Canelo y especies nodriza.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
              onClick={() => setShowPublishModal(true)}
              title="Congela el censo actual y publica el balance metodológico en la tienda abierta"
            >
              <UploadCloud size={14} />
              <span>Publicar en Tienda</span>
            </button>
            <button
              type="button"
              className="btn btn-gold btn-sm inline-flex items-center gap-1.5"
              onClick={() => {
                setFormData(INITIAL_FORM_DATA);
                setShowCreateModal(true);
              }}
            >
              <Plus size={14} />
              <span>Registrar censo forestal</span>
            </button>
          </div>
        </div>

        {/* Barra de progreso de la campaña */}
        <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Compass size={14} className="text-primary shrink-0" />
            <span>
              Progreso territorial:{' '}
              <strong className="text-foreground">{totalTrees.toLocaleString()}</strong> de{' '}
              {metaCenso.arbolesObjetivo.toLocaleString()} árboles ({metaProgresoPct}% meta 2026–2027)
            </span>
          </div>

          <div className="w-full sm:w-64 h-2 bg-surface-sunken rounded-full overflow-hidden border border-border/50">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Math.max(2, metaProgresoPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── CUADRÍCULA DE KPIS METODOLÓGICOS ── */}
      <div className="stats-grid">
        <div className="stat-card animate-in delay-1">
          <div className="stat-header">
            <div className="stat-icon"><TreePine size={20} /></div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-raised border border-border/40 text-muted-foreground">
              {treesPreservacion} en pie · {treesReforestacion} nuevos
            </span>
          </div>
          <div className="stat-value">{totalTrees.toLocaleString()}</div>
          <div className="stat-label">Árboles censados en predio</div>
        </div>

        <div className="stat-card animate-in delay-2">
          <div className="stat-header">
            <div className="stat-icon"><Leaf size={20} /></div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Stock Retenido
            </span>
          </div>
          <div className="stat-value">{totalCO2StockTon} ton</div>
          <div className="stat-label">CO₂e fijado en biomasa</div>
        </div>

        <div className="stat-card animate-in delay-3">
          <div className="stat-header">
            <div className="stat-icon"><Flower2 size={20} /></div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Sumidero activo
            </span>
          </div>
          <div className="stat-value">+{totalCO2AnualKg.toLocaleString()} kg/año</div>
          <div className="stat-label">Captura anual estimada</div>
        </div>

        <div className="stat-card animate-in delay-4">
          <div className="stat-header">
            <div className="stat-icon"><ShieldCheck size={20} /></div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {irrValue !== '—' && Number(irrValue) > 1 ? 'Neto Regenerativo' : 'En balance'}
            </span>
          </div>
          <div className="stat-value">{irrValue}</div>
          <div className="stat-label">IRR Territorial (Captura / Emisión)</div>
        </div>
      </div>

      {/* ── PANEL: RESPALDO BIOFÍSICO AL APIARIO PRINCIPAL ── */}
      <div className="rounded-2xl border border-border/60 bg-surface-raised/40 p-6 space-y-4 animate-in delay-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Layers size={15} />
              <span>Respaldo al Apiario Principal Pureo (Chiloé)</span>
            </div>
            <h3 className="font-display text-lg font-light text-foreground">
              Cobertura de Pecoreo y Suministro Floral Nativo
            </h3>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-3">
            <span>Radio de vuelo seguro: <strong className="text-foreground">2.5 km</strong></span>
            <span>·</span>
            <span>Especies activas: <strong className="text-foreground">{uniqueSpecies}</strong></span>
            <span>·</span>
            <span>Sectores: <strong className="text-foreground">{uniqueZones}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl border border-border/40 bg-card/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-primary font-semibold block">Ulmo estival</span>
            <p className="text-foreground font-medium">Néctar reina (Feb–Mar)</p>
            <p className="text-muted-foreground text-[11px]">
              Alimentación masiva de colmenas para producción de miel de origen.
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border/40 bg-card/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-primary font-semibold block">Tiaca ripiaria</span>
            <p className="text-foreground font-medium">Bálsamo tardío (Feb–Abr)</p>
            <p className="text-muted-foreground text-[11px]">
              Aporte de cierre de temporada y estructuración organoléptica.
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border/40 bg-card/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-primary font-semibold block">Tepú & Melí</span>
            <p className="text-foreground font-medium">Polen & Humedales</p>
            <p className="text-muted-foreground text-[11px]">
              Conductividad mineral insular y reservas polínicas de verano.
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border/40 bg-card/60 space-y-1">
            <span className="text-[10px] uppercase font-mono text-primary font-semibold block">Canelo & Avellano</span>
            <p className="text-foreground font-medium">Cría primaveral</p>
            <p className="text-muted-foreground text-[11px]">
              Proteínas esenciales para el despegue de la postura tras la invernada.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN CENTRAL: REGISTRO DE CENSO & PARCELAS ── */}
      <div className="card animate-in delay-3">
        <div className="section-header flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="section-title">Inventario Biofísico del Bosque</div>
            <div className="section-subtitle">
              Trazabilidad directa: Parcela censada ↔ Apiario ↔ Lote de miel
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative flex-1 sm:w-48 md:w-56">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar especie o parcela..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field w-full pl-8 py-1 text-xs"
              />
            </div>

            {/* Filtro Régimen */}
            <select
              value={filterRegimen}
              onChange={(e) => setFilterRegimen(e.target.value as 'todos' | RegimenInventario)}
              className="input-field py-1 text-xs"
            >
              <option value="todos">Todos los regímenes</option>
              <option value="preservacion">Preservación (En pie)</option>
              <option value="reforestacion">Reforestación (Nuevo)</option>
            </select>

            {/* Filtro Apiario */}
            {apiarios.length > 0 && (
              <select
                value={filterApiario}
                onChange={(e) => setFilterApiario(e.target.value)}
                className="input-field py-1 text-xs"
              >
                <option value="todos">Todos los apiarios</option>
                {apiarios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="colmena-list mt-4">
          {filteredRecords.length === 0 && (
            <div className="text-center py-12 px-4 text-muted-foreground">
              <div className="text-3xl mb-3 opacity-60">🌳</div>
              <p className="text-sm font-medium text-foreground mb-1">
                Sin registros coincidentes con los filtros
              </p>
              <p className="text-xs">
                Registra un nuevo individuo o parcela censal para documentar la huella biofísica.
              </p>
            </div>
          )}

          {displayedRecords.map((r) => {
            const espMeta = ESPECIES_ALOMETRIA_CHILOE[normalizarClaveEspecie(r.species)];
            return (
              <div key={r.id} className="colmena-item" style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-sm)',
                    background:
                      r.regimen === 'preservacion'
                        ? 'hsl(var(--primary) / 0.12)'
                        : 'hsl(var(--success) / 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0,
                  }}
                >
                  🌳
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {r.species}
                    </span>
                    {espMeta && (
                      <span className="text-[11px] italic text-muted-foreground hidden sm:inline">
                        ({espMeta.nombreCientifico})
                      </span>
                    )}
                    <span className="text-xs text-primary font-medium">
                      × {r.count.toLocaleString()} {r.count === 1 ? 'árbol' : 'árboles'}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{r.location || 'Predio Pureo'}</span>
                    {r.parcela && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[11px] text-foreground/80">{r.parcela}</span>
                      </>
                    )}
                    {r.apiario_nombre && (
                      <>
                        <span>·</span>
                        <span className="text-primary font-medium">{r.apiario_nombre}</span>
                      </>
                    )}
                    {r.date && (
                      <>
                        <span>·</span>
                        <span>{r.date}</span>
                      </>
                    )}
                    {r.dap_cm && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-[11px]">DAP ~{r.dap_cm} cm</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={cn(
                          'badge text-[10px] px-2 py-0.5',
                          r.regimen === 'preservacion'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        )}
                      >
                        {r.regimen === 'preservacion' ? 'Preservación' : 'Reforestación'}
                      </span>
                      <span className="badge badge-gold text-[10px] px-2 py-0.5 uppercase">
                        {FACTORES_ESTADIO[r.status]?.label ?? r.status}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-400 font-mono mt-1">
                      🌿 {r.co2} t stock · +{r.co2_anual_kg} kg/año
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleEditClick(r)}
                      aria-label="Editar censo"
                      title="Editar"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--muted-foreground))',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 44,
                        minHeight: 44,
                        padding: 0,
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(r)}
                      aria-label="Eliminar censo"
                      title="Eliminar"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--destructive))',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 44,
                        minHeight: 44,
                        padding: 0,
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRecords.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Ver menos' : `Ver todos (${filteredRecords.length} registros)`}{' '}
              <ChevronDown
                size={14}
                style={{
                  transform: showAll ? 'rotate(180deg)' : 'none',
                  transition: 'transform 200ms',
                }}
              />
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL: REGISTRAR CENSO FORESTAL (3 PASOS) ── */}
      <ImmersiveModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        eyebrow="Inventario Biofísico"
        title="Registrar Censo Forestal y Alometría 2026–2027"
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateSubmit}>
              Guardar censo biofísico
            </button>
          </>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Bloque 1: Régimen y Vinculación */}
          <div className="p-3.5 rounded-xl border border-border/50 bg-surface-raised space-y-3">
            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block">
              1. Régimen de Inventario y Vinculación Apícola
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="micro-label block mb-1">Régimen</label>
                <select
                  value={formData.regimen}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      regimen: e.target.value as RegimenInventario,
                    }))
                  }
                  className="input-field w-full"
                >
                  <option value="preservacion">Preservación (Bosque en pie)</option>
                  <option value="reforestacion">Reforestación (Enriquecimiento)</option>
                </select>
              </div>

              <div>
                <label className="micro-label block mb-1">Apiario Asociado</label>
                <select
                  value={formData.apiario_id}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const match = apiarios.find((a) => a.id === selId);
                    setFormData((prev) => ({
                      ...prev,
                      apiario_id: selId,
                      lat: match?.lat ? String(match.lat) : prev.lat,
                      lng: match?.lng ? String(match.lng) : prev.lng,
                    }));
                  }}
                  className="input-field w-full"
                >
                  {apiarios.length === 0 ? (
                    <option value="">Apiario Principal Pureo</option>
                  ) : (
                    apiarios.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="micro-label block mb-1">Campaña Territorial</label>
                <input
                  type="text"
                  value={formData.campana}
                  onChange={(e) => setFormData((prev) => ({ ...prev, campana: e.target.value }))}
                  className="input-field w-full"
                  placeholder="2026-2027"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Botánica y Dendrometría */}
          <div className="p-3.5 rounded-xl border border-border/50 bg-surface-raised space-y-3">
            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block">
              2. Identificación Botánica y Alometría
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="micro-label block mb-1">Especie Nativa</label>
                <input
                  type="text"
                  placeholder="Ej: Ulmo, Tiaca, Melí, Tepú..."
                  value={formData.species}
                  onChange={(e) => setFormData((prev) => ({ ...prev, species: e.target.value }))}
                  className="input-field w-full"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['Ulmo', 'Tiaca', 'Melí', 'Tepú', 'Canelo', 'Avellano', 'Coigüe', 'Arrayán'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, species: s }))}
                      className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 bg-foreground/[0.02] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="micro-label block mb-1">Cantidad de Árboles</label>
                <input
                  type="number"
                  placeholder="Número de individuos"
                  value={formData.count}
                  onChange={(e) => setFormData((prev) => ({ ...prev, count: e.target.value }))}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="micro-label block mb-1">Estadio de Desarrollo / Madurez</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as EstadioCrecimiento,
                    }))
                  }
                  className="input-field w-full"
                >
                  <option value="plantula">Plántula / Vivero (DAP &lt; 5 cm)</option>
                  <option value="joven">Juvenil Establecido (DAP 5–15 cm)</option>
                  <option value="creciendo">Fustal en Crecimiento (DAP 15–30 cm)</option>
                  <option value="adulto">Adulto en Dosel (DAP 30–60 cm)</option>
                  <option value="monumental">Monumental / Veterano (DAP ≥ 60 cm)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="micro-label block mb-1">DAP medio (cm)</label>
                  <input
                    type="number"
                    placeholder="Ej: 45"
                    value={formData.dap_cm}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dap_cm: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="micro-label block mb-1">Altura est. (m)</label>
                  <input
                    type="number"
                    placeholder="Ej: 22"
                    value={formData.altura_m}
                    onChange={(e) => setFormData((prev) => ({ ...prev, altura_m: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>

            {/* Preview Alométrico en Vivo */}
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px] text-primary">
                <span>Stock Retenido: ~{livePreview.stockCo2Ton} tCO₂e</span>
                <span>Fijación Anual: ~{livePreview.capturaAnualKg} kg/año</span>
              </div>
              {livePreview.especieResuelta && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  🌿 <strong>{livePreview.especieResuelta.nombreComun}</strong>:{' '}
                  {livePreview.especieResuelta.funcionApicola} ({livePreview.especieResuelta.mesesFloracion})
                </p>
              )}
            </div>
          </div>

          {/* Bloque 3: Ubicación y Parcela */}
          <div className="p-3.5 rounded-xl border border-border/50 bg-surface-raised space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                3. Parcela Territorial y Coordenadas
              </span>
              <button
                type="button"
                onClick={() => captureGps('create')}
                className="text-[10px] text-primary hover:underline flex items-center gap-1"
              >
                <Compass size={12} />
                Capturar GPS actual
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="micro-label block mb-1">Sector o Predio</label>
                <input
                  type="text"
                  placeholder="Pureo Rural km 8560"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="micro-label block mb-1">Parcela Interna</label>
                <input
                  type="text"
                  placeholder="Ej: Parcela Ladera Pureo, Ribera Norte..."
                  value={formData.parcela}
                  onChange={(e) => setFormData((prev) => ({ ...prev, parcela: e.target.value }))}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="micro-label block mb-1">Latitud</label>
                  <input
                    type="text"
                    placeholder="-42.612450"
                    value={formData.lat}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lat: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="micro-label block mb-1">Longitud</label>
                  <input
                    type="text"
                    placeholder="-73.654320"
                    value={formData.lng}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lng: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div>
                <label className="micro-label block mb-1">Fecha de Medición</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div>
              <label className="micro-label block mb-1">Bitácora / Notas Cualitativas</label>
              <input
                type="text"
                placeholder="Observaciones de campo, vigor fitosanitario..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>
        </div>
      </ImmersiveModal>

      {/* ── MODAL: EDITAR CENSO FORESTAL ── */}
      <ImmersiveModal
        open={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        eyebrow="Edición de Censo"
        title={`Editar censo: ${editingRecord?.species}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditingRecord(null)}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleUpdate}>
              Guardar cambios
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="micro-label block mb-1">Régimen</label>
              <select
                value={editFormData.regimen}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    regimen: e.target.value as RegimenInventario,
                  }))
                }
                className="input-field w-full"
              >
                <option value="preservacion">Preservación (En pie)</option>
                <option value="reforestacion">Reforestación (Nuevo)</option>
              </select>
            </div>
            <div>
              <label className="micro-label block mb-1">Especie</label>
              <input
                type="text"
                value={editFormData.species}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, species: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="micro-label block mb-1">Cantidad</label>
              <input
                type="number"
                value={editFormData.count}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, count: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="micro-label block mb-1">Estadio</label>
              <select
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    status: e.target.value as EstadioCrecimiento,
                  }))
                }
                className="input-field w-full"
              >
                <option value="plantula">Plántula</option>
                <option value="joven">Juvenil</option>
                <option value="creciendo">Fustal</option>
                <option value="adulto">Adulto</option>
                <option value="monumental">Monumental</option>
              </select>
            </div>
            <div>
              <label className="micro-label block mb-1">DAP medio (cm)</label>
              <input
                type="number"
                value={editFormData.dap_cm}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, dap_cm: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="micro-label block mb-1">Altura (m)</label>
              <input
                type="number"
                value={editFormData.altura_m}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, altura_m: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="micro-label block mb-1">Parcela</label>
              <input
                type="text"
                value={editFormData.parcela}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, parcela: e.target.value }))}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="micro-label block mb-1">Sector / Predio</label>
              <input
                type="text"
                value={editFormData.location}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs space-y-1">
            <span className="font-mono text-primary">
              Cálculo Alométrico Actualizado: ~{liveEditPreview.stockCo2Ton} tCO₂e stock · +
              {liveEditPreview.capturaAnualKg} kg/año
            </span>
          </div>
        </div>
      </ImmersiveModal>

      {/* ── MODAL: CONFIRMAR PUBLICACIÓN DE SNAPSHOT EN TIENDA ── */}
      <ImmersiveModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        eyebrow="Congelación y Publicación"
        title="Publicar Balance de Impacto en Tienda Abierta"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowPublishModal(false)}
              disabled={isPublishing}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePublishSnapshot}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publicando...' : 'Confirmar y Publicar en Tienda'}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-muted-foreground">
          <p>
            Esta acción consolidará los datos vivos de <strong className="text-foreground">{totalTrees.toLocaleString()} árboles censados</strong> y{' '}
            <strong className="text-foreground">{totalCO2StockTon} ton CO₂e</strong> bajo la metodología oficial{' '}
            <strong className="text-primary font-mono">v{IMPACTO_METODOLOGIA_VERSION}</strong>.
          </p>
          <div className="p-3 rounded-xl border border-border/60 bg-surface-sunken space-y-1.5 font-mono text-[11px]">
            <div>· Campaña: {CAMPANA_CENSO_DEFAULT} (Apiario Principal Pureo)</div>
            <div>· Especies nativas representadas: {uniqueSpecies}</div>
            <div>· Parcela y zonas cubiertas: {uniqueZones}</div>
            <div>· IRR resultante: {irrValue}</div>
          </div>
          <p>
            El nuevo balance se reflejará de inmediato en la sección de Ciencia y en el catálogo público de la tienda.
          </p>
        </div>
      </ImmersiveModal>

      {/* ── MODAL: ELIMINAR REGISTRO ── */}
      <ImmersiveModal
        open={Boolean(recordToDelete)}
        onClose={() => setRecordToDelete(null)}
        eyebrow="Eliminación"
        title="Eliminar registro de censo forestal"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setRecordToDelete(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-destructive btn-sm"
              onClick={confirmDelete}
            >
              Eliminar definitivamente
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          ¿Seguro que deseas eliminar el registro de{' '}
          <strong className="text-foreground">{recordToDelete?.species}</strong> (
          {recordToDelete?.count} árboles en {recordToDelete?.location})? Esta acción no se puede
          deshacer.
        </p>
      </ImmersiveModal>

      {/* ── FOOTER: BALANCE Y HUELLA TERRITORIAL ── */}
      <div
        className="card animate-in delay-3"
        style={{
          marginTop: 'var(--space-lg)',
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
          color: 'hsl(var(--primary-foreground))',
          border: 'none',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-existencial)',
            fontSize: '1.1rem',
            color: 'hsl(var(--accent))',
            marginBottom: 'var(--space-md)',
          }}
        >
          Balance de Huella y Presencia Territorial
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-lg)',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--accent))' }}>
              {totalTrees.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>Árboles vivos censados</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'hsl(var(--success))' }}>
              {totalCO2StockTon}
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>Toneladas CO₂e stock</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{anosLegado}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>Años de legado activo</div>
          </div>
        </div>
      </div>
    </div>
  );
}
