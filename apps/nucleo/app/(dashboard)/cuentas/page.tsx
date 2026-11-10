import { redirect } from 'next/navigation';

/** Compatibilidad: la gestión de cuentas y accesos vive en /invitaciones. */
export default function CuentasRedirectPage() {
  redirect('/invitaciones');
}
