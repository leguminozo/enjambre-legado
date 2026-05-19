import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./lib/env";
import { contableRoutes } from "./routes/contable";
import { creadoresRoutes } from "./routes/creadores";
import { healthRoutes } from "./routes/health";
import { tiendaRoutes } from "./routes/tienda";
import { bancoChileRoutes } from "./routes/banco-chile";

const app = new Hono();

app.route("/api/health", healthRoutes);
app.route("/api/contable", contableRoutes);
app.route("/api/creadores", creadoresRoutes);
app.route("/api/tienda", tiendaRoutes);
app.route("/api/banco-chile", bancoChileRoutes);

app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      code: "internal_error",
      message: "Unexpected error",
    },
    500,
  );
});

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(`API corriendo en http://localhost:${info.port}`);
  },
);
