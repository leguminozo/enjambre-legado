/** next/image loaderFile: must stay a local default export (Next bundles this file alone). */
export default function cdnImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  // Append width to silence Next.js missing-loader-width warnings. 
  // Supabase CDN will ignore it if transforms aren't enabled, or use it if they are.
  const hasQuery = src.includes('?');
  const sep = hasQuery ? '&' : '?';
  let newSrc = `${src}${sep}w=${width}`;
  if (quality) newSrc += `&q=${quality}`;
  return newSrc;
}
