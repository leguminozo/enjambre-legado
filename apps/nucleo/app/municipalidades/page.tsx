import Link from 'next/link';
import { ArrowRight, ExternalLink, Building2, ShieldCheck } from 'lucide-react';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { PrintButton } from '@/components/territorio/PrintButton';

export const metadata = {
  title: 'Municipalidades — Registro Municipal de Actividad Apícola | Registro Territorial de Chiloé',
  description:
    'Censo comunal en vivo, verificación automática de distancias legales (Ley 21.102) y registro de trashumancia. El registro ya está construido y con datos vivos: la comuna se sube a uno que funciona.',
};

/**
 * Propuesta B2G de una página (Documento 2) en versión web. Doble uso:
 * página pública de marketing institucional + PDF imprimible (Cmd/Ctrl+P)
 * para llevar a la reunión con SECPLAC / Fomento Productivo.
 *
 * TODO pendiente del dueño: completar los datos de contacto reales
 * (nombre, WhatsApp, correo) donde aparecen los placeholders.
 */
const FUENTES_FINANCIAMIENTO = [
  {
    nombre: 'SUBDERE — Programa Mejoramiento de la Gestión Municipal (PMGM)',
    detalle:
      'Financia hasta $16.000.000 por proyecto para desarrollo de sistemas de información en Fomento Productivo, dirigido a municipalidades de tipologías 3–5. Este proyecto calza exactamente en esa línea.',
    url: 'https://www.fondos.gob.cl/ficha/subdere/pmgm/',
  },
  {
    nombre: 'Agenda de Transformación Digital del Estado',
    detalle:
      'SUBDERE y la Secretaría de Gobierno Digital están coordinando asistencia técnica y financiamiento para implementar la LTDE en municipios durante 2026 — una ventana abierta hoy.',
    url: 'https://www.subdere.gov.cl/sala-de-prensa/subdere-y-secretar%C3%ADa-de-gobierno-digital-coordinan-la-implementaci%C3%B3n-de-la-ley-de',
  },
  {
    nombre: 'FOSIS Innova / CORFO Innova Región',
    detalle:
      'Pilotos de innovación pública y rural de hasta 7 meses, postulables en conjunto con la comunidad apícola.',
    url: 'https://www.chileatiende.gob.cl/fichas/74375/1/pdf',
  },
];

const CONTRATO = [
  {
    item: 'Implementación',
    detalle:
      'Configuración comunal, capacitación a funcionarios, jornada de inscripción asistida con apicultores locales',
    valor: '$900.000 (proyecto único)',
  },
  {
    item: 'Servicio anual',
    detalle:
      'Dashboard comunal, verificación de distancias, registro de trashumantes, alertas, exportaciones y soporte',
    valor: '$1.200.000 / año (o $120.000/mes)',
  },
  {
    item: 'Opcional: ordenanza apícola',
    detalle:
      'Redacción de ordenanza modelo adaptada a la comuna (basada en precedentes Panguipulli/Alhué/Colina)',
    valor: '$700.000 (proyecto único)',
  },
];

export default function MunicipalidadesPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />

      <section className="pt-16 pb-20 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            Propuesta para municipalidades
          </div>
          <h1 className="font-existencial text-foreground font-bold tracking-tight mb-3 text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.1] text-balance">
            Registro Municipal de Actividad Apícola
          </h1>
          <p className="text-lg text-muted-foreground mb-8 font-light">
            Territorio ordenado, apicultura protegida — con infraestructura que ya existe.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-10">
            <PrintButton />
            <Link
              href="/impacto"
              className="inline-flex min-h-11 items-center gap-2 px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              Ver datos de impacto verificable
            </Link>
          </div>

          <dl className="text-sm text-muted-foreground border border-border rounded-xl divide-y divide-border bg-surface-raised">
            <div className="flex gap-3 px-5 py-3">
              <dt className="shrink-0 font-medium text-foreground w-32">Para</dt>
              <dd>SECPLAC / Dirección de Fomento Productivo</dd>
            </div>
            <div className="flex gap-3 px-5 py-3">
              <dt className="shrink-0 font-medium text-foreground w-32">De</dt>
              <dd>
                Registro Territorial Apícola de Chiloé (proveedor tecnológico: La Obrera y el
                Zángano)
              </dd>
            </div>
            <div className="flex gap-3 px-5 py-3">
              <dt className="shrink-0 font-medium text-foreground w-32">Fecha</dt>
              <dd>Agosto 2026 · Vigencia propuesta: temporada 2026–2027</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* El problema */}
      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4 uppercase tracking-wide text-primary">
            El problema
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            La comuna no sabe cuántos apicultores tiene, dónde están sus apiarios, ni cuándo
            ingresan colmenas trashumantes. La Ley Apícola N° 21.102 exige distancias mínimas de 500
            m a 2,2 km entre apiarios según carga de colmenas — pero{' '}
            <strong className="text-foreground font-semibold">
              sin un registro territorial, esa distancia no se puede exigir
            </strong>
            . Otras comunas de Chile (Panguipulli, Alhué, Colina) ya crearon por ordenanza un
            Registro Municipal de Actividad Apícola; hoy esos registros se llevan en planillas y
            papel.
          </p>
        </div>
      </section>

      {/* La solución */}
      <section className="bg-background py-16 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4 uppercase tracking-wide text-primary">
            La solución: el registro ya está construido
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            La Red Territorial Apícola de Chiloé es una plataforma en funcionamiento que ya permite
            a la comuna:
          </p>
          <ol className="space-y-4 mb-8">
            {[
              {
                t: 'Censo comunal en vivo',
                d: 'apicultores inscritos, apiarios declarados y colmenas por comuna, con coordenadas protegidas (nunca públicas, conforme a Ley 21.719).',
              },
              {
                t: 'Verificación automática de distancias legales',
                d: 'cada nueva declaración de apiario se mide contra los existentes; lo que incumple queda suspendido para revisión municipal.',
              },
              {
                t: 'Registro de trashumancia con declaración previa',
                d: 'el apicultor itinerante declara origen, destino aproximado y certificado sanitario antes de instalarse.',
              },
              {
                t: 'Alertas fitosanitarias territoriales',
                d: 'avisos de aplicación de productos cerca de zonas de pecoreo.',
              },
              {
                t: 'Exportación de datos',
                d: 'descarga en CSV para informes, ordenanzas y respuesta a fiscalizaciones del SAG.',
              },
            ].map((p, i) => (
              <li key={p.t} className="flex items-start gap-4">
                <span className="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground font-semibold">{p.t}:</strong> {p.d}
                </p>
              </li>
            ))}
          </ol>
          <div className="border-l-4 border-primary bg-surface-raised rounded-r-xl p-5">
            <p className="font-serif italic text-foreground">
              Por qué es distinto a encargar un software: la red de apicultores ya se está
              inscribiendo sola — el censo insular 2026–2027 cierra el 31 de octubre. La
              municipalidad no compra un sistema vacío: se sube a uno que ya tiene datos vivos.
            </p>
          </div>
        </div>
      </section>

      {/* Qué contrata */}
      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 uppercase tracking-wide text-primary">
            Qué contrata la municipalidad
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-semibold text-foreground">Ítem</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Detalle</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {CONTRATO.map((c) => (
                  <tr key={c.item}>
                    <td className="px-5 py-4 font-medium text-foreground align-top">{c.item}</td>
                    <td className="px-5 py-4 text-muted-foreground align-top leading-relaxed">
                      {c.detalle}
                    </td>
                    <td className="px-5 py-4 text-foreground align-top whitespace-nowrap">
                      {c.valor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Valores finales, facturados conforme a la normativa vigente.
          </p>

          <h3 className="font-serif text-xl font-bold text-foreground mt-12 mb-6">
            Cómo se financia sin tocar el presupuesto de emergencia
          </h3>
          <div className="space-y-4">
            {FUENTES_FINANCIAMIENTO.map((f) => (
              <div key={f.nombre} className="bg-card border border-border rounded-xl p-5">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2 font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {f.nombre}
                  <ExternalLink className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                </a>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.detalle}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 font-serif italic text-foreground text-sm">
            Nosotros preparamos la ficha técnica del proyecto para la postulación: es parte del
            servicio.
          </p>
        </div>
      </section>

      {/* Por qué ahora */}
      <section className="bg-background py-16 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 uppercase tracking-wide text-primary">
            Por qué ahora
          </h2>
          <ul className="space-y-4">
            {[
              'El 31 de octubre cierra el censo 2026–2027 y coincide con la actualización anual obligatoria de apicultores ante el SAG (Res. 8.196/2015): es el mes de máxima conciencia de registro del año.',
              'La temporada de trashumancia (enero–febrero) es cuando el problema duele; la comuna que tenga registro en diciembre llega con herramientas, la que no, llega con reclamos.',
              'Desde 2025, todo apicultor debe llevar Cuaderno de Campo (Res. 4590/2025): la comuna puede apoyar el cumplimiento con herramientas en vez de solo fiscalizar.',
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Próximo paso */}
      <section className="bg-surface-raised py-16 px-6 sm:px-12 lg:px-24 border-y border-border text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Próximo paso
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Una reunión de 30 minutos con SECPLAC / Fomento Productivo: mostramos el dashboard
            funcionando con datos reales de la isla y dejamos la ficha técnica lista para postular.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-300 shadow-xl shadow-primary/20 group"
          >
            Contactar al Registro Territorial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="mt-6 text-xs text-muted-foreground">
            Contacto: La Obrera y el Zángano · [nombre] · [WhatsApp] · [correo] · obrerayzangano.online
          </p>
        </div>
      </section>

      {/* Nota del bien común */}
      <section className="bg-background py-12 px-6 sm:px-12 lg:px-24 text-center">
        <p className="max-w-2xl mx-auto text-sm text-muted-foreground font-serif italic">
          La Red Territorial es un bien común de los apicultores de Chiloé; este servicio financia
          su operación y la mantiene gratuita para ellos.
        </p>
      </section>

      <TerritorioFooter />
    </main>
  );
}
