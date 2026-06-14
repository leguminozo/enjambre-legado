'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-context';

type LoyaltyPoints = {
  puntos: number;
  nivel_actual: string;
  puntos_acumulados_total: number;
  puntos_ganados_compra: number;
  descuento_disponible: number;
};

export function useLoyaltyPoints(totalCompra: number) {
  const { isAuthenticated, user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPoints | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puntosACanjear, setPuntosACanjear] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoyaltyData(null);
      return;
    }

    const fetchLoyaltyData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

        // Obtener puntos del usuario
        const { data: puntosData, error: puntosError } = await supabase
          .from('puntos_fidelizacion')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (puntosError && puntosError.code !== 'PGRST116') {
          throw puntosError;
        }

        const puntos = puntosData?.puntos ?? 0;
        const nivel = puntosData?.nivel_actual ?? 'bronze';
        const puntosTotales = puntosData?.puntos_acumulados_total ?? 0;

        // Calcular puntos ganados por esta compra (1 punto por cada $100 CLP)
        const puntosGanados = Math.floor(totalCompra / 100);

        // Calcular descuento disponible (100 puntos = $1.000 CLP)
        const descuentoDisponible = Math.floor(puntos / 100) * 1000;

        setLoyaltyData({
          puntos,
          nivel_actual: nivel,
          puntos_acumulados_total: puntosTotales,
          puntos_ganados_compra: puntosGanados,
          descuento_disponible: descuentoDisponible,
        });
      } catch (err) {
        console.error('Error fetching loyalty data:', err);
        setError('No se pudo cargar los puntos de fidelización');
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltyData();
  }, [isAuthenticated, user, totalCompra]);

  const descuentoPorPuntos = puntosACanjear > 0 ? Math.floor(puntosACanjear / 100) * 1000 : 0;

  return {
    loyaltyData,
    loading,
    error,
    puntosACanjear,
    setPuntosACanjear,
    descuentoPorPuntos,
    canMaxPoints: loyaltyData ? Math.min(loyaltyData.puntos, Math.floor(totalCompra / 100) * 100) : 0,
  };
}
