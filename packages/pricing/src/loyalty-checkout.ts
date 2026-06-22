/** 100 puntos canjeables = $1.000 CLP de descuento en checkout. */
export const LOYALTY_POINTS_PER_DISCOUNT_BLOCK = 100;
export const LOYALTY_CLP_PER_DISCOUNT_BLOCK = 1000;

export function loyaltyDiscountFromPoints(points: number): number {
  if (points <= 0) return 0;
  return (
    Math.floor(points / LOYALTY_POINTS_PER_DISCOUNT_BLOCK) *
    LOYALTY_CLP_PER_DISCOUNT_BLOCK
  );
}

/** Máximo canjeable sin superar saldo ni dejar total < $1 CLP. */
export function maxRedeemablePoints(balance: number, subtotalClp: number): number {
  const normalizedBalance = Math.max(0, Math.floor(balance));
  const maxByBalance =
    Math.floor(normalizedBalance / LOYALTY_POINTS_PER_DISCOUNT_BLOCK) *
    LOYALTY_POINTS_PER_DISCOUNT_BLOCK;
  const maxDiscountClp = Math.max(0, subtotalClp - 1);
  const maxBySubtotal =
    Math.floor(maxDiscountClp / LOYALTY_CLP_PER_DISCOUNT_BLOCK) *
    LOYALTY_POINTS_PER_DISCOUNT_BLOCK;
  return Math.min(maxByBalance, maxBySubtotal);
}

export function validatePointsRedeemInput(
  points: number,
  balance: number,
  subtotalClp: number,
): { ok: true; discountClp: number } | { ok: false; code: string } {
  if (!Number.isInteger(points) || points < 0) {
    return { ok: false, code: "invalid_points" };
  }
  if (points === 0) {
    return { ok: true, discountClp: 0 };
  }
  if (points % LOYALTY_POINTS_PER_DISCOUNT_BLOCK !== 0) {
    return { ok: false, code: "invalid_step" };
  }
  if (points > balance) {
    return { ok: false, code: "insufficient_balance" };
  }
  const allowedMax = maxRedeemablePoints(balance, subtotalClp);
  if (points > allowedMax) {
    return { ok: false, code: "exceeds_max" };
  }
  return { ok: true, discountClp: loyaltyDiscountFromPoints(points) };
}

export function computePaidTotal(
  subtotalClp: number,
  shippingCostClp: number,
  discountClp: number,
): number {
  return Math.max(1, Math.round(subtotalClp + shippingCostClp - discountClp));
}