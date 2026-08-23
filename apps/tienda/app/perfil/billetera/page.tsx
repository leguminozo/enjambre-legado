import { GuardianStampsSection } from '@/components/shop/guardian-stamps-section';

export const metadata = {
  title: 'Billetera — Tarjeta Obrera',
  description: 'Rutas de sello por producto y puente al Wallet del teléfono.',
};

export default function BilleteraPage() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-accent-text mb-2">Tarjeta Obrera</p>
        <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground">Billetera</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
          Cada ruta cuenta compras reales de un producto (sachet, frasco, cofre). Al completar, hay
          cosecha: gratis en el carrito o en un punto. No son puntos: son sellos.
        </p>
      </div>
      <GuardianStampsSection />
    </div>
  );
}
