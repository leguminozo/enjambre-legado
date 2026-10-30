'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { RepTierBadge, RepTierProgressBar, useTierProgress } from '@/components/pos/tier-badge';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  FileText,
  Download,
  Upload,
  Copy,
  Check,
  Info,
  Calculator,
  ShieldCheck,
  ChevronDown,
  ExternalLink,
  KeyRound,
} from 'lucide-react';
import { useClientViewLoading, Skeleton, SkeletonKpi, SkeletonTable, formatCLP, friendlyError } from '@enjambre/ui';
import { ViewShell } from '@/components/layout/ViewShell';
import { getNucleoApiUrl } from '@/lib/public-urls';
import { createClient } from '@/utils/supabase/client';

export interface BankDetails {
  banco: string;
  tipo_cuenta: 'vista_cuentarut' | 'corriente' | 'ahorro';
  numero_cuenta: string;
  rut: string;
  titular: string;
}

const CHILEAN_BANKS = [
  'BancoEstado (CuentaRUT / Chequera)',
  'Banco de Chile / Edwards',
  'Banco Santander Chile',
  'BCI (Banco de Crédito e Inversiones)',
  'Scotiabank Chile',
  'Itaú Corpbanca',
  'Banco Falabella',
  'Banco BICE',
  'Banco Security',
  'Banco Consorcio',
  'Tenpo Prepago',
  'Mach (BCI)',
  'Coopeuch',
];

type DailyEntry = { date: string; revenue: number; commissions: number; sales: number };
type SessionEntry = { id: string; opened_at: string; closed_at: string | null; opening_cash: number; session_status: string; cash_difference: number | null };
type CommissionEntry = { id: string; total_commission: number; base_commission: number; volume_multiplier: number; loyalty_bonus: number; streak_bonus: number; tier_multiplier: number; channel_rate: number | null; paid: boolean; created_at: string };

interface HistoryData {
  profile: {
    total_commissions_earned: number; total_commissions_paid: number; total_sales_lifetime: number;
    total_revenue_lifetime: number; clients_captured: number; current_streak_days: number;
    best_streak_days: number; commission_tier: string;
    bank_details?: BankDetails | null;
  } | null;
  sessions: SessionEntry[];
  commissions: CommissionEntry[];
  summary: { total_earned: number; total_pending: number; session_count: number };
  daily: DailyEntry[];
}

export type HistorialTab = 'overview' | 'commissions' | 'sessions' | 'contrato' | 'leaderboard' | 'datos_pago';

export interface HistorialPageProps {
  defaultTab?: HistorialTab;
}

export default function HistorialPage({ defaultTab = 'overview' }: HistorialPageProps = {}) {
  const { tierProgress } = useTierProgress();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [tab, setTab] = useState<HistorialTab>(defaultTab);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab') as HistorialTab | null;
      if (urlTab && ['overview', 'commissions', 'sessions', 'contrato', 'leaderboard', 'datos_pago'].includes(urlTab)) {
        setTab(urlTab);
      }
    }
  }, []);
  const [bankForm, setBankForm] = useState<BankDetails>({
    banco: CHILEAN_BANKS[0],
    tipo_cuenta: 'vista_cuentarut',
    numero_cuenta: '',
    rut: '',
    titular: '',
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankMsg, setBankMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Parámetros tributarios de Boletas de Honorarios (Ley 21.133 / Año 2026: 15,25%)
  const TASA_RETENCION_2026 = 0.1525;
  const [simLiquido, setSimLiquido] = useState<number>(100000);
  const [simBruto, setSimBruto] = useState<number>(Math.round(100000 / (1 - TASA_RETENCION_2026)));
  const [copiedFiscal, setCopiedFiscal] = useState(false);
  const [showTaxExplainer, setShowTaxExplainer] = useState(false);

  // Estado y lógica para gestión documental de contratos del agente comercial
  const [contrato, setContrato] = useState<{
    id: string;
    estado: string;
    tipo: string;
    documento_plantilla_url?: string | null;
    documento_firmado_url?: string | null;
    documento_firmado_at?: string | null;
    documento_version?: string | null;
    comision_base_pct?: number | null;
    bono_puntualidad_clp?: number | null;
    acepto_terminos_at?: string | null;
    acepto_terminos_version?: string | null;
  } | null>(null);
  const [loadingContrato, setLoadingContrato] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [acceptingContract, setAcceptingContract] = useState(false);
  const [declaraSegundaCategoria, setDeclaraSegundaCategoria] = useState(false);
  const [aceptaTerminosContrato, setAceptaTerminosContrato] = useState(false);
  const [contractMsg, setContractMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado para declaración de Boleta de Honorarios Electrónica (sii.cl)
  const [folioBhe, setFolioBhe] = useState('');
  const [montoBhe, setMontoBhe] = useState('');
  const [savingBhe, setSavingBhe] = useState(false);
  const [bheMsg, setBheMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchContrato = useCallback(async () => {
    try {
      setLoadingContrato(true);
      const authSession = useAuthStore.getState().session;
      if (authSession) {
        try {
          const API_BASE = getNucleoApiUrl();
          const res = await fetch(`${API_BASE}/api/rep-ventas/contrato`, {
            headers: { Authorization: `Bearer ${authSession.access_token}` },
          });
          if (res.ok) {
            const json = await res.json();
            if (json.data) {
              setContrato(json.data);
              return;
            }
          }
        } catch {
          // fallback to direct supabase
        }
      }

      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: cData, error } = await supabase
        .from('participante_contrato')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && cData) {
        setContrato(cData);
      }
    } catch (err) {
      console.error('[Historial] error loading contract:', err);
    } finally {
      setLoadingContrato(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'contrato') {
      void fetchContrato();
    }
  }, [tab, fetchContrato]);

  const handleSimLiquidoChange = (val: number) => {
    const num = Math.max(0, val);
    setSimLiquido(num);
    setSimBruto(num > 0 ? Math.round(num / (1 - TASA_RETENCION_2026)) : 0);
  };

  const handleSimBrutoChange = (val: number) => {
    const num = Math.max(0, val);
    setSimBruto(num);
    setSimLiquido(num > 0 ? Math.round(num * (1 - TASA_RETENCION_2026)) : 0);
  };

  const copyDatosFiscales = async () => {
    const texto = [
      'RUT Empresa: 77.891.234-5',
      'Razón Social: Enjambre Legado SpA',
      'Giro: Comercialización y representación independiente de productos apícolas de bosque nativo',
      'Dirección: Castro, Chiloé, Región de Los Lagos',
      'Modalidad de Boleta en sii.cl: El receptor retendrá el impuesto (15,25% conforme a Ley 21.133)',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(texto);
      setCopiedFiscal(true);
      setTimeout(() => setCopiedFiscal(false), 3000);
    } catch (err) {
      console.error('Error al copiar datos fiscales', err);
    }
  };

  const handleDownloadTemplate = async () => {
    if (contrato?.documento_plantilla_url) {
      try {
        const supabase = createClient();
        if (!supabase) return;
        const { data: templateData, error } = await supabase.storage
          .from('contratos_socios')
          .createSignedUrl(contrato.documento_plantilla_url, 3600);
        if (!error && templateData?.signedUrl) {
          window.open(templateData.signedUrl, '_blank');
          return;
        }
      } catch (err) {
        console.error('Error al generar URL de plantilla:', err);
      }
    }
    const textoPlantilla = [
      'CONTRATO DE PRESTACIÓN DE SERVICIOS INDEPENDIENTES Y CONSIGNACIÓN MERCANTIL',
      '=========================================================================',
      '',
      'Entre ENJAMBRE LEGADO SpA, RUT 77.891.234-5, en adelante "La Empresa", y el',
      'Agente Comercial Independiente debidamente registrado en la plataforma Campo, en adelante',
      '"El Agente Comercial", se conviene el siguiente contrato de servicios mercantiles:',
      '',
      'PRIMERO: NATURALEZA DEL VÍNCULO MERCANTIL',
      'Las partes declaran expresamente que el presente contrato se rige íntegramente por las',
      'normas del Código de Comercio (Arts. 233 y siguientes sobre Comisión y Consignación Mercantil)',
      'y supletoriamente por el Código Civil. El Agente Comercial actúa como comerciante y operador',
      'independiente, en su propio nombre, cuenta y riesgo.',
      '',
      'SEGUNDO: NO SUBORDINACIÓN Y AUTONOMÍA OPERATIVA',
      'Queda expresamente estipulado que entre las partes no existe relación de subordinación ni',
      'dependencia laboral en los términos de los Artículos 7° y 8° del Código del Trabajo. El Agente',
      'Comercial goza de total libertad en la gestión de su tiempo, ausencia de jornada laboral,',
      'inexistencia de control de asistencia personal o reloj control, conforme a la doctrina',
      'asentada por la Excma. Corte Suprema (Rol N° 20.995-2026). Las herramientas y guías de cata',
      'provistas en la aplicación tienen carácter puramente orientativo y de libre adopción.',
      '',
      'TERCERO: AUTONOMÍA DE MEDIOS Y NO EXCLUSIVIDAD',
      'El Agente Comercial ejecuta su actividad con medios propios (vehículo, indumentaria, insumos),',
      'pudiendo contar con dependientes contratados bajo su exclusiva responsabilidad. Asimismo,',
      'cuenta con plena libertad para comercializar o representar otras marcas o productos.',
      '',
      'CUARTO: COMPENSACIÓN EXCLUSIVAMENTE POR RESULTADO',
      'La retribución del Agente Comercial corresponde exclusivamente a comisiones devengadas por',
      'ventas mercantiles efectivas y bonos logísticos objetivos de evento ferial (disponibilidad de stand',
      'y cumplimiento de metas por tramos de volumen). No existe sueldo base ni estipendio fijo.',
      '',
      'QUINTO: RÉGIMEN TRIBUTARIO Y BOLETAS DE HONORARIOS (F29)',
      'El Agente Comercial tributa bajo las normas de Segunda Categoría de la Ley sobre Impuesto',
      'a la Renta (Art. 42 N° 2). Emitirá Boleta de Honorarios Electrónica en el sitio del SII',
      'sujeta a la retención legal obligatoria vigente (15,25% para el año calendario 2026). Dicha retención',
      'será enterada al Fisco por La Empresa en el Formulario 29 mensual. Las cotizaciones de seguridad',
      'social se rigen anualmente de forma personal en la Operación Renta conforme a la Ley N° 21.133.',
      '',
      'SEXTO: INVENTARIO EN CONSIGNACIÓN MERCANTIL (Art. 233 CdC)',
      'Los productos entregados para su distribución ferial se entregan a título de Consignación',
      'Mercantil. La propiedad y dominio legal de las mercaderías permanece en todo momento en La Empresa',
      'hasta su enajenación final al consumidor. Conforme al Art. 245 del Código de Comercio, El Agente',
      'Comercial asume el resguardo material y diligencia de buen padre de familia sobre el stock recibido.',
      '',
      'SÉPTIMO: TRASLADO DE MERCADERÍAS Y GUÍAS DE DESPACHO (Art. 55 Ley IVA)',
      'Todo movimiento de stock entre centros de acopio y eventos feriales se encontrará amparado por',
      'una Guía de Despacho Electrónica (DTE 52) emitida por La Empresa con el motivo "Traslado no constituye',
      'venta (Consignación)". El Agente Comercial deberá portar la acreditación digital en ruta.',
      '',
      'OCTAVO: MERMAS, ROTURAS Y DEGUSTACIONES PROMOCIONALES',
      'Para evitar presunciones tributarias de venta no justificada (Art. 8° letra d de la Ley de IVA),',
      'El Agente Comercial deberá registrar oportunamente en la plataforma cualquier merma fortuita por',
      'rotura de envase o frascos abiertos para degustación autorizada de clientes en feria.',
      '',
      'NOVENO: RENDICIÓN DE CUENTAS Y CONCILIACIÓN FERIAL',
      'Al cierre de cada jornada o ciclo ferial, se efectuará la conciliación obligatoria entre el inventario',
      'consignado, las ventas registradas en el POS y el stock físico remanente, procediendo a la restitución',
      'inmediata de los productos no vendidos a los almacenes oficiales.',
      '',
      'DÉCIMO: PROTECCIÓN DE DATOS PERSONALES (Ley N° 21.719)',
      'El Agente Comercial se obliga a resguardar la estricta confidencialidad de los datos personales y de',
      'contacto de clientes capturados en el POS ferial, utilizándolos única y exclusivamente para la emisión',
      'del comprobante digital y pasaporte de origen, quedando prohibida su divulgación o uso propio.',
      '',
      'Fecha de Versión Documental: ' + (contrato?.documento_version || '2026-v1'),
      'ENJAMBRE LEGADO SpA — Protocolo de Blindaje Biocultural y Territorial',
    ].join('\n');

    const blob = new Blob([textoPlantilla], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Terminos_Contrato_Servicios_Independientes_${contrato?.documento_version || '2026-v1'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSignedContract = async () => {
    if (!contrato?.documento_firmado_url) return;
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data: signedData, error } = await supabase.storage
        .from('contratos_socios')
        .createSignedUrl(contrato.documento_firmado_url, 3600);
      if (error) throw error;
      if (signedData?.signedUrl) {
        window.open(signedData.signedUrl, '_blank');
      }
    } catch (err) {
      setContractMsg({ type: 'error', text: friendlyError(err, 'Error al abrir contrato firmado') });
    }
  };

  const handleUploadSignedContract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setContractMsg({ type: 'error', text: 'El archivo supera el límite de 10 MB permitido.' });
      return;
    }

    try {
      setUploadingContract(true);
      setContractMsg(null);
      const supabase = createClient();
      if (!supabase) throw new Error('Cliente Supabase no inicializado');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesión de usuario no encontrada');

      const ext = file.name.split('.').pop() || 'pdf';
      const storagePath = `${user.id}/contrato_firmado_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('contratos_socios')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const authSession = useAuthStore.getState().session;
      if (authSession) {
        try {
          const API_BASE = getNucleoApiUrl();
          await fetch(`${API_BASE}/api/rep-ventas/contrato/attach-signed`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authSession.access_token}`,
            },
            body: JSON.stringify({ storage_path: storagePath }),
          });
        } catch {
          if (contrato?.id) {
            await supabase
              .from('participante_contrato')
              .update({
                documento_firmado_url: storagePath,
                documento_firmado_at: new Date().toISOString(),
              })
              .eq('id', contrato.id);
          }
        }
      } else if (contrato?.id) {
        await supabase
          .from('participante_contrato')
          .update({
            documento_firmado_url: storagePath,
            documento_firmado_at: new Date().toISOString(),
          })
          .eq('id', contrato.id);
      }

      setContractMsg({
        type: 'success',
        text: 'Documento contractual firmado y subido correctamente. Tu documento queda respaldado y en revisión por administración.',
      });
      void fetchContrato();
    } catch (err) {
      setContractMsg({ type: 'error', text: friendlyError(err, 'Error al subir contrato firmado') });
    } finally {
      setUploadingContract(false);
    }
  };

  const handleAcceptContractTerms = async () => {
    if (!declaraSegundaCategoria || !aceptaTerminosContrato) return;
    try {
      setAcceptingContract(true);
      setContractMsg(null);
      const authSession = useAuthStore.getState().session;
      if (!authSession) throw new Error('No hay sesión activa');

      const API_BASE = getNucleoApiUrl();
      const res = await fetch(`${API_BASE}/api/rep-ventas/contrato/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          version: contrato?.documento_version || '2026-v1',
          declaracion_segunda_categoria: true,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al registrar aceptación contractual');
      }

      setContractMsg({
        type: 'success',
        text: '¡Términos y condiciones aceptados electrónicamente con éxito! Tu contrato mercantil se encuentra activo y vigente.',
      });
      void fetchContrato();
    } catch (err) {
      setContractMsg({
        type: 'error',
        text: friendlyError(err, 'Error al aceptar términos del contrato'),
      });
    } finally {
      setAcceptingContract(false);
    }
  };

  const handleDeclareBhe = async () => {
    const folioNum = parseInt(folioBhe, 10);
    if (!folioNum || isNaN(folioNum) || folioNum <= 0) {
      setBheMsg({ type: 'error', text: 'Ingresa un número de folio de BHE válido.' });
      return;
    }

    try {
      setSavingBhe(true);
      setBheMsg(null);
      const authSession = useAuthStore.getState().session;
      if (!authSession) throw new Error('No hay sesión activa');

      const API_BASE = getNucleoApiUrl();
      const res = await fetch(`${API_BASE}/api/rep-ventas/bhe-declare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({
          folio_bhe: folioNum,
          monto_bruto:
            Number(montoBhe) ||
            (data?.summary?.total_pending ? Math.abs(data.summary.total_pending) : 0),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al declarar Boleta de Honorarios');
      }

      setBheMsg({
        type: 'success',
        text: `¡Boleta de Honorarios Folio N° ${folioNum} declarada exitosamente! Administración conciliará tu liquidación.`,
      });
      setFolioBhe('');
      setMontoBhe('');
    } catch (err) {
      setBheMsg({
        type: 'error',
        text: friendlyError(err, 'Error al declarar Boleta de Honorarios'),
      });
    } finally {
      setSavingBhe(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      const authSession = useAuthStore.getState().session;
      if (!authSession) return;

      const API_BASE = getNucleoApiUrl();
      const res = await fetch(`${API_BASE}/api/rep-ventas/history?range=${range}`, {
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('[Historial] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    if (data?.profile?.bank_details) {
      setBankForm(data.profile.bank_details);
    }
  }, [data?.profile?.bank_details]);

  const saveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setBankMsg(null);
    try {
      const authSession = useAuthStore.getState().session;
      if (!authSession) throw new Error('No hay sesión activa');

      const API_BASE = getNucleoApiUrl();
      const res = await fetch(`${API_BASE}/api/rep-ventas/bank-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify(bankForm),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al guardar datos bancarios');
      }

      setBankMsg({ type: 'success', text: '¡Datos bancarios guardados con éxito!' });
      setData((prev) =>
        prev && prev.profile
          ? {
              ...prev,
              profile: { ...prev.profile, bank_details: bankForm },
            }
          : prev,
      );
    } catch (err) {
      setBankMsg({
        type: 'error',
        text: friendlyError(err, 'Error al guardar datos bancarios'),
      });
    } finally {
      setSavingBank(false);
    }
  };

  const showLoading = useClientViewLoading(loading);

  if (showLoading) {
    return (
      <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando historial">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-48 h-7" />
          <Skeleton variant="text" className="w-72 max-w-full h-3.5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
        <SkeletonTable rows={6} columns={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">No se pudo cargar el historial.</p>
      </div>
    );
  }

  const profile = data.profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <ViewShell
          variant="compact"
          eyebrow="POS"
          title="Historial"
          subtitle="Comisiones, ventas y rendimiento"
          className="!mb-0"
        />
        <div className="flex gap-2 shrink-0">
          {(['week', 'month', 'quarter'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r);
                setLoading(true);
              }}
              className={`min-h-11 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
                range === r
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'week' ? '7d' : r === 'month' ? '30d' : '90d'}
            </button>
          ))}
        </div>
      </div>

{profile && (
  <>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="card-glow p-4 text-center">
        <DollarSign className="w-4 h-4 text-primary mx-auto mb-2" />
        <p className="text-lg font-bold text-primary">{formatCLP(Math.abs(data.summary.total_pending))}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Pendiente</p>
      </div>
      <div className="card-glow p-4 text-center">
        <TrendingUp className="w-4 h-4 text-success mx-auto mb-2" />
        <p className="text-lg font-bold text-foreground">{formatCLP(Math.abs(Number(profile.total_revenue_lifetime)))}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Lifetime</p>
      </div>
      <div className="card-glow p-4 text-center">
        <Zap className="w-4 h-4 text-warning mx-auto mb-2" />
        <p className="text-lg font-bold text-foreground">{profile.current_streak_days}d</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Racha</p>
      </div>
      <div className="card-glow p-4 text-center">
        <RepTierBadge tier={profile.commission_tier} />
        <p className="text-lg font-bold text-foreground mt-2">{profile.total_sales_lifetime}</p>
        <p className="text-[9px] uppercase text-muted-foreground tracking-widest">Ventas</p>
      </div>
    </div>
    {tierProgress && <RepTierProgressBar progress={tierProgress} />}
  </>
)}

      <div className="flex flex-wrap gap-2">
        {(['overview', 'commissions', 'sessions', 'contrato', 'leaderboard', 'datos_pago'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-11 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'overview'
              ? 'Curva'
              : t === 'commissions'
              ? 'Comisiones'
              : t === 'sessions'
              ? 'Sesiones'
              : t === 'contrato'
              ? 'Mi Contrato'
              : t === 'leaderboard'
              ? 'Ranking'
              : 'Datos Bancarios'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card-glow p-5 space-y-4">
          <h3 className="text-xs text-muted-foreground uppercase tracking-widest">Curva de volumen diario</h3>
          {data.daily.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin datos en este período.</p>
          ) : (
            <div className="space-y-2">
              {data.daily.map(d => {
                const maxComms = Math.max(...data.daily.map(x => x.commissions), 1);
                const widthPct = (d.commissions / maxComms) * 100;
                return (
                  <div key={d.date} className="flex items-center gap-3">
      <span className="text-[10px] text-muted-foreground w-16 shrink-0">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
      <div className="flex-1 h-6 bg-card rounded-lg overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-primary/40 to-primary rounded-lg transition-all" style={{ width: `${widthPct}%` }} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-foreground font-bold">
          {formatCLP(Math.abs(d.commissions))}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground w-8 text-right">{d.sales}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'commissions' && (() => {
        const totalBrutoPendiente = data.commissions
          .filter(c => !c.paid)
          .reduce((acc, c) => acc + Math.abs(Number(c.total_commission)), 0);
        const retencionEstimada = Math.round(totalBrutoPendiente * TASA_RETENCION_2026);
        const liquidoEstimado = totalBrutoPendiente - retencionEstimada;

        return (
          <div className="space-y-4">
            {/* Tarjeta de Liquidación y Retención Legal */}
            <div className="card-glow p-5 space-y-4 border border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    Resumen de Liquidación — Período en Curso
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Cálculo conforme a la Ley 21.133 (Tasa legal de retención 2026: 15,25%)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyDatosFiscales}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised/80 border border-border/50 text-[11px] font-medium text-foreground transition-colors self-start sm:self-auto"
                >
                  {copiedFiscal ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-success" />
                      <span className="text-success">Datos copiados</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-primary" />
                      <span>Copiar datos para sii.cl</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-surface-sunken border border-border/30">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                    Comisiones Brutas Acumuladas
                  </span>
                  <p className="text-lg font-bold text-foreground font-mono">
                    {formatCLP(totalBrutoPendiente)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">Base bruta pendiente</span>
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <span className="text-[10px] uppercase tracking-wider text-destructive block mb-1">
                    Retención Anticipo Renta (15,25%)
                  </span>
                  <p className="text-lg font-bold text-destructive font-mono">
                    -{formatCLP(retencionEstimada)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">Enterado en F29 (Línea 61, Cód 151)</span>
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <span className="text-[10px] uppercase tracking-wider text-success block mb-1">
                    Monto Líquido a Transferir
                  </span>
                  <p className="text-lg font-bold text-success font-mono">
                    {formatCLP(liquidoEstimado)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">Abono directo a tu cuenta bancaria</span>
                </div>
              </div>

              {/* Explicativo tributario desplegable */}
              <div className="rounded-lg bg-surface-raised/50 border border-border/40 p-3.5 text-xs text-muted-foreground space-y-2">
                <button
                  type="button"
                  onClick={() => setShowTaxExplainer(!showTaxExplainer)}
                  className="w-full flex items-center justify-between text-left font-medium text-foreground hover:text-primary transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    ¿Cómo funciona tu retención tributaria y previsional?
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showTaxExplainer ? 'rotate-180' : ''}`} />
                </button>

                {showTaxExplainer && (
                  <div className="pt-2 text-[11px] leading-relaxed border-t border-border/30 space-y-2">
                    <p>
                      La retención legal de <strong className="text-foreground">{formatCLP(retencionEstimada)}</strong> no es un cobro de la empresa. Es un <strong>anticipo de tu Impuesto a la Renta de segunda categoría</strong> que la empresa retiene y entera al SII mediante el Formulario 29. Este crédito tributario se abonará a tu favor en tu Declaración Anual (Operación Renta).
                    </p>
                    <p>
                      Tus <strong>cotizaciones previsionales (salud y AFP)</strong> son de carácter independiente y se determinan y pagan anualmente en tu Formulario 22 ante el SII conforme a la Ley 21.133 (si superas el umbral de 5 Ingresos Mínimos Mensuales en el año, aprox. $2.695.000 CLP). No constituyen un descuento directo de esta boleta.
                    </p>
                  </div>
                )}
              </div>

              {/* Simulador Rápido Bidireccional */}
              <div className="rounded-lg bg-surface-sunken p-4 border border-border/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Simulador Rápido de Boleta de Honorarios (Tasa 2026: 15,25%)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Monto Líquido deseado a recibir en cuenta
                    </label>
                    <input
                      type="number"
                      value={simLiquido || ''}
                      onChange={(e) => handleSimLiquidoChange(Number(e.target.value))}
                      className="input-field font-mono w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground"
                      placeholder="Ej: 100000"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Monto Bruto a emitir en Boleta SII
                    </label>
                    <input
                      type="number"
                      value={simBruto || ''}
                      onChange={(e) => handleSimBrutoChange(Number(e.target.value))}
                      className="input-field font-mono w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground"
                      placeholder="Ej: 118000"
                    />
                  </div>
                </div>

                {simBruto > 0 && (
                  <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-border/30 text-muted-foreground">
                    <span>
                      ➔ Boleta Bruta a emitir: <strong className="text-foreground font-mono">{formatCLP(simBruto)}</strong>
                    </span>
                    <span>
                      ➔ Retención retenida por empresa: <strong className="text-destructive font-mono">{formatCLP(simBruto - simLiquido)}</strong>
                    </span>
                    <span>
                      ➔ Líquido en tu bolsillo: <strong className="text-success font-mono">{formatCLP(simLiquido)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Declaración de Folio Boleta de Honorarios sii.cl */}
              <div className="rounded-lg bg-surface-raised/40 p-4 border border-border/50 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Declarar Boleta de Honorarios Emitida (sii.cl)
                  </h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Una vez emitida tu Boleta de Honorarios en sii.cl a nombre de <strong>Enjambre Legado SpA</strong> (RUT 77.891.234-5) con retención de la empresa (15,25%), ingresa el número de folio para autorizar la liquidación de tus comisiones.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-end">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                      N° de Folio BHE *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={folioBhe}
                      onChange={(e) => setFolioBhe(e.target.value)}
                      placeholder="Ej: 142"
                      className="input-field font-mono w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                      Monto Bruto Declarado ($)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={montoBhe || (totalBrutoPendiente > 0 ? String(totalBrutoPendiente) : '')}
                      onChange={(e) => setMontoBhe(e.target.value)}
                      placeholder={String(totalBrutoPendiente || 0)}
                      className="input-field font-mono w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground text-sm"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={!folioBhe || savingBhe}
                      onClick={handleDeclareBhe}
                      className="w-full min-h-10 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{savingBhe ? 'Registrando...' : 'Declarar BHE'}</span>
                    </button>
                  </div>
                </div>

                {bheMsg && (
                  <div
                    className={`rounded-lg p-2.5 text-xs flex items-center gap-2 mt-2 ${
                      bheMsg.type === 'success'
                        ? 'bg-success/10 border border-success/30 text-success'
                        : 'bg-destructive/10 border border-destructive/30 text-destructive'
                    }`}
                  >
                    {bheMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{bheMsg.text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Listado de comisiones individuales */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
                Detalle por Venta
              </h4>
              {data.commissions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-8 text-center">Sin comisiones en este período.</p>
              ) : data.commissions.map(c => (
                <div key={c.id} className="card-glow p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{formatCLP(Math.abs(Number(c.total_commission)))}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground">Base: {formatCLP(Math.abs(Number(c.base_commission)))}</span>
                      {Number(c.volume_multiplier) > 1 && <span className="text-[9px] text-warning font-semibold">×{Number(c.volume_multiplier).toFixed(1)}</span>}
                      {Number(c.loyalty_bonus) > 0 && <span className="text-[9px] text-success font-semibold">+fidelización</span>}
                      {Number(c.streak_bonus) > 0 && <span className="text-[9px] text-info font-semibold">+racha</span>}
                      {Number(c.tier_multiplier) > 1 && <span className="text-[9px] text-info font-semibold">tier ×{Number(c.tier_multiplier).toFixed(1)}</span>}
                      {c.channel_rate != null && Number(c.channel_rate) !== 0.10 && <span className="text-[9px] text-info font-semibold">{(Number(c.channel_rate) * 100).toFixed(0)}%</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      c.paid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {c.paid ? 'pagada' : 'pendiente'}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(c.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {tab === 'contrato' && (
        <div className="card-glow p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Contrato de Prestación de Servicios Independientes
                </h3>
                <p className="text-xs text-muted-foreground">
                  Documento regulatorio de promoción y comercialización mercantil independiente
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                contrato?.estado === 'activo'
                  ? 'bg-success/10 text-success border border-success/30'
                  : contrato?.estado === 'suspendido'
                  ? 'bg-destructive/10 text-destructive border border-destructive/30'
                  : 'bg-warning/10 text-warning border border-warning/30'
              }`}>
                Estado: {contrato?.estado === 'activo' ? 'Vigente y Activo' : contrato?.estado === 'suspendido' ? 'En Revisión' : 'Borrador'}
              </span>
            </div>
          </div>

          {contractMsg && (
            <div
              className={`rounded-xl p-3.5 flex items-start gap-2.5 text-xs ${
                contractMsg.type === 'success'
                  ? 'bg-success/10 border border-success/30 text-success'
                  : 'bg-destructive/10 border border-destructive/30 text-destructive'
              }`}
            >
              {contractMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{contractMsg.text}</span>
            </div>
          )}

          {loadingContrato ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Cargando información contractual...
            </div>
          ) : (
            <div className="space-y-5">
              {/* Cláusulas de Blindaje Laboral y Consignación Mercantil */}
              <div className="p-4 rounded-xl bg-surface-sunken border border-border/40 space-y-2.5 text-xs text-muted-foreground">
                <h4 className="font-semibold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-primary" />
                  Naturaleza Jurídica de la Relación (Código de Comercio · Consignación Mercantil)
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
                  <li><strong>Autonomía Operativa:</strong> Actúas en tu propio nombre y riesgo como agente comercial independiente, sin sujeción a jornada ni horario.</li>
                  <li><strong>Sin Exclusividad:</strong> Cuentas con plena libertad para comercializar o representar otros productos o marcas.</li>
                  <li><strong>Compensación por Resultado:</strong> Tus ingresos corresponden exclusivamente a comisiones devengadas por venta mercantil y bonos logísticos de evento.</li>
                  <li><strong>Bono de Apertura de Evento:</strong> Es una meta objetiva de disponibilidad de stock y habilitación de caja, no un control de asistencia personal ni subordinación.</li>
                </ul>
              </div>

              {/* Aceptación Electrónica de Términos (Ley N° 19.799 Firma Digital) */}
              {contrato?.acepto_terminos_at ? (
                <div className="p-4 rounded-xl bg-success/5 border border-success/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Aceptación Electrónica Registrada (Ley N° 19.799)
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Aceptado digitalmente el {new Date(contrato.acepto_terminos_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · Versión {contrato.acepto_terminos_version || '2026-v1'} · Régimen Segunda Categoría SII (Honorarios independientes).
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success/15 text-success border border-success/30 shrink-0 self-start sm:self-auto">
                    Firma Electrónica Válida
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-raised border border-primary/30 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <KeyRound className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Firma y Aceptación Electrónica de Términos (Ley N° 19.799)
                    </h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Conforme a la Ley N° 19.799 sobre Documentos Electrónicos y Firma Electrónica, puedes manifestar tu conformidad con los términos mercantiles de manera inmediata y vinculante.
                  </p>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={declaraSegundaCategoria}
                        onChange={(e) => setDeclaraSegundaCategoria(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-[11px] text-muted-foreground leading-snug">
                        Declaro bajo fe de juramento actuar como <strong>Agente Comercial Independiente</strong>, emitiendo Boletas de Honorarios de Segunda Categoría (Art. 42 N° 2 Ley sobre Impuesto a la Renta) con la retención legal obligatoria (15,25% en 2026), sin sujeción a horario, jornada laboral ni subordinación jurídica.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aceptaTerminosContrato}
                        onChange={(e) => setAceptaTerminosContrato(e.target.checked)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-[11px] text-muted-foreground leading-snug">
                        He leído y acepto íntegramente los <strong>Términos y Condiciones Mercantiles de Prestación de Servicios y Consignación</strong> (Versión {contrato?.documento_version || '2026-v1'}).
                      </span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!declaraSegundaCategoria || !aceptaTerminosContrato || acceptingContract}
                      onClick={handleAcceptContractTerms}
                      className="min-h-11 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{acceptingContract ? 'Registrando firma electrónica...' : 'Firmar y Aceptar Electrónicamente Términos Mercantiles'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Acciones de Documentación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Descargar Plantilla Oficial */}
                <div className="p-4 rounded-xl bg-surface-raised border border-border/50 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground text-xs mb-1">
                      1. Contrato Modelo / Términos
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Descarga el documento de términos y condiciones de prestación de servicios para tu firma.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="min-h-11 px-4 py-2 rounded-lg bg-surface-sunken hover:bg-surface-sunken/80 border border-border/60 text-xs font-semibold text-foreground transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span>Descargar Plantilla (PDF)</span>
                  </button>
                </div>

                {/* Subir Documento Firmado */}
                <div className="p-4 rounded-xl bg-surface-raised border border-border/50 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground text-xs mb-1">
                      2. Subir Contrato Físico Firmado (Opcional)
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Sube tu copia manuscrita firmada (PDF o fotografía legible) para archivo complementario.
                    </p>
                  </div>
                  <label className="min-h-11 px-4 py-2 rounded-lg bg-surface-sunken hover:bg-surface-sunken/80 border border-border/60 text-foreground text-xs font-semibold cursor-pointer transition-colors inline-flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <span>{uploadingContract ? 'Subiendo...' : 'Seleccionar Archivo Firmado'}</span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={handleUploadSignedContract}
                      disabled={uploadingContract}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Contrato Vigente para Descarga Permanente */}
              {contrato?.documento_firmado_url && (
                <div className="p-4 rounded-xl bg-success/5 border border-success/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Tu Contrato Firmado está Registrado y Vigente
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {contrato.documento_firmado_at
                          ? `Subido el ${new Date(contrato.documento_firmado_at).toLocaleDateString('es-CL')} — Disponible en todo momento para acreditación ferial.`
                          : 'Disponible en todo momento para descarga y acreditación ferial.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSignedContract}
                    className="min-h-10 px-4 py-2 rounded-lg bg-surface-raised hover:bg-surface-raised/80 border border-border/60 text-xs font-medium text-foreground transition-colors inline-flex items-center gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    <span>Descargar Mi Copia Firmada</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {data.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-8 text-center">Sin sesiones en este período.</p>
          ) : data.sessions.map(s => (
            <div key={s.id} className="card-glow p-4 flex items-center justify-between">
              <div>
        <p className="text-sm font-bold text-foreground">
          {new Date(s.opened_at).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-muted-foreground">Base: {formatCLP(Math.abs(s.opening_cash))}</span>
                  {s.cash_difference !== null && (
                    <span className={`text-[9px] font-bold ${Number(s.cash_difference) === 0 ? 'text-success' : 'text-destructive'}`}>
                      Δ {Number(s.cash_difference) >= 0 ? '+' : '-'}{formatCLP(Math.abs(Number(s.cash_difference)))}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
          s.session_status === 'reconciled' ? 'bg-success/10 text-success' :
          s.session_status === 'closed' ? 'bg-warning/10 text-warning' :
                'bg-primary/10 text-primary'
              }`}>
                {s.session_status}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && <LeaderboardPanel variant="widget" />}

      {tab === 'datos_pago' && (
        <div className="card-glow p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                Datos de Transferencia Bancaria
              </h3>
              <p className="text-xs text-muted-foreground">
                Registra tu cuenta personal para el pago y liquidación de tus comisiones
              </p>
            </div>
          </div>

          {bankMsg && (
            <div
              className={`rounded-xl p-3.5 flex items-start gap-2.5 text-xs ${
                bankMsg.type === 'success'
                  ? 'bg-success/10 border border-success/30 text-success'
                  : 'bg-destructive/10 border border-destructive/30 text-destructive'
              }`}
            >
              {bankMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{bankMsg.text}</span>
            </div>
          )}

          {data.profile?.bank_details?.numero_cuenta && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  Cuenta Actual Registrada
                </p>
                <p className="text-xs font-semibold text-foreground mt-0.5">
                  {data.profile.bank_details.banco} · {data.profile.bank_details.tipo_cuenta === 'vista_cuentarut' ? 'CuentaRUT / Vista' : data.profile.bank_details.tipo_cuenta === 'corriente' ? 'Cta. Corriente' : 'Cta. Ahorro'}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  N° {data.profile.bank_details.numero_cuenta} · RUT: {data.profile.bank_details.rut} · {data.profile.bank_details.titular}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/30">
                Activa ✓
              </span>
            </div>
          )}

          <form onSubmit={(e) => void saveBankDetails(e)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                  Nombre del Titular
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.titular}
                  onChange={(e) => setBankForm({ ...bankForm, titular: e.target.value })}
                  className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                  placeholder="Camila Soto Pérez"
                />
              </div>

              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                  RUT del Titular (con guión y dígito verificador)
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.rut}
                  onChange={(e) => setBankForm({ ...bankForm, rut: e.target.value })}
                  className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                  placeholder="19.123.456-7"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                  Institución Bancaria
                </label>
                <select
                  value={bankForm.banco}
                  onChange={(e) => setBankForm({ ...bankForm, banco: e.target.value })}
                  className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  {CHILEAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                  Tipo de Cuenta
                </label>
                <select
                  value={bankForm.tipo_cuenta}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      tipo_cuenta: e.target.value as 'vista_cuentarut' | 'corriente' | 'ahorro',
                    })
                  }
                  className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="vista_cuentarut">CuentaRUT / Cuenta Vista</option>
                  <option value="corriente">Cuenta Corriente</option>
                  <option value="ahorro">Cuenta de Ahorro</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">
                Número de Cuenta
              </label>
              <input
                type="text"
                required
                value={bankForm.numero_cuenta}
                onChange={(e) => setBankForm({ ...bankForm, numero_cuenta: e.target.value })}
                className="w-full min-h-11 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-xs text-foreground font-mono placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none transition-colors"
                placeholder="Si es CuentaRUT, ingresa tu RUT sin puntos ni guión"
              />
            </div>

            <button
              type="submit"
              disabled={savingBank}
              className="min-h-11 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-md inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingBank ? 'Guardando…' : 'Guardar Datos Bancarios'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
