export {
  CHILEAN_COURIERS,
  DEFAULT_COURIER,
  buildCourierTrackingUrl,
  getCheckoutCourierOptions,
  getCourier,
  getCourierLabel,
  isCourierCode,
  resolveCourierCode,
  type ChileanCourier,
  type CourierCode,
  type CourierModalidad,
} from './couriers';
export {
  computeShippingCost,
  getRegionShippingBase,
  FREE_SHIPPING_SUBTOTAL,
  CHILE_REGIONES,
  type ChileRegion,
  type ShippingQuoteInput,
} from './shipping-rates';
export {
  CHILE_REGIONES_DPA,
  CHILE_COMUNAS_POR_REGION,
  getComunasPorRegion,
  getRegionDeComuna,
  getCentroideRegion,
  isChileRegion,
  type ChileRegionInfo,
} from './chile-dpa';