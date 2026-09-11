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
});
