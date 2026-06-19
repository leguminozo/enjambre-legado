import { getLoyaltyDashboard } from '@/app/actions/perfil-experiences';
import { CanjeImpactoClient } from '@/components/perfil/canje-impacto-client';

export default async function CanjeImpactoPage() {
  const data = await getLoyaltyDashboard();
  return <CanjeImpactoClient balance={data.balance} tier={data.tier} rewards={data.rewards} />;
}