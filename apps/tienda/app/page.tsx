import { getSiteContent } from '@/lib/cms';
import TiendaLandingView from './landing-view';

export default async function TiendaPage() {
  // Fetch dynamic content
  const serviciosData = await getSiteContent('servicios');
  const talleresData = await getSiteContent('talleres');

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

  return (
    <TiendaLandingView 
      initialServicios={servicios} 
      initialTalleres={talleres} 
    />
  );
}
