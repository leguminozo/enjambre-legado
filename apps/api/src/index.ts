import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./lib/env";
import { contableRoutes } from "./routes/contable";
import { healthRoutes } from "./routes/health";

const app = new Hono();

app.route("/api/health", healthRoutes);
app.route("/api/contable", contableRoutes);

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
