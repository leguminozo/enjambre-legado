import { describe, expect, it } from 'vitest';
import {
  isChileRegion,
  getComunasPorRegion,
  getCiudadesPorRegion,
  getSugerenciaCiudad,
  getRegionDeComuna,
} from '@enjambre/logistica';
import {
  isCheckoutShippingReady,
  shouldBlockCheckoutPayment,
  friendlyCheckoutApiMessage,
  isCheckoutConfigError,
} from './checkout-errors';
import {
  SHIPPING_REGION_STORAGE_KEY,
  isStaleLocalCart,
  parseCartStorage,
  serializeCartStorage,
} from './commerce-storage';
import { mergeCartQuantities } from '@/lib/cart/merge-lines';
import {
  maxRedeemablePoints,
  loyaltyDiscountFromPoints,
  DEFAULT_LOYALTY_REDEMPTION,
} from '@enjambre/pricing';

describe('Puente Carrito ↔ Pago Seguro (Integración y Casos de Error)', () => {
  describe('1. Persistencia y Validación de Región de Despacho', () => {
    it('reconoce regiones oficiales de Chile y rechaza entradas no válidas', () => {
      expect(isChileRegion('Los Lagos')).toBe(true);
      expect(isChileRegion('Metropolitana')).toBe(true);
      expect(isChileRegion('Aysén')).toBe(true);
      expect(isChileRegion('Magallanes')).toBe(true);

      expect(isChileRegion('Buenos Aires')).toBe(false);
      expect(isChileRegion('')).toBe(false);
      expect(isChileRegion(null)).toBe(false);
      expect(isChileRegion(undefined)).toBe(false);
      expect(isChileRegion('Región Inexistente')).toBe(false);
    });

    it('la clave de almacenamiento es canónica y estable', () => {
      expect(SHIPPING_REGION_STORAGE_KEY).toBe('oyz_shipping_region');
    });

    it('maneja almacenamiento corrupto en cart storage de forma segura sin lanzar error', () => {
      expect(parseCartStorage(null)).toEqual({ lines: [], updatedAt: 0 });
      expect(parseCartStorage('')).toEqual({ lines: [], updatedAt: 0 });
      expect(parseCartStorage('{malformed-json')).toEqual({ lines: [], updatedAt: 0 });
      expect(parseCartStorage('12345')).toEqual({ lines: [], updatedAt: 0 });
    });
  });

  describe('2. Autocompletado y Sugerencias de Ciudad (Comuna → Ciudad)', () => {
    it('comunas urbanas de Santiago sugieren automáticamente "Santiago"', () => {
      expect(getSugerenciaCiudad('Providencia', 'Metropolitana')).toBe('Santiago');
      expect(getSugerenciaCiudad('Las Condes', 'Metropolitana')).toBe('Santiago');
      expect(getSugerenciaCiudad('Ñuñoa', 'Metropolitana')).toBe('Santiago');
      expect(getSugerenciaCiudad('Santiago', 'Metropolitana')).toBe('Santiago');
      expect(getSugerenciaCiudad('Maipú', 'Metropolitana')).toBe('Santiago');
      expect(getSugerenciaCiudad('Puente Alto', 'Metropolitana')).toBe('Santiago');
    });

    it('ciudades satélites de la Región Metropolitana conservan su identidad urbana', () => {
      expect(getSugerenciaCiudad('Melipilla', 'Metropolitana')).toBe('Melipilla');
      expect(getSugerenciaCiudad('Colina', 'Metropolitana')).toBe('Colina');
      expect(getSugerenciaCiudad('Talagante', 'Metropolitana')).toBe('Talagante');
      expect(getSugerenciaCiudad('Buin', 'Metropolitana')).toBe('Buin');
      expect(getSugerenciaCiudad('Paine', 'Metropolitana')).toBe('Paine');
    });

    it('en regiones fuera de RM, la comuna corresponde a la ciudad/centro urbano', () => {
      expect(getSugerenciaCiudad('Castro', 'Los Lagos')).toBe('Castro');
      expect(getSugerenciaCiudad('Ancud', 'Los Lagos')).toBe('Ancud');
      expect(getSugerenciaCiudad('Puerto Varas', 'Los Lagos')).toBe('Puerto Varas');
      expect(getSugerenciaCiudad('Osorno', 'Los Lagos')).toBe('Osorno');
      expect(getSugerenciaCiudad('Viña del Mar', 'Valparaíso')).toBe('Viña del Mar');
      expect(getSugerenciaCiudad('Concepción', 'Biobío')).toBe('Concepción');
    });

    it('infiere la región correctamente si no se proporciona el argumento', () => {
      expect(getSugerenciaCiudad('Castro')).toBe('Castro');
      expect(getSugerenciaCiudad('Providencia')).toBe('Santiago');
    });

    it('retorna string vacío si la comuna es nula o vacía sin fallar', () => {
      expect(getSugerenciaCiudad('')).toBe('');
      expect(getSugerenciaCiudad('   ')).toBe('');
      expect(getSugerenciaCiudad(null)).toBe('');
      expect(getSugerenciaCiudad(undefined)).toBe('');
    });

    it('despliega ciudades para datalist por región', () => {
      const ciudadesLagos = getCiudadesPorRegion('Los Lagos');
      expect(ciudadesLagos).toContain('Castro');
      expect(ciudadesLagos).toContain('Puerto Montt');
      expect(ciudadesLagos.length).toBeGreaterThan(5);

      const ciudadesRm = getCiudadesPorRegion('Metropolitana');
      expect(ciudadesRm).toContain('Santiago');
      expect(ciudadesRm).toContain('Melipilla');

      expect(getCiudadesPorRegion('')).toEqual([]);
      expect(getCiudadesPorRegion(null)).toEqual([]);
    });
  });

  describe('3. Validación Estricta del Formulario de Envío (isCheckoutShippingReady)', () => {
    const validShipping = {
      nombre: 'Catalina Pérez',
      email: 'catalina@enjambrelegado.cl',
      telefono: '+56912345678',
      direccion: 'Ruta 5 Sur km 8560',
      comuna: 'Castro',
      ciudad: 'Castro',
      region: 'Los Lagos',
    };

    it('aprueba un formulario completo con todos los datos correctos', () => {
      expect(isCheckoutShippingReady(validShipping)).toBe(true);
    });

    it('rechaza si falta el nombre o es muy corto', () => {
      expect(isCheckoutShippingReady({ ...validShipping, nombre: '' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, nombre: 'A' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, nombre: '   ' })).toBe(false);
    });

    it('rechaza emails con formato inválido', () => {
      expect(isCheckoutShippingReady({ ...validShipping, email: '' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, email: 'catalina' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, email: 'catalina@' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, email: '@enjambre.cl' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, email: 'catalina@enjambre' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, email: 'catalina enjambre@cl' })).toBe(false);
    });

    it('rechaza teléfonos con menos de 8 caracteres', () => {
      expect(isCheckoutShippingReady({ ...validShipping, telefono: '' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, telefono: '1234567' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, telefono: '+5691234' })).toBe(true); // 8 chars
    });

    it('rechaza direcciones con menos de 5 caracteres', () => {
      expect(isCheckoutShippingReady({ ...validShipping, direccion: '' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, direccion: 'Casa' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, direccion: 'Calle 1' })).toBe(true);
    });

    it('rechaza si comuna, ciudad o región están vacías', () => {
      expect(isCheckoutShippingReady({ ...validShipping, comuna: '' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, ciudad: '' })).toBe(false);
      expect(isCheckoutShippingReady({ ...validShipping, region: '' })).toBe(false);
    });
  });

  describe('4. Reglas de Bloqueo del Botón de Pago (shouldBlockCheckoutPayment)', () => {
    const validQuote = {
      subtotal: 22990,
      total: 28890,
      shippingCost: 5900,
      discountClp: 0,
      loyaltyDiscountClp: 0,
    };

    it('bloquea si la región no está seleccionada', () => {
      expect(
        shouldBlockCheckoutPayment('', {
          quoteLoading: false,
          quote: validQuote,
          quoteError: null,
        }),
      ).toBe(true);
    });

    it('bloquea mientras se está cotizando el envío (quoteLoading)', () => {
      expect(
        shouldBlockCheckoutPayment('Los Lagos', {
          quoteLoading: true,
          quote: validQuote,
          quoteError: null,
        }),
      ).toBe(true);
    });

    it('bloquea si la cotización arrojó un error', () => {
      expect(
        shouldBlockCheckoutPayment('Los Lagos', {
          quoteLoading: false,
          quote: null,
          quoteError: 'El operador de despacho no cubre esta zona',
        }),
      ).toBe(true);
    });

    it('habilita el pago únicamente con región válida, sin error y cotización resuelta', () => {
      expect(
        shouldBlockCheckoutPayment('Los Lagos', {
          quoteLoading: false,
          quote: validQuote,
          quoteError: null,
        }),
      ).toBe(false);
    });
  });

  describe('5. Sincronización y Fusión de Carrito (Merge sin pérdida de productos)', () => {
    it('funde productos duplicados usando la cantidad máxima para evitar duplicaciones por recarga', () => {
      const merged = mergeCartQuantities(
        [{ product_id: 'prod-miel-1', quantity: 2 }],
        [{ product_id: 'prod-miel-1', quantity: 1 }],
      );
      expect(merged).toEqual([{ product_id: 'prod-miel-1', quantity: 2 }]);
    });

    it('es idempotente ante recargas sucesivas de la página', () => {
      const local = [{ product_id: 'prod-miel-1', quantity: 1 }];
      const remote = [{ product_id: 'prod-miel-1', quantity: 1 }];
      const step1 = mergeCartQuantities(local, remote);
      const step2 = mergeCartQuantities(step1, remote);
      expect(step1).toEqual([{ product_id: 'prod-miel-1', quantity: 1 }]);
      expect(step2).toEqual([{ product_id: 'prod-miel-1', quantity: 1 }]);
    });

    it('mantiene productos distintos de ambos carritos (local + remoto)', () => {
      const merged = mergeCartQuantities(
        [{ product_id: 'prod-miel-1', quantity: 1 }],
        [{ product_id: 'prod-crema-2', quantity: 2 }],
      );
      expect(merged).toHaveLength(2);
      expect(merged.find((i) => i.product_id === 'prod-miel-1')?.quantity).toBe(1);
      expect(merged.find((i) => i.product_id === 'prod-crema-2')?.quantity).toBe(2);
    });

    it('si el remoto está vacío, no se descarta el carrito local bajo ninguna circunstancia', () => {
      const local = [{ product_id: 'prod-miel-1', quantity: 1 }];
      const remote: Array<{ product_id: string; quantity: number }> = [];

      // Simulación de la regla corregida en cart-sync
      const shouldDiscard = remote.length > 0 && isStaleLocalCart(100, '2026-10-22T12:00:00Z');
      expect(shouldDiscard).toBe(false);

      const result = shouldDiscard ? remote : mergeCartQuantities(local, remote);
      expect(result).toHaveLength(1);
      expect(result[0].product_id).toBe('prod-miel-1');
    });
  });

  describe('6. Fidelización y Billetera (Puntos Legado y Canje Seguro)', () => {
    it('usuario sin puntos no genera descuento ni permite canje', () => {
      expect(maxRedeemablePoints(0, 22990, DEFAULT_LOYALTY_REDEMPTION)).toBe(0);
      expect(loyaltyDiscountFromPoints(0, DEFAULT_LOYALTY_REDEMPTION)).toBe(0);
    });

    it('calcula bloques de canje de forma exacta según configuración', () => {
      // 100 puntos = $1.000 de descuento
      expect(loyaltyDiscountFromPoints(100, DEFAULT_LOYALTY_REDEMPTION)).toBe(1000);
      expect(loyaltyDiscountFromPoints(250, DEFAULT_LOYALTY_REDEMPTION)).toBe(2000); // 2 bloques completos
      expect(loyaltyDiscountFromPoints(500, DEFAULT_LOYALTY_REDEMPTION)).toBe(5000);
    });

    it('el canje nunca excede el total de la compra disponible (mantiene mínimo $1 CLP para DTE / pasarela)', () => {
      // 5.000 puntos valdrían $50.000, pero la compra es de $15.000
      // maxDiscountClp = 14.999 -> 14 bloques de $1.000 = 1.400 puntos ($14.000)
      const maxPts = maxRedeemablePoints(5000, 15000, DEFAULT_LOYALTY_REDEMPTION);
      expect(maxPts).toBe(1400);
      expect(loyaltyDiscountFromPoints(maxPts, DEFAULT_LOYALTY_REDEMPTION)).toBe(14000);
    });
  });

  describe('7. Sanitización de Errores y Cero Filtraciones Técnicas (Zero Tech Leaks)', () => {
    it('errores de base de datos Postgres/PostgREST se traducen a lenguaje amigable de negocio', () => {
      expect(
        friendlyCheckoutApiMessage('PGRST116', 'JSON object requested, multiple (or no) rows returned', 'quote'),
      ).toBe('No pudimos calcular envío y descuentos. Revisa la región e intenta de nuevo.');

      expect(
        friendlyCheckoutApiMessage('42P01', 'relation "carrito_items" does not exist', 'quote'),
      ).toBe('No pudimos calcular envío y descuentos. Revisa la región e intenta de nuevo.');

      expect(
        friendlyCheckoutApiMessage('23503', 'insert or update on table "ventas" violates foreign key constraint', 'init'),
      ).toBe('No se pudo iniciar el pago. Intenta de nuevo en unos minutos.');
    });

    it('errores de sesión y CSRF se comunican claramente', () => {
      expect(
        friendlyCheckoutApiMessage('forbidden', 'CSRF: Origin not allowed', 'init'),
      ).toContain('Sesión interrumpida');
    });

    it('errores de cupón o promoción orientan al comprador', () => {
      expect(
        friendlyCheckoutApiMessage('quote_failed', 'Código de descuento inválido', 'quote'),
      ).toContain('código promocional no es válido');
    });

    it('detecta errores de configuración de backend para advertir al operador', () => {
      expect(isCheckoutConfigError('quote_failed', 'Missing Supabase credentials for admin client')).toBe(true);
      expect(isCheckoutConfigError('init_failed', 'Faltan credenciales Flow_API_KEY')).toBe(true);
      expect(isCheckoutConfigError('quote_failed', 'Código no existe')).toBe(false);
    });
  });
});
