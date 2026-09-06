import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  B2B_SEGMENTS,
  isValidSegment,
  getSegmentContent,
} from '@/lib/b2b/segment-content';
import { PrintButton } from '@/components/b2b/print-button';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';
const WA_E164 = '56940831358';
const EMAIL = 'obrerayzangano@gmail.com';

export async function generateStaticParams() {
  return B2B_SEGMENTS.map((segmento) => ({ segmento }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segmento: string }>;
}): Promise<Metadata> {
  const { segmento } = await params;
  const content = getSegmentContent(segmento);
  if (!content) return {};
  return {
    title: content.leadMagnet.fichaTitle,
    description: content.leadMagnet.fichaBlurb,
    alternates: { canonical: `${SITE_URL}/para/${segmento}/ficha` },
    robots: { index: true, follow: true },
  };
}

export default async function ParaFichaPage({
  params,
}: {
  params: Promise<{ segmento: string }>;
}) {
  const { segmento } = await params;
  if (!isValidSegment(segmento)) notFound();
  const content = getSegmentContent(segmento);
  if (!content) notFound();

  const bullets = content.valueProps.slice(0, 3).map((v) => v.title);
  const wa = `https://wa.me/${WA_E164}?text=${encodeURIComponent(content.leadMagnet.whatsappText)}`;

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground print:bg-white print:text-black">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .ficha-sheet { box-shadow: none !important; border: none !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
        }
      `}</style>

      <div className="no-print px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 flex flex-wrap gap-3 justify-between items-center max-w-3xl mx-auto">
        <Link
          href={`/para/${segmento}`}
          className="inline-flex min-h-11 items-center text-sm text-accent-text underline underline-offset-2"
        >
          ← Volver a la propuesta
        </Link>
        <PrintButton />
      </div>

      <article className="ficha-sheet mx-auto max-w-3xl px-6 py-10 md:py-14 border border-border/30 rounded-2xl md:my-6 print:my-0 print:rounded-none">
        <header className="text-center border-b border-border/30 pb-8 mb-8">
          <p className="text-[0.65rem] tracking-[0.45em] uppercase text-accent-text mb-4">
            La Obrera y el Zángano · {content.kicker}
          </p>
          <h1 className="font-display text-[clamp(1.75rem,5vw,2.75rem)] font-light text-balance mb-4">
            {content.headline}
          </h1>
          <p className="font-display italic text-muted-foreground max-w-xl mx-auto text-pretty">
            {content.leadMagnet.fichaBlurb}
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-4">
            Tres puntos
          </h2>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm leading-relaxed">
                <span className="text-accent-text shrink-0" aria-hidden>
                  ·
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8 grid grid-cols-3 gap-3 text-center">
          {[
            { g: '25 g', d: 'Impulso / amenity' },
            { g: '150 g', d: 'Mesa / barra' },
            { g: '500 g', d: 'Reserva / interno' },
          ].map((f) => (
            <div key={f.g} className="rounded-xl border border-border/40 px-3 py-4">
              <p className="font-display text-2xl text-accent-text">{f.g}</p>
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                {f.d}
              </p>
            </div>
          ))}
        </section>

        <p className="text-xs text-muted-foreground leading-relaxed mb-8 text-center">
          {content.priceAnchor}
        </p>

        <section className="rounded-xl border border-border/40 bg-surface-raised/40 print:bg-transparent px-6 py-6 text-center">
          <p className="text-[0.65rem] tracking-[0.35em] uppercase text-accent-text mb-3">
            Cotizar
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Respuesta en menos de 24 horas hábiles · WhatsApp +56 9 4083 1358 · {EMAIL}
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
              href={`mailto:${EMAIL}?subject=${encodeURIComponent(content.leadMagnet.fichaTitle)}`}
              className="inline-flex min-h-12 items-center rounded-full border border-border px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground"
            >
              Email
            </a>
            <Link
              href={`/para/${segmento}#registro`}
              className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-primary-foreground"
            >
              {content.ctaText}
            </Link>
          </div>
          <p className="hidden print:block text-sm mt-2">
            wa.me/{WA_E164} · {EMAIL} · obrerayzangano.cl/para/{segmento}
          </p>
        </section>

        <p className="mt-8 text-center text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
          Pureo, Queilén, Chiloé · Operado con Cristina Miranda
        </p>
      </article>
    </main>
  );
}
