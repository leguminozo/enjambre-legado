import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Coffee,
  Hotel,
  ShoppingBag,
  Award,
  Users,
  ArrowRight,
  ShieldCheck,
  Truck,
  FileText,
  Sparkles,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/shop/json-ld';
import { B2BRegisterForm } from '@/components/b2b/b2b-register-form';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Alianzas & Negocios · La Obrera y el Zángano',
  description:
    'Soluciones mayoristas y programas de colaboración para cafeterías de especialidad, hoteles, tiendas gourmet, ferias y revendedores. Miel cruda de bosque nativo con trazabilidad certificada.',
  alternates: { canonical: `${SITE_URL}/para` },
  openGraph: {
    title: 'Alianzas & Negocios · La Obrera y el Zángano',
    description:
      'Formatos institucionales, amenities y abastecimiento de miel cruda de Chiloé para cafeterías, hoteles y tiendas de autor.',
    url: `${SITE_URL}/para`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
    images: [{ url: `${SITE_URL}/images/b2b/hero-cafeterias.jpg`, width: 1600, height: 900 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alianzas & Negocios · La Obrera y el Zángano',
    description:
      'Soluciones comerciales y distribución de miel nativa de Chiloé para negocios y espacios gastronómicos.',
  },
};

const SEGMENT_CARDS = [
  {
    slug: 'cafeterias',
    title: 'Cafeterías de Especialidad',
    icon: Coffee,
    badge: 'Barismo & Repostería',
    description:
      'Sachets monodosis para servicio de barra, miel cruda a granel para repostería fina y descriptores de cata para maridar con orígenes de café.',
    highlights: ['Sachets 15g sellados', 'Formato granel 1.2kg y 5kg', 'Fichas de cata para baristas'],
    image: '/images/b2b/hero-cafeterias.jpg',
  },
  {
    slug: 'hoteles',
    title: 'Hoteles & Amenities',
    icon: Hotel,
    badge: 'Hospitalidad de Lujo',
    description:
      'Frascos de cortesía de 40g para habitaciones, dispensadores elegantes para buffets de desayuno y amenities formulados con propóleo virgen.',
    highlights: ['Frascos miniatura 40g', 'Línea de cuidado con cera y propóleo', 'Presentación en madera nativa'],
    image: '/images/b2b/hero-hoteles.jpg',
  },
  {
    slug: 'tiendas-gourmet',
    title: 'Tiendas Gourmet & Emporios',
    icon: ShoppingBag,
    badge: 'Retail Seleccionado',
    description:
      'Ediciones numeradas de autor con pasaporte de lote QR, material de exhibición en madera recuperada y márgenes comerciales protegidos.',
    highlights: ['Embalaje de lujo para regalo', 'Exhibidores POP de bosque nativo', 'Rotación y reposición prioritaria'],
    image: '/images/b2b/hero-tiendas-gourmet.jpg',
  },
  {
    slug: 'ferias',
    title: 'Ferias & Eventos Bioculturales',
    icon: Award,
    badge: 'Activaciones de Marca',
    description:
      'Packs de degustación sensorial, presencia en stands gastronómicos de autor y regalos institucionales que cuentan la historia del bosque chilote.',
    highlights: ['Muestras sensoriales guiadas', 'Regalos corporativos con grabado', 'Soporte narrativo y folletería'],
    image: '/images/b2b/hero-ferias.jpg',
  },
  {
    slug: 'revendedores',
    title: 'Programa de Revendedores',
    icon: Users,
    badge: 'Embajadores Territoriales',
    description:
      'Para personas y pequeños distribuidores que comparten nuestra visión biocultural. Margen por volumen, catálogo digital y soporte logístico continuo.',
    highlights: ['Escala progresiva de descuentos', 'Acceso a terminal de venta en ferias', 'Capacitación en producto y origen'],
    image: '/images/b2b/hero-revendedores.jpg',
  },
];

export default function ParaHubPage() {
  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Alianzas & Negocios', href: '/para' },
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
              src="/images/b2b/hero-cafeterias.jpg"
              alt="Alianzas comerciales de La Obrera y el Zángano"
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-background/85" />
          </div>

          <div className="relative px-4 text-center pt-[max(7.5rem,calc(env(safe-area-inset-top)+6rem))] pb-16 md:pb-24 max-w-4xl mx-auto">
            <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-4">
              Canal Mayorista & Colaboraciones
            </span>
            <h1 className="font-display text-[clamp(2.25rem,6.5vw,4.5rem)] font-light text-foreground mb-5 text-balance leading-tight">
              El Bosque Austral en tu Espacio
            </h1>
            <p className="font-display italic text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-8 leading-relaxed">
              Miel cruda de bosque nativo de Chiloé, cosechada con rigor biocultural y trazabilidad verificable.
              Formatos diseñados para la hospitalidad, la gastronomía y el comercio consciente.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#solicitud"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <span>Solicitar catálogo mayorista</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="#segmentos"
                className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full border border-border/40 bg-surface-raised/40 px-6 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
              >
                Explorar segmentos
              </a>
            </div>
          </div>
        </section>

        {/* ── Segmentos B2B ── */}
        <section id="segmentos" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                Formatos a Medida
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground text-balance">
                Cinco propuestas para diferentes tipos de espacio
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Selecciona tu área de actividad para conocer los formatos específicos, volúmenes de entrega y
                ventajas comerciales asociadas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SEGMENT_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.slug}
                    href={`/para/${card.slug}`}
                    className="group rounded-2xl border border-border/40 bg-card p-6 flex flex-col justify-between hover:border-accent/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-semibold">
                          {card.badge}
                        </span>
                      </div>

                      <h3 className="font-display text-xl font-light text-foreground mb-2 group-hover:text-accent transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        {card.description}
                      </p>

                      <ul className="space-y-1 text-[11px] text-foreground/80 border-t border-border/20 pt-3 mb-4">
                        {card.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-1.5">
                            <span className="text-accent-text">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text pt-2">
                      <span>Ver propuesta completa</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Pilares de Confianza Operativa ── */}
        <section className="py-16 md:py-24 px-4 border-b border-border/20 bg-surface-raised/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="block text-[0.65rem] tracking-[0.3em] uppercase text-accent-text mb-2">
                Garantías del Canal Directo
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                Por qué asociarte con La Obrera y el Zángano
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
              <div className="rounded-2xl border border-border/30 bg-card p-5">
                <ShieldCheck className="w-6 h-6 text-accent-text mb-3 mx-auto sm:mx-0" />
                <h4 className="font-display text-base font-light text-foreground mb-1">
                  Pureza Certificada
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cada lote cuenta con análisis de laboratorio acreditado: humedad controlada (menor a 18%), sin aditivos ni pasteurización.
                </p>
              </div>

              <div className="rounded-2xl border border-border/30 bg-card p-5">
                <Truck className="w-6 h-6 text-accent-text mb-3 mx-auto sm:mx-0" />
                <h4 className="font-display text-base font-light text-foreground mb-1">
                  Despacho Nacional
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Envíos protegidos a todo Chile con courier prioritario y reposición asegurada en caso de quiebre o demora.
                </p>
              </div>

              <div className="rounded-2xl border border-border/30 bg-card p-5">
                <FileText className="w-6 h-6 text-accent-text mb-3 mx-auto sm:mx-0" />
                <h4 className="font-display text-base font-light text-foreground mb-1">
                  Facturación Formal
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Emisión inmediata de Factura Electrónica (afecta o exenta según el producto) con RUT de empresa y soporte tributario.
                </p>
              </div>

              <div className="rounded-2xl border border-border/30 bg-card p-5">
                <Sparkles className="w-6 h-6 text-accent-text mb-3 mx-auto sm:mx-0" />
                <h4 className="font-display text-base font-light text-foreground mb-1">
                  Soporte de Marca
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Material gráfico, fichas técnicas de origen y apoyo en el relato de producto para capacitar a tu equipo de atención.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Formulario de Registro / Solicitud ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <span className="block text-[0.65rem] tracking-[0.3em] uppercase text-accent-text mb-2">
                Registro de Alianzas
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                Inicia una conversación comercial
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Completa tus datos y nos pondremos en contacto en menos de 24 horas hábiles con la lista de precios mayoristas y condiciones de entrega.
              </p>
            </div>

            <B2BRegisterForm
              segmentType="otro"
              segmentLabel="Alianzas y Negocios"
              kind="punto_venta"
            />
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
