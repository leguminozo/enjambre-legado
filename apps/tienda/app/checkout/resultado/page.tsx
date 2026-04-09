import { CheckoutResultClient } from './ui';
import { Suspense } from 'react';

export const metadata = {
  title: 'Resultado pago · Enjambre Legado',
};

export default function CheckoutResultPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-stone-50 px-6 py-16">Cargando resultado...</main>}>
      <CheckoutResultClient />
    </Suspense>
  );
}

