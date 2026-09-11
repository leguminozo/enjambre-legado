'use client';

import { useEffect, useRef } from 'react';

interface UseBarcodeGunOptions {
  onScan: (code: string) => void;
  enabled?: boolean;
  /** Tiempo máximo entre pulsaciones en ms para considerarse pistola láser (default: 45ms) */
  maxIntervalMs?: number;
  /** Longitud mínima del código para disparar el callback (default: 3 caracteres) */
  minLength?: number;
}

/**
 * Hook para capturar pistolas lectoras de códigos de barra y QR físicas (USB o Bluetooth en modo HID).
 * Detecta ráfagas de caracteres a velocidad de hardware que terminan en 'Enter' y evita interferir
 * con la escritura manual normal en formularios.
 */
export function useBarcodeGun({
  onScan,
  enabled = true,
  maxIntervalMs = 50,
  minLength = 3,
}: UseBarcodeGunOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar teclas modificadoras
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Si pasa demasiado tiempo entre caracteres, reiniciar buffer (escritura humana lenta)
      if (interval > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        if (code.length >= minLength) {
          e.preventDefault();
          onScanRef.current(code);
        }
        bufferRef.current = '';
        return;
      }

      // Solo acumular caracteres imprimibles (alfanuméricos, guiones, barras)
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, maxIntervalMs, minLength]);
}
