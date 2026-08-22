import Link from 'next/link';
import { PrintButton } from '@/components/territorio/PrintButton';
import { Shield, Scale, FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carta Constitutiva Apícola Territorial de Chiloé (v0.3.1)',
  description:
    'Boceto de ideas e infraestructura colectiva, autónoma, verificable y de beneficio compartido para la apicultura de Chiloé. Adhesión voluntaria, soberanía de datos y marco legal chileno.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/carta',
  },
  openGraph: {
    title: 'Carta Constitutiva Apícola Territorial de Chiloé (v0.3.1)',
    description:
      'Bases comunes y marco legal para la defensa, soberanía y cuidado de la apicultura comunitaria en el archipiélago.',
    url: 'https://www.registroapicolachiloe.me/carta',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carta Constitutiva Apícola Territorial de Chiloé (v0.3.1)',
    description:
      'Bases comunes y marco legal para la defensa, soberanía y cuidado de la apicultura comunitaria en el archipiélago.',
  },
};

interface Bloque {
  tipo: 'parrafo' | 'lista';
  texto?: string;
  items?: string[];
}

interface Articulo {
  numero: string;
  titulo: string;
  badge?: string;
  bloques: Bloque[];
}

const PREAMBULO: string[] = [
  'Las personas, agrupaciones y comunidades vinculadas a la apicultura en el archipiélago de Chiloé reconocemos que la salud de las abejas, la conservación del bosque nativo y la flora melífera, la inocuidad alimentaria, el saber local y la viabilidad económica de las familias del campo constituyen un patrimonio común e indivisible.',
  'Constituimos esta base de acuerdo para articular una apicultura informada, coordinada y con arraigo insular; para dotarnos de herramientas técnicas de registro, comunicación temprana y trazabilidad; y para relacionarnos con instituciones públicas, propietarios de predios, agricultores y la ciudadanía desde la colaboración transparente, el respeto a la ley y la dignidad del trabajo rural.',
];

const MARCO_LEGAL = [
  { ley: 'Ley N° 21.489 y D.S. 21/22 (2024)', desc: 'Ley Apícola Nacional: censo universal y sanidad desde 1 colmena' },
  { ley: 'Res. Exenta SAG N° 7.068 / 2024', desc: 'Avisos obligatorios de aplicaciones fitosanitarias con 48h de anticipación' },
  { ley: 'Res. Exenta SAG N° 7.067 / 2024', desc: 'Formulario de Movimiento de Colmenas (FMC) y ordenamiento de trashumancia (72h)' },
  { ley: 'Res. SAG N° 4.590 / 2025', desc: 'Estándar oficial de Cuaderno de Campo Apícola digital' },
  { ley: 'Ley N° 19.628 y Ley N° 21.719', desc: 'Protección estricta de datos personales y secreto de coordenadas exactas' },
];

const ARTICULOS: Articulo[] = [
  {
    numero: '1',
    titulo: 'Naturaleza y Alcance',
    badge: 'Organización',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'La Red Territorial Apícola de Chiloé es una articulación comunitaria y técnica de personas y organizaciones vinculadas a la crianza de abejas, la agricultura sustentable y la custodia ambiental del archipiélago. Se organiza en tres niveles funcionales:',
      },
      {
        tipo: 'lista',
        items: [
          'Núcleos Locales y Comunales: Espacios de encuentro, diálogo, registro y coordinación en cada comuna o sector.',
          'Red Territorial del Archipiélago: Instancia de articulación para asuntos de sanidad territorial, contingencias ambientales, trashumancia y valorización del producto local.',
          'Infraestructura Técnica Común: Plataforma de registro, alertas preventivas y datos bajo custodia segura, con estricta gobernanza de privacidad.',
        ],
      },
      {
        tipo: 'parrafo',
        texto:
          'La Red no ejerce autoridad pública ni potestades de fiscalización. Genera información fidedigna para la prevención de riesgos y el fortalecimiento del ecosistema apícola.',
      },
    ],
  },
  {
    numero: '2',
    titulo: 'Finalidad y Objetivos',
    badge: 'Objetivos',
    bloques: [
      { tipo: 'parrafo', texto: 'Son objetivos primordiales de la Red:' },
      {
        tipo: 'lista',
        items: [
          'Custodiar la sanidad apícola y la biodiversidad, fomentando buenas prácticas de manejo y el resguardo de la flora melífera nativa.',
          'Facilitar el cumplimiento legal y sanitario de los apicultores locales ante el SAG (Ley N° 21.489), simplificando la inscripción en el SIPEC Apícola y la Declaración Anual de Existencias de colmenas.',
          'Prevenir daños y mortandades por aplicaciones de plaguicidas, canalizando de forma expedita los avisos obligatorios con 48 horas de anticipación conforme a la Resolución Exenta SAG N° 7.068/2024.',
          'Ordenar y transparentar la trashumancia y traslado de colmenas, facilitando la coordinación de predios y el cumplimiento de las exigencias del Formulario de Movimiento de Colmenas (FMC - Res. Exenta SAG N° 7.067/2024).',
          'Valorizar la miel y productos de la colmena de Chiloé, destacando su identidad botánica, su origen y su proceso de elaboración.',
          'Mantener una interlocución técnica y constructiva con servicios públicos (SAG, INDAP, INIA), municipios y gremios agrícolas.',
        ],
      },
    ],
  },
  {
    numero: '3',
    titulo: 'Principios Rectores',
    badge: 'Principios',
    bloques: [
      {
        tipo: 'lista',
        items: [
          'Voluntariedad: Nadie puede ser obligado a integrarse a la Red ni condicionado en el ejercicio de sus derechos legítimos.',
          'Privacidad por Diseño y Custodia Ética: Los datos personales y las coordenadas precisas de apiarios son de propiedad exclusiva de cada titular (Ley N° 19.628 y Ley N° 21.719). Se resguardan bajo reserva absoluta y nunca se exponen al público general.',
          'Universalidad del Suelo Base Gratuito: El registro base, el mapa de pecoreo protegido y el sistema de alertas de emergencia son y serán de libre acceso para todo apicultor del territorio (desde 1 colmena).',
          'Prevención y Buena Fe: Se privilegia la información temprana, la mediación vecinal y la adopción de buenas prácticas por sobre cualquier controversia.',
          'No Discriminación: Todo apicultor (residente o con movilidad) es valorado por el cumplimiento sanitario de sus apiarios y su compromiso con el territorio.',
        ],
      },
    ],
  },
  {
    numero: '4',
    titulo: 'Sujetos del Ecosistema',
    badge: 'Roles',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'La Red reconoce y acoge los siguientes roles de participación dentro del archipiélago:',
      },
      {
        tipo: 'lista',
        items: [
          'Apicultor/a Residente: Productor/a con asentamiento permanente de apiarios en el archipiélago.',
          'Apicultor/a Trashumante o Temporal: Productor/a que moviliza colmenas hacia o dentro de Chiloé para aprovechamiento de floradas o servicios de polinización.',
          'Propietario/a de Predio Facilitador: Titular de terreno que pone a disposición superficies aptas para la instalación ordenada de apiarios.',
          'Agricultor/a o Aplicador/a Fitosanitario: Persona que realiza faenas agrícolas y busca canalizar oportunamente sus avisos preventivos a colmenares vecinos.',
          'Técnico, Asesor o Investigador: Profesional de apoyo sanitario, formativo o de extensión.',
          'Institución Pública o Municipal: Entidad colaboradora en materias de fomento, sanidad y ordenamiento.',
        ],
      },
    ],
  },
  {
    numero: '5',
    titulo: 'Registro Sanitario y Suelo Base Gratuito',
    badge: 'Suelo Base $0',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'La Red implementa un Registro Territorial interoperable con el sistema oficial del SAG:',
      },
      {
        tipo: 'lista',
        items: [
          'Todo participante podrá asociar su identificador oficial de apicultor (SIPEC Apícola) y su Rol Único Pecuario (RUP).',
          'La inscripción básica y el acceso a la plataforma es completamente gratuita para todo apicultor del archipiélago.',
          'El sistema asiste al apicultor para generar el borrador de su Declaración Anual de Existencias de colmenas exigida cada octubre por la autoridad sanitaria.',
        ],
      },
    ],
  },
  {
    numero: '6',
    titulo: 'Niveles de Visibilidad y Protección contra el Abigeato',
    badge: 'Privacidad',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Para proteger los apiarios contra el robo de colmenas, la sobrecarga desregulada de pecoreo y la competencia desleal, el sistema opera con tres capas estrictas de visibilidad:',
      },
      {
        tipo: 'lista',
        items: [
          'Capa Pública: Zonas geográficas generales a nivel comunal/sectorial, floraciones de interés y puntos de venta autorizados.',
          'Capa Comunitaria Protegida (Solo usuarios registrados): Visualización de áreas de influencia aproximadas (~1 km de radio de pecoreo), alertas fitosanitarias activas y disponibilidad de predios facilitadores autorizados por sus dueños.',
          'Capa Restringida y Privada: Coordenadas GPS exactas, inventarios detallados y antecedentes sanitarios. Solo accesibles por el propio apicultor y bajo su exclusiva administración.',
        ],
      },
    ],
  },
  {
    numero: '7',
    titulo: 'Sistema de Alertas Fitosanitarias',
    badge: 'Res. SAG 7.068/2024',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'En cumplimiento del mandato de la Resolución Exenta SAG N° 7.068/2024, la plataforma provee un canal seguro y georreferenciado para que agricultores y aplicadores comuniquen faenas fitosanitarias:',
      },
      {
        tipo: 'lista',
        items: [
          'Permite ingresar fecha, horario, producto, período de resguardo y radio estimado de aplicación con al menos 48 horas de anticipación.',
          'Notifica de forma automática y reservada a los apicultores cuyos apiarios declarados se ubiquen dentro del radio de influencia.',
          'Deja constancia digital del aviso emitido para respaldar la debida diligencia del aplicador y permitir al apicultor adoptar medidas de resguardo (cierre de piqueras o traslado preventivo).',
        ],
      },
    ],
  },
  {
    numero: '8',
    titulo: 'Coordinación de Trashumancia Responsable',
    badge: 'Res. SAG 7.067/2024',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Para salvaguardar la capacidad de carga del bosque nativo y la sanidad del territorio insular:',
      },
      {
        tipo: 'lista',
        items: [
          'Quienes trasladen colmenas podrán registrar voluntariamente su zona de destino y período de estadía.',
          'La Red facilita la verificación del Formulario de Movimiento de Colmenas (FMC - Res. SAG N° 7.067/2024) y la coordinación con propietarios de predios facilitadores.',
          'La declaración transparente permite advertir saturaciones de carga floral en sectores específicos y prevenir focos de contagio sanitario.',
        ],
      },
    ],
  },
  {
    numero: '9',
    titulo: 'Gobernanza de Datos y Derechos de los Titulares',
    badge: 'Leyes 19.628 / 21.719',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'De conformidad con la Ley N° 19.628 y los estándares de la Ley N° 21.719, se consagran los derechos fundamentales sobre la información:',
      },
      {
        tipo: 'lista',
        items: [
          'Acceso y Transparencia: Conocer en todo momento qué datos constan en el registro.',
          'Rectificación y Actualización: Modificar existencias de colmenas, ubicaciones o datos de contacto.',
          'Cancelación y Retiro: Darse de baja de la Red y solicitar la eliminación de registros operativos en cualquier momento.',
          'Inviolabilidad de Secretos: La Red no comercializa bases de datos ni entrega información individual a terceros sin autorización expresa por escrito.',
        ],
      },
    ],
  },
  {
    numero: '10',
    titulo: 'Sostenibilidad y Herramientas Avanzadas',
    badge: 'Modelo Sostenible',
    bloques: [
      {
        tipo: 'parrafo',
        texto:
          'Para garantizar la independencia técnica y la continuidad de la infraestructura comunitaria:',
      },
      {
        tipo: 'lista',
        items: [
          'La base territorial, el censo, las alertas fitosanitarias y el apoyo a la declaración SAG son bienes públicos locales y permanecerán siempre gratuitos.',
          'La plataforma podrá financiar su soporte y desarrollo mediante la oferta de módulos avanzados y optativos para apicultores comerciales (trazabilidad de lotes con Código QR, Cuaderno de Campo oficial bajo Res. SAG N° 4.590/2025, herramientas de gestión predial y venta directa), aportes institucionales transparentes y proyectos de fomento.',
        ],
      },
    ],
  },
];

export default function CartaPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 sticky top-0 bg-background/95 backdrop-blur-sm z-30 print:hidden">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Registro Territorial</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[0.65rem] uppercase tracking-widest text-primary border border-primary/30 bg-primary/5 rounded-full px-3 py-1 font-medium">
              Versión 0.3.1 · Presentación Territorial
            </span>
            <PrintButton label="Imprimir / PDF" />
          </div>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-12">
        {/* Título & Kicker */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Propuesta Territorial Nacida en Queilén
            </p>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground">Archipiélago de Chiloé</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-foreground leading-[1.15]">
            Carta Constitutiva Apícola Territorial
          </h1>
          <p className="text-lg text-primary font-serif italic">
            Infraestructura colectiva, autónoma, verificable y de beneficio compartido
          </p>

          {/* Marco de validez */}
          <div className="rounded-xl border border-border/80 bg-surface-sunken p-5 space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <div className="flex items-center gap-2 font-medium text-foreground text-xs uppercase tracking-wider">
              <Scale className="w-4 h-4 text-primary shrink-0" />
              <span>Marco de Validez y Legalidad</span>
            </div>
            <p>
              La adhesión a esta Carta es libre y voluntaria. Sus disposiciones complementan —nunca sustituyen ni menoscaban— las facultades exclusivas de fiscalización, registro, control sanitario y sanción que el ordenamiento jurídico chileno encomienda al Servicio Agrícola y Ganadero (SAG), la SEREMI de Salud, las Municipalidades y los Tribunales de Justicia (Ley N° 21.489, D.L. N° 3.557, D.S. N° 21 y 22/2024 y legislación conexa).
            </p>
          </div>
        </div>

        {/* Marco Legal Chileno (Resumen visual) */}
        <section className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Fundamentos en la Normativa Chilena Vigente</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MARCO_LEGAL.map((m, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border/60 bg-surface-raised/40 p-3.5 space-y-1"
              >
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{m.ley}</span>
                </p>
                <p className="text-[0.8rem] text-muted-foreground leading-snug pl-5">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preámbulo */}
        <section className="space-y-4 pt-4 border-t border-border/60">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>Preámbulo</span>
          </h2>
          <div className="space-y-3 pl-0 sm:pl-5 border-l-2 border-primary/30">
            {PREAMBULO.map((p, i) => (
              <p key={i} className="text-[0.95rem] text-foreground/90 leading-relaxed font-serif">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Artículos */}
        <section className="space-y-10 pt-4 border-t border-border/60">
          {ARTICULOS.map((a) => (
            <div key={a.numero} className="space-y-3 group">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/40 pb-2">
                <h3 className="flex items-baseline gap-3">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest shrink-0 font-mono">
                    Art. {a.numero}
                  </span>
                  <span className="font-serif text-lg sm:text-xl font-semibold text-foreground">
                    {a.titulo}
                  </span>
                </h3>
                {a.badge && (
                  <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground bg-surface-sunken border border-border/60 rounded px-2 py-0.5 font-mono">
                    {a.badge}
                  </span>
                )}
              </div>

              <div className="space-y-3 pl-0 sm:pl-8">
                {a.bloques.map((b, i) =>
                  b.tipo === 'lista' ? (
                    <ul key={i} className="space-y-2">
                      {b.items?.map((item, j) => (
                        <li key={j} className="text-[0.9rem] text-foreground/85 leading-relaxed flex gap-2.5">
                          <span className="text-primary shrink-0 mt-1.5 text-xs">●</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i} className="text-[0.9rem] text-foreground/85 leading-relaxed">
                      {b.texto}
                    </p>
                  )
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Cierre / Llamado */}
        <footer className="pt-10 border-t border-border/60 space-y-6 print:hidden">
          <div className="rounded-2xl bg-surface-sunken border border-border/80 p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-serif font-bold text-foreground">
              Participa en la construcción del Registro Territorial
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Al inscribirte en el Registro Territorial Apícola de Chiloé aceptas esta Carta y sus principios de custodia soberana. El registro base, el mapa de pecoreo protegido y las alertas fitosanitarias son y serán 100% gratuitos para todo apicultor del archipiélago.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm transition-colors shadow-sm"
              >
                Inscribirme en el Registro Gratis
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border bg-surface-raised hover:bg-surface-sunken text-foreground rounded-xl font-medium text-sm transition-colors"
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </main>
  );
}
