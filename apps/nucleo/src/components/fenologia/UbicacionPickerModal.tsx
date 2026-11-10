'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Check, X, Loader2 } from 'lucide-react';
import { overlayBackdropClassName } from '@enjambre/ui';

const UbicacionMapBase = dynamic(() => import('./UbicacionMapBase'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-xl bg-surface-sunken border border-border animate-pulse flex flex-col items-center justify-center">
      <span className="text-xs text-muted-foreground font-mono">Cargando visor territorial…</span>
    </div>
  ),
});

interface UbicacionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat: number | null;
  initialLng: number | null;
  initialSector: string;
  onConfirm: (data: { lat: number | null; lng: number | null; sector: string }) => void;
}

export function UbicacionPickerModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialSector,
  onConfirm,
}: UbicacionPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [sector, setSector] = useState(initialSector);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleUsarGps = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsFeedback('Geolocalización no soportada en este navegador');
      return;
    }

    setIsGettingGps(true);
    setGpsFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setIsGettingGps(false);
        setGpsFeedback(`Ubicación fijada con precisión de ~${Math.round(pos.coords.accuracy)}m ✓`);
      },
      (err) => {
        setIsGettingGps(false);
        setGpsFeedback(
          err.code === 1
            ? 'Permiso de ubicación denegado en el navegador'
            : 'No se pudo obtener señal GPS en este momento'
        );
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleConfirmar = () => {
    onConfirm({ lat, lng, sector: sector.trim() });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <button
        type="button"
        className={`fixed inset-0 ${overlayBackdropClassName}`}
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 fade-in-0 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <h3 className="font-display text-lg text-foreground">
              Georreferenciación de Campo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Campo prioritario: Sector textual */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Sector / Paraje / Referencia Textual
          </label>
          <input
            type="text"
            placeholder="Ej: Pureo Alto, ladera poniente cerca del estero"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            Toponimia local para identificar la zona del bosque aunque falle la señal GPS.
          </p>
        </div>

        {/* Visor de mapa */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Haz clic en el mapa para situar o mover el marcador:
            </span>
            <button
              type="button"
              onClick={handleUsarGps}
              disabled={isGettingGps}
              className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 inline-flex items-center gap-1.5 transition-colors font-mono text-[11px]"
            >
              {isGettingGps ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Navigation size={12} />
              )}
              <span>{isGettingGps ? 'Buscando satélites…' : 'Usar mi GPS'}</span>
            </button>
          </div>

          <UbicacionMapBase
            lat={lat}
            lng={lng}
            onChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
          />

          {/* Feedback GPS o coordenadas seleccionadas */}
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
            <span>
              {lat != null && lng != null ? (
                `Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
              ) : (
                'Sin coordenadas fijadas'
              )}
            </span>
            {gpsFeedback && (
              <span className={gpsFeedback.includes('✓') ? 'text-success' : 'text-warning'}>
                {gpsFeedback}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline text-xs min-h-9 px-3.5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            className="btn btn-primary text-xs min-h-9 px-4 inline-flex items-center gap-1.5"
          >
            <Check size={13} />
            <span>Fijar Ubicación</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
