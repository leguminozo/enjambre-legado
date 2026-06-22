export type CourierCode =
  | 'blueexpress'
  | 'chilexpress'
  | 'starken'
  | 'correos_chile'
  | 'pullman_cargo'
  | 'turbus_encomiendas'
  | 'dhl'
  | 'fedex'
  | 'retiro_tienda'
  | 'despacho_propio'
  | 'otro';

export type CourierModalidad = 'courier' | 'retiro' | 'propio';

export type ChileanCourier = {
  code: CourierCode;
  label: string;
  shortLabel: string;
  modalidad: CourierModalidad;
  /** Integración API disponible o planificada (BlueExpress primero). */
  integracionApi: boolean;
  trackingUrl?: (trackingCode: string) => string;
};

export const DEFAULT_COURIER: CourierCode = 'blueexpress';

/** Catálogo de couriers y modalidades de despacho en Chile. */
export const CHILEAN_COURIERS: readonly ChileanCourier[] = [
  {
    code: 'blueexpress',
    label: 'BlueExpress',
    shortLabel: 'BlueExpress',
    modalidad: 'courier',
    integracionApi: true,
    trackingUrl: (code) =>
      `https://www.bluex.cl/seguimiento?n=${encodeURIComponent(code)}`,
  },
  {
    code: 'chilexpress',
    label: 'Chilexpress',
    shortLabel: 'Chilexpress',
    modalidad: 'courier',
    integracionApi: false,
    trackingUrl: (code) =>
      `https://www.chilexpress.cl/seguimiento?codigo=${encodeURIComponent(code)}`,
  },
  {
    code: 'starken',
    label: 'Starken',
    shortLabel: 'Starken',
    modalidad: 'courier',
    integracionApi: false,
    trackingUrl: (code) =>
      `https://www.starken.cl/seguimiento?codigo=${encodeURIComponent(code)}`,
  },
  {
    code: 'correos_chile',
    label: 'Correos de Chile',
    shortLabel: 'Correos Chile',
    modalidad: 'courier',
    integracionApi: false,
    trackingUrl: (code) =>
      `https://www.correos.cl/seguimiento/?codigo=${encodeURIComponent(code)}`,
  },
  {
    code: 'pullman_cargo',
    label: 'Pullman Cargo',
    shortLabel: 'Pullman',
    modalidad: 'courier',
    integracionApi: false,
  },
  {
    code: 'turbus_encomiendas',
    label: 'Turbus Encomiendas',
    shortLabel: 'Turbus',
    modalidad: 'courier',
    integracionApi: false,
  },
  {
    code: 'dhl',
    label: 'DHL Chile',
    shortLabel: 'DHL',
    modalidad: 'courier',
    integracionApi: false,
    trackingUrl: (code) =>
      `https://www.dhl.com/cl-es/home/tracking.html?tracking-id=${encodeURIComponent(code)}`,
  },
  {
    code: 'fedex',
    label: 'FedEx Chile',
    shortLabel: 'FedEx',
    modalidad: 'courier',
    integracionApi: false,
    trackingUrl: (code) =>
      `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(code)}`,
  },
  {
    code: 'retiro_tienda',
    label: 'Retiro en tienda',
    shortLabel: 'Retiro',
    modalidad: 'retiro',
    integracionApi: false,
  },
  {
    code: 'despacho_propio',
    label: 'Despacho propio',
    shortLabel: 'Propio',
    modalidad: 'propio',
    integracionApi: false,
  },
  {
    code: 'otro',
    label: 'Otro (acordado con cliente)',
    shortLabel: 'Otro',
    modalidad: 'courier',
    integracionApi: false,
  },
] as const;

const COURIER_BY_CODE = new Map(
  CHILEAN_COURIERS.map((c) => [c.code, c] as const),
);

export function isCourierCode(value: string): value is CourierCode {
  return COURIER_BY_CODE.has(value as CourierCode);
}

export function resolveCourierCode(
  value: string | null | undefined,
  fallback: CourierCode = DEFAULT_COURIER,
): CourierCode {
  if (value && isCourierCode(value)) return value;
  return fallback;
}

export function getCourier(code: CourierCode): ChileanCourier {
  return COURIER_BY_CODE.get(code) ?? COURIER_BY_CODE.get(DEFAULT_COURIER)!;
}

export function getCourierLabel(code: string | null | undefined): string {
  if (!code) return getCourier(DEFAULT_COURIER).label;
  if (isCourierCode(code)) return getCourier(code).label;
  return code;
}

export function buildCourierTrackingUrl(
  courierCode: string | null | undefined,
  trackingCode: string,
): string | null {
  if (!trackingCode || !courierCode || !isCourierCode(courierCode)) return null;
  const courier = getCourier(courierCode);
  return courier.trackingUrl?.(trackingCode) ?? null;
}

/** Couriers visibles en checkout tienda (excluye "otro", reservado para acuerdo B2B). */
export function getCheckoutCourierOptions(): ChileanCourier[] {
  return CHILEAN_COURIERS.filter((c) => c.code !== 'otro');
}