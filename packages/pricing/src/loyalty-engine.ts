import type { OyzCommercialRole } from './cart-pricing';
import { canRoleRedeemPoints } from './loyalty-checkout';

export type CanonicalLoyaltyEventType =
  | 'compra_completada'
  | 'ticket_reclamado'
  | 'resena_aprobada'
  | 'frasco_retornado'
  | 'bienvenida_registro'
  | 'bienvenida_reposicion'
  | 'canje_checkout'
  | 'ajuste_manual';

export type CanonicalLoyaltyChannel =
  | 'web'
  | 'campo_pos'
  | 'b2b_mesa'
  | 'club'
  | 'admin';

export interface LoyaltyEngineConfig {
  clpGastoPorPunto: number;
  clpGastoPorCiclo: number;
  ciclosPorResena: number;
  puntosBienvenida: number;
  puntosReposicion: number;
  ciclosBienvenidaReposicion: number;
  ciclosPorFrasco: number;
  puntosPorFrasco: number;
  puntosBonoHito10Frascos: number;
  ciclosBonoHito10Frascos: number;
}

export const DEFAULT_LOYALTY_ENGINE_CONFIG: LoyaltyEngineConfig = {
  clpGastoPorPunto: 100, // 1 punto por cada $100 CLP gastados
  clpGastoPorCiclo: 1000, // 1 ciclo por cada $1.000 CLP gastados
  ciclosPorResena: 5,     // 5 ciclos por reseña de cata sensorial aprobada
  puntosBienvenida: 100,  // 100 puntos = $1.000 CLP de bienvenida
  puntosReposicion: 100,  // 100 puntos al activar club de reposición
  ciclosBienvenidaReposicion: 10, // Incentivo de estatus al sumarse al club
  ciclosPorFrasco: 2,     // 2 ciclos por retorno circular de frasco
  puntosPorFrasco: 50,    // 50 puntos por retorno circular de frasco
  puntosBonoHito10Frascos: 150, // 150 puntos extra al completar lote de 10 frascos (total 650 pts = $6.500 CLP)
  ciclosBonoHito10Frascos: 10,  // 10 ciclos extra de trayectoria territorial
};

export interface CanonicalLoyaltyInput {
  eventType: CanonicalLoyaltyEventType;
  amountClp?: number;
  userRole?: OyzCommercialRole | string;
  pointsToRedeem?: number;
  frascosCount?: number;
  customDeltas?: {
    deltaPuntos?: number;
    deltaCiclos?: number;
  };
}

export interface CanonicalLoyaltyDeltas {
  deltaPuntos: number;
  deltaCiclos: number;
  motivo: string;
  isEligible: boolean;
  errorCode?: string;
}

/**
 * Calcula los deltas canónicos de puntos (moneda líquida CLP) y ciclos (estatus vitalicio)
 * de acuerdo al evento y las reglas económicas de Enjambre Legado.
 */
export function computeCanonicalLoyaltyDeltas(
  input: CanonicalLoyaltyInput,
  customConfig?: Partial<LoyaltyEngineConfig>,
): CanonicalLoyaltyDeltas {
  const config: LoyaltyEngineConfig = {
    ...DEFAULT_LOYALTY_ENGINE_CONFIG,
    ...customConfig,
  };

  const { eventType, amountClp = 0, userRole, pointsToRedeem = 0, frascosCount = 1 } = input;

  switch (eventType) {
    case 'compra_completada': {
      // Las compras mayoristas B2B tienen sus propios márgenes y no acumulan puntos CLP de consumo minorista
      const isEligible = canRoleRedeemPoints(userRole);
      const paidClp = Math.max(0, Math.floor(amountClp));

      const deltaPuntos = isEligible && config.clpGastoPorPunto > 0
        ? Math.floor(paidClp / config.clpGastoPorPunto)
        : 0;

      // Los ciclos de reputación se acumulan siempre (trayectoria biocultural)
      const deltaCiclos = config.clpGastoPorCiclo > 0
        ? Math.floor(paidClp / config.clpGastoPorCiclo)
        : 0;

      return {
        deltaPuntos,
        deltaCiclos,
        motivo: 'Compra completada',
        isEligible: true,
      };
    }

    case 'ticket_reclamado': {
      const paidClp = Math.max(0, Math.floor(amountClp));
      const deltaPuntos = config.clpGastoPorPunto > 0
        ? Math.floor(paidClp / config.clpGastoPorPunto)
        : 0;
      const deltaCiclos = config.clpGastoPorCiclo > 0
        ? Math.floor(paidClp / config.clpGastoPorCiclo)
        : 0;

      return {
        deltaPuntos,
        deltaCiclos,
        motivo: 'Ticket de feria presencial reclamado',
        isEligible: true,
      };
    }

    case 'canje_checkout': {
      if (!canRoleRedeemPoints(userRole)) {
        return {
          deltaPuntos: 0,
          deltaCiclos: 0,
          motivo: 'Rol no elegible para canje de puntos',
          isEligible: false,
          errorCode: 'role_not_eligible',
        };
      }
      const points = Math.max(0, Math.floor(pointsToRedeem));
      return {
        deltaPuntos: -points,
        deltaCiclos: 0, // El canje no reduce los ciclos acumulados (son vitalicios)
        motivo: 'Canje de puntos en compra',
        isEligible: true,
      };
    }

    case 'bienvenida_registro': {
      return {
        deltaPuntos: config.puntosBienvenida,
        deltaCiclos: 0,
        motivo: 'Bienvenida al Enjambre Legado',
        isEligible: true,
      };
    }

    case 'bienvenida_reposicion': {
      return {
        deltaPuntos: config.puntosReposicion,
        deltaCiclos: config.ciclosBienvenidaReposicion,
        motivo: 'Activación de suscripción de reposición',
        isEligible: true,
      };
    }

    case 'resena_aprobada': {
      return {
        deltaPuntos: 0,
        deltaCiclos: config.ciclosPorResena,
        motivo: 'Cata sensorial verificada y aprobada',
        isEligible: true,
      };
    }

    case 'frasco_retornado': {
      const count = Math.max(1, Math.floor(frascosCount));
      const lotesDe10 = Math.floor(count / 10);
      const puntosBase = count * config.puntosPorFrasco;
      const puntosBono = lotesDe10 * config.puntosBonoHito10Frascos;
      const ciclosBase = count * config.ciclosPorFrasco;
      const ciclosBono = lotesDe10 * config.ciclosBonoHito10Frascos;

      const deltaPuntos = puntosBase + puntosBono;
      const deltaCiclos = ciclosBase + ciclosBono;
      const motivo = lotesDe10 > 0
        ? `Retorno circular de ${count} frasco(s) (incluye ${lotesDe10} bono(s) de hito 10 frascos)`
        : `Retorno circular de ${count} frasco(s)`;

      return {
        deltaPuntos,
        deltaCiclos,
        motivo,
        isEligible: true,
      };
    }

    case 'ajuste_manual': {
      return {
        deltaPuntos: input.customDeltas?.deltaPuntos ?? 0,
        deltaCiclos: input.customDeltas?.deltaCiclos ?? 0,
        motivo: 'Ajuste administrativo de lealtad',
        isEligible: true,
      };
    }

    default: {
      return {
        deltaPuntos: 0,
        deltaCiclos: 0,
        motivo: 'Evento de lealtad no reconocido',
        isEligible: false,
        errorCode: 'unknown_event_type',
      };
    }
  }
}

export interface JarReturnReward {
  count: number;
  puntosBase: number;
  puntosBono: number;
  totalPuntos: number;
  totalCiclos: number;
  lotesDe10: number;
  valorEquivalenteClp: number;
}

/**
 * Calcula la recompensa integral (puntos canjeables, bonos por hito de 10 unidades,
 * ciclos vitalicios y equivalencia en CLP) por retorno circular de frascos de vidrio.
 */
export function calculateJarReturnReward(
  count: number,
  customConfig?: Partial<LoyaltyEngineConfig>,
): JarReturnReward {
  const config = { ...DEFAULT_LOYALTY_ENGINE_CONFIG, ...customConfig };
  const safeCount = Math.max(0, Math.floor(count));
  const lotesDe10 = Math.floor(safeCount / 10);
  const puntosBase = safeCount * config.puntosPorFrasco;
  const puntosBono = lotesDe10 * config.puntosBonoHito10Frascos;
  const totalPuntos = puntosBase + puntosBono;
  const totalCiclos = (safeCount * config.ciclosPorFrasco) + (lotesDe10 * config.ciclosBonoHito10Frascos);
  // En Enjambre Legado, 1 punto equivale a $10 CLP de descuento en checkout (100 pts = $1.000 CLP)
  const valorEquivalenteClp = totalPuntos * 10;

  return {
    count: safeCount,
    puntosBase,
    puntosBono,
    totalPuntos,
    totalCiclos,
    lotesDe10,
    valorEquivalenteClp,
  };
}
