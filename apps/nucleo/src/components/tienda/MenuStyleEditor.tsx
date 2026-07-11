'use client';

import React, { useEffect, useState } from 'react';
import { Save, Loader2, Upload } from 'lucide-react';
import {
  type HeaderMenuSettings,
  HEADER_LAYOUT_OPTIONS,
  MOBILE_MENU_OPTIONS,
  mergeHeaderSettings,
} from '@/lib/header-menu';

interface MenuStyleEditorProps {
  content: Record<string, unknown>;
  isUpdating: boolean;
  onSave: (content: Record<string, unknown>) => void;
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
export function MenuStyleEditor({ content, isUpdating, onSave, onImageUpload }: MenuStyleEditorProps) {
  const [local, setLocal] = useState<HeaderMenuSettings>(() => mergeHeaderSettings(content));
  const [dirty, setDirty] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    setLocal(mergeHeaderSettings(content));
    setDirty(false);
    setIsUploadingLogo(false);
  }, [content]);

  const patch = <K extends keyof HeaderMenuSettings>(key: K, value: HeaderMenuSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    onSave({ ...local });
    setDirty(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Live mini preview */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-3 py-2 border-b border-border bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vista previa del menú
          </p>
        </div>
        <div
          className="flex items-center justify-between px-3 border-b border-border"
          style={{
            height: local.height_mobile_px,
            letterSpacing: `${local.brand_letter_spacing_em}em`,
          }}
        >
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center text-[10px] text-muted-foreground">
            ≡
          </div>
          {local.show_logo && local.logo_src ? (
            <div className="flex-1 flex justify-center">
              <img src={local.logo_src} alt="Logo" style={{ height: `${local.logo_height_px || 32}px` }} className="object-contain" />
            </div>
          ) : local.show_brand_text ? (
            <div className="text-center flex-1 px-2">
              <p
                className="font-display text-[11px] uppercase text-foreground leading-tight truncate"
                style={{ letterSpacing: `${local.brand_letter_spacing_em}em` }}
              >
                {local.brand_line1}
              </p>
              <p
                className="text-[8px] uppercase text-accent leading-tight truncate"
                style={{ letterSpacing: `${local.brand_letter_spacing_em + 0.1}em` }}
              >
                {local.brand_line2}
              </p>
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            {local.show_account ? <span>○</span> : null}
            {local.show_cart ? <span>Bag</span> : null}
          </div>
        </div>
        <div
          className="hidden sm:flex items-center justify-center px-4 py-2 gap-1 flex-wrap"
          style={{
            gap: Math.min(local.nav_item_gap_px, 24),
            fontSize: local.nav_font_size_px,
            letterSpacing: `${local.nav_letter_spacing_em}em`,
            textTransform: local.nav_text_transform,
            fontFamily: local.nav_font === 'display' ? 'var(--font-display, serif)' : 'inherit',
          }}
        >
          {['Inicio', 'Creaciones', 'Experiencias', 'Galería'].map((l) => (
            <span key={l} className="text-muted-foreground whitespace-nowrap">
              {l}
            </span>
          ))}
        </div>
        <div className="px-3 py-2 bg-surface-sunken border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            Burger: <span className="text-foreground">{local.mobile_menu}</span>
            {' · '}
            Layout: <span className="text-foreground">{local.layout}</span>
          </p>
        </div>
      </div>

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
          max={100}
          step={1}
          unit="px"
          onChange={(v) => patch('height_mobile_px', v)}
        />
        <SliderField
          label="Altura desktop"
          value={local.height_desktop_px}
          min={56}
          max={120}
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
          min={8}
          max={64}
          step={2}
          unit="px"
          onChange={(v) => patch('nav_item_gap_px', v)}
        />
        <SliderField
          label="Separación entre letras"
          value={local.nav_letter_spacing_em}
          min={0}
          max={0.6}
          step={0.02}
          unit="em"
          onChange={(v) => patch('nav_letter_spacing_em', v)}
        />
        <SliderField
          label="Tamaño de texto"
          value={local.nav_font_size_px}
          min={8}
          max={16}
          step={0.2}
          unit="px"
          onChange={(v) => patch('nav_font_size_px', v)}
        />
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Transformación
          </label>
          <select
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
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tipografía
          </label>
          <select
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
          min={12}
          max={48}
          step={2}
          unit="px"
          onChange={(v) => patch('mobile_item_gap_px', v)}
        />
        <SliderField
          label="Tamaño de texto"
          value={local.mobile_font_size_px}
          min={18}
          max={40}
          step={1}
          unit="px"
          onChange={(v) => patch('mobile_font_size_px', v)}
        />
        <SliderField
          label="Separación entre letras"
          value={local.mobile_letter_spacing_em}
          min={0}
          max={0.3}
          step={0.01}
          unit="em"
          onChange={(v) => patch('mobile_letter_spacing_em', v)}
        />
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Tipografía panel
          </label>
          <select
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
                      'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                    backgroundColor: '#eee',
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
                              const next = { ...local, logo_src: url, show_logo: true };
                              setLocal(next);
                              setDirty(true);
                              // Persist height + logo together
                              onSave(next);
                              setDirty(false);
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
          label="Mostrar logo"
          desc="Usar imagen de logo en el header (object-contain, sin recorte)"
          value={local.show_logo}
          onChange={(v) => patch('show_logo', v)}
        />
        <SliderField
          label="Altura del logo"
          value={local.logo_height_px}
          min={16}
          max={96}
          step={1}
          unit="px"
          onChange={(v) => patch('logo_height_px', v)}
        />
        <div className="space-y-1.5 mt-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Línea 1
          </label>
          <input
            type="text"
            value={local.brand_line1}
            onChange={(e) => patch('brand_line1', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Línea 2
          </label>
          <input
            type="text"
            value={local.brand_line2}
            onChange={(e) => patch('brand_line2', e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <SliderField
          label="Tracking marca"
          value={local.brand_letter_spacing_em}
          min={0}
          max={0.6}
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

      {dirty && (
        <div className="sticky bottom-0 pt-2 pb-1 bg-gradient-to-t from-surface-sunken via-surface-sunken to-transparent">
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50 min-h-[48px]"
          >
            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar estilo del menú
          </button>
        </div>
      )}
    </div>
  );
}
