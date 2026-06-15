import { CosteoView } from '@/views/costeo/CosteoView';

export const metadata = {
  title: 'Costeo | Enjambre Legado',
};

export default function CosteoPage() {
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <CosteoView />
    </div>
  );
}
