'use client'

import { CalculosIAComponent } from '@/views/eirl/calculos-ia/CalculosIAComponent'
import { useAuthStore } from '@enjambre/auth'

export default function CalculosIaPage() {
  const empresaId = useAuthStore((s) => s.session?.user?.app_metadata?.empresa_id ?? '')
  return <CalculosIAComponent empresaId={empresaId} />
}
