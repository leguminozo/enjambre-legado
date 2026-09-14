import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

  const customerExperienceData = {
    '@context': 'https://schema.org',
    '@type': 'SpecialAnnouncement',
    name: 'Ontología de la Experiencia de Cliente y Custodia Biocultural — Enjambre Legado',
    description:
      'Definición de las entidades, métricas y módulos interactivos que componen el dashboard de clientes de La Obrera y el Zángano.',
    url: `${siteUrl}/demo/perfil`,
    about: [
      {
        '@type': 'Thing',
        name: 'Mi Legado (Resumen Holístico)',
        description:
          'Centro de control del custodio. Consolida metros cuadrados de bosque nativo protegidos, gramos de azúcar refinada sustituida, CO2 evitado y estado de árboles apadrinados.',
        url: `${siteUrl}/demo/perfil`,
      },
      {
        '@type': 'Thing',
        name: 'Pasaporte Biocultural de Colmena',
        description:
          'Enlace de custodia a una colmena real en el apiario de Chiloé (ej. Colmena Centinela #04). Expone registros de salud, pecoreo de néctar nativo, floración activa y coordenadas de protección.',
        url: `${siteUrl}/demo/perfil/pasaporte`,
      },
      {
        '@type': 'Thing',
        name: 'Tarjeta Obrera y Billetera de Sellos',
        description:
          'Sistema silencioso de fidelidad biocultural sin gamificación agresiva. Cada formato comprado (sachet, frasco, cofre) suma sellos de ruta que desbloquean recolecciones automáticas de agradecimiento.',
        url: `${siteUrl}/demo/perfil/billetera`,
      },
      {
        '@type': 'Thing',
        name: 'Reposición Automatizada (Suscripción)',
        description:
          'Mecanismo de suscripción periódica (mensual, bimestral o trimestral) que asegura suministro continuo de miel cruda según el ritmo biológico del suscriptor, con curaduría de temporada.',
        url: `${siteUrl}/demo/perfil/reposicion`,
      },
      {
        '@type': 'Thing',
        name: 'Línea de Tiempo de Pedidos y DTEs',
        description:
          'Historial de despachos con enlace a documentos tributarios electrónicos oficiales (SII Chile) y hojas de trazabilidad de los lotes adquiridos.',
        url: `${siteUrl}/demo/perfil/pedidos`,
      },
      {
        '@type': 'Thing',
        name: 'Rituales de Cata Sensorial',
        description:
          'Espacio guiado para anotar la evolución organoléptica de la miel (aroma, acidez, dulzura, textura de cristalización y maridajes).',
      },
      {
        '@type': 'Thing',
        name: 'Economía Circular de Frascos',
        description:
          'Programa de devolución y reesterilización de envases de vidrio para mantener una huella de carbono neutra en el envasado.',
      },
    ],
    potentialAction: {
      '@type': 'ViewAction',
      name: 'Explorar Dashboard Demo Interactivo',
      target: `${siteUrl}/demo/perfil`,
    },
  };

  return NextResponse.json(customerExperienceData, {
    headers: {
      'Content-Type': 'application/ld+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
