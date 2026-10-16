import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSignUp = vi.fn();

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: mockSignUp,
    },
  })),
}));

vi.mock('@/utils/supabase/admin', () => ({
  createAdminClient: vi.fn(() => null),
}));

vi.mock('@/lib/api-guard', () => ({
  guardMutation: vi.fn(() => null),
}));

vi.mock('@/lib/ratelimit', () => ({
  createRateLimiter: vi.fn(() => () => ({ success: true, remaining: 5, resetTime: Date.now() + 60000 })),
  getClientIdentifier: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/shop/nucleo-url', () => ({
  getNucleoApiUrl: vi.fn(() => null),
}));

import { POST } from './route';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects incomplete fields', async () => {
    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/campos/i);
  });

  it('handles existing user with empty identities', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {
        user: { id: 'usr-1', identities: [] },
        session: null,
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'Password123!', fullName: 'Test User' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/ya existe/i);
  });

  it('succeeds when confirmation is required (session null)', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {
        user: { id: 'usr-2', identities: [{ identity_id: 'ident-1' }] },
        session: null,
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', password: 'Password123!', fullName: 'New User' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.requiresEmailConfirmation).toBe(true);
  });

  it('succeeds with defensive root payload extraction if authData.user is at root', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {
        id: 'usr-3',
        identities: [{ identity_id: 'ident-2' }],
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'root@example.com', password: 'Password123!', fullName: 'Root User' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.requiresEmailConfirmation).toBe(true);
  });

  it('preserves safe returnTo in emailRedirectTo', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {
        user: { id: 'usr-4', identities: [{ identity_id: 'ident-4' }] },
        session: null,
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'checkout@example.com',
        password: 'Password123!',
        fullName: 'Checkout User',
        returnTo: '/checkout',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'checkout@example.com',
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining('next=%2Fcheckout'),
        }),
      }),
    );
  });

  it('rejects invalid birthDate values', async () => {
    for (const birthDate of ['mañana', '1990-13-40', '1990-02-30', '2999-01-01', '1899-12-31']) {
      const req = new NextRequest('http://localhost:3001/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@example.com', password: 'Password123!', fullName: 'A B', birthDate }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/cumpleaños/i);
    }
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('forwards valid birthDate to signUp metadata', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {
        user: { id: 'usr-5', identities: [{ identity_id: 'ident-5' }] },
        session: null,
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'cumple@example.com',
        password: 'Password123!',
        fullName: 'Cumple User',
        birthDate: '1990-05-17',
      }),
    });
    const res = await POST(req);
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({ birth_date: '1990-05-17' }),
        }),
      }),
    );
  });

  it('rejects registration when termsAccepted is explicitly false', async () => {
    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'terms@example.com',
        password: 'Password123!',
        fullName: 'Terms User',
        termsAccepted: false,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/términos/i);
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('records consent metadata and marketingOptIn in signUp options.data', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {
        user: { id: 'usr-consent', identities: [{ identity_id: 'ident-consent' }] },
        session: null,
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'consent@example.com',
        password: 'Password123!',
        fullName: 'Consent User',
        termsAccepted: true,
        marketingOptIn: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: expect.objectContaining({
            terms_accepted: true,
            terms_version: '2026-v1',
            privacy_accepted: true,
            privacy_version: '2026-v1',
            is_adult_confirmed: true,
            marketing_opt_in: true,
          }),
        }),
      }),
    );
  });
});
