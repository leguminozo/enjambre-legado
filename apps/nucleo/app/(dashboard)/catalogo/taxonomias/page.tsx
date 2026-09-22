import { LazyTaxonomiasView } from '@/lib/navigation/lazy-views';

export const metadata = {
  title: 'Formatos y Categorías — Catálogo',
};

export default function TaxonomiasPage() {
  return <LazyTaxonomiasView />;
}
