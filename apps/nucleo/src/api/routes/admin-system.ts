import { Hono } from "hono";
import { authMiddleware, tenantMiddleware, requireProfileRole } from "@/api/lib/middleware";
import type { AppVariables } from "@/api/lib/middleware";

export const adminSystemRoutes = new Hono<{ Variables: AppVariables }>();

adminSystemRoutes.use("*", authMiddleware);
adminSystemRoutes.use("*", tenantMiddleware);
adminSystemRoutes.use("*", requireProfileRole("admin"));

// ---------------------------------------------------------------------------
// POST /api/admin-system/purge-cache
// Invalida el cache on-demand de la tienda (revalidatePath('/' , 'layout')).
// Vive dentro del BFF para heredar JWT + CSRF + rate-limit + rol admin.
// ---------------------------------------------------------------------------

adminSystemRoutes.post("/purge-cache", async (c) => {
  const tiendaUrl = process.env.NEXT_PUBLIC_TIENDA_URL || "http://localhost:3000";

  const res = await fetch(`${tiendaUrl}/api/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    // Invalidate the entire layout to ensure all data is refreshed
    body: JSON.stringify({ path: "/", type: "layout" }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return c.json({ error: `Tienda response error: ${errorText}` }, 500);
  }

  return c.json({ success: true });
});
