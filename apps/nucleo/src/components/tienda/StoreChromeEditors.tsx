'use client';

import React, { useEffect, useId, useState, type ComponentType } from 'react';
import {
  Save,
  Loader2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Leaf,
  Layers,
  GalleryHorizontalEnd,
  Package,
  PlayCircle,
  MapPin,
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  LayoutTemplate,
  type LucideProps,
} from 'lucide-react';
import {
  type ThemeSettings,
  type AnnouncementSettings,
  type FooterSettings,
  type PwaNavSettings,
  type BrandAssets,
  type LandingLayoutSettings,
  type LandingSectionId,
  type CatalogSettings,
  type PdpSettings,
  parseThemeSettings,
  parseAnnouncementSettings,
  parseFooterSettings,
  parsePwaNavSettings,
  parseBrandAssets,
  parseLandingLayout,
  parseCatalogSettings,
  parsePdpSettings,
  parseSeoDefaults,
  parseContactSettings,
  LANDING_SECTION_LABELS,
  type SeoDefaults,
  type ContactSettings,
} from '@/lib/store-chrome';

interface SettingsEditorProps {
  content: Record<string, unknown>;
  isUpdating: boolean;
  onSave: (content: Record<string, unknown>) => void;
  /** Sube a Storage CMS (WEBP optimizado) y devuelve URL pública. */
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <span className="text-xs font-mono text-accent tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[hsl(var(--accent))] h-2 cursor-pointer"
      />
    </div>
  );
}

function ToggleField({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background hover:border-accent/40 transition-colors text-left min-h-[48px]"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc ? <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p> : null}
      </div>
      <span
        className={`shrink-0 w-10 h-6 rounded-full relative transition-colors ${
          value ? 'bg-accent' : 'bg-surface-raised border border-border'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${
            value ? 'left-4' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

function SaveBar({ dirty, isUpdating, onSave }: { dirty: boolean; isUpdating: boolean; onSave: () => void }) {
  if (!dirty) return null;
  return (
    <div className="sticky bottom-0 pt-2 pb-1 bg-gradient-to-t from-surface-sunken via-surface-sunken to-transparent">
      <button
        type="button"
        onClick={onSave}
        disabled={isUpdating}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50 min-h-[48px]"
      >
        {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Guardar cambios
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}
    </div>
  );
}

// ── Theme ──────────────────────────────────────────────────────────────────

export function ThemeSettingsEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<ThemeSettings>(() => parseThemeSettings(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parseThemeSettings(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Tema por defecto
        </label>
        <select
          value={local.default_theme}
          onChange={(e) => patch('default_theme', e.target.value as ThemeSettings['default_theme'])}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="system">Sistema</option>
          <option value="dark">Oscuro (bosque)</option>
          <option value="light">Claro</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Radio de bordes
        </label>
        <select
          value={local.border_radius}
          onChange={(e) => patch('border_radius', e.target.value as ThemeSettings['border_radius'])}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="sm">Suave (sm)</option>
          <option value="md">Editorial (md)</option>
          <option value="lg">Redondeado (lg)</option>
        </select>
      </div>
      <SliderField
        label="Intensidad grain"
        value={local.grain_intensity}
        min={0}
        max={1}
        step={0.05}
        unit=""
        onChange={(v) => patch('grain_intensity', v)}
      />
      <ToggleField
        label="Forzar dark en páginas públicas"
        desc="Ignora preferencia del usuario en la tienda"
        value={local.force_dark_public}
        onChange={(v) => patch('force_dark_public', v)}
      />
      <SaveBar dirty={dirty} isUpdating={isUpdating} onSave={() => { onSave({ ...local }); setDirty(false); }} />
    </div>
  );
}

// ── Announcement ───────────────────────────────────────────────────────────

export function AnnouncementSettingsEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<AnnouncementSettings>(() => parseAnnouncementSettings(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parseAnnouncementSettings(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof AnnouncementSettings>(key: K, value: AnnouncementSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="space-y-4 pb-8">
      <ToggleField
        label="Barra de anuncios activa"
        value={local.enabled}
        onChange={(v) => patch('enabled', v)}
      />
      <ToggleField
        label="Se puede cerrar"
        desc="Doble tap / dismiss guarda en sesión"
        value={local.dismissible}
        onChange={(v) => patch('dismissible', v)}
      />
      <SliderField
        label="Intervalo entre slides"
        value={local.interval_ms}
        min={2000}
        max={12000}
        step={500}
        unit="ms"
        onChange={(v) => patch('interval_ms', v)}
      />
      <SliderField
        label="Altura móvil"
        value={local.height_mobile_px}
        min={28}
        max={56}
        step={1}
        unit="px"
        onChange={(v) => patch('height_mobile_px', v)}
      />
      <SliderField
        label="Altura desktop"
        value={local.height_desktop_px}
        min={32}
        max={64}
        step={1}
        unit="px"
        onChange={(v) => patch('height_desktop_px', v)}
      />
      <SaveBar dirty={dirty} isUpdating={isUpdating} onSave={() => { onSave({ ...local }); setDirty(false); }} />
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────

export function FooterSettingsEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<FooterSettings>(() => parseFooterSettings(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parseFooterSettings(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="space-y-4 pb-8">
      <TextField label="Marca línea 1" value={local.brand_line1} onChange={(v) => patch('brand_line1', v)} />
      <TextField label="Marca línea 2" value={local.brand_line2} onChange={(v) => patch('brand_line2', v)} />
      <SliderField
        label="Tracking marca"
        value={local.brand_tracking_em}
        min={0}
        max={0.6}
        step={0.02}
        unit="em"
        onChange={(v) => patch('brand_tracking_em', v)}
      />
      <TextField label="Intro (ES)" value={local.intro} onChange={(v) => patch('intro', v)} multiline />
      <TextField
        label="Intro (EN)"
        value={local.intro_en ?? ''}
        onChange={(v) => patch('intro_en', v)}
        multiline
      />
      <ToggleField label="Mostrar redes" value={local.show_social} onChange={(v) => patch('show_social', v)} />
      <ToggleField label="Mostrar legal" value={local.show_legal} onChange={(v) => patch('show_legal', v)} />
      <ToggleField
        label="Newsletter"
        value={local.show_newsletter}
        onChange={(v) => patch('show_newsletter', v)}
      />
      {local.show_newsletter && (
        <>
          <TextField
            label="Newsletter título (ES)"
            value={local.newsletter_title}
            onChange={(v) => patch('newsletter_title', v)}
          />
          <TextField
            label="Newsletter desc (ES)"
            value={local.newsletter_desc}
            onChange={(v) => patch('newsletter_desc', v)}
            multiline
          />
          <TextField
            label="Placeholder email"
            value={local.newsletter_placeholder}
            onChange={(v) => patch('newsletter_placeholder', v)}
          />
        </>
      )}
      <TextField
        label="Copyright (sufijo)"
        value={local.copyright_suffix}
        onChange={(v) => patch('copyright_suffix', v)}
      />
      <SaveBar dirty={dirty} isUpdating={isUpdating} onSave={() => { onSave({ ...local }); setDirty(false); }} />
    </div>
  );
}

// ── PWA ────────────────────────────────────────────────────────────────────

export function PwaNavSettingsEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<PwaNavSettings>(() => parsePwaNavSettings(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parsePwaNavSettings(content));
    setDirty(false);
  }, [content]);

  return (
    <div className="space-y-4 pb-8">
      <ToggleField
        label="Bottom nav PWA activa"
        desc="Se muestra en modo standalone / shell móvil"
        value={local.enabled}
        onChange={(v) => {
          setLocal({ enabled: v });
          setDirty(true);
        }}
      />
      <p className="text-xs text-muted-foreground">
        Edita las pestañas en la sección <strong className="text-foreground">PWA — Pestañas</strong>.
      </p>
      <SaveBar dirty={dirty} isUpdating={isUpdating} onSave={() => { onSave({ ...local }); setDirty(false); }} />
    </div>
  );
}

// ── Brand ──────────────────────────────────────────────────────────────────

/** Checkerboard so transparent PNG/SVG is visible in editor. */
function TransparentPreview({
  src,
  alt,
  heightPx,
  maxWidthPx,
}: {
  src: string;
  alt: string;
  heightPx: number;
  maxWidthPx?: number;
}) {
  return (
    <div
      className="rounded-lg border border-border p-2 flex items-center justify-center min-h-[56px] w-full"
      style={{
        backgroundImage:
          'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
        backgroundSize: '12px 12px',
        backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
        backgroundColor: '#eee',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          height: `${heightPx}px`,
          maxWidth: maxWidthPx && maxWidthPx > 0 ? `${maxWidthPx}px` : '100%',
          width: 'auto',
        }}
        className="object-contain"
      />
    </div>
  );
}

function BrandAssetUploadField({
  label,
  hint,
  fieldName,
  value,
  previewHeight,
  previewMaxWidth,
  acceptTransparent,
  onUrlChange,
  onClear,
  onImageUpload,
}: {
  label: string;
  hint?: string;
  fieldName: keyof BrandAssets;
  value: string;
  previewHeight: number;
  previewMaxWidth?: number;
  acceptTransparent?: boolean;
  onUrlChange: (v: string) => void;
  onClear?: () => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || !onImageUpload) return;
    setUploading(true);
    setError(null);
    try {
      const url = await onImageUpload(file, fieldName);
      if (typeof url === 'string' && url) {
        onUrlChange(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 p-3 rounded-xl border border-border bg-background">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {hint ? <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p> : null}
      </div>

      {value ? (
        <TransparentPreview
          src={value}
          alt={label}
          heightPx={previewHeight}
          maxWidthPx={previewMaxWidth}
        />
      ) : (
        <div className="h-14 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground gap-2">
          <ImageIcon size={18} />
          <span className="text-xs">Sin imagen</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={uploading || !onImageUpload}
          onClick={() => document.getElementById(inputId)?.click()}
          className="flex flex-1 justify-center items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-surface-sunken border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50 min-h-[40px]"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {value ? 'Cambiar' : 'Subir a la nube'}
        </button>
        {value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-2.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 min-h-[40px]"
          >
            Quitar
          </button>
        ) : null}
      </div>
      <input
        id={inputId}
        type="file"
        accept={
          acceptTransparent
            ? 'image/png,image/svg+xml,image/webp,image/jpeg,image/gif,.png,.svg,.webp,.jpg,.jpeg'
            : 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'
        }
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <details className="group">
        <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground list-none">
          <span className="underline-offset-2 group-open:no-underline">URL manual (opcional)</span>
        </summary>
        <input
          type="text"
          value={value}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://… o /icons/…"
          className="mt-1.5 w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono"
        />
      </details>

      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

export function BrandAssetsEditor({ content, isUpdating, onSave, onImageUpload }: SettingsEditorProps) {
  const [local, setLocal] = useState<BrandAssets>(() => parseBrandAssets(content));
  const [dirty, setDirty] = useState(false);
  const localRef = React.useRef(local);
  localRef.current = local;

  useEffect(() => {
    setLocal(parseBrandAssets(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof BrandAssets>(key: K, value: BrandAssets[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  /**
   * A: upload solo devuelve URL; este editor es dueño del content y hace onSave completo
   * (heights + demás campos no se pisan).
   */
  const uploadBrandField = async (file: File, fieldName: string): Promise<string> => {
    if (!onImageUpload) return '';
    const url = await Promise.resolve(onImageUpload(file, fieldName));
    if (typeof url !== 'string' || !url) return '';
    const next = { ...localRef.current, [fieldName]: url } as BrandAssets;
    setLocal(next);
    onSave(next);
    setDirty(false);
    return url;
  };

  return (
    <div className="space-y-4 pb-8">
      <p className="text-xs text-muted-foreground">
        PNG/SVG con transparencia se conservan. El header usa <strong className="text-foreground">Marca</strong> por
        defecto; en Menú, “Mostrar logo” usa este logo (o un override si subís otro ahí).
      </p>

      <BrandAssetUploadField
        label="Logo header"
        hint="PNG o SVG transparente recomendado"
        fieldName="logo_url"
        value={local.logo_url}
        previewHeight={local.logo_height_px}
        previewMaxWidth={local.logo_max_width_px}
        acceptTransparent
        onUrlChange={(v) => patch('logo_url', v)}
        onClear={() => patch('logo_url', '')}
        onImageUpload={uploadBrandField}
      />

      <div className="space-y-3 p-3 rounded-xl border border-border bg-background">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Tamaño en tienda
        </p>
        <SliderField
          label="Alto logo header"
          value={local.logo_height_px}
          min={16}
          max={96}
          step={1}
          unit="px"
          onChange={(v) => patch('logo_height_px', v)}
        />
        <SliderField
          label="Ancho máximo header"
          value={local.logo_max_width_px}
          min={40}
          max={360}
          step={4}
          unit="px"
          onChange={(v) => patch('logo_max_width_px', v)}
        />
        <SliderField
          label="Alto logo footer"
          value={local.logo_footer_height_px}
          min={16}
          max={120}
          step={1}
          unit="px"
          onChange={(v) => patch('logo_footer_height_px', v)}
        />
        <TransparentPreview
          src={local.logo_url || '/icons/icon-192.svg'}
          alt="Vista previa tamaño header"
          heightPx={local.logo_height_px}
          maxWidthPx={local.logo_max_width_px}
        />
        <p className="text-[10px] text-muted-foreground">
          Vista previa a escala real del header. Guardá para aplicar en la tienda.
        </p>
      </div>

      <BrandAssetUploadField
        label="Logo footer"
        hint="Opcional · si vacío se usa el logo header"
        fieldName="logo_footer_url"
        value={local.logo_footer_url}
        previewHeight={local.logo_footer_height_px}
        previewMaxWidth={local.logo_max_width_px}
        acceptTransparent
        onUrlChange={(v) => patch('logo_footer_url', v)}
        onClear={() => patch('logo_footer_url', '')}
        onImageUpload={uploadBrandField}
      />
      <BrandAssetUploadField
        label="Favicon"
        hint="PNG 32–512px o SVG · se preserva transparencia"
        fieldName="favicon_url"
        value={local.favicon_url}
        previewHeight={32}
        previewMaxWidth={32}
        acceptTransparent
        onUrlChange={(v) => patch('favicon_url', v)}
        onImageUpload={uploadBrandField}
      />
      <BrandAssetUploadField
        label="Imagen OG / redes"
        hint="Compartir en redes · ideal 1200×630 (puede ser JPEG)"
        fieldName="og_image_url"
        value={local.og_image_url}
        previewHeight={64}
        previewMaxWidth={120}
        onUrlChange={(v) => patch('og_image_url', v)}
        onClear={() => patch('og_image_url', '')}
        onImageUpload={uploadBrandField}
      />

      <p className="text-[11px] text-muted-foreground">
        <strong className="text-foreground">Solo logo:</strong> Menú → Estilo → “Mostrar logo” (usa el logo de Marca si
        no hay override). <strong className="text-foreground">Logo + texto:</strong> desactivá “Mostrar logo” y dejá
        “Mostrar texto de marca”.
      </p>
      <SaveBar dirty={dirty} isUpdating={isUpdating} onSave={() => { onSave({ ...local }); setDirty(false); }} />
    </div>
  );
}

// ── Landing layout ─────────────────────────────────────────────────────────

const LANDING_BLOCK_ICONS: Record<LandingSectionId, ComponentType<LucideProps>> = {
  hero: Sparkles,
  conservation: Leaf,
  collections: Layers,
  media: GalleryHorizontalEnd,
  products: Package,
  video: PlayCircle,
  map: MapPin,
};

const LANDING_BLOCK_HINTS: Record<LandingSectionId, string> = {
  hero: 'Portada y CTA principal',
  conservation: 'Impacto regenerativo',
  collections: 'Grid de colecciones',
  media: 'Carrusel de media',
  products: 'Creaciones destacadas',
  video: 'Video central',
  map: 'Mapa / origen',
};

export function LandingLayoutEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<LandingLayoutSettings>(() => parseLandingLayout(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parseLandingLayout(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof LandingLayoutSettings>(key: K, value: LandingLayoutSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...local.sections].sort((a, b) => a.order - b.order);
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    patch(
      'sections',
      next.map((s, i) => ({ ...s, order: i })),
    );
  };

  const toggleSection = (id: LandingSectionId) => {
    patch(
      'sections',
      local.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const ordered = [...local.sections].sort((a, b) => a.order - b.order);
  const enabledCount = ordered.filter((s) => s.enabled).length;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Bloques del home (estilo theme sections). Ordená y activá sin código.
        </p>
        <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
          {enabledCount}/{ordered.length} activos
        </span>
      </div>
      <div className="space-y-1.5">
        {ordered.map((sec, index) => {
          const Icon = LANDING_BLOCK_ICONS[sec.id] ?? LayoutTemplate;
          return (
            <div
              key={sec.id}
              className={`flex items-center gap-2 p-2 pl-1.5 rounded-xl border transition-all ${
                sec.enabled
                  ? 'border-border bg-background shadow-sm'
                  : 'border-border/50 bg-surface-sunken/80 opacity-75'
              }`}
            >
              <div className="flex flex-col text-muted-foreground/50 px-0.5">
                <GripVertical size={14} />
              </div>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveSection(index, -1)}
                  className="p-0.5 rounded border border-border/80 text-muted-foreground hover:text-foreground disabled:opacity-25"
                  aria-label="Subir bloque"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  disabled={index === ordered.length - 1}
                  onClick={() => moveSection(index, 1)}
                  className="p-0.5 rounded border border-border/80 text-muted-foreground hover:text-foreground disabled:opacity-25"
                  aria-label="Bajar bloque"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  sec.enabled
                    ? 'bg-accent/10 border-accent/25 text-accent'
                    : 'bg-surface-raised border-border text-muted-foreground'
                }`}
              >
                <Icon size={16} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {LANDING_SECTION_LABELS[sec.id] ?? sec.id}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {LANDING_BLOCK_HINTS[sec.id] ?? sec.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border min-h-[36px] transition-colors ${
                  sec.enabled
                    ? 'border-accent/40 text-accent bg-accent/10 hover:bg-accent/15'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                title={sec.enabled ? 'Ocultar bloque' : 'Mostrar bloque'}
              >
                {sec.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                <span className="hidden sm:inline">{sec.enabled ? 'Visible' : 'Oculto'}</span>
              </button>
            </div>
          );
        })}
      </div>

      <ToggleField
        label="Grain overlay"
        value={local.show_grain}
        onChange={(v) => patch('show_grain', v)}
      />
      <ToggleField
        label="Cursor custom (desktop)"
        value={local.show_custom_cursor}
        onChange={(v) => patch('show_custom_cursor', v)}
      />
      <ToggleField
        label="Bee canvas (desktop)"
        value={local.show_bee_canvas}
        onChange={(v) => patch('show_bee_canvas', v)}
      />
      <ToggleField
        label="CTA en hero"
        value={local.show_hero_cta}
        onChange={(v) => patch('show_hero_cta', v)}
      />
      {local.show_hero_cta ? (
        <>
          <TextField
            label="CTA label (ES)"
            value={local.hero_cta_label}
            onChange={(v) => patch('hero_cta_label', v)}
          />
          <TextField
            label="CTA label (EN)"
            value={local.hero_cta_label_en ?? ''}
            onChange={(v) => patch('hero_cta_label_en', v)}
          />
          <TextField
            label="CTA href"
            value={local.hero_cta_href}
            onChange={(v) => patch('hero_cta_href', v)}
          />
        </>
      ) : null}

      <SaveBar
        dirty={dirty}
        isUpdating={isUpdating}
        onSave={() => {
          onSave({ ...local });
          setDirty(false);
        }}
      />
    </div>
  );
}

// ── Catalog ────────────────────────────────────────────────────────────────

export function CatalogSettingsEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<CatalogSettings>(() => parseCatalogSettings(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parseCatalogSettings(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof CatalogSettings>(key: K, value: CatalogSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="space-y-4 pb-8">
      <TextField label="Título (ES)" value={local.page_title} onChange={(v) => patch('page_title', v)} />
      <TextField
        label="Título (EN)"
        value={local.page_title_en ?? ''}
        onChange={(v) => patch('page_title_en', v)}
      />
      <TextField
        label="Subtítulo (ES)"
        value={local.page_subtitle}
        onChange={(v) => patch('page_subtitle', v)}
        multiline
      />
      <SliderField
        label="Columnas desktop"
        value={local.columns_desktop}
        min={2}
        max={4}
        step={1}
        unit=""
        onChange={(v) => patch('columns_desktop', v)}
      />
      <SliderField
        label="Columnas móvil"
        value={local.columns_mobile}
        min={1}
        max={2}
        step={1}
        unit=""
        onChange={(v) => patch('columns_mobile', v)}
      />
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Orden por defecto
        </label>
        <select
          value={local.default_sort}
          onChange={(e) => patch('default_sort', e.target.value as CatalogSettings['default_sort'])}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="default">Default</option>
          <option value="name">Nombre</option>
          <option value="price-asc">Precio ↑</option>
          <option value="price-desc">Precio ↓</option>
        </select>
      </div>
      <ToggleField label="Búsqueda" value={local.show_search} onChange={(v) => patch('show_search', v)} />
      <ToggleField label="Filtros" value={local.show_filters} onChange={(v) => patch('show_filters', v)} />
      <ToggleField label="Ratings" value={local.show_ratings} onChange={(v) => patch('show_ratings', v)} />
      <ToggleField label="Badges" value={local.show_badges} onChange={(v) => patch('show_badges', v)} />
      <TextField
        label="Mensaje vacío (ES)"
        value={local.empty_message}
        onChange={(v) => patch('empty_message', v)}
      />
      <SaveBar
        dirty={dirty}
        isUpdating={isUpdating}
        onSave={() => {
          onSave({ ...local });
          setDirty(false);
        }}
      />
    </div>
  );
}

// ── PDP ────────────────────────────────────────────────────────────────────

export function PdpSettingsEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<PdpSettings>(() => parsePdpSettings(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parsePdpSettings(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof PdpSettings>(key: K, value: PdpSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="space-y-4 pb-8">
      <ToggleField
        label="Breadcrumb"
        value={local.show_breadcrumb}
        onChange={(v) => patch('show_breadcrumb', v)}
      />
      <ToggleField
        label="Badge de formato"
        value={local.show_format_badge}
        onChange={(v) => patch('show_format_badge', v)}
      />
      <ToggleField
        label="Badges de impacto"
        value={local.show_badges}
        onChange={(v) => patch('show_badges', v)}
      />
      <ToggleField
        label="Trazabilidad QR"
        value={local.show_traceability}
        onChange={(v) => patch('show_traceability', v)}
      />
      <ToggleField
        label="Reseñas"
        value={local.show_reviews}
        onChange={(v) => patch('show_reviews', v)}
      />
      <ToggleField
        label="Reposición / suscripción en CTA"
        desc="El bloque de compra puede ocultar ritual si se desactiva en purchase actions (flag base)"
        value={local.show_replenishment}
        onChange={(v) => patch('show_replenishment', v)}
      />
      <TextField
        label="Link seguir explorando (ES)"
        value={local.continue_label}
        onChange={(v) => patch('continue_label', v)}
      />
      <TextField
        label="Link seguir explorando (EN)"
        value={local.continue_label_en ?? ''}
        onChange={(v) => patch('continue_label_en', v)}
      />
      <SaveBar
        dirty={dirty}
        isUpdating={isUpdating}
        onSave={() => {
          onSave({ ...local });
          setDirty(false);
        }}
      />
    </div>
  );
}

// ── SEO ────────────────────────────────────────────────────────────────────

export function SeoDefaultsEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<SeoDefaults>(() => parseSeoDefaults(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parseSeoDefaults(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof SeoDefaults>(key: K, value: SeoDefaults[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="space-y-4 pb-8">
      <TextField
        label="Título default"
        value={local.default_title}
        onChange={(v) => patch('default_title', v)}
      />
      <TextField
        label="Template de título (%s = página)"
        value={local.title_template}
        onChange={(v) => patch('title_template', v)}
      />
      <TextField
        label="Description (ES)"
        value={local.default_description}
        onChange={(v) => patch('default_description', v)}
        multiline
      />
      <TextField
        label="Description (EN)"
        value={local.default_description_en ?? ''}
        onChange={(v) => patch('default_description_en', v)}
        multiline
      />
      <TextField
        label="Site name (OG)"
        value={local.site_name}
        onChange={(v) => patch('site_name', v)}
      />
      <TextField
        label="OG image URL"
        value={local.og_image_url}
        onChange={(v) => patch('og_image_url', v)}
      />
      <TextField
        label="Twitter handle (@...)"
        value={local.twitter_handle}
        onChange={(v) => patch('twitter_handle', v)}
      />
      <SaveBar
        dirty={dirty}
        isUpdating={isUpdating}
        onSave={() => {
          onSave({ ...local });
          setDirty(false);
        }}
      />
    </div>
  );
}

// ── Contact ────────────────────────────────────────────────────────────────

export function ContactSettingsEditor({ content, isUpdating, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<ContactSettings>(() => parseContactSettings(content));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(parseContactSettings(content));
    setDirty(false);
  }, [content]);

  const patch = <K extends keyof ContactSettings>(key: K, value: ContactSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="space-y-4 pb-8">
      <ToggleField
        label="Botón flotante WhatsApp"
        value={local.show_whatsapp_float}
        onChange={(v) => patch('show_whatsapp_float', v)}
      />
      <TextField
        label="WhatsApp E.164 (solo dígitos)"
        value={local.whatsapp_e164}
        onChange={(v) => patch('whatsapp_e164', v)}
      />
      <TextField
        label="Mensaje prefill (ES)"
        value={local.whatsapp_prefill}
        onChange={(v) => patch('whatsapp_prefill', v)}
        multiline
      />
      <TextField
        label="Mensaje prefill (EN)"
        value={local.whatsapp_prefill_en ?? ''}
        onChange={(v) => patch('whatsapp_prefill_en', v)}
        multiline
      />
      <TextField label="Email" value={local.email} onChange={(v) => patch('email', v)} />
      <TextField
        label="Teléfono (display)"
        value={local.phone_display}
        onChange={(v) => patch('phone_display', v)}
      />
      <TextField
        label="Dirección (ES)"
        value={local.address}
        onChange={(v) => patch('address', v)}
        multiline
      />
      <TextField label="Horario (ES)" value={local.hours} onChange={(v) => patch('hours', v)} />
      <SaveBar
        dirty={dirty}
        isUpdating={isUpdating}
        onSave={() => {
          onSave({ ...local });
          setDirty(false);
        }}
      />
    </div>
  );
}

/** Secciones con editor settings dedicado (una sola fila). */
export const SETTINGS_SECTION_KEYS = new Set([
  'theme_settings',
  'announcement_settings',
  'footer_settings',
  'pwa_nav_settings',
  'brand_assets',
  'menu_settings',
  'landing_layout',
  'catalog_settings',
  'pdp_settings',
  'seo_defaults',
  'contact_settings',
]);

/** Legales: un solo item por sección, editor de título + body HTML. */
export const LEGAL_SECTION_KEYS = new Set([
  'legal_terminos',
  'legal_privacidad',
  'legal_cookies',
  'legal_envio',
  'legal_reembolso',
  'legal_cancelacion',
  'legal_garantia',
]);

export function ChromeSettingsEditor({
  sectionKey,
  content,
  isUpdating,
  onSave,
  onImageUpload,
}: {
  sectionKey: string;
  content: Record<string, unknown>;
  isUpdating: boolean;
  onSave: (content: Record<string, unknown>) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
}) {
  const props: SettingsEditorProps = { content, isUpdating, onSave, onImageUpload };
  switch (sectionKey) {
    case 'theme_settings':
      return <ThemeSettingsEditor {...props} />;
    case 'announcement_settings':
      return <AnnouncementSettingsEditor {...props} />;
    case 'footer_settings':
      return <FooterSettingsEditor {...props} />;
    case 'pwa_nav_settings':
      return <PwaNavSettingsEditor {...props} />;
    case 'brand_assets':
      return <BrandAssetsEditor {...props} />;
    case 'landing_layout':
      return <LandingLayoutEditor {...props} />;
    case 'catalog_settings':
      return <CatalogSettingsEditor {...props} />;
    case 'pdp_settings':
      return <PdpSettingsEditor {...props} />;
    case 'seo_defaults':
      return <SeoDefaultsEditor {...props} />;
    case 'contact_settings':
      return <ContactSettingsEditor {...props} />;
    default:
      return null;
  }
}
