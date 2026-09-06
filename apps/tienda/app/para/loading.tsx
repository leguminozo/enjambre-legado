import { ViewLoading, BrandWordmark } from '@enjambre/ui';

/** Loading específico de landings B2B — evita el default «Cargando la tienda». */
export default function ParaLoading() {
  return (
    <ViewLoading
      variant="page"
      label="Abriendo la propuesta"
      context="tienda"
      brand={<BrandWordmark name="La Obrera y el Zángano" ecosystem="Enjambre Legado" />}
    />
  );
}
