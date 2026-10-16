'use client';

import HistorialPage from '@/app/pos/historial/page';

/**
 * Vista de comisiones del agente comercial en Campo.
 * Campo es exclusivo de terreno: tanto agentes comerciales como administradores
 * ven su desglose personal de comisiones, bonos y datos bancarios.
 */
export default function ComisionesPage() {
  return <HistorialPage defaultTab="commissions" />;
}
