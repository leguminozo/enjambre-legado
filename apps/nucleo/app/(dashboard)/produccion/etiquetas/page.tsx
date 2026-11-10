import { redirect } from 'next/navigation';

/** Compatibilidad: los QRs de producto viven en /etiquetas/qr (Packaging & Etiquetas). */
export default function ProduccionEtiquetasRedirectPage() {
  redirect('/etiquetas/qr');
}
