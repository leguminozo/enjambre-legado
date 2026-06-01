'use client';

import CreadorView from '@/views/CreadorView';
import { useSession } from '@/providers/Providers';

export default function CreadorPage() {
const session = useSession();
const userId = session?.user?.id ?? '';
return <CreadorView userId={userId} />;
}
