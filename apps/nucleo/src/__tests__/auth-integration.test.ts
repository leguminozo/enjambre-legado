import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isRouteAllowed,
  getRoleRedirectPath,
  LEGACY_ROLE_MAP,
  ROUTE_ROLE_GUARDS,
} from "@enjambre/auth/role-redirect";

function expectedRoleRedirect(origin: string, role: string): string {
  const path = getRoleRedirectPath(role);
  return path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${origin}${path}`;
}

// ─── Mocks ───
let mockSessionUser: any = null;
let mockProfile: any = null;

vi.mock("next/server", async () => {
  return {
    NextResponse: {
      next: vi.fn(({ request }) => {
        const res = {
          cookies: { set: vi.fn() },
          headers: new Headers(),
        };
        return res;
      }),
      redirect: vi.fn((url) => ({
        url,
        status: 302,
        headers: new Headers({ location: url.toString() }),
      })),
    },
  };
});

vi.mock("@supabase/ssr", async () => {
  return {
    createServerClient: vi.fn((url, key, { cookies }) => {
      return {
        auth: {
          getUser: async () => {
            if (mockSessionUser) {
              return { data: { user: mockSessionUser }, error: null };
            }
            return { data: { user: null }, error: null };
          },
        },
      };
    }),
  };
});

vi.mock("@enjambre/auth/browser", async () => {
  return {
    getSupabaseUrl: () => "https://mock.supabase.co",
    getSupabaseKey: () => "eyJmock-key",
    isSupabaseConfigured: () => true,
  };
});

// middleware imports ./supabase — stub env so isSupabaseConfigured() is true
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJmock-key-for-tests";

// Need to import AFTER mocks are set up for createAuthMiddleware
const { createAuthMiddleware } = await import("@enjambre/auth/middleware");

describe("Auth Integration Flow", () => {
  beforeEach(() => {
    mockSessionUser = null;
    mockProfile = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJmock-key-for-tests";
    vi.clearAllMocks();
  });

  // ── 1. Role Redirect Logic ──
  describe("role-redirect.ts", () => {
    it("redirects admin to /ejecutivo", () => {
      expect(getRoleRedirectPath("admin")).toBe("/ejecutivo");
    });

    it("redirects creador to tienda portal path in tienda app", () => {
      expect(getRoleRedirectPath("creador", "tienda")).toBe("/perfil/creador");
    });

    it("redirects creador to external tienda URL in nucleo when configured", () => {
      const path = getRoleRedirectPath("creador");
      if (process.env.NEXT_PUBLIC_URL_TIENDA) {
        const base = process.env.NEXT_PUBLIC_URL_TIENDA.replace(/\/$/, "");
        expect(path).toBe(`${base}/perfil/creador`);
      } else {
        expect(path).toBe("/perfil/creador");
      }
    });

    it("redirects rep_ventas to /pos (Campo, abs URL si NEXT_PUBLIC_URL_CAMPO)", () => {
      const path = getRoleRedirectPath("rep_ventas");
      const campo = process.env.NEXT_PUBLIC_URL_CAMPO?.replace(/\/$/, "");
      if (campo) {
        expect(path).toBe(`${campo}/pos`);
      } else {
        expect(path).toBe("/pos");
      }
    });

    it("redirects cliente to /catalogo (abs URL si NEXT_PUBLIC_URL_TIENDA)", () => {
      const path = getRoleRedirectPath("cliente");
      const tienda = process.env.NEXT_PUBLIC_URL_TIENDA?.replace(/\/$/, "");
      if (tienda) {
        expect(path).toBe(`${tienda}/catalogo`);
      } else {
        expect(path).toBe("/catalogo");
      }
    });

    it("redirects unknown role to /perfil", () => {
      expect(getRoleRedirectPath("random")).toBe("/perfil");
    });

    it("maps legacy roles to admin", () => {
      expect(LEGACY_ROLE_MAP["gerente"]).toBe("admin");
      expect(LEGACY_ROLE_MAP["vendedor"]).toBe("admin");
      expect(LEGACY_ROLE_MAP["marketing"]).toBe("admin");
    });
  });

  // ── 2. Route Guards ──
  describe("isRouteAllowed", () => {
    it("allows admin to access /ejecutivo", () => {
      expect(isRouteAllowed("/ejecutivo", "admin")).toBe(true);
    });

    it("allows admin to access /caja", () => {
      expect(isRouteAllowed("/caja", "admin")).toBe(true);
    });

    it("denies rep_ventas to access /caja (solo admin)", () => {
      expect(isRouteAllowed("/caja", "rep_ventas")).toBe(false);
    });

    it("denies rep_ventas to access /ejecutivo", () => {
      expect(isRouteAllowed("/ejecutivo", "rep_ventas")).toBe(false);
    });

    it("denies creador to access /creador in nucleo (portal en tienda)", () => {
      expect(isRouteAllowed("/creador", "creador")).toBe(false);
    });

    it("denies creador to access /ejecutivo", () => {
      expect(isRouteAllowed("/ejecutivo", "creador")).toBe(false);
    });

    it("allows any role to /api/ routes", () => {
      expect(isRouteAllowed("/api/health", "rep_ventas")).toBe(true);
    });

    it("allows any role to unknown routes", () => {
      // Fail-closed: unlisted dashboard routes are admin-only
      expect(isRouteAllowed("/random-route", "cliente")).toBe(false);
      expect(isRouteAllowed("/random-route", "admin")).toBe(true);
      expect(isRouteAllowed("/monitor-feria", "cliente")).toBe(false);
      expect(isRouteAllowed("/monitor-feria", "admin")).toBe(true);
    });

    it("allows legacy gerente role to /ejecutivo via normalization", () => {
      expect(isRouteAllowed("/ejecutivo", "gerente")).toBe(true);
    });
  });

  // ── 3. Middleware Integration ──
  describe("createAuthMiddleware", () => {
    const middleware = createAuthMiddleware({
      publicRoutes: ["/", "/login"],
      authRedirect: "/login",
    });

    function buildRequest(pathname: string, opts?: { user?: any }) {
      mockSessionUser = opts?.user ?? null;
      const url = new URL(pathname, "http://localhost:3000");
      (url as any).clone = () => new URL(url.toString());
      const req = {
        nextUrl: url,
        cookies: {
          getAll: () => [],
          set: vi.fn(),
        },
      };
      return req as any;
    }

    it("redirects unauthenticated user from /ejecutivo to /login", async () => {
      const req = buildRequest("/ejecutivo");
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("redirects unauthenticated user from /caja to /login", async () => {
      const req = buildRequest("/caja");
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/login");
    });

    it("allows public route /login for unauthenticated user", async () => {
      const req = buildRequest("/login");
      const res = await middleware(req);
      expect(res.status).toBeUndefined(); // NextResponse.next() has no status
    });

    it("redirects authenticated admin from /login to /ejecutivo", async () => {
      const req = buildRequest("/login", {
        user: {
          id: "u1",
          email: "admin@test.com",
          app_metadata: { role: "admin" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("http://localhost:3000/ejecutivo");
    });

    it("redirects authenticated creador from /login to tienda portal", async () => {
      const req = buildRequest("/login", {
        user: {
          id: "u2",
          email: "creador@test.com",
          app_metadata: { role: "creador" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(
        expectedRoleRedirect("http://localhost:3000", "creador")
      );
    });

    it("redirects authenticated rep_ventas from /login to /pos", async () => {
      const req = buildRequest("/login", {
        user: {
          id: "u3",
          email: "rep@test.com",
          app_metadata: { role: "rep_ventas" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(
        expectedRoleRedirect("http://localhost:3000", "rep_ventas"),
      );
    });

    it("redirects rep_ventas from /ejecutivo to their allowed route", async () => {
      const req = buildRequest("/ejecutivo", {
        user: {
          id: "u3",
          email: "rep@test.com",
          app_metadata: { role: "rep_ventas" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(
        expectedRoleRedirect("http://localhost:3000", "rep_ventas"),
      );
    });

    it("redirects creador from /ejecutivo to tienda portal", async () => {
      const req = buildRequest("/ejecutivo", {
        user: {
          id: "u2",
          email: "creador@test.com",
          app_metadata: { role: "creador" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(
        expectedRoleRedirect("http://localhost:3000", "creador")
      );
    });

    it("allows admin to access /ejecutivo", async () => {
      const req = buildRequest("/ejecutivo", {
        user: {
          id: "u1",
          email: "admin@test.com",
          app_metadata: { role: "admin" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBeUndefined();
    });

    it("redirects rep_ventas away from /caja", async () => {
      const req = buildRequest("/caja", {
        user: {
          id: "u3",
          email: "rep@test.com",
          app_metadata: { role: "rep_ventas" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe(
        expectedRoleRedirect("http://localhost:3000", "rep_ventas"),
      );
    });

    it("handles legacy role gerente as admin", async () => {
      const req = buildRequest("/ejecutivo", {
        user: {
          id: "u4",
          email: "gerente@test.com",
          app_metadata: { role: "gerente" },
        },
      });
      const res = await middleware(req);
      expect(res.status).toBeUndefined(); // allowed because normalized to admin
    });
  });

  // ── 4. Auth Store Fallback (no-profile session) ──
  describe("auth-store checkUser fallback", () => {
    it("fallback user is constructed from session.user metadata when profile is missing", async () => {
      const mockSupabase = {
        auth: {
          getUser: async () => ({
            data: {
              user: {
                id: "fallback-id",
                email: "fallback@test.com",
                app_metadata: { role: "creador" },
                user_metadata: {
                  full_name: "Fallback User",
                  nivel_guardian: "1",
                  avatar_url: "https://example.com/avatar.png",
                },
              },
            },
            error: null,
          }),
          getSession: async () => ({
            data: {
              session: {
                user: {
                  id: "fallback-id",
                  email: "fallback@test.com",
                  app_metadata: { role: "creador" },
                  user_metadata: {
                    full_name: "Fallback User",
                    nivel_guardian: "1",
                    avatar_url: "https://example.com/avatar.png",
                  },
                },
              },
            },
            error: null,
          }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        }),
      };

      // Mock the createClient used by auth-store
      vi.doMock("@enjambre/auth/browser", async () => {
        return {
          getSupabaseUrl: () => "https://mock.supabase.co",
          getSupabaseKey: () => "eyJmock-key",
          createClient: () => mockSupabase,
        };
      });

      const { useAuthStore } = await import("@enjambre/auth");
      // Reset store to initial state
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: true,
      });

      await useAuthStore.getState().checkUser();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.id).toBe("fallback-id");
      expect(state.user?.email).toBe("fallback@test.com");
      expect(state.user?.role).toBe("creador");
      expect(state.user?.full_name).toBe("");
      expect(state.user?.nivel_guardian).toBe("");
      expect(state.user?.avatar_url).toBe("");
      expect(state.isLoading).toBe(false);
    });
  });
});
