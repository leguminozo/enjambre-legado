'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import { ImmersiveModal, toast } from '@enjambre/ui';
import { Trash2, Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react';

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

interface ImageLibraryModalProps {
  open: boolean;
  onClose: () => void;
  getSectionLabel: (key: string) => string;
}

/**
 * Librería de imágenes del bucket cms: miniaturas, estado En uso/Huérfana,
 * borrado individual (two-step) y limpieza masiva de huérfanas.
 * Referencia = la URL aparece en algún content/draft_content de site_content.
 */
export function ImageLibraryModal({ open, onClose, getSectionLabel }: ImageLibraryModalProps) {
  const apiFetch = useApiFetch();
  const [images, setImages] = useState<CmsImage[]>([]);
  const [buckets, setBuckets] = useState<BucketCensus[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [confirmPath, setConfirmPath] = useState<string | null>(null);
  const [removingOrphans, setRemovingOrphans] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/cms/images');
      if (!res.ok) throw new Error('Error cargando imágenes');
      const json = (await res.json()) as { data: CmsImage[]; buckets?: BucketCensus[] };
      setImages(json.data ?? []);
      setBuckets(json.buckets ?? []);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error cargando imágenes', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const imageUrl = (path: string) => {
    const { data } = supabase.storage.from('cms').getPublicUrl(path);
    return data?.publicUrl ?? '';
  };

  const deleteImage = (path: string) => {
    if (confirmPath !== path) {
      setConfirmPath(path);
      window.setTimeout(() => setConfirmPath((p) => (p === path ? null : p)), 3000);
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
        if (!res.ok) throw new Error('Error borrando imagen');
        toast('Imagen eliminada', { type: 'success' });
        await load();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Error borrando imagen', { type: 'error' });
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
        if (!res.ok) throw new Error('Error limpiando huérfanas');
        const json = (await res.json()) as { data: { removed: number } };
        toast(`${json.data.removed} imagen${json.data.removed !== 1 ? 'es' : ''} huérfana${json.data.removed !== 1 ? 's' : ''} eliminada${json.data.removed !== 1 ? 's' : ''}`, {
          type: 'success',
        });
        await load();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Error limpiando huérfanas', { type: 'error' });
      } finally {
        setRemovingOrphans(false);
      }
    })();
  };

  const orphans = images.filter((i) => !i.referenced).length;

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Editor de Tienda"
      title="Gestión de imágenes"
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={() => void load()}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin mr-1.5' : 'mr-1.5'} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={removeOrphans}
            disabled={removingOrphans || orphans === 0}
            className="btn btn-outline btn-sm text-warning disabled:opacity-50"
          >
            {removingOrphans ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : (
              <Trash2 size={14} className="mr-1.5" />
            )}
            Eliminar huérfanas ({orphans})
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {images.length} archivo{images.length !== 1 ? 's' : ''} en el bucket cms ·{' '}
          <span className="text-warning">{orphans} huérfana{orphans !== 1 ? 's' : ''}</span> (sin
          referencia en el contenido). Las imágenes en uso se borran solo si confirmás dos veces.
          El editor sube a <span className="font-mono">cms/{'{sección}'}/archivo</span>.
        </p>

        {buckets.length > 0 ? (
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-surface-raised/70">
              Buckets de Storage
            </p>
            <ul className="divide-y divide-border/50 max-h-40 overflow-y-auto">
              {buckets.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 px-3 py-1.5 text-[11px]"
                >
                  <span className="min-w-0">
                    <span className="font-mono text-foreground">{b.id}</span>
                    <span className="text-muted-foreground"> · {b.label}</span>
                    {!b.public ? (
                      <span className="ml-1 text-muted-foreground/70">(privado)</span>
                    ) : null}
                  </span>
                  <span
                    className={`shrink-0 tabular-nums ${
                      b.error ? 'text-warning' : 'text-muted-foreground'
                    }`}
                    title={b.error ?? undefined}
                  >
                    {b.error ? '—' : `${b.files} archivo${b.files === 1 ? '' : 's'}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {loading && images.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-accent" />
          </div>
        ) : images.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <ImageIcon size={40} className="mx-auto text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">Sin imágenes en el bucket cms</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[52vh] overflow-y-auto pr-1">
            {images.map((img) => (
              <div
                key={img.path}
                className="rounded-xl border border-border/60 bg-surface-raised/60 overflow-hidden flex flex-col"
              >
                <div className="relative h-24 bg-background">
                  <img
                    src={imageUrl(img.path)}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span
                    className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      img.referenced
                        ? 'bg-success/20 text-success'
                        : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {img.referenced ? 'En uso' : 'Huérfana'}
                  </span>
                </div>
                <div className="p-2 flex-1 flex flex-col gap-1 min-w-0">
                  <p className="text-[10px] font-mono text-muted-foreground truncate" title={img.path}>
                    {img.path}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {(img.size / 1024).toFixed(0)} KB
                    {img.sections.length > 0
                      ? ` · ${img.sections.map((s) => getSectionLabel(s)).join(', ')}`
                      : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => deleteImage(img.path)}
                    disabled={deletingPath === img.path}
                    className={`mt-auto inline-flex min-h-9 items-center justify-center gap-1 rounded-md border text-[11px] font-medium transition-colors ${
                      confirmPath === img.path
                        ? 'border-destructive/50 bg-destructive/15 text-destructive'
                        : 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/40'
                    }`}
                  >
                    {deletingPath === img.path ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    {confirmPath === img.path ? '¿Confirmar?' : 'Borrar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ImmersiveModal>
  );
}
