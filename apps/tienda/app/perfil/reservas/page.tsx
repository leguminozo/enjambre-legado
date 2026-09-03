import { getReservasDashboard } from '@/app/actions/perfil-experiences';
import { ReservasClient } from '@/components/perfil/reservas-client';

export default async function ReservasPage() {
  const data = await getReservasDashboard();
  return (
    <div data-cms-section="reserva_anual">
      <ReservasClient
        preOrders={data.preOrders}
        featuredProduct={data.featuredProduct}
        cmsSettings={data.cmsSettings}
      />
    </div>
  );
}