'use client';

import HistorialPage from '@/app/pos/historial/page';

/**
 * Vista de comisiones del revendedor en Campo.
 * Campo es exclusivo de terreno: tanto revendedores como administradores
 * ven su desglose personal de comisiones, bonos y datos bancarios.
 */
export default function ComisionesPage() {
  return <HistorialPage defaultTab="commissions" />;
}
