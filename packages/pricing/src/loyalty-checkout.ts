export const LOYALTY_POINTS_PER_DISCOUNT_BLOCK = 100;
export const LOYALTY_CLP_PER_DISCOUNT_BLOCK = 1000;

export interface LoyaltyRedemptionConfig {
  pointsPerBlock?: number;
  clpPerBlock?: number;
}

export const DEFAULT_LOYALTY_REDEMPTION: Required<LoyaltyRedemptionConfig> = {
  pointsPerBlock: LOYALTY_POINTS_PER_DISCOUNT_BLOCK,
  clpPerBlock: LOYALTY_CLP_PER_DISCOUNT_BLOCK,
};

export function loyaltyDiscountFromPoints(
  points: number,
  config?: LoyaltyRedemptionConfig,
): number {
  if (points <= 0) return 0;
  const pointsPerBlock = config?.pointsPerBlock ?? LOYALTY_POINTS_PER_DISCOUNT_BLOCK;
  const clpPerBlock = config?.clpPerBlock ?? LOYALTY_CLP_PER_DISCOUNT_BLOCK;
  if (pointsPerBlock <= 0 || clpPerBlock <= 0) return 0;

  return (
    Math.floor(points / pointsPerBlock) * clpPerBlock
  );
}

/** Máximo canjeable sin superar saldo ni dejar total < $1 CLP. */
export function maxRedeemablePoints(
  balance: number,
  subtotalClp: number,
  config?: LoyaltyRedemptionConfig,
): number {
  const pointsPerBlock = config?.pointsPerBlock ?? LOYALTY_POINTS_PER_DISCOUNT_BLOCK;
  const clpPerBlock = config?.clpPerBlock ?? LOYALTY_CLP_PER_DISCOUNT_BLOCK;
  if (pointsPerBlock <= 0 || clpPerBlock <= 0) return 0;

  const normalizedBalance = Math.max(0, Math.floor(balance));
  const maxByBalance =
    Math.floor(normalizedBalance / pointsPerBlock) * pointsPerBlock;
  const maxDiscountClp = Math.max(0, subtotalClp - 1);
  const maxBySubtotal =
    Math.floor(maxDiscountClp / clpPerBlock) * pointsPerBlock;
  return Math.min(maxByBalance, maxBySubtotal);
}

/**
 * Determina si un rol comercial es elegible para canjear puntos CLP en checkout.
 * - comprador / cliente / suscriptor: SÍ (clientes finales D2C)
 * - revendedor / embajador / mayorista: NO (cuentan con escala de márgenes B2B)
 */
export function canRoleRedeemPoints(role: string | null | undefined): boolean {
  if (!role) return true;
  const normalized = role.toLowerCase().trim();
  if (normalized === 'revendedor' || normalized === 'embajador' || normalized === 'mayorista') {
    return false;
  }
  return true;
}

export function validatePointsRedeemInput(
  points: number,
  balance: number,
  subtotalClp: number,
  config?: LoyaltyRedemptionConfig,
  userRole?: string | null,
): { ok: true; discountClp: number } | { ok: false; code: string } {
  if (userRole && !canRoleRedeemPoints(userRole)) {
    return { ok: false, code: "role_not_eligible" };
  }
  const pointsPerBlock = config?.pointsPerBlock ?? LOYALTY_POINTS_PER_DISCOUNT_BLOCK;
  if (pointsPerBlock <= 0) return { ok: false, code: "invalid_config" };

  if (!Number.isInteger(points) || points < 0) {
    return { ok: false, code: "invalid_points" };
  }
  if (points === 0) {
    return { ok: true, discountClp: 0 };
  }
  if (points % pointsPerBlock !== 0) {
    return { ok: false, code: "invalid_step" };
  }
  if (points > balance) {
    return { ok: false, code: "insufficient_balance" };
  }
  const allowedMax = maxRedeemablePoints(balance, subtotalClp, config);
  if (points > allowedMax) {
    return { ok: false, code: "exceeds_max" };
  }
  return { ok: true, discountClp: loyaltyDiscountFromPoints(points, config) };
}

export function computePaidTotal(
  subtotalClp: number,
  shippingCostClp: number,
  discountClp: number,
): number {
  return Math.max(1, Math.round(subtotalClp + shippingCostClp - discountClp));
}