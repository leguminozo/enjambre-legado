import { ViewLoading, BrandWordmark } from '@enjambre/ui';

/** Evita el copy muerto «Preparando experiencias» del loading raíz. */
export default function ExperienciasLoading() {
  return (
    <ViewLoading
      variant="page"
      label="Abriendo experiencias"
      context="tienda"
      brand={<BrandWordmark name="La Obrera y el Zángano" ecosystem="Enjambre Legado" />}
    />
  );
}
