import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { getTerritorioCmsContent } from '@/lib/territorio-cms';
import { CONTACTO_INSTITUCIONAL } from '@/lib/contacto-institucional';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacidad y Protección de Datos — Registro Apícola de Chiloé',
  description:
    'Política de privacidad del censo territorial de Chiloé. Datos protegidos, anonimización de coordenadas GPS y control absoluto de tu información.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/privacidad',
  },
  openGraph: {
    title: 'Privacidad y Protección de Datos · Registro Apícola de Chiloé',
    description:
      'Garantía de confidencialidad: tu ubicación GPS exacta nunca se hace pública. Control soberano de tus datos apícolas.',
    url: 'https://www.registroapicolachiloe.me/privacidad',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacidad y Protección de Datos · Registro Apícola de Chiloé',
    description:
      'Garantía de confidencialidad: tu ubicación GPS exacta nunca se hace pública. Control soberano de tus datos apícolas.',
  },
};

export default async function PrivacidadTerritorialPage() {
  const cms = await getTerritorioCmsContent();

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader content={cms.header} />
      <article className="mx-auto w-full max-w-2xl px-6 sm:px-8 py-16 sm:py-24">
        <p className="text-sm text-muted-foreground mb-4">Registro Territorial Apícola de Chiloé</p>
        <h1 className="font-existencial text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-6">
          Política de datos del censo
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          Esta política rige la recolección y tratamiento de datos para la inscripción territorial, la declaración de apiarios y la visualización cartográfica.
          El marco de gobernanza y soberanía de datos se encuentra consagrado en la{' '}
          <Link href="/carta" className="underline underline-offset-4">
            Carta Constitutiva
          </Link>
          .
        </p>

        <section className="space-y-8 text-[0.95rem] leading-relaxed">
          <div>
            <h2 className="font-medium text-foreground mb-2">Datos solicitados</h2>
            <p className="text-muted-foreground">
              Identidad de contacto (nombre, RUT, teléfono y correo electrónico), Rol Único Pecuario (RUP SAG, si dispone de él), calidad de operación (residente, trashumante, entidad institucional), prácticas sanitarias y método de control de varroa conforme a la Ley N° 21.489, número de colmenas y ubicación georreferenciada de los apiarios. Las coordenadas exactas permanecen bajo estricta reserva: el mapa público abierto muestra únicamente macro-cuencas agregadas por comuna (radios comunales de 5 a 11 km), sin coordenadas individuales. Quienes tienen cuenta y otorgaron su consentimiento informado aparecen en el mapa comunitario interno como un halo aproximado de pecoreo de ~2,0 km de radio (coordenadas degradadas), sin asociar nombres, RUT, RUP ni teléfonos frente a terceros.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Finalidad del tratamiento</h2>
            <p className="text-muted-foreground">
              Los datos se tratan exclusivamente para: (1) resguardo de zonas de pecoreo y prevención de saturación territorial; (2) emisión de alertas sanitarias ante aplicaciones fitosanitarias (Res. Exenta SAG N° 7.068/2024) o cercanía de colmenares; (3) asistencia técnica para preparar la Declaración Anual de Existencias ante el SAG y el Cuaderno de Campo Apícola; (4) emisión de pasaportes digitales de trazabilidad cuando el titular lo solicite; y (5) vinculación productiva y abastecimiento local directo, consistente en la posibilidad de que la dirección del registro (o su comercializadora vinculada de miel de origen en Chiloé, Obrera y Zángano) tome contacto privado, directo e individual con el productor inscrito con el único propósito de consultar disponibilidad y ofrecer la compra directa de miel o productos de la colmena en períodos de alta demanda o escasez estacional. Jamás vendemos, arrendamos ni cedemos bases de datos a terceros ajenos ni empleamos las coordenadas para publicidad masiva. El titular puede desactivar u oponerse en cualquier momento al contacto por abastecimiento sin que ello afecte su acceso gratuito a los servicios esenciales del registro.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Niveles de acceso</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Público general: zonas comunales agregadas de pecoreo protegido (macro-cuencas de 5 a 11 km por comuna), sin coordenadas individuales de apiarios.</li>
              <li>Usuarios registrados (Red Comunitaria): halos aproximados de pecoreo (~2,0 km de radio, coordenadas degradadas) únicamente de quienes autorizaron el mapa comunitario, sin coordenadas exactas ni datos de contacto.</li>
              <li>Titular: acceso íntegro y exclusivo a sus propias coordenadas, fichas de manejo y declaraciones.</li>
              <li>Dirección del registro (Acceso restringido y blindado): acceso reservado únicamente para soporte técnico, resguardo sanitario y contacto directo y privado con el productor para eventuales adquisiciones de miel local conforme a la finalidad declarada, bajo estricto deber de confidencialidad.</li>
              <li>Terceros autorizados: exclusivamente la información que el propio titular decida compartir mediante credencial o pasaporte.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Encargados tecnológicos y plazo de conservación</h2>
            <p className="text-muted-foreground">
              Para operar de forma segura, la plataforma utiliza infraestructura en la nube provista por subencargados sujetos a estándares internacionales de seguridad y acuerdos de procesamiento de datos: alojamiento de base de datos y autenticación en Supabase Inc. (AWS), despliegue de aplicación web en Vercel Inc., envío de notificaciones transaccionales en Resend Inc. y, únicamente cuando el usuario utiliza el dictado por voz en su bitácora, transcripción automatizada mediante Groq Inc. Los datos se conservan mientras el titular mantenga activa su inscripción en el registro territorial o hasta que solicite su supresión o retiro, procediéndose a su eliminación o disociación dentro de un plazo máximo de 30 días corridos, salvo las obligaciones legales o tributarias aplicables a servicios facturados. Cada aceptación de la Carta Constitutiva y de esta Política registra su versión vigente y fecha de suscripción.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Responsable del tratamiento</h2>
            <p className="text-muted-foreground">
              El responsable del tratamiento es el operador técnico del censo territorial, identificado con
              sus datos legales en la sección{' '}
              <Link href="/terminos#operador" className="underline underline-offset-4">
                Identificación del operador
              </Link>{' '}
              de los Términos de uso. El apicultor es titular de sus datos. En un convenio municipal, el
              municipio es responsable del tratamiento del registro comunal y el operador actúa como
              encargado, si se contrata. La comercialización de miel corresponde a una actividad productiva
              distinta, con persona jurídica propia.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-foreground mb-2">Derechos de los titulares</h2>
            <p className="text-muted-foreground">
              Reconocemos los derechos de acceso, rectificación, supresión, oposición, portabilidad y bloqueo
              sobre tus datos, conforme a la Ley N° 19.628 y, desde su entrada en vigencia, a la Ley N° 21.719.
              Puedes ejercerlos en cualquier momento escribiendo a{' '}
              <a href={`mailto:${CONTACTO_INSTITUCIONAL.email}`} className="underline underline-offset-4">
                {CONTACTO_INSTITUCIONAL.email}
              </a>{' '}
              o desde los canales digitales y presenciales de la red. Respondemos dentro de 30 días corridos.
              La negativa a suministrar datos optativos en ningún caso restringe el acceso a los servicios
              esenciales del registro. Si consideras que tus derechos no fueron atendidos, puedes recurrir a la
              autoridad competente en materia de protección de datos personales.
            </p>
          </div>
        </section>

        <p className="mt-12 text-sm text-muted-foreground">
          <Link href="/terminos" className="underline underline-offset-4">
            Términos de uso del registro
          </Link>
          {' · '}
          <Link href="/carta" className="underline underline-offset-4">
            Carta Constitutiva
          </Link>
        </p>
      </article>
      <TerritorioFooter />
    </main>
  );
}
