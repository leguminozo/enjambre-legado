import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { PrintButton } from '@/components/territorio/PrintButton';
import { COMUNAS_CHILOE } from '@/lib/chiloe-comunas';
import { getInformesChiloe } from '@/lib/informe-comunal-data';
import { INFORME_DISCLAIMER } from '@/lib/informe-comunal';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Informes comunales — Registro Territorial Apícola de Chiloé',
  description:
    'Agregados por comuna del censo territorial: apicultores, apiarios, trashumancia declarada y alertas. Sin nombres ni GPS exacto.',
};

export default async function ComunasIndexPage() {
  const payload = await getInformesChiloe().catch(() => ({ error: 'fetch' }) as const);
  const ok = payload && !('error' in payload);
  const informes = ok ? payload.informes : null;
  const generado = ok
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(payload.generado_en),
      )
    : null;

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />
      <article className="flex-1 px-6 sm:px-12 lg:px-24 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Informe público por comuna
          </p>
          <h1 className="font-existencial text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-tight mb-4 text-balance">
            Qué registra hoy cada comuna de Chiloé
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Números agregados del Registro Territorial. Si una celda está en cero, es porque
            todavía no hay declaraciones — no rellenamos el informe.
          </p>
          <div className="flex flex-wrap gap-3 mb-8 print:hidden">
            <PrintButton label="Imprimir tabla / PDF" />
            <Link
              href="/municipalidades"
              className="inline-flex min-h-11 items-center px-5 border border-border rounded-xl text-sm font-medium hover:bg-surface-sunken"
            >
              Propuesta municipal
            </Link>
          </div>
          {generado && (
            <p className="text-xs text-muted-foreground mb-4">Generado: {generado}</p>
          )}

          {!ok && (
            <p className="text-sm text-destructive mb-6" role="alert">
              No se pudieron cargar los agregados ahora. Las comunas siguen listadas; no
              mostramos ceros inventados.
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3">Comuna</th>
                  <th className="p-3">Apicultores</th>
                  <th className="p-3">Apiarios</th>
                  <th className="p-3">Colmenas</th>
                  <th className="p-3">Trashumantes</th>
                  <th className="p-3">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {(informes ?? COMUNAS_CHILOE.map((c) => ({ slug: c.slug, comuna: c.nombre }))).map(
                  (i) => (
                    <tr key={i.slug} className="border-b border-border/50 last:border-0">
                      <td className="p-3 font-medium">
                        <Link href={`/comuna/${i.slug}`} className="underline underline-offset-4">
                          {i.comuna}
                        </Link>
                      </td>
                      {'actores_activos' in i ? (
                        <>
                          <td className="p-3 tabular-nums">{i.actores_activos}</td>
                          <td className="p-3 tabular-nums">{i.apiarios_declarados}</td>
                          <td className="p-3 tabular-nums">
                            {i.colmenas_publicables
                              ? (i.colmenas ?? 0).toLocaleString('es-CL')
                              : 's/d'}
                          </td>
                          <td className="p-3 tabular-nums">{i.trashumantes_declarados}</td>
                          <td className="p-3 tabular-nums">{i.alertas_activas}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-muted-foreground">—</td>
                          <td className="p-3 text-muted-foreground">—</td>
                          <td className="p-3 text-muted-foreground">—</td>
                          <td className="p-3 text-muted-foreground">—</td>
                          <td className="p-3 text-muted-foreground">—</td>
                        </>
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">{INFORME_DISCLAIMER}</p>
        </div>
      </article>
      <TerritorioFooter />
    </main>
  );
}
