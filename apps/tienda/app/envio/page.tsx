import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Envío',
  description: 'Detalles sobre la logística y tiempos de entrega.',
};

export default async function EnvioPage() {
  const contentData = await getSiteContent('legal_envio');
  const item = contentData[0]?.content;

  const title = item?.title || 'Política de Envío';
  const content = item?.body || `
    Nuestras mieles viajan desde Chiloé y otros territorios remotos para llegar a tu mesa.
    
    1. Tiempos de Despacho
    Los pedidos se procesan en 24-48 horas hábiles. El tiempo de tránsito depende de tu ubicación:
    - Región Metropolitana: 2 a 4 días hábiles.
    - Otras Regiones: 3 a 7 días hábiles.
    - Chiloé: Entrega local coordinada.
    
    2. Costos de Envío
    El costo se calcula en el checkout basándose en el peso y destino. Ofrecemos envío gratuito en pedidos superiores a un monto específico (ver banner en tienda).
    
    3. Seguimiento
    Una vez despachado, recibirás un número de seguimiento vía correo electrónico.
    
    4. Envíos Internacionales
    Para envíos fuera de Chile, por favor contáctanos directamente para coordinar logística especializada.
  `;

  return (
    <LegalContent 
      title={title}
      content={content}
      lastUpdated={item?.updated_at || 'Mayo 2026'}
    />
  );
}
