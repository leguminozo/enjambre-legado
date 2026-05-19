import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getSiteContent } from '@/lib/cms';

export const metadata = { title: 'Nuestra Historia' };

export default async function NosotrosPage() {
  const nosotrosData = await getSiteContent('nosotros_historia');
  
  const defaultContent = {
    titulo: 'Renacer de las Cenizas en Chiloé',
    subtitle: 'Nuestra Historia',
    contenido: `Hace 22 años comenzamos un proceso piloto de reforestación en un terreno de baja densidad boscosa y alta erosión derivada del impacto de un incendio varios años antes de nuestra llegada. Con paciencia, reconstruimos este paisaje con especies nativas como ulmo, tepú, tiaca, avellanos, entre otros. Tejiendo al final de años, un ecosistema que respira como pulmón vivo para nuestras colmenas y los demás seres que han llegado a habitar el entorno.

Las abejas, en su existencia polinizadora, recolectan néctar de flores bañadas por la luz de bosques regenerados, directo desde el frío sur del planeta, creando una miel ámbar extra claro cremosa.

Nuestra apicultura rompe con lo convencional: no solo produce, sino que restaura y preserva, la llamamos apicultura regenerativa, reflejando transmitir confianza en que todo se puede regenerar y convertir hacia algo más profundo y capaz de crear un legado que trasciende la existencia humana. Ese legado emerge del bosque y de nuestra interdependencia tejida con los ritmos naturales.`,
    mision: {
      titulo: 'Nuestra Misión',
      texto: 'Hacemos que la miel de Chiloé sea un puente entre la regeneración ecológica y la salud metabólica y nutricional. Al ser recolectada desde bosques nativos antiguos y regenerados, el néctar brota transformado directo desde el sol, logrando desafiar directamente ante el impacto del azúcar refinada.',
      beneficios: [
        'Índice glucémico de ~55 —frente al 65 del azúcar blanco—',
        'Reduce los picos glucémicos, promoviendo energía estable',
        'Batida intermitentemente durante 48 horas',
        'Cada gota encapsula un vacío nutricional',
        'Polifenoles abundantes en Chiloé superan en capacidad antioxidante'
      ]
    },
    regeneracion: {
      titulo: 'Apicultura como Conexión Cósmica',
      texto: 'En Chiloé, trabajamos colaborativamente con nuestras colmenas, son sociedades complejas y sincronizadas al ritmo de las estaciones, al ritmo del sol. Cada verano es un nuevo comienzo en la recolección de miel.',
      innovacion: 'Innovamos con formatos minimalistas: sachets de 15 g como dosis exactas contra desbalances glucémicos, frascos de 150 g o 900 g para rituales profundos. Cada producto invita a un acto matutino: una cucharada que calma el ruido mental del azúcar simple, promoviendo claridad metabólica con efectos ansiolíticos mediados por precursores de serotonina.'
    }
  };

  const content = nosotrosData.length > 0 
    ? (nosotrosData[0].content as typeof defaultContent)
    : defaultContent;

  return (
    <StoreShell>
      <ShopHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:py-24">
        {/* Hero */}
        <div className="text-center mb-20">
          <span className="block text-[0.65rem] uppercase tracking-[0.4em] text-accent mb-6">
            {content.subtitle}
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-light text-foreground mb-8">
            {content.titulo}
          </h1>
        </div>

        {/* Main Story */}
        <div className="prose prose-lg prose-invert max-w-none mb-24">
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground whitespace-pre-line">
            {content.contenido}
          </p>
        </div>

        {/* Mission */}
        <div className="border-t border-border pt-16 mb-24">
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8 text-center">
            {content.mision.titulo}
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
            {content.mision.texto}
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {content.mision.beneficios.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4 p-6 bg-card border border-border rounded-2xl">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span className="text-sm text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regeneración */}
        <div className="border-t border-border pt-16 mb-24">
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8 text-center">
            {content.regeneracion.titulo}
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-8">
            {content.regeneracion.texto}
          </p>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto">
            {content.regeneracion.innovacion}
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
      <ShopFooter />
    </StoreShell>
  );
}
