'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  FileText,
  Layers,
  Sparkles,
  Search,
  Upload,
  Loader2,
  Eye,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError, friendlySupabaseError, ImmersiveModal, QRCodeSVG } from '@enjambre/ui';
import { downloadQrSvg, downloadQrPng } from '@/lib/qr-export';

interface ProductoOption {
  id: string;
  nombre: string;
  formato: string | null;
  slug: string | null;
  fotos: string[] | null;
}

interface LoteOption {
  id: string;
  nombre_lote: string;
  variedad_floral: string | null;
}

interface QrItem {
  id: string;
  codigo: string;
  lote_id: string;
  tipo_destino: string | null;
  url_destino: string | null;
  created_at: string;
  activo: boolean | null;
  metadata?: Record<string, unknown> | null;
  productos?: {
    id: string;
    nombre: string;
    formato: string | null;
    slug: string | null;
    fotos: string[] | null;
  } | null;
}

interface EtiquetaArteItem {
  id: string;
  producto_id: string;
  variante_id?: string | null;
  lote_id?: string | null;
  qr_codigo?: string | null;
  nombre: string;
  tipo: string;
  dimensiones_mm: string;
  sustrato: string;
  acabados?: string | null;
  archivo_url: string;
  archivo_nombre: string;
  archivo_tamano_bytes?: number | null;
  archivo_tipo?: string | null;
  version: string;
  notas_imprenta?: string | null;
  estado: string;
  activo: boolean;
  created_at: string;
  productos?: {
    id: string;
    nombre: string;
    formato: string | null;
    fotos: string[] | null;
    slug: string | null;
  } | null;
  producto_variantes?: {
    id: string;
    nombre_variante: string;
    sku: string;
    peso_neto_g: number;
  } | null;
}

export function HubPhygitalView() {
  const apiFetch = useApiFetch();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'qr' | 'etiquetas'>('qr');
  const [tipoVistaQr, setTipoVistaQr] = useState<'oficiales' | 'lotes'>('oficiales');
  const [loading, setLoading] = useState(true);

  const tiendaBase =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_URL_TIENDA) ||
    'https://tienda.obrera-zangano.cl';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (pathname?.includes('/artes') || tabParam === 'etiquetas') {
        setActiveTab('etiquetas');
      } else if (pathname?.includes('/qr') || tabParam === 'qr') {
        setActiveTab('qr');
      }
    }
  }, [pathname]);

  // Datos base
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [qrList, setQrList] = useState<QrItem[]>([]);
  const [etiquetasList, setEtiquetasList] = useState<EtiquetaArteItem[]>([]);

  // Filtros
  const [filtroProducto, setFiltroProducto] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Generador de QR
  const [showGenerarModal, setShowGenerarModal] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState<string>('');
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [tipoDestino, setTipoDestino] = useState<'cata_sensorial' | 'pasaporte_lote' | 'tienda_producto' | 'frasco_autenticidad'>('cata_sensorial');
  const [cantidadQr, setCantidadQr] = useState<number>(1);
  const [qrRecienGenerados, setQrRecienGenerados] = useState<Array<{ codigo: string; url_destino: string }>>([]);

  // Subir / Crear Etiqueta
  const [showSubirModal, setShowSubirModal] = useState(false);
  const [guardandoEtiqueta, setGuardandoEtiqueta] = useState(false);
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState({
    producto_id: '',
    nombre: '',
    tipo: 'frontal' as 'frontal' | 'dorsal' | 'troquel' | 'faja_seguridad' | 'completa' | 'set_completo',
    dimensiones_mm: '140 x 55 mm',
    sustrato: 'Papel autoadhesivo Tintoretto texturado 90g',
    acabados: 'Foil oro metálico, barniz UV sectorizado y serigrafía',
    version: 'v1.0',
    lote_id: '',
    qr_codigo: '',
    notas_imprenta: 'Sangría de 3 mm perimetral. Colores en espacio CMYK (FOGRA39). Capa de troquel identificada en color directo al 100%.',
  });

  // Copia feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Carga inicial
  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Productos y Lotes desde Supabase
      const [resProd, resLotes] = await Promise.all([
        supabase.from('productos').select('id, nombre, formato, slug, fotos').order('nombre'),
        supabase.from('lotes').select('id, nombre_lote, variedad_floral').order('created_at', { ascending: false }),
      ]);

      if (resProd.data) setProductos(resProd.data as ProductoOption[]);
      if (resLotes.data) setLotes(resLotes.data as LoteOption[]);

      // 2. QRs y Etiquetas vía BFF Hono
      const [resQr, resEtiquetas] = await Promise.all([
        apiFetch('/api/phygital/qr?limit=100'),
        apiFetch('/api/phygital/etiquetas'),
      ]);

      if (resQr.ok) {
        const jsonQr = await resQr.json();
        setQrList(jsonQr.data ?? []);
      }
      if (resEtiquetas.ok) {
        const jsonEtiquetas = await resEtiquetas.json();
        setEtiquetasList(jsonEtiquetas.data ?? []);
      }
    } catch (err) {
      console.error(err);
      toast(friendlyError(err, 'Error al cargar el hub phygital'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  // Generar QR
  const handleGenerarQr = async () => {
    if (!selectedProductoId) {
      toast('Selecciona un producto para vincular el QR', { type: 'error' });
      return;
    }
    if (!selectedLoteId) {
      toast('Selecciona un lote de origen para el frasco', { type: 'error' });
      return;
    }

    setGenerando(true);
    try {
      const res = await apiFetch('/api/phygital/qr/generar', {
        method: 'POST',
        body: JSON.stringify({
          producto_id: selectedProductoId,
          lote_id: selectedLoteId,
          tipo_destino: tipoDestino,
          cantidad: cantidadQr,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'No se pudo generar el código QR');
      }

      setQrRecienGenerados(json.data ?? []);
      toast(json.message || 'Códigos QR creados exitosamente', { type: 'success' });
      void cargarDatos();
    } catch (err) {
      toast(friendlyError(err, 'Error al generar código QR'), { type: 'error' });
    } finally {
      setGenerando(false);
    }
  };

  // Subir archivo e insertar ficha de etiqueta
  const handleGuardarEtiqueta = async () => {
    if (!nuevaEtiqueta.producto_id) {
      toast('Selecciona el producto correspondiente', { type: 'error' });
      return;
    }
    if (!nuevaEtiqueta.nombre.trim()) {
      toast('Ingresa un nombre descriptivo para la etiqueta', { type: 'error' });
      return;
    }
    if (!archivoSubido) {
      toast('Debes adjuntar el archivo imprimible (PDF, AI, PSD, SVG o ZIP)', { type: 'error' });
      return;
    }

    setGuardandoEtiqueta(true);
    setUploadProgress(true);

    try {
      // 1. Subir archivo al bucket 'etiquetas' en Supabase Storage
      const extension = archivoSubido.name.split('.').pop()?.toLowerCase() || 'pdf';
      const cleanName = archivoSubido.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const storagePath = `artes/${Date.now()}_${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from('etiquetas')
        .upload(storagePath, archivoSubido, {
          upsert: true,
          cacheControl: '31536000',
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('etiquetas')
        .getPublicUrl(storagePath);

      const archivoUrl = publicUrlData.publicUrl;

      // 2. Registrar en la tabla `etiquetas_artes` vía BFF
      const res = await apiFetch('/api/phygital/etiquetas', {
        method: 'POST',
        body: JSON.stringify({
          ...nuevaEtiqueta,
          archivo_url: archivoUrl,
          archivo_nombre: archivoSubido.name,
          archivo_tamano_bytes: archivoSubido.size,
          archivo_tipo: ['pdf', 'ai', 'psd', 'svg', 'png', 'zip'].includes(extension)
            ? extension
            : 'otro',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Error al guardar ficha técnica');
      }

      toast('Archivo de etiqueta registrado con éxito', { type: 'success' });
      setShowSubirModal(false);
      setArchivoSubido(null);
      setNuevaEtiqueta({
        producto_id: '',
        nombre: '',
        tipo: 'frontal',
        dimensiones_mm: '140 x 55 mm',
        sustrato: 'Papel autoadhesivo Tintoretto texturado 90g',
        acabados: 'Foil oro metálico, barniz UV sectorizado y serigrafía',
        version: 'v1.0',
        lote_id: '',
        qr_codigo: '',
        notas_imprenta: 'Sangría de 3 mm perimetral. Colores en espacio CMYK (FOGRA39). Capa de troquel identificada en color directo al 100%.',
      });
      void cargarDatos();
    } catch (err) {
      console.error(err);
      toast(friendlyError(err, 'Error al subir y guardar la etiqueta'), { type: 'error' });
    } finally {
      setGuardandoEtiqueta(false);
      setUploadProgress(false);
    }
  };

  // Descarga directa de SVG vectorial transparente (sin fondo, foco exclusivo en el QR)
  const descargarSvg = (svgId: string, filename: string) => {
    const ok = downloadQrSvg(svgId, filename);
    if (!ok) {
      toast('No se encontró el elemento vectorial', { type: 'error' });
      return;
    }
    toast('Vector SVG transparente descargado (ideal para Illustrator y Photoshop)', { type: 'success' });
  };

  // Descarga de PNG transparente en alta resolución (300 DPI / 1200px) con foco único al QR
  const descargarPng = async (svgId: string, filename: string) => {
    const ok = await downloadQrPng(svgId, filename, { suffix: '-alta-resolucion' });
    if (!ok) {
      toast('No se pudo procesar la descarga del QR', { type: 'error' });
      return;
    }
    toast('Código QR PNG transparente en 300 DPI descargado', { type: 'success' });
  };

  // Copiar al portapapeles
  const handleCopiar = (texto: string, id: string) => {
    void navigator.clipboard.writeText(texto);
    setCopiedId(id);
    toast('Enlace canónico copiado al portapapeles', { type: 'success' });
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtrado de QRs
  const qrsFiltrados = qrList.filter((item) => {
    if (filtroProducto !== 'todos' && item.productos?.id !== filtroProducto) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchCod = item.codigo.toLowerCase().includes(q);
      const matchLote = item.lote_id.toLowerCase().includes(q);
      const matchProd = item.productos?.nombre?.toLowerCase().includes(q);
      if (!matchCod && !matchLote && !matchProd) return false;
    }
    return true;
  });

  // Filtrado de Etiquetas
  const etiquetasFiltradas = etiquetasList.filter((item) => {
    if (filtroProducto !== 'todos' && item.producto_id !== filtroProducto) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchNom = item.nombre.toLowerCase().includes(q);
      const matchProd = item.productos?.nombre?.toLowerCase().includes(q);
      const matchSust = item.sustrato.toLowerCase().includes(q);
      if (!matchNom && !matchProd && !matchSust) return false;
    }
    return true;
  });

  // Filtrado de Productos Oficiales (para colección de QRs de etiquetas)
  const productosFiltrados = productos.filter((p) => {
    if (filtroProducto !== 'todos' && p.id !== filtroProducto) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchNom = p.nombre.toLowerCase().includes(q);
      const matchSlug = p.slug?.toLowerCase().includes(q) ?? false;
      const matchFormato = p.formato?.toLowerCase().includes(q) ?? false;
      if (!matchNom && !matchSlug && !matchFormato) return false;
    }
    return true;
  });

  return (
    <ViewShell
      title="Packaging & Etiquetas"
      subtitle="Ecosistema físico-digital: colección de QRs oficiales por producto para frascos, bóveda de etiquetas y coordinación de imprenta."
      actions={
        <div className="flex items-center gap-2">
          {activeTab === 'qr' ? (
            <button
              onClick={() => {
                setQrRecienGenerados([]);
                setShowGenerarModal(true);
              }}
              className="btn btn-gold text-xs flex items-center gap-2"
            >
              <Plus size={14} />
              <span>Generar Códigos QR</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSubirModal(true)}
              className="btn btn-gold text-xs flex items-center gap-2"
            >
              <Upload size={14} />
              <span>Subir Archivo de Imprenta</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Banner Explicativo de Filosofía Phygital */}
        <div className="p-5 rounded-2xl bg-surface-raised border border-border/80 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 max-w-2xl">
              <span className="text-[0.65rem] font-mono tracking-widest uppercase text-primary font-semibold flex items-center gap-1.5">
                <Sparkles size={12} /> Ecosistema Físico-Digital
              </span>
              <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                El Frasco Físico como Llave a la Trazabilidad y Cata Sensorial
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada etiqueta impresa porta un código QR vectorial único. Al ser colocado en Photoshop o Illustrator sobre el troquel de producción,
                conecta el néctar envasado con su pasaporte digital oficial, registro sensorial del consumidor y respaldo inmutable.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-background/80 backdrop-blur border border-border rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-2xl font-bold font-mono text-primary">{productos.length}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">QRs Oficiales</div>
              </div>
              <div className="bg-background/80 backdrop-blur border border-border rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-2xl font-bold font-mono text-foreground">{etiquetasList.length}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Artes de Imprenta</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de Navegación del Hub */}
        <div className="flex items-center justify-between border-b border-border gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('qr')}
              className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'qr'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode size={16} />
              <span>Colección de QRs de Productos</span>
              <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
                {tipoVistaQr === 'oficiales' ? productos.length : qrList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('etiquetas')}
              className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'etiquetas'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={16} />
              <span>Bóveda de Etiquetas & Troqueles</span>
              <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
                {etiquetasList.length}
              </span>
            </button>
          </div>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-2 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar producto, código o troquel..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field text-xs pl-8 py-1.5 w-48 sm:w-64"
              />
            </div>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className="input-field text-xs py-1.5 max-w-[180px]"
            >
              <option value="todos">Todos los productos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: COLECCIÓN Y GENERADOR DE CÓDIGOS QR */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            {/* Sub-tabs: QRs Oficiales de Producto vs QRs por Lote */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-raised rounded-xl border border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTipoVistaQr('oficiales')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    tipoVistaQr === 'oficiales'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-surface-sunken text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Tag size={13} />
                  <span>QRs Oficiales de Productos</span>
                  <span className="text-[0.65rem] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
                    {productos.length}
                  </span>
                </button>
                <button
                  onClick={() => setTipoVistaQr('lotes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    tipoVistaQr === 'lotes'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-surface-sunken text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers size={13} />
                  <span>QRs por Lote / Frasco</span>
                  <span className="text-[0.65rem] px-1.5 py-0.2 rounded-full bg-background/20 font-mono">
                    {qrList.length}
                  </span>
                </button>
              </div>
              <p className="text-[0.7rem] text-muted-foreground">
                {tipoVistaQr === 'oficiales'
                  ? 'QRs canónicos de tienda listos para imprimir en etiquetas de catálogo.'
                  : 'QRs vinculados a recolecciones y lotes específicos para cata sensorial.'}
              </p>
            </div>

            {tipoVistaQr === 'oficiales' ? (
              productosFiltrados.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface-raised space-y-3">
                  <p className="text-xs text-muted-foreground">No se encontraron productos coincidentes en el catálogo.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productosFiltrados.map((prod) => {
                    const svgId = `qr-prod-svg-${prod.id}`;
                    const slugOrId = prod.slug || prod.id;
                    const canonUrl = prod.slug
                      ? `${tiendaBase}/q/${encodeURIComponent(prod.slug)}`
                      : `${tiendaBase}/producto/${encodeURIComponent(slugOrId)}?origen=qr`;
                    return (
                      <div
                        key={prod.id}
                        className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 transition-all hover:border-border/80"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <span className="text-[0.6rem] font-mono uppercase tracking-wider text-primary font-semibold block truncate">
                              QR Canónico Oficial
                            </span>
                            <h4 className="text-sm font-semibold text-foreground truncate">{prod.nombre}</h4>
                            {prod.formato && (
                              <span className="text-[0.65rem] text-muted-foreground block font-mono">
                                Formato: {prod.formato}
                              </span>
                            )}
                          </div>
                          <span className="text-[0.6rem] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {prod.formato || 'Etiqueta Oficial'}
                          </span>
                        </div>

                        {/* Renderizado de QR con foco exclusivo en el código */}
                        <div className="flex items-center justify-center p-3.5 bg-white rounded-xl shadow-inner border border-stone-200 w-36 h-36 mx-auto shrink-0">
                          <QRCodeSVG
                            id={svgId}
                            value={canonUrl}
                            size={120}
                            level="H"
                            includeMargin={false}
                            bgColor="transparent"
                            fgColor="#1C1917"
                          />
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border/60">
                          <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground font-mono">
                            <span>Aterrizaje Phygital / QR:</span>
                            <button
                              onClick={() => handleCopiar(canonUrl, `prod-${prod.id}`)}
                              className="hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              {copiedId === `prod-${prod.id}` ? (
                                <Check size={12} className="text-success" />
                              ) : (
                                <Copy size={12} />
                              )}
                              {copiedId === `prod-${prod.id}` ? 'Copiado' : 'Copiar URL'}
                            </button>
                          </div>
                          <div className="truncate text-[0.65rem] font-mono text-muted-foreground/80 bg-surface-sunken p-1.5 rounded flex items-center justify-between gap-1">
                            <span className="truncate">{canonUrl}</span>
                            <a
                              href={canonUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-foreground shrink-0 p-0.5"
                              title="Abrir en tienda"
                            >
                              <ExternalLink size={11} />
                            </a>
                          </div>

                          {/* Botones de descarga para Diseñador / Imprenta */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => descargarSvg(svgId, `QR_OFICIAL_${prod.slug || prod.nombre.replace(/\s+/g, '_')}`)}
                              className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                              title="Vectorial SVG transparente para Adobe Illustrator"
                            >
                              <Download size={12} />
                              <span>Descargar SVG</span>
                            </button>
                            <button
                              onClick={() => descargarPng(svgId, `QR_OFICIAL_${prod.slug || prod.nombre.replace(/\s+/g, '_')}`)}
                              className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                              title="PNG transparente a 300 DPI para Adobe Photoshop"
                            >
                              <Download size={12} />
                              <span>Descargar PNG</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : qrsFiltrados.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface-raised space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <QrCode size={24} />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-medium text-foreground">Aún no hay códigos QR generados</h3>
                  <p className="text-xs text-muted-foreground">
                    Genera el primer código QR phygital para que tu diseñador pueda incorporarlo en el arte final de la etiqueta.
                  </p>
                </div>
                <button
                  onClick={() => setShowGenerarModal(true)}
                  className="btn btn-gold text-xs inline-flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Generar Código para Frasco</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qrsFiltrados.map((item) => {
                  const svgId = `qr-svg-${item.id}`;
                  const canonUrl = item.url_destino || `https://tienda.obrera-zangano.cl/cata/${item.codigo}`;
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4 transition-all hover:border-border/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <span className="text-[0.6rem] font-mono uppercase tracking-wider text-primary font-semibold block truncate">
                            Lote: {item.lote_id}
                          </span>
                          <h4 className="text-sm font-semibold text-foreground truncate">
                            {item.productos?.nombre ?? 'Producto vinculado'}
                          </h4>
                          <span className="text-[0.65rem] text-muted-foreground block font-mono">
                            Destino: {item.tipo_destino ?? 'cata_sensorial'}
                          </span>
                        </div>
                        <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-surface-sunken text-foreground/80 border border-border shrink-0">
                          {item.codigo}
                        </span>
                      </div>

                      {/* Renderizado de QR con foco exclusivo en el código */}
                      <div className="flex items-center justify-center p-3.5 bg-white rounded-xl shadow-inner border border-stone-200 w-36 h-36 mx-auto shrink-0">
                        <QRCodeSVG
                          id={svgId}
                          value={canonUrl}
                          size={120}
                          level="H"
                          includeMargin={false}
                          bgColor="transparent"
                          fgColor="#1C1917"
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground font-mono">
                          <span>URL Canónica:</span>
                          <button
                            onClick={() => handleCopiar(canonUrl, item.id)}
                            className="hover:text-foreground flex items-center gap-1 transition-colors"
                          >
                            {copiedId === item.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                            {copiedId === item.id ? 'Copiado' : 'Copiar URL'}
                          </button>
                        </div>
                        <div className="truncate text-[0.65rem] font-mono text-muted-foreground/80 bg-surface-sunken p-1.5 rounded">
                          {canonUrl}
                        </div>

                        {/* Botones de descarga para Photoshop / Illustrator */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => descargarSvg(svgId, `QR_${item.codigo}`)}
                            className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                            title="Vectorial SVG transparente para Adobe Illustrator"
                          >
                            <Download size={12} />
                            <span>Descargar SVG</span>
                          </button>
                          <button
                            onClick={() => descargarPng(svgId, `QR_${item.codigo}`)}
                            className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                            title="PNG transparente a 300 DPI para Adobe Photoshop"
                          >
                            <Download size={12} />
                            <span>Descargar PNG</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FICHAS DE ETIQUETAS & ARCHIVOS IMPRIMIBLES */}
        {activeTab === 'etiquetas' && (
          <div className="space-y-4">
            {etiquetasFiltradas.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface-raised space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={24} />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-base font-medium text-foreground">No hay archivos de imprenta registrados</h3>
                  <p className="text-xs text-muted-foreground">
                    Sube el archivo maestro (PDF de imprenta con curvas, troquel, PSD o vector) para que la imprenta y el diseñador puedan descargarlo directamente.
                  </p>
                </div>
                <button
                  onClick={() => setShowSubirModal(true)}
                  className="btn btn-gold text-xs inline-flex items-center gap-2"
                >
                  <Upload size={14} />
                  <span>Subir Archivo de Etiqueta</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {etiquetasFiltradas.map((et) => (
                  <div
                    key={et.id}
                    className="p-5 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.6rem] font-mono uppercase tracking-wider text-primary font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                            {et.tipo} · {et.version}
                          </span>
                          <span className="text-[0.6rem] font-mono uppercase tracking-wider text-success flex items-center gap-1">
                            <CheckCircle2 size={10} /> {et.estado.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-foreground truncate">{et.nombre}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          Producto: {et.productos?.nombre ?? 'Sin especificar'} {et.productos?.formato ? `(${et.productos.formato})` : ''}
                        </p>
                      </div>
                      <span className="text-[0.65rem] font-mono uppercase px-2 py-1 rounded bg-surface-sunken text-muted-foreground border border-border shrink-0">
                        .{et.archivo_tipo ?? 'pdf'}
                      </span>
                    </div>

                    {/* Ficha de Especificaciones de Producción */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-surface-sunken p-3 rounded-lg border border-border/60">
                      <div>
                        <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider block">Medidas / Troquel</span>
                        <strong className="text-foreground font-mono">{et.dimensiones_mm}</strong>
                      </div>
                      <div>
                        <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider block">Sustrato / Papel</span>
                        <strong className="text-foreground text-[0.7rem] line-clamp-1">{et.sustrato}</strong>
                      </div>
                      {et.acabados && (
                        <div className="col-span-2 pt-1 border-t border-border/40">
                          <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider block">Acabados Especiales</span>
                          <span className="text-foreground text-[0.7rem]">{et.acabados}</span>
                        </div>
                      )}
                      {et.qr_codigo && (
                        <div className="col-span-2 pt-1 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">QR Incrustado:</span>
                          <code className="text-[0.65rem] text-primary font-mono">{et.qr_codigo}</code>
                        </div>
                      )}
                    </div>

                    {et.notas_imprenta && (
                      <p className="text-[0.7rem] text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                        «{et.notas_imprenta}»
                      </p>
                    )}

                    {/* Botón de Descarga del Archivo Imprimible */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-[0.65rem] font-mono text-muted-foreground">
                        {et.archivo_nombre}
                        {et.archivo_tamano_bytes ? ` · ${(et.archivo_tamano_bytes / (1024 * 1024)).toFixed(2)} MB` : ''}
                      </span>
                      <a
                        href={et.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={et.archivo_nombre}
                        className="btn btn-gold text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <Download size={13} />
                        <span>Descargar Archivo</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: GENERADOR DE CÓDIGOS QR */}
      <ImmersiveModal
        open={showGenerarModal}
        onClose={() => setShowGenerarModal(false)}
        eyebrow="Trazabilidad Phygital"
        title="Generador de Códigos QR para Frascos"
        size="md"
        footer={
          <>
            <button onClick={() => setShowGenerarModal(false)} className="btn btn-outline text-xs">
              Cerrar
            </button>
            <button
              onClick={handleGenerarQr}
              disabled={generando || !selectedProductoId || !selectedLoteId}
              className="btn btn-gold text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {generando ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
              <span>Generar y Almacenar</span>
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Genera códigos QR de alta densidad vinculados a los frascos reales. Quedan registrados permanentemente en la base de datos para que el diseñador e imprenta los inserten en el troquel.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Producto correspondiente *
              </label>
              <select
                value={selectedProductoId}
                onChange={(e) => setSelectedProductoId(e.target.value)}
                className="input-field text-xs w-full"
              >
                <option value="">Selecciona un producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.formato ? `(${p.formato})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Lote de Origen *
                </label>
                <select
                  value={selectedLoteId}
                  onChange={(e) => setSelectedLoteId(e.target.value)}
                  className="input-field text-xs w-full"
                >
                  <option value="">Selecciona lote...</option>
                  {lotes.map((l) => (
                    <option key={l.id} value={l.nombre_lote}>
                      {l.nombre_lote} {l.variedad_floral ? `· ${l.variedad_floral}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Cantidad de QRs a generar
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={cantidadQr}
                  onChange={(e) => setCantidadQr(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className="input-field text-xs w-full font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Destino del Escaneo (Experiencia Digital)
              </label>
              <select
                value={tipoDestino}
                onChange={(e) => setTipoDestino(e.target.value as typeof tipoDestino)}
                className="input-field text-xs w-full"
              >
                <option value="cata_sensorial">Cata Sensorial & Reseña de Cliente (/cata/[codigo])</option>
                <option value="pasaporte_lote">Pasaporte Público del Lote (/lote/[id])</option>
                <option value="tienda_producto">Ficha de Producto en Tienda (/producto/[slug])</option>
                <option value="frasco_autenticidad">Sello de Autenticidad Digital</option>
              </select>
            </div>
          </div>

          {qrRecienGenerados.length > 0 && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30 space-y-3 animate-in">
              <div className="flex items-center gap-2 text-xs font-semibold text-success">
                <CheckCircle2 size={16} />
                <span>{qrRecienGenerados.length} código(s) generado(s) y almacenado(s)</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {qrRecienGenerados.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-background/80 border border-border flex items-center justify-between text-xs">
                    <div>
                      <strong className="font-mono text-foreground text-xs">{item.codigo}</strong>
                      <span className="text-[0.65rem] text-muted-foreground block truncate max-w-xs">{item.url_destino}</span>
                    </div>
                    <button
                      onClick={() => handleCopiar(item.url_destino, item.codigo)}
                      className="btn btn-outline text-[0.65rem] py-1 px-2 shrink-0 flex items-center gap-1"
                    >
                      {copiedId === item.codigo ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                      <span>Copiar URL</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ImmersiveModal>

      {/* MODAL: SUBIR FICHA DE ETIQUETA & ARTE IMPRIMIBLE */}
      <ImmersiveModal
        open={showSubirModal}
        onClose={() => setShowSubirModal(false)}
        eyebrow="Producción de Imprenta"
        title="Subir Archivo de Etiqueta & Especificaciones"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowSubirModal(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button
              onClick={handleGuardarEtiqueta}
              disabled={guardandoEtiqueta || !archivoSubido || !nuevaEtiqueta.producto_id || !nuevaEtiqueta.nombre}
              className="btn btn-gold text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {guardandoEtiqueta ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>Guardar y Publicar en Imprenta</span>
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sube el archivo maestro (PDF de curvas, AI, PSD, SVG o ZIP con troquel) para ponerlo a disposición del diseñador y de la imprenta.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Producto asociado *
              </label>
              <select
                value={nuevaEtiqueta.producto_id}
                onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, producto_id: e.target.value }))}
                className="input-field text-xs w-full"
              >
                <option value="">Selecciona un producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.formato ? `(${p.formato})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Nombre del Arte / Pieza *
              </label>
              <input
                type="text"
                placeholder="Ej: Etiqueta Frontal 330g - Miel de Ulmo Virgen"
                value={nuevaEtiqueta.nombre}
                onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, nombre: e.target.value }))}
                className="input-field text-xs w-full"
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Tipo de Etiqueta
              </label>
              <select
                value={nuevaEtiqueta.tipo}
                onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, tipo: e.target.value as typeof nuevaEtiqueta.tipo }))}
                className="input-field text-xs w-full"
              >
                <option value="frontal">Etiqueta Frontal</option>
                <option value="dorsal">Etiqueta Dorsal / Información Nutricional</option>
                <option value="faja_seguridad">Faja de Seguridad / Sello de Tapa</option>
                <option value="troquel">Plano de Troquel y Cuchilla</option>
                <option value="completa">Envolvente Completa</option>
                <option value="set_completo">Set Completo de Producción</option>
              </select>
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Dimensiones Exactas (Ancho x Alto mm) *
              </label>
              <input
                type="text"
                placeholder="Ej: 140 x 55 mm"
                value={nuevaEtiqueta.dimensiones_mm}
                onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, dimensiones_mm: e.target.value }))}
                className="input-field text-xs w-full font-mono"
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Sustrato / Papel Recomendado
              </label>
              <input
                type="text"
                placeholder="Ej: Papel autoadhesivo Tintoretto texturado 90g"
                value={nuevaEtiqueta.sustrato}
                onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, sustrato: e.target.value }))}
                className="input-field text-xs w-full"
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Acabados Especiales
              </label>
              <input
                type="text"
                placeholder="Ej: Foil oro metálico, barniz UV sectorizado"
                value={nuevaEtiqueta.acabados}
                onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, acabados: e.target.value }))}
                className="input-field text-xs w-full"
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Versión del Arte
              </label>
              <input
                type="text"
                placeholder="v1.0"
                value={nuevaEtiqueta.version}
                onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, version: e.target.value }))}
                className="input-field text-xs w-full font-mono"
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                QR Oficial Asignado (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: OZ-2026-X8K2"
                value={nuevaEtiqueta.qr_codigo}
                onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, qr_codigo: e.target.value }))}
                className="input-field text-xs w-full font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
              Notas Técnicas para la Imprenta
            </label>
            <textarea
              rows={2}
              value={nuevaEtiqueta.notas_imprenta}
              onChange={(e) => setNuevaEtiqueta((p) => ({ ...p, notas_imprenta: e.target.value }))}
              className="input-field text-xs w-full resize-none"
              placeholder="Instrucciones de sangría, perfiles de color, tolerancias de troquelado..."
            />
          </div>

          {/* Selector de Archivo Imprimible */}
          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
              Archivo Imprimible Maestro (PDF, AI, PSD, SVG o ZIP, máx. 50 MB) *
            </label>
            <div className="p-4 border-2 border-dashed border-border rounded-xl bg-surface-sunken text-center space-y-2">
              <input
                type="file"
                accept=".pdf,.ai,.psd,.svg,.png,.zip"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setArchivoSubido(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="file-upload-etiqueta"
              />
              <label
                htmlFor="file-upload-etiqueta"
                className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <Upload size={14} />
                <span>{archivoSubido ? 'Cambiar archivo seleccionado' : 'Seleccionar archivo desde el equipo'}</span>
              </label>
              {archivoSubido ? (
                <div className="text-xs font-mono text-foreground flex items-center justify-center gap-2 pt-1">
                  <CheckCircle2 size={14} className="text-success" />
                  <span>{archivoSubido.name}</span>
                  <span className="text-muted-foreground">({(archivoSubido.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              ) : (
                <p className="text-[0.65rem] text-muted-foreground">Formatos vectoriales o listos para imprenta con sangría.</p>
              )}
            </div>
          </div>
        </div>
      </ImmersiveModal>
    </ViewShell>
  );
}
