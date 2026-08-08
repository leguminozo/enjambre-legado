'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, MapPin, PlayCircle } from 'lucide-react';
import {
  type ConservationContent,
  type MapSettings,
  type ProductsSettings,
  type VideoSettings,
  parseConservationContent,
  parseMapSettings,
  parseProductsSettings,
  parseVideoSettings,
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
