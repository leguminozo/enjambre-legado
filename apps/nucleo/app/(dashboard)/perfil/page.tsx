import { redirect } from 'next/navigation';

/** El perfil vive dentro de /configuracion (hub unificado) — ruta legacy con redirect. */
export default function PerfilPage() {
  redirect('/configuracion');
}
