import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent } from '@/lib/cms';
import { useState } from 'react';
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

export const metadata = { title: 'Nuestra Historia' };

export default function NosotrosPage() {


return (
<StoreShell>
<ShopHeader />
<main className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:py-24">
{/* Hero */}
<div className="text-center mb-20">
<span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent mb-6">
Nuestra Historia
</span>
<h1 className="font-display text-5xl md:text-7xl font-light text-foreground mb-8">
Renacer de las Cenizas en Chiloé
</h1>
<p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
Regeneración, Legado y Miel Artesanal del Bosque Patagónico de Chiloé
</p>
</div>

{/* Main Story - Texto completo */}
<div className="prose prose-lg prose-invert max-w-none mb-24">
<div className="text-sm text-accent uppercase tracking-[0.2em] mb-4">2 de julio de 2025</div>
<p className="text-lg md:text-xl leading-relaxed text-muted-foreground whitespace-pre-line">
En términos generales, hacemos que la miel de Chiloé sea un puente entre la regeneración ecológica y la salud metabólica y nutricional. Al ser recolectada desde bosques nativos antiguos y regenerados, el néctar brota transformado directo desde el sol, logrando desafiar directamente ante el impacto del azúcar refinada. Con un índice glucémico de ~55 —frente al 65 del azúcar blanco—, reduce los picos glucémicos, promoviendo una energía estable que resuena con los ciclos vitales. Batida intermitentemente durante 48 horas, cada gota encapsula un vacío nutricional: una dulzura que no satura, sino que alimenta el cuerpo y la mente a partir del legado del bosque. Además, los polifenoles de la miel, abundantes en Chiloé, superan en capacidad antioxidante a variedades estándar, protegiendo contra el estrés oxidativo.

En "La Obrera y el Zángano", hacemos que este puente invite a un consumo consciente, sencillo y lujoso, que fusiona ciencia con existencia.
</p>

<h2 className="font-display text-3xl md:text-4xl font-light text-foreground mt-12 mb-6">Renacer de las Cenizas en Chiloé</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
Hace 22 años comenzamos un proceso piloto de reforestación en un terreno de baja densidad boscosa y alta erosión derivada del impacto de un incencio varios años antes de nuestra llegada. Con paciencia, reconstruimos este paisaje con especies nativas como ulmo, tepú, tiaca, avellanos, entre otros. Tejiendo al final de años, un ecosistema que respira como pulmón vivo para nuestras colmenas y los demás seres que han llegado a habitar el entorno. Las abejas, en su existencia polinizadora, recolectan néctar de flores bañadas por la luz de bosques regenerados, directo desde el frío sur del planeta, creando una miel ámbar extra claro cremosa. Nuestra apicultura rompe con lo convencional: no solo produce, sino que restaura y preserva, la llamamos apicultura regenerativa, reflejando transmitir confianza en que todo se puede regenerar y convertir hacia algo mas profundo y capaz de crear un legado que trasciende la existencia humana. Ese legado emerge del bosque y de nuestra interdependencia tejida con los ritmos naturales.

Nuestro proceso —de la reforestación en Pureo a los batidos precisos de miel ulmo-tepú— eleva lo artesanal a lo existencial. Rechaza el azúcar refinado, ligado al síndrome metabólico en el 36% de adultos chilenos. La textura cremosa, rica en triptófano, libera serotonina gradualmente, reduciendo fluctuaciones glucémicas en un 15-20% respecto al azúcar industrial, según estudios de respuesta glicémica.
</p>

<h2 className="font-display text-3xl md:text-4xl font-light text-foreground mt-12 mb-6">Apicultura como Conexión Cósmica</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
En Chiloé, trabajamos colaborativamente con nuestras colmenas, son sociedades complejas y sincronizadas al ritmo de las estaciones, al ritmo del sol. Cada verano es un nuevo comienzo en la recolección de miel.

Luego, Innovamos con formatos minimalistas: sachets de 15 g como dosis exactas contra desbalances glucémicos, frascos de 150 g o 900 g para rituales profundos. Cada producto invita a un acto matutino: una cucharada que calma el ruido mental del azúcar simple, promoviendo claridad metabólica con efectos ansiolíticos mediados por precursores de serotonina.
</p>

<h2 className="font-display text-3xl md:text-4xl font-light text-foreground mt-12 mb-6">Elixires del Vacío: Nuestros Productos</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
En obrerayzangano.com, nuestra gama surge de procesos regenerativos: sachets, frascos de 150 g y 900 g, con avellanas, polen o cacao nibs que potencian nutrientes. Cada elixir es un antídoto al exceso calórico del azúcar, con un consumo promedio de 99 g diarios per cápita en Chile.

<strong>Sachets de Miel:</strong> 15 g de crema pura con avellanas molidas o polen vibrante; dosis portátiles, regeneración de bosques, diseñadas para ritmos de vida urbano. Su textura ámbar abraza el paladar como un amanecer lento, estabilizando glucosa con aromas de tepú que evocan calidez estelar.

<strong>Miel Virgen en Panal:</strong> Sellada al vacío, preserva enzimas y antioxidantes; una pureza que irradia el sol de Chiloé, rica en minerales frente al azúcar refinado.

<strong>Frascos Medios y Mayores:</strong> 150 g o 900 g de crema ulmo-tepú; versátiles para lo cotidiano o lo monumental, con beneficios antiinflamatorios y bajo IG en un mercado en expansión.

<strong>Cajas de Sachets:</strong> 25 unidades por 25.000 CLP; ideales para compartir, rompiendo barreras con practicidad cósmica.

<strong>Suscripciones:</strong> Desde 15.000 CLP mensuales; entregas que integran ciclos regenerativos, fomentando hábitos anti-azúcar con descuentos.

Cada creación es un poema sensorial: ámbar viscoso que danza en la lengua, aromas boscosos de tepú, un lujo tierno que nutre el ser con simplicidad espacial.
</p>

<h2 className="font-display text-3xl md:text-4xl font-light text-foreground mt-12 mb-6">Compromiso con la Regeneración</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
Desde el sur del planeta, promovemos agroecología en ferias locales, educando sobre polinizadores como arquitectos cósmicos. Nuestra miel restaura la conexión con la naturaleza, combatiendo la desconexión metabólica del azúcar, prevalente en poblaciones con alta resistencia insulínica.
</p>

<h2 className="font-display text-3xl md:text-4xl font-light text-foreground mt-12 mb-6">Invitación al Equilibrio Chileno</h2>
<p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
En La Obrera y el Zángano, cada frasco es un monumento al equilibrio cósmico: calidad que redefine el consumo como acto sagrado, rompiendo adicciones con miel que nutre la esencia. Nuestros sachets son ideales como amenities exclusivos en habitaciones de hoteles de lujo. Cada sachet cuenta la historia del bosque patagónico, diferenciando tu experiencia de hospedaje.

Únete a esta rebelión solar, donde el néctar de Chiloé ilumina el legado del bosque.
</p>

{/* Fuentes Section */}
<h2 className="font-display text-3xl md:text-4xl font-light text-foreground mt-12 mb-6">Fuentes</h2>
<p className="text-lg leading-relaxed text-muted-foreground">
Las afirmaciones científicas se fundamentan en estudios que destacan las propiedades de la miel ulmo-tepú de Chiloé, contextualizadas a las ubicaciones de Pureo, Yerba Loza, y otras ubicaciones de nuestros respectivos apiarios:
</p>

<div className="mt-12 flex justify-center">
<a
href="#evidencia"
className="group relative px-8 py-4 border border-accent text-accent uppercase tracking-[0.2em] text-xs hover:bg-accent hover:text-accent-foreground transition-all duration-500 inline-block"
>
Ver Evidencia Científica
</a>
</div>
</div>

{/* Mission */}
<div className="border-t border-border pt-16 mb-24">
<h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8 text-center">
Nuestra Misión
</h2>
<p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
En La Obrera y el Zángano, buscamos fomentar y transformar el consumo de Miel en un acto de existencialismo saludable y cósmico, ofreciendo para esto nuestra Crema de Miel, forjada a partir de los ulmos, tepús y otros árboles antiguos y únicos del bosque nativo al sur del planeta, en Pureo, Queilen y otros entornos de Chiloé.
</p>
</div>

{/* Vision */}
<div className="border-t border-border pt-16 mb-24">
<h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8 text-center">
Nuestra Visión
</h2>
<p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
Interconectamos la Miel, las abejas, nosotros como humanos y toda la complejidad natural de la tierra como planeta en medio del cosmos. Vemos energía y cultura, creada directa desde el sol, que nutre y regenera. Damos cuenta a través de nuestra historia y procesos con los que logramos la posibilidad de ofrecer nuestra Crema de Miel, color blanco cremoso, sublime y suave.
</p>
</div>

{/* Stats */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-border pt-16">
<div className="text-center">
<div className="font-display text-4xl md:text-5xl text-accent mb-2">22</div>
<div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Años Regenerando</div>
</div>
<div className="text-center">
<div className="font-display text-4xl md:text-5xl text-accent mb-2">55</div>
<div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Índice Glucémico</div>
</div>
<div className="text-center">
<div className="font-display text-4xl md:text-5xl text-accent mb-2">48h</div>
<div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Maduración</div>
</div>
<div className="text-center">
<div className="font-display text-4xl md:text-5xl text-accent mb-2">100%</div>
<div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Bosque Nativo</div>
</div>
</div>
</main>
<ShopFooter /></StoreShell>
);
}
