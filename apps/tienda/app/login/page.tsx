import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { LoginForm } from '@/components/auth/login-form';
import { AuthAtmosphereEffect } from '@/components/auth/auth-atmosphere-effect';
import { loadStoreChrome } from '@/lib/shop/load-store-chrome';

export const metadata = {
  title: 'Iniciar sesión · Enjambre Legado',
};

export default async function LoginPage() {
  const chrome = await loadStoreChrome();
  const authSettings = chrome.auth;

  return (
    <main className="relative min-h-[var(--vh-full)] w-full bg-background text-foreground flex flex-col justify-between overflow-hidden px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {/* Dynamic Visual Atmosphere (CMS configurable: Bosque Nativo, Polen Dorado, Abeja Cosmos, Dark Luxury) */}
      <AuthAtmosphereEffect settings={authSettings} />

      {/* Top / Center Hero Branding — Display Logo + Tagline */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto pt-6 pb-4">
        <h1 className="font-display text-[clamp(2.75rem,12vw,4.5rem)] font-light tracking-tight text-foreground text-center leading-none">
          {authSettings.hero_title || 'Enjambre Legado'}
        </h1>
        <p className="mt-3 font-display italic text-lg sm:text-xl tracking-wide text-primary/90 text-center">
          {authSettings.hero_subtitle || 'La Obrera y el Zángano'}
        </p>
        <div className="mt-4 max-w-md text-center inline-flex items-center justify-center gap-2 rounded-full border border-border/50 bg-surface-raised/60 backdrop-blur-md px-4 py-1.5 text-[0.625rem] sm:text-[0.675rem] tracking-[0.18em] text-muted-foreground uppercase shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
          <span>{authSettings.tagline_phrase || 'Regeneración Biocultural · Lujo Purista & Consumo Consciente'}</span>
        </div>
      </div>

      {/* Bottom Action Sheet / Pill Options + Modals */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        <Suspense fallback={<ViewLoading variant="inline" label="Inicio de sesión" hideLabel className="py-4" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
