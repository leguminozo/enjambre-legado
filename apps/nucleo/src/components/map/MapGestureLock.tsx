'use client';

import { useState } from 'react';

/**
 * En móvil un dedo no debe mover el mapa (secuestra el scroll de la página).
 * El overlay pide un tap explícito; después Leaflet recibe dragging.
 */
export function useMapGestureLock() {
  const [unlocked, setUnlocked] = useState(false);
  return {
    dragging: unlocked,
    unlocked,
    unlock: () => setUnlocked(true),
  };
}

export function MapGestureOverlay({
  unlocked,
  onUnlock,
}: {
  unlocked: boolean;
  onUnlock: () => void;
}) {
  if (unlocked) return null;
  return (
    <button
      type="button"
      className="absolute inset-0 z-[500] flex items-end justify-center bg-background/15 pb-6 text-center"
      onClick={onUnlock}
      aria-label="Toca para mover el mapa"
    >
      <span className="rounded-full border border-border bg-card/95 px-3 py-1.5 text-[11px] font-medium text-foreground shadow-sm">
        Toca para mover el mapa
      </span>
    </button>
  );
}
