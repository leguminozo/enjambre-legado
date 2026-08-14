/**
 * Loader de next/image que no pasa por el Image Optimization API de Vercel.
 * Hobby 2026: 5.000 transformaciones / mes por cuenta — tres apps las comparten.
 * El origen (Supabase Storage) ya entrega WebP/AVIF con Cache-Control 1 año.
 */
export interface CdnImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export function cdnImageLoader({ src }: CdnImageLoaderProps): string {
  return src;
}

export default cdnImageLoader;
