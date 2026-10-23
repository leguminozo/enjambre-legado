import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHECKOUT_ATTEMPT_STORAGE_KEY,
  buildCheckoutAttemptFingerprint,
  resolveCheckoutAttemptKey,
  type CheckoutAttemptFingerprintInput,
} from './checkout-attempt';

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

const baseInput: CheckoutAttemptFingerprintInput = {
  lines: [
    { productId: 'p1', quantity: 2, unitPrice: 5000 },
    { productId: 'p2', quantity: 1, unitPrice: 9000 },
  ],
  email: 'Buyer@Example.com',
  direccion: 'Calle 1',
  comuna: 'Providencia',
  buyerMode: 'legado',
  courierCode: 'blueexpress',
  puntosACanjear: 0,
  retornoFrascosDeclarados: 0,
};

describe('buildCheckoutAttemptFingerprint', () => {
  it('es estable ante orden de líneas distinto y casing de email', () => {
    const a = buildCheckoutAttemptFingerprint(baseInput);
    const b = buildCheckoutAttemptFingerprint({
      ...baseInput,
      lines: [...baseInput.lines].reverse(),
      email: 'buyer@example.com',
      direccion: 'calle 1',
    });
    expect(a).toBe(b);
  });

  it('cambia si cambia cantidad, descuento o dirección', () => {
    const base = buildCheckoutAttemptFingerprint(baseInput);
    expect(
      buildCheckoutAttemptFingerprint({
        ...baseInput,
        lines: [{ productId: 'p1', quantity: 3, unitPrice: 5000 }],
      }),
    ).not.toBe(base);
    expect(
      buildCheckoutAttemptFingerprint({ ...baseInput, codigoDescuento: 'ULMO10' }),
    ).not.toBe(base);
    expect(
      buildCheckoutAttemptFingerprint({ ...baseInput, direccion: 'Otra dirección 2' }),
    ).not.toBe(base);
  });
});

describe('resolveCheckoutAttemptKey', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', makeStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reutiliza la clave mientras la huella no cambie (reintentos)', () => {
    const k1 = resolveCheckoutAttemptKey('fp-1');
    const k2 = resolveCheckoutAttemptKey('fp-1');
    expect(k2).toBe(k1);
  });

  it('genera clave nueva si la huella cambia (carrito distinto)', () => {
    const k1 = resolveCheckoutAttemptKey('fp-1');
    const k2 = resolveCheckoutAttemptKey('fp-2');
    expect(k2).not.toBe(k1);
  });

  it('storage corrupto → clave nueva sin lanzar', () => {
    sessionStorage.setItem(CHECKOUT_ATTEMPT_STORAGE_KEY, '{no-json');
    const key = resolveCheckoutAttemptKey('fp-1');
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThanOrEqual(8);
  });
});
