import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { co2EvitadoKgFrascos500g } from '@enjambre/impacto';
import { CircularClient, type RetornoItem } from './circular-client';

export const metadata = {
  title: 'Retorno de Frascos & Economía Circular | La Obrera y el Zángano',
  description: 'Historial de envases de vidrio retornados, kilogramos de CO₂e evitados y puntos de lealtad acreditados.',
};

export default async function CircularPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Consultar eventos canónicos en loyalty_events_ledger
  const { data: canonicalEvents } = await supabase
    .from('loyalty_events_ledger')
    .select('id, created_at, delta_puntos, metadata, canal')
    .eq('user_id', user.id)
    .eq('tipo_evento', 'frasco_retornado')
    .order('created_at', { ascending: false });

  // 2. Consultar transacciones legacy en loyalty_transactions por compatibilidad
  const { data: legacyTxs } = await supabase
    .from('loyalty_transactions')
    .select('id, created_at, points, description')
    .eq('user_id', user.id)
    .eq('action_type', 'retorno_envase')
    .order('created_at', { ascending: false });

  const retornos: RetornoItem[] = [];
  let totalFrascos = 0;
  let puntosGanados = 0;

  // Procesar eventos canónicos
  if (canonicalEvents && canonicalEvents.length > 0) {
    for (const ev of canonicalEvents) {
      const meta = (ev.metadata ?? {}) as Record<string, unknown>;
      const cantidad = typeof meta.cantidad_frascos === 'number' ? meta.cantidad_frascos : 1;
      const puntos = ev.delta_puntos || cantidad * 500;
      totalFrascos += cantidad;
      puntosGanados += puntos;
      retornos.push({
        id: ev.id,
        created_at: ev.created_at,
        puntos,
        cantidad,
        punto:
          ev.canal === 'campo_pos'
            ? 'Feria / Punto POS'
            : ev.canal === 'web_despacho'
            ? 'Despacho a domicilio'
            : 'Recolección directa',
      });
    }
  } else if (legacyTxs && legacyTxs.length > 0) {
    // Si no hay canónicos aún, usar los registros legacy
    for (const tx of legacyTxs) {
      const match = tx.description?.match(/Retorno de (\d+) frasco/i);
      const cantidad = match ? parseInt(match[1], 10) : 1;
      const puntos = tx.points || cantidad * 500;
      totalFrascos += cantidad;
      puntosGanados += puntos;
      retornos.push({
        id: tx.id,
        created_at: tx.created_at,
        puntos,
        cantidad,
        punto: 'Feria / Punto Territorial',
      });
    }
  }

  const co2EvitadoKg = co2EvitadoKgFrascos500g(totalFrascos);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <CircularClient
        totalFrascos={totalFrascos}
        co2EvitadoKg={co2EvitadoKg}
        puntosGanados={puntosGanados}
        retornos={retornos}
      />
    </div>
  );
}