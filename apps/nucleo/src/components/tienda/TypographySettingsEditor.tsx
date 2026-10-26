'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  Search,
  RotateCcw,
  Check,
  Palette,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import {
  type TypographySettings,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  GOOGLE_FONTS_CATALOG,
  FONT_SCALE_PRESETS,
  parseTypographySettings,
  sanitizeFontFamily,
  type FontCategory,
} from '@/lib/store-chrome';
import { useAutosaveState } from '@/components/tienda/save-status';

interface TypographySettingsEditorProps {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  onOpenSection?: (sectionKey: string) => void;
}

const CATEGORY_FILTERS: { id: FontCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'serif', label: 'Serif editorial' },
  { id: 'display', label: 'Display' },
  { id: 'sans', label: 'Sans' },
  { id: 'handwriting', label: 'Manuscrita' },
];

const CATEGORY_LABELS: Record<FontCategory, string> = {
  serif: 'Serif editorial',
  display: 'Display',
  sans: 'Sans',
  handwriting: 'Manuscrita',
};

/** Inyecta el <link> css2 de una familia una sola vez (lazy por fila visible). */
function useGoogleFontPreview(family: string | null) {
  const loaded = useRef(new Set<string>());
  useEffect(() => {
    if (!family || loaded.current.has(family)) return;
    loaded.current.add(family);
    const href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    return () => {
      // No remover: otras filas/slots pueden estar usando la misma familia
    };
  }, [family]);
}

/** Valida contra css2 (400 = no existe) y devuelve el nombre canónico, o '' si no existe. */
async function validateGoogleFont(family: string): Promise<string> {
  const sanitized = sanitizeFontFamily(family, '');
  if (!sanitized) return '';
  try {
    const res = await fetch(
      `https://fonts.googleapis.com/css2?family=${sanitized.replace(/ /g, '+')}:wght@400&display=swap`,
      { mode: 'no-cors' },
    );
    if (!res.ok) return '';
    return sanitized;
  } catch {
    return '';
  }
}

function FontSlotCard({
  label,
  slot,
  settings,
  onPick,
  saving,
}: {
  label: string;
  slot: 'display' | 'sans';
  settings: TypographySettings;
  onPick: (slot: 'display' | 'sans') => void;
  saving: boolean;
}) {
  const family = slot === 'display' ? settings.font_display : settings.font_sans;
  useGoogleFontPreview(family);
  const fontStack = slot === 'display' ? 'Georgia, serif' : 'system-ui, sans-serif';

  const globalScale = settings.font_scale ?? 1.0;
  const specificScale =
    slot === 'display' ? (settings.heading_scale ?? 1.0) : (settings.body_scale ?? 1.0);
  const effectiveScale = globalScale * specificScale;

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-raised">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-[10px] text-muted-foreground tabular-nums">{family}</span>
      </div>
      {/* Preview grande con escala aplicada en tiempo real */}
      <div
        className="px-4 py-6 text-foreground transition-all duration-200"
        style={{ fontFamily: `'${family}', ${fontStack}` }}
      >
        <p
          className="leading-snug font-medium transition-all duration-200"
          style={{ fontSize: `${(slot === 'display' ? 1.5 : 1.05) * effectiveScale}rem` }}
        >
          El bosque nativo de Chiloé
        </p>
        <p
          className="text-muted-foreground mt-2 transition-all duration-200"
          style={{ fontSize: `${0.875 * globalScale * (settings.body_scale ?? 1.0)}rem` }}
        >
          Cada gota regenera bosque nativo — {CATEGORY_LABELS[slot === 'display' ? 'serif' : 'sans']}
        </p>
      </div>
      <div className="px-3 py-2.5 border-t border-border bg-surface-sunken/50 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onPick(slot)}
          disabled={saving}
          className="inline-flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          <Search size={13} />
          Cambiar fuente
        </button>
        {slot === 'display' ? (
          <p className="text-[10px] text-muted-foreground">Titulares, h1–h6 y marca</p>
        ) : (
          <p className="text-[10px] text-muted-foreground">Párrafos, botones y lectura</p>
        )}
      </div>
    </div>
  );
}

/**
 * Editor de tipografía del chrome:
 * - Selección de fuentes Display y Sans.
 * - Escala tipográfica global (Type Scale) con presets y ajuste continuo.
 * - Ajuste fino de titulares y lectura.
 * - Información y vinculación de tokens de color centralizados.
 */
export function TypographySettingsEditor({
  content,
  onSave,
  onOpenSection,
}: TypographySettingsEditorProps) {
  const { local: settings, setLocal: setSettings, status } = useAutosaveState(
    'typography_settings',
    content,
    parseTypographySettings,
    (next) => onSave(next),
  );
  const saving = status === 'saving';
  const [pickerSlot, setPickerSlot] = useState<'display' | 'sans' | null>(null);
  const [showFineTuning, setShowFineTuning] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FontCategory | 'all'>('all');
  const [customValue, setCustomValue] = useState('');
  const [customState, setCustomState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const fontScaleId = useId();
  const headingScaleId = useId();
  const bodyScaleId = useId();

  const commit = (next: TypographySettings) => {
    setSettings(next);
  };

  const patch = <K extends keyof TypographySettings>(key: K, value: TypographySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const applyFamily = (family: string) => {
    if (!pickerSlot) return;
    const next = { ...settingsRef.current, [pickerSlot]: family };
    commit(next);
    setPickerSlot(null);
    setQuery('');
    setCustomValue('');
    setCustomState('idle');
  };

  const handleCustom = async () => {
    const sanitized = sanitizeFontFamily(customValue, '');
    if (!sanitized) return;
    setCustomState('checking');
    const valid = await validateGoogleFont(sanitized);
    if (!valid) {
      setCustomState('invalid');
      return;
    }
    setCustomState('valid');
    applyFamily(sanitized);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GOOGLE_FONTS_CATALOG.filter((f) => {
      if (category !== 'all' && f.category !== category) return false;
      if (q && !f.family.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category]);

  const currentScale = settings.font_scale ?? 1.0;
  const currentHeadingScale = settings.heading_scale ?? 1.0;
  const currentBodyScale = settings.body_scale ?? 1.0;

  return (
    <div className="space-y-4 pb-8">
      {/* Header descriptivo */}
      <div className="p-4 rounded-xl border border-border bg-surface">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Tipografía y Escala de Textos
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Familias tipográficas, proporciones y tamaño general de textos para toda la tienda pública.
        </p>
      </div>

      {/* 1. Control de Escala Tipográfica General */}
      <div className="p-4 rounded-xl border border-border bg-background space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <label htmlFor={fontScaleId} className="text-xs font-bold text-foreground">
              Escala general de textos
            </label>
            <p className="text-[10px] text-muted-foreground">
              Multiplica armónicamente el tamaño de todos los textos del sitio conservando la adaptabilidad responsiva.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-accent tabular-nums shrink-0">
            {Math.round(currentScale * 100)}%
          </span>
        </div>

        {/* Botones de Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {FONT_SCALE_PRESETS.map((preset) => {
            const isSelected = Math.abs(currentScale - preset.value) < 0.01;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => patch('font_scale', preset.value)}
                disabled={saving}
                className={`px-2.5 py-2 rounded-lg text-left border transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-surface-sunken/40 text-foreground hover:bg-surface-raised'
                }`}
              >
                <div className="text-xs font-semibold">{preset.label}</div>
                <div className="text-[9px] text-muted-foreground tabular-nums">{preset.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Slider continuo */}
        <div className="pt-1">
          <input
            id={fontScaleId}
            name={fontScaleId}
            type="range"
            min={0.85}
            max={1.25}
            step={0.01}
            value={currentScale}
            onChange={(e) => patch('font_scale', parseFloat(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-1">
            <span>85% (Compacto)</span>
            <span>100% (Origen)</span>
            <span>125% (Majestuoso)</span>
          </div>
        </div>
      </div>

      {/* 2. Ajuste Fino de Jerarquías (Titulares vs Lectura) */}
      <div className="border border-border rounded-xl overflow-hidden bg-surface/50">
        <button
          type="button"
          onClick={() => setShowFineTuning(!showFineTuning)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-surface-raised transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <div>
              <span className="text-xs font-bold text-foreground">
                Ajuste fino de proporciones (Titulares vs Lectura)
              </span>
              <p className="text-[10px] text-muted-foreground">
                Permite calibrar independientemente los titulares Display respecto a los párrafos de lectura
              </p>
            </div>
          </div>
          {showFineTuning ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showFineTuning && (
          <div className="p-4 space-y-4 border-t border-border bg-background">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={headingScaleId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Escala de titulares Display (H1–H6 / Hero)
                </label>
                <span className="text-xs font-mono text-accent tabular-nums">
                  {Math.round(currentHeadingScale * 100)}%
                </span>
              </div>
              <input
                id={headingScaleId}
                name={headingScaleId}
                type="range"
                min={0.85}
                max={1.3}
                step={0.01}
                value={currentHeadingScale}
                onChange={(e) => patch('heading_scale', parseFloat(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[10px] text-muted-foreground">
                Ajusta el H1 emblemático ("La Obrera y el Zángano") y cabeceras de sección.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <label htmlFor={bodyScaleId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Escala de cuerpo y lectura
                </label>
                <span className="text-xs font-mono text-accent tabular-nums">
                  {Math.round(currentBodyScale * 100)}%
                </span>
              </div>
              <input
                id={bodyScaleId}
                name={bodyScaleId}
                type="range"
                min={0.85}
                max={1.2}
                step={0.01}
                value={currentBodyScale}
                onChange={(e) => patch('body_scale', parseFloat(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[10px] text-muted-foreground">
                Ajusta subtítulos, fórmulas botánicas y descripciones del catálogo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Selección de Fuentes (Display y Sans) */}
      <div className="grid gap-3">
        <FontSlotCard
          label="Titulares / Display"
          slot="display"
          settings={settings}
          onPick={setPickerSlot}
          saving={saving}
        />
        <FontSlotCard
          label="Texto / Cuerpo"
          slot="sans"
          settings={settings}
          onPick={setPickerSlot}
          saving={saving}
        />
      </div>

      {/* 4. Coherencia de Color Centralizada */}
      <div className="p-4 rounded-xl border border-border/70 bg-surface/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Colores de texto centralizados
            </h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Los colores del texto (Crema Legado en modo oscuro, Negro Tinta en modo claro y Oro Miel en enlaces y acentos) se gobiernan de forma compartida desde el panel de tema para asegurar contraste y armonía visual.
          </p>
        </div>
        {onOpenSection ? (
          <button
            type="button"
            onClick={() => onOpenSection('theme_settings')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-surface-raised text-xs font-semibold transition-colors shrink-0"
          >
            <span>Ver colores de tema</span>
            <ArrowRight size={13} />
          </button>
        ) : null}
      </div>

      {/* 5. Acciones: Restablecer defaults */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Valores de fábrica
        </p>
        <button
          type="button"
          onClick={() => commit({ ...DEFAULT_TYPOGRAPHY_SETTINGS })}
          disabled={saving}
          className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent transition-colors disabled:opacity-50"
        >
          <RotateCcw size={12} />
          Restablecer escala y fuentes de origen
        </button>
      </div>

      {/* Picker: modal inline al tocar "Cambiar fuente" */}
      {pickerSlot ? (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border bg-surface-raised flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Elegir fuente — {pickerSlot === 'display' ? 'Titulares' : 'Cuerpo'}
            </p>
            <button
              type="button"
              onClick={() => setPickerSlot(null)}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground min-h-9 px-2"
            >
              Cerrar
            </button>
          </div>

          <div className="p-3 space-y-3">
            <div className="flex gap-2">
              <input
                id="font-search"
                name="font-search"
                type="text"
                autoComplete="off"
                aria-label="Buscar fuente"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar fuente…"
                className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2.5 text-base md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex gap-1 shrink-0">
                {CATEGORY_FILTERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-h-9 ${
                      category === c.id
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background scrollbar-thin">
              {filtered.map((f) => (
                <FontPickerRow
                  key={f.family}
                  family={f.family}
                  category={f.category}
                  onPick={() => applyFamily(f.family)}
                />
              ))}
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Sin resultados — prueba con “Otra Google Font” abajo.
                </p>
              ) : null}
            </div>

            {/* Campo custom validado contra css2 */}
            <div className="rounded-lg border border-border bg-background p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Otra Google Font…
              </p>
              <div className="flex gap-2">
                <input
                  id="font-custom"
                  name="font-custom"
                  type="text"
                  autoComplete="off"
                  aria-label="Otra Google Font"
                  value={customValue}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                    setCustomState('idle');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCustom();
                  }}
                  placeholder="Ej: Montserrat, Merriweather…"
                  className="flex-1 min-w-0 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-base md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => void handleCustom()}
                  disabled={customState === 'checking' || !customValue.trim()}
                  className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {customState === 'checking' ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Aplicar
                </button>
              </div>
              {customState === 'invalid' ? (
                <p className="text-[11px] text-destructive">
                  Esa fuente no existe en Google Fonts (400 no encontrado).
                </p>
              ) : customState === 'valid' ? (
                <p className="text-[11px] text-accent">Fuente aplicada ✓</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Solo letras y espacios. Se valida contra Google Fonts antes de aplicar.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FontPickerRow({
  family,
  category,
  onPick,
}: {
  family: string;
  category: FontCategory;
  onPick: () => void;
}) {
  useGoogleFontPreview(family);
  return (
    <button
      type="button"
      onClick={onPick}
      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-surface-raised/60 transition-colors min-h-[52px] border-b border-border/40 last:border-b-0"
    >
      <span
        className="text-base text-foreground truncate"
        style={{ fontFamily: `'${family}', Georgia, serif` }}
      >
        {family}
      </span>
      <span className="shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">
        {CATEGORY_LABELS[category]}
      </span>
    </button>
  );
}
