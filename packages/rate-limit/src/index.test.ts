import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupRateLimitMap,
  createRateLimiter,
  getClientIdentifier,
  getIdentifierFromRequest,
  rateLimit,
} from './index';

describe('createRateLimiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rateLimit es alias de createRateLimiter', () => {
    expect(rateLimit).toBe(createRateLimiter);
  });

  it('permite hasta maxRequests y luego bloquea', () => {
    const limit = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const id = `login-${Math.random()}`;
    expect(limit(id).success).toBe(true);
    expect(limit(id).remaining).toBe(0);
    const blocked = limit(id);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('no comparte cupo entre políticas distintas (login vs CMS)', () => {
    const login = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const cms = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });
    const ip = `nat-${Math.random()}`;
    expect(login(ip).success).toBe(true);
    expect(login(ip).success).toBe(true);
    expect(login(ip).success).toBe(false);
    expect(cms(ip).success).toBe(true);
  });

  it('reinicia la ventana al expirar', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));
    const limit = createRateLimiter({ windowMs: 1_000, maxRequests: 1 });
    const id = `win-${Math.random()}`;
    expect(limit(id).success).toBe(true);
    expect(limit(id).success).toBe(false);
    vi.setSystemTime(new Date('2026-09-15T12:00:02Z'));
    expect(limit(id).success).toBe(true);
  });

  it('cleanupRateLimitMap borra entradas vencidas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));
    const limit = createRateLimiter({ windowMs: 500, maxRequests: 1 });
    const id = `gc-${Math.random()}`;
    expect(limit(id).success).toBe(true);
    vi.setSystemTime(new Date('2026-09-15T12:00:02Z'));
    cleanupRateLimitMap();
    expect(limit(id).success).toBe(true);
  });
});

describe('identificadores', () => {
  it('getClientIdentifier usa el primer hop de x-forwarded-for', () => {
    const req = new Request('https://tienda.example/login', {
      headers: { 'x-forwarded-for': '  1.1.1.1, 2.2.2.2' },
    });
    expect(getClientIdentifier(req)).toBe('1.1.1.1');
  });

  it('getClientIdentifier cae a x-real-ip y luego unknown', () => {
    const real = new Request('https://tienda.example/login', {
      headers: { 'x-real-ip': '9.9.9.9' },
    });
    expect(getClientIdentifier(real)).toBe('9.9.9.9');
    expect(getClientIdentifier(new Request('https://tienda.example/login'))).toBe('unknown');
  });

  it('getIdentifierFromRequest aísla NAT con el prefijo de Authorization', () => {
    const withAuth = {
      req: {
        header: (name: string) =>
          name === 'x-forwarded-for' ? '10.0.0.1' : name === 'authorization' ? 'Bearer abcdefghijklmnop' : undefined,
      },
    };
    const without = {
      req: {
        header: (name: string) => (name === 'x-real-ip' ? '10.0.0.1' : undefined),
      },
    };
    expect(getIdentifierFromRequest(withAuth)).toBe('10.0.0.1:Bearer abc');
    expect(getIdentifierFromRequest(without)).toBe('10.0.0.1');
  });
});
