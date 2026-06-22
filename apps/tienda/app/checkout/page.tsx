import dynamic from 'next/dynamic';

const CheckoutClient = dynamic(
  () => import('./ui').then((m) => m.CheckoutClient),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
        Cargando checkout…
      </div>
    ),
  },
);

export const metadata = {
  title: 'Checkout',
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}