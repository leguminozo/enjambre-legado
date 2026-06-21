import { redirect } from 'next/navigation';

/** Portal creador vive en tienda — ver docs/RED_INTERCAMBIO_LEGAL.md */
export default function CreadorRedirectPage() {
  const tiendaUrl = process.env.NEXT_PUBLIC_URL_TIENDA?.replace(/\/$/, '');
  if (tiendaUrl) {
    redirect(`${tiendaUrl}/perfil/creador`);
  }
  redirect('/creadores');
}