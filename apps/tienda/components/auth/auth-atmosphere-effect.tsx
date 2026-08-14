'use client';

import type { AuthSettings } from '@/lib/shop/store-chrome';

interface AuthAtmosphereEffectProps {
  settings?: Partial<AuthSettings>;
}

export function AuthAtmosphereEffect({ settings }: AuthAtmosphereEffectProps) {
  const style = settings?.background_style ?? 'cosmic';
  const particle = settings?.particle_effect ?? 'pollen_gold';
  const bgImage = settings?.background_image_url;
  const orbColor = settings?.blur_orb_color || '#D4A017';

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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A3D2F]/40 via-background to-background" />
      )}

      {style === 'abeja_cosmos' && (
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      )}

      {style === 'dark_luxury' && (
        <div className="absolute inset-0 bg-[#050505]" />
      )}

      {/* 3. Glowing Ambient Orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 enj-blur-orb w-[140vw] h-[60vh] rounded-full blur-3xl opacity-50 transition-all duration-500"
        style={{
          background: `radial-gradient(circle, ${orbColor}25 0%, ${orbColor}05 60%, transparent 100%)`,
        }}
      />

      {/* 4. Honeycomb Hexagonal Vector Pattern (Abejas / Biocultura) */}
      {(style === 'abeja_cosmos' || style === 'bosque_nativo') && (
        <div
          className="absolute inset-0 opacity-[0.04] text-primary"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='100' viewBox='0 0 56 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66ZM28 100L0 84L0 50L28 34L56 50L56 84L28 100Z' fill='none' stroke='%23D4A017' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '112px 200px',
          }}
        />
      )}

      {/* 5. Cosmic Stars / Particle Grid */}
      {(particle === 'cosmic_stars' || style === 'cosmic') && (
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 80px 120px, rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0)),
                              radial-gradient(1.5px 1.5px at 150px 70px, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 220px 190px, rgba(255, 255, 255, 0.6), rgba(0, 0, 0, 0)),
                              radial-gradient(1.5px 1.5px at 310px 40px, rgba(255, 255, 255, 0.75), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 50px 280px, rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0)),
                              radial-gradient(2px 2px at 190px 320px, rgba(255, 255, 255, 0.65), rgba(0, 0, 0, 0))`,
            backgroundRepeat: 'repeat',
            backgroundSize: '350px 350px',
          }}
        />
      )}

      {/* 6. Golden Pollen Floating Particles (Polen Dorado del Bosque) */}
      {(particle === 'pollen_gold' || style === 'bosque_nativo') && (
        <div className="absolute inset-0 overflow-hidden opacity-60">
          <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-primary/60 blur-[1px] animate-pulse" />
          <div className="absolute top-2/3 left-3/4 w-2 h-2 rounded-full bg-primary/40 blur-[1px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-2/3 w-1 h-1 rounded-full bg-primary/70 blur-[0.5px] animate-pulse" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-3/4 left-1/5 w-1.5 h-1.5 rounded-full bg-primary/50 blur-[1px] animate-pulse" style={{ animationDelay: '1.8s' }} />
        </div>
      )}

      {/* 7. Vignette Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
    </div>
  );
}
