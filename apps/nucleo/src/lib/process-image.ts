/**
 * Client-side image optimization for Storage uploads.
 * Products → resize + WEBP. Logos/brand → preserve alpha (PNG/SVG), avoid lossy bake.
 */

export type ProcessImageOptions = {
  /** Longest side max (px). Default 1600 (Retina-ready, lightweight WebP). */
  maxSize?: number;
  /** WEBP quality 0–1 when using lossy WEBP. Default 0.88 (near-lossless, prevents gradient banding). */
  quality?: number;
  /**
   * Logo / brand assets: keep transparency (PNG), never force lossy WEBP.
   * Prefer original file when already small enough.
   */
  preserveAlpha?: boolean;
  /** CMS field name — drives defaults (logo vs product). */
  fieldName?: string;
  /** Force 1:1 square canvas (512x512) with safe-zone margin. Ideal for Google Search Favicon & PWA icons. */
  forceSquare?: boolean;
  /** Optional background fill: 'transparent' (default) | 'dark' ('#071914') | 'white'. */
  background?: 'transparent' | 'dark' | 'white';
  /** Safe-zone padding ratio inside the square (default 0.10 = 10% breathing room to avoid circular crop cutoffs). */
  paddingRatio?: number;
};

const EXT_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
};

const RASTER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const PASSTHROUGH_TYPES = new Set(['image/svg+xml', 'application/pdf']);

/** Logo / brand fields that must keep transparency and sharp edges. */
const ALPHA_FIELDS = new Set([
  'logo_url',
  'logo_footer_url',
  'logo_src',
  'favicon_url',
  'icon',
]);

export function resolveFileMime(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? file.type ?? '';
}

export function isRasterImage(file: File): boolean {
  return RASTER_TYPES.has(resolveFileMime(file));
}

export function shouldProcessImage(file: File, options: ProcessImageOptions = {}): boolean {
  const mime = resolveFileMime(file);
  if (PASSTHROUGH_TYPES.has(mime)) return false;
  if (!RASTER_TYPES.has(mime)) return false;
  // GIF: avoid re-encode (animation / palette)
  if (mime === 'image/gif') return false;
  return true;
}

export function fieldPreservesAlpha(fieldName?: string): boolean {
  if (!fieldName) return false;
  if (ALPHA_FIELDS.has(fieldName)) return true;
  const lower = fieldName.toLowerCase();
  return lower.includes('logo') || lower.includes('favicon') || lower.includes('icon');
}

/** Fields that require a perfect 1:1 square canvas (Google Search Favicon & PWA). */
export function isSquareField(fieldName?: string): boolean {
  if (!fieldName) return false;
  return fieldName === 'favicon_url' || fieldName === 'icon';
}

/** Sensible max sizes per CMS / brand field. */
export function maxSizeForImageField(fieldName: string): number {
  switch (fieldName) {
    case 'favicon_url':
      return 512;
    case 'hero_image':
    case 'hero_bg':
    case 'hero_background':
      return 1920;
    case 'logo_url':
    case 'logo_footer_url':
    case 'logo_src':
      return 1600;
    case 'og_image_url':
      return 1200;
    default:
      return 1600;
  }
}

export function loadImageFromSource(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let objectUrl = '';
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }
    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen para procesar.'));
    };
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return loadImageFromSource(file);
}

function canvasToFile(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/webp' | 'image/jpeg',
  quality: number,
  baseName: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const ext = type === 'image/png' ? 'png' : type === 'image/jpeg' ? 'jpg' : 'webp';
    // quality ignored for PNG; for WEBP/JPEG 0–1
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`No se pudo codificar como ${ext.toUpperCase()}`));
          return;
        }
        const name = baseName.replace(/\.[^/.]+$/, '') + `.${ext}`;
        resolve(
          new File([blob], name, {
            type,
            lastModified: Date.now(),
          }),
        );
      },
      type,
      type === 'image/png' ? undefined : quality,
    );
  });
}

/**
 * Resize longest side; choose output format by options.
 * - preserveAlpha → PNG (alpha + crisp logo)
 * - else → WEBP lossy (product / gallery photos, quality 0.88, multi-step downsampling)
 */
export async function processImage(file: File, options: ProcessImageOptions = {}): Promise<File> {
  const maxSize = options.maxSize ?? 1600;
  const quality = options.quality ?? 0.88;
  const preserveAlpha = options.preserveAlpha ?? fieldPreservesAlpha(options.fieldName);
  const mime = resolveFileMime(file);

  const img = await loadImage(file);
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  if (!naturalWidth || !naturalHeight) {
    throw new Error('Dimensiones de imagen inválidas');
  }

  // Already small enough + alpha path + PNG → keep original (zero quality loss)
  const longest = Math.max(naturalWidth, naturalHeight);
  if (preserveAlpha && mime === 'image/png' && longest <= maxSize && file.size <= 2.5 * 1024 * 1024) {
    return file;
  }

  let targetWidth = naturalWidth;
  let targetHeight = naturalHeight;

  if (targetWidth > targetHeight) {
    if (targetWidth > maxSize) {
      targetHeight = Math.round(targetHeight * (maxSize / targetWidth));
      targetWidth = maxSize;
    }
  } else if (targetHeight > maxSize) {
    targetWidth = Math.round(targetWidth * (maxSize / targetHeight));
    targetHeight = maxSize;
  }

  // Multi-step downsampling:
  // Step down by half when downsizing from large resolutions (>2x target)
  // to avoid aliasing / moiré in Canvas bilinear resampling.
  let currentWidth = naturalWidth;
  let currentHeight = naturalHeight;
  let sourceCanvas: HTMLCanvasElement | HTMLImageElement = img;

  while (currentWidth * 0.5 > targetWidth && currentHeight * 0.5 > targetHeight) {
    const nextWidth = Math.round(currentWidth * 0.5);
    const nextHeight = Math.round(currentHeight * 0.5);
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextWidth;
    stepCanvas.height = nextHeight;
    const stepCtx = stepCanvas.getContext('2d', { alpha: true });
    if (!stepCtx) break;

    stepCtx.clearRect(0, 0, nextWidth, nextHeight);
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(sourceCanvas, 0, 0, nextWidth, nextHeight);

    currentWidth = nextWidth;
    currentHeight = nextHeight;
    sourceCanvas = stepCanvas;
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('No se pudo procesar la imagen (canvas)');

  // Critical for PNG transparency: clear to transparent, never fill white/black
  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  if (preserveAlpha) {
    // PNG keeps full alpha; WEBP lossy often flattens or murks edges in some browsers
    return canvasToFile(canvas, 'image/png', 1, file.name);
  }

  return canvasToFile(canvas, 'image/webp', quality, file.name);
}

export type SquareAdjustOptions = {
  /** Target square size in px. Default 512 (Google Search Favicon & Apple standard). */
  targetSize?: number;
  /** Safe-zone padding ratio (default 0.10 = 10% on each side). Prevents clipping on circular masks. */
  paddingRatio?: number;
  /** Background fill: 'transparent' | 'dark' ('#071914') | 'white' | 'auto'. Default 'auto'. */
  background?: 'transparent' | 'dark' | 'white' | 'auto';
  /** Desired file name output. */
  baseName?: string;
};

/**
 * Detects if the image has a uniform background color on its 4 corners.
 * Returns the CSS color string if uniform, or null if transparent.
 */
function detectBackgroundColor(ctx: CanvasRenderingContext2D, width: number, height: number): string | null {
  try {
    const corners = [
      ctx.getImageData(0, 0, 1, 1).data,
      ctx.getImageData(Math.max(0, width - 1), 0, 1, 1).data,
      ctx.getImageData(0, Math.max(0, height - 1), 1, 1).data,
      ctx.getImageData(Math.max(0, width - 1), Math.max(0, height - 1), 1, 1).data,
    ];
    if (corners.every((c) => c[3] < 12)) {
      return null;
    }
    const [c0] = corners;
    const allMatch = corners.every(
      (c) =>
        Math.abs(c[0] - c0[0]) <= 8 &&
        Math.abs(c[1] - c0[1]) <= 8 &&
        Math.abs(c[2] - c0[2]) <= 8 &&
        c[3] > 240,
    );
    if (allMatch) {
      return `rgb(${c0[0]}, ${c0[1]}, ${c0[2]})`;
    }
  } catch {
    // Canvas tainted or unavailable
  }
  return null;
}

/**
 * High-quality automatic square (1:1) adjuster.
 * Ensures any logo (wide, tall, non-standard, or unpadded) is:
 * 1. Autocropped of empty transparent borders to find real artwork bounds.
 * 2. Fitted proportionately into a square canvas (default 512x512) with safe-zone margin.
 * 3. Centered perfectly with high-quality bicubic downsampling.
 * 4. Exported as a pristine, uncompressed PNG File compatible with Google Search and browsers.
 */
export async function autoAdjustSquareImage(
  source: File | string,
  options: SquareAdjustOptions = {},
): Promise<File> {
  const targetSize = options.targetSize ?? 512;
  const paddingRatio = options.paddingRatio ?? 0.10;
  const requestedBg = options.background ?? 'auto';
  const baseName =
    options.baseName ??
    (typeof source === 'string'
      ? 'favicon-512x512.png'
      : source.name.replace(/\.[^/.]+$/, '') + '-square.png');

  const img = await loadImageFromSource(source);
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  if (!naturalWidth || !naturalHeight) {
    throw new Error('Dimensiones inválidas en la imagen fuente');
  }

  // Draw into offscreen canvas to analyze content bounds and detect background
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = naturalWidth;
  tempCanvas.height = naturalHeight;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true, alpha: true });
  if (!tempCtx) throw new Error('No se pudo inicializar canvas 2D');

  tempCtx.drawImage(img, 0, 0);

  let cropX = 0;
  let cropY = 0;
  let cropW = naturalWidth;
  let cropH = naturalHeight;
  let autoBgColor: string | null = null;

  try {
    autoBgColor = detectBackgroundColor(tempCtx, naturalWidth, naturalHeight);

    // If image has transparent areas, trim empty transparent margins for true centering
    const imgData = tempCtx.getImageData(0, 0, naturalWidth, naturalHeight);
    const data = imgData.data;
    let minX = naturalWidth;
    let minY = naturalHeight;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < naturalHeight; y++) {
      for (let x = 0; x < naturalWidth; x++) {
        const alpha = data[(y * naturalWidth + x) * 4 + 3];
        if (alpha > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX >= minX && maxY >= minY) {
      cropX = minX;
      cropY = minY;
      cropW = maxX - minX + 1;
      cropH = maxY - minY + 1;
    }
  } catch {
    cropX = 0;
    cropY = 0;
    cropW = naturalWidth;
    cropH = naturalHeight;
  }

  // Calculate destination bounds maintaining aspect ratio within safe zone
  const innerSize = Math.round(targetSize * (1 - 2 * paddingRatio));
  const scale = Math.min(innerSize / cropW, innerSize / cropH);
  const destW = Math.max(1, Math.round(cropW * scale));
  const destH = Math.max(1, Math.round(cropH * scale));
  const destX = Math.round((targetSize - destW) / 2);
  const destY = Math.round((targetSize - destH) / 2);

  // Multi-step downsampling if downscaling heavily (>2x) to preserve crisp lines
  let sourceElement: HTMLCanvasElement = tempCanvas;
  let sCropX = cropX;
  let sCropY = cropY;
  let sCropW = cropW;
  let sCropH = cropH;

  while (sCropW * 0.5 > destW && sCropH * 0.5 > destH) {
    const nextW = Math.round(sCropW * 0.5);
    const nextH = Math.round(sCropH * 0.5);
    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const stepCtx = stepCanvas.getContext('2d', { alpha: true });
    if (!stepCtx) break;

    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(sourceElement, sCropX, sCropY, sCropW, sCropH, 0, 0, nextW, nextH);

    sourceElement = stepCanvas;
    sCropX = 0;
    sCropY = 0;
    sCropW = nextW;
    sCropH = nextH;
  }

  // Final square canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('No se pudo inicializar canvas final');

  // Fill background
  if (requestedBg === 'dark') {
    ctx.fillStyle = '#071914';
    ctx.fillRect(0, 0, targetSize, targetSize);
  } else if (requestedBg === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetSize, targetSize);
  } else if (requestedBg === 'auto' && autoBgColor) {
    ctx.fillStyle = autoBgColor;
    ctx.fillRect(0, 0, targetSize, targetSize);
  } else {
    ctx.clearRect(0, 0, targetSize, targetSize);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceElement, sCropX, sCropY, sCropW, sCropH, destX, destY, destW, destH);

  return canvasToFile(canvas, 'image/png', 1, baseName);
}

/**
 * Optimize if raster; SVG/PDF/GIF pass through.
 * Logos: preserveAlpha + prefer original PNG when possible.
 * Favicon & square icons: automatically adjusted to 1:1 square canvas.
 */
export async function prepareImageForUpload(
  file: File,
  options: ProcessImageOptions = {},
): Promise<File> {
  const fieldName = options.fieldName;
  const preserveAlpha = options.preserveAlpha ?? fieldPreservesAlpha(fieldName);
  const maxSize =
    options.maxSize ?? (fieldName ? maxSizeForImageField(fieldName) : 1600);

  const mime = resolveFileMime(file);
  if (!mime) {
    throw new Error('Tipo de archivo no reconocido. Usa PNG, SVG, WEBP o JPEG.');
  }

  // Favicon & square fields: always route through autoAdjustSquareImage
  if (isSquareField(fieldName) || options.forceSquare) {
    // If it's a raster image or SVG we want in square PNG form:
    if (RASTER_TYPES.has(mime) || mime === 'image/svg+xml') {
      try {
        return await autoAdjustSquareImage(file, {
          targetSize: maxSize || 512,
          paddingRatio: options.paddingRatio ?? 0.10,
          background: options.background ?? 'auto',
          baseName: file.name,
        });
      } catch (err) {
        console.warn('[process-image] autoAdjustSquareImage error, falling back', err);
      }
    }
  }

  // SVG / PDF / GIF: never canvas-process
  if (!shouldProcessImage(file, options)) {
    // Ensure File has a proper type for Storage contentType
    if (!file.type && mime) {
      return new File([file], file.name, { type: mime, lastModified: file.lastModified });
    }
    return file;
  }

  try {
    return await processImage(file, {
      maxSize,
      quality: options.quality ?? (preserveAlpha ? 1 : 0.88),
      preserveAlpha,
      fieldName,
    });
  } catch (err) {
    // Fallback: upload original if process fails (better than blocking logo)
    if (preserveAlpha) {
      console.warn('[process-image] fallback to original', err);
      if (!file.type && mime) {
        return new File([file], file.name, { type: mime, lastModified: file.lastModified });
      }
      return file;
    }
    throw err;
  }
}
