'use client';

import {
  maxRedeemablePoints,
  formatLoyaltyNivel,
  loyaltyDiscountFromPoints,
  DEFAULT_LOYALTY_REDEMPTION,
  type LoyaltyRedemptionConfig,
} from '@enjambre/pricing';
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
  const [redemptionConfig, setRedemptionConfig] = useState<LoyaltyRedemptionConfig>({
    pointsPerBlock: DEFAULT_LOYALTY_REDEMPTION.pointsPerBlock,
    clpPerBlock: DEFAULT_LOYALTY_REDEMPTION.clpPerBlock,
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoyaltyData(null);
      return;
    }

    const fetchLoyaltyData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

        // Obtener configuración dinámica de beneficios/canje
        let pointsPerBlock: number = DEFAULT_LOYALTY_REDEMPTION.pointsPerBlock;
        let clpPerBlock: number = DEFAULT_LOYALTY_REDEMPTION.clpPerBlock;
        let gastoPorPunto: number = 100;

        const { data: configRows } = await supabase
          .from('beneficios_enjambre')
          .select('clave, valor_numerico')
          .in('clave', ['puntos_canje_bloque', 'clp_descuento_bloque', 'clp_gasto_por_punto']);

        if (configRows) {
          for (const row of configRows) {
            if (row.clave === 'puntos_canje_bloque' && row.valor_numerico != null) {
              pointsPerBlock = Number(row.valor_numerico);
            } else if (row.clave === 'clp_descuento_bloque' && row.valor_numerico != null) {
              clpPerBlock = Number(row.valor_numerico);
            } else if (row.clave === 'clp_gasto_por_punto' && row.valor_numerico != null) {
              gastoPorPunto = Number(row.valor_numerico);
            }
          }
        }

        const activeConfig: LoyaltyRedemptionConfig = { pointsPerBlock, clpPerBlock };
        setRedemptionConfig(activeConfig);

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
        const nivel = formatLoyaltyNivel(puntosData?.nivel_actual ?? 'bronze');
        const puntosTotales = puntosData?.puntos_acumulados_total ?? 0;

        // Calcular puntos ganados por esta compra según gasto por punto dinámico
        const puntosGanados = gastoPorPunto > 0 ? Math.floor(totalCompra / gastoPorPunto) : 0;

        // Calcular descuento disponible según configuración dinámica
        const descuentoDisponible = loyaltyDiscountFromPoints(puntos, activeConfig);

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

    // Debounce: totalCompra cambia con cada quote/slider; evita refetch encadenado
    const timer = window.setTimeout(() => {
      void fetchLoyaltyData();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, user, totalCompra]);

  const descuentoPorPuntos = puntosACanjear > 0
    ? loyaltyDiscountFromPoints(puntosACanjear, redemptionConfig)
    : 0;

  return {
    loyaltyData,
    loading,
    error,
    puntosACanjear,
    setPuntosACanjear,
    descuentoPorPuntos,
    canMaxPoints: loyaltyData
      ? maxRedeemablePoints(loyaltyData.puntos, totalCompra, redemptionConfig)
      : 0,
    redemptionConfig,
  };
}
