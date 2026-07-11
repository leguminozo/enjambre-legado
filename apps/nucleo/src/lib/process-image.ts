/**
 * Client-side image optimization for Storage uploads.
 * Products → resize + WEBP. Logos/brand → preserve alpha (PNG/SVG), avoid lossy bake.
 */

export type ProcessImageOptions = {
  /** Longest side max (px). Default 1200. */
  maxSize?: number;
  /** WEBP quality 0–1 when using lossy WEBP. Default 0.8. */
  quality?: number;
  /**
   * Logo / brand assets: keep transparency (PNG), never force lossy WEBP.
   * Prefer original file when already small enough.
   */
  preserveAlpha?: boolean;
  /** CMS field name — drives defaults (logo vs product). */
  fieldName?: string;
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
  'image', // CMS icons often transparent
  'icon',
  'src',
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

/** Sensible max sizes per CMS / brand field. */
export function maxSizeForImageField(fieldName: string): number {
  switch (fieldName) {
    case 'favicon_url':
      return 512;
    case 'logo_url':
    case 'logo_footer_url':
    case 'logo_src':
      return 1600;
    case 'og_image_url':
      return 1200;
    default:
      return 1200;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen (¿formato dañado o no soportado?)'));
    };
    img.src = objectUrl;
  });
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
 * - else → WEBP lossy (product photos)
 */
export async function processImage(file: File, options: ProcessImageOptions = {}): Promise<File> {
  const maxSize = options.maxSize ?? 1200;
  const quality = options.quality ?? 0.8;
  const preserveAlpha = options.preserveAlpha ?? fieldPreservesAlpha(options.fieldName);
  const mime = resolveFileMime(file);

  const img = await loadImage(file);
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (!width || !height) {
    throw new Error('Dimensiones de imagen inválidas');
  }

  // Already small enough + alpha path + PNG → keep original (zero quality loss)
  const longest = Math.max(width, height);
  if (preserveAlpha && mime === 'image/png' && longest <= maxSize && file.size <= 2.5 * 1024 * 1024) {
    return file;
  }

  if (width > height) {
    if (width > maxSize) {
      height = Math.round(height * (maxSize / width));
      width = maxSize;
    }
  } else if (height > maxSize) {
    width = Math.round(width * (maxSize / height));
    height = maxSize;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('No se pudo procesar la imagen (canvas)');

  // Critical for PNG transparency: clear to transparent, never fill white/black
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  if (preserveAlpha) {
    // PNG keeps full alpha; WEBP lossy often flattens or murks edges in some browsers
    return canvasToFile(canvas, 'image/png', 1, file.name);
  }

  return canvasToFile(canvas, 'image/webp', quality, file.name);
}

/**
 * Optimize if raster; SVG/PDF/GIF pass through.
 * Logos: preserveAlpha + prefer original PNG when possible.
 */
export async function prepareImageForUpload(
  file: File,
  options: ProcessImageOptions = {},
): Promise<File> {
  const fieldName = options.fieldName;
  const preserveAlpha = options.preserveAlpha ?? fieldPreservesAlpha(fieldName);
  const maxSize =
    options.maxSize ?? (fieldName ? maxSizeForImageField(fieldName) : 1200);

  const mime = resolveFileMime(file);
  if (!mime) {
    throw new Error('Tipo de archivo no reconocido. Usá PNG, SVG, WEBP o JPEG.');
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
      quality: options.quality ?? (preserveAlpha ? 1 : 0.8),
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
