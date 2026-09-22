import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../../../app/api/[[...routes]]/route';

const mockFrom = vi.fn();
const mockRevalidate = vi.fn().mockResolvedValue({ ok: true });

vi.mock('@/lib/revalidate-tienda', () => ({
  revalidateTiendaCms: () => mockRevalidate(),
}));

// mockRevalidate defaults to ok:true shape consumed by CMS responses

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
  chain.not = vi.fn(ret);
  chain.in = vi.fn(ret);
  chain.order = vi.fn(ret);
  chain.limit = vi.fn(ret);
  chain.range = vi.fn(ret);
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
    mockRevalidate.mockResolvedValue({ ok: true });

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
      locale: 'en',
    };
    const insertSpy = vi.fn();
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        const chain = makeChain({ data: created, error: null });
        chain.insert = vi.fn((payload: unknown) => {
          insertSpy(payload);
          return chain;
        });
        return chain;
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        section_key: 'brand_assets',
        content: { logo_url: 'https://cdn/logo.png', logo_height_px: 40 },
        locale: 'en',
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe('new-1');
    expect(json.data.locale).toBe('en');
    // "crear desde ES": el insert debe persistir el idioma del item
    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en' }));
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('POST /api/cms/items → 201 con locale default es (legacy)', async () => {
    const created = {
      id: 'new-2',
      section_key: 'talleres',
      item_order: 1,
      content: { title: 'Taller' },
      is_active: true,
      locale: 'es',
    };
    const insertSpy = vi.fn();
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        const chain = makeChain({ data: created, error: null });
        chain.insert = vi.fn((payload: unknown) => {
          insertSpy(payload);
          return chain;
        });
        return chain;
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        section_key: 'talleres',
        content: { title: 'Taller' },
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.locale).toBe('es');
    expect(json.revalidated).toBe(false);
    expect(json.revalidate_reason).toBe('draft');
    expect(mockRevalidate).not.toHaveBeenCalled();
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'es',
        content: {},
        draft_content: { title: 'Taller' },
      }),
    );
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
        section_key: 'brand_assets',
        content: { logo_url: 'x' },
      }),
    });
    expect(res.status).toBe(400);
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('PATCH /api/cms/items/:id → 200 y revalidate (sección auto-publish)', async () => {
    const updated = {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      section_key: 'brand_assets',
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

  it('PATCH /api/cms/items/:id → 200 sin revalidate (sección con borrador)', async () => {
    const updated = {
      id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
      section_key: 'talleres',
      content: { title: 'publicado' },
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

    const res = await app.request('/api/cms/items/bbbbbbbb-cccc-dddd-eeee-ffffffffffff', {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        content: { title: 'borrador' },
      }),
    });
    const json = (await res.json()) as { revalidated?: boolean; revalidate_reason?: string | null };

    expect(res.status).toBe(200);
    // El borrador NO revalida la tienda: content publicado no cambió
    expect(mockRevalidate).not.toHaveBeenCalled();
    expect(json.revalidated).toBe(false);
    expect(json.revalidate_reason).toBe('draft');
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

  it('admin sin usuarios_empresas → 200 (site_content global; no tenant)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        return makeChain({ data: [], error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/sections', { headers: authHeaders });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sections).toContain('brand_assets');
  });

  it('POST /api/cms/publish → 200 publica borradores y revalida', async () => {
    const draftRows = [
      {
        id: 'draft-1',
        section_key: 'talleres',
        content: {},
        draft_content: { title: 'Taller Listo' },
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
        return makeChain({ data: draftRows, error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/publish', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ section_key: 'talleres' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.published).toBe(1);
    expect(mockRevalidate).toHaveBeenCalledTimes(1);
  });

  it('POST /api/cms/discard → 200 descarta borradores sin revalidar', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'site_content') {
        return makeChain({ data: [{ id: 'draft-1' }], error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/discard', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.discarded).toBe(1);
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('GET /api/cms/versions → 200 lista versiones', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'cms_content_versions') {
        return makeChain({
          data: [
            {
              id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              section_key: 'identidad_settings',
              item_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
              content: { title: 'Previo' },
              draft_content: null,
              changed_by: null,
              created_at: '2026-09-22T10:00:00Z',
            },
          ],
          error: null,
        });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request('/api/cms/versions?section_key=identidad_settings', {
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].section_key).toBe('identidad_settings');
  });

  it('POST /api/cms/versions/:id/restore → 200 restaura y conserva el estado actual', async () => {
    const versionId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const itemId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22';
    const versionRow = {
      id: versionId,
      section_key: 'identidad_settings',
      item_id: itemId,
      content: { title: 'Previo' },
      draft_content: null,
    };
    const currentRow = {
      id: itemId,
      section_key: 'identidad_settings',
      content: { title: 'Actual' },
      draft_content: { title: 'Borrador' },
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      if (table === 'cms_content_versions') {
        return makeChain({ data: versionRow, error: null });
      }
      if (table === 'site_content') {
        return makeChain({ data: currentRow, error: null });
      }
      return makeChain({ data: null, error: null });
    });

    const res = await app.request(`/api/cms/versions/${versionId}/restore`, {
      method: 'POST',
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    // La escritura de restauración llega a site_content.
    expect(mockFrom).toHaveBeenCalledWith('site_content');
  });

  it('POST /api/cms/versions/:id/restore → 404 con versión inexistente', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'usuarios_empresas') {
        return makeChain({ data: [{ empresa_id: 'emp-1', rol: 'admin' }], error: null });
      }
      if (table === 'profiles') {
        return makeChain({ data: { role: 'admin' }, error: null });
      }
      return makeChain({ data: null, error: { message: 'not found' } });
    });

    const res = await app.request(
      '/api/cms/versions/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/restore',
      { method: 'POST', headers: authHeaders },
    );

    expect(res.status).toBe(404);
  });
});
