export type DevicePresetId =
  | 'fluid'
  | 'compact'
  | 'standard'
  | 'max'
  | 'classic'
  | 'tablet';

export type DeviceOrientation = 'portrait' | 'landscape';

export interface ViewportPreset {
  id: DevicePresetId;
  label: string;
  shortLabel: string;
  category: 'fluid' | 'mobile' | 'tablet';
  width: number;
  height: number;
  description: string;
}

export const DEVICE_VIEWPORT_PRESETS: readonly ViewportPreset[] = [
  {
    id: 'fluid',
    label: 'Fluido (Pantalla completa)',
    shortLabel: 'Fluido',
    category: 'fluid',
    width: 0,
    height: 0,
    description: '100% del área de trabajo disponible',
  },
  {
    id: 'standard',
    label: 'Móvil Estándar (390×844)',
    shortLabel: '390px',
    category: 'mobile',
    width: 390,
    height: 844,
    description: 'iPhone 12 a 16 / Gama media-alta',
  },
  {
    id: 'compact',
    label: 'Móvil Compacto (360×740)',
    shortLabel: '360px',
    category: 'mobile',
    width: 360,
    height: 740,
    description: 'Android estándar en Chile / Galaxy A / Xiaomi',
  },
  {
    id: 'classic',
    label: 'Móvil Clásico (375×667)',
    shortLabel: '375px',
    category: 'mobile',
    width: 375,
    height: 667,
    description: 'iPhone 8 / SE (2da y 3ra gen)',
  },
  {
    id: 'max',
    label: 'Móvil Grande (430×932)',
    shortLabel: '430px',
    category: 'mobile',
    width: 430,
    height: 932,
    description: 'iPhone Pro Max / Galaxy Ultra / Pixel Pro',
  },
  {
    id: 'tablet',
    label: 'Tablet (768×1024)',
    shortLabel: 'Tablet',
    category: 'tablet',
    width: 768,
    height: 1024,
    description: 'iPad Mini / iPad Air vertical',
  },
] as const;

export const DEFAULT_DEVICE_PRESET: DevicePresetId = 'standard';

export function getDevicePreset(id: DevicePresetId): ViewportPreset {
  const found = DEVICE_VIEWPORT_PRESETS.find((p) => p.id === id);
  return found ?? DEVICE_VIEWPORT_PRESETS[1]; // fallback a standard
}

export function getPresetDimensions(
  preset: ViewportPreset,
  orientation: DeviceOrientation = 'portrait'
): { width: number; height: number } {
  if (preset.width === 0 || preset.height === 0) {
    return { width: 0, height: 0 };
  }
  if (orientation === 'landscape') {
    return {
      width: Math.max(preset.width, preset.height),
      height: Math.min(preset.width, preset.height),
    };
  }
  return {
    width: Math.min(preset.width, preset.height),
    height: Math.max(preset.width, preset.height),
  };
}

export function calculateViewportScale(
  containerWidth: number,
  containerHeight: number,
  targetWidth: number,
  targetHeight: number,
  paddingPx = 16
): number {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    targetWidth <= 0 ||
    targetHeight <= 0
  ) {
    return 1;
  }

  const availableW = Math.max(1, containerWidth - paddingPx * 2);
  const availableH = Math.max(1, containerHeight - paddingPx * 2);

  const scaleW = availableW / targetWidth;
  const scaleH = availableH / targetHeight;

  const rawScale = Math.min(1, scaleW, scaleH);
  if (!Number.isFinite(rawScale) || rawScale <= 0) return 1;

  // Redondear a 3 decimales para evitar jitter visual
  return Math.round(rawScale * 1000) / 1000;
}
