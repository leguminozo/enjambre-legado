'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Move,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Globe,
  Compass,
  ArrowLeft,
  Maximize2,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';

if (typeof window !== 'undefined') {
  setWorkerUrl('/maplibre-gl-worker.mjs');
}
import { toast } from '@enjambre/ui';
import {
  DEFAULT_MAP_SETTINGS,
  alignToClass,
  resolveLocalized,
  type MapSettings,
} from '@/lib/shop/store-chrome';
import { useLocale } from 'next-intl';

/**
 * Coordenadas oficiales de Pureo Rural km 8560 (Queilén, Chiloé)
 * Latitud: 42°51'18"S (-42.854935)
 * Longitud: 73°40'41"W (-73.67796)
 */
const DEFAULT_COORDINATES = { lat: -42.854935, lng: -73.67796 };

const OPENFREEMAP_DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';
const ESRI_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_BOUNDARIES_PLACES_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

const EMPTY_SPRITE = {
  width: 1,
  height: 1,
  data: new Uint8Array([0, 0, 0, 0]),
};

function bindMissingSpriteFallback(layer: ReturnType<typeof maplibreGL>) {
  const attach = () => {
    const gl = layer.getMaplibreMap();
    if (!gl) return;
    gl.on('styleimagemissing', (e: { id: string }) => {
      if (!e?.id || gl.hasImage(e.id)) return;
      gl.addImage(e.id, EMPTY_SPRITE);
    });
  };
  attach();
  layer.once('add', attach);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function MapaIdentidadHero({
  mapSettings = DEFAULT_MAP_SETTINGS,
}: {
  mapSettings?: MapSettings;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const darkLayerRef = useRef<ReturnType<typeof maplibreGL> | null>(null);
  const satLayersRef = useRef<L.TileLayer[]>([]);
  const currentLayerModeRef = useRef<'dark' | 'satellite'>('dark');

  // Modo de visualización: 'planetary' (por defecto) o 'satellite' (zoom al predio Pureo)
  const [viewMode, setViewMode] = useState<'planetary' | 'satellite'>('planetary');
  const [layerMode, setLayerMode] = useState<'dark' | 'satellite'>('dark');
  const [isInteracting, setIsInteracting] = useState(false);
  const [copied, setCopied] = useState(false);
  const locale = useLocale();

  const targetLat =
    mapSettings?.lat && mapSettings.lat !== 0 && mapSettings.lat !== -43.0837
      ? mapSettings.lat
      : DEFAULT_COORDINATES.lat;
  const targetLng =
    mapSettings?.lng && mapSettings.lng !== 0 && mapSettings.lng !== -73.6144
      ? mapSettings.lng
      : DEFAULT_COORDINATES.lng;

  const popupTitle = mapSettings?.popup_title?.trim() ?? '';
  const popupBody = mapSettings?.popup_body?.trim() ?? '';
  const kicker = resolveLocalized(mapSettings?.kicker, mapSettings?.kicker_en, locale);
  const title = resolveLocalized(mapSettings?.title, mapSettings?.title_en, locale);
  const subtitle = resolveLocalized(mapSettings?.subtitle, mapSettings?.subtitle_en, locale);
  const cardLabel = resolveLocalized(
    mapSettings?.card_label,
    mapSettings?.card_label_en,
    locale,
  );
  const quote = resolveLocalized(mapSettings?.quote, mapSettings?.quote_en, locale);
  const ctaLabel = resolveLocalized(mapSettings?.cta_label, mapSettings?.cta_label_en, locale);
  const ctaHref = mapSettings?.cta_href?.trim() || '/nosotros';

  // Inicialización diferida (Lazy-load) de Leaflet solo cuando el usuario entra al modo satelital
  useEffect(() => {
    if (viewMode !== 'satellite') return;
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current || mapInstance.current) return;
      if (cancelled) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 18,
      }).setView([targetLat, targetLng], 14);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Capa Nocturna vectorial (OpenFreeMap Dark)
      try {
        const glLayer = maplibreGL({
          style: OPENFREEMAP_DARK_STYLE,
          interactive: false,
          attributionControl: false,
        });
        bindMissingSpriteFallback(glLayer);
        darkLayerRef.current = glLayer;
      } catch {
        darkLayerRef.current = null;
      }

      // Capas Satelitales (Esri World Imagery + nombres y fronteras)
      const satTile = L.tileLayer(ESRI_SATELLITE_URL, {
        maxZoom: 18,
        attribution: '&copy; Esri',
      });
      const satPlaces = L.tileLayer(ESRI_BOUNDARIES_PLACES_URL, {
        maxZoom: 18,
        opacity: 0.85,
      });
      satLayersRef.current = [satTile, satPlaces];

      // Aplicar capa inicial según modo
      if (currentLayerModeRef.current === 'dark' && darkLayerRef.current) {
        darkLayerRef.current.addTo(map);
      } else {
        satTile.addTo(map);
        satPlaces.addTo(map);
      }

      // Marcador de lujo territorial: núcleo dorado de miel con aro concéntrico y pulso radiante
      const markerIcon = L.divIcon({
        className: 'enj-marker-wrapper',
        html: `
          <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
            <span style="position:absolute;width:34px;height:34px;top:-3px;left:-3px;border-radius:50%;background:hsl(44 85% 46% / 0.28);animation:ping 2.4s cubic-bezier(0,0,0.2,1) infinite;"></span>
            <span style="position:absolute;width:24px;height:24px;top:2px;left:2px;border-radius:50%;background:hsl(44 85% 46% / 0.35);filter:blur(3px);"></span>
            <span style="position:relative;width:16px;height:16px;margin-top:6px;border-radius:50%;background:hsl(44 85% 46%);border:3px solid hsl(35 60% 93%);box-shadow:0 0 20px hsl(44 85% 46% / 0.9),0 0 40px hsl(44 85% 46% / 0.4);"></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([targetLat, targetLng], {
        icon: markerIcon,
        keyboard: false,
      }).addTo(map);

      const titleContent = popupTitle || 'Nuestro legado comienza aquí';
      const bodyContent = popupBody || 'Pureo Rural km 8560 · Queilén, Chiloé';

      const popupContent = `
        <div style="font-family: inherit; min-width: 210px; padding: 2px;">
          <h4 style="font-size:14px;font-weight:600;margin:0 0 4px 0;letter-spacing:-0.01em;color:hsl(var(--foreground));">${escapeHtml(titleContent)}</h4>
          <p style="font-size:11px;opacity:0.8;margin:0 0 6px 0;line-height:1.4;">${escapeHtml(bodyContent).replace(/\n/g, '<br/>')}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;opacity:0.65;font-family:monospace;">
            <span>42°51'18"S</span>
            <span>73°40'41"W</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'enj-contact-popup',
        closeButton: false,
        offset: [0, -12],
      });

      mapInstance.current = map;
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [viewMode, targetLat, targetLng, popupTitle, popupBody]);

  // Alternar entre modo oscuro vectorial y satélite de alta resolución
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (layerMode === currentLayerModeRef.current) return;
    currentLayerModeRef.current = layerMode;

    if (layerMode === 'dark') {
      satLayersRef.current.forEach((l) => {
        if (map.hasLayer(l)) map.removeLayer(l);
      });
      if (darkLayerRef.current && !map.hasLayer(darkLayerRef.current)) {
        darkLayerRef.current.addTo(map);
      }
    } else {
      if (darkLayerRef.current && map.hasLayer(darkLayerRef.current)) {
        map.removeLayer(darkLayerRef.current);
      }
      satLayersRef.current.forEach((l) => {
        if (!map.hasLayer(l)) l.addTo(map);
      });
    }
  }, [layerMode]);

  const handleOpenInMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`,
      '_blank',
    );
  };

  const handleCopyCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(`${targetLat}, ${targetLng}`);
      setCopied(true);
      toast.success(locale === 'en' ? 'Coordinates copied to clipboard' : 'Coordenadas copiadas al portapapeles');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error(locale === 'en' ? 'Could not copy the coordinates' : 'No se pudieron copiar las coordenadas');
    }
  };

  return (
    <section className="editorial-section">
      {(kicker || title || subtitle) && (
        <div className="editorial-container text-center mb-10 md:mb-14 px-4 sm:px-0">
          {kicker ? <span className="editorial-kicker mb-4 block">{kicker}</span> : null}
          {title ? (
            <h2 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] sm:text-4xl md:text-6xl font-light text-foreground text-balance leading-tight">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p
              className={`mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto whitespace-pre-line ${alignToClass(mapSettings?.text_align)}`}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      )}

      <div className="editorial-container mb-12">
        <div className="enj-contact-map-container relative isolate z-0 overflow-hidden rounded-2xl md:rounded-3xl border border-border/70 bg-background shadow-2xl ring-1 ring-border/30 w-full h-[480px] sm:h-[540px] md:h-[600px]">
          {/* ══════════════════════════════════════════════════════════════════════
              VISTA 1: ESCALA PLANETARIA (POR DEFECTO - CERO CARGA DE TILES)
              ══════════════════════════════════════════════════════════════════════ */}
          {viewMode === 'planetary' && (
            <div className="relative w-full h-full bg-background overflow-hidden select-none flex items-center justify-center">
              {/* SVG responsivo con el planisferio vectorial y elementos interactivos */}
              <svg
                viewBox="0 0 1014 570"
                className="w-full h-full object-contain pointer-events-none"
                preserveAspectRatio="xMidYMid meet"
                aria-label="Mapa planisferio de ubicación de Pureo, Chiloé"
              >
                {/* Capa base de continentes: Limpia, sin nombres ni fronteras */}
                <image
                  href="/assets/editorial/mapa-planisferio-continentes.webp"
                  x="0"
                  y="0"
                  width="1014"
                  height="570"
                  preserveAspectRatio="xMidYMid meet"
                />

                {/* Sutil línea punteada del Paralelo 42°S (y = 539) */}
                <line
                  x1="0"
                  y1="539"
                  x2="1014"
                  y2="539"
                  stroke="hsl(44 85% 46% / 0.45)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />

                {/* Etiqueta elegante del Paralelo 42°S en la margen izquierda */}
                <text
                  x="16"
                  y="533"
                  fill="hsl(44 85% 46% / 0.85)"
                  fontSize="9.5"
                  fontFamily="monospace"
                  letterSpacing="0.18em"
                  fontWeight="600"
                >
                  PARALELO 42°S · LATITUD AUSTRAL
                </text>

                {/* Arco conector punteado que desciende de Chiloé hacia el Inset inferior */}
                <path
                  d="M 269.4 546 C 269.4 560, 200 560, 160 560"
                  fill="none"
                  stroke="hsl(44 85% 46% / 0.35)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />

                {/* Faro concéntrico con pulso oro miel sobre Chiloé (x=269.4, y=539) */}
                <g className="pointer-events-auto">
                  {/* Aro expansivo con pulso CSS */}
                  <circle
                    cx="269.4"
                    cy="539"
                    r="16"
                    fill="hsl(44 85% 46% / 0.2)"
                    stroke="hsl(44 85% 46% / 0.6)"
                    strokeWidth="1.2"
                    className="animate-ping"
                    style={{ transformOrigin: '269.4px 539px', animationDuration: '2.8s' }}
                  />
                  {/* Halo medio */}
                  <circle
                    cx="269.4"
                    cy="539"
                    r="11"
                    fill="hsl(44 85% 46% / 0.3)"
                    stroke="hsl(44 85% 46% / 0.8)"
                    strokeWidth="1.5"
                  />
                  {/* Núcleo dorado oro miel */}
                  <circle
                    cx="269.4"
                    cy="539"
                    r="4.5"
                    fill="hsl(44 85% 46%)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {/* Rótulo superior sobre Chiloé */}
                  <text
                    x="269.4"
                    y="518"
                    textAnchor="middle"
                    fill="#f5f0e8"
                    fontSize="10"
                    fontFamily="monospace"
                    letterSpacing="0.12em"
                    fontWeight="600"
                  >
                    CHILOÉ · 42°S
                  </text>
                </g>
              </svg>

              {/* ── Recuadro Inset en la esquina inferior izquierda: Isla Grande de Chiloé ── */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setViewMode('satellite')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setViewMode('satellite');
                  }
                }}
                title={locale === 'en' ? 'Click to explore satellite view of Pureo' : 'Toca para explorar el predio en vista satelital'}
                aria-label={locale === 'en' ? 'Explore Pureo in satellite' : 'Explorar Pureo en satélite'}
                className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 z-20 w-[170px] sm:w-[210px] md:w-[240px] rounded-xl border border-border/80 bg-background/92 backdrop-blur-md p-2.5 sm:p-3 shadow-2xl group cursor-pointer transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_28px_rgba(201,162,39,0.18)] active:scale-[0.98]"
              >
                {/* Cabecera del Inset */}
                <div className="flex items-center justify-between gap-1 mb-1.5 border-b border-border/50 pb-1.5">
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-primary font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    ISLA DE CHILOÉ
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
                    <Maximize2 className="w-2.5 h-2.5" />
                  </span>
                </div>

                {/* Silueta de Chiloé con punto en Pureo */}
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/60 border border-border/40 mb-1.5">
                  <Image
                    src="/assets/editorial/mapa-chiloe-silueta.webp"
                    alt="Silueta geográfica de la Isla Grande de Chiloé"
                    fill
                    sizes="(max-width: 640px) 180px, 240px"
                    className="object-contain p-1 opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  {/* Punto y pulso radiante en Pureo (Queilén: left 39.4%, top 57.7%) */}
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: '39.4%', top: '57.7%' }}
                  >
                    <span className="absolute -inset-2 rounded-full bg-primary/40 animate-ping" />
                    <span className="block w-2.5 h-2.5 rounded-full bg-primary border border-white shadow-[0_0_10px_rgba(212,160,23,1)]" />
                  </div>
                  <span
                    className="absolute text-[8.5px] sm:text-[9px] font-mono text-primary font-semibold drop-shadow-md whitespace-nowrap"
                    style={{ left: '44%', top: '54%' }}
                  >
                    Pureo
                  </span>
                </div>

                {/* Pie del Inset con coordenadas y llamada de acción */}
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground font-mono pt-1">
                  <span>42°51'18"S</span>
                  <span className="text-primary font-sans font-medium flex items-center gap-0.5 group-hover:underline">
                    Satélite →
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              VISTA 2: SANTUARIO PUREO (SATÉLITE VIVO / LEAFLET)
              ══════════════════════════════════════════════════════════════════════ */}
          {viewMode === 'satellite' && (
            <>
              {/* Contenedor del mapa Leaflet */}
              <div
                ref={mapRef}
                className={`w-full h-full cursor-pointer ${
                  isInteracting ? 'pointer-events-auto' : 'pointer-events-none sm:pointer-events-auto'
                }`}
              />

              {/* Botón flotante inferior para volver a la escala planetaria */}
              <button
                type="button"
                onClick={() => setViewMode('planetary')}
                className="absolute bottom-4 left-4 z-[1050] flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-md px-4 py-2 border border-border/80 shadow-xl text-xs font-medium text-foreground hover:text-primary transition-all active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-primary" />
                <span>{locale === 'en' ? 'Back to Planetary view' : 'Volver al Planeta'}</span>
              </button>

              {/* Touch guard para móvil */}
              {!isInteracting && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsInteracting(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsInteracting(true);
                    }
                  }}
                  aria-label={
                    locale === 'en'
                      ? 'Tap to interact with the apiary map'
                      : 'Tocar para interactuar con el mapa del apiario'
                  }
                  className="sm:hidden absolute inset-0 bg-background/15 backdrop-blur-[0.5px] flex items-center justify-center p-4 cursor-pointer transition-all hover:bg-background/25 z-[1005]"
                >
                  <div className="bg-background/95 border border-border/80 text-foreground px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium active:scale-95 transition-transform">
                    <Move className="w-3.5 h-3.5 text-primary" />
                    <span>{locale === 'en' ? 'Tap to explore the map' : 'Toca para explorar el mapa'}</span>
                  </div>
                </div>
              )}

              {/* Botones de acción móvil cuando el mapa está activo */}
              {isInteracting && (
                <div className="sm:hidden absolute bottom-3 right-3 z-[1050] flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInteracting(false)}
                    className="bg-background/95 text-foreground border border-border/70 text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium"
                  >
                    {locale === 'en' ? 'Lock scroll' : 'Bloquear scroll'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              CABECERA FLOTANTE IZQUIERDA: FICHA DE UBICACIÓN
              ══════════════════════════════════════════════════════════════════════ */}
          {cardLabel ? (
            <div className="absolute top-4 left-4 z-[1050] hidden sm:flex items-center gap-2.5 rounded-full bg-background/85 backdrop-blur-md px-4 py-2 border border-border/70 shadow-lg text-xs font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-display tracking-wide">{cardLabel}</span>
              <span className="text-muted-foreground font-mono text-[10px]">
                42°51'18"S 73°40'41"W
              </span>
            </div>
          ) : null}

          {/* ══════════════════════════════════════════════════════════════════════
              CONTROLES FLOTANTES DERECHA (SIEMPRE VISIBLES - z-[1050])
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="absolute top-4 right-4 z-[1050] flex items-center gap-2">
            {/* Selector de Perspectiva: El Planeta vs Satélite Pureo */}
            <div className="flex rounded-full bg-background/90 backdrop-blur-md p-1 border border-border/70 shadow-lg">
              <button
                type="button"
                onClick={() => setViewMode('planetary')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'planetary'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span className="hidden sm:inline">{locale === 'en' ? 'The Planet' : 'El Planeta'}</span>
                <span className="sm:hidden">42°S</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('satellite')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  viewMode === 'satellite'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Compass className="w-3 h-3" />
                <span>{locale === 'en' ? 'Pureo' : 'Pureo Satelital'}</span>
              </button>
            </div>

            {/* Si estamos en modo satélite: alternar entre Satélite y Nocturno */}
            {viewMode === 'satellite' && (
              <div className="hidden sm:flex rounded-full bg-background/90 backdrop-blur-md p-1 border border-border/70 shadow-lg">
                <button
                  type="button"
                  onClick={() => setLayerMode('dark')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    layerMode === 'dark'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {locale === 'en' ? 'Dark' : 'Nocturno'}
                </button>
                <button
                  type="button"
                  onClick={() => setLayerMode('satellite')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    layerMode === 'satellite'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>{locale === 'en' ? 'Sat' : 'Sat'}</span>
                </button>
              </div>
            )}

            {/* Botón copiar coordenadas */}
            <button
              type="button"
              onClick={handleCopyCoordinates}
              title={locale === 'en' ? 'Copy coordinates' : 'Copiar coordenadas'}
              className="min-h-9 min-w-9 h-9 w-9 rounded-full bg-background/90 backdrop-blur-md border border-border/70 shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
              aria-label={locale === 'en' ? 'Copy apiary coordinates' : 'Copiar coordenadas del apiario'}
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Botón Google Maps */}
            <button
              type="button"
              onClick={handleOpenInMaps}
              title={locale === 'en' ? 'Open in Google Maps' : 'Abrir en Google Maps'}
              className="min-h-9 min-w-9 h-9 w-9 rounded-full bg-background/90 backdrop-blur-md border border-border/70 shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
              aria-label={locale === 'en' ? 'Open in Google Maps' : 'Abrir en Google Maps'}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {(quote || ctaLabel) && (
        <div className="editorial-container text-center max-w-2xl mx-auto">
          {quote ? (
            <p
              className={`font-display italic text-xl md:text-2xl text-foreground leading-relaxed mb-10 whitespace-pre-line ${alignToClass(mapSettings?.text_align)}`}
            >
              {quote}
            </p>
          ) : null}
          {ctaLabel ? (
            <Link
              href={ctaHref}
              className="inline-flex min-h-12 items-center gap-3 border border-accent text-accent-text px-8 py-4 text-editorial-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all duration-elegant rounded-md font-medium"
            >
              {ctaLabel}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ) : null}
        </div>
      )}

      <style jsx global>{`
        .enj-contact-map-container .leaflet-bar {
          border: 1px solid hsl(var(--border) / 0.7) !important;
          border-radius: 9999px !important;
          overflow: hidden !important;
          background: hsl(var(--background) / 0.85) !important;
          backdrop-filter: blur(12px) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4) !important;
          margin-right: 16px !important;
          margin-bottom: 16px !important;
        }
        .enj-contact-map-container .leaflet-bar a {
          background-color: transparent !important;
          color: hsl(var(--foreground)) !important;
          border-bottom: 1px solid hsl(var(--border) / 0.5) !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          font-size: 14px !important;
          transition: background-color 0.15s ease, color 0.15s ease !important;
        }
        .enj-contact-map-container .leaflet-bar a:last-child {
          border-bottom: none !important;
        }
        .enj-contact-map-container .leaflet-bar a:hover {
          background-color: hsl(var(--surface-raised)) !important;
          color: hsl(var(--primary)) !important;
        }
        .enj-contact-popup .leaflet-popup-content-wrapper {
          background: hsl(var(--background) / 0.94) !important;
          backdrop-filter: blur(16px) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border) / 0.8) !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.55), 0 8px 10px -6px rgba(0, 0, 0, 0.55) !important;
          padding: 6px 4px !important;
        }
        .enj-contact-popup .leaflet-popup-tip {
          background: hsl(var(--background) / 0.94) !important;
          border: 1px solid hsl(var(--border) / 0.8) !important;
        }
      `}</style>
    </section>
  );
}
