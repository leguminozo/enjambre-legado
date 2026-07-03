import { Suspense } from 'react';
import Link from 'next/link';
import { ViewLoading } from '@enjambre/ui';
import { LoginForm } from './login-form';

export const metadata = {
  title: 'Entrar · Campo',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-raised p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground mb-1">Campo — vendedor</h1>
        <p className="text-sm text-muted-foreground mb-6">Inicia sesión con tu cuenta de vendedor.</p>
        <Suspense fallback={<ViewLoading variant="inline" label="Inicio de sesión" hideLabel className="py-4" />}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline text-primary">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
