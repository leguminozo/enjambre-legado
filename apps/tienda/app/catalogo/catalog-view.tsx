'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ShopProduct } from '@/lib/shop/products';
import { formatCLP } from '@/lib/shop/format';
import { Search } from 'lucide-react';

type Props = {
  products: ShopProduct[];
};

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
        <h1 className="text-center font-display text-4xl font-semibold text-foreground sm:text-5xl">Creaciones</h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
          La materia de nuestra búsqueda · Experiencias que se transforman en productos cargados de legado
        </p>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative flex-1">
            <span className="sr-only">Buscar productos</span>
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              placeholder="Buscar productos"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </label>
          <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Ordenar por:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-full border border-border bg-card px-4 py-2.5 text-foreground focus:border-accent/50 focus:outline-none"
            >
              <option value="default">Default</option>
              <option value="name">Nombre</option>
              <option value="price-asc">Precio ↑</option>
              <option value="price-desc">Precio ↓</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-14 text-center text-muted-foreground">
            No hay resultados.{' '}
            <button
              type="button"
              onClick={() => setQ('')}
              className="text-accent underline hover:text-accent/80"
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
                    className="group block overflow-hidden rounded-xl border border-border bg-card/40 transition hover:border-accent/35"
                  >
                    <div className="aspect-square bg-card">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground/60">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {p.format ? (
                        <span className="inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                          {p.format}
                        </span>
                      ) : null}
                      <h2 className="mt-2 font-display text-lg font-semibold text-foreground group-hover:text-accent">
                        {p.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{formatCLP(p.price)}</p>
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
