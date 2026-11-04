'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Search,
  Loader2,
  Tag,
} from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { supabase } from '@/lib/supabase';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { toast, friendlyError, friendlySupabaseError, ImmersiveModal, Skeleton } from '@enjambre/ui';

interface ProductoOption {
  id: string;
  nombre: string;
  formato: string | null;
  slug: string | null;
  fotos: string[] | null;
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

export function BovedaEtiquetasView() {
  const apiFetch = useApiFetch();
  const [loading, setLoading] = useState(true);

  // Datos base
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [etiquetasList, setEtiquetasList] = useState<EtiquetaArteItem[]>([]);

  // Filtros
  const [filtroProducto, setFiltroProducto] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Subir / Crear Etiqueta
  const [showSubirModal, setShowSubirModal] = useState(false);
  const [guardandoEtiqueta, setGuardandoEtiqueta] = useState(false);
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [, setUploadProgress] = useState(false);
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

  // Carga inicial
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resProd, resEtiquetas] = await Promise.all([
        supabase
          .from('productos')
          .select('id, nombre, formato, slug, fotos')
          .order('nombre'),
        apiFetch('/api/phygital/etiquetas'),
      ]);

      if (resProd.data) setProductos(resProd.data as ProductoOption[]);

      if (resEtiquetas.ok) {
        const jsonEtiquetas = await resEtiquetas.json();
        setEtiquetasList(jsonEtiquetas.data ?? []);
      }
    } catch (err) {
      console.error(err);
      toast(friendlyError(err, 'Error al cargar la bóveda de etiquetas'), { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

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

  const productosConArte = new Set(etiquetasList.map((e) => e.producto_id));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <ViewShell
        variant="compact"
        eyebrow="Packaging & Etiquetas"
        title="Bóveda de Etiquetas"
        subtitle="Almacén de versiones actualizadas de etiquetas, sustratos y acabados de producción listos para imprenta."
        icon={<Tag size={20} />}
        actions={
          <button
            onClick={() => setShowSubirModal(true)}
            className="btn btn-gold text-xs flex items-center gap-2"
          >
            <Upload size={14} />
            <span>Subir Archivo de Imprenta</span>
          </button>
        }
      />

      {/* Toolbar de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-raised rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Tag size={13} className="text-primary" />
              <span>Archivos Técnicos Registrados</span>
            </span>
            <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded-full bg-surface-sunken text-muted-foreground">
              {etiquetasFiltradas.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar etiqueta, producto o troquel..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-field text-xs pl-9 py-1.5 w-full sm:w-64"
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

        {/* Listado de Etiquetas y Fichas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true" aria-label="Cargando archivos de imprenta">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton variant="rectangular" className="w-20 h-5 rounded" />
                      <Skeleton variant="text" className="w-16 h-3" />
                    </div>
                    <Skeleton variant="text" className="w-48 h-5" />
                    <Skeleton variant="text" className="w-32 h-3" />
                  </div>
                  <Skeleton variant="rectangular" className="w-16 h-8 rounded-lg" />
                </div>
                <div className="space-y-2 p-3 rounded-lg bg-surface-sunken border border-border/50">
                  <div className="flex justify-between">
                    <Skeleton variant="text" className="w-24 h-3" />
                    <Skeleton variant="text" className="w-36 h-3" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton variant="text" className="w-20 h-3" />
                    <Skeleton variant="text" className="w-28 h-3" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <Skeleton variant="text" className="w-24 h-3" />
                  <div className="flex items-center gap-2">
                    <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
                    <Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : etiquetasFiltradas.length === 0 ? (
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
              <span>Subir Archivo de Imprenta</span>
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
    </div>
  );
}
