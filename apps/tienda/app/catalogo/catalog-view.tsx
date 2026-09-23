'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { type ShopProduct, resolveProductBadges } from '@/lib/shop/products';
import type { ProductRatingAggregate } from '@/lib/shop/catalog-ratings';
import { formatCLP } from '@/lib/shop/format';
import { ProductRatingStars } from '@/components/shop/product-rating-stars';
import { Search, X } from 'lucide-react';
import { EmptyState, cn } from '@enjambre/ui';
import { useStoreChrome } from '@/components/shop/store-chrome-context';
import { resolveLocalized, type CatalogSortKey, alignToClass } from '@/lib/shop/store-chrome';
import { QuickAddButton } from '@/components/shop/quick-add-button';

type Props = {
  products: ShopProduct[];
  ratings?: Record<string, ProductRatingAggregate>;
};

type SortKey = CatalogSortKey;

const productBadges = resolveProductBadges;

type ProductCardProps = {
  product: ShopProduct;
  rating?: ProductRatingAggregate;
  showRatings: boolean;
  showBadges: boolean;
  twoColMobile: boolean;
  imageAspectRatio?: string;
  imageFit?: string;
};

/**
 * Memoizado: el grid se re-renderiza en cada tecla del buscador y en cada
 * cambio de filtro; los objetos producto son referencias estables (server),
 * así que las cards saltan sin re-render.
 */
const ProductCard = memo(function ProductCard({
  product: p,
  rating,
  showRatings,
  showBadges,
  twoColMobile,
  imageAspectRatio,
  imageFit,
}: ProductCardProps) {
  const img = p.photos[0];
  const badges = showBadges ? productBadges(p) : [];

  const aspectClassMap: Record<string, string> = {
    '16/10': 'aspect-[16/10]',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '3/4': 'aspect-[3/4]',
    'auto': 'aspect-auto',
  };
  const fitClassMap: Record<string, string> = {
    cover: 'object-cover',
    contain: 'object-contain p-2',
  };
  const aspectClass = aspectClassMap[imageAspectRatio || ''] || 'aspect-square';
  const fitClass = fitClassMap[imageFit || ''] || 'object-cover';

  const href = `/producto/${encodeURIComponent(p.slug)}`;
  const outOfStock = (p.stock ?? 0) <= 0;

  return (
    <li className="min-w-0">
      <article className="product-card group flex h-full flex-col overflow-hidden rounded-[var(--tienda-radius,0.5rem)] border border-border bg-card/40 transition hover:border-accent/35">
        <Link href={href} className="block">
          <div className={`relative ${aspectClass} bg-card overflow-hidden`}>
            {img ? (
              <Image
                src={img}
                alt={p.name}
                fill
                sizes={
                  twoColMobile
                    ? '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw'
                    : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                }
                className={`${fitClass} transition duration-500 group-hover:scale-[1.03]`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground/60">
                Sin imagen
              </div>
            )}
          </div>
        </Link>
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {p.format ? (
              <span className="inline-block rounded bg-primary px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wide text-primary-foreground">
                {p.formatLabel ?? p.format}
              </span>
            ) : null}
            {showRatings && rating && rating.reviewCount > 0 && (
              <ProductRatingStars
                rating={rating.ratingValue}
                reviewCount={rating.reviewCount}
                showCount
              />
            )}
          </div>
          {badges.length > 0 && (
            <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1 sm:gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-block rounded-full border border-accent/30 px-1.5 sm:px-2.5 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-wider text-accent-text"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
          <Link href={href} className="min-h-11 inline-flex items-start">
            <h2 className="mt-1.5 sm:mt-2 font-display text-sm sm:text-base md:text-lg font-semibold leading-snug text-foreground group-hover:text-accent line-clamp-2 text-balance">
              {p.name}
            </h2>
          </Link>
          {p.shortDescription ? (
            <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {p.shortDescription}
            </p>
          ) : null}
          <p className="pt-1.5 text-sm tabular-nums text-muted-foreground sm:text-base">
            {formatCLP(p.price)}
          </p>
          {outOfStock ? (
            <p className="mt-1 text-[10px] uppercase tracking-wider text-destructive">
              Agotado
            </p>
          ) : (
            <QuickAddButton product={p} />
          )}
        </div>
      </article>
    </li>
  );
});

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

  const formatos = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.format) {
        map.set(p.format, p.formatLabel ?? p.format);
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [products]);

  const categorias = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.category) {
        map.set(p.category, p.categoryLabel ?? p.category);
      }
    }
    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [products]);

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
          (p.formatLabel?.toLowerCase().includes(s) ?? false) ||
          (p.category?.toLowerCase().includes(s) ?? false) ||
          (p.categoryLabel?.toLowerCase().includes(s) ?? false) ||
          (p.description?.toLowerCase().includes(s) ?? false) ||
          (p.shortDescription?.toLowerCase().includes(s) ?? false) ||
          p.tags.some((t) => t.toLowerCase().includes(s)),
      );
    }
    if (formato) {
      const fLower = formato.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.format?.toLowerCase() === fLower ||
          p.formatLabel?.toLowerCase() === fLower ||
          p.format?.toLowerCase().includes(fLower) ||
          fLower.includes(p.format?.toLowerCase() ?? ''),
      );
    }
    if (categoria) {
      const cLower = categoria.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.category?.toLowerCase() === cLower ||
          p.categoryLabel?.toLowerCase() === cLower ||
          p.category?.toLowerCase().includes(cLower) ||
          cLower.includes(p.category?.toLowerCase() ?? ''),
      );
    }
    if (soloStock) list = list.filter((p) => (p.stock ?? 0) > 0);
    if (altoImpacto) {
      list = list.filter(
        (p) =>
          (p.irr_referencia ?? 0) > 0 ||
          (p.co2_evitado_kg ?? 0) > 0 ||
          p.tags.some((t) => {
            const tl = t.toLowerCase();
            return tl.includes('bosque') || tl.includes('regenerativ') || tl.includes('nativo');
          }),
      );
    }

    const next = [...list];
    if (sort === 'price-asc') next.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') next.sort((a, b) => b.price - a.price);
    if (sort === 'name') next.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    if (sort === 'impacto') {
      next.sort((a, b) => {
        const scoreA = (a.irr_referencia ?? 0) * 10 + (a.co2_evitado_kg ?? 0);
        const scoreB = (b.irr_referencia ?? 0) * 10 + (b.co2_evitado_kg ?? 0);
        return scoreB - scoreA;
      });
    }
    if (sort === 'newest') next.sort((a, b) => {
      const tA = a.fecha_envasado ? new Date(a.fecha_envasado).getTime() : 0;
      const tB = b.fecha_envasado ? new Date(b.fecha_envasado).getTime() : 0;
      return tB - tA;
    });
    return next;
  }, [products, q, formato, categoria, soloStock, altoImpacto, sort]);

  const hasFilters = Boolean(q || formato || categoria || soloStock || altoImpacto);

  const clearFilters = () => {
    setDraftQ('');
    setParams({ q: null, formato: null, categoria: null, stock: null, impacto: null });
  };

  const chipBase =
    'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium tracking-normal transition min-h-[38px] sm:min-h-[40px] inline-flex items-center';

  const isFormatoActive = (f: string) =>
    Boolean(
      formato &&
        (formato.trim().toLowerCase() === f.trim().toLowerCase() ||
          formato.trim().toLowerCase().includes(f.trim().toLowerCase()) ||
          f.trim().toLowerCase().includes(formato.trim().toLowerCase())),
    );

  const isCategoriaActive = (c: string) =>
    Boolean(
      categoria &&
        (categoria.trim().toLowerCase() === c.trim().toLowerCase() ||
          categoria.trim().toLowerCase().includes(c.trim().toLowerCase()) ||
          c.trim().toLowerCase().includes(categoria.trim().toLowerCase())),
    );

  return (
    <>
      <div
        data-cms-section="catalog_settings"
        className="mx-auto max-w-6xl px-4 pt-[max(2rem,calc(var(--safe-top)+0.5rem))] pb-24 sm:px-6 sm:py-14 md:pb-14"
      >
        <h1 className="text-center font-display text-[clamp(1.75rem,6vw,3rem)] font-light text-foreground text-balance sm:text-4xl md:text-5xl leading-tight">
          {resolveLocalized(catalog.page_title, catalog.page_title_en, locale)}
        </h1>
        {resolveLocalized(catalog.page_subtitle, catalog.page_subtitle_en, locale).trim() ? (
          <p className={`mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-muted-foreground text-pretty sm:mt-4 sm:text-base whitespace-pre-line ${alignToClass(catalog.text_align)}`}>
            {resolveLocalized(catalog.page_subtitle, catalog.page_subtitle_en, locale)}
          </p>
        ) : null}

        <div
          className={cn(
            'mx-auto mt-6 max-w-3xl sm:mt-10',
            catalog.sticky_bar && 'tienda-catalog-sticky',
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            {catalog.show_search ? (
              <form
                className="relative flex-1 max-w-md min-w-0"
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
                  className="w-full min-h-[44px] rounded-full border border-border bg-card py-3 pl-11 pr-4 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/40"
                />
              </form>
            ) : null}
            <label className="flex shrink-0 items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Ordenar</span>
              <select
                id="sort-products"
                name="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="min-h-[44px] rounded-full border border-border bg-card px-4 py-2.5 text-foreground focus:border-accent/50 focus:outline-none"
              >
                <option value="default">Destacados</option>
                <option value="newest">Recién Recolectados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre (A - Z)</option>
                <option value="impacto">Mayor impacto ecológico</option>
              </select>
            </label>
          </div>

          {catalog.show_filters ? (
            <div className="tienda-filter-scroll mt-4 max-w-3xl gap-2 sm:flex-wrap sm:justify-center">
              {catalog.show_formats_filter !== false &&
                formatos.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setParams({ formato: isFormatoActive(f.value) ? null : f.value })}
                    className={`${chipBase} ${
                      isFormatoActive(f.value)
                        ? 'border-accent bg-accent/15 text-accent-text font-semibold'
                        : 'border-border text-muted-foreground hover:border-accent/40'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              {catalog.show_categories_filter !== false &&
                categorias.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setParams({ categoria: isCategoriaActive(c.value) ? null : c.value })}
                    className={`${chipBase} ${
                      isCategoriaActive(c.value)
                        ? 'border-primary bg-primary/10 text-foreground font-semibold'
                        : 'border-border text-muted-foreground hover:border-accent/40'
                    }`}
                  >
                    {c.label ? c.label.charAt(0).toUpperCase() + c.label.slice(1) : c.value}
                  </button>
                ))}
              {catalog.show_stock_filter !== false && (
                <button
                  type="button"
                  onClick={() => setParams({ stock: soloStock ? null : '1' })}
                  className={`${chipBase} ${
                    soloStock
                      ? 'border-success bg-success/10 text-success-text font-semibold'
                      : 'border-border text-muted-foreground hover:border-accent/40'
                  }`}
                >
                  En stock
                </button>
              )}
              {catalog.show_impact_filter === true && (
                <button
                  type="button"
                  onClick={() => setParams({ impacto: altoImpacto ? null : '1' })}
                  className={`${chipBase} ${
                    altoImpacto
                      ? 'border-accent bg-accent/10 text-accent-text font-semibold'
                      : 'border-border text-muted-foreground hover:border-accent/40'
                  }`}
                >
                  Alto impacto
                </button>
              )}
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className={`${chipBase} gap-1 border-border text-muted-foreground hover:text-foreground`}
                >
                  <X size={12} aria-hidden />
                  Limpiar
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            variant="composed"
            theme="bosque"
            className="mt-14"
            title={resolveLocalized(catalog.empty_message, catalog.empty_message_en, locale) || (locale === 'en' ? 'No creations match your filter' : 'Néctar en reposo')}
            description={
              hasFilters
                ? (locale === 'en' ? 'No varieties match the selected filters.' : 'No encontramos variedades que coincidan con estos filtros específicos.')
                : (locale === 'en' ? 'We are preparing new harvests from the native forest of Chiloé.' : 'Estamos preparando nuevas recolecciones del bosque nativo de Chiloé.')
            }
            suggestion={hasFilters ? (locale === 'en' ? 'Try clearing filters to discover all native honey varieties.' : 'Prueba limpiando los filtros para descubrir toda nuestra colección.') : undefined}
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-11 items-center px-4 py-2 rounded-lg bg-accent/15 text-accent font-medium hover:bg-accent/25 transition-colors"
                >
                  {locale === 'en' ? 'Clear filters' : 'Ver todo el catálogo'}
                </button>
              ) : (
                <Link href="/contacto" className="inline-flex min-h-11 items-center px-4 py-2 rounded-lg border border-border hover:bg-surface-raised transition-colors">
                  {locale === 'en' ? 'Contact us' : 'Escríbenos'}
                </Link>
              )
            }
          />
        ) : (
          <ul
            className={[
              'mt-8 sm:mt-12 grid gap-3 sm:gap-5 lg:gap-6',
              catalog.columns_mobile === 1 ? 'grid-cols-1' : 'grid-cols-2',
              catalog.columns_desktop === 2
                ? 'sm:grid-cols-2'
                : catalog.columns_desktop === 4
                  ? 'sm:grid-cols-2 lg:grid-cols-4'
                  : 'sm:grid-cols-2 lg:grid-cols-3',
            ].join(' ')}
          >
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                rating={ratings[p.id]}
                showRatings={catalog.show_ratings}
                showBadges={catalog.show_badges}
                twoColMobile={catalog.columns_mobile !== 1}
                imageAspectRatio={catalog.image_aspect_ratio}
                imageFit={catalog.image_fit}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}