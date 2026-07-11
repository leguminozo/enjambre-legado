import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

const mockFrom = vi.fn();
const mockRevalidate = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/revalidate-tienda', () => ({
  revalidateTiendaCms: () => mockRevalidate(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, _key: string, options?: { global?: { headers?: { Authorization?: string } } }) => {
    const authHeader = options?.global?.headers?.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    return {
      auth: {
        getUser: async () => {
          if (token === 'valid-token' || token === 'admin-token') {
            return {
              data: {
                user: {
                  id: 'user-cms-1',
                  email: 'admin@test.com',
                  app_metadata: { role: 'admin' },
                },
              },
              error: null,
            };
          }
          return { data: { user: null }, error: new Error('Invalid token') };
        },
      },
      from: (...args: unknown[]) => mockFrom(...args),
    } as any;
  },
}));

function makeChain(finalValue: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  const ret = () => chain;
  chain.select = vi.fn(ret);
  chain.insert = vi.fn(ret);
  chain.update = vi.fn(ret);
  chain.delete = vi.fn(ret);
  chain.eq = vi.fn(ret);
  chain.order = vi.fn(ret);
  chain.single = vi.fn().mockResolvedValue(finalValue);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalValue);
  // thenable for await supabase.from().select()... without single
  chain.then = (onfulfilled: (v: typeof finalValue) => unknown) =>
    Promise.resolve(finalValue).then(onfulfilled);
  return chain;
}

const authHeaders = {
  Authorization: 'Bearer valid-token',
  'Content-Type': 'application/json',
  origin: 'http://localhost:3000',
  'x-empresa-id': 'emp-1',
};

describe('CMS API Routes', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    mockFrom.mockReset();
    mockRevalidate.mockClear();
    mockRevalidate.mockResolvedValue(undefined);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({
          data: [{ empresa_id: 'emp-1', rol: 'admin' }],
          error: null,
        });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      return makeChain({ data: null, error: null });
    });
  });

  it('GET /api/cms/sections → 401 sin token', async () => {
    const res = await app.request('/api/cms/sections');
    expect(res.status).toBe(401);
  });

  it('GET /api/cms/sections → 200 agrupado', async () => {
    const rows = [
      {
        id: '1',
        section_key: 'brand_assets',
        item_order: 1,
        content: { logo_url: 'https://x/logo.png' },
        is_active: true,
      },
      {
        id: '2',
        section_key: 'menu_settings',
        item_order: 1,
        content: { show_logo: true },
        is_active: true,
      },
    ];
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        return makeChain({ data: rows, error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/sections', { headers: authHeaders });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.brand_assets).toHaveLength(1);
    expect(json.data.menu_settings).toHaveLength(1);
    expect(json.sections).toContain('brand_assets');
  });

  it('GET /api/cms/sections/:key → 400 sección inválida', async () => {
    const res = await app.request('/api/cms/sections/no_existe', { headers: authHeaders });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe('invalid_section');
  });

  it('GET /api/cms/sections/brand_assets → 200', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        return makeChain({
          data: [{ id: 'b1', section_key: 'brand_assets', content: { logo_url: '' } }],
          error: null,
        });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/sections/brand_assets', { headers: authHeaders });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data[0].id).toBe('b1');
  });

  it('POST /api/cms/items → 201 y revalidate tienda', async () => {
    const created = {
      id: 'new-1',
      section_key: 'brand_assets',
      item_order: 0,
      content: { logo_url: 'https://cdn/logo.png', logo_height_px: 40 },
      is_active: true,
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        return makeChain({ data: created, error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        section_key: 'brand_assets',
        content: { logo_url: 'https://cdn/logo.png', logo_height_px: 40 },
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe('new-1');
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('POST /api/cms/items → 400 si insert falla', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        return makeChain({ data: null, error: { message: 'rls denied' } });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        section_key: 'hero',
        content: { title: 'x' },
      }),
    });
    expect(res.status).toBe(400);
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('PATCH /api/cms/items/:id → 200 y revalidate', async () => {
    const updated = {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      content: { logo_url: 'https://cdn/new.png', logo_height_px: 48 },
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        return makeChain({ data: updated, error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/items/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        content: { logo_url: 'https://cdn/new.png', logo_height_px: 48 },
      }),
    });

    expect(res.status).toBe(200);
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('DELETE /api/cms/items/:id → 200 y revalidate', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        return makeChain({ data: { deleted: true }, error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/items/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', {
      method: 'DELETE',
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.deleted).toBe(true);
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });
});
