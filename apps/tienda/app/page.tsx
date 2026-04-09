import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { ImagePlaceholder } from '@/components/shop/image-placeholder';

const COLECCIONES_DOBLE = [
  {
    kicker: 'Sachets',
    title: 'Gotas de néctar',
    desc: '¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.',
    href: '/catalogo',
  },
  {
    kicker: 'Frascos medios',
    title: 'Tesoros del colmenar',
    desc: '¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.',
    href: '/catalogo',
  },
] as const;

const COLECCIONES_GRANDES = [
  {
    kicker: 'Frascos mayores',
    title: 'Reservas del bosque',
    desc: '¡Nuestra mayor reserva para el futuro! Sobrevive a la incertidumbre y acompaña esos momentos que merecen lo mejor.',
    href: '/catalogo',
  },
  {
    kicker: 'Miel virgen',
    title: 'Panal de bosque',
    desc: 'El placer de miel, libre de intervenciones. La pureza del néctar. Una huella del cosmos.',
    href: '/catalogo',
  },
] as const;

export default function TiendaLanding() {
  return (
    <StoreShell>
      <ShopHeader />
      <main>
        <p className="px-4 pt-6 text-center text-sm text-zinc-400 sm:pt-8">
          Bienvenido a la experiencia digital. Te estábamos esperando.
        </p>

        {/* Hero: reemplaza el interior por <Image fill /> cuando tengas la foto del panal / bosque */}
        <section className="relative mx-4 mt-6 overflow-hidden rounded-lg sm:mx-6 lg:mx-auto lg:mt-8 lg:max-w-6xl">
          <div className="relative min-h-[min(70vh,520px)] w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-[#0d1f18] to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,197,71,0.12),transparent_50%)]" />
            {/* Sustituir por next/image fill priority cuando subas la foto del hero / carrusel */}
            <p className="absolute left-1/2 top-1/3 -translate-x-1/2 text-center text-xs text-zinc-600">
              [ Imagen hero ]
            </p>
            <button
              type="button"
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white/80 sm:left-4"
              aria-label="Anterior (carrusel próximamente)"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white/80 sm:right-4"
              aria-label="Siguiente (carrusel próximamente)"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            <div className="relative z-10 flex min-h-[min(70vh,520px)] flex-col items-center justify-end gap-5 pb-12 pt-24 text-center sm:pb-16">
              <div className="max-w-lg border border-white/20 bg-black/70 px-6 py-4 backdrop-blur-sm">
                <p className="font-display text-xl font-semibold text-white sm:text-2xl">
                  Miel cruda del bosque de Chiloé.
                </p>
              </div>
              <Link
                href="/catalogo"
                className="rounded-full bg-[#0A3D2F] px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0d5240]"
              >
                Explorar el legado
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-center font-display text-3xl font-semibold text-white sm:text-4xl">
            Colecciones
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-zinc-400">
            Explora nuestras categorías estacionales
          </p>
          <ul className="mt-14 grid gap-12 md:grid-cols-2">
            {COLECCIONES_DOBLE.map((c) => (
              <li key={c.title}>
                <Link href={c.href} className="group block">
                  <ImagePlaceholder ratio="portrait" label="Foto de colección" className="rounded-lg" />
                  <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a227]">
                    {c.kicker}
                  </p>
                  <h3 className="mt-1 text-center font-display text-xl font-semibold text-white group-hover:text-[#e8c547] sm:text-2xl">
                    {c.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-zinc-400">
                    {c.desc}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-white/10 bg-zinc-950/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <ul className="grid gap-16 md:grid-cols-2 md:gap-12">
              {COLECCIONES_GRANDES.map((c) => (
                <li key={c.title}>
                  <Link href={c.href} className="group block">
                    <p className="text-sm font-medium text-zinc-400">{c.kicker}</p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-white sm:text-3xl">
                      {c.title}
                    </h3>
                    <div className="mt-6 overflow-hidden rounded-lg">
                      <ImagePlaceholder ratio="video" label="Imagen producto / bosque" />
                    </div>
                    <p className="mx-auto mt-6 max-w-md text-center text-sm leading-relaxed text-zinc-400">
                      {c.desc}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">¡Seamos legado!</h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-400">
            Luce saludable. Sé parte del cambio. Pronto: club y novedades del néctar.
          </p>
          <Link
            href="/catalogo"
            className="mt-8 inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Ir a creaciones
          </Link>
        </section>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
