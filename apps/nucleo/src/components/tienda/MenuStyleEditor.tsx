'use client';

import React, { useEffect, useId, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import {
  type HeaderMenuSettings,
  HEADER_LAYOUT_OPTIONS,
  MOBILE_MENU_OPTIONS,
  mergeHeaderSettings,
} from '@/lib/header-menu';
import {
  resolveHeaderBrand,
  parseBrandAssets,
  type BrandAssets,
} from '@/lib/store-chrome';
import { useAutosaveEditor } from '@/components/tienda/save-status';

interface MenuStyleEditorProps {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
  /** brand_assets del CMS: la preview replica el fallback logo menú → marca → texto */
  brandContent?: Record<string, unknown> | null;
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
  const sliderId = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={sliderId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <span className="text-xs font-mono text-accent tabular-nums">
          {value % 1 === 0 ? value : value.toFixed(2)}
          {unit}
        </span>
      </div>
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
      <div className="flex justify-between text-[10px] text-muted-foreground/70">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
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

function OptionCards<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; desc: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="grid gap-2">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`text-left p-3 rounded-xl border transition-all min-h-[56px] ${
                active
                  ? 'border-accent bg-accent/10 shadow-sm'
                  : 'border-border bg-background hover:border-accent/40'
              }`}
            >
              <p className={`text-sm font-medium ${active ? 'text-accent' : 'text-foreground'}`}>
                {opt.label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Editor visual del menú (inspirado en theme customizer Shopify).
 * Controla formato, burger, tipografía, gaps y altura — sin JSON crudo.
 */
export function MenuStyleEditor({ content, onSave, onImageUpload, brandContent }: MenuStyleEditorProps) {
  const [local, setLocal] = useState<HeaderMenuSettings>(() => mergeHeaderSettings(content));
  const { isDirty, flush } = useAutosaveEditor('menu_settings', local, (next) => onSave(next));
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const brand: BrandAssets = parseBrandAssets(brandContent ?? null);

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(mergeHeaderSettings(content));
    setIsUploadingLogo(false);
  }, [content, isDirty]);

  const patch = <K extends keyof HeaderMenuSettings>(key: K, value: HeaderMenuSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Live mini preview — replica shop-header: layouts, burger, logo fallback */}
      <MenuMiniPreview settings={local} brand={brand} />

      <OptionCards
        label="Formato del menú (desktop)"
        options={HEADER_LAYOUT_OPTIONS}
        value={local.layout}
        onChange={(v) => patch('layout', v)}
      />

      <OptionCards
        label="Menú burger (móvil)"
        options={MOBILE_MENU_OPTIONS}
        value={local.mobile_menu}
        onChange={(v) => patch('mobile_menu', v)}
      />
      <p className="text-[11px] text-muted-foreground leading-snug">
        En iPhone 8 (375×667) el panel hace scroll: tamaño 14–48px y separación 8–64px no recortan
        enlaces. Fullscreen, drawer izquierdo y derecho caben en la misma altura útil.
      </p>

      <ToggleField
        label="Burger también en desktop"
        desc="Oculta la barra horizontal en escritorio y usa solo hamburguesa (como Shopify mobile-first)"
        value={local.force_burger_desktop}
        onChange={(v) => patch('force_burger_desktop', v)}
      />

      <section className="space-y-4 p-3 rounded-xl border border-border bg-surface">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Altura</h4>
        <SliderField
          label="Altura móvil"
          value={local.height_mobile_px}
          min={48}
          max={120}
          step={1}
          unit="px"
          onChange={(v) => patch('height_mobile_px', v)}
        />
        <SliderField
          label="Altura desktop"
          value={local.height_desktop_px}
          min={48}
          max={140}
          step={1}
          unit="px"
          onChange={(v) => patch('height_desktop_px', v)}
        />
      </section>

      <section className="space-y-4 p-3 rounded-xl border border-border bg-surface">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Enlaces desktop
        </h4>
        <SliderField
          label="Separación entre botones"
          value={local.nav_item_gap_px}
          min={4}
          max={80}
          step={2}
          unit="px"
          onChange={(v) => patch('nav_item_gap_px', v)}
        />
        <SliderField
          label="Separación entre letras"
          value={local.nav_letter_spacing_em}
          min={0}
          max={1}
          step={0.02}
          unit="em"
          onChange={(v) => patch('nav_letter_spacing_em', v)}
        />
        <SliderField
          label="Tamaño de texto"
          value={local.nav_font_size_px}
          min={8}
          max={20}
          step={0.2}
          unit="px"
          onChange={(v) => patch('nav_font_size_px', v)}
        />
        <div className="space-y-1.5">
          <label htmlFor="menu-transform" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Transformación
          </label>
          <select
            id="menu-transform"
            name="menu-transform"
            value={local.nav_text_transform}
            onChange={(e) =>
              patch('nav_text_transform', e.target.value as HeaderMenuSettings['nav_text_transform'])
            }
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="uppercase">MAYÚSCULAS</option>
            <option value="none">Normal</option>
            <option value="capitalize">Capitalizar</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="menu-nav-font" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tipografía
          </label>
          <select
            id="menu-nav-font"
            name="menu-nav-font"
            value={local.nav_font}
            onChange={(e) => patch('nav_font', e.target.value as HeaderMenuSettings['nav_font'])}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="sans">Sans (Inter)</option>
            <option value="display">Display (Cormorant)</option>
          </select>
        </div>
      </section>

      <section className="space-y-4 p-3 rounded-xl border border-border bg-surface">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Panel burger (móvil)
        </h4>
        <SliderField
          label="Separación entre botones"
          value={local.mobile_item_gap_px}
          min={8}
          max={64}
          step={2}
          unit="px"
          onChange={(v) => patch('mobile_item_gap_px', v)}
        />
        <SliderField
          label="Tamaño de texto"
          value={local.mobile_font_size_px}
          min={14}
          max={48}
          step={1}
          unit="px"
          onChange={(v) => patch('mobile_font_size_px', v)}
        />
        <SliderField
          label="Separación entre letras"
          value={local.mobile_letter_spacing_em}
          min={0}
          max={0.5}
          step={0.01}
          unit="em"
          onChange={(v) => patch('mobile_letter_spacing_em', v)}
        />
        <div className="space-y-1.5">
          <label htmlFor="menu-panel-font" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tipografía panel
          </label>
          <select
            id="menu-panel-font"
            name="menu-panel-font"
            value={local.mobile_font}
            onChange={(e) => patch('mobile_font', e.target.value as HeaderMenuSettings['mobile_font'])}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="display">Display (Cormorant)</option>
            <option value="sans">Sans (Inter)</option>
          </select>
        </div>
      </section>

      <section className="space-y-4 p-3 rounded-xl border border-border bg-surface">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Marca y Logo</h4>
        <div className="space-y-2">
            {local.logo_src ? (
                <div
                  className="rounded-lg border border-border p-2 flex items-center justify-center"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)',
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                    backgroundColor: 'hsl(var(--muted) / 0.5)',
                  }}
                >
                  <img
                    src={local.logo_src}
                    alt="Logo"
                    style={{ height: `${local.logo_height_px || 32}px`, width: 'auto', maxWidth: '100%' }}
                    className="object-contain"
                  />
                </div>
            ) : null}
            <button
                type="button"
                disabled={isUploadingLogo || !onImageUpload}
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="flex w-full justify-center items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-background border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50"
            >
                {isUploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {local.logo_src ? 'Cambiar logo' : 'Subir logo (PNG/SVG)'}
            </button>
            <input
                id="logo-upload"
                type="file"
                accept="image/png,image/svg+xml,image/webp,image/jpeg,image/gif,.png,.svg"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onImageUpload) {
                        setIsUploadingLogo(true);
                        void Promise.resolve(onImageUpload(file, 'logo_src'))
                          .then((url) => {
                            if (typeof url === 'string' && url) {
                          // Upload = URL only; editor guarda content completo (inmediato)
                          const next = { ...local, logo_src: url, show_logo: true };
                          setLocal(next);
                          void flush(next);
                        }
                          })
                          .catch(() => {
                            /* toast handled by parent */
                          })
                          .finally(() => setIsUploadingLogo(false));
                    }
                    e.target.value = '';
                }}
            />
            <p className="text-[10px] text-muted-foreground">
              PNG/SVG con transparencia. No se convierte a WEBP lossy.
            </p>
        </div>
        <ToggleField
          label="Mostrar logo (solo imagen)"
          desc="Oculta el texto de marca. Usa logo de Menú si hay; si no, el de Marca."
          value={local.show_logo}
          onChange={(v) => patch('show_logo', v)}
        />
        <SliderField
          label="Altura del logo"
          value={local.logo_height_px}
          min={16}
          max={160}
          step={1}
          unit="px"
          onChange={(v) => patch('logo_height_px', v)}
        />
        <div className="space-y-1.5 mt-4">
          <label htmlFor="menu-brand-line1" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Línea 1
          </label>
          <input
            id="menu-brand-line1"
            name="menu-brand-line1"
            type="text"
            autoComplete="off"
            value={local.brand_line1}
            onChange={(e) => patch('brand_line1', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="menu-brand-line2" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Línea 2
          </label>
          <input
            id="menu-brand-line2"
            name="menu-brand-line2"
            type="text"
            autoComplete="off"
            value={local.brand_line2}
            onChange={(e) => patch('brand_line2', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <SliderField
          label="Tracking marca"
          value={local.brand_letter_spacing_em}
          min={0}
          max={1}
          step={0.02}
          unit="em"
          onChange={(v) => patch('brand_letter_spacing_em', v)}
        />
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground px-0.5">
          Elementos interactivos
        </h4>
        <ToggleField
          label="Texto de marca"
          desc="Mostrar nombre junto al logo"
          value={local.show_brand_text}
          onChange={(v) => patch('show_brand_text', v)}
        />
        <ToggleField
          label="Carrito"
          value={local.show_cart}
          onChange={(v) => patch('show_cart', v)}
        />
        <ToggleField
          label="Cuenta / Acceso"
          value={local.show_account}
          onChange={(v) => patch('show_account', v)}
        />
        <ToggleField
          label="Selector de idioma"
          value={local.show_lang_selector}
          onChange={(v) => patch('show_lang_selector', v)}
        />
        <ToggleField
          label="Notificaciones"
          desc="Campana cuando hay sesión"
          value={local.show_notifications}
          onChange={(v) => patch('show_notifications', v)}
        />
        <ToggleField
          label="Header sticky"
          value={local.sticky}
          onChange={(v) => patch('sticky', v)}
        />
        <ToggleField
          label="Backdrop blur"
          value={local.backdrop_blur}
          onChange={(v) => patch('backdrop_blur', v)}
        />
      </section>
    </div>
  );
}

const PREVIEW_NAV_LABELS = ['Inicio', 'Creaciones', 'Experiencias', 'Galería'];

/**
 * Mini preview fiel del header (misma semántica que shop-header de tienda):
 * - resolveHeaderBrand para el fallback logo menú → logo marca → texto (con maxWidth real)
 * - 3 layouts: classic/centered (logo centrado absoluto) vs split (logo en flujo)
 * - 3 estilos de burger: fullscreen / drawer-left / drawer-right, con toggle interactivo
 * - force_burger_desktop oculta la fila de nav desktop
 */
function MenuMiniPreview({
  settings,
  brand,
}: {
  settings: HeaderMenuSettings;
  brand: BrandAssets;
}) {
  const resolved = resolveHeaderBrand(brand, settings);
  const [showPanel, setShowPanel] = useState(false);
  const displayFont =
    'var(--font-display, "Cormorant Garamond", serif)';

  const logoBlock = resolved.logoSrc ? (
    <img
      src={resolved.logoSrc}
      alt="Logo"
      style={{
        height: `${resolved.heightPx}px`,
        maxWidth: resolved.maxWidthPx > 0 ? `${resolved.maxWidthPx}px` : undefined,
        width: 'auto',
      }}
      className="object-contain shrink-0"
    />
  ) : resolved.showText ? (
    <div className="flex flex-col items-center leading-tight">
      <span
        className="font-display text-[10px] uppercase text-foreground whitespace-nowrap"
        style={{ letterSpacing: `${settings.brand_letter_spacing_em}em` }}
      >
        {settings.brand_line1}
      </span>
      <span
        className="text-[7px] uppercase text-accent whitespace-nowrap"
        style={{ letterSpacing: `${settings.brand_letter_spacing_em + 0.1}em` }}
      >
        {settings.brand_line2}
      </span>
    </div>
  ) : null;

  // classic/centered → centrado absoluto en móvil (igual que shop-header);
  // split → en flujo a la izquierda.
  const logoWrapClass =
    settings.layout === 'split'
      ? 'relative min-w-0'
      : 'absolute left-1/2 max-w-[55%] -translate-x-1/2';

  const actions = (
    <div className="flex items-center gap-1.5 text-muted-foreground text-[9px]">
      {settings.show_notifications ? <span title="Campana">●</span> : null}
      {settings.show_account ? <span title="Cuenta">○</span> : null}
      {settings.show_cart ? <span title="Carrito">Bag</span> : null}
      {settings.show_lang_selector ? <span title="Idioma">ES</span> : null}
    </div>
  );

  const desktopNav = settings.force_burger_desktop ? null : (
    <div
      className={`flex items-center text-muted-foreground whitespace-nowrap ${
        settings.layout === 'centered'
          ? 'justify-center w-full'
          : 'justify-center flex-1'
      }`}
      style={{
        gap: `${settings.nav_item_gap_px}px`,
        fontSize: `${settings.nav_font_size_px}px`,
        letterSpacing: `${settings.nav_letter_spacing_em}em`,
        textTransform: settings.nav_text_transform,
        fontFamily: settings.nav_font === 'display' ? displayFont : 'inherit',
      }}
    >
      {PREVIEW_NAV_LABELS.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  );

  const panelClass =
    settings.mobile_menu === 'drawer-left'
      ? 'absolute left-0 top-0 h-full w-3/5 max-w-[240px] bg-background border-r border-border'
      : settings.mobile_menu === 'drawer-right'
        ? 'absolute right-0 top-0 h-full w-3/5 max-w-[240px] bg-background border-l border-border'
        : 'absolute inset-0 bg-background';

  const panel = showPanel ? (
    <div className="absolute inset-0 z-10">
      {settings.mobile_menu !== 'fullscreen' ? (
        <button
          type="button"
          aria-label="Cerrar panel"
          className="absolute inset-0 bg-black/30"
          onClick={() => setShowPanel(false)}
        />
      ) : null}
      <div
        className={`${panelClass} flex min-h-0 flex-col overflow-y-auto p-4`}
        style={{ gap: `${settings.mobile_item_gap_px}px` }}
      >
        <nav
          className="flex min-h-0 flex-col"
          style={{
            gap: `${settings.mobile_item_gap_px}px`,
            fontSize: `${settings.mobile_font_size_px}px`,
            letterSpacing: `${settings.mobile_letter_spacing_em}em`,
            fontFamily: settings.mobile_font === 'display' ? displayFont : 'inherit',
          }}
        >
          {PREVIEW_NAV_LABELS.map((l) => (
            <span key={l} className="break-words font-light leading-tight text-foreground">
              {l}
            </span>
          ))}
        </nav>
        <div className="h-px bg-border" />
        {settings.show_cart ? (
          <span className="text-foreground text-sm">Tu bolsa</span>
        ) : null}
        {settings.show_account ? (
          <span className="italic text-foreground text-sm">Cuenta</span>
        ) : null}
        {settings.show_lang_selector ? (
          <span className="mt-1 self-start rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground">
            Cambiar a English
          </span>
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="px-3 py-2 border-b border-border bg-surface-raised">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Vista previa del menú · iPhone 8
        </p>
      </div>
      <div className="relative min-h-[22rem] overflow-hidden sm:min-h-[26rem]">
        {/* Barra (estado móvil) */}
        <div
          className="relative flex items-center justify-between gap-2 px-3"
          style={{ height: `${settings.height_mobile_px}px` }}
        >
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-[11px] text-muted-foreground hover:border-accent/40"
            onClick={() => setShowPanel((v) => !v)}
            aria-label="Abrir panel móvil"
          >
            ≡
          </button>
          <div className={logoWrapClass}>{logoBlock}</div>
          <div className="shrink-0">{actions}</div>
        </div>
        {/* Nav desktop (estado ≥lg) */}
        {desktopNav ? (
          <div className="hidden border-t border-border px-3 py-1.5 sm:flex">
            {desktopNav}
            {settings.layout === 'split' ? actions : null}
          </div>
        ) : (
          <div className="hidden border-t border-border px-3 py-1.5 text-[9px] text-muted-foreground/60 sm:block">
            Burger en desktop: nav horizontal oculta
          </div>
        )}
        {panel}
      </div>
      <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Burger: <span className="text-foreground">{settings.mobile_menu}</span>
          {' · '}Layout: <span className="text-foreground">{settings.layout}</span>
          {settings.force_burger_desktop ? (
            <span className="text-foreground"> · burger desktop</span>
          ) : null}
        </p>
        <button
          type="button"
          className="text-[9px] font-medium text-accent"
          onClick={() => setShowPanel((v) => !v)}
        >
          {showPanel ? 'Cerrar panel' : 'Probar panel'}
        </button>
      </div>
    </div>
  );
}
