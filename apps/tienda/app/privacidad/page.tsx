import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo tratamos tus datos en La Obrera y el Zángano.',
};

export default async function PrivacidadPage() {
  const contentData = await getSiteContent('legal_privacidad');
  const item = contentData[0]?.content;

  const title = item?.title || 'Política de Privacidad';
  const content = item?.body || `
    En La Obrera y el Zángano, valoramos tu privacidad tanto como la pureza de nuestro néctar.
    
    1. Recolección de Datos
    Recopilamos solo la información necesaria para procesar tus pedidos y mejorar tu experiencia sensorial en nuestro sitio.
    
    2. Uso de la Información
    Tus datos se utilizan para el envío de productos, comunicaciones sobre tu pedido y, si lo autorizas, novedades del Legado del Bosque.
    
    3. Protección de Datos
    Implementamos medidas de seguridad de grado industrial para proteger tu información personal contra acceso no autorizado.
    
    4. Tus Derechos
    Puedes solicitar el acceso, rectificación o eliminación de tus datos en cualquier momento escribiendo a hola@obrerayzangano.com.
  `;

  return (
    <LegalContent 
      title={title}
      content={content}
      lastUpdated={item?.updated_at || 'Mayo 2026'}
    />
  );
}
