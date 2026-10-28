'use client';

import { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  Copy,
  Check,
  Plus,
  Layers,
  Search,
  Loader2,
  Tag,
  ExternalLink,
  CheckCircle2,
  SlidersHorizontal,
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
  tipo_sensorial?: string | null;
  perfil_sensorial?: {
    qr_modo?: 'experiencia' | 'trazabilidad' | 'comercial';
    qr_titulo?: string;
    qr_mensaje?: string;
    qr_cta_resena?: string;
    [key: string]: unknown;
  } | null;
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

export function HubPhygitalView() {
  const apiFetch = useApiFetch();
  const [tipoVistaQr, setTipoVistaQr] = useState<'oficiales' | 'lotes'>('oficiales');
  const [loading, setLoading] = useState(true);

  const rawTienda = typeof process !== 'undefined' ? (process.env?.NEXT_PUBLIC_URL_TIENDA || process.env?.NEXT_PUBLIC_TIENDA_URL) : undefined;
  const tiendaBase = (
    rawTienda && !rawTienda.includes('localhost') && !rawTienda.includes('obrera-zangano.cl')
      ? rawTienda
      : 'https://obrerayzangano.cl'
  ).replace(/\/$/, '');

  // Datos base
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [lotes, setLotes] = useState<LoteOption[]>([]);
  const [qrList, setQrList] = useState<QrItem[]>([]);

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

  // Copia feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Configuración rápida de experiencia de aterrizaje QR por producto
  const [qrConfigProduct, setQrConfigProduct] = useState<ProductoOption | null>(null);
  const [savingQrConfig, setSavingQrConfig] = useState(false);
  const [qrConfigDraft, setQrConfigDraft] = useState<{
    qr_modo: 'experiencia' | 'trazabilidad' | 'comercial';
    qr_titulo: string;
    qr_mensaje: string;
    qr_cta_resena: string;
  }>({
    qr_modo: 'experiencia',
    qr_titulo: '',
    qr_mensaje: '',
    qr_cta_resena: '',
  });

  const abrirModalQrConfig = (prod: ProductoOption) => {
    setQrConfigProduct(prod);
    setQrConfigDraft({
      qr_modo: prod.perfil_sensorial?.qr_modo || 'experiencia',
      qr_titulo: prod.perfil_sensorial?.qr_titulo || '',
      qr_mensaje: prod.perfil_sensorial?.qr_mensaje || '',
      qr_cta_resena: prod.perfil_sensorial?.qr_cta_resena || '',
    });
  };

  const handleGuardarQrConfig = async () => {
    if (!qrConfigProduct) return;
    setSavingQrConfig(true);
    try {
      const mergedPerfil = {
        ...(qrConfigProduct.perfil_sensorial && typeof qrConfigProduct.perfil_sensorial === 'object'
          ? qrConfigProduct.perfil_sensorial
          : {}),
        qr_modo: qrConfigDraft.qr_modo,
        qr_titulo: qrConfigDraft.qr_titulo.trim() || undefined,
        qr_mensaje: qrConfigDraft.qr_mensaje.trim() || undefined,
        qr_cta_resena: qrConfigDraft.qr_cta_resena.trim() || undefined,
      };

      const { error } = await supabase
        .from('productos')
        .update({
          perfil_sensorial: mergedPerfil,
          updated_at: new Date().toISOString(),
        })
        .eq('id', qrConfigProduct.id);

      if (error) throw error;

      // Invalidar caché ISR de la tienda para reflejar cambios de inmediato
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);

      toast('Experiencia de escaneo QR actualizada en tienda', { type: 'success' });
      setQrConfigProduct(null);
      void cargarDatos();
    } catch (err) {
      toast(friendlySupabaseError(err as { code?: string; message?: string } | null), { type: 'error' });
    } finally {
      setSavingQrConfig(false);
    }
  };

  // Carga inicial
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resProd, resLotes, resQr] = await Promise.all([
        supabase
          .from('productos')
          .select('id, nombre, formato, slug, fotos, tipo_sensorial, perfil_sensorial')
          .order('nombre'),
        supabase.from('lotes').select('id, nombre_lote, variedad_floral').order('created_at', { ascending: false }),
        apiFetch('/api/phygital/qr?limit=100'),
      ]);

      if (resProd.data) setProductos(resProd.data as ProductoOption[]);
      if (resLotes.data) setLotes(resLotes.data as LoteOption[]);

      if (resQr.ok) {
        const jsonQr = await resQr.json();
        setQrList(jsonQr.data ?? []);
      }
    } catch (err) {
      console.error(err);
      toast(friendlyError(err, 'Error al cargar los códigos QR'), { type: 'error' });
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

  // Descarga directa de SVG vectorial transparente
  const descargarSvg = (svgId: string, filename: string) => {
    const ok = downloadQrSvg(svgId, filename);
    if (!ok) {
      toast('No se encontró el elemento vectorial', { type: 'error' });
      return;
    }
    toast('Vector SVG transparente descargado (ideal para Illustrator y Photoshop)', { type: 'success' });
  };

  // Descarga de PNG transparente en alta resolución (300 DPI / 1200px)
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

  // Filtrado de QRs por lote
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

  // Filtrado de Productos Oficiales (para colección de QRs de catálogo)
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
      title="QRs de Productos"
      subtitle="Ecosistema físico-digital: colección de códigos QR oficiales por producto y pasaportes de lote para frascos y etiquetas."
      actions={
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
      }
    >
      <div className="space-y-6">
        {/* Banner Explicativo de Filosofía Phygital */}
        <div className="p-5 rounded-2xl bg-surface-raised border border-border/80 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 max-w-2xl">
              <span className="text-[0.65rem] font-mono tracking-widest uppercase text-primary font-semibold flex items-center gap-1.5">
                <QrCode size={12} /> Ecosistema Físico-Digital
              </span>
              <h2 className="text-xl font-display font-medium text-foreground tracking-tight">
                El Frasco Físico como Llave a la Trazabilidad y Cata Sensorial
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada etiqueta impresa porta un código QR vectorial único. Al ser colocado sobre el arte de la etiqueta o envase,
                conecta el néctar envasado con su pasaporte digital oficial, registro sensorial del consumidor y respaldo inmutable.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-background/80 backdrop-blur border border-border rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-2xl font-bold font-mono text-primary">{productos.length}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">QRs Oficiales</div>
              </div>
              <div className="bg-background/80 backdrop-blur border border-border rounded-xl p-3 text-center min-w-[100px]">
                <div className="text-2xl font-bold font-mono text-foreground">{qrList.length}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">QRs por Lote</div>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar de Navegación y Filtros de la Herramienta */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-surface-raised rounded-xl border border-border">
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

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={tipoVistaQr === 'oficiales' ? 'Buscar producto...' : 'Buscar código o lote...'}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field text-xs pl-8 py-1.5 w-44 sm:w-56"
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

        <p className="text-[0.7rem] text-muted-foreground px-1 -mt-2">
          {tipoVistaQr === 'oficiales'
            ? 'QRs canónicos de tienda listos para imprimir en etiquetas de catálogo.'
            : 'QRs vinculados a recolecciones y lotes específicos para cata sensorial.'}
        </p>

        {/* Listado de Códigos QR */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Cargando códigos QR...</span>
          </div>
        ) : tipoVistaQr === 'oficiales' ? (
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
                    <div className="flex items-center justify-center p-3.5 bg-white rounded-xl shadow-inner border border-border/40 w-36 h-36 mx-auto shrink-0">
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

                      {/* Configuración directa del Aterrizaje Phygital */}
                      <button
                        type="button"
                        onClick={() => abrirModalQrConfig(prod)}
                        className="w-full mt-1 py-1.5 px-2.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/15 text-[0.65rem] font-semibold text-primary flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <SlidersHorizontal size={11} />
                          <span>Personalizar Aterrizaje QR</span>
                        </span>
                        <span className="font-mono text-[0.6rem] uppercase opacity-80">
                          {prod.perfil_sensorial?.qr_modo === 'trazabilidad'
                            ? 'Trazabilidad'
                            : prod.perfil_sensorial?.qr_modo === 'comercial'
                              ? 'Comercial'
                              : 'Cata & Reseña ★'}
                        </span>
                      </button>
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
              const rawUrl = item.url_destino
                ? item.url_destino.replace('https://tienda.obrera-zangano.cl', tiendaBase)
                : `${tiendaBase}/cata/${item.codigo}`;
              const canonUrl = rawUrl.replace('http://localhost:3001', tiendaBase);

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
                  <div className="flex items-center justify-center p-3.5 bg-white rounded-xl shadow-inner border border-border/40 w-36 h-36 mx-auto shrink-0">
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

      {/* MODAL: PERSONALIZAR EXPERIENCIA PHYGITAL DEL QR DE PRODUCTO */}
      <ImmersiveModal
        open={qrConfigProduct !== null}
        onClose={() => setQrConfigProduct(null)}
        eyebrow="Acompañamiento Phygital en Etiqueta"
        title={qrConfigProduct ? `Aterrizaje QR · ${qrConfigProduct.nombre}` : 'Aterrizaje QR'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setQrConfigProduct(null)}
              disabled={savingQrConfig}
              className="btn btn-outline text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardarQrConfig}
              disabled={savingQrConfig}
              className="btn btn-gold text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {savingQrConfig ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Guardar Experiencia QR</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configura qué verá el cliente al escanear el código QR impreso en el envase físico de este producto (sin necesidad de volver a imprimir la etiqueta).
          </p>

          <div className="space-y-1.5">
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block">
              Modo de Aterrizaje al Escanear
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: 'experiencia',
                  titulo: 'Ritual de Cata & Reseña (Recomendado)',
                  desc: 'Despliega guía sensorial en mano, notas de bouquet y botón de 1 tap para evaluar cata.',
                },
                {
                  id: 'trazabilidad',
                  titulo: 'Certificado de Origen & Trazabilidad',
                  desc: 'Prioriza el acceso directo al pasaporte de lote, origen territorial y verificación.',
                },
                {
                  id: 'comercial',
                  titulo: 'Acompañamiento Comercial & Recompra',
                  desc: 'Enfoca el llamado a la acción en repetir pedido o conocer otros formatos.',
                },
              ].map((opt) => {
                const selected = qrConfigDraft.qr_modo === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setQrConfigDraft((prev) => ({
                        ...prev,
                        qr_modo: opt.id as 'experiencia' | 'trazabilidad' | 'comercial',
                      }))
                    }
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40'
                        : 'border-border bg-card hover:border-border/80 text-muted-foreground'
                    }`}
                  >
                    <p className="text-xs font-bold text-foreground">{opt.titulo}</p>
                    <p className="text-[0.68rem] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
              Encabezado del Banner QR (Opcional)
            </label>
            <input
              type="text"
              value={qrConfigDraft.qr_titulo}
              onChange={(e) => setQrConfigDraft((p) => ({ ...p, qr_titulo: e.target.value }))}
              placeholder="Ej: Apreciación Sensorial · Crema de Miel Queilen"
              className="input-field text-xs w-full"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
              Mensaje de Bienvenida en Mano (Opcional)
            </label>
            <textarea
              rows={3}
              value={qrConfigDraft.qr_mensaje}
              onChange={(e) => setQrConfigDraft((p) => ({ ...p, qr_mensaje: e.target.value }))}
              placeholder="Si lo dejas vacío, se mostrará una bienvenida adaptada automáticamente al tipo sensorial del producto."
              className="input-field text-xs w-full resize-none"
            />
          </div>

          <div>
            <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
              Texto del Botón Principal (Opcional)
            </label>
            <input
              type="text"
              value={qrConfigDraft.qr_cta_resena}
              onChange={(e) => setQrConfigDraft((p) => ({ ...p, qr_cta_resena: e.target.value }))}
              placeholder="Por defecto: Aportar Nota de Cata ★"
              className="input-field text-xs w-full"
            />
          </div>
        </div>
      </ImmersiveModal>
    </ViewShell>
  );
}
