import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./lib/env";
import { contableRoutes } from "./routes/contable";
import { creadoresRoutes } from "./routes/creadores";
import { healthRoutes } from "./routes/health";
import { bancoChileRoutes } from "./routes/banco-chile";
import { sumupRoutes } from "./routes/sumup";
import { siiRoutes } from "./routes/sii";

const app = new Hono();

app.route("/api/health", healthRoutes);
app.route("/api/contable", contableRoutes);
app.route("/api/creadores", creadoresRoutes);
app.route("/api/banco-chile", bancoChileRoutes);
app.route("/api/sumup", sumupRoutes);
app.route("/api/sii", siiRoutes);

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
