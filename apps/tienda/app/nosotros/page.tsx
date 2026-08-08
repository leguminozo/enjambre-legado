import type { Metadata } from 'next';
import Image from 'next/image';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent } from '@/lib/cms';
import { articleJsonLd, breadcrumbJsonLd, mergeJsonLd } from '@/lib/shop/json-ld';
import { JsonLd } from '@/components/ui/JsonLd';
import { X } from 'lucide-react';

const EVIDENCIA_CIENTIFICA = [
{
categoria: 'Control Glicémico',
evidencias: [
{
titulo: 'Evidencia Monumental Control Glicémico',
texto: 'Comparada con dextrosa, la miel reduce el aumento de glucosa (IG ~55).',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Impacto HbA1c',
texto: 'Consumo de 50g/día mejora control sin picos drásticos.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Miel vs Sucrosa',
texto: 'Menor índice incremental pico que el azúcar común.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Síndrome Metabólico',
texto: 'Mejora metabolismo lipídico y reduce aumento de peso.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Revisión Sistemática',
texto: 'IG inferior minimiza picos glucémicos.',
fuente: 'EVIDENCIA CIENTÍFICA'
},
{
titulo: 'Prediabetes',
texto: 'Asociación inversa; mejora control en Diabetes T2.',
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
},
{
titulo: 'Azúcar Latam',
texto: 'Consumo excesivo (99.4 g/día promedio).',
fuente: 'EVIDENCIA CIENTÍFICA'
}
]
}
] as const;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const metadata: Metadata = {
  title: 'Nuestra Historia',
  description:
    '22 años de regeneración en Chiloé. Apicultura regenerativa, reforestación nativa y miel cruda del bosque valdiviano — La Obrera y el Zángano.',
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
  // Hero editable desde el Editor de Tienda (site_content 'nosotros').
  // Vacío = copy hardcodeado actual; la evidencia científica ahora también es
  // editable (site_content 'ciencia') con fallback al array hardcodeado.
  const cmsRows = await getSiteContent('nosotros', { draft });
  const cms = cmsRows[0]?.content as Record<string, unknown> | undefined;
  const heroTitle =
    typeof cms?.title === 'string' && cms.title.trim()
      ? cms.title
      : 'Renacer de las Cenizas en Chiloé';
  const heroDesc =
    typeof cms?.desc === 'string' && cms.desc.trim()
      ? cms.desc
      : 'Regeneración, Legado y Miel Artesanal del Bosque Patagónico de Chiloé';
  const heroImage =
    typeof cms?.image === 'string' && cms.image.startsWith('http') ? cms.image : null;
  const historia =
    typeof cms?.historia === 'string' && cms.historia.trim() ? cms.historia : null;
  const mision =
    typeof cms?.mision === 'string' && cms.mision.trim() ? cms.mision : null;
  const vision =
    typeof cms?.vision === 'string' && cms.vision.trim() ? cms.vision : null;

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
        ? item.categoria
        : 'Evidencia';
    const fuente =
      typeof item.fuente === 'string' && item.fuente.trim()
        ? item.fuente
        : 'EVIDENCIA CIENTÍFICA';
    const existing = acc.find((g) => g.categoria === categoria);
    if (existing) existing.evidencias.push({ titulo, texto, fuente });
    else acc.push({ categoria, evidencias: [{ titulo, texto, fuente }] });
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
<span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent mb-6">
Nuestra Historia
</span>
<h1 className="font-display text-[clamp(2rem,7vw,4.5rem)] md:text-7xl font-light text-foreground mb-6 md:mb-8 text-balance">
{heroTitle}
</h1>
<p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
{heroDesc}
</p>
{heroImage ? (
  <div className="relative aspect-[16/9] max-w-4xl mx-auto mt-8 rounded-[var(--tienda-radius,0.5rem)] overflow-hidden border border-border/30">
    <Image src={heroImage} alt={heroTitle} fill sizes="(max-width: 1024px) 100vw, 896px" className="object-cover" />
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
      Las afirmaciones científicas se fundamentan en estudios que destacan las propiedades de la miel ulmo-tepú de Chiloé, contextualizadas a las ubicaciones de Pureo, Yerba Loza, y otras ubicaciones de nuestros respectivos apiarios:
    </p>
    <div className="mt-12 flex justify-center">
      <a
        href="#evidencia"
        className="group relative inline-flex min-h-12 items-center justify-center px-8 py-4 border border-accent text-accent uppercase tracking-[0.2em] text-xs hover:bg-accent hover:text-accent-foreground transition-all duration-500"
      >
        Ver Evidencia Científica
      </a>
    </div>
  </div>
) : null}
<div className={`prose prose-lg prose-invert max-w-none mb-24 ${historia ? 'hidden' : ''}`}>
<div className="text-sm text-accent uppercase tracking-[0.2em] mb-4">2 de julio de 2025</div>
<p className="text-lg md:text-xl leading-relaxed text-muted-foreground whitespace-pre-line">
En términos generales, hacemos que la miel de Chiloé sea un puente entre la regeneración ecológica y la salud metabólica y nutricional. Al ser recolectada desde bosques nativos antiguos y regenerados, el néctar brota transformado directo desde el sol, logrando desafiar directamente ante el impacto del azúcar refinada. Con un índice glucémico de ~55 —frente al 65 del azúcar blanco—, reduce los picos glucémicos, promoviendo una energía estable que resuena con los ciclos vitales. Batida intermitentemente durante 48 horas, cada gota encapsula un vacío nutricional: una dulzura que no satura, sino que alimenta el cuerpo y la mente a partir del legado del bosque. Además, los polifenoles de la miel, abundantes en Chiloé, superan en capacidad antioxidante a variedades estándar, protegiendo contra el estrés oxidativo.

En "La Obrera y el Zángano", hacemos que este puente invite a un consumo consciente, sencillo y lujoso, que fusiona ciencia con existencia.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Renacer de las Cenizas en Chiloé</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
Hace 22 años comenzamos un proceso piloto de reforestación en un terreno de baja densidad boscosa y alta erosión derivada del impacto de un incencio varios años antes de nuestra llegada. Con paciencia, reconstruimos este paisaje con especies nativas como ulmo, tepú, tiaca, avellanos, entre otros. Tejiendo al final de años, un ecosistema que respira como pulmón vivo para nuestras colmenas y los demás seres que han llegado a habitar el entorno. Las abejas, en su existencia polinizadora, recolectan néctar de flores bañadas por la luz de bosques regenerados, directo desde el frío sur del planeta, creando una miel ámbar extra claro cremosa. Nuestra apicultura rompe con lo convencional: no solo produce, sino que restaura y preserva, la llamamos apicultura regenerativa, reflejando transmitir confianza en que todo se puede regenerar y convertir hacia algo mas profundo y capaz de crear un legado que trasciende la existencia humana. Ese legado emerge del bosque y de nuestra interdependencia tejida con los ritmos naturales.

Nuestro proceso —de la reforestación en Pureo a los batidos precisos de miel ulmo-tepú— eleva lo artesanal a lo existencial. Rechaza el azúcar refinado, ligado al síndrome metabólico en el 36% de adultos chilenos. La textura cremosa, rica en triptófano, libera serotonina gradualmente, reduciendo fluctuaciones glucémicas en un 15-20% respecto al azúcar industrial, según estudios de respuesta glicémica.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Apicultura como Conexión Cósmica</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
En Chiloé, trabajamos colaborativamente con nuestras colmenas, son sociedades complejas y sincronizadas al ritmo de las estaciones, al ritmo del sol. Cada verano es un nuevo comienzo en la recolección de miel.

Luego, Innovamos con formatos minimalistas: sachets de 15 g como dosis exactas contra desbalances glucémicos, frascos de 150 g o 900 g para rituales profundos. Cada producto invita a un acto matutino: una cucharada que calma el ruido mental del azúcar simple, promoviendo claridad metabólica con efectos ansiolíticos mediados por precursores de serotonina.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Elixires del Vacío: Nuestros Productos</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
En obrerayzangano.com, nuestra gama surge de procesos regenerativos: sachets, frascos de 150 g y 900 g, con avellanas, polen o cacao nibs que potencian nutrientes. Cada elixir es un antídoto al exceso calórico del azúcar, con un consumo promedio de 99 g diarios per cápita en Chile.

<strong>Sachets de Miel:</strong> 15 g de crema pura con avellanas molidas o polen vibrante; dosis portátiles, regeneración de bosques, diseñadas para ritmos de vida urbano. Su textura ámbar abraza el paladar como un amanecer lento, estabilizando glucosa con aromas de tepú que evocan calidez estelar.

<strong>Miel Virgen en Panal:</strong> Sellada al vacío, preserva enzimas y antioxidantes; una pureza que irradia el sol de Chiloé, rica en minerales frente al azúcar refinado.

<strong>Frascos Medios y Mayores:</strong> 150 g o 900 g de crema ulmo-tepú; versátiles para lo cotidiano o lo monumental, con beneficios antiinflamatorios y bajo IG en un mercado en expansión.

<strong>Cajas de Sachets:</strong> 25 unidades por 25.000 CLP; ideales para compartir, rompiendo barreras con practicidad cósmica.

<strong>Suscripciones:</strong> Desde 15.000 CLP mensuales; entregas que integran ciclos regenerativos, fomentando hábitos anti-azúcar con descuentos.

Cada creación es un poema sensorial: ámbar viscoso que danza en la lengua, aromas boscosos de tepú, un lujo tierno que nutre el ser con simplicidad espacial.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Compromiso con la Regeneración</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
Desde el sur del planeta, promovemos agroecología en ferias locales, educando sobre polinizadores como arquitectos cósmicos. Nuestra miel restaura la conexión con la naturaleza, combatiendo la desconexión metabólica del azúcar, prevalente en poblaciones con alta resistencia insulínica.
</p>

<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Invitación al Equilibrio Chileno</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
En La Obrera y el Zángano, cada frasco es un monumento al equilibrio cósmico: calidad que redefine el consumo como acto sagrado, rompiendo adicciones con miel que nutre la esencia. Nuestros sachets son ideales como amenities exclusivos en habitaciones de hoteles de lujo. Cada sachet cuenta la historia del bosque patagónico, diferenciando tu experiencia de hospedaje.

Únete a esta rebelión solar, donde el néctar de Chiloé ilumina el legado del bosque.
</p>

{/* Fuentes Section */}
<h2 className="font-display text-[clamp(1.5rem,5.5vw,2.25rem)] md:text-4xl font-light text-foreground mt-12 mb-6 text-balance">Fuentes</h2>
<p className="text-lg leading-relaxed text-muted-foreground">
Las afirmaciones científicas se fundamentan en estudios que destacan las propiedades de la miel ulmo-tepú de Chiloé, contextualizadas a las ubicaciones de Pureo, Yerba Loza, y otras ubicaciones de nuestros respectivos apiarios:
</p>

<div className="mt-12 flex justify-center">
<a
href="#evidencia"
className="group relative inline-flex min-h-12 items-center justify-center px-8 py-4 border border-accent text-accent uppercase tracking-[0.2em] text-xs hover:bg-accent hover:text-accent-foreground transition-all duration-500"
>
Ver Evidencia Científica
</a>
</div>
</div>

{/* Evidencia Científica — CMS 'ciencia' agrupada por categoría (fallback: array hardcodeado) */}
<div id="evidencia" className="border-t border-border pt-16 mb-24">
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
            <span className="mt-3 inline-block text-[0.6rem] uppercase tracking-[0.2em] text-accent">
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
      <div className="font-display text-4xl md:text-5xl text-accent mb-2">{s.value}</div>
      <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{s.label}</div>
    </div>
  ))}
</div>
</main>
<ShopFooter /></StoreShell>
);
}
