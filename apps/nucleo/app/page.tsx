import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { Lock, Shield, Scale, FileText, ArrowRight } from 'lucide-react';
import { CensoStats, type CensoStatsData } from '@/components/censo/CensoStats';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { TerritorioHeroMap } from '@/components/territorio/TerritorioHeroMap';
import { LandingAnimations } from '@/components/territorio/LandingAnimations';
import { PrivacyVisual } from '@/components/territorio/PrivacyVisual';
import { CensoCountdown } from '@/components/territorio/CensoCountdown';
import { HerramientasApicolasShowcase } from '@/components/territorio/HerramientasApicolasShowcase';
import { CmsPreviewListener } from '@/components/territorio/CmsPreviewListener';
import { getTerritorioCmsContent } from '@/lib/territorio-cms';

import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getTerritorioCmsContent();
  const title = cms.hero.seo_title || 'Registro Apícola de Chiloé — Mapa y Defensa Territorial';
  const description =
    cms.hero.seo_description ||
    'Inscribe tus apiarios en el registro territorial de Chiloé. Es gratuito. El mapa publica zonas aproximadas de pecoreo sin revelar tus coordenadas exactas.';

  return {
    metadataBase: new URL('https://www.registroapicolachiloe.me'),
    title,
    description,
    alternates: {
      canonical: 'https://www.registroapicolachiloe.me',
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: 'https://www.registroapicolachiloe.me',
      siteName: 'Registro Apícola de Chiloé',
      locale: 'es_CL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Landing pública del Registro Territorial Apícola de Chiloé.
 * Arco: hero → privacidad visual → por qué → cómo → origen → FAQ → cierre.
 */
async function getCensoStats(): Promise<CensoStatsData | null> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const res = await fetch(`${proto}://${host}/api/censo-publico/stats`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: CensoStatsData };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function parseCierreDate(cierre?: string | null): Date {
  if (cierre) {
    const trimmed = cierre.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d, 23, 59, 59, 999);
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  const currentYear = new Date().getFullYear();
  return new Date(currentYear, 9, 31, 23, 59, 59, 999);
}

function formatCierre(cierre: string | null | undefined): string {
  if (!cierre) return '31 de octubre';
  const d = new Date(`${cierre}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '31 de octubre';
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' }).format(d);
}

export default async function RedApicolaLanding() {
  const [stats, cms] = await Promise.all([
    getCensoStats(),
    getTerritorioCmsContent(),
  ]);
  const cierre = formatCierre(stats?.cierre ?? null);
  const targetDate = parseCierreDate(stats?.cierre);
  const diffMs = targetDate.getTime() - Date.now();
  const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const mapaVacio =
    !stats || (stats.apiarios_activos === 0 && stats.actores_activos === 0);

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground flex flex-col">
      <CmsPreviewListener />
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <TerritorioHeader />

      <LandingAnimations>
        {/* A. HERO — el mapa es el producto */}
        <section
          id="hero"
          data-cms-section="territorio_hero"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-border/60"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Texto y llamado a la acción */}
            <div className="lg:col-span-5 order-1">
              <p className="hero-kicker text-sm text-muted-foreground mb-4 sm:mb-5">
                {cms.hero.eyebrow}
              </p>
              <h1 className="font-existencial font-semibold tracking-tight text-balance text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.08] text-foreground mb-5">
                <span className="hero-title-line block">{cms.hero.title_line1}</span>
                <span className="hero-title-line block">{cms.hero.title_line2}</span>
                <span className="hero-title-line block mt-2 text-primary italic font-serif font-normal">
                  {cms.hero.title_italic}
                </span>
              </h1>
              <p className="hero-body text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty max-w-lg mb-4">
                {cms.hero.description}
              </p>
              <p className="hero-body text-xs sm:text-sm text-muted-foreground/80 leading-relaxed text-pretty max-w-md mb-8">
                {cms.hero.nota_comunitaria}{' '}
                <Link href="/carta" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors font-medium">
                  {cms.hero.carta_link_text}
                </Link>.
              </p>
              <div className="hero-cta flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md">
                <Link
                  href={cms.hero.cta_primary_href}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-150 hover:opacity-95 shadow-sm active:scale-[0.99]"
                >
                  {cms.hero.cta_primary_label}
                </Link>
                <Link
                  href={cms.hero.cta_secondary_href}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-surface-raised transition-colors duration-150"
                >
                  {cms.hero.cta_secondary_label}
                </Link>
              </div>
              <div className="hero-cta mt-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-primary/80 animate-pulse" />
                <span>
                  Inscripción abierta · Cierra el {cierre}
                  {diasRestantes > 0 ? ` (quedan ${diasRestantes} días)` : ''}
                </span>
              </div>
              <p className="hero-cta mt-4 text-sm text-muted-foreground">
                {cms.hero.login_prompt}{' '}
                <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                  {cms.hero.login_link_text}
                </Link>
              </p>
            </div>

            {/* Mapa interactivo con touch-guard móvil */}
            <div className="hero-map-panel lg:col-span-7 order-2">
              <TerritorioHeroMap mapaVacio={mapaVacio} />
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CensoStats initialStats={stats} variant="strip" />
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                    {cms.hero.badge_info}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* B. PRIVACIDAD VISUAL — Demostración gráfica de zona vs coordenada */}
        <section
          id="privacy"
          data-cms-section="territorio_privacidad"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-16 sm:py-20 border-b border-border/60"
        >
          <div className="max-w-5xl mx-auto">
            <div className="max-w-2xl mb-10 sm:mb-12">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                {cms.privacidad.badge}
              </span>
              <h2 className="section-reveal text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3 font-existencial">
                {cms.privacidad.title}
              </h2>
              <p className="section-reveal text-muted-foreground leading-relaxed text-base sm:text-lg">
                {cms.privacidad.description}{' '}
                <Link href="/mapa-chiloe" className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors inline-flex items-center gap-1">
                  {cms.privacidad.map_link_text}
                </Link>
              </p>
            </div>

            <div className="section-reveal">
              <PrivacyVisual />
            </div>
          </div>
        </section>

        {/* C. POR QUÉ */}
        <section
          id="why"
          data-cms-section="territorio_beneficios"
          className="bg-surface-sunken px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28"
        >
          <div className="max-w-5xl mx-auto">
            <div className="max-w-xl mb-12 sm:mb-16">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                {cms.beneficios.badge}
              </span>
              <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground font-existencial">
                {cms.beneficios.title}
              </h2>
            </div>

            <ul className="divide-y divide-border/70">
              {[
                {
                  n: cms.beneficios.item1_number,
                  title: cms.beneficios.item1_title,
                  body: cms.beneficios.item1_description,
                },
                {
                  n: cms.beneficios.item2_number,
                  title: cms.beneficios.item2_title,
                  body: cms.beneficios.item2_description,
                },
                {
                  n: cms.beneficios.item3_number,
                  title: cms.beneficios.item3_title,
                  body: cms.beneficios.item3_description,
                },
              ].map((item) => (
                <li
                  key={item.n}
                  className="why-item grid grid-cols-1 sm:grid-cols-[4rem_1fr] gap-3 sm:gap-10 py-8 sm:py-10 first:pt-0 last:pb-0"
                >
                  <span className="font-mono text-xs tracking-widest text-primary/80 pt-1 font-semibold">
                    {item.n}
                  </span>
                  <div className="min-w-0 max-w-2xl">
                    <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2 tracking-tight font-existencial">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-[0.95rem] sm:text-base">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* D. CÓMO */}
        <section
          id="how"
          data-cms-section="territorio_pasos"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28 border-t border-border/60"
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 sm:mb-16 max-w-xl">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                {cms.pasos.badge}
              </span>
              <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground mb-3 font-existencial">
                {cms.pasos.title}
              </h2>
              <p className="section-reveal text-muted-foreground text-base sm:text-lg leading-relaxed">
                {cms.pasos.description}
              </p>
            </div>

            <ol className="divide-y divide-border/70 max-w-2xl">
              {[
                {
                  step: cms.pasos.step1_number,
                  title: cms.pasos.step1_title,
                  body: cms.pasos.step1_description,
                },
                {
                  step: cms.pasos.step2_number,
                  title: cms.pasos.step2_title,
                  body: cms.pasos.step2_description,
                },
                {
                  step: cms.pasos.step3_number,
                  title: cms.pasos.step3_title,
                  body: cms.pasos.step3_description,
                },
              ].map((s) => (
                <li key={s.step} className="how-step grid grid-cols-[2.5rem_1fr] gap-4 py-7 first:pt-0">
                  <span className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono flex items-center justify-center font-semibold shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="text-lg font-medium text-foreground tracking-tight mb-1 font-existencial">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* D1. HERRAMIENTAS APÍCOLAS — Presentación acotada post-persuasión */}
        <HerramientasApicolasShowcase content={cms.herramientas} />

        {/* E. ORIGEN — Fotografía real del bosque y apicultura */}
        <section
          id="origin"
          data-cms-section="territorio_origen"
          className="bg-surface-sunken px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28"
        >
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="section-reveal lg:col-span-5 relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5] rounded-lg overflow-hidden ring-1 ring-border/50 shadow-md">
              <Image
                src={cms.origen.image_url || '/assets/territorio/origen-bosque-chiloe.webp'}
                alt="Bosque nativo con musgo y helechos, zona de pecoreo"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />

            </div>

            <div className="lg:col-span-7 max-w-xl">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                {cms.origen.badge}
              </span>
              <h2 className="section-reveal font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-5">
                {cms.origen.title}
              </h2>
              <p className="section-reveal text-muted-foreground leading-relaxed text-base sm:text-lg mb-5">
                {cms.origen.description}
              </p>
            </div>
          </div>
        </section>

        {/* E1. CARTA CONSTITUTIVA — Propuesta comunitaria nacida en Queilén */}
        <section
          id="carta"
          data-cms-section="territorio_carta"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28 border-t border-border/60 bg-surface-raised/30"
        >
          <div className="max-w-5xl mx-auto">
            <div className="max-w-3xl mb-12 sm:mb-16">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase font-semibold">
                  {cms.carta.badge}
                </span>
                <span className="text-xs text-muted-foreground bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-mono font-medium">
                  {cms.carta.version}
                </span>
              </div>
              <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground font-existencial mb-4">
                {cms.carta.title}
              </h2>
              <p className="section-reveal text-muted-foreground leading-relaxed text-base sm:text-lg">
                {cms.carta.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="section-reveal rounded-xl border border-border/70 bg-surface-sunken/60 p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm">
                  {cms.carta.pilar1_value}
                </div>
                <h3 className="font-existencial text-lg font-semibold text-foreground">
                  {cms.carta.pilar1_title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cms.carta.pilar1_description}
                </p>
              </div>

              <div className="section-reveal rounded-xl border border-border/70 bg-surface-sunken/60 p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-existencial text-lg font-semibold text-foreground">
                  {cms.carta.pilar2_title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cms.carta.pilar2_description}
                </p>
              </div>

              <div className="section-reveal rounded-xl border border-border/70 bg-surface-sunken/60 p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-existencial text-lg font-semibold text-foreground">
                  {cms.carta.pilar3_title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cms.carta.pilar3_description}
                </p>
              </div>
            </div>

            <div className="section-reveal flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl border border-primary/30 bg-primary/5">
              <div className="space-y-1">
                <p className="font-medium text-foreground text-sm sm:text-base">
                  {cms.carta.cta_title}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {cms.carta.cta_description}
                </p>
              </div>
              <Link
                href={cms.carta.cta_href || '/carta'}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 transition-opacity shadow-sm shrink-0"
              >
                <FileText className="w-4 h-4" />
                <span>{cms.carta.cta_label}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* E2. PUERTA INSTITUCIONAL */}
        <section
          id="institucional"
          data-cms-section="territorio_institucional"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-10 sm:py-12 border-t border-border/60"
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md border border-border/70 bg-surface-sunken/50 px-5 py-5">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              {cms.institucional.text}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Link
                href={cms.institucional.cta1_href || '/municipalidades'}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-background transition-colors"
              >
                {cms.institucional.cta1_label}
              </Link>
              <Link
                href={cms.institucional.cta2_href || '/municipalidades/kit'}
                className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {cms.institucional.cta2_label}
              </Link>
            </div>
          </div>
        </section>

        {/* F. FAQ */}
        <section
          id="faq"
          data-cms-section="territorio_faq"
          className="px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28 border-t border-border/60"
        >
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
                {cms.faqSettings.badge}
              </span>
              <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground font-existencial">
                {cms.faqSettings.title}
              </h2>
            </div>

            <div className="space-y-3">
              {cms.faqs.map(({ pregunta, respuesta }) => (
                <details
                  key={pregunta}
                  className="section-reveal faq-item group rounded-md border border-border/60 bg-surface-sunken/40 px-5 py-4 transition-colors hover:border-border"
                >
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-medium text-foreground rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span>{pregunta}</span>
                    <span
                      className="text-muted-foreground text-xl leading-none transition-transform duration-200 group-open:rotate-45 shrink-0"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 pr-6 text-sm text-muted-foreground leading-relaxed">
                    {respuesta}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              <Link
                href={cms.faqSettings.link1_href || '/planes-territoriales'}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {cms.faqSettings.link1_label || 'Ver planes avanzados'}
              </Link>
              {' · '}
              <Link
                href={cms.faqSettings.link2_href || '/carta'}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {cms.faqSettings.link2_label || 'Carta territorial'}
              </Link>
            </p>
          </div>
        </section>

        {/* G. CIERRE */}
        <section
          id="close"
          data-cms-section="territorio_censo"
          className="bg-surface-sunken px-6 sm:px-10 lg:px-20 py-20 sm:py-28 text-center border-t border-border/60"
        >
          <div className="max-w-xl mx-auto">
            <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase mb-2">
              {cms.censo.badge}
            </span>
            <h2 className="section-reveal font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-foreground text-balance mb-4">
              {cms.censo.title || `El censo cierra el ${cierre}`}
            </h2>
            <p className="section-reveal text-muted-foreground leading-relaxed mb-6 text-base sm:text-lg">
              {cms.censo.description}
            </p>
            <div className="section-reveal">
              <CensoCountdown targetDate={stats?.cierre} />
            </div>
            <div className="section-reveal flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link
                href={cms.censo.cta_primary_href || '/login?mode=signup'}
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground hover:opacity-95 transition-opacity shadow-sm active:scale-[0.99]"
              >
                {cms.censo.cta_primary_label}
              </Link>
              <Link
                href={cms.censo.cta_secondary_href || '/login'}
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-border px-8 py-3.5 text-sm font-medium text-foreground hover:bg-background transition-colors"
              >
                {cms.censo.cta_secondary_label}
              </Link>
            </div>
          </div>
        </section>
      </LandingAnimations>

      <TerritorioFooter />
    </main>
  );
}
