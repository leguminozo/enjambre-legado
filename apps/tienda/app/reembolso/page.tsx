import { getSiteContent } from '@/lib/cms';
import { LegalContent } from '@/components/shop/legal-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Reembolso',
  description: 'Garantía y devoluciones de nuestros productos.',
};

export default async function ReembolsoPage() {
  const contentData = await getSiteContent('legal_reembolso');
  const item = contentData[0]?.content;

  const title = item?.title || 'Política de Reembolso';
  const content = item?.body || `
    Tu satisfacción es fundamental para nuestro legado.
    
    1. Garantía de Calidad
    Si recibes un producto dañado durante el transporte o que no cumple con nuestros estándares de pureza, gestionaremos un reemplazo o reembolso inmediato.
    
    2. Plazo de Reclamación
    Tienes 10 días desde la recepción del producto para informarnos sobre cualquier inconveniente.
    
    3. Condiciones de Devolución
    Debido a la naturaleza alimentaria de nuestros productos, no aceptamos devoluciones de frascos abiertos, a menos que sea por un defecto de calidad comprobable.
    
    4. Proceso de Reembolso
    Los reembolsos se procesan a través del mismo método de pago original en un plazo de 5 a 10 días hábiles.
  `;

  return (
    <LegalContent 
      title={title}
      content={content}
      lastUpdated={item?.updated_at || 'Mayo 2026'}
    />
  );
}
