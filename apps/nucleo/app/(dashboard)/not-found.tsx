import Link from 'next/link'
import { Hexagon } from 'lucide-react'

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Hexagon size={28} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Página no encontrada</h2>
          <p className="text-sm text-muted-foreground">
            Esta sección no existe o fue movida.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
