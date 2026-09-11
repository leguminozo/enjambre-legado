import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronDown,
  Calendar,
  Users,
  MapPin,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd, faqJsonLd, mergeJsonLd } from '@/lib/shop/json-ld';
import { FLORACIONES_EXPERIENCE } from '@/lib/experiencias/content';
import { ExperienceInquiryForm } from '@/components/experiencias/experience-inquiry-form';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Cata y Degustación: Floraciones del Bosque Austral · La Obrera y el Zángano',
  description:
    'Cata sensorial guiada y degustación de mieles nativas de Chiloé para empresas y grupos privados. Conducido por Cristina Miranda en Santiago.',
  alternates: { canonical: `${SITE_URL}/experiencias/floraciones` },
  openGraph: {
    title: 'Cata y Degustación: Floraciones del Bosque Austral · La Obrera y el Zángano',
    description:
      'Cata sensorial y degustación de mieles nativas de Chiloé para empresas y grupos privados. Conducido por Cristina Miranda.',
    url: `${SITE_URL}/experiencias/floraciones`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
    images: [{ url: `${SITE_URL}${FLORACIONES_EXPERIENCE.heroImage}`, width: 1600, height: 900 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cata y Degustación: Floraciones del Bosque Austral · La Obrera y el Zángano',
    description:
      'Cata sensorial y degustación de mieles nativas de Chiloé para empresas y grupos privados. Conducido por Cristina Miranda.',
  },
};

export default function FloracionesPage() {
  const { kicker, title, subtitle, editionNote, heroImage, biography, movements, formats, deferredPurchaseProtocol, faq } =
    FLORACIONES_EXPERIENCE;

  const jsonLdData = mergeJsonLd([
    breadcrumbJsonLd([
      { name: 'Inicio', href: '/' },
      { name: 'Experiencias', href: '/experiencias' },
      { name: title, href: '/experiencias/floraciones' },
    ]),
    faqJsonLd(faq),
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/20">
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Apiario y bosque nativo en Pureo, Chiloé"
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xs" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
          </div>

          <div className="relative px-4 text-center pt-[max(7.5rem,calc(env(safe-area-inset-top)+6rem))] pb-16 md:pb-24">
            <div className="max-w-3xl mx-auto">
              <span className="block text-[0.65rem] tracking-[0.45em] uppercase text-accent-text mb-4">
                {kicker}
              </span>
              <h1 className="font-display text-[clamp(2.25rem,6.5vw,4.25rem)] font-light text-foreground mb-4 text-balance leading-tight">
                {title}
              </h1>
              <p className="font-display italic text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-pretty mb-6 leading-relaxed">
                {subtitle}
              </p>
              <div className="inline-block rounded-full border border-border/40 bg-surface-raised/60 px-4 py-1.5 text-[0.7rem] uppercase tracking-wider text-muted-foreground mb-8">
                {editionNote}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="#solicitud"
                  className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-7 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Solicitar fecha privada
                </a>
                <a
                  href="#movimientos"
                  className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full border border-border/40 bg-surface-raised/40 px-6 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
                >
                  Estructura de la sesión
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Cristina Miranda / El Activo Biográfico ── */}
        <section className="py-16 md:py-24 px-4 border-b border-border/20 bg-surface-raised/20">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-5">
                <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                  Quién conduce la sesión
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground">
                  {biography.name}
                </h2>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent-text shrink-0" />
                  <span>{biography.location}</span>
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border/20 pt-6">
                  {biography.metrics.map((m) => (
                    <div key={m.label}>
                      <div className="font-display text-2xl text-foreground">{m.value}</div>
                      <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground mt-0.5">
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-7 space-y-4 text-sm text-muted-foreground leading-relaxed">
                {biography.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Los 4 Movimientos de la Sesión ── */}
        <section id="movimientos" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-3">
                Protocolo sensorial
              </span>
              <h2 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-light text-foreground text-balance">
                Cuatro movimientos de la sesión
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Una secuencia metódica de 90 a 120 minutos diseñada para evitar la fatiga gustativa y profundizar
                en el origen botánico de cada miel.
              </p>
            </div>

            <div className="space-y-6">
              {movements.map((m) => (
                <div
                  key={m.step}
                  className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 sm:p-8 hover:border-border/60 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 mb-3">
                    <span className="font-mono text-xs uppercase tracking-widest text-accent-text">
                      Movimiento {m.step}
                    </span>
                    <h3 className="font-display text-xl sm:text-2xl font-light text-foreground">
                      {m.title}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {m.description}
                  </p>

                  <div className="border-t border-border/20 pt-4">
                    <div className="text-[0.65rem] uppercase tracking-wider text-accent-text mb-2.5">
                      Elementos en mesa
                    </div>
                    <ul className="grid sm:grid-cols-3 gap-2">
                      {m.elements.map((el, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
                        >
                          <span className="text-accent-text/60 mt-0.5">•</span>
                          <span>{el}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Principio de No-Comercialización & Cierre Diferido ── */}
        <section className="py-16 px-4 border-b border-border/20 bg-surface-raised/30">
          <div className="max-w-3xl mx-auto rounded-2xl border border-border/30 bg-background/70 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <Shield className="w-5 h-5 text-accent-text shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-lg sm:text-xl font-light text-foreground mb-2">
                  {deferredPurchaseProtocol.headline}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                  {deferredPurchaseProtocol.description}
                </p>
                <div className="flex items-center gap-2 text-[0.7rem] text-accent-text uppercase tracking-wider border-t border-border/20 pt-3">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{deferredPurchaseProtocol.takeawayArtifact}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Formatos Disponibles ── */}
        <section className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-3">
                Formatos
              </span>
              <h2 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-light text-foreground text-balance">
                Modalidades de encuentro
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {formats.map((f) => (
                <div
                  key={f.id}
                  className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 sm:p-8 flex flex-col justify-between hover:border-accent/30 transition-colors"
                >
                  <div>
                    <span className="block text-[0.65rem] uppercase tracking-wider text-accent-text mb-2">
                      {f.kicker}
                    </span>
                    <h3 className="font-display text-2xl font-light text-foreground mb-3">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                      {f.summary}
                    </p>

                    <div className="space-y-2 border-y border-border/20 py-4 mb-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Aforo: {f.capacity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Duración: {f.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Espacio: {f.context}</span>
                      </div>
                    </div>

                    <div className="text-[0.65rem] uppercase tracking-wider text-accent-text mb-3">
                      Qué incluye
                    </div>
                    <ul className="space-y-2 mb-8">
                      {f.includes.map((inc, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed"
                        >
                          <span className="text-accent-text mt-0.5">•</span>
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="#solicitud"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/40 bg-surface-raised/60 px-5 text-xs font-semibold uppercase tracking-wider text-foreground hover:border-accent hover:text-accent-text transition-colors"
                  >
                    <span>Cotizar esta modalidad</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Formulario de Solicitud Directa ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-2xl mx-auto">
            <ExperienceInquiryForm initialFormat="corporativo" />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-4 border-b border-border/20 bg-surface-raised/20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Preguntas frecuentes
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-balance">
                Aspectos técnicos y operativos
              </h2>
            </div>

            <div className="space-y-3">
              {faq.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-border/30 bg-surface-raised/40 overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-foreground font-display text-base sm:text-lg font-light list-none">
                    {item.question}
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-6 pb-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pie Editorial ── */}
        <section className="py-12 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <p className="text-xs text-muted-foreground">
              La Obrera y el Zángano · Pureo, Queilén, Chiloé & Santiago de Chile.
            </p>
            <p className="text-[0.7rem] text-muted-foreground/60 mt-1">
              Coordinación institucional: +56 9 4083 1358 · obrerayzangano@gmail.com
            </p>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
