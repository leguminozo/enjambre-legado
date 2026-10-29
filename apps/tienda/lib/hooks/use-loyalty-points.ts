'use client';

import {
  maxRedeemablePoints,
  formatLoyaltyNivel,
  loyaltyDiscountFromPoints,
  DEFAULT_LOYALTY_REDEMPTION,
  type LoyaltyRedemptionConfig,
} from '@enjambre/pricing';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-context';

type LoyaltyPoints = {
  puntos: number;
  nivel_actual: string;
  puntos_acumulados_total: number;
  puntos_ganados_compra: number;
  descuento_disponible: number;
};

type RawUserLoyalty = {
  puntos: number;
  nivel_actual: string;
  puntos_acumulados_total: number;
};

export function useLoyaltyPoints(totalCompra: number) {
  const { isAuthenticated, user } = useAuth();
  const [rawUserLoyalty, setRawUserLoyalty] = useState<RawUserLoyalty | null>(null);
  const [gastoPorPunto, setGastoPorPunto] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puntosACanjear, setPuntosACanjear] = useState(0);
  const [redemptionConfig, setRedemptionConfig] = useState<LoyaltyRedemptionConfig>({
    pointsPerBlock: DEFAULT_LOYALTY_REDEMPTION.pointsPerBlock,
    clpPerBlock: DEFAULT_LOYALTY_REDEMPTION.clpPerBlock,
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setRawUserLoyalty(null);
      setPuntosACanjear(0);
      return;
    }

    let isCancelled = false;

    const fetchLoyaltyData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();

        // Obtener configuración dinámica de beneficios/canje
        let pointsPerBlock: number = DEFAULT_LOYALTY_REDEMPTION.pointsPerBlock;
        let clpPerBlock: number = DEFAULT_LOYALTY_REDEMPTION.clpPerBlock;
        let activeGastoPorPunto: number = 100;

        const { data: configRows } = await supabase
          .from('beneficios_enjambre')
          .select('clave, valor_numerico')
          .in('clave', ['puntos_canje_bloque', 'clp_descuento_bloque', 'clp_gasto_por_punto']);

        if (configRows && !isCancelled) {
          for (const row of configRows) {
            if (row.clave === 'puntos_canje_bloque' && row.valor_numerico != null) {
              pointsPerBlock = Number(row.valor_numerico);
            } else if (row.clave === 'clp_descuento_bloque' && row.valor_numerico != null) {
              clpPerBlock = Number(row.valor_numerico);
            } else if (row.clave === 'clp_gasto_por_punto' && row.valor_numerico != null) {
              activeGastoPorPunto = Number(row.valor_numerico);
            }
          }
        }

        const activeConfig: LoyaltyRedemptionConfig = { pointsPerBlock, clpPerBlock };

        // Obtener puntos del usuario (maybeSingle evita HTTP 406 si el usuario aún no tiene registro)
        const { data: puntosData, error: puntosError } = await supabase
          .from('puntos_fidelizacion')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (puntosError) {
          throw puntosError;
        }

        if (isCancelled) return;

        setRedemptionConfig(activeConfig);
        setGastoPorPunto(activeGastoPorPunto);

        const puntos = puntosData?.puntos ?? 0;
        const nivel = formatLoyaltyNivel(puntosData?.nivel_actual ?? 'bronze');
        const puntosTotales = puntosData?.puntos_acumulados_total ?? 0;

        setRawUserLoyalty({
          puntos,
          nivel_actual: nivel,
          puntos_acumulados_total: puntosTotales,
        });
      } catch (err) {
        if (!isCancelled) {
          console.error('Error fetching loyalty data:', err);
          setError('No se pudo cargar los puntos de fidelización');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void fetchLoyaltyData();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const safeTotalCompra = Math.max(0, totalCompra);

  const canMaxPoints = rawUserLoyalty
    ? maxRedeemablePoints(rawUserLoyalty.puntos, safeTotalCompra, redemptionConfig)
    : 0;

  // Auto-clamp: si el subtotal se reduce (por cupón o quita de producto), los puntos a canjear
  // se ajustan instantáneamente para nunca sobrepasar el máximo legal de la compra.
  useEffect(() => {
    if (puntosACanjear > canMaxPoints) {
      setPuntosACanjear(canMaxPoints);
    }
  }, [canMaxPoints, puntosACanjear]);

  const loyaltyData: LoyaltyPoints | null = useMemo(() => {
    if (!rawUserLoyalty) return null;
    const puntosGanados = gastoPorPunto > 0 ? Math.floor(safeTotalCompra / gastoPorPunto) : 0;
    const descuentoDisponible = loyaltyDiscountFromPoints(rawUserLoyalty.puntos, redemptionConfig);
    return {
      puntos: rawUserLoyalty.puntos,
      nivel_actual: rawUserLoyalty.nivel_actual,
      puntos_acumulados_total: rawUserLoyalty.puntos_acumulados_total,
      puntos_ganados_compra: puntosGanados,
      descuento_disponible: descuentoDisponible,
    };
  }, [rawUserLoyalty, safeTotalCompra, gastoPorPunto, redemptionConfig]);

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
    canMaxPoints,
    redemptionConfig,
  };
}
