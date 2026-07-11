import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
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
  return new NextRequest('http://localhost/api/cms/revalidate', init);
}

describe('POST /api/cms/revalidate', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    process.env = { ...envSnapshot };
    revalidatePath.mockClear();
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('401 si secret configurado y no coincide', async () => {
    process.env.CMS_REVALIDATE_SECRET = 'expected';
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({ auth: 'Bearer wrong' }));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('503 en production sin secret configurado', async () => {
    delete process.env.CMS_REVALIDATE_SECRET;
    delete process.env.INTERNAL_API_SECRET;
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({ body: {} }));
    expect(res.status).toBe(503);
  });

  it('200 con Bearer correcto e invalida paths', async () => {
    process.env.CMS_REVALIDATE_SECRET = 'ok-secret';
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({ auth: 'Bearer ok-secret' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.revalidated).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/catalogo');
  });

  it('acepta x-revalidate-secret e INTERNAL_API_SECRET', async () => {
    delete process.env.CMS_REVALIDATE_SECRET;
    process.env.INTERNAL_API_SECRET = 'internal-sec';
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({ headerSecret: 'internal-sec' }));
    expect(res.status).toBe(200);
  });

  it('acepta secret en body', async () => {
    process.env.CMS_REVALIDATE_SECRET = 'body-sec';
    vi.stubEnv('NODE_ENV', 'production');
    const res = await POST(req({ body: { secret: 'body-sec' } }));
    expect(res.status).toBe(200);
  });

  it('en development sin secret permite revalidate', async () => {
    delete process.env.CMS_REVALIDATE_SECRET;
    delete process.env.INTERNAL_API_SECRET;
    vi.stubEnv('NODE_ENV', 'development');
    const res = await POST(req({ body: {} }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalled();
  });
});

