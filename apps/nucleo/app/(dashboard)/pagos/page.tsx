import { SumUpView } from '@/views/sumup/SumUpView';

export const metadata = {
  title: 'Pagos SumUp | Enjambre Legado',
};

export default function PagosPage() {
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <SumUpView />
    </div>
  );
}
