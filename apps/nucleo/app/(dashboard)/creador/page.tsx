'use client'

import { CreadorView } from '@/views/CreadorView'
import { useAuthStore } from '@enjambre/auth'

export default function CreadorPage() {
  const userId = useAuthStore((s) => s.user?.id ?? '')
  return <CreadorView userId={userId} />
}
