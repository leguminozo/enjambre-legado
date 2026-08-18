import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { PrintButton } from '@/components/territorio/PrintButton';
import { COMUNAS_CHILOE, resolveComunaChiloe } from '@/lib/chiloe-comunas';
import { getInformeComunal } from '@/lib/informe-comunal-data';
import { INFORME_DISCLAIMER } from '@/lib/informe-comunal';

type Props = { params: Promise<{ comuna: string }> };

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return COMUNAS_CHILOE.map((c) => ({ comuna: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { comuna } = await params;
  const resolved = resolveComunaChiloe(comuna);
  const nombre = resolved?.nombre ?? comuna;
  return {
    title: `Informe comunal · ${nombre} — Registro Territorial Apícola`,
    description: `Agregados del censo territorial en ${nombre}: apicultores, apiarios, trashumancia y alertas. Sin nombres ni GPS exacto.`,
  };
}

export default async function InformeComunalPage({ params }: Props) {
  const { comuna } = await params;
  const resolved = resolveComunaChiloe(comuna);
  if (!resolved) notFound();

  const loaded = await getInformeComunal(resolved.slug).catch(() => ({ error: 'fetch' }) as const);
  const informe = loaded && !('error' in loaded) ? loaded.informe : null;
  const generado =
    loaded && !('error' in loaded)
      ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' }).format(
          new Date(loaded.generado_en),
        )
      : null;

  const metricas = informe
    ? [
        {
          label: 'Apicultores inscritos',
          value: informe.actores_activos.toLocaleString('es-CL'),
        },
        {
          label: 'Apiarios declarados',
          value: informe.apiarios_declarados.toLocaleString('es-CL'),
        },
        {
          label: 'Colmenas (agregado)',
          value: informe.colmenas_publicables
            ? (informe.colmenas ?? 0).toLocaleString('es-CL')
            : 's/d',
        },
        {
          label: 'Trashumantes declarados',
          value: informe.trashumantes_declarados.toLocaleString('es-CL'),
        },
        {
          label: 'Alertas fitosanitarias activas',
          value: informe.alertas_activas.toLocaleString('es-CL'),
        },
      ]
    : [];

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />
      <article className="flex-1 px-6 sm:px-12 lg:px-24 py-16">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Informe comunal · Provincia de Chiloé
          </p>
          <h1 className="font-existencial text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-tight mb-3">
            {resolved.nombre}
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Agregados vivos del Registro Territorial. Sirve para llevar al Concejo o a Fomento
            lo que ya está declarado — no un número de marketing.
          </p>
          <div className="flex flex-wrap gap-3 mb-10 print:hidden">
            <PrintButton label="Descargar informe PDF" />
            <Link
              href="/comuna"
              className="inline-flex min-h-11 items-center px-5 border border-border rounded-xl text-sm font-medium hover:bg-surface-sunken"
            >
              Todas las comunas
            </Link>
            <Link
              href="/mapa-chiloe"
              className="inline-flex min-h-11 items-center px-5 border border-border rounded-xl text-sm font-medium hover:bg-surface-sunken"
            >
              Mapa público
            </Link>
          </div>

          {generado && <p className="text-xs text-muted-foreground mb-6">Generado: {generado}</p>}

          {!informe && (
            <p className="text-sm text-destructive mb-8" role="alert">
              No se pudo leer el agregado ahora. La comuna existe; los números no se inventan si
              el servicio no responde.
            </p>
          )}

          {informe && (
            <>
              {informe.vacio && (
                <p className="mb-8 rounded-xl border border-border bg-surface-sunken/50 px-4 py-3 text-sm text-muted-foreground">
                  Censo fundacional: en {resolved.nombre} todavía no hay declaraciones activas.
                  El cero es el dato.
                </p>
              )}
              <dl className="divide-y divide-border border border-border rounded-xl overflow-hidden mb-8">
                {metricas.map((m) => (
                  <div key={m.label} className="flex items-baseline justify-between gap-4 px-5 py-4">
                    <dt className="text-sm text-muted-foreground">{m.label}</dt>
                    <dd className="text-xl font-semibold tabular-nums">{m.value}</dd>
                  </div>
                ))}
              </dl>
              {informe.nota_colmenas && (
                <p className="text-sm text-muted-foreground mb-8">{informe.nota_colmenas}</p>
              )}
            </>
          )}

          <section className="space-y-3 text-sm text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-foreground font-medium">Qué no incluye este papel</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ubicaciones exactas de apiarios.</li>
              <li>Nombres, RUT, RUP o teléfonos.</li>
              <li>Una resolución del SAG ni un permiso municipal.</li>
              <li>Cumplimiento automático de distancias (el sistema solo apoya la revisión).</li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground leading-relaxed mb-8">{INFORME_DISCLAIMER}</p>

          <p className="text-sm print:hidden">
            <Link href="/municipalidades" className="underline underline-offset-4">
              Cómo se usa esto en un convenio municipal
            </Link>
            {' · '}
            <Link href="/municipalidades/kit" className="underline underline-offset-4">
              Kit municipal
            </Link>
          </p>
        </div>
      </article>
      <TerritorioFooter />
    </main>
  );
}
