'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  type MapSettings,
  DEFAULT_MAP_SETTINGS,
} from '@/lib/shop/store-chrome';

/** Escapa texto CMS antes de inyectarlo al popup del marker (Leaflet usa HTML). */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

export function WorldMapBlock({ mapSettings = DEFAULT_MAP_SETTINGS }: { mapSettings?: MapSettings }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const { lat, lng, popup_title, popup_body } = mapSettings;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
      minZoom: 2,
      maxZoom: 15,
    }).setView([lat, lng], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapInstance.current);

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

    L.marker([lat, lng], { icon: markerIcon })
      .addTo(mapInstance.current)
      .bindPopup(
        `<strong style="font-family:Inter,sans-serif">${escapeHtml(popup_title)}</strong><br/>${escapeHtml(popup_body)}`,
      );

    const handleOpenInMaps = () => {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank',
      );
    };

    mapRef.current.addEventListener('click', handleOpenInMaps);

    return () => {
      if (mapRef.current) {
        mapRef.current.removeEventListener('click', handleOpenInMaps);
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapSettings]);

  return (
    <section className="editorial-section">
      <div className="editorial-container text-center mb-10 md:mb-16 px-4 sm:px-0">
        <span className="editorial-kicker mb-4 block">Ubicación</span>
        <h2 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] sm:text-4xl md:text-6xl font-light text-foreground text-balance leading-tight">
          Nuestro lugar en el mundo
        </h2>
      </div>

      <div className="editorial-container mb-12">
        <div className="relative w-full h-[50vh] md:h-[65vh] rounded-lg overflow-hidden border border-border/30">
          <div ref={mapRef} className="h-full w-full cursor-pointer" />
        </div>
      </div>

      <div className="editorial-container text-center max-w-2xl mx-auto">
        <p className="font-mono text-[0.7rem] tracking-[0.25em] uppercase text-accent/70 mb-6">
          {mapSettings.popup_title} — {mapSettings.popup_body}
        </p>
        <p className="font-display italic text-xl md:text-2xl text-foreground leading-relaxed mb-10">
          En el silencio del bosque, árboles nativos se regeneran y se transforman en el legado de nuestra existencia.
        </p>
        <Link
          href="/nosotros"
          className="inline-flex min-h-12 items-center gap-3 border border-accent text-accent px-8 py-4 text-editorial-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all duration-elegant rounded-md font-medium"
        >
          Nuestra Historia
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </section>
  );
}
