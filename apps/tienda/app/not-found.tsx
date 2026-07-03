import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-6">
      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-muted-foreground">404</p>
      <h1 className="font-display text-2xl text-foreground">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        El camino que buscas no existe o fue movido. Explora el catálogo o vuelve al inicio.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/catalogo" className="btn btn-primary btn-sm">
          Ver catálogo
        </Link>
        <Link href="/" className="btn btn-outline btn-sm">
          Inicio
        </Link>
      </div>
    </div>
  );
}