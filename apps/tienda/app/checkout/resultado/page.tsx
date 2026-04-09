import { CheckoutResultClient } from './ui';
import { Suspense } from 'react';

export const metadata = {
  title: 'Resultado del pago',
};

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cream-50 px-6 py-16 text-center text-bosque-800/70">
          Cargando resultado…
        </main>
      }
    >
      <CheckoutResultClient />
    </Suspense>
  );
}

