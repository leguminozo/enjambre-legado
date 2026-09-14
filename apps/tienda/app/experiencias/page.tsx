import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { FLORACIONES_EXPERIENCE } from '@/lib/experiencias/content';
import { ExperienceInquiryForm } from '@/components/experiencias/experience-inquiry-form';

import { getSiteContent } from '@/lib/cms';
import { parseExperienciasSettings } from '@enjambre/shop-chrome';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'Experiencias Bioculturales · La Obrera y el Zángano',
  description:
    'Encuentros privados de análisis sensorial y apiturismo de autor. Conducidos por Cristina Miranda en Santiago y en el archipiélago de Chiloé.',
  alternates: { canonical: `${SITE_URL}/experiencias` },
  openGraph: {
    title: 'Experiencias Bioculturales · La Obrera y el Zángano',
    description:
      'Encuentros privados de análisis sensorial y apiturismo de autor. Conducidos por Cristina Miranda en Santiago y Chiloé.',
    url: `${SITE_URL}/experiencias`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
    images: [{ url: `${SITE_URL}/assets/editorial/experiencias.jpg`, width: 1600, height: 900 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Experiencias Bioculturales · La Obrera y el Zángano',
    description:
      'Encuentros privados de análisis sensorial y apiturismo de autor conducidos por Cristina Miranda.',
  },
};

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

  const [talleresRows, expRows] = await Promise.all([
    getSiteContent('talleres', { draft }),
    getSiteContent('experiencias_settings', { draft }),
  ]);

  const cmsTalleres: TallerCmsItem[] = talleresRows
    .map((r) => (r.content as TallerCmsItem) ?? {})
    .filter((t) => Boolean(t?.title?.trim() || t?.desc?.trim()));

  const expSettings = parseExperienciasSettings(
    (expRows?.[0]?.content as Record<string, unknown>) ?? null,
  );

  return (
    <StoreShell>
      <ShopHeader />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/20">
          <div className="absolute inset-0">
            <Image
              src={expSettings.hero_image || '/assets/editorial/experiencias.jpg'}
              alt="Bosque nativo y apicultura en Chiloé"
              fill
              sizes="100vw"
              priority
              className="object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-background/85" />
          </div>

          <div className="relative px-4 text-center pt-[max(7.5rem,calc(env(safe-area-inset-top)+6rem))] pb-16 md:pb-24">
            <div className="max-w-3xl mx-auto">
              <span className="block text-[0.65rem] tracking-[0.45em] uppercase text-accent-text mb-4">
                {expSettings.hero_kicker}
              </span>
              <h1 className="font-display text-[clamp(2.25rem,7vw,4.5rem)] font-light text-foreground mb-5 text-balance leading-tight">
                {expSettings.hero_title}
              </h1>
              <p className="font-display italic text-base sm:text-xl text-muted-foreground max-w-xl mx-auto text-pretty mb-8 leading-relaxed">
                {expSettings.hero_subtitle}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={expSettings.hero_cta_href}
                  className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <span>{expSettings.hero_cta_label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href={expSettings.hero_secondary_href}
                  className="w-full sm:w-auto inline-flex min-h-12 items-center justify-center rounded-full border border-border/40 bg-surface-raised/40 px-6 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
                >
                  {expSettings.hero_secondary_label}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Formato Insignia Destacado: Floraciones del Bosque Austral ── */}
        <section className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                {expSettings.flagship_badge}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-light text-foreground">
                {expSettings.flagship_title}
              </h2>
            </div>

            <div className="rounded-2xl border border-border/30 bg-surface-raised/30 p-6 sm:p-10">
              <div className="grid md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-7 space-y-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    Análisis sensorial metódico de mieles nativas de temporada guiado por Cristina Miranda,
                    apicultora con 19 años de oficio en Pureo, Queilén.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Una experiencia de 90 a 120 minutos que articula técnica apícola, clima austral y maridaje
                    de contrapunto (quesos de guarda, masa madre, chocolate 85% de origen y agua pura para
                    limpieza de receptores).
                  </p>

                  <div className="pt-2">
                    <div className="text-[0.65rem] uppercase tracking-wider text-accent-text mb-2">
                      Principios rectores
                    </div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <span className="text-accent-text">•</span>
                        <span>Sin venta de productos en sala: resguardo del rigor sensorial.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-accent-text">•</span>
                        <span>Tarjeta física de registro en papel de alta gramaje para cada asistente.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-accent-text">•</span>
                        <span>Código de sesión único para adquisiciones y reservas diferidas (48–72h).</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 flex flex-wrap gap-3">
                    <Link
                      href={expSettings.flagship_href}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <span>{expSettings.flagship_cta_label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <a
                      href="#solicitud"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/40 bg-surface-raised/60 px-5 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent transition-colors"
                    >
                      <span>Cotizar fecha</span>
                    </a>
                  </div>
                </div>

                <div className="md:col-span-5 rounded-xl border border-border/20 bg-background/50 p-6 space-y-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent-text shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Aforo acotado</div>
                      <div>Corporativo: 10 a 20 | Íntimo: 6 a 10</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-text shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Duración</div>
                      <div>90 a 120 minutos continuos</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent-text shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">Ubicación</div>
                      <div>En oficinas del cliente, residencia privada o salón seleccionado</div>
                    </div>
                  </div>

                  <div className="border-t border-border/20 pt-4">
                    <div className="text-[0.65rem] uppercase tracking-wider text-accent-text mb-1">
                      Conducción
                    </div>
                    <div className="text-foreground font-medium">Cristina Miranda</div>
                    <div className="text-[0.7rem] text-muted-foreground">Apicultora en Pureo, Chiloé (km 8560)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Próximas Líneas del Programa / Talleres CMS ── */}
        <section
          data-cms-section="talleres"
          className="py-16 md:py-24 px-4 border-b border-border/20 bg-surface-raised/20"
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-2">
                {cmsTalleres.length > 0 ? 'Calendario de Sesiones' : 'En desarrollo'}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                {cmsTalleres.length > 0 ? 'Próximos Talleres y Encuentros' : 'Líneas territoriales e institucionales'}
              </h2>
            </div>

            {cmsTalleres.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {cmsTalleres.map((taller, idx) => {
                  const hasLink = taller.action && (taller.action.startsWith('/') || taller.action.startsWith('http'));
                  return (
                    <div key={idx} className="rounded-xl border border-border/30 bg-surface-raised/30 p-6 flex flex-col justify-between">
                      <div>
                        {taller.date && (
                          <span className="text-[0.65rem] uppercase tracking-wider text-accent-text font-medium">
                            {taller.date}
                          </span>
                        )}
                        <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2">
                          {taller.title}
                        </h3>
                        {taller.desc && (
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4 whitespace-pre-line">
                            {taller.desc}
                          </p>
                        )}
                      </div>
                      {taller.action && (
                        <div className="pt-2">
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
                <div className="rounded-xl border border-border/30 bg-surface-raised/30 p-6">
                  <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Chiloé · Temporada estival
                  </span>
                  <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2">
                    Inmersión Territorial en Pureo
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Caminata técnica por bosque nativo de la cordillera de la Costa chilota, visita a apiarios
                    en producción y cata en el origen mismo de la recolección. Acceso acotado bajo reserva previa.
                  </p>
                  <span className="inline-block text-[0.7rem] text-accent-text uppercase tracking-wider">
                    Disponible para grupos privados en temporada 2026–2027
                  </span>
                </div>

                <div className="rounded-xl border border-border/30 bg-surface-raised/30 p-6">
                  <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Gastronomía & Hotelería
                  </span>
                  <h3 className="font-display text-xl font-light text-foreground mt-1 mb-2">
                    Colaboraciones & Honey Pairing
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Desarrollo de experiencias sensoriales a medida para restaurantes de alta cocina, hoteles
                    boutique y coctelería de autor, incorporando mieles crudas y mieles en crema al relato de mesa.
                  </p>
                  <span className="inline-block text-[0.7rem] text-accent-text uppercase tracking-wider">
                    Coordinación directa vía B2B
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Formulario de Solicitud ── */}
        <section id="solicitud" className="py-20 md:py-28 px-4 border-b border-border/20">
          <div className="max-w-2xl mx-auto">
            <ExperienceInquiryForm initialFormat="corporativo" />
          </div>
        </section>

        {/* ── Club Legado Enlace ── */}
        <section className="py-12 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h3 className="font-display text-lg font-light text-foreground mb-1">
              Club Legado del Bosque
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Para quienes desean recibir recolecciones de temporada de forma periódica en su domicilio.
            </p>
            <Link
              href="/club-legado-del-bosque"
              className="inline-flex min-h-10 items-center text-xs font-semibold uppercase tracking-wider text-accent-text underline underline-offset-4 hover:text-accent transition-colors"
            >
              Conocer suscripción de recolecciones →
            </Link>
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
