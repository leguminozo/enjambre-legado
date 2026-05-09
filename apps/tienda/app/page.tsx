import { getSiteContent } from '@/lib/cms';
import TiendaLandingView from './landing-view';

export default async function TiendaPage() {
  // Fetch dynamic content
  const serviciosData = await getSiteContent('servicios');
  const talleresData = await getSiteContent('talleres');
  const coleccionesData = await getSiteContent('colecciones');
  const footerBrandingData = await getSiteContent('footer_branding');
  const footerNavData = await getSiteContent('footer_nav');
  const footerLegalData = await getSiteContent('footer_legal');

  // Map to the format expected by the view
  const servicios = serviciosData.length > 0 
    ? serviciosData.map(item => item.content)
    : [
        { num: '01', title: 'Distribución Mayorista', desc: 'Suministro directo para hoteles, restaurantes y selectos comercios. Volumen mínimo 50kg.' },
        { num: '02', title: 'Envasado Privado', desc: 'Etiquetado personalizado para eventos corporativos, matrimonios y regalos de alto standing.' },
        { num: '03', title: 'Exportación Selectiva', desc: 'Logística especializada para mercados de alto valor en Asia y Europa. Certificaciones sanitarias incluidas.' },
        { num: '04', title: 'Consultoría Apícola', desc: 'Asesoría técnica para nuevos apicultores y optimización de colmenares existentes en zonas húmedas.' }
      ];

  const talleres = talleresData.length > 0
    ? talleresData.map(item => item.content)
    : [
        { date: 'Próxima fecha — Junio 2026', title: 'La Arquitectura de la Colmena', desc: 'Tres días de inmersión en el bosque de Chiloé. Aprendizaje práctico sobre el manejo respetuoso de la abeja nativa y la extracción artesanal.', action: 'Solicitar cupo' },
        { date: 'Bimensual', title: 'Cata de Mieles Oscuras', desc: 'Sesiones sensoriales guiadas para identificar notas, texturas y orígenes botánicos. Desarrollo del paladar para mieles monoflorales.', action: 'Inscribirse' },
        { date: 'A demanda', title: 'Medicina del Panal', desc: 'Elaboración de ungüentos, tinturas y remedios tradicionales a partir de productos de la colmena. Enfoque en autosuficiencia.', action: 'Consultar' }
      ];

  const colecciones = coleccionesData.length > 0
    ? coleccionesData.map(item => item.content)
    : [
        { kicker: 'Sachets', title: 'Gotas de Néctar', desc: '¡Lleva contigo la dulzura del bosque! Perfecto tamaño para tus experiencias diarias.', href: '/catalogo' },
        { kicker: 'Frascos Medios', title: 'Tesoros del Colmenar', desc: '¡La dulzura boscosa en tu mesa! En tus preparaciones y en cada cucharada.', href: '/catalogo' },
        { kicker: 'Frascos Mayores', title: 'Reservas del Bosque', desc: 'Nuestra mayor reserva para el futuro. Sobrevive a la incertidumbre y acompaña momentos únicos.', href: '/catalogo' },
        { kicker: 'Miel Virgen', title: 'Panal de Bosque', desc: 'El placer de miel libre de intervenciones. La pureza del néctar, una huella del cosmos.', href: '/catalogo' },
        { kicker: 'Cajas de Sachets', title: 'Cofres del Enjambre', desc: '20 Sachets para disfrutar, compartir, recordar. El bosque a tu ritmo de vida.', href: '/catalogo' },
        { kicker: 'Suscripciones', title: 'Legado del Bosque', desc: 'La búsqueda de legado y regeneración desde el sur del planeta. Creaciones en su máximo esplendor.', href: '/catalogo' },
      ];

  const footerData = {
    branding: footerBrandingData[0]?.content || { tagline: '¡Seamos Legado! Luce saludable. Sé parte del cambio.', email: 'hola@obrerayzangano.com' },
    nav: footerNavData.length > 0 ? footerNavData.map(item => item.content) : [],
    legal: footerLegalData.length > 0 ? footerLegalData.map(item => item.content) : []
  };

  return (
    <TiendaLandingView 
      initialServicios={servicios} 
      initialTalleres={talleres} 
      initialColecciones={colecciones}
      footerData={footerData}
    />
  );
}
