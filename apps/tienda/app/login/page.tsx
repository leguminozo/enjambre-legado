import { Suspense } from 'react';
import { ViewLoading } from '@enjambre/ui';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar sesión · Tienda · Enjambre Legado',
};

export default function LoginPage() {
  return (
    <main className="relative min-h-[var(--vh-full)] w-full bg-background text-foreground flex flex-col justify-between overflow-hidden px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none">
      {/* Starry / Cosmic Atmosphere Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[60vh] rounded-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl opacity-60" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 80px 120px, rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0)),
                              radial-gradient(1.5px 1.5px at 150px 70px, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 220px 190px, rgba(255, 255, 255, 0.6), rgba(0, 0, 0, 0)),
                              radial-gradient(1.5px 1.5px at 310px 40px, rgba(255, 255, 255, 0.75), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 50px 280px, rgba(255, 255, 255, 0.5), rgba(0, 0, 0, 0)),
                              radial-gradient(2px 2px at 190px 320px, rgba(255, 255, 255, 0.65), rgba(0, 0, 0, 0)),
                              radial-gradient(1px 1px at 290px 240px, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0))`,
            backgroundRepeat: 'repeat',
            backgroundSize: '350px 350px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </div>

      {/* Top / Center Hero Branding — Grok-style Display Logo + Tagline */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto pt-6 pb-4">
        <h1 className="font-display text-[clamp(3.5rem,15vw,5rem)] font-light tracking-tight text-foreground text-center leading-none">
          Enjambre
        </h1>
        <p className="mt-3 flex items-center justify-center gap-1 font-mono text-[0.65rem] tracking-[0.24em] text-muted-foreground uppercase text-center">
          <span>Identidad Legado</span>
          <span className="inline-block w-1.5 h-3 bg-primary animate-pulse" />
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-surface-raised/50 backdrop-blur-md px-3 py-1 text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Tienda · E-commerce</span>
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
