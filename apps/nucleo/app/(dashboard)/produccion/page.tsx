import { ProduccionView } from '@/views/produccion/ProduccionView';

export const metadata = {
  title: 'Producción | Enjambre Legado',
};

export default function ProduccionPage() {
  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <ProduccionView />
    </div>
  );
}
