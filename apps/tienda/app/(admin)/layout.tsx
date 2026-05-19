import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { AdminShellClient } from '@/components/admin/admin-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile.role !== 'tienda_admin' && profile.role !== 'gerente')) {
    redirect('/');
  }

  return (
    <AdminShellClient name={profile.name ?? 'Admin'} role={profile.role}>
      {children}
    </AdminShellClient>
  );
}
