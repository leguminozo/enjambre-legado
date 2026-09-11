'use client';

import type { AuthSettings } from '@/lib/shop/store-chrome';

interface AuthAtmosphereEffectProps {
  settings?: Partial<AuthSettings>;
}

export function AuthAtmosphereEffect({ settings }: AuthAtmosphereEffectProps) {
  const style = settings?.background_style ?? 'cosmic';
  const bgImage = settings?.background_image_url;
  const particles = settings?.particle_effect ?? 'cosmic_stars';
  const orbColor = settings?.blur_orb_color?.trim() || 'hsl(var(--accent))';

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
      {style === 'cosmic' && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/15 via-background to-background" />
      )}

      {style === 'bosque_nativo' && (
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-background to-background" />
      )}

      {style === 'abeja_cosmos' && (
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      )}

      {style === 'dark_luxury' && (
        <div className="absolute inset-0 bg-background" />
      )}

      {/* 3. Ambient blur orb */}
      <div
        className="enj-blur-orb absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[360px] rounded-full blur-3xl transition-colors duration-700 pointer-events-none"
        style={{
          backgroundColor: orbColor,
          opacity: 0.12,
        }}
      />

      {/* 4. Particle Atmosphere Layer */}
      {particles === 'cosmic_stars' && (
        <div className="absolute inset-0 motion-reduce:hidden opacity-40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15%" cy="20%" r="1" className="fill-accent animate-pulse" style={{ animationDuration: '3s' }} />
            <circle cx="35%" cy="12%" r="1.5" className="fill-accent-text animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
            <circle cx="65%" cy="18%" r="1" className="fill-accent animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
            <circle cx="85%" cy="25%" r="1.5" className="fill-foreground animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
            <circle cx="25%" cy="40%" r="1" className="fill-accent-text animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />
            <circle cx="75%" cy="38%" r="1" className="fill-accent animate-pulse" style={{ animationDuration: '3.8s', animationDelay: '0.8s' }} />
            <circle cx="50%" cy="15%" r="1.2" className="fill-accent animate-pulse" style={{ animationDuration: '4.2s', animationDelay: '1.2s' }} />
          </svg>
        </div>
      )}

      {particles === 'pollen_gold' && (
        <div className="absolute inset-0 motion-reduce:hidden opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20%" cy="25%" r="2" className="fill-accent animate-pulse" style={{ animationDuration: '4s' }} />
            <circle cx="45%" cy="35%" r="2.5" className="fill-accent-text animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <circle cx="70%" cy="22%" r="1.8" className="fill-accent animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
            <circle cx="80%" cy="45%" r="2.2" className="fill-accent-text animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
            <circle cx="30%" cy="50%" r="1.8" className="fill-accent animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }} />
          </svg>
        </div>
      )}

      {particles === 'mist_bosque' && (
        <div className="absolute inset-0 motion-reduce:hidden opacity-20 pointer-events-none">
          <div className="absolute -top-10 left-0 right-0 h-72 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl" />
        </div>
      )}
    </div>
  );
}
