import { Metadata } from 'next';
import { LazyClubLegadoView } from '@/lib/navigation/lazy-views';

export const metadata: Metadata = {
  title: 'Club Legado',
};

export default function ClubLegadoPage() {
  return <LazyClubLegadoView />;
}
