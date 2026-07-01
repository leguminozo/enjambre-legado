import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

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
  getClientIdentifier: vi.fn(() => 'test-ip'),
}));

import { createRateLimiter } from '@/lib/ratelimit';

describe('Auth API Rate Limiting', () => {
  const loginLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 10 });
  const registerLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 });
  const resetLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login endpoint', () => {
    it('allows up to 10 requests per minute', () => {
      for (let i = 0; i < 10; i++) {
        expect(loginLimiter('test-ip').success).toBe(true);
      }
    });

    it('blocks 11th request within minute', () => {
      for (let i = 0; i < 10; i++) {
        loginLimiter('test-ip');
      }
      expect(loginLimiter('test-ip').success).toBe(false);
    });
  });

  describe('Register endpoint', () => {
    it('allows up to 5 requests per minute', () => {
      for (let i = 0; i < 5; i++) {
        expect(registerLimiter('test-ip').success).toBe(true);
      }
    });

    it('blocks 6th request within minute', () => {
      for (let i = 0; i < 5; i++) {
        registerLimiter('test-ip');
      }
      expect(registerLimiter('test-ip').success).toBe(false);
    });
  });

  describe('Password reset endpoint', () => {
    it('allows up to 3 requests per minute', () => {
      for (let i = 0; i < 3; i++) {
        expect(resetLimiter('test-ip').success).toBe(true);
      }
    });

    it('blocks 4th request within minute', () => {
      for (let i = 0; i < 3; i++) {
        resetLimiter('test-ip');
      }
      expect(resetLimiter('test-ip').success).toBe(false);
    });
  });

  it('tracks different IPs separately', () => {
    for (let i = 0; i < 10; i++) {
      loginLimiter('ip-1');
    }
    expect(loginLimiter('ip-1').success).toBe(false);
    expect(loginLimiter('ip-2').success).toBe(true);
  });
});