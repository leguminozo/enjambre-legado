'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HexagonLoader } from './hexagon-loader';
import { Camera, CameraOff } from 'lucide-react';
import { cn } from '../lib/utils';

export interface QrCameraScannerProps {
  onScan: (code: string) => void;
  disabled?: boolean;
  showManualInput?: boolean;
  manualPlaceholder?: string;
  manualButtonLabel?: string;
  openButtonLabel?: string;
  closeButtonLabel?: string;
  className?: string;
}

export function QrCameraScanner({
  onScan,
  disabled,
  showManualInput = false,
  manualPlaceholder = 'Código QR manual',
  manualButtonLabel = 'Añadir',
  openButtonLabel = 'Abrir cámara',
  closeButtonLabel = 'Cerrar cámara',
  className,
}: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [hasBarcodeApi, setHasBarcodeApi] = useState(false);

  useEffect(() => {
    setHasBarcodeApi(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  const isScanningRef = useRef(false);
  const scanFrameRef = useRef<() => void>(() => {});

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
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
    if (!isScanningRef.current) return;
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
      rafRef.current = requestAnimationFrame(scanFrameRef.current);
      return;
    }

    const detector = new Detector({ formats: ['qr_code'] });
    void detector
      .detect(video)
      .then((codes) => {
        if (!isScanningRef.current) return;
        const value = codes[0]?.rawValue?.trim();
        if (value) {
          stopCamera();
          onScan(value);
          return;
        }
        rafRef.current = requestAnimationFrame(scanFrameRef.current);
      })
      .catch(() => {
        if (!isScanningRef.current) return;
        rafRef.current = requestAnimationFrame(scanFrameRef.current);
      });
  }, [onScan, stopCamera]);

  scanFrameRef.current = scanFrame;

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
      isScanningRef.current = true;
      rafRef.current = requestAnimationFrame(scanFrameRef.current);
    } catch {
      setError('No se pudo acceder a la cámara. Usa el campo manual o revisa permisos.');
      stopCamera();
    } finally {
      setStarting(false);
    }
  }, [disabled, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) return;
    setManualCode('');
    onScan(code);
  };

  return (
    <div className={cn('rounded-xl border border-border bg-card/40 overflow-hidden', className)}>
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
                ? 'Activa la cámara para escanear el QR'
                : 'Escaneo por cámara no disponible. Usa el campo manual.'}
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
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {starting ? <HexagonLoader size="sm" /> : <Camera size={16} />}
              {openButtonLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground"
            >
              <CameraOff size={16} />
              {closeButtonLabel}
            </button>
          )}
        </div>
        {showManualInput && (
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
              placeholder={manualPlaceholder}
              disabled={disabled}
              className="flex-1 min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground"
            />
            <button
              type="button"
              onClick={submitManual}
              disabled={disabled || !manualCode.trim()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium disabled:opacity-50"
            >
              {manualButtonLabel}
            </button>
          </div>
        )}
        {error && <p className="text-xs text-destructive w-full">{error}</p>}
      </div>
    </div>
  );
}
