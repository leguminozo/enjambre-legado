'use client';

import { useEffect, useRef, useState } from 'react';
import type { FloracionViva } from '@/lib/floraciones/vivo';
import { formatCalendarDate } from '@enjambre/ui';

/**
 * Mapa vivo de floraciones (Leaflet, carga diferida solo en cliente).
 * Legacy (iOS 15.4-, data-legacy="true"): lista estática sin mapa.
 */
export function MapaFloraciones({ puntos }: { puntos: FloracionViva[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [legacy, setLegacy] = useState(false);
  const [sinMapa, setSinMapa] = useState(false);

  useEffect(() => {
    if (document.documentElement.dataset.legacy === 'true') {
      setLegacy(true);
      return;
    }
    if (!ref.current || puntos.length === 0) return;
    let cancelado = false;
    let mapa: { remove: () => void } | null = null;

    (async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        if (cancelado || !ref.current) return;

        const centro: [number, number] = [-42.6, -73.95];
        const instancia = L.map(ref.current, { scrollWheelZoom: false }).setView(centro, 8);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 18,
        }).addTo(instancia);

        // Tono del tema (sin hex fijos): lee la variable semántica en runtime.
        const acento =
          getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() ||
          undefined;

        for (const p of puntos) {
          L.circleMarker([p.lat, p.lng], {
            radius: 7,
            ...(acento ? { color: acento } : {}),
            fillOpacity: 0.7,
          })
            .bindPopup(
              `<strong>${p.especie ?? 'Floración nativa'}</strong><br/>${p.fase ?? ''}<br/>${p.fecha ?? ''}`,
            )
            .addTo(instancia);
        }
        mapa = instancia;
      } catch {
        if (!cancelado) setSinMapa(true);
      }
    })();

    return () => {
      cancelado = true;
      try {
        mapa?.remove();
      } catch {
        // Ignorar limpieza fallida
      }
    };
  }, [puntos]);

  if (puntos.length === 0) return null;

  if (legacy || sinMapa) {
    return (
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {puntos.slice(0, 12).map((p) => (
          <li
            key={p.id}
            className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-muted-foreground"
          >
            <span className="text-foreground font-medium">{p.especie ?? 'Floración nativa'}</span>
            {p.fase ? ` · ${p.fase}` : ''}
            {p.fecha ? ` · ${formatCalendarDate(p.fecha)}` : ''}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      ref={ref}
      className="h-72 w-full rounded-2xl border border-border/40 overflow-hidden bg-surface-sunken"
      role="img"
      aria-label="Mapa de floraciones activas en Chiloé"
    />
  );
}
