'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import type { ShopProduct } from '@/lib/shop/products';
import { formatCLP } from '@/lib/shop/format';
import { useCartLines } from '@/components/shop/cart-context';

interface LandingProductsProps {
  products: ShopProduct[];
  pageSize?: number;
}

export function LandingProducts({ products, pageSize = 8 }: LandingProductsProps) {
  const [page, setPage] = useState(1);
  const { add } = useCartLines();

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageProducts = products.slice(start, start + pageSize);

  if (products.length === 0) {
    return (
      <section className="editorial-section">
        <div className="editorial-container text-center">
          <p className="text-muted-foreground italic">Próximamente nuestras creaciones estarán disponibles.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="editorial-section">
      <div className="editorial-container text-center mb-16">
        <span className="editorial-kicker mb-4 block">Creaciones</span>
        <h2 className="font-display text-4xl md:text-6xl font-light text-foreground mb-4">
          La materia de nuestras búsquedas
        </h2>
        <p className="text-muted-foreground italic font-display text-lg max-w-2xl mx-auto">
          Creaciones cargadas de experiencias y legado.
        </p>
      </div>

      <div className="editorial-container grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {pageProducts.map((p) => {
          const img = p.photos[0];
          return (
            <div
              key={p.id}
              className="group relative bg-card border border-border rounded-lg overflow-hidden hover:border-accent/35 transition-all duration-base"
            >
              <Link href={`/producto/${encodeURIComponent(p.slug)}`} className="block">
        <div className="relative aspect-square bg-card overflow-hidden">
                  {img ? (
                    <Image
                      src={img}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground/60">
                      Sin imagen
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-3 md:p-4">
                {p.format && (
                  <span className="inline-block rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground mb-2">
                    {p.format}
                  </span>
                )}
                <Link href={`/producto/${encodeURIComponent(p.slug)}`}>
                  <h3 className="font-display text-base md:text-lg font-semibold text-foreground group-hover:text-accent transition-colors duration-base leading-tight">
                    {p.name}
                  </h3>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{formatCLP(p.price)}</p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    add(p);
                  }}
                  className="mt-3 w-full min-h-[44px] py-3 border border-accent text-accent text-xs uppercase tracking-widest hover:bg-accent hover:text-accent-foreground transition-all duration-elegant rounded-md flex items-center justify-center gap-2 font-medium"
                >
                  <ShoppingBag size={14} />
                  Agregar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-base"
            aria-label="Página anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs tracking-wider transition-all duration-base ${
                  page === i + 1
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-base"
            aria-label="Página siguiente"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      )}

      <div className="text-center mt-8">
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-3 text-editorial-xs uppercase tracking-widest text-accent hover:text-accent/80 transition-colors duration-base"
        >
          Ver todas las creaciones <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
