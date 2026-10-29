import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { ArrowRight, ArrowUpRight, FileText, Link2, Wallet } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/shop/json-ld';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('embajadores');
  const title = `${t('title')} · La Obrera y el Zángano`;
  const description = t('subtitle');
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/embajadores` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/embajadores`,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_CL',
      siteName: 'La Obrera y el Zángano',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function EmbajadoresPage() {
  const t = await getTranslations('embajadores');
  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: t('breadcrumb'), href: '/embajadores' },
  ]);

  const steps = [
    { n: '01', title: t('step1Title'), desc: t('step1Desc') },
    { n: '02', title: t('step2Title'), desc: t('step2Desc') },
    { n: '03', title: t('step3Title'), desc: t('step3Desc') },
  ];

  const benefits = [
    { icon: Link2, title: t('benefit1Title'), desc: t('benefit1Desc') },
    { icon: Wallet, title: t('benefit2Title'), desc: t('benefit2Desc') },
    { icon: FileText, title: t('benefit3Title'), desc: t('benefit3Desc') },
  ];

  const faqs = [
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
  ];

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero Editorial: Red de Creadores y Embajadores ── */}
        <EditorialHero
          kicker={t('kicker')}
          title={t('title')}
          subtitle={t('subtitle')}
          variant="editorial"
          ctaLabel={t('cta')}
          ctaHref="/perfil/solicitar-creador"
          secondaryCtaLabel={t('secondaryCta')}
          secondaryCtaHref="/alianzas"
          scrollCueLabel="Explorar programa y beneficios"
        />

        <section className="py-16 md:py-24 px-4 border-b border-border/20">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-center mb-12">
              {t('stepsTitle')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="rounded-2xl border border-border/40 bg-card p-6">
                  <p className="font-mono text-xs text-accent-text mb-3">{s.n}</p>
                  <h3 className="font-display text-xl text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 border-b border-border/20 bg-surface-sunken/30">
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-4 sm:grid-cols-3">
              {benefits.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="rounded-2xl border border-border/40 bg-card p-6">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent-text mb-4">
                      <Icon size={20} />
                    </span>
                    <h3 className="font-display text-xl text-foreground mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-center text-xs text-muted-foreground">{t('referNote')}</p>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4 border-b border-border/20">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground text-center mb-10">
              {t('faqTitle')}
            </h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-border/40 bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{f.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground">
              {t('finalTitle')}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t('finalDesc')}</p>
            <Link
              href="/perfil/solicitar-creador"
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
            >
              <span>{t('cta')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
