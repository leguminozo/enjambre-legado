'use client';

import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { useEffect, useRef, type FormEvent } from 'react';
import 'leaflet/dist/leaflet.css';

const MAP_COORDINATES = { lat: -42.854935, lng: -73.67796 };

export function ContactForm({
  title = 'Contáctenos',
  desc = 'No dudes en contactarnos si tienes alguna pregunta o inquietud.',
}: {
  /** Cabecera desde site_content 'contacto' (Editor de Tienda). */
  title?: string;
  desc?: string;
}) {
  // Datos de contacto desde el CMS (contact_settings) — un solo lugar de verdad
  const { contact } = useStoreChrome();
  const email =
    typeof contact.email === 'string' && contact.email.trim()
      ? contact.email
      : 'obrerayzangano@gmail.com';
  const phone =
    typeof contact.phone_display === 'string' && contact.phone_display.trim()
      ? contact.phone_display
      : '+56 9 4083 1358';
  const address =
    typeof contact.address === 'string' && contact.address.trim()
      ? contact.address
      : '8560 Pureo W-855\nChiloé, CL\n48WC+2R6 Queilén';
  const hours =
    typeof contact.hours === 'string' && contact.hours.trim()
      ? contact.hours
      : 'Lunes ~ Viernes: 10:00 - 20:00\nSábado: 10:00 - 18:00\nDomingos y feriados: Cerrado';

  const addressLines = address.split('\n').filter(Boolean);
  const hoursLines = hours.split('\n').filter(Boolean);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current || mapInstance.current) return;
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([MAP_COORDINATES.lat, MAP_COORDINATES.lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      L.marker([MAP_COORDINATES.lat, MAP_COORDINATES.lng], { icon }).addTo(map);
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
  }, []);

  const handleOpenInMaps = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${MAP_COORDINATES.lat},${MAP_COORDINATES.lng}`, '_blank');
  };

  // Sin backend de contacto aún: el submit compone el correo en el cliente
  // (mailto) para que el botón Enviar nunca pierda el mensaje del visitante.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nombre = `${data.get('nombre') ?? ''} ${data.get('apellido') ?? ''}`.trim();
    const from = String(data.get('email') ?? '');
    const mensaje = String(data.get('mensaje') ?? '');
    const subject = `Contacto web${nombre ? ` — ${nombre}` : ''}`;
    const body = [`Nombre: ${nombre}`, `E-mail: ${from}`, '', mensaje].join('\n');
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-12">
        <div className="text-center">
          <h1 className="font-display text-[clamp(2rem,7vw,2.75rem)] sm:text-4xl font-semibold text-foreground text-balance">
            {title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground text-pretty">
            {desc}
          </p>
          <p className="text-base sm:text-lg text-muted-foreground text-pretty">
            Agradecemos su interés y esperamos tener noticias suyas.
          </p>
        </div>

        <form className="mx-auto mt-10 max-w-md space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-foreground">
              Nombre
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              className="mt-1 w-full min-h-11 rounded-full border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
              name="apellido"
              className="mt-1 w-full min-h-11 rounded-full border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
              name="email"
              required
              className="mt-1 w-full min-h-11 rounded-full border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Tu dirección de correo electrónico"
            />
          </div>
          <div>
            <label htmlFor="mensaje" className="block text-sm font-medium text-foreground">
              Mensaje*
            </label>
            <textarea
              id="mensaje"
              name="mensaje"
              required
              rows={4}
              className="mt-1 w-full min-h-[7.5rem] rounded-2xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="Déjanos tu mensaje"
            />
          </div>
          <div className="text-center">
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
              <a
                href={`mailto:${email}`}
                className="mt-3 inline-flex min-h-11 items-center text-foreground hover:text-accent transition-colors"
              >
                {email}
              </a>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="mt-1 inline-flex min-h-11 items-center text-foreground hover:text-accent transition-colors"
              >
                {phone}
              </a>
            </div>
            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">Dirección</h2>
              <div className="mt-3 text-foreground">
                {addressLines.map((line, i) => (
                  <p key={i} className="text-foreground">{line}</p>
                ))}
              </div>
            </div>
            <div className="text-center">
              <h2 className="font-display text-xl font-semibold text-foreground">Horarios</h2>
              <div className="mt-3 text-foreground">
                {hoursLines.map((line, i) => (
                  <p key={i} className="mt-2 first:mt-0 text-foreground">{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex justify-center">
            <div className="relative isolate z-0 h-96 w-full max-w-lg rounded-lg border border-foreground/20 overflow-hidden">
              <div ref={mapRef} className="h-full w-full" />
              <button
                type="button"
                onClick={handleOpenInMaps}
                className="absolute left-4 top-4 inline-flex min-h-11 items-center gap-1 rounded-lg bg-card px-3 py-2 text-sm font-medium text-info shadow hover:bg-surface-raised"
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
          href="/catalogo"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-8 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Ver catálogo
        </Link>
      </div>

      <ShopFooter />
    </StoreShell>
  );
}
