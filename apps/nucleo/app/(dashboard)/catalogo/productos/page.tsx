import { redirect } from 'next/navigation';

/** Compatibilidad: la gestión de productos vive en /catalogo (vista única). */
export default function ProductosPage() {
  redirect('/catalogo');
}
