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
  RotateCcw,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError, friendlySupabaseError, ImmersiveModal, QRCodeSVG, Skeleton } from '@enjambre/ui';
import { downloadQrSvg, downloadQrPng } from '@/lib/qr-export';
import {
  DEGUSTACION_CONFIG_DEFAULT,
  type DegustacionConfig,
  type MielGeograficaConfig,
  type VariedadMesaConfig,
} from '@enjambre/resenas';

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

  // Configuración del Flujo Maestro de Degustación en Vivo (Trípode / Stand / Feria)
  const [modalDegustacionOpen, setModalDegustacionOpen] = useState(false);
  const [tabDegustacionModal, setTabDegustacionModal] = useState<
    'textos' | 'variedades' | 'mieles' | 'ejes' | 'salida'
  >('textos');
  const [degustacionDraft, setDegustacionDraft] = useState<DegustacionConfig>(DEGUSTACION_CONFIG_DEFAULT);
  const [savingDegustacion, setSavingDegustacion] = useState(false);

  const updateTextosDraft = (key: keyof DegustacionConfig['textos'], val: string) => {
    setDegustacionDraft((prev) => ({
      ...prev,
      textos: {
        ...prev.textos,
        [key]: val,
      },
    }));
  };

  const updateVariedadDraft = (index: number, field: keyof VariedadMesaConfig, val: string) => {
    setDegustacionDraft((prev) => {
      const nextVar = [...prev.variedadesMesa];
      if (nextVar[index]) {
        nextVar[index] = { ...nextVar[index], [field]: val };
      }
      return { ...prev, variedadesMesa: nextVar };
    });
  };

  const updateEjeDraft = (index: number, val: string) => {
    setDegustacionDraft((prev) => {
      const nextEjes = [...prev.ejesSensorialesCanonicos];
      nextEjes[index] = val;
      return { ...prev, ejesSensorialesCanonicos: nextEjes };
    });
  };

  const updateMielDraft = (index: number, field: keyof MielGeograficaConfig, val: string) => {
    setDegustacionDraft((prev) => {
      const nextMieles = [...prev.mielesGeograficas];
      if (nextMieles[index]) {
        nextMieles[index] = { ...nextMieles[index], [field]: val };
      }
      return { ...prev, mielesGeograficas: nextMieles };
    });
  };

  const addMielDraft = () => {
    setDegustacionDraft((prev) => ({
      ...prev,
      mielesGeograficas: [
        ...prev.mielesGeograficas,
        {
          key: `miel-${prev.mielesGeograficas.length + 1}`,
          nombre: 'Nueva Miel Botánica',
          nombreCientifico: 'Especie botánica',
          macroZona: 'Zona geográfica',
          tagline: 'Notas aromáticas principales',
          perfilResumido: 'Textura, cuerpo y carácter en boca.',
          floracionSlug: 'ulmo',
        },
      ],
    }));
  };

  const removeMielDraft = (index: number) => {
    setDegustacionDraft((prev) => ({
      ...prev,
      mielesGeograficas: prev.mielesGeograficas.filter((_, idx) => idx !== index),
    }));
  };

  const updateDescriptorRatingDraft = (nota: number, val: string) => {
    setDegustacionDraft((prev) => ({
      ...prev,
      descriptoresRating: {
        ...prev.descriptoresRating,
        [nota]: val,
      },
    }));
  };

  const handleGuardarDegustacionConfig = async () => {
    setSavingDegustacion(true);
    try {
      const res = await apiFetch('/api/b2b-publico/degustacion-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(degustacionDraft),
      });
      if (!res.ok) throw new Error('Error al guardar la configuración');
      void apiFetch('/api/admin-system/purge-cache', { method: 'POST' }).catch(() => undefined);
      toast('Configuración de Degustación en Vivo actualizada con éxito en tienda', { type: 'success' });
      setModalDegustacionOpen(false);
    } catch (err) {
      toast(friendlyError(err, 'No fue posible guardar la configuración'), { type: 'error' });
    } finally {
      setSavingDegustacion(false);
    }
  };

  const handleResetDegustacionConfig = () => {
    setDegustacionDraft(DEGUSTACION_CONFIG_DEFAULT);
    toast('Borrador restablecido con los valores canónicos recomendados', { type: 'info' });
  };

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
      const [resProd, resLotes, resQr, resDeg] = await Promise.all([
        supabase
          .from('productos')
          .select('id, nombre, formato, slug, fotos, tipo_sensorial, perfil_sensorial')
          .order('nombre'),
        supabase.from('lotes').select('id, nombre_lote, variedad_floral').order('created_at', { ascending: false }),
        apiFetch('/api/phygital/qr?limit=100'),
        apiFetch('/api/b2b-publico/degustacion-config').catch(() => null),
      ]);

      if (resDeg && resDeg.ok) {
        const jsonDeg = await resDeg.json().catch(() => null);
        if (jsonDeg?.data) {
          setDegustacionDraft({
            ...DEGUSTACION_CONFIG_DEFAULT,
            ...jsonDeg.data,
            textos: {
              ...DEGUSTACION_CONFIG_DEFAULT.textos,
              ...(jsonDeg.data.textos || {}),
            },
            variedadesMesa:
              jsonDeg.data.variedadesMesa && jsonDeg.data.variedadesMesa.length > 0
                ? jsonDeg.data.variedadesMesa
                : DEGUSTACION_CONFIG_DEFAULT.variedadesMesa,
            mielesGeograficas:
              jsonDeg.data.mielesGeograficas && jsonDeg.data.mielesGeograficas.length > 0
                ? jsonDeg.data.mielesGeograficas
                : DEGUSTACION_CONFIG_DEFAULT.mielesGeograficas,
            descriptoresRating: {
              ...DEGUSTACION_CONFIG_DEFAULT.descriptoresRating,
              ...(jsonDeg.data.descriptoresRating || {}),
            },
          });
        }
      }

      if (resProd.data) {
        const soloProductosReales = (resProd.data as ProductoOption[]).filter(
          (p) => !p.slug?.toLowerCase().startsWith('insumo-'),
        );
        setProductos(soloProductosReales);
      }
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Packaging & Etiquetas"
        title="QRs de Productos"
        subtitle="Colección de códigos QR oficiales por producto y pasaportes de lote para frascos y etiquetas."
        icon={<QrCode size={20} />}
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
      />

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

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={tipoVistaQr === 'oficiales' ? 'Buscar producto...' : 'Buscar código o lote...'}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field text-xs pl-9 py-1.5 w-full sm:w-56"
              />
            </div>
            <select
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              className="input-field text-xs py-1.5 w-full sm:w-auto max-w-[180px]"
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
            ? 'QRs canónicos listos para imprimir en etiquetas de envase o en tu trípode de degustación en feria.'
            : 'QRs vinculados a recolecciones y lotes específicos para cata sensorial.'}
        </p>

        {/* QRs Maestros para Estaciones de Degustación en Vivo */}
        {tipoVistaQr === 'oficiales' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  QRs Maestros de Degustación en Vivo
                </h3>
                <p className="text-[0.68rem] text-muted-foreground">
                  Elige el QR según el contexto físico de tu stand o evento. Cada uno calibra en tiempo real la constelación sensorial (8 vértices) en la tienda oficial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalDegustacionOpen(true)}
                className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto border-primary/40 text-primary hover:bg-primary/10 transition-colors shadow-sm"
              >
                <SlidersHorizontal size={13} />
                <span>Personalizar Flujo & Variantes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              {/* QR 1: Trípode de Feria (Creaciones en Mesa) */}
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-[0.6rem] font-mono uppercase tracking-wider text-primary font-semibold">
                      <QrCode size={10} />
                      <span>Trípode de Feria</span>
                    </span>
                    <span className="text-[0.6rem] font-mono text-muted-foreground">Exclusivo Mesa</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Creaciones en Mesa</h4>
                    <p className="text-[0.68rem] text-muted-foreground leading-relaxed mt-1">
                      Llega directo a las <strong>4 creaciones reales en degustación</strong> (Crema Batida Pura, con Avellana Chilena, con Polen Floral y con Cacao Nibs), sin pestañas de atlas botánico.
                    </p>
                  </div>
                  <div className="flex items-center justify-center p-3 bg-white rounded-xl shadow-inner border border-border/40 w-28 h-28 mx-auto">
                    <QRCodeSVG
                      id="qr-maestro-feria-svg"
                      value={`${tiendaBase}/cata/FERIA`}
                      size={96}
                      level="H"
                      includeMargin={false}
                      bgColor="transparent"
                      fgColor="#1C1917"
                    />
                  </div>
                  <div className="text-[0.65rem] font-mono text-muted-foreground truncate bg-surface-sunken/60 p-1.5 rounded">
                    {tiendaBase.replace(/^https?:\/\//, '')}/cata/FERIA
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => descargarSvg('qr-maestro-feria-svg', 'QR_TRIPODE_FERIA_CREACIONES')}
                      className="btn btn-gold text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                      title="SVG transparente para Illustrator"
                    >
                      <Download size={11} />
                      <span>Descargar SVG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => descargarPng('qr-maestro-feria-svg', 'QR_TRIPODE_FERIA_CREACIONES')}
                      className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1 bg-background/80"
                      title="PNG 300 DPI transparente"
                    >
                      <Download size={11} />
                      <span>PNG 300 DPI</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[0.65rem] pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopiar(`${tiendaBase}/cata/FERIA`, 'qr-feria')}
                      className="text-muted-foreground hover:text-foreground font-mono flex items-center gap-1"
                    >
                      {copiedId === 'qr-feria' ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                      <span>{copiedId === 'qr-feria' ? 'Copiado' : 'Copiar URL'}</span>
                    </button>
                    <a
                      href={`${tiendaBase}/cata/FERIA`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono flex items-center gap-1"
                    >
                      <span>Probar</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>

              {/* QR 2: Copa Técnica (Mieles de Chile · Atlas Botánico) */}
              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 text-[0.6rem] font-mono uppercase tracking-wider text-accent-text font-semibold">
                      <QrCode size={10} />
                      <span>Copa Técnica</span>
                    </span>
                    <span className="text-[0.6rem] font-mono text-muted-foreground">Atlas Botánico</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Mieles de Chile</h4>
                    <p className="text-[0.68rem] text-muted-foreground leading-relaxed mt-1">
                      Enfocado en congresos, catas guiadas y copas técnicas. Entra directo a las <strong>mieles monoflorales del país</strong> (Ulmo, Quillay, Tiaca, Melí, Tepú, Chañar...).
                    </p>
                  </div>
                  <div className="flex items-center justify-center p-3 bg-white rounded-xl shadow-inner border border-border/40 w-28 h-28 mx-auto">
                    <QRCodeSVG
                      id="qr-maestro-chile-svg"
                      value={`${tiendaBase}/cata/CHILE`}
                      size={96}
                      level="H"
                      includeMargin={false}
                      bgColor="transparent"
                      fgColor="#1C1917"
                    />
                  </div>
                  <div className="text-[0.65rem] font-mono text-muted-foreground truncate bg-surface-sunken/60 p-1.5 rounded">
                    {tiendaBase.replace(/^https?:\/\//, '')}/cata/CHILE
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => descargarSvg('qr-maestro-chile-svg', 'QR_COPA_TECNICA_MIELES_CHILE')}
                      className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                      title="SVG transparente para Illustrator"
                    >
                      <Download size={11} />
                      <span>Descargar SVG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => descargarPng('qr-maestro-chile-svg', 'QR_COPA_TECNICA_MIELES_CHILE')}
                      className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1 bg-background/80"
                      title="PNG 300 DPI transparente"
                    >
                      <Download size={11} />
                      <span>PNG 300 DPI</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[0.65rem] pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopiar(`${tiendaBase}/cata/CHILE`, 'qr-chile')}
                      className="text-muted-foreground hover:text-foreground font-mono flex items-center gap-1"
                    >
                      {copiedId === 'qr-chile' ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                      <span>{copiedId === 'qr-chile' ? 'Copiado' : 'Copiar URL'}</span>
                    </button>
                    <a
                      href={`${tiendaBase}/cata/CHILE`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono flex items-center gap-1"
                    >
                      <span>Probar</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>

              {/* QR 3: Estación Integral (Doble Pabellón) */}
              <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-sunken border border-border text-[0.6rem] font-mono uppercase tracking-wider text-foreground/80 font-semibold">
                      <QrCode size={10} />
                      <span>Doble Pabellón</span>
                    </span>
                    <span className="text-[0.6rem] font-mono text-muted-foreground">Casa + Atlas</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Estación Integral</h4>
                    <p className="text-[0.68rem] text-muted-foreground leading-relaxed mt-1">
                      Presenta el <strong>conmutador de doble pabellón</strong> en pantalla para que el visitante elija si desea evaluar una creación de Pureo o una miel del atlas de Chile.
                    </p>
                  </div>
                  <div className="flex items-center justify-center p-3 bg-white rounded-xl shadow-inner border border-border/40 w-28 h-28 mx-auto">
                    <QRCodeSVG
                      id="qr-maestro-integral-svg"
                      value={`${tiendaBase}/cata/DEGUSTACION`}
                      size={96}
                      level="H"
                      includeMargin={false}
                      bgColor="transparent"
                      fgColor="#1C1917"
                    />
                  </div>
                  <div className="text-[0.65rem] font-mono text-muted-foreground truncate bg-surface-sunken/60 p-1.5 rounded">
                    {tiendaBase.replace(/^https?:\/\//, '')}/cata/DEGUSTACION
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => descargarSvg('qr-maestro-integral-svg', 'QR_ESTACION_INTEGRAL_DEGUSTACION')}
                      className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1"
                      title="SVG transparente para Illustrator"
                    >
                      <Download size={11} />
                      <span>Descargar SVG</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => descargarPng('qr-maestro-integral-svg', 'QR_ESTACION_INTEGRAL_DEGUSTACION')}
                      className="btn btn-outline text-[0.65rem] py-1.5 px-2 flex items-center justify-center gap-1 bg-background/80"
                      title="PNG 300 DPI transparente"
                    >
                      <Download size={11} />
                      <span>PNG 300 DPI</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[0.65rem] pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopiar(`${tiendaBase}/cata/DEGUSTACION`, 'qr-integral')}
                      className="text-muted-foreground hover:text-foreground font-mono flex items-center gap-1"
                    >
                      {copiedId === 'qr-integral' ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                      <span>{copiedId === 'qr-integral' ? 'Copiado' : 'Copiar URL'}</span>
                    </button>
                    <a
                      href={`${tiendaBase}/cata/DEGUSTACION`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono flex items-center gap-1"
                    >
                      <span>Probar</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Listado de Códigos QR */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Cargando códigos QR">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton variant="text" className="w-24 h-3" />
                    <Skeleton variant="text" className="w-44 h-4" />
                    <Skeleton variant="text" className="w-20 h-3" />
                  </div>
                  <Skeleton variant="rectangular" className="w-16 h-5 rounded" />
                </div>
                <div className="flex items-center justify-center p-3.5 bg-card/80 rounded-xl border border-border/40 w-36 h-36 mx-auto">
                  <Skeleton variant="rectangular" className="w-28 h-28 rounded-lg" />
                </div>
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex justify-between">
                    <Skeleton variant="text" className="w-28 h-3" />
                    <Skeleton variant="text" className="w-16 h-3" />
                  </div>
                  <Skeleton variant="rectangular" className="w-full h-8 rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton variant="rectangular" className="w-full h-8 rounded-lg" />
                    <Skeleton variant="rectangular" className="w-full h-8 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
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
              const baseDest = item.url_destino
                ? item.url_destino
                    .replace('https://tienda.obrera-zangano.cl', tiendaBase)
                    .replace('http://localhost:3001', tiendaBase)
                : item.productos?.slug
                  ? `${tiendaBase}/q/${encodeURIComponent(item.productos.slug)}?qr=${encodeURIComponent(item.codigo)}`
                  : `${tiendaBase}/cata/${item.codigo}`;
              const canonUrl = baseDest.includes('/producto/')
                ? baseDest.replace('/producto/', '/q/') +
                  (baseDest.includes('?') ? `&qr=${encodeURIComponent(item.codigo)}` : `?qr=${encodeURIComponent(item.codigo)}`)
                : baseDest;

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

      {/* Modal: Personalizador Integral del Flujo de Degustación en Vivo */}
      <ImmersiveModal
        open={modalDegustacionOpen}
        onClose={() => setModalDegustacionOpen(false)}
        title="Personalizador · Degustación en Vivo & Trípode de Feria"
        eyebrow="Textos, creaciones de mesa, red sensorial y enlaces a tienda"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleResetDegustacionConfig}
              disabled={savingDegustacion}
              className="btn btn-outline text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              title="Restablecer los valores recomendados por defecto"
            >
              <RotateCcw size={12} />
              <span>Restablecer Canónicos</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalDegustacionOpen(false)}
                disabled={savingDegustacion}
                className="btn btn-outline text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarDegustacionConfig}
                disabled={savingDegustacion}
                className="btn btn-gold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingDegustacion ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Guardar Configuración en Vivo</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Navegación por Pestañas */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-surface-sunken rounded-xl border border-border/80 text-xs">
            <button
              type="button"
              onClick={() => setTabDegustacionModal('textos')}
              className={`flex-1 min-w-[120px] py-1.5 px-2.5 rounded-lg font-medium transition-colors ${
                tabDegustacionModal === 'textos'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              1. Títulos & Pabellones
            </button>
            <button
              type="button"
              onClick={() => setTabDegustacionModal('variedades')}
              className={`flex-1 min-w-[120px] py-1.5 px-2.5 rounded-lg font-medium transition-colors ${
                tabDegustacionModal === 'variedades'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              2. Creaciones en Mesa ({degustacionDraft.variedadesMesa.length})
            </button>
            <button
              type="button"
              onClick={() => setTabDegustacionModal('mieles')}
              className={`flex-1 min-w-[120px] py-1.5 px-2.5 rounded-lg font-medium transition-colors ${
                tabDegustacionModal === 'mieles'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              3. Mieles de Chile ({degustacionDraft.mielesGeograficas.length})
            </button>
            <button
              type="button"
              onClick={() => setTabDegustacionModal('ejes')}
              className={`flex-1 min-w-[120px] py-1.5 px-2.5 rounded-lg font-medium transition-colors ${
                tabDegustacionModal === 'ejes'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              4. Red Sensorial (8 Vértices)
            </button>
            <button
              type="button"
              onClick={() => setTabDegustacionModal('salida')}
              className={`flex-1 min-w-[120px] py-1.5 px-2.5 rounded-lg font-medium transition-colors ${
                tabDegustacionModal === 'salida'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              5. Reseña & Salida a Tienda
            </button>
          </div>

          {/* TAB 1: Títulos & Pabellones */}
          {tabDegustacionModal === 'textos' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[0.72rem] text-muted-foreground leading-relaxed">
                Estos textos aparecen en la cabecera del móvil al escanear cualquiera de los QRs Maestros (<strong className="text-foreground">/cata/FERIA</strong>, <strong className="text-foreground">/cata/CHILE</strong> o <strong className="text-foreground">/cata/DEGUSTACION</strong>).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Título Principal de Selección
                  </label>
                  <input
                    type="text"
                    value={degustacionDraft.textos.tituloSeleccion}
                    onChange={(e) => updateTextosDraft('tituloSeleccion', e.target.value)}
                    className="input-field text-xs w-full"
                    placeholder="Estación de Degustación en Vivo"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Badge Superior en Mesa
                  </label>
                  <input
                    type="text"
                    value={degustacionDraft.textos.badgeFeria}
                    onChange={(e) => updateTextosDraft('badgeFeria', e.target.value)}
                    className="input-field text-xs w-full"
                    placeholder="Trípode de Mesa · Registro Sensorial Directo"
                  />
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Subtítulo / Pregunta Guía
                </label>
                <input
                  type="text"
                  value={degustacionDraft.textos.subtituloSeleccion}
                  onChange={(e) => updateTextosDraft('subtituloSeleccion', e.target.value)}
                  className="input-field text-xs w-full"
                  placeholder="¿Qué variante estás degustando en este momento?"
                />
              </div>

              <div className="border-t border-border/60 pt-3">
                <h4 className="text-[0.7rem] uppercase tracking-wider text-primary font-bold mb-2">
                  Configuración de Pestañas / Pabellones (Conmutador)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
                    <span className="text-[0.6rem] font-mono uppercase tracking-wider text-primary font-bold">
                      Pabellón 1 · Creaciones de la Casa
                    </span>
                    <div>
                      <label className="text-[0.62rem] text-muted-foreground block mb-0.5">Nombre Pestaña</label>
                      <input
                        type="text"
                        value={degustacionDraft.textos.pabellonCasaLabel}
                        onChange={(e) => updateTextosDraft('pabellonCasaLabel', e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[0.62rem] text-muted-foreground block mb-0.5">Subtítulo Descriptivo</label>
                      <input
                        type="text"
                        value={degustacionDraft.textos.pabellonCasaSubtitle}
                        onChange={(e) => updateTextosDraft('pabellonCasaSubtitle', e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[0.62rem] text-muted-foreground block mb-0.5">Nota de Contexto</label>
                      <input
                        type="text"
                        value={degustacionDraft.textos.pabellonCasaDesc}
                        onChange={(e) => updateTextosDraft('pabellonCasaDesc', e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
                    <span className="text-[0.6rem] font-mono uppercase tracking-wider text-accent-text font-bold">
                      Pabellón 2 · Atlas Botánico de Chile
                    </span>
                    <div>
                      <label className="text-[0.62rem] text-muted-foreground block mb-0.5">Nombre Pestaña</label>
                      <input
                        type="text"
                        value={degustacionDraft.textos.pabellonGeografiasLabel}
                        onChange={(e) => updateTextosDraft('pabellonGeografiasLabel', e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[0.62rem] text-muted-foreground block mb-0.5">Subtítulo Descriptivo</label>
                      <input
                        type="text"
                        value={degustacionDraft.textos.pabellonGeografiasSubtitle}
                        onChange={(e) => updateTextosDraft('pabellonGeografiasSubtitle', e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[0.62rem] text-muted-foreground block mb-0.5">Nota de Contexto</label>
                      <input
                        type="text"
                        value={degustacionDraft.textos.pabellonGeografiasDesc}
                        onChange={(e) => updateTextosDraft('pabellonGeografiasDesc', e.target.value)}
                        className="input-field text-xs w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 pt-3 space-y-2.5">
                <h4 className="text-[0.7rem] uppercase tracking-wider text-primary font-bold">
                  Cabecera del Paso 2 · Red Sensorial (8 Vértices)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                      Badge Superior Paso 2
                    </label>
                    <input
                      type="text"
                      value={degustacionDraft.textos.paso2Badge}
                      onChange={(e) => updateTextosDraft('paso2Badge', e.target.value)}
                      className="input-field text-xs w-full"
                      placeholder="Paso 2 de 3 · Perfil Sensorial"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                      Título Paso 2
                    </label>
                    <input
                      type="text"
                      value={degustacionDraft.textos.paso2Titulo}
                      onChange={(e) => updateTextosDraft('paso2Titulo', e.target.value)}
                      className="input-field text-xs w-full"
                      placeholder="Geometría de la Red Sensorial"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Subtítulo / Instrucción Paso 2
                  </label>
                  <input
                    type="text"
                    value={degustacionDraft.textos.paso2Subtitulo}
                    onChange={(e) => updateTextosDraft('paso2Subtitulo', e.target.value)}
                    className="input-field text-xs w-full"
                    placeholder="Calibra los 8 vértices en escala 1.0 a 10.0 según tu percepción directa en el paladar."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Creaciones en Mesa */}
          {tabDegustacionModal === 'variedades' && (
            <div className="space-y-3">
              <p className="text-[0.72rem] text-muted-foreground leading-relaxed">
                Estas son las 4 recetas activas en tu mesa de degustación. Cada una se vincula a su slug de producto oficial en la tienda para que las reseñas alimenten su constelación sensorial real.
              </p>

              <div className="space-y-2.5">
                {degustacionDraft.variedadesMesa.map((variedad, idx) => (
                  <div
                    key={variedad.id || idx}
                    className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[0.65rem] font-mono flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {variedad.name || `Variante #${idx + 1}`}
                        </span>
                      </div>
                      <span className="text-[0.6rem] font-mono text-muted-foreground">ID: {variedad.id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Nombre Visible de la Variante
                        </label>
                        <input
                          type="text"
                          value={variedad.name}
                          onChange={(e) => updateVariedadDraft(idx, 'name', e.target.value)}
                          className="input-field text-xs w-full"
                          placeholder="Nombre de la receta"
                        />
                      </div>
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Nota / Matiz Descriptivo Breve
                        </label>
                        <input
                          type="text"
                          value={variedad.note}
                          onChange={(e) => updateVariedadDraft(idx, 'note', e.target.value)}
                          className="input-field text-xs w-full"
                          placeholder="Descripción breve que verá el cliente"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Slug de Producto Vinculado (Tienda)
                        </label>
                        <input
                          type="text"
                          value={variedad.productSlug || ''}
                          onChange={(e) => updateVariedadDraft(idx, 'productSlug', e.target.value)}
                          className="input-field text-xs w-full font-mono"
                          placeholder="ej: crema-de-miel-batida-frio-250g"
                        />
                      </div>
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          O vincular desde catálogo existente
                        </label>
                        <select
                          value={variedad.productSlug || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              updateVariedadDraft(idx, 'productSlug', e.target.value);
                            }
                          }}
                          className="input-field text-xs w-full"
                        >
                          <option value="">Seleccionar del catálogo de productos...</option>
                          {productos
                            .filter((p) => Boolean(p.slug))
                            .map((p) => (
                              <option key={p.id} value={p.slug || ''}>
                                {p.nombre} ({p.slug})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Mieles de Chile (Atlas Botánico) */}
          {tabDegustacionModal === 'mieles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.72rem] text-muted-foreground leading-relaxed">
                  Configura las mieles monoflorales y orígenes geográficos del pabellón <strong className="text-foreground">Mieles de Chile</strong> (<span className="font-mono">/cata/CHILE</span> y <span className="font-mono">/cata/DEGUSTACION</span>).
                </p>
                <button
                  type="button"
                  onClick={addMielDraft}
                  className="btn btn-outline text-xs py-1 px-2.5 flex items-center gap-1 shrink-0"
                >
                  <Plus size={12} />
                  <span>Añadir Origen</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {degustacionDraft.mielesGeograficas.map((miel, idx) => (
                  <div
                    key={miel.key || idx}
                    className="p-3.5 rounded-xl bg-card border border-border/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-accent/20 text-accent-text text-[0.65rem] font-mono flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-foreground">
                          {miel.nombre || `Miel #${idx + 1}`}
                        </span>
                        <span className="text-[0.62rem] italic text-muted-foreground">
                          ({miel.nombreCientifico})
                        </span>
                      </div>
                      {degustacionDraft.mielesGeograficas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMielDraft(idx)}
                          className="text-[0.62rem] text-destructive hover:underline font-mono"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Nombre de la Miel
                        </label>
                        <input
                          type="text"
                          value={miel.nombre}
                          onChange={(e) => updateMielDraft(idx, 'nombre', e.target.value)}
                          className="input-field text-xs w-full"
                          placeholder="Ej: Miel de Ulmo"
                        />
                      </div>
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Nombre Científico
                        </label>
                        <input
                          type="text"
                          value={miel.nombreCientifico}
                          onChange={(e) => updateMielDraft(idx, 'nombreCientifico', e.target.value)}
                          className="input-field text-xs w-full italic"
                          placeholder="Ej: Eucryphia cordifolia"
                        />
                      </div>
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Macrozona / Territorio
                        </label>
                        <input
                          type="text"
                          value={miel.macroZona}
                          onChange={(e) => updateMielDraft(idx, 'macroZona', e.target.value)}
                          className="input-field text-xs w-full"
                          placeholder="Ej: Cordillera de la Costa · Los Lagos"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Nota Aromática Principal (Tagline)
                        </label>
                        <input
                          type="text"
                          value={miel.tagline}
                          onChange={(e) => updateMielDraft(idx, 'tagline', e.target.value)}
                          className="input-field text-xs w-full"
                          placeholder="Aroma a jazmín silvestre, notas anisadas."
                        />
                      </div>
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Perfil Resumido en Boca
                        </label>
                        <input
                          type="text"
                          value={miel.perfilResumido}
                          onChange={(e) => updateMielDraft(idx, 'perfilResumido', e.target.value)}
                          className="input-field text-xs w-full"
                          placeholder="Cremosa, floral intenso, acidez equilibrada."
                        />
                      </div>
                      <div>
                        <label className="text-[0.62rem] text-muted-foreground block mb-0.5">
                          Slug de Floración (Biblioteca)
                        </label>
                        <input
                          type="text"
                          value={miel.floracionSlug}
                          onChange={(e) => {
                            updateMielDraft(idx, 'floracionSlug', e.target.value);
                            updateMielDraft(idx, 'key', e.target.value || `miel-${idx + 1}`);
                          }}
                          className="input-field text-xs w-full font-mono"
                          placeholder="ulmo"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Red Sensorial (8 Vértices) */}
          {tabDegustacionModal === 'ejes' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-2 text-[0.72rem] text-foreground leading-relaxed">
                <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-primary">Regla Canónica de Calibración Neutral</p>
                  <p className="text-muted-foreground mt-0.5">
                    Al escanear desde el teléfono móvil, <strong className="text-foreground">todos los 8 vértices inician en 1.0</strong> (intensidad sutil basal). Esto asegura que el cliente calibre activamente cada eje con su propia percepción en boca, sin sesgo de partida.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-[0.68rem] uppercase tracking-wider text-muted-foreground font-semibold">
                  Nombres de los 8 Vértices del Polígono Sensorial
                </h4>
                <p className="text-[0.65rem] text-muted-foreground">
                  Puedes afinar la redacción de cada arista para adaptarla al lenguaje de tu cata o evento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {degustacionDraft.ejesSensorialesCanonicos.map((eje, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-card border border-border/80 flex items-center gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[0.65rem] font-mono flex items-center justify-center font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <label className="text-[0.6rem] text-muted-foreground block mb-0.5">
                        Vértice #{idx + 1}
                      </label>
                      <input
                        type="text"
                        value={eje}
                        onChange={(e) => updateEjeDraft(idx, e.target.value)}
                        className="input-field text-xs w-full"
                        placeholder={`Vértice ${idx + 1}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Reseña & Salida a Tienda */}
          {tabDegustacionModal === 'salida' && (
            <div className="space-y-3.5">
              <p className="text-[0.72rem] text-muted-foreground leading-relaxed">
                Controla todos los textos del Paso 3 (Notas, Escala 1 a 10 y Comentario) y de la pantalla final de Pasaporte Sensorial y salida a tienda.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Badge Paso 3
                  </label>
                  <input
                    type="text"
                    value={degustacionDraft.textos.paso3Badge}
                    onChange={(e) => updateTextosDraft('paso3Badge', e.target.value)}
                    className="input-field text-xs w-full"
                    placeholder="Paso 3 de 3"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Título Paso 3 · Apreciación Global
                  </label>
                  <input
                    type="text"
                    value={degustacionDraft.textos.paso3Titulo}
                    onChange={(e) => updateTextosDraft('paso3Titulo', e.target.value)}
                    className="input-field text-xs w-full"
                    placeholder="Notas de Sabor y Reseña"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Etiqueta de Calificación (Escala 1 a 10)
                  </label>
                  <input
                    type="text"
                    value={degustacionDraft.textos.ratingLabel}
                    onChange={(e) => updateTextosDraft('ratingLabel', e.target.value)}
                    className="input-field text-xs w-full"
                    placeholder="Evaluación Global (Escala 1 a 10)"
                  />
                </div>
              </div>

              <div>
                <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                  Subtítulo Paso 3 · Instrucción al Catador
                </label>
                <input
                  type="text"
                  value={degustacionDraft.textos.paso3Subtitulo}
                  onChange={(e) => updateTextosDraft('paso3Subtitulo', e.target.value)}
                  className="input-field text-xs w-full"
                  placeholder="Selecciona los matices que logras percibir en esta muestra."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Etiqueta del Campo de Reseña Escrita
                  </label>
                  <input
                    type="text"
                    value={degustacionDraft.textos.comentarioLabel}
                    onChange={(e) => updateTextosDraft('comentarioLabel', e.target.value)}
                    className="input-field text-xs w-full"
                    placeholder="Tu reseña oficial (Opcional)"
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Placeholder del Comentario
                  </label>
                  <input
                    type="text"
                    value={degustacionDraft.textos.comentarioPlaceholder}
                    onChange={(e) => updateTextosDraft('comentarioPlaceholder', e.target.value)}
                    className="input-field text-xs w-full"
                    placeholder="Describe los matices que sentiste al probar esta miel..."
                  />
                </div>
              </div>

              <div className="border-t border-border/60 pt-3 space-y-2.5">
                <h4 className="text-[0.7rem] uppercase tracking-wider text-primary font-bold">
                  Descriptores de la Escala 1 a 10
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((nota) => (
                    <div key={nota} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-primary/15 text-primary font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {nota}
                      </span>
                      <input
                        type="text"
                        value={degustacionDraft.descriptoresRating[nota] || ''}
                        onChange={(e) => updateDescriptorRatingDraft(nota, e.target.value)}
                        className="input-field text-xs w-full"
                        placeholder={`Descriptor nota ${nota}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60 pt-3 space-y-3">
                <h4 className="text-[0.7rem] uppercase tracking-wider text-primary font-bold">
                  Pantalla de Éxito (Pasaporte Sensorial) & Salida Diferida a Tienda
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                      Título de Éxito
                    </label>
                    <input
                      type="text"
                      value={degustacionDraft.textos.exitoTitulo}
                      onChange={(e) => updateTextosDraft('exitoTitulo', e.target.value)}
                      className="input-field text-xs w-full"
                      placeholder="Tu Pasaporte Sensorial"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                      Badge Verificación ({'{punto}'})
                    </label>
                    <input
                      type="text"
                      value={degustacionDraft.textos.exitoBadgeSello}
                      onChange={(e) => updateTextosDraft('exitoBadgeSello', e.target.value)}
                      className="input-field text-xs w-full"
                      placeholder="Cata Verificada en {punto}"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                      Badge Puntos ({'{puntos}'})
                    </label>
                    <input
                      type="text"
                      value={degustacionDraft.textos.exitoBadgePuntos}
                      onChange={(e) => updateTextosDraft('exitoBadgePuntos', e.target.value)}
                      className="input-field text-xs w-full"
                      placeholder="+{puntos} Puntos del Bosque"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                      Título Salida (Creaciones Casa)
                    </label>
                    <input
                      type="text"
                      value={degustacionDraft.textos.salidaDiferidaTitulo}
                      onChange={(e) => updateTextosDraft('salidaDiferidaTitulo', e.target.value)}
                      className="input-field text-xs w-full"
                      placeholder="Lleva esta experiencia a tu casa"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                      Título Salida (Mieles de Chile)
                    </label>
                    <input
                      type="text"
                      value={degustacionDraft.textos.salidaGeografiasTitulo}
                      onChange={(e) => updateTextosDraft('salidaGeografiasTitulo', e.target.value)}
                      className="input-field text-xs w-full"
                      placeholder="Despensa Austral de Pureo"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                      Texto del Botón a Tienda
                    </label>
                    <input
                      type="text"
                      value={degustacionDraft.textos.salidaDiferidaBoton}
                      onChange={(e) => updateTextosDraft('salidaDiferidaBoton', e.target.value)}
                      className="input-field text-xs w-full"
                      placeholder="Explorar Catálogo Oficial"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                    Descripción del Bloque de Despensa
                  </label>
                  <textarea
                    rows={2}
                    value={degustacionDraft.textos.salidaDiferidaDesc}
                    onChange={(e) => updateTextosDraft('salidaDiferidaDesc', e.target.value)}
                    className="input-field text-xs w-full resize-none"
                    placeholder="Puedes recibirla en tu domicilio o continuar explorando los orígenes del bosque nativo."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </ImmersiveModal>
    </div>
  );
}
