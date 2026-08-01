import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Entrar · Campo · Enjambre Legado',
};

export default function LoginPage() {
  return (
    <main className="relative min-h-[100dvh] w-full bg-background text-foreground flex flex-col justify-between overflow-hidden px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none">
      {/* Starry / Cosmic Atmosphere Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/assets/auth-bg.png)', filter: 'brightness(0.5) contrast(1.1)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
      </div>

      {/* Top / Center Hero Branding — Grok-style Display Logo + Tagline */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto pt-6 pb-4">
        <h1 className="font-display text-[clamp(3.5rem,15vw,5rem)] font-light tracking-tight text-foreground text-center leading-none">
          Enjambre
        </h1>
        <p className="mt-3 flex items-center justify-center gap-1 font-mono text-[0.65rem] tracking-[0.24em] text-muted-foreground uppercase text-center">
          <span>Sistema Operativo Biocultural</span>
          <span className="inline-block w-1.5 h-3 bg-primary animate-pulse" />
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-surface-raised/50 backdrop-blur-md px-3 py-1 text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Campo · Chiloé</span>
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
