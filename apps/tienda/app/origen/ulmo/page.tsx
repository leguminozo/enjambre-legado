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
    question: '¿Qué propiedades tiene la miel de ulmo?',
    answer:
      'La miel de ulmo cruda conserva enzimas activas, antioxidantes naturales y un perfil polínico único que la hace trazable a su origen. Su índice glicémico estimado es menor al del azúcar refinada, y su producción en el bosque nativo genera un impacto regenerativo medible a través del índice IRR.',
  },
]);

export default function UlmoPage() {
  return (
    <Shell>
      <JsonLd data={faqSchema} />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Origen · Monografía
        </span>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Ulmo
        </h1>
        <p className="mt-2 font-display text-xl italic text-accent">
          Eucryphia cordifolia
        </p>

        <section className="mt-12 space-y-6 text-foreground/80 leading-relaxed">
          <p>
            El ulmo es un árbol centenario del bosque valdiviano, endémico del
            sur de Chile y Argentina. Puede alcanzar los 40 metros de altura y
            vivir más de 500 años. Su floración —entre enero y marzo— es el
            evento más esperado del calendario apícola del sur del planeta.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Perfil organoléptico
          </h2>
          <p>
            Miel clara, color ámbar dorado pálido. Aroma floral intenso con
            notas de vainilla y un dejo de cítrico. Paladar suave, sedoso, con
            dulzor equilibrado que no empalaga. Final limpio, ligeramente
            balsámico. Su cristalización es fina y cremosa, formando una textura
            que se unta como mantequilla.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Botánica
          </h2>
          <p>
            Eucryphia cordifolia pertenece a la familia Cunoniaceae. Es uno de
            los árboles más antiguos del bosque valdiviano, un ecosistema
            templado lluvioso considerado uno de los 25 hotspots de
            biodiversidad del planeta. El ulmo requiere altos niveles de
            humedad y precipitación constante, condiciones que solo se dan en
            la franja entre los 38° y los 44° de latitud sur.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Maridaje
          </h2>
          <p>
            La miel de ulmo acompaña queso brie y camembert sin eclipsar su
            cremosidad. Sobre pan de masa madre con mantequilla, se convierte
            en un desayuno que redefine lo cotidiano. En infusiones, eleva sin
            enmascarar. En repostería, aporta floralidad sin el peso del
            azúcar refinado.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Temporada
          </h2>
          <p>
            La cosecha de ulmo ocurre entre enero y marzo, al final del verano
            austral. Cada año, la disponibilidad depende de las condiciones
            climáticas de la primavera y el inicio del verano: una primavera
            lluviosa retrasa la floración, un verano seco la acelera. No hay
            dos cosechas iguales. La producción es limitada y variable —no por
            diseño, sino porque así funciona el bosque.
          </p>

          <h2 className="pt-8 font-display text-2xl font-semibold text-foreground">
            Impacto regenerativo
          </h2>
          <p>
            Cada kilo de miel de ulmo producido en el bosque nativo evita la
            emisión de CO2 asociada a la producción industrial de azúcar
            refinada. El índice IRR de las cosechas de ulmo generalmente
            supera 1.0, indicando que el impacto positivo de la apicultura en
            el bosque nativo excede su huella ecológica. Los apiarios de OYZ
            en zonas de ulmo contribuyen directamente a la conservación del
            bosque valdiviano mediante monitoreo de colmenas y protección del
            sotobosque.
          </p>
        </section>

        <div className="mt-16 border-t border-border pt-8">
        <Link href="/catalogo">&larr; Explorar creaciones</Link>
        </div>
      </article>
    </Shell>
  );
}
