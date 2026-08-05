import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { createAdminClient } from "@enjambre/auth/browser";
import {
  buildOpenBookFromArboles,
  getMetodologiaPublica,
} from "@/lib/impacto-metodologia";

/**
 * Impacto público (open-book + metodología).
 * Sin datos personales ni coordenadas de predios.
 */
export const impactoRoutes = new Hono<{ Variables: AppVariables }>();

// GET /api/impacto/metodologia
impactoRoutes.get("/metodologia", (c) => {
  return c.json({ data: getMetodologiaPublica() });
});

// GET /api/impacto/open-book — agregados anónimos
impactoRoutes.get("/open-book", async (c) => {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("arboles_plantados")
      .select("cantidad, co2_ton, sector, especie")
      .limit(5000);

    if (error) {
      return c.json({ code: "query_failed", message: error.message }, 500);
    }

    const book = buildOpenBookFromArboles(data ?? []);
    return c.json({
      data: {
        ...book,
        generado_en: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error open-book";
    return c.json({ code: "open_book_failed", message }, 500);
  }
});
