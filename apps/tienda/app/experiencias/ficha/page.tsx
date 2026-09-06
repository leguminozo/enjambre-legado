import type { Metadata } from 'next';
import Link from 'next/link';
import { PrintButton } from '@/components/b2b/print-button';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';
const WA_E164 = '56940831358';
const EMAIL = 'obrerayzangano@gmail.com';
const WA_TEXT =
  'Hola OyZ — quiero cotizar una experiencia Floraciones (grupo, fecha y traslado).';

export const metadata: Metadata = {
  title: 'Ficha 1 página · Experiencias Floraciones',
  description:
    'Floraciones: sesión 90–120 min, aforo 6–20, conducción Cristina Miranda. Cotización <24 h hábiles.',
  alternates: { canonical: `${SITE_URL}/experiencias/ficha` },
};

export default function ExperienciasFichaPage() {
  const wa = `https://wa.me/${WA_E164}?text=${encodeURIComponent(WA_TEXT)}`;

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground print:bg-white print:text-black">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .no-print { display: none !important; }
          .ficha-sheet { border: none !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
        }
      `}</style>

      <div className="no-print px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 flex flex-wrap gap-3 justify-between items-center max-w-3xl mx-auto">
        <Link
          href="/experiencias"
          className="inline-flex min-h-11 items-center text-sm text-accent-text underline underline-offset-2"
        >
          ← Volver a experiencias
        </Link>
        <PrintButton />
      </div>

      <article className="ficha-sheet mx-auto max-w-3xl px-6 py-10 md:py-14 border border-border/30 rounded-2xl md:my-6">
        <header className="text-center border-b border-border/30 pb-8 mb-8">
          <p className="text-[0.65rem] tracking-[0.45em] uppercase text-accent-text mb-4">
            La Obrera y el Zángano · Experiencias
          </p>
          <h1 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-light text-balance mb-4">
            Floraciones
          </h1>
          <p className="font-display italic text-muted-foreground max-w-xl mx-auto text-pretty">
            Sesión inmersiva del bosque: cata, oficio y origen en Chiloé — conducida por Cristina Miranda.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-4">
            Tres puntos
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="text-accent-text" aria-hidden>·</span>
              <span>Duración 90–120 minutos</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-text" aria-hidden>·</span>
              <span>Aforo 6–20 personas</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent-text" aria-hidden>·</span>
              <span>Conducción: Cristina Miranda · Pureo, Queilén, Chiloé</span>
            </li>
          </ul>
        </section>

        <p className="text-sm text-muted-foreground leading-relaxed text-center mb-8">
          Sesión a cotizar · respuesta &lt;24 h hábiles · sin lista de precios genérica en pantalla
          (cada visita se acuerda según grupo, fecha y traslado).
        </p>

        <section className="rounded-xl border border-border/40 px-6 py-6 text-center">
          <p className="text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-3">
            Pedir propuesta
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            WhatsApp +56 9 4083 1358 · {EMAIL}
          </p>
          <div className="flex flex-wrap justify-center gap-3 no-print">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-full border border-accent px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-accent-text"
            >
              WhatsApp cotizar
            </a>
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent('Cotizar experiencia Floraciones')}`}
              className="inline-flex min-h-12 items-center rounded-full border border-border px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground"
            >
              Email
            </a>
            <Link
              href="/experiencias"
              className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-primary-foreground"
            >
              Pedir propuesta
            </Link>
          </div>
          <p className="hidden print:block text-sm mt-2">
            wa.me/{WA_E164} · {EMAIL} · obrerayzangano.cl/experiencias
          </p>
        </section>
      </article>
    </main>
  );
}
