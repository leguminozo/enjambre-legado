'use client';

import type { AuthSettings } from '@/lib/shop/store-chrome';

interface AuthAtmosphereEffectProps {
  settings?: Partial<AuthSettings>;
}

export function AuthAtmosphereEffect({ settings }: AuthAtmosphereEffectProps) {
  const style = settings?.background_style ?? 'cosmic';
  const bgImage = settings?.background_image_url;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 1. Custom Background Image if provided in CMS */}
      {bgImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 transition-all duration-700"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : null}

      {/* 2. Theme Atmospheric Base Gradients */}
      {style === 'bosque_nativo' && (
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-background to-background" />
      )}

      {style === 'abeja_cosmos' && (
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      )}

      {style === 'dark_luxury' && (
        <div className="absolute inset-0 bg-background" />
      )}
    </div>
  );
}
