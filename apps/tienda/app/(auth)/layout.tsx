import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { AuthAtmosphereEffect } from '@/components/auth/auth-atmosphere-effect';
import { AuthNavTabs } from '@/components/auth/auth-nav-tabs';
import { isCmsPreviewRequest } from '@/lib/cms';
import { loadStoreChrome } from '@/lib/shop/load-store-chrome';

/**
 * Shell centralizado de auth (patrón (auth) de Núcleo, adaptado a tienda):
 * una sola pantalla —atmósfera + branding + tabs login/registro— para todas
 * las rutas de sesión. Los pages son delgados; no hay doble carga de pantalla.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const chrome = await loadStoreChrome({ draft: await isCmsPreviewRequest() });
  const authSettings = chrome.auth;

  return (
    <main className="relative min-h-[var(--vh-full)] w-full bg-background text-foreground flex flex-col justify-between overflow-hidden px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <AuthAtmosphereEffect settings={authSettings} />

      {/* Hero branding centralizado */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto pt-8 pb-6 text-center">
        <h1 className="font-display text-[clamp(3rem,14vw,4.75rem)] font-light tracking-tight text-foreground leading-none">
          {authSettings.hero_title || 'Enjambre Legado'}
        </h1>
        <p className="mt-3.5 flex items-center justify-center gap-1.5 font-mono text-[0.6875rem] sm:text-xs tracking-[0.24em] text-muted-foreground uppercase">
          <span>{authSettings.hero_subtitle || 'La Obrera y el Zángano'}</span>
          <span className="inline-block w-1.5 h-3 bg-primary animate-pulse" />
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-md px-4 py-1.5 text-[0.65rem] tracking-[0.2em] text-foreground/90 uppercase shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
          <span>{authSettings.tagline_phrase || 'Miel del Bosque Nativo · Chiloé'}</span>
        </div>

        {/* Tabs centralizadas: login | registro (una sola familia de pantallas) */}
        <Suspense fallback={<div className="h-12" />}>
          <AuthNavTabs />
        </Suspense>
      </div>

      {/* Slot de rutas (login/register/recuperar/reset-password) */}
      <div className="relative z-10 w-full max-w-sm mx-auto">
        <Suspense
          fallback={<ViewLoading variant="inline" label="Acceso" hideLabel className="py-4" />}
        >
          {children}
        </Suspense>
      </div>
    </main>
  );
}