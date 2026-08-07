import { CheckoutResultClient } from './ui';
import { Suspense } from 'react';
import { ViewLoading, BrandWordmark } from '@enjambre/ui';

export const metadata = {
  title: 'Resultado del pago',
};

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-6 py-16">
          <ViewLoading
            variant="page"
            label="Resultado del pago"
            brand={<BrandWordmark tagline="Biocultural Regeneration" />}
          />
        </main>
      }
    >
      <CheckoutResultClient />
    </Suspense>
  );
}

