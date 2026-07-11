'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo, type ComponentType } from 'react';
import {
  X,
  Monitor,
  Smartphone,
  Save,
  Loader2,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Palette,
  Image as ImageIcon,
  Search,
  MessageCircle,
  PanelTop,
  Link2,
  Megaphone,
  GalleryHorizontalEnd,
  LayoutTemplate,
  LayoutGrid,
  Package,
  Flag,
  PanelBottom,
  Share2,
  List,
  Scale,
  AppWindow,
  FileText,
  Shield,
  Cookie,
  Truck,
  RotateCcw,
  Ban,
  BadgeCheck,
  Sparkles,
  Layers,
  Wrench,
  GraduationCap,
  Users,
  Images,
  Mail,
  Copyright,
  type LucideProps,
} from 'lucide-react';
import { toast, ImmersiveModal } from '@enjambre/ui';
import { useCMSContent, type CMSSectionKey, type CMSContentItem } from '@/hooks/use-cms-content';
import { getUrlTienda } from '@/lib/publicUrls';
import { MenuStyleEditor } from '@/components/tienda/MenuStyleEditor';
import {
  ChromeSettingsEditor,
  SETTINGS_SECTION_KEYS,
} from '@/components/tienda/StoreChromeEditors';
import { HEADER_NAV_TEMPLATE, HEADER_SETTINGS_TEMPLATE } from '@/lib/header-menu';
import {
  ANNOUNCEMENT_SETTINGS_TEMPLATE,
  ANNOUNCEMENT_SLIDE_TEMPLATE,
  BRAND_ASSETS_TEMPLATE,
  FOOTER_SETTINGS_TEMPLATE,
  FOOTER_SOCIAL_TEMPLATE,
  PWA_NAV_ITEM_TEMPLATE,
  PWA_NAV_SETTINGS_TEMPLATE,
  THEME_SETTINGS_TEMPLATE,
  LANDING_LAYOUT_TEMPLATE,
  CATALOG_SETTINGS_TEMPLATE,
  PDP_SETTINGS_TEMPLATE,
  SEO_DEFAULTS_TEMPLATE,
  CONTACT_SETTINGS_TEMPLATE,
  CAMPAIGN_BANNER_TEMPLATE,
  LEGAL_DOC_TEMPLATE,
} from '@/lib/store-chrome';

// ── Constants ──────────────────────────────────────────────────────────────

type SectionIcon = ComponentType<LucideProps>;

type SectionGroupId =
  | 'apariencia'
  | 'cabecera'
  | 'home'
  | 'tienda'
  | 'pie'
  | 'contenido'
  | 'legal';

const SECTION_GROUPS: { id: SectionGroupId; label: string }[] = [
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'cabecera', label: 'Cabecera' },
  { id: 'home', label: 'Inicio' },
  { id: 'tienda', label: 'Tienda' },
  { id: 'pie', label: 'Pie y app' },
  { id: 'contenido', label: 'Contenido' },
  { id: 'legal', label: 'Legal' },
];

/** Meta estilo theme customizer (Shopify): icono + label + grupo */
const SECTION_META: Record<
  string,
  { label: string; short: string; icon: SectionIcon; group: SectionGroupId; hint?: string }
> = {
  theme_settings: {
    label: 'Tema',
    short: 'Tema',
    icon: Palette,
    group: 'apariencia',
    hint: 'Colores, radio, grain',
  },
  brand_assets: {
    label: 'Marca y logos',
    short: 'Marca',
    icon: ImageIcon,
    group: 'apariencia',
    hint: 'Logo, favicon, OG',
  },
  seo_defaults: {
    label: 'SEO global',
    short: 'SEO',
    icon: Search,
    group: 'apariencia',
    hint: 'Títulos y meta',
  },
  contact_settings: {
    label: 'Contacto / WhatsApp',
    short: 'Contacto',
    icon: MessageCircle,
    group: 'apariencia',
    hint: 'WhatsApp y contacto',
  },
  menu_settings: {
    label: 'Menú — Estilo',
    short: 'Menú',
    icon: PanelTop,
    group: 'cabecera',
    hint: 'Header y logo menú',
  },
  menu_links: {
    label: 'Menú — Enlaces',
    short: 'Enlaces',
    icon: Link2,
    group: 'cabecera',
    hint: 'Items de navegación',
  },
  announcement_settings: {
    label: 'Anuncios — Estilo',
    short: 'Anuncios',
    icon: Megaphone,
    group: 'cabecera',
    hint: 'Barra superior',
  },
  announcement_slides: {
    label: 'Anuncios — Slides',
    short: 'Slides',
    icon: GalleryHorizontalEnd,
    group: 'cabecera',
    hint: 'Mensajes rotativos',
  },
  landing_layout: {
    label: 'Bloques del home',
    short: 'Bloques',
    icon: LayoutTemplate,
    group: 'home',
    hint: 'Orden y visibilidad',
  },
  campaign_banners: {
    label: 'Banners campaña',
    short: 'Banners',
    icon: Flag,
    group: 'home',
    hint: 'Promos y campañas',
  },
  hero: {
    label: 'Hero (CMS)',
    short: 'Hero',
    icon: Sparkles,
    group: 'home',
    hint: 'Contenido hero',
  },
  catalog_settings: {
    label: 'Catálogo',
    short: 'Catálogo',
    icon: LayoutGrid,
    group: 'tienda',
    hint: 'Grilla y filtros',
  },
  pdp_settings: {
    label: 'Ficha producto',
    short: 'PDP',
    icon: Package,
    group: 'tienda',
    hint: 'Página de producto',
  },
  footer_settings: {
    label: 'Footer — Estilo',
    short: 'Footer',
    icon: PanelBottom,
    group: 'pie',
    hint: 'Pie de página',
  },
  footer_social: {
    label: 'Footer — Redes',
    short: 'Redes',
    icon: Share2,
    group: 'pie',
  },
  footer_nav: {
    label: 'Footer — Nav',
    short: 'Nav pie',
    icon: List,
    group: 'pie',
  },
  footer_legal: {
    label: 'Footer — Legal links',
    short: 'Links legal',
    icon: Scale,
    group: 'pie',
  },
  footer_branding: {
    label: 'Footer — Marca (legacy)',
    short: 'Marca pie',
    icon: Copyright,
    group: 'pie',
  },
  pwa_nav_settings: {
    label: 'PWA — Estilo',
    short: 'PWA',
    icon: Smartphone,
    group: 'pie',
    hint: 'Barra inferior móvil',
  },
  pwa_nav_items: {
    label: 'PWA — Pestañas',
    short: 'Tabs',
    icon: AppWindow,
    group: 'pie',
  },
  colecciones: {
    label: 'Colecciones',
    short: 'Colecciones',
    icon: Layers,
    group: 'contenido',
  },
  servicios: {
    label: 'Servicios',
    short: 'Servicios',
    icon: Wrench,
    group: 'contenido',
  },
  talleres: {
    label: 'Talleres',
    short: 'Talleres',
    icon: GraduationCap,
    group: 'contenido',
  },
  nosotros: {
    label: 'Nosotros',
    short: 'Nosotros',
    icon: Users,
    group: 'contenido',
  },
  galeria: {
    label: 'Galería',
    short: 'Galería',
    icon: Images,
    group: 'contenido',
  },
  contacto: {
    label: 'Contacto (página)',
    short: 'Página',
    icon: Mail,
    group: 'contenido',
  },
  legal_terminos: {
    label: 'Términos',
    short: 'Términos',
    icon: FileText,
    group: 'legal',
  },
  legal_privacidad: {
    label: 'Privacidad',
    short: 'Privacidad',
    icon: Shield,
    group: 'legal',
  },
  legal_cookies: {
    label: 'Cookies',
    short: 'Cookies',
    icon: Cookie,
    group: 'legal',
  },
  legal_envio: {
    label: 'Envío',
    short: 'Envío',
    icon: Truck,
    group: 'legal',
  },
  legal_reembolso: {
    label: 'Reembolso',
    short: 'Reembolso',
    icon: RotateCcw,
    group: 'legal',
  },
  legal_cancelacion: {
    label: 'Cancelación',
    short: 'Cancelación',
    icon: Ban,
    group: 'legal',
  },
  legal_garantia: {
    label: 'Garantía',
    short: 'Garantía',
    icon: BadgeCheck,
    group: 'legal',
  },
};

const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_META).map(([k, v]) => [k, v.label]),
);

const SECTION_ORDER = [
  'theme_settings',
  'brand_assets',
  'seo_defaults',
  'contact_settings',
  'menu_settings',
  'menu_links',
  'announcement_settings',
  'announcement_slides',
  'landing_layout',
  'catalog_settings',
  'pdp_settings',
  'campaign_banners',
  'footer_settings',
  'footer_social',
  'footer_nav',
  'footer_legal',
  'pwa_nav_settings',
  'pwa_nav_items',
  'legal_terminos',
  'legal_privacidad',
  'legal_cookies',
  'legal_envio',
  'legal_reembolso',
  'legal_cancelacion',
  'legal_garantia',
  'hero',
  'colecciones',
  'servicios',
  'talleres',
  'nosotros',
  'galeria',
  'contacto',
  'footer_branding',
] as const;

function getSectionMeta(key: string) {
  return (
    SECTION_META[key] ?? {
      label: key,
      short: key,
      icon: LayoutTemplate as SectionIcon,
      group: 'contenido' as SectionGroupId,
    }
  );
}

/**
 * Plantillas JSON iniciales por sección.
 * 'colecciones' incluye 'image' para que EditableItemCard muestre el uploader.
 */
const SECTION_TEMPLATES: Record<string, Record<string, unknown>> = {
  colecciones: { kicker: '', title: '', desc: '', href: '/catalogo', image: '' },
  servicios: { num: '', title: '', desc: '' },
  talleres: { date: '', title: '', desc: '', action: '' },
  footer_nav: { label: '', href: '/' },
  footer_legal: { label: '', href: '/' },
  hero: { title: '', subtitle: '', cta: '' },
  nosotros: { title: '', desc: '', image: '' },
  galeria: { src: '', alt: '' },
  contacto: { title: '', desc: '', email: '' },
  footer_branding: { tagline: '', email: '' },
  menu_settings: { ...HEADER_SETTINGS_TEMPLATE },
  menu_links: { ...HEADER_NAV_TEMPLATE },
  theme_settings: { ...THEME_SETTINGS_TEMPLATE },
  announcement_settings: { ...ANNOUNCEMENT_SETTINGS_TEMPLATE },
  announcement_slides: { ...ANNOUNCEMENT_SLIDE_TEMPLATE },
  footer_settings: { ...FOOTER_SETTINGS_TEMPLATE },
  footer_social: { ...FOOTER_SOCIAL_TEMPLATE },
  pwa_nav_settings: { ...PWA_NAV_SETTINGS_TEMPLATE },
  pwa_nav_items: { ...PWA_NAV_ITEM_TEMPLATE },
  brand_assets: { ...BRAND_ASSETS_TEMPLATE },
  landing_layout: { ...LANDING_LAYOUT_TEMPLATE },
  catalog_settings: { ...CATALOG_SETTINGS_TEMPLATE },
  pdp_settings: { ...PDP_SETTINGS_TEMPLATE },
  seo_defaults: { ...SEO_DEFAULTS_TEMPLATE },
  contact_settings: { ...CONTACT_SETTINGS_TEMPLATE },
  campaign_banners: { ...CAMPAIGN_BANNER_TEMPLATE },
  legal_terminos: { ...LEGAL_DOC_TEMPLATE },
  legal_privacidad: { ...LEGAL_DOC_TEMPLATE },
  legal_cookies: { ...LEGAL_DOC_TEMPLATE },
  legal_envio: { ...LEGAL_DOC_TEMPLATE },
  legal_reembolso: { ...LEGAL_DOC_TEMPLATE },
  legal_cancelacion: { ...LEGAL_DOC_TEMPLATE },
  legal_garantia: { ...LEGAL_DOC_TEMPLATE },
};

const FIELD_LABELS: Record<string, string> = {
  label: 'Texto (ES)',
  label_en: 'Texto (EN)',
  text: 'Mensaje (ES)',
  text_en: 'Mensaje (EN)',
  link_label: 'Texto del link (ES)',
  link_label_en: 'Texto del link (EN)',
  href: 'Ruta / enlace',
  network: 'Red social',
  icon: 'Icono',
  show_desktop: 'Visible en desktop',
  show_mobile: 'Visible en móvil',
  title: 'Título',
  title_en: 'Título (EN)',
  body: 'Cuerpo (HTML/texto)',
  body_en: 'Cuerpo (EN)',
  last_updated: 'Última actualización',
  placement: 'Ubicación (home|catalog|global|cart)',
  starts_at: 'Inicio (YYYY-MM-DD)',
  ends_at: 'Fin (YYYY-MM-DD)',
  cta_label: 'CTA (ES)',
  cta_label_en: 'CTA (EN)',
  desc: 'Descripción',
  kicker: 'Kicker',
  image: 'Imagen',
  src: 'Imagen (URL)',
  alt: 'Texto alternativo',
  email: 'Email',
  tagline: 'Tagline',
  cta: 'CTA',
  subtitle: 'Subtítulo',
  num: 'Número',
  date: 'Fecha',
  action: 'Acción',
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

// ── ContentFieldEditor ─────────────────────────────────────────────────────

function ContentFieldEditor({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  if (typeof value === 'string') {
    if (
      fieldKey.includes('desc') ||
      fieldKey.includes('description') ||
      fieldKey.includes('text') ||
      fieldKey === 'body' ||
      fieldKey === 'body_en' ||
      fieldKey.includes('prefill')
    ) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={fieldKey === 'body' || fieldKey === 'body_en' ? 12 : 3}
          className="w-full bg-surface-sunken border border-border rounded-lg p-3 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono"
        />
      );
    }
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
    );
  }

  if (typeof value === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
    );
  }

  if (typeof value === 'boolean') {
    return (
      <button
        onClick={() => onChange(!value)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          value
            ? 'bg-accent/20 text-accent border border-accent'
            : 'bg-surface-sunken border border-border text-muted-foreground'
        }`}
      >
        {value ? 'Sí' : 'No'}
      </button>
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
    />
  );
}

// ── EditableItemCard ───────────────────────────────────────────────────────

interface EditableItemCardProps {
  item: CMSContentItem;
  activeSection: string;
  onUpdate: (id: string, content: Record<string, unknown>, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onImageUpload: (file: File, fieldName: string, itemId: string) => Promise<string>;
  isUpdating: boolean;
  isDeleting: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function EditableItemCard({
  item,
  activeSection,
  onUpdate,
  onDelete,
  onImageUpload,
  isUpdating,
  isDeleting,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: EditableItemCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [localContent, setLocalContent] = useState<Record<string, unknown>>(item.content);
  const [localActive, setLocalActive] = useState(item.is_active);
  const [dirty, setDirty] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetField, setUploadTargetField] = useState<string>('');

  useEffect(() => {
    setLocalContent(item.content);
    setLocalActive(item.is_active);
    setDirty(false);
    setUploadingField(null);
  }, [item]);

  const handleFieldChange = useCallback((key: string, val: unknown) => {
    setLocalContent((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  }, []);

  const handleSave = () => {
    onUpdate(item.id, localContent, localActive);
  };

  const handleToggleActive = () => {
    setLocalActive(!localActive);
    setDirty(true);
  };

  const handleImageClick = (fieldName: string) => {
    setUploadTargetField(fieldName);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetField) return;
    const field = uploadTargetField;
    setUploadingField(field);
    void onImageUpload(file, field, item.id)
      .then((url) => {
        if (!url) return;
        // Editor dueño del save: merge snapshot local + persist content completo
        setLocalContent((prev) => {
          const next = { ...prev, [field]: url };
          onUpdate(item.id, next, localActive);
          return next;
        });
        setDirty(false);
      })
      .finally(() => setUploadingField(null));
    e.target.value = '';
  };

  const titleField = localContent.title ?? localContent.label ?? localContent.kicker ?? null;

  const isImageField = (key: string) =>
    key.toLowerCase().includes('image') ||
    key.toLowerCase().includes('img') ||
    key.toLowerCase().includes('foto') ||
    key.toLowerCase().includes('icon') ||
    key.toLowerCase().includes('src');

  return (
    <div className={`bg-surface rounded-xl border border-border overflow-hidden transition-all ${!localActive ? 'opacity-60' : ''}`}>
      {/* Card Header — always visible, touch-friendly */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-surface-raised/50 active:bg-surface-raised transition-colors select-none min-h-[52px]"
        onClick={() => setExpanded(!expanded)}
      >
        <GripVertical size={15} className="text-muted-foreground shrink-0" />
        <ChevronDown
          size={15}
          className={`text-muted-foreground shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {titleField ? String(titleField) : `Item #${item.item_order + 1}`}
        </span>

        {/* Controls always visible on mobile */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Mover arriba"
            >
              <ArrowUp size={14} />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Mover abajo"
            >
              <ArrowDown size={14} />
            </button>
          )}
          <button
            onClick={handleToggleActive}
            className={`p-2 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center ${
              localActive ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-surface-raised'
            }`}
            title={localActive ? 'Ocultar en tienda' : 'Mostrar en tienda'}
          >
            {localActive ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Eliminar"
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-4 space-y-4 border-t border-border pt-3 bg-surface-sunken">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {Object.entries(localContent).map(([key, val]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {fieldLabel(key)}
              </label>
              {isImageField(key) ? (
                <div className="space-y-2">
                  {val && typeof val === 'string' && val.startsWith('http') ? (
                    <img
                      src={val}
                      alt={key}
                      className="w-full h-32 object-cover rounded-lg border border-border bg-background"
                    />
                  ) : null}
                  <button
                    onClick={() => handleImageClick(key)}
                    disabled={uploadingField === key}
                    className="flex w-full justify-center items-center gap-2 px-3 py-3 rounded-lg text-xs font-medium bg-background border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {uploadingField === key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {val && typeof val === 'string' && val.startsWith('http')
                      ? 'Cambiar imagen'
                      : 'Subir imagen'}
                  </button>
                </div>
              ) : key === 'href' || key === 'action' ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <ContentFieldEditor fieldKey={key} value={val} onChange={(v) => handleFieldChange(key, v)} />
                  </div>
                  {typeof val === 'string' && val.startsWith('/') && (
                    <a
                      href={`${getUrlTienda()}${val}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-border hover:border-accent/50 text-muted-foreground hover:text-accent transition-colors bg-background flex items-center justify-center min-w-[40px]"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ) : (
                <ContentFieldEditor fieldKey={key} value={val} onChange={(v) => handleFieldChange(key, v)} />
              )}
            </div>
          ))}

          {/* Save button — sticky feel, always visible if dirty */}
          {dirty && (
            <div className="pt-3 border-t border-border">
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50 min-h-[44px]"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Guardar cambios
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SectionNav — lista con iconos estilo Shopify theme editor ──────────────

interface SectionNavProps {
  sectionKeys: string[];
  activeSection: string;
  onSelect: (key: string) => void;
  itemCounts?: Record<string, number>;
}

function SectionNav({ sectionKeys, activeSection, onSelect, itemCounts = {} }: SectionNavProps) {
  const keySet = useMemo(() => new Set(sectionKeys), [sectionKeys]);

  const grouped = useMemo(() => {
    return SECTION_GROUPS.map((g) => ({
      ...g,
      keys: SECTION_ORDER.filter((k) => keySet.has(k) && getSectionMeta(k).group === g.id),
    })).filter((g) => g.keys.length > 0);
  }, [keySet]);

  // Secciones desconocidas (no en meta/order) al final
  const orphanKeys = useMemo(
    () => sectionKeys.filter((k) => !SECTION_ORDER.includes(k as (typeof SECTION_ORDER)[number])),
    [sectionKeys],
  );

  return (
    <div className="space-y-3">
      {/* Mobile: chips con icono (Shopify-like) */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {sectionKeys.map((key) => {
          const meta = getSectionMeta(key);
          const Icon = meta.icon;
          const active = activeSection === key;
          const count = itemCounts[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`shrink-0 flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                active
                  ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-accent/40'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md ${
                  active ? 'bg-accent-foreground/15' : 'bg-surface-raised'
                }`}
              >
                <Icon size={12} strokeWidth={2} />
              </span>
              {meta.short}
              {count > 0 && !SETTINGS_SECTION_KEYS.has(key) ? (
                <span
                  className={`text-[10px] tabular-nums ${
                    active ? 'text-accent-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Desktop: lista agrupada con iconos (theme customizer) */}
      <div className="hidden md:block max-h-[min(42vh,360px)] overflow-y-auto -mx-1 px-1 space-y-3 scrollbar-thin">
        {grouped.map((group) => (
          <div key={group.id}>
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.keys.map((key) => {
                const meta = getSectionMeta(key);
                const Icon = meta.icon;
                const active = activeSection === key;
                const count = itemCounts[key] ?? 0;
                const inhabited = count > 0;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelect(key)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all group ${
                      active
                        ? 'bg-accent/15 text-foreground ring-1 ring-accent/30 shadow-sm'
                        : 'text-muted-foreground hover:bg-background hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        active
                          ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                          : inhabited
                            ? 'bg-background border-border text-foreground group-hover:border-accent/40'
                            : 'bg-surface-raised border-border/60 text-muted-foreground'
                      }`}
                    >
                      <Icon size={15} strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-tight truncate">
                        {meta.label}
                      </span>
                      {meta.hint ? (
                        <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
                          {meta.hint}
                        </span>
                      ) : null}
                    </span>
                    {count > 0 ? (
                      <span
                        className={`shrink-0 text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-md ${
                          active
                            ? 'bg-accent/20 text-accent'
                            : 'bg-surface-raised text-muted-foreground'
                        }`}
                        title={
                          SETTINGS_SECTION_KEYS.has(key)
                            ? 'Configurado'
                            : `${count} elemento${count === 1 ? '' : 's'}`
                        }
                      >
                        {SETTINGS_SECTION_KEYS.has(key) ? '●' : count}
                      </span>
                    ) : (
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-border" title="Vacío" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {orphanKeys.length > 0 ? (
          <div>
            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Otras
            </p>
            <div className="space-y-0.5">
              {orphanKeys.map((key) => {
                const meta = getSectionMeta(key);
                const Icon = meta.icon;
                const active = activeSection === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelect(key)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-all ${
                      active
                        ? 'bg-accent/15 text-foreground ring-1 ring-accent/30'
                        : 'text-muted-foreground hover:bg-background hover:text-foreground'
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                      <Icon size={15} />
                    </span>
                    <span className="text-[13px] font-medium truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── MenuSettingsEditor — wrapper del constructor visual profundo ───────────

interface MenuSettingsEditorProps {
  item: CMSContentItem;
  onUpdate: (id: string, content: Record<string, unknown>, isActive: boolean) => void;
  isUpdating: boolean;
  onImageUpload: (file: File, fieldName: string, itemId: string) => Promise<string>;
}

function MenuSettingsEditor({ item, onUpdate, isUpdating, onImageUpload }: MenuSettingsEditorProps) {
  return (
    <MenuStyleEditor
      content={item.content}
      isUpdating={isUpdating}
      onSave={(content) => onUpdate(item.id, content, item.is_active)}
      onImageUpload={(file, fieldName) => onImageUpload(file, fieldName, item.id)}
    />
  );
}

// ── ItemsPanel ─────────────────────────────────────────────────────────────

interface ItemsPanelProps {
  items: CMSContentItem[];
  activeSection: string;
  onUpdate: (id: string, content: Record<string, unknown>, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onImageUpload: (file: File, fieldName: string, itemId: string) => Promise<string>;
  onAddNew: () => void;
  onReorder?: (items: CMSContentItem[]) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function ItemsPanel({
  items,
  activeSection,
  onUpdate,
  onDelete,
  onImageUpload,
  onAddNew,
  onReorder,
  isUpdating,
  isDeleting,
}: ItemsPanelProps) {
  const handleMoveUp = (index: number) => {
    if (index === 0 || !onReorder) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    onReorder(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1 || !onReorder) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    onReorder(newItems);
  };

  const isSettingsSection = SETTINGS_SECTION_KEYS.has(activeSection);
  const sectionMeta = getSectionMeta(activeSection);
  const SectionIcon = sectionMeta.icon;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-accent shadow-sm">
            <SectionIcon size={16} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground leading-tight truncate">
              {sectionMeta.label}
            </h3>
            {sectionMeta.hint ? (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sectionMeta.hint}</p>
            ) : null}
          </div>
        </div>
        {!isSettingsSection && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-xs font-medium min-h-[36px] shrink-0"
          >
            <Plus size={14} />
            Añadir
          </button>
        )}
      </div>

      <div className="space-y-3 pb-8">
        {isSettingsSection ? (
          items.length > 0 ? (
            activeSection === 'menu_settings' ? (
              <MenuSettingsEditor
                item={items[0]}
                onUpdate={onUpdate}
                isUpdating={isUpdating}
                onImageUpload={onImageUpload}
              />
            ) : (
              <ChromeSettingsEditor
                sectionKey={activeSection}
                content={items[0].content}
                isUpdating={isUpdating}
                onSave={(content) => onUpdate(items[0].id, content, items[0].is_active)}
                onImageUpload={(file, fieldName) => onImageUpload(file, fieldName, items[0].id)}
              />
            )
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl">
              <p className="text-sm text-muted-foreground mb-3">
                Configuración no inicializada.
              </p>
              <button
                onClick={onAddNew}
                className="text-accent text-sm font-medium hover:underline"
              >
                Inicializar sección
              </button>
            </div>
          )
        ) : (
          <>
            {items.map((item, index) => (
              <EditableItemCard
                key={item.id}
                item={item}
                activeSection={activeSection}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onImageUpload={onImageUpload}
                isUpdating={isUpdating}
                isDeleting={isDeleting}
                onMoveUp={onReorder ? () => handleMoveUp(index) : undefined}
                onMoveDown={onReorder ? () => handleMoveDown(index) : undefined}
                isFirst={index === 0}
                isLast={index === items.length - 1}
              />
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl">
                <p className="text-sm text-muted-foreground mb-3">
                  Sin elementos en esta sección.
                </p>
                <button
                  onClick={onAddNew}
                  className="text-accent text-sm font-medium hover:underline"
                >
                  Añadir el primero
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── EditorTiendaView (main) ────────────────────────────────────────────────

export function EditorTiendaView() {
  const cms = useCMSContent();
  const [activeSection, setActiveSection] = useState<string>('menu_settings');
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [showNewForm, setShowNewForm] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Derive default JSON from section template
  const defaultTemplate = SECTION_TEMPLATES[activeSection] ?? { title: '', desc: '' };
  const [newContent, setNewContent] = useState<Record<string, unknown>>(defaultTemplate);

  // Update template when section changes
  useEffect(() => {
    const template = SECTION_TEMPLATES[activeSection] ?? { title: '', desc: '' };
    setNewContent(template);
  }, [activeSection]);

  const groupedData = cms.data?.data ?? {};
  const sectionKeys = (() => {
    const fromApi = new Set<string>([
      ...cms.sections,
      ...Object.keys(groupedData),
    ]);
    const ordered = SECTION_ORDER.filter((k) => fromApi.has(k));
    const rest = [...fromApi].filter((k) => !SECTION_ORDER.includes(k as (typeof SECTION_ORDER)[number])).sort();
    return [...ordered, ...rest];
  })();

  const currentItems = groupedData[activeSection] ?? [];

  const refreshIframe = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'CMS_UPDATE' }, '*');
    } else {
      setIframeKey((prev) => prev + 1);
    }
  };

  const handleUpdateItem = (id: string, content: Record<string, unknown>, isActive: boolean) => {
    cms.updateItem.mutate(
      { id, content, is_active: isActive },
      {
        onSuccess: () => {
          toast('Contenido guardado', { type: 'success' });
          refreshIframe();
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  const handleDeleteItem = (id: string) => {
    cms.deleteItem.mutate(id, {
      onSuccess: () => {
        toast('Item eliminado', { type: 'success' });
        refreshIframe();
      },
      onError: (err) => toast(err.message, { type: 'error' }),
    });
  };

  /**
   * Opción A: solo sube a Storage y devuelve URL pública.
   * El editor dueño del content hace onSave/update con el snapshot completo
   * (evita race que pisa logo_height_px y otros campos dirty).
   */
  const handleImageUpload = async (
    file: File,
    fieldName: string,
    _itemId: string,
  ): Promise<string> => {
    const sectionKey = activeSection as CMSSectionKey;
    try {
      const result = await cms.uploadImage.mutateAsync({ file, sectionKey, fieldName });
      if (!result.publicUrl) {
        throw new Error('No se obtuvo URL pública de la imagen');
      }
      return result.publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir imagen';
      toast(message, { type: 'error' });
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleCreateItem = () => {
    try {
      cms.createItem.mutate(
        { section_key: activeSection as CMSSectionKey, content: newContent },
        {
          onSuccess: () => {
            toast('Elemento añadido', { type: 'success' });
            setShowNewForm(false);
            refreshIframe();
          },
          onError: (err) => toast(err.message, { type: 'error' }),
        },
      );
    } catch {
      toast('Error al crear elemento', { type: 'error' });
    }
  };

  const handleReorder = (newItems: typeof currentItems) => {
    const payload = newItems.map((item, idx) => ({
      id: item.id,
      item_order: idx + 1,
    }));
    cms.reorderItems.mutate(payload, {
      onSuccess: () => {
        toast('Orden actualizado', { type: 'success' });
        refreshIframe();
      },
      onError: (err) => toast(err.message, { type: 'error' }),
    });
  };

  const tiendaUrl = getUrlTienda();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-120px)] -mt-2 mb-4 mx-0 lg:-mx-4 bg-background border border-border rounded-xl overflow-hidden shadow-lg relative z-10 animate-in fade-in zoom-in-95 duration-300">
      {/* ── Top bar ── */}
      <div className="h-14 border-b border-border bg-surface flex items-center justify-between px-4 shrink-0 shadow-sm z-10 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-medium text-base text-foreground truncate">
            Editor de Tienda
          </span>
          {cms.isLoading && <Loader2 size={14} className="animate-spin text-accent shrink-0" />}
        </div>

        {/* Desktop: view mode toggle */}
        <div className="hidden md:flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'desktop' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista Escritorio"
          >
            <Monitor size={15} />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'mobile' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista Móvil"
          >
            <Smartphone size={15} />
          </button>
        </div>

        {/* Mobile: tabs toggle */}
        <div className="md:hidden flex bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setMobileTab('editor')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mobileTab === 'editor' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mobileTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Vista Previa
          </button>
        </div>

        {/* Desktop: live site link */}
        <div className="hidden md:flex items-center gap-3">
          {tiendaUrl && (
            <a
              href={tiendaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              Ver en vivo <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left sidebar / Editor area */}
        <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-[26rem] shrink-0 border-r border-border bg-surface-sunken flex-col overflow-hidden`}>
          {/* Section selector — bloques con iconos */}
          <div className="p-3 md:p-3 border-b border-border bg-surface shrink-0">
            <div className="hidden md:flex items-center justify-between px-1 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Bloques de la tienda
              </p>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {sectionKeys.length}
              </span>
            </div>
            <SectionNav
              sectionKeys={sectionKeys}
              activeSection={activeSection}
              onSelect={setActiveSection}
              itemCounts={Object.fromEntries(
                sectionKeys.map((k) => [k, (groupedData[k] ?? []).length]),
              )}
            />
          </div>

          {/* Items list */}
          <ItemsPanel
            items={currentItems}
            activeSection={activeSection}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onImageUpload={handleImageUpload}
            onAddNew={() => setShowNewForm(true)}
            onReorder={handleReorder}
            isUpdating={cms.updateItem.isPending}
            isDeleting={cms.deleteItem.isPending}
          />
        </div>

        {/* Right: iframe preview */}
        <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 bg-secondary/30 relative flex-col items-center overflow-hidden`}>
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="flex-1 w-full flex items-center justify-center p-0 md:p-4 lg:p-8 overflow-hidden">
            <div
              className={`relative bg-background border-0 md:border md:border-border shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                viewMode === 'mobile'
                  ? 'w-full h-full md:w-[375px] md:h-[812px] md:rounded-[3rem] md:ring-8 md:ring-surface-raised md:ring-offset-2 md:ring-offset-background'
                  : 'w-full h-full md:rounded-xl'
              }`}
            >
              {viewMode === 'mobile' && (
                <div className="hidden md:flex absolute top-0 inset-x-0 h-6 bg-surface-raised z-20 justify-center items-center rounded-t-[3rem]">
                  <div className="w-16 h-1.5 bg-border rounded-full" />
                </div>
              )}

              {!tiendaUrl ? (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken">
                  <div className="text-center space-y-2">
                    <Monitor size={48} className="mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">
                      URL de Tienda no configurada
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Verifica NEXT_PUBLIC_URL_TIENDA en .env
                    </p>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  key={iframeKey}
                  src={tiendaUrl}
                  title="Vista Previa de Tienda"
                  className={`w-full h-full border-none bg-background ${viewMode === 'mobile' ? 'md:pt-6' : ''}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add new item modal ── */}
      <ImmersiveModal
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        eyebrow={SECTION_LABELS[activeSection] ?? activeSection}
        title="Añadir elemento"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="btn btn-outline btn-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateItem}
              disabled={cms.createItem.isPending}
              className="btn btn-primary btn-sm"
            >
              {cms.createItem.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Crear'}
            </button>
          </>
        }
      >
        <p className="text-xs text-muted-foreground mb-3">
          Completa los campos a continuación para añadir un nuevo elemento. Los campos con <code className="text-accent">image</code> o <code className="text-accent">src</code> permitirán subir fotos luego.
        </p>
        <div className="space-y-4">
          {Object.entries(newContent).map(([key, val]) => (
            <div key={key} className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {fieldLabel(key)}
              </label>
              <ContentFieldEditor
                fieldKey={key}
                value={val}
                onChange={(v) => setNewContent((prev) => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </ImmersiveModal>
    </div>
  );
}
