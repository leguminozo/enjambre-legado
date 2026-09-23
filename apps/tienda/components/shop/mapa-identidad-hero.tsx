'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Move,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  ArrowDown,
  Play,
  Pause,
  MapPin,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from '@enjambre/ui';
import { DEFAULT_MAP_SETTINGS, type MapSettings } from '@/lib/shop/store-chrome';

/**
 * Coordenadas oficiales de Pureo Rural km 8560 (Queilén, Chiloé)
 * Latitud: 42°51'18"S (-42.854935)
 * Longitud: 73°40'41"W (-73.67796)
 */
const DEFAULT_PUREO_COORDS = { lat: -42.854935, lng: -73.67796 };

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

type CosmicStage = 'idle' | 'observing' | 'expanding' | 'zooming' | 'settled';

export function MapaIdentidadHero({
  mapSettings = DEFAULT_MAP_SETTINGS,
}: {
  mapSettings?: MapSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const darkLayerRef = useRef<ReturnType<typeof maplibreGL> | null>(null);
  const satLayersRef = useRef<L.TileLayer[]>([]);
  const currentLayerModeRef = useRef<'dark' | 'satellite'>('dark');

  // Estado del viaje cósmico y visualización
  const [stage, setStage] = useState<CosmicStage>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(7);
  const [isPaused, setIsPaused] = useState(false);
  const [layerMode, setLayerMode] = useState<'dark' | 'satellite'>('dark');
  const [isInteracting, setIsInteracting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resolver coordenadas reales con fallback robusto a Pureo Rural
  const targetLat =
    mapSettings?.lat && mapSettings.lat !== 0 && mapSettings.lat !== -43.0837
      ? mapSettings.lat
      : DEFAULT_PUREO_COORDS.lat;
  const targetLng =
    mapSettings?.lng && mapSettings.lng !== 0 && mapSettings.lng !== -73.6144
      ? mapSettings.lng
      : DEFAULT_PUREO_COORDS.lng;

  const popupTitle = mapSettings?.popup_title?.trim() || 'Apiario Central · La Obrera & el Zángano';
  const popupBody =
    mapSettings?.popup_body?.trim() || 'Pureo rural km 8560 · Queilén, Chiloé\n42°51\'18"S 73°40\'41"W';

  // 1. Inicialización de Leaflet y capas
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current || mapInstance.current) return;
      if (cancelled) return;

      // El mapa nace en visión macro orbital (zoom 3) centrado en las coordenadas
      const map = L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 18,
      }).setView([targetLat, targetLng], 3);

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

      // Marcador de lujo territorial con halo radiante y núcleo de oro miel
      const markerIcon = L.divIcon({
        className: 'enj-marker-wrapper',
        html: `
          <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
            <span style="position:absolute;width:40px;height:40px;top:-6px;left:-6px;border-radius:50%;background:hsl(44 85% 46% / 0.32);animation:ping 2.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
            <span style="position:absolute;width:26px;height:26px;top:1px;left:1px;border-radius:50%;background:hsl(44 85% 46% / 0.4);filter:blur(3px);"></span>
            <span style="position:relative;width:18px;height:18px;border-radius:50%;background:hsl(44 85% 46%);border:3px solid hsl(35 60% 93%);box-shadow:0 0 24px hsl(44 85% 46% / 0.95), 0 0 45px hsl(44 85% 46% / 0.45);"></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([targetLat, targetLng], {
        icon: markerIcon,
        keyboard: false,
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: inherit; min-width: 220px; padding: 2px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:hsl(44, 85%, 46%);"></span>
            <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.18em;color:hsl(44, 85%, 46%);font-weight:600;">Epicentro del Apiario</span>
          </div>
          <h4 style="font-size:15px;font-weight:600;margin:0 0 4px 0;letter-spacing:-0.01em;">${escapeHtml(popupTitle)}</h4>
          <p style="font-size:12px;opacity:0.8;margin:0 0 6px 0;line-height:1.4;">${escapeHtml(popupBody).replace(/\n/g, '<br/>')}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-size:10px;opacity:0.65;font-family:monospace;">
            <span>42°51'18"S</span>
            <span>73°40'41"W</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'enj-contact-popup',
        closeButton: false,
        offset: [0, -12],
      });

      markerInstance.current = marker;
      mapInstance.current = map;
    }

    void initMap();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [targetLat, targetLng, popupTitle, popupBody]);

  // 2. Control de alternancia de capas Nocturno / Satélite
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

  // 3. Inicio del acercamiento fluido (flyTo) hacia Pureo Rural
  const startDescent = useCallback(() => {
    setStage('expanding');

    // Breve pausa para la expansión visual del punto amarillo antes del vuelo
    setTimeout(() => {
      setStage('zooming');
      const map = mapInstance.current;
      if (map) {
        // Vuelo fluido de Leaflet: aceleración y desaceleración hiperbólica
        map.flyTo([targetLat, targetLng], 14, {
          duration: 4.8,
          easeLinearity: 0.22,
        });

        // Al finalizar el vuelo, asentar el estado y abrir el popup
        setTimeout(() => {
          setStage('settled');
          if (markerInstance.current) {
            markerInstance.current.openPopup();
          }
        }, 5000);
      } else {
        setStage('settled');
      }
    }, 700);
  }, [targetLat, targetLng]);

  // 4. Observador de intersección: arranca la vista cósmica cuando el usuario llega al bloque
  useEffect(() => {
    if (stage !== 'idle') return;
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setStage('observing');
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [stage]);

  // 5. Cronómetro de 7 segundos de la fase cósmica
  useEffect(() => {
    if (stage !== 'observing' || isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          startDescent();
          return 0;
        }
        return Math.max(0, +(prev - 0.1).toFixed(1));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [stage, isPaused, startDescent]);

  // 6. Reiniciar el viaje cósmico para volver a experimentarlo
  const handleReplayCosmicJourney = () => {
    const map = mapInstance.current;
    if (map) {
      if (markerInstance.current) {
        markerInstance.current.closePopup();
      }
      map.setView([targetLat, targetLng], 3);
    }
    setSecondsRemaining(7);
    setIsPaused(false);
    setStage('observing');
  };

  // Copiar coordenadas al portapapeles
  const handleCopyCoordinates = async () => {
    try {
      await navigator.clipboard.writeText(`${targetLat}, ${targetLng}`);
      setCopied(true);
      toast.success('Coordenadas copiadas al portapapeles');
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error('No se pudieron copiar las coordenadas');
    }
  };

  // Abrir en Google Maps con ruta hacia el apiario
  const handleOpenInMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`,
      '_blank',
    );
  };

  const progressPercent = Math.max(0, Math.min(100, ((7 - secondsRemaining) / 7) * 100));

  return (
    <section className="editorial-section relative">
      <div className="editorial-container text-center mb-10 md:mb-14 px-4 sm:px-0">
        <span className="editorial-kicker mb-4 block">Ubicación & Presencia Territorial</span>
        <h2 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] sm:text-4xl md:text-6xl font-light text-foreground text-balance leading-tight">
          Nuestro lugar en el mundo
        </h2>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto whitespace-pre-line">
          Pureo Rural km 8560 — Queilén — Chiloé
        </p>
      </div>

      <div ref={containerRef} className="editorial-container mb-12">
        <div className="enj-hero-map-wrapper relative isolate z-0 overflow-hidden rounded-2xl md:rounded-3xl border border-border/70 bg-[#05070a] shadow-2xl ring-1 ring-border/40 w-full h-[480px] sm:h-[540px] md:h-[620px]">
          {/* Contenedor del mapa Leaflet */}
          <div
            ref={mapRef}
            className={`w-full h-full cursor-pointer transition-opacity duration-1000 ${
              isInteracting ? 'pointer-events-auto' : 'pointer-events-none sm:pointer-events-auto'
            } ${stage === 'observing' ? 'opacity-85' : 'opacity-100'}`}
          />

          {/* ═══════════════════════════════════════════════════════════════════════
              CAPA CÓSMICA: Sol, Luna, Cosmos, Tierra y Punto Amarillo en Expansión
             ═══════════════════════════════════════════════════════════════════════ */}
          {(stage === 'observing' || stage === 'expanding' || stage === 'zooming') && (
            <div
              className={`absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 sm:p-8 transition-all duration-1000 ${
                stage === 'zooming'
                  ? 'opacity-0 scale-125 filter blur-xs'
                  : 'opacity-100 scale-100'
              }`}
              style={{
                background:
                  'radial-gradient(circle at 18% 22%, rgba(245, 158, 11, 0.12) 0%, transparent 40%), radial-gradient(circle at 82% 22%, rgba(148, 163, 184, 0.12) 0%, transparent 40%), radial-gradient(circle at 50% 60%, rgba(5, 7, 10, 0.4) 0%, rgba(5, 7, 10, 0.88) 85%)',
              }}
            >
              {/* Polvo estelar y constelaciones decorativas de fondo */}
              <div className="absolute inset-0 overflow-hidden opacity-75">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 1000 600"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <circle cx="120" cy="80" r="1.5" fill="#fff" opacity="0.6" />
                  <circle cx="280" cy="140" r="1" fill="#fff" opacity="0.4" />
                  <circle cx="210" cy="60" r="2" fill="#fde047" opacity="0.5" />
                  <circle cx="390" cy="90" r="1.2" fill="#fff" opacity="0.5" />
                  <circle cx="480" cy="40" r="1.8" fill="#fff" opacity="0.7" />
                  <circle cx="620" cy="70" r="1.2" fill="#93c5fd" opacity="0.6" />
                  <circle cx="750" cy="110" r="1" fill="#fff" opacity="0.4" />
                  <circle cx="890" cy="70" r="2" fill="#fff" opacity="0.6" />
                  <circle cx="820" cy="150" r="1.5" fill="#fde047" opacity="0.5" />
                  <circle cx="940" cy="140" r="1" fill="#fff" opacity="0.4" />
                  <circle cx="70" cy="220" r="1.2" fill="#fff" opacity="0.5" />
                  <circle cx="160" cy="310" r="1" fill="#93c5fd" opacity="0.4" />
                  <circle cx="880" cy="280" r="1.5" fill="#fff" opacity="0.5" />
                  <circle cx="920" cy="390" r="1" fill="#fde047" opacity="0.4" />
                  <circle cx="100" cy="480" r="1.5" fill="#fff" opacity="0.6" />
                  <circle cx="230" cy="520" r="1.2" fill="#fff" opacity="0.5" />
                  <circle cx="840" cy="490" r="2" fill="#fff" opacity="0.7" />
                  <circle cx="760" cy="530" r="1" fill="#93c5fd" opacity="0.4" />
                  {/* Arco orbital celeste entre Sol y Luna */}
                  <path
                    d="M 180 120 Q 500 20 820 120"
                    stroke="rgba(245, 158, 11, 0.2)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    fill="none"
                  />
                </svg>
              </div>

              {/* Fila superior: El Sol (izquierda) y La Luna (derecha) */}
              <div className="relative z-10 flex items-start justify-between w-full">
                {/* ── Representación del Sol ── */}
                <div className="flex items-center gap-3 bg-background/80 backdrop-blur-md border border-amber-500/30 px-3.5 py-2 rounded-2xl shadow-xl">
                  <div className="relative flex items-center justify-center w-8 h-8">
                    <span className="absolute inset-0 rounded-full bg-amber-500/25 animate-ping opacity-75" />
                    <span className="absolute -inset-1 rounded-full bg-amber-400/20 blur-sm" />
                    <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border border-yellow-100/80 shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center">
                      <Sun className="w-3.5 h-3.5 text-amber-950 animate-[spin_20s_linear_infinite]" />
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-semibold tracking-wider uppercase text-amber-400">
                      El Sol
                    </div>
                    <div className="text-[10px] text-muted-foreground hidden sm:block">
                      Ciclos estacionales & fotosíntesis
                    </div>
                  </div>
                </div>

                {/* ── Representación de La Luna ── */}
                <div className="flex items-center gap-3 bg-background/80 backdrop-blur-md border border-slate-400/30 px-3.5 py-2 rounded-2xl shadow-xl">
                  <div className="text-right">
                    <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-200">
                      La Luna
                    </div>
                    <div className="text-[10px] text-muted-foreground hidden sm:block">
                      Mareas en canales de Chiloé
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center w-8 h-8">
                    <span className="absolute inset-0 rounded-full bg-slate-400/20 blur-sm" />
                    <div className="relative w-7 h-7 rounded-full bg-gradient-to-tr from-slate-700 via-slate-300 to-slate-100 border border-slate-200/80 shadow-[0_0_15px_rgba(226,232,240,0.6)] flex items-center justify-center overflow-hidden">
                      <Moon className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Centro Cósmico: La Tierra en el Cosmos & El Punto Amarillo ── */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-2 pointer-events-none">
                <div className="relative flex items-center justify-center">
                  {/* Halo atmosférico planetario */}
                  <div className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-primary/20 bg-primary/5 blur-md animate-pulse" />
                  <div className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-sky-400/20" />

                  {/* Globo terráqueo representativo en el vacío cósmico */}
                  <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-border/60 bg-gradient-to-b from-[#0b1329] via-[#070b16] to-[#04060c] shadow-[inset_0_0_40px_rgba(56,189,248,0.15),0_0_40px_rgba(0,0,0,0.9)] flex items-center justify-center overflow-hidden">
                    {/* Retícula de coordenadas y meridianos terrestres */}
                    <div className="absolute inset-0 opacity-25">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="95" stroke="currentColor" fill="none" strokeWidth="0.8" />
                        <ellipse cx="100" cy="100" rx="95" ry="40" stroke="currentColor" fill="none" strokeWidth="0.8" />
                        <ellipse cx="100" cy="100" rx="40" ry="95" stroke="currentColor" fill="none" strokeWidth="0.8" />
                        <line x1="5" y1="100" x2="195" y2="100" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
                        <line x1="100" y1="5" x2="100" y2="195" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
                        {/* Paralelo 42°S (Latitud de Pureo) */}
                        <ellipse cx="100" cy="135" rx="85" ry="24" stroke="hsl(44, 85%, 46%)" fill="none" strokeWidth="1" strokeDasharray="2 3" opacity="0.75" />
                      </svg>
                    </div>

                    {/* ── EL PUNTO AMARILLO (Epicentro Pureo en el hemisferio sur) ── */}
                    <div className="absolute bottom-[30%] left-[44%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                      {/* Ondas expansivas de choque cósmico al comenzar la transición */}
                      {stage === 'expanding' && (
                        <>
                          <span className="absolute w-36 h-36 rounded-full bg-amber-400/35 animate-ping" />
                          <span className="absolute w-24 h-24 rounded-full border-2 border-amber-300 animate-ping delay-100" />
                          <span className="absolute w-16 h-16 rounded-full bg-amber-500/40 animate-ping delay-200" />
                        </>
                      )}

                      {/* Halo pulsante regular del punto amarillo */}
                      <span className="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-ping" />
                      <span className="absolute w-5 h-5 rounded-full bg-amber-400/50 blur-xs" />
                      <span className="relative w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-100 shadow-[0_0_18px_#f59e0b,0_0_30px_#fbbf24]" />

                      {/* Etiqueta flotante del epicentro en el cosmos */}
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap bg-background/90 backdrop-blur-md border border-amber-500/40 px-2.5 py-1 rounded-full text-[10px] text-amber-200 shadow-xl flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="font-semibold tracking-wide">Pureo Rural</span>
                        <span className="opacity-70 text-[9px] font-mono">42°51'S</span>
                      </div>
                    </div>

                    {/* Vértice indicador de La Tierra */}
                    <div className="absolute top-3 inset-x-0 text-center">
                      <span className="text-[9px] uppercase tracking-[0.25em] text-slate-300/80 font-medium">
                        Planeta Tierra · 42°51'18"S
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── HUD Inferior: Cuenta regresiva de 7 segundos y acción directa ── */}
              <div className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-3 bg-background/90 backdrop-blur-md border border-border/80 px-4 py-2.5 rounded-2xl sm:rounded-full shadow-2xl pointer-events-auto max-w-xl mx-auto w-full">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Anillo de progreso de 7 segundos */}
                  <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        className="stroke-muted/30"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="hsl(44, 85%, 46%)"
                        strokeWidth="2.5"
                        strokeDasharray="88"
                        strokeDashoffset={88 - (88 * progressPercent) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-100 ease-linear"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-foreground">
                      {Math.ceil(secondsRemaining)}
                    </span>
                  </div>

                  <div className="text-left">
                    <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Perspectiva Cósmica</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {stage === 'expanding'
                        ? 'Expandiendo epicentro territorial...'
                        : `Acercamiento a Pureo en ${secondsRemaining.toFixed(1)}s`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Pausar / Continuar observación */}
                  <button
                    type="button"
                    onClick={() => setIsPaused((p) => !p)}
                    className="p-1.5 rounded-full hover:bg-surface-raised border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                    title={isPaused ? 'Reanudar cuenta' : 'Pausar observación'}
                    aria-label={isPaused ? 'Reanudar cuenta' : 'Pausar observación'}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>

                  {/* Botón para saltar directo al epicentro */}
                  <button
                    type="button"
                    onClick={startDescent}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-4 py-2 rounded-full shadow-lg transition-transform active:scale-95"
                  >
                    <span>Descender ahora</span>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════
              CONTROLES DE MAPA LLEGADA (Idénticos al estándar de Contacto)
             ═══════════════════════════════════════════════════════════════════════ */}
          {stage === 'settled' && (
            <>
              {/* Ficha flotante superior izquierda: Ubicación exacta */}
              <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-2.5 rounded-full bg-background/85 backdrop-blur-md px-4 py-2 border border-border/70 shadow-lg text-xs font-medium text-foreground transition-opacity">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <span className="font-display tracking-wide">Pureo rural km 8560 · Queilén</span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  42°51'18"S 73°40'41"W
                </span>
              </div>

              {/* Barra de controles superior derecha */}
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

                {/* Copiar coordenadas */}
                <button
                  type="button"
                  onClick={handleCopyCoordinates}
                  title="Copiar coordenadas"
                  className="min-h-9 min-w-9 h-9 w-9 rounded-full bg-background/85 backdrop-blur-md border border-border/70 shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
                  aria-label="Copiar coordenadas del apiario"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* Botón para reiniciar y revivir el viaje cósmico */}
                <button
                  type="button"
                  onClick={handleReplayCosmicJourney}
                  title="Perspectiva Cósmica (Reiniciar viaje)"
                  className="min-h-9 min-w-9 h-9 w-9 rounded-full bg-background/85 backdrop-blur-md border border-border/70 shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
                  aria-label="Reiniciar viaje cósmico"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Ampliar en Google Maps */}
                <button
                  type="button"
                  onClick={handleOpenInMaps}
                  title="Abrir en Google Maps"
                  className="min-h-9 min-w-9 h-9 w-9 rounded-full bg-background/85 backdrop-blur-md border border-border/70 shadow-lg flex items-center justify-center text-foreground hover:text-primary transition-colors"
                  aria-label="Abrir en Google Maps"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* Touch guard para dispositivos móviles: evita secuestro del scroll */}
          {!isInteracting && stage === 'settled' && (
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
              className="sm:hidden absolute inset-0 bg-background/20 backdrop-blur-[0.5px] flex items-center justify-center p-4 cursor-pointer transition-all hover:bg-background/30 z-10"
            >
              <div className="bg-background/95 border border-border/80 text-foreground px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium active:scale-95 transition-transform">
                <Move className="w-3.5 h-3.5 text-primary" />
                <span>Toca para explorar el mapa</span>
              </div>
            </div>
          )}

          {/* Botones de acción móvil cuando el mapa está activo */}
          {isInteracting && stage === 'settled' && (
            <div className="sm:hidden absolute bottom-3 left-3 z-20 flex gap-2">
              <button
                type="button"
                onClick={() => setIsInteracting(false)}
                className="bg-background/95 text-foreground border border-border/70 text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium"
              >
                Bloquear scroll
              </button>
              <button
                type="button"
                onClick={handleOpenInMaps}
                className="bg-primary text-primary-foreground text-[11px] px-3 py-1.5 rounded-md shadow-md font-medium flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Ampliar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cita y llamado a la acción histórico */}
      <div className="editorial-container text-center max-w-2xl mx-auto">
        <p className="font-display italic text-xl md:text-2xl text-foreground leading-relaxed mb-10">
          En el silencio del bosque, árboles nativos se regeneran y se transforman en el legado de nuestra existencia.
        </p>
        <Link
          href="/nosotros"
          className="inline-flex min-h-12 items-center gap-3 border border-accent text-accent-text px-8 py-4 text-editorial-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all duration-elegant rounded-md font-medium"
        >
          Nuestra Historia
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
      </div>

      {/* Estilos globales para popups y controles de Leaflet */}
      <style jsx global>{`
        .enj-hero-map-wrapper .leaflet-bar {
          border: 1px solid hsl(var(--border) / 0.7) !important;
          border-radius: 9999px !important;
          overflow: hidden !important;
          background: hsl(var(--background) / 0.85) !important;
          backdrop-filter: blur(12px) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4) !important;
          margin-right: 16px !important;
          margin-bottom: 16px !important;
        }
        .enj-hero-map-wrapper .leaflet-bar a {
          background-color: transparent !important;
          color: hsl(var(--foreground)) !important;
          border-bottom: 1px solid hsl(var(--border) / 0.5) !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          font-size: 14px !important;
          transition: background-color 0.15s ease, color 0.15s ease !important;
        }
        .enj-hero-map-wrapper .leaflet-bar a:last-child {
          border-bottom: none !important;
        }
        .enj-hero-map-wrapper .leaflet-bar a:hover {
          background-color: hsl(var(--surface-raised)) !important;
          color: hsl(var(--primary)) !important;
        }
        .enj-hero-map-wrapper .enj-contact-popup .leaflet-popup-content-wrapper {
          background: hsl(var(--background) / 0.94) !important;
          backdrop-filter: blur(16px) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border) / 0.8) !important;
          border-radius: 1rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.55), 0 8px 10px -6px rgba(0, 0, 0, 0.55) !important;
          padding: 6px 4px !important;
        }
        .enj-hero-map-wrapper .enj-contact-popup .leaflet-popup-tip {
          background: hsl(var(--background) / 0.94) !important;
          border: 1px solid hsl(var(--border) / 0.8) !important;
        }
      `}</style>
    </section>
  );
}