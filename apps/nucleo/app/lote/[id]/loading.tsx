import { ViewLoading, BrandWordmark } from '@enjambre/ui';

export default function LoteLoading() {
  return (
    <ViewLoading
      variant="page"
      label="Verificando trazabilidad y ancla territorial…"
      context="nucleo"
      brand={<BrandWordmark name="Red Apícola de Chiloé" ecosystem="Enjambre Legado" />}
    />
  );
}
