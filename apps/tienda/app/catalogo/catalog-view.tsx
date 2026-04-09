'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ShopProduct } from '@/lib/shop/products';
import { Search } from 'lucide-react';

type Props = {
  products: ShopProduct[];
};

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}

export function CatalogoView({ products }: Props) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  const filtered = useMemo(() => {
    let list = products;
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.format?.toLowerCase().includes(s) ?? false) ||
          (p.description?.toLowerCase().includes(s) ?? false),
      );
    }
    const next = [...list];
    if (sort === 'price-asc') next.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') next.sort((a, b) => b.price - a.price);
    if (sort === 'name') next.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return next;
  }, [products, q, sort]);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-center font-display text-4xl font-semibold text-white sm:text-5xl">Creaciones</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-zinc-400 sm:text-base">
          La materia de nuestra búsqueda · Experiencias que se transforman en productos cargados de legado
        </p>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative flex-1">
            <span className="sr-only">Buscar productos</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <input
              type="search"
              placeholder="Buscar productos"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-full border border-white/15 bg-zinc-900 py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-[#c9a227]/50 focus:outline-none focus:ring-1 focus:ring-[#c9a227]/40"
            />
          </label>
          <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-400">
            <span className="whitespace-nowrap">Ordenar por:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-full border border-white/15 bg-zinc-900 px-4 py-2.5 text-white focus:border-[#c9a227]/50 focus:outline-none"
            >
              <option value="default">Default</option>
              <option value="name">Nombre</option>
              <option value="price-asc">Precio ↑</option>
              <option value="price-desc">Precio ↓</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-14 text-center text-zinc-500">
            No hay resultados.{' '}
            <button
              type="button"
              onClick={() => setQ('')}
              className="text-[#e8c547] underline hover:text-[#f0d060]"
            >
              Limpiar búsqueda
            </button>
          </p>
        ) : (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const img = p.photos[0];
              return (
                <li key={p.id}>
                  <Link
                    href={`/producto/${encodeURIComponent(p.slug)}`}
                    className="group block overflow-hidden rounded-xl border border-white/10 bg-zinc-900/40 transition hover:border-[#c9a227]/35"
                  >
                    <div className="aspect-square bg-zinc-900">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {p.format ? (
                        <span className="inline-block rounded bg-[#0A3D2F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {p.format}
                        </span>
                      ) : null}
                      <h2 className="mt-2 font-display text-lg font-semibold text-white group-hover:text-[#e8c547]">
                        {p.name}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-400">{formatCLP(p.price)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
