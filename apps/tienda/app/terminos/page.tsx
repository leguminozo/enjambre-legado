import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos del Servicio',
  description: 'Condiciones de uso de la plataforma La Obrera y el Zángano.',
};

export default async function TerminosPage() {
  const contentData = await getSiteContent('legal_terminos');
  const item = contentData[0]?.content;

  const title = item?.title || 'Términos del Servicio';
  const content = item?.body || `
    Bienvenido a la experiencia digital de La Obrera y el Zángano. Al acceder a este sitio, aceptas los siguientes términos:
    
    1. Propiedad Intelectual
    Todo el contenido, incluyendo fotografías, textos y diseños, son propiedad de La Obrera y el Zángano y están protegidos por leyes de propiedad intelectual.
    
    2. Uso del Sitio
    Este sitio está destinado a la adquisición de productos apícolas y la inmersión en nuestra cultura. Cualquier uso malintencionado será perseguido legalmente.
    
    3. Precios y Disponibilidad
    Los precios están sujetos a cambios sin previo aviso. La disponibilidad de nuestras mieles depende de los ciclos naturales del bosque de Chiloé.
    
    4. Limitación de Responsabilidad
    No nos hacemos responsables por el mal uso de los productos una vez entregados, ni por interrupciones técnicas fuera de nuestro control.
  `;

  return (
    <LegalContent 
      title={title}
      content={content}
      lastUpdated={item?.updated_at || 'Mayo 2026'}
    />
  );
}
