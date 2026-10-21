import { redirect } from 'next/navigation';

/** Compatibilidad: el Estudio Editorial vive solo en /estudio-rrss (entrada única desde el sidebar). */
export default function ComunidadEstudioPage() {
  redirect('/estudio-rrss');
}
