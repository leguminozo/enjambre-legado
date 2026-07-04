/**
 * Capas de overlay compartidas en @enjambre/ui.
 *
 * Dialog (Radix) e ImmersiveModal deben usar estos tokens para:
 * - Coherencia visual (opacidad + blur)
 * - Stacking correcto sobre chrome de núcleo/tienda (z-50 quedaba bajo sidebars)
 *
 * Escala (documentada; no duplicar z-index ad hoc en modales):
 *   60–82  chrome tienda (header, sidebars, tienda-modal)
 *   78–79  notification bell móvil
 *   220    backdrop modal (Dialog + ImmersiveModal)
 *   221    panel modal
 *   9999   toasts (siempre encima de modales)
 */

/** Backdrop semitransparente con blur — paridad ImmersiveModal / tienda-modal */
export const overlayBackdropClassName = 'bg-background/72 backdrop-blur-md';

export const overlayBackdropMotionClassName =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none';

export const overlayPanelMotionClassName =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 motion-reduce:animate-none';