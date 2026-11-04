'use client';

import { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Image as ImageIcon,
  FileText,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Layers,
  ZoomIn,
  Search,
  Check,
  Copy,
  Info,
  ArrowDownToLine,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Link as LinkIcon,
  Tag,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import {
  toast,
  friendlyError,
  ImmersiveModal,
  ConfirmDialog,
  EmptyState,
  QRCodeSVG,
} from '@enjambre/ui';
import { downloadQrSvg, downloadQrPng } from '@/lib/qr-export';
import { PortalImprentaSkeleton } from '@/components/shared/skeletons';

interface ProductoGaleria {
  id: string;
  nombre: string;
  formato: string | null;
  fotos: string[] | null;
  slug: string | null;
  categoria: string | null;
  descripcion_corta: string | null;
  peso_neto_g: number | null;
  producto_variantes?: Array<{
    id: string;
    nombre_variante: string;
    sku: string;
    peso_neto_g: number;
    tipo_variante: string;
    ingrediente_fortificante: string | null;
  }>;
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

interface QrItem {
  id: string;
  codigo: string;
  lote_id: string;
  tipo_destino: string | null;
  url_destino: string | null;
  created_at: string;
  productos?: {
    id: string;
    nombre: string;
    formato: string | null;
    slug?: string | null;
  } | null;
}

interface EtiquetaFormData {
  producto_id: string;
  nombre: string;
  tipo: 'frontal' | 'dorsal' | 'troquel' | 'faja_seguridad' | 'completa' | 'set_completo';
  dimensiones_mm: string;
  sustrato: string;
  acabados: string;
  version: string;
  qr_codigo: string;
  notas_imprenta: string;
}

const FORM_INICIAL: EtiquetaFormData = {
  producto_id: '',
  nombre: '',
  tipo: 'frontal',
  dimensiones_mm: '140 x 55 mm',
  sustrato: 'Papel autoadhesivo Tintoretto texturado 90g',
  acabados: 'Foil oro metálico, barniz UV sectorizado y serigrafía',
  version: 'v1.0',
  qr_codigo: '',
  notas_imprenta:
    'Sangría de 3 mm perimetral. Colores en espacio CMYK (FOGRA39). Capa de troquel identificada en color directo al 100%.',
};

export function PortalImprentaView() {
  const apiFetch = useApiFetch();
  const [activeTab, setActiveTab] = useState<'fotos' | 'etiquetas' | 'archivos' | 'qr'>('fotos');
  const [subTabQr, setSubTabQr] = useState<'productos' | 'lotes'>('productos');
  const [loading, setLoading] = useState(true);

  const [productos, setProductos] = useState<ProductoGaleria[]>([]);
  const [etiquetas, setEtiquetas] = useState<EtiquetaArteItem[]>([]);
  const [qrs, setQrs] = useState<QrItem[]>([]);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('todos');

  // Modal para zoom de foto
  const [fotoEnZoom, setFotoEnZoom] = useState<{ url: string; titulo: string } | null>(null);

  // Copia feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal de subida y edición de arte/etiqueta
  const [showSubirModal, setShowSubirModal] = useState(false);
  const [etiquetaEnEdicion, setEtiquetaEnEdicion] = useState<EtiquetaArteItem | null>(null);
  const [formEtiqueta, setFormEtiqueta] = useState<EtiquetaFormData>(FORM_INICIAL);
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [modoArchivo, setModoArchivo] = useState<'archivo' | 'url'>('archivo');
  const [urlExterna, setUrlExterna] = useState('');
  const [guardandoEtiqueta, setGuardandoEtiqueta] = useState(false);

  // Eliminación con confirmación
  const [etiquetaAEliminar, setEtiquetaAEliminar] = useState<EtiquetaArteItem | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const rawTienda = typeof process !== 'undefined' ? (process.env?.NEXT_PUBLIC_URL_TIENDA || process.env?.NEXT_PUBLIC_TIENDA_URL) : undefined;
  const tiendaBase = (
    rawTienda && !rawTienda.includes('localhost') && !rawTienda.includes('obrera-zangano.cl')
      ? rawTienda
      : 'https://obrerayzangano.cl'
  ).replace(/\/$/, '');

  const cargarPortal = async () => {
    setLoading(true);
    try {
      const [resProd, resEtiquetas, resQr] = await Promise.all([
        apiFetch('/api/phygital/productos-galeria'),
        apiFetch('/api/phygital/etiquetas'),
        apiFetch('/api/phygital/qr?limit=60'),
      ]);

      if (resProd.ok) {
        const json = await resProd.json();
        setProductos(json.data ?? []);
      }
      if (resEtiquetas.ok) {
        const json = await resEtiquetas.json();
        setEtiquetas(json.data ?? []);
      }
      if (resQr.ok) {
        const json = await resQr.json();
        setQrs(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
      toast(friendlyError(err, 'Error al cargar recursos de imprenta'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarPortal();
  }, []);

  // Apertura de modal para nuevo arte
  const abrirModalSubir = (productoIdDefecto?: string) => {
    setEtiquetaEnEdicion(null);
    setArchivoSubido(null);
    setUrlExterna('');
    setModoArchivo('archivo');

    const prodId = productoIdDefecto || (productos[0]?.id ?? '');
    const prodNombre = productos.find((p) => p.id === prodId)?.nombre ?? '';

    setFormEtiqueta({
      ...FORM_INICIAL,
      producto_id: prodId,
      nombre: prodNombre ? `Etiqueta Frontal - ${prodNombre}` : '',
    });
    setShowSubirModal(true);
  };

  // Apertura de modal para editar arte existente
  const abrirModalEditar = (et: EtiquetaArteItem) => {
    setEtiquetaEnEdicion(et);
    setArchivoSubido(null);
    setUrlExterna(et.archivo_url || '');
    setModoArchivo(et.archivo_url?.startsWith('http') ? 'url' : 'archivo');
    setFormEtiqueta({
      producto_id: et.producto_id,
      nombre: et.nombre,
      tipo: (et.tipo as EtiquetaFormData['tipo']) || 'frontal',
      dimensiones_mm: et.dimensiones_mm,
      sustrato: et.sustrato,
      acabados: et.acabados || '',
      version: et.version,
      qr_codigo: et.qr_codigo || '',
      notas_imprenta: et.notas_imprenta || '',
    });
    setShowSubirModal(true);
  };

  // Guardar / Subir arte de etiqueta
  const handleGuardarEtiqueta = async () => {
    if (!formEtiqueta.producto_id) {
      toast('Selecciona el producto correspondiente', { type: 'error' });
      return;
    }
    if (!formEtiqueta.nombre.trim()) {
      toast('Ingresa un nombre descriptivo para el arte o etiqueta', { type: 'error' });
      return;
    }
    if (modoArchivo === 'archivo' && !archivoSubido && !etiquetaEnEdicion) {
      toast('Debes adjuntar el archivo imprimible maestro (PDF, AI, PSD, SVG o ZIP)', { type: 'error' });
      return;
    }
    if (modoArchivo === 'url' && !urlExterna.trim() && !etiquetaEnEdicion) {
      toast('Ingresa la URL del archivo o repositorio en la nube', { type: 'error' });
      return;
    }

    setGuardandoEtiqueta(true);
    try {
      let finalUrl = etiquetaEnEdicion?.archivo_url || '';
      let finalNombre = etiquetaEnEdicion?.archivo_nombre || '';
      let finalTamano = etiquetaEnEdicion?.archivo_tamano_bytes || 0;
      let finalTipo = etiquetaEnEdicion?.archivo_tipo || 'pdf';

      if (modoArchivo === 'archivo' && archivoSubido) {
        const ext = archivoSubido.name.split('.').pop()?.toLowerCase() || 'pdf';
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

        finalUrl = publicUrlData.publicUrl;
        finalNombre = archivoSubido.name;
        finalTamano = archivoSubido.size;
        finalTipo = ['pdf', 'ai', 'psd', 'svg', 'png', 'zip'].includes(ext) ? ext : 'otro';
      } else if (modoArchivo === 'url' && urlExterna.trim()) {
        finalUrl = urlExterna.trim();
        finalNombre = formEtiqueta.nombre;
        const urlExt = finalUrl.split('.').pop()?.split(/[?#]/)[0]?.toLowerCase() || 'pdf';
        finalTipo = ['pdf', 'ai', 'psd', 'svg', 'png', 'zip'].includes(urlExt) ? urlExt : 'otro';
      }

      const payload = {
        ...(etiquetaEnEdicion ? { id: etiquetaEnEdicion.id } : {}),
        producto_id: formEtiqueta.producto_id,
        nombre: formEtiqueta.nombre.trim(),
        tipo: formEtiqueta.tipo,
        dimensiones_mm: formEtiqueta.dimensiones_mm.trim(),
        sustrato: formEtiqueta.sustrato.trim(),
        acabados: formEtiqueta.acabados.trim() || null,
        version: formEtiqueta.version.trim() || 'v1.0',
        qr_codigo: formEtiqueta.qr_codigo.trim() || null,
        notas_imprenta: formEtiqueta.notas_imprenta.trim() || null,
        archivo_url: finalUrl,
        archivo_nombre: finalNombre,
        archivo_tamano_bytes: finalTamano,
        archivo_tipo: finalTipo,
        estado: 'aprobado_imprenta',
        activo: true,
      };

      const res = await apiFetch('/api/phygital/etiquetas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Error al guardar arte');
      }

      toast(
        etiquetaEnEdicion
          ? 'Ficha y arte de etiqueta actualizados con éxito'
          : 'Arte imprimible subido y registrado con éxito en el portal',
        { type: 'success' }
      );
      setShowSubirModal(false);
      void cargarPortal();
    } catch (err) {
      console.error(err);
      toast(friendlyError(err, 'Error al subir o registrar el arte'), { type: 'error' });
    } finally {
      setGuardandoEtiqueta(false);
    }
  };

  // Eliminar arte de etiqueta
  const handleEliminarEtiqueta = async () => {
    if (!etiquetaAEliminar) return;
    setEliminando(true);
    try {
      const res = await apiFetch(`/api/phygital/etiquetas/${etiquetaAEliminar.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'No se pudo eliminar el arte');
      }
      toast('Arte final y ficha eliminados de la bóveda', { type: 'success' });
      setEtiquetaAEliminar(null);
      void cargarPortal();
    } catch (err) {
      console.error(err);
      toast(friendlyError(err, 'Error al eliminar el arte'), { type: 'error' });
    } finally {
      setEliminando(false);
    }
  };

  // Descarga SVG transparente
  const descargarSvg = (svgId: string, filename: string) => {
    const ok = downloadQrSvg(svgId, filename);
    if (!ok) {
      toast('No se encontró el elemento vectorial', { type: 'error' });
      return;
    }
    toast('Vector SVG transparente descargado listo para Illustrator / Photoshop', { type: 'success' });
  };

  // Descarga PNG transparente 300 DPI
  const descargarPng = async (svgId: string, filename: string) => {
    const ok = await downloadQrPng(svgId, filename, { suffix: '-300dpi' });
    if (!ok) {
      toast('Error al descargar PNG', { type: 'error' });
      return;
    }
    toast('PNG transparente a 300 DPI descargado', { type: 'success' });
  };

  const handleCopiar = (texto: string, id: string) => {
    void navigator.clipboard.writeText(texto);
    setCopiedCode(id);
    toast('Código o enlace copiado al portapapeles', { type: 'success' });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtrado de productos
  const productosFiltrados = productos.filter((p) => {
    if (filtroProducto !== 'todos' && p.id !== filtroProducto) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchNom = p.nombre.toLowerCase().includes(q);
      const matchForm = p.formato?.toLowerCase().includes(q);
      if (!matchNom && !matchForm) return false;
    }
    return true;
  });

  // Filtrado de etiquetas
  const etiquetasFiltradas = etiquetas.filter((e) => {
    if (filtroProducto !== 'todos' && e.producto_id !== filtroProducto) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchNom = e.nombre.toLowerCase().includes(q);
      const matchProd = e.productos?.nombre?.toLowerCase().includes(q);
      if (!matchNom && !matchProd) return false;
    }
    return true;
  });

  // Filtrado de QRs de lote
  const qrsFiltrados = qrs.filter((item) => {
    if (filtroProducto !== 'todos' && item.productos && item.productos.id !== filtroProducto) {
      return false;
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchCod = item.codigo.toLowerCase().includes(q);
      const matchProd = item.productos?.nombre?.toLowerCase().includes(q) ?? false;
      const matchLote = item.lote_id?.toLowerCase().includes(q) ?? false;
      if (!matchCod && !matchProd && !matchLote) return false;
    }
    return true;
  });

  const totalQrsDisponibles = productos.length + qrs.length;

  if (loading) {
    return <PortalImprentaSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ViewShell
        eyebrow="Packaging & Etiquetas"
        title="Portal Imprenta"
        subtitle="Recursos de producción para frascos y etiquetas: mockups, troqueles, QRs vectoriales y artes maestros de imprenta."
        icon={<Printer size={20} />}
        actions={
          <button
            onClick={() => abrirModalSubir()}
            className="btn btn-gold text-xs py-2 px-3.5 flex items-center gap-2 shadow-sm font-medium"
          >
            <Upload size={14} />
            <span>Subir Arte Imprimible</span>
          </button>
        }
      />

        {/* Barra de Pestañas & Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border gap-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('fotos')}
              className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'fotos'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon size={16} />
              <span>Fotos de Productos</span>
              <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
                {productos.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('etiquetas')}
              className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'etiquetas'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers size={16} />
              <span>Etiquetas de Cada Uno</span>
              <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
                {etiquetas.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('archivos')}
              className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'archivos'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownToLine size={16} />
              <span>Archivos Imprimibles para Descargar</span>
              <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
                {etiquetas.filter((e) => e.archivo_url).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`pb-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                activeTab === 'qr'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode size={16} />
              <span>QRs Vectoriales</span>
              <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
                {totalQrsDisponibles}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field text-xs pl-9 py-1.5 w-full sm:w-56"
              />
            </div>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className="input-field text-xs py-1.5 w-full sm:w-auto max-w-[160px]"
            >
              <option value="todos">Todos los frascos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. SECCIÓN: FOTOS DE PRODUCTOS */}
        {activeTab === 'fotos' && (
          <div className="space-y-6">
            {productosFiltrados.length === 0 ? (
              <EmptyState
                theme="oro"
                icon={<ImageIcon className="w-10 h-10 text-primary" />}
                title="No se encontraron frascos ni productos"
                description="Prueba con otro término de búsqueda o cambia el filtro de producto seleccionado."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productosFiltrados.map((prod) => {
                const fotoPrincipal = prod.fotos && prod.fotos.length > 0 ? prod.fotos[0] : null;
                const otrasFotos = prod.fotos && prod.fotos.length > 1 ? prod.fotos.slice(1) : [];
                const artesDelProducto = etiquetas.filter((e) => e.producto_id === prod.id);

                return (
                  <div
                    key={prod.id}
                    className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm flex flex-col justify-between hover:border-border/80 transition-all"
                  >
                    <div>
                      {/* Imagen Principal */}
                      <div className="aspect-square bg-surface-sunken relative overflow-hidden group">
                        {fotoPrincipal ? (
                          <>
                            <img
                              src={fotoPrincipal}
                              alt={prod.nombre}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => setFotoEnZoom({ url: fotoPrincipal, titulo: prod.nombre })}
                                className="btn btn-gold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-lg"
                              >
                                <ZoomIn size={14} />
                                <span>Ver en Detalle</span>
                              </button>
                              <a
                                href={fotoPrincipal}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={`${prod.slug ?? 'frasco'}-principal.webp`}
                                className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-lg"
                              >
                                <Download size={14} />
                                <span>Descargar</span>
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon size={32} className="opacity-40 mb-2" />
                            <span className="text-xs">Sin fotografía cargada</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-background/80 backdrop-blur border border-border text-foreground font-semibold">
                          {prod.formato ?? 'Frasco'}
                        </span>
                      </div>

                      {/* Miniaturas Secundarias */}
                      {otrasFotos.length > 0 && (
                        <div className="p-3 bg-surface-sunken/50 border-t border-border flex items-center gap-2 overflow-x-auto">
                          {otrasFotos.map((foto, idx) => (
                            <button
                              key={idx}
                              onClick={() => setFotoEnZoom({ url: foto, titulo: `${prod.nombre} - Ángulo ${idx + 2}` })}
                              className="w-12 h-12 rounded-lg border border-border overflow-hidden shrink-0 hover:border-primary transition-colors"
                            >
                              <img src={foto} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-base text-foreground line-clamp-1">{prod.nombre}</h3>
                        {prod.descripcion_corta && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {prod.descripcion_corta}
                          </p>
                        )}
                        {prod.peso_neto_g ? (
                          <div className="text-[0.7rem] font-mono text-primary font-medium">
                            Peso Neto: {prod.peso_neto_g}g
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Especificaciones de Variantes */}
                    {prod.producto_variantes && prod.producto_variantes.length > 0 && (
                      <div className="p-4 pt-0 border-t border-border/40 space-y-1">
                        <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                          Formatos / Variantes disponibles:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {prod.producto_variantes.map((v) => (
                            <span
                              key={v.id}
                              className="text-[0.65rem] font-mono px-1.5 py-0.5 rounded bg-surface-sunken border border-border text-muted-foreground"
                            >
                              {v.nombre_variante}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vínculo de Artes de Imprenta & Botón de Subida */}
                    <div className="p-3 border-t border-border flex items-center justify-between gap-2 bg-surface-sunken/40">
                      <div className="text-[0.7rem] text-muted-foreground flex items-center gap-1.5 min-w-0">
                        <Layers size={13} className={artesDelProducto.length > 0 ? 'text-primary' : 'text-muted-foreground/60'} />
                        <span className="truncate">
                          {artesDelProducto.length === 0
                            ? 'Sin artes finales'
                            : `${artesDelProducto.length} arte(s) registrado(s)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {artesDelProducto.length > 0 && (
                          <button
                            onClick={() => {
                              setFiltroProducto(prod.id);
                              setActiveTab('etiquetas');
                            }}
                            className="btn btn-outline text-[0.65rem] py-1 px-2"
                            title="Ver artes de este frasco"
                          >
                            <span>Ver</span>
                          </button>
                        )}
                        <button
                          onClick={() => abrirModalSubir(prod.id)}
                          className="btn btn-gold text-[0.65rem] py-1 px-2.5 flex items-center gap-1 shadow-sm"
                          title="Subir archivo imprimible para este frasco"
                        >
                          <Upload size={11} />
                          <span>Subir Arte</span>
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

        {/* 2. SECCIÓN: ETIQUETAS DE CADA UNO */}
        {activeTab === 'etiquetas' && (
          <div className="space-y-6">
            {etiquetasFiltradas.length === 0 ? (
              <EmptyState
                theme="oro"
                icon={<Layers className="w-10 h-10 text-primary" />}
                title="No hay fichas de etiquetas ni artes registrados"
                description="Sube las especificaciones técnicas, planos de troquel y artes maestros para que la imprenta y el equipo de diseño cuenten con los archivos oficiales de cada frasco."
                action={
                  <button
                    onClick={() => abrirModalSubir(filtroProducto !== 'todos' ? filtroProducto : undefined)}
                    className="btn btn-gold text-xs py-2 px-4 flex items-center gap-2 shadow-sm font-medium"
                  >
                    <Upload size={14} />
                    <span>Subir Primer Arte Imprimible</span>
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {etiquetasFiltradas.map((et) => {
                  const qrSvgId = `portal-qr-${et.id}`;
                  const qrCodeValue = et.qr_codigo
                    ? `${tiendaBase}/cata/${et.qr_codigo}`
                    : `${tiendaBase}/producto/${et.productos?.slug ?? ''}`;

                  return (
                    <div
                      key={et.id}
                      className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[0.6rem] font-mono uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                              {et.tipo.toUpperCase()} · {et.version}
                            </span>
                            <h3 className="text-lg font-display font-medium text-foreground">{et.nombre}</h3>
                            <p className="text-xs text-muted-foreground">
                              Frasco / Envase: <strong className="text-foreground">{et.productos?.nombre ?? 'General'}</strong>
                            </p>
                          </div>
                          <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-md bg-surface-sunken text-foreground border border-border font-bold">
                            .{et.archivo_tipo ?? 'pdf'}
                          </span>
                        </div>

                        {/* Cuadrícula de Especificaciones */}
                        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-surface-sunken border border-border/80 text-xs">
                          <div>
                            <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                              Medidas de Troquel
                            </span>
                            <strong className="text-foreground font-mono text-sm">{et.dimensiones_mm}</strong>
                          </div>
                          <div>
                            <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                              Sustrato / Papel
                            </span>
                            <strong className="text-foreground line-clamp-1">{et.sustrato}</strong>
                          </div>
                          {et.acabados && (
                            <div className="col-span-2 pt-2 border-t border-border/40">
                              <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                                Acabados & Tintas
                              </span>
                              <span className="text-foreground text-[0.75rem]">{et.acabados}</span>
                            </div>
                          )}
                          {et.notas_imprenta && (
                            <div className="col-span-2 pt-2 border-t border-border/40">
                              <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground font-semibold block">
                                Notas de Imprenta
                              </span>
                              <span className="text-muted-foreground italic text-[0.7rem]">«{et.notas_imprenta}»</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Previsualización del QR y Descarga Vectorial */}
                      <div className="p-4 rounded-xl bg-background border border-border flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm border border-stone-200 shrink-0 w-[84px] h-[84px] flex items-center justify-center">
                            <QRCodeSVG
                              id={qrSvgId}
                              value={qrCodeValue}
                              size={68}
                              level="H"
                              includeMargin={false}
                              bgColor="transparent"
                              fgColor="#1C1917"
                            />
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[0.6rem] uppercase tracking-wider text-primary font-semibold block">
                              QR Para Incrustar
                            </span>
                            <strong className="text-xs font-mono text-foreground truncate block">
                              {et.qr_codigo || 'Canónico de Producto'}
                            </strong>
                            <span className="text-[0.65rem] text-muted-foreground block truncate">
                              Listo para colocar en Photoshop
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => descargarSvg(qrSvgId, `QR_${et.qr_codigo || et.nombre}`)}
                            className="btn btn-outline text-[0.65rem] py-1 px-2.5 flex items-center gap-1"
                          >
                            <Download size={11} />
                            <span>Descargar SVG</span>
                          </button>
                          <button
                            onClick={() => descargarPng(qrSvgId, `QR_${et.qr_codigo || et.nombre}`)}
                            className="btn btn-outline text-[0.65rem] py-1 px-2.5 flex items-center gap-1"
                          >
                            <Download size={11} />
                            <span>Descargar PNG</span>
                          </button>
                        </div>
                      </div>

                      {/* Botón de Descarga del Archivo Maestro + Acciones */}
                      <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirModalEditar(et)}
                            className="btn btn-outline text-xs py-1.5 px-2.5 flex items-center gap-1.5"
                            title="Editar ficha técnica o enlace del arte"
                          >
                            <Edit3 size={12} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => setEtiquetaAEliminar(et)}
                            className="btn btn-outline text-xs py-1.5 px-2.5 flex items-center gap-1.5 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                            title="Eliminar este arte de la bóveda"
                          >
                            <Trash2 size={12} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                        <a
                          href={et.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={et.archivo_nombre}
                          className="btn btn-gold text-xs py-2 px-4 flex items-center gap-2 shadow-sm font-medium"
                        >
                          <Download size={14} />
                          <span>Descargar Archivo Imprimible</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. SECCIÓN: ARCHIVOS IMPRIMIBLES PARA DESCARGAR */}
        {activeTab === 'archivos' && (
          <div className="space-y-4">
            {etiquetasFiltradas.length === 0 ? (
              <EmptyState
                theme="oro"
                icon={<ArrowDownToLine className="w-10 h-10 text-primary" />}
                title="Sin archivos imprimibles maestros en la bóveda"
                description="Aquí se listarán los archivos maestros (PDF con sangría, curvas, AI, PSD o ZIP) listos para tiraje de imprenta."
                action={
                  <button
                    onClick={() => abrirModalSubir(filtroProducto !== 'todos' ? filtroProducto : undefined)}
                    className="btn btn-gold text-xs py-2 px-4 flex items-center gap-2 shadow-sm font-medium"
                  >
                    <Upload size={14} />
                    <span>Subir Archivo de Imprenta</span>
                  </button>
                }
              />
            ) : (
              <div className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface-raised font-mono text-xs font-semibold text-foreground grid grid-cols-12 gap-3">
                  <div className="col-span-5 sm:col-span-4">Nombre del Archivo & Arte</div>
                  <div className="col-span-3 sm:col-span-3">Producto / Frasco</div>
                  <div className="col-span-2 sm:col-span-2 text-center">Tipo & Versión</div>
                  <div className="col-span-2 sm:col-span-3 text-right">Acciones</div>
                </div>

                <div className="divide-y divide-border">
                  {etiquetasFiltradas.map((et) => (
                    <div
                      key={et.id}
                      className="p-4 grid grid-cols-12 gap-3 items-center hover:bg-surface-raised/50 transition-colors"
                    >
                      <div className="col-span-5 sm:col-span-4 min-w-0">
                        <h4 className="text-xs font-semibold text-foreground truncate">{et.nombre}</h4>
                        <span className="text-[0.65rem] font-mono text-muted-foreground block truncate">
                          {et.archivo_nombre}
                        </span>
                      </div>

                      <div className="col-span-3 sm:col-span-3 min-w-0">
                        <span className="text-xs text-foreground truncate block">
                          {et.productos?.nombre ?? 'Sin especificar'}
                        </span>
                        <span className="text-[0.65rem] font-mono text-muted-foreground block">
                          {et.dimensiones_mm}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-2 text-center">
                        <span className="text-[0.65rem] font-mono uppercase px-2 py-0.5 rounded bg-surface-sunken border border-border">
                          .{et.archivo_tipo ?? 'pdf'} · {et.version}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-3 flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirModalEditar(et)}
                          className="btn btn-outline text-xs p-1.5 sm:px-2.5 flex items-center gap-1"
                          title="Editar"
                        >
                          <Edit3 size={12} />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button
                          onClick={() => setEtiquetaAEliminar(et)}
                          className="btn btn-outline text-xs p-1.5 sm:px-2.5 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                        <a
                          href={et.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={et.archivo_nombre}
                          className="btn btn-gold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                        >
                          <Download size={13} />
                          <span className="hidden sm:inline">Descargar</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. SECCIÓN: QRs VECTORIALES PARA PHOTOSHOP */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubTabQr('productos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    subTabQr === 'productos'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-surface-sunken text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Tag size={13} />
                  <span>QRs de Productos</span>
                  <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-background/20 font-mono">
                    {productos.length}
                  </span>
                </button>
                <button
                  onClick={() => setSubTabQr('lotes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    subTabQr === 'lotes'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-surface-sunken text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers size={13} />
                  <span>QRs por Lote</span>
                  <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-background/20 font-mono">
                    {qrs.length}
                  </span>
                </button>
              </div>
              <p className="text-[0.7rem] text-muted-foreground px-1">
                Descarga en SVG vectorial o PNG 300 DPI para montaje en Photoshop e Illustrator.
              </p>
            </div>

            {/* Vista 1: QRs Canónicos por Producto */}
            {subTabQr === 'productos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {productosFiltrados.map((prod) => {
                  const svgId = `grid-prod-qr-${prod.id}`;
                  const canonUrl = prod.slug
                    ? `${tiendaBase}/q/${encodeURIComponent(prod.slug)}`
                    : `${tiendaBase}/producto/${encodeURIComponent(prod.id)}?origen=qr`;

                  return (
                    <div
                      key={prod.id}
                      className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-medium text-foreground truncate block max-w-[130px]">
                            {prod.nombre}
                          </strong>
                          <button
                            onClick={() => handleCopiar(canonUrl, `prod-${prod.id}`)}
                            className="text-muted-foreground hover:text-foreground text-[0.65rem] flex items-center gap-1"
                            title="Copiar URL directa a tienda"
                          >
                            {copiedCode === `prod-${prod.id}` ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                            <span>{copiedCode === `prod-${prod.id}` ? 'Copiado' : 'URL'}</span>
                          </button>
                        </div>
                        <span className="text-[0.65rem] font-mono text-primary block">
                          {prod.formato ?? 'Etiqueta Oficial'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-stone-200 w-32 h-32 mx-auto shrink-0">
                        <QRCodeSVG
                          id={svgId}
                          value={canonUrl}
                          size={104}
                          level="H"
                          includeMargin={false}
                          bgColor="transparent"
                          fgColor="#1C1917"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                        <button
                          onClick={() => descargarSvg(svgId, `QR_PRODUCTO_${prod.slug || prod.id}`)}
                          className="btn btn-outline text-[0.65rem] py-1 px-2 flex items-center justify-center gap-1"
                          title="Vectorial SVG para Illustrator"
                        >
                          <Download size={11} />
                          <span>SVG</span>
                        </button>
                        <button
                          onClick={() => descargarPng(svgId, `QR_PRODUCTO_${prod.slug || prod.id}`)}
                          className="btn btn-outline text-[0.65rem] py-1 px-2 flex items-center justify-center gap-1"
                          title="PNG a 300 DPI para Photoshop"
                        >
                          <Download size={11} />
                          <span>PNG 300DPI</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vista 2: QRs por Lote */}
            {subTabQr === 'lotes' && (
              <>
                {qrsFiltrados.length === 0 ? (
                  <EmptyState
                    theme="oro"
                    icon={<QrCode className="w-10 h-10 text-primary" />}
                    title="No hay códigos QR de lote generados"
                    description="Los códigos de lote phygital permiten trazabilidad inmutable por temporada y frasco individual. Puedes generarlos desde el Hub Phygital en Packaging & Etiquetas."
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {qrsFiltrados.map((item) => {
                      const svgId = `grid-qr-${item.id}`;
                      const rawUrl = item.url_destino
                        ? item.url_destino.replace('https://tienda.obrera-zangano.cl', tiendaBase)
                        : '';
                      const url =
                        rawUrl ||
                        (item.productos?.slug
                          ? `${tiendaBase}/q/${encodeURIComponent(item.productos.slug)}?qr=${encodeURIComponent(item.codigo)}`
                          : `${tiendaBase}/qr-scan?code=${encodeURIComponent(item.codigo)}`);
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <strong className="text-xs font-mono text-foreground font-bold">{item.codigo}</strong>
                              <button
                                onClick={() => handleCopiar(item.codigo, item.id)}
                                className="text-muted-foreground hover:text-foreground text-[0.65rem] flex items-center gap-1"
                              >
                                {copiedCode === item.id ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                                <span>{copiedCode === item.id ? 'Copiado' : 'Copiar'}</span>
                              </button>
                            </div>
                            <span className="text-[0.65rem] text-muted-foreground truncate block">
                              {item.productos?.nombre ?? `Lote ${item.lote_id}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-stone-200 w-32 h-32 mx-auto shrink-0">
                            <QRCodeSVG
                              id={svgId}
                              value={url}
                              size={104}
                              level="H"
                              includeMargin={false}
                              bgColor="transparent"
                              fgColor="#1C1917"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                            <button
                              onClick={() => descargarSvg(svgId, `QR_${item.codigo}`)}
                              className="btn btn-outline text-[0.65rem] py-1 px-2 flex items-center justify-center gap-1"
                            >
                              <Download size={11} />
                              <span>SVG</span>
                            </button>
                            <button
                              onClick={() => descargarPng(svgId, `QR_${item.codigo}`)}
                              className="btn btn-outline text-[0.65rem] py-1 px-2 flex items-center justify-center gap-1"
                            >
                              <Download size={11} />
                              <span>PNG 300DPI</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      {/* MODAL: SUBIR / EDITAR FICHA DE ETIQUETA & ARTE IMPRIMIBLE */}
      <ImmersiveModal
        open={showSubirModal}
        onClose={() => setShowSubirModal(false)}
        eyebrow="Estudio Gráfico & Portal de Imprenta"
        title={etiquetaEnEdicion ? 'Editar Ficha & Arte de Etiqueta' : 'Subir Archivo de Etiqueta & Especificaciones'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setShowSubirModal(false)}
              disabled={guardandoEtiqueta}
              className="btn btn-outline text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarEtiqueta}
              disabled={
                guardandoEtiqueta ||
                !formEtiqueta.producto_id ||
                !formEtiqueta.nombre.trim() ||
                (!archivoSubido && !etiquetaEnEdicion && modoArchivo === 'archivo') ||
                (!urlExterna.trim() && !etiquetaEnEdicion && modoArchivo === 'url')
              }
              className="btn btn-gold text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {guardandoEtiqueta ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{etiquetaEnEdicion ? 'Actualizar Ficha de Arte' : 'Guardar y Publicar en Imprenta'}</span>
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sube el archivo maestro (PDF en curvas de alta resolución, AI, PSD, SVG o ZIP con troquel) o vincula un repositorio en la nube para ponerlo a disposición del taller de impresión y confección de frascos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Producto / Frasco Asociado *
              </label>
              <select
                value={formEtiqueta.producto_id}
                onChange={(e) => setFormEtiqueta((p) => ({ ...p, producto_id: e.target.value }))}
                className="input-field text-xs w-full"
              >
                <option value="">Selecciona un frasco...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.formato ? `(${p.formato})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Nombre del Arte / Pieza Gráfica *
              </label>
              <input
                type="text"
                placeholder="Ej: Etiqueta Frontal 330g - Miel de Ulmo Virgen"
                value={formEtiqueta.nombre}
                onChange={(e) => setFormEtiqueta((p) => ({ ...p, nombre: e.target.value }))}
                className="input-field text-xs w-full"
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Tipo de Etiqueta
              </label>
              <select
                value={formEtiqueta.tipo}
                onChange={(e) => setFormEtiqueta((p) => ({ ...p, tipo: e.target.value as EtiquetaFormData['tipo'] }))}
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
                Dimensiones Exactas de Troquel (Ancho x Alto mm) *
              </label>
              <input
                type="text"
                placeholder="Ej: 140 x 55 mm"
                value={formEtiqueta.dimensiones_mm}
                onChange={(e) => setFormEtiqueta((p) => ({ ...p, dimensiones_mm: e.target.value }))}
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
                value={formEtiqueta.sustrato}
                onChange={(e) => setFormEtiqueta((p) => ({ ...p, sustrato: e.target.value }))}
                className="input-field text-xs w-full"
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                Acabados Especiales & Tintas
              </label>
              <input
                type="text"
                placeholder="Ej: Foil oro metálico, barniz UV sectorizado"
                value={formEtiqueta.acabados}
                onChange={(e) => setFormEtiqueta((p) => ({ ...p, acabados: e.target.value }))}
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
                value={formEtiqueta.version}
                onChange={(e) => setFormEtiqueta((p) => ({ ...p, version: e.target.value }))}
                className="input-field text-xs w-full font-mono"
              />
            </div>

            <div>
              <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                QR Oficial Asignado (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: OZ-2026-X8K2 (o dejar en blanco para canónico)"
                value={formEtiqueta.qr_codigo}
                onChange={(e) => setFormEtiqueta((p) => ({ ...p, qr_codigo: e.target.value }))}
                className="input-field text-xs w-full font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
              Notas Técnicas para Taller & Imprenta
            </label>
            <textarea
              rows={2}
              value={formEtiqueta.notas_imprenta}
              onChange={(e) => setFormEtiqueta((p) => ({ ...p, notas_imprenta: e.target.value }))}
              className="input-field text-xs w-full resize-none"
              placeholder="Instrucciones de sangría perimetral, perfiles CMYK FOGRA39, tolerancias de desbobinado..."
            />
          </div>

          {/* Selector de Modo de Archivo */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold">
                Origen del Archivo Maestro Imprimible *
              </span>
              <div className="flex items-center gap-1 bg-surface-sunken p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setModoArchivo('archivo')}
                  className={`px-2.5 py-1 text-[0.65rem] rounded-md font-medium transition-all ${
                    modoArchivo === 'archivo' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Subir archivo local
                </button>
                <button
                  type="button"
                  onClick={() => setModoArchivo('url')}
                  className={`px-2.5 py-1 text-[0.65rem] rounded-md font-medium transition-all ${
                    modoArchivo === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Enlace externo en la nube
                </button>
              </div>
            </div>

            {modoArchivo === 'archivo' ? (
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
                  id="portal-file-upload-etiqueta"
                />
                <label
                  htmlFor="portal-file-upload-etiqueta"
                  className="cursor-pointer inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                >
                  <Upload size={14} />
                  <span>{archivoSubido ? 'Cambiar archivo seleccionado' : 'Seleccionar archivo desde el equipo (PDF, AI, PSD, SVG o ZIP)'}</span>
                </label>
                {archivoSubido ? (
                  <div className="text-xs font-mono text-foreground flex items-center justify-center gap-2 pt-1">
                    <CheckCircle2 size={14} className="text-success" />
                    <span>{archivoSubido.name}</span>
                    <span className="text-muted-foreground">({(archivoSubido.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                ) : etiquetaEnEdicion ? (
                  <p className="text-[0.65rem] text-muted-foreground font-mono">
                    Archivo actual: {etiquetaEnEdicion.archivo_nombre} (selecciona uno nuevo solo si deseas reemplazarlo)
                  </p>
                ) : (
                  <p className="text-[0.65rem] text-muted-foreground">Formatos vectoriales o listos para imprenta con sangría (máx. 50 MB).</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... o https://wetransfer.com/..."
                    value={urlExterna}
                    onChange={(e) => setUrlExterna(e.target.value)}
                    className="input-field text-xs pl-8 py-2 w-full"
                  />
                </div>
                <p className="text-[0.65rem] text-muted-foreground">
                  Ideal para archivos de gran envergadura (superiores a 50 MB) o carpetas empaquetadas con tipografías y vínculos.
                </p>
              </div>
            )}
          </div>
        </div>
      </ImmersiveModal>

      {/* MODAL ZOOM DE FOTOGRAFÍA */}
      {fotoEnZoom && (
        <ImmersiveModal
          open={!!fotoEnZoom}
          onClose={() => setFotoEnZoom(null)}
          eyebrow="Galería de Frascos"
          title={fotoEnZoom.titulo}
          size="lg"
          footer={
            <>
              <button onClick={() => setFotoEnZoom(null)} className="btn btn-outline text-xs">
                Cerrar
              </button>
              <a
                href={fotoEnZoom.url}
                target="_blank"
                rel="noopener noreferrer"
                download="frasco-referencia-fotografica.webp"
                className="btn btn-gold text-xs flex items-center gap-2"
              >
                <Download size={14} />
                <span>Descargar Imagen Original</span>
              </a>
            </>
          }
        >
          <div className="flex items-center justify-center p-4 bg-surface-sunken rounded-xl overflow-hidden max-h-[70vh]">
            <img
              src={fotoEnZoom.url}
              alt={fotoEnZoom.titulo}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          </div>
        </ImmersiveModal>
      )}

      {/* CONFIRMACIÓN DE ELIMINACIÓN DE ARTE */}
      <ConfirmDialog
        open={Boolean(etiquetaAEliminar)}
        onOpenChange={(open) => {
          if (!open) setEtiquetaAEliminar(null);
        }}
        title={etiquetaAEliminar ? `¿Eliminar arte «${etiquetaAEliminar.nombre}»?` : '¿Eliminar arte final?'}
        description="¿Deseas eliminar permanentemente esta ficha técnica y archivo imprimible de la bóveda de imprenta? Esta acción no se puede deshacer."
        confirmLabel="Eliminar arte de la bóveda"
        cancelLabel="Conservar arte"
        variant="destructive"
        loading={eliminando}
        onConfirm={handleEliminarEtiqueta}
      />
    </div>
  );
}
