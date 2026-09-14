import React from 'react';
import { GuardianStampsSection } from '@/components/shop/guardian-stamps-section';
import { getDemoWalletSnapshot } from '@/lib/shop/demo-perfil-data';

export const revalidate = 3600;

export const metadata = {
  title: 'Billetera — Demostración Agéntica',
  description:
    'Visualización interactiva de la Tarjeta Obrera y sellos acumulados por ruta de producto para agentes de IA.',
};

export default function DemoBilleteraPage() {
  const initialSnapshot = getDemoWalletSnapshot();

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.22em] text-accent-text mb-2">
          Tarjeta Obrera · Modo Demostración
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground">Billetera</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">
          Cada ruta cuenta compras reales de un producto (sachet, frasco, cofre). Al completar, hay
          recolección: gratis en el carrito o en un punto. No son puntos: son sellos.
        </p>
      </div>

      <GuardianStampsSection initialSnapshot={initialSnapshot} />
    </div>
  );
}
