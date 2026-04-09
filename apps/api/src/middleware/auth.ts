import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../types/hono";
import { createSupabaseUserClient } from "../lib/supabase";

export const authMiddleware = createMiddleware<{
  Variables: Pick<AppVariables, "user" | "accessToken" | "supabase">;
}>(async (c, next) => {
  const authHeader = c.req.header("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ code: "unauthorized", message: "Missing Bearer token" }, 401);
  }

  const supabase = createSupabaseUserClient(token);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return c.json({ code: "unauthorized", message: "Invalid token" }, 401);
  }

  c.set("accessToken", token);
  c.set("supabase", supabase);
  c.set("user", {
    id: user.id,
    email: user.email,
  });

  await next();
});
