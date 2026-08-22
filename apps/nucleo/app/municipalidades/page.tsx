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

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal Municipal — Registro Territorial Apícola de Chiloé',
  description:
    'Censo comunal en vivo, mapa protegido y herramientas para SECPLAC y Fomento Productivo para coordinar trashumancia, fitosanitarios y pecoreo bajo la Ley N° 21.489 y Ley N° 18.695.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/municipalidades',
  },
  openGraph: {
    title: 'Portal Municipal Apícola · Archipiélago de Chiloé',
    description:
      'Censo comunal y ordenanza modelo para SECPLAC y Fomento Productivo. Protección de zonas de pecoreo y coordinación bajo la Ley N° 21.489 y competencias de la Ley N° 18.695.',
    url: 'https://www.registroapicolachiloe.me/municipalidades',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal Municipal Apícola · Archipiélago de Chiloé',
    description:
      'Censo comunal y ordenanza modelo para SECPLAC y Fomento Productivo. Protección de zonas de pecoreo y coordinación bajo la Ley N° 21.489.',
  },
};

const COMPETENCIAS_MUNICIPALES = [
  {
    art: 'Art. 4° letra f)',
    norma: 'Ley N° 18.695 (LOCM)',
    titulo: 'Fomento Productivo y Desarrollo Local',
    desc: 'Faculta al municipio a impulsar la productividad rural, la asociatividad apícola y la agregación de valor a la miel insular.',
  },
  {
    art: 'Art. 4° letra b)',
    norma: 'Ley N° 18.695 (LOCM)',
    titulo: 'Salud Pública y Protección Ambiental',
    desc: 'Permite resguardar los polinizadores nativos, la biodiversidad del bosque y la inocuidad en el manejo comunal.',
  },
  {
    art: 'Art. 4° letra i)',
    norma: 'Ley N° 18.695 (LOCM)',
    titulo: 'Gestión del Riesgo y Emergencias',
    desc: 'Habilita al municipio para prevenir y atender mortandades masivas por plaguicidas o eventos climáticos extremos.',
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
    nombre: 'Compra Ágil / Presupuesto Corriente Municipal (DIDECO / Fomento)',
    detalle:
      'Al ser servicios por montos inferiores a 30 UTM, la contratación puede efectuarse de forma directa y expedita vía Compra Ágil en Mercado Público (Ley N° 19.886 y Ley N° 21.634) sin requerir licitación pública.',
    url: 'https://www.mercadopublico.cl/',
    tag: 'Expedito (< 30 UTM)',
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
      'SUBDERE y la Secretaría de Gobierno Digital coordinan financiamiento y asistencia para digitalizar procesos territoriales e interoperabilidad de datos locales durante 2026.',
    url: 'https://www.gobiernodigital.gob.cl/',
    tag: 'Modernización 2026',
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
    item: 'Implementación y Censo Asistido',
    detalle:
      'Configuración del dashboard comunal, inducción técnica a funcionarios municipales y jornada de inscripción asistida en terreno con apicultores locales.',
    mecanismo: 'Compra Ágil (Mercado Público)',
    valor: '$900.000',
    sub: 'Proyecto único (~13,5 UTM)',
  },
  {
    item: 'Suscripción y Dashboard Anual',
    detalle:
      'Panel comunal en vivo, verificación de distancias de pecoreo (Ley 21.489), canal de alertas fitosanitarias, registro de trashumancia, exportaciones oficiales y soporte continuo.',
    mecanismo: 'Compra Ágil / Trato Directo Fundado',
    valor: '$1.200.000 / año',
    sub: 'O $100.000 al mes (~18 UTM/año)',
  },
  {
    item: 'Asesoría Técnica: Propuesta de Ordenanza',
    detalle:
      'Elaboración de propuesta técnica y borrador de Ordenanza Municipal Apícola adaptada a la comuna, armonizada con la Ley N° 21.489 y D.S. 21/22, lista para revisión jurídica y votación del Concejo.',
    mecanismo: 'Servicios Profesionales / Consultoría',
    valor: '$700.000',
    sub: 'Proyecto único (~10,5 UTM)',
  },
];

const MARCO_LEGAL_TABLA = [
  {
    norma: 'Ley N° 18.695 (Orgánica de Municipalidades)',
    exige: 'Fomento productivo (Art. 4 f), medio ambiente (Art. 4 b) y emergencias comunales (Art. 4 i).',
    red: 'Entrega a SECPLAC y Fomento un panel vivo para ordenar el territorio sin invadir potestades del SAG.',
  },
  {
    norma: 'Ley N° 21.489 (Ley Apícola Nacional)',
    exige: 'Registro obligatorio de todo tenedor de abejas, control sanitario y distancias de pecoreo.',
    red: 'Censo territorial voluntario georreferenciado que complementa y asiste el cumplimiento del apicultor.',
  },
  {
    norma: 'D.S. N° 21 y 22 / 2024 (MINAGRI)',
    exige: 'Reglamentos de trashumancia y apicultura urbana (distancias mínimas a caminos y viviendas).',
    red: 'Calcula bandas de distanciamiento aproximado para advertir saturaciones y apoyar la fiscalización local.',
  },
  {
    norma: 'Res. Exenta SAG N° 7.068 / 2024',
    exige: 'Avisos obligatorios de plaguicidas tóxicos a apicultores con al menos 48h de anticipación.',
    red: 'Módulo georreferenciado de alertas para que agricultores comunales cumplan la ley sin fricción.',
  },
  {
    norma: 'Res. Exenta SAG N° 7.067 / 2024',
    exige: 'Formulario de Movimiento de Colmenas (FMC) emitido con 72h de anticipación en SIPEC.',
    red: 'Facilita la verificación de traslados y coordinación transparente con predios facilitadores de la isla.',
  },
  {
    norma: 'Ley N° 19.628 y Ley N° 21.719',
    exige: 'Protección estricta de datos personales y privacidad por diseño.',
    red: 'Secreto de coordenadas exactas. El mapa público y comunal solo visualiza zonas aproximadas (~1 km).',
  },
];

export default function MunicipalidadesPage() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader />

      {/* Hero */}
      <section className="pt-16 pb-20 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            Propuesta Técnica para Gobiernos Locales
          </div>
          <h1 className="font-existencial text-foreground font-bold tracking-tight mb-3 text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.1] text-balance">
            Registro Municipal de Actividad Apícola
          </h1>
          <p className="text-lg text-muted-foreground mb-8 font-light">
            Territorio ordenado, apicultura protegida y cumplimiento normativo — con infraestructura comunitaria que ya opera en Chiloé.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-10">
            <PrintButton />
            <Link
              href="/municipalidades/kit"
              className="inline-flex min-h-11 items-center gap-2 px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Kit municipal descargable
            </Link>
            <Link
              href="/municipalidades/ordenanza-modelo"
              className="inline-flex min-h-11 items-center gap-2 px-5 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl text-sm font-medium transition-colors"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              Borrador de ordenanza modelo
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
              <dd>Alcaldía · SECPLAC · Dirección de Fomento Productivo / DIDECO · Medio Ambiente</dd>
            </div>
            <div className="flex gap-3 px-5 py-3">
              <dt className="shrink-0 font-medium text-foreground w-32">Emitido por</dt>
              <dd>
                Registro Territorial Apícola de Chiloé (Proveedor tecnológico: La Obrera y el Zángano)
              </dd>
            </div>
            <div className="flex gap-3 px-5 py-3">
              <dt className="shrink-0 font-medium text-foreground w-32">Vigencia propuesta</dt>
              <dd>Temporada 2026–2027 · Censo Activo de Primavera</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Fundamentación de Competencias Municipales */}
      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-primary font-bold uppercase tracking-wider mb-2">
            <Scale className="w-4 h-4" />
            Marco Jurídico de Actuación Municipal
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
            ¿Por qué la Municipalidad tiene atribuciones para ordenar la apicultura local?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            La apicultura en Chile no solo se rige por la Ley Apícola N° 21.489 y el SAG. La{' '}
            <strong className="text-foreground">Ley N° 18.695 (Orgánica Constitucional de Municipalidades)</strong>{' '}
            confiere a los municipios competencias expresas que justifican plenamente la adopción de este registro:
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

      {/* El problema */}
      <section className="bg-background py-16 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4 uppercase tracking-wide text-primary">
            El problema en el terreno
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Hoy la comuna desconoce cuántos apiarios operan en su territorio, dónde están ubicadas las colmenas, ni cuándo
            ingresan colmenares trashumantes en verano. Cuando ocurren aplicaciones de plaguicidas con mortandad masiva, o conflictos
            vecinales por colmenares instalados al borde de caminos públicos y viviendas (D.S. N° 22/2024),{' '}
            <strong className="text-foreground font-semibold">
              el municipio carece de información oportuna para mediar y actuar
            </strong>
            . Las comunas pioneras (como Ancud, Panguipulli o Alhué) crearon registros en papel difíciles de mantener. Esta Red
            aporta la misma solución con datos vivos, georreferenciación protegida y sin costo para los apicultores locales.
          </p>
        </div>
      </section>

      {/* La solución */}
      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4 uppercase tracking-wide text-primary">
            La solución: Infraestructura ya desarrollada y activa
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            El municipio no contrata un desarrollo desde cero con riesgo de ejecución. Se conecta a una plataforma que ya opera:
          </p>
          <ol className="space-y-4 mb-8">
            {[
              {
                t: 'Censo comunal en vivo',
                d: 'Apicultores inscritos, apiarios declarados y carga de colmenas por sector, con coordenadas exactas bajo estricta reserva conforme a la Ley N° 21.719.',
              },
              {
                t: 'Evaluación técnica de distancias declaradas',
                d: 'Cálculo automatizado de radios de pecoreo y distancias a colmenares vecinos en ingresos trashumantes (bandas de apoyo bajo D.S. N° 21/2024).',
              },
              {
                t: 'Registro anticipado de trashumancia',
                d: 'Canal digital para que apicultores con movilidad declaren origen, predio de destino y Formulario de Movimiento (FMC - Res. SAG 7.067/2024).',
              },
              {
                t: 'Canal georreferenciado de alertas fitosanitarias',
                d: 'Herramienta para canalizar avisos obligatorios con 48 horas de anticipación ante fumigaciones agrícolas (Res. Exenta SAG N° 7.068/2024).',
              },
              {
                t: 'Exportación oficial de antecedentes',
                d: 'Descarga de planillas CSV/Excel para fiscalizaciones del SAG, informes a Concejo Municipal y programas de fomento INDAP/DIDECO.',
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
            <p className="font-serif italic text-foreground text-sm">
              El censo territorial cierra su ciclo anual cada 31 de octubre, coincidiendo con la actualización nacional del SAG.
              La municipalidad se suma a una red transparente que crece orgánicamente con cada declaración de los apicultores de la isla.
            </p>
          </div>
        </div>
      </section>

      {/* Qué contrata */}
      <section className="bg-background py-16 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 uppercase tracking-wide text-primary">
            Servicios y Costos de Implementación
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-semibold text-foreground">Ítem</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Alcance del Servicio</th>
                  <th className="px-5 py-3 font-semibold text-foreground">Vía de Compra</th>
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
            Valores en pesos chilenos. Facturados como servicios de consultoría / tecnológicos conforme a la Ley de Compras Públicas.
          </p>

          <h3 className="font-serif text-xl font-bold text-foreground mt-12 mb-4">
            Vías de Contratación y Financiamiento Municipal
          </h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Al tratarse de proyectos individuales de bajo costo (inferiores al umbral de 30 UTM), el municipio puede ejecutar su
            contratación de manera directa y ágil:
          </p>
          <div className="space-y-4">
            {FUENTES_FINANCIAMIENTO.map((f) => (
              <div key={f.nombre} className="bg-surface-raised border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors text-sm"
                  >
                    {f.nombre}
                    <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                  </a>
                  <span className="text-[0.65rem] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {f.tag}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.detalle}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 font-serif italic text-foreground text-sm">
            Entregamos la ficha técnica estandarizada y los términos de referencia listos para la tramitación interna en SECPLAC.
          </p>
        </div>
      </section>

      {/* Marco legal completo */}
      <section className="bg-surface-sunken py-16 px-6 sm:px-12 lg:px-24 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-4 uppercase tracking-wide text-primary">
            Matriz de Compatibilidad Normativa
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            La Red actúa como un complemento técnico territorial para la gestión local. No sustituye ni interfiere con las
            potestades fiscalizadoras del SAG ni de la Autoridad Sanitaria.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-semibold text-foreground">Normativa Vigente</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Mandato Legal</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Función de la Red</th>
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

      {/* Por qué ahora */}
      <section className="bg-background py-16 px-6 sm:px-12 lg:px-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-foreground mb-6 uppercase tracking-wide text-primary">
            Ventana de Oportunidad para la Comuna
          </h2>
          <ul className="space-y-4">
            {[
              'El 31 de octubre concluye el período oficial de Declaración Anual de Existencias ante el SAG: es el momento de máxima disposición de los apicultores locales para formalizar su ubicación.',
              'La temporada estival de trashumancia (diciembre a marzo) concentra la mayor cantidad de colmenares foráneos y riesgo de sobrecarga floral: la comuna que implemente en primavera dispondrá de información preventiva antes de que surjan los conflictos.',
              'La vigencia plena de la Res. Exenta SAG N° 7.068/2024 exige canales eficaces para el aviso de fumigaciones a 48 horas: el municipio puede ofrecer este canal a agricultores y vecinos.',
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
            Agendemos una Presentación Técnica
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Reunión de 30 minutos con SECPLAC / Fomento Productivo: demostración en vivo del panel comunal con datos de Chiloé
            y entrega de la ficha técnica lista para postulación interna.
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
          <p className="mt-6 text-xs text-muted-foreground">
            La Obrera y el Zángano · Archipiélago de Chiloé · Proveedor tecnológico del Registro Territorial.
          </p>
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

      {/* Nota del bien común */}
      <section className="bg-background py-12 px-6 sm:px-12 lg:px-24 text-center">
        <p className="max-w-2xl mx-auto text-sm text-muted-foreground font-serif italic">
          La Red Territorial es un bien común de los apicultores de Chiloé; la contratación de servicios municipales financia su
          operación técnica y garantiza su gratuidad permanente para los productores locales.
        </p>
      </section>

      <TerritorioFooter />
    </main>
  );
}

