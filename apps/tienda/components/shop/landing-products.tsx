'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight, Check } from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/products';
import type { ProductRatingAggregate } from '@/lib/shop/catalog-ratings';
import { formatCLP } from '@/lib/shop/format';
import { ProductRatingStars } from '@/components/shop/product-rating-stars';
import { useCartLines } from '@/components/shop/cart-context';

interface LandingProductsProps {
  products: ShopProduct[];
  /** Agregados de reseñas por producto (estrellas en card, mismo patrón que catálogo). */
  ratings?: Record<string, ProductRatingAggregate>;
  pageSize?: number;
  /** Cabecera desde CMS (products_settings); si falta usa el copy hardcodeado. */
  header?: { kicker: string; title: string; desc: string };
  imageAspectRatio?: string;
  imageFit?: string;
}

export function LandingProducts({
  products,
  ratings = {},
  pageSize = 8,
  header = {
    kicker: 'Creaciones',
    title: 'La materia de nuestras búsquedas',
    desc: 'Creaciones cargadas de experiencias y legado.',
  },
  imageAspectRatio,
  imageFit,
}: LandingProductsProps) {
  const [page, setPage] = useState(1);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { add } = useCartLines();

  const handleAdd = (e: React.MouseEvent, product: ShopProduct) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
    add(product);
    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((current) => (current === product.id ? null : current));
    }, 1400);
  };

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageProducts = products.slice(start, start + pageSize);

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

  if (products.length === 0) {
    return (
      <section className="editorial-section">
        <div className="editorial-container text-center px-4">
          <p className="text-muted-foreground italic mb-6">
            Próximamente nuestras creaciones estarán disponibles.
          </p>
          <Link
            href="/catalogo"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-accent bg-accent/10 px-8 py-3 text-editorial-xs uppercase tracking-widest text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Ir al catálogo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="editorial-section">
      <div className="editorial-container text-center mb-10 md:mb-16 px-4 sm:px-0">
        <span className="editorial-kicker mb-4 block">{header.kicker}</span>
        <h2 className="font-display text-[clamp(1.75rem,6vw,3.75rem)] sm:text-4xl md:text-6xl font-light text-foreground mb-4 text-balance leading-tight">
          {header.title}
        </h2>
        <p className="text-muted-foreground italic font-display text-base sm:text-lg max-w-2xl mx-auto text-pretty">
          {header.desc}
        </p>
      </div>

      <div className="editorial-container grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-4 sm:px-0">
        {pageProducts.map((p) => {
          const img = p.photos[0];
          return (
            <div
              key={p.id}
              className="group relative bg-card border border-border rounded-[var(--tienda-radius,0.5rem)] overflow-hidden hover:border-accent/35 transition-all duration-base flex flex-col"
            >
              <Link
                href={`/producto/${encodeURIComponent(p.slug)}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className={`relative ${aspectClass} bg-card overflow-hidden`}>
                  {img ? (
                    aspectClass === 'aspect-auto' ? (
                      <img
                        src={img}
                        alt={p.name}
                        className={`${fitClass.includes('p-2') ? 'p-2 ' : ''}w-full h-auto transition duration-500 group-hover:scale-[1.03]`}
                        loading="lazy"
                      />
                    ) : (
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                        className={`${fitClass} transition duration-500 group-hover:scale-[1.03]`}
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground/60">
                      Sin imagen
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-3 md:p-4 flex flex-col flex-1 min-w-0">
                {p.format && (
                  <span className="inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground mb-2 w-fit">
                    {p.format}
                  </span>
                )}
                <Link
                  href={`/producto/${encodeURIComponent(p.slug)}`}
                  className="min-w-0 min-h-11 inline-flex items-start"
                >
                  <h3 className="font-display text-sm sm:text-base md:text-lg font-semibold text-foreground group-hover:text-accent transition-colors duration-base leading-snug line-clamp-2 text-balance">
                    {p.name}
                  </h3>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">{formatCLP(p.price)}</p>
                {(() => {
                  const rating = ratings[p.id];
                  return rating && rating.reviewCount > 0 ? (
                    <div className="mt-1.5">
                      <ProductRatingStars
                        rating={rating.ratingValue}
                        reviewCount={rating.reviewCount}
                        showCount
                      />
                    </div>
                  ) : null;
                })()}
                {(() => {
                  const isAdded = addedId === p.id;
                  return (
                    <button
                      type="button"
                      onClick={(e) => handleAdd(e, p)}
                      aria-label={isAdded ? `Agregado al carrito: ${p.name}` : `Agregar al carrito: ${p.name}`}
                      className={`mt-auto pt-3 w-full min-h-[44px] py-2.5 px-2 border text-[0.68rem] sm:text-xs uppercase tracking-wider sm:tracking-widest rounded-md flex items-center justify-center gap-1.5 font-medium transition-all duration-300 active:scale-[0.97] ${
                        isAdded
                          ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                          : 'border-accent text-accent-text hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={14} className="stroke-[2.5]" aria-hidden />
                          <span>Agregado</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={13} aria-hidden />
                          <span>Agregar</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-12 px-4">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="min-h-11 min-w-11 h-11 w-11 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-base"
            aria-label="Página anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                type="button"
                key={i}
                onClick={() => setPage(i + 1)}
                className={`min-h-11 min-w-11 h-11 w-11 rounded-full flex items-center justify-center text-xs tracking-wider transition-all duration-base ${
                  page === i + 1
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                }`}
                aria-label={`Página ${i + 1}`}
                aria-current={page === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="min-h-11 min-w-11 h-11 w-11 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-base"
            aria-label="Página siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      )}

      <div className="text-center mt-8 px-4">
        <Link
          href="/catalogo"
          className="inline-flex min-h-11 items-center gap-3 text-editorial-xs uppercase tracking-widest text-accent-text hover:text-accent/80 transition-colors duration-base"
        >
          Ver todas las creaciones <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
