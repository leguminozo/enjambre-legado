'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { HexagonLoader } from '@enjambre/ui';
import { Camera, CameraOff } from 'lucide-react';

type QrCameraScannerProps = {
  onScan: (code: string) => void;
  disabled?: boolean;
};

export function QrCameraScanner({ onScan, disabled }: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [manualCode, setManualCode] = useState('');
  // SSR-stable: no leer window en render (React #418)
  const [hasBarcodeApi, setHasBarcodeApi] = useState(false);

  useEffect(() => {
    setHasBarcodeApi(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const Detector =
      typeof window !== 'undefined'
        ? (
            window as Window & {
              BarcodeDetector?: new (opts: { formats: string[] }) => {
                detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
              };
            }
          ).BarcodeDetector
        : undefined;

    if (!video || video.readyState < 2 || !Detector) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const detector = new Detector({ formats: ['qr_code'] });
    void detector
      .detect(video)
      .then((codes) => {
        const value = codes[0]?.rawValue?.trim();
        if (value) {
          stopCamera();
          onScan(value);
          return;
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      })
      .catch(() => {
        rafRef.current = requestAnimationFrame(scanFrame);
      });
  }, [onScan, stopCamera]);

  const startCamera = useCallback(async () => {
    if (disabled) return;
    setStarting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setActive(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch {
      setError('No se pudo acceder a la cámara. Usa el campo manual o revisa permisos.');
      stopCamera();
    } finally {
      setStarting(false);
    }
  }, [disabled, scanFrame, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) return;
    setManualCode('');
    onScan(code);
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
      <div className="relative aspect-[4/3] bg-surface-sunken">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${active ? 'opacity-100' : 'opacity-0'}`}
          playsInline
          muted
        />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Camera size={32} className="text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {hasBarcodeApi
                ? 'Activa la cámara para escanear el QR del producto'
                : 'Escaneo por cámara no disponible. Usa el campo manual abajo.'}
            </p>
          </div>
        )}
        {active && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-accent/70 rounded-lg" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          {!active ? (
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={disabled || starting || !hasBarcodeApi}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              {starting ? <HexagonLoader size="sm" /> : <Camera size={16} />}
              Abrir cámara
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground"
            >
              <CameraOff size={16} />
              Cerrar cámara
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitManual();
              }
            }}
            placeholder="Código QR manual"
            disabled={disabled}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground"
          />
          <button
            type="button"
            onClick={submitManual}
            disabled={disabled || !manualCode.trim()}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
        {error && <p className="text-xs text-destructive w-full">{error}</p>}
      </div>
    </div>
  );
}
