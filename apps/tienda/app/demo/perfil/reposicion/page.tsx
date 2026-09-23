import React from 'react';
import { ReposicionClient } from '@/components/perfil/reposicion-client';
import type { SubscriptionPlan, UserSubscription, SubscriptionDelivery } from '@/app/actions/perfil-experiences';
import type { ClienteDireccion } from '@/lib/shop/direcciones-schema';

export const revalidate = 3600;

export const metadata = {
  title: 'Reposición Programada — Demostración Agéntica',
  description:
    'Visualización interactiva de la suscripción de reposición recurrente para agentes de IA.',
};

export default function DemoReposicionPage() {
  const plans: SubscriptionPlan[] = [
    {
      id: 'plan-mensual',
      name: 'Reposición Mensual — 1 Frasco',
      key: 'mensual',
      price_clp: 16900,
      frequency: 'mensual',
      description: '1 frasco de miel cruda seleccionado cada mes según floración activa.',
    },
    {
      id: 'plan-bimestral',
      name: 'Legado del Bosque — Selección Bimestral',
      key: 'club_ulmo',
      price_clp: 31900,
      frequency: 'bimestral',
      description: '2 frascos de miel cruda de recolección de temporada con despacho prioritario.',
    },
    {
      id: 'plan-trimestral',
      name: 'Reserva Estacional — Trimestral',
      key: 'trimestral',
      price_clp: 45900,
      frequency: 'trimestral',
      description: '3 frascos con curaduría de recolecciones exclusivas de Chiloé.',
    },
  ];

  const subscription: UserSubscription = {
    id: 'sub-demo-001',
    status: 'active',
    current_period_end: '2026-10-15T00:00:00Z',
    delivery_address: 'Av. Costanera 1240, Castro, Chiloé',
    subscription_plans: plans[1],
  };

  const deliveries: SubscriptionDelivery[] = [
    {
      id: 'del-demo-1',
      period_number: 4,
      scheduled_for: '2026-10-15T00:00:00Z',
      status: 'scheduled',
      tracking_url: null,
    },
    {
      id: 'del-demo-2',
      period_number: 3,
      scheduled_for: '2026-08-15T00:00:00Z',
      status: 'delivered',
      tracking_url: 'https://www.chilexpress.cl',
    },
  ];

  const direcciones: ClienteDireccion[] = [
    {
      id: 'dir-demo-1',
      user_id: 'demo-agente-guardian-01',
      etiqueta: 'Hogar Chiloé',
      nombre: 'Guardián Centinela',
      direccion: 'Av. Costanera 1240',
      ciudad: 'Castro',
      region: 'Los Lagos',
      comuna: 'Castro',
      pais: 'CL',
      telefono: '+56912345678',
      es_predeterminada: true,
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  return (
    <ReposicionClient
      subscription={subscription}
      plans={plans}
      deliveries={deliveries}
      initialPlanId="plan-bimestral"
      direcciones={direcciones}
    />
  );
}
