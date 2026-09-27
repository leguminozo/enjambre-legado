import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { AuthAtmosphereEffect } from '@/components/auth/auth-atmosphere-effect';
import { AuthBackButton } from '@/components/auth/auth-back-button';
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
    <main
      data-cms-section="auth_settings"
      className="relative min-h-[var(--vh-full)] w-full bg-background text-foreground flex flex-col items-center justify-center overflow-x-hidden px-4 sm:px-6 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <AuthAtmosphereEffect settings={authSettings} />

      <div className="relative z-10 w-full max-w-md mx-auto flex justify-start">
        <Suspense fallback={<div className="h-8" />}>
          <AuthBackButton auth={authSettings} />
        </Suspense>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto my-auto flex flex-col items-center py-4 sm:py-6">
        {/* Hero branding centralizado */}
        <div className="flex flex-col items-center justify-center text-center mb-6 sm:mb-8">
          <h1 className="font-display text-[clamp(2.5rem,10vw,4rem)] font-light tracking-tight text-foreground leading-none">
            {authSettings.hero_title || 'Enjambre Legado'}
          </h1>
          <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[0.6875rem] sm:text-xs tracking-[0.24em] text-muted-foreground uppercase">
            <span>{authSettings.hero_subtitle || 'La Obrera y el Zángano'}</span>
          </p>
          {authSettings.show_tagline_badge !== false && (
            <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-raised/80 backdrop-blur-md px-3.5 py-1 text-[0.65rem] tracking-[0.2em] text-foreground/90 uppercase shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>{authSettings.tagline_phrase || 'Miel del Bosque Nativo · Chiloé'}</span>
            </div>
          )}

          {/* Tabs centralizadas: login | registro (una sola familia de pantallas) */}
          <Suspense fallback={<div className="h-11 mt-6" />}>
            <AuthNavTabs />
          </Suspense>
        </div>

        {/* Slot de rutas (login/register/recuperar/reset-password) */}
        <div className="w-full">
          <Suspense
            fallback={<ViewLoading variant="inline" label="Acceso" hideLabel className="py-4" />}
          >
            {children}
          </Suspense>
        </div>
      </div>
    </main>
  );
}