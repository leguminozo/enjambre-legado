'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Smartphone,
  Loader2,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Blocks,
  SlidersHorizontal,
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
  AppWindow,
  FileText,
  Shield,
  Cookie,
  Truck,
  RotateCcw,
  Ban,
  BadgeCheck,
  Layers,
  GraduationCap,
  Users,
  Images,
  Mail,
  Type,
  Sun,
  Leaf,
  PlayCircle,
  MapPin,
  AlertTriangle,
  Microscope,
  Send,
  type LucideProps,
} from 'lucide-react';
import { toast, ImmersiveModal, PanelFocusToggle, type PanelFocus } from '@enjambre/ui';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DraggableProvidedDragHandleProps,
} from '@hello-pangea/dnd';
import { useCMSContent, type CMSSectionKey, type CMSContentItem } from '@/hooks/use-cms-content';
import { supabase } from '@/lib/supabase';
import { ImageLibraryModal } from '@/components/tienda/ImageLibraryModal';
import {
  EditorSaveStatusProvider,
  useEditorSaveAggregate,
  useAutosaveEditor,
  EditorSaveStatusChip,
} from '@/components/tienda/save-status';
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
  TYPOGRAPHY_SETTINGS_TEMPLATE,
  SEASONAL_SETTINGS_TEMPLATE,
  CONSERVATION_CONTENT_TEMPLATE,
  HOME_MEDIA_ITEM_TEMPLATE,
  VIDEO_SETTINGS_TEMPLATE,
  MAP_SETTINGS_TEMPLATE,
  PRODUCTS_SETTINGS_TEMPLATE,
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

// ── Segmentación del editor: categorías → lista → herramienta ──────────────

type EditorCategoryId = 'bloques' | 'diseno' | 'otras';

const EDITOR_CATEGORIES: {
  id: EditorCategoryId;
  label: string;
  desc: string;
  icon: SectionIcon;
}[] = [
  {
    id: 'bloques',
    label: 'Bloques',
    desc: 'Contenido visible en la tienda: home, colecciones, páginas',
    icon: Blocks,
  },
  {
    id: 'diseno',
    label: 'Diseño',
    desc: 'Tema, tipografía, marca, menú, banners y pie',
    icon: Palette,
  },
  {
    id: 'otras',
    label: 'Otras formas',
    desc: 'SEO, temporada, contacto y legales',
    icon: SlidersHorizontal,
  },
];

/** Cada sección en UNA sola categoría (sin duplicados). Fallback: 'otras'. */
const SECTION_CATEGORY: Record<string, EditorCategoryId> = {
  // Bloques — contenido visible
  conservation_content: 'bloques',
  media_items: 'bloques',
  video_settings: 'bloques',
  map_settings: 'bloques',
  products_settings: 'bloques',
  landing_layout: 'bloques',
  colecciones: 'bloques',
  servicios: 'bloques',
  talleres: 'bloques',
  nosotros: 'bloques',
  galeria: 'bloques',
  contacto: 'bloques',
  ciencia: 'bloques',
  // Diseño — apariencia y chrome
  theme_settings: 'diseno',
  typography_settings: 'diseno',
  brand_assets: 'diseno',
  menu_settings: 'diseno',
  menu_links: 'diseno',
  announcement_settings: 'diseno',
  announcement_slides: 'diseno',
  campaign_banners: 'diseno',
  footer_settings: 'diseno',
  footer_social: 'diseno',
  pwa_nav_settings: 'diseno',
  pwa_nav_items: 'diseno',
  catalog_settings: 'diseno',
  pdp_settings: 'diseno',
  // Otras formas — config, temporada y legales
  seo_defaults: 'otras',
  contact_settings: 'otras',
  seasonal_settings: 'otras',
  legal_terminos: 'otras',
  legal_privacidad: 'otras',
  legal_cookies: 'otras',
  legal_envio: 'otras',
  legal_reembolso: 'otras',
  legal_cancelacion: 'otras',
  legal_garantia: 'otras',
};

function sectionCategory(key: string): EditorCategoryId {
  return SECTION_CATEGORY[key] ?? 'otras';
}

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
  typography_settings: {
    label: 'Tipografía',
    short: 'Tipografía',
    icon: Type,
    group: 'apariencia',
    hint: 'Fuentes display y texto',
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
  seasonal_settings: {
    label: 'Temporada',
    short: 'Temporada',
    icon: Sun,
    group: 'home',
    hint: 'Mensaje y floraciones',
  },
  conservation_content: {
    label: 'Impacto — Contenido',
    short: 'Impacto',
    icon: Leaf,
    group: 'home',
    hint: 'Copy y métricas conservación',
  },
  media_items: {
    label: 'Carrusel media — Items',
    short: 'Media',
    icon: GalleryHorizontalEnd,
    group: 'home',
    hint: 'Imágenes / videos del carrusel',
  },
  video_settings: {
    label: 'Video central',
    short: 'Video',
    icon: PlayCircle,
    group: 'home',
    hint: 'ID de YouTube del video',
  },
  map_settings: {
    label: 'Mapa / Lugar',
    short: 'Mapa',
    icon: MapPin,
    group: 'home',
    hint: 'Coordenadas y popup del origen',
  },
  products_settings: {
    label: 'Creaciones — Cabecera',
    short: 'Creaciones',
    icon: Package,
    group: 'home',
    hint: 'Título y descripción de la sección',
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
  ciencia: {
    label: 'Ciencia — Evidencia',
    short: 'Ciencia',
    icon: Microscope,
    group: 'contenido',
    hint: 'Bloques de evidencia científica',
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
  'typography_settings',
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
  'seasonal_settings',
  'conservation_content',
  'media_items',
  'video_settings',
  'map_settings',
  'products_settings',
  'footer_settings',
  'footer_social',
  'pwa_nav_settings',
  'pwa_nav_items',
  'legal_terminos',
  'legal_privacidad',
  'legal_cookies',
  'legal_envio',
  'legal_reembolso',
  'legal_cancelacion',
  'legal_garantia',
  'colecciones',
  'talleres',
  'nosotros',
  'galeria',
  'contacto',
  'ciencia',
] as const;

/**
 * No listar en editor ni crear: la tienda no los consume (hero=i18n,
 * pie=StoreChrome, servicios=sin página). Las filas legacy de la tabla
 * site_content se conservan (no se borran por diseño): son inofensivas y
 * eliminarlas requeriría una migración de datos.
 */
const RETIRED_CMS_SECTIONS = new Set([
  'hero',
  'servicios',
  'footer_branding',
  'footer_nav',
  'footer_legal',
]);

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
  talleres: { date: '', title: '', desc: '', action: '' },
  nosotros: {
    title: '',
    desc: '',
    image: '',
    historia: '',
    mision: '',
    vision: '',
    stat1_label: '',
    stat1_value: '',
    stat2_label: '',
    stat2_value: '',
    stat3_label: '',
    stat3_value: '',
    stat4_label: '',
    stat4_value: '',
  },
  galeria: { titulo: '', descripcion: '', url: '' },
  contacto: { title: '', desc: '' },
  ciencia: { categoria: '', titulo: '', texto: '', fuente: '' },
  menu_settings: { ...HEADER_SETTINGS_TEMPLATE },
  menu_links: { ...HEADER_NAV_TEMPLATE },
  theme_settings: { ...THEME_SETTINGS_TEMPLATE },
  typography_settings: { ...TYPOGRAPHY_SETTINGS_TEMPLATE },
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
  seasonal_settings: { ...SEASONAL_SETTINGS_TEMPLATE },
  conservation_content: { ...CONSERVATION_CONTENT_TEMPLATE },
  media_items: { ...HOME_MEDIA_ITEM_TEMPLATE },
  video_settings: { ...VIDEO_SETTINGS_TEMPLATE },
  map_settings: { ...MAP_SETTINGS_TEMPLATE },
  products_settings: { ...PRODUCTS_SETTINGS_TEMPLATE },
  legal_terminos: { ...LEGAL_DOC_TEMPLATE },
  legal_privacidad: { ...LEGAL_DOC_TEMPLATE },
  legal_cookies: { ...LEGAL_DOC_TEMPLATE },
  legal_envio: { ...LEGAL_DOC_TEMPLATE },
  legal_reembolso: { ...LEGAL_DOC_TEMPLATE },
  legal_cancelacion: { ...LEGAL_DOC_TEMPLATE },
  legal_garantia: { ...LEGAL_DOC_TEMPLATE },
};

/**
 * Ruta de la tienda que previsualiza cada sección del editor.
 * Las que no figuran apuntan al home (cambios globales del layout).
 */
const SECTION_PREVIEW_PATHS: Record<string, string> = {
  catalog_settings: '/catalogo',
  pdp_settings: '/catalogo',
  legal_terminos: '/terminos',
  legal_privacidad: '/privacidad',
  legal_cookies: '/cookies',
  legal_envio: '/envio',
  legal_reembolso: '/reembolso',
  legal_cancelacion: '/cancelacion',
  legal_garantia: '/garantia',
  nosotros: '/nosotros',
  galeria: '/galeria',
  contacto: '/contacto',
  talleres: '/experiencias',
};

/** Menú independiente del preview: páginas navegables sin tocar la selección
 *  del editor. Los bloques del home viven en Inicio (no hay ancla cross-origin). */
const PREVIEW_DESTINATIONS: { path: string; label: string }[] = [
  { path: '', label: 'Inicio' },
  { path: '/catalogo', label: 'Catálogo' },
  { path: '/experiencias', label: 'Experiencias' },
  { path: '/nosotros', label: 'Nosotros' },
  { path: '/galeria', label: 'Galería' },
  { path: '/contacto', label: 'Contacto' },
  { path: '/carrito', label: 'Carrito' },
  { path: '/checkout', label: 'Checkout' },
  { path: '/perfil', label: 'Perfil' },
  { path: '/terminos', label: 'Términos' },
  { path: '/privacidad', label: 'Privacidad' },
  { path: '/cookies', label: 'Cookies' },
  { path: '/envio', label: 'Envío' },
  { path: '/reembolso', label: 'Reembolso' },
  { path: '/cancelacion', label: 'Cancelación' },
  { path: '/garantia', label: 'Garantía' },
];

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
  desc_en: 'Descripción (EN)',
  descripcion: 'Descripción',
  titulo: 'Título',
  url: 'Imagen',
  historia: 'Historia',
  mision: 'Misión',
  vision: 'Visión',
  categoria: 'Categoría',
  texto: 'Texto',
  fuente: 'Fuente',
  stat1_value: 'Stat 1 — Valor',
  stat2_value: 'Stat 2 — Valor',
  stat3_value: 'Stat 3 — Valor',
  stat4_value: 'Stat 4 — Valor',
  kicker: 'Kicker',
  kicker_en: 'Kicker (EN)',
  image: 'Imagen',
  src: 'Imagen',
  alt: 'Texto alternativo',
  email: 'Email',
  tagline: 'Tagline',
  cta: 'CTA',
  subtitle: 'Subtítulo',
  num: 'Número',
  date: 'Fecha',
  action: 'Acción',
  type: 'Tipo (image|video)',
  youtube_id: 'ID de YouTube',
  lat: 'Latitud',
  lng: 'Longitud',
  popup_title: 'Popup — Título',
  popup_body: 'Popup — Texto',
  tri_label: 'Triangulación — Título',
  tri_label_en: 'Triangulación — Título (EN)',
  stat1_label: 'Métrica 1 — Etiqueta',
  stat1_label_en: 'Métrica 1 — Etiqueta (EN)',
  stat2_label: 'Métrica 2 — Etiqueta',
  stat2_label_en: 'Métrica 2 — Etiqueta (EN)',
  stat3_label: 'Métrica 3 — Etiqueta',
  stat3_label_en: 'Métrica 3 — Etiqueta (EN)',
  stat4_label: 'Métrica 4 — Etiqueta',
  stat4_label_en: 'Métrica 4 — Etiqueta (EN)',
  tri1_label: 'Bloque 1 — Título',
  tri1_label_en: 'Bloque 1 — Título (EN)',
  tri1_desc: 'Bloque 1 — Texto',
  tri1_desc_en: 'Bloque 1 — Texto (EN)',
  tri2_label: 'Bloque 2 — Título',
  tri2_label_en: 'Bloque 2 — Título (EN)',
  tri2_desc: 'Bloque 2 — Texto',
  tri2_desc_en: 'Bloque 2 — Texto (EN)',
  tri3_label: 'Bloque 3 — Título',
  tri3_label_en: 'Bloque 3 — Título (EN)',
  tri3_desc: 'Bloque 3 — Texto',
  tri3_desc_en: 'Bloque 3 — Texto (EN)',
  irr_label: 'IRR — Título sección',
  irr_label_en: 'IRR — Título sección (EN)',
  irr_pos_title: 'IRR positivo — Título',
  irr_pos_title_en: 'IRR positivo — Título (EN)',
  irr_pos_desc: 'IRR positivo — Texto',
  irr_pos_desc_en: 'IRR positivo — Texto (EN)',
  irr_neg_title: 'IRR negativo — Título',
  irr_neg_title_en: 'IRR negativo — Título (EN)',
  irr_neg_desc: 'IRR negativo — Texto',
  irr_neg_desc_en: 'IRR negativo — Texto (EN)',
};

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

/** Campos de imagen por sección cuyo nombre no matchea el heurístico global
 *  (p.ej. galería guarda la imagen en `url`, como lee la página de tienda). */
const SECTION_IMAGE_FIELDS: Record<string, string[]> = {
  galeria: ['url'],
};

/** Campos que se suben como archivo (nunca URL manual) — cards y modal. */
function isImageField(key: string, sectionKey?: string): boolean {
  if (sectionKey && SECTION_IMAGE_FIELDS[sectionKey]?.includes(key)) return true;
  return (
    key.toLowerCase().includes('image') ||
    key.toLowerCase().includes('img') ||
    key.toLowerCase().includes('foto') ||
    key.toLowerCase().includes('icon') ||
    key.toLowerCase().includes('src')
  );
}

// ── ContentFieldEditor ─────────────────────────────────────────────────────

function ContentFieldEditor({
  fieldKey,
  value,
  onChange,
  fieldId,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (val: unknown) => void;
  fieldId?: string;
}) {
  // Enums conocidos: select en vez de texto libre (media_items.type).
  // Un typo ("Image") caía silenciosamente al fallback del parser.
  if (fieldKey === 'type' && typeof value === 'string') {
    return (
      <select
        id={fieldId}
        name={fieldId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="image">Imagen</option>
        <option value="video">Video</option>
      </select>
    );
  }

  if (typeof value === 'string') {
    if (
      fieldKey.includes('desc') ||
      fieldKey.includes('description') ||
      fieldKey.includes('text') ||
      fieldKey === 'body' ||
      fieldKey === 'body_en' ||
      fieldKey.includes('prefill') ||
      fieldKey.includes('historia') ||
      fieldKey.includes('mision') ||
      fieldKey.includes('vision')
    ) {
      return (
        <textarea
          id={fieldId}
          name={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={fieldKey === 'body' || fieldKey === 'body_en' ? 12 : 6}
          className="w-full bg-surface-sunken border border-border rounded-lg p-3 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono"
        />
      );
    }
    return (
      <input
        id={fieldId}
        name={fieldId}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
      />
    );
  }

  if (typeof value === 'number') {
    return (
      <input
        id={fieldId}
        name={fieldId}
        type="number"
        autoComplete="off"
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
      id={fieldId}
      name={fieldId}
      type="text"
      autoComplete="off"
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
  onUpdate: (
    id: string,
    content: Record<string, unknown>,
    isActive: boolean,
  ) => Promise<unknown> | void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onDiscard: (id: string) => void;
  onImageUpload: (file: File, fieldName: string, itemId: string) => Promise<string>;
  isDeleting: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  /**
   * Campos default de la sección (SECTION_TEMPLATES). Los items creados antes
   * de que exista un campo (p.ej. colecciones sin `image`) no lo traen en su
   * content; se completan aquí para que el uploader aparezca igualmente.
   */
  template?: Record<string, unknown>;
}

function EditableItemCard({
  item,
  activeSection,
  onUpdate,
  onDelete,
  onPublish,
  onDiscard,
  onImageUpload,
  isDeleting,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  dragHandleProps,
  template,
}: EditableItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [localContent, setLocalContent] = useState<Record<string, unknown>>(item.content);
  const [localActive, setLocalActive] = useState(item.is_active);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetField, setUploadTargetField] = useState<string>('');
  // Borrado seguro: primer clic arma, segundo confirma (resetea en 3s)
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);

  const requestDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = window.setTimeout(() => setConfirmingDelete(false), 3000);
      return;
    }
    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    setConfirmingDelete(false);
    onDelete(item.id);
  };

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

  // Autosave por card: payload = content + active (toggle se guarda solo)
  const { isDirty, flush } = useAutosaveEditor(
    `card-${item.id}`,
    { content: localContent, active: localActive },
    (payload) => onUpdate(item.id, payload.content, payload.active),
  );

  // Solo re-sync cuando ESTE item cambia en servidor y no hay pendientes.
  // Dependencia en `item` entero reseteaba dirty de hermanas al invalidar la
  // query tras un save; el gate isDirty evita clobber de tecleo en el vuelo.
  const serverContentKey = JSON.stringify(item.content);
  useEffect(() => {
    if (isDirty) return;
    setLocalContent(item.content);
    setLocalActive(item.is_active);
    setUploadingField(null);
    // item.content / is_active leídos intencionalmente al cambiar las claves estables
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serverContentKey serializa content
  }, [item.id, item.updated_at, item.is_active, serverContentKey, isDirty]);

  const handleFieldChange = useCallback((key: string, val: unknown) => {
    setLocalContent((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleToggleActive = () => {
    setLocalActive(!localActive);
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
        // Upload = URL; editor dueño del snapshot → flush inmediato (sin debounce)
        const next = { ...localContent, [field]: url };
        setLocalContent(next);
        void flush({ content: next, active: localActive });
      })
      .finally(() => setUploadingField(null));
    e.target.value = '';
  };

  // Título visible del card header: título real, label, kicker o alt (galería/media).
  const titleField =
    localContent.title ??
    localContent.label ??
    localContent.kicker ??
    localContent.alt ??
    null;

  // Campos a renderizar: los del content + los de la plantilla que falten
  // (con su valor default). Editar uno de los faltantes lo agrega al content
  // y el autosave lo persiste — sin tocar localContent acá.
  const displayEntries = useMemo(() => {
    const entries = Object.entries(localContent);
    if (!template) return entries;
    const seen = new Set(entries.map(([k]) => k));
    for (const [k, v] of Object.entries(template)) {
      if (!seen.has(k)) entries.push([k, v]);
    }
    return entries;
  }, [localContent, template]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`bg-surface/80 backdrop-blur-md rounded-xl border border-border overflow-hidden transition-all shadow-sm hover:shadow-md ${!localActive ? 'opacity-60 grayscale-[30%]' : ''}`}
    >
      {/* Card Header — always visible, touch-friendly. flex-wrap: en paneles
          angostos (320px) los 4 botones no dejan invisible el título; pasan a
          una segunda fila alineada a la derecha. */}
      <div
        className="flex flex-wrap items-center gap-2 p-3 cursor-pointer hover:bg-surface-raised/50 active:bg-surface-raised transition-colors select-none min-h-[52px]"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          {...dragHandleProps}
          onClick={(e) => e.stopPropagation()}
          className={`shrink-0 p-1 rounded-md text-muted-foreground transition-colors ${
            dragHandleProps ? 'cursor-grab active:cursor-grabbing hover:text-accent' : 'cursor-default'
          }`}
          title="Arrastrar para reordenar"
          aria-label="Arrastrar para reordenar"
        >
          <GripVertical size={15} />
        </button>
        <ChevronDown
          size={15}
          className={`text-muted-foreground shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {titleField ? String(titleField) : `Item #${item.item_order + 1}`}
        </span>

        {isDirty && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0"
            title="Cambios pendientes por publicar"
          />
        )}

        {/* Controls always visible on mobile */}
        <div className="flex items-center gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 min-w-11 min-h-11 flex items-center justify-center"
              title="Mover arriba"
            >
              <ArrowUp size={14} />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 min-w-11 min-h-11 flex items-center justify-center"
              title="Mover abajo"
            >
              <ArrowDown size={14} />
            </button>
          )}
          <button
            onClick={handleToggleActive}
            className={`p-2 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center ${
              localActive ? 'text-accent hover:bg-accent/10' : 'text-muted-foreground hover:bg-surface-raised'
            }`}
            title={localActive ? 'Ocultar en tienda' : 'Mostrar en tienda'}
          >
            {localActive ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          {/* Borrador pendiente: publicar/descartar explícito (draft_content) */}
          {item.draft_content != null && (
            <>
              <span
                className="px-1.5 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-bold uppercase tracking-wider shrink-0"
                title="Cambios sin publicar"
              >
                Borrador
              </span>
              <button
                onClick={() => onPublish(item.id)}
                className="p-2 rounded-lg text-accent hover:bg-accent/10 transition-colors min-w-11 min-h-11 flex items-center justify-center"
                title="Publicar"
                aria-label="Publicar"
              >
                <Send size={14} />
              </button>
              <button
                onClick={() => onDiscard(item.id)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-surface-raised transition-colors min-w-11 min-h-11 flex items-center justify-center"
                title="Descartar borrador (vuelve a lo publicado)"
                aria-label="Descartar borrador"
              >
                <RotateCcw size={14} />
              </button>
            </>
          )}
          <button
            onClick={requestDelete}
            disabled={isDeleting}
            className={`p-2 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center ${
              confirmingDelete
                ? 'bg-destructive/15 text-destructive border border-destructive/40'
                : 'text-destructive hover:bg-destructive/10'
            }`}
            title={confirmingDelete ? 'Confirmar eliminación' : 'Eliminar'}
            aria-label={confirmingDelete ? 'Confirmar eliminación' : 'Eliminar'}
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : confirmingDelete ? (
              <AlertTriangle size={14} />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 space-y-4 border-t border-border pt-3 bg-surface-sunken/50">
          <input
            ref={fileInputRef}
            id={`file-${item.id}`}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {displayEntries.map(([key, val]) => {
            // Carrusel media: en modo video, `src` es una URL de video (no uploader de imagen)
            const isVideoSrc =
              activeSection === 'media_items' &&
              key === 'src' &&
              localContent.type === 'video';
            return (
            <div key={key} className="space-y-1.5">
              {/* id derivado del item + campo: único aunque haya N cards iguales */}
              <label htmlFor={`${item.id}-${key}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {fieldLabel(key)}
              </label>
              {isImageField(key, activeSection) && !isVideoSrc ? (
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
                    <ContentFieldEditor fieldKey={key} fieldId={`${item.id}-${key}`} value={val} onChange={(v) => handleFieldChange(key, v)} />
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
                <ContentFieldEditor fieldKey={key} fieldId={`${item.id}-${key}`} value={val} onChange={(v) => handleFieldChange(key, v)} />
              )}
            </div>
            );
          })}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── SectionNav — lista con iconos estilo Shopify theme editor ──────────────

interface SectionNavProps {
  sectionKeys: string[];
  activeSection: string;
  /** Segmentación: solo secciones de esta categoría (bloques/diseño/otras). */
  category: EditorCategoryId;
  onSelect: (key: string) => void;
  itemCounts?: Record<string, number>;
}

function SectionNav({ sectionKeys, activeSection, category, onSelect, itemCounts = {} }: SectionNavProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const matches = (key: string) => {
    if (!q) return true;
    const meta = getSectionMeta(key);
    return (
      meta.label.toLowerCase().includes(q) ||
      meta.short.toLowerCase().includes(q) ||
      (meta.hint ?? '').toLowerCase().includes(q)
    );
  };

  const keySet = useMemo(
    () => new Set(sectionKeys.filter((k) => matches(k) && sectionCategory(k) === category)),
    [sectionKeys, q, category], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const grouped = useMemo(() => {
    return SECTION_GROUPS.map((g) => ({
      ...g,
      keys: SECTION_ORDER.filter((k) => keySet.has(k) && getSectionMeta(k).group === g.id),
    })).filter((g) => g.keys.length > 0);
  }, [keySet]);

  // Secciones desconocidas (no en meta/order) al final
  const orphanKeys = useMemo(
    () =>
      sectionKeys.filter(
        (k) =>
          !SECTION_ORDER.includes(k as (typeof SECTION_ORDER)[number]) &&
          matches(k) &&
          sectionCategory(k) === category,
      ),
    [sectionKeys, q, category], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const filteredKeys = useMemo(
    () => sectionKeys.filter((k) => matches(k) && sectionCategory(k) === category),
    [sectionKeys, q, category], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="flex flex-col gap-3 min-h-0">
      {/* Búsqueda: filtra por label/hint y colapsa grupos vacíos */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          id="editor-section-search"
          name="editor-section-search"
          type="text"
          autoComplete="off"
          aria-label="Buscar bloque"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar bloque…"
          className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Mobile: chips con icono (Shopify-like) */}
      <div className="md:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {filteredKeys.map((key) => {
          const meta = getSectionMeta(key);
          const Icon = meta.icon;
          const active = activeSection === key;
          const count = itemCounts[key] ?? 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`shrink-0 flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 min-h-11 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
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
        {filteredKeys.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1 py-2">Sin resultados para “{query}”</p>
        ) : null}
      </div>

      {/* Desktop: lista agrupada con iconos (theme customizer).
          flex-1 min-h-0: scroll interno acotado al espacio real del panel. */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-5 py-2 scrollbar-thin">
        {grouped.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {group.label}
            </p>
            <div className="space-y-1">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                      active
                        ? 'bg-accent/10 text-foreground ring-1 ring-accent/30 shadow-sm'
                        : 'text-muted-foreground hover:bg-surface-raised/50 hover:text-foreground'
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
                            ? 'Formulario de ajustes'
                            : `${count} elemento${count === 1 ? '' : 's'}`
                        }
                      >
                        {SETTINGS_SECTION_KEYS.has(key) ? 'Ajustes' : count}
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

        {grouped.length === 0 && orphanKeys.length === 0 && q ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">Sin bloques que coincidan con “{query}”.</p>
        ) : null}

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
  onUpdate: (
    id: string,
    content: Record<string, unknown>,
    isActive: boolean,
  ) => Promise<unknown> | void;
  onImageUpload: (file: File, fieldName: string, itemId: string) => Promise<string>;
}

function MenuSettingsEditor({ item, onUpdate, onImageUpload }: MenuSettingsEditorProps) {
  return (
    <MenuStyleEditor
      content={item.content}
      onSave={(content) => onUpdate(item.id, content, item.is_active)}
      onImageUpload={(file, fieldName) => onImageUpload(file, fieldName, item.id)}
    />
  );
}

// ── ItemsPanel ─────────────────────────────────────────────────────────────

/** Error de carga del CMS: panel explícito + reintento (sin paneles vacíos). */
function CmsLoadError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center space-y-3">
        <p className="text-sm font-medium text-foreground">No se pudo cargar el contenido CMS</p>
        <p className="text-xs text-muted-foreground break-words">
          {message || 'Error de red o sesión. Reintentá o volvé a iniciar sesión.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center px-4 rounded-lg text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

interface ItemsPanelProps {
  items: CMSContentItem[];
  activeSection: string;
  /** Drill-down: botón "← {backLabel}" en la cabecera (menú centralizado). */
  onBack?: () => void;
  backLabel?: string;
  onUpdate: (
    id: string,
    content: Record<string, unknown>,
    isActive: boolean,
  ) => Promise<unknown> | void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onDiscard: (id: string) => void;
  onImageUpload: (file: File, fieldName: string, itemId: string) => Promise<string>;
  onAddNew: () => void;
  onReorder?: (items: CMSContentItem[]) => void;
  isDeleting: boolean;
}

function ItemsPanel({
  items,
  activeSection,
  onBack,
  backLabel = 'Bloques',
  onUpdate,
  onDelete,
  onPublish,
  onDiscard,
  onImageUpload,
  onAddNew,
  onReorder,
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

  // Drag & drop (@hello-pangea/dnd) — mismo onReorder que las flechas
  const handleDragEnd = (result: DropResult) => {
    if (!onReorder || !result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;
    const newItems = [...items];
    const [moved] = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    onReorder(newItems);
  };

  const isSettingsSection = SETTINGS_SECTION_KEYS.has(activeSection);
  const sectionMeta = getSectionMeta(activeSection);
  const SectionIcon = sectionMeta.icon;
  // Plantilla de la sección: completa campos ausentes en items viejos (p.ej. image)
  const sectionTemplate = SECTION_TEMPLATES[activeSection];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-3 min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver a bloques"
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors text-xs font-medium min-h-11"
            >
              <ChevronLeft size={14} />
              {backLabel}
            </button>
          ) : null}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-accent shadow-sm">
            <SectionIcon size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-foreground leading-tight truncate">
              {sectionMeta.label}
            </h3>
            {sectionMeta.hint ? (
              <p className="text-xs text-muted-foreground mt-1 truncate">{sectionMeta.hint}</p>
            ) : null}
          </div>
        </div>
        {!isSettingsSection && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-xs font-medium min-h-11 shrink-0"
          >
            <Plus size={14} />
            Añadir
          </button>
        )}
      </div>

      {/* Preview del carrusel media: imágenes subidas en orden real (media_items) */}
      {activeSection === 'media_items' && items.length > 0 ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-surface-raised">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Vista previa del carrusel
            </p>
          </div>
          <div className="p-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {items.map((item, idx) => {
                // Videos: no son thumbnail de imagen (evita img rota en la strip)
                if (item.content.type === 'video') return null;
                const src =
                  (typeof item.content.image === 'string' ? item.content.image : '') ||
                  (typeof item.content.src === 'string' ? item.content.src : '');
                if (!src.startsWith('http')) return null;
                const alt =
                  typeof item.content.alt === 'string' && item.content.alt
                    ? item.content.alt
                    : `Slide ${idx + 1}`;
                return (
                  <div
                    key={item.id}
                    className="shrink-0 w-28 h-20 rounded-lg overflow-hidden border border-border bg-surface-sunken relative"
                  >
                    <img src={src} alt={alt} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-background/85 backdrop-blur text-[9px] text-muted-foreground px-1.5 py-0.5 truncate">
                      {alt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-3 pb-8">
        {isSettingsSection ? (
          items.length > 0 ? (
            activeSection === 'menu_settings' ? (
              <MenuSettingsEditor
                item={items[0]}
                onUpdate={onUpdate}
                onImageUpload={onImageUpload}
              />
            ) : (
              <ChromeSettingsEditor
                sectionKey={activeSection}
                content={items[0].content}
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
                className="inline-flex min-h-11 items-center px-3 text-accent text-sm font-medium hover:underline"
              >
                Inicializar sección
              </button>
            </div>
          )
        ) : items.length > 0 && onReorder ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`items-${activeSection}`}>
              {(droppableProvided) => (
                <div
                  {...droppableProvided.droppableProps}
                  ref={droppableProvided.innerRef}
                  className="space-y-3"
                >
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(draggableProvided) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                        >
                          <EditableItemCard
                            item={item}
                            activeSection={activeSection}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            onPublish={onPublish}
                            onDiscard={onDiscard}
                            onImageUpload={onImageUpload}
                            isDeleting={isDeleting}
                            onMoveUp={() => handleMoveUp(index)}
                            onMoveDown={() => handleMoveDown(index)}
                            isFirst={index === 0}
                            isLast={index === items.length - 1}
                            dragHandleProps={draggableProvided.dragHandleProps}
                            template={sectionTemplate}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <EditableItemCard
                key={item.id}
                item={item}
                activeSection={activeSection}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onPublish={onPublish}
                onDiscard={onDiscard}
                onImageUpload={onImageUpload}
                isDeleting={isDeleting}
                template={sectionTemplate}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl">
            <p className="text-sm text-muted-foreground mb-3">
              Sin elementos en esta sección.
            </p>
            <button
              onClick={onAddNew}
              className="inline-flex min-h-11 items-center px-3 text-accent text-sm font-medium hover:underline"
            >
              Añadir el primero
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EditorTiendaView (main) ────────────────────────────────────────────────

export function EditorTiendaView() {
  return (
    <EditorSaveStatusProvider>
      <EditorTiendaViewInner />
    </EditorSaveStatusProvider>
  );
}

function EditorTiendaViewInner() {
  const cms = useCMSContent();
  const [activeSection, setActiveSection] = useState<string>('menu_settings');
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [showNewForm, setShowNewForm] = useState(false);
  const [modalUploading, setModalUploading] = useState<string | null>(null);
  /** Paths subidos en la sesión del modal: si se cancela, se borran del bucket */
  const [modalUploadedPaths, setModalUploadedPaths] = useState<Record<string, string>>({});

  const cleanupModalUploads = () => {
    for (const path of Object.values(modalUploadedPaths)) {
      if (path) void supabase.storage.from('cms').remove([path]).catch(() => {});
    }
    setModalUploadedPaths({});
  };
  /** Menú centralizado con segmentación: categorías → lista → herramienta. */
  const [navDrill, setNavDrill] = useState<'categories' | 'list' | 'tool'>('categories');
  const [activeCategory, setActiveCategory] = useState<EditorCategoryId>('bloques');
  const [globalQuery, setGlobalQuery] = useState('');
  const [previewPath, setPreviewPath] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  /** Producto seleccionado para previsualizar su ficha real (PDP) */
  const [previewProductSlug, setPreviewProductSlug] = useState<string | null>(null);
  const [previewProducts, setPreviewProducts] = useState<
    { id: string; nombre: string; slug: string }[]
  >([]);
  const [imagesOpen, setImagesOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, slug')
        .eq('visible', true)
        .not('slug', 'is', null)
        .order('created_at', { ascending: false })
        .limit(60);
      if (active && data) {
        setPreviewProducts(
          (data as { id: string; nombre: string | null; slug: string | null }[])
            .filter((p) => p.slug)
            .map((p) => ({ id: p.id, nombre: p.nombre ?? 'Sin nombre', slug: p.slug ?? '' })),
        );
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  /** Foco de panel en desktop: maximizar editor ('a') o preview ('b') — persistido */
  const [desktopFocus, setDesktopFocus] = useState<PanelFocus>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('nucleo:focus-panels:editor-tienda');
    setDesktopFocus(stored === 'a' || stored === 'b' ? stored : null);
  }, []);

  const handleFocusChange = (focus: PanelFocus) => {
    setDesktopFocus(focus);
    localStorage.setItem('nucleo:focus-panels:editor-tienda', focus ?? '');
  };

  const { status: saveStatus, flushAll } = useEditorSaveAggregate();

  // Guard: no cerrar la pestaña con trabajo pendiente por publicar
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'pending' || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  // Cmd/Ctrl+S = publicar ahora (flush inmediato de todos los editores)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void flushAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flushAll]);

  // La preview es INDEPENDIENTE del editor: solo navega con su menú propio
  // (previewPath ya no sigue a activeSection). "Ir a sección" salta a la
  // página de la sección activa como acción explícita, sin acoplar ambos paneles.
  const goPreview = (path: string) => {
    if (path === previewPath) return;
    setPreviewPath(path);
    setPreviewProductSlug(null);
    setPreviewLoading(true);
  };

  const goProductPreview = (slug: string) => {
    setPreviewProductSlug(slug);
    setPreviewPath(`/producto/${slug}`);
    setPreviewLoading(true);
  };

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
    const rest = [...fromApi]
      .filter(
        (k) =>
          !SECTION_ORDER.includes(k as (typeof SECTION_ORDER)[number]) &&
          !RETIRED_CMS_SECTIONS.has(k),
      )
      .sort();
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

  const notifyRevalidate = (revalidated?: boolean) => {
    if (revalidated === false) {
      toast(
        'Guardado en base, pero la tienda no revalidó (URL/secret). Revisá NEXT_PUBLIC_URL_TIENDA y CMS_REVALIDATE_SECRET.',
        { type: 'warning' },
      );
    }
  };

  /**
   * Promise para autosave: el hook marca 'saved'/'error' según resuelva.
   * Toasts solo para errores (el chip global muestra "Publicado ✓").
   */
  const handleUpdateItem = async (
    id: string,
    content: Record<string, unknown>,
    isActive: boolean,
  ) => {
    try {
      const res = await cms.updateItem.mutateAsync({ id, content, is_active: isActive });
      notifyRevalidate(res?.revalidated);
      refreshIframe();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      toast(message, { type: 'error' });
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleDeleteItem = (id: string) => {
    const item = currentItems.find((i) => i.id === id);
    cms.deleteItem.mutate(id, {
      onSuccess: (res) => {
        if (item) removeItemImages(item.content);
        notifyRevalidate(res?.revalidated);
        refreshIframe();
      },
      onError: (err) => toast(err.message, { type: 'error' }),
    });
  };

  // Draft/publish: publicar o descartar borradores (draft_content)
  const handlePublishItem = (id: string) => {
    cms.publishItems.mutate(
      { id },
      {
        onSuccess: (res) => {
          notifyRevalidate(res?.revalidated);
          toast(
            res.data.published > 0 ? 'Publicado ✓' : 'Este item no tiene cambios pendientes',
            { type: res.data.published > 0 ? 'success' : 'info' },
          );
          refreshIframe();
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  const handleDiscardItem = (id: string) => {
    cms.discardItem.mutate(
      { id },
      {
        onSuccess: () => toast('Borrador descartado — se muestra lo publicado', { type: 'info' }),
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  const handlePublishAll = () => {
    cms.publishItems.mutate(
      {},
      {
        onSuccess: (res) => {
          notifyRevalidate(res?.revalidated);
          toast(
            res.data.published > 0
              ? `${res.data.published} item${res.data.published !== 1 ? 's' : ''} publicado${res.data.published !== 1 ? 's' : ''} ✓`
              : 'No hay borradores pendientes',
            { type: res.data.published > 0 ? 'success' : 'info' },
          );
          refreshIframe();
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  const pendingDraftsCount = useMemo(() => {
    if (!cms.data) return 0;
    return Object.values(cms.data.data).reduce(
      (acc, items) => acc + items.filter((i) => i.draft_content != null).length,
      0,
    );
  }, [cms.data]);

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
      // Los items nuevos caen al FINAL de la sección (no item_order 0 = arriba)
      const nextOrder =
        currentItems.reduce((max, i) => Math.max(max, i.item_order ?? 0), 0) + 1;
      cms.createItem.mutate(
        { section_key: activeSection as CMSSectionKey, content: newContent, item_order: nextOrder },
        {
          onSuccess: (res) => {
            // Las imágenes del modal ya tienen dueño: no limpiarlas
            setModalUploadedPaths({});
            notifyRevalidate(res?.revalidated);
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

  /** Best-effort: elimina del bucket cms las imágenes de un item borrado. */
  const removeItemImages = (content: Record<string, unknown>) => {
    for (const [key, val] of Object.entries(content)) {
      if (
        isImageField(key, activeSection) &&
        typeof val === 'string' &&
        val.includes('/storage/v1/object/public/cms/')
      ) {
        const path = val.split('/storage/v1/object/public/cms/')[1];
        if (path) void supabase.storage.from('cms').remove([path]).catch(() => {});
      }
    }
  };

  const handleReorder = (newItems: typeof currentItems) => {
    const payload = newItems.map((item, idx) => ({
      id: item.id,
      item_order: idx + 1,
    }));
    cms.reorderItems.mutate(payload, {
      onSuccess: (res) => {
        notifyRevalidate(res?.revalidated);
        refreshIframe();
      },
      onError: (err) => toast(err.message, { type: 'error' }),
    });
  };

  const tiendaUrl = getUrlTienda();

  // Guard: si la URL de tienda apunta al propio Núcleo, el iframe se auto-embebe
  // y queda en blanco (CSP frame-ancestors 'none'). Mostrar error explícito.
  const tiendaOrigin = (() => {
    try {
      return tiendaUrl ? new URL(tiendaUrl).origin : '';
    } catch {
      return '';
    }
  })();
  const isSelfEmbed =
    typeof window !== 'undefined' &&
    tiendaOrigin !== '' &&
    tiendaOrigin === window.location.origin;

  return (
    // Altura anclada al viewport con tokens reales (--vh-full = 100dvh con
    // fallback, --header-height, padding de .page-content y márgenes del tool):
    // el calc mágico 100vh-120px desbordaba ~16px y la página entera scrolleaba,
    // cortando el borde inferior y obligando a "bajar" toda la herramienta.
    <div
      data-testid="editor-tienda-root"
      className="flex-1 flex flex-col h-[calc(var(--vh-full)_-_var(--header-height)_-_env(safe-area-inset-top,0px)_-_var(--space-xl)_-_var(--space-xl)_-8px)] max-md:h-[calc(var(--vh-full)_-_var(--header-height)_-_env(safe-area-inset-top,0px)_-_var(--space-md)_-_var(--space-md)_-_var(--nav-height)_-_var(--liquid-nav-inset)_-_env(safe-area-inset-bottom,12px)_-8px)] -mt-2 mb-4 mx-0 lg:-mx-4 bg-background/40 backdrop-blur-2xl border border-border/60 rounded-2xl overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500 ease-out"
    >
      {/* ── Top bar ── */}
      <div className="h-14 border-b border-border/50 bg-surface/50 backdrop-blur-lg flex items-center justify-between px-4 shrink-0 shadow-sm z-10 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-medium text-base text-foreground truncate">
            Editor Tienda
          </span>
          {cms.isLoading && <Loader2 size={14} className="animate-spin text-accent shrink-0" />}
          {cms.error ? (
            <span className="text-[10px] font-medium text-destructive truncate max-w-[12rem]" title={cms.error.message}>
              Error al cargar CMS
            </span>
          ) : null}
          <EditorSaveStatusChip />
          <button
            type="button"
            onClick={() => setImagesOpen(true)}
            className="inline-flex min-h-9 items-center gap-1.5 px-3 rounded-full text-[11px] font-semibold transition-colors border border-border text-muted-foreground hover:text-foreground hover:border-accent/40"
            title="Gestionar imágenes del bucket cms (librería, huérfanas)"
          >
            <Images size={12} />
            Imágenes
          </button>
          <button
            type="button"
            onClick={handlePublishAll}
            disabled={cms.publishItems.isPending || pendingDraftsCount === 0}
            className={`inline-flex min-h-9 items-center gap-1.5 px-3 rounded-full text-[11px] font-semibold transition-colors border ${
              pendingDraftsCount > 0
                ? 'border-accent/40 bg-accent/15 text-accent hover:bg-accent/25'
                : 'border-border text-muted-foreground/60 opacity-70'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              pendingDraftsCount > 0
                ? `Publicar ${pendingDraftsCount} borrador${pendingDraftsCount !== 1 ? 'es' : ''} pendiente${pendingDraftsCount !== 1 ? 's' : ''}`
                : 'Sin borradores pendientes'
            }
          >
            {cms.publishItems.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Send size={12} />
            )}
            Publicar todo
            {pendingDraftsCount > 0 ? ` (${pendingDraftsCount})` : ''}
          </button>
        </div>

        {/* Desktop: view mode toggle */}
        <div className="hidden md:flex items-center gap-2 bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setViewMode('desktop')}
            className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-md transition-colors ${
              viewMode === 'desktop' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vista Escritorio"
          >
            <Monitor size={15} />
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-md transition-colors ${
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
            className={`min-h-11 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mobileTab === 'editor' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`min-h-11 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mobileTab === 'preview' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Vista Previa
          </button>
        </div>

        {/* Desktop: foco de panel + live site link */}
        <div className="hidden md:flex items-center gap-3">
          <PanelFocusToggle
            aKey="editor"
            bKey="preview"
            aLabel="Editor"
            bLabel="Preview"
            focus={desktopFocus}
            onFocusChange={handleFocusChange}
          />
          {tiendaUrl && (
            <a
              href={tiendaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 transition-colors"
            >
              Ver en vivo <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left sidebar / Editor area — menú segmentado con drill-down:
            categorías (Bloques/Diseño/Otras formas) → lista de la categoría
            → herramienta; cada nivel con volver arriba-izquierda. */}
        <div
          className={`flex-col w-full shrink-0 border-r border-border/50 bg-surface-sunken/30 overflow-hidden ${
            desktopFocus === 'b' ? 'hidden md:hidden' : desktopFocus === 'a' ? 'md:flex-1' : 'md:w-80 lg:w-[28rem]'
          } ${mobileTab === 'editor' ? 'flex' : 'flex max-md:hidden'}`}
        >
          {navDrill === 'categories' ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div className="px-1 mb-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Editor de tienda
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Elegí una categoría — cada bloque se edita desde su herramienta.
                </p>
              </div>

              {/* Búsqueda global: encuentra bloques de cualquier categoría */}
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  id="editor-global-search"
                  name="editor-global-search"
                  type="text"
                  autoComplete="off"
                  aria-label="Buscar bloque en toda la tienda"
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  placeholder="Buscar en toda la tienda…"
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {globalQuery.trim() ? (
                <div className="space-y-1.5">
                  {sectionKeys
                    .filter((k) => {
                      const meta = getSectionMeta(k);
                      const q = globalQuery.trim().toLowerCase();
                      return (
                        meta.label.toLowerCase().includes(q) ||
                        meta.short.toLowerCase().includes(q) ||
                        (meta.hint ?? '').toLowerCase().includes(q)
                      );
                    })
                    .map((k) => {
                      const meta = getSectionMeta(k);
                      const Icon = meta.icon;
                      const cat = EDITOR_CATEGORIES.find((c) => c.id === sectionCategory(k));
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            setActiveCategory(sectionCategory(k));
                            setGlobalQuery('');
                            setActiveSection(k);
                            setNavDrill('tool');
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-surface-raised/60"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                            <Icon size={15} strokeWidth={2} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium text-foreground truncate">
                              {meta.label}
                            </span>
                            <span className="block text-[10px] text-muted-foreground truncate">
                              {cat?.label ?? ''}
                            </span>
                          </span>
                          <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
                        </button>
                      );
                    })}
                  {sectionKeys.filter((k) => {
                    const meta = getSectionMeta(k);
                    const q = globalQuery.trim().toLowerCase();
                    return (
                      meta.label.toLowerCase().includes(q) ||
                      meta.short.toLowerCase().includes(q) ||
                      (meta.hint ?? '').toLowerCase().includes(q)
                    );
                  }).length === 0 ? (
                    <p className="text-xs text-muted-foreground px-1 py-2">
                      Sin resultados para “{globalQuery.trim()}”
                    </p>
                  ) : null}
                </div>
              ) : (
                EDITOR_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const catSections = sectionKeys.filter((k) => sectionCategory(k) === cat.id);
                  const catItems = catSections.reduce(
                    (acc, k) => acc + (groupedData[k] ?? []).length,
                    0,
                  );
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setNavDrill('list');
                      }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-surface/60 hover:border-accent/40 hover:bg-surface-raised/40 transition-all text-left"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                        <Icon size={20} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-foreground">{cat.label}</span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {cat.desc}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-medium tabular-nums px-2 py-1 rounded-md bg-background border border-border text-muted-foreground">
                        {catSections.length} · {catItems} ítems
                      </span>
                      <ChevronRight size={15} className="shrink-0 text-muted-foreground" />
                    </button>
                  );
                })
              )}
            </div>
          ) : navDrill === 'list' ? (
            <>
              {/* Lista de la categoría — volver a categorías */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface shrink-0">
                <button
                  type="button"
                  onClick={() => setNavDrill('categories')}
                  aria-label="Volver a categorías"
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors text-xs font-medium min-h-11"
                >
                  <ChevronLeft size={14} />
                  Categorías
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">
                    {EDITOR_CATEGORIES.find((c) => c.id === activeCategory)?.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {EDITOR_CATEGORIES.find((c) => c.id === activeCategory)?.desc}
                  </p>
                </div>
              </div>
              <div className="p-3 md:p-4 border-b border-border bg-surface">
                <SectionNav
                  sectionKeys={sectionKeys}
                  activeSection={activeSection}
                  category={activeCategory}
                  onSelect={(k) => {
                    setActiveSection(k);
                    setNavDrill('tool');
                  }}
                  itemCounts={Object.fromEntries(
                    sectionKeys.map((k) => [k, (groupedData[k] ?? []).length]),
                  )}
                />
              </div>

              {cms.error && !cms.isLoading ? (
                <CmsLoadError
                  message={cms.error.message}
                  onRetry={() => void cms.refetch()}
                />
              ) : null}
            </>
          ) : (
            <>
              {cms.error && !cms.isLoading ? (
                <CmsLoadError
                  message={cms.error.message}
                  onRetry={() => void cms.refetch()}
                />
              ) : (
                <ItemsPanel
                  items={currentItems}
                  activeSection={activeSection}
                  onBack={() => setNavDrill('list')}
                  backLabel={EDITOR_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Bloques'}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onPublish={handlePublishItem}
                  onDiscard={handleDiscardItem}
                  onImageUpload={handleImageUpload}
                  onAddNew={() => setShowNewForm(true)}
                  onReorder={handleReorder}
                  isDeleting={cms.deleteItem.isPending}
                />
              )}
            </>
          )}
        </div>

        {/* Right: iframe preview */}
        <div className={`flex-col flex-1 bg-surface-sunken/50 relative items-center overflow-hidden ${desktopFocus === 'a' ? 'md:hidden' : ''} ${mobileTab === 'preview' ? 'flex' : 'flex max-md:hidden'}`}>
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Menú independiente del preview: navega sin acoplar al editor */}
          <div
            className="w-full shrink-0 flex items-center gap-1.5 overflow-x-auto px-3 py-2 border-b border-border/50 bg-surface/40 scrollbar-thin relative z-10"
            role="navigation"
            aria-label="Páginas de la vista previa"
          >
            {PREVIEW_DESTINATIONS.map((d) => (
              <button
                key={d.path}
                type="button"
                onClick={() => goPreview(d.path)}
                aria-pressed={previewPath === d.path}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors min-h-9 ${
                  previewPath === d.path
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {d.label}
              </button>
            ))}
            {/* Selector de producto real: previsualiza la ficha (PDP) */}
            <select
              value={previewProductSlug ?? ''}
              onChange={(e) => {
                const slug = e.target.value;
                if (slug) goProductPreview(slug);
              }}
              aria-label="Previsualizar producto"
              className="min-h-9 px-2 py-1 rounded-full text-[11px] font-medium bg-transparent border border-border text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Producto…</option>
              {previewProducts.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <span className="w-px h-4 bg-border mx-1 shrink-0" aria-hidden />
            <button
              type="button"
              onClick={() => goPreview(SECTION_PREVIEW_PATHS[activeSection] ?? '')}
              disabled={!SECTION_PREVIEW_PATHS[activeSection]}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap min-h-9 transition-colors border border-dashed ${
                SECTION_PREVIEW_PATHS[activeSection]
                  ? 'text-accent border-accent/40 hover:bg-accent/10'
                  : 'text-muted-foreground/50 border-border opacity-60'
              }`}
              title="Saltar a la página de la sección que estás editando"
            >
              Ir a sección
            </button>
          </div>

          <div className="flex-1 w-full flex flex-col items-center justify-center p-0 md:p-6 lg:p-10 overflow-hidden relative">
            <div
              className={`relative bg-background border-0 shadow-2xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
                viewMode === 'mobile'
                  ? 'w-full h-full md:w-[375px] md:h-[812px] md:max-h-full md:rounded-[2.5rem] md:border-8 md:border-surface-raised md:ring-1 md:ring-border'
                  : 'w-full h-full md:rounded-2xl md:border md:border-border'
              }`}
            >
              {viewMode === 'mobile' && (
                <div className="hidden md:flex absolute top-0 inset-x-0 h-7 bg-surface-raised z-20 justify-center items-center">
                  <div className="w-12 h-1.5 bg-border rounded-full" />
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
              ) : isSelfEmbed ? (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-sunken p-6">
                  <div className="text-center space-y-2 max-w-sm">
                    <AppWindow size={48} className="mx-auto text-destructive opacity-70" />
                    <p className="text-sm font-medium text-foreground">
                      La URL de la tienda apunta a Núcleo
                    </p>
                    <p className="text-xs text-muted-foreground/70 break-words">
                      NEXT_PUBLIC_URL_TIENDA está configurada con la URL de Núcleo (
                      {tiendaOrigin}). El iframe no puede embeber Núcleo dentro de
                      Núcleo. Corregí la variable en el proyecto de Vercel.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`flex-1 relative w-full overflow-hidden ${viewMode === 'mobile' ? 'md:mt-7 md:rounded-b-[2rem]' : ''}`}>
                  <iframe
                    ref={iframeRef}
                    key={iframeKey}
                    src={`${tiendaUrl}${previewPath}?cms_preview=1`}
                    title="Vista Previa de Tienda"
                    className="absolute inset-0 w-full h-full border-none bg-background"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    onLoad={() => setPreviewLoading(false)}
                  />
                  {/* Overlay mientras la preview navega/revalida */}
                  <AnimatePresence>
                    {previewLoading ? (
                      <motion.div
                        key="preview-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-surface-sunken/60 backdrop-blur-sm pointer-events-none"
                      >
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 border border-border shadow-lg">
                          <Loader2 size={14} className="animate-spin text-accent" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Actualizando vista previa…
                          </span>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Escape hatch: si el navegador bloquea el iframe (CSP/privacidad), abrir la tienda en pestaña.
              Solo en vista desktop y pantallas md+: en el frame móvil (o en <768px) tapa el WhatsApp
              float de la tienda en la esquina inferior derecha, así que va a la izquierda. */}
          {tiendaUrl && !isSelfEmbed && viewMode === 'desktop' && (
            <a
              href={tiendaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex absolute bottom-4 left-4 z-20 items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-background/90 backdrop-blur border border-border text-muted-foreground hover:text-accent hover:border-accent/50 transition-colors shadow-lg"
            >
              <ExternalLink size={12} />
              Abrir tienda en pestaña
            </a>
          )}
        </div>
      </div>

      {/* ── Add new item modal ── */}
      {/* Portal al body: el root del editor crea stacking context (relative z-10
         + backdrop-blur) que confina el z-220 del modal por DEBAJO de la nav
         líquida móvil (z-1000), tapando los botones Crear/Cancelar. El wrapper
         z-[1100] lo sube por encima de la nav solo cuando está abierto. */}
      {showNewForm && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[1100]">
              <ImmersiveModal
                open={showNewForm}
                onClose={() => {
                  cleanupModalUploads();
                  setShowNewForm(false);
                }}
                eyebrow={SECTION_LABELS[activeSection] ?? activeSection}
                title="Añadir elemento"
                size="md"
                footer={
          <>
            <button
              type="button"
              onClick={() => {
                cleanupModalUploads();
                setShowNewForm(false);
              }}
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
          Las imágenes se suben directamente desde acá — nunca pegues URLs. Subí la foto y completá el texto alternativo.
        </p>
        <div className="space-y-4">
          {Object.entries(newContent).map(([key, val]) => (
            <div key={key} className="space-y-1.5">
              <label htmlFor={`new-item-${key}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {fieldLabel(key)}
              </label>
              {isImageField(key, activeSection) ? (
                <div className="space-y-2">
                  {val && typeof val === 'string' && val.startsWith('http') ? (
                    <img
                      src={val}
                      alt={key}
                      className="w-full h-32 object-cover rounded-lg border border-border bg-background"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = () => {
                        const file = input.files?.[0];
                        if (!file) return;
                        setModalUploading(key);
                        void cms.uploadImage
                          .mutateAsync({
                            file,
                            sectionKey: activeSection as CMSSectionKey,
                            fieldName: key,
                          })
                          .then((result) => {
                            setNewContent((prev) => ({ ...prev, [key]: result.publicUrl }));
                            // Re-subida en la misma sesión: la imagen anterior queda huérfana
                            setModalUploadedPaths((prev) => {
                              const prevPath = prev[key];
                              if (prevPath) {
                                void supabase.storage.from('cms').remove([prevPath]).catch(() => {});
                              }
                              return { ...prev, [key]: result.path };
                            });
                          })
                          .catch((err) =>
                            toast(err instanceof Error ? err.message : 'Error al subir imagen', {
                              type: 'error',
                            }),
                          )
                          .finally(() => setModalUploading(null));
                      };
                      input.click();
                    }}
                    disabled={modalUploading === key}
                    className="flex w-full justify-center items-center gap-2 px-3 py-3 rounded-lg text-xs font-medium bg-background border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {modalUploading === key ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    {val && typeof val === 'string' && val.startsWith('http')
                      ? 'Cambiar imagen'
                      : 'Subir imagen'}
                  </button>
                </div>
              ) : (
                <ContentFieldEditor
                  fieldKey={key}
                  fieldId={`new-item-${key}`}
                  value={val}
                  onChange={(v) => setNewContent((prev) => ({ ...prev, [key]: v }))}
                />
              )}
            </div>
          ))}
        </div>
            </ImmersiveModal>
          </div>,
          document.body,
        )
        : null}

      {/* Gestión de imágenes del bucket cms */}
      <ImageLibraryModal
        open={imagesOpen}
        onClose={() => setImagesOpen(false)}
        getSectionLabel={(key) => SECTION_LABELS[key] ?? key}
      />
    </div>
  );
}
