/** next/image loaderFile: must stay a local default export (Next bundles this file alone). */
export default function cdnImageLoader({ src }: { src: string; width: number; quality?: number }): string {
  return src;
}
