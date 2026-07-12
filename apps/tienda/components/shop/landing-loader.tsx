'use client';

import { ViewLoading } from '@enjambre/ui';
import { useEffect, useState } from 'react';

/** Splash inicial landing — hexágono canónico, fade-out editorial. */
export function LandingLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 100);
    const unmountTimer = setTimeout(() => setIsRendered(false), 900);
    return () => {
      clearTimeout(timer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <ViewLoading variant="fullscreen" label="La Obrera y el Zángano" context="tienda" />
    </div>
  );
}