'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Move, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_MAP_SETTINGS, type MapSettings } from '@/lib/shop/store-chrome';

/**
 * Mapa de identidad de la tienda: pin único del apiario de La Obrera y el
 * Zángano (Pureo, Queilén). Sin datos de la red comunal — solo la casa.
 * Diseño estructural del hero público del registro territorial: tarjeta
 * enmarcada con Touch Guard (el mapa no roba el scroll vertical en táctil),
 * bloqueo y ampliar hacia Google Maps.
 *
 * Estilo visual: Dark Matter idéntico a Trama, montado sobre teselas
 * vectoriales de OpenFreeMap vía MapLibre GL (sin API keys).
 */
const OPENFREEMAP_DARK_STYLE = 'https://tiles.openfreemap.org/styles/dark';

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

export function MapaIdentidadHero({ mapSettings = DEFAULT_MAP_SETTINGS }: { mapSettings?: MapSettings }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const { lat, lng, popup_title, popup_body } = mapSettings;

    const instance = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
      minZoom: 2,
      maxZoom: 15,
      attributionControl: false,
    }).setView([lat, lng], 7);

    const glLayer = maplibreGL({
      style: OPENFREEMAP_DARK_STYLE,
      interactive: false,
      attributionControl: false,
    });
    glLayer.addTo(instance);
    bindMissingSpriteFallback(glLayer);

    L.control
      .attribution({
        position: 'bottomright',
        prefix: false,
      })
      .addAttribution(
        '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OSM</a>',
      )
      .addTo(instance);

    const markerIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 18px;
        height: 18px;
        background: hsl(44, 85%, 46%);
        border-radius: 50%;
        border: 3px solid hsl(35, 60%, 93%);
        box-shadow: 0 0 20px hsl(44, 85%, 46% / 0.5), 0 0 40px hsl(44, 85%, 46% / 0.25);
        position: relative;
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    L.marker([lat, lng], { icon: markerIcon, keyboard: false })
      .addTo(instance)
      .bindPopup(
        `<strong style="font-family:Inter,sans-serif">${escapeHtml(popup_title)}</strong><br/>${escapeHtml(popup_body).replace(/\n/g, '<br/>')}`,
      );

    const handleOpenInMaps = () => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };
    mapRef.current.addEventListener('click', handleOpenInMaps);

    mapInstance.current = instance;
    return () => {
      if (mapRef.current) {
        mapRef.current.removeEventListener('click', handleOpenInMaps);
      }
      instance.remove();
      mapInstance.current = null;
    };
  }, [mapSettings]);

  const mapsHref = `https://www.google.com/maps?q=${mapSettings.lat},${mapSettings.lng}`;

  return (
    <section className="editorial-section">
      <div className="editorial-container text-center mb-10 md:mb-14 px-4 sm:px-0">
        <span className="editorial-kicker mb-4 block">Ubicación</span>
        <h2 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] sm:text-4xl md:text-6xl font-light text-foreground text-balance leading-tight">
          Nuestro lugar en el mundo
        </h2>
        {mapSettings.popup_title.trim() || mapSettings.popup_body.trim() ? (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto whitespace-pre-line">
            {mapSettings.popup_title} — {mapSettings.popup_body}
          </p>
        ) : null}
      </div>

      <div className="editorial-container mb-12">
        <div className="relative isolate z-0 overflow-hidden rounded-lg bg-surface-sunken ring-1 ring-border/50 shadow-md">
          <div
            ref={mapRef}
            className={`w-full h-[min(46vh,400px)] sm:h-[460px] lg:h-[500px] cursor-pointer ${
              isInteracting ? 'pointer-events-auto' : 'pointer-events-none sm:pointer-events-auto'
            }`}
          />

          {/* Touch guard móvil: el mapa no roba el scroll vertical */}
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
              aria-label="Tocar para interactuar con el mapa del apiario"
              className="sm:hidden absolute inset-0 bg-background/15 backdrop-blur-[0.5px] flex items-center justify-center p-4 cursor-pointer transition-all hover:bg-background/25"
            >
              <div className="bg-background/95 border border-border/80 text-foreground px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium active:scale-95 transition-transform">
                <Move className="w-3.5 h-3.5 text-primary" />
                <span>Toca para explorar el mapa</span>
              </div>
            </div>
          )}

          {isInteracting && (
            <div className="sm:hidden absolute top-3 right-3 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => setIsInteracting(false)}
                className="bg-background/95 text-foreground border border-border/70 text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium"
              >
                Bloquear scroll
              </button>
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Ampliar
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="editorial-container text-center max-w-2xl mx-auto">
        <p className="font-display italic text-xl md:text-2xl text-foreground leading-relaxed mb-10">
          En el silencio del bosque, árboles nativos se regeneran y se transforman en el legado de nuestra existencia.
        </p>
        <Link
          href="/nosotros"
          className="inline-flex min-h-12 items-center gap-3 border border-accent text-accent-text px-8 py-4 text-editorial-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all duration-elegant rounded-md font-medium"
        >
          Nuestra Historia
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </section>
  );
}