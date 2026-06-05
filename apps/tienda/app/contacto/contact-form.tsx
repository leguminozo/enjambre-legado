'use client';

import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAP_COORDINATES = { lat: -42.854935, lng: -73.67796 };

export function ContactForm() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([MAP_COORDINATES.lat, MAP_COORDINATES.lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);

      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      L.marker([MAP_COORDINATES.lat, MAP_COORDINATES.lng], { icon }).addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const handleOpenInMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${MAP_COORDINATES.lat},${MAP_COORDINATES.lng}`, '_blank');
  };

  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold text-foreground">Contáctenos</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            No dudes en contactarnos si tienes alguna pregunta o inquietud.
          </p>
          <p className="text-lg text-muted-foreground">
            Agradecemos su interés y esperamos tener noticias suyas.
          </p>
        </div>

        <form className="mx-auto mt-10 max-w-md space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-foreground">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              className="mt-1 w-full rounded-full border border-foreground/30 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-foreground">
              Apellido
            </label>
            <input
              type="text"
              id="apellido"
              className="mt-1 w-full rounded-full border border-foreground/30 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Tu apellido"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              E-mail*
            </label>
            <input
              type="email"
              id="email"
              required
              className="mt-1 w-full rounded-full border border-foreground/30 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Tu dirección de correo electrónico"
            />
          </div>
          <div>
            <label htmlFor="mensaje" className="block text-sm font-medium text-foreground">
              Mensaje*
            </label>
            <textarea
              id="mensaje"
              required
              rows={4}
              className="mt-1 w-full rounded-2xl border border-foreground/30 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Déjanos tu mensaje"
            />
          </div>
          <div className="text-center">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full border border-foreground bg-background px-8 py-3 text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Enviar
            </button>
          </div>
        </form>
      </main>

      <section className="border-t border-foreground/20 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">Contactos</h2>
              <p className="mt-3 text-foreground">obrerayzangano@gmail.com</p>
              <p className="mt-2 text-foreground">+56 9 4083 1358</p>
            </div>
            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">Dirección</h2>
              <p className="mt-3 text-foreground">8560 Pureo W-855</p>
              <p className="text-foreground">Chiloé, CL</p>
              <p className="mt-2 text-foreground">48WC+2R6 Queilén</p>
            </div>
            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">Horarios</h2>
              <p className="mt-3 text-foreground">Lunes ~ Viernes: 10:00 - 20:00</p>
              <p className="mt-2 text-foreground">Sábado: 10:00 - 18:00</p>
              <p className="mt-2 text-foreground">Domingos y feriados: Cerrado</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex justify-center">
            <div className="relative h-96 w-full max-w-lg rounded-lg border border-foreground/20 overflow-hidden">
              <div ref={mapRef} className="h-full w-full" />
              <button
                onClick={handleOpenInMaps}
                className="absolute left-4 top-4 inline-flex items-center gap-1 rounded bg-card px-3 py-1.5 text-sm font-medium text-info shadow hover:bg-surface-raised"
              >
                Abrir en Maps
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="py-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-foreground bg-background px-8 py-3 text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Volver al Catálogo
        </Link>
      </div>

      <ShopFooter />
    </StoreShell>
  );
}
