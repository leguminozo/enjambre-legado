/**
 * Registro concreto del Editor de Tienda: secciones declaradas como schema
 * (patrón {% schema %} de Shopify adaptado). Todas las section_keys del CMS
 * tienen entrada; las que declaran `customEditor` siguen renderizando con su
 * editor a mano (OptionCards, pickers remotos, listas ordenables, presets),
 * el resto genera el panel desde el schema.
 */
import {
  type CmsSectionKey,
} from '@/lib/editor-tienda-sections';
import {
  ANNOUNCEMENT_SETTINGS_TEMPLATE,
  ANNOUNCEMENT_SLIDE_TEMPLATE,
  AUTH_SETTINGS_TEMPLATE,
  BRAND_ASSETS_TEMPLATE,
  CAMPAIGN_BANNER_TEMPLATE,
  CART_SETTINGS_TEMPLATE,
  CATALOG_SETTINGS_TEMPLATE,
  CHECKOUT_SETTINGS_TEMPLATE,
  CIENCIA_SETTINGS_TEMPLATE,
  CLUB_LEGADO_SETTINGS_TEMPLATE,
  CLUB_PAGE_SETTINGS_TEMPLATE,
  COLLECTIONS_SETTINGS_TEMPLATE,
  CONSERVATION_CONTENT_TEMPLATE,
  CONTACT_SETTINGS_TEMPLATE,
  FOOTER_SETTINGS_TEMPLATE,
  FOOTER_SOCIAL_TEMPLATE,
  GALERIA_SETTINGS_TEMPLATE,
  HOME_MEDIA_ITEM_TEMPLATE,
  IDENTIDAD_SETTINGS_TEMPLATE,
  LANDING_LAYOUT_TEMPLATE,
  LEGAL_DOC_TEMPLATE,
  MAP_SETTINGS_TEMPLATE,
  MEDIA_SETTINGS_TEMPLATE,
  NOSOTROS_SETTINGS_TEMPLATE,
  PDP_SETTINGS_TEMPLATE,
  PRODUCTS_SETTINGS_TEMPLATE,
  PWA_NAV_ITEM_TEMPLATE,
  PWA_NAV_SETTINGS_TEMPLATE,
  RESERVA_ANUAL_TEMPLATE,
  SEASONAL_SETTINGS_TEMPLATE,
  SEO_DEFAULTS_TEMPLATE,
  THEME_SETTINGS_TEMPLATE,
  TYPOGRAPHY_SETTINGS_TEMPLATE,
  VIDEO_SETTINGS_TEMPLATE,
  B2B_CAFETERIAS_TEMPLATE,
  B2B_HOTELES_TEMPLATE,
  B2B_TIENDAS_GOURMET_TEMPLATE,
  B2B_FERIAS_TEMPLATE,
  B2B_REVENDEDORES_TEMPLATE,
  B2B_HUB_SETTINGS_TEMPLATE,
  ORIGEN_SETTINGS_TEMPLATE,
  BOTANICAL_MONOGRAPH_TEMPLATE,
  EXPERIENCIAS_SETTINGS_TEMPLATE,
  EXPERIENCIAS_PUREO_SETTINGS_TEMPLATE,
  EXPERIENCIAS_TALLERES_SETTINGS_TEMPLATE,
  FLORACIONES_EXPERIENCE_TEMPLATE,
  QR_SCAN_SETTINGS_TEMPLATE,
  type FieldSchema,
  type SectionSchema,
} from '@/lib/store-chrome';
import { HEADER_NAV_TEMPLATE, HEADER_SETTINGS_TEMPLATE } from '@/lib/header-menu';

// ── Helpers de options compartidas (labels reales de los editores) ─────────

const ASPECT_OPTIONS = [
  { value: '16/9', label: '16:9 Widescreen (Hero / Historia)' },
  { value: '16/10', label: '16:10 Panorámico (Compacto)' },
  { value: '4/3', label: '4:3 Horizontal (Recomendado - Fotos completas)' },
  { value: '1/1', label: '1:1 Cuadrado' },
  { value: '3/4', label: '3:4 Vertical / Retrato' },
  { value: 'auto', label: 'Auto (Original de la foto)' },
] as const;

const FIT_OPTIONS = [
  { value: 'cover', label: 'Rellenar contenedor (Cover)' },
  { value: 'contain', label: 'Ajustar foto completa sin cortar (Contain)' },
] as const;

const GRID_COLUMNS_OPTIONS = [
  { value: '2', label: '2 Columnas' },
  { value: '3', label: '3 Columnas (Predeterminado)' },
  { value: '4', label: '4 Columnas' },
] as const;

/** Kinds de riesgo de copy para campos de texto libres (paridad heurística). */
const RISK_COPY = ['stack_leak', 'health_claim'] as const;
const RISK_STACK = ['stack_leak'] as const;

// ── Cabecera ───────────────────────────────────────────────────────────────

export const MENU_SETTINGS_SCHEMA = {
  id: 'menu_settings',
  label: 'Menú — Estilo',
  short: 'Menú',
  hint: 'Header y logo menú',
  group: 'cabecera',
  category: 'diseno',
  icon: 'PanelTop',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  customEditor: 'menu',
  template: HEADER_SETTINGS_TEMPLATE,
  fields: [],
} as const satisfies SectionSchema<CmsSectionKey>;

export const MENU_LINKS_SCHEMA = {
  id: 'menu_links',
  label: 'Menú',
  short: 'Menú',
  hint: 'Estilo del header y enlaces',
  group: 'cabecera',
  category: 'diseno',
  icon: 'Link2',
  kind: { kind: 'pair', settingsKey: 'menu_settings' },
  publishMode: 'auto',
  template: HEADER_NAV_TEMPLATE,
  fields: [
    { type: 'text', id: 'label', label: 'Texto (ES)', bilingual: true },
    { type: 'url', id: 'href', label: 'Ruta / enlace', internalOnly: true },
    { type: 'checkbox', id: 'show_desktop', label: 'Visible en desktop', default: true },
    { type: 'checkbox', id: 'show_mobile', label: 'Visible en móvil', default: true },
    {
      type: 'list',
      id: 'children',
      label: 'Subenlaces desplegables (Dropdown)',
      itemLabel: 'Subenlace',
      itemFields: [
        { type: 'text', id: 'label', label: 'Título del subenlace', bilingual: true },
        { type: 'text', id: 'href', label: 'Ruta / enlace' },
        { type: 'text', id: 'description', label: 'Descripción breve (opcional)', bilingual: true },
        { type: 'text', id: 'badge', label: 'Distintivo / Badge (opcional)' },
      ],
    },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const ANNOUNCEMENT_SETTINGS_SCHEMA = {
  id: 'announcement_settings',
  label: 'Anuncios — Estilo',
  short: 'Anuncios',
  hint: 'Barra superior',
  group: 'cabecera',
  category: 'diseno',
  icon: 'Megaphone',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: ANNOUNCEMENT_SETTINGS_TEMPLATE,
  fields: [
    { type: 'checkbox', id: 'enabled', label: 'Barra de anuncios activa', default: true },
    {
      type: 'checkbox',
      id: 'dismissible',
      label: 'Se puede cerrar',
      info: 'Doble tap / dismiss guarda en sesión.',
      default: true,
    },
    { type: 'range', id: 'interval_ms', label: 'Intervalo entre slides', min: 2000, max: 12000, step: 500, unit: 'ms', default: 5000 },
    {
      type: 'range',
      id: 'height_mobile_px',
      label: 'Altura móvil (mínima)',
      info: 'La barra crece si el mensaje envuelve.',
      min: 44,
      max: 72,
      step: 1,
      unit: 'px',
      default: 48,
    },
    {
      type: 'range',
      id: 'height_desktop_px',
      label: 'Altura desktop (mínima)',
      info: 'La barra crece si el mensaje envuelve.',
      min: 44,
      max: 80,
      step: 1,
      unit: 'px',
      default: 52,
    },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const ANNOUNCEMENT_SLIDES_SCHEMA = {
  id: 'announcement_slides',
  label: 'Anuncios',
  short: 'Anuncios',
  hint: 'Barra superior: estilo y mensajes',
  group: 'cabecera',
  category: 'diseno',
  icon: 'GalleryHorizontalEnd',
  kind: { kind: 'pair', settingsKey: 'announcement_settings' },
  publishMode: 'auto',
  template: ANNOUNCEMENT_SLIDE_TEMPLATE,
  fields: [
    { type: 'text', id: 'text', label: 'Mensaje (ES)', bilingual: true },
    { type: 'url', id: 'href', label: 'Ruta / enlace' },
    { type: 'text', id: 'link_label', label: 'Texto del link (ES)', bilingual: true },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Pie y app ──────────────────────────────────────────────────────────────

export const FOOTER_SETTINGS_SCHEMA = {
  id: 'footer_settings',
  label: 'Footer — Estilo',
  short: 'Footer',
  hint: 'Pie de página',
  group: 'pie',
  category: 'diseno',
  icon: 'PanelBottom',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: FOOTER_SETTINGS_TEMPLATE,
  fields: [
    { type: 'text', id: 'brand_line1', label: 'Marca línea 1', default: '' },
    { type: 'text', id: 'brand_line2', label: 'Marca línea 2', default: '' },
    { type: 'range', id: 'brand_tracking_em', label: 'Tracking marca', min: 0, max: 0.6, step: 0.02, unit: 'em', default: 0.4 },
    { type: 'textarea', id: 'intro', label: 'Intro', bilingual: true, default: '' },
    { type: 'checkbox', id: 'show_social', label: 'Mostrar redes', default: true },
    { type: 'checkbox', id: 'show_legal', label: 'Mostrar legal', default: true },
    { type: 'checkbox', id: 'show_newsletter', label: 'Newsletter', default: true },
    { type: 'text', id: 'newsletter_title', label: 'Newsletter título', visible_if: { field: 'show_newsletter', equals: true }, default: '' },
    { type: 'textarea', id: 'newsletter_desc', label: 'Newsletter desc', visible_if: { field: 'show_newsletter', equals: true }, default: '' },
    { type: 'text', id: 'newsletter_placeholder', label: 'Placeholder email', visible_if: { field: 'show_newsletter', equals: true }, default: '' },
    { type: 'text', id: 'copyright_suffix', label: 'Copyright (sufijo)', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

const NETWORK_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Otra' },
] as const;

export const FOOTER_SOCIAL_SCHEMA = {
  id: 'footer_social',
  label: 'Footer',
  short: 'Footer',
  hint: 'Pie de página y redes',
  group: 'pie',
  category: 'diseno',
  icon: 'Share2',
  kind: { kind: 'pair', settingsKey: 'footer_settings' },
  publishMode: 'auto',
  template: FOOTER_SOCIAL_TEMPLATE,
  fields: [
    { type: 'text', id: 'label', label: 'Nombre', default: '' },
    { type: 'select', id: 'network', label: 'Red social', options: NETWORK_OPTIONS, default: 'instagram' },
    { type: 'url', id: 'href', label: 'Enlace', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const PWA_NAV_SETTINGS_SCHEMA = {
  id: 'pwa_nav_settings',
  label: 'PWA — Estilo',
  short: 'PWA',
  hint: 'Barra inferior móvil',
  group: 'pie',
  category: 'diseno',
  icon: 'Smartphone',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: PWA_NAV_SETTINGS_TEMPLATE,
  fields: [
    { type: 'checkbox', id: 'enabled', label: 'Bottom nav PWA activa', default: true },
    { type: 'paragraph', content: 'Edita las pestañas en la sección PWA — Pestañas.' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

const PWA_ICON_OPTIONS = [
  { value: 'home', label: 'Inicio' },
  { value: 'store', label: 'Tienda' },
  { value: 'scan', label: 'Escanear' },
  { value: 'legacy', label: 'Legado' },
  { value: 'bag', label: 'Bolsa' },
] as const;

export const PWA_NAV_ITEMS_SCHEMA = {
  id: 'pwa_nav_items',
  label: 'PWA',
  short: 'PWA',
  hint: 'Barra inferior: estilo y pestañas',
  group: 'pie',
  category: 'diseno',
  icon: 'AppWindow',
  kind: { kind: 'pair', settingsKey: 'pwa_nav_settings' },
  publishMode: 'auto',
  template: PWA_NAV_ITEM_TEMPLATE,
  fields: [
    { type: 'text', id: 'label', label: 'Texto (ES)', bilingual: true },
    { type: 'select', id: 'icon', label: 'Icono', options: PWA_ICON_OPTIONS, default: 'home', control: 'segmented' },
    { type: 'url', id: 'href', label: 'Ruta / enlace', internalOnly: true },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const BRAND_ASSETS_SCHEMA = {
  id: 'brand_assets',
  label: 'Marca y logos',
  short: 'Marca',
  hint: 'Logo, favicon, OG',
  group: 'apariencia',
  category: 'diseno',
  icon: 'Image',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  customEditor: 'brand',
  template: BRAND_ASSETS_TEMPLATE,
  fields: [],
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Apariencia ─────────────────────────────────────────────────────────────

export const THEME_SETTINGS_SCHEMA = {
  id: 'theme_settings',
  label: 'Tema',
  short: 'Tema',
  hint: 'Colores, radio, grain',
  group: 'apariencia',
  category: 'diseno',
  icon: 'Palette',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  customEditor: 'theme',
  template: THEME_SETTINGS_TEMPLATE,
  fields: [
    {
      type: 'select',
      id: 'default_theme',
      label: 'Tema por defecto',
      options: [
        { value: 'system', label: 'Sistema' },
        { value: 'dark', label: 'Oscuro' },
        { value: 'light', label: 'Claro' },
      ],
      default: 'system',
    },
    { type: 'range', id: 'grain_intensity', label: 'Grain', min: 0, max: 1, step: 0.05, default: 0.35 },
    {
      type: 'select',
      id: 'border_radius',
      label: 'Radio de bordes',
      options: [
        { value: 'sm', label: 'Sutil' },
        { value: 'md', label: 'Medio' },
        { value: 'lg', label: 'Grande' },
      ],
      default: 'md',
    },
    { type: 'checkbox', id: 'force_dark_public', label: 'Forzar oscuro en público', default: false },
    { type: 'header', content: 'Acento (miel dorada)' },
    { type: 'range', id: 'accent_h', label: 'Matiz (H)', min: 0, max: 360, step: 1, default: 44 },
    { type: 'range', id: 'accent_s', label: 'Saturación (S%)', min: 0, max: 100, step: 1, default: 85 },
    { type: 'range', id: 'accent_l', label: 'Luminosidad (L%)', min: 0, max: 100, step: 1, default: 46 },
    { type: 'header', content: 'Fondo modo oscuro' },
    { type: 'range', id: 'bg_dark_h', label: 'Matiz fondo oscuro (H)', min: 0, max: 360, step: 1, default: 0 },
    { type: 'range', id: 'bg_dark_s', label: 'Saturación fondo oscuro (S%)', min: 0, max: 100, step: 1, default: 0 },
    { type: 'range', id: 'bg_dark_l', label: 'Luminosidad fondo oscuro (L%)', min: 0, max: 100, step: 1, default: 3 },
    { type: 'header', content: 'Fondo modo claro' },
    { type: 'range', id: 'bg_light_h', label: 'Matiz fondo claro (H)', min: 0, max: 360, step: 1, default: 35 },
    { type: 'range', id: 'bg_light_s', label: 'Saturación fondo claro (S%)', min: 0, max: 100, step: 1, default: 60 },
    { type: 'range', id: 'bg_light_l', label: 'Luminosidad fondo claro (L%)', min: 0, max: 100, step: 1, default: 97 },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const TYPOGRAPHY_SETTINGS_SCHEMA = {
  id: 'typography_settings',
  label: 'Tipografía',
  short: 'Tipografía',
  hint: 'Fuentes display y texto',
  group: 'apariencia',
  category: 'diseno',
  icon: 'Type',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  customEditor: 'typography',
  template: TYPOGRAPHY_SETTINGS_TEMPLATE,
  fields: [],
} as const satisfies SectionSchema<CmsSectionKey>;

export const SEO_DEFAULTS_SCHEMA = {
  id: 'seo_defaults',
  label: 'SEO global',
  short: 'SEO',
  hint: 'Títulos y meta',
  group: 'apariencia',
  category: 'otras',
  icon: 'Search',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: SEO_DEFAULTS_TEMPLATE,
  fields: [
    { type: 'text', id: 'default_title', label: 'Título default', default: '' },
    { type: 'text', id: 'title_template', label: 'Template de título (%s = página)', default: '' },
    { type: 'textarea', id: 'default_description', label: 'Description', bilingual: true, default: '' },
    { type: 'text', id: 'site_name', label: 'Site name (OG)', default: '' },
    { type: 'image', id: 'og_image_url', label: 'Imagen OpenGraph (redes sociales)' },
    { type: 'text', id: 'twitter_handle', label: 'Twitter handle (@...)', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CONTACT_SETTINGS_SCHEMA = {
  id: 'contact_settings',
  label: 'Contacto / WhatsApp',
  short: 'Contacto',
  hint: 'WhatsApp y contacto',
  group: 'apariencia',
  category: 'otras',
  icon: 'MessageCircle',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: CONTACT_SETTINGS_TEMPLATE,
  fields: [
    { type: 'checkbox', id: 'show_whatsapp_float', label: 'Botón flotante WhatsApp', default: true },
    { type: 'text', id: 'whatsapp_e164', label: 'WhatsApp E.164 (solo dígitos)', default: '' },
    { type: 'textarea', id: 'whatsapp_prefill', label: 'Mensaje prefill', bilingual: true, default: '' },
    { type: 'text', id: 'email', label: 'Email', default: '' },
    { type: 'text', id: 'phone_display', label: 'Teléfono (display)', default: '' },
    { type: 'textarea', id: 'address', label: 'Dirección', default: '' },
    { type: 'text', id: 'hours', label: 'Horario', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

const AUTH_BG_OPTIONS = [
  { value: 'cosmic', label: 'Cósmico' },
  { value: 'bosque_nativo', label: 'Bosque nativo' },
  { value: 'abeja_cosmos', label: 'Abeja / cosmos' },
  { value: 'dark_luxury', label: 'Dark luxury' },
] as const;

const AUTH_PARTICLE_OPTIONS = [
  { value: 'none', label: 'Sin partículas' },
  { value: 'pollen_gold', label: 'Polen dorado' },
  { value: 'mist_bosque', label: 'Niebla de bosque' },
  { value: 'cosmic_stars', label: 'Estrellas' },
] as const;

export const AUTH_SETTINGS_SCHEMA = {
  id: 'auth_settings',
  label: 'Inicio de Sesión & Registro — Apariencia',
  short: 'Login / Registro',
  hint: 'Título, subtítulo, frase de marca, fondo dinámico y orb',
  group: 'apariencia',
  category: 'diseno',
  icon: 'Lock',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: AUTH_SETTINGS_TEMPLATE,
  fields: [
    { type: 'paragraph', content: 'Login y registro de la tienda. No pongas claims sanitarios ni stack técnico en los textos.' },
    { type: 'text', id: 'hero_title', label: 'Título', bilingual: true, riskScan: RISK_COPY, default: '' },
    { type: 'text', id: 'hero_subtitle', label: 'Subtítulo', bilingual: true, riskScan: RISK_COPY, default: '' },
    { type: 'text', id: 'tagline_phrase', label: 'Frase de marca', bilingual: true, riskScan: RISK_COPY, default: '' },
    { type: 'select', id: 'background_style', label: 'Fondo', options: AUTH_BG_OPTIONS, default: 'cosmic' },
    { type: 'select', id: 'particle_effect', label: 'Partículas', options: AUTH_PARTICLE_OPTIONS, default: 'cosmic_stars' },
    { type: 'color', id: 'blur_orb_color', label: 'Color del orb (hex)', default: '#D4A017' },
    { type: 'image', id: 'background_image_url', label: 'Imagen de fondo' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Home ───────────────────────────────────────────────────────────────────

export const LANDING_LAYOUT_SCHEMA = {
  id: 'landing_layout',
  label: 'Orden del home',
  short: 'Orden',
  hint: 'Qué bloques se ven y en qué orden',
  group: 'home',
  category: 'bloques',
  icon: 'LayoutTemplate',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  customEditor: 'landing',
  template: LANDING_LAYOUT_TEMPLATE,
  fields: [],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CAMPAIGN_BANNERS_SCHEMA = {
  id: 'campaign_banners',
  label: 'Banners campaña',
  short: 'Banners',
  hint: 'Promos y campañas',
  group: 'home',
  category: 'diseno',
  icon: 'Flag',
  kind: { kind: 'items' },
  publishMode: 'auto',
  template: CAMPAIGN_BANNER_TEMPLATE,
  fields: [
    { type: 'text', id: 'title', label: 'Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'body', label: 'Cuerpo', bilingual: true, default: '' },
    { type: 'url', id: 'href', label: 'Ruta / enlace', internalOnly: true, default: '/catalogo' },
    { type: 'text', id: 'cta_label', label: 'CTA', bilingual: true, default: '' },
    {
      type: 'select',
      id: 'placement',
      label: 'Ubicación (home|catalog|global|cart)',
      options: [
        { value: 'home', label: 'Home' },
        { value: 'catalog', label: 'Catálogo' },
        { value: 'global', label: 'Global' },
        { value: 'cart', label: 'Carrito' },
      ],
      default: 'home',
    },
    { type: 'text', id: 'starts_at', label: 'Inicio (YYYY-MM-DD)', default: '' },
    { type: 'text', id: 'ends_at', label: 'Fin (YYYY-MM-DD)', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const SEASONAL_SETTINGS_SCHEMA = {
  id: 'seasonal_settings',
  label: 'Temporada',
  short: 'Temporada',
  hint: 'Mensaje y floraciones',
  group: 'home',
  category: 'otras',
  icon: 'Sun',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  customEditor: 'seasonal',
  template: SEASONAL_SETTINGS_TEMPLATE,
  fields: [],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CONSERVATION_CONTENT_SCHEMA = {
  id: 'conservation_content',
  label: 'Impacto — Contenido',
  short: 'Impacto',
  hint: 'Copy y métricas conservación',
  group: 'home',
  category: 'bloques',
  icon: 'Leaf',
  kind: { kind: 'settings' },
  publishMode: 'draft',
  template: CONSERVATION_CONTENT_TEMPLATE,
  fields: [
    { type: 'header', content: 'Cabecera' },
    { type: 'text', id: 'kicker', label: 'Kicker', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'desc', label: 'Descripción', bilingual: true, default: '' },
    { type: 'header', content: 'Estadísticas' },
    { type: 'text', id: 'stat1_label', label: 'Stat 1', bilingual: true, default: '' },
    { type: 'text', id: 'stat2_label', label: 'Stat 2', bilingual: true, default: '' },
    { type: 'text', id: 'stat3_label', label: 'Stat 3', bilingual: true, default: '' },
    { type: 'text', id: 'stat4_label', label: 'Stat 4', bilingual: true, default: '' },
    { type: 'header', content: 'Triangulación' },
    { type: 'text', id: 'tri_label', label: 'Cabecera', bilingual: true, default: '' },
    { type: 'text', id: 'tri1_label', label: 'Fuente 1 — Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'tri1_desc', label: 'Fuente 1 — Texto', bilingual: true, default: '' },
    { type: 'text', id: 'tri2_label', label: 'Fuente 2 — Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'tri2_desc', label: 'Fuente 2 — Texto', bilingual: true, default: '' },
    { type: 'text', id: 'tri3_label', label: 'Fuente 3 — Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'tri3_desc', label: 'Fuente 3 — Texto', bilingual: true, default: '' },
    { type: 'header', content: 'IRR' },
    { type: 'text', id: 'irr_label', label: 'Etiqueta IRR', bilingual: true, default: '' },
    { type: 'text', id: 'irr_pos_title', label: 'IRR positivo — Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'irr_pos_desc', label: 'IRR positivo — Texto', bilingual: true, default: '' },
    { type: 'text', id: 'irr_neg_title', label: 'IRR negativo — Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'irr_neg_desc', label: 'IRR negativo — Texto', bilingual: true, default: '' },
    { type: 'header', content: 'CTA' },
    { type: 'text', id: 'cta_label', label: 'CTA', bilingual: true, default: '' },
    { type: 'header', content: 'Caja inferior de membresía y ciencia' },
    { type: 'textarea', id: 'box_text', label: 'Texto explicativo de la caja', bilingual: true, rows: 2, default: '' },
    { type: 'text', id: 'box_cta1_label', label: 'Botón 1 — Texto', bilingual: true, default: '' },
    { type: 'url', id: 'box_cta1_href', label: 'Botón 1 — Enlace', internalOnly: true, default: '' },
    { type: 'text', id: 'box_cta2_label', label: 'Botón 2 — Texto', bilingual: true, default: '' },
    { type: 'url', id: 'box_cta2_href', label: 'Botón 2 — Enlace', internalOnly: true, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const MEDIA_ITEMS_SCHEMA = {
  id: 'media_items',
  label: 'Carrusel media',
  short: 'Carrusel',
  hint: 'Slides, altura y encuadre del home',
  group: 'home',
  category: 'bloques',
  icon: 'GalleryHorizontalEnd',
  kind: { kind: 'pair', settingsKey: 'media_settings' },
  previewPath: '/',
  publishMode: 'draft',
  limits: { maxItems: 12 },
  template: HOME_MEDIA_ITEM_TEMPLATE,
  fields: [
    {
      type: 'select',
      id: 'type',
      label: 'Tipo',
      options: [
        { value: 'image', label: 'Imagen' },
        { value: 'video', label: 'Video' },
      ],
      default: 'image',
      control: 'segmented',
    },
    {
      // El mismo id cambia de control según visible_if: uploader vs URL.
      type: 'image',
      id: 'src',
      label: 'Imagen',
      altField: 'alt',
      visible_if: { field: 'type', equals: 'image' },
    },
    {
      type: 'url',
      id: 'src',
      label: 'URL del video (YouTube)',
      visible_if: { field: 'type', equals: 'video' },
    },
    { type: 'text', id: 'alt', label: 'Texto alternativo', default: '' },
    { type: 'text', id: 'kicker', label: 'Kicker', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Subtítulo', bilingual: true, rows: 4, default: '' },
    { type: 'text', id: 'cta_label', label: 'CTA', bilingual: true, default: '' },
    { type: 'url', id: 'cta_link', label: 'Enlace del CTA', internalOnly: true, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const MEDIA_SETTINGS_SCHEMA = {
  id: 'media_settings',
  label: 'Carrusel media — Formato',
  short: 'Formato',
  hint: 'Altura, encuadre y velocidad (vive dentro de Carrusel media)',
  group: 'home',
  category: 'bloques',
  icon: 'Film',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: MEDIA_SETTINGS_TEMPLATE,
  fields: [
    {
      type: 'select',
      id: 'carousel_height',
      label: 'Altura del Carrusel (Móvil / Escritorio)',
      options: [
        { value: '50vh/70vh', label: 'Media Estándar (50vh Móvil / 70vh Escritorio)' },
        { value: '40vh/60vh', label: 'Compacta (40vh Móvil / 60vh Escritorio)' },
        { value: '60vh/80vh', label: 'Grande (60vh Móvil / 80vh Escritorio)' },
        { value: '70vh/90vh', label: 'Inmersión Total (70vh Móvil / 90vh Escritorio)' },
      ],
      default: '50vh/70vh',
    },
    {
      type: 'select',
      id: 'image_fit',
      label: 'Modo de Encuadre de Imagen',
      options: [
        { value: 'cover', label: 'Cover (Rellenar recortando bordes sobrantes)' },
        { value: 'contain', label: 'Contain (Ajustar imagen completa sin recortar)' },
      ],
      default: 'cover',
    },
    {
      type: 'select',
      id: 'autoplay_ms',
      label: 'Velocidad de Auto-reproducción (Segundos)',
      options: [
        { value: 0, label: '0s — Desactivado (Navegación manual por flechas/gestos)' },
        { value: 2000, label: '2 segundos' },
        { value: 5000, label: '5 segundos (Recomendado)' },
        { value: 7000, label: '7 segundos' },
        { value: 10000, label: '10 segundos' },
        { value: 12000, label: '12 segundos' },
        { value: 15000, label: '15 segundos' },
      ],
      default: 5000,
    },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const VIDEO_SETTINGS_SCHEMA = {
  id: 'video_settings',
  label: 'Video central',
  short: 'Video',
  hint: 'ID de YouTube del video',
  group: 'home',
  category: 'bloques',
  icon: 'PlayCircle',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: VIDEO_SETTINGS_TEMPLATE,
  fields: [
    {
      type: 'text',
      id: 'youtube_id',
      label: 'ID de YouTube',
      info: 'ID vacío = la tienda usa el video por defecto (NEXT_PUBLIC_YOUTUBE_VIDEO_ID).',
      default: '',
    },
    { type: 'text', id: 'title', label: 'Título', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const MAP_SETTINGS_SCHEMA = {
  id: 'map_settings',
  label: 'Mapa / Lugar',
  short: 'Mapa',
  hint: 'Coordenadas y popup del origen',
  group: 'home',
  category: 'bloques',
  icon: 'MapPin',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: MAP_SETTINGS_TEMPLATE,
  fields: [
    { type: 'number', id: 'lat', label: 'Latitud', step: 0.0001, default: -43.0837 },
    { type: 'number', id: 'lng', label: 'Longitud', step: 0.0001, default: -73.6144 },
    { type: 'text', id: 'popup_title', label: 'Título del marcador', default: '' },
    { type: 'textarea', id: 'popup_body', label: 'Cuerpo del marcador', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const PRODUCTS_SETTINGS_SCHEMA = {
  id: 'products_settings',
  label: 'Creaciones — Cabecera',
  short: 'Creaciones',
  hint: 'Título y descripción de la sección',
  group: 'home',
  category: 'bloques',
  icon: 'Package',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  customEditor: 'products',
  template: PRODUCTS_SETTINGS_TEMPLATE,
  fields: [],
} as const satisfies SectionSchema<CmsSectionKey>;

export const COLLECTIONS_SETTINGS_SCHEMA = {
  id: 'collections_settings',
  label: 'Colecciones — Cabecera y grilla',
  short: 'Colecciones',
  hint: 'Título del bloque, columnas y encuadre de las fotos',
  group: 'home',
  category: 'bloques',
  icon: 'Layers',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: COLLECTIONS_SETTINGS_TEMPLATE,
  fields: [
    { type: 'text', id: 'kicker', label: 'Kicker', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Subtítulo / Descripción', bilingual: true, default: '' },
    { type: 'select', id: 'image_aspect_ratio', label: 'Relación de Aspecto de Imagen', options: ASPECT_OPTIONS, default: '4/3' },
    { type: 'select', id: 'image_fit', label: 'Modo de Encuadre (Fit)', options: FIT_OPTIONS, default: 'cover' },
    { type: 'select', id: 'grid_columns', label: 'Columnas del Grid (Escritorio)', options: GRID_COLUMNS_OPTIONS, default: '3', valueType: 'number' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const IDENTIDAD_SETTINGS_SCHEMA = {
  id: 'identidad_settings',
  label: 'Identidad territorial',
  short: 'Identidad',
  hint: 'Bloque Hecho en Chiloé bajo el hero',
  group: 'home',
  category: 'bloques',
  icon: 'Leaf',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: IDENTIDAD_SETTINGS_TEMPLATE,
  fields: [
    { type: 'text', id: 'kicker', label: 'Kicker', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'desc', label: 'Descripción superior', bilingual: true, default: '' },
    { type: 'textarea', id: 'body', label: 'Descripción inferior', bilingual: true, default: '' },
    { type: 'image', id: 'image', label: 'Imagen' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CLUB_LEGADO_SETTINGS_SCHEMA = {
  id: 'club_legado_settings',
  label: 'Club Legado del Bosque',
  short: 'Club Legado',
  hint: 'Título, bajada y botón de membresía en el home',
  group: 'home',
  category: 'bloques',
  icon: 'Sparkles',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/',
  template: CLUB_LEGADO_SETTINGS_TEMPLATE,
  fields: [
    { type: 'header', content: 'Cabecera' },
    { type: 'text', id: 'kicker', label: 'Kicker', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Bajada / Descripción', bilingual: true, rows: 3, default: '' },
    { type: 'header', content: 'Llamada a la acción (CTA)' },
    { type: 'text', id: 'button_text', label: 'Texto del botón', bilingual: true, default: '' },
    { type: 'url', id: 'button_href', label: 'Enlace del botón', internalOnly: true, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CLUB_PAGE_SETTINGS_SCHEMA = {
  id: 'club_page_settings',
  label: 'Página Club Legado del Bosque',
  short: 'Club Legado',
  hint: 'Copy editorial, 4 pasos y custodia de /club-legado-del-bosque',
  group: 'contenido',
  category: 'bloques',
  icon: 'Sparkles',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/club-legado-del-bosque',
  template: CLUB_PAGE_SETTINGS_TEMPLATE,
  fields: [
    { type: 'header', content: 'Hero de la página' },
    { type: 'text', id: 'hero_title', label: 'Título principal', bilingual: true, default: '' },
    { type: 'textarea', id: 'hero_subtitle', label: 'Subtítulo', bilingual: true, rows: 3, default: '' },
    { type: 'header', content: 'Proceso de membresía (4 pasos)' },
    { type: 'text', id: 'how_it_works_title', label: 'Título de la sección', bilingual: true, default: '' },
    { type: 'textarea', id: 'step1_text', label: 'Paso 1: Acreditación', bilingual: true, rows: 2, default: '' },
    { type: 'textarea', id: 'step2_text', label: 'Paso 2: Elección de plan', bilingual: true, rows: 2, default: '' },
    { type: 'textarea', id: 'step3_text', label: 'Paso 3: Ventana de recolección', bilingual: true, rows: 2, default: '' },
    { type: 'textarea', id: 'step4_text', label: 'Paso 4: Activación', bilingual: true, rows: 2, default: '' },
    { type: 'header', content: 'Custodia Territorial Activa' },
    { type: 'text', id: 'custodia_badge', label: 'Insignia superior', bilingual: true, default: '' },
    { type: 'text', id: 'custodia_title', label: 'Título de custodia', bilingual: true, default: '' },
    { type: 'textarea', id: 'custodia_text', label: 'Texto explicativo', bilingual: true, rows: 3, default: '' },
    { type: 'header', content: 'Niveles de Custodia & Guardianes' },
    { type: 'text', id: 'tiers_title', label: 'Título niveles de custodia', bilingual: true, default: '' },
    { type: 'textarea', id: 'tiers_subtitle', label: 'Subtítulo niveles', bilingual: true, rows: 2, default: '' },
    { type: 'header', content: 'Pase Digital & Economía Circular' },
    { type: 'text', id: 'wallet_title', label: 'Título pase digital', bilingual: true, default: '' },
    { type: 'textarea', id: 'wallet_text', label: 'Descripción pase wallet', bilingual: true, rows: 2, default: '' },
    { type: 'text', id: 'retorno_title', label: 'Título retorno de frascos', bilingual: true, default: '' },
    { type: 'textarea', id: 'retorno_text', label: 'Descripción retorno frascos', bilingual: true, rows: 2, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const GALERIA_SETTINGS_SCHEMA = {
  id: 'galeria_settings',
  label: 'Galería — Formato y Cabecera',
  short: 'Galería',
  hint: 'Título, relación de aspecto y formato de fotos',
  group: 'contenido',
  category: 'bloques',
  icon: 'Images',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: GALERIA_SETTINGS_TEMPLATE,
  fields: [
    { type: 'text', id: 'kicker', label: 'Kicker', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título de la Página', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Descripción / Subtítulo', bilingual: true, default: '' },
    { type: 'select', id: 'image_aspect_ratio', label: 'Relación de Aspecto de Imagen', options: ASPECT_OPTIONS, default: '4/3' },
    { type: 'select', id: 'image_fit', label: 'Modo de Encuadre (Fit)', options: FIT_OPTIONS, default: 'cover' },
    { type: 'select', id: 'grid_columns', label: 'Columnas de la Grilla (Escritorio)', options: GRID_COLUMNS_OPTIONS, default: '3', valueType: 'number' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const NOSOTROS_SETTINGS_SCHEMA = {
  id: 'nosotros_settings',
  label: 'Nosotros — Foto y Cabecera',
  short: 'Nosotros',
  hint: 'Título, aspecto de foto hero y encuadre',
  group: 'contenido',
  category: 'bloques',
  icon: 'BookOpen',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: NOSOTROS_SETTINGS_TEMPLATE,
  fields: [
    {
      type: 'paragraph',
      content:
        'Foto y cabecera. La historia larga vive en Nosotros (fichas). Cuerpo vacío ahí = texto del código. No pegar claims de salud ni stack técnico.',
    },
    { type: 'text', id: 'kicker', label: 'Kicker', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título de la Página', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Descripción / Subtítulo', bilingual: true, default: '' },
    { type: 'select', id: 'image_aspect_ratio', label: 'Relación de Aspecto de Imagen', options: ASPECT_OPTIONS, default: '16/9' },
    { type: 'select', id: 'image_fit', label: 'Modo de Encuadre (Fit)', options: FIT_OPTIONS, default: 'cover' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CIENCIA_SETTINGS_SCHEMA = {
  id: 'ciencia_settings',
  label: 'Ciencia — Cabecera',
  short: 'Ciencia',
  hint: 'Título, kicker y subtítulo de la página',
  group: 'contenido',
  category: 'bloques',
  icon: 'Sparkles',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: CIENCIA_SETTINGS_TEMPLATE,
  fields: [
    {
      type: 'paragraph',
      content:
        'Solo cabecera. Los bloques de evidencia se editan en Ciencia — Evidencia. Sin claims médicos ni “sustituye azúcar”.',
    },
    { type: 'text', id: 'kicker', label: 'Kicker', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título de la Página', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Descripción / Subtítulo', bilingual: true, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Tienda ─────────────────────────────────────────────────────────────────

export const CATALOG_SETTINGS_SCHEMA = {
  id: 'catalog_settings',
  label: 'Catálogo',
  short: 'Catálogo',
  hint: 'Grilla y filtros',
  group: 'tienda',
  category: 'diseno',
  icon: 'LayoutGrid',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/catalogo',
  template: CATALOG_SETTINGS_TEMPLATE,
  fields: [
    { type: 'text', id: 'page_title', label: 'Título', bilingual: true, default: '' },
    { type: 'textarea', id: 'page_subtitle', label: 'Subtítulo', bilingual: true, default: '' },
    { type: 'range', id: 'columns_desktop', label: 'Columnas desktop', min: 2, max: 4, step: 1, default: 3 },
    { type: 'range', id: 'columns_mobile', label: 'Columnas móvil', min: 1, max: 2, step: 1, default: 2 },
    {
      type: 'select',
      id: 'default_sort',
      label: 'Orden por defecto',
      options: [
        { value: 'default', label: 'Destacados' },
        { value: 'newest', label: 'Recién Cosechados' },
        { value: 'price-asc', label: 'Precio: menor a mayor' },
        { value: 'price-desc', label: 'Precio: mayor a menor' },
        { value: 'name', label: 'Nombre (A - Z)' },
        { value: 'impacto', label: 'Mayor impacto ecológico' },
      ],
      default: 'default',
    },
    { type: 'checkbox', id: 'show_search', label: 'Búsqueda de productos', default: true },
    { type: 'checkbox', id: 'show_filters', label: 'Barra de filtros activa', default: true },
    { type: 'checkbox', id: 'show_formats_filter', label: 'Filtros de Formato (envases/gramajes)', default: true },
    { type: 'checkbox', id: 'show_categories_filter', label: 'Filtros de Categoría', default: true },
    { type: 'checkbox', id: 'show_stock_filter', label: 'Filtro "En stock"', default: true },
    { type: 'checkbox', id: 'show_impact_filter', label: 'Filtro "Alto impacto" (IRR/Regenerativo)', default: false },
    { type: 'checkbox', id: 'sticky_bar', label: 'Fijar barra de filtros al scrollear (sticky)', default: false },
    { type: 'checkbox', id: 'show_ratings', label: 'Ratings y reseñas', default: true },
    { type: 'checkbox', id: 'show_badges', label: 'Badges ecológicos y de lote', default: true },
    { type: 'text', id: 'empty_message', label: 'Mensaje vacío', bilingual: true, default: '' },
    {
      type: 'select',
      id: 'image_aspect_ratio',
      label: 'Relación de Aspecto (Productos)',
      options: [
        { value: '1/1', label: '1:1 Cuadrado (Predeterminado)' },
        { value: '4/3', label: '4:3 Horizontal' },
        { value: '3/4', label: '3:4 Vertical / Retrato' },
        { value: '16/10', label: '16:10 Panorámico' },
        { value: 'auto', label: 'Auto (Original)' },
      ],
      default: '1/1',
    },
    { type: 'select', id: 'image_fit', label: 'Modo de Encuadre (Productos)', options: FIT_OPTIONS, default: 'cover' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const PDP_SETTINGS_SCHEMA = {
  id: 'pdp_settings',
  label: 'Ficha producto',
  short: 'PDP',
  hint: 'Página de producto',
  group: 'tienda',
  category: 'diseno',
  icon: 'Package',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/catalogo',
  template: PDP_SETTINGS_TEMPLATE,
  fields: [
    { type: 'checkbox', id: 'show_breadcrumb', label: 'Breadcrumb', default: true },
    { type: 'checkbox', id: 'show_format_badge', label: 'Badge de formato', default: true },
    { type: 'checkbox', id: 'show_badges', label: 'Badges de impacto', default: true },
    { type: 'checkbox', id: 'show_traceability', label: 'Trazabilidad QR', default: true },
    { type: 'checkbox', id: 'show_sensory_profile', label: 'Perfil Sensorial de Cata (organoléptico)', default: true },
    { type: 'checkbox', id: 'show_reviews', label: 'Reseñas', default: true },
    {
      type: 'checkbox',
      id: 'show_replenishment',
      label: 'Reposición / suscripción en CTA',
      info: 'El bloque de compra puede ocultar ritual si se desactiva en purchase actions (flag base).',
      default: true,
    },
    { type: 'text', id: 'continue_label', label: 'Link seguir explorando', bilingual: true, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CHECKOUT_SETTINGS_SCHEMA = {
  id: 'checkout_settings',
  label: 'Checkout — Copy',
  short: 'Checkout',
  hint: 'Textos del checkout (envío, couriers, seguridad)',
  group: 'tienda',
  category: 'otras',
  icon: 'CreditCard',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: CHECKOUT_SETTINGS_TEMPLATE,
  fields: [
    { type: 'paragraph', content: 'Copy del checkout. La línea “Incluye IVA” del total es fija en el código.' },
    { type: 'text', id: 'title', label: 'Título', default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Subtítulo', default: '' },
    { type: 'text', id: 'buyer_private_label', label: 'Compra privada — Título', default: '' },
    { type: 'textarea', id: 'buyer_private_desc', label: 'Compra privada — Texto', default: '' },
    { type: 'text', id: 'buyer_legacy_label', label: 'Compra legado — Título', default: '' },
    { type: 'textarea', id: 'buyer_legacy_desc', label: 'Compra legado — Texto', default: '' },
    { type: 'text', id: 'shipping_title', label: 'Envío — Título de sección', default: '' },
    { type: 'text', id: 'courier_label', label: 'Envío — Label del courier', default: '' },
    { type: 'textarea', id: 'shipping_note', label: 'Envío — Nota (predeterminado)', default: '' },
    { type: 'text', id: 'postal_label', label: 'Código postal — Label', default: '' },
    { type: 'text', id: 'secure_payment_text', label: 'Seguridad — Pago encriptado', default: '' },
    { type: 'text', id: 'secure_transaction_text', label: 'Seguridad — Transacción segura', default: '' },
    { type: 'text', id: 'terms_prefix', label: 'Términos — Prefijo (antes del link)', default: '' },
    { type: 'textarea', id: 'secure_note', label: 'Términos — Nota de seguridad (después del link)', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CART_SETTINGS_SCHEMA = {
  id: 'cart_settings',
  label: 'Carrito — Configuración',
  short: 'Carrito',
  hint: 'Despacho gratis y textos del carrito',
  group: 'tienda',
  category: 'otras',
  icon: 'ShoppingCart',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  template: CART_SETTINGS_TEMPLATE,
  fields: [
    { type: 'checkbox', id: 'free_shipping_enabled', label: 'Despacho gratis activo', default: true },
    { type: 'number', id: 'free_shipping_threshold_clp', label: 'Umbral despacho gratis (CLP)', default: 45000, step: 1000 },
    { type: 'text', id: 'free_shipping_progress_text', label: 'Mensaje de progreso', default: 'Te faltan {amount} para despacho gratis' },
    { type: 'text', id: 'free_shipping_unlocked_text', label: 'Mensaje al desbloquear', default: '✨ ¡Tienes despacho gratis incluido!' },
    { type: 'text', id: 'empty_title', label: 'Vacío — Título', default: '' },
    { type: 'text', id: 'empty_desc', label: 'Vacío — Descripción', default: '' },
    { type: 'text', id: 'empty_cta', label: 'Vacío — CTA', default: '' },
    { type: 'text', id: 'subtotal_label', label: 'Subtotal — Label', default: '' },
    { type: 'text', id: 'shipping_note', label: 'Envío — Nota (calculado en checkout)', default: '' },
    { type: 'text', id: 'cta_label', label: 'CTA — Finalizar compra', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Contenido (fichas) ─────────────────────────────────────────────────────

export const COLECCIONES_SCHEMA = {
  id: 'colecciones',
  label: 'Colecciones',
  short: 'Colecciones',
  hint: 'Tarjetas del grid del home',
  group: 'contenido',
  category: 'bloques',
  icon: 'Layers',
  kind: { kind: 'pair', settingsKey: 'collections_settings' },
  publishMode: 'draft',
  previewPath: '/',
  template: { kicker: '', title: '', desc: '', href: '/catalogo', image: '' },
  fields: [
    { type: 'text', id: 'kicker', label: 'Kicker de la tarjeta', default: '' },
    { type: 'text', id: 'title', label: 'Título de la tarjeta', default: '' },
    { type: 'textarea', id: 'desc', label: 'Descripción de la tarjeta', default: '' },
    {
      type: 'url',
      id: 'href',
      label: 'A dónde lleva',
      internalOnly: true,
      default: '/catalogo',
      info: 'Vacío o /catalogo: busca en el catálogo por el kicker. Otra ruta se usa tal cual.',
    },
    { type: 'image', id: 'image', label: 'Foto de la tarjeta' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const TALLERES_SCHEMA = {
  id: 'talleres',
  label: 'Talleres',
  short: 'Talleres',
  hint: 'Experiencias',
  group: 'contenido',
  category: 'bloques',
  icon: 'GraduationCap',
  kind: { kind: 'items' },
  publishMode: 'draft',
  previewPath: '/experiencias',
  template: { date: '', title: '', desc: '', action: '' },
  fields: [
    { type: 'text', id: 'date', label: 'Fecha', default: '' },
    { type: 'text', id: 'title', label: 'Título', default: '' },
    { type: 'textarea', id: 'desc', label: 'Descripción', default: '' },
    { type: 'text', id: 'action', label: 'Acción', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const NOSOTROS_SCHEMA = {
  id: 'nosotros',
  label: 'Nosotros',
  short: 'Nosotros',
  hint: 'Historia CMS pisa el texto del código',
  group: 'contenido',
  category: 'bloques',
  icon: 'Users',
  kind: { kind: 'items' },
  publishMode: 'draft',
  previewPath: '/nosotros',
  template: {
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
  fields: [
    { type: 'text', id: 'title', label: 'Título', default: '' },
    { type: 'textarea', id: 'desc', label: 'Descripción', default: '' },
    { type: 'image', id: 'image', label: 'Imagen' },
    { type: 'textarea', id: 'historia', label: 'Historia', rows: 6, riskScan: RISK_COPY, default: '' },
    { type: 'textarea', id: 'mision', label: 'Misión', rows: 4, riskScan: RISK_COPY, default: '' },
    { type: 'textarea', id: 'vision', label: 'Visión', rows: 4, riskScan: RISK_COPY, default: '' },
    { type: 'text', id: 'stat1_label', label: 'Métrica 1 — Etiqueta', default: '' },
    { type: 'text', id: 'stat1_value', label: 'Métrica 1 — Valor', default: '' },
    { type: 'text', id: 'stat2_label', label: 'Métrica 2 — Etiqueta', default: '' },
    { type: 'text', id: 'stat2_value', label: 'Métrica 2 — Valor', default: '' },
    { type: 'text', id: 'stat3_label', label: 'Métrica 3 — Etiqueta', default: '' },
    { type: 'text', id: 'stat3_value', label: 'Métrica 3 — Valor', default: '' },
    { type: 'text', id: 'stat4_label', label: 'Métrica 4 — Etiqueta', default: '' },
    { type: 'text', id: 'stat4_value', label: 'Métrica 4 — Valor', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const GALERIA_SCHEMA = {
  id: 'galeria',
  label: 'Galería',
  short: 'Galería',
  hint: 'Fotos de la página + formato',
  group: 'contenido',
  category: 'bloques',
  icon: 'Images',
  kind: { kind: 'items' },
  publishMode: 'draft',
  previewPath: '/galeria',
  template: { titulo: '', descripcion: '', url: '' },
  fields: [
    { type: 'text', id: 'titulo', label: 'Título', default: '' },
    { type: 'textarea', id: 'descripcion', label: 'Descripción', default: '' },
    { type: 'image', id: 'url', label: 'Imagen' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CONTACTO_SCHEMA = {
  id: 'contacto',
  label: 'Contacto',
  short: 'Contacto',
  hint: 'Página /contacto y WhatsApp (formato arriba)',
  group: 'contenido',
  category: 'bloques',
  icon: 'Mail',
  kind: { kind: 'pair', settingsKey: 'contact_settings' },
  publishMode: 'draft',
  previewPath: '/contacto',
  template: { title: '', desc: '' },
  fields: [
    { type: 'text', id: 'title', label: 'Título', default: '' },
    { type: 'textarea', id: 'desc', label: 'Descripción', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const CIENCIA_SCHEMA = {
  id: 'ciencia',
  label: 'Ciencia — Evidencia',
  short: 'Ciencia',
  hint: 'Sin claims médicos · origen y sabor',
  group: 'contenido',
  category: 'bloques',
  icon: 'Microscope',
  kind: { kind: 'items' },
  publishMode: 'draft',
  previewPath: '/ciencia',
  template: { categoria: '', titulo: '', texto: '', fuente: '' },
  fields: [
    { type: 'text', id: 'categoria', label: 'Categoría', default: '' },
    { type: 'text', id: 'titulo', label: 'Título', default: '' },
    { type: 'textarea', id: 'texto', label: 'Texto', rows: 6, riskScan: RISK_COPY, default: '' },
    { type: 'text', id: 'fuente', label: 'Fuente', default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const RESERVA_ANUAL_SCHEMA = {
  id: 'reserva_anual',
  label: 'Reserva Anual',
  short: 'Reserva Anual',
  hint: 'Campaña, textos y producto de reserva anual',
  group: 'contenido',
  category: 'otras',
  icon: 'Calendar',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/perfil/reservas',
  template: RESERVA_ANUAL_TEMPLATE,
  fields: [
    { type: 'checkbox', id: 'enabled', label: 'Campaña activa', default: true },
    { type: 'header', content: 'Textos Principales' },
    { type: 'text', id: 'title', label: 'Título', bilingual: true, default: 'Reserva Anual' },
    { type: 'text', id: 'subtitle', label: 'Subtítulo', bilingual: true, default: 'Asegura tu parte del legado antes de que la naturaleza lo entregue' },
    { type: 'textarea', id: 'description', label: 'Descripción / Condiciones', bilingual: true, default: 'Reserva anticipada vinculada a recolección de temporada. Te contactaremos para confirmar despacho y liquidación.' },
    { type: 'header', content: 'Producto & Acción' },
    { type: 'text', id: 'featured_product_id', label: 'ID Producto Destacado (opcional)', default: '' },
    { type: 'text', id: 'button_text', label: 'Texto del Botón', bilingual: true, default: 'Garantizar Mi Cupo' },
    { type: 'checkbox', id: 'allow_prepayment', label: 'Habilitar pago anticipado inmediato (Checkout)', default: false },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Alianzas B2B ───────────────────────────────────────────────────────────

function createB2BSegmentSchema(
  id: CmsSectionKey,
  label: string,
  short: string,
  hint: string,
  previewPath: string,
  template: Readonly<Record<string, unknown>>,
): SectionSchema<CmsSectionKey> {
  return {
    id,
    label,
    short,
    hint,
    group: 'b2b',
    category: 'bloques',
    icon: 'Handshake',
    kind: { kind: 'settings' },
    publishMode: 'auto',
    previewPath,
    template,
    fields: [
      { type: 'header', content: 'Portada' },
      { type: 'text', id: 'kicker', label: 'Etiqueta superior', bilingual: true, default: '' },
      { type: 'text', id: 'headline', label: 'Título', bilingual: true, default: '' },
      { type: 'textarea', id: 'subheadline', label: 'Bajada', bilingual: true, rows: 3, default: '' },
      { type: 'image', id: 'hero_image', label: 'Imagen de portada' },
      { type: 'header', content: 'Botón' },
      { type: 'text', id: 'cta_text', label: 'Texto del botón', bilingual: true, default: '' },
      { type: 'url', id: 'cta_href', label: 'Enlace del botón', default: '/contacto', internalOnly: true },
      { type: 'header', content: 'Formatos que ofreces' },
      { type: 'textarea', id: 'suggested_products_copy', label: 'Texto de formatos', bilingual: true, rows: 3, default: '' },
      {
        type: 'list',
        id: 'value_props',
        label: 'Por qué te eligen',
        itemLabel: 'Propuesta',
        max: 8,
        itemFields: [
          { id: 'icon', label: 'Icono (opcional)', type: 'text', default: 'Package' },
          { id: 'title', label: 'Título', type: 'text', bilingual: true },
          { id: 'description', label: 'Texto', type: 'textarea', bilingual: true, rows: 3 },
        ],
      },
      {
        type: 'list',
        id: 'stats',
        label: 'Cifras',
        itemLabel: 'Dato',
        max: 6,
        itemFields: [
          { id: 'value', label: 'Cifra', type: 'text' },
          { id: 'label', label: 'Qué significa', type: 'text', bilingual: true },
        ],
      },
      {
        type: 'list',
        id: 'process',
        label: 'Cómo trabajamos',
        itemLabel: 'Paso',
        max: 8,
        itemFields: [
          { id: 'step', label: 'Número (01, 02…)', type: 'text' },
          { id: 'title', label: 'Título', type: 'text', bilingual: true },
          { id: 'desc', label: 'Texto', type: 'textarea', bilingual: true, rows: 3 },
        ],
      },
      {
        type: 'list',
        id: 'faq',
        label: 'Preguntas frecuentes',
        itemLabel: 'Pregunta',
        max: 8,
        itemFields: [
          { id: 'question', label: 'Pregunta', type: 'text', bilingual: true },
          { id: 'answer', label: 'Respuesta', type: 'textarea', bilingual: true, rows: 3 },
        ],
      },
      { type: 'header', content: 'Buscadores (SEO)' },
      { type: 'text', id: 'seo_title', label: 'Título SEO', bilingual: true, default: '' },
      { type: 'textarea', id: 'seo_description', label: 'Descripción SEO', bilingual: true, rows: 2, default: '' },
    ],
  };
}

export const B2B_CAFETERIAS_SCHEMA = createB2BSegmentSchema(
  'b2b_cafeterias',
  'B2B — Cafeterías & Tostadurías',
  'Cafeterías',
  'Propuesta de valor y formatos para cafeterías (/para/cafeterias)',
  '/para/cafeterias',
  B2B_CAFETERIAS_TEMPLATE,
);

export const B2B_HOTELES_SCHEMA = createB2BSegmentSchema(
  'b2b_hoteles',
  'B2B — Hotelería Boutique & Lodges',
  'Hoteles',
  'Experiencia austral y amenidades para hoteles (/para/hoteles)',
  '/para/hoteles',
  B2B_HOTELES_TEMPLATE,
);

export const B2B_TIENDAS_GOURMET_SCHEMA = createB2BSegmentSchema(
  'b2b_tiendas_gourmet',
  'B2B — Tiendas Gourmet & Emporios',
  'Tiendas Gourmet',
  'Catálogo y márgenes para tiendas gourmet (/para/tiendas-gourmet)',
  '/para/tiendas-gourmet',
  B2B_TIENDAS_GOURMET_TEMPLATE,
);

export const B2B_FERIAS_SCHEMA = createB2BSegmentSchema(
  'b2b_ferias',
  'B2B — Mercados & Ferias Gourmet',
  'Ferias',
  'Formatos y degustación para ferias (/para/ferias)',
  '/para/ferias',
  B2B_FERIAS_TEMPLATE,
);

export const B2B_REVENDEDORES_SCHEMA = createB2BSegmentSchema(
  'b2b_revendedores',
  'B2B — Red de Revendedores',
  'Revendedores',
  'Distribución territorial y herramientas (/para/revendedores)',
  '/para/revendedores',
  B2B_REVENDEDORES_TEMPLATE,
);

export const B2B_HUB_SETTINGS_SCHEMA = {
  id: 'b2b_hub_settings',
  label: 'B2B — Portal Matriz & Alianzas',
  short: 'Hub Alianzas',
  hint: 'Cabecera, propuesta de valor y garantías mayoristas (/para)',
  group: 'contenido',
  category: 'bloques',
  icon: 'Store',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/para',
  template: B2B_HUB_SETTINGS_TEMPLATE,
  fields: [
    { type: 'header', content: 'Hero Principal' },
    { type: 'text', id: 'hero_kicker', label: 'Kicker superior', bilingual: true, default: '' },
    { type: 'text', id: 'hero_title', label: 'Título principal', bilingual: true, default: '' },
    { type: 'textarea', id: 'hero_subtitle', label: 'Bajada descriptiva', bilingual: true, rows: 3, default: '' },
    { type: 'image', id: 'hero_image', label: 'Imagen editorial de cabecera' },
    { type: 'text', id: 'cta_label', label: 'Texto botón de contacto', bilingual: true, default: '' },
    { type: 'url', id: 'cta_href', label: 'Enlace botón de contacto', default: '', internalOnly: true },
    { type: 'header', content: 'Garantías del Canal Directo' },
    { type: 'text', id: 'garantias_kicker', label: 'Kicker garantías', bilingual: true, default: '' },
    { type: 'text', id: 'garantias_title', label: 'Título garantías', bilingual: true, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Biblioteca Botánica, Experiencias & QR ──────────────────────────────────

export const ORIGEN_SETTINGS_SCHEMA = {
  id: 'origen_settings',
  label: 'Origen & Floraciones — Cabecera',
  short: 'Origen',
  hint: 'Título, antetítulo y descripción de la biblioteca botánica (/origen)',
  group: 'contenido',
  category: 'bloques',
  icon: 'Leaf',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/origen',
  template: ORIGEN_SETTINGS_TEMPLATE,
  fields: [
    { type: 'text', id: 'kicker', label: 'Kicker / Antetítulo', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título principal', bilingual: true, default: '' },
    { type: 'textarea', id: 'description', label: 'Descripción de la biblioteca', bilingual: true, rows: 3, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const ORIGEN_MONOGRAFIAS_SCHEMA = {
  id: 'origen_monografias',
  label: 'Monografías Botánicas',
  short: 'Monografías',
  hint: 'Fichas científicas de especies melíferas del bosque (/origen/ulmo)',
  group: 'contenido',
  category: 'bloques',
  icon: 'BookOpen',
  kind: { kind: 'items' },
  publishMode: 'draft',
  previewPath: '/origen/ulmo',
  template: BOTANICAL_MONOGRAPH_TEMPLATE,
  fields: [
    { type: 'header', content: 'Identificación Botánica' },
    { type: 'text', id: 'slug', label: 'Slug / Identificador (ej: ulmo)', default: '' },
    { type: 'text', id: 'common_name', label: 'Nombre común', bilingual: true, default: '' },
    { type: 'text', id: 'scientific_name', label: 'Nombre científico', default: '' },
    { type: 'image', id: 'image_url', label: 'Imagen botánica de la especie' },
    { type: 'header', content: 'Descripciones y Fenología' },
    { type: 'textarea', id: 'short_description', label: 'Descripción breve (resumen en tarjeta)', bilingual: true, rows: 2, default: '' },
    { type: 'textarea', id: 'full_description', label: 'Descripción botánica completa', bilingual: true, rows: 4, default: '' },
    { type: 'textarea', id: 'sensory_profile', label: 'Perfil organoléptico y sensorial', bilingual: true, rows: 3, default: '' },
    { type: 'text', id: 'flowering_period', label: 'Período de floración', bilingual: true, default: '' },
    { type: 'textarea', id: 'ecology', label: 'Ecología y conservación del dosel', bilingual: true, rows: 3, default: '' },
    { type: 'textarea', id: 'references', label: 'Fuentes científicas y bibliografía', rows: 2, default: '' },
    { type: 'header', content: 'Preguntas frecuentes' },
    {
      type: 'list',
      id: 'faqs',
      label: 'FAQ de la especie',
      itemLabel: 'Pregunta',
      max: 8,
      itemFields: [
        { id: 'question', label: 'Pregunta', type: 'text', bilingual: true },
        { id: 'answer', label: 'Respuesta', type: 'textarea', bilingual: true, rows: 3 },
      ],
    },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const EXPERIENCIAS_SETTINGS_SCHEMA = {
  id: 'experiencias_settings',
  label: 'Experiencias Bioculturales — Cabecera',
  short: 'Experiencias',
  hint: 'Hero y tarjeta de sesión insignia (/experiencias)',
  group: 'contenido',
  category: 'bloques',
  icon: 'GraduationCap',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/experiencias',
  template: EXPERIENCIAS_SETTINGS_TEMPLATE,
  fields: [
    { type: 'header', content: 'Hero de la página' },
    { type: 'text', id: 'hero_kicker', label: 'Kicker superior', bilingual: true, default: '' },
    { type: 'text', id: 'hero_title', label: 'Título principal', bilingual: true, default: '' },
    { type: 'textarea', id: 'hero_subtitle', label: 'Bajada descriptiva', bilingual: true, rows: 2, default: '' },
    { type: 'image', id: 'hero_image', label: 'Imagen editorial de fondo' },
    { type: 'text', id: 'hero_cta_label', label: 'Texto botón insignia', bilingual: true, default: '' },
    { type: 'url', id: 'hero_cta_href', label: 'Enlace botón insignia', default: '/experiencias/floraciones', internalOnly: true },
    { type: 'text', id: 'hero_secondary_label', label: 'Texto botón secundario', bilingual: true, default: '' },
    { type: 'url', id: 'hero_secondary_href', label: 'Enlace botón secundario', default: '#solicitud', internalOnly: true },
    { type: 'header', content: 'Tarjeta Sesión Insignia' },
    { type: 'text', id: 'flagship_badge', label: 'Insignia superior', bilingual: true, default: '' },
    { type: 'text', id: 'flagship_title', label: 'Título de la experiencia', bilingual: true, default: '' },
    { type: 'textarea', id: 'flagship_desc', label: 'Descripción del relato', bilingual: true, rows: 2, default: '' },
    { type: 'text', id: 'flagship_cta_label', label: 'Texto del botón', bilingual: true, default: '' },
    { type: 'url', id: 'flagship_href', label: 'Enlace al detalle', default: '/experiencias/floraciones', internalOnly: true },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const FLORACIONES_EXPERIENCE_SETTINGS_SCHEMA = {
  id: 'floraciones_experience_settings',
  label: 'Experiencia Insignia: Floraciones',
  short: 'Cata Floraciones',
  hint: 'Cata sensorial, facilitadora, movimientos y protocolo (/experiencias/floraciones)',
  group: 'contenido',
  category: 'bloques',
  icon: 'Sparkles',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/experiencias/floraciones',
  template: FLORACIONES_EXPERIENCE_TEMPLATE,
  fields: [
    { type: 'header', content: 'Hero & Encabezado' },
    { type: 'text', id: 'kicker', label: 'Kicker superior', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título de la experiencia', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Bajada descriptiva', bilingual: true, rows: 2, default: '' },
    { type: 'text', id: 'edition_note', label: 'Nota de edición de temporada', bilingual: true, default: '' },
    { type: 'image', id: 'hero_image', label: 'Imagen editorial' },
    { type: 'header', content: 'Biografía de Facilitadora' },
    { type: 'text', id: 'bio_name', label: 'Nombre de facilitadora', default: '' },
    { type: 'text', id: 'bio_location', label: 'Ubicación territorial', default: '' },
    { type: 'number', id: 'bio_trajectory_years', label: 'Años de oficio continuo', default: 19 },
    {
      type: 'string_list',
      id: 'bio_paragraphs',
      label: 'Relato de oficio',
      itemLabel: 'Párrafo',
      max: 8,
      rows: 4,
    },
    {
      type: 'list',
      id: 'bio_metrics',
      label: 'Cifras de contexto',
      itemLabel: 'Dato',
      max: 6,
      itemFields: [
        { id: 'value', label: 'Cifra', type: 'text' },
        { id: 'label', label: 'Qué significa', type: 'text' },
      ],
    },
    { type: 'header', content: 'Movimientos de la sesión' },
    {
      type: 'list',
      id: 'movements',
      label: 'Secuencia',
      itemLabel: 'Movimiento',
      max: 8,
      itemFields: [
        { id: 'step', label: 'Número (I, II…)', type: 'text' },
        { id: 'title', label: 'Título', type: 'text', bilingual: true },
        { id: 'description', label: 'Texto', type: 'textarea', bilingual: true, rows: 3 },
        { id: 'elements', label: 'Elementos en mesa', type: 'string_list', rows: 4 },
      ],
    },
    { type: 'header', content: 'Formatos de encuentro' },
    {
      type: 'list',
      id: 'formats',
      label: 'Modalidades',
      itemLabel: 'Formato',
      max: 6,
      itemFields: [
        { id: 'id', label: 'Identificador (corporativo, intimo…)', type: 'text' },
        { id: 'kicker', label: 'Etiqueta', type: 'text', bilingual: true },
        { id: 'title', label: 'Título', type: 'text', bilingual: true },
        { id: 'capacity', label: 'Cupo', type: 'text' },
        { id: 'duration', label: 'Duración', type: 'text' },
        { id: 'context', label: 'Dónde', type: 'textarea', rows: 2 },
        { id: 'summary', label: 'Resumen', type: 'textarea', rows: 3 },
        { id: 'includes', label: 'Incluye', type: 'string_list', rows: 5 },
      ],
    },
    { type: 'header', content: 'Protocolo de Adquisición Diferida' },
    { type: 'text', id: 'protocol_headline', label: 'Titular del protocolo', default: '' },
    { type: 'textarea', id: 'protocol_description', label: 'Descripción del protocolo', rows: 2, default: '' },
    { type: 'text', id: 'protocol_artifact', label: 'Artefacto físico entregado', default: '' },
    { type: 'header', content: 'Preguntas frecuentes' },
    {
      type: 'list',
      id: 'faq',
      label: 'FAQ',
      itemLabel: 'Pregunta',
      max: 8,
      itemFields: [
        { id: 'question', label: 'Pregunta', type: 'text', bilingual: true },
        { id: 'answer', label: 'Respuesta', type: 'textarea', bilingual: true, rows: 3 },
      ],
    },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const EXPERIENCIAS_PUREO_SETTINGS_SCHEMA = {
  id: 'experiencias_pureo_settings',
  label: 'Experiencias — Estancia Predio Pureo',
  short: 'Estancia Pureo',
  hint: 'Cabaña, kayak en esteros y apiturismo de inmersión (/experiencias/pureo)',
  group: 'contenido',
  category: 'bloques',
  icon: 'Compass',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/experiencias/pureo',
  template: EXPERIENCIAS_PUREO_SETTINGS_TEMPLATE,
  fields: [
    { type: 'header', content: 'Hero & Encabezado' },
    { type: 'text', id: 'kicker', label: 'Kicker superior', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título de la estancia', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Bajada descriptiva', bilingual: true, rows: 3, default: '' },
    { type: 'image', id: 'hero_image', label: 'Imagen editorial de estancia' },
    { type: 'header', content: 'Refugio & Cabaña Nativa' },
    { type: 'text', id: 'cabana_title', label: 'Título cabaña', bilingual: true, default: '' },
    { type: 'textarea', id: 'cabana_desc', label: 'Descripción cabaña', bilingual: true, rows: 3, default: '' },
    { type: 'header', content: 'Navegación & Kayak en Esteros' },
    { type: 'text', id: 'kayak_title', label: 'Título kayak', bilingual: true, default: '' },
    { type: 'textarea', id: 'kayak_desc', label: 'Descripción kayak', bilingual: true, rows: 3, default: '' },
    { type: 'header', content: 'Apiturismo & Ronda de Colmenas' },
    { type: 'text', id: 'apiturismo_title', label: 'Título apiturismo', bilingual: true, default: '' },
    { type: 'textarea', id: 'apiturismo_desc', label: 'Descripción apiturismo', bilingual: true, rows: 3, default: '' },
    { type: 'header', content: 'Logística & Acceso Territorial' },
    { type: 'text', id: 'logistica_title', label: 'Título logística', bilingual: true, default: '' },
    { type: 'textarea', id: 'logistica_text', label: 'Detalles de acceso y estancia', bilingual: true, rows: 3, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA = {
  id: 'experiencias_talleres_settings',
  label: 'Experiencias — Talleres Bioculturales',
  short: 'Talleres',
  hint: 'Programas formativos de análisis sensorial, apicultura y botánica (/experiencias/talleres)',
  group: 'contenido',
  category: 'bloques',
  icon: 'GraduationCap',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/experiencias/talleres',
  template: EXPERIENCIAS_TALLERES_SETTINGS_TEMPLATE,
  fields: [
    { type: 'header', content: 'Hero & Encabezado' },
    { type: 'text', id: 'kicker', label: 'Kicker superior', bilingual: true, default: '' },
    { type: 'text', id: 'title', label: 'Título principal', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Bajada descriptiva', bilingual: true, rows: 3, default: '' },
    { type: 'image', id: 'hero_image', label: 'Imagen editorial de cabecera' },
    { type: 'header', content: 'Programa I: Análisis Sensorial' },
    { type: 'text', id: 'programa1_title', label: 'Título programa 1', bilingual: true, default: '' },
    { type: 'textarea', id: 'programa1_desc', label: 'Descripción programa 1', bilingual: true, rows: 3, default: '' },
    { type: 'header', content: 'Programa II: Oficio Apícola' },
    { type: 'text', id: 'programa2_title', label: 'Título programa 2', bilingual: true, default: '' },
    { type: 'textarea', id: 'programa2_desc', label: 'Descripción programa 2', bilingual: true, rows: 3, default: '' },
    { type: 'header', content: 'Programa III: Botánica Melífera' },
    { type: 'text', id: 'programa3_title', label: 'Título programa 3', bilingual: true, default: '' },
    { type: 'textarea', id: 'programa3_desc', label: 'Descripción programa 3', bilingual: true, rows: 3, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

export const QR_SCAN_SETTINGS_SCHEMA = {
  id: 'qr_scan_settings',
  label: 'Escáner de Trazabilidad QR',
  short: 'Escáner QR',
  hint: 'Textos, buscador y sellos de custodia de /qr-scan',
  group: 'tienda',
  category: 'bloques',
  icon: 'QrCode',
  kind: { kind: 'settings' },
  publishMode: 'auto',
  previewPath: '/qr-scan',
  template: QR_SCAN_SETTINGS_TEMPLATE,
  fields: [
    { type: 'header', content: 'Encabezado del Escáner' },
    { type: 'text', id: 'title', label: 'Título principal', bilingual: true, default: '' },
    { type: 'textarea', id: 'subtitle', label: 'Bajada descriptiva', bilingual: true, rows: 2, default: '' },
    { type: 'header', content: 'Buscador Manual' },
    { type: 'text', id: 'search_label', label: 'Etiqueta del buscador', bilingual: true, default: '' },
    { type: 'text', id: 'search_placeholder', label: 'Texto de sugerencia (placeholder)', default: '' },
    { type: 'text', id: 'search_button_label', label: 'Texto botón de escaneo', bilingual: true, default: '' },
    { type: 'header', content: 'Verificación de Cadena de Custodia' },
    { type: 'text', id: 'valid_title', label: 'Título autenticidad verificada', default: '' },
    { type: 'textarea', id: 'valid_desc', label: 'Descripción autenticidad verificada', rows: 2, default: '' },
    { type: 'text', id: 'invalid_title', label: 'Título no verificado o alterado', default: '' },
    { type: 'textarea', id: 'invalid_desc', label: 'Descripción no verificado o alterado', rows: 2, default: '' },
  ],
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Legal ──────────────────────────────────────────────────────────────────

const LEGAL_FIELDS = [
  { type: 'paragraph', content: 'Cuerpo vacío = texto del código. Este HTML pisa el fallback del repositorio.' },
  { type: 'text', id: 'title', label: 'Título', default: '' },
  { type: 'text', id: 'last_updated', label: 'Última actualización', info: '2026-08-14 o 14 de agosto de 2026.', default: '' },
  { type: 'textarea', id: 'body', label: 'Cuerpo (HTML)', rows: 16, riskScan: RISK_STACK, default: '' },
] as const satisfies readonly FieldSchema[];

export const LEGAL_TERMINOS_SCHEMA = {
  id: 'legal_terminos',
  label: 'Términos',
  short: 'Términos',
  icon: 'FileText',
  group: 'legal',
  category: 'otras',
  kind: { kind: 'settings' },
  publishMode: 'draft',
  previewPath: '/terminos',
  template: LEGAL_DOC_TEMPLATE,
  fields: LEGAL_FIELDS,
} as const satisfies SectionSchema<CmsSectionKey>;

export const LEGAL_PRIVACIDAD_SCHEMA = {
  id: 'legal_privacidad',
  label: 'Privacidad',
  short: 'Privacidad',
  icon: 'Shield',
  group: 'legal',
  category: 'otras',
  kind: { kind: 'settings' },
  publishMode: 'draft',
  previewPath: '/privacidad',
  template: LEGAL_DOC_TEMPLATE,
  fields: LEGAL_FIELDS,
} as const satisfies SectionSchema<CmsSectionKey>;

export const LEGAL_COOKIES_SCHEMA = {
  id: 'legal_cookies',
  label: 'Cookies',
  short: 'Cookies',
  icon: 'Cookie',
  group: 'legal',
  category: 'otras',
  kind: { kind: 'settings' },
  publishMode: 'draft',
  previewPath: '/cookies',
  template: LEGAL_DOC_TEMPLATE,
  fields: LEGAL_FIELDS,
} as const satisfies SectionSchema<CmsSectionKey>;

export const LEGAL_ENVIO_SCHEMA = {
  id: 'legal_envio',
  label: 'Envío',
  short: 'Envío',
  icon: 'Truck',
  group: 'legal',
  category: 'otras',
  kind: { kind: 'settings' },
  publishMode: 'draft',
  previewPath: '/envio',
  template: LEGAL_DOC_TEMPLATE,
  fields: LEGAL_FIELDS,
} as const satisfies SectionSchema<CmsSectionKey>;

export const LEGAL_REEMBOLSO_SCHEMA = {
  id: 'legal_reembolso',
  label: 'Reembolso',
  short: 'Reembolso',
  icon: 'RotateCcw',
  group: 'legal',
  category: 'otras',
  kind: { kind: 'settings' },
  publishMode: 'draft',
  previewPath: '/reembolso',
  template: LEGAL_DOC_TEMPLATE,
  fields: LEGAL_FIELDS,
} as const satisfies SectionSchema<CmsSectionKey>;

export const LEGAL_CANCELACION_SCHEMA = {
  id: 'legal_cancelacion',
  label: 'Cancelación',
  short: 'Cancelación',
  icon: 'Ban',
  group: 'legal',
  category: 'otras',
  kind: { kind: 'settings' },
  publishMode: 'draft',
  previewPath: '/cancelacion',
  template: LEGAL_DOC_TEMPLATE,
  fields: LEGAL_FIELDS,
} as const satisfies SectionSchema<CmsSectionKey>;

export const LEGAL_GARANTIA_SCHEMA = {
  id: 'legal_garantia',
  label: 'Garantía',
  short: 'Garantía',
  icon: 'BadgeCheck',
  group: 'legal',
  category: 'otras',
  kind: { kind: 'settings' },
  publishMode: 'draft',
  previewPath: '/garantia',
  template: LEGAL_DOC_TEMPLATE,
  fields: LEGAL_FIELDS,
} as const satisfies SectionSchema<CmsSectionKey>;

// ── Registro y maps derivados ──────────────────────────────────────────────

export const EDITOR_SECTIONS: readonly SectionSchema<CmsSectionKey>[] = [
  // Apariencia
  THEME_SETTINGS_SCHEMA,
  TYPOGRAPHY_SETTINGS_SCHEMA,
  BRAND_ASSETS_SCHEMA,
  SEO_DEFAULTS_SCHEMA,
  CONTACT_SETTINGS_SCHEMA,
  AUTH_SETTINGS_SCHEMA,
  // Cabecera
  MENU_SETTINGS_SCHEMA,
  MENU_LINKS_SCHEMA,
  ANNOUNCEMENT_SETTINGS_SCHEMA,
  ANNOUNCEMENT_SLIDES_SCHEMA,
  // Home
  LANDING_LAYOUT_SCHEMA,
  CAMPAIGN_BANNERS_SCHEMA,
  SEASONAL_SETTINGS_SCHEMA,
  CONSERVATION_CONTENT_SCHEMA,
  IDENTIDAD_SETTINGS_SCHEMA,
  CLUB_LEGADO_SETTINGS_SCHEMA,
  MEDIA_ITEMS_SCHEMA,
  MEDIA_SETTINGS_SCHEMA,
  VIDEO_SETTINGS_SCHEMA,
  MAP_SETTINGS_SCHEMA,
  PRODUCTS_SETTINGS_SCHEMA,
  COLLECTIONS_SETTINGS_SCHEMA,
  // Tienda
  CATALOG_SETTINGS_SCHEMA,
  PDP_SETTINGS_SCHEMA,
  CHECKOUT_SETTINGS_SCHEMA,
  CART_SETTINGS_SCHEMA,
  QR_SCAN_SETTINGS_SCHEMA,
  // Alianzas B2B
  B2B_HUB_SETTINGS_SCHEMA,
  B2B_CAFETERIAS_SCHEMA,
  B2B_HOTELES_SCHEMA,
  B2B_TIENDAS_GOURMET_SCHEMA,
  B2B_FERIAS_SCHEMA,
  B2B_REVENDEDORES_SCHEMA,
  // Contenido
  ORIGEN_SETTINGS_SCHEMA,
  ORIGEN_MONOGRAFIAS_SCHEMA,
  EXPERIENCIAS_SETTINGS_SCHEMA,
  EXPERIENCIAS_PUREO_SETTINGS_SCHEMA,
  FLORACIONES_EXPERIENCE_SETTINGS_SCHEMA,
  EXPERIENCIAS_TALLERES_SETTINGS_SCHEMA,
  GALERIA_SETTINGS_SCHEMA,
  NOSOTROS_SETTINGS_SCHEMA,
  CIENCIA_SETTINGS_SCHEMA,
  COLECCIONES_SCHEMA,
  TALLERES_SCHEMA,
  NOSOTROS_SCHEMA,
  GALERIA_SCHEMA,
  CONTACTO_SCHEMA,
  CIENCIA_SCHEMA,
  CLUB_PAGE_SETTINGS_SCHEMA,
  RESERVA_ANUAL_SCHEMA,
  // Pie y app
  FOOTER_SETTINGS_SCHEMA,
  FOOTER_SOCIAL_SCHEMA,
  PWA_NAV_SETTINGS_SCHEMA,
  PWA_NAV_ITEMS_SCHEMA,
  // Legal
  LEGAL_TERMINOS_SCHEMA,
  LEGAL_PRIVACIDAD_SCHEMA,
  LEGAL_COOKIES_SCHEMA,
  LEGAL_ENVIO_SCHEMA,
  LEGAL_REEMBOLSO_SCHEMA,
  LEGAL_CANCELACION_SCHEMA,
  LEGAL_GARANTIA_SCHEMA,
];

/** Lookup por section_key. El cast es por Object.fromEntries (patrón existente). */
export const SECTION_SCHEMA_BY_KEY: Readonly<Record<CmsSectionKey, SectionSchema<CmsSectionKey>>> =
  Object.fromEntries(EDITOR_SECTIONS.map((s) => [s.id, s])) as Readonly<
    Record<CmsSectionKey, SectionSchema<CmsSectionKey>>
  >;

/** Singleton: un documento, no lista de fichas. Incluye B2B, legales, origen… */
export const SETTINGS_SECTION_KEYS: Set<string> = new Set<string>(
  EDITOR_SECTIONS.filter((s) => s.kind.kind === 'settings').map((s) => s.id),
);

export function getSectionSchema(key: string): SectionSchema<CmsSectionKey> | undefined {
  return SECTION_SCHEMA_BY_KEY[key as CmsSectionKey];
}

/** Templates derivados del registro (reemplaza SECTION_TEMPLATES a futuro). */
export const SCHEMA_SECTION_TEMPLATES: Readonly<Record<string, Readonly<Record<string, unknown>>>> =
  Object.fromEntries(EDITOR_SECTIONS.map((s) => [s.id, s.template ?? {}]));

// ── PageDoc: la página como datos (vista materializada del storage) ────────

/** Instancia de una sección en la página (una o más rows de site_content). */
export type PageSectionInstance = {
  type: CmsSectionKey;
  /** Formato (singleton *_settings): valores del schema. */
  settings: Record<string, unknown>;
  /** Fichas (items): lista ordenada. */
  items?: CMSItemDoc[];
  /** ocultar ≠ borrar: no se renderiza pero se sigue editando. */
  disabled: boolean;
};

export type PageDoc = {
  title: string;
  locale: 'es' | 'en';
  sections: Record<string, PageSectionInstance>;
  order: string[];
};

/** Una ficha = una row de site_content (shape de CMSContentItem). */
export type CMSItemDoc = {
  id: string;
  section_key: CmsSectionKey;
  item_order: number;
  content: Record<string, unknown>;
  is_active: boolean;
};
