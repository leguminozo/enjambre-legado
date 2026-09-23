'use client';

import React, { useState, useMemo, useId, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  ExternalLink,
  Globe,
  FileText,
  Home,
  ShoppingBag,
  Compass,
  Shield,
  Truck,
  RotateCcw,
  Cookie,
  Plus,
  X,
  Lock,
  Layers,
  Tag,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Upload,
  Loader2,
} from 'lucide-react';
import {
  parseSeoDefaults,
  STORE_SEO_PAGES,
  type SeoDefaults,
  type PageSeoItem,
  type StoreSeoPageDef,
} from '@/lib/store-chrome';
import { useAutosaveState } from '@/components/tienda/save-status';
import { getUrlTienda } from '@/lib/publicUrls';
import { toast, friendlyError } from '@enjambre/ui';

export interface SeoStudioEditorProps {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
}

function getPageIcon(path: string) {
  if (path === '/') return <Home size={15} />;
  if (path === '/catalogo') return <ShoppingBag size={15} />;
  if (path.startsWith('/experiencias')) return <Compass size={15} />;
  if (path.startsWith('/club')) return <Layers size={15} />;
  if (path === '/privacidad' || path === '/garantia') return <Shield size={15} />;
  if (path === '/envio') return <Truck size={15} />;
  if (path === '/reembolso' || path === '/cancelacion') return <RotateCcw size={15} />;
  if (path === '/cookies') return <Cookie size={15} />;
  if (path === '/terminos') return <Lock size={15} />;
  return <FileText size={15} />;
}

export function SeoStudioEditor({ content, onSave, onImageUpload }: SeoStudioEditorProps) {
  const { local, setLocal } = useAutosaveState('seo_defaults', content, parseSeoDefaults, (next) => onSave(next));

  const [selectedPath, setSelectedPath] = useState<string>('__global__');
  const [searchQuery, setSearchQuery] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [uploadingOg, setUploadingOg] = useState(false);
  const ogFileRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();

  // Filtrado de páginas según búsqueda
  const filteredPages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return STORE_SEO_PAGES;
    return STORE_SEO_PAGES.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q) ||
        p.defaultTitle.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const mainPages = useMemo(
    () => filteredPages.filter((p) => p.category !== 'legal'),
    [filteredPages]
  );
  const legalPages = useMemo(
    () => filteredPages.filter((p) => p.category === 'legal'),
    [filteredPages]
  );

  const activePageDef = useMemo(() => {
    if (selectedPath === '__global__') return null;
    return STORE_SEO_PAGES.find((p) => p.path === selectedPath) || null;
  }, [selectedPath]);

  const activePageSeo: PageSeoItem = useMemo(() => {
    if (selectedPath === '__global__') return {};
    return local.pages?.[selectedPath] || {};
  }, [local.pages, selectedPath]);

  const patchGlobal = <K extends keyof SeoDefaults>(key: K, value: SeoDefaults[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const patchActivePage = (patch: Partial<PageSeoItem>) => {
    if (selectedPath === '__global__') return;
    setLocal((prev) => {
      const prevPages = prev.pages || {};
      const currentPage = prevPages[selectedPath] || {};
      const updatedPage: PageSeoItem = { ...currentPage, ...patch };

      // Si todo está vacío, podemos mantener o limpiar
      return {
        ...prev,
        pages: {
          ...prevPages,
          [selectedPath]: updatedPage,
        },
      };
    });
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newKeyword.trim().toLowerCase();
    if (!tag) return;
    const currentKeywords = activePageSeo.keywords || [];
    if (!currentKeywords.includes(tag)) {
      patchActivePage({ keywords: [...currentKeywords, tag] });
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (tagToRemove: string) => {
    const currentKeywords = activePageSeo.keywords || [];
    patchActivePage({ keywords: currentKeywords.filter((k) => k !== tagToRemove) });
  };

  const handleOgFile = async (file: File) => {
    if (!onImageUpload || uploadingOg) return;
    setUploadingOg(true);
    try {
      const url = await Promise.resolve(onImageUpload(file, 'og_image_url'));
      if (typeof url === 'string' && url) patchGlobal('og_image_url', url);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setUploadingOg(false);
      if (ogFileRef.current) ogFileRef.current.value = '';
    }
  };

  // Cálculo de salud SEO por página
  const getPageHealth = (page: StoreSeoPageDef) => {
    const pSeo = local.pages?.[page.path];
    if (pSeo?.noindex) {
      return { status: 'noindex', label: 'noindex' };
    }
    const hasCustomTitle = Boolean(pSeo?.title?.trim());
    const hasCustomDesc = Boolean(pSeo?.description?.trim());

    if (hasCustomTitle && hasCustomDesc) {
      return { status: 'healthy', label: 'Optimizado' };
    }
    if (hasCustomTitle || hasCustomDesc) {
      return { status: 'partial', label: 'Parcial' };
    }
    return { status: 'default', label: 'Heredado' };
  };

  const baseUrl = getUrlTienda();

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado descriptivo del Centro de Control */}
      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-serif font-semibold text-foreground tracking-wide flex items-center gap-2">
              <SlidersHorizontal size={17} className="text-accent" />
              Centro de Control SEO
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Supervisa y edita los títulos, metadescripciones y directivas de rastreo de cada página de la tienda.
              Visualiza en vivo cómo aparecerá cada enlace en Google.
            </p>
          </div>
          <a
            href={`${baseUrl}/sitemap.xml`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-mono text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors"
          >
            sitemap.xml
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Grid de dos columnas: Directorio a la izquierda | Editor y SERP a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Directorio de Páginas */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          {/* Buscador de páginas */}
          <div className="relative">
            <label htmlFor={searchInputId} className="sr-only">
              Buscar páginas
            </label>
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              id={searchInputId}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar páginas..."
              className="w-full pl-9 pr-8 py-2 text-base md:text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
            {/* Opción Fija: Descripción General (SEO Global) */}
            <button
              type="button"
              onClick={() => setSelectedPath('__global__')}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                selectedPath === '__global__'
                  ? 'border-accent bg-accent/10 shadow-sm'
                  : 'border-border bg-card/40 hover:bg-surface-raised hover:border-border/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-md ${
                    selectedPath === '__global__' ? 'bg-accent/20 text-accent' : 'bg-surface-sunken text-muted-foreground'
                  }`}
                >
                  <Globe size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    Descripción general del sitio
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Valores predeterminados globales
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-success">
                <CheckCircle2 size={15} />
              </span>
            </button>

            {/* Grupo: Páginas Principales */}
            {mainPages.length > 0 && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Páginas principales ({mainPages.length})
                </p>
                <div className="space-y-1">
                  {mainPages.map((page) => {
                    const health = getPageHealth(page);
                    const isSelected = selectedPath === page.path;
                    return (
                      <button
                        key={page.path}
                        type="button"
                        onClick={() => setSelectedPath(page.path)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 text-xs ${
                          isSelected
                            ? 'border-accent bg-accent/10 font-medium'
                            : 'border-transparent hover:border-border hover:bg-surface-raised/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={isSelected ? 'text-accent' : 'text-muted-foreground'}>
                            {getPageIcon(page.path)}
                          </span>
                          <div className="min-w-0">
                            <span className="text-foreground truncate block">{page.label}</span>
                            <span className="text-[10px] font-mono text-muted-foreground truncate block">
                              {page.path}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {health.status === 'noindex' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-sunken text-muted-foreground border border-border">
                              <EyeOff size={10} /> noindex
                            </span>
                          ) : health.status === 'healthy' ? (
                            <span className="text-success" title="Título y descripción optimizados">
                              <CheckCircle2 size={14} />
                            </span>
                          ) : health.status === 'partial' ? (
                            <span className="text-warning" title="Personalización incompleta">
                              <AlertCircle size={14} />
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60" title="Usa metadatos por defecto">
                              <AlertCircle size={14} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grupo: Políticas y Legales */}
            {legalPages.length > 0 && (
              <div className="space-y-1 pt-2">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Políticas y Legales ({legalPages.length})
                </p>
                <div className="space-y-1">
                  {legalPages.map((page) => {
                    const health = getPageHealth(page);
                    const isSelected = selectedPath === page.path;
                    return (
                      <button
                        key={page.path}
                        type="button"
                        onClick={() => setSelectedPath(page.path)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 text-xs ${
                          isSelected
                            ? 'border-accent bg-accent/10 font-medium'
                            : 'border-transparent hover:border-border hover:bg-surface-raised/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={isSelected ? 'text-accent' : 'text-muted-foreground'}>
                            {getPageIcon(page.path)}
                          </span>
                          <div className="min-w-0">
                            <span className="text-foreground truncate block">{page.label}</span>
                            <span className="text-[10px] font-mono text-muted-foreground truncate block">
                              {page.path}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {health.status === 'noindex' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-surface-sunken text-muted-foreground border border-border">
                              <EyeOff size={10} /> noindex
                            </span>
                          ) : health.status === 'healthy' ? (
                            <span className="text-success">
                              <CheckCircle2 size={14} />
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">
                              <AlertCircle size={14} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Editor y Simulador SERP */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {selectedPath === '__global__' ? (
            /* ─────────────────────────────────────────────────────────────
               VISTA GLOBAL: SEO PREDETERMINADO DEL SITIO
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Tarjeta de título y acción */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Descripción General del Sitio Web
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Metadatos predeterminados que hereda cualquier página sin configuración específica.
                  </p>
                </div>
              </div>

              {/* SERP Preview Global */}
              <GoogleSerpPreview
                title={local.default_title || 'La Obrera y el Zángano · Tienda'}
                url={`${baseUrl}`}
                description={local.default_description || 'Miel cruda del bosque nativo de Chiloé.'}
                noindex={false}
              />

              {/* Campos Globales */}
              <div className="space-y-4">
                <CharacterCountInput
                  label="Título Predeterminado"
                  value={local.default_title}
                  onChange={(v) => patchGlobal('default_title', v)}
                  placeholder="La Obrera y el Zángano · Tienda"
                  recommendedMin={35}
                  recommendedMax={60}
                  helperText="Título base para buscadores cuando una página no tiene uno propio."
                />

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Plantilla de Título (%s = Nombre de la página)
                  </label>
                  <input
                    type="text"
                    value={local.title_template}
                    onChange={(e) => patchGlobal('title_template', e.target.value)}
                    placeholder="%s · La Obrera y el Zángano"
                    className="w-full px-3 py-2 text-base md:text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent/60 font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Se aplica en las páginas hijas para mantener consistencia de marca.
                  </p>
                </div>

                <CharacterCountTextarea
                  label="Descripción Predeterminada (Español)"
                  value={local.default_description}
                  onChange={(v) => patchGlobal('default_description', v)}
                  placeholder="Miel cruda del bosque nativo de Chiloé..."
                  recommendedMin={120}
                  recommendedMax={155}
                  helperText="Texto que describe la tienda en buscadores y redes sociales."
                />

                <CharacterCountTextarea
                  label="Descripción Predeterminada (Inglés)"
                  value={local.default_description_en ?? ''}
                  onChange={(v) => patchGlobal('default_description_en', v)}
                  placeholder="Raw honey from the native forests of Chiloé..."
                  recommendedMin={120}
                  recommendedMax={155}
                  helperText="Traducción para motores de búsqueda internacionales."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Nombre Oficial del Sitio (OpenGraph)
                    </label>
                    <input
                      type="text"
                      value={local.site_name}
                      onChange={(e) => patchGlobal('site_name', e.target.value)}
                      placeholder="La Obrera y el Zángano"
                      className="w-full px-3 py-2 text-base md:text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Twitter Handle
                    </label>
                    <input
                      type="text"
                      value={local.twitter_handle}
                      onChange={(e) => patchGlobal('twitter_handle', e.target.value)}
                      placeholder="@obrerayzangano"
                      className="w-full px-3 py-2 text-base md:text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent/60 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Imagen OpenGraph (URL o subida)
                  </label>
                  {local.og_image_url ? (
                    <img
                      src={local.og_image_url}
                      alt="Vista previa OpenGraph"
                      className="w-full max-h-40 object-cover rounded-lg border border-border bg-background"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <input
                    type="text"
                    value={local.og_image_url}
                    onChange={(e) => patchGlobal('og_image_url', e.target.value)}
                    placeholder="https://…/og-1200x630.jpg"
                    className="w-full px-3 py-2 text-base md:text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent/60 font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      ref={ogFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleOgFile(file);
                      }}
                    />
                    {onImageUpload ? (
                      <button
                        type="button"
                        disabled={uploadingOg}
                        onClick={() => ogFileRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-50"
                      >
                        {uploadingOg ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        <span>{uploadingOg ? 'Subiendo…' : 'Subir imagen'}</span>
                      </button>
                    ) : null}
                    {local.og_image_url ? (
                      <button
                        type="button"
                        onClick={() => patchGlobal('og_image_url', '')}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={13} />
                        <span>Quitar</span>
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Vacía = se usa la imagen de Marca. Ideal 1200×630.
                  </p>
                </div>
              </div>
            </div>
          ) : activePageDef ? (
            /* ─────────────────────────────────────────────────────────────
               VISTA DE PÁGINA ESPECÍFICA (Inspirada en el flujo de Hostinger)
               ───────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              {/* Barra superior de la página activa */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-accent">{getPageIcon(activePageDef.path)}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {activePageDef.label}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground">
                      {activePageDef.path}
                    </span>
                  </div>
                </div>

                <a
                  href={`${baseUrl}${activePageDef.path === '/' ? '' : activePageDef.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors"
                >
                  Ver página en vivo
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Simulador SERP de Google en Vivo */}
              <GoogleSerpPreview
                title={
                  activePageSeo.title?.trim() ||
                  activePageDef.defaultTitle ||
                  local.default_title
                }
                url={`${baseUrl}${activePageDef.path === '/' ? '' : activePageDef.path}`}
                description={
                  activePageSeo.description?.trim() ||
                  activePageDef.defaultDescription ||
                  local.default_description
                }
                noindex={Boolean(activePageSeo.noindex)}
              />

              {/* Interruptor Noindex */}
              <div className="p-3.5 rounded-xl border border-border bg-card/40 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground">
                      Agregar directiva noindex
                    </p>
                    {activePageSeo.noindex ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-destructive/15 text-destructive border border-destructive/30">
                        Oculta de Google
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Indica a los buscadores que no muestren esta página en los resultados de búsqueda.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={Boolean(activePageSeo.noindex)}
                  onClick={() => patchActivePage({ noindex: !activePageSeo.noindex })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    activePageSeo.noindex ? 'bg-destructive' : 'bg-surface-raised border-border'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                      activePageSeo.noindex ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Palabras Clave Objetivo (Chips / Tags) */}
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card/40">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Tag size={12} className="text-accent" />
                    Palabras clave objetivo
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {activePageSeo.keywords?.length || 0} registradas
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Registra los términos clave que atiende esta página para guiar la redacción y verificar cobertura.
                </p>

                {/* Lista de chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(activePageSeo.keywords || []).map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-surface-sunken border border-border text-foreground"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title={`Eliminar "${kw}"`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {(!activePageSeo.keywords || activePageSeo.keywords.length === 0) && (
                    <p className="text-xs italic text-muted-foreground/70 py-1">
                      Sin palabras clave asociadas aún.
                    </p>
                  )}
                </div>

                {/* Formulario para añadir nueva palabra clave */}
                <form onSubmit={handleAddKeyword} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Ej. miel cruda, chiloé, floración..."
                    className="flex-1 px-3 py-1.5 text-base md:text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60"
                  />
                  <button
                    type="submit"
                    disabled={!newKeyword.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/15 text-accent text-xs font-medium hover:bg-accent/25 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Plus size={13} />
                    Añadir
                  </button>
                </form>
              </div>

              {/* Título SEO Específico */}
              <CharacterCountInput
                label="Título SEO"
                value={activePageSeo.title ?? ''}
                onChange={(v) => patchActivePage({ title: v })}
                placeholder={activePageDef.defaultTitle}
                recommendedMin={35}
                recommendedMax={60}
                helperText="Si lo dejas vacío, los buscadores usarán el título predeterminado de la página."
              />

              {/* Metadescripción Específica */}
              <CharacterCountTextarea
                label="Metadescripción"
                value={activePageSeo.description ?? ''}
                onChange={(v) => patchActivePage({ description: v })}
                placeholder={activePageDef.defaultDescription}
                recommendedMin={120}
                recommendedMax={155}
                helperText="Resume con elegancia el valor de esta página para convencer al visitante en la búsqueda."
              />

              {/* Diagnóstico de Salud de la Página */}
              <div className="rounded-xl border border-border bg-surface-sunken/40 p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Diagnóstico de salud SEO
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg border border-border bg-card/50">
                    <p className="text-[11px] text-muted-foreground">Título</p>
                    <p className="text-xs font-medium text-foreground mt-0.5 flex items-center gap-1">
                      {activePageSeo.title?.trim() ? (
                        <span className="text-success flex items-center gap-1">
                          <CheckCircle2 size={13} /> Personalizado
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Info size={13} /> Predeterminado
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg border border-border bg-card/50">
                    <p className="text-[11px] text-muted-foreground">Metadescripción</p>
                    <p className="text-xs font-medium text-foreground mt-0.5 flex items-center gap-1">
                      {activePageSeo.description?.trim() ? (
                        <span className="text-success flex items-center gap-1">
                          <CheckCircle2 size={13} /> Personalizada
                        </span>
                      ) : (
                        <span className="text-warning flex items-center gap-1">
                          <AlertCircle size={13} /> Predeterminada
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg border border-border bg-card/50">
                    <p className="text-[11px] text-muted-foreground">Indexación</p>
                    <p className="text-xs font-medium text-foreground mt-0.5 flex items-center gap-1">
                      {activePageSeo.noindex ? (
                        <span className="text-destructive flex items-center gap-1">
                          <EyeOff size={13} /> noindex
                        </span>
                      ) : (
                        <span className="text-success flex items-center gap-1">
                          <CheckCircle2 size={13} /> Indexable
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES AUXILIARES: SIMULADOR DE GOOGLE SERP Y CONTADORES
// ─────────────────────────────────────────────────────────────────────────────

interface GoogleSerpPreviewProps {
  title: string;
  url: string;
  description: string;
  noindex?: boolean;
}

function GoogleSerpPreview({ title, url, description, noindex }: GoogleSerpPreviewProps) {
  // Limpiar URL para mostrar formato amigable estilo Google breadcrumb
  const displayUrl = useMemo(() => {
    try {
      const u = new URL(url);
      const segments = u.pathname.split('/').filter(Boolean);
      if (segments.length === 0) return `${u.origin}`;
      return `${u.origin} › ${segments.join(' › ')}`;
    } catch {
      return url;
    }
  }, [url]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Globe size={12} className="text-accent" />
          Vista previa en Google SERP
        </label>
        {noindex ? (
          <span className="text-[11px] font-mono text-destructive flex items-center gap-1">
            <EyeOff size={12} /> Excluida de la indexación
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Simulación de escritorio y móvil</span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-[#1f1f1f] p-4 font-sans text-left shadow-inner transition-all">
        {/* Cabecera Google: Favicon + Sitio + Miga de pan */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-full bg-surface-raised border border-border flex items-center justify-center text-[10px] font-serif font-bold text-accent">
            OZ
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[12px] text-[#dadce0] font-medium truncate">
              La Obrera y el Zángano
            </p>
            <p className="text-[10px] text-[#bdc1c6] font-mono truncate">
              {displayUrl}
            </p>
          </div>
        </div>

        {/* Título en azul Google / Dorado sutil */}
        <h4 className="text-[16px] md:text-[18px] text-[#8ab4f8] font-normal leading-snug hover:underline cursor-pointer line-clamp-2">
          {title || 'Título de la página'}
        </h4>

        {/* Metadescripción */}
        <p className="text-[12px] md:text-[13px] text-[#bdc1c6] leading-relaxed mt-1 line-clamp-3">
          {description || 'Los motores de búsqueda generarán un extracto automático si este campo queda vacío.'}
        </p>

        {noindex && (
          <div className="mt-3 pt-2.5 border-t border-[#3c4043] flex items-center gap-2 text-[11px] text-[#f28b82]">
            <EyeOff size={13} className="shrink-0" />
            <span>
              Directiva <strong>noindex</strong> activa: esta página no aparecerá en búsquedas públicas.
            </span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground italic px-1">
        Google suele tomar entre unos días y dos semanas en actualizar sus resultados tras cada publicación.
      </p>
    </div>
  );
}

interface CharacterCountInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  recommendedMin?: number;
  recommendedMax?: number;
  helperText?: string;
}

function CharacterCountInput({
  label,
  value,
  onChange,
  placeholder,
  recommendedMin = 35,
  recommendedMax = 60,
  helperText,
}: CharacterCountInputProps) {
  const len = value.length;
  const inputId = useId();

  // Color de la barra según rango
  const statusColor =
    len === 0
      ? 'bg-muted-foreground/30'
      : len < recommendedMin
      ? 'bg-warning'
      : len <= recommendedMax
      ? 'bg-success'
      : 'bg-destructive';

  const statusLabel =
    len === 0
      ? 'Vacío (usa predeterminado)'
      : len < recommendedMin
      ? 'Corto'
      : len <= recommendedMax
      ? 'Óptimo'
      : 'Se cortará en Google';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {len} / {recommendedMax} caracteres
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              len <= recommendedMax && len >= recommendedMin
                ? 'bg-success/15 text-success'
                : len > recommendedMax
                ? 'bg-destructive/15 text-destructive'
                : 'bg-surface-sunken text-muted-foreground'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-base md:text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent/60 transition-colors"
      />

      {/* Barra de progreso de longitud */}
      <div className="w-full h-1 bg-surface-sunken rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-150 ${statusColor}`}
          style={{ width: `${Math.min(100, (len / recommendedMax) * 100)}%` }}
        />
      </div>

      {helperText ? <p className="text-[11px] text-muted-foreground">{helperText}</p> : null}
    </div>
  );
}

interface CharacterCountTextareaProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  recommendedMin?: number;
  recommendedMax?: number;
  helperText?: string;
}

function CharacterCountTextarea({
  label,
  value,
  onChange,
  placeholder,
  recommendedMin = 120,
  recommendedMax = 155,
  helperText,
}: CharacterCountTextareaProps) {
  const len = value.length;
  const areaId = useId();

  const statusColor =
    len === 0
      ? 'bg-muted-foreground/30'
      : len < recommendedMin
      ? 'bg-warning'
      : len <= recommendedMax
      ? 'bg-success'
      : 'bg-destructive';

  const statusLabel =
    len === 0
      ? 'Vacío (usa predeterminado)'
      : len < recommendedMin
      ? 'Breve'
      : len <= recommendedMax
      ? 'Óptimo'
      : 'Se cortará en Google';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={areaId} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {len} / {recommendedMax} caracteres
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              len <= recommendedMax && len >= recommendedMin
                ? 'bg-success/15 text-success'
                : len > recommendedMax
                ? 'bg-destructive/15 text-destructive'
                : 'bg-surface-sunken text-muted-foreground'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <textarea
        id={areaId}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-base md:text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent/60 transition-colors leading-relaxed"
      />

      {/* Barra de progreso de longitud */}
      <div className="w-full h-1 bg-surface-sunken rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-150 ${statusColor}`}
          style={{ width: `${Math.min(100, (len / recommendedMax) * 100)}%` }}
        />
      </div>

      {helperText ? <p className="text-[11px] text-muted-foreground">{helperText}</p> : null}
    </div>
  );
}
