import Link from 'next/link';

export function ShopFooter() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold text-white">La Obrera y el Zángano</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
              Miel cruda del bosque de Chiloé. Regeneración y legado desde el sur.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a227]/90">Navegar</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/catalogo" className="text-zinc-300 hover:text-white transition-colors">
                  Creaciones
                </Link>
              </li>
              <li>
                <Link href="/impacto" className="text-zinc-300 hover:text-white transition-colors">
                  Legado del bosque
                </Link>
              </li>
              <li>
                <Link href="/checkout" className="text-zinc-300 hover:text-white transition-colors">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a227]/90">Origen</p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Pureo rural km 8560 — Queilen, Chiloé.
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} La Obrera y el Zángano</p>
          <p className="text-zinc-600">Tienda Enjambre Legado</p>
        </div>
      </div>
    </footer>
  );
}
