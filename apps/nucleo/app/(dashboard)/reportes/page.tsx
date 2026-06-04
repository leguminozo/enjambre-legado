'use client'

import { ReportesComponent } from '@/views/eirl/reportes/ReportesComponent'
import { useAuthStore } from '@enjambre/auth'

export default function ReportesPage() {
  const empresaId = useAuthStore((s) => s.session?.user?.app_metadata?.empresa_id ?? '')
  return <ReportesComponent empresaId={empresaId} />
}
