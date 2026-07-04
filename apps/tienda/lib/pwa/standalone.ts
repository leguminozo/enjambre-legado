const STANDALONE_MEDIA =
  '(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)';

/** True cuando la tienda corre anclada (PWA / Add to Home Screen), no en pestaña del navegador. */
export function detectPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia(STANDALONE_MEDIA).matches) return true;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function subscribePwaStandalone(onChange: (standalone: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mq = window.matchMedia(STANDALONE_MEDIA);
  const handler = () => onChange(detectPwaStandalone());

  handler();
  mq.addEventListener('change', handler);
  window.addEventListener('resize', handler);

  return () => {
    mq.removeEventListener('change', handler);
    window.removeEventListener('resize', handler);
  };
}