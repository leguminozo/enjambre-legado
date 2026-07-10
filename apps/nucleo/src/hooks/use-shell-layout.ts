'use client';

import { useEffect, useState } from 'react';

export const BREAKPOINT_MOBILE = 768;
export const BREAKPOINT_DESKTOP = 1024;

export type ShellLayoutMode = 'mobile' | 'tablet' | 'desktop';

function resolveMode(width: number): ShellLayoutMode {
  if (width < BREAKPOINT_MOBILE) return 'mobile';
  if (width < BREAKPOINT_DESKTOP) return 'tablet';
  return 'desktop';
}

export function useShellLayout(): ShellLayoutMode {
  // Prefer mobile on first paint to avoid missing bottom-nav on phones (SSR → client).
  // Desktop/tablet correct themselves on the first client effect frame.
  const [mode, setMode] = useState<ShellLayoutMode>(() => {
    if (typeof window === 'undefined') return 'mobile';
    return resolveMode(window.innerWidth);
  });

  useEffect(() => {
    const update = () => setMode(resolveMode(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return mode;
}