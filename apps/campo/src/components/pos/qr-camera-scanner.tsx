'use client';

/**
 * ADAPTADOR POS CAMPO: ESCÁNER QR DE CÁMARA
 * 
 * Delega al componente canónico `@enjambre/ui/qr-camera-scanner` preconfigurando
 * `showManualInput: true` por defecto para el flujo ágil de caja en ferias y puntos de venta.
 */

import React from 'react';
import {
  QrCameraScanner as BaseQrCameraScanner,
  type QrCameraScannerProps,
} from '@enjambre/ui';

export function QrCameraScanner({
  showManualInput = true,
  ...props
}: QrCameraScannerProps) {
  return <BaseQrCameraScanner showManualInput={showManualInput} {...props} />;
}

export type { QrCameraScannerProps };
