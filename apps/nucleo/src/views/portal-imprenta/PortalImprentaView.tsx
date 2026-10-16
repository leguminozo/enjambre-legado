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
  Sparkles,
  ArrowDownToLine,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError, ImmersiveModal, QRCodeSVG } from '@enjambre/ui';

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
  } | null;
}

export function PortalImprentaView() {
  const apiFetch = useApiFetch();
  const [activeTab, setActiveTab] = useState<'fotos' | 'etiquetas' | 'archivos' | 'qr'>('fotos');
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

  // Descarga SVG
  const descargarSvg = (svgId: string, filename: string) => {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast('Vector SVG descargado listo para Illustrator / Photoshop', { type: 'success' });
  };

  // Descarga PNG 300 DPI
  const descargarPng = (svgId: string, filename: string) => {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1200, 1200);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${filename}-300dpi.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('PNG a 300 DPI descargado', { type: 'success' });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopiar = (texto: string, id: string) => {
    void navigator.clipboard.writeText(texto);
    setCopiedCode(id);
    toast('Código copiado al portapapeles', { type: 'success' });
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

  return (
    <ViewShell
      title="Estudio Gráfico & Portal de Imprenta"
      subtitle="Espacio de trabajo dedicado para diseñadores, talleres de impresión y confección de etiquetas de frascos."
    >
      <div className="space-y-6">
        {/* Cabecera del Portal */}
        <div className="p-6 rounded-2xl bg-surface-raised border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <span className="text-[0.65rem] font-mono tracking-widest uppercase text-primary font-semibold flex items-center gap-1.5">
              <Printer size={13} /> Taller de Producción Gráfica & Empaques
            </span>
            <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
              Recursos de Producción para Frascos y Etiquetas
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consulta las fotos reales de cada frasco para armar mockups y montajes, revisa las medidas exactas de troquelado y sustratos,
              descarga los códigos QR vectoriales y obtén los archivos imprimibles maestros subidos desde el Núcleo.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 bg-background border border-border rounded-xl text-center min-w-[90px]">
              <div className="text-xl font-bold font-mono text-primary">{productos.length}</div>
              <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Productos</div>
            </div>
            <div className="p-3 bg-background border border-border rounded-xl text-center min-w-[90px]">
              <div className="text-xl font-bold font-mono text-foreground">{etiquetas.length}</div>
              <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">Artes Finales</div>
            </div>
          </div>
        </div>

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
                {qrs.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field text-xs pl-8 py-1.5 w-44 sm:w-56"
              />
            </div>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className="input-field text-xs py-1.5 max-w-[160px]"
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
            <div className="p-4 rounded-xl bg-surface-sunken border border-border/80 flex items-start gap-3">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Galería de imágenes oficiales en alta fidelidad de los frascos, tapas y mieles de Enjambre Legado.
                Haz clic en cualquier imagen para verla en gran formato o utilízala como guía de montaje para Photoshop.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productosFiltrados.map((prod) => {
                const fotoPrincipal = prod.fotos && prod.fotos.length > 0 ? prod.fotos[0] : null;
                const otrasFotos = prod.fotos && prod.fotos.length > 1 ? prod.fotos.slice(1) : [];

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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SECCIÓN: ETIQUETAS DE CADA UNO */}
        {activeTab === 'etiquetas' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-surface-sunken border border-border/80 flex items-start gap-3">
              <Layers size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fichas técnicas de cada etiqueta por envase. Contiene las dimensiones milimétricas exactas para troqueles,
                papeles texturados o vinilos certificados, acabados de imprenta (foils, serigrafías) y notas para taller.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {etiquetasFiltradas.map((et) => {
                const qrSvgId = `portal-qr-${et.id}`;
                const qrCodeValue = et.qr_codigo
                  ? `https://tienda.obrera-zangano.cl/cata/${et.qr_codigo}`
                  : `https://tienda.obrera-zangano.cl/producto/${et.productos?.slug ?? ''}`;

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
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-stone-200 shrink-0">
                          <QRCodeSVG
                            id={qrSvgId}
                            value={qrCodeValue}
                            size={70}
                            level="H"
                            includeMargin={false}
                            bgColor="#FFFFFF"
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

                    {/* Botón de Descarga del Archivo Maestro */}
                    <div className="pt-2 flex items-center justify-between border-t border-border">
                      <div className="text-[0.65rem] font-mono text-muted-foreground">
                        {et.archivo_nombre}
                      </div>
                      <a
                        href={et.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={et.archivo_nombre}
                        className="btn btn-gold text-xs py-2 px-4 flex items-center gap-2"
                      >
                        <Download size={14} />
                        <span>Descargar Archivo Imprimible</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. SECCIÓN: ARCHIVOS IMPRIMIBLES PARA DESCARGAR */}
        {activeTab === 'archivos' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-sunken border border-border/80 flex items-start gap-3">
              <ArrowDownToLine size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Descarga directa de los archivos originales de alta prensa subidos desde Núcleo (PDFs con marcas de corte, archivos de troquel y vectores listos para tiraje).
              </p>
            </div>

            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-surface-raised font-mono text-xs font-semibold text-foreground grid grid-cols-12 gap-3">
                <div className="col-span-5 sm:col-span-4">Nombre del Archivo & Arte</div>
                <div className="col-span-3 sm:col-span-3">Producto / Frasco</div>
                <div className="col-span-2 sm:col-span-2 text-center">Tipo & Versión</div>
                <div className="col-span-2 sm:col-span-3 text-right">Acción de Descarga</div>
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

                    <div className="col-span-2 sm:col-span-3 flex justify-end">
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
          </div>
        )}

        {/* 4. SECCIÓN: QRs VECTORIALES PARA PHOTOSHOP */}
        {activeTab === 'qr' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-surface-sunken border border-border/80 flex items-start gap-3">
              <QrCode size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Descarga inmediata de códigos QR vectoriales (SVG en curvas perfectas) o PNGs en alta resolución a 300 DPI
                para importar y montar directamente en Adobe Photoshop o Adobe Illustrator sin pérdida de nitidez.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {qrs.map((item) => {
                const svgId = `grid-qr-${item.id}`;
                const url = item.url_destino || `https://tienda.obrera-zangano.cl/cata/${item.codigo}`;
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

                    <div className="flex items-center justify-center p-3 bg-white rounded-lg border border-stone-200">
                      <QRCodeSVG
                        id={svgId}
                        value={url}
                        size={110}
                        level="H"
                        includeMargin={true}
                        bgColor="#FFFFFF"
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
          </div>
        )}
      </div>

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
    </ViewShell>
  );
}
