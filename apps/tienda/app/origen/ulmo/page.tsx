import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { faqJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { getSiteContent } from '@/lib/cms';
import { parseBotanicalMonograph, parseBotanicalMonographs } from '@enjambre/shop-chrome';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <StoreShell>
      <ShopHeader />
      {children}
      <ShopFooter />
    </StoreShell>
  );
}

export const metadata: Metadata = {
  title: 'Ulmo — Miel del bosque valdiviano',
  description:
    'Eucryphia cordifolia: la floración más esperada del bosque nativo del sur de Chile. Su miel es clara, floral, con notas de vainilla y una delicadeza que no se encuentra en ninguna otra floración del mundo.',
  alternates: {
    canonical: '/origen/ulmo',
  },
  openGraph: {
    title: 'Ulmo — Miel del bosque valdiviano',
    description:
      'La floración más esperada del bosque nativo del sur de Chile. Miel clara, floral, con notas de vainilla.',
    type: 'article',
  },
};

export default async function UlmoPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const draft = resolvedSearchParams.cms_preview === '1';

  const rows = await getSiteContent('origen_monografias', { draft });
  const allMonographs = parseBotanicalMonographs(rows?.map((r) => r.content) ?? null);
  const monograph = allMonographs.find((m) => m.slug === 'ulmo') ?? parseBotanicalMonograph(null, 'ulmo');

  const faqSchema = faqJsonLd(
    monograph.faqs && monograph.faqs.length > 0
      ? monograph.faqs
      : [
          {
            question: '¿Qué es la miel de ulmo?',
            answer:
              'La miel de ulmo proviene de la floración de Eucryphia cordifolia, un árbol endémico del bosque valdiviano en el sur de Chile. Es una de las mieles más valoradas del mundo por su perfil floral delicado con notas de vainilla y su color claro ámbar dorado.',
          },
          {
            question: '¿Cuándo florece el ulmo?',
            answer:
              'El ulmo florece entre enero y marzo en el bosque valdiviano, coincidiendo con el verano austral. La floración dura aproximadamente 4-6 semanas y es altamente dependiente de las condiciones climáticas del año.',
          },
          {
            question: '¿Qué diferencia la miel de ulmo de la de tiaca?',
            answer:
              'La miel de ulmo (Eucryphia cordifolia) es clara, floral, con notas de vainilla y cuerpo ligero. La miel de tiaca (Calcluvia paniculata) es más ámbar, herbácea, con mayor cuerpo y un perfil más terroso. Ambas provienen del bosque nativo chileno pero de floraciones y momentos distintos del año.',
          },
          {
            question: '¿Qué características científicas definen a Eucryphia cordifolia?',
            answer:
              'Eucryphia cordifolia (Ulmo) es una especie endémica de los bosques templados lluviosos de Chile y Argentina. Destaca por sus grandes flores blancas hermafroditas con estambres prominentes, altamente atractivas para los polinizadores, y por su madera de alta densidad (0.6-0.7 g/cm3).',
          },
        ],
  );

  return (
    <Shell>
      <JsonLd data={faqSchema} />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-primary">
          Origen · Monografía Botánica
        </span>
        <h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] font-medium leading-tight text-foreground text-balance tracking-tight">
          {monograph.common_name}
        </h1>
        <p className="mt-1 font-display text-xl italic text-muted-foreground">
          {monograph.scientific_name}
        </p>

        <section className="mt-12 space-y-6 text-foreground/80 leading-relaxed">
          <p className="whitespace-pre-line">{monograph.full_description}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Taxonomía y Biología Floral
          </h2>
          <p>
            Clasificada tradicionalmente en la familia Eucryphiaceae, y más recientemente incorporada dentro de las Cunoniaceae por estudios filogenéticos (APG III), <em>{monograph.scientific_name}</em> produce flores actinomorfas solitarias en las axilas de las hojas superiores. 
            Cada flor presenta típicamente cuatro pétalos blancos de textura gruesa, numerosos estambres con anteras rojizas y un ovario compuesto por múltiples carpelos. 
            La alta concentración de azúcares (principalmente fructosa y glucosa) en su néctar hace de esta especie una de las fuentes melíferas nativas de mayor rendimiento.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Perfil Fisicoquímico y Organoléptico
          </h2>
          <p className="whitespace-pre-line">{monograph.sensory_profile}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Ecología y Conservación del Hábitat
          </h2>
          <p className="whitespace-pre-line">{monograph.ecology}</p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Fuentes Científicas y Referencias
          </h2>
          {monograph.references ? (
            <p className="text-sm opacity-80 italic">{monograph.references}</p>
          ) : (
            <ul className="list-disc pl-6 space-y-2 mt-4 text-sm opacity-80">
              <li>
                Donoso, C. (2006). <em>Las especies arbóreas de los bosques templados de Chile y Argentina</em>. Marisa Cuneo Ediciones.
              </li>
              <li>
                Montenegro, G. et al. (2008). <em>Propiedades antibacterianas y antioxidantes de las mieles chilenas</em>. Pontificia Universidad Católica de Chile.
              </li>
              <li>
                Hoffmann, A. (1982). <em>Flora silvestre de Chile, zona araucana</em>. Ediciones Fundación Claudio Gay.
              </li>
            </ul>
          )}
        </section>

        <div className="mt-16 border-t border-border pt-8 flex items-center justify-between">
          <Link
            href="/origen"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Explorar biblioteca botánica
          </Link>
          <Link
            href="/ciencia"
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text hover:underline transition-colors"
          >
            Ver respaldo científico en Ciencia →
          </Link>
        </div>
      </article>
    </Shell>
  );
}
