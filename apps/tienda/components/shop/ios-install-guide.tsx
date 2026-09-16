'use client';

import { useEffect, useState } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';

interface IosInstallGuideProps {
  className?: string;
}

export function IosInstallGuide({ className = '' }: IosInstallGuideProps) {
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Comprobar si ya corre en modo PWA nativo (standalone)
    const nav = window.navigator as unknown as { standalone?: boolean };
    const standalone =
      nav.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    setIsStandalone(standalone);

    // Detección segura de iOS (iPhone / iPad) en Safari (no embebido o webview)
    const ua = window.navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/.test(ua);
    const isWebKit = /WebKit/i.test(ua);
    const isSafari = isIos && isWebKit && !/CriOS|FxiOS|OPiOS|EdgiOS|mercury/i.test(ua);

    setIsIosSafari(isSafari);

    // Chequeo de persistencia de descarte
    const wasDismissed = window.localStorage.getItem('oyz_a2hs_dismissed') === '1';
    setDismissed(wasDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem('oyz_a2hs_dismissed', '1');
    } catch {
      // ignore
    }
  };

  // Solo mostrar si es Safari en iOS y NO está instalado ya como PWA ni ha sido descartado
  if (!isIosSafari || isStandalone || dismissed) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-accent/40 bg-surface-raised/95 p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 relative ${className}`}
      role="region"
      aria-label="Guía de instalación en iPhone"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-sunken transition-colors"
        aria-label="Descartar guía de instalación"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3.5 pr-6">
        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
          <Smartphone size={20} />
        </div>

        <div className="space-y-2 text-left">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-accent-text font-bold">
              Acceso directo en iPhone
            </p>
            <h4 className="font-display text-base text-foreground font-medium">
              Lleva tu Tarjeta Obrera al iPhone
            </h4>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Ten tu pase a pantalla completa con acceso rápido desde tu teléfono sin necesidad de abrir Safari cada vez:
          </p>

          <ol className="space-y-1.5 text-xs text-foreground/90 font-medium pt-1">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-surface-sunken border border-border flex items-center justify-center text-accent shrink-0">
                <Share size={12} />
              </span>
              <span>1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-surface-sunken border border-border flex items-center justify-center text-accent shrink-0">
                <PlusSquare size={12} />
              </span>
              <span>2. Selecciona <strong>«Agregar a pantalla de inicio»</strong>.</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
