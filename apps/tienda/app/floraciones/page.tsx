import type { Metadata } from 'next';
import Link from 'next/link';
import { Flower2, ArrowRight, ShieldCheck, Compass, MapPin } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { EditorialHero } from '@/components/shop/editorial-hero';
import { CienciaCanvas } from '@/components/shop/ciencia-canvas';
import { JsonLd } from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/shop/json-ld';
import { FloracionReservaModal } from '@/components/floraciones/floracion-reserva-modal';
import { MapaFloraciones } from '@/components/floraciones/mapa-floraciones';
import { fetchFloracionesVivas, fetchLotesFloracion } from '@/lib/floraciones/vivo';
import { getSiteContent } from '@/lib/cms';
import { getLocale } from 'next-intl/server';
import { parseFloracionesPageSettings, resolveLocalized, parseBotanicalMonographs } from '@enjambre/shop-chrome';
import { formatCalendarDate } from '@enjambre/ui';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

interface PageProps {
  searchParams?: Promise<{ cms_preview?: string }>;
}

// ISR horario: el bosque cambia lento; el BFF agrega y anonimiza (sin Postgres por visita).
export const revalidate = 3600;

const FLORACION_RECIENTE_DIAS = 90;

export const metadata: Metadata = {
  title: 'Floraciones Nativas de Chiloé · Calendario Botánico y Origen',
  description:
    'Conoce el ciclo de floración del bosque templado lluvioso en Chiloé: Ulmo, Tiaca, Melí y Tepú. Mieles crudas monoflorales de recolección estacional.',
  alternates: { canonical: `${SITE_URL}/floraciones` },
  openGraph: {
    title: 'Floraciones Nativas de Chiloé · Calendario Botánico y Origen',
    description:
      'El calendario fenológico del bosque austral. Mieles vírgenes de Ulmo, Tiaca y bosque nativo protegidas por abejas en Chiloé.',
    url: `${SITE_URL}/floraciones`,
    type: 'website',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
};

interface EspecieBotanica {
  nombreComun: string;
  nombreCientifico: string;
  temporada: string;
  mesesFloracion: string;
  colorMiel: string;
  descriptores: string[];
  notasSensoriales: string;
  maridaje: string;
  slugProducto?: string;
}

const ESPECIES_NATIVAS: EspecieBotanica[] = [
  {
    nombreComun: 'Ulmo',
    nombreCientifico: 'Eucryphia cordifolia',
    temporada: 'Verano Austral',
    mesesFloracion: 'Enero – Marzo',
    colorMiel: 'Blanco marfil a ámbar perlado',
    descriptores: ['Aroma floral a jazmín', 'Textura cremosa natural', 'Final aterciopelado'],
    notasSensoriales:
      'La floración insignia del archipiélago. Su néctar da lugar a una miel untable espontánea, con notas cálidas a toffee suave, vainilla y flor blanca recién abierta.',
    maridaje: 'Quesos de pasta blanda, higos frescos, té Earl Grey y tostadas de centeno.',
    slugProducto: 'miel-ulmo-puro-pureo',
  },
  {
    nombreComun: 'Tiaca',
    nombreCientifico: 'Caldcluvia paniculata',
    temporada: 'Primavera Austral',
    mesesFloracion: 'Noviembre – Diciembre',
    colorMiel: 'Ámbar claro y traslúcido',
    descriptores: ['Frescor herbal silvestre', 'Acidez cítrica sutil', 'Cristalización fina'],
    notasSensoriales:
      'Brota en las quebradas húmedas junto a cursos de agua. Su perfil es ligero, vibrante y balsámico, con un retrogusto fresco que equilibra la dulzura.',
    maridaje: 'Quesos de cabra madurados, infusiones de menta o melisa, y vinagretas de ensalada verde.',
    slugProducto: 'miel-tiaca-valdiviana',
  },
  {
    nombreComun: 'Melí',
    nombreCientifico: 'Amomyrtus meli',
    temporada: 'Pleno Verano',
    mesesFloracion: 'Diciembre – Enero',
    colorMiel: 'Dorado intenso',
    descriptores: ['Especias de mirto', 'Aroma resinoso', 'Complejidad profunda'],
    notasSensoriales:
      'Árbol endémico de la familia de las mirtáceas. Aporta un carácter balsámico inconfundible con matices a pimienta dulce, clavo de olor y madera nativa.',
    maridaje: 'Carnes asadas de caza, tablas de charcutería curada y panes rústicos con masa madre.',
    slugProducto: 'miel-meli-selva-costera',
  },
  {
    nombreComun: 'Tepú',
    nombreCientifico: 'Tepualia stipularis',
    temporada: 'Otoño Austral',
    mesesFloracion: 'Febrero – Abril',
    colorMiel: 'Ámbar rojizo oscuro',
    descriptores: ['Notas de turba y musgo', 'Mineralidad marina', 'Gran persistencia'],
    notasSensoriales:
      'Crecen en los tepuales pantanosos de Chiloé donde la tierra y el mar se entrelazan. Es una miel de paladar denso, mineral, con notas de melaza pura y bosque húmedo.',
    maridaje: 'Quesos azules potentes (Roquefort, Gorgonzola), café de especialidad y frutos secos tostados.',
    slugProducto: 'miel-bosque-nativo-chiloe',
  },
];

export default async function FloracionesBotanicasPage({ searchParams }: PageProps) {
  const jsonLdData = breadcrumbJsonLd([
    { name: 'Inicio', href: '/' },
    { name: 'Floraciones Nativas', href: '/floraciones' },
  ]);

  const sp = searchParams ? await searchParams : undefined;
  const draft = sp?.cms_preview === '1';

  const [vivas, lotes, rows, monografiasRows, locale] = await Promise.all([
    fetchFloracionesVivas(),
    fetchLotesFloracion(),
    getSiteContent('floraciones_page_settings', { draft }),
    getSiteContent('origen_monografias', { draft }),
    getLocale(),
  ]);

  const monographs = parseBotanicalMonographs(monografiasRows?.map((r) => r.content) ?? null);
  const especies = monographs.map((mono) => {
    const matchingEspecie = ESPECIES_NATIVAS.find(
      (e) =>
        mono.common_name.toLowerCase().includes(e.nombreComun.toLowerCase()) ||
        e.nombreComun.toLowerCase().includes(mono.common_name.toLowerCase()) ||
        mono.slug === e.nombreComun.toLowerCase(),
    );
    return {
      slug: mono.slug,
      nombreComun: resolveLocalized(mono.common_name, mono.common_name_en, locale) || mono.common_name,
      nombreCientifico: mono.scientific_name,
      temporada: matchingEspecie?.temporada ?? 'Bosque Templado Austral',
      mesesFloracion: resolveLocalized(mono.flowering_period, mono.flowering_period_en, locale) || matchingEspecie?.mesesFloracion || 'Estacional',
      colorMiel: matchingEspecie?.colorMiel ?? 'Ámbar del bosque nativo',
      descriptores: matchingEspecie?.descriptores ?? ['Flora nativa', 'Miel virgen', 'Bosque austral'],
      notasSensoriales: resolveLocalized(mono.sensory_profile, mono.sensory_profile_en, locale) || matchingEspecie?.notasSensoriales || '',
      maridaje: matchingEspecie?.maridaje ?? 'Maridaje botánico de alta gama, quesos maduros y charcutería artesanal.',
      slugProducto: matchingEspecie?.slugProducto || 'miel-bosque-nativo-chiloe',
    };
  });

  const cmsRaw = (rows?.[0]?.content as Record<string, unknown>) ?? null;
  const settings = parseFloracionesPageSettings(cmsRaw);

  const heroKicker = resolveLocalized(settings.kicker, settings.kicker_en, locale);
  const heroTitle = resolveLocalized(settings.title, settings.title_en, locale);
  const heroSubtitle = resolveLocalized(settings.subtitle, settings.subtitle_en, locale);
  const heroBadge1 = resolveLocalized(settings.badge1, settings.badge1_en, locale);
  const heroBadge2 = resolveLocalized(settings.badge2, settings.badge2_en, locale);
  const heroBadge3 = resolveLocalized(settings.badge3, settings.badge3_en, locale);

  const manifiestoKicker = resolveLocalized(settings.manifiesto_kicker, settings.manifiesto_kicker_en, locale);
  const manifiestoTitle = resolveLocalized(settings.manifiesto_title, settings.manifiesto_title_en, locale);
  const manifiestoText = resolveLocalized(settings.manifiesto_text, settings.manifiesto_text_en, locale);
  const manifiestoCtaLabel = resolveLocalized(settings.manifiesto_cta_label, settings.manifiesto_cta_label_en, locale);
  const manifiestoCtaHref = settings.manifiesto_cta_href || '/catalogo';

  const ahora = Date.now();
  const esReciente = (fecha: string | null) =>
    !!fecha && ahora - new Date(fecha).getTime() < FLORACION_RECIENTE_DIAS * 24 * 60 * 60 * 1000;

  const estadoPorEspecie = new Map(
    especies.map((e) => {
      const obs = vivas.filter((v) =>
        (v.especie ?? '').toLowerCase().includes(e.nombreComun.toLowerCase()),
      );
      const recientes = obs.filter((o) => esReciente(o.fecha));
      const lotesEspecie = lotes
        .filter((l) => (l.variedad_floral ?? '').toLowerCase().includes(e.nombreComun.toLowerCase()))
        .slice(0, 2);
      return [e.nombreComun, { obs, recientes, lotesEspecie }] as const;
    }),
  );

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={jsonLdData} />

      <main className="min-h-[var(--vh-full)] bg-background">
        {/* ── Hero de Código Profundo: Botánica y Floraciones ── */}
        <EditorialHero
          sectionKey="floraciones_page_settings"
          kicker={heroKicker}
          title={heroTitle || 'Floraciones Nativas de Chiloé'}
          subtitle={heroSubtitle}
          variant="deep-code"
          backgroundSlot={<CienciaCanvas />}
          scrollCueLabel="Explorar calendario y floraciones vivas"
        >
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-muted-foreground">
            {heroBadge1 ? (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" /> {heroBadge1}
              </span>
            ) : null}
            {heroBadge1 && heroBadge2 ? <span className="hidden sm:inline">•</span> : null}
            {heroBadge2 ? (
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary" /> {heroBadge2}
              </span>
            ) : null}
            {heroBadge2 && heroBadge3 ? <span className="hidden sm:inline">•</span> : null}
            {heroBadge3 ? (
              <span className="flex items-center gap-1.5">
                <Compass size={13} className="text-primary" /> {heroBadge3}
              </span>
            ) : null}
          </div>
        </EditorialHero>

        {/* ── Ahora en el bosque (datos vivos, ISR horario) ── */}
        {vivas.length > 0 && (
          <section className="py-16 md:py-20 px-4 border-b border-border/20 bg-surface-raised/20">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary font-bold">
                  Observaciones recientes del territorio
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-light text-foreground">
                  Ahora en el bosque
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  {vivas.length} floraciones registradas por la red territorial. Puntos aproximados.
                </p>
              </div>
              <MapaFloraciones puntos={vivas} />
            </div>
          </section>
        )}

        {/* ── Las 4 Grandes Floraciones ── */}
        <section className="py-16 md:py-24 px-4 max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-4xl font-light text-foreground">
              {especies.length === 4 ? 'Cuatro Especies de Bosque Nativo' : `${especies.length} Especies de Bosque Nativo`}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Cada variedad se recolecta en ventanas estacionales breves y rigurosamente trazadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {especies.map((especie) => {
              const vivo = estadoPorEspecie.get(especie.nombreComun);
              const enFloracion = (vivo?.recientes.length ?? 0) > 0;
              return (
              <div
                key={especie.slug}
                className="rounded-2xl border border-border/40 bg-surface-raised/30 p-6 sm:p-8 space-y-5 hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                        {especie.temporada} ({especie.mesesFloracion})
                      </span>
                      {vivo && vivo.obs.length > 0 && (
                        <span
                          className={`ml-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                            enFloracion
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-background/60 text-muted-foreground border-border/60'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${enFloracion ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                          {enFloracion
                            ? `En floración ahora (${vivo.recientes.length})`
                            : `Último registro ${vivo.obs[0]?.fecha ? formatCalendarDate(vivo.obs[0].fecha as string) : ''}`}
                        </span>
                      )}
                      <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground mt-0.5">
                        {especie.nombreComun}
                      </h3>
                      <p className="text-xs font-mono italic text-muted-foreground">
                        {especie.nombreCientifico}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-background/60 text-muted-foreground font-mono">
                      {especie.colorMiel}
                    </span>
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed font-display italic">
                    «{especie.notasSensoriales}»
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-accent-text block">
                      Descriptores en Paladar
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {especie.descriptores.map((d) => (
                        <span
                          key={d}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-surface-sunken border border-border text-foreground font-medium"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Armonía gastronómica:</strong> {especie.maridaje}
                  </div>
                  {(estadoPorEspecie.get(especie.nombreComun)?.lotesEspecie.length ?? 0) > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      {estadoPorEspecie.get(especie.nombreComun)?.lotesEspecie.map((lote) => (
                        <p key={lote.id} className="text-xs text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">Este frasco viene de aquí:</strong>{' '}
                          lote {lote.nombre_lote ?? 'verificado'}
                          {lote.fecha_envasado
                            ? ` · envasado ${formatCalendarDate(lote.fecha_envasado)}`
                            : ''}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border/40 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-4">
                    <Link
                      href="/catalogo"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>Ver mieles en stock</span>
                      <ArrowRight size={13} />
                    </Link>
                    <Link
                      href={`/origen/${especie.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline transition-colors"
                    >
                      <span>Ficha botánica</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  <FloracionReservaModal
                    nombreComun={especie.nombreComun}
                    nombreCientifico={especie.nombreCientifico}
                    temporada={especie.temporada}
                    slug={especie.slug}
                  />
                </div>
              </div>
              );
            })}
          </div>
        </section>

        {/* ── Manifiesto de No-Trashumancia ── */}
        <section className="py-16 px-4 border-t border-border/20 bg-surface-raised/20">
          <div className="max-w-3xl mx-auto rounded-3xl border border-border/40 bg-background/80 p-8 sm:p-12 space-y-4 text-center">
            {manifiestoKicker ? (
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary font-bold">
                {manifiestoKicker}
              </span>
            ) : null}
            <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground">
              {manifiestoTitle}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto whitespace-pre-line">
              {manifiestoText}
            </p>
            {manifiestoCtaLabel ? (
              <div className="pt-4">
                <Link
                  href={manifiestoCtaHref}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-8 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {manifiestoCtaLabel}
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <ShopFooter />
    </StoreShell>
  );
}
