'use client';

import React, { useEffect, useId, useState, type ComponentType } from 'react';
import {
  Loader2,
  Upload,
  Image as ImageIcon,
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
  ChevronRight,
  BadgeCheck,
  Palette,
  SlidersHorizontal,
  LayoutTemplate,
  Smartphone,
  Monitor,
  RotateCcw,
  Compass,
  Store,
  type LucideProps,
} from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';
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
  DEFAULT_THEME_SETTINGS,
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
  LANDING_SECTION_EDITOR_KEY,
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
import { SeoStudioEditor } from '@/components/tienda/SeoStudioEditor';
import {
  AlignField,
  ConservationEditor,
  MapSettingsEditor,
  ProductsSettingsEditor,
  VideoSettingsEditor,
  CollectionsSettingsEditor,
  GaleriaSettingsEditor,
  NosotrosSettingsEditor,
  MediaSettingsEditor,
  CienciaSettingsEditor,
  AuthSettingsEditor,
  LegalDocEditor,
} from '@/components/tienda/HomeBlockEditors';
import { useAutosaveEditor, useAutosaveState } from '@/components/tienda/save-status';

interface SettingsEditorProps {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  /** Sube a Storage CMS (WEBP optimizado) y devuelve URL pública. */
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
  /** Desde Orden del home: abrir la herramienta de fichas (un solo carrusel, etc.). */
  onOpenSection?: (sectionKey: string) => void;
  /** Workspace Inicio: árbol + panel del nodo (hero / atmósfera). */
  workspace?: boolean;
  selectedNode?: LandingSectionId | 'atmosphere';
  onSelectNode?: (id: LandingSectionId | 'atmosphere') => void;
  draftSectionIds?: Partial<Record<LandingSectionId, boolean>>;
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
  // El dato guardado puede estar fuera del rango vigente (rangos antiguos o
  // edición externa): el thumb se fija al borde sin reescribir el valor.
  const clamped = Math.min(max, Math.max(min, value));
  const outOfRange = clamped !== value;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={sliderId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <span className="text-xs font-mono text-accent tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {unit}
          {outOfRange ? ' · fuera de rango' : ''}
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
        value={clamped}
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
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
          placeholder={placeholder}
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent resize-y"
        />
      ) : (
        <input
          id={fieldId}
          name={fieldId}
          type="text"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const fieldId = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <select
        id={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Theme ──────────────────────────────────────────────────────────────────

export type ColorHslPreset = { label: string; h: number; s: number; l: number };

/** Presets de acento (HSL). Oro miel = default de tokens.css. */
const ACCENT_PRESETS: ColorHslPreset[] = [
  { label: 'Oro miel', h: 44, s: 85, l: 46 },
  { label: 'Cobre', h: 25, s: 75, l: 50 },
  { label: 'Bosque', h: 160, s: 40, l: 35 },
  { label: 'Terracota', h: 12, s: 65, l: 50 },
  { label: 'Burdeos', h: 340, s: 55, l: 35 },
  { label: 'Salvia', h: 90, s: 25, l: 40 },
];

/** Presets de fondo oscuro (canvas profundo). */
const BG_DARK_PRESETS: ColorHslPreset[] = [
  { label: 'Negro tinta', h: 0, s: 0, l: 3 },
  { label: 'Bosque noche', h: 167, s: 40, l: 6 },
  { label: 'Grafito lluvia', h: 220, s: 15, l: 6 },
  { label: 'Carbón turba', h: 24, s: 15, l: 5 },
  { label: 'Ulmo nocturno', h: 150, s: 25, l: 5 },
  { label: 'Cacao profundo', h: 30, s: 20, l: 4 },
];

/** Presets de fondo claro (canvas luminoso/orgánico). */
const BG_LIGHT_PRESETS: ColorHslPreset[] = [
  { label: 'Crema suave', h: 35, s: 60, l: 97 },
  { label: 'Lino natural', h: 40, s: 30, l: 95 },
  { label: 'Cera virgen', h: 45, s: 45, l: 97 },
  { label: 'Blanco nieve', h: 0, s: 0, l: 99 },
  { label: 'Salvia pálido', h: 120, s: 15, l: 96 },
  { label: 'Arena costera', h: 32, s: 25, l: 93 },
];

/** Presets de superficie oscura (tarjetas, modales). */
const SURFACE_DARK_PRESETS: ColorHslPreset[] = [
  { label: 'Tinta elevada', h: 0, s: 0, l: 7 },
  { label: 'Bosque bruma', h: 167, s: 30, l: 9 },
  { label: 'Grafito suave', h: 220, s: 12, l: 9 },
  { label: 'Carbón tenue', h: 24, s: 12, l: 8 },
];

/** Presets de superficie clara (tarjetas, modales). */
const SURFACE_LIGHT_PRESETS: ColorHslPreset[] = [
  { label: 'Blanco puro', h: 35, s: 60, l: 100 },
  { label: 'Crema pura', h: 35, s: 50, l: 99 },
  { label: 'Hueso luminoso', h: 40, s: 25, l: 97 },
  { label: 'Lino tenue', h: 40, s: 20, l: 96 },
];

/** Presets de texto modo oscuro. */
const TEXT_DARK_PRESETS: ColorHslPreset[] = [
  { label: 'Crema legado', h: 35, s: 60, l: 93 },
  { label: 'Blanco suave', h: 0, s: 0, l: 98 },
  { label: 'Hueso cálido', h: 40, s: 30, l: 90 },
];

/** Presets de texto modo claro. */
const TEXT_LIGHT_PRESETS: ColorHslPreset[] = [
  { label: 'Negro tinta', h: 0, s: 0, l: 7 },
  { label: 'Carbón profundo', h: 220, s: 20, l: 12 },
  { label: 'Bosque sombra', h: 160, s: 30, l: 10 },
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

interface ColorTokenPickerProps {
  id: string;
  label: string;
  desc?: string;
  h: number;
  s: number;
  l: number;
  presets: ColorHslPreset[];
  onChange: (h: number, s: number, l: number) => void;
  defaultValues?: { h: number; s: number; l: number };
  preview?: React.ReactNode;
}

function ColorTokenPicker({
  id,
  label,
  desc,
  h,
  s,
  l,
  presets,
  onChange,
  defaultValues,
  preview,
}: ColorTokenPickerProps) {
  const hexVal = hslToHex(h, s, l);
  const isModified =
    defaultValues && (defaultValues.h !== h || defaultValues.s !== s || defaultValues.l !== l);

  return (
    <div className="space-y-3 p-3 rounded-xl border border-border bg-surface">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{label}</h4>
          {desc ? <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p> : null}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums bg-background px-1.5 py-0.5 rounded border border-border">
            {h} {s}% {l}%
          </span>
          <span className="text-[10px] font-mono text-accent tabular-nums bg-background px-1.5 py-0.5 rounded border border-border">
            {hexVal.toUpperCase()}
          </span>
          {isModified && defaultValues ? (
            <button
              type="button"
              onClick={() => onChange(defaultValues.h, defaultValues.s, defaultValues.l)}
              title="Restablecer a valor por defecto"
              className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors px-1"
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {/* Presets */}
      {presets.length > 0 && (
        <div className={`grid gap-2 ${presets.length > 4 ? 'grid-cols-6' : 'grid-cols-4'}`}>
          {presets.map((p) => {
            const active = p.h === h && p.s === s && p.l === l;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChange(p.h, p.s, p.l)}
                title={p.label}
                aria-label={`${label}: ${p.label}`}
                className={`min-h-11 rounded-lg border transition-all relative group flex flex-col items-center justify-end p-1 ${
                  active ? 'ring-2 ring-accent scale-105 shadow-md' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: `hsl(${p.h} ${p.s}% ${p.l}%)`,
                  borderColor: active ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                }}
              >
                <span
                  className="text-[8px] font-medium leading-none truncate max-w-full px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    backgroundColor: p.l > 50 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
                    color: p.l > 50 ? '#ffffff' : '#000000',
                  }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selector libre */}
      <div className="flex items-center gap-2.5">
        <input
          id={`${id}-free`}
          name={`${id}-free`}
          type="color"
          value={hexVal}
          onChange={(e) => {
            const c = hexToHsl(e.target.value);
            if (!c) return;
            onChange(c.h, c.s, c.l);
          }}
          className="w-11 h-9 rounded-lg border border-border bg-background cursor-pointer shrink-0 p-0.5"
          aria-label={`Selector de color libre para ${label}`}
        />
        <input
          type="text"
          value={hexVal}
          onChange={(e) => {
            const val = e.target.value.trim();
            if (/^#?[0-9a-f]{6}$/i.test(val)) {
              const c = hexToHsl(val.startsWith('#') ? val : `#${val}`);
              if (c) onChange(c.h, c.s, c.l);
            }
          }}
          placeholder="#000000"
          className="w-24 bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label={`Código Hexadecimal para ${label}`}
        />
        <p className="text-[11px] text-muted-foreground flex-1">
          Color libre (selector) o preset.
        </p>
      </div>

      {preview}
    </div>
  );
}

export function ThemeSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal, flush } = useAutosaveState(
    'theme_settings',
    content,
    parseThemeSettings,
    (next) => onSave(next),
  );
  const localRef = React.useRef(local);
  localRef.current = local;
  const themeId = useId();
  const radiusId = useId();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const patch = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  const patchHsl = (
    prefix: 'accent' | 'bg_dark' | 'bg_light' | 'surface_dark' | 'surface_light' | 'text_dark' | 'text_light',
    h: number,
    s: number,
    l: number,
  ) => {
    setLocal((p) => ({
      ...p,
      [`${prefix}_h`]: h,
      [`${prefix}_s`]: s,
      [`${prefix}_l`]: l,
    }));
  };

  const handleRestoreCanonicalPalette = async () => {
    const restored: ThemeSettings = {
      ...localRef.current,
      default_theme: 'dark',
      force_dark_public: true,
      border_radius: 'md',
      grain_intensity: 0.35,
      accent_h: 44,
      accent_s: 85,
      accent_l: 46,
      bg_dark_h: 0,
      bg_dark_s: 0,
      bg_dark_l: 3,
      surface_dark_h: 0,
      surface_dark_s: 0,
      surface_dark_l: 7,
      text_dark_h: 35,
      text_dark_s: 60,
      text_dark_l: 93,
      bg_light_h: 35,
      bg_light_s: 60,
      bg_light_l: 97,
      surface_light_h: 35,
      surface_light_s: 60,
      surface_light_l: 100,
      text_light_h: 0,
      text_light_s: 0,
      text_light_l: 7,
    };
    setLocal(restored);
    try {
      await flush(restored);
      toast.success('Paleta canónica de origen restablecida (Oro miel y Negro tinta)');
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header descriptivo */}
      <div className="p-4 rounded-xl border border-border bg-surface">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Tema, Color y Atmósfera
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Paleta de colores, modo oscuro/claro y variables de diseño de la tienda pública.
        </p>
      </div>

      {/* Tarjeta de Restauración Rápida a Paleta Original */}
      <div className="p-4 rounded-xl border border-accent/40 bg-accent/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Paleta Canónica de Origen
            </h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Restaura con un clic los tonos emblemáticos: <strong className="text-foreground">Oro miel</strong> (H 44° S 85% L 46%), <strong className="text-foreground">Negro tinta</strong> (L 3%) y <strong className="text-foreground">Crema legado</strong> (L 93%) con modo oscuro forzado en páginas públicas.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRestoreCanonicalPalette}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/60 bg-background text-accent hover:bg-accent hover:text-accent-foreground text-xs font-semibold transition-colors shrink-0"
        >
          <RotateCcw size={13} />
          <span>Restablecer colores originales</span>
        </button>
      </div>
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

      {/* 1. Color de acento */}
      <ColorTokenPicker
        id="accent"
        label="Color de acento"
        desc="Se aplica a botones principales, links destacados y acentos de la tienda."
        h={local.accent_h}
        s={local.accent_s}
        l={local.accent_l}
        presets={ACCENT_PRESETS}
        onChange={(h, s, l) => patchHsl('accent', h, s, l)}
        defaultValues={{ h: 44, s: 85, l: 46 }}
        preview={
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div
              className="rounded-lg border border-border p-3 flex flex-col items-center gap-2 transition-colors"
              style={{
                backgroundColor: `hsl(${local.bg_dark_h} ${local.bg_dark_s}% ${local.bg_dark_l}%)`,
              }}
            >
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
            <div
              className="rounded-lg border border-border p-3 flex flex-col items-center gap-2 transition-colors"
              style={{
                backgroundColor: `hsl(${local.bg_light_h} ${local.bg_light_s}% ${local.bg_light_l}%)`,
              }}
            >
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
        }
      />

      {/* 2. Fondo modo oscuro */}
      <ColorTokenPicker
        id="bg-dark"
        label="Fondo tema oscuro"
        desc="Canvas principal de la tienda en modo oscuro o noche."
        h={local.bg_dark_h}
        s={local.bg_dark_s}
        l={local.bg_dark_l}
        presets={BG_DARK_PRESETS}
        onChange={(h, s, l) => patchHsl('bg_dark', h, s, l)}
        defaultValues={{ h: 0, s: 0, l: 3 }}
        preview={
          <div
            className="rounded-lg border border-border p-3 flex flex-col items-center gap-2 transition-colors"
            style={{
              backgroundColor: `hsl(${local.bg_dark_h} ${local.bg_dark_s}% ${local.bg_dark_l}%)`,
            }}
          >
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Previsualización sobre fondo oscuro
            </p>
            <div
              className="w-full max-w-[260px] p-2.5 rounded-lg border border-border/60 flex items-center justify-between gap-2 shadow-sm"
              style={{
                backgroundColor: `hsl(${local.surface_dark_h ?? local.bg_dark_h} ${local.surface_dark_s ?? local.bg_dark_s}% ${local.surface_dark_l ?? Math.min(100, local.bg_dark_l + 4)}%)`,
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-medium truncate"
                  style={{
                    color: `hsl(${local.text_dark_h ?? 35} ${local.text_dark_s ?? 60}% ${local.text_dark_l ?? 93}%)`,
                  }}
                >
                  Miel de Ulmo Virgen
                </p>
                <p className="text-[10px] text-muted-foreground">$14.900 CLP</p>
              </div>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0"
                style={{
                  backgroundColor: `hsl(${local.accent_h} ${local.accent_s}% ${local.accent_l}%)`,
                  color: 'hsl(var(--accent-foreground))',
                }}
              >
                Comprar
              </button>
            </div>
          </div>
        }
      />

      {/* 3. Fondo modo claro */}
      <ColorTokenPicker
        id="bg-light"
        label="Fondo tema claro"
        desc="Canvas principal de la tienda en modo claro o diurno."
        h={local.bg_light_h}
        s={local.bg_light_s}
        l={local.bg_light_l}
        presets={BG_LIGHT_PRESETS}
        onChange={(h, s, l) => patchHsl('bg_light', h, s, l)}
        defaultValues={{ h: 35, s: 60, l: 97 }}
        preview={
          <div
            className="rounded-lg border border-border p-3 flex flex-col items-center gap-2 transition-colors"
            style={{
              backgroundColor: `hsl(${local.bg_light_h} ${local.bg_light_s}% ${local.bg_light_l}%)`,
            }}
          >
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Previsualización sobre fondo claro
            </p>
            <div
              className="w-full max-w-[260px] p-2.5 rounded-lg border border-border/60 flex items-center justify-between gap-2 shadow-sm"
              style={{
                backgroundColor: `hsl(${local.surface_light_h ?? local.bg_light_h} ${local.surface_light_s ?? local.bg_light_s}% ${local.surface_light_l ?? 100}%)`,
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-medium truncate"
                  style={{
                    color: `hsl(${local.text_light_h ?? 0} ${local.text_light_s ?? 0}% ${local.text_light_l ?? 7}%)`,
                  }}
                >
                  Miel de Tiaca Virgen
                </p>
                <p className="text-[10px] text-muted-foreground">$14.900 CLP</p>
              </div>
              <button
                type="button"
                className="px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0"
                style={{
                  backgroundColor: `hsl(${local.accent_h} ${local.accent_s}% ${local.accent_l}%)`,
                  color: 'hsl(var(--accent-foreground))',
                }}
              >
                Comprar
              </button>
            </div>
          </div>
        }
      />

      {/* 4. Opciones avanzadas de color (Superficies y Texto) */}
      <div className="border border-border/70 rounded-xl overflow-hidden bg-surface/50">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-surface-raised transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <div>
              <span className="text-xs font-bold text-foreground">
                Opciones avanzadas de color (Superficies y Texto)
              </span>
              <p className="text-[10px] text-muted-foreground">
                Control fino de tarjetas elevadas y legibilidad tipográfica por tema
              </p>
            </div>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-3 space-y-4 border-t border-border">
            <ColorTokenPicker
              id="surface-dark"
              label="Superficie / Tarjetas (Modo oscuro)"
              desc="Tarjetas de producto, drawers y modales elevados sobre fondo oscuro."
              h={local.surface_dark_h ?? 0}
              s={local.surface_dark_s ?? 0}
              l={local.surface_dark_l ?? 7}
              presets={SURFACE_DARK_PRESETS}
              onChange={(h, s, l) => patchHsl('surface_dark', h, s, l)}
              defaultValues={{ h: 0, s: 0, l: 7 }}
            />
            <ColorTokenPicker
              id="surface-light"
              label="Superficie / Tarjetas (Modo claro)"
              desc="Tarjetas de producto y contenedores sobre fondo claro."
              h={local.surface_light_h ?? 35}
              s={local.surface_light_s ?? 60}
              l={local.surface_light_l ?? 100}
              presets={SURFACE_LIGHT_PRESETS}
              onChange={(h, s, l) => patchHsl('surface_light', h, s, l)}
              defaultValues={{ h: 35, s: 60, l: 100 }}
            />
            <ColorTokenPicker
              id="text-dark"
              label="Texto principal (Modo oscuro)"
              desc="Color de lectura sobre fondo oscuro (por defecto crema suave)."
              h={local.text_dark_h ?? 35}
              s={local.text_dark_s ?? 60}
              l={local.text_dark_l ?? 93}
              presets={TEXT_DARK_PRESETS}
              onChange={(h, s, l) => patchHsl('text_dark', h, s, l)}
              defaultValues={{ h: 35, s: 60, l: 93 }}
            />
            <ColorTokenPicker
              id="text-light"
              label="Texto principal (Modo claro)"
              desc="Color de lectura sobre fondo claro (por defecto negro tinta)."
              h={local.text_light_h ?? 0}
              s={local.text_light_s ?? 0}
              l={local.text_light_l ?? 7}
              presets={TEXT_LIGHT_PRESETS}
              onChange={(h, s, l) => patchHsl('text_light', h, s, l)}
              defaultValues={{ h: 0, s: 0, l: 7 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Announcement ───────────────────────────────────────────────────────────

export function AnnouncementSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('announcement_settings', content, parseAnnouncementSettings, (next) => onSave(next));

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
        max={20000}
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
      <SelectField
        label="Visibilidad de los anuncios"
        value={local.visibility ?? 'global'}
        options={[
          { label: 'Toda la tienda (global)', value: 'global' },
          { label: 'Solo en página de inicio (portada)', value: 'home_only' },
        ]}
        onChange={(v) => patch('visibility', v as 'global' | 'home_only')}
      />
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────

export function FooterSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('footer_settings', content, parseFooterSettings, (next) => onSave(next));

  const patch = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Aviso de Herencia de Marca */}
      <div className="rounded-xl border border-accent/25 bg-accent/5 p-3 flex items-start gap-3">
        <div className="shrink-0 mt-0.5 text-accent">
          <BadgeCheck size={16} />
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-semibold text-foreground">Identidad Oficial Sincronizada</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            El nombre y lema oficial se heredan directamente de{' '}
            <strong className="text-accent font-medium">Marca y logos</strong>. Cualquier ajuste que realices allá se refleja automáticamente en la cabecera y en el pie de página sin discordancias.
          </p>
        </div>
      </div>

      <SelectField
        label="Disposición del logo"
        value={local.logo_layout ?? 'stacked'}
        options={[
          { label: 'Centrado (Logo arriba, texto abajo)', value: 'stacked' },
          { label: 'Horizontal (Logo al lado del texto)', value: 'inline' },
        ]}
        onChange={(v) => patch('logo_layout', v as 'stacked' | 'inline')}
      />
      <TextField
        label="Marca línea 1 (reserva si Marca está vacía)"
        value={local.brand_line1 ?? ''}
        onChange={(v) => patch('brand_line1', v)}
      />
      <TextField
        label="Marca línea 2 (reserva si Marca está vacía)"
        value={local.brand_line2 ?? ''}
        onChange={(v) => patch('brand_line2', v)}
      />
      <SliderField
        label="Tracking marca"
        value={local.brand_tracking_em}
        min={0}
        max={1}
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
            label="Newsletter título (EN)"
            value={local.newsletter_title_en ?? ''}
            onChange={(v) => patch('newsletter_title_en', v)}
          />
          <TextField
            label="Newsletter desc (ES)"
            value={local.newsletter_desc}
            onChange={(v) => patch('newsletter_desc', v)}
            multiline
          />
          <TextField
            label="Newsletter desc (EN)"
            value={local.newsletter_desc_en ?? ''}
            onChange={(v) => patch('newsletter_desc_en', v)}
            multiline
          />
          <TextField
            label="Placeholder email (ES)"
            value={local.newsletter_placeholder}
            onChange={(v) => patch('newsletter_placeholder', v)}
          />
          <TextField
            label="Placeholder email (EN)"
            value={local.newsletter_placeholder_en ?? ''}
            onChange={(v) => patch('newsletter_placeholder_en', v)}
          />
        </>
      )}
      <TextField
        label="Copyright (sufijo)"
        value={local.copyright_suffix}
        onChange={(v) => patch('copyright_suffix', v)}
      />
      <AlignField value={local.text_align} onChange={(v) => patch('text_align', v)} />
    </div>
  );
}

// ── PWA ────────────────────────────────────────────────────────────────────

export function PwaNavSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('pwa_nav_settings', content, parsePwaNavSettings, (next) => onSave(next));

  return (
    <div className="space-y-4 pb-8">
      <ToggleField
        label="Bottom nav PWA activa"
        desc="Se muestra en modo standalone / shell móvil"
        value={local.enabled}
        onChange={(v) => {
          setLocal((p) => ({ ...p, enabled: v }));
        }}
      />
      <p className="text-xs text-muted-foreground">
        Gestiona y ordena las pestañas visibles en la lista de elementos inferior.
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
  const { local, setLocal, flush } = useAutosaveState(
    'brand_assets',
    content,
    parseBrandAssets,
    (next) => onSave(next),
  );
  const localRef = React.useRef(local);
  localRef.current = local;
  const [previewDevice, setPreviewDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [simMode, setSimMode] = React.useState<'combo' | 'text' | 'logo'>('combo');

  const patch = <K extends keyof BrandAssets>(key: K, value: BrandAssets[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  const patchSize = (
    mobileKey: 'logo_height_mobile_px' | 'logo_footer_height_mobile_px',
    desktopKey: 'logo_height_desktop_px' | 'logo_footer_height_desktop_px',
    legacyKey: 'logo_height_px' | 'logo_footer_height_px',
    type: 'mobile' | 'desktop',
    val: number,
  ) => {
    setPreviewDevice(type);
    if (type === 'mobile') {
      setLocal((p) => ({ ...p, [mobileKey]: val }));
    } else {
      setLocal((p) => ({ ...p, [desktopKey]: val, [legacyKey]: val }));
    }
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

  const currentHeaderHeight =
    previewDevice === 'mobile'
      ? (local.logo_height_mobile_px ?? local.logo_height_px ?? 32)
      : (local.logo_height_desktop_px ?? local.logo_height_px ?? 44);
  const simLogoMaxWidth =
    local.logo_max_width_px && local.logo_max_width_px > 0
      ? local.logo_max_width_px
      : undefined;

  return (
    <div className="space-y-4 pb-8">
      <div className="space-y-4 p-4 rounded-xl border border-border bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Identidad y Textos de Marca
            </p>
            <p className="text-[11px] text-muted-foreground">
              Nombre oficial y lema. Menú, Footer y SEO los heredan automáticamente si no se configuran por separado.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
                  previewDevice === 'mobile'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone size={14} />
                <span>Móvil</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
                  previewDevice === 'desktop'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor size={14} />
                <span>Escritorio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Nombre oficial de la marca */}
        <div className="space-y-3">
          <TextField
            label="Nombre oficial de la marca"
            value={local.brand_name ?? 'Obrera & Zángano'}
            onChange={(v) => patch('brand_name', v)}
          />

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-foreground">
              Tamaño tipográfico del nombre oficial
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`space-y-2 p-3 rounded-lg border transition-all ${
                  previewDevice === 'mobile'
                    ? 'border-accent/80 bg-accent/5 ring-1 ring-accent/30'
                    : 'border-border/70 bg-background/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-accent">
                    <Smartphone size={14} />
                    <span className="text-xs font-semibold text-foreground">Móvil</span>
                  </div>
                  {previewDevice === 'mobile' && (
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                      En simulador
                    </span>
                  )}
                </div>
                <SliderField
                  label="Tamaño nombre móvil"
                  value={local.brand_name_size_mobile_px ?? 15}
                  min={8}
                  max={48}
                  step={1}
                  unit="px"
                  onChange={(v) => {
                    setPreviewDevice('mobile');
                    patch('brand_name_size_mobile_px', v);
                  }}
                />
              </div>

              <div
                className={`space-y-2 p-3 rounded-lg border transition-all ${
                  previewDevice === 'desktop'
                    ? 'border-accent/80 bg-accent/5 ring-1 ring-accent/30'
                    : 'border-border/70 bg-background/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-accent">
                    <Monitor size={14} />
                    <span className="text-xs font-semibold text-foreground">Escritorio</span>
                  </div>
                  {previewDevice === 'desktop' && (
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                      En simulador
                    </span>
                  )}
                </div>
                <SliderField
                  label="Tamaño nombre escritorio"
                  value={local.brand_name_size_desktop_px ?? 18}
                  min={10}
                  max={64}
                  step={1}
                  unit="px"
                  onChange={(v) => {
                    setPreviewDevice('desktop');
                    setLocal((p) => ({
                      ...p,
                      brand_name_size_desktop_px: v,
                      brand_name_size_px: v,
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 my-2" />

        {/* Lema o bajada oficial */}
        <div className="space-y-3">
          <TextField
            label="Lema o bajada oficial"
            value={local.brand_tagline ?? 'Bosque Nativo de Chiloé'}
            onChange={(v) => patch('brand_tagline', v)}
          />

          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-foreground">
              Visibilidad y tamaño del lema según entorno
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Móvil */}
              <div
                className={`space-y-3 p-3 rounded-lg border transition-all ${
                  previewDevice === 'mobile'
                    ? 'border-accent/80 bg-accent/5 ring-1 ring-accent/30'
                    : 'border-border/70 bg-background/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-accent">
                    <Smartphone size={14} />
                    <span className="text-xs font-semibold text-foreground">Lema en móvil</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {previewDevice === 'mobile' && (
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                        En simulador
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {local.brand_tagline_show_mobile !== false ? 'Visible' : 'Oculto'}
                    </span>
                  </div>
                </div>
                <ToggleField
                  label="Mostrar lema en móvil"
                  desc="Activa o hace desaparecer el lema en pantallas móviles"
                  value={local.brand_tagline_show_mobile !== false}
                  onChange={(v) => {
                    setPreviewDevice('mobile');
                    patch('brand_tagline_show_mobile', v);
                  }}
                />
                {local.brand_tagline_show_mobile !== false ? (
                  <SliderField
                    label="Tamaño lema móvil"
                    value={local.brand_tagline_size_mobile_px ?? 9}
                    min={6}
                    max={28}
                    step={1}
                    unit="px"
                    onChange={(v) => {
                      setPreviewDevice('mobile');
                      patch('brand_tagline_size_mobile_px', v);
                    }}
                  />
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    El lema desaparece en pantallas móviles.
                  </p>
                )}
              </div>

              {/* Escritorio */}
              <div
                className={`space-y-3 p-3 rounded-lg border transition-all ${
                  previewDevice === 'desktop'
                    ? 'border-accent/80 bg-accent/5 ring-1 ring-accent/30'
                    : 'border-border/70 bg-background/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-accent">
                    <Monitor size={14} />
                    <span className="text-xs font-semibold text-foreground">Lema en escritorio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {previewDevice === 'desktop' && (
                      <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                        En simulador
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {local.brand_tagline_show_desktop !== false ? 'Visible' : 'Oculto'}
                    </span>
                  </div>
                </div>
                <ToggleField
                  label="Mostrar lema en escritorio"
                  desc="Activa o hace desaparecer el lema en pantallas grandes"
                  value={local.brand_tagline_show_desktop !== false}
                  onChange={(v) => {
                    setPreviewDevice('desktop');
                    patch('brand_tagline_show_desktop', v);
                  }}
                />
                {local.brand_tagline_show_desktop !== false ? (
                  <SliderField
                    label="Tamaño lema escritorio"
                    value={local.brand_tagline_size_desktop_px ?? 10}
                    min={6}
                    max={32}
                    step={1}
                    unit="px"
                    onChange={(v) => {
                      setPreviewDevice('desktop');
                      setLocal((p) => ({
                        ...p,
                        brand_tagline_size_desktop_px: v,
                        brand_tagline_size_px: v,
                      }));
                    }}
                  />
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    El lema desaparece en pantallas de escritorio.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa tipográfica interactiva */}
        <div className="rounded-lg border border-border bg-background p-4 flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center justify-between w-full pb-2 border-b border-border/40 text-[11px] text-muted-foreground">
            <span>Vista previa tipográfica ({previewDevice === 'mobile' ? 'Móvil' : 'Escritorio'})</span>
            <span className="font-mono text-accent">
              Nombre: {previewDevice === 'mobile' ? (local.brand_name_size_mobile_px ?? 15) : (local.brand_name_size_desktop_px ?? 18)}px
              {((previewDevice === 'mobile' && local.brand_tagline_show_mobile !== false) ||
                (previewDevice === 'desktop' && local.brand_tagline_show_desktop !== false)) &&
                ` · Lema: ${previewDevice === 'mobile' ? (local.brand_tagline_size_mobile_px ?? 9) : (local.brand_tagline_size_desktop_px ?? 10)}px`}
            </span>
          </div>
          <div className="py-2 flex flex-col items-center">
            <span
              className="font-display uppercase tracking-widest text-foreground font-semibold transition-all leading-tight"
              style={{
                fontSize: `${previewDevice === 'mobile' ? (local.brand_name_size_mobile_px ?? 15) : (local.brand_name_size_desktop_px ?? 18)}px`,
                letterSpacing: '0.2em',
              }}
            >
              {local.brand_name || 'Obrera & Zángano'}
            </span>
            {((previewDevice === 'mobile' && local.brand_tagline_show_mobile !== false) ||
              (previewDevice === 'desktop' && local.brand_tagline_show_desktop !== false)) && (
              <span
                className="uppercase font-light text-accent-text transition-all mt-1 leading-tight"
                style={{
                  fontSize: `${previewDevice === 'mobile' ? (local.brand_tagline_size_mobile_px ?? 9) : (local.brand_tagline_size_desktop_px ?? 10)}px`,
                  letterSpacing: '0.25em',
                  color: 'hsl(var(--accent-text, var(--accent)))',
                }}
              >
                {local.brand_tagline || 'Bosque Nativo de Chiloé'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 rounded-xl border border-border bg-surface">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-foreground">
            Logotipo en Cabecera
          </p>
          <p className="text-[11px] text-muted-foreground">
            Configuración visual de la marca en la barra superior. Si se apaga, la cabecera muestra el nombre y lema tipográfico.
          </p>
        </div>
        <ToggleField
          label="Mostrar logotipo en cabecera"
          desc="Muestra el archivo gráfico del logo en el encabezado. Si se desactiva, se presenta el nombre oficial y lema en texto."
          value={local.show_logo_header !== false}
          onChange={(v) => patch('show_logo_header', v)}
        />
        {local.show_logo_header === false ? (
          <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-0.5">Modo texto activo</p>
            <p className="leading-relaxed">
              La cabecera de la tienda mostrará <strong className="text-foreground">{local.brand_name || 'Obrera & Zángano'}</strong> y <strong className="text-foreground">{local.brand_tagline || 'Bosque Nativo de Chiloé'}</strong> en tipografía Cormorant Garamond.
            </p>
          </div>
        ) : (
          <BrandAssetUploadField
            label="Archivo del logo de cabecera"
            hint="PNG o SVG transparente recomendado"
            fieldName="logo_url"
            value={local.logo_url}
            previewHeight={currentHeaderHeight}
            previewMaxWidth={local.logo_max_width_px}
            acceptTransparent
            onUrlChange={(v) => patch('logo_url', v)}
            onClear={() => patch('logo_url', '')}
            onImageUpload={uploadBrandField}
          />
        )}
      </div>

      <div className="space-y-4 p-4 rounded-xl border border-border bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Tamaño del logo (proporcional fijo)
            </p>
            <p className="text-[11px] text-muted-foreground">
              Escala fija sin distorsión de aspecto. Tamaños independientes para móvil y escritorio.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
                  previewDevice === 'mobile'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Smartphone size={14} />
                <span>Móvil</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors ${
                  previewDevice === 'desktop'
                    ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor size={14} />
                <span>Escritorio</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`space-y-3 p-3 rounded-lg border transition-all ${
              previewDevice === 'mobile'
                ? 'border-accent/80 bg-accent/5 ring-1 ring-accent/30'
                : 'border-border/70 bg-background/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone size={15} className="text-accent" />
                <span className="text-xs font-semibold text-foreground">Header en móvil</span>
              </div>
              {previewDevice === 'mobile' && (
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                  En simulador
                </span>
              )}
            </div>
            <SliderField
              label="Tamaño logo móvil"
              value={local.logo_height_mobile_px ?? local.logo_height_px ?? 32}
              min={16}
              max={160}
              step={1}
              unit="px"
              onChange={(v) => patchSize('logo_height_mobile_px', 'logo_height_desktop_px', 'logo_height_px', 'mobile', v)}
            />
          </div>

          <div
            className={`space-y-3 p-3 rounded-lg border transition-all ${
              previewDevice === 'desktop'
                ? 'border-accent/80 bg-accent/5 ring-1 ring-accent/30'
                : 'border-border/70 bg-background/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor size={15} className="text-accent" />
                <span className="text-xs font-semibold text-foreground">Header en escritorio</span>
              </div>
              {previewDevice === 'desktop' && (
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                  En simulador
                </span>
              )}
            </div>
            <SliderField
              label="Tamaño logo escritorio"
              value={local.logo_height_desktop_px ?? local.logo_height_px ?? 44}
              min={16}
              max={256}
              step={1}
              unit="px"
              onChange={(v) => patchSize('logo_height_mobile_px', 'logo_height_desktop_px', 'logo_height_px', 'desktop', v)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className={`space-y-3 p-3 rounded-lg border transition-all ${
              previewDevice === 'mobile'
                ? 'border-accent/40 bg-accent/5'
                : 'border-border/70 bg-background/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Smartphone size={15} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Footer en móvil</span>
            </div>
            <SliderField
              label="Tamaño footer móvil"
              value={local.logo_footer_height_mobile_px ?? 36}
              min={16}
              max={160}
              step={1}
              unit="px"
              onChange={(v) => patchSize('logo_footer_height_mobile_px', 'logo_footer_height_desktop_px', 'logo_footer_height_px', 'mobile', v)}
            />
          </div>

          <div
            className={`space-y-3 p-3 rounded-lg border transition-all ${
              previewDevice === 'desktop'
                ? 'border-accent/40 bg-accent/5'
                : 'border-border/70 bg-background/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Monitor size={15} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Footer en escritorio</span>
            </div>
            <SliderField
              label="Tamaño footer escritorio"
              value={local.logo_footer_height_desktop_px ?? local.logo_footer_height_px ?? 48}
              min={16}
              max={256}
              step={1}
              unit="px"
              onChange={(v) => patchSize('logo_footer_height_mobile_px', 'logo_footer_height_desktop_px', 'logo_footer_height_px', 'desktop', v)}
            />
          </div>
        </div>

        <div className="space-y-2 p-3 rounded-lg border border-border/70 bg-background/50">
          <SliderField
            label="Ancho máximo del logo"
            desc="0 = automático (220px en pie). Sube este valor si el logo apaisado no crece aunque subas la altura."
            value={local.logo_max_width_px ?? 0}
            min={0}
            max={800}
            step={10}
            unit="px"
            onChange={(v) => patch('logo_max_width_px', v)}
          />
        </div>

        {/* Simulador a escala real */}
        <div className="space-y-2 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Simulador de cabecera ({previewDevice === 'mobile' ? 'Móvil · 375px' : 'Escritorio'}):</span>
              <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSimMode('combo')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    simMode === 'combo'
                      ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Logo + Texto
                </button>
                <button
                  type="button"
                  onClick={() => setSimMode('text')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    simMode === 'text'
                      ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Solo Texto
                </button>
                <button
                  type="button"
                  onClick={() => setSimMode('logo')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    simMode === 'logo'
                      ? 'bg-accent text-accent-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Solo Logo
                </button>
              </div>
            </div>
            <span className="font-mono text-accent">
              Logo: {currentHeaderHeight}px · Nombre: {previewDevice === 'mobile' ? (local.brand_name_size_mobile_px ?? 15) : (local.brand_name_size_desktop_px ?? 18)}px
            </span>
          </div>

          <div className="p-3 rounded-xl border border-border bg-background/70 overflow-hidden flex justify-center">
            {previewDevice === 'mobile' ? (
              <div className="w-[320px] sm:w-[360px] rounded-lg border border-border bg-background p-2.5 flex items-center justify-between shadow-sm">
                <div className="w-7 h-7 rounded border border-border/50 flex items-center justify-center text-muted-foreground text-xs shrink-0">
                  ☰
                </div>
                <div className="flex items-center gap-2 px-2 min-w-0">
                  {(simMode === 'combo' || simMode === 'logo') && (
                    <img
                      src={local.logo_url || '/icons/icon-192.svg'}
                      alt="Logo header móvil"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      style={{
                        height: `${local.logo_height_mobile_px ?? local.logo_height_px ?? 32}px`,
                        width: 'auto',
                        maxWidth: simLogoMaxWidth ?? (simMode === 'combo' ? '100px' : '180px'),
                      }}
                      className="object-contain shrink-0"
                    />
                  )}
                  {(simMode === 'combo' || simMode === 'text') && (
                    <div className="flex flex-col items-start text-left min-w-0">
                      <span
                        className="font-display uppercase text-foreground font-semibold leading-tight"
                        style={{
                          fontSize: `${local.brand_name_size_mobile_px ?? 15}px`,
                          letterSpacing: '0.15em',
                        }}
                      >
                        {(() => {
                          const name = local.brand_name || 'Obrera & Zángano';
                          const m = name.match(/^(.+?)\s+(&|y|\+)\s+(.+)$/i);
                          if (m) {
                            return (
                              <>
                                <span className="block whitespace-nowrap">{m[1]} {m[2]}</span>
                                <span className="block whitespace-nowrap">{m[3]}</span>
                              </>
                            );
                          }
                          return name;
                        })()}
                      </span>
                      {local.brand_tagline_show_mobile !== false && (
                        <span
                          className="uppercase font-light text-accent-text mt-0.5 leading-tight truncate"
                          style={{
                            fontSize: `${local.brand_tagline_size_mobile_px ?? 9}px`,
                            letterSpacing: '0.2em',
                            color: 'hsl(var(--accent-text, var(--accent)))',
                          }}
                        >
                          {local.brand_tagline || 'Bosque Nativo de Chiloé'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-7 h-7 rounded border border-border/50 flex items-center justify-center text-muted-foreground text-xs shrink-0">
                  🛒
                </div>
              </div>
            ) : (
              <div className="w-full rounded-lg border border-border bg-background px-4 py-2.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  {(simMode === 'combo' || simMode === 'logo') && (
                    <img
                      src={local.logo_url || '/icons/icon-192.svg'}
                      alt="Logo header escritorio"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      style={{
                        height: `${local.logo_height_desktop_px ?? local.logo_height_px ?? 44}px`,
                        width: 'auto',
                        maxWidth: simLogoMaxWidth ?? (simMode === 'combo' ? '180px' : '300px'),
                      }}
                      className="object-contain shrink-0"
                    />
                  )}
                  {(simMode === 'combo' || simMode === 'text') && (
                    <div className="flex flex-col items-start leading-tight min-w-0">
                      <span
                        className="font-display uppercase text-foreground font-semibold leading-tight"
                        style={{
                          fontSize: `${local.brand_name_size_desktop_px ?? 18}px`,
                          letterSpacing: '0.2em',
                        }}
                      >
                        {local.brand_name || 'Obrera & Zángano'}
                      </span>
                      {local.brand_tagline_show_desktop !== false && (
                        <span
                          className="uppercase font-light text-accent-text mt-0.5 leading-tight"
                          style={{
                            fontSize: `${local.brand_tagline_size_desktop_px ?? 10}px`,
                            letterSpacing: '0.25em',
                            color: 'hsl(var(--accent-text, var(--accent)))',
                          }}
                        >
                          {local.brand_tagline || 'Bosque Nativo de Chiloé'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[10px] tracking-widest text-muted-foreground uppercase font-sans">
                  <span>Inicio</span>
                  <span className="text-foreground font-semibold">Creaciones</span>
                  <span>Historia</span>
                  <span>Contacto</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="p-1">👤</span>
                  <span className="p-1">🛒</span>
                </div>
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Proporción fija automática · Sin distorsión de ancho vs alto. Los cambios de tipografía y visibilidad se reflejan en tiempo real.
          </p>
        </div>

      </div>

      <BrandAssetUploadField
        label="Logo footer"
        hint="Opcional · si vacío se usa el logo header"
        fieldName="logo_footer_url"
        value={local.logo_footer_url}
        previewHeight={
          previewDevice === 'mobile'
            ? (local.logo_footer_height_mobile_px ?? local.logo_footer_height_px ?? 36)
            : (local.logo_footer_height_desktop_px ?? local.logo_footer_height_px ?? 48)
        }
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
        onClear={() => patch('favicon_url', '')}
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
        La cabecera de la tienda combina automáticamente el logotipo gráfico con el nombre y lema según la configuración. Los tamaños para móvil y escritorio se aplican en tiempo real.
      </p>
    </div>
  );
}

// ── Landing layout ─────────────────────────────────────────────────────────

const LANDING_BLOCK_ICONS: Record<LandingSectionId, ComponentType<LucideProps>> = {
  hero: LayoutTemplate,
  identidad: ImageIcon,
  conservation: Leaf,
  collections: Layers,
  media: GalleryHorizontalEnd,
  products: Package,
  video: PlayCircle,
  club_legado: BadgeCheck,
  map: MapPin,
  experiencias: Compass,
  alianzas: Store,
};

const LANDING_BLOCK_HINTS: Record<LandingSectionId, string> = {
  hero: 'Portada, llamada a la acción, textos y abejitas animadas',
  identidad: 'Bloque de Identidad OYZ ("Hecho en Chiloé")',
  conservation: 'Posición en el home · copy en Impacto',
  collections: 'Posición en el home · fichas en Colecciones',
  media: 'Posición en el home · fichas en Carrusel media',
  products: 'Posición en el home · cabecera en Creaciones',
  video: 'Posición en el home · ID en Video central',
  club_legado: 'Posición en el home · Membresía y vínculo de origen',
  map: 'Posición en el home · Mapa territorial y origen',
  experiencias: 'Posición en el home · Fichas en Encuentros & Origen',
  alianzas: 'Posición en el home · Fichas en Alianzas & Negocios',
};

export function LandingLayoutEditor({
  content,
  onSave,
  onOpenSection,
  workspace = false,
  selectedNode,
  onSelectNode,
  draftSectionIds,
}: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('landing_layout', content, parseLandingLayout, (next) => onSave(next));
  const [openAtmosphere, setOpenAtmosphere] = useState(false);
  const [openHeroCopy, setOpenHeroCopy] = useState(false);

  const patch = <K extends keyof LandingLayoutSettings>(key: K, value: LandingLayoutSettings[K]) => {
    setLocal((p) => ({
      ...p,
      [key]: value,
      atmosphere_rev: Math.max(p.atmosphere_rev ?? 2, 2),
    }));
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

  const showTree = !workspace || selectedNode === null || selectedNode === undefined;
  const isAtmosphereFocused = workspace && selectedNode === 'atmosphere';
  const isHeroFocused = workspace && selectedNode === 'hero';

  const hasAtmosphereOverrides = local.show_grain || local.show_custom_cursor || local.show_bee_canvas;
  const hasHeroOverrides = Boolean(
    local.hero_eyebrow?.trim() ||
      local.hero_title_line1?.trim() ||
      local.hero_title_line2?.trim() ||
      local.hero_subtitle?.trim() ||
      local.hero_formula?.trim() ||
      (local.hero_cta_label?.trim() && local.hero_cta_label.trim() !== 'Explorar creaciones') ||
      (local.hero_cta_href?.trim() && local.hero_cta_href.trim() !== '/catalogo') ||
      !local.show_hero_cta ||
      local.show_bee_canvas,
  );

  const atmosphereContent = (
    <div className="space-y-3 pt-2">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Ornamento gráfico — configura los efectos visuales y texturas de la tienda.
      </p>
      <SelectField
        label="Variante del Hero"
        value={local.hero_variant ?? 'hueco'}
        onChange={(v) => patch('hero_variant', v)}
        options={[
          { label: 'El Hueco del Árbol (Orgánico/WebGL)', value: 'hueco' },
          { label: 'Video (YouTube)', value: 'video' },
          { label: 'Próximamente: Estático', value: 'static' }
        ]}
      />
      {local.hero_variant === 'video' ? (
        <TextField
          label="URL del Video de YouTube (Hero)"
          placeholder="https://www.youtube.com/watch?v=..."
          value={local.hero_video_url ?? ''}
          onChange={(v) => patch('hero_video_url', v)}
        />
      ) : null}
      <ToggleField
        label="Grain overlay (textura cinematográfica)"
        value={local.show_grain}
        onChange={(v) => patch('show_grain', v)}
      />
      <ToggleField
        label="Cursor custom desktop"
        value={local.show_custom_cursor}
        onChange={(v) => patch('show_custom_cursor', v)}
      />
      <ToggleField
        label="Bee canvas desktop (partículas de abejas en hero)"
        desc="Partículas interactivas de abejas en la portada del hero"
        value={local.show_bee_canvas}
        onChange={(v) => patch('show_bee_canvas', v)}
      />
    </div>
  );

  const heroCopyContent = (
    <div className="space-y-4 pt-2">
      <ToggleField
        label="Botón CTA en hero"
        desc="Muestra u oculta el botón principal de llamada a la acción en la portada"
        value={local.show_hero_cta}
        onChange={(v) => patch('show_hero_cta', v)}
      />
      {local.show_hero_cta ? (
        <div className="space-y-3 pl-2 border-l-2 border-border/60">
          <TextField
            label="CTA label (ES)"
            placeholder="Explorar creaciones"
            value={local.hero_cta_label}
            onChange={(v) => patch('hero_cta_label', v)}
          />
          <TextField
            label="CTA label (EN)"
            placeholder="Explore creations"
            value={local.hero_cta_label_en ?? ''}
            onChange={(v) => patch('hero_cta_label_en', v)}
          />
          <TextField
            label="CTA href"
            placeholder="/catalogo"
            value={local.hero_cta_href}
            onChange={(v) => patch('hero_cta_href', v)}
          />
        </div>
      ) : null}

      <div className="pt-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Copy del hero
          </p>
          <span className="text-[10px] text-muted-foreground">Opcional</span>
        </div>
        <div className="p-2.5 rounded-lg bg-surface-raised border border-border/50 text-[11px] text-muted-foreground leading-relaxed mb-3">
          Texto en gris = valor por defecto del sistema (i18n). Solo llena un campo si deseas sustituirlo por un texto personalizado.
        </div>
        <div className="space-y-3">
          <TextField
            label="Eyebrow (ES)"
            placeholder="Miel Virgen del Sur del Mundo"
            value={local.hero_eyebrow}
            onChange={(v) => patch('hero_eyebrow', v)}
          />
          <TextField
            label="Eyebrow (EN)"
            placeholder="Virgin Honey from the South of the World"
            value={local.hero_eyebrow_en ?? ''}
            onChange={(v) => patch('hero_eyebrow_en', v)}
          />
          <TextField
            label="Título línea 1 (ES)"
            placeholder="La Obrera"
            value={local.hero_title_line1}
            onChange={(v) => patch('hero_title_line1', v)}
          />
          <TextField
            label="Título línea 1 (EN)"
            placeholder="The Worker"
            value={local.hero_title_line1_en ?? ''}
            onChange={(v) => patch('hero_title_line1_en', v)}
          />
          <TextField
            label="Título línea 2 (ES)"
            placeholder="y el Zángano"
            value={local.hero_title_line2}
            onChange={(v) => patch('hero_title_line2', v)}
          />
          <TextField
            label="Título línea 2 (EN)"
            placeholder="and the Drone"
            value={local.hero_title_line2_en ?? ''}
            onChange={(v) => patch('hero_title_line2_en', v)}
          />
          <TextField
            label="Subtítulo (ES)"
            placeholder="Desde el bosque húmedo de Chiloé, extractos de una geografía salvaje"
            value={local.hero_subtitle}
            onChange={(v) => patch('hero_subtitle', v)}
          />
          <TextField
            label="Subtítulo (EN)"
            placeholder="From the humid forest of Chiloé, extracts of a wild geography"
            value={local.hero_subtitle_en ?? ''}
            onChange={(v) => patch('hero_subtitle_en', v)}
          />
          <TextField
            label="Fórmula (ES)"
            placeholder="Luz solar → Néctar → Miel virgen · Sin atajos industriales"
            value={local.hero_formula}
            onChange={(v) => patch('hero_formula', v)}
          />
          <TextField
            label="Fórmula (EN)"
            placeholder="Sunlight → Nectar → Virgin honey · No industrial shortcuts"
            value={local.hero_formula_en ?? ''}
            onChange={(v) => patch('hero_formula_en', v)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Workspace focus: direct node view */}
      {isAtmosphereFocused ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Atmósfera y efectos visuales</p>
          {atmosphereContent}
        </div>
      ) : isHeroFocused ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Portada y CTA del Hero</p>
          {heroCopyContent}
        </div>
      ) : showTree ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {workspace ? 'Página de inicio — selecciona un bloque.' : 'Bloques principales. Organiza y activa sin código.'}
            </p>
            <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
              {enabledCount}/{ordered.length} activos
            </span>
          </div>
          <div className="space-y-1.5">
            {ordered.map((sec, index) => {
              const Icon = LANDING_BLOCK_ICONS[sec.id] ?? LayoutTemplate;
              const selected = workspace && selectedNode === sec.id;
              return (
                <div
                  key={sec.id}
                  className={`flex items-center gap-2 p-2 pl-1.5 rounded-lg border transition-all ${
                    selected
                      ? 'border-accent bg-accent/10'
                      : sec.enabled
                        ? 'border-border bg-background'
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
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left"
                    onClick={() => onSelectNode?.(sec.id)}
                  >
                    <p className="text-sm font-medium text-foreground leading-tight">
                      {LANDING_SECTION_LABELS[sec.id] ?? sec.id}
                      {draftSectionIds?.[sec.id] ? (
                        <span className="ml-2 text-[10px] font-medium text-accent">borrador</span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {LANDING_BLOCK_HINTS[sec.id] ?? sec.id}
                    </p>
                  </button>
                  {!workspace && onOpenSection && LANDING_SECTION_EDITOR_KEY[sec.id] ? (
                    <button
                      type="button"
                      onClick={() => onOpenSection(LANDING_SECTION_EDITOR_KEY[sec.id]!)}
                      className="inline-flex min-h-11 items-center rounded-lg border border-border px-2.5 text-[11px] font-medium text-muted-foreground hover:border-accent/40 hover:text-foreground"
                    >
                      Fichas
                    </button>
                  ) : null}
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
            {workspace ? (
              <button
                type="button"
                onClick={() => onSelectNode?.('atmosphere')}
                className={`w-full flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm ${
                  selectedNode === 'atmosphere'
                    ? 'border-accent bg-accent/10 text-foreground'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                <Layers size={14} />
                Atmósfera
                <span className="text-[10px]">grain / cursor / abejas</span>
              </button>
            ) : null}
          </div>

          {/* Collapsible Sections in Classic/Standard Mode */}
          {!workspace ? (
            <div className="pt-3 space-y-2 border-t border-border/50">
              {/* Accordion: Atmósfera */}
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenAtmosphere((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-surface-raised/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Layers size={15} className={hasAtmosphereOverrides ? 'text-accent' : 'text-muted-foreground'} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">Atmósfera y efectos visuales</p>
                      <p className="text-[10px] text-muted-foreground truncate">Grain, cursor y abejas animadas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {hasAtmosphereOverrides ? 'Personalizado' : 'Por defecto'}
                    </span>
                    {openAtmosphere ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                  </div>
                </button>
                {openAtmosphere ? (
                  <div className="p-3 pt-1 border-t border-border/40 bg-surface-sunken/40">
                    {atmosphereContent}
                  </div>
                ) : null}
              </div>

              {/* Accordion: Personalizar Hero */}
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenHeroCopy((prev) => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-surface-raised/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SlidersHorizontal size={15} className={hasHeroOverrides ? 'text-accent' : 'text-muted-foreground'} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">Personalizar Hero y CTA</p>
                      <p className="text-[10px] text-muted-foreground truncate">Textos del manifiesto y botón principal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {hasHeroOverrides ? 'Personalizado' : 'Por defecto'}
                    </span>
                    {openHeroCopy ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
                  </div>
                </button>
                {openHeroCopy ? (
                  <div className="p-3 pt-1 border-t border-border/40 bg-surface-sunken/40">
                    {heroCopyContent}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

// ── Catalog ────────────────────────────────────────────────────────────────

export function CatalogSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('catalog_settings', content, parseCatalogSettings, (next) => onSave(next));
  const sortId = useId();

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
      <TextField
        label="Subtítulo (EN)"
        value={local.page_subtitle_en ?? ''}
        onChange={(v) => patch('page_subtitle_en', v)}
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
          <option value="default">Destacados</option>
          <option value="newest">Última Recolección</option>
          <option value="price-asc">Precio ↑ (menor a mayor)</option>
          <option value="price-desc">Precio ↓ (mayor a menor)</option>
          <option value="name">Nombre (A - Z)</option>
          <option value="impacto">Mayor impacto ecológico</option>
        </select>
      </div>
      <ToggleField label="Búsqueda de productos" value={local.show_search} onChange={(v) => patch('show_search', v)} />
      <ToggleField label="Barra de filtros activa" value={local.show_filters} onChange={(v) => patch('show_filters', v)} />
      <ToggleField
        label="Filtros de Formato (Envases y Gramajes)"
        value={local.show_formats_filter ?? true}
        onChange={(v) => patch('show_formats_filter', v)}
      />
      <ToggleField
        label="Filtros de Categoría"
        value={local.show_categories_filter ?? true}
        onChange={(v) => patch('show_categories_filter', v)}
      />
      <ToggleField
        label="Filtro 'En stock'"
        value={local.show_stock_filter ?? true}
        onChange={(v) => patch('show_stock_filter', v)}
      />
      <ToggleField
        label="Filtro 'Alto impacto' (IRR / regeneración)"
        value={local.show_impact_filter ?? false}
        onChange={(v) => patch('show_impact_filter', v)}
      />
      <ToggleField
        label="Fijar barra al navegar (sticky flotante)"
        value={local.sticky_bar ?? false}
        onChange={(v) => patch('sticky_bar', v)}
      />
      <ToggleField label="Ratings y reseñas" value={local.show_ratings} onChange={(v) => patch('show_ratings', v)} />
      <ToggleField label="Badges ecológicos" value={local.show_badges} onChange={(v) => patch('show_badges', v)} />
      <TextField
        label="Mensaje vacío (ES)"
        value={local.empty_message}
        onChange={(v) => patch('empty_message', v)}
      />
      <TextField
        label="Mensaje vacío (EN)"
        value={local.empty_message_en ?? ''}
        onChange={(v) => patch('empty_message_en', v)}
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
      <AlignField value={local.text_align} onChange={(v) => patch('text_align', v)} />
    </div>
  );
}

// ── PDP ────────────────────────────────────────────────────────────────────

export function PdpSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('pdp_settings', content, parsePdpSettings, (next) => onSave(next));

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
        label="Perfil Sensorial de Cata (organoléptico)"
        desc="Muestra u oculta la cata sensorial en productos de miel. Los productos no comestibles se ocultan automáticamente."
        value={local.show_sensory_profile ?? true}
        onChange={(v) => patch('show_sensory_profile', v)}
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
// Nota: seo_defaults usa SeoStudioEditor directo (sin wrapper).

// ── Contact ────────────────────────────────────────────────────────────────

export function ContactSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('contact_settings', content, parseContactSettings, (next) => onSave(next));

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
      <AlignField value={local.text_align} onChange={(v) => patch('text_align', v)} />
    </div>
  );
}

export function CheckoutSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('checkout_settings', content, parseCheckoutSettings, (next) => onSave(next));

  const patch = <K extends keyof CheckoutSettings>(key: K, value: CheckoutSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-4 pb-8">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Copy del checkout (se publica al instante — sección de diseño). Vacío = texto actual.
        La línea “Incluye IVA” del total es fija en el código: no se edita aquí.
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
      <AlignField value={local.text_align} onChange={(v) => patch('text_align', v)} />
    </div>
  );
}

export function CartSettingsEditor({ content, onSave }: SettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('cart_settings', content, parseCartSettings, (next) => onSave(next));

  const patch = <K extends keyof CartSettings>(key: K, value: CartSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-5 pb-8">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Configuración y copy del carrito (se publica al instante — sección de diseño). Vacío = texto actual.
      </p>

      {/* Despacho Gratuito */}
      <div className="rounded-xl border border-border bg-card/40 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Despacho Gratuito</span>
        </div>
        <ToggleField
          label="Activar beneficio de despacho gratis en carrito"
          desc="Calcula dinámicamente el monto restante y lo comunica al comprador con barra de progreso."
          value={local.free_shipping_enabled !== false}
          onChange={(v) => patch('free_shipping_enabled', v)}
        />
        {local.free_shipping_enabled !== false && (
          <div className="space-y-3 pt-1 border-t border-border/50">
            <NumberField
              label="Umbral de compra para despacho gratis (CLP)"
              value={local.free_shipping_threshold_clp ?? 45000}
              onChange={(v) => patch('free_shipping_threshold_clp', Number.isFinite(v) ? v : 45000)}
              step="1000"
            />
            <TextField
              label="Mensaje de progreso (usa {amount} para el saldo)"
              value={local.free_shipping_progress_text || ''}
              placeholder="Te faltan {amount} para despacho gratis"
              onChange={(v) => patch('free_shipping_progress_text', v)}
            />
            <TextField
              label="Mensaje al desbloquear"
              value={local.free_shipping_unlocked_text || ''}
              placeholder="✨ ¡Tienes despacho gratis incluido!"
              onChange={(v) => patch('free_shipping_unlocked_text', v)}
            />
          </div>
        )}
      </div>

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
      <AlignField value={local.text_align} onChange={(v) => patch('text_align', v)} />
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

export { SETTINGS_SECTION_KEYS } from '@/lib/editor-tienda-schema';

/** Legales: un solo documento por sección (no lista de fichas). */
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
  onOpenSection,
}: {
  sectionKey: string;
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
  onOpenSection?: (sectionKey: string) => void;
}) {
  const props: SettingsEditorProps = { content, onSave, onImageUpload, onOpenSection };
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
    case 'auth_settings':
      return (
        <AuthSettingsEditor content={content} onSave={onSave} onImageUpload={onImageUpload} />
      );
    case 'legal_terminos':
    case 'legal_privacidad':
    case 'legal_cookies':
    case 'legal_envio':
    case 'legal_reembolso':
    case 'legal_cancelacion':
    case 'legal_garantia':
      return <LegalDocEditor sectionKey={sectionKey} content={content} onSave={onSave} />;
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
      return <SeoStudioEditor content={content} onSave={onSave} />;
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
