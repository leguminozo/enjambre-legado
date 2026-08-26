import type { Metadata } from 'next';
import Link from 'next/link';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { faqJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';

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

const faqSchema = faqJsonLd([
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
]);

export default function UlmoPage() {
  return (
    <Shell>
      <JsonLd data={faqSchema} />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Origen · Monografía Botánica
        </span>
        <h1 className="mt-4 font-display text-[clamp(2rem,7vw,3rem)] sm:text-5xl font-semibold leading-tight text-foreground text-balance">
          Ulmo
        </h1>
        <p className="mt-2 font-display text-xl italic text-accent-text">
          Eucryphia cordifolia (Cavanilles)
        </p>

        <section className="mt-12 space-y-6 text-foreground/80 leading-relaxed">
          <p>
            El <em>ulmo</em> es un árbol perennifolio majestuoso del bosque valdiviano, endémico del
            sur de Chile (desde la latitud 38° hasta los 44° S, aproximadamente de Concepción a Chiloé) y áreas contiguas en Argentina. 
            Puede sobrepasar los 40 metros de altura y alcanzar diámetros de tronco de hasta dos metros. Su floración —entre enero y marzo— es un evento fenológico masivo de enorme trascendencia ecológica y apícola.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Taxonomía y Biología Floral
          </h2>
          <p>
            Clasificada tradicionalmente en la familia Eucryphiaceae, y más recientemente incorporada dentro de las Cunoniaceae por estudios filogenéticos (APG III), <em>Eucryphia cordifolia</em> produce flores actinomorfas solitarias en las axilas de las hojas superiores. 
            Cada flor presenta típicamente cuatro pétalos blancos de textura gruesa, numerosos estambres con anteras rojizas y un ovario compuesto por múltiples carpelos. 
            La alta concentración de azúcares (principalmente fructosa y glucosa) en su néctar hace de esta especie una de las fuentes melíferas nativas de mayor rendimiento.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Perfil Fisicoquímico y Organoléptico
          </h2>
          <p>
            La miel unifloral de ulmo se distingue por un índice de color claro (usualmente Pfund 20-40 mm, ámbar extra blanco a ámbar claro). 
            Químicamente, presenta una marcada actividad antioxidante y propiedades antibacterianas no peróxidas significativas, con una concentración fenólica total destacada para las mieles claras.
            Aroma intensamente floral, volátil, con trazas evidentes de vainilla, anís y jazmín. En boca resulta sedosa y ligeramente fresca.
            Debido a su perfil de azúcares, tiende a una cristalización fina y homogénea en frío, logrando naturalmente una textura mantecosa muy apreciada.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Ecología y Conservación del Hábitat
          </h2>
          <p>
            Como especie pionera tardía de larga vida, el ulmo requiere suelos profundos, bien drenados pero con humedad constante (precipitaciones superiores a 1500 mm anuales). 
            Juega un rol vital en el soporte de la biodiversidad del dosel, albergando múltiples especies de epífitas y proporcionando sustento a insectos y avifauna nectarívora nativa en la fase de declive del verano austral.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Fuentes Científicas y Referencias
          </h2>
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
        </section>

        <div className="mt-16 border-t border-border pt-8">
          <Link
            href="/catalogo"
            className="inline-flex min-h-11 items-center text-sm font-medium text-accent-text hover:text-accent/80 transition-colors"
          >
            ← Explorar creaciones
          </Link>
        </div>
      </article>
    </Shell>
  );
}
