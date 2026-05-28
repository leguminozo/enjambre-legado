'use client';

import CreadorView from '@/views/CreadorView';
import { useSession } from '@/providers/Providers';

export default function CreadorPage() {
  const session = useSession();
  const userId = session?.user?.id ?? '';
  const role = session?.user?.app_metadata?.role ?? 'admin';
  return <CreadorView currentRole={role} userId={userId} />;
}
