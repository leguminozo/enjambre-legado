'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { ShopProduct } from '@/lib/shop/products';
import type { ProductRatingAggregate } from '@/lib/shop/catalog-ratings';
import { formatCLP } from '@/lib/shop/format';
import { ProductRatingStars } from '@/components/shop/product-rating-stars';
import { Search, X } from 'lucide-react';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized, type CatalogSortKey } from '@/lib/shop/store-chrome';

type Props = {
  products: ShopProduct[];
  ratings?: Record<string, ProductRatingAggregate>;
};

type SortKey = CatalogSortKey;

function productBadges(p: ShopProduct): string[] {
  const badges: string[] = [];
  if (p.sustituye_azucar_g && p.sustituye_azucar_g > 0) badges.push('Sustituye azúcar');
  if (p.co2_evitado_kg && p.co2_evitado_kg > 0) badges.push('Bosque nativo');
  if (p.irr_referencia && p.irr_referencia > 1) badges.push('Alto impacto');
  if (p.format?.toLowerCase().includes('sachet')) badges.push('Bajo procesamiento');
  for (const tag of p.tags.slice(0, 2)) {
    if (!badges.includes(tag)) badges.push(tag);
  }
  return badges.slice(0, 3);
}

export function CatalogoView({ products, ratings = {} }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { catalog } = useStoreChrome();

  const q = searchParams.get('q') ?? '';
  const formato = searchParams.get('formato') ?? '';
  const categoria = searchParams.get('categoria') ?? '';
  const soloStock = searchParams.get('stock') === '1';
  const altoImpacto = searchParams.get('impacto') === '1';
  const [sort, setSort] = useState<SortKey>(catalog.default_sort);
  const [draftQ, setDraftQ] = useState(q);

  useEffect(() => {
    setSort(catalog.default_sort);
  }, [catalog.default_sort]);

  useEffect(() => {
    setDraftQ(q);
  }, [q]);

  const formatos = useMemo(
    () => [...new Set(products.map((p) => p.format).filter(Boolean))] as string[],
    [products],
  );
  const categorias = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))] as string[],
    [products],
  );

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filtered = useMemo(() => {
    let list = products;
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.format?.toLowerCase().includes(s) ?? false) ||
          (p.category?.toLowerCase().includes(s) ?? false) ||
          (p.description?.toLowerCase().includes(s) ?? false) ||
          p.tags.some((t) => t.toLowerCase().includes(s)),
      );
    }
    if (formato) list = list.filter((p) => p.format === formato);
    if (categoria) list = list.filter((p) => p.category === categoria);
    if (soloStock) list = list.filter((p) => (p.stock ?? 0) > 0);
    if (altoImpacto) list = list.filter((p) => (p.irr_referencia ?? 0) > 1);

    const next = [...list];
    if (sort === 'price-asc') next.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') next.sort((a, b) => b.price - a.price);
    if (sort === 'name') next.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return next;
  }, [products, q, formato, categoria, soloStock, altoImpacto, sort]);

  const hasFilters = Boolean(q || formato || categoria || soloStock || altoImpacto);

  const clearFilters = () => {
    setDraftQ('');
    setParams({ q: null, formato: null, categoria: null, stock: null, impacto: null });
  };

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-14">
        <h1 className="text-center font-display text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
          {resolveLocalized(catalog.page_title, catalog.page_title_en, locale)}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
          {resolveLocalized(catalog.page_subtitle, catalog.page_subtitle_en, locale)}
        </p>

        <div className="tienda-catalog-sticky mx-auto mt-6 max-w-3xl sm:mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {catalog.show_search ? (
              <form
                className="relative flex-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  setParams({ q: draftQ.trim() || null });
                }}
              >
                <label className="sr-only" htmlFor="search-products">
                  Buscar productos
                </label>
                <Search
                  className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  id="search-products"
                  name="search"
                  placeholder="Buscar productos"
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                  className="w-full min-h-[44px] rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/40"
                />
              </form>
            ) : (
              <div className="flex-1" />
            )}
            <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Ordenar</span>
              <select
                id="sort-products"
                name="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="min-h-[44px] rounded-full border border-border bg-card px-4 py-2.5 text-foreground focus:border-accent/50 focus:outline-none"
              >
                <option value="default">Default</option>
                <option value="name">Nombre</option>
                <option value="price-asc">Precio ↑</option>
                <option value="price-desc">Precio ↓</option>
              </select>
            </label>
          </div>

          {catalog.show_filters ? (
            <div className="tienda-filter-scroll mt-3 max-w-3xl">
              {formatos.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setParams({ formato: formato === f ? null : f })}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs uppercase tracking-wider transition min-h-[40px] ${
                    formato === f
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-border text-muted-foreground hover:border-accent/40'
                  }`}
                >
                  {f}
                </button>
              ))}
              {categorias.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setParams({ categoria: categoria === c ? null : c })}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs transition min-h-[40px] ${
                    categoria === c
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border text-muted-foreground hover:border-accent/40'
                  }`}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setParams({ stock: soloStock ? null : '1' })}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs transition min-h-[40px] ${
                  soloStock
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border text-muted-foreground hover:border-accent/40'
                }`}
              >
                En stock
              </button>
              <button
                type="button"
                onClick={() => setParams({ impacto: altoImpacto ? null : '1' })}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs transition min-h-[40px] ${
                  altoImpacto
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/40'
                }`}
              >
                Alto impacto
              </button>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground min-h-[40px]"
                >
                  <X size={12} />
                  Limpiar
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-14 text-center text-muted-foreground">
            {resolveLocalized(catalog.empty_message, catalog.empty_message_en, locale)}{' '}
            {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-accent underline hover:text-accent/80"
            >
              Limpiar filtros
            </button>
            ) : null}
          </p>
        ) : (
          <ul
            className={[
              'mt-12 grid gap-6',
              catalog.columns_mobile === 1 ? 'grid-cols-1' : 'grid-cols-2',
              catalog.columns_desktop === 2
                ? 'sm:grid-cols-2'
                : catalog.columns_desktop === 4
                  ? 'sm:grid-cols-2 lg:grid-cols-4'
                  : 'sm:grid-cols-2 lg:grid-cols-3',
            ].join(' ')}
          >
            {filtered.map((p) => {
              const img = p.photos[0];
              const rating = ratings[p.id];
              const badges = catalog.show_badges ? productBadges(p) : [];
              return (
                <li key={p.id}>
                  <Link
                    href={`/producto/${encodeURIComponent(p.slug)}`}
                    className="product-card group block overflow-hidden rounded-xl border border-border bg-card/40 transition hover:border-accent/35"
                  >
                    <div className="relative aspect-square bg-card overflow-hidden">
                      {img ? (
                        <Image
                          src={img}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground/60">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {p.format ? (
                          <span className="inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                            {p.format}
                          </span>
                        ) : null}
                        {catalog.show_ratings && rating && rating.reviewCount > 0 && (
                          <ProductRatingStars
                            rating={rating.ratingValue}
                            reviewCount={rating.reviewCount}
                            showCount
                          />
                        )}
                      </div>
                      {badges.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {badges.map((badge) => (
                            <span
                              key={badge}
                              className="inline-block rounded-full border border-accent/30 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-accent/80"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="mt-2 font-display text-lg font-semibold text-foreground group-hover:text-accent">
                        {p.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{formatCLP(p.price)}</p>
                      {(p.stock ?? 0) <= 0 && (
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-destructive/80">
                          Agotado
                        </p>
                      )}
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