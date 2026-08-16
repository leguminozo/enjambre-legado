import type { Metadata } from 'next';
import Image from 'next/image';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent, getSiteContentBatch } from '@/lib/cms';
import { parseNosotrosSettings } from '@/lib/shop/store-chrome';
import { articleJsonLd, breadcrumbJsonLd, mergeJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { X } from 'lucide-react';

const EVIDENCIA_CIENTIFICA = [
{
categoria: 'Control Glicémico',
evidencias: [
{
titulo: 'Evidencia Monumental Control Glicémico',
texto: 'Hay literatura que compara la respuesta glucémica de mieles con otros endulzantes; no es un sello nutricional de este frasco.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Impacto HbA1c',
texto: 'Los ensayos clínicos no sustituyen el rotulado ni el consejo médico.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Miel vs Sucrosa',
texto: 'Menor índice incremental pico que el azúcar común.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Síndrome Metabólico',
texto: 'No atribuimos a este producto efectos sobre peso o metabolismo.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Revisión Sistemática',
texto: 'No usamos índice glicémico como claim de envase.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Prediabetes',
texto: 'Este alimento no está indicado para tratar diabetes.',
fuente: 'EVIDENCIA CIENTÍFICA'
}
]
},
{
categoria: 'Propiedades del Ulmo y Flora Nativa',
evidencias: [
{
titulo: 'Poder del Ulmo',
texto: 'Actividad antimicrobiana y antioxidante superior.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Flora de Chiloé',
texto: 'Correlación directa entre especies nativas y antioxidantes.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Compuestos Volátiles',
texto: 'Propiedades biológicas únicas de bosques chilotas.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Antibacteriana',
texto: 'Actividad dependiente de peróxido de hidrógeno.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: '400+ Compuestos',
texto: 'Complejidad química de mieles chilenas.',
fuente: 'EVIDENCIA CIENTÍFICA'
}
]
},
{
categoria: 'Neuroprotección y Salud Mental',
evidencias: [
{
titulo: 'Neuroprotección',
texto: 'Efectos ansiolíticos y antidepresivos naturales.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Salud Cerebral',
texto: 'Reducción de ansiedad en modelos de estudio.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Triptófano',
texto: 'Precursor de serotonina para calidad mental.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Eje Intestino-Cerebro',
texto: 'Regulación del estado de ánimo vía microbioma.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Anti-inflamatorio',
texto: 'Alta capacidad antioxidante in-vitro.',
fuente: 'EVIDENCIA CIENTÍFICA'
}
]
},
{
categoria: 'Contexto Epidemiológico Chile',
evidencias: [
{
titulo: 'Resistencia Insulínica Chile',
texto: 'Alta prevalencia en zonas indígenas.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Obesidad Nacional',
texto: '78% de prevalencia en 2017.',
fuente: 'EVIDENCIA CIENTÍFICA'
}
]
}
] as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

const aspectClassMap: Record<string, string> = {
  '16/10': 'aspect-[16/10]',
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  'auto': 'aspect-auto',
};

export const metadata: Metadata = {
  title: 'Nuestra Historia · La Obrera y el Zángano',
  description:
    '22 años de regeneración en Chiloé. Apicultura regenerativa, reforestación nativa y miel cruda del bosque valdiviano.',
  alternates: { canonical: `${SITE_URL}/nosotros` },
  openGraph: {
    title: 'Nuestra Historia · La Obrera y el Zángano',
    description:
      '22 años de regeneración en Chiloé. Apicultura regenerativa, reforestación nativa y miel cruda del bosque valdiviano.',
    url: `${SITE_URL}/nosotros`,
    type: 'article',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nuestra Historia · La Obrera y el Zángano',
    description:
      '22 años de regeneración en Chiloé. Apicultura regenerativa, reforestación nativa y miel cruda del bosque valdiviano.',
  },
};

export default async function NosotrosPage({
  searchParams,
}: {
  searchParams: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams).cms_preview === '1';
  const batch = await getSiteContentBatch(['nosotros', 'nosotros_settings'], { draft });
  const cmsRows = batch.nosotros ?? [];
  const nosotrosSettings = parseNosotrosSettings((batch.nosotros_settings?.[0]?.content as Record<string, unknown>) ?? null);

  const cms = cmsRows[0]?.content as Record<string, unknown> | undefined;
  const heroKicker = nosotrosSettings.kicker || 'Nuestra Historia';
  const heroTitle =
    typeof cms?.title === 'string' && cms.title.trim()
      ? cms.title
      : (nosotrosSettings.title || 'Renacer de las Cenizas en Chiloé');
  const heroDesc =
    typeof cms?.desc === 'string' && cms.desc.trim()
      ? cms.desc
      : (nosotrosSettings.subtitle || 'Regeneración, Legado y Miel Artesanal del Bosque Patagónico de Chiloé');
  const heroImage =
    typeof cms?.image === 'string' && cms.image.startsWith('http') ? cms.image : null;
  const historia =
    typeof cms?.historia === 'string' && cms.historia.trim() ? cms.historia : null;
  const mision =
    typeof cms?.mision === 'string' && cms.mision.trim() ? cms.mision : null;
  const vision =
    typeof cms?.vision === 'string' && cms.vision.trim() ? cms.vision : null;

  const aspectClass = aspectClassMap[nosotrosSettings.image_aspect_ratio] || 'aspect-[16/9]';
  const fitClass = nosotrosSettings.image_fit === 'contain' ? 'object-contain p-4' : 'object-cover';

  // Stats: etiqueta/valor desde CMS con fallback a los valores actuales
  const statDefs = [
    { label: 'Años Regenerando', value: '22' },
    { label: 'Índice Glucémico', value: '55' },
    { label: 'Maduración', value: '48h' },
    { label: 'Bosque Nativo', value: '100%' },
  ];
  const stats = statDefs.map((s, i) => ({
    label:
      typeof cms?.[`stat${i + 1}_label`] === 'string' &&
      (cms[`stat${i + 1}_label`] as string).trim()
        ? (cms[`stat${i + 1}_label`] as string)
        : s.label,
    value:
      typeof cms?.[`stat${i + 1}_value`] === 'string' &&
      (cms[`stat${i + 1}_value`] as string).trim()
        ? (cms[`stat${i + 1}_value`] as string)
        : s.value,
  }));

  // Evidencia científica: sección 'ciencia' (items {categoria, titulo, texto, fuente})
  // agrupada por categoría; fallback al array hardcodeado.
  const evidenciaRows = await getSiteContent('ciencia', { draft });
  const evidenciaCms = evidenciaRows.map(
    (r) => r.content as Record<string, unknown>,
  );
  const evidenciaRaw =
    evidenciaCms.length > 0
      ? evidenciaCms
      : EVIDENCIA_CIENTIFICA.flatMap((g) =>
          g.evidencias.map((e) => ({ categoria: g.categoria, ...e })),
        );
  const gruposEvidencia = evidenciaRaw.reduce<
    { categoria: string; evidencias: { titulo: string; texto: string; fuente: string }[] }[]
  >((acc, item) => {
    const titulo = typeof item.titulo === 'string' ? item.titulo : '';
    const texto = typeof item.texto === 'string' ? item.texto : '';
    if (!titulo && !texto) return acc;
    const categoria =
      typeof item.categoria === 'string' && item.categoria.trim()
        ? (item.categoria as string)
        : 'Evidencia Científica';
    const fuente =
      typeof item.fuente === 'string' && item.fuente.trim()
        ? (item.fuente as string)
        : 'EVIDENCIA CIENTÍFICA';
    let group = acc.find((g) => g.categoria === categoria);
    if (!group) {
      group = { categoria, evidencias: [] };
      acc.push(group);
    }
    group.evidencias.push({ titulo, texto, fuente });
    return acc;
  }, []);

  const nosotrosJsonLd = mergeJsonLd([
    articleJsonLd({
      headline: 'Renacer de las Cenizas en Chiloé',
      description:
        '22 años de regeneración en Chiloé. Apicultura regenerativa, reforestación nativa y miel cruda del bosque valdiviano.',
      url: `${SITE_URL}/nosotros`,
      datePublished: '2025-07-02',
    }),
    breadcrumbJsonLd([
      { name: 'Inicio', href: '/' },
      { name: 'Nuestra Historia', href: '/nosotros' },
    ]),
  ]);

  return (
    <StoreShell>
      <ShopHeader />
      <JsonLd data={nosotrosJsonLd} />
      <main className="mx-auto max-w-5xl px-4 sm:px-8 pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] pb-16 lg:py-24">
        {/* Hero */}
        <div className="text-center mb-16 md:mb-20">
          <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent-text mb-6">
            {heroKicker}
          </span>
          <h1 className="font-display text-[clamp(2rem,7vw,4.5rem)] md:text-7xl font-light text-foreground mb-6 md:mb-8 text-balance">
            {heroTitle}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            {heroDesc}
          </p>
          {heroImage ? (
            <div className={`relative ${aspectClass} max-w-4xl mx-auto mt-8 rounded-[var(--tienda-radius,0.5rem)] overflow-hidden border border-border/30`}>
              <Image src={heroImage} alt={heroTitle} fill sizes="(max-width: 1024px) 100vw, 896px" className={fitClass} />
            </div>
          ) : null}
        </div>

{/* Main Story - Texto completo (CMS 'historia' con fallback al texto hardcodeado) */}
{historia ? (
  <div className="prose prose-lg prose-invert max-w-none mb-24">
    <p className="text-lg md:text-xl leading-relaxed text-muted-foreground whitespace-pre-line">
      {historia}
    </p>
    <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Fuentes</h2>
    <p className="text-lg leading-relaxed text-muted-foreground">
      Las notas que siguen son contexto bibliográfico sobre miel y flora nativa. No son indicación terapéutica ni rotulado Minsal (Ley 20.606). El alimento se presenta por origen y oficio. Contextualizadas a Pureo, Yerba Loza y apiarios de Chiloé:
    </p>
    <div className="mt-12 flex justify-center">
      <a
        href="#evidencia"
        className="group relative inline-flex min-h-12 items-center justify-center px-8 py-4 border border-accent text-accent-text uppercase tracking-[0.2em] text-xs hover:bg-accent hover:text-accent-foreground transition-all duration-500"
      >
        Ver Evidencia Científica
      </a>
    </div>
  </div>
) : null}
<div className={`prose prose-lg prose-invert max-w-none mb-24 ${historia ? 'hidden' : ''}`}>
<div className="text-sm text-accent-text uppercase tracking-[0.2em] mb-4">2 de julio de 2025</div>
<p className="text-lg md:text-xl leading-relaxed text-muted-foreground whitespace-pre-line">
En términos generales, hacemos que la miel de Chiloé sea un puente entre el bosque nativo y una mesa consciente. La recolectamos en bosques antiguos y regenerados; el néctar llega crudo, batido en frío, con el perfil de las floraciones de ulmo y tepú. Cada frasco es un alimento de origen, no un medicamento ni un sustituto etiquetado de azúcar.

En "La Obrera y el Zángano", hacemos que este puente invite a un consumo consciente, sencillo y lujoso, que fusiona ciencia con existencia.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Renacer de las Cenizas en Chiloé</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
Hace 22 años comenzamos un proceso piloto de reforestación en un terreno de baja densidad boscosa y alta erosión derivada del impacto de un incencio varios años antes de nuestra llegada. Con paciencia, reconstruimos este paisaje con especies nativas como ulmo, tepú, tiaca, avellanos, entre otros. Tejiendo al final de años, un ecosistema que respira como pulmón vivo para nuestras colmenas y los demás seres que han llegado a habitar el entorno. Las abejas, en su existencia polinizadora, recolectan néctar de flores bañadas por la luz de bosques regenerados, directo desde el frío sur del planeta, creando una miel ámbar extra claro cremosa. Nuestra apicultura rompe con lo convencional: no solo produce, sino que restaura y preserva, la llamamos apicultura regenerativa, reflejando transmitir confianza en que todo se puede regenerar y convertir hacia algo mas profundo y capaz de crear un legado que trasciende la existencia humana. Ese legado emerge del bosque y de nuestra interdependencia tejida con los ritmos naturales.

Nuestro proceso —de la reforestación en Pureo a los batidos de miel ulmo-tepú— es artesanal y lento. Preferimos la miel cruda del bosque al azúcar de mesa; esa preferencia es de sabor y de oficio, no un claim terapéutico.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Apicultura como Conexión Cósmica</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
En Chiloé, trabajamos colaborativamente con nuestras colmenas, son sociedades complejas y sincronizadas al ritmo de las estaciones, al ritmo del sol. Cada verano es un nuevo comienzo en la recolección de miel.

Luego, innovamos con formatos mínimos: sachets de 15 g, frascos de 150 g o 900 g. Cada uno invita a un acto cotidiano —una cucharada, un té, un desayuno— con el sabor del bosque, no con una promesa clínica.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Formatos</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
Sachets, frascos de 150 g y 900 g, a veces con avellana, polen o cacao nibs. Alimento de Chiloé.

<strong>Sachets:</strong> 15 g de crema con avellana o polen, para llevar.

<strong>Miel virgen en panal:</strong> sellada como sale de la colmena.

<strong>Frascos:</strong> 150 g o 900 g de crema ulmo-tepú.

<strong>Cajas de sachets:</strong> 25 unidades. Precio publicado en el catálogo.

<strong>Suscripciones:</strong> al ritmo de la floración; detalle en Club de la Cosecha.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Compromiso con la Regeneración</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
Desde el sur del planeta, promovemos agroecología en ferias locales y el cuidado de los polinizadores. La miel es el fruto de esa relación con el bosque, no un tratamiento.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Dónde va</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
Cada frasco sale de apiarios entre Pureo, Quemchi y Queilén. Los sachets también se usan como amenities en hoteles que piden origen, no un slogan.

El catálogo y el Club de la Cosecha están abiertos. La ciencia y los límites del impacto, en /ciencia.
</p>

{/* Fuentes Section */}
<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Fuentes</h2>
<p className="text-lg leading-relaxed text-muted-foreground">
Las notas que siguen son contexto bibliográfico sobre miel y flora nativa. No son indicación terapéutica ni rotulado Minsal (Ley 20.606). El alimento se presenta por origen y oficio. Contextualizadas a Pureo, Yerba Loza y apiarios de Chiloé:
</p>

<div className="mt-12 flex justify-center">
<a
href="#evidencia"
className="group relative inline-flex min-h-12 items-center justify-center px-8 py-4 border border-accent text-accent-text uppercase tracking-[0.2em] text-xs hover:bg-accent hover:text-accent-foreground transition-all duration-500"
>
Ver Evidencia Científica
</a>
</div>
</div>

{/* Evidencia Científica — CMS 'ciencia' agrupada por categoría (fallback: array hardcodeado) */}
<div id="evidencia" className="scroll-mt-24 border-t border-border pt-16 mb-24">
  <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-center text-balance">
    Evidencia Científica
  </h2>
  {gruposEvidencia.map((g) => (
    <div key={g.categoria} className="mb-10">
      <h3 className="font-display text-xl font-medium text-foreground mb-4 text-center">
        {g.categoria}
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {g.evidencias.map((e, i) => (
          <div
            key={`${g.categoria}-${i}`}
            className="rounded-xl border border-border/40 bg-surface-raised p-5"
          >
            <p className="text-sm font-semibold text-foreground">{e.titulo}</p>
            <p className="mt-2 text-sm text-muted-foreground">{e.texto}</p>
            <span className="mt-3 inline-block text-[0.6rem] uppercase tracking-[0.2em] text-accent-text">
              {e.fuente}
            </span>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>

{/* Mission */}
<div className="border-t border-border pt-16 mb-24">
<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-center text-balance">
Nuestra Misión
</h2>
<p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
{mision ?? 'En La Obrera y el Zángano, buscamos fomentar y transformar el consumo de Miel en un acto de existencialismo saludable y cósmico, ofreciendo para esto nuestra Crema de Miel, forjada a partir de los ulmos, tepús y otros árboles antiguos y únicos del bosque nativo al sur del planeta, en Pureo, Queilen y otros entornos de Chiloé.'}
</p>
</div>

{/* Vision */}
<div className="border-t border-border pt-16 mb-24">
<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mb-8 text-center text-balance">
Nuestra Visión
</h2>
<p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
{vision ?? 'Interconectamos la Miel, las abejas, nosotros como humanos y toda la complejidad natural de la tierra como planeta en medio del cosmos. Vemos energía y cultura, creada directa desde el sol, que nutre y regenera. Damos cuenta a través de nuestra historia y procesos con los que logramos la posibilidad de ofrecer nuestra Crema de Miel, color blanco cremoso, sublime y suave.'}
</p>
</div>

{/* Stats — etiqueta/valor desde CMS con fallback */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-border pt-16">
  {stats.map((s) => (
    <div key={s.label} className="text-center">
      <div className="font-display text-4xl md:text-5xl text-accent-text mb-2">{s.value}</div>
      <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
    </div>
  ))}
</div>
</main>
<ShopFooter /></StoreShell>
);
}
