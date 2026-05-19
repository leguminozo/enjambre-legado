import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cancelación',
  description: 'Información sobre cancelaciones de pedidos y suscripciones.',
};

export default async function CancelacionPage() {
  const contentData = await getSiteContent('legal_cancelacion');
  const item = contentData[0]?.content;
  const title = (item && typeof item === 'object' && 'title' in item ? String(item.title) : null) || 'Política de Cancelación';
  const content = (item && typeof item === 'object' && 'body' in item ? String(item.body) : null) || `
    Entendemos que los planes pueden cambiar, así como el clima en el sur.
    
    1. Cancelación de Pedidos
    Puedes cancelar tu pedido sin costo dentro de las primeras 12 horas de realizado, siempre que no haya sido despachado.
    
    2. Suscripciones
    Las suscripciones al "Legado del Bosque" pueden cancelarse en cualquier momento desde tu perfil. La cancelación tendrá efecto al final del período facturado.
    
    3. Talleres y Experiencias
    Para cancelaciones de talleres presenciales, se requiere un aviso de 7 días para un reembolso completo. Pasado ese plazo, se retendrá el 50% del valor.
    
    4. Proceso
    Para iniciar una cancelación, por favor contáctanos vía WhatsApp o correo electrónico indicando tu número de pedido.
  `;

  return (
    <LegalContent 
      title={title}
      content={content}
      lastUpdated={(item && typeof item === 'object' && 'updated_at' in item ? String(item.updated_at) : null) || 'Mayo 2026'}
    />
  );
}
