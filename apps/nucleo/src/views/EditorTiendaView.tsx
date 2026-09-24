'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo, type ComponentType } from 'react';
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
  Home,
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
  History,
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
  CreditCard,
  ShoppingCart,
  BookOpen,
  Film,
  Languages,
  Lock,
  Copy,
  Handshake,
  QrCode,
  UtensilsCrossed,
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
import { CmsHistoryModal } from '@/components/tienda/CmsHistoryModal';
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
  LandingLayoutEditor,
  SETTINGS_SECTION_KEYS,
} from '@/components/tienda/StoreChromeEditors';
import {
  SETTINGS_KEY_FOR_ITEMS,
  filterNavSectionKeys,
  filterCategorySectionKeys,
  isNestedSettingsKey,
  navVisibleSectionKey,
  workingCmsContent,
  PAGE_WORKSPACE_DEFS,
  PAGE_WORKSPACE_ORDER,
  HOME_SECTION_KEYS,
  resolveEditorNavTarget,
  type PageWorkspaceId,
} from '@/lib/editor-tienda-sections';
import { getSectionSchema, SCHEMA_SECTION_TEMPLATES } from '@/lib/editor-tienda-schema';
import { SchemaFormFields, SchemaSettingsPanel } from '@/components/tienda/SchemaFieldEditor';
import {
  type FieldSchema,
  type LandingSectionId,
  LANDING_SECTION_EDITOR_KEY,
  LANDING_SECTION_LABELS,
  DEFAULT_HOME_COLECCIONES,
  scanPublicCopyRisks,
} from '@/lib/store-chrome';

// ── Constants ──────────────────────────────────────────────────────────────

type SectionIcon = ComponentType<LucideProps>;

type SectionGroupId =
  | 'apariencia'
  | 'cabecera'
  | 'home'
  | 'tienda'
  | 'b2b'
  | 'pie'
  | 'contenido'
  | 'legal';

const SECTION_GROUPS: { id: SectionGroupId; label: string }[] = [
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'cabecera', label: 'Cabecera' },
  { id: 'home', label: 'Inicio' },
  { id: 'tienda', label: 'Tienda' },
  { id: 'b2b', label: 'Alianzas B2B' },
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
    label: 'Más bloques',
    desc: 'Herramientas sueltas que no caben en una página',
    icon: Blocks,
  },
  {
    id: 'diseno',
    label: 'Más diseño',
    desc: 'Ajustes de forma que no viven en Apariencia',
    icon: Palette,
  },
  {
    id: 'otras',
    label: 'Más ajustes',
    desc: 'Configuración que no vive en un workspace',
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
  collections_settings: 'bloques',
  identidad_settings: 'bloques',
  club_legado_settings: 'bloques',
  club_page_settings: 'bloques',
  galeria_settings: 'bloques',
  nosotros_settings: 'bloques',
  media_settings: 'bloques',
  ciencia_settings: 'bloques',
  landing_layout: 'bloques',
  colecciones: 'bloques',
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
  auth_settings: 'diseno',
  // Otras formas — config, temporada y legales
  seo_defaults: 'otras',
  contact_settings: 'otras',
  checkout_settings: 'otras',
  cart_settings: 'otras',
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
  checkout_settings: {
    label: 'Checkout — Copy',
    short: 'Checkout',
    icon: CreditCard,
    group: 'tienda',
    hint: 'Textos del checkout (envío, couriers, seguridad)',
  },
  cart_settings: {
    label: 'Carrito — Copy',
    short: 'Carrito',
    icon: ShoppingCart,
    group: 'tienda',
    hint: 'Textos del carrito (vacío, subtotal, CTA)',
  },
  menu_settings: {
    label: 'Menú — Estilo',
    short: 'Menú',
    icon: PanelTop,
    group: 'cabecera',
    hint: 'Header y logo menú',
  },
  menu_links: {
    label: 'Menú',
    short: 'Menú',
    icon: Link2,
    group: 'cabecera',
    hint: 'Estilo del header y enlaces',
  },
  announcement_settings: {
    label: 'Anuncios — Estilo',
    short: 'Anuncios',
    icon: Megaphone,
    group: 'cabecera',
    hint: 'Barra superior',
  },
  announcement_slides: {
    label: 'Anuncios',
    short: 'Anuncios',
    icon: GalleryHorizontalEnd,
    group: 'cabecera',
    hint: 'Barra superior: estilo y mensajes',
  },
  landing_layout: {
    label: 'Orden del home',
    short: 'Orden',
    icon: LayoutTemplate,
    group: 'home',
    hint: 'Qué bloques se ven y en qué orden — las fichas se editan en cada herramienta',
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
    label: 'Carrusel media',
    short: 'Carrusel',
    icon: GalleryHorizontalEnd,
    group: 'home',
    hint: 'Slides, altura y encuadre del home',
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
  collections_settings: {
    label: 'Colecciones — Cabecera y grilla',
    short: 'Colecciones',
    icon: Layers,
    group: 'home',
    hint: 'Título del bloque, columnas y encuadre de las fotos',
  },
  identidad_settings: {
    label: 'Identidad territorial',
    short: 'Identidad',
    icon: Leaf,
    group: 'home',
    hint: 'Bloque Hecho en Chiloé bajo el hero',
  },
  club_legado_settings: {
    label: 'Club Legado del Bosque',
    short: 'Club Legado',
    icon: BadgeCheck,
    group: 'home',
    hint: 'Título, bajada y botón del Club en el home',
  },
  club_page_settings: {
    label: 'Página Club Legado del Bosque',
    short: 'Página Club',
    icon: BadgeCheck,
    group: 'contenido',
    hint: 'Textos, 4 pasos y custodia de /club-legado-del-bosque',
  },
  galeria_settings: {
    label: 'Galería — Formato y Cabecera',
    short: 'Galería',
    icon: Images,
    group: 'contenido',
    hint: 'Título, relación de aspecto y formato de fotos',
  },
  nosotros_settings: {
    label: 'Nosotros — Foto y Cabecera',
    short: 'Nosotros',
    icon: BookOpen,
    group: 'contenido',
    hint: 'Título, aspecto de foto hero y encuadre',
  },
  media_settings: {
    label: 'Carrusel media — Formato',
    short: 'Formato',
    icon: Film,
    group: 'home',
    hint: 'Altura, encuadre y velocidad (vive dentro de Carrusel media)',
  },
  ciencia_settings: {
    label: 'Ciencia — Cabecera',
    short: 'Ciencia',
    icon: Microscope,
    group: 'contenido',
    hint: 'Título, kicker y subtítulo de la página',
  },
  auth_settings: {
    label: 'Inicio de Sesión & Registro — Apariencia',
    short: 'Login / Registro',
    icon: Lock,
    group: 'apariencia',
    hint: 'Título, subtítulo, frase de marca y fondo',
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
    label: 'Footer',
    short: 'Footer',
    icon: Share2,
    group: 'pie',
    hint: 'Pie de página y redes',
  },
  pwa_nav_settings: {
    label: 'PWA — Estilo',
    short: 'PWA',
    icon: Smartphone,
    group: 'pie',
    hint: 'Barra inferior móvil',
  },
  pwa_nav_items: {
    label: 'PWA',
    short: 'PWA',
    icon: AppWindow,
    group: 'pie',
    hint: 'Barra inferior: estilo y pestañas',
  },
  colecciones: {
    label: 'Colecciones',
    short: 'Colecciones',
    icon: Layers,
    group: 'contenido',
    hint: 'Tarjetas del grid del home',
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
    hint: 'Historia, origen y equipo',
  },
  galeria: {
    label: 'Galería',
    short: 'Galería',
    icon: Images,
    group: 'contenido',
    hint: 'Fotos de la página + formato',
  },
  contacto: {
    label: 'Contacto',
    short: 'Contacto',
    icon: Mail,
    group: 'contenido',
    hint: 'Página /contacto y WhatsApp (formato arriba)',
  },
  ciencia: {
    label: 'Ciencia — Evidencia',
    short: 'Ciencia',
    icon: Microscope,
    group: 'contenido',
    hint: 'Sin claims médicos · origen y sabor',
  },
  legal_terminos: {
    label: 'Términos',
    short: 'Términos',
    icon: FileText,
    group: 'legal',
    hint: 'Condiciones de uso del servicio',
  },
  legal_privacidad: {
    label: 'Privacidad',
    short: 'Privacidad',
    icon: Shield,
    group: 'legal',
    hint: 'Tratamiento y protección de datos',
  },
  legal_cookies: {
    label: 'Cookies',
    short: 'Cookies',
    icon: Cookie,
    group: 'legal',
    hint: 'Preferencias y almacenamiento local',
  },
  legal_envio: {
    label: 'Envío',
    short: 'Envío',
    icon: Truck,
    group: 'legal',
    hint: 'Tiempos, tarifas y cobertura',
  },
  legal_reembolso: {
    label: 'Reembolso',
    short: 'Reembolso',
    icon: RotateCcw,
    group: 'legal',
    hint: 'Políticas de devolución y cambios',
  },
  legal_cancelacion: {
    label: 'Cancelación',
    short: 'Cancelación',
    icon: Ban,
    group: 'legal',
    hint: 'Derecho a retracto y pedidos',
  },
  legal_garantia: {
    label: 'Garantía',
    short: 'Garantía',
    icon: BadgeCheck,
    group: 'legal',
    hint: 'Garantía de calidad y autenticidad',
  },
  b2b_cafeterias: {
    label: 'B2B — Cafeterías & Tostadurías',
    short: 'Cafeterías',
    icon: Handshake,
    group: 'b2b',
    hint: 'Miel para cafeterías de especialidad (/alianzas/cafeterias)',
  },
  b2b_hoteles: {
    label: 'B2B — Hotelería Boutique & Lodges',
    short: 'Hoteles',
    icon: Handshake,
    group: 'b2b',
    hint: 'Experiencia y amenidades hoteleras (/alianzas/hoteles)',
  },
  b2b_tiendas_gourmet: {
    label: 'B2B — Tiendas Gourmet & Emporios',
    short: 'Tiendas Gourmet',
    icon: Handshake,
    group: 'b2b',
    hint: 'Catálogo y márgenes para emporios (/alianzas/tiendas-gourmet)',
  },
  b2b_ferias: {
    label: 'B2B — Mercados & Ferias Gourmet',
    short: 'Ferias',
    icon: Handshake,
    group: 'b2b',
    hint: 'Degustación y venta directa en eventos (/alianzas/ferias)',
  },
  b2b_revendedores: {
    label: 'B2B — Red de Revendedores',
    short: 'Revendedores',
    icon: Handshake,
    group: 'b2b',
    hint: 'Distribución territorial y herramientas (/alianzas/revendedores)',
  },
  origen_settings: {
    label: 'Origen & Floraciones — Cabecera',
    short: 'Origen',
    icon: Leaf,
    group: 'contenido',
    hint: 'Título y descripción de la biblioteca botánica (/origen)',
  },
  origen_monografias: {
    label: 'Monografías Botánicas',
    short: 'Monografías',
    icon: BookOpen,
    group: 'contenido',
    hint: 'Fichas botánicas y científicas (/origen/ulmo)',
  },
  experiencias_settings: {
    label: 'Experiencias — Cabecera',
    short: 'Experiencias',
    icon: GraduationCap,
    group: 'contenido',
    hint: 'Hero y sesión insignia (/experiencias)',
  },
  floraciones_experience_settings: {
    label: 'Experiencia: Degustaciones · Mieles de Chile',
    short: 'Degustaciones',
    icon: UtensilsCrossed,
    group: 'contenido',
    hint: 'Cata sensorial, kit de degustación y protocolo (/experiencias/degustaciones)',
  },
  qr_scan_settings: {
    label: 'Escáner de Trazabilidad QR',
    short: 'Escáner QR',
    icon: QrCode,
    group: 'tienda',
    hint: 'Buscador y sellos de origen verificado de /qr-scan',
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
  'checkout_settings',
  'cart_settings',
  'qr_scan_settings',
  'menu_settings',
  'menu_links',
  'announcement_settings',
  'announcement_slides',
  'landing_layout',
  'catalog_settings',
  'pdp_settings',
  'campaign_banners',
  'seasonal_settings',
  'identidad_settings',
  'club_legado_settings',
  'club_page_settings',
  'conservation_content',
  'media_items',
  'video_settings',
  'map_settings',
  'products_settings',
  'collections_settings',
  'galeria_settings',
  'nosotros_settings',
  'media_settings',
  'ciencia_settings',
  'auth_settings',
  'b2b_cafeterias',
  'b2b_hoteles',
  'b2b_tiendas_gourmet',
  'b2b_ferias',
  'b2b_revendedores',
  'origen_settings',
  'origen_monografias',
  'experiencias_settings',
  'floraciones_experience_settings',
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
  'header_settings',
  'header_nav',
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
 * Plantillas JSON iniciales por sección — fuente única: el registro de schemas
 * (editor-tienda-schema.ts). 'colecciones' incluye 'image' para que
 * EditableItemCard muestre el uploader.
 */
const SECTION_TEMPLATES = SCHEMA_SECTION_TEMPLATES;

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
  nosotros_settings: '/nosotros',
  galeria: '/galeria',
  galeria_settings: '/galeria',
  ciencia: '/ciencia',
  ciencia_settings: '/ciencia',
  auth_settings: '/login',
  contacto: '/contacto',
  talleres: '/experiencias',
  colecciones: '/',
  collections_settings: '/',
};

type PageWorkspaceNode = {
  id: string;
  label: string;
  sectionKey: string;
  previewPath: string;
};

const PAGE_WORKSPACES = PAGE_WORKSPACE_DEFS;

const WORKSPACE_ICONS: Record<PageWorkspaceId, SectionIcon> = {
  catalog: Package,
  experiences: GraduationCap,
  bioculture: Leaf,
  pages: BookOpen,
  b2b: Handshake,
  menu: PanelTop,
  campaigns: Megaphone,
  appearance: Palette,
  legal: FileText,
};

/** Menú independiente del preview: páginas navegables sin tocar la selección
 *  del editor. Los bloques del home viven en Inicio (no hay ancla cross-origin). */
const PREVIEW_DESTINATIONS: { path: string; label: string }[] = [
  { path: '', label: 'Inicio' },
  { path: '/catalogo', label: 'Catálogo' },
  { path: '/experiencias', label: 'Experiencias' },
  { path: '/experiencias/degustaciones', label: 'Degustaciones' },
  { path: '/experiencias/territorio', label: 'Territorio' },
  { path: '/origen', label: 'Origen' },
  { path: '/origen/ulmo', label: 'Monografía Ulmo' },
  { path: '/alianzas', label: 'B2B: Hub Alianzas' },
  { path: '/alianzas/cafeterias', label: 'B2B: Cafeterías' },
  { path: '/alianzas/hoteles', label: 'B2B: Hoteles' },
  { path: '/alianzas/tiendas-gourmet', label: 'B2B: Tiendas' },
  { path: '/alianzas/ferias', label: 'B2B: Ferias' },
  { path: '/alianzas/revendedores', label: 'B2B: Revendedores' },
  { path: '/qr-scan', label: 'Escáner QR' },
  { path: '/nosotros', label: 'Nosotros' },
  { path: '/galeria', label: 'Galería' },
  { path: '/contacto', label: 'Contacto' },
  { path: '/carrito', label: 'Carrito' },
  { path: '/checkout', label: 'Checkout' },
  { path: '/login', label: 'Login' },
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
  kicker: 'Kicker / Etiqueta superior (opcional)',
  kicker_en: 'Kicker (EN)',
  subtitle: 'Subtítulo / Bajada (opcional)',
  cta_link: 'Enlace del Botón CTA (ej: /catalogo)',
  image: 'Imagen',
  src: 'Imagen',
  alt: 'Texto alternativo',
  email: 'Email',
  tagline: 'Tagline',
  cta: 'CTA',
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
      const kinds =
        fieldKey === 'body' || fieldKey === 'body_en'
          ? (['stack_leak'] as const)
          : fieldKey.includes('historia') ||
              fieldKey.includes('mision') ||
              fieldKey.includes('vision') ||
              fieldKey === 'texto'
            ? (['stack_leak', 'health_claim'] as const)
            : null;
      const risks = kinds ? scanPublicCopyRisks(value, kinds) : [];
      return (
        <div className="space-y-2">
          <textarea
            id={fieldId}
            name={fieldId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={fieldKey === 'body' || fieldKey === 'body_en' ? 12 : 6}
            className="w-full bg-surface-sunken border border-border rounded-lg p-3 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-accent font-mono"
          />
          {risks.length > 0 ? (
            <p className="text-[11px] text-destructive">
              Riesgo en copy público: {risks.map((r) => r.label).join(', ')}.
            </p>
          ) : null}
        </div>
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

  if (Array.isArray(value)) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        Esta lista se edita en el panel de la sección, no como texto.
      </p>
    );
  }

  return (
    <input
      id={fieldId}
      name={fieldId}
      type="text"
      autoComplete="off"
      value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
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
  /**
   * Fields del schema de la sección (piloto schema-driven). Si vienen, el
   * panel se genera desde el schema (visible_if + bilingual); si no, heurística.
   */
  fields?: readonly FieldSchema[];
  /** Duplicar como boceto (patrón Shopify): clona content al final de la lista. */
  onDuplicate?: () => void;
  /** Apertura de biblioteca de medios en modo selector */
  onOpenImageLibrary?: (callback: (url: string) => void, prompt?: string) => void;
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
  fields,
  onDuplicate,
  onOpenImageLibrary,
}: EditableItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [localContent, setLocalContent] = useState<Record<string, unknown>>(() =>
    workingCmsContent(item),
  );
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
  const serverContentKey = JSON.stringify(workingCmsContent(item));
  useEffect(() => {
    if (isDirty) return;
    setLocalContent(workingCmsContent(item));
    setLocalActive(item.is_active);
    setUploadingField(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serverContentKey serializa el snapshot editable
  }, [item.id, item.updated_at, item.is_active, serverContentKey, isDirty]);

  const handleFieldChange = useCallback((key: string, val: unknown) => {
    setLocalContent((prev) => ({ ...prev, [key]: val }));
  }, []);

  /** Upload a Storage: el SchemaFormFields persiste la URL vía handleFieldChange. */
  const handleSchemaImage = (file: File, fieldId: string): Promise<string> =>
    onImageUpload(file, fieldId, item.id);

  /** Upload = URL; flush inmediato sin debounce (paridad con handleFileChange). */
  const handleSchemaImageUploaded = (fieldId: string, url: string) => {
    void flush({ content: { ...localContent, [fieldId]: url }, active: localActive });
  };

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
          {onDuplicate ? (
            <button
              onClick={onDuplicate}
              className="p-2 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors min-w-11 min-h-11 flex items-center justify-center"
              title="Duplicar como boceto"
              aria-label="Duplicar como boceto"
            >
              <Copy size={14} />
            </button>
          ) : null}
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

          {fields ? (
            <SchemaFormFields
              fields={fields}
              values={
                activeSection === 'colecciones'
                  ? {
                      ...(template ?? {}),
                      ...localContent,
                      title: localContent.title || localContent.titulo,
                      desc: localContent.desc || localContent.descripcion,
                      image: localContent.image || localContent.url,
                    }
                  : { ...(template ?? {}), ...localContent }
              }
              onChange={handleFieldChange}
              onImageUpload={handleSchemaImage}
              onImageUploaded={handleSchemaImageUploaded}
              onOpenImageLibrary={onOpenImageLibrary}
              idPrefix={`item-${item.id}`}
            />
          ) : (
            displayEntries.map(([key, val]) => {
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleImageClick(key)}
                      disabled={uploadingField === key}
                      className="flex-1 flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-background border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50 min-h-[40px]"
                    >
                      {uploadingField === key ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {val && typeof val === 'string' && val.startsWith('http')
                        ? 'Cambiar archivo'
                        : 'Subir foto'}
                    </button>
                    {onOpenImageLibrary ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenImageLibrary((url) => {
                            const next = { ...localContent, [key]: url };
                            setLocalContent(next);
                            void flush({ content: next, active: localActive });
                          }, `Elegir imagen para ${fieldLabel(key)}`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-surface-raised border border-border hover:border-accent/60 transition-colors min-h-[40px] text-foreground shrink-0"
                        title="Elegir foto existente de la biblioteca editorial"
                      >
                        <ImageIcon size={14} className="text-muted-foreground" />
                        Biblioteca
                      </button>
                    ) : null}
                  </div>
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
            }))}
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

  const visibleKeys = useMemo(
    () => filterCategorySectionKeys(sectionKeys),
    [sectionKeys],
  );

  const keySet = useMemo(
    () => new Set(visibleKeys.filter((k) => matches(k) && sectionCategory(k) === category)),
    [visibleKeys, q, category], // eslint-disable-line react-hooks/exhaustive-deps
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
      visibleKeys.filter(
        (k) =>
          !SECTION_ORDER.includes(k as (typeof SECTION_ORDER)[number]) &&
          matches(k) &&
          sectionCategory(k) === category,
      ),
    [visibleKeys, q, category], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const filteredKeys = useMemo(
    () => visibleKeys.filter((k) => matches(k) && sectionCategory(k) === category),
    [visibleKeys, q, category], // eslint-disable-line react-hooks/exhaustive-deps
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
          className="w-full min-h-11 rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-base md:text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
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
              {count > 0 && !SETTINGS_SECTION_KEYS.has(key as CMSSectionKey) ? (
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
  brandContent?: Record<string, unknown> | null;
}

function MenuSettingsEditor({ item, onUpdate, onImageUpload, brandContent }: MenuSettingsEditorProps) {
  return (
    <MenuStyleEditor
      content={workingCmsContent(item)}
      onSave={(content) => onUpdate(item.id, content, item.is_active)}
      onImageUpload={(file, fieldName) => onImageUpload(file, fieldName, item.id)}
      brandContent={brandContent}
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
  onUploadMultiple?: (files: FileList) => Promise<void>;
  isMultiUploading?: boolean;
  multiUploadProgress?: { current: number; total: number } | null;
  onReorder?: (items: CMSContentItem[]) => void;
  /** Duplicar como boceto: clona el item al final de la sección. */
  onDuplicate?: (item: CMSContentItem) => void;
  isDeleting: boolean;
  /** brand_assets del CMS para la preview del menú (fallback logo marca → texto) */
  brandContent?: Record<string, unknown> | null;
  /** Formato del mismo bloque (antes era otra entrada del nav). */
  companionSettingsKey?: string | null;
  companionSettingsItem?: CMSContentItem | null;
  onInitCompanion?: () => void;
  onOpenSection?: (sectionKey: string) => void;
  onSeedColecciones?: () => void;
  seedingColecciones?: boolean;
  /** Apertura de biblioteca de medios en modo selector */
  onOpenImageLibrary?: (callback: (url: string) => void, prompt?: string) => void;
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
  onUploadMultiple,
  isMultiUploading,
  multiUploadProgress,
  onReorder,
  onDuplicate,
  isDeleting,
  brandContent,
  companionSettingsKey,
  companionSettingsItem,
  onInitCompanion,
  onOpenSection,
  onSeedColecciones,
  seedingColecciones,
  onOpenImageLibrary,
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
  // Schema piloto: si la sección declara fields, el panel se genera desde el
  // schema (fallback heurística para el resto). Los settings con customEditor
  // siguen con su editor a mano.
  const itemSchema = getSectionSchema(activeSection);
  const itemFields =
    itemSchema && itemSchema.kind.kind !== 'settings' ? itemSchema.fields : undefined;
  const companionSchema = companionSettingsKey
    ? getSectionSchema(companionSettingsKey)
    : undefined;

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
          <div className="flex items-center gap-2 shrink-0">
            {activeSection === 'galeria' && onUploadMultiple && (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isMultiUploading}
                  className="hidden"
                  id="multi-upload-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      void onUploadMultiple(e.target.files);
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={isMultiUploading}
                  onClick={() => document.getElementById('multi-upload-input')?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border text-foreground rounded-lg hover:border-accent hover:text-accent transition-colors text-xs font-medium min-h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isMultiUploading ? 'Subiendo y optimizando imágenes...' : 'Subir varias imágenes a la vez (WebP optimizado)'}
                >
                  {isMultiUploading ? (
                    <Loader2 size={14} className="animate-spin text-accent" />
                  ) : (
                    <Images size={14} />
                  )}
                  {isMultiUploading && multiUploadProgress
                    ? `${multiUploadProgress.current}/${multiUploadProgress.total}`
                    : 'Subir varias'}
                </button>
              </>
            )}
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-xs font-medium min-h-11 shrink-0"
            >
              <Plus size={14} />
              Añadir
            </button>
          </div>
        )}
      </div>

      {companionSettingsKey ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-surface-raised flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {activeSection === 'colecciones'
                ? 'Cabecera y grilla — se publica sola'
                : 'Formato de este bloque'}
            </p>
            {companionSettingsItem?.draft_content != null ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-warning">Borrador</span>
                <button
                  type="button"
                  onClick={() => onPublish(companionSettingsItem.id)}
                  className="text-[10px] font-semibold text-accent hover:underline"
                >
                  Publicar
                </button>
                <button
                  type="button"
                  onClick={() => onDiscard(companionSettingsItem.id)}
                  className="text-[10px] text-muted-foreground hover:underline"
                >
                  Descartar
                </button>
              </div>
            ) : null}
          </div>
          <div className="p-3">
            {companionSettingsItem ? (
              companionSettingsKey === 'menu_settings' ? (
                <MenuSettingsEditor
                  item={companionSettingsItem}
                  onUpdate={onUpdate}
                  onImageUpload={onImageUpload}
                  brandContent={brandContent}
                />
              ) : companionSchema && !companionSchema.customEditor ? (
                <SchemaSettingsPanel
                  schema={companionSchema}
                  content={workingCmsContent(companionSettingsItem)}
                  onSave={(content) =>
                    onUpdate(companionSettingsItem.id, content, companionSettingsItem.is_active)
                  }
                  onImageUpload={(file, fieldName) =>
                    onImageUpload(file, fieldName, companionSettingsItem.id)
                  }
                  onOpenImageLibrary={onOpenImageLibrary}
                />
              ) : (
                <ChromeSettingsEditor
                  sectionKey={companionSettingsKey}
                  content={workingCmsContent(companionSettingsItem)}
                  onSave={(content) =>
                    onUpdate(companionSettingsItem.id, content, companionSettingsItem.is_active)
                  }
                  onImageUpload={(file, fieldName) =>
                    onImageUpload(file, fieldName, companionSettingsItem.id)
                  }
                />
              )
            ) : (
              <div className="text-center py-6 px-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Este bloque aún no tiene formato inicializado.
                </p>
                {onInitCompanion ? (
                  <button
                    type="button"
                    onClick={onInitCompanion}
                    className="inline-flex min-h-11 items-center px-3 text-accent text-sm font-medium hover:underline"
                  >
                    Inicializar formato
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

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
                const slide = workingCmsContent(item);
                if (slide.type === 'video') return null;
                const src =
                  (typeof slide.image === 'string' ? slide.image : '') ||
                  (typeof slide.src === 'string' ? slide.src : '');
                if (!src.startsWith('http') && !src.startsWith('/')) return null;
                const alt =
                  typeof slide.alt === 'string' && slide.alt
                    ? slide.alt
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
        {isSettingsSection && items[0]?.draft_content != null ? (
          <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-warning">Borrador</span>
            <p className="text-[11px] text-muted-foreground flex-1">
              Este documento no está en la tienda pública hasta que lo publiques.
            </p>
            <button
              type="button"
              onClick={() => onPublish(items[0].id)}
              className="inline-flex min-h-9 items-center gap-1 px-2.5 rounded-md text-[11px] font-semibold border border-accent/40 bg-accent/15 text-accent"
            >
              <Send size={12} />
              Publicar
            </button>
            <button
              type="button"
              onClick={() => onDiscard(items[0].id)}
              className="inline-flex min-h-9 items-center gap-1 px-2.5 rounded-md text-[11px] font-medium border border-border text-muted-foreground"
            >
              <RotateCcw size={12} />
              Descartar
            </button>
          </div>
        ) : null}

        {isSettingsSection ? (
          items.length > 0 ? (
            <>
            {activeSection === 'menu_settings' ? (
              <MenuSettingsEditor
                item={items[0]}
                onUpdate={onUpdate}
                onImageUpload={onImageUpload}
                brandContent={brandContent}
              />
            ) : itemSchema && !itemSchema.customEditor ? (
              <SchemaSettingsPanel
                schema={itemSchema}
                content={workingCmsContent(items[0])}
                onSave={(content) => onUpdate(items[0].id, content, items[0].is_active)}
                onImageUpload={(file, fieldName) => onImageUpload(file, fieldName, items[0].id)}
                onOpenImageLibrary={onOpenImageLibrary}
              />
            ) : (
              <ChromeSettingsEditor
                sectionKey={activeSection}
                content={workingCmsContent(items[0])}
                onSave={(content) => onUpdate(items[0].id, content, items[0].is_active)}
                onImageUpload={(file, fieldName) => onImageUpload(file, fieldName, items[0].id)}
                onOpenSection={onOpenSection}
              />
            )}
            </>
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
                            fields={itemFields}
                            onDuplicate={onDuplicate ? () => onDuplicate(item) : undefined}
                            onOpenImageLibrary={onOpenImageLibrary}
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
                fields={itemFields}
                onDuplicate={onDuplicate ? () => onDuplicate(item) : undefined}
                onOpenImageLibrary={onOpenImageLibrary}
              />
            ))}
          </div>
        ) : activeSection === 'colecciones' ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center space-y-3">
            <p className="text-sm text-foreground">
              La tienda muestra 6 tarjetas predeterminadas hasta que exista una ficha aquí.
            </p>
            <p className="text-xs text-muted-foreground">
              La primera tarjeta CMS reemplaza esas 6. Importa las de la tienda y edítalas, o crea una vacía.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              {onSeedColecciones ? (
                <button
                  type="button"
                  onClick={onSeedColecciones}
                  disabled={seedingColecciones}
                  className="inline-flex min-h-11 items-center px-3 rounded-lg border border-accent/40 bg-accent/10 text-accent text-sm font-medium disabled:opacity-50"
                >
                  {seedingColecciones ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                  Traer las 6 de la tienda
                </button>
              ) : null}
              <button
                type="button"
                onClick={onAddNew}
                className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Añadir una vacía
              </button>
            </div>
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

function EditorChromeActions({
  editorLocale,
  setEditorLocale,
  onOpenImages,
  onOpenHistory,
  onPublishAll,
  publishPending,
  pendingDraftsCount,
  compact = false,
}: {
  editorLocale: 'es' | 'en';
  setEditorLocale: (locale: 'es' | 'en') => void;
  onOpenImages: () => void;
  onOpenHistory: () => void;
  onPublishAll: () => void;
  publishPending: boolean;
  pendingDraftsCount: number;
  compact?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOpenImages}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
        title="Gestionar imágenes del bucket cms (librería, huérfanas)"
      >
        <Images size={12} />
        {compact ? 'Fotos' : 'Imágenes'}
      </button>
      <button
        type="button"
        onClick={onOpenHistory}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
        title="Historial de versiones: restaurar estados anteriores del CMS"
      >
        <History size={12} />
        {compact ? 'Historial' : 'Historial'}
      </button>
      <div
        className="flex items-center rounded-full border border-border bg-secondary/50 p-0.5"
        role="group"
        aria-label="Idioma de edición"
      >
        <button
          type="button"
          onClick={() => setEditorLocale('es')}
          className={`inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${
            editorLocale === 'es'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Editar contenido en español"
        >
          <Languages size={11} />
          ES
        </button>
        <button
          type="button"
          onClick={() => setEditorLocale('en')}
          className={`inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${
            editorLocale === 'en'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Editar contenido en inglés — la tienda cae a ES por item si falta la versión"
        >
          EN
        </button>
      </div>
      <button
        type="button"
        onClick={onPublishAll}
        disabled={publishPending || pendingDraftsCount === 0}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition-colors ${
          pendingDraftsCount > 0
            ? 'border-accent/40 bg-accent/15 text-accent hover:bg-accent/25'
            : 'border-border text-muted-foreground/60 opacity-70'
        } disabled:cursor-not-allowed disabled:opacity-50`}
        title={
          pendingDraftsCount > 0
            ? `Publicar ${pendingDraftsCount} borrador${pendingDraftsCount !== 1 ? 'es' : ''} pendiente${pendingDraftsCount !== 1 ? 's' : ''}`
            : 'Sin borradores pendientes'
        }
      >
        {publishPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        {compact ? 'Publicar' : 'Publicar todo'}
        {pendingDraftsCount > 0 ? ` (${pendingDraftsCount})` : ''}
      </button>
    </>
  );
}

/** Lienzo iPhone 8 (375×667): el iframe siempre mide 375 de ancho; se escala
 *  para caber en el panel. Así el menú/hero del preview coinciden con el
 *  dispositivo de referencia, no con un marco 812 (X) ni un iframe más estrecho. */
const IPHONE8 = { w: 375, h: 667 } as const;

function Iphone8Stage({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const next = Math.min(1, el.clientWidth / IPHONE8.w, el.clientHeight / IPHONE8.h);
      setScale(Number.isFinite(next) && next > 0 ? next : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center gap-2">
      <p className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        iPhone 8 · 375×667
      </p>
      <div
        ref={stageRef}
        className="flex min-h-0 w-full flex-1 items-center justify-center"
      >
        <div
          className="relative shrink-0"
          style={{ width: IPHONE8.w * scale, height: IPHONE8.h * scale }}
        >
          <div
            className="absolute left-0 top-0 overflow-hidden rounded-[1.75rem] border-[6px] border-surface-raised bg-background shadow-2xl ring-1 ring-border"
            style={{
              width: IPHONE8.w,
              height: IPHONE8.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
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
  const [activeSection, setActiveSection] = useState<string>('menu_links');
  /** Idioma de edición (migración 1001): cada item vive en es o en. */
  const [editorLocale, setEditorLocale] = useState<'es' | 'en'>(() => {
    if (typeof window === 'undefined') return 'es';
    return window.localStorage.getItem('nucleo:cms-locale') === 'en' ? 'en' : 'es';
  });
  useEffect(() => {
    window.localStorage.setItem('nucleo:cms-locale', editorLocale);
  }, [editorLocale]);
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
  const [navDrill, setNavDrill] = useState<'categories' | 'list' | 'tool' | 'home' | 'page'>(
    'categories',
  );
  const [selectedHomeNode, setSelectedHomeNode] = useState<LandingSectionId | 'atmosphere' | null>('hero');
  const [pageWorkspaceId, setPageWorkspaceId] = useState<PageWorkspaceId>('catalog');
  const [selectedPageNodeId, setSelectedPageNodeId] = useState('catalog');
  const [activeCategory, setActiveCategory] = useState<EditorCategoryId>('bloques');
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());

  const toggleWorkspaceRoll = (id: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const [globalQuery, setGlobalQuery] = useState('');
  const [previewPath, setPreviewPath] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  /** Producto seleccionado para previsualizar su ficha real (PDP) */
  const [previewProductSlug, setPreviewProductSlug] = useState<string | null>(null);
  const [previewProducts, setPreviewProducts] = useState<
    { id: string; nombre: string; slug: string }[]
  >([]);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [imageSelectorTarget, setImageSelectorTarget] = useState<{
    onSelect: (url: string) => void;
    prompt?: string;
  } | null>(null);

  const handleOpenImageLibrary = useCallback((cb: (url: string) => void, prompt?: string) => {
    setImageSelectorTarget({ onSelect: cb, prompt });
  }, []);
  const [historyOpen, setHistoryOpen] = useState(false);
  /** Evita spinner SSR vs cliente (el overlay de hidratación tapa el nav). */
  const [chromeReady, setChromeReady] = useState(false);
  useEffect(() => {
    setChromeReady(true);
  }, []);

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
  const [isMultiUploading, setIsMultiUploading] = useState(false);
  const [multiUploadProgress, setMultiUploadProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('nucleo:focus-panels:editor-tienda');
    setDesktopFocus(stored === 'a' || stored === 'b' ? stored : null);
  }, []);

  const handleFocusChange = (focus: PanelFocus) => {
    setDesktopFocus(focus);
    localStorage.setItem('nucleo:focus-panels:editor-tienda', focus ?? '');
  };

  const { status: saveStatus, statuses: saveStatuses, flushAll } = useEditorSaveAggregate();

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

  // Cmd/Ctrl+S = guardar pendientes (autosave flush). Todo autopublica.
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
    if (!path.startsWith('/producto/')) setPreviewProductSlug(null);
    setPreviewLoading(true);
  };

  const postSelectToPreview = (sectionId: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'CMS_SELECT', sectionId }, '*');
  };

  const handlePreviewLoad = () => {
    setPreviewLoading(false);
    if (navDrill === 'home' && selectedHomeNode && selectedHomeNode !== 'atmosphere') {
      postSelectToPreview(selectedHomeNode);
    }
  };

  const openHomeWorkspace = () => {
    setSelectedHomeNode(null);
    setActiveSection('landing_layout');
    setNavDrill('home');
    goPreview('');
  };

  const openPageWorkspace = (id: PageWorkspaceId, sectionKey?: string) => {
    const ws = PAGE_WORKSPACES[id];
    const node =
      (sectionKey
        ? ws.nodes.find((n) => n.sectionKey === navVisibleSectionKey(sectionKey))
        : undefined) ?? ws.nodes[0];
    setPageWorkspaceId(id);
    setSelectedPageNodeId(node.id);
    setActiveSection(navVisibleSectionKey(node.sectionKey));
    setNavDrill('page');
    if (node.sectionKey === 'pdp_settings') {
      const slug = previewProductSlug ?? previewProducts[0]?.slug;
      if (slug) {
        goProductPreview(slug);
        return;
      }
    }
    goPreview(node.previewPath);
  };

  const selectPageNode = (node: PageWorkspaceNode) => {
    setSelectedPageNodeId(node.id);
    setActiveSection(navVisibleSectionKey(node.sectionKey));
    if (node.sectionKey === 'pdp_settings') {
      const slug = previewProductSlug ?? previewProducts[0]?.slug;
      if (slug) {
        goProductPreview(slug);
        return;
      }
    }
    goPreview(node.previewPath);
  };

  /** Una sola puerta: workspace dueño, o categoría solo si la key no tiene casa. */
  const openSection = (key: string) => {
    const visible = navVisibleSectionKey(key);
    const target = resolveEditorNavTarget(visible);
    setGlobalQuery('');
    if (target.kind === 'home') {
      setSelectedHomeNode(target.node);
      setActiveSection(visible);
      setNavDrill('home');
      goPreview('');
      if (target.node !== 'hero') postSelectToPreview(target.node);
      return;
    }
    if (target.kind === 'page') {
      openPageWorkspace(target.workspace, target.sectionKey);
      return;
    }
    setActiveCategory(sectionCategory(visible));
    setActiveSection(visible);
    setNavDrill('tool');
  };

  const openSectionRef = useRef(openSection);
  openSectionRef.current = openSection;

  const selectHomeNode = (id: LandingSectionId | 'atmosphere' | null) => {
    setSelectedHomeNode(id);
    if (!id || id === 'atmosphere' || id === 'hero') {
      setActiveSection('landing_layout');
    } else {
      const key = LANDING_SECTION_EDITOR_KEY[id];
      if (key) setActiveSection(navVisibleSectionKey(key));
    }
    if (id && id !== 'atmosphere') postSelectToPreview(id);
  };

  const goProductPreview = (slug: string) => {
    setPreviewProductSlug(slug);
    setPreviewPath(`/producto/${slug}`);
    setPreviewLoading(true);
  };

  // Derive default JSON from section template
  const defaultTemplate = SECTION_TEMPLATES[activeSection] ?? { title: '', desc: '' };
  const [newContent, setNewContent] = useState<Record<string, unknown>>(defaultTemplate);
  const newItemSchema = getSectionSchema(activeSection);
  const newItemFields =
    newItemSchema && newItemSchema.kind.kind !== 'settings' ? newItemSchema.fields : undefined;

  // Update template when section changes
  useEffect(() => {
    const template = SECTION_TEMPLATES[activeSection] ?? { title: '', desc: '' };
    setNewContent(template);
  }, [activeSection]);

  const groupedData = cms.data?.data ?? {};
  /** Rows legacy (sin columna locale hasta migración 1001 aplicada) = es. */
  const localeOf = (i: CMSContentItem) => i.locale ?? 'es';

  const isNodeDirty = useCallback(
    (sectionKey: string) => {
      const mainDirty = (groupedData[sectionKey] ?? []).some((i) => i.draft_content != null);
      const companionKey = SETTINGS_KEY_FOR_ITEMS[sectionKey];
      const companionDirty = companionKey
        ? (groupedData[companionKey] ?? []).some((i) => i.draft_content != null)
        : false;
      // Todo autopublica: el punto marca error de guardado por sección, no borrador.
      const saveError =
        saveStatuses[sectionKey] === 'error' ||
        (companionKey ? saveStatuses[companionKey] === 'error' : false);
      return mainDirty || companionDirty || saveError;
    },
    [groupedData, saveStatuses],
  );

  const isWorkspaceDirty = useCallback(
    (id: PageWorkspaceId) => {
      const ws = PAGE_WORKSPACES[id];
      return ws.nodes.some((node) => isNodeDirty(node.sectionKey));
    },
    [isNodeDirty],
  );

  const isHomeDirty = useCallback(() => {
    return HOME_SECTION_KEYS.some(
      (k) =>
        (groupedData[k] ?? []).some((i) => i.draft_content != null) ||
        saveStatuses[k] === 'error',
    );
  }, [groupedData, saveStatuses]);

  const HOME_ROLL_NODES: readonly {
    id: LandingSectionId | null;
    label: string;
    sectionKey: string;
  }[] = [
    { id: 'hero', label: 'Hero y orden de portada', sectionKey: 'landing_layout' },
    { id: 'identidad', label: 'Identidad y manifiesto', sectionKey: 'identidad_settings' },
    { id: 'conservation', label: 'Conservación territorial', sectionKey: 'conservation_content' },
    { id: 'collections', label: 'Colecciones de miel', sectionKey: 'colecciones' },
    { id: 'media', label: 'Multimedia y relato', sectionKey: 'media_items' },
    { id: 'products', label: 'Vitrina de productos', sectionKey: 'products_settings' },
    { id: 'video', label: 'Video del bosque', sectionKey: 'video_settings' },
    { id: 'club_legado', label: 'Club Legado del Bosque', sectionKey: 'club_legado_settings' },
    { id: 'map', label: 'Cartografía apícola', sectionKey: 'map_settings' },
    { id: 'experiencias', label: 'Encuentros en el bosque', sectionKey: 'experiencias_home_settings' },
    { id: 'alianzas', label: 'Alianzas y canal B2B', sectionKey: 'alianzas_home_settings' },
  ];

  const openHomeNodeFromRoll = (nodeId: LandingSectionId | null, sectionKey: string) => {
    setSelectedHomeNode(nodeId);
    setActiveSection(sectionKey);
    setNavDrill('home');
    goPreview('');
  };
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
  const navSectionKeys = filterNavSectionKeys(sectionKeys);

  useEffect(() => {
    if (isNestedSettingsKey(activeSection)) {
      setActiveSection(navVisibleSectionKey(activeSection));
    }
  }, [activeSection]);

  const currentItems = (groupedData[activeSection] ?? []).filter(
    (i) => localeOf(i) === editorLocale,
  );

  /** Items ES de la sección activa (fuente de "crear desde ES"). */
  const esItems = useMemo(
    () => (groupedData[activeSection] ?? []).filter((i) => localeOf(i) === 'es'),
    [groupedData, activeSection],
  );

  /**
   * Clona la sección activa al idioma EN: cada item ES → item EN con el mismo
   * content (luego el admin traduce los textos; el orden es independiente).
   */
  const handleCreateLocaleCopy = async () => {
    if (esItems.length === 0) return;
    try {
      for (const i of esItems) {
        await cms.createItem.mutateAsync({
          section_key: activeSection as CMSSectionKey,
          item_order: i.item_order,
          content: workingCmsContent(i),
          is_active: i.is_active,
          locale: 'en',
        });
      }
      toast(
        `Versión EN creada (${esItems.length} item${esItems.length !== 1 ? 's' : ''}) — edita los textos`,
        { type: 'success' },
      );
      refreshIframe();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al crear la versión EN', { type: 'error' });
    }
  };

  const refreshIframe = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'CMS_UPDATE' }, '*');
    } else {
      setIframeKey((prev) => prev + 1);
    }
  };

  const notifyRevalidate = (revalidated?: boolean, reason?: string | null) => {
    if (reason === 'draft') return;
    if (revalidated === false) {
      toast(
        reason === 'missing_url'
          ? 'Guardado en base de datos. Recarga la tienda para verlo (sin revalidación automática en este entorno).'
          : 'Guardado en base de datos. La tienda en vivo puede tardar unos minutos en reflejarlo.',
        { type: 'info' },
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
      const expected = Object.values(cms.data?.data ?? {})
        .flat()
        .find((i) => i.id === id)?.updated_at;
      const res = await cms.updateItem.mutateAsync({
        id,
        content,
        is_active: isActive,
        expected_updated_at: expected ?? undefined,
      });
      notifyRevalidate(res?.revalidated, res?.revalidate_reason);
      refreshIframe();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      toast(
        message.includes('Otro operador')
          ? `${message} El segundo guardado pisa con tu versión a propósito.`
          : message,
        { type: 'error' },
      );
      throw err instanceof Error ? err : new Error(message);
    }
  };

  const handleDeleteItem = (id: string) => {
    const item = currentItems.find((i) => i.id === id);
    cms.deleteItem.mutate(id, {
      onSuccess: (res) => {
        if (item) removeItemImages(id, item.content);
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

  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      if (event.data?.type !== 'CMS_SECTION_CLICK') return;
      if (typeof event.data.sectionId !== 'string') return;
      const rawId = event.data.sectionId;
      const homeKey = LANDING_SECTION_EDITOR_KEY[rawId as LandingSectionId];
      if (homeKey) {
        setSelectedHomeNode(rawId as LandingSectionId);
        setNavDrill('home');
        setActiveSection(navVisibleSectionKey(homeKey));
        return;
      }
      if (rawId === 'hero') {
        setSelectedHomeNode('hero');
        setNavDrill('home');
        setActiveSection('landing_layout');
        return;
      }
      openSectionRef.current(rawId);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

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

  const handleInitActiveSection = () => {
    const template = SECTION_TEMPLATES[activeSection] ?? {};
    cms.createItem.mutate(
      {
        section_key: activeSection as CMSSectionKey,
        content: template,
        item_order: 1,
        locale: editorLocale,
      },
      {
        onSuccess: (res) => {
          notifyRevalidate(res?.revalidated, res?.revalidate_reason);
          toast('Sección inicializada', { type: 'success' });
          refreshIframe();
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  const handleAddOrInit = () => {
    if (SETTINGS_SECTION_KEYS.has(activeSection)) {
      handleInitActiveSection();
      return;
    }
    const template = SECTION_TEMPLATES[activeSection] ?? { title: '', desc: '' };
    setNewContent(template);
    setModalUploadedPaths({});
    setShowNewForm(true);
  };

  const handleCreateItem = () => {
    try {
      // Los items nuevos caen al FINAL de la sección (no item_order 0 = arriba)
      const nextOrder =
        currentItems.reduce((max, i) => Math.max(max, i.item_order ?? 0), 0) + 1;
      cms.createItem.mutate(
        {
          section_key: activeSection as CMSSectionKey,
          content: newContent,
          item_order: nextOrder,
          locale: editorLocale,
        },
        {
          onSuccess: (res) => {
            // Las imágenes del modal ya tienen dueño: no limpiarlas
            setModalUploadedPaths({});
            notifyRevalidate(res?.revalidated, res?.revalidate_reason);
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

  const handleUploadMultipleImages = async (files: FileList) => {
    if (isMultiUploading) return;
    setIsMultiUploading(true);
    setMultiUploadProgress({ current: 0, total: files.length });

    let nextOrder = currentItems.reduce((max, i) => Math.max(max, i.item_order ?? 0), 0);
    let successCount = 0;

    toast(`Subiendo y optimizando ${files.length} imagen(es) a WebP...`);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        setMultiUploadProgress({ current: i + 1, total: files.length });

        try {
          const result = await cms.uploadImage.mutateAsync({
            file,
            sectionKey: activeSection as CMSSectionKey,
            fieldName: 'url',
          });

          if (result.publicUrl) {
            nextOrder += 1;
            await cms.createItem.mutateAsync({
              section_key: activeSection as CMSSectionKey,
              content: { titulo: '', descripcion: '', url: result.publicUrl },
              item_order: nextOrder,
              locale: editorLocale,
            });
            successCount++;
          }
        } catch (err) {
          console.error('Error uploading file', file.name, err);
          toast(`Error al subir ${file.name}`, { type: 'error' });
        }
      }
    } finally {
      setIsMultiUploading(false);
      setMultiUploadProgress(null);
    }

    if (successCount > 0) {
      // Único punto de sincronización: los creates ya actualizaron el caché
      // de forma optimista (sin invalidate por item); un solo refetch final
      // confirma la verdad del servidor y evita N refetch en cascada.
      await cms.refetch();
      toast(`${successCount} imagen(es) optimizada(s) a WebP y guardada(s) en vivo ✓`, { type: 'success' });
      refreshIframe();
    }
  };

  const companionSettingsKey = SETTINGS_KEY_FOR_ITEMS[activeSection] ?? null;
  const companionSettingsItem = companionSettingsKey
    ? (groupedData[companionSettingsKey] ?? []).find((i) => localeOf(i) === editorLocale) ??
      (groupedData[companionSettingsKey] ?? [])[0] ??
      null
    : null;

  /** Duplicar como boceto (patrón Shopify): clona el content editable al final.
   *  La copia arranca como row nueva sin borrador (el operador itera sin tocar
   *  el original ni arrastrar drafts sin publicar de la fuente). */
  const handleDuplicateItem = (item: CMSContentItem) => {
    const nextOrder = currentItems.reduce((max, i) => Math.max(max, i.item_order ?? 0), 0) + 1;
    cms.createItem.mutate(
      {
        section_key: item.section_key as CMSSectionKey,
        content: { ...workingCmsContent(item) },
        item_order: nextOrder,
        // locale viene tipado string por la migración 1001; el contrato es es|en.
        locale: (item.locale === 'en' ? 'en' : 'es') as 'es' | 'en',
      },
      {
        onSuccess: (res) => {
          toast('Bloque duplicado — edita el borrador', { type: 'success' });
          notifyRevalidate(res?.revalidated, res?.revalidate_reason);
          refreshIframe();
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  const handleSeedColecciones = () => {
    void (async () => {
      try {
        await Promise.all(
          DEFAULT_HOME_COLECCIONES.map((card, index) =>
            cms.createItem.mutateAsync({
              section_key: 'colecciones',
              content: { ...card },
              item_order: index + 1,
              locale: editorLocale,
            }),
          ),
        );
        toast('6 tarjetas listas — publicá para que la tienda deje el texto fijo', { type: 'success' });
        refreshIframe();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'No se pudieron crear las tarjetas', { type: 'error' });
      }
    })();
  };

  const handleInitCompanion = () => {
    if (!companionSettingsKey) return;
    const template = SECTION_TEMPLATES[companionSettingsKey] ?? {};
    cms.createItem.mutate(
      {
        section_key: companionSettingsKey as CMSSectionKey,
        content: template,
        item_order: 1,
        locale: editorLocale,
      },
      {
        onSuccess: (res) => {
          notifyRevalidate(res?.revalidated, res?.revalidate_reason);
          toast('Formato inicializado', { type: 'success' });
          refreshIframe();
        },
        onError: (err) => toast(err.message, { type: 'error' }),
      },
    );
  };

  /** Recolecta paths del bucket cms en profundidad (chequeo locale-safe). */
  const collectCmsPaths = (value: unknown, acc: Set<string>) => {
    if (typeof value === 'string') {
      const idx = value.indexOf('/storage/v1/object/public/cms/');
      if (idx !== -1) {
        const path = value.slice(idx + '/storage/v1/object/public/cms/'.length).split(/[?#]/)[0];
        if (path) acc.add(path);
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const v of value) collectCmsPaths(v, acc);
      return;
    }
    if (value && typeof value === 'object') {
      for (const v of Object.values(value)) collectCmsPaths(v, acc);
    }
  };

  /** Best-effort: elimina del bucket cms las imágenes de un item borrado.
   *  locale-safe: la versión hermana (otra locale) puede seguir usándolas. */
  const removeItemImages = (id: string, content: Record<string, unknown>) => {
    const toDelete: string[] = [];
    for (const [key, val] of Object.entries(content)) {
      if (
        isImageField(key, activeSection) &&
        typeof val === 'string' &&
        val.includes('/storage/v1/object/public/cms/')
      ) {
        const path = val.split('/storage/v1/object/public/cms/')[1];
        if (path) toDelete.push(path);
      }
    }
    if (toDelete.length === 0) return;
    const stillReferenced = new Set<string>();
    for (const items of Object.values(groupedData)) {
      for (const item of items) {
        if (item.id === id) continue;
        collectCmsPaths(item.content, stillReferenced);
      }
    }
    const paths = toDelete.filter((p) => !stillReferenced.has(p));
    if (paths.length > 0) void supabase.storage.from('cms').remove(paths).catch(() => {});
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
  const previewOrigin = tiendaUrl.replace(/\/$/, '');
  const pathPart = previewPath || '/';
  const sep = pathPart.includes('?') ? '&' : '?';
  // El preview de borradores exige token (la tienda lo valida en middleware).
  const previewToken = process.env.NEXT_PUBLIC_CMS_PREVIEW_TOKEN?.trim() || '1';
  const iframeSrc = `${previewOrigin}${pathPart}${sep}cms_preview=${encodeURIComponent(previewToken)}&locale=${editorLocale}`;
  const liveHref = `${previewOrigin}${pathPart}${sep}locale=${editorLocale}`;

  // Guard: si la URL de tienda apunta al propio Núcleo, el iframe se auto-embebe
  // y queda en blanco (CSP frame-ancestors 'none'). Mostrar error explícito.
  const tiendaOrigin = (() => {
    try {
      return tiendaUrl ? new URL(tiendaUrl).origin : '';
    } catch {
      return '';
    }
  })();
  const [isSelfEmbed, setIsSelfEmbed] = useState(false);
  useEffect(() => {
    setIsSelfEmbed(tiendaOrigin !== '' && tiendaOrigin === window.location.origin);
  }, [tiendaOrigin]);

  useEffect(() => {
    const parent = document.querySelector('.page-content');
    parent?.setAttribute('data-in-editor-tienda', 'true');
    return () => {
      parent?.removeAttribute('data-in-editor-tienda');
    };
  }, []);

  return (
    // Altura: llena .page-content--shell (flex chain en globals.css).
    // No usar calc frágil: el preview de escritorio debe heredar el alto del panel.
    <div
      data-testid="editor-tienda-root"
      className="relative z-10 mx-0 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-none border border-border bg-background sm:rounded-xl lg:-mx-4"
    >
      {/* ── Top bar ──
          En iPhone 8 (375px) una sola fila de 56px recortaba Imágenes / ES-EN /
          Publicar / pestañas. Título + pestañas arriba; acciones en segunda fila. */}
      <div className="z-10 shrink-0 border-b border-border/50 bg-surface/50 shadow-sm backdrop-blur-lg">
        <div className="flex min-h-14 flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="font-display truncate text-base font-medium text-foreground">
              <span className="sm:hidden">Editor</span>
              <span className="hidden sm:inline">Editor Tienda</span>
            </span>
            {chromeReady && cms.isLoading ? (
              <Loader2 size={14} className="shrink-0 animate-spin text-accent" />
            ) : null}
            {cms.error ? (
              <span className="max-w-[8rem] truncate text-[10px] font-medium text-destructive sm:max-w-[12rem]" title={cms.error.message}>
                Error al cargar CMS
              </span>
            ) : null}
            <EditorSaveStatusChip />
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <EditorChromeActions
              editorLocale={editorLocale}
              setEditorLocale={setEditorLocale}
              onOpenImages={() => setImagesOpen(true)}
              onOpenHistory={() => setHistoryOpen(true)}
              onPublishAll={handlePublishAll}
              publishPending={cms.publishItems.isPending}
              pendingDraftsCount={pendingDraftsCount}
            />
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors ${
                  viewMode === 'desktop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista Escritorio"
              >
                <Monitor size={15} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors ${
                  viewMode === 'mobile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista Móvil (iPhone 8 · 375×667)"
              >
                <Smartphone size={15} />
              </button>
            </div>
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
                href={liveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Ver en vivo <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="flex rounded-lg border border-border/50 bg-secondary/50 p-1 md:hidden">
            <button
              onClick={() => setMobileTab('editor')}
              className={`min-h-11 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mobileTab === 'editor' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`min-h-11 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mobileTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Previa
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/40 px-3 py-2 md:hidden">
          <EditorChromeActions
            editorLocale={editorLocale}
            setEditorLocale={setEditorLocale}
            onOpenImages={() => setImagesOpen(true)}
            onOpenHistory={() => setHistoryOpen(true)}
            onPublishAll={handlePublishAll}
            publishPending={cms.publishItems.isPending}
            pendingDraftsCount={pendingDraftsCount}
            compact
          />
        </div>
      </div>

      {/* ── Body: editor (columna fija) | preview (resto del alto y ancho) ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 min-w-0 h-full">

        {/* Editor — ancho acotado; el alto lo da el flex del body, no el contenido */}
        <div
          className={
            desktopFocus === 'b'
              ? 'hidden'
              : desktopFocus === 'a'
                ? `flex flex-col min-h-0 min-w-0 overflow-hidden bg-surface-sunken/40 w-full flex-1 ${
                    mobileTab === 'preview' ? 'max-md:hidden' : ''
                  }`
                : `flex flex-col min-h-0 overflow-hidden bg-surface-sunken/40 md:w-[min(100%,20rem)] lg:w-[22rem] xl:w-[24rem] md:max-w-[32%] md:shrink-0 md:border-r md:border-border/50 md:self-stretch ${
                    mobileTab === 'editor' ? 'flex-1 md:flex-none' : 'max-md:hidden'
                  }`
          }
        >
          {navDrill === 'categories' ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
              <div className="px-1 mb-1">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Editor de tienda
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cada herramienta vive en una sola página. No hay atajos gemelos.
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
                  className="w-full min-h-11 rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-base md:text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {globalQuery.trim() ? (
                <div className="space-y-1.5">
                  {navSectionKeys
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
                      const target = resolveEditorNavTarget(k);
                      const place =
                        target.kind === 'home'
                          ? 'Inicio'
                          : target.kind === 'page'
                            ? PAGE_WORKSPACES[target.workspace].label
                            : (EDITOR_CATEGORIES.find((c) => c.id === sectionCategory(k))?.label ?? '');
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => openSection(k)}
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
                              {place}
                            </span>
                          </span>
                          <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
                        </button>
                      );
                    })}
                  {navSectionKeys.filter((k) => {
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
                <>
                {/* INICIO CON SCROLL ROLL */}
                {(() => {
                  const isHomeOpen = expandedWorkspaces.has('home');
                  const homeHasDraft = isHomeDirty();
                  return (
                    <div
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isHomeOpen
                          ? 'border-accent/40 bg-surface-raised/40 shadow-sm'
                          : 'border-accent/30 bg-accent/5 hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center justify-between p-3 sm:p-3.5 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleWorkspaceRoll('home')}
                          aria-expanded={isHomeOpen}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left select-none group cursor-pointer"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                              isHomeOpen
                                ? 'bg-accent/20 border-accent/40 text-accent'
                                : 'bg-accent/10 border-accent/20 text-accent'
                            }`}
                          >
                            <Home size={18} strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="block text-sm font-bold text-foreground">Inicio</span>
                              {homeHasDraft && (
                                <span
                                  className="h-2 w-2 rounded-full bg-warning shrink-0"
                                  title="Tiene cambios pendientes de publicación"
                                />
                              )}
                            </span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                              Árbol de la portada y preview acoplada
                            </span>
                          </span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={openHomeWorkspace}
                            title="Entrar a Inicio"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-accent/30 bg-background/80 hover:bg-accent/15 text-accent text-[11px] font-semibold transition-colors min-h-8"
                          >
                            <span>Entrar</span>
                            <ChevronRight size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWorkspaceRoll('home')}
                            aria-label={isHomeOpen ? 'Contraer Inicio' : 'Desplegar Inicio'}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all min-h-8 min-w-8 flex items-center justify-center"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${
                                isHomeOpen ? 'rotate-180 text-accent' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {isHomeOpen && (
                          <motion.div
                            key="roll-home"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden border-t border-border/60 bg-surface-sunken/40"
                          >
                            <div className="max-h-72 overflow-y-auto scrollbar-thin py-1">
                              {HOME_ROLL_NODES.map((node) => {
                                const dirty = (groupedData[node.sectionKey] ?? []).some(
                                  (i) => i.draft_content != null,
                                );
                                return (
                                  <button
                                    key={node.sectionKey}
                                    type="button"
                                    onClick={() => openHomeNodeFromRoll(node.id, node.sectionKey)}
                                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors group"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <span className="h-1.5 w-1.5 rounded-full bg-accent/60 group-hover:bg-accent shrink-0" />
                                      <span className="font-medium text-foreground truncate">
                                        {node.label}
                                      </span>
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {dirty && (
                                        <span
                                          className="h-1.5 w-1.5 rounded-full bg-warning shrink-0"
                                          title="Borrador pendiente"
                                        />
                                      )}
                                      <ChevronRight
                                        size={12}
                                        className="text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="px-3.5 py-1.5 border-t border-border/40 bg-surface/30 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={openHomeWorkspace}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                              >
                                Abrir portada completa
                                <ChevronRight size={12} />
                              </button>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                9 bloques
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* WORKSPACES CON SCROLL ROLL */}
                {PAGE_WORKSPACE_ORDER.map((id) => {
                  const ws = PAGE_WORKSPACES[id];
                  const Icon = WORKSPACE_ICONS[id];
                  const isOpen = expandedWorkspaces.has(id);
                  const wsDirty = isWorkspaceDirty(id);
                  return (
                    <div
                      key={id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isOpen
                          ? 'border-accent/40 bg-surface-raised/40 shadow-sm'
                          : 'border-border bg-surface/60 hover:border-accent/40 hover:bg-surface-raised/20'
                      }`}
                    >
                      <div className="flex items-center justify-between p-3 sm:p-3.5 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleWorkspaceRoll(id)}
                          aria-expanded={isOpen}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left select-none group cursor-pointer"
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                              isOpen
                                ? 'bg-accent/15 border-accent/30 text-accent'
                                : 'bg-background border-border text-muted-foreground group-hover:text-foreground'
                            }`}
                          >
                            <Icon size={18} strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="block text-sm font-bold text-foreground">{ws.label}</span>
                              {wsDirty && (
                                <span
                                  className="h-2 w-2 rounded-full bg-warning shrink-0"
                                  title="Tiene cambios pendientes de publicación"
                                />
                              )}
                            </span>
                            <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                              {ws.hint}
                            </span>
                          </span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openPageWorkspace(id)}
                            title={`Entrar a ${ws.label}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-background/80 hover:border-accent/40 hover:bg-surface text-foreground text-[11px] font-semibold transition-colors min-h-8"
                          >
                            <span>Entrar</span>
                            <ChevronRight size={12} className="text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWorkspaceRoll(id)}
                            aria-label={isOpen ? `Contraer ${ws.label}` : `Desplegar ${ws.label}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all min-h-8 min-w-8 flex items-center justify-center"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-accent' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key={`roll-${id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden border-t border-border/60 bg-surface-sunken/40"
                          >
                            <div className="max-h-72 overflow-y-auto scrollbar-thin py-1">
                              {ws.nodes.map((node) => {
                                const dirty = isNodeDirty(node.sectionKey);
                                return (
                                  <button
                                    key={node.id}
                                    type="button"
                                    onClick={() => openPageWorkspace(id, node.sectionKey)}
                                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors group"
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <span className="h-1.5 w-1.5 rounded-full bg-accent/60 group-hover:bg-accent shrink-0" />
                                      <span className="font-medium text-foreground truncate">
                                        {node.label}
                                      </span>
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {node.previewPath ? (
                                        <span className="font-mono text-[10px] text-muted-foreground/80 px-1.5 py-0.5 rounded bg-background/80 border border-border/50">
                                          {node.previewPath}
                                        </span>
                                      ) : null}
                                      {dirty && (
                                        <span
                                          className="h-1.5 w-1.5 rounded-full bg-warning shrink-0"
                                          title="Borrador pendiente"
                                        />
                                      )}
                                      <ChevronRight
                                        size={12}
                                        className="text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
                                      />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="px-3.5 py-1.5 border-t border-border/40 bg-surface/30 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => openPageWorkspace(id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                              >
                                Abrir espacio completo {ws.label}
                                <ChevronRight size={12} />
                              </button>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {ws.nodes.length} secciones
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {EDITOR_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const catSections = filterCategorySectionKeys(navSectionKeys).filter(
                    (k) => sectionCategory(k) === cat.id,
                  );
                  if (catSections.length === 0) return null;
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
                })}
                </>
              )}
            </div>
          ) : navDrill === 'home' ? (
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface shrink-0">
                <button
                  type="button"
                  onClick={() => setNavDrill('categories')}
                  aria-label="Volver"
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground text-xs font-medium min-h-11"
                >
                  <ChevronLeft size={14} />
                  Editor
                </button>
                <p className="text-sm font-bold text-foreground truncate">Inicio</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
                {selectedHomeNode !== null && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    <button
                      type="button"
                      onClick={() => selectHomeNode(null)}
                      className="min-h-9 rounded-full border border-border px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-surface"
                    >
                      Orden
                    </button>
                    {(Object.keys(LANDING_SECTION_LABELS) as LandingSectionId[]).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectHomeNode(id)}
                        className={`min-h-9 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${
                          selectedHomeNode === id
                            ? 'border-accent bg-accent/10 text-foreground'
                            : 'border-border bg-background text-muted-foreground hover:bg-surface'
                        }`}
                      >
                        {LANDING_SECTION_LABELS[id]}
                      </button>
                    ))}
                  </div>
                )}
                {selectedHomeNode === 'hero' || selectedHomeNode === 'atmosphere' || selectedHomeNode === null ? (
                <LandingLayoutEditor
                  workspace
                  selectedNode={selectedHomeNode ?? undefined}
                  onSelectNode={selectHomeNode}
                  draftSectionIds={Object.fromEntries(
                    (Object.keys(LANDING_SECTION_LABELS) as LandingSectionId[]).map(
                      (id) => {
                        const key = id === 'hero' ? 'landing_layout' : LANDING_SECTION_EDITOR_KEY[id];
                        const dirty = key
                          ? (groupedData[key] ?? []).some((i) => i.draft_content != null)
                          : false;
                        return [id, dirty];
                      },
                    ),
                  )}
                  content={
                    workingCmsContent(
                      (groupedData['landing_layout'] ?? []).find((i) => localeOf(i) === editorLocale) ??
                        (groupedData['landing_layout'] ?? [])[0] ?? {
                          id: '',
                          section_key: 'landing_layout',
                          item_order: 1,
                          content: {},
                          is_active: true,
                        },
                    )
                  }
                  onSave={async (content) => {
                    const row =
                      (groupedData['landing_layout'] ?? []).find((i) => localeOf(i) === editorLocale) ??
                      (groupedData['landing_layout'] ?? [])[0];
                    if (row) {
                      await handleUpdateItem(row.id, content, row.is_active);
                    } else {
                      try {
                        const res = await cms.createItem.mutateAsync({
                          section_key: 'landing_layout',
                          content,
                          item_order: 1,
                          locale: editorLocale,
                        });
                        notifyRevalidate(res?.revalidated, res?.revalidate_reason);
                        refreshIframe();
                      } catch (err) {
                        const message = err instanceof Error ? err.message : 'Error al guardar';
                        toast(message, { type: 'error' });
                        throw err instanceof Error ? err : new Error(message);
                      }
                    }
                  }}
                />
                ) : (
                  <ItemsPanel
                    items={currentItems}
                    activeSection={activeSection}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    onPublish={handlePublishItem}
                    onDiscard={handleDiscardItem}
                    onImageUpload={handleImageUpload}
                    onAddNew={handleAddOrInit}
                    onUploadMultiple={handleUploadMultipleImages}
                    isMultiUploading={isMultiUploading}
                    multiUploadProgress={multiUploadProgress}
                    onReorder={handleReorder}
                    onDuplicate={handleDuplicateItem}
                    isDeleting={cms.deleteItem.isPending}
                    brandContent={groupedData['brand_assets']?.[0]?.content ?? null}
                    companionSettingsKey={companionSettingsKey}
                    companionSettingsItem={companionSettingsItem}
                    onInitCompanion={handleInitCompanion}
                    onSeedColecciones={handleSeedColecciones}
                    seedingColecciones={cms.createItem.isPending}
                    onOpenSection={(key) => {
                      setActiveSection(navVisibleSectionKey(key));
                    }}
                    onOpenImageLibrary={handleOpenImageLibrary}
                  />
                )}
              </div>
            </div>
          ) : navDrill === 'page' ? (
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              <div className="border-b border-border bg-surface shrink-0">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setNavDrill('categories')}
                      aria-label="Volver"
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground text-xs font-medium min-h-9"
                    >
                      <ChevronLeft size={14} />
                      Editor
                    </button>
                    {(() => {
                      const WsIcon = WORKSPACE_ICONS[pageWorkspaceId] ?? Package;
                      return (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                            <WsIcon size={13} strokeWidth={2} />
                          </span>
                          <p className="text-xs font-bold text-foreground truncate">
                            {PAGE_WORKSPACES[pageWorkspaceId].label}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                    {PAGE_WORKSPACES[pageWorkspaceId].nodes.length} secciones
                  </span>
                </div>

                {/* Barra horizontal de pestañas para las secciones del workspace */}
                <div className="flex items-center gap-1 px-2.5 py-1.5 overflow-x-auto scrollbar-thin bg-surface-sunken/40">
                  {PAGE_WORKSPACES[pageWorkspaceId].nodes.map((node) => {
                    const dirty = (groupedData[node.sectionKey] ?? []).some(
                      (i) => i.draft_content != null,
                    );
                    const selected = selectedPageNodeId === node.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => selectPageNode(node)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                          selected
                            ? 'bg-accent text-accent-foreground shadow-sm font-semibold'
                            : 'bg-background border border-border/70 text-muted-foreground hover:text-foreground hover:border-accent/40'
                        }`}
                      >
                        <span>{node.label}</span>
                        {dirty ? (
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              selected ? 'bg-accent-foreground' : 'bg-warning'
                            }`}
                            title="Borrador pendiente"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <ItemsPanel
                  items={currentItems}
                  activeSection={activeSection}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onPublish={handlePublishItem}
                  onDiscard={handleDiscardItem}
                  onImageUpload={handleImageUpload}
                  onAddNew={handleAddOrInit}
                  onUploadMultiple={handleUploadMultipleImages}
                  isMultiUploading={isMultiUploading}
                  multiUploadProgress={multiUploadProgress}
                  onReorder={handleReorder}
                  onDuplicate={handleDuplicateItem}
                  isDeleting={cms.deleteItem.isPending}
                  brandContent={groupedData['brand_assets']?.[0]?.content ?? null}
                  companionSettingsKey={companionSettingsKey}
                  companionSettingsItem={companionSettingsItem}
                  onInitCompanion={handleInitCompanion}
                  onOpenSection={(key) => {
                    setActiveSection(navVisibleSectionKey(key));
                  }}
                  onOpenImageLibrary={handleOpenImageLibrary}
                />
              </div>
            </div>
          ) : navDrill === 'list' ? (
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
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
              <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-4 bg-surface">
                <SectionNav
                  sectionKeys={navSectionKeys}
                  activeSection={activeSection}
                  category={activeCategory}
                  onSelect={(k) => {
                    setActiveSection(navVisibleSectionKey(k));
                    setNavDrill('tool');
                  }}
                  itemCounts={Object.fromEntries(
                    sectionKeys.map((k) => [
                      k,
                      (groupedData[k] ?? []).filter((i) => localeOf(i) === editorLocale).length,
                    ]),
                  )}
                />
              </div>

              {cms.error && !cms.isLoading ? (
                <CmsLoadError
                  message={cms.error.message}
                  onRetry={() => void cms.refetch()}
                />
              ) : null}
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              {cms.error && !cms.isLoading ? (
                <CmsLoadError
                  message={cms.error.message}
                  onRetry={() => void cms.refetch()}
                />
              ) : (
                <>
                  {/* EN sin versión: la tienda muestra la ES; botón para clonar */}
                  {editorLocale === 'en' && currentItems.length === 0 && esItems.length > 0 ? (
                    <div className="mx-3 mt-3 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 shrink-0">
                      <AlertTriangle size={14} className="text-accent shrink-0" />
                      <p className="text-[11px] text-muted-foreground leading-snug flex-1">
                        Esta sección no tiene versión EN — la tienda muestra la ES hasta que la crees.
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleCreateLocaleCopy()}
                        disabled={cms.createItem.isPending}
                        className="inline-flex min-h-8 items-center gap-1 px-2.5 rounded-full text-[11px] font-semibold border border-accent/40 bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {cms.createItem.isPending ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Languages size={11} />
                        )}
                        Crear desde ES ({esItems.length})
                      </button>
                    </div>
                  ) : null}
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
                    onAddNew={handleAddOrInit}
                    onUploadMultiple={handleUploadMultipleImages}
                    isMultiUploading={isMultiUploading}
                    multiUploadProgress={multiUploadProgress}
                    onReorder={handleReorder}
                    onDuplicate={handleDuplicateItem}
                    isDeleting={cms.deleteItem.isPending}
                    brandContent={groupedData['brand_assets']?.[0]?.content ?? null}
                    companionSettingsKey={companionSettingsKey}
                    companionSettingsItem={companionSettingsItem}
                    onInitCompanion={handleInitCompanion}
                    onOpenSection={(key) => {
                      setActiveSection(navVisibleSectionKey(key));
                      setNavDrill('tool');
                    }}
                    onOpenImageLibrary={handleOpenImageLibrary}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Preview — flex-1 self-stretch: alto = body del editor, no el de las categorías */}
        <section
          aria-label="Vista previa de la tienda"
          className={`min-h-0 min-w-0 self-stretch flex-col bg-muted/30 relative overflow-hidden ${
            desktopFocus === 'a' ? 'hidden' : 'flex flex-1'
          } ${mobileTab === 'preview' ? 'flex' : 'max-md:hidden'}`}
        >
          <div className="z-[2] flex shrink-0 flex-wrap items-center gap-2 border-b border-border/40 bg-surface/70 px-3 py-2">
            <label className="sr-only" htmlFor="editor-preview-path">
              Página de la previa
            </label>
            <select
              id="editor-preview-path"
              value={PREVIEW_DESTINATIONS.some((d) => d.path === previewPath) ? previewPath : ''}
              onChange={(e) => goPreview(e.target.value)}
              className="min-h-9 max-w-[12rem] rounded-lg border border-border bg-background px-2 text-[11px] text-foreground"
            >
              {!PREVIEW_DESTINATIONS.some((d) => d.path === previewPath) ? (
                <option value={previewPath}>
                  {previewPath.startsWith('/producto/') ? 'Ficha de producto' : previewPath || 'Inicio'}
                </option>
              ) : null}
              {PREVIEW_DESTINATIONS.map((d) => (
                <option key={d.path || '/'} value={d.path}>
                  {d.label}
                </option>
              ))}
            </select>
            {previewProducts.length > 0 ? (
              <>
                <label className="sr-only" htmlFor="editor-preview-product">
                  Producto de la previa
                </label>
                <select
                  id="editor-preview-product"
                  value={previewProductSlug ?? ''}
                  onChange={(e) => {
                    const slug = e.target.value;
                    if (slug) goProductPreview(slug);
                  }}
                  className="min-h-9 max-w-[14rem] rounded-lg border border-border bg-background px-2 text-[11px] text-foreground"
                >
                  <option value="" disabled>
                    Ver ficha…
                  </option>
                  {previewProducts.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>

          {/* Lienzo del iframe: en desktop llena el panel; en mobile centra el teléfono */}
          <div
            className={`relative z-[1] flex-1 min-h-0 w-full overflow-hidden ${
              viewMode === 'mobile'
                ? 'flex items-center justify-center p-3 sm:p-5'
                : 'flex flex-col p-0 sm:p-3 lg:p-4'
            }`}
          >
            {!tiendaUrl ? (
              <div className="m-auto text-center space-y-2 px-4">
                <Monitor size={48} className="mx-auto text-muted-foreground opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">URL de Tienda no configurada</p>
                <p className="text-xs text-muted-foreground/70">Configure el dominio de la tienda en los ajustes del sistema.</p>
              </div>
            ) : isSelfEmbed ? (
              <div className="m-auto text-center space-y-2 max-w-sm px-4">
                <AppWindow size={48} className="mx-auto text-destructive opacity-70" />
                <p className="text-sm font-medium text-foreground">Dominio de previsualización no disponible</p>
                <p className="text-xs text-muted-foreground/70 break-words">
                  El dominio configurado coincide con este panel de administración ({tiendaOrigin}). Indique el dominio público de la tienda para activar la vista previa.
                </p>
              </div>
            ) : viewMode === 'mobile' ? (
              <Iphone8Stage>
                <iframe
                  ref={iframeRef}
                  key={`${iframeKey}-${editorLocale}-m`}
                  src={iframeSrc}
                  title="Vista Previa de Tienda (iPhone 8)"
                  className="absolute inset-0 h-full w-full border-none bg-background"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  onLoad={handlePreviewLoad}
                />
                {previewLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-sunken/60 backdrop-blur-sm pointer-events-none">
                    <div className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 shadow-lg">
                      <Loader2 size={14} className="animate-spin text-accent" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Actualizando vista previa…
                      </span>
                    </div>
                  </div>
                ) : null}
              </Iphone8Stage>
            ) : (
              /* Escritorio: 100% del panel derecho (ancho y alto) */
              <div className="relative flex-1 min-h-0 w-full h-full rounded-none sm:rounded-xl border-0 sm:border border-border bg-background shadow-none sm:shadow-xl overflow-hidden">
                <iframe
                  ref={iframeRef}
                  key={`${iframeKey}-${editorLocale}-d`}
                  src={iframeSrc}
                  title="Vista Previa de Tienda"
                  className="absolute inset-0 w-full h-full border-none bg-background"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  onLoad={handlePreviewLoad}
                />
                {previewLoading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-sunken/60 backdrop-blur-sm pointer-events-none">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 border border-border shadow-lg">
                      <Loader2 size={14} className="animate-spin text-accent" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Actualizando vista previa…
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Add new item modal ── */}
      <ImmersiveModal
        open={showNewForm}
                onClose={() => {
                  cleanupModalUploads();
                  setShowNewForm(false);
                }}
                eyebrow={SECTION_LABELS[activeSection] ?? activeSection}
                title="Añadir elemento"
                size="lg"
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
          Las imágenes se cargan directamente desde aquí (no ingreses URLs externas). Sube la foto y completa el texto alternativo.
        </p>
        <div className="space-y-4">
          {newItemFields ? (
            <SchemaFormFields
              fields={newItemFields}
              values={newContent}
              onChange={(key, v) => setNewContent((prev) => ({ ...prev, [key]: v }))}
              onImageUpload={(file, fieldName) =>
                cms.uploadImage
                  .mutateAsync({
                    file,
                    sectionKey: activeSection as CMSSectionKey,
                    fieldName,
                  })
                  .then((result) => {
                    setModalUploadedPaths((prev) => {
                      const prevPath = prev[fieldName];
                      if (prevPath) {
                        void supabase.storage.from('cms').remove([prevPath]).catch(() => {});
                      }
                      return { ...prev, [fieldName]: result.path };
                    });
                    return result.publicUrl;
                  })
                  .catch((err) => {
                    toast(err instanceof Error ? err.message : 'Error al subir imagen', {
                      type: 'error',
                    });
                    return '';
                  })
              }
              onOpenImageLibrary={handleOpenImageLibrary}
              idPrefix="new-item"
            />
          ) : (
            Object.entries(newContent).map(([key, val]) => (
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
                  <div className="flex gap-2">
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
                      className="flex-1 flex justify-center items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-background border border-dashed border-accent/40 hover:border-accent transition-colors disabled:opacity-50 min-h-[40px]"
                    >
                      {modalUploading === key ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {val && typeof val === 'string' && val.startsWith('http')
                        ? 'Cambiar archivo'
                        : 'Subir foto'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenImageLibrary((url) => {
                          setNewContent((prev) => ({ ...prev, [key]: url }));
                        }, `Elegir imagen para ${fieldLabel(key)}`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium bg-surface-raised border border-border hover:border-accent/60 transition-colors min-h-[40px] text-foreground shrink-0"
                      title="Elegir foto existente de la biblioteca editorial"
                    >
                      <ImageIcon size={14} className="text-muted-foreground" />
                      Biblioteca
                    </button>
                  </div>
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
          )))}
        </div>
      </ImmersiveModal>

      {/* Biblioteca y Selector de Medios */}
      <ImageLibraryModal
        open={imagesOpen || Boolean(imageSelectorTarget)}
        onClose={() => {
          setImagesOpen(false);
          setImageSelectorTarget(null);
        }}
        getSectionLabel={(key) => SECTION_LABELS[key] ?? key}
        onSelect={imageSelectorTarget?.onSelect}
        selectPrompt={imageSelectorTarget?.prompt}
      />

      {/* Historial de versiones del CMS */}
      <CmsHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestored={refreshIframe}
      />
    </div>
  );
}
