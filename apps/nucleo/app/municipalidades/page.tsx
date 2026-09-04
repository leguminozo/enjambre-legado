import Link from 'next/link';
import {
  ArrowRight,
  ExternalLink,
  Building2,
  ShieldCheck,
  Scale,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { PrintButton } from '@/components/territorio/PrintButton';
import { ContactoInstitucionalForm } from '@/components/territorio/ContactoInstitucionalForm';
import { CONTACTO_INSTITUCIONAL, lineaProveedor } from '@/lib/contacto-institucional';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Piloto 90 días — Registro comunal apícola para DIDECO',
  description:
    'La Ley 21.489 deja a la comuna mal parada si no hace nada. Piloto de 90 días: censo, panel, ordenanza y Compra Ágil bajo 100 UTM. No sustituye al SIPEC.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/municipalidades',
  },
  openGraph: {
    title: 'Piloto 90 días · Registro comunal apícola para DIDECO',
    description:
      'La Ley 21.489 deja a la comuna mal parada si no hace nada. Censo, panel y ordenanza en 90 días. No sustituye al SAG ni al SIPEC.',
    url: 'https://www.registroapicolachiloe.me/municipalidades',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Piloto 90 días · Registro comunal apícola para DIDECO',
    description:
      'La Ley 21.489 deja a la comuna mal parada si no hace nada. Censo, panel y ordenanza en 90 días.',
  },
};

const COMPETENCIAS_MUNICIPALES = [
  {
    art: 'Art. 4° letra f)',
    norma: 'Ley N° 18.695 (LOCM)',
    titulo: 'Fomento Productivo y Desarrollo Local',
    desc: 'Faculta al municipio a impulsar la productividad rural y la asociatividad apícola. El censo comunal es el insumo, no un recambio del SIPEC.',
  },
  {
    art: 'Art. 4° letra b)',
    norma: 'Ley N° 18.695 (LOCM)',
    titulo: 'Salud Pública y Protección Ambiental',
    desc: 'Permite resguardar polinizadores y el bosque nativo cuando hay plaguicidas o saturación de colmenares. Sin mapa local, DIDECO actúa a ciegas.',
  },
  {
    art: 'Art. 4° letra i)',
    norma: 'Ley N° 18.695 (LOCM)',
    titulo: 'Gestión del Riesgo y Emergencias',
    desc: 'Habilita al municipio para prevenir y atender mortandades masivas por plaguicidas o eventos climáticos. El canal de avisos es comunal; la sanción sanitaria sigue en el SAG.',
  },
  {
    art: 'Art. 5° letra c)',
    norma: 'Ley N° 18.695 (LOCM)',
    titulo: 'Bienes Nacionales de Uso Público',
    desc: 'Administración de fajas fiscales y caminos rurales donde se emplazan o transitan colmenares en temporada.',
  },
];

const FUENTES_FINANCIAMIENTO = [
  {
    nombre: 'Compra Ágil / Presupuesto Corriente (DIDECO / Fomento)',
    detalle:
      'El piloto ($2,4 a $3,6 millones + IVA) está bajo 100 UTM. Compra Ágil (Ley N° 19.886 y Ley N° 21.634) no es trato directo: exige al menos tres cotizaciones y primer llamado a Empresa de Menor Tamaño. El proveedor debe estar hábil en ChileProveedores al adjudicar.',
    url: 'https://www.mercadopublico.cl/',
    tag: 'Bajo 100 UTM · 3 cotizaciones',
  },
  {
    nombre: 'SUBDERE — Fondo de Incentivo a la Gestión Municipal (FIGEM) y Fortalecimiento',
    detalle:
      'Líneas de inversión institucional y fortalecimiento de sistemas de información municipal para desarrollo productivo y sustentabilidad local en municipios de tipologías 3, 4 y 5.',
    url: 'https://www.subdere.gov.cl/',
    tag: 'Fondo Sectorial',
  },
  {
    nombre: 'Agenda de Transformación Digital del Estado (Ley N° 21.180)',
    detalle:
      'SUBDERE y la Secretaría de Gobierno Digital coordinan financiamiento y asistencia para digitalizar procesos territoriales. El piloto no pretende ser el sistema nacional de registro apícola.',
    url: 'https://www.gobiernodigital.gob.cl/',
    tag: 'Modernización',
  },
  {
    nombre: 'Gobierno Regional de Los Lagos — FNDR Fomento / 8% Comunitario',
    detalle:
      'Líneas concursables de fomento productivo rural, protección de la biodiversidad y soberanía alimentaria del archipiélago.',
    url: 'https://www.goreloslagos.cl/',
    tag: 'Regional',
  },
];

const CONTRATO = [
  {
    item: 'Piloto 90 días',
    detalle:
      'Despliegue del panel comunal, inducción a funcionarios, jornada de censo asistido en terreno, borrador de ordenanza para Jurídica/Concejo e informe de línea base. Incluye doce meses de alojamiento del módulo comunal.',
    mecanismo: 'Compra Ágil (3 cotizaciones, primer llamado EMT)',
    valor: '$2.400.000 a $3.600.000 + IVA',
    sub: 'Según comuna · ~33 a 50 UTM',
  },
  {
    item: 'Continuidad (año 2)',
    detalle:
      'Soporte técnico, licenciamiento del módulo comunal e informe anual agregado. Se cotiza de nuevo; no es trato directo fundado por el solo hecho del piloto.',
    mecanismo: 'Compra Ágil u otra vía de la Ley 19.886',
    valor: 'Desde $1.200.000 + IVA / año',
    sub: 'Posterior al primer año · ~17 UTM/año',
  },
];

const MARCO_LEGAL_TABLA = [
  {
    norma: 'Ley N° 18.695 (Orgánica de Municipalidades)',
    exige: 'Fomento productivo (Art. 4 f), medio ambiente (Art. 4 b) y emergencias comunales (Art. 4 i).',
    red: 'Da a DIDECO un panel vivo para ordenar el territorio. SECPLAC entra al trámite de contratación, no a la primera reunión.',
  },
  {
    norma: 'Ley N° 21.489 (Ley Apícola Nacional)',
    exige: 'Obliga al tenedor de abejas a inscribirse ante el SAG (SIPEC), declarar existencias y respetar distancias de pecoreo. No nombra al municipio como registrador nacional.',
    red: 'Censo comunal complementario. No sustituye al SIPEC. Si la comuna no tiene mapa local, queda mal parada cuando hay conflicto o mortandad.',
  },
  {
    norma: 'D.S. N° 21 y 22 / 2024 (MINAGRI)',
    exige: 'Reglamentos de trashumancia y apicultura urbana (distancias mínimas a caminos y viviendas).',
    red: 'Muestra distancias geodésicas (Haversine) entre puntos declarados, con revisión humana. No calcula carga floral ni valida legalmente un emplazamiento.',
  },
  {
    norma: 'Res. Exenta SAG N° 7.068 / 2024',
    exige: 'Avisos obligatorios de plaguicidas tóxicos a apicultores con al menos 48 h de anticipación.',
    red: 'Canal comunal georreferenciado para que el agricultor deje constancia. No reemplaza el aviso que el aplicador deba hacer ante el SAG.',
  },
  {
    norma: 'Res. Exenta SAG N° 7.067 / 2024',
    exige: 'Formulario de Movimiento de Colmenas (FMC) con 72 h de anticipación en SIPEC.',
    red: 'El municipio puede pedir copia o número del FMC al arribo. No crea un plazo municipal paralelo de 72 h.',
  },
  {
    norma: 'Ley N° 19.628 y Ley N° 21.719',
    exige: 'Protección de datos personales y privacidad por diseño.',
    red: 'El titular es el apicultor. El municipio es responsable del tratamiento del registro comunal; el operador técnico, encargado si se contrata. Mapa público solo con zonas aproximadas (~1 km).',
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
            Piloto de 90 días para DIDECO
          </div>
          <h1 className="font-existencial text-foreground font-bold tracking-tight mb-3 text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.1] text-balance">
            La ley deja a la comuna mal parada si no hace nada
          </h1>
          <p className="text-lg text-muted-foreground mb-8 font-light">
            La Ley N° 21.489 obliga al apicultor ante el SAG. No convierte al municipio en SIPEC.
            Cuando hay trashumancia, plaguicidas o un conflicto de pecoreo, DIDECO necesita un mapa
            local. Esto es un piloto de 90 días — no un recambio del registro nacional.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-10">
            <PrintButton />
            <Link
              href="/municipalidades/kit"
              className="inline-flex min-h-11 items-center gap-2 px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Kit municipal
            </Link>
            <Link
              href="/municipalidades/ordenanza-modelo"
              className="inline-flex min-h-11 items-center gap-2 px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              Borrador de ordenanza
            </Link>
            <Link
              href="/comuna"
              className="inline-flex min-h-11 items-center gap-2 px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              Informe comunal en vivo
            </Link>
          </div>

          <dl className="text-sm text-muted-foreground border border-border rounded-xl divide-y divide-border bg-surface-raised">
            <div className="flex gap-3 px-5 py-3">
              <dt className="shrink-0 font-medium text-foreground w-32">Dirigido a</dt>
              <dd>DIDECO (puerta de entrada) · Asesoría Jurídica · Adquisiciones / SECPLAC · Medio Ambiente · Alcaldía</dd>
            </div>
            <div className="flex gap-3 px-5 py-3">
              <dt className="shrink-0 font-medium text-foreground w-32">Proveedor</dt>
              <dd>
                {lineaProveedor()}. Sociedad constituida el {CONTACTO_INSTITUCIONAL.constituida} en{' '}
                {CONTACTO_INSTITUCIONAL.comuna}. Inicio de actividades SII y ChileProveedores en trámite.
              </dd>
            </div>
            <div className="flex gap-3 px-5 py-3">
              <dt className="shrink-0 font-medium text-foreground w-32">Plazo</dt>
              <dd>Piloto de 90 días corridos · temporada 2026–2027</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider mb-2">
            <Scale className="w-4 h-4" />
            Marco Jurídico de Actuación Municipal
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            ¿Por qué puede actuar el municipio — y qué no le pide la ley apícola?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            La Ley N° 21.489 no obliga a la municipalidad a comprar un registro digital ni a
            sustituir al SAG. La{' '}
            <strong className="text-foreground">Ley N° 18.695</strong> sí le da competencias de
            fomento, medio ambiente y emergencias. El vacío está en el medio: el apicultor debe
            registrarse ante el SAG, y la comuna no tiene instrumento propio para ver el territorio.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPETENCIAS_MUNICIPALES.map((c) => (
              <div key={c.art} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">{c.art}</span>
                  <span className="text-[0.65rem] uppercase text-muted-foreground">{c.norma}</span>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{c.titulo}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4 uppercase tracking-wide text-primary">
            El piloto de 90 días
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            El municipio no encarga un desarrollo desde cero. Se conecta a una plataforma que ya
            existe para el censo territorial de Chiloé y se configura el módulo comunal:
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-card mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-semibold text-foreground">Normativa</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Qué exige (de verdad)</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Qué hace el piloto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                {MARCO_LEGAL_TABLA.map((m) => (
                  <tr key={m.norma}>
                    <td className="px-4 py-3 align-top font-medium text-foreground text-xs">{m.norma}</td>
                    <td className="px-4 py-3 align-top text-xs">{m.exige}</td>
                    <td className="px-4 py-3 align-top text-xs text-foreground/90">{m.red}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-background py-16 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 uppercase tracking-wide text-primary">
            Qué se cotiza
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-semibold text-foreground">Ítem</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Alcance</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Vía</th>
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
                    <td className="px-5 py-4 text-xs text-primary align-top font-mono">
                      {c.mecanismo}
                    </td>
                    <td className="px-5 py-4 text-foreground align-top whitespace-nowrap">
                      <div className="font-semibold">{c.valor}</div>
                      <div className="text-[0.7rem] text-muted-foreground">{c.sub}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Valores referenciales en pesos chilenos, más IVA. UTM de referencia agosto 2026: $71.649
            (100 UTM ≈ $7,16 millones). Factura el operador {lineaProveedor()} cuando esté en
            condiciones de emitir DTE. No se cotiza como honorarios de segunda categoría.
          </p>

          <h3 className="font-serif text-xl font-bold text-foreground mt-12 mb-4">
            Vías de contratación
          </h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Bajo 100 UTM el municipio puede usar Compra Ágil. Eso no es contratación directa ni
            exime de tres cotizaciones ni del primer llamado a EMT:
          </p>
          <div className="space-y-4">
            {FUENTES_FINANCIAMIENTO.map((f) => (
              <div key={f.nombre} className="bg-surface-raised border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-1 gap-3">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors text-sm"
                  >
                    {f.nombre}
                    <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                  </a>
                  <span className="text-[0.65rem] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                    {f.tag}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.detalle}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 font-serif italic text-foreground text-sm">
            Entregamos TDR listos para que DIDECO derive el trámite a Jurídica y Adquisiciones. El
            operador aún completa inicio de actividades SII y ChileProveedores.
          </p>
        </div>
      </section>



      <section className="bg-background py-16 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 uppercase tracking-wide text-primary">
            Por qué ahora
          </h2>
          <ul className="space-y-4">
            {[
              'El 31 de octubre de 2026 cierra la Declaración Anual de Existencias ante el SAG: es cuando los apicultores locales más necesitan ordenar papeles. El piloto no “valida” esa declaración; la asiste.',
              'La trashumancia estival (diciembre a marzo) concentra colmenares foráneos. Una comuna que implemente en primavera llega al verano con línea base, no con un conflicto ya instalado.',
              'La Res. SAG N° 7.068/2024 exige avisos de fumigación a 48 h. El municipio puede ofrecer un canal comunal; no se convierte en la autoridad sanitaria.',
            ].map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-surface-raised py-16 px-6 sm:px-12 lg:px-24 border-y border-border text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-4">
            30 minutos con DIDECO
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Panel comunal con datos reales de Chiloé —ceros incluidos, sin relleno— y carpeta para
            Jurídica y Compra Ágil.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden">
            <Link
              href="#contacto"
              className="inline-flex min-h-12 items-center justify-center px-8 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-95"
            >
              Solicitar presentación
            </Link>
            <Link
              href="/mapa-chiloe"
              className="inline-flex min-h-12 items-center justify-center gap-2 px-8 border border-border text-foreground rounded-xl font-medium hover:bg-surface-sunken"
            >
              Ver mapa territorial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <PrintButton />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{lineaProveedor()} · Queilén, Chiloé.</p>
        </div>
      </section>

      <section
        id="contacto"
        className="bg-background py-16 px-6 sm:px-12 lg:px-24 border-t border-border print:hidden"
      >
        <div className="max-w-4xl mx-auto">
          <ContactoInstitucionalForm />
        </div>
      </section>

      <section className="bg-background py-12 px-6 sm:px-12 lg:px-24 text-center">
        <p className="max-w-2xl mx-auto text-sm text-muted-foreground font-serif italic">
          El censo base sigue siendo gratuito para el apicultor. El piloto municipal financia el
          módulo comunal, el trabajo en terreno y el soporte. No compra el SIPEC ni nombra a un
          proveedor en la ordenanza.
        </p>
      </section>

      <TerritorioFooter />
    </main>
  );
}
