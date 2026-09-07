import { ViewLoading, BrandWordmark } from '@enjambre/ui';

export default function CataLoading() {
  return (
    <ViewLoading
      variant="page"
      label="Preparando ritual de cata sensorial…"
      context="tienda"
      brand={<BrandWordmark name="La Obrera y el Zángano" ecosystem="Enjambre Legado" />}
    />
  );
}
