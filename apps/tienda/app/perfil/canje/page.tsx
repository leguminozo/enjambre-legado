import { getLoyaltyDashboard } from '@/app/actions/perfil-experiences';
import { CanjeImpactoClient } from '@/components/perfil/canje-impacto-client';
import { GuardianStampsSection } from '@/components/shop/guardian-stamps-section';

export default async function CanjeImpactoPage() {
  const data = await getLoyaltyDashboard();
  return (
    <div className="space-y-16">
      <CanjeImpactoClient
        balance={data.balance}
        tier={data.tier}
        tierDisplay={data.tierDisplay}
        rewards={data.rewards}
      />
      <GuardianStampsSection />
    </div>
  );
}