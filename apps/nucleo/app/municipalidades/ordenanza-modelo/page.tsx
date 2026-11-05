import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { getTerritorioCmsContent } from '@/lib/territorio-cms';
import { PrintButton } from '@/components/territorio/PrintButton';
import { Scale, ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Borrador Canónico de Ordenanza Apícola — Kit Municipal de Chiloé',
  description:
    'Borrador para Jurídica: registro comunal complementario al SIPEC, sin nombrar proveedor. Competencias Ley 18.695; Ley 21.489 no convierte al municipio en registrador nacional.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/municipalidades/ordenanza-modelo',
  },
  openGraph: {
    title: 'Ordenanza Apícola Modelo · Registro Territorial de Chiloé',
    description:
      'Articulado modelo de técnica legislativa para municipios de Chiloé. Protección de pecoreo y regulación comunitaria apícola.',
    url: 'https://www.registroapicolachiloe.me/municipalidades/ordenanza-modelo',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ordenanza Apícola Modelo · Registro Territorial de Chiloé',
    description:
      'Articulado modelo de técnica legislativa para municipios de Chiloé. Protección de pecoreo y regulación comunitaria apícola.',
  },
};

interface Inciso {
  tipo?: 'parrafo' | 'lista';
  texto?: string;
  items?: string[];
}

interface Articulo {
  numero: string;
  titulo: string;
  incisos: Inciso[];
}

interface TituloSeccion {
  romano: string;
  nombre: string;
  articulos: Articulo[];
}

const VISTOS = [
  'Lo dispuesto en el D.F.L. N° 1/19.704 de 2001, que fija el texto refundido, coordinado y sistematizado de la Ley N° 18.695, Orgánica Constitucional de Municipalidades, en especial sus artículos 4° letras b), f) e i), y 5° letra c);',
  'Las disposiciones de la Ley N° 21.489 sobre Promoción, Protección y Fomento del Desarrollo Apícola, y sus reglamentos complementarios aprobados mediante Decretos Supremos N° 20, 21 y 22 de 2024 del Ministerio de Agricultura;',
  'Lo establecido en el Decreto Ley N° 3.557 de 1980 sobre Protección Agrícola y las Resoluciones Exentas del Servicio Agrícola y Ganadero (SAG) N° 8.196 de 2015, N° 7.067 de 2024, N° 7.068 de 2024 y N° 4.590 de 2025;',
  'La Ley N° 19.300 sobre Bases Generales del Medio Ambiente y la Ley N° 20.283 sobre Recuperación del Bosque Nativo y Fomento Forestal;',
  'Los preceptos de la Ley N° 19.628 y los estándares de la Ley N° 21.719 sobre Protección de la Vida Privada y Tratamiento de Datos Personales;',
  'Las directrices de la Ley N° 21.180 sobre Transformación Digital del Estado respecto a interoperabilidad y simplificación documental;',
  'El acuerdo del Concejo Municipal adoptado en Sesión Ordinaria N° [___] de fecha [___]; y',
  'Las atribuciones que me confiere el artículo 63 de la Ley N° 18.695.',
];

const CONSIDERANDOS = [
  'Que el archipiélago de Chiloé posee un ecosistema de bosque templado lluvioso único, cuya flora melífera nativa sustenta una actividad apícola patrimonial y genera servicios ecosistémicos indispensables de polinización para la biodiversidad insular;',
  'Que el ingreso estival desordenado de colmenares trashumantes genera saturación de carga floral, riesgos de diseminación sanitaria y eventuales conflictos de vecindad con apicultores residentes y propietarios de predios;',
  'Que las aplicaciones fitosanitarias de plaguicidas agrícolas representan un riesgo severo de mortandad masiva de abejas si no son comunicadas con oportuna anticipación y georreferenciación;',
  'Que es competencia municipal resguardar el medio ambiente comunal, promover el fomento productivo rural y coordinar la prevención de emergencias en el territorio;',
  'Que la Ley N° 21.489 y sus reglamentos imponen deberes al apicultor y al aplicador ante el SAG, pero no entregan al municipio un instrumento propio de información local; la ausencia de un censo comunal deja a la Municipalidad sin antecedentes oportunos para mediar conflictos, canalizar avisos fitosanitarios y orientar el fomento productivo;',
  'Que resulta más eficiente disponer de una herramienta técnica ya existente y auditable que desarrollar software municipal desde cero, sin que ello implique nombrar a un proveedor en esta ordenanza ni sustituir el SIPEC Apícola;',
  'Que la comuna requiere de un registro local, complementario y de inscripción gratuita, que asista a los apicultores en el cumplimiento de sus deberes ante el SAG y resguarde el secreto de sus ubicaciones GPS exactas.',
];

const TITULOS: TituloSeccion[] = [
  {
    romano: 'I',
    nombre: 'DISPOSICIONES GENERALES, OBJETO Y DEFINICIONES',
    articulos: [
      {
        numero: '1',
        titulo: 'Objeto y Finalidad',
        incisos: [
          {
            texto:
              'La presente ordenanza tiene por objeto ordenar la actividad apícola en el territorio comunal, proteger las zonas de pecoreo y la flora melífera nativa, canalizar oportunamente los avisos fitosanitarios y facilitar el cumplimiento de la Ley N° 21.489, sin sustituir las potestades fiscalizadoras y sanitarias exclusivas del Servicio Agrícola y Ganadero (SAG) ni de la Autoridad Sanitaria.',
          },
        ],
      },
      {
        numero: '2',
        titulo: 'Ámbito de Aplicación',
        incisos: [
          {
            texto:
              'Las disposiciones de esta ordenanza rigen en toda la comuna. No sustituyen las obligaciones del apicultor ante el SAG ni el SIPEC Apícola. Quienes mantengan colmenares en el territorio quedan invitados a inscribirse en el registro municipal. Quienes movilicen colmenas hacia la comuna deberán declarar su arribo al registro municipal para efectos de coordinación territorial, sin perjuicio del Formulario de Movimiento de Colmenas exigido por el SAG.',
          },
        ],
      },
      {
        numero: '3',
        titulo: 'Definiciones Legales y Técnicas',
        incisos: [
          {
            tipo: 'lista',
            items: [
              'Apicultor/a: Toda persona natural o jurídica que desarrolle la actividad de cría y explotación de abejas de la especie Apis mellifera, independiente del número de colmenas y de la superficie de su predio.',
              'Apiario o Colmenar: Conjunto de colmenas instaladas en un lugar geográfico determinado.',
              'Zona de Pecoreo: Área geográfica de vuelo y aprovechamiento de néctar y polen por las abejas, estimada en un radio de hasta 3 kilómetros alrededor del apiario.',
              'Trashumancia: Movimiento o traslado temporal de colmenas con fines de aprovechamiento de floraciones estacionales o servicios de polinización.',
              'Predio Facilitador: Inmueble rústico o urbano cuyo titular autoriza la instalación transitoria o permanente de apiarios de terceros.',
              'Registro Municipal Apícola: Plataforma técnica de información, coordinación comunitaria y asistencia al cumplimiento normativo llevada por la Municipalidad.',
            ],
          },
        ],
      },
    ],
  },
  {
    romano: 'II',
    nombre: 'DEL REGISTRO MUNICIPAL Y SUJETOS DEL ECOSISTEMA',
    articulos: [
      {
        numero: '4',
        titulo: 'Implementación del Registro',
        incisos: [
          {
            texto:
              'La Municipalidad, a través de DIDECO, llevará un Registro Municipal de Actividad Apícola de carácter complementario. La inscripción es gratuita para el apicultor. Este registro no sustituye ni replica el SIPEC Apícola ni las potestades del SAG; su fin es que la comuna disponga de información local para fomento, mediación y canalización de avisos. La Municipalidad podrá proveer o contratar el acceso a una plataforma digital mediante los procedimientos de la Ley N° 19.886.',
          },
          {
            texto:
              'El registro municipal es una herramienta de coordinación comunitaria a cargo de DIDECO. Sirve de base técnica para programas comunales de fomento (DIDECO / INDAP / SECPLAC) cuando la comuna así lo disponga.',
          },
        ],
      },
      {
        numero: '5',
        titulo: 'Sujetos y Categorías de Inscripción',
        incisos: [
          {
            texto:
              'El registro acogerá y clasificará las siguientes calidades de participantes:',
          },
          {
            tipo: 'lista',
            items: [
              'a) Apicultor/a Residente: Con asentamiento permanente en la comuna.',
              'b) Apicultor/a Trashumante o Temporal: Que moviliza colmenas hacia o a través de la comuna.',
              'c) Propietario/a de Predio Facilitador: Que pone a disposición terrenos aptos para colmenares.',
              'd) Agricultor/a o Aplicador/a Fitosanitario: Que realiza labores agrícolas y emite avisos de fumigación.',
            ],
          },
        ],
      },
      {
        numero: '6',
        titulo: 'Infraestructura Tecnológica y Estándares',
        incisos: [
          {
            texto:
              'Esta ordenanza no nombra a un proveedor determinado. Si la Municipalidad contrata una plataforma, lo hará conforme a la Ley N° 19.886. El sistema deberá permitir georreferenciación protegida, notificaciones y exportación de antecedentes para DIDECO y Concejo, con obligaciones de nivel de servicio pactadas en el contrato. No se exige ni se promete interoperabilidad automática con el SIPEC.',
          },
        ],
      },
    ],
  },
  {
    romano: 'III',
    nombre: 'DE LA TRASHUMANCIA Y DISTANCIAS DE PECOREO',
    articulos: [
      {
        numero: '7',
        titulo: 'Declaración Anticipada de Trashumancia',
        incisos: [
          {
            texto:
              'Todo apicultor que traslade colmenas hacia la comuna deberá informar al Registro Municipal, indicando origen, número de colmenas, sector de destino, predio facilitador y, cuando corresponda, número o copia del Formulario de Movimiento de Colmenas (FMC) emitido por el SAG. El plazo de setenta y dos (72) horas de anticipación es el que fija la Resolución Exenta SAG N° 7.067/2024 para el FMC; esta ordenanza no crea un plazo municipal paralelo. Se solicita informar al municipio con la mayor antelación posible y, de preferencia, antes del arribo.',
          },
        ],
      },
      {
        numero: '8',
        titulo: 'Evaluación Preventiva de Distancias',
        incisos: [
          {
            texto:
              'El sistema del Registro Municipal podrá calcular distancias geodésicas aproximadas (fórmula de Haversine) entre apiarios declarados. Esas distancias son un apoyo a la revisión humana por parte de los equipos municipales o de instancias de mediación. No constituyen un motor de carga floral, ni validación automática de legalidad, ni obstaculizan las facultades exclusivas del SAG.',
          },
        ],
      },
      {
        numero: '9',
        titulo: 'Emplazamiento y Distancias Viales',
        incisos: [
          {
            texto:
              'Los colmenares que se instalen en predios colindantes a fajas fiscales, caminos públicos o viviendas deberán observar estrictamente las distancias mínimas y barreras de vuelo fijadas en el D.S. N° 22/2024 del MINAGRI, resguardando la seguridad de transeúntes y vecinos.',
          },
        ],
      },
    ],
  },
  {
    romano: 'IV',
    nombre: 'DEL SISTEMA GEORREFERENCIADO DE ALERTAS FITOSANITARIAS',
    articulos: [
      {
        numero: '10',
        titulo: 'Avisos Obligatorios de Aplicación de Plaguicidas',
        incisos: [
          {
            texto:
              'En consonancia con la Resolución Exenta SAG N° 7.068/2024, toda persona o predio que programe la aplicación de productos fitosanitarios con advertencia de toxicidad para abejas deberá emitir el aviso correspondiente con un mínimo de 48 horas de anticipación.',
          },
        ],
      },
      {
        numero: '11',
        titulo: 'Canal Municipal Georreferenciado',
        incisos: [
          {
            texto:
              'La Municipalidad pondrá a disposición de agricultores y aplicadores un módulo georreferenciado de avisos fitosanitarios. El módulo podrá notificar de forma reservada a los apiarios declarados en el radio de resguardo. Este canal comunal no reemplaza el aviso que el aplicador deba efectuar ante el SAG conforme a la Resolución Exenta N° 7.068/2024.',
          },
        ],
      },
      {
        numero: '12',
        titulo: 'Constancia Digital de Diligencia',
        incisos: [
          {
            texto:
              'La emisión oportuna del aviso a través de la plataforma generará un comprobante digital de debida diligencia preventiva para el aplicador, permitiendo a los apicultores vecinos adoptar medidas de encierro de piqueras o traslado provisorio.',
          },
        ],
      },
    ],
  },
  {
    romano: 'V',
    nombre: 'DE LA PRIVACIDAD, SEGURIDAD DE LA INFORMACIÓN Y GEOMÁSCARA',
    articulos: [
      {
        numero: '13',
        titulo: 'Privacidad de Datos y Geomáscara',
        incisos: [
          {
            texto:
              'En estricto cumplimiento de la Ley N° 19.628 y la Ley N° 21.719, las coordenadas GPS exactas, inventarios individuales y datos de contacto son información confidencial. El apicultor es titular de sus datos. El municipio es responsable del tratamiento respecto del registro municipal. Si se contrata un encargado tecnológico, éste tratará los datos por cuenta del municipio, con las obligaciones de seguridad y confidencialidad que se pacten, sin adquirir propiedad sobre ellos.',
          },
          {
            texto:
              'El mapa público comunal aplicará una tecnología de "Geomáscara", proyectando únicamente zonas aproximadas para proteger el secreto comercial y prevenir el abigeato.',
          },
        ],
      },
      {
        numero: '14',
        titulo: 'Derechos de los Titulares',
        incisos: [
          {
            texto:
              'Todo participante podrá ejercer sus derechos de acceso, rectificación, cancelación y retiro del registro municipal. El retiro no extingue las obligaciones que el titular tenga ante el SAG ni afecta su inscripción en el SIPEC.',
          },
        ],
      },
      {
        numero: '15',
        titulo: 'Prohibición de Comercialización de Datos',
        incisos: [
          {
            texto:
              'Queda estrictamente prohibida la cesión, venta o transferencia de bases de datos del registro municipal a terceros con fines comerciales o publicitarios.',
          },
        ],
      },
    ],
  },
  {
    romano: 'VI',
    nombre: 'DE LA FISCALIZACIÓN, MEDIACIÓN Y SANCIONES',
    articulos: [
      {
        numero: '16',
        titulo: 'Fiscalización y Coordinación',
        incisos: [
          {
            texto:
              'La fiscalización del cumplimiento de la presente ordenanza corresponderá a los Inspectores Municipales y Carabineros de Chile, en coordinación con los fiscalizadores del SAG en las materias de su exclusiva competencia.',
          },
        ],
      },
      {
        numero: '17',
        titulo: 'Instancia de Mediación Vecinal',
        incisos: [
          {
            texto:
              'Previo a la deducción de denuncias contenciosas, la Dirección de Fomento Productivo o DIDECO podrá convocar a las partes involucradas a una instancia de mediación y avenimiento técnico para solucionar discrepancias de distancias de pecoreo o cierres por fumigación.',
          },
        ],
      },
      {
        numero: '18',
        titulo: 'Infracciones y Juzgado de Policía Local',
        incisos: [
          {
            texto:
              'Las infracciones a las disposiciones de la presente ordenanza serán denunciadas ante el Juzgado de Policía Local competente y sancionadas con multas de 1 a 5 Unidades Tributarias Mensuales (UTM), sin perjuicio de las sanciones sanitarias que aplique el SAG bajo la Ley N° 21.489.',
          },
        ],
      },
    ],
  },
];

const TRANSITORIOS: Articulo[] = [
  {
    numero: 'Primero Transitorio',
    titulo: 'Período de Marcha Blanca y Censo Asistido',
    incisos: [
      {
        texto:
          'Durante los primeros noventa (90) días corridos contados desde la publicación de esta ordenanza, la Municipalidad implementará un plan intensivo de censo asistido en terreno y difusión comunitaria, rigiendo una marcha blanca educativa sin aplicación de multas.',
      },
    ],
  },
  {
    numero: 'Segundo Transitorio',
    titulo: 'Vigencia de Convenios Técnicos',
    incisos: [
      {
        texto:
          'El Alcalde o Alcaldesa dictará las instrucciones de servicio e instruirá la suscripción de los convenios técnicos de interoperabilidad dentro del plazo de sesenta (60) días desde la promulgación.',
      },
    ],
  },
];

export default async function OrdenanzaModeloPage() {
  const cms = await getTerritorioCmsContent();

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader content={cms.header} />

      {/* Barra superior de navegación / acciones */}
      <div className="border-b border-border/80 bg-surface-raised/40 px-6 sm:px-12 py-3 sticky top-14 z-20 backdrop-blur-md print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/municipalidades/kit"
            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Kit Municipal</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[0.65rem] uppercase tracking-widest font-mono text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full font-medium">
              Borrador v1.1 · sin proveedor nombrado
            </span>
            <PrintButton label="Imprimir Ordenanza / PDF" />
          </div>
        </div>
      </div>

      <article className="flex-1 max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16 space-y-12">
        {/* Cabecera Formal de la Ordenanza */}
        <header className="space-y-6 border-b border-border/80 pb-8">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-[0.7rem] uppercase tracking-widest text-muted-foreground font-mono">
              República de Chile · Región de Los Lagos · Provincia de Chiloé
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Ilustre Municipalidad de [Nombre Comuna]
            </p>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-medium">
              <Scale className="w-3.5 h-3.5" />
              <span>Modelo de Técnica Legislativa Municipal</span>
            </div>
            <h1 className="font-existencial text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-[1.18] text-balance">
              Ordenanza Municipal sobre Actividad Apícola, Resguardo de Polinizadores, Protección de Zonas de Pecoreo y Coordinación de Trashumancia
            </h1>
            <p className="text-sm text-muted-foreground font-serif italic">
              Borrador técnico armonizado con la Ley N° 21.489, D.S. N° 20, 21 y 22/2024 MINAGRI y Ley N° 18.695
            </p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed print:hidden">
            <p className="font-medium text-foreground mb-1">Nota para la Dirección de Asesoría Jurídica:</p>
            <p>
              Este articulado no afirma que la Ley N° 21.489 obligue al municipio a contratar un registro digital ni a sustituir al SIPEC. Usa las competencias de la Ley N° 18.695 (artículos 4° letras b), f) e i)) para un instrumento comunal de coordinación. Los campos entre corchetes <code className="text-primary font-mono">[___]</code> los completa cada comuna. El articulado no nombra proveedor.
            </p>
          </div>
        </header>

        {/* VISTOS */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 font-mono">
            <span>●</span>
            <span>VISTOS:</span>
          </h2>
          <ol className="space-y-2.5 pl-4 sm:pl-6 border-l-2 border-primary/20 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {VISTOS.map((v, i) => (
              <li key={i} className="list-decimal pl-2">
                {v}
              </li>
            ))}
          </ol>
        </section>

        {/* CONSIDERANDOS */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 font-mono">
            <span>●</span>
            <span>CONSIDERANDO:</span>
          </h2>
          <ol className="space-y-2.5 pl-4 sm:pl-6 border-l-2 border-primary/20 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {CONSIDERANDOS.map((c, i) => (
              <li key={i} className="list-decimal pl-2">
                {c}
              </li>
            ))}
          </ol>
        </section>

        {/* DECRETO / ORDENANZA */}
        <section className="space-y-12 pt-4 border-t border-border/80">
          <div className="text-center py-4 bg-surface-sunken rounded-xl border border-border/60">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              DECRETO / ACUERDO DE CONCEJO
            </p>
            <h2 className="font-existencial text-xl font-bold text-foreground mt-1">
              Díctase la siguiente Ordenanza Municipal:
            </h2>
          </div>

          {TITULOS.map((t) => (
            <div key={t.romano} className="space-y-6">
              <div className="border-b-2 border-primary/40 pb-2">
                <p className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                  TÍTULO {t.romano}
                </p>
                <h3 className="font-existencial text-lg sm:text-xl font-bold text-foreground mt-0.5">
                  {t.nombre}
                </h3>
              </div>

              <div className="space-y-8 pl-0 sm:pl-4">
                {t.articulos.map((art) => (
                  <div key={art.numero} className="space-y-2 group">
                    <h4 className="font-semibold text-sm sm:text-base text-foreground flex items-baseline gap-2">
                      <span className="font-mono text-xs text-primary font-bold">
                        Artículo {art.numero}°.
                      </span>
                      <span>{art.titulo}</span>
                    </h4>

                    <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-2 sm:pl-6">
                      {art.incisos.map((inc, j) =>
                        inc.tipo === 'lista' ? (
                          <ul key={j} className="space-y-2 my-2">
                            {inc.items?.map((it, k) => (
                              <li key={k} className="flex items-start gap-2.5">
                                <span className="text-primary mt-1 text-xs shrink-0">▪</span>
                                <span>{it}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p key={j}>{inc.texto}</p>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* DISPOSICIONES TRANSITORIAS */}
          <div className="space-y-6 pt-6 border-t border-border/80">
            <div className="border-b-2 border-primary/40 pb-2">
              <p className="text-xs font-mono font-bold text-primary uppercase tracking-widest">
                DISPOSICIONES TRANSITORIAS
              </p>
              <h3 className="font-existencial text-lg sm:text-xl font-bold text-foreground mt-0.5">
                VIGENCIA Y PUESTA EN MARCHA
              </h3>
            </div>

            <div className="space-y-8 pl-0 sm:pl-4">
              {TRANSITORIOS.map((art) => (
                <div key={art.numero} className="space-y-2">
                  <h4 className="font-semibold text-sm sm:text-base text-foreground flex items-baseline gap-2">
                    <span className="font-mono text-xs text-primary font-bold">
                      Artículo {art.numero}.
                    </span>
                    <span>{art.titulo}</span>
                  </h4>

                  <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-2 sm:pl-6">
                    {art.incisos.map((inc, j) => (
                      <p key={j}>{inc.texto}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Firmas Formativas (Aparecen al imprimir) */}
        <section className="pt-12 border-t border-border/80 hidden print:block space-y-12">
          <p className="text-xs text-slate-600 text-center font-serif italic">
            Anótese, comuníquese, publíquese en la página web municipal conforme a la Ley N° 20.285 y archívese.
          </p>
          <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs text-slate-800">
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">[NOMBRE SECRETARIO/A MUNICIPAL]</p>
              <p className="text-[10px] text-slate-500">Secretario/a Municipal</p>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <p className="font-bold">[NOMBRE ALCALDE/SA]</p>
              <p className="text-[10px] text-slate-500">Alcalde/sa Ilustre Municipalidad</p>
            </div>
          </div>
        </section>

        {/* Pie de página de pantalla */}
        <footer className="pt-10 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Borrador para Jurídica · no nombra proveedor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/carta" className="underline underline-offset-4 hover:text-foreground">
              Carta Constitutiva
            </Link>
            <a
              href="https://www.bcn.cl/leychile/navegar?idNorma=1182623"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
            >
              <span>Ley 21.489 en BCN</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </footer>
      </article>

      <TerritorioFooter />
    </main>
  );
}
