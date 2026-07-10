/**
 * Client-side image optimization for Storage uploads.
 * Same pipeline as product photos: resize + WEBP for smaller, faster CDN delivery.
 */

export type ProcessImageOptions = {
  /** Longest side max (px). Default 1200 (product quality). */
  maxSize?: number;
  /** WEBP quality 0–1. Default 0.8. */
  quality?: number;
};

const RASTER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

/** Types that should pass through without canvas re-encode (vector / animated risk). */
const PASSTHROUGH_TYPES = new Set(['image/svg+xml', 'application/pdf']);

export function isRasterImage(file: File): boolean {
  return RASTER_TYPES.has(file.type);
}

export function shouldProcessImage(file: File): boolean {
  return isRasterImage(file) && !PASSTHROUGH_TYPES.has(file.type);
}

/**
 * Resize to maxSize on the longest side and convert to WEBP.
 * Preserves aspect ratio. Fails closed: reject on decode/encode errors.
 */
export function processImage(file: File, options: ProcessImageOptions = {}): Promise<File> {
  const maxSize = options.maxSize ?? 1200;
  const quality = options.quality ?? 0.8;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        }
      } else if (height > maxSize) {
        width = Math.round(width * (maxSize / height));
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen (canvas)'));
        return;
      }

      // Transparent logos (PNG) stay transparent in WEBP
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo convertir la imagen a WEBP'));
            return;
          }
          const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
          resolve(
            new File([blob], newFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            }),
          );
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen'));
    };

    img.src = objectUrl;
  });
}

/** Sensible max sizes per CMS / brand field. */
export function maxSizeForImageField(fieldName: string): number {
  switch (fieldName) {
    case 'favicon_url':
      return 256;
    case 'logo_url':
    case 'logo_footer_url':
    case 'logo_src':
      return 800;
    case 'og_image_url':
      return 1200;
    default:
      return 1200;
  }
}

/**
 * Optimize if raster; otherwise return original (SVG, PDF, etc.).
 */
export async function prepareImageForUpload(
  file: File,
  options: ProcessImageOptions & { fieldName?: string } = {},
): Promise<File> {
  if (!shouldProcessImage(file)) return file;
  const maxSize = options.maxSize ?? (options.fieldName ? maxSizeForImageField(options.fieldName) : 1200);
  return processImage(file, { maxSize, quality: options.quality ?? 0.8 });
}
