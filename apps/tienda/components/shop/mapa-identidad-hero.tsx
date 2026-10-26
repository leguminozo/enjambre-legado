'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Move, ExternalLink, Layers, Copy, Check } from 'lucide-react';
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

  useEffect(() => {
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

      if (popupTitle || popupBody) {
        const popupContent = `
        <div style="font-family: inherit; min-width: 210px; padding: 2px;">
          ${popupTitle ? `<h4 style="font-size:15px;font-weight:600;margin:0 0 4px 0;letter-spacing:-0.01em;">${escapeHtml(popupTitle)}</h4>` : ''}
          ${popupBody ? `<p style="font-size:12px;opacity:0.8;margin:0 0 6px 0;line-height:1.4;">${escapeHtml(popupBody).replace(/\n/g, '<br/>')}</p>` : ''}
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
      }

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
  }, [targetLat, targetLng, popupTitle, popupBody]);

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
        <div className="enj-contact-map-container relative isolate z-0 overflow-hidden rounded-2xl md:rounded-3xl border border-border/70 bg-surface-sunken shadow-2xl ring-1 ring-border/30 w-full h-[460px] sm:h-[520px] md:h-[580px]">
          {/* Mapa Leaflet */}
          <div
            ref={mapRef}
            className={`w-full h-full cursor-pointer ${
              isInteracting ? 'pointer-events-auto' : 'pointer-events-none sm:pointer-events-auto'
            }`}
          />

          {/* Cabecera flotante en glassmorphism (izquierda): Ficha de ubicación */}
          {cardLabel ? (
            <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-2.5 rounded-full bg-background/85 backdrop-blur-md px-4 py-2 border border-border/70 shadow-lg text-xs font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-display tracking-wide">{cardLabel}</span>
              <span className="text-muted-foreground font-mono text-[10px]">
                42°51'18"S 73°40'41"W
              </span>
            </div>
          ) : null}

          {/* Controles flotantes en glassmorphism (derecha) */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {/* Selector de capa: Nocturno / Satélite */}
            <div className="flex rounded-full bg-background/85 backdrop-blur-md p-1 border border-border/70 shadow-lg">
              <button
                type="button"
                onClick={() => setLayerMode('dark')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  layerMode === 'dark'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {locale === 'en' ? 'Night' : 'Nocturno'}
              </button>
              <button
                type="button"
                onClick={() => setLayerMode('satellite')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  layerMode === 'satellite'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{locale === 'en' ? 'Satellite' : 'Satélite'}</span>
              </button>
            </div>

            {/* Botón copiar coordenadas */}
            <button
              type="button"
              onClick={handleCopyCoordinates}
              title={locale === 'en' ? 'Copy coordinates' : 'Copiar coordenadas'}
              className="min-h-9 min-w-9 h-9 w-9 rounded-full bg-background/85 backdrop-blur-md border border-border/70 shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
              aria-label={locale === 'en' ? 'Copy apiary coordinates' : 'Copiar coordenadas del apiario'}
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Botón Google Maps */}
            <button
              type="button"
              onClick={handleOpenInMaps}
              title={locale === 'en' ? 'Open in Google Maps' : 'Abrir en Google Maps'}
              className="min-h-9 min-w-9 h-9 w-9 rounded-full bg-background/85 backdrop-blur-md border border-border/70 shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
              aria-label={locale === 'en' ? 'Open in Google Maps' : 'Abrir en Google Maps'}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

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
                locale === 'en' ? 'Tap to interact with the apiary map' : 'Tocar para interactuar con el mapa del apiario'
              }
              className="sm:hidden absolute inset-0 bg-background/15 backdrop-blur-[0.5px] flex items-center justify-center p-4 cursor-pointer transition-all hover:bg-background/25"
            >
              <div className="bg-background/95 border border-border/80 text-foreground px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium active:scale-95 transition-transform">
                <Move className="w-3.5 h-3.5 text-primary" />
                <span>{locale === 'en' ? 'Tap to explore the map' : 'Toca para explorar el mapa'}</span>
              </div>
            </div>
          )}

          {/* Botones de acción móvil cuando el mapa está activo */}
          {isInteracting && (
            <div className="sm:hidden absolute bottom-3 left-3 z-20 flex gap-2">
              <button
                type="button"
                onClick={() => setIsInteracting(false)}
                className="bg-background/95 text-foreground border border-border/70 text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium"
              >
                {locale === 'en' ? 'Lock scroll' : 'Bloquear scroll'}
              </button>
              <button
                type="button"
                onClick={handleOpenInMaps}
                className="bg-primary text-primary-foreground text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                {locale === 'en' ? 'Expand' : 'Ampliar'}
              </button>
            </div>
          )}
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