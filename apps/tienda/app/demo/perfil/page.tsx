import React from 'react';
import { MiLegadoClient } from '@/components/shop/mi-legado-client';
import { getDemoDashboardData } from '@/lib/shop/demo-perfil-data';

export const revalidate = 3600;

export const metadata = {
  title: 'Mi Legado — Demostración de Experiencia de Cliente',
  description:
    'Visualización integral de métricas bioculturales, colmena centinela y actividad para agentes de IA y visitantes.',
};

export default function DemoPerfilPage() {
  const dashboard = getDemoDashboardData();
  return <MiLegadoClient {...dashboard} />;
}
