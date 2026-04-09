import Link from 'next/link';

export function ShopFooter() {
  return (
    <footer className="border-t border-bosque-900/10 bg-bosque-950 text-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-display text-xl font-semibold text-cream-50">La Obrera y el Zángano</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream-200/90">
              Miel cruda del bosque nativo de Chiloé. La búsqueda de legado y regeneración desde el sur
              del planeta.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-miel-400/90">Navegar</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/catalogo" className="text-cream-100/90 hover:text-miel-300 transition-colors">
                  Creaciones
                </Link>
              </li>
              <li>
                <Link href="/impacto" className="text-cream-100/90 hover:text-miel-300 transition-colors">
                  Legado del bosque
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-cream-100/90 hover:text-miel-300 transition-colors">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-miel-400/90">Origen</p>
            <p className="mt-4 text-sm leading-relaxed text-cream-200/90">
              Pureo rural km 8560 — Queilen, Chiloé.
            </p>
            <p className="mt-3 text-sm italic text-cream-300/80">
              &ldquo;En el silencio del bosque, árboles nativos se regeneran y se transforman en el legado
              de nuestra existencia.&rdquo;
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-cream-300/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} La Obrera y el Zángano. Seamos regeneración.</p>
          <p className="text-cream-400/60">Tienda en línea · Enjambre Legado</p>
        </div>
      </div>
    </footer>
  );
}
