import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  Compass,
  Home,
  BookOpen,
  Waves,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { ExperienceInquiryForm } from '@/components/experiencias/experience-inquiry-form';
import { getSiteContent } from '@/lib/cms';
import { parseExperienciasSettings, resolveLocalized, alignToClass } from '@enjambre/shop-chrome';
import { getLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/shop/page-metadata';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata('/experiencias', {
    title: 'Encuentros en el Bosque Austral · La Obrera y el Zángano',
    description:
      'Inmersión territorial en Chiloé, catas de mieles de Chile y talleres de técnica apícola. Sesiones a puerta cerrada conducidas por Cristina Miranda.',
  });
}

type TallerCmsItem = {
  date?: string;
  title?: string;
  desc?: string;
  action?: string;
};

export default async function ExperienciasPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const draft = resolvedParams.cms_preview === '1';

  const [talleresRows, expRows, locale] = await Promise.all([
    getSiteContent('talleres', { draft }),
    getSiteContent('experiencias_settings', { draft }),
    getLocale(),
  ]);

  const cmsTalleres: TallerCmsItem[] = talleresRows
    .map((r) => (r.content as TallerCmsItem) ?? {})
    .filter((t) => Boolean(t?.title?.trim() || t?.desc?.trim()));

  const expSettings = parseExperienciasSettings(
    (expRows?.[0]?.content as Record<string, unknown>) ?? null,
  );

  const heroKicker = resolveLocalized(expSettings.hero_kicker, expSettings.hero_kicker_en, locale);
  const heroTitle =
    resolveLocalized(expSettings.hero_title, expSettings.hero_title_en, locale) ||
    'Encuentros en el Bosque Austral';
  const heroSubtitle = resolveLocalized(expSettings.hero_subtitle, expSettings.hero_subtitle_en, locale);
  const heroImage =
    expSettings.hero_image || '/assets/editorial/hero-bosque-apertura.jpg';
  const heroOpacity = expSettings.hero_image_opacity ?? 45;
  const heroCtaLabel = resolveLocalized(expSettings.hero_cta_label, expSettings.hero_cta_label_en, locale);
  const heroCtaHref = expSettings.hero_cta_href || '#encuentros';
  const heroSecondaryLabel =
    resolveLocalized(expSettings.hero_secondary_label, expSettings.hero_secondary_label_en, locale);
  const heroSecondaryHref = expSettings.hero_secondary_href || '#solicitud';

  const flagshipBadge =
    resolveLocalized(expSettings.flagship_badge, expSettings.flagship_badge_en, locale);
  const flagshipTitle =
    resolveLocalized(expSettings.flagship_title, expSettings.flagship_title_en, locale);
  const flagshipDesc =
    resolveLocalized(expSettings.flagship_desc, expSettings.flagship_desc_en, locale);
  const flagshipCtaLabel =
    resolveLocalized(expSettings.flagship_cta_label, expSettings.flagship_cta_label_en, locale);
  const flagshipHref = expSettings.flagship_href || '/experiencias/degustaciones';

  return (
    <StoreShell>
      <ShopHeader />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero Cinemático & Editorial: Presencia en el Bosque ── */}
        <EditorialHero
          sectionKey="experiencias_settings"
          kicker={heroKicker}
          title={heroTitle}
          subtitle={heroSubtitle}
          imageUrl={heroImage}
          imageOpacity={heroOpacity}
          imageAlt="Bosque nativo templado lluvioso en Chiloé"
          align={expSettings.text_align}
          ctaLabel={heroCtaLabel}
          ctaHref={heroCtaHref}
          secondaryCtaLabel={heroSecondaryLabel}
          secondaryCtaHref={heroSecondaryHref}
          preferAnchor
        >
          {/* Badges de especificación editorial */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto text-left border-y border-border/30 py-4 backdrop-blur-xs">
            <div className="border-r border-border/20 pr-2">
              <span className="block text-[0.6rem] uppercase tracking-wider text-accent-text">3 Vertientes</span>
              <span className="text-xs text-foreground font-medium">Territorio · Cata · Taller</span>
            </div>
            <div className="border-r border-border/20 pr-2 pl-2">
              <span className="block text-[0.6rem] uppercase tracking-wider text-accent-text">Ubicación</span>
              <span className="text-xs text-foreground font-medium">Chiloé & Santiago</span>
            </div>
            <div className="pl-2">
              <span className="block text-[0.6rem] uppercase tracking-wider text-accent-text">Formato</span>
              <span className="text-xs text-foreground font-medium">Puerta cerrada</span>
            </div>
          </div>
        </EditorialHero>

        {/* ── Trilogía de Encuentros: Tarjetas Editoriales Vivas ── */}
        <section id="encuentros" className="py-20 md:py-28 px-4 sm:px-6 border-b border-border/20 bg-surface-sunken/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-3">
                Trilogía de Encuentros
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-foreground text-balance">
                Tres formas de conectar con el bosque
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Cada formato responde a un nivel distinto de inmersión: la estadía viva en el archipiélago, el análisis sensorial guiado o la técnica apícola directa en apiarios nativos.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Card 1: Territorio */}
              <div className="group rounded-3xl border border-border/40 bg-card overflow-hidden flex flex-col justify-between hover:border-accent/60 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50">
                <div>
                  {/* Fotografía de portada con gradiente */}
                  <div className="relative h-60 w-full overflow-hidden bg-surface-raised">
                    <Image
                      src="/assets/editorial/hero-bosque-tronco.jpg"
                      alt="Cabaña y bosque templado en Pureo, Chiloé"
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-block rounded-full bg-background/80 backdrop-blur-md border border-border/40 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                        01 · Inmersión Física · Chiloé
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7">
                    <h3 className="font-display text-2xl font-light text-foreground mb-3 group-hover:text-accent transition-colors">
                      Territorio & Bosque Austral
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                      Estadía privada en cabaña de madera nativa con fogón a leña, navegación en kayak por esteros protegidos y ronda de colmenas entre Ulmos centenarios en Queilén.
                    </p>

                    <div className="space-y-2.5 border-t border-border/20 pt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Home className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Espacio: Cabaña nativa en Predio Pureo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Aforo: Estadías privadas de 2 a 6 personas</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Duración: Programas de 3 a 5 días</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-7 pt-0">
                  <Link
                    href="/experiencias/territorio"
                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/60 bg-surface-raised/60 px-5 text-xs font-semibold uppercase tracking-wider text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                  >
                    <span>Conocer estancia en Chiloé</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Degustaciones (Insignia Nacional) */}
              <div className="group rounded-3xl border border-accent/40 bg-card overflow-hidden flex flex-col justify-between hover:border-accent transition-all duration-300 shadow-xl shadow-accent/5 hover:shadow-2xl hover:shadow-accent/15 relative">
                {flagshipBadge ? (
                  <div className="absolute top-0 right-0 z-20 bg-accent text-accent-foreground px-4 py-1 text-[0.65rem] font-bold uppercase tracking-widest rounded-bl-xl shadow-sm">
                    {flagshipBadge}
                  </div>
                ) : null}

                <div>
                  {/* Fotografía de portada con gradiente */}
                  <div className="relative h-60 w-full overflow-hidden bg-surface-raised">
                    <Image
                      src="/assets/editorial/honey-jar.png"
                      alt={flagshipTitle}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-contain p-6 group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-block rounded-full bg-background/80 backdrop-blur-md border border-accent/40 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                        02 · Cata Sensorial · Nacional
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7">
                    <h3 className="font-display text-2xl font-light text-foreground mb-3 group-hover:text-accent transition-colors">
                      {flagshipTitle}
                    </h3>
                    <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-line ${alignToClass(expSettings.text_align)}`}>
                      {flagshipDesc}
                    </p>

                    <div className="space-y-2.5 border-t border-border/20 pt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Mieles de contraste: Atacama a Patagonia</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Aforo: Corporativo (10-20) | Íntimo (6-10)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Duración: 90 a 120 minutos continuos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-7 pt-0">
                  <Link
                    href={flagshipHref}
                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
                  >
                    <span>{flagshipCtaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Talleres */}
              <div className="group rounded-3xl border border-border/40 bg-card overflow-hidden flex flex-col justify-between hover:border-accent/60 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50">
                <div>
                  {/* Fotografía de portada con gradiente */}
                  <div className="relative h-60 w-full overflow-hidden bg-surface-raised">
                    <Image
                      src="/assets/editorial/hero-hueco.jpg"
                      alt="Talleres de técnica apícola en bosque nativo"
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-block rounded-full bg-background/80 backdrop-blur-md border border-border/40 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                        03 · Técnica Apícola · Chiloé
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7">
                    <h3 className="font-display text-2xl font-light text-foreground mb-3 group-hover:text-accent transition-colors">
                      Talleres de Técnica Apícola
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                      Manejo técnico de la colmena, sanidad y adaptación biológica en el bosque templado lluvioso. Apertura de colmenas reales junto a Cristina Miranda en apiarios productivos.
                    </p>

                    <div className="space-y-2.5 border-t border-border/20 pt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Enfoque: Maestría y práctica en apiario</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Aforo: Grupos técnicos reducidos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-accent-text shrink-0" />
                        <span>Modalidad: Jornadas intensivas por temporada</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-7 pt-0">
                  <Link
                    href="/experiencias/talleres"
                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/60 bg-surface-raised/60 px-5 text-xs font-semibold uppercase tracking-wider text-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all"
                  >
                    <span>Ver programas técnicos</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Showcase Editorial: El Kit en Mesa & El Protocolo Sensorial ── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 border-b border-border/20 bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border/40 bg-surface-raised/30 p-8 sm:p-12 lg:p-16 relative overflow-hidden">
              <div className="grid lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                      El Estándar de Degustación
                    </span>
                    <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground leading-tight">
                      Lo que llega a la mesa en cada sesión
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Nuestras sesiones no son charlas teóricas: son ceremonias sensoriales estructuradas con un kit físico de alta precisión que permanece en manos de los asistentes.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-start gap-3 rounded-2xl border border-border/30 bg-background/50 p-4">
                      <CheckCircle2 className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-foreground">4 a 6 Mieles de Contraste</div>
                        <div className="text-[0.7rem] text-muted-foreground mt-0.5">Desde Atacama hasta la estepa de Aysén.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-border/30 bg-background/50 p-4">
                      <CheckCircle2 className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-foreground">Rueda Sensorial Impresa</div>
                        <div className="text-[0.7rem] text-muted-foreground mt-0.5">Papel de alto gramaje para mapeo de notas botánicas.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-border/30 bg-background/50 p-4">
                      <CheckCircle2 className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-foreground">Maridaje de Contrapunto</div>
                        <div className="text-[0.7rem] text-muted-foreground mt-0.5">Queso de guarda, masa madre y cacao de origen 85%.</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl border border-border/30 bg-background/50 p-4">
                      <CheckCircle2 className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-foreground">Cierre Diferido (48–72h)</div>
                        <div className="text-[0.7rem] text-muted-foreground mt-0.5">Sin venta de productos en sala: resguardo del rigor.</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap gap-4 items-center">
                    <Link
                      href="/experiencias/degustaciones"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <span>Ver experiencia de cata</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <a
                      href="#solicitud"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/60 bg-surface-raised/60 px-6 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
                    >
                      Cotizar fecha privada
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-2xl border border-border/30 bg-background/80 p-6 sm:p-8 space-y-5 backdrop-blur-md">
                    <span className="font-mono text-[0.65rem] uppercase tracking-widest text-accent-text">
                      Protocolo de 4 Movimientos
                    </span>
                    <ul className="space-y-4 text-xs">
                      <li className="flex items-start gap-3">
                        <span className="font-mono text-accent-text font-bold text-sm">I.</span>
                        <div>
                          <div className="font-medium text-foreground">Reconocimiento Óptico & Textura</div>
                          <div className="text-muted-foreground text-[0.7rem]">Densidad, cristalización natural y coloración en luz rasante.</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="font-mono text-accent-text font-bold text-sm">II.</span>
                        <div>
                          <div className="font-medium text-foreground">Perfil Olfativo Directo</div>
                          <div className="text-muted-foreground text-[0.7rem]">Apertura de aromas, terpenos y notas florales del bosque nativo.</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="font-mono text-accent-text font-bold text-sm">III.</span>
                        <div>
                          <div className="font-medium text-foreground">Ataque en Boca & Acidez</div>
                          <div className="text-muted-foreground text-[0.7rem]">Despliegue palatino, evolución del dulzor y persistencia retronasal.</div>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="font-mono text-accent-text font-bold text-sm">IV.</span>
                        <div>
                          <div className="font-medium text-foreground">Contrapunto & Maridaje</div>
                          <div className="text-muted-foreground text-[0.7rem]">Diálogo con fermentos vivos, salinidad y limpieza de receptores.</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Calendario de Sesiones / Talleres CMS ── */}
        <section
          data-cms-section="talleres"
          className="py-20 md:py-24 px-4 sm:px-6 border-b border-border/20 bg-surface-raised/20"
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 text-center">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                Agenda de Formación
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground">
                Próximos Talleres y Encuentros
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Fechas confirmadas y programas especiales en Chiloé y Santiago.
              </p>
            </div>

            {cmsTalleres.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {cmsTalleres.map((taller, idx) => {
                  const hasLink = taller.action && (taller.action.startsWith('/') || taller.action.startsWith('http'));
                  return (
                    <div key={idx} className="rounded-2xl border border-border/30 bg-card p-6 flex flex-col justify-between hover:border-accent/40 transition-colors">
                      <div>
                        {taller.date && (
                          <span className="inline-block rounded-full bg-accent/10 border border-accent/20 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-accent-text font-medium mb-3">
                            {taller.date}
                          </span>
                        )}
                        <h3 className="font-display text-xl font-light text-foreground mb-2">
                          {taller.title}
                        </h3>
                        {taller.desc && (
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">
                            {taller.desc}
                          </p>
                        )}
                      </div>
                      {taller.action && (
                        <div className="pt-2 border-t border-border/20">
                          {hasLink ? (
                            <Link
                              href={taller.action}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text hover:underline"
                            >
                              <span>Más información</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <a
                              href="#solicitud"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text hover:underline"
                            >
                              <span>{taller.action}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border/30 bg-card p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-mono">
                      Chiloé · Temporada estival
                    </span>
                    <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2">
                      Inmersión Territorial en Pureo
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      Caminata técnica por bosque nativo de la cordillera de la Costa chilota, visita a apiarios en producción y kayak en esteros protegidos.
                    </p>
                  </div>
                  <Link
                    href="/experiencias/territorio"
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent-text hover:underline pt-2"
                  >
                    <span>Conocer estancia en Chiloé</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-border/30 bg-card p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-mono">
                      Gastronomía & Hotelería
                    </span>
                    <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2">
                      Colaboraciones & Honey Pairing
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      Desarrollo de experiencias sensoriales a medida para restaurantes de alta cocina, hoteles boutique y coctelería de autor.
                    </p>
                  </div>
                  <Link
                    href="/alianzas/hoteles"
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent-text hover:underline pt-2"
                  >
                    <span>Alianzas para hoteles y gastronomía</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Formulario de Solicitud Directa ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-2xl mx-auto">
            <ExperienceInquiryForm initialFormat="corporativo" />
          </div>
        </section>

        {/* ── Club Legado Enlace ── */}
        <section className="py-12 px-4 text-center">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="font-display text-lg font-light text-foreground">
              Club Legado del Bosque
            </h3>
            <p className="text-xs text-muted-foreground">
              Para quienes desean recibir recolecciones de temporada de forma periódica en su domicilio.
            </p>
            <div>
              <Link
                href="/club-legado-del-bosque"
                className="inline-flex min-h-10 items-center text-xs font-semibold uppercase tracking-wider text-accent-text underline underline-offset-4 hover:text-accent transition-colors"
              >
                Conocer membresía de recolecciones →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
