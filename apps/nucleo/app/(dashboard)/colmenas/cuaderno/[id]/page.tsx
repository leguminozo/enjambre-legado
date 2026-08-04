'use client';

import { useParams } from 'next/navigation';
import { LazyEscenaHojaView } from '@/lib/navigation/lazy-views';

export default function EscenaHojaPage() {
  const params = useParams();
  const id = params.id as string;
  return <LazyEscenaHojaView id={id} />;
}
