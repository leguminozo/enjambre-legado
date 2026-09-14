import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
const revalidateTag = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

import { POST } from './route';
import { NextRequest } from 'next/server';

function req(opts?: {
  auth?: string;
  headerSecret?: string;
  body?: unknown;
}): NextRequest {
  const headers = new Headers();
  if (opts?.auth) headers.set('authorization', opts.auth);
  if (opts?.headerSecret) headers.set('x-revalidate-secret', opts.headerSecret);
  const init: ConstructorParameters<typeof NextRequest>[1] = { method: 'POST', headers };
  if (opts?.body !== undefined) {
    init!.body = JSON.stringify(opts.body);
    headers.set('content-type', 'application/json');
  }
  return new NextRequest('http://localhost/api/revalidate', init);
}

describe('POST /api/revalidate', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env = { ...envSnapshot };
    revalidatePath.mockClear();
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('401 si secret configurado y token no coincide', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-key';
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({ auth: 'Bearer wrong-key' }));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('503 en production si no hay secretos configurados', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.INTERNAL_API_SECRET;
    delete process.env.CMS_REVALIDATE_SECRET;
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({ body: {} }));
    expect(res.status).toBe(503);
  });

  it('200 con Bearer SUPABASE_SERVICE_ROLE_KEY e invalida layout por defecto', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-123';
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({
      auth: 'Bearer service-role-123',
      body: { path: '/', type: 'layout' },
    }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/catalogo');
  });

  it('200 con Bearer INTERNAL_API_SECRET para un path específico', async () => {
    process.env.INTERNAL_API_SECRET = 'internal-secret-456';
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({
      auth: 'Bearer internal-secret-456',
      body: { path: '/catalogo', type: 'page' },
    }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith('/catalogo');
  });

  it('200 en dev sin secret configurado', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.INTERNAL_API_SECRET;
    delete process.env.CMS_REVALIDATE_SECRET;
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(req({ body: { path: '/', type: 'layout' } }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});
