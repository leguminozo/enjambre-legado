import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';

export const metadata = {
  title: 'Términos del registro territorial — Chiloé',
  description:
    'Condiciones de uso del censo y el mapa apícola de Chiloé. El registro básico es gratis. No reemplaza al SAG.',
};

export default function TerminosTerritorialesPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />
      <article className="mx-auto w-full max-w-2xl px-6 sm:px-8 py-16 sm:py-24">
        <p className="text-sm text-muted-foreground mb-4">Registro Territorial Apícola de Chiloé</p>
        <h1 className="font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-6">
          Términos de uso del registro
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          Estos términos cubren el censo, el mapa y las herramientas de la red. La compra de miel
          en la tienda tiene{' '}
          <a
            href="https://obrerayzangano.com/terminos"
            className="underline underline-offset-4"
          >
            sus propios términos
          </a>
          .
        </p>

        <section className="space-y-8 text-[0.95rem] leading-relaxed">
          <div>
            <h2 className="font-medium text-foreground mb-2">Qué es y qué no es</h2>
            <p className="text-muted-foreground">
              El registro es voluntario e informativo. No sustituye al SAG, a las municipalidades ni
              a los tribunales. Produce evidencia, coordinación y una declaración casi lista para
              firmar en octubre. La potestad fiscalizadora sigue en los órganos competentes.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Gratis y de pago</h2>
            <p className="text-muted-foreground">
              El censo, el mapa, las alertas y la ayuda con la declaración SAG son gratis. Los
              planes de trazabilidad y cuaderno se cobran aparte, con precio publicado en{' '}
              <Link href="/planes-territoriales" className="underline underline-offset-4">
                planes
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Uso leal</h2>
            <p className="text-muted-foreground">
              Declaras lo que sabes de tus apiarios. No uses el mapa para hostigar a otra persona.
              La red no persigue la trashumancia: persigue la que no se avisa.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Operador</h2>
            <p className="text-muted-foreground">
              La Obrera y el Zángano opera la infraestructura. La red es un bien común; la empresa
              es el proveedor técnico. Más en la{' '}
              <Link href="/carta" className="underline underline-offset-4">
                Carta constitutiva
              </Link>
              .
            </p>
          </div>
        </section>

        <p className="mt-12 text-sm text-muted-foreground">
          <Link href="/privacidad" className="underline underline-offset-4">
            Privacidad del censo
          </Link>
        </p>
      </article>
      <TerritorioFooter />
    </main>
  );
}
