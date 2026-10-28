export function cleanQrSvgString(rawSvg: string, targetSize = 1200): string {
  let cleaned = rawSvg;

  // 1. Eliminar path de fondo completo (típico de qrcode.react: M0,0 hNvNvH0z)
  cleaned = cleaned.replace(
    /<path[^>]*d="M0,0\s*h[\d.]+v[\d.]+H0z"[^>]*>(\s*<\/path>)?/gi,
    ''
  );

  // 2. Eliminar cualquier rect o path con fill blanco o transparente de fondo
  cleaned = cleaned.replace(
    /<(rect|path)[^>]*fill=["'](#[fF]{3,6}|white|transparent|none)["'][^>]*>(\s*<\/(rect|path)>)?/gi,
    (match) => {
      // Preservar paths que contienen datos reales de módulos (d largo con muchos comandos)
      if (match.includes('d=') && match.length > 120) {
        return match;
      }
      return '';
    }
  );

  // 3. Normalizar dimensiones canónicas a targetSize
  if (/<svg[^>]*width=/i.test(cleaned)) {
    cleaned = cleaned.replace(/width=["'][^"']*["']/i, `width="${targetSize}"`);
  } else {
    cleaned = cleaned.replace(/<svg/i, `<svg width="${targetSize}"`);
  }

  if (/<svg[^>]*height=/i.test(cleaned)) {
    cleaned = cleaned.replace(/height=["'][^"']*["']/i, `height="${targetSize}"`);
  } else {
    cleaned = cleaned.replace(/<svg/i, `<svg height="${targetSize}"`);
  }

  // 4. Asegurar namespace XML estándar para compatibilidad con Adobe Illustrator y Photoshop
  if (!cleaned.includes('xmlns=')) {
    cleaned = cleaned.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return cleaned;
}

export interface QrDownloadOptions {
  size?: number;
  suffix?: string;
}

export function downloadQrSvg(svgId: string, filename: string, options?: QrDownloadOptions): boolean {
  if (typeof document === 'undefined') return false;
  const svg = document.getElementById(svgId);
  if (!svg) return false;

  const size = options?.size ?? 1200;
  const rawSvg = new XMLSerializer().serializeToString(svg);
  const cleanSvg = cleanQrSvgString(rawSvg, size);

  const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function downloadQrPng(
  svgId: string,
  filename: string,
  options?: QrDownloadOptions
): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  const svg = document.getElementById(svgId);
  if (!svg) return Promise.resolve(false);

  const size = options?.size ?? 1200;
  const suffix = options?.suffix ?? '-alta-resolucion';
  const rawSvg = new XMLSerializer().serializeToString(svg);
  const cleanSvg = cleanQrSvgString(rawSvg, size);

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(false);
      return;
    }

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;

    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(blobUrl);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = filename.endsWith('.png') ? filename : `${filename}${suffix}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve(true);
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(false);
    };

    img.src = blobUrl;
  });
}
