import { ConciliacionAutoView } from '@/views/banco-chile/ConciliacionAutoView';

export const metadata = {
  title: 'Conciliación Bancaria | Enjambre Legado',
};

export default function ConciliacionPage() {
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <ConciliacionAutoView />
    </div>
  );
}
