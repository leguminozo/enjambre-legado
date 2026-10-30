import { redirect } from 'next/navigation';

export default function CanjeImpactoPage() {
  redirect('/perfil/billetera?modal=canje');
}