import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Award, FlaskConical, Building2, UtensilsCrossed, Hotel, ShoppingBag } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent } from '@/lib/cms';
import { parseB2BHubSettings, resolveLocalized, alignToClass } from '@enjambre/shop-chrome';
import { getLocale } from 'next-intl/server';
import { B2BWholesaleSimulator } from '@/components/b2b/b2b-wholesale-simulator';
import { B2BRegisterForm } from '@/components/b2b/b2b-register-form';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Canal Mayorista & Aliados Gourmet | Enjambre Legado',
  description:
    'Suministro institucional de miel nativa virgen de Chiloé para alta gastronomía, hotelería boutique y tiendas especializadas. Factura electrónica DTE 33 y certificación de origen.',
  alternates: { canonical: `${SITE_URL}/mayorista` },
  openGraph: {
    title: 'Canal Mayorista & Aliados Gourmet | Enjambre Legado',
    description:
      'Miel nativa virgen de bosque templado lluvioso para la alta cocina y hotelería de excelencia.',
    url: `${SITE_URL}/mayorista`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
};

interface PageProps {
  searchParams?: Promise<{ cms_preview?: string }>;
}

export default async function MayoristaPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const [rows, locale] = await Promise.all([
    getSiteContent('b2b_hub_settings', { draft }),
    getLocale(),
  ]);

  const cmsRaw = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const settings = parseB2BHubSettings(cmsRaw);

  const heroKicker =
    resolveLocalized(settings.hero_kicker, settings.hero_kicker_en, locale) ||
    'Alianzas Institucionales B2B';
  const heroTitle =
    resolveLocalized(settings.hero_title, settings.hero_title_en, locale) ||
    'Miel Virgen de Chiloé para Mesas de Alta Gama';
  const heroSubtitle =
    resolveLocalized(settings.hero_subtitle, settings.hero_subtitle_en, locale) ||
    'Suministro exclusivo para restaurantes de alta cocina, hoteles boutique y emporios selectos. Lotes certificados de recolección estacional, sin pasteurizar y con factura electrónica formal.';
  const garantiasKicker =
    resolveLocalized(settings.garantias_kicker, settings.garantias_kicker_en, locale) ||
    'Entornos de Excelencia';
  const garantiasTitle =
    resolveLocalized(settings.garantias_title, settings.garantias_title_en, locale) ||
    'Diseñado para Quienes Valoran el Origen';

  return (
    <StoreShell>
      <ShopHeader />

      <main
        data-cms-section="b2b_hub_settings"
        className="min-h-[var(--vh-full)] bg-background text-foreground"
      >
        {/* Hero Section */}
        <section className="relative pt-[max(7.5rem,calc(env(safe-area-inset-top)+6rem))] pb-20 px-4 overflow-hidden border-b border-border/40">
          <div className="max-w-5xl xl:max-w-6xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-widest font-mono">
              <Award className="w-3.5 h-3.5" />
              <span>{heroKicker}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-light text-foreground text-balance max-w-4xl lg:max-w-5xl mx-auto leading-[1.08]">
              {heroTitle}
            </h1>

            <p className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl lg:max-w-4xl mx-auto font-light text-pretty leading-relaxed whitespace-pre-line ${alignToClass(settings.text_align)}`}>
              {heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Facturación DTE 33 (SII)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-primary" /> Certificación de Laboratorio
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" /> Condiciones desde 12 Frascos
              </span>
            </div>
          </div>
        </section>

        {/* Segmentos Gourmet */}
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs uppercase tracking-widest text-primary font-mono block">
              {garantiasKicker}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-foreground">
              {garantiasTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 border border-border bg-card/40 space-y-4 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl text-foreground">Alta Cocina & Coctelería</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mieles monoflorales de Ulmo, Tiaca y Melí con perfil aromático intacto. Textura cremosa natural
                para reducciones, emulsiones, pastelería fina y maridajes de autor.
              </p>
            </div>

            <div className="card p-6 border border-border bg-card/40 space-y-4 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Hotel className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl text-foreground">Hotelería Boutique</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Desayunos memorables con pasaporte digital individual. Cada huésped puede escanear el QR
                y conocer el bosque nativo y el apiario exacto de Chiloé del cual proviene su miel.
              </p>
            </div>

            <div className="card p-6 border border-border bg-card/40 space-y-4 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl text-foreground">Tiendas Especializadas</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Embalaje de lujo en vidrio pesado, precinto de seguridad territorial y material gráfico
                explicativo del archipiélago para vitrinas y emporios de productos de autor.
              </p>
            </div>
          </div>
        </section>

        {/* Simulador Interactivo */}
        <section className="py-12 px-4 max-w-4xl mx-auto">
          <B2BWholesaleSimulator />
        </section>

        {/* Formulario de Registro / Alta de Aliado */}
        <section id="registro-b2b" className="py-16 px-4 max-w-3xl mx-auto border-t border-border/40 scroll-mt-28 md:scroll-mt-36">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs uppercase tracking-widest text-primary font-mono block">
              Apertura de Cuenta
            </span>
            <h2 className="font-display text-3xl text-foreground">
              Solicita tu Cuenta de Aliado Institucional
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Completa tus datos comerciales para acceder al catálogo con precios netos mayoristas y
              modalidades de pago a crédito.
            </p>
          </div>

          <div className="card p-6 sm:p-8 border border-border bg-card rounded-2xl shadow-xl">
            <B2BRegisterForm segmentType="tienda_gourmet" segmentLabel="Aliado B2B Institucional" />
          </div>

          <div className="text-center mt-8 text-xs text-muted-foreground">
            ¿Ya tienes cuenta activa de aliado?{' '}
            <Link href="/perfil/mayorista" className="text-primary hover:underline font-medium">
              Accede a tu portal institucional aquí →
            </Link>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
