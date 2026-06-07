'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PUREO_COORDS = { lat: -43.0837, lng: -73.6144 };

export function WorldMapBlock() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
      minZoom: 2,
      maxZoom: 15,
    }).setView([PUREO_COORDS.lat, PUREO_COORDS.lng], 6);

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

    L.marker([PUREO_COORDS.lat, PUREO_COORDS.lng], { icon: markerIcon })
      .addTo(mapInstance.current)
      .bindPopup('<strong style="font-family:Inter,sans-serif">Pureo Rural km 8560</strong><br/>Queilén ~ Chiloé');

    const handleOpenInMaps = () => {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${PUREO_COORDS.lat},${PUREO_COORDS.lng}`,
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
  }, []);

  return (
    <section className="editorial-section">
      <div className="editorial-container text-center mb-16">
        <span className="editorial-kicker mb-4 block">Ubicación</span>
        <h2 className="font-display text-4xl md:text-6xl font-light text-foreground">
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
          Pureo Rural km 8560 — Queilén ~ Chiloé
        </p>
        <p className="font-display italic text-xl md:text-2xl text-foreground leading-relaxed mb-10">
          En el silencio del bosque, árboles nativos se regeneran y se transforman en el legado de nuestra existencia.
        </p>
        <Link
          href="/nuestra-historia"
          className="inline-flex items-center gap-3 border border-accent text-accent px-8 py-4 text-editorial-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all duration-elegant rounded-md font-medium"
        >
          Nuestra Historia
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </section>
  );
}
