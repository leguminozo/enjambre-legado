import DashboardLayoutClient from './dashboard-layout-client';

/** Panel autenticado — siempre dinámico en producción (Vercel env, sin prerender estático). */
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}