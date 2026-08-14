'use client';

import React, { useEffect, useId, useState, type ComponentType } from 'react';
import {
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
  parseCheckoutSettings,
  parseCartSettings,
  LANDING_SECTION_LABELS,
  type SeoDefaults,
  type ContactSettings,
  type CheckoutSettings,
  type CartSettings,
  type VideoSettings,
  type MapSettings,
  type ProductsSettings,
  parseVideoSettings,
  parseMapSettings,
  parseProductsSettings,
} from '@/lib/store-chrome';
import { TypographySettingsEditor } from '@/components/tienda/TypographySettingsEditor';
import { SeasonalSettingsEditor } from '@/components/tienda/SeasonalSettingsEditor';
import {
  ConservationEditor,
  MapSettingsEditor,
  ProductsSettingsEditor,
  VideoSettingsEditor,
  CollectionsSettingsEditor,
  GaleriaSettingsEditor,
  NosotrosSettingsEditor,
  MediaSettingsEditor,
  CienciaSettingsEditor,
} from '@/components/tienda/HomeBlockEditors';
import { useAutosaveEditor } from '@/components/tienda/save-status';

interface SettingsEditorProps {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  /** Sube a Storage CMS (WEBP optimizado) y devuelve URL pública. */
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
}

function SliderField({
  label,
  desc,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  desc?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const sliderId = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={sliderId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <span className="text-xs font-mono text-accent tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {unit}
        </span>
      </div>
      {desc ? <p className="text-[10px] text-muted-foreground -mt-1">{desc}</p> : null}
      <input
        id={sliderId}
        name={sliderId}
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
  const fieldId = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={fieldId}
          name={fieldId}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-y"
        />
      ) : (
        <input
          id={fieldId}
          name={fieldId}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}
    </div>
  );
}

// ── Theme ──────────────────────────────────────────────────────────────────

/** Presets de acento (HSL). Oro miel = default de tokens.css. */
const ACCENT_PRESETS: { label: string; h: number; s: number; l: number }[] = [
  { label: 'Oro miel', h: 44, s: 85, l: 46 },
  { label: 'Cobre', h: 25, s: 75, l: 50 },
  { label: 'Bosque', h: 160, s: 40, l: 35 },
  { label: 'Terracota', h: 12, s: 65, l: 50 },
  { label: 'Burdeos', h: 340, s: 55, l: 35 },
  { label: 'Salvia', h: 90, s: 25, l: 40 },
];

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const r = parseInt(m[1].slice(0, 2), 16) / 255;
  const g = parseInt(m[1].slice(2, 4), 16) / 255;
  const b = parseInt(m[1].slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return `#${rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}

export function ThemeSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<ThemeSettings>(() => parseThemeSettings(content));
  const { isDirty } = useAutosaveEditor('theme_settings', local, (next) => onSave(next));
  const themeId = useId();
  const radiusId = useId();

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parseThemeSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="space-y-1.5">
        <label htmlFor={themeId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Tema por defecto
        </label>
        <select
          id={themeId}
          name={themeId}
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
        <label htmlFor={radiusId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Radio de bordes
        </label>
        <select
          id={radiusId}
          name={radiusId}
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
        desc="0.35 ≈ look actual (la opacidad real es 0–6%)"
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

      <div className="space-y-3 p-3 rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Color de acento
          </h4>
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            {local.accent_h} {local.accent_s}% {local.accent_l}%
          </span>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-6 gap-2">
          {ACCENT_PRESETS.map((p) => {
            const active =
              p.h === local.accent_h && p.s === local.accent_s && p.l === local.accent_l;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  patch('accent_h', p.h);
                  patch('accent_s', p.s);
                  patch('accent_l', p.l);
                }}
                title={p.label}
                aria-label={`Acento ${p.label}`}
                className={`min-h-11 rounded-lg border transition-all ${
                  active ? 'ring-2 ring-accent scale-105' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: `hsl(${p.h} ${p.s}% ${p.l}%)`,
                  borderColor: active ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                }}
              />
            );
          })}
        </div>

        {/* Color libre */}
        <div className="flex items-center gap-3">
          <input
            id="accent-color-free"
            name="accent-color-free"
            type="color"
            value={hslToHex(local.accent_h, local.accent_s, local.accent_l)}
            onChange={(e) => {
              const c = hexToHsl(e.target.value);
              if (!c) return;
              patch('accent_h', c.h);
              patch('accent_s', c.s);
              patch('accent_l', c.l);
            }}
            className="w-14 h-11 rounded-lg border border-border bg-background cursor-pointer"
            aria-label="Color de acento libre"
          />
          <p className="text-[11px] text-muted-foreground">
            Color libre (selector) o preset. Se aplica a botones, links y acentos de la tienda.
          </p>
        </div>

        {/* Preview sobre dark y light */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-background p-3 flex flex-col items-center gap-2">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Sobre fondo oscuro
            </p>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: `hsl(${local.accent_h} ${local.accent_s}% ${local.accent_l}%)`,
                color: 'hsl(var(--accent-foreground))',
              }}
            >
              Comprar
            </button>
            <p
              className="text-[11px] font-medium"
              style={{ color: `hsl(${local.accent_h} ${local.accent_s}% ${local.accent_l}%)` }}
            >
              Link de acento
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-raised p-3 flex flex-col items-center gap-2">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Sobre fondo claro
            </p>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: `hsl(${local.accent_h} ${local.accent_s}% ${local.accent_l}%)`,
                color: 'hsl(var(--accent-foreground))',
              }}
            >
              Comprar
            </button>
            <p
              className="text-[11px] font-medium"
              style={{ color: `hsl(${local.accent_h} ${local.accent_s}% ${local.accent_l}%)` }}
            >
              Link de acento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Announcement ───────────────────────────────────────────────────────────

export function AnnouncementSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<AnnouncementSettings>(() => parseAnnouncementSettings(content));
  const { isDirty } = useAutosaveEditor('announcement_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseAnnouncementSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof AnnouncementSettings>(key: K, value: AnnouncementSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
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
        label="Altura móvil (mínima)"
        desc="La barra crece si el mensaje envuelve"
        value={local.height_mobile_px}
        min={44}
        max={72}
        step={1}
        unit="px"
        onChange={(v) => patch('height_mobile_px', v)}
      />
      <SliderField
        label="Altura desktop (mínima)"
        desc="La barra crece si el mensaje envuelve"
        value={local.height_desktop_px}
        min={44}
        max={80}
        step={1}
        unit="px"
        onChange={(v) => patch('height_desktop_px', v)}
      />
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────

export function FooterSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<FooterSettings>(() => parseFooterSettings(content));
  const { isDirty } = useAutosaveEditor('footer_settings', local, (next) => onSave(next));

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parseFooterSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
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
    </div>
  );
}

// ── PWA ────────────────────────────────────────────────────────────────────

export function PwaNavSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<PwaNavSettings>(() => parsePwaNavSettings(content));
  const { isDirty } = useAutosaveEditor('pwa_nav_settings', local, (next) => onSave(next));

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parsePwaNavSettings(content));
  }, [content, isDirty]);

  return (
    <div className="space-y-4 pb-8">
      <ToggleField
        label="Bottom nav PWA activa"
        desc="Se muestra en modo standalone / shell móvil"
        value={local.enabled}
        onChange={(v) => {
          setLocal({ enabled: v });
        }}
      />
      <p className="text-xs text-muted-foreground">
        Edita las pestañas en la sección <strong className="text-foreground">PWA — Pestañas</strong>.
      </p>
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
          'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)',
        backgroundSize: '12px 12px',
        backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
        backgroundColor: 'hsl(var(--muted) / 0.5)',
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
          id={`${inputId}-url`}
          name={`${inputId}-url`}
          type="text"
          autoComplete="off"
          aria-label={`${label} — URL manual`}
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

export function BrandAssetsEditor({ content, onSave, onImageUpload }: SettingsEditorProps) {
  const [local, setLocal] = useState<BrandAssets>(() => parseBrandAssets(content));
  const localRef = React.useRef(local);
  localRef.current = local;
  const { isDirty, flush } = useAutosaveEditor('brand_assets', local, (next) => onSave(next));

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parseBrandAssets(content));
  }, [content, isDirty]);

  const patch = <K extends keyof BrandAssets>(key: K, value: BrandAssets[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
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
    await flush(next); // upload -> guardado inmediato (sin debounce)
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

export function LandingLayoutEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<LandingLayoutSettings>(() => parseLandingLayout(content));
  const { isDirty } = useAutosaveEditor('landing_layout', local, (next) => onSave(next));

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parseLandingLayout(content));
  }, [content, isDirty]);

  const patch = <K extends keyof LandingLayoutSettings>(key: K, value: LandingLayoutSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
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
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-border/80 text-muted-foreground hover:text-foreground disabled:opacity-25"
                  aria-label="Subir bloque"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={index === ordered.length - 1}
                  onClick={() => moveSection(index, 1)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-border/80 text-muted-foreground hover:text-foreground disabled:opacity-25"
                  aria-label="Bajar bloque"
                >
                  <ChevronDown size={14} />
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
                className={`inline-flex min-h-11 items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
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

      <div className="pt-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
          Copy del hero
        </p>
        <p className="text-[10px] text-muted-foreground mb-3">
          Vacío = texto por defecto (i18n). Aplica en desktop y móvil.
        </p>
        <div className="space-y-3">
          <TextField
            label="Eyebrow (ES)"
            value={local.hero_eyebrow}
            onChange={(v) => patch('hero_eyebrow', v)}
          />
          <TextField
            label="Eyebrow (EN)"
            value={local.hero_eyebrow_en ?? ''}
            onChange={(v) => patch('hero_eyebrow_en', v)}
          />
          <TextField
            label="Título línea 1 (ES)"
            value={local.hero_title_line1}
            onChange={(v) => patch('hero_title_line1', v)}
          />
          <TextField
            label="Título línea 1 (EN)"
            value={local.hero_title_line1_en ?? ''}
            onChange={(v) => patch('hero_title_line1_en', v)}
          />
          <TextField
            label="Título línea 2 (ES)"
            value={local.hero_title_line2}
            onChange={(v) => patch('hero_title_line2', v)}
          />
          <TextField
            label="Título línea 2 (EN)"
            value={local.hero_title_line2_en ?? ''}
            onChange={(v) => patch('hero_title_line2_en', v)}
          />
          <TextField
            label="Subtítulo (ES)"
            value={local.hero_subtitle}
            onChange={(v) => patch('hero_subtitle', v)}
          />
          <TextField
            label="Subtítulo (EN)"
            value={local.hero_subtitle_en ?? ''}
            onChange={(v) => patch('hero_subtitle_en', v)}
          />
          <TextField
            label="Fórmula (ES)"
            value={local.hero_formula}
            onChange={(v) => patch('hero_formula', v)}
          />
          <TextField
            label="Fórmula (EN)"
            value={local.hero_formula_en ?? ''}
            onChange={(v) => patch('hero_formula_en', v)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Catalog ────────────────────────────────────────────────────────────────

export function CatalogSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<CatalogSettings>(() => parseCatalogSettings(content));
  const { isDirty } = useAutosaveEditor('catalog_settings', local, (next) => onSave(next));
  const sortId = useId();

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parseCatalogSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof CatalogSettings>(key: K, value: CatalogSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
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
        <label htmlFor={sortId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Orden por defecto
        </label>
        <select
          id={sortId}
          name={sortId}
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

      <div className="grid gap-3 sm:grid-cols-2 pt-2">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Relación de Aspecto (Productos)</label>
          <select
            value={local.image_aspect_ratio}
            onChange={(e) => patch('image_aspect_ratio', e.target.value as CatalogSettings['image_aspect_ratio'])}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="1/1">1:1 Cuadrado (Predeterminado)</option>
            <option value="4/3">4:3 Horizontal</option>
            <option value="3/4">3:4 Vertical / Retrato</option>
            <option value="16/10">16:10 Panorámico</option>
            <option value="auto">Auto (Original)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Modo de Encuadre (Productos)</label>
          <select
            value={local.image_fit}
            onChange={(e) => patch('image_fit', e.target.value as CatalogSettings['image_fit'])}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="cover">Rellenar contenedor (Cover)</option>
            <option value="contain">Ajustar foto completa sin cortar (Contain)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ── PDP ────────────────────────────────────────────────────────────────────

export function PdpSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<PdpSettings>(() => parsePdpSettings(content));
  const { isDirty } = useAutosaveEditor('pdp_settings', local, (next) => onSave(next));

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parsePdpSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof PdpSettings>(key: K, value: PdpSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
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
    </div>
  );
}

// ── SEO ────────────────────────────────────────────────────────────────────

export function SeoDefaultsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<SeoDefaults>(() => parseSeoDefaults(content));
  const { isDirty } = useAutosaveEditor('seo_defaults', local, (next) => onSave(next));

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parseSeoDefaults(content));
  }, [content, isDirty]);

  const patch = <K extends keyof SeoDefaults>(key: K, value: SeoDefaults[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
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
    </div>
  );
}

// ── Contact ────────────────────────────────────────────────────────────────

export function ContactSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<ContactSettings>(() => parseContactSettings(content));
  const { isDirty } = useAutosaveEditor('contact_settings', local, (next) => onSave(next));

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(parseContactSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof ContactSettings>(key: K, value: ContactSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
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
    </div>
  );
}

export function CheckoutSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<CheckoutSettings>(() => parseCheckoutSettings(content));
  const { isDirty } = useAutosaveEditor('checkout_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseCheckoutSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof CheckoutSettings>(key: K, value: CheckoutSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-4 pb-8">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Copy del checkout (se publica al instante — sección de diseño). Vacío = texto actual.
      </p>
      <TextField label="Título" value={local.title} onChange={(v) => patch('title', v)} />
      <TextField
        label="Subtítulo"
        value={local.subtitle}
        onChange={(v) => patch('subtitle', v)}
        multiline
      />
      <TextField
        label="Compra privada — Título"
        value={local.buyer_private_label}
        onChange={(v) => patch('buyer_private_label', v)}
      />
      <TextField
        label="Compra privada — Texto"
        value={local.buyer_private_desc}
        onChange={(v) => patch('buyer_private_desc', v)}
        multiline
      />
      <TextField
        label="Compra legado — Título"
        value={local.buyer_legacy_label}
        onChange={(v) => patch('buyer_legacy_label', v)}
      />
      <TextField
        label="Compra legado — Texto"
        value={local.buyer_legacy_desc}
        onChange={(v) => patch('buyer_legacy_desc', v)}
        multiline
      />
      <TextField
        label="Envío — Título de sección"
        value={local.shipping_title}
        onChange={(v) => patch('shipping_title', v)}
      />
      <TextField
        label="Envío — Label del courier"
        value={local.courier_label}
        onChange={(v) => patch('courier_label', v)}
      />
      <TextField
        label="Envío — Nota (predeterminado)"
        value={local.shipping_note}
        onChange={(v) => patch('shipping_note', v)}
        multiline
      />
      <TextField
        label="Código postal — Label"
        value={local.postal_label}
        onChange={(v) => patch('postal_label', v)}
      />
      <TextField
        label="Seguridad — Pago encriptado"
        value={local.secure_payment_text}
        onChange={(v) => patch('secure_payment_text', v)}
      />
      <TextField
        label="Seguridad — Transacción segura"
        value={local.secure_transaction_text}
        onChange={(v) => patch('secure_transaction_text', v)}
      />
      <TextField
        label="Términos — Prefijo (antes del link)"
        value={local.terms_prefix}
        onChange={(v) => patch('terms_prefix', v)}
      />
      <TextField
        label="Términos — Nota de seguridad (después del link)"
        value={local.secure_note}
        onChange={(v) => patch('secure_note', v)}
        multiline
      />
    </div>
  );
}

export function CartSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const [local, setLocal] = useState<CartSettings>(() => parseCartSettings(content));
  const { isDirty } = useAutosaveEditor('cart_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseCartSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof CartSettings>(key: K, value: CartSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-4 pb-8">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Copy del carrito (se publica al instante — sección de diseño). Vacío = texto actual.
      </p>
      <TextField
        label="Vacío — Título"
        value={local.empty_title}
        onChange={(v) => patch('empty_title', v)}
      />
      <TextField
        label="Vacío — Descripción"
        value={local.empty_desc}
        onChange={(v) => patch('empty_desc', v)}
      />
      <TextField
        label="Vacío — CTA"
        value={local.empty_cta}
        onChange={(v) => patch('empty_cta', v)}
      />
      <TextField
        label="Subtotal — Label"
        value={local.subtotal_label}
        onChange={(v) => patch('subtotal_label', v)}
      />
      <TextField
        label="Envío — Nota (calculado en checkout)"
        value={local.shipping_note}
        onChange={(v) => patch('shipping_note', v)}
      />
      <TextField
        label="CTA — Finalizar compra"
        value={local.cta_label}
        onChange={(v) => patch('cta_label', v)}
      />
    </div>
  );
}

// ── Ola 4: Contenido de bloques del home ───────────────────────────────────
// Vacío = la tienda cae al i18n / defaults (mismo patrón que el copy del hero).

function NumberField({
  label,
  value,
  onChange,
  step = 'any',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  const fieldId = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        id={fieldId}
        name={fieldId}
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}

/** Par ES/EN de un campo (en vacío = cae al español). */
function LocalizedFields({
  esLabel,
  es,
  en,
  onEs,
  onEn,
  multiline,
}: {
  esLabel: string;
  es: string;
  en: string | undefined;
  onEs: (v: string) => void;
  onEn: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <>
      <TextField label={esLabel} value={es} onChange={onEs} multiline={multiline} />
      <TextField
        label={`${esLabel} (EN)`}
        value={en ?? ''}
        onChange={onEn}
        multiline={multiline}
      />
    </>
  );
}

export const SETTINGS_SECTION_KEYS = new Set([
  'theme_settings',
  'typography_settings',
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
  'checkout_settings',
  'cart_settings',
  'seasonal_settings',
  'conservation_content',
  'video_settings',
  'map_settings',
  'products_settings',
  'collections_settings',
  'galeria_settings',
  'nosotros_settings',
  'media_settings',
  'ciencia_settings',
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
  onSave,
  onImageUpload,
}: {
  sectionKey: string;
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
}) {
  const props: SettingsEditorProps = { content, onSave, onImageUpload };
  switch (sectionKey) {
    case 'theme_settings':
      return <ThemeSettingsEditor {...props} />;
    case 'typography_settings':
      return <TypographySettingsEditor content={content} onSave={onSave} />;
    case 'seasonal_settings':
      return <SeasonalSettingsEditor content={content} onSave={onSave} />;
    case 'video_settings':
      return <VideoSettingsEditor content={content} onSave={onSave} />;
    case 'map_settings':
      return <MapSettingsEditor content={content} onSave={onSave} />;
    case 'products_settings':
      return <ProductsSettingsEditor content={content} onSave={onSave} />;
    case 'collections_settings':
      return <CollectionsSettingsEditor content={content} onSave={onSave} />;
    case 'galeria_settings':
      return <GaleriaSettingsEditor content={content} onSave={onSave} />;
    case 'nosotros_settings':
      return <NosotrosSettingsEditor content={content} onSave={onSave} />;
    case 'media_settings':
      return <MediaSettingsEditor content={content} onSave={onSave} />;
    case 'ciencia_settings':
      return <CienciaSettingsEditor content={content} onSave={onSave} />;
    case 'conservation_content':
      return <ConservationEditor content={content} onSave={onSave} />;
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
    case 'checkout_settings':
      return <CheckoutSettingsEditor content={content} onSave={onSave} />;
    case 'cart_settings':
      return <CartSettingsEditor content={content} onSave={onSave} />;
    default:
      return null;
  }
}
