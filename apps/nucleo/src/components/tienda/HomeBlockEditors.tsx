'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, MapPin, PlayCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  type ConservationContent,
  type MapSettings,
  type ProductsSettings,
  type VideoSettings,
  type CollectionsSettings,
  type GaleriaSettings,
  type NosotrosSettings,
  type MediaSettings,
  type CienciaSettings,
  type CarouselHeightMode,
  type ImageAspectRatio,
  type ImageFitMode,
  type LegalDocContent,
  type AuthSettings,
  type AuthBackgroundStyle,
  type AuthParticleEffect,
  type PublicCopyRiskKind,
  parseConservationContent,
  parseMapSettings,
  parseProductsSettings,
  parseVideoSettings,
  parseCollectionsSettings,
  parseGaleriaSettings,
  parseNosotrosSettings,
  parseMediaSettings,
  parseCienciaSettings,
  parseLegalDoc,
  parseAuthSettings,
  scanPublicCopyRisks,
  AUTH_BACKGROUND_STYLES,
  AUTH_PARTICLE_EFFECTS,
} from '@/lib/store-chrome';
import { useAutosaveEditor } from '@/components/tienda/save-status';

// ── Helpers de formulario (mismo lenguaje visual del editor) ────────────────

const inputClass =
  'w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent';
const labelClass = 'text-[10px] font-bold uppercase tracking-wider text-muted-foreground';

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function AreaField({
  label,
  id,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} resize-y`}
      />
    </div>
  );
}

function CopyRiskBanner({
  text,
  kinds,
}: {
  text: string;
  kinds: readonly PublicCopyRiskKind[];
}) {
  const risks = scanPublicCopyRisks(text, kinds);
  if (risks.length === 0) return null;
  return (
    <div
      role="status"
      className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-[11px] text-foreground"
    >
      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-destructive" />
      <p>
        Este texto publicaría {risks.map((r) => r.label).join(', ')}. En la tienda no va
        stack de patio ni claims sanitarios (20.606).
      </p>
    </div>
  );
}

function CollapsibleGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left bg-surface-raised/50 hover:bg-surface-raised transition-colors"
      >
        <ChevronDown
          size={14}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
        />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </button>
      {open ? <div className="p-4 space-y-3">{children}</div> : null}
    </div>
  );
}

/** Par ES/EN de un campo, en grid de 2 columnas (desktop). */
function LocalePair({
  idPrefix,
  es,
  en,
  onEs,
  onEn,
  esLabel,
  enLabel = '… (EN)',
  textarea = false,
}: {
  idPrefix: string;
  es: string;
  en: string;
  onEs: (v: string) => void;
  onEn: (v: string) => void;
  esLabel: string;
  enLabel?: string;
  textarea?: boolean;
}) {
  const Comp = textarea ? AreaField : Field;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Comp label={esLabel} id={`${idPrefix}-es`} value={es} onChange={onEs} />
      <Comp label={enLabel} id={`${idPrefix}-en`} value={en} onChange={onEn} />
    </div>
  );
}

// ── Video ───────────────────────────────────────────────────────────────────

export function VideoSettingsEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<VideoSettings>(() => parseVideoSettings(content));
  const { isDirty } = useAutosaveEditor('video_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseVideoSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  const videoId = local.youtube_id.trim();

  return (
    <div className="space-y-4 pb-8">
      {/* Mini-preview: thumbnail real del video */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vista previa del video
          </p>
        </div>
        <div className="p-4">
          {videoId ? (
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-video rounded-lg overflow-hidden border border-border bg-surface-sunken"
            >
              <img
                src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                alt={local.title || 'Video del bloque'}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background/85 backdrop-blur text-accent group-hover:scale-110 transition-transform">
                  <PlayCircle size={22} />
                </span>
              </span>
              {local.title ? (
                <span className="absolute bottom-0 inset-x-0 px-3 py-2 bg-background/80 backdrop-blur text-xs font-medium text-foreground">
                  {local.title}
                </span>
              ) : null}
            </a>
          ) : (
            <div className="aspect-video rounded-lg border border-dashed border-border bg-surface-sunken flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <PlayCircle size={28} className="opacity-50" />
              <p className="text-xs">Sin video configurado — la tienda usa el video por defecto</p>
            </div>
          )}
        </div>
      </div>

      <Field
        label="ID de YouTube"
        id="video-youtube-id"
        value={local.youtube_id}
        onChange={(v) => patch('youtube_id', v)}
        placeholder="btf0A6zzZtI"
      />
      <Field
        label="Título"
        id="video-title"
        value={local.title ?? ''}
        onChange={(v) => patch('title', v)}
        placeholder="La Obrera y el Zángano"
      />
      <p className="text-[10px] text-muted-foreground">
        ID vacío = la tienda usa el video por defecto (NEXT_PUBLIC_YOUTUBE_VIDEO_ID).
      </p>
    </div>
  );
}

// ── Mapa ────────────────────────────────────────────────────────────────────

export function MapSettingsEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<MapSettings>(() => parseMapSettings(content));
  const { isDirty } = useAutosaveEditor('map_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseMapSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  // Vacío → NaN: conservar el valor previo en vez de caer a (0,0) en el océano.
  const patchCoord = (key: 'lat' | 'lng', value: number) => {
    if (!Number.isFinite(value)) return;
    patch(key, value);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Mini-preview: pin + popup simulado */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vista previa del marcador
          </p>
        </div>
        <div className="p-4">
          <div className="relative h-40 rounded-lg border border-border bg-surface-sunken overflow-hidden flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '20px 20px',
              }}
            />
            <div className="relative flex flex-col items-center gap-2">
              <MapPin size={26} className="text-accent" />
              <div className="text-center rounded-lg border border-border bg-background px-4 py-2 shadow-sm max-w-[220px]">
                <p className="text-xs font-bold text-foreground truncate">
                  {local.popup_title || 'Título del marcador'}
                </p>
                {local.popup_body ? (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {local.popup_body}
                  </p>
                ) : null}
              </div>
              <p className="text-[10px] font-mono text-muted-foreground tabular-nums">
                {local.lat.toFixed(4)}, {local.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="map-lat" className={labelClass}>
            Latitud
          </label>
          <input
            id="map-lat"
            name="map-lat"
            type="number"
            step="0.0001"
            value={local.lat}
            onChange={(e) => patchCoord('lat', Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="map-lng" className={labelClass}>
            Longitud
          </label>
          <input
            id="map-lng"
            name="map-lng"
            type="number"
            step="0.0001"
            value={local.lng}
            onChange={(e) => patchCoord('lng', Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
      <Field
        label="Título del marcador"
        id="map-popup-title"
        value={local.popup_title}
        onChange={(v) => patch('popup_title', v)}
        placeholder="Sector Pureo, Chiloé"
      />
      <AreaField
        label="Cuerpo del marcador"
        id="map-popup-body"
        value={local.popup_body}
        onChange={(v) => patch('popup_body', v)}
        placeholder="Árboles registrados con coordenadas y especie…"
      />
    </div>
  );
}

// ── Productos (cabecera del bloque) ─────────────────────────────────────────

export function ProductsSettingsEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<ProductsSettings>(() => parseProductsSettings(content));
  const { isDirty } = useAutosaveEditor('products_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseProductsSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof ProductsSettings>(key: K, value: ProductsSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  // Catálogo real para el selector de destacados (mismo patrón que CRM).
  const [catalogProducts, setCatalogProducts] = useState<
    Array<{ id: string; nombre: string; formato: string | null }>
  >([]);
  const [productQuery, setProductQuery] = useState('');
  const [catalogError, setCatalogError] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase
      .from('productos')
      .select('id, nombre, formato')
      .eq('visible', true)
      .order('nombre')
      .limit(200)
      .then(
        (result: {
          data: Array<{ id: string; nombre: string; formato: string | null }> | null;
          error: unknown;
        }) => {
          const { data, error } = result;
          if (!active) return;
          if (error || !data) {
            setCatalogError(true);
            return;
          }
          setCatalogProducts(data);
        },
      );
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return catalogProducts;
    return catalogProducts.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.formato ?? '').toLowerCase().includes(q),
    );
  }, [catalogProducts, productQuery]);

  const featured = local.featured_ids ?? [];
  const toggleFeatured = (id: string) => {
    const next = featured.includes(id)
      ? featured.filter((x) => x !== id)
      : [...featured, id];
    patch('featured_ids', next);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Mini-preview: cabecera editorial del bloque */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vista previa de la cabecera
          </p>
        </div>
        <div className="p-6 text-center">
          <span className="block mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            {local.kicker || 'Creaciones'}
          </span>
          <h3 className="font-display text-2xl font-light text-foreground text-balance">
            {local.title || 'La materia de nuestras búsquedas'}
          </h3>
          <p className="text-muted-foreground italic font-display text-sm mt-2 text-pretty max-w-md mx-auto">
            {local.desc}
          </p>
        </div>
      </div>

      <LocalePair
        idPrefix="products-kicker"
        esLabel="Kicker (ES)"
        es={local.kicker}
        en={local.kicker_en ?? ''}
        onEs={(v) => patch('kicker', v)}
        onEn={(v) => patch('kicker_en', v)}
      />
      <LocalePair
        idPrefix="products-title"
        esLabel="Título (ES)"
        es={local.title}
        en={local.title_en ?? ''}
        onEs={(v) => patch('title', v)}
        onEn={(v) => patch('title_en', v)}
      />
      <LocalePair
        idPrefix="products-desc"
        esLabel="Descripción (ES)"
        es={local.desc}
        en={local.desc_en ?? ''}
        onEs={(v) => patch('desc', v)}
        onEn={(v) => patch('desc_en', v)}
        textarea
      />

      <ImageFormatFields
        aspectRatio={local.image_aspect_ratio}
        fitMode={local.image_fit}
        onAspectRatio={(v) => patch('image_aspect_ratio', v)}
        onFitMode={(v) => patch('image_fit', v)}
      />

      {/* Selector de productos destacados (orden real en el bloque) */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised/50 flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Productos destacados ({featured.length})
          </p>
          {featured.length > 0 ? (
            <button
              type="button"
              onClick={() => patch('featured_ids', [])}
              className="text-[10px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Limpiar
            </button>
          ) : null}
        </div>
        <div className="p-3 space-y-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Los elegidos se muestran primero en el bloque de la tienda. Vacío =
            todos los productos del catálogo en su orden.
          </p>
          <div className="relative">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              id="products-featured-search"
              name="products-featured-search"
              type="text"
              autoComplete="off"
              aria-label="Buscar producto"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar producto…"
              className={`${inputClass} pl-8`}
            />
          </div>
          {catalogError ? (
            <p className="text-[11px] text-destructive">No se pudo cargar el catálogo.</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              {catalogProducts.length === 0
                ? 'Cargando catálogo…'
                : 'Sin productos para “' + productQuery.trim() + '”'}
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {filteredProducts.map((p) => {
                const checked = featured.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleFeatured(p.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors border ${
                      checked
                        ? 'bg-accent/10 border-accent/30 text-foreground'
                        : 'bg-surface-sunken border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? 'bg-accent border-accent' : 'border-border bg-background'
                      }`}
                      aria-hidden
                    >
                      {checked ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-foreground">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{p.nombre}</span>
                    {p.formato ? (
                      <span className="shrink-0 text-[10px] text-muted-foreground uppercase tracking-wider">
                        {p.formato}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Conservación ────────────────────────────────────────────────────────────

export function ConservationEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<ConservationContent>(() => parseConservationContent(content));
  const { isDirty } = useAutosaveEditor('conservation_content', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseConservationContent(content));
  }, [content, isDirty]);

  const patch = <K extends keyof ConservationContent>(key: K, value: ConservationContent[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  const stats: Array<{ key: keyof ConservationContent; fallback: string }> = [
    { key: 'stat1_label', fallback: 'Árboles plantados' },
    { key: 'stat2_label', fallback: 'CO₂ evitado (kg)' },
    { key: 'stat3_label', fallback: 'Colmenas custodiadas' },
    { key: 'stat4_label', fallback: 'Especies nativas' },
  ];
  const tris: Array<{ labelKey: keyof ConservationContent; descKey: keyof ConservationContent }> = [
    { labelKey: 'tri1_label', descKey: 'tri1_desc' },
    { labelKey: 'tri2_label', descKey: 'tri2_desc' },
    { labelKey: 'tri3_label', descKey: 'tri3_desc' },
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* Mini-preview: bloque de conservación */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vista previa del bloque
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div className="text-center">
            <span className="block mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              {local.kicker}
            </span>
            <h3 className="font-display text-2xl font-light text-foreground text-balance">
              {local.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed text-pretty max-w-md mx-auto">
              {local.desc}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div
                key={String(s.key)}
                className="rounded-lg border border-border bg-surface-sunken/60 p-2 text-center"
              >
                <p className="text-[10px] font-bold text-accent uppercase tracking-wider leading-tight">
                  {(local[s.key] as string) || s.fallback}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {tris.map((t) => (
              <div key={String(t.labelKey)} className="rounded-lg border border-border p-3">
                <p className="text-[11px] font-bold text-foreground">
                  {(local[t.labelKey] as string) || 'Fuente'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-3">
                  {(local[t.descKey] as string) || ''}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              {local.irr_label}
            </span>
            <span className="text-[10px] text-muted-foreground">· {local.irr_pos_title}</span>
          </div>
        </div>
      </div>

      <CollapsibleGroup title="Cabecera" defaultOpen>
        <LocalePair
          idPrefix="cons-kicker"
          esLabel="Kicker (ES)"
          es={local.kicker}
          en={local.kicker_en ?? ''}
          onEs={(v) => patch('kicker', v)}
          onEn={(v) => patch('kicker_en', v)}
        />
        <LocalePair
          idPrefix="cons-title"
          esLabel="Título (ES)"
          es={local.title}
          en={local.title_en ?? ''}
          onEs={(v) => patch('title', v)}
          onEn={(v) => patch('title_en', v)}
        />
        <LocalePair
          idPrefix="cons-desc"
          esLabel="Descripción (ES)"
          es={local.desc}
          en={local.desc_en ?? ''}
          onEs={(v) => patch('desc', v)}
          onEn={(v) => patch('desc_en', v)}
          textarea
        />
      </CollapsibleGroup>

      <CollapsibleGroup title="Estadísticas (4)">
        <LocalePair
          idPrefix="cons-stat1"
          esLabel="Stat 1 (ES)"
          es={local.stat1_label}
          en={local.stat1_label_en ?? ''}
          onEs={(v) => patch('stat1_label', v)}
          onEn={(v) => patch('stat1_label_en', v)}
        />
        <LocalePair
          idPrefix="cons-stat2"
          esLabel="Stat 2 (ES)"
          es={local.stat2_label}
          en={local.stat2_label_en ?? ''}
          onEs={(v) => patch('stat2_label', v)}
          onEn={(v) => patch('stat2_label_en', v)}
        />
        <LocalePair
          idPrefix="cons-stat3"
          esLabel="Stat 3 (ES)"
          es={local.stat3_label}
          en={local.stat3_label_en ?? ''}
          onEs={(v) => patch('stat3_label', v)}
          onEn={(v) => patch('stat3_label_en', v)}
        />
        <LocalePair
          idPrefix="cons-stat4"
          esLabel="Stat 4 (ES)"
          es={local.stat4_label}
          en={local.stat4_label_en ?? ''}
          onEs={(v) => patch('stat4_label', v)}
          onEn={(v) => patch('stat4_label_en', v)}
        />
      </CollapsibleGroup>

      <CollapsibleGroup title="Triangulación">
        <LocalePair
          idPrefix="cons-tri-label"
          esLabel="Cabecera (ES)"
          es={local.tri_label}
          en={local.tri_label_en ?? ''}
          onEs={(v) => patch('tri_label', v)}
          onEn={(v) => patch('tri_label_en', v)}
        />
        {tris.map((t, i) => (
          <div key={String(t.labelKey)} className="space-y-3 border-t border-border/60 pt-3">
            <LocalePair
              idPrefix={`cons-tri${i + 1}-label`}
              esLabel={`Fuente ${i + 1} — Título (ES)`}
              es={local[t.labelKey] as string}
              en={local[`${t.labelKey}_en` as keyof ConservationContent] as string}
              onEs={(v) => patch(t.labelKey, v)}
              onEn={(v) => patch(`${t.labelKey}_en` as keyof ConservationContent, v)}
            />
            <LocalePair
              idPrefix={`cons-tri${i + 1}-desc`}
              esLabel={`Fuente ${i + 1} — Texto (ES)`}
              es={local[t.descKey] as string}
              en={local[`${t.descKey}_en` as keyof ConservationContent] as string}
              onEs={(v) => patch(t.descKey, v)}
              onEn={(v) => patch(`${t.descKey}_en` as keyof ConservationContent, v)}
              textarea
            />
          </div>
        ))}
      </CollapsibleGroup>

      <CollapsibleGroup title="IRR (Índice de Regeneración)">
        <LocalePair
          idPrefix="cons-irr-label"
          esLabel="Etiqueta IRR (ES)"
          es={local.irr_label}
          en={local.irr_label_en ?? ''}
          onEs={(v) => patch('irr_label', v)}
          onEn={(v) => patch('irr_label_en', v)}
        />
        <LocalePair
          idPrefix="cons-irr-pos-title"
          esLabel="IRR positivo — Título (ES)"
          es={local.irr_pos_title}
          en={local.irr_pos_title_en ?? ''}
          onEs={(v) => patch('irr_pos_title', v)}
          onEn={(v) => patch('irr_pos_title_en', v)}
        />
        <LocalePair
          idPrefix="cons-irr-pos-desc"
          esLabel="IRR positivo — Texto (ES)"
          es={local.irr_pos_desc}
          en={local.irr_pos_desc_en ?? ''}
          onEs={(v) => patch('irr_pos_desc', v)}
          onEn={(v) => patch('irr_pos_desc_en', v)}
          textarea
        />
        <LocalePair
          idPrefix="cons-irr-neg-title"
          esLabel="IRR negativo — Título (ES)"
          es={local.irr_neg_title}
          en={local.irr_neg_title_en ?? ''}
          onEs={(v) => patch('irr_neg_title', v)}
          onEn={(v) => patch('irr_neg_title_en', v)}
        />
        <LocalePair
          idPrefix="cons-irr-neg-desc"
          esLabel="IRR negativo — Texto (ES)"
          es={local.irr_neg_desc}
          en={local.irr_neg_desc_en ?? ''}
          onEs={(v) => patch('irr_neg_desc', v)}
          onEn={(v) => patch('irr_neg_desc_en', v)}
          textarea
        />
      </CollapsibleGroup>

      <CollapsibleGroup title="CTA">
        <LocalePair
          idPrefix="cons-cta"
          esLabel="CTA (ES)"
          es={local.cta_label}
          en={local.cta_label_en ?? ''}
          onEs={(v) => patch('cta_label', v)}
          onEn={(v) => patch('cta_label_en', v)}
        />
      </CollapsibleGroup>
    </div>
  );
}

function ImageFormatFields({
  aspectRatio,
  fitMode,
  onAspectRatio,
  onFitMode,
}: {
  aspectRatio: ImageAspectRatio;
  fitMode: ImageFitMode;
  onAspectRatio: (v: ImageAspectRatio) => void;
  onFitMode: (v: ImageFitMode) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className={labelClass}>Relación de Aspecto de Imagen</label>
        <select
          value={aspectRatio}
          onChange={(e) => onAspectRatio(e.target.value as ImageAspectRatio)}
          className={inputClass}
        >
          <option value="16/9">16:9 Widescreen (Hero / Historia)</option>
          <option value="16/10">16:10 Panorámico (Compacto)</option>
          <option value="4/3">4:3 Horizontal (Recomendado - Fotos completas)</option>
          <option value="1/1">1:1 Cuadrado</option>
          <option value="3/4">3:4 Vertical / Retrato</option>
          <option value="auto">Auto (Original de la foto)</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Modo de Encuadre (Fit)</label>
        <select
          value={fitMode}
          onChange={(e) => onFitMode(e.target.value as ImageFitMode)}
          className={inputClass}
        >
          <option value="cover">Rellenar contenedor (Cover)</option>
          <option value="contain">Ajustar foto completa sin cortar (Contain)</option>
        </select>
      </div>
    </div>
  );
}

export function CollectionsSettingsEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<CollectionsSettings>(() => parseCollectionsSettings(content));
  const { isDirty } = useAutosaveEditor('collections_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseCollectionsSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof CollectionsSettings>(key: K, value: CollectionsSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vista previa de la cabecera
          </p>
        </div>
        <div className="p-6 text-center">
          <span className="block mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            {local.kicker || 'Colecciones'}
          </span>
          <h3 className="font-display text-2xl font-light text-foreground text-balance">
            {local.title || 'Explora nuestras categorías estacionales'}
          </h3>
          {local.subtitle ? (
            <p className="text-muted-foreground italic font-display text-sm mt-2 text-pretty max-w-md mx-auto">
              {local.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <LocalePair
        idPrefix="collections-kicker"
        esLabel="Kicker (ES)"
        es={local.kicker}
        en={local.kicker_en ?? ''}
        onEs={(v) => patch('kicker', v)}
        onEn={(v) => patch('kicker_en', v)}
      />
      <LocalePair
        idPrefix="collections-title"
        esLabel="Título (ES)"
        es={local.title}
        en={local.title_en ?? ''}
        onEs={(v) => patch('title', v)}
        onEn={(v) => patch('title_en', v)}
      />
      <LocalePair
        idPrefix="collections-subtitle"
        esLabel="Subtítulo / Descripción (ES)"
        es={local.subtitle}
        en={local.subtitle_en ?? ''}
        onEs={(v) => patch('subtitle', v)}
        onEn={(v) => patch('subtitle_en', v)}
        textarea
      />

      <ImageFormatFields
        aspectRatio={local.image_aspect_ratio}
        fitMode={local.image_fit}
        onAspectRatio={(v) => patch('image_aspect_ratio', v)}
        onFitMode={(v) => patch('image_fit', v)}
      />

      <div className="space-y-1.5">
        <label className={labelClass}>Columnas del Grid (Escritorio)</label>
        <select
          value={local.grid_columns}
          onChange={(e) => patch('grid_columns', Number(e.target.value))}
          className={inputClass}
        >
          <option value={2}>2 Columnas</option>
          <option value={3}>3 Columnas (Predeterminado)</option>
          <option value={4}>4 Columnas</option>
        </select>
      </div>
    </div>
  );
}

export function GaleriaSettingsEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<GaleriaSettings>(() => parseGaleriaSettings(content));
  const { isDirty } = useAutosaveEditor('galeria_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseGaleriaSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof GaleriaSettings>(key: K, value: GaleriaSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vista previa de la cabecera
          </p>
        </div>
        <div className="p-6 text-center">
          <span className="block mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            {local.kicker || 'Galería'}
          </span>
          <h3 className="font-display text-2xl font-light text-foreground text-balance">
            {local.title || 'Un recorrido visual de nuestras huellas'}
          </h3>
          {local.subtitle ? (
            <p className="text-muted-foreground italic font-display text-sm mt-2 text-pretty max-w-md mx-auto">
              {local.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <LocalePair
        idPrefix="galeria-kicker"
        esLabel="Kicker (ES)"
        es={local.kicker}
        en={local.kicker_en ?? ''}
        onEs={(v) => patch('kicker', v)}
        onEn={(v) => patch('kicker_en', v)}
      />
      <LocalePair
        idPrefix="galeria-title"
        esLabel="Título de la Página (ES)"
        es={local.title}
        en={local.title_en ?? ''}
        onEs={(v) => patch('title', v)}
        onEn={(v) => patch('title_en', v)}
      />
      <LocalePair
        idPrefix="galeria-subtitle"
        esLabel="Descripción / Subtítulo (ES)"
        es={local.subtitle}
        en={local.subtitle_en ?? ''}
        onEs={(v) => patch('subtitle', v)}
        onEn={(v) => patch('subtitle_en', v)}
        textarea
      />

      <ImageFormatFields
        aspectRatio={local.image_aspect_ratio}
        fitMode={local.image_fit}
        onAspectRatio={(v) => patch('image_aspect_ratio', v)}
        onFitMode={(v) => patch('image_fit', v)}
      />

      <div className="space-y-1.5">
        <label className={labelClass}>Columnas de la Grilla (Escritorio)</label>
        <select
          value={local.grid_columns}
          onChange={(e) => patch('grid_columns', Number(e.target.value))}
          className={inputClass}
        >
          <option value={2}>2 Columnas</option>
          <option value={3}>3 Columnas (Predeterminado)</option>
          <option value={4}>4 Columnas</option>
        </select>
      </div>
    </div>
  );
}

export function NosotrosSettingsEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<NosotrosSettings>(() => parseNosotrosSettings(content));
  const { isDirty } = useAutosaveEditor('nosotros_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseNosotrosSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof NosotrosSettings>(key: K, value: NosotrosSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-surface-raised">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Vista previa de la historia
          </p>
        </div>
        <div className="p-6 text-center">
          <span className="block mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            {local.kicker || 'Nuestra Historia'}
          </span>
          <h3 className="font-display text-2xl font-light text-foreground text-balance">
            {local.title || 'Renacer de las Cenizas en Chiloé'}
          </h3>
          {local.subtitle ? (
            <p className="text-muted-foreground font-display text-sm mt-2 text-pretty max-w-md mx-auto">
              {local.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <LocalePair
        idPrefix="nosotros-kicker"
        esLabel="Kicker (ES)"
        es={local.kicker}
        en={local.kicker_en ?? ''}
        onEs={(v) => patch('kicker', v)}
        onEn={(v) => patch('kicker_en', v)}
      />
      <LocalePair
        idPrefix="nosotros-title"
        esLabel="Título de la Página (ES)"
        es={local.title}
        en={local.title_en ?? ''}
        onEs={(v) => patch('title', v)}
        onEn={(v) => patch('title_en', v)}
      />
      <LocalePair
        idPrefix="nosotros-subtitle"
        esLabel="Descripción / Subtítulo (ES)"
        es={local.subtitle}
        en={local.subtitle_en ?? ''}
        onEs={(v) => patch('subtitle', v)}
        onEn={(v) => patch('subtitle_en', v)}
        textarea
      />

      <ImageFormatFields
        aspectRatio={local.image_aspect_ratio}
        fitMode={local.image_fit}
        onAspectRatio={(v) => patch('image_aspect_ratio', v)}
        onFitMode={(v) => patch('image_fit', v)}
      />
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Foto y cabecera. La historia larga vive en <strong className="text-foreground">Nosotros</strong>{' '}
        (fichas). Cuerpo vacío ahí = texto del código. No pegar claims de salud ni stack
        técnico.
      </p>
    </div>
  );
}

export function MediaSettingsEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<MediaSettings>(() => parseMediaSettings(content));
  const { isDirty } = useAutosaveEditor('media_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseMediaSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof MediaSettings>(key: K, value: MediaSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 pb-8">
      <div className="space-y-1.5">
        <label className={labelClass}>Altura del Carrusel (Móvil / Escritorio)</label>
        <select
          value={local.carousel_height}
          onChange={(e) => patch('carousel_height', e.target.value as CarouselHeightMode)}
          className={inputClass}
        >
          <option value="50vh/70vh">Media Estándar (50vh Móvil / 70vh Escritorio)</option>
          <option value="40vh/60vh">Compacta (40vh Móvil / 60vh Escritorio)</option>
          <option value="60vh/80vh">Grande (60vh Móvil / 80vh Escritorio)</option>
          <option value="70vh/90vh">Imersión Total (70vh Móvil / 90vh Escritorio)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Modo de Encuadre de Imagen</label>
        <select
          value={local.image_fit}
          onChange={(e) => patch('image_fit', e.target.value as ImageFitMode)}
          className={inputClass}
        >
          <option value="cover">Cover (Rellenar recortando bordes sobrantes)</option>
          <option value="contain">Contain (Ajustar imagen completa sin recortar)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Velocidad de Auto-reproducción (Milisegundos)</label>
        <input
          type="number"
          min={2000}
          max={20000}
          step={500}
          value={local.autoplay_ms}
          onChange={(e) => patch('autoplay_ms', Number(e.target.value))}
          className={inputClass}
        />
        <p className="text-[11px] text-muted-foreground">Ej: 5000 = 5 segundos por diapositiva.</p>
      </div>
    </div>
  );
}

export function CienciaSettingsEditor({
  content,
  onSave,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<CienciaSettings>(() => parseCienciaSettings(content));
  const { isDirty } = useAutosaveEditor('ciencia_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseCienciaSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof CienciaSettings>(key: K, value: CienciaSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 pb-8">
      <LocalePair
        idPrefix="ciencia-kicker"
        esLabel="Kicker (ES)"
        es={local.kicker}
        en={local.kicker_en ?? ''}
        onEs={(v) => patch('kicker', v)}
        onEn={(v) => patch('kicker_en', v)}
      />
      <LocalePair
        idPrefix="ciencia-title"
        esLabel="Título de la Página (ES)"
        es={local.title}
        en={local.title_en ?? ''}
        onEs={(v) => patch('title', v)}
        onEn={(v) => patch('title_en', v)}
      />
      <LocalePair
        idPrefix="ciencia-subtitle"
        esLabel="Descripción / Subtítulo (ES)"
        es={local.subtitle}
        en={local.subtitle_en ?? ''}
        onEs={(v) => patch('subtitle', v)}
        onEn={(v) => patch('subtitle_en', v)}
        textarea
      />
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Solo cabecera. Los bloques de evidencia se editan en{' '}
        <strong className="text-foreground">Ciencia — Evidencia</strong>. Sin claims
        médicos ni “sustituye azúcar”.
      </p>
    </div>
  );
}

const AUTH_BG_LABELS: Record<AuthBackgroundStyle, string> = {
  cosmic: 'Cósmico',
  bosque_nativo: 'Bosque nativo',
  abeja_cosmos: 'Abeja / cosmos',
  dark_luxury: 'Dark luxury',
};

const AUTH_FX_LABELS: Record<AuthParticleEffect, string> = {
  none: 'Sin partículas',
  pollen_gold: 'Polen dorado',
  mist_bosque: 'Niebla de bosque',
  cosmic_stars: 'Estrellas',
};

export function AuthSettingsEditor({
  content,
  onSave,
  onImageUpload,
}: {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
  onImageUpload?: (file: File, fieldName: string) => Promise<string> | void;
}) {
  const [local, setLocal] = useState<AuthSettings>(() => parseAuthSettings(content));
  const { isDirty } = useAutosaveEditor('auth_settings', local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseAuthSettings(content));
  }, [content, isDirty]);

  const patch = <K extends keyof AuthSettings>(key: K, value: AuthSettings[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 pb-8">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Login y registro de la tienda. No pongas claims sanitarios ni stack técnico en
        los textos.
      </p>
      <LocalePair
        idPrefix="auth-hero-title"
        esLabel="Título (ES)"
        es={local.hero_title}
        en={local.hero_title_en ?? ''}
        onEs={(v) => patch('hero_title', v)}
        onEn={(v) => patch('hero_title_en', v)}
      />
      <LocalePair
        idPrefix="auth-hero-subtitle"
        esLabel="Subtítulo (ES)"
        es={local.hero_subtitle}
        en={local.hero_subtitle_en ?? ''}
        onEs={(v) => patch('hero_subtitle', v)}
        onEn={(v) => patch('hero_subtitle_en', v)}
      />
      <LocalePair
        idPrefix="auth-tagline"
        esLabel="Frase de marca (ES)"
        es={local.tagline_phrase}
        en={local.tagline_phrase_en ?? ''}
        onEs={(v) => patch('tagline_phrase', v)}
        onEn={(v) => patch('tagline_phrase_en', v)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="auth-bg" className={labelClass}>
            Fondo
          </label>
          <select
            id="auth-bg"
            value={local.background_style}
            onChange={(e) => patch('background_style', e.target.value as AuthBackgroundStyle)}
            className={inputClass}
          >
            {AUTH_BACKGROUND_STYLES.map((id) => (
              <option key={id} value={id}>
                {AUTH_BG_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="auth-fx" className={labelClass}>
            Partículas
          </label>
          <select
            id="auth-fx"
            value={local.particle_effect}
            onChange={(e) => patch('particle_effect', e.target.value as AuthParticleEffect)}
            className={inputClass}
          >
            {AUTH_PARTICLE_EFFECTS.map((id) => (
              <option key={id} value={id}>
                {AUTH_FX_LABELS[id]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Field
        label="Color del orb (hex)"
        id="auth-orb"
        value={local.blur_orb_color ?? ''}
        onChange={(v) => patch('blur_orb_color', v)}
        placeholder="#D4A017"
      />
      <div className="space-y-1.5">
        <Field
          label="Imagen de fondo (URL)"
          id="auth-bg-url"
          value={local.background_image_url ?? ''}
          onChange={(v) => patch('background_image_url', v)}
        />
        {onImageUpload ? (
          <input
            type="file"
            accept="image/*"
            aria-label="Subir imagen de fondo"
            className="block w-full text-[11px] text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent/15 file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-accent"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void Promise.resolve(onImageUpload(file, 'background_image_url')).then((url) => {
                if (typeof url === 'string' && url) patch('background_image_url', url);
              });
            }}
          />
        ) : null}
      </div>
      <CopyRiskBanner
        text={[local.hero_title, local.hero_subtitle, local.tagline_phrase].join('\n')}
        kinds={['stack_leak', 'health_claim']}
      />
    </div>
  );
}

export function LegalDocEditor({
  sectionKey,
  content,
  onSave,
}: {
  sectionKey: string;
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}) {
  const [local, setLocal] = useState<LegalDocContent>(() => parseLegalDoc(content));
  const { isDirty } = useAutosaveEditor(sectionKey, local, (next) => onSave(next));

  useEffect(() => {
    if (isDirty) return;
    setLocal(parseLegalDoc(content));
  }, [content, isDirty]);

  const patch = <K extends keyof LegalDocContent>(key: K, value: LegalDocContent[K]) =>
    setLocal((prev) => ({ ...prev, [key]: value }));

  const emptyBody = local.body.trim().length === 0;

  return (
    <div className="space-y-4 pb-8">
      <div
        className={`flex gap-2 rounded-lg border px-3 py-2.5 text-[11px] leading-relaxed ${
          emptyBody
            ? 'border-border bg-surface-raised text-muted-foreground'
            : 'border-accent/40 bg-accent/5 text-foreground'
        }`}
      >
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <p>
          {emptyBody
            ? 'Cuerpo vacío: la tienda muestra el texto del código (el destilado de cumplimiento). Dejalo vacío salvo que un abogado reescriba el documento entero.'
            : 'Hay cuerpo publicado: este HTML pisa el fallback del repo. Un texto viejo (Hostinger, Next.js) queda en producción hasta que lo borres o lo reescribas.'}
        </p>
      </div>
      <Field
        label="Título"
        id={`${sectionKey}-title`}
        value={local.title}
        onChange={(v) => patch('title', v)}
        placeholder="Título público"
      />
      <Field
        label="Última actualización"
        id={`${sectionKey}-updated`}
        value={local.last_updated}
        onChange={(v) => patch('last_updated', v)}
        placeholder="2026-08-14 o 14 de agosto de 2026"
      />
      <AreaField
        label="Cuerpo (HTML)"
        id={`${sectionKey}-body`}
        value={local.body}
        onChange={(v) => patch('body', v)}
        rows={16}
        placeholder="Vacío = texto del repositorio"
      />
      <CopyRiskBanner text={`${local.title}\n${local.body}`} kinds={['stack_leak']} />
    </div>
  );
}
