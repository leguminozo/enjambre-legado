'use client';

import React, { useEffect, useId, useState } from 'react';
import { Upload, Smartphone, Monitor } from 'lucide-react';
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
  badge,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  badge?: string;
}) {
  const sliderId = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={sliderId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
          {badge ? (
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/20">
              {badge}
            </span>
          ) : null}
        </div>
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
  const { isDirty } = useAutosaveEditor('menu_settings', local, (next) => onSave(next));
  const brand: BrandAssets = parseBrandAssets(brandContent ?? null);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Re-sync desde servidor solo sin cambios pendientes (evita clobber de tecleo)
  useEffect(() => {
    if (isDirty) return;
    setLocal(mergeHeaderSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof HeaderMenuSettings>(key: K, value: HeaderMenuSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Live mini preview — replica shop-header: layouts, burger, logo fallback y modo escritorio/móvil */}
      <MenuMiniPreview
        settings={local}
        brand={brand}
        previewDevice={previewDevice}
        onDeviceChange={setPreviewDevice}
      />

      <OptionCards
        label="Formato del menú (desktop)"
        options={HEADER_LAYOUT_OPTIONS}
        value={local.layout}
        onChange={(v) => {
          setPreviewDevice('desktop');
          patch('layout', v);
        }}
      />

      <OptionCards
        label="Menú burger (móvil)"
        options={MOBILE_MENU_OPTIONS}
        value={local.mobile_menu}
        onChange={(v) => {
          setPreviewDevice('mobile');
          patch('mobile_menu', v);
        }}
      />
      <p className="text-[11px] text-muted-foreground leading-snug">
        En móvil el panel hace scroll: tamaño 14–48px y separación 8–64px no recortan
        enlaces. Fullscreen, drawer izquierdo y derecho caben en la misma altura útil.
      </p>

      <ToggleField
        label="Burger también en desktop"
        desc="Oculta la barra horizontal en escritorio y usa solo hamburguesa (como Shopify mobile-first)"
        value={local.force_burger_desktop}
        onChange={(v) => {
          setPreviewDevice('desktop');
          patch('force_burger_desktop', v);
        }}
      />

      <section className="space-y-4 p-3 rounded-xl border border-border bg-surface">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Altura de la Cabecera</h4>
        <SliderField
          label="Altura móvil"
          badge={previewDevice === 'mobile' ? 'En simulador' : undefined}
          value={local.height_mobile_px}
          min={48}
          max={120}
          step={1}
          unit="px"
          onChange={(v) => {
            setPreviewDevice('mobile');
            patch('height_mobile_px', v);
          }}
        />
        <SliderField
          label="Altura desktop"
          badge={previewDevice === 'desktop' ? 'En simulador' : undefined}
          value={local.height_desktop_px}
          min={48}
          max={140}
          step={1}
          unit="px"
          onChange={(v) => {
            setPreviewDevice('desktop');
            patch('height_desktop_px', v);
          }}
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
          onChange={(v) => {
            setPreviewDevice('desktop');
            patch('nav_item_gap_px', v);
          }}
        />
        <SliderField
          label="Separación entre letras"
          value={local.nav_letter_spacing_em}
          min={0}
          max={1}
          step={0.02}
          unit="em"
          onChange={(v) => {
            setPreviewDevice('desktop');
            patch('nav_letter_spacing_em', v);
          }}
        />
        <SliderField
          label="Tamaño de texto"
          value={local.nav_font_size_px}
          min={8}
          max={20}
          step={0.2}
          unit="px"
          onChange={(v) => {
            setPreviewDevice('desktop');
            patch('nav_font_size_px', v);
          }}
        />
        <div className="space-y-1.5">
          <label htmlFor="menu-transform" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Transformación
          </label>
          <select
            id="menu-transform"
            name="menu-transform"
            value={local.nav_text_transform}
            onChange={(e) => {
              setPreviewDevice('desktop');
              patch('nav_text_transform', e.target.value as HeaderMenuSettings['nav_text_transform']);
            }}
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
            onChange={(e) => {
              setPreviewDevice('desktop');
              patch('nav_font', e.target.value as HeaderMenuSettings['nav_font']);
            }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="sans">Sans (cuerpo)</option>
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
          onChange={(v) => {
            setPreviewDevice('mobile');
            patch('mobile_item_gap_px', v);
          }}
        />
        <SliderField
          label="Tamaño de texto"
          value={local.mobile_font_size_px}
          min={14}
          max={48}
          step={1}
          unit="px"
          onChange={(v) => {
            setPreviewDevice('mobile');
            patch('mobile_font_size_px', v);
          }}
        />
        <SliderField
          label="Separación entre letras"
          value={local.mobile_letter_spacing_em}
          min={0}
          max={0.5}
          step={0.01}
          unit="em"
          onChange={(v) => {
            setPreviewDevice('mobile');
            patch('mobile_letter_spacing_em', v);
          }}
        />
        <div className="space-y-1.5">
          <label htmlFor="menu-panel-font" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tipografía panel
          </label>
          <select
            id="menu-panel-font"
            name="menu-panel-font"
            value={local.mobile_font}
            onChange={(e) => {
              setPreviewDevice('mobile');
              patch('mobile_font', e.target.value as HeaderMenuSettings['mobile_font']);
            }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="display">Display (Cormorant)</option>
            <option value="sans">Sans (cuerpo)</option>
          </select>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground px-0.5">
          Elementos interactivos
        </h4>
        <ToggleField
          label="Texto de marca"
          desc="Mostrar nombre junto al logo si está configurado"
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
          desc="Campana cuando hay sesión activa"
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
 * - Switch reactivo Móvil / Escritorio: refleja fielmente height_mobile_px y height_desktop_px
 * - 3 layouts: classic, centered y split
 * - 3 estilos de burger: fullscreen / drawer-left / drawer-right, con toggle interactivo
 * - force_burger_desktop oculta la fila de nav desktop
 */
function MenuMiniPreview({
  settings,
  brand,
  previewDevice,
  onDeviceChange,
}: {
  settings: HeaderMenuSettings;
  brand: BrandAssets;
  previewDevice: 'mobile' | 'desktop';
  onDeviceChange: (device: 'mobile' | 'desktop') => void;
}) {
  const resolved = resolveHeaderBrand(brand, settings);
  const [showPanel, setShowPanel] = useState(false);
  const displayFont = 'var(--font-display, "Cormorant Garamond", serif)';

  const isMobile = previewDevice === 'mobile';
  const currentHeightPx = isMobile ? settings.height_mobile_px : settings.height_desktop_px;
  const currentLogoHeight = isMobile
    ? resolved.heightMobilePx
    : (resolved.heightDesktopPx || resolved.heightPx);

  const brandName = brand.brand_name || settings.brand_line1 || 'Obrera & Zángano';
  const brandTagline = brand.brand_tagline || settings.brand_line2 || 'Bosque Nativo de Chiloé';
  const showTagline = isMobile
    ? (brand.brand_tagline_show_mobile !== false && Boolean(brandTagline))
    : (brand.brand_tagline_show_desktop !== false && Boolean(brandTagline));

  const nameSize = isMobile
    ? (brand.brand_name_size_mobile_px ?? 15)
    : (brand.brand_name_size_desktop_px ?? 18);
  const taglineSize = isMobile
    ? (brand.brand_tagline_size_mobile_px ?? 9)
    : (brand.brand_tagline_size_desktop_px ?? 10);

  const scaledNameSize = Math.max(8, Math.round((nameSize / 18) * 11));
  const scaledTaglineSize = Math.max(6, Math.round((taglineSize / 10) * 7.5));

  const logoBlock = resolved.logoSrc ? (
    <img
      src={resolved.logoSrc}
      alt="Logo"
      style={{
        height: `${currentLogoHeight}px`,
        maxWidth: resolved.maxWidthPx > 0 ? `${resolved.maxWidthPx}px` : undefined,
        width: 'auto',
      }}
      className="object-contain shrink-0 transition-all"
    />
  ) : resolved.showText ? (
    <div className="flex flex-col items-center leading-tight">
      <span
        className="font-display uppercase text-foreground whitespace-nowrap"
        style={{
          fontSize: `${scaledNameSize}px`,
          letterSpacing: `${settings.brand_letter_spacing_em}em`,
        }}
      >
        {brandName}
      </span>
      {showTagline && (
        <span
          className="uppercase text-accent whitespace-nowrap"
          style={{
            fontSize: `${scaledTaglineSize}px`,
            letterSpacing: `${settings.brand_letter_spacing_em + 0.1}em`,
          }}
        >
          {brandTagline}
        </span>
      )}
    </div>
  ) : null;

  const actions = (
    <div className="flex items-center gap-1.5 text-muted-foreground text-[9px] shrink-0">
      {settings.show_notifications ? <span title="Campana">●</span> : null}
      {settings.show_account ? <span title="Cuenta">○</span> : null}
      {settings.show_cart ? <span title="Carrito">Bag</span> : null}
      {settings.show_lang_selector ? <span title="Idioma">ES</span> : null}
    </div>
  );

  const desktopNav = (
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

  const panel = isMobile && showPanel ? (
    <div className="absolute inset-0 z-10">
      {settings.mobile_menu !== 'fullscreen' ? (
        <button
          type="button"
          aria-label="Cerrar panel"
          className="absolute inset-0 bg-background/60 backdrop-blur-sm"
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
    <div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm">
      {/* Barra superior de simulación con switch de dispositivo */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border bg-surface-raised">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Simulador de Cabecera
          </p>
          <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
            {isMobile ? `Móvil · ${settings.height_mobile_px}px` : `Escritorio · ${settings.height_desktop_px}px`}
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-surface-sunken p-0.5">
          <button
            type="button"
            onClick={() => onDeviceChange('mobile')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              isMobile
                ? 'bg-background text-accent shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone size={12} />
            Móvil
          </button>
          <button
            type="button"
            onClick={() => onDeviceChange('desktop')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              !isMobile
                ? 'bg-background text-accent shadow-sm border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Monitor size={12} />
            Escritorio
          </button>
        </div>
      </div>

      {/* Área del simulador */}
      <div className="relative min-h-[14rem] sm:min-h-[18rem] overflow-hidden bg-background flex flex-col justify-start">
        {isMobile ? (
          /* Cabecera Móvil */
          <div
            className="relative flex items-center justify-between gap-2 px-3 border-b border-border/40 transition-all duration-150"
            style={{ height: `${currentHeightPx}px` }}
          >
            <button
              type="button"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border text-[12px] text-muted-foreground hover:border-accent/40"
              onClick={() => setShowPanel((v) => !v)}
              aria-label="Abrir panel móvil"
            >
              ≡
            </button>
            <div className={settings.layout === 'split' ? 'relative min-w-0' : 'absolute left-1/2 max-w-[55%] -translate-x-1/2'}>
              {logoBlock}
            </div>
            <div>{actions}</div>
          </div>
        ) : (
          /* Cabecera Escritorio */
          <div
            className={`relative flex items-center gap-4 px-4 border-b border-border/40 transition-all duration-150 ${
              settings.layout === 'centered'
                ? 'flex-col justify-center py-2'
                : 'justify-between'
            }`}
            style={{ height: `${currentHeightPx}px` }}
          >
            {settings.force_burger_desktop ? (
              <>
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border text-[12px] text-muted-foreground"
                >
                  ≡
                </button>
                <div className="flex-1 flex justify-center">{logoBlock}</div>
                <div>{actions}</div>
              </>
            ) : settings.layout === 'centered' ? (
              <>
                <div className="w-full flex items-center justify-between">
                  <div className="w-12 shrink-0" />
                  <div className="flex justify-center">{logoBlock}</div>
                  <div>{actions}</div>
                </div>
                {desktopNav}
              </>
            ) : settings.layout === 'split' ? (
              <>
                <div className="shrink-0">{logoBlock}</div>
                <div className="flex items-center gap-4">
                  {desktopNav}
                  <div>{actions}</div>
                </div>
              </>
            ) : (
              /* Classic: Logo izquierda, Nav centro, Acciones derecha */
              <>
                <div className="shrink-0">{logoBlock}</div>
                {desktopNav}
                <div>{actions}</div>
              </>
            )}
          </div>
        )}

        {/* Panel lateral móvil */}
        {panel}
      </div>

      {/* Barra de estado inferior */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-sunken border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Layout: <span className="text-foreground">{settings.layout}</span>
          {isMobile ? (
            <> · Burger: <span className="text-foreground">{settings.mobile_menu}</span></>
          ) : settings.force_burger_desktop ? (
            <> · <span className="text-foreground">Burger desktop</span></>
          ) : null}
        </p>
        {isMobile ? (
          <button
            type="button"
            className="text-[10px] font-medium text-accent hover:underline"
            onClick={() => setShowPanel((v) => !v)}
          >
            {showPanel ? 'Cerrar panel' : 'Probar panel móvil'}
          </button>
        ) : (
          <span className="text-[10px] text-muted-foreground">Vista de escritorio completa</span>
        )}
      </div>
    </div>
  );
}
