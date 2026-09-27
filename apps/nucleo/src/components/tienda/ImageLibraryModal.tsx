'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import { ImmersiveModal, toast } from '@enjambre/ui';
import {
  Trash2,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Copy,
  Check,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface CmsImage {
  path: string;
  name: string;
  size: number;
  created_at: string | null;
  referenced: boolean;
  sections: string[];
}

interface BucketCensus {
  id: string;
  label: string;
  public: boolean;
  files: number;
  error: string | null;
}

export interface ImageLibraryModalProps {
  open: boolean;
  onClose: () => void;
  getSectionLabel: (key: string) => string;
  /** Modo Selector: cuando está presente, permite elegir una imagen para un campo del editor */
  onSelect?: (url: string) => void;
  /** Título contextual o prompt para el selector (ej: "Seleccionar fotografía de cabecera") */
  selectPrompt?: string;
}

type FilterTab = 'todas' | 'en_uso' | 'disponibles';

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(0)} KB`;
  return `${(bytes / (k * k)).toFixed(1)} MB`;
}

function cleanImageTitle(path: string): string {
  const parts = path.split('/');
  const filename = parts.pop() ?? path;
  // Si el nombre es un UUID o hash largo, mostrar un identificador recortado
  if (/^[0-9a-fA-F-]{20,}/.test(filename)) {
    const ext = filename.split('.').pop() ?? '';
    const prefix = parts.length > 0 ? parts.join(' / ') : 'Recurso';
    return `${prefix} · ${filename.slice(0, 8)}.${ext}`;
  }
  return filename;
}

export function ImageLibraryModal({
  open,
  onClose,
  getSectionLabel,
  onSelect,
  selectPrompt,
}: ImageLibraryModalProps) {
  const apiFetch = useApiFetch();
  const [images, setImages] = useState<CmsImage[]>([]);
  const [buckets, setBuckets] = useState<BucketCensus[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [confirmPath, setConfirmPath] = useState<string | null>(null);
  const [removingOrphans, setRemovingOrphans] = useState(false);
  const [confirmBulkCleanup, setConfirmBulkCleanup] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<CmsImage | null>(null);

  // Filtros de navegación
  const [activeTab, setActiveTab] = useState<FilterTab>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/cms/images');
      if (!res.ok) throw new Error('Error al cargar la biblioteca de medios');
      const json = (await res.json()) as { data: CmsImage[]; buckets?: BucketCensus[] };
      setImages(json.data ?? []);
      setBuckets(json.buckets ?? []);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al cargar medios', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (open) {
      void load();
      setConfirmBulkCleanup(false);
      setPreviewImage(null);
    }
  }, [open, load]);

  const imageUrl = useCallback((path: string) => {
    const { data } = supabase.storage.from('cms').getPublicUrl(path);
    return data?.publicUrl ?? '';
  }, []);

  const copyToClipboard = useCallback(
    async (path: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      const url = imageUrl(path);
      try {
        await navigator.clipboard.writeText(url);
        setCopiedPath(path);
        toast('Enlace copiado al portapapeles', { type: 'success' });
        window.setTimeout(() => setCopiedPath((p) => (p === path ? null : p)), 2500);
      } catch {
        toast('No se pudo copiar el enlace', { type: 'error' });
      }
    },
    [imageUrl],
  );

  const handleSelectImage = useCallback(
    (path: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!onSelect) return;
      const url = imageUrl(path);
      onSelect(url);
      toast('Imagen seleccionada', { type: 'success' });
      onClose();
    },
    [imageUrl, onSelect, onClose],
  );

  const deleteImage = (path: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirmPath !== path) {
      setConfirmPath(path);
      window.setTimeout(() => setConfirmPath((p) => (p === path ? null : p)), 3500);
      return;
    }
    setDeletingPath(path);
    void (async () => {
      try {
        const res = await apiFetch('/api/cms/images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: [path] }),
        });
        if (!res.ok) throw new Error('Error al eliminar la imagen');
        toast('Imagen eliminada de la biblioteca', { type: 'success' });
        if (previewImage?.path === path) setPreviewImage(null);
        await load();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Error al eliminar la imagen', { type: 'error' });
      } finally {
        setDeletingPath(null);
        setConfirmPath(null);
      }
    })();
  };

  const removeOrphans = () => {
    setRemovingOrphans(true);
    void (async () => {
      try {
        const res = await apiFetch('/api/cms/images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orphansOnly: true }),
        });
        if (!res.ok) throw new Error('Error al depurar recursos sin uso');
        const json = (await res.json()) as { data: { removed: number } };
        toast(
          `${json.data.removed} recurso${json.data.removed !== 1 ? 's' : ''} sin vincular eliminado${json.data.removed !== 1 ? 's' : ''}`,
          { type: 'success' },
        );
        setConfirmBulkCleanup(false);
        await load();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Error al depurar recursos', { type: 'error' });
      } finally {
        setRemovingOrphans(false);
      }
    })();
  };

  // Secciones únicas presentes en las imágenes
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => {
      img.sections.forEach((s) => set.add(s));
      const folder = img.path.split('/')[0];
      if (folder && folder !== img.path) set.add(folder);
    });
    return Array.from(set).sort();
  }, [images]);

  // Conteos
  const inUseCount = useMemo(() => images.filter((i) => i.referenced).length, [images]);
  const orphanCount = useMemo(() => images.filter((i) => !i.referenced).length, [images]);

  // Lista filtrada
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      // Filtro por pestaña
      if (activeTab === 'en_uso' && !img.referenced) return false;
      if (activeTab === 'disponibles' && img.referenced) return false;

      // Filtro por sección
      if (selectedSection !== 'all') {
        const matchesSection =
          img.sections.includes(selectedSection) || img.path.startsWith(`${selectedSection}/`);
        if (!matchesSection) return false;
      }

      // Filtro por búsqueda de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesPath = img.path.toLowerCase().includes(q);
        const matchesName = img.name.toLowerCase().includes(q);
        const matchesSectionLabels = img.sections.some((s) =>
          getSectionLabel(s).toLowerCase().includes(q),
        );
        if (!matchesPath && !matchesName && !matchesSectionLabels) return false;
      }

      return true;
    });
  }, [images, activeTab, selectedSection, searchQuery, getSectionLabel]);

  const modalTitle = onSelect
    ? selectPrompt || 'Seleccionar Imagen de la Biblioteca'
    : 'Biblioteca de Medios Editoriales';

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Editor de Tienda"
      title={modalTitle}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="btn btn-outline btn-sm"
              disabled={loading}
              title="Actualizar catálogo de medios"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin mr-1.5' : 'mr-1.5'} />
              Actualizar
            </button>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {filteredImages.length} de {images.length} imágenes
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!onSelect && orphanCount > 0 && (
              <>
                {confirmBulkCleanup ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-warning mr-1">¿Depurar {orphanCount} sin vincular?</span>
                    <button
                      type="button"
                      onClick={removeOrphans}
                      disabled={removingOrphans}
                      className="btn btn-sm bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                    >
                      {removingOrphans ? <Loader2 size={13} className="animate-spin mr-1" /> : null}
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmBulkCleanup(false)}
                      className="btn btn-outline btn-sm text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmBulkCleanup(true)}
                    disabled={removingOrphans || orphanCount === 0}
                    className="btn btn-outline btn-sm text-warning hover:bg-warning/10 border-warning/30"
                    title="Elimina fotos que no están referenciadas en ningún contenido publicado o en borrador"
                  >
                    <Trash2 size={13} className="mr-1.5" />
                    Limpiar sin vincular ({orphanCount})
                  </button>
                )}
              </>
            )}

            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cerrar
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Cabecera contextual */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <p className="text-xs text-muted-foreground">
              {onSelect
                ? 'Elige una fotografía existente para reutilizarla directamente en el bloque seleccionado.'
                : 'Recursos fotográficos organizados. Las fotos sin vincular pueden asociarse a nuevos bloques o depurarse para optimizar almacenamiento.'}
            </p>
          </div>

          {/* Pestañas de filtrado rápido */}
          <div className="flex items-center gap-1 bg-surface-sunken p-1 rounded-lg border border-border/50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'todas'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas ({images.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en_uso')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'en_uso'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              En uso ({inUseCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('disponibles')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'disponibles'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Disponibles ({orphanCount})
            </button>
          </div>
        </div>

        {/* Barra de búsqueda y selector de sección */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2 relative flex items-center">
            <Search size={15} className="absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, sección o identificador…"
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-surface-sunken border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg bg-surface-sunken border border-border text-xs text-foreground outline-none focus:border-accent transition-colors cursor-pointer"
            >
              <option value="all">Todas las secciones</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {getSectionLabel(sec)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        {/* Estado de carga */}
        {loading && images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={26} className="animate-spin text-accent" />
            <p className="text-xs text-muted-foreground">Explorando galería de medios…</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-20 text-center space-y-3 rounded-xl border border-dashed border-border/80 bg-surface-raised/20">
            <ImageIcon size={38} className="mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">Sin imágenes encontradas</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || selectedSection !== 'all' || activeTab !== 'todas'
                ? 'No hay imágenes que coincidan con los filtros seleccionados. Prueba limpiando la búsqueda o cambiando de pestaña.'
                : 'Aún no se han cargado imágenes en la galería editorial.'}
            </p>
            {(searchQuery || selectedSection !== 'all' || activeTab !== 'todas') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSection('all');
                  setActiveTab('todas');
                }}
                className="btn btn-outline btn-xs mt-2"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          /* Cuadrícula de tarjetas de imagen */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[68vh] sm:max-h-[60vh] md:max-h-[54vh] overflow-y-auto pr-1">
            {filteredImages.map((img) => {
              const url = imageUrl(img.path);
              const isHeavy = img.size > 500 * 1024; // > 500 KB
              const isCopied = copiedPath === img.path;

              return (
                <div
                  key={img.path}
                  className={`group rounded-xl border bg-surface-raised/50 overflow-hidden flex flex-col transition-all duration-200 hover:border-accent/40 hover:shadow-md ${
                    img.referenced ? 'border-border/60' : 'border-border/40'
                  }`}
                >
                  {/* Contenedor de la miniatura */}
                  <div
                    className="relative h-28 bg-background cursor-pointer overflow-hidden"
                    onClick={() => setPreviewImage(img)}
                    title="Click para ver en tamaño completo"
                  >
                    <img
                      src={url}
                      alt={img.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badge de estado en uso / disponible */}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wide border shadow-sm backdrop-blur-sm ${
                        img.referenced
                          ? 'bg-background/85 text-emerald-400 border-emerald-500/30'
                          : 'bg-background/85 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {img.referenced ? 'En uso' : 'Disponible'}
                    </span>

                    {/* Badge de peso (advertencia si supera 500 KB) */}
                    {isHeavy && (
                      <span
                        className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-amber-950/80 text-amber-300 border border-amber-600/40 flex items-center gap-1 shadow-sm backdrop-blur-sm"
                        title="Archivo de gran peso. Para optimizar la velocidad en móviles se recomienda comprimir a formato WebP (< 300 KB)."
                      >
                        <AlertTriangle size={10} />
                        {formatFileSize(img.size)}
                      </span>
                    )}
                  </div>

                  {/* Metadatos y acciones */}
                  <div className="p-2.5 flex-1 flex flex-col gap-1.5 min-w-0">
                    <p
                      className="text-xs font-medium text-foreground truncate"
                      title={img.path}
                    >
                      {cleanImageTitle(img.path)}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{formatFileSize(img.size)}</span>
                      {img.sections.length > 0 ? (
                        <span
                          className="px-1.5 py-0.5 rounded bg-surface-sunken text-[9px] text-muted-foreground truncate max-w-[120px]"
                          title={img.sections.map((s) => getSectionLabel(s)).join(', ')}
                        >
                          {getSectionLabel(img.sections[0])}
                          {img.sections.length > 1 ? ` +${img.sections.length - 1}` : ''}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/60">Sin sección asignada</span>
                      )}
                    </div>

                    {/* Botonera de acciones */}
                    <div className="mt-auto pt-2 border-t border-border/40 flex items-center gap-1.5">
                      {onSelect ? (
                        /* Botón principal en Modo Selector */
                        <button
                          type="button"
                          onClick={(e) => handleSelectImage(img.path, e)}
                          className="flex-1 inline-flex min-h-9 sm:min-h-8 items-center justify-center gap-1.5 rounded-md bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                        >
                          <Check size={13} />
                          Usar imagen
                        </button>
                      ) : (
                        /* Botón Copiar Enlace en Modo Biblioteca */
                        <button
                          type="button"
                          onClick={(e) => void copyToClipboard(img.path, e)}
                          className={`flex-1 inline-flex min-h-9 sm:min-h-8 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors ${
                            isCopied
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : 'border-border text-muted-foreground hover:text-foreground hover:bg-surface-sunken'
                          }`}
                          title="Copiar enlace público de la imagen"
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          {isCopied ? 'Copiado' : 'Copiar enlace'}
                        </button>
                      )}

                      {/* Botón de Borrado (two-step) */}
                      {!onSelect && (
                        <button
                          type="button"
                          onClick={(e) => deleteImage(img.path, e)}
                          disabled={deletingPath === img.path}
                          className={`inline-flex min-h-8 px-2.5 items-center justify-center rounded-md border text-xs transition-colors shrink-0 ${
                            confirmPath === img.path
                              ? 'border-destructive/60 bg-destructive/20 text-destructive font-semibold'
                              : 'border-border text-muted-foreground/70 hover:text-destructive hover:border-destructive/40'
                          }`}
                          title={
                            confirmPath === img.path
                              ? 'Confirmar eliminación permanente'
                              : 'Eliminar esta imagen'
                          }
                        >
                          {deletingPath === img.path ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : confirmPath === img.path ? (
                            '¿Borrar?'
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Diagnóstico de Almacenamiento (Oculto discretamente para superadmins) */}
        {buckets.length > 0 && !onSelect && (
          <details className="text-xs text-muted-foreground/80 pt-2 border-t border-border/40 group">
            <summary className="cursor-pointer select-none py-1 hover:text-foreground transition-colors flex items-center justify-between">
              <span>Diagnóstico técnico del almacenamiento</span>
              <span className="text-[10px] text-muted-foreground/60 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            <div className="mt-2 rounded-lg border border-border/50 bg-surface-sunken/40 overflow-hidden divide-y divide-border/40">
              {buckets.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                  <span>
                    <span className="font-mono text-foreground">{b.id}</span> · {b.label}
                    {!b.public && <span className="ml-1 text-muted-foreground/70">(privado)</span>}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {b.error ? '—' : `${b.files} archivo${b.files === 1 ? '' : 's'}`}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Modal Lightbox de Vista Previa */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del visor */}
            <div className="p-3.5 border-b border-border/70 flex items-center justify-between bg-surface-raised/40">
              <div className="min-w-0 pr-3">
                <p className="text-sm font-semibold text-foreground truncate">
                  {cleanImageTitle(previewImage.path)}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  {previewImage.path}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
                aria-label="Cerrar vista previa"
              >
                <X size={18} />
              </button>
            </div>

            {/* Imagen central */}
            <div className="relative bg-background/90 p-4 flex items-center justify-center overflow-hidden min-h-[240px] max-h-[50vh]">
              <img
                src={imageUrl(previewImage.path)}
                alt={previewImage.name}
                className="max-h-[46vh] max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>

            {/* Metadatos y acciones del visor */}
            <div className="p-4 bg-surface-raised/30 border-t border-border/60 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-surface-sunken border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Peso del archivo</span>
                  <span className="font-semibold text-foreground">
                    {formatFileSize(previewImage.size)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface-sunken border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Estado en tienda</span>
                  <span
                    className={`font-semibold ${
                      previewImage.referenced ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {previewImage.referenced ? 'En uso activo' : 'Disponible'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 p-2 rounded-lg bg-surface-sunken border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Secciones asociadas</span>
                  <span className="font-medium text-foreground truncate block">
                    {previewImage.sections.length > 0
                      ? previewImage.sections.map((s) => getSectionLabel(s)).join(', ')
                      : 'Ninguna'}
                  </span>
                </div>
              </div>

              {/* Botonera inferior del visor */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <a
                  href={imageUrl(previewImage.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={13} />
                  Abrir original
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(previewImage.path)}
                    className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
                  >
                    {copiedPath === previewImage.path ? <Check size={13} /> : <Copy size={13} />}
                    {copiedPath === previewImage.path ? 'Copiado' : 'Copiar enlace'}
                  </button>

                  {onSelect && (
                    <button
                      type="button"
                      onClick={() => handleSelectImage(previewImage.path)}
                      className="btn btn-sm bg-accent text-accent-foreground font-semibold text-xs inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      Usar esta imagen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ImmersiveModal>
  );
}
