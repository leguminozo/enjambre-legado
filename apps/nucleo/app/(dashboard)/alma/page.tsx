import { redirect } from 'next/navigation';

/** Compatibilidad: /alma se unificó en /inicio (HomeView por rol). No revivir Alma. */
export default function AlmaPage() {
  redirect('/inicio');
}
