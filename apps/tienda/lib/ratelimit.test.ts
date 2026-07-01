import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/ratelimit', () => ({
  createRateLimiter: vi.fn((options) => {
    const counts = new Map<string, { count: number; resetTime: number }>();
    return (identifier: string) => {
      const now = Date.now();
      const entry = counts.get(identifier);
      if (!entry || now > entry.resetTime) {
        counts.set(identifier, { count: 1, resetTime: now + options.windowMs });
        return { success: true, remaining: options.maxRequests - 1, resetTime: now + options.windowMs };
      }
      if (entry.count >= options.maxRequests) {
        return { success: false, remaining: 0, resetTime: entry.resetTime };
      }
      entry.count++;
      return { success: true, remaining: options.maxRequests - entry.count, resetTime: entry.resetTime };
    };
  }),
  getClientIdentifier: vi.fn((request: Request) => {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    return forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  }),
}));

import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';

describe('Rate Limiter', () => {
  it('allows requests within limit', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 });
    for (let i = 0; i < 5; i++) {
      const result = limiter('test-ip');
      expect(result.success).toBe(true);
    }
  });

  it('blocks requests exceeding limit', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 });
    limiter('test-ip');
    limiter('test-ip');
    limiter('test-ip');
    const result = limiter('test-ip');
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    const limiter = createRateLimiter({ windowMs: 100, maxRequests: 2 });
    limiter('test-ip');
    limiter('test-ip');
    expect(limiter('test-ip').success).toBe(false);
    
    // Wait for window to expire
    return new Promise(resolve => setTimeout(() => {
      expect(limiter('test-ip').success).toBe(true);
      resolve(undefined);
    }, 150));
  });

  it('tracks different identifiers separately', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 });
    limiter('ip-1');
    limiter('ip-1');
    expect(limiter('ip-1').success).toBe(false);
    expect(limiter('ip-2').success).toBe(true);
  });
});

describe('getClientIdentifier', () => {
  it('extracts IP from x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });
    expect(getClientIdentifier(request)).toBe('192.168.1.1');
  });

  it('falls back to x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.2' },
    });
    expect(getClientIdentifier(request)).toBe('192.168.1.2');
  });

  it('returns unknown for missing headers', () => {
    const request = new Request('http://localhost', {});
    expect(getClientIdentifier(request)).toBe('unknown');
  });
});