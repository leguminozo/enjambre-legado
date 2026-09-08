'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Search, RotateCcw, Check } from 'lucide-react';
import {
  type TypographySettings,
  DEFAULT_TYPOGRAPHY_SETTINGS,
  GOOGLE_FONTS_CATALOG,
  parseTypographySettings,
  sanitizeFontFamily,
  type FontCategory,
} from '@/lib/store-chrome';
import { useAutosaveEditor, useAutosaveState } from '@/components/tienda/save-status';

interface TypographySettingsEditorProps {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
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

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-raised">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="text-[10px] text-muted-foreground tabular-nums">{family}</span>
      </div>
      {/* Preview grande en la fuente */}
      <div
        className="px-4 py-6 text-foreground"
        style={{ fontFamily: `'${family}', ${fontStack}` }}
      >
        <p className="text-2xl leading-snug font-medium">El bosque nativo de Chiloé</p>
        <p className="text-sm text-muted-foreground mt-2">
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
        {slot === 'display' && (
          <p className="text-[10px] text-muted-foreground">Titulares, h1–h6 y marca</p>
        )}
      </div>
    </div>
  );
}

/**
 * Editor de tipografía del chrome: dos slots (display/sans) con catálogo
 * curado de Google Fonts + campo custom validado contra css2.
 * Guarda con autosave (onSave) — mismo contrato que los settings editors.
 */
export function TypographySettingsEditor({ content, onSave }: TypographySettingsEditorProps) {
  const { local: settings, setLocal: setSettings, status } = useAutosaveState(
    'typography_settings',
    content,
    parseTypographySettings,
    (next) => onSave(next),
  );
  const saving = status === 'saving';
  const [pickerSlot, setPickerSlot] = useState<'display' | 'sans' | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FontCategory | 'all'>('all');
  const [customValue, setCustomValue] = useState('');
  const [customState, setCustomState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const commit = (next: TypographySettings) => {
    setSettings(next);
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

  return (
    <div className="space-y-4 pb-8">
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

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Tipografía
        </p>
        <button
          type="button"
          onClick={() => commit({ ...DEFAULT_TYPOGRAPHY_SETTINGS })}
          disabled={saving}
          className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent transition-colors disabled:opacity-50"
        >
          <RotateCcw size={12} />
          Restablecer (Cormorant / Source Sans 3)
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
                className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
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
                <FontPickerRow key={f.family} family={f.family} category={f.category} onPick={() => applyFamily(f.family)} />
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
                  className="flex-1 min-w-0 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => void handleCustom()}
                  disabled={customState === 'checking' || !customValue.trim()}
                  className="inline-flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {customState === 'checking' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
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
      <span className="text-base text-foreground truncate" style={{ fontFamily: `'${family}', Georgia, serif` }}>
        {family}
      </span>
      <span className="shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">
        {CATEGORY_LABELS[category]}
      </span>
    </button>
  );
}
