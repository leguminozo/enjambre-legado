'use client';

import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { alignToClass, type TextAlign } from '@enjambre/shop-chrome';
import { toast, friendlyError } from '@enjambre/ui';
import { useAuth } from '@/components/providers/auth-context';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Move,
  Layers,
  Send,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_COORDINATES = { lat: -42.854935, lng: -73.67796 };
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

export function ContactForm({
  title = 'Contáctenos',
  desc = 'No dudes en contactarnos si tienes alguna pregunta o inquietud.',
  align,
}: {
  /** Cabecera desde site_content 'contacto' (Editor de Tienda). */
  title?: string;
  desc?: string;
  /** Alineación desde contact_settings (Editor de Tienda). */
  align?: TextAlign;
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
      : 'Pureo rural km 8560\nQueilén, Chiloé, Chile';
  const hours =
    typeof contact.hours === 'string' && contact.hours.trim()
      ? contact.hours
      : 'Lunes ~ Viernes: 10:00 - 18:00 (CL)\nSábado: 10:00 - 14:00\nDomingos: Cerrado';

  const addressLines = address.split('\n').filter(Boolean);
  const hoursLines = hours.split('\n').filter(Boolean);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const darkLayerRef = useRef<ReturnType<typeof maplibreGL> | null>(null);
  const satLayersRef = useRef<L.TileLayer[]>([]);
  const currentLayerModeRef = useRef<'dark' | 'satellite'>('dark');

  const [layerMode, setLayerMode] = useState<'dark' | 'satellite'>('dark');
  const [isInteracting, setIsInteracting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current || mapInstance.current) return;
      if (cancelled) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
      }).setView([MAP_COORDINATES.lat, MAP_COORDINATES.lng], 14);

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
        // Fallback si WebGL no está disponible
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
          <div style="position:relative;width:28px;height:28px;display:flex;items-center:center;justify-content:center;">
            <span style="position:absolute;width:34px;height:34px;top:-3px;left:-3px;border-radius:50%;background:hsl(44 85% 46% / 0.28);animation:ping 2.4s cubic-bezier(0,0,0.2,1) infinite;"></span>
            <span style="position:absolute;width:24px;height:24px;top:2px;left:2px;border-radius:50%;background:hsl(44 85% 46% / 0.35);filter:blur(3px);"></span>
            <span style="position:relative;width:16px;height:16px;margin-top:6px;border-radius:50%;background:hsl(44 85% 46%);border:3px solid hsl(35 60% 93%);box-shadow:0 0 20px hsl(44 85% 46% / 0.9),0 0 40px hsl(44 85% 46% / 0.4);"></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([MAP_COORDINATES.lat, MAP_COORDINATES.lng], {
        icon: markerIcon,
        keyboard: false,
      }).addTo(map);

      const popupContent = `
        <div style="font-family: inherit; min-width: 210px; padding: 2px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:hsl(44, 85%, 46%);"></span>
            <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:hsl(44, 85%, 46%);font-weight:600;">Apiario Central</span>
          </div>
          <h4 style="font-size:15px;font-weight:600;margin:0 0 4px 0;letter-spacing:-0.01em;">La Obrera & el Zángano</h4>
          <p style="font-size:12px;opacity:0.8;margin:0 0 6px 0;line-height:1.4;">Pureo rural km 8560 · Queilén, Chiloé</p>
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
  }, []);

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
      `https://www.google.com/maps/dir/?api=1&destination=${MAP_COORDINATES.lat},${MAP_COORDINATES.lng}`,
      '_blank',
    );
  };

  const handleCopyCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(`${MAP_COORDINATES.lat}, ${MAP_COORDINATES.lng}`);
      setCopied(true);
      toast.success('Coordenadas copiadas al portapapeles');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error('No se pudieron copiar las coordenadas');
    }
  };

  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sentSummary, setSentSummary] = useState<{ nombre: string; from: string; mensaje: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    const nombre = String(data.get('nombre') ?? '').trim();
    const apellido = String(data.get('apellido') ?? '').trim();
    const from = String(data.get('email') ?? '').trim();
    const mensaje = String(data.get('mensaje') ?? '').trim();
    const honeypot = String(data.get('honeypot') ?? '');

    try {
      const res = await fetch('/api/contacto/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, email: from, mensaje, honeypot }),
      });

      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'No se pudo registrar tu mensaje');
      }

      setSentSummary({ nombre: `${nombre} ${apellido}`.trim(), from, mensaje });
      setSubmitted(true);
      toast.success(json.message || 'Mensaje recibido con éxito');
    } catch (err) {
      toast.error(friendlyError(err, 'No se pudo enviar el mensaje'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMailtoFallback = () => {
    if (!sentSummary) return;
    const subject = `Contacto web${sentSummary.nombre ? ` — ${sentSummary.nombre}` : ''}`;
    const body = [`Nombre: ${sentSummary.nombre}`, `E-mail: ${sentSummary.from}`, '', sentSummary.mensaje].join('\n');
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <StoreShell>
      <style>{`
        .enj-contact-map-container .leaflet-bar {
          border: 1px solid hsl(var(--border) / 0.7) !important;
          border-radius: 9999px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35) !important;
        }
        .enj-contact-map-container .leaflet-bar a {
          background-color: hsl(var(--background) / 0.9) !important;
          color: hsl(var(--foreground)) !important;
          border-bottom: 1px solid hsl(var(--border) / 0.5) !important;
          backdrop-filter: blur(8px) !important;
          transition: all 0.2s ease !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
        }
        .enj-contact-map-container .leaflet-bar a:last-child {
          border-bottom: none !important;
        }
        .enj-contact-map-container .leaflet-bar a:hover {
          background-color: hsl(var(--surface-raised)) !important;
          color: hsl(var(--primary)) !important;
        }
        .enj-contact-popup .leaflet-popup-content-wrapper {
          background: hsl(var(--card)) !important;
          color: hsl(var(--card-foreground)) !important;
          border: 1px solid hsl(var(--border) / 0.8) !important;
          border-radius: 1rem !important;
          box-shadow: 0 12px 28px -4px rgba(0,0,0,0.5), 0 0 20px hsl(var(--primary) / 0.15) !important;
          padding: 2px !important;
        }
        .enj-contact-popup .leaflet-popup-content {
          margin: 12px 14px !important;
        }
        .enj-contact-popup .leaflet-popup-tip {
          background: hsl(var(--card)) !important;
          box-shadow: none !important;
        }
      `}</style>

      <ShopHeader />

      <main
        data-cms-section="contacto"
        className="mx-auto max-w-4xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-14"
      >
        <div className="text-center">
          <h1 className="font-display text-[clamp(2rem,7vw,2.75rem)] sm:text-4xl font-semibold text-foreground text-balance">
            {title}
          </h1>
          <p
            className={`mt-4 text-base sm:text-lg text-muted-foreground text-pretty whitespace-pre-line ${alignToClass(align)}`}
          >
            {desc}
          </p>
        </div>

        {submitted ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8 text-center backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Mensaje Recibido
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Tu consulta ha quedado registrada en nuestra coordinación territorial. Te responderemos directamente a{' '}
              <span className="text-foreground font-medium">{sentSummary?.from}</span> a la brevedad.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface-raised px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-surface-raised/80 transition-colors"
              >
                Enviar otro mensaje
              </button>
              <button
                type="button"
                onClick={handleOpenMailtoFallback}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border/40 bg-transparent px-5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Abrir en tu gestor de correo
              </button>
            </div>
          </div>
        ) : (
          <form className="mx-auto mt-10 max-w-md space-y-5" onSubmit={handleSubmit}>
            {/* Campo honeypot oculto anti-spam */}
            <input
              type="text"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-foreground">
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                defaultValue={user?.name ? user.name.split(' ')[0] : ''}
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
                defaultValue={user?.name ? user.name.split(' ').slice(1).join(' ') : ''}
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
                defaultValue={user?.email || ''}
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
                disabled={submitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Tarjetas de contacto y horarios: diseño limpio y sin líneas divisorias duras */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-8 text-center flex flex-col items-center hover:border-border transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Mail className="w-4 h-4" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">Contactos</h2>
              <a
                href={`mailto:${email}`}
                className="mt-3 inline-flex min-h-11 items-center text-sm text-foreground hover:text-accent transition-colors"
              >
                {email}
              </a>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="mt-1 inline-flex min-h-11 items-center text-sm text-foreground hover:text-accent transition-colors"
              >
                {phone}
              </a>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-8 text-center flex flex-col items-center hover:border-border transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">Dirección</h2>
              <div className="mt-3 text-sm text-foreground space-y-1">
                {addressLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/30 p-6 sm:p-8 text-center flex flex-col items-center hover:border-border transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">Horarios</h2>
              <div className="mt-3 text-sm text-foreground space-y-1">
                {hoursLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mapa de Identidad y Presencia Territorial — Formato Panorámico */}
      <section className="pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-[0.7rem] uppercase tracking-[0.25em] text-accent-text font-medium block mb-2">
              Presencia en el Territorio
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light text-foreground text-balance">
              Nuestro enclave en el bosque de Chiloé
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Pureo rural km 8560, Queilén. Encuentro entre el bosque nativo y el canal de Queilén.
            </p>
          </div>

          <div className="enj-contact-map-container relative isolate z-0 overflow-hidden rounded-2xl md:rounded-3xl border border-border/70 bg-surface-sunken shadow-2xl ring-1 ring-border/30 w-full h-[460px] sm:h-[520px] md:h-[580px]">
            {/* Mapa Leaflet */}
            <div
              ref={mapRef}
              className={`w-full h-full cursor-pointer ${
                isInteracting ? 'pointer-events-auto' : 'pointer-events-none sm:pointer-events-auto'
              }`}
            />

            {/* Cabecera flotante en glassmorphism (izquierda): Ficha de ubicación */}
            <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-2.5 rounded-full bg-background/85 backdrop-blur-md px-4 py-2 border border-border/70 shadow-lg text-xs font-medium text-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-display tracking-wide">Pureo rural km 8560 · Queilén</span>
              <span className="text-muted-foreground font-mono text-[10px]">
                42°51'18"S 73°40'41"W
              </span>
            </div>

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
                  Nocturno
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
                  <span>Satélite</span>
                </button>
              </div>

              {/* Botón copiar coordenadas */}
              <button
                type="button"
                onClick={handleCopyCoordinates}
                title="Copiar coordenadas"
                className="min-h-9 min-w-9 h-9 w-9 rounded-full bg-background/85 backdrop-blur-md border border-border/70 shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
                aria-label="Copiar coordenadas del apiario"
              >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Botón Cómo llegar (Google Maps) */}
              <button
                type="button"
                onClick={handleOpenInMaps}
                className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                <span>Cómo llegar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Botón Cómo llegar en móvil (inferior izquierda) */}
            <div className="absolute bottom-4 left-4 z-10 sm:hidden">
              <button
                type="button"
                onClick={handleOpenInMaps}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg"
              >
                <span>Cómo llegar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Touch guard móvil: previene que el mapa atrape el scroll vertical */}
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
                aria-label="Tocar para interactuar con el mapa territorial"
                className="sm:hidden absolute inset-0 z-10 bg-background/25 backdrop-blur-[1px] flex items-center justify-center p-4 cursor-pointer transition-all hover:bg-background/35"
              >
                <div className="bg-background/95 border border-border/80 text-foreground px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium active:scale-95 transition-transform">
                  <Move className="w-3.5 h-3.5 text-primary" />
                  <span>Toca para explorar el mapa</span>
                </div>
              </div>
            )}

            {isInteracting && (
              <div className="sm:hidden absolute top-4 left-4 z-10">
                <button
                  type="button"
                  onClick={() => setIsInteracting(false)}
                  className="bg-background/90 text-foreground border border-border/70 text-[11px] px-3 py-1.5 rounded-full shadow-md font-medium"
                >
                  Bloquear scroll
                </button>
              </div>
            )}
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
