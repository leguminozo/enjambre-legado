'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { toast, friendlyError } from '@enjambre/ui'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const friendlyMsg = friendlyError(error, 'Ocurrió un problema inesperado al cargar esta sección.')

  useEffect(() => {
    toast(friendlyMsg, { type: 'error' })
  }, [friendlyMsg])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle size={28} className="text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Algo no salió como esperábamos</h2>
          <p className="text-sm text-muted-foreground">
            {friendlyMsg}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RotateCcw size={16} />
          Reintentar
        </button>
      </div>
    </div>
  )
}
