import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Trees } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';

const COLECCIONES = [
  {
    title: 'Gotas de néctar',
    subtitle: 'Sachets',
    desc: 'Perfecto tamaño para tus experiencias diarias.',
    href: '/catalogo',
  },
  {
    title: 'Tesoros del colmenar',
    subtitle: 'Frascos',
    desc: 'La dulzura boscosa en tu mesa.',
    href: '/catalogo',
  },
  {
    title: 'Cofres del enjambre',
    subtitle: 'Compartir',
    desc: 'Para disfrutar, compartir y recordar.',
    href: '/catalogo',
  },
] as const;

export default function TiendaLanding() {
  return (
    <>
      <ShopHeader />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-cream-100 via-cream-50 to-cream-50 px-4 pb-20 pt-10 sm:px-6 sm:pb-28 sm:pt-14">
          <div
            className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-miel-200/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-bosque-900/10 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto max-w-6xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-bosque-900/10 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-bosque-800">
              <Sparkles className="h-3.5 w-3.5 text-miel-700" aria-hidden />
              Seamos regeneración
            </p>
            <h1 className="max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-bosque-950 sm:text-5xl md:text-6xl lg:text-7xl">
              Miel cruda del bosque nativo de{' '}
              <span className="text-bosque-800">Chiloé</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bosque-900/75 sm:text-xl">
              La búsqueda de legado y regeneración desde el sur del planeta. Disfruta de nuestras
              creaciones en su máximo esplendor — trazables, honestas y cargadas de historia del
              bosque.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-bosque-900 px-8 py-4 text-sm font-semibold text-cream-50 shadow-lg shadow-bosque-900/20 transition hover:bg-bosque-800"
              >
                Explorar creaciones
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/impacto"
                className="inline-flex items-center justify-center rounded-full border-2 border-bosque-900/20 bg-white/80 px-8 py-4 text-sm font-semibold text-bosque-900 transition hover:border-miel-600/50 hover:bg-miel-50/40"
              >
                Legado del bosque
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-bosque-900/8 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <h2 className="font-display text-3xl font-semibold text-bosque-950 sm:text-4xl">
                Colecciones
              </h2>
              <p className="mt-3 text-bosque-800/70">
                ¡Lleva contigo la dulzura del bosque! Explora formatos pensados para cada momento.
              </p>
            </div>
            <ul className="grid gap-6 md:grid-cols-3">
              {COLECCIONES.map((c) => (
                <li key={c.title}>
                  <Link
                    href={c.href}
                    className="group flex h-full flex-col rounded-2xl border border-bosque-900/10 bg-cream-50 p-6 transition hover:border-miel-600/35 hover:shadow-lg hover:shadow-bosque-900/5"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-miel-800">{c.subtitle}</p>
                    <h3 className="mt-2 font-display text-xl font-semibold text-bosque-900 group-hover:text-bosque-950">
                      {c.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-bosque-800/70">{c.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-miel-800">
                      Ver tienda
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-bosque-900">
              <div className="absolute inset-0 bg-gradient-to-tr from-bosque-950 via-bosque-900/90 to-bosque-800" />
              <div className="relative flex h-full flex-col justify-end p-8 text-cream-50">
                <Trees className="mb-4 h-10 w-10 text-miel-400" aria-hidden />
                <h2 className="font-display text-2xl font-semibold sm:text-3xl">Nuestro lugar en el mundo</h2>
                <p className="mt-2 text-sm text-cream-200/90">Pureo rural km 8560 — Queilen, Chiloé</p>
              </div>
            </div>
            <div>
              <blockquote className="font-display text-2xl font-medium leading-snug text-bosque-900 sm:text-3xl">
                &ldquo;En el silencio del bosque, árboles nativos se regeneran y se transforman en el
                legado de nuestra existencia.&rdquo;
              </blockquote>
              <p className="mt-6 text-bosque-800/75">
                Cada compra sostiene ese ciclo: productos que cuentan de dónde vienen y hacia dónde
                devuelven al territorio.
              </p>
              <Link
                href="/catalogo"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-miel-800 hover:text-miel-700"
              >
                ¡Seamos legado!
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-bosque-900/10 bg-miel-50/60 px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-semibold text-bosque-950 sm:text-3xl">
              Luce saludable. Sé parte del cambio.
            </h2>
            <p className="mt-3 text-bosque-800/70">
              Próximamente: novedades del néctar y el club legado del bosque. Mientras tanto, explora la
              tienda.
            </p>
            <Link
              href="/catalogo"
              className="mt-6 inline-flex rounded-full bg-bosque-900 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-bosque-800"
            >
              Ir a la tienda
            </Link>
          </div>
        </section>
      </main>
      <ShopFooter />
    </>
  );
}
