'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Printer,
  Recycle,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  FileText,
  Calendar,
  Send,
  SlidersHorizontal,
  Compass,
  X,
  Eye,
  Copy,
  Check,
  MessageCircle,
  User,
  CreditCard,
} from 'lucide-react';
import {
  formatCLP,
  formatDate,
  toast,
  cn,
  Button,
  Card,
  Badge,
  Input,
  Skeleton,
} from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import {
  DEFAULT_COURIER,
  getCourierLabel,
  CHILEAN_COURIERS,
  type CourierCode,
} from '@enjambre/logistica';

interface PedidoItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  slug?: string;
}

export interface AtribucionData {
  canal: string;
  canalKey: 'instagram' | 'facebook' | 'google' | 'whatsapp' | 'email' | 'creador' | 'organico';
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  codigoCreador: string | null;
  esPauta: boolean;
}

interface PedidoData {
  id: string;
  buyOrder: string;
  createdAt: string;
  total: number;
  estadoPago: string;
  metodoPago: string;
  authCode: string | null;
  buyerEmail: string;
  cliente: {
    nombre: string;
    telefono: string;
    direccion: string;
    comuna: string;
    ciudad: string;
    region: string;
    depto?: string | null;
    rut?: string | null;
    indicaciones?: string | null;
  };
  items: PedidoItem[];
  retornoFrascos: {
    declarados: number;
    estado: string;
  };
  atribucion?: AtribucionData;
  logistica: {
    envioId: string | null;
    status: 'pendiente' | 'empaquetado' | 'en_transito' | 'entregado' | 'fallido' | string;
    courierCode: string;
    via: string;
    trackingCode: string | null;
    courierTrackingUrl: string | null;
    eta: string | null;
    destino: string | null;
  };
  tributario: {
    id: string;
    numero: string;
    tipoDocumento: string;
    tipoDte: number;
    estadoSii: string;
  } | null;
}

interface PorConciliarSession {
  id: string;
  buyOrder: string;
  sessionId: string;
  provider: string;
  total: number;
  status: string;
  createdAt: string;
  shipping: {
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    comuna: string;
    ciudad: string;
    region: string;
    depto?: string | null;
    rut?: string | null;
    indicaciones?: string | null;
  };
  items: PedidoItem[];
  atribucion?: AtribucionData;
}

/** Sanitiza el identificador de autorización para prevenir fugas de session UUIDs (#sess-...) */
function getCleanComprobante(authCode: string | null | undefined): string | null {
  if (!authCode) return null;
  const trimmed = authCode.trim();
  if (
    trimmed.startsWith('sess-') ||
    trimmed.startsWith('auth-') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i.test(trimmed)
  ) {
    return null;
  }
  return trimmed;
}

interface PedidosApiResponse {
  ok: boolean;
  data: {
    pedidos: PedidoData[];
    porConciliar: PorConciliarSession[];
    stats: {
      total: number;
      porPreparar: number;
      empaquetados: number;
      enTransito: number;
      entregados: number;
      porConciliar: number;
      ingresosTotalesClp: number;
      frascosRetornoPendientes: number;
    };
  };
}

type TabType = 'todos' | 'por_preparar' | 'empaquetados' | 'en_transito' | 'entregados' | 'por_conciliar';

export function PedidosView() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [courierFilter, setCourierFilter] = useState<string>('all');

  // Modales y vista de detalle
  const [detallePedido, setDetallePedido] = useState<PedidoData | null>(null);
  const [comandaPedido, setComandaPedido] = useState<PedidoData | null>(null);
  const [despachoModal, setDespachoModal] = useState<{
    pedido: PedidoData;
    status: 'pendiente' | 'empaquetado' | 'en_transito' | 'entregado';
    courierCode: string;
    trackingCode: string;
    notificarCliente: boolean;
  } | null>(null);
  const [conciliarModal, setConciliarModal] = useState<PorConciliarSession | null>(null);
  const [flowOrderInput, setFlowOrderInput] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const copyToClipboard = (text: string, idKey?: string) => {
    navigator.clipboard.writeText(text);
    if (idKey) {
      setCopiedOrderId(idKey);
      setTimeout(() => setCopiedOrderId(null), 2000);
    }
    toast('Código copiado al portapapeles', { type: 'success' });
  };

  // 1. Cargar pedidos y sesiones
  const { data, isLoading, isFetching, refetch } = useQuery<PedidosApiResponse>({
    queryKey: ['pedidos-central'],
    queryFn: async () => {
      const res = await apiFetch('/api/pedidos');
      if (!res.ok) {
        throw new Error('No se pudieron cargar los pedidos de la tienda');
      }
      return res.json();
    },
    staleTime: 15_000,
  });

  const pedidos = data?.data?.pedidos ?? [];
  const porConciliar = data?.data?.porConciliar ?? [];
  const stats = data?.data?.stats ?? {
    total: 0,
    porPreparar: 0,
    empaquetados: 0,
    enTransito: 0,
    entregados: 0,
    porConciliar: 0,
    ingresosTotalesClp: 0,
    frascosRetornoPendientes: 0,
  };

  // 2. Mutación para conciliar sesión
  const conciliarMutation = useMutation({
    mutationFn: async ({ buyOrder, flowOrder }: { buyOrder: string; flowOrder?: string }) => {
      const res = await apiFetch(`/api/pedidos/${encodeURIComponent(buyOrder)}/conciliar`, {
        method: 'POST',
        body: JSON.stringify({
          flowOrder: flowOrder || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: string[];
        };
        const detailMsg =
          errJson.details && errJson.details.length > 0
            ? `${errJson.error ?? 'Error'}: ${errJson.details.join('; ')}`
            : errJson.error || 'Fallo en la conciliación';
        throw new Error(detailMsg);
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Pedido conciliado y registrado con éxito', { type: 'success' });
      setConciliarModal(null);
      setFlowOrderInput('');
      queryClient.invalidateQueries({ queryKey: ['pedidos-central'] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'No se pudo conciliar el pedido';
      toast(msg, { type: 'error' });
    },
  });

  // 3. Mutación para actualizar despacho y seguimiento
  const despachoMutation = useMutation({
    mutationFn: async ({
      buyOrder,
      status,
      courierCode,
      trackingCode,
      notificarCliente,
    }: {
      buyOrder: string;
      status: string;
      courierCode: string;
      trackingCode: string;
      notificarCliente: boolean;
    }) => {
      const res = await apiFetch(`/api/pedidos/${encodeURIComponent(buyOrder)}/despacho`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          courier_code: courierCode,
          tracking_code: trackingCode,
          notificarCliente,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al actualizar despacho');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast(
        variables.status === 'en_transito' && variables.notificarCliente
          ? 'Despacho actualizado y notificación enviada al cliente'
          : 'Estado de despacho actualizado correctamente',
        { type: 'success' }
      );
      setDespachoModal(null);
      queryClient.invalidateQueries({ queryKey: ['pedidos-central'] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar el despacho';
      toast(msg, { type: 'error' });
    },
  });

  // 4. Mutación para retorno circular de frascos
  const retornoFrascosMutation = useMutation({
    mutationFn: async ({ buyOrder, status }: { buyOrder: string; status: string }) => {
      const res = await apiFetch(`/api/pedidos/${encodeURIComponent(buyOrder)}/retorno-frascos`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al actualizar frascos');
      }
      return res.json();
    },
    onSuccess: () => {
      toast('Estado del retorno de frascos actualizado', { type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['pedidos-central'] });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar el retorno de frascos';
      toast(msg, { type: 'error' });
    },
  });

  // Filtrado de pedidos
  const filteredPedidos = useMemo(() => {
    return pedidos.filter((pedido) => {
      // Filtro por tab
      if (activeTab === 'por_preparar' && pedido.logistica.status !== 'pendiente') return false;
      if (activeTab === 'empaquetados' && pedido.logistica.status !== 'empaquetado') return false;
      if (activeTab === 'en_transito' && pedido.logistica.status !== 'en_transito') return false;
      if (activeTab === 'entregados' && pedido.logistica.status !== 'entregado') return false;

      // Filtro por courier
      if (courierFilter !== 'all' && pedido.logistica.courierCode !== courierFilter) return false;

      // Filtro por búsqueda
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchBuyOrder = pedido.buyOrder?.toLowerCase().includes(term);
        const matchCliente = pedido.cliente.nombre.toLowerCase().includes(term);
        const matchEmail = pedido.buyerEmail.toLowerCase().includes(term);
        const matchPhone = pedido.cliente.telefono.toLowerCase().includes(term);
        const matchTracking = pedido.logistica.trackingCode?.toLowerCase().includes(term);
        const matchItems = pedido.items.some((it) => it.name.toLowerCase().includes(term));
        return matchBuyOrder || matchCliente || matchEmail || matchPhone || matchTracking || matchItems;
      }

      return true;
    });
  }, [pedidos, activeTab, courierFilter, searchTerm]);

  // Formato status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Por Preparar
          </span>
        );
      case 'empaquetado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Package className="w-3 h-3" /> Empaquetado
          </span>
        );
      case 'en_transito':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="w-3 h-3" /> En Tránsito
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Entregado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-muted-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  // Formato origen y atribución (solo si proviene de un canal rastreado)
  const renderAtribucionBadge = (atribucion?: AtribucionData) => {
    // Si no hay atribución o es una visita directa/orgánica común, no ensuciar la tarjeta.
    if (!atribucion || atribucion.canalKey === 'organico') return null;

    const isInstagram = atribucion.canalKey === 'instagram';
    const isMeta = atribucion.canalKey === 'facebook';
    const isGoogle = atribucion.canalKey === 'google';
    const isWhatsApp = atribucion.canalKey === 'whatsapp';
    const isCreador = atribucion.canalKey === 'creador';
    const isEmail = atribucion.canalKey === 'email';

    const badgeColor = isInstagram
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : isMeta
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : isGoogle
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : isWhatsApp
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : isCreador
      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      : isEmail
      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      : 'bg-surface-raised text-muted-foreground border-border';

    const tooltip = [
      atribucion.canal,
      atribucion.medium ? `Formato: ${atribucion.medium}` : null,
      atribucion.campaign ? `Campaña: ${atribucion.campaign}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border select-none',
          badgeColor
        )}
        title={tooltip}
      >
        <Compass className="w-2.5 h-2.5 shrink-0" />
        <span>{atribucion.canal}</span>
        {atribucion.medium && (
          <span className="text-[9px] opacity-75 font-mono">({atribucion.medium})</span>
        )}
      </span>
    );
  };

  return (
    <div className="w-full min-h-[var(--vh-full)] bg-background text-foreground pb-20">
      {/* Encabezado */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider uppercase rounded bg-primary/10 text-primary border border-primary/20">
                Tienda Web · Despacho
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight mt-1">
              Pedidos y Central de Despacho
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Preparación de frascos en taller, comanda de embalaje, etiquetas de transporte y conciliación de pasarela.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 text-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
              <span>Actualizar</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Por Preparar */}
          <div
            onClick={() => setActiveTab('por_preparar')}
            className={cn(
              'p-3.5 rounded-xl border transition-all cursor-pointer bg-card hover:border-amber-500/40',
              activeTab === 'por_preparar' ? 'border-amber-500/60 ring-1 ring-amber-500/30' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Por Preparar</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-serif font-medium text-amber-500">
              {isLoading ? <Skeleton className="h-7 w-10" /> : stats.porPreparar}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">En taller de empaque</p>
          </div>

          {/* Empaquetados */}
          <div
            onClick={() => setActiveTab('empaquetados')}
            className={cn(
              'p-3.5 rounded-xl border transition-all cursor-pointer bg-card hover:border-purple-500/40',
              activeTab === 'empaquetados' ? 'border-purple-500/60 ring-1 ring-purple-500/30' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Empaquetados</span>
              <Package className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-serif font-medium text-purple-400">
              {isLoading ? <Skeleton className="h-7 w-10" /> : stats.empaquetados}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Listos para retiro</p>
          </div>

          {/* En Tránsito */}
          <div
            onClick={() => setActiveTab('en_transito')}
            className={cn(
              'p-3.5 rounded-xl border transition-all cursor-pointer bg-card hover:border-blue-500/40',
              activeTab === 'en_transito' ? 'border-blue-500/60 ring-1 ring-blue-500/30' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>En Tránsito</span>
              <Truck className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-serif font-medium text-blue-400">
              {isLoading ? <Skeleton className="h-7 w-10" /> : stats.enTransito}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Con número de tracking</p>
          </div>

          {/* Entregados */}
          <div
            onClick={() => setActiveTab('entregados')}
            className={cn(
              'p-3.5 rounded-xl border transition-all cursor-pointer bg-card hover:border-emerald-500/40',
              activeTab === 'entregados' ? 'border-emerald-500/60 ring-1 ring-emerald-500/30' : 'border-border'
            )}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Entregados</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-serif font-medium text-emerald-500">
              {isLoading ? <Skeleton className="h-7 w-10" /> : stats.entregados}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Completados con éxito</p>
          </div>

          {/* Por Conciliar */}
          <div
            onClick={() => setActiveTab('por_conciliar')}
            className={cn(
              'p-3.5 rounded-xl border transition-all cursor-pointer bg-card hover:border-rose-500/40',
              activeTab === 'por_conciliar' ? 'border-rose-500/60 ring-1 ring-rose-500/30' : 'border-border',
              stats.porConciliar > 0 && 'bg-rose-500/5'
            )}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-medium text-rose-400">Por Conciliar</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-serif font-medium text-rose-400">
              {isLoading ? <Skeleton className="h-7 w-10" /> : stats.porConciliar}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Alerta pasarela / Flow</p>
          </div>

          {/* Retorno Frascos */}
          <div className="p-3.5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Frascos Retorno</span>
              <Recycle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-serif font-medium text-emerald-500">
              {isLoading ? <Skeleton className="h-7 w-10" /> : stats.frascosRetornoPendientes}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Vidrio circular en espera</p>
          </div>
        </div>

        {/* ALERTA DE CONCILIACIÓN (si hay pedidos de pasarela desfasados como Flow) */}
        {porConciliar.length > 0 && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Hay {porConciliar.length} transacción(es) de Flow pendientes de conciliación automática
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  El cliente pagó en Flow pero la confirmación original no fue asentada. Puedes conciliar en 1-click para activar el despacho y comanda.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('por_conciliar')}
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 shrink-0 text-xs"
            >
              Revisar {porConciliar.length} caso(s)
            </Button>
          </div>
        )}

        {/* Controles de navegación y búsqueda */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-raised rounded-lg border border-border overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('todos')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap',
                activeTab === 'todos'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('por_preparar')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap',
                activeTab === 'por_preparar'
                  ? 'bg-card text-amber-500 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Por Preparar ({stats.porPreparar})
            </button>
            <button
              onClick={() => setActiveTab('empaquetados')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap',
                activeTab === 'empaquetados'
                  ? 'bg-card text-purple-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Empaquetados ({stats.empaquetados})
            </button>
            <button
              onClick={() => setActiveTab('en_transito')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap',
                activeTab === 'en_transito'
                  ? 'bg-card text-blue-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              En Tránsito ({stats.enTransito})
            </button>
            <button
              onClick={() => setActiveTab('entregados')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap',
                activeTab === 'entregados'
                  ? 'bg-card text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Entregados ({stats.entregados})
            </button>
            <button
              onClick={() => setActiveTab('por_conciliar')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === 'por_conciliar'
                  ? 'bg-card text-rose-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span>Por Conciliar</span>
              {stats.porConciliar > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono">
                  {stats.porConciliar}
                </span>
              )}
            </button>
          </div>

          {/* Buscador & Selector Courier */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, orden o tracking..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Todos los couriers</option>
              {CHILEAN_COURIERS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* VISTA TAB: POR CONCILIAR (Sesiones gateway desfasadas) */}
        {activeTab === 'por_conciliar' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-medium text-foreground">
                  Transacciones por Conciliar (Flow / Gateway)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Compras donde el cliente completó la transacción pero el sistema requiere sincronización final.
                </p>
              </div>
            </div>

            {porConciliar.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-border bg-card/40">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-foreground">Todo en perfecto orden</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  No existen transacciones de pasarela huérfanas ni alertas de confirmación pendientes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {porConciliar.map((session) => (
                  <div
                    key={session.id}
                    className="p-5 rounded-xl border border-rose-500/20 bg-card hover:border-rose-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {session.buyOrder}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {session.provider.toUpperCase()} · Pago por asentar
                        </span>
                        {renderAtribucionBadge(session.atribucion)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(session.createdAt)}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {session.shipping.nombre} · {session.shipping.email}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>
                            {session.shipping.direccion}, {session.shipping.comuna}, {session.shipping.region}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {session.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-surface-raised border border-border text-foreground text-[11px]"
                          >
                            {it.quantity}x {it.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                      <div className="text-lg font-serif font-medium text-foreground">
                        {formatCLP(session.total)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setConciliarModal(session);
                          setFlowOrderInput('');
                        }}
                        className="gap-2 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Conciliar y Activar Despacho</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TABLA PRINCIPAL DE PEDIDOS */
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredPedidos.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-border bg-card/40">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-medium text-foreground">No se encontraron pedidos</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {searchTerm
                    ? 'No hay pedidos que coincidan con la búsqueda actual.'
                    : 'Aún no se han registrado pedidos en esta categoría.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPedidos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Info Central: Orden, Cliente, Artículos */}
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {pedido.buyOrder}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(pedido.buyOrder, pedido.id)}
                            className="p-1 rounded hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-colors"
                            title="Copiar código de orden"
                          >
                            {copiedOrderId === pedido.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {renderStatusBadge(pedido.logistica.status)}
                        {renderAtribucionBadge(pedido.atribucion)}
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(pedido.createdAt)}
                        </span>
                        {(() => {
                          const cleanCode = getCleanComprobante(pedido.authCode);
                          return (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              title="Pago validado y comprobante electrónico emitido por pasarela"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{cleanCode ? `Flow #${cleanCode}` : 'Pago Confirmado'}</span>
                            </span>
                          );
                        })()}
                      </div>

                      {/* Cliente y Destino */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="font-medium text-foreground">{pedido.cliente.nombre}</div>
                          <div className="text-muted-foreground flex items-center gap-3 mt-0.5">
                            {pedido.cliente.telefono && (
                              <a
                                href={`tel:${pedido.cliente.telefono}`}
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                <Phone className="w-3 h-3" /> {pedido.cliente.telefono}
                              </a>
                            )}
                            {pedido.buyerEmail && (
                              <a
                                href={`mailto:${pedido.buyerEmail}`}
                                className="flex items-center gap-1 hover:text-primary truncate max-w-[180px]"
                              >
                                <Mail className="w-3 h-3" /> {pedido.buyerEmail}
                              </a>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">
                              {pedido.cliente.direccion || 'Sin dirección registrada'}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground pl-4">
                            {pedido.cliente.comuna && `${pedido.cliente.comuna}, `}
                            {pedido.cliente.region}
                          </div>
                        </div>
                      </div>

                      {/* Artículos y Retorno de Vidrio */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {pedido.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md bg-surface-raised border border-border text-foreground text-xs font-medium"
                          >
                            {it.quantity}x {it.name}
                          </span>
                        ))}

                        {/* Retorno de Frascos Circular */}
                        {pedido.retornoFrascos.declarados > 0 && (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                            <Recycle className="w-3.5 h-3.5" />
                            <span>Retorno: {pedido.retornoFrascos.declarados} frascos</span>
                            <span className="text-[10px] uppercase opacity-75 font-mono">
                              ({pedido.retornoFrascos.estado.replace('_', ' ')})
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Columna Derecha: Courier, Tracking y Acciones */}
                    <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end justify-between sm:items-center gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-serif font-medium text-foreground">
                          {formatCLP(pedido.total)}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center sm:justify-end gap-1.5 mt-0.5">
                          <Truck className="w-3 h-3" />
                          <span>{pedido.logistica.via}</span>
                          {pedido.logistica.trackingCode && (
                            <span className="font-mono text-[10px] text-primary">
                              #{pedido.logistica.trackingCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-2">
                        {/* Ver Detalle Completo */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetallePedido(pedido)}
                          className="text-xs gap-1.5 border-primary/30 text-foreground bg-card hover:bg-primary/10 hover:border-primary/60 transition-all font-medium"
                          title="Ver todos los datos del cliente, productos y liquidación tributaria"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span>Ver Detalle</span>
                        </Button>

                        {/* Ficha / Comanda Taller */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setComandaPedido(pedido)}
                          className="text-xs gap-1.5"
                          title="Imprimir comanda de empaque para taller"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Comanda</span>
                        </Button>

                        {/* Gestionar Despacho / Tracking */}
                        <Button
                          size="sm"
                          onClick={() =>
                            setDespachoModal({
                              pedido,
                              status: (pedido.logistica.status as any) || 'pendiente',
                              courierCode: pedido.logistica.courierCode || DEFAULT_COURIER,
                              trackingCode: pedido.logistica.trackingCode || '',
                              notificarCliente: false,
                            })
                          }
                          className="text-xs gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Despacho</span>
                        </Button>

                        {/* Enlace externo al tracking si existe */}
                        {pedido.logistica.courierTrackingUrl && (
                          <a
                            href={pedido.logistica.courierTrackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors"
                            title="Abrir seguimiento en el courier"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 0: DETALLE INTEGRAL DEL PEDIDO */}
      {detallePedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-surface-raised/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-serif font-medium text-foreground tracking-tight">
                      Detalle Integral del Pedido
                    </h2>
                    {renderStatusBadge(detallePedido.logistica.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                    <span>{detallePedido.buyOrder}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(detallePedido.buyOrder)}
                      className="hover:text-primary transition-colors"
                      title="Copiar código de orden"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <span>·</span>
                    <span>{formatDate(detallePedido.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetallePedido(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* SECCIÓN 1: DATOS COMPLETOS DEL CLIENTE Y ENTREGA */}
              <div className="rounded-xl border border-border bg-surface-raised/30 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    <User className="w-4 h-4 text-primary" />
                    <span>Información del Cliente y Destinatario</span>
                  </div>
                  {/* Botón WhatsApp Directo */}
                  {detallePedido.cliente.telefono && (() => {
                    const digits = detallePedido.cliente.telefono.replace(/[^0-9]/g, '');
                    const waNum = digits.startsWith('56') ? digits : `56${digits}`;
                    const waLink = `https://wa.me/${waNum}?text=${encodeURIComponent(
                      `Hola ${detallePedido.cliente.nombre}, te contactamos desde Enjambre Legado respecto a tu orden de tienda ${detallePedido.buyOrder}.`
                    )}`;
                    return (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Contactar por WhatsApp</span>
                      </a>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Columna Contacto */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Nombre Completo:</span>
                      <span className="text-sm font-medium text-foreground">{detallePedido.cliente.nombre}</span>
                    </div>
                    {detallePedido.cliente.rut && (
                      <div>
                        <span className="text-[11px] text-muted-foreground block">RUT / Identificación:</span>
                        <span className="font-mono text-foreground">{detallePedido.cliente.rut}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Correo Electrónico:</span>
                      <a
                        href={`mailto:${detallePedido.buyerEmail}`}
                        className="font-mono text-primary hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Mail className="w-3 h-3" />
                        <span>{detallePedido.buyerEmail || 'Sin correo registrado'}</span>
                      </a>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Teléfono de Contacto:</span>
                      {detallePedido.cliente.telefono ? (
                        <a
                          href={`tel:${detallePedido.cliente.telefono}`}
                          className="font-mono text-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{detallePedido.cliente.telefono}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No registrado</span>
                      )}
                    </div>
                  </div>

                  {/* Columna Dirección y Despacho */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Dirección de Despacho:</span>
                      <div className="flex items-start gap-1.5 text-foreground mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">{detallePedido.cliente.direccion || 'Dirección no especificada'}</div>
                          {detallePedido.cliente.depto && (
                            <div className="text-muted-foreground">Dpto / Oficina: {detallePedido.cliente.depto}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Comuna y Región:</span>
                      <span className="font-medium text-foreground">
                        {detallePedido.cliente.comuna ? `${detallePedido.cliente.comuna}, ` : ''}
                        {detallePedido.cliente.region || 'Chile'}
                      </span>
                    </div>
                    {detallePedido.cliente.indicaciones && (
                      <div className="p-2.5 rounded-lg bg-surface-raised border border-border mt-1">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
                          Instrucciones de Entrega:
                        </span>
                        <p className="text-xs text-foreground mt-0.5 italic">
                          &ldquo;{detallePedido.cliente.indicaciones}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: PRODUCTOS Y ARTÍCULOS ESPECÍFICOS */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    <Package className="w-4 h-4 text-primary" />
                    <span>Artículos Adquiridos ({detallePedido.items.reduce((acc, it) => acc + it.quantity, 0)} unidades)</span>
                  </div>
                  <span className="text-xs font-serif font-medium text-primary">
                    Enjambre Legado · Edición Botánica
                  </span>
                </div>

                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 bg-surface-raised px-4 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-6">Producto</div>
                    <div className="col-span-2 text-center">Cantidad</div>
                    <div className="col-span-2 text-right">Precio Unitario</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                  </div>
                  {detallePedido.items.map((it, idx) => {
                    const unitPrice = it.unitPrice ?? 0;
                    const lineTotal = unitPrice * it.quantity;
                    return (
                      <div key={idx} className="grid grid-cols-12 items-center px-4 py-3 text-xs">
                        <div className="col-span-6 pr-2">
                          <span className="font-medium text-foreground block">{it.name}</span>
                          {it.slug && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {it.slug}
                            </span>
                          )}
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="inline-block px-2 py-0.5 rounded bg-surface-raised font-mono font-medium text-foreground">
                            {it.quantity} un.
                          </span>
                        </div>
                        <div className="col-span-2 text-right font-mono text-muted-foreground">
                          {unitPrice > 0 ? formatCLP(unitPrice) : '—'}
                        </div>
                        <div className="col-span-2 text-right font-mono font-medium text-foreground">
                          {lineTotal > 0 ? formatCLP(lineTotal) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen Financiero Total */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Método de Pago: <span className="font-medium text-foreground uppercase">{detallePedido.metodoPago || 'FLOW (WEBPAY)'}</span></div>
                    <div>Despacho: <span className="font-medium text-foreground">{detallePedido.logistica.via}</span></div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">Total Liquidado:</span>
                    <span className="text-2xl font-serif font-bold text-foreground tracking-tight">
                      {formatCLP(detallePedido.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: RETORNO CIRCULAR DE FRASCOS (VIDRIO) */}
              {detallePedido.retornoFrascos.declarados > 0 && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                      <Recycle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                        Retorno Circular de Vidrio ({detallePedido.retornoFrascos.declarados} frascos declarados)
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        El cliente entregará envases limpios para higienización en taller y ciclo circular.
                      </p>
                      <div className="text-xs mt-1.5 flex items-center gap-2">
                        <span className="text-muted-foreground">Estado actual:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                          {detallePedido.retornoFrascos.estado.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {detallePedido.retornoFrascos.estado !== 'recibido_conforme' && (
                      <Button
                        size="sm"
                        onClick={() =>
                          retornoFrascosMutation.mutate({
                            buyOrder: detallePedido.buyOrder,
                            status: 'recibido_conforme',
                          })
                        }
                        disabled={retornoFrascosMutation.isPending}
                        className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Recibido Conforme</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: LOGÍSTICA Y COURIER */}
              <div className="rounded-xl border border-border bg-surface-raised/30 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>Logística y Transporte</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const p = detallePedido;
                      setDetallePedido(null);
                      setDespachoModal({
                        pedido: p,
                        status: (p.logistica.status as any) || 'pendiente',
                        courierCode: p.logistica.courierCode || DEFAULT_COURIER,
                        trackingCode: p.logistica.trackingCode || '',
                        notificarCliente: false,
                      });
                    }}
                    className="text-xs gap-1.5 border-border hover:border-primary"
                  >
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <span>Actualizar Despacho</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Operador Logístico:</span>
                    <span className="font-medium text-foreground">{detallePedido.logistica.via}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Código de Seguimiento:</span>
                    {detallePedido.logistica.trackingCode ? (
                      <div className="flex items-center gap-1.5 font-mono text-primary font-medium">
                        <span>{detallePedido.logistica.trackingCode}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(detallePedido.logistica.trackingCode!)}
                          className="hover:text-foreground"
                          title="Copiar tracking"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Aún no generado</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground block">Seguimiento en Vivo:</span>
                    {detallePedido.logistica.courierTrackingUrl ? (
                      <a
                        href={detallePedido.logistica.courierTrackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                      >
                        <span>Portal Oficial del Courier</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Disponible al ingresar tracking</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: ATRIBUCIÓN DE MARKETING & CANAL */}
              {detallePedido.atribucion && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                      <Compass className="w-4 h-4 text-primary" />
                      <span>Origen de Adquisición y Trazabilidad Comercial</span>
                    </div>
                    {renderAtribucionBadge(detallePedido.atribucion)}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Canal Principal:</span>
                      <span className="font-medium text-foreground">{detallePedido.atribucion.canal}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Medio / Formato:</span>
                      <span className="font-mono text-foreground">{detallePedido.atribucion.medium || 'Directo / Orgánico'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Campaña:</span>
                      <span className="font-medium text-foreground">{detallePedido.atribucion.campaign || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">Código Creador:</span>
                      <span className="font-mono text-foreground">
                        {detallePedido.atribucion.codigoCreador ? `@${detallePedido.atribucion.codigoCreador}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 6: RESPALDO TRIBUTARIO SII */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-muted-foreground space-y-2">
                <div className="flex items-center gap-2 font-medium text-emerald-400">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Validez Tributaria Oficial (Res. Ex. SII Nº 176/2020)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-200/80">
                  Esta venta fue pagada y autorizada a través de la pasarela Flow. De acuerdo a la normativa legal del Servicio de Impuestos Internos (Res. Ex. SII Nº 176/2020), el comprobante de pago emitido por la entidad recaudadora reemplaza legalmente a la boleta de ventas afectas a IVA, eximiendo la duplicación de documentos tributarios.
                </p>
                {(() => {
                  const cleanCode = getCleanComprobante(detallePedido.authCode);
                  if (cleanCode) {
                    return (
                      <div className="text-[11px] font-mono text-emerald-300">
                        Nº de Comprobante / Transacción: <span className="font-bold">#{cleanCode}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Footer del Modal con Acciones Rápidas */}
            <div className="px-6 py-4 border-t border-border bg-card flex flex-wrap items-center justify-between gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetallePedido(null)}
                className="text-xs"
              >
                Cerrar
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const p = detallePedido;
                    setDetallePedido(null);
                    setComandaPedido(p);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Comanda Taller</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    const p = detallePedido;
                    setDetallePedido(null);
                    setDespachoModal({
                      pedido: p,
                      status: (p.logistica.status as any) || 'pendiente',
                      courierCode: p.logistica.courierCode || DEFAULT_COURIER,
                      trackingCode: p.logistica.trackingCode || '',
                      notificarCliente: false,
                    });
                  }}
                  className="text-xs gap-1.5 bg-primary text-primary-foreground"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Gestionar Despacho</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: COMANDA DE EMPAQUE (TALLER PRINTABLE) */}
      {comandaPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:p-0 print:bg-white print:static">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none">
            {/* Header comanda */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Comanda de Taller / Empaque</h3>
              </div>
              <button
                onClick={() => setComandaPedido(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido imprimible */}
            <div className="p-6 space-y-5 print:p-0 print:text-black">
              {/* Membrete Taller */}
              <div className="flex justify-between items-start border-b pb-4 border-border print:border-black">
                <div>
                  <h2 className="text-xl font-serif font-bold tracking-tight">ENJAMBRE LEGADO</h2>
                  <p className="text-xs text-muted-foreground print:text-gray-600">
                    Taller Apícola · Bosque Nativo de Chiloé
                  </p>
                  <p className="text-xs font-mono font-semibold mt-1">
                    Orden: {comandaPedido.buyOrder}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono">{formatDate(comandaPedido.createdAt)}</div>
                  <div className="text-xs font-medium text-primary print:text-black">
                    {comandaPedido.logistica.via}
                  </div>
                </div>
              </div>

              {/* Rótulo de Despacho (Destinatario) */}
              <div className="p-4 rounded-lg bg-surface-raised print:bg-gray-50 border border-border print:border-gray-300">
                <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground print:text-gray-600 mb-1">
                  Datos de Entrega / Destino
                </div>
                <div className="text-base font-semibold">{comandaPedido.cliente.nombre}</div>
                <div className="text-sm mt-0.5">
                  {comandaPedido.cliente.direccion || 'Dirección no especificada'}
                </div>
                <div className="text-sm font-medium">
                  {comandaPedido.cliente.comuna && `${comandaPedido.cliente.comuna}, `}
                  {comandaPedido.cliente.region}
                </div>
                {comandaPedido.cliente.telefono && (
                  <div className="text-xs font-mono mt-1 text-muted-foreground print:text-gray-800">
                    Tel: {comandaPedido.cliente.telefono}
                  </div>
                )}
              </div>

              {/* Lista de preparación de productos */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground print:text-gray-700 mb-2">
                  Artículos a Empacar (Revisar frascos y sellos de cera virgen)
                </div>
                <div className="divide-y divide-border print:divide-gray-300 border rounded-lg border-border print:border-gray-300">
                  {comandaPedido.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded border border-muted-foreground/30 print:border-black flex items-center justify-center shrink-0">
                          {/* Casilla de verificación manual */}
                        </span>
                        <span className="font-medium">{it.name}</span>
                      </div>
                      <span className="font-mono font-bold text-base px-2 py-0.5 rounded bg-surface-raised print:bg-gray-100">
                        {it.quantity} un.
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retorno de envases */}
              {comandaPedido.retornoFrascos.declarados > 0 && (
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 print:border-gray-400 print:bg-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Recycle className="w-4 h-4 text-emerald-500 print:text-black" />
                    <span>
                      <strong>Retorno Circular:</strong> Recibir {comandaPedido.retornoFrascos.declarados} frascos de vidrio limpios del cliente.
                    </span>
                  </div>
                  <span className="font-mono font-bold">Vidrio circular</span>
                </div>
              )}

              {/* Advertencia de fragilidad */}
              <div className="text-[11px] text-muted-foreground print:text-gray-600 text-center italic border-t pt-3 border-border print:border-gray-300">
                Frágil: Producto en envase de vidrio con miel cruda y propóleos puros. Proteger con cartón corrugado y sello de seguridad.
              </div>
            </div>

            {/* Footer con botón imprimir */}
            <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={() => setComandaPedido(null)}>
                Cerrar
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="gap-2 bg-primary text-primary-foreground"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Comanda</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GESTIÓN DE DESPACHO Y SEGUIMIENTO */}
      {despachoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Actualizar Estado de Despacho</h3>
              </div>
              <button
                onClick={() => setDespachoModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Orden de compra
                </label>
                <div className="font-mono text-xs font-semibold text-foreground p-2 rounded bg-surface-raised border border-border">
                  {despachoModal.pedido.buyOrder} — {despachoModal.pedido.cliente.nombre}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Estado del Despacho
                </label>
                <select
                  value={despachoModal.status}
                  onChange={(e) =>
                    setDespachoModal({
                      ...despachoModal,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="pendiente">Por Preparar (En Taller)</option>
                  <option value="empaquetado">Empaquetado (Listo para Courier)</option>
                  <option value="en_transito">En Tránsito (Despachado)</option>
                  <option value="entregado">Entregado al Cliente</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Courier de Entrega
                </label>
                <select
                  value={despachoModal.courierCode}
                  onChange={(e) =>
                    setDespachoModal({
                      ...despachoModal,
                      courierCode: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CHILEAN_COURIERS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Número de Seguimiento (Tracking)
                </label>
                <input
                  type="text"
                  value={despachoModal.trackingCode}
                  onChange={(e) =>
                    setDespachoModal({
                      ...despachoModal,
                      trackingCode: e.target.value,
                    })
                  }
                  placeholder="Ej: CHX-987654321, 1029384756..."
                  className="w-full p-2.5 rounded-lg border border-border bg-card text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Checkbox notificar cliente */}
              <div className="pt-2 border-t border-border">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={despachoModal.notificarCliente}
                    onChange={(e) =>
                      setDespachoModal({
                        ...despachoModal,
                        notificarCliente: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-foreground">
                      Notificar al cliente por correo electrónico
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Envía un correo con el enlace oficial de seguimiento directo al email{' '}
                      <span className="font-mono text-primary">{despachoModal.pedido.buyerEmail}</span>.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDespachoModal(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={despachoMutation.isPending}
                onClick={() =>
                  despachoMutation.mutate({
                    buyOrder: despachoModal.pedido.buyOrder,
                    status: despachoModal.status,
                    courierCode: despachoModal.courierCode,
                    trackingCode: despachoModal.trackingCode,
                    notificarCliente: despachoModal.notificarCliente,
                  })
                }
                className="gap-2 bg-primary text-primary-foreground"
              >
                {despachoMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Guardar Cambios</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONCILIAR PAGO DE PASARELA (EJ. FLOW) */}
      {conciliarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-medium text-foreground">Conciliar Pago de Pasarela</h3>
              </div>
              <button
                onClick={() => setConciliarModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-surface-raised border border-border space-y-1">
                <div className="text-xs text-muted-foreground">Orden de Tienda:</div>
                <div className="font-mono text-xs font-bold text-foreground">
                  {conciliarModal.buyOrder}
                </div>
                <div className="text-xs text-muted-foreground mt-2">Cliente:</div>
                <div className="text-xs font-medium text-foreground">
                  {conciliarModal.shipping.nombre} ({conciliarModal.shipping.email})
                </div>
                <div className="text-xs text-muted-foreground mt-2">Monto Pagado:</div>
                <div className="text-base font-serif font-bold text-emerald-500">
                  {formatCLP(conciliarModal.total)}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Nº Transacción / Orden Flow (opcional)
                </label>
                <input
                  type="text"
                  value={flowOrderInput}
                  onChange={(e) => setFlowOrderInput(e.target.value)}
                  placeholder="Ej: 187796493"
                  className="w-full p-2.5 rounded-lg border border-border bg-card text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Si dejas este campo vacío, se utilizará el identificador de sesión existente.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Sin duplicidad tributaria (Res. Ex. SII Nº 176/2020)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-200/90">
                  <strong>NO se emitirá una nueva boleta ante el SII.</strong> El comprobante electrónico emitido por Flow {flowOrderInput.trim() ? `(Nº ${flowOrderInput.trim()}) ` : ''}actúa por ley como la boleta de ventas válida. Al conciliar, el sistema registrará la venta en ingresos, descontará el stock y creará la comanda de taller para empaque y despacho.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-card flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConciliarModal(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={conciliarMutation.isPending}
                onClick={() =>
                  conciliarMutation.mutate({
                    buyOrder: conciliarModal.buyOrder,
                    flowOrder: flowOrderInput.trim() || undefined,
                  })
                }
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {conciliarMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Asentar y Activar Pedido</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
