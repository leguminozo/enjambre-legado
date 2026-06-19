import { getReservasDashboard } from '@/app/actions/perfil-experiences';
import { ReservasClient } from '@/components/perfil/reservas-client';

export default async function ReservasPage() {
  const data = await getReservasDashboard();
  return (
    <ReservasClient preOrders={data.preOrders} featuredProduct={data.featuredProduct} />
  );
}