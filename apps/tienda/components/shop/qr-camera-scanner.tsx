'use client';

/**
 * ADAPTADOR TIENDA: ESCÁNER QR DE CÁMARA
 * 
 * Delega al componente canónico `@enjambre/ui/qr-camera-scanner` con `showManualInput: false`
 * por defecto, dado que la vista consumidora (`/qr-scan`) ya cuenta con su propio buscador
 * manual de código con textos localizados y estilo de marca.
 */

import React from 'react';
import {
  QrCameraScanner as BaseQrCameraScanner,
  type QrCameraScannerProps,
} from '@enjambre/ui';

export function QrCameraScanner({
  showManualInput = false,
  ...props
}: QrCameraScannerProps) {
  return <BaseQrCameraScanner showManualInput={showManualInput} {...props} />;
}

export type { QrCameraScannerProps };