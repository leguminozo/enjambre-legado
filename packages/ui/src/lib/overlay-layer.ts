/**
 * Capas de overlay compartidas en @enjambre/ui.
 *
 * Dialog (Radix) e ImmersiveModal deben usar estos tokens para:
 * - Coherencia visual (opacidad + blur)
 * - Stacking correcto sobre chrome de núcleo/tienda (z-50 quedaba bajo sidebars)
 *
 * Escala (documentada; no duplicar z-index ad hoc en modales):
 *   60–82   chrome tienda (header, sidebars, tienda-modal)
 *   78–79   notification bell móvil (backdrop más ligero a propósito)
 *   200     ViewLoading / LoadingOverlay
 *   220     backdrop modal (Dialog + ImmersiveModal + sheets de login)
 *   221     panel modal / bottom sheet sobre backdrop 220
 *   1100+   mobile-nav-sheet núcleo (sobre bottom nav)
 *   1490+   drawer bitácora MapaLegado (sobre Leaflet controls)
 *   9999    toasts (siempre encima de modales)
 *
 * Excepciones intencionales (no migrar a ImmersiveModal):
 * - Drawers / sheets laterales o bottom (MapaLegado bitácora, EventEditor, login sheets)
 * - GrainOverlay (textura, pointer-events-none)
 * - NotificationBell móvil (z bajo, chrome tienda)
 * - TiendaModal / mobile-nav (stack propio 60–82 / CSS local denso)
 */

/**
 * Backdrop denso: centra la atención en el modal.
 * ~88% + blur fuerte para oscurecer sidebar/chrome en dark mode.
 */
export const overlayBackdropClassName =
  'bg-background/88 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80';

export const overlayBackdropMotionClassName =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none';

export const overlayPanelMotionClassName =
  'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 motion-reduce:animate-none';
