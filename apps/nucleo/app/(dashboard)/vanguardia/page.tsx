import { redirect } from 'next/navigation';

/** @deprecated Vanguardia absorbida en CRM → Aliados B2B + Huella Sensorial */
export default function VanguardiaRedirectPage() {
  redirect('/crm?tab=aliados');
}