import { redirect } from 'next/navigation';

/** Compatibilidad: el panel ejecutivo ahora vive en /inicio. */
export default function EjecutivoPage() {
  redirect('/inicio');
}
