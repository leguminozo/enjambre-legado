import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { rateLimit, getIdentifierFromRequest } from "@/api/lib/rate-limit";

export const meteoRoutes = new Hono<{ Variables: AppVariables }>();

// Coordenadas de Pureo, Chiloé — misma base que api/lib/fenologia.ts.
// URL fija: el proxy no acepta parámetros (sin riesgo SSRF ni de abuso).
const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-41.86&longitude=-73.82&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=America%2FSantiago";

const CACHE_TTL_MS = 600_000; // 10 min — los datos cambian hora a hora

let cache: { at: number; body: unknown } | null = null;

const meteoLimit = rateLimit({ windowMs: 60_000, maxRequests: 60 });

/**
 * Proxy público de Open-Meteo. El fetch directo desde el browser falla con
 * adblockers/redes que bloquean api.open-meteo.com; por el propio origin se
 * sirve igual y se cachea en memoria (mismo patrón que rate-limit).
 */
meteoRoutes.get("/", async (c) => {
  const { success, remaining, resetTime } = meteoLimit(getIdentifierFromRequest(c));
  if (!success) {
    c.header("Retry-After", String(Math.ceil((resetTime - Date.now()) / 1000)));
    return c.json({ code: "rate_limited", message: "Demasiadas solicitudes" }, 429);
  }
  c.header("X-RateLimit-Remaining", String(remaining));

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return c.json(cache.body);
  }

  try {
    const res = await fetch(OPEN_METEO_URL);
    if (!res.ok) {
      return c.json({ code: "upstream_error", message: `Open-Meteo respondió ${res.status}` }, 502);
    }
    const data = await res.json();
    cache = { at: Date.now(), body: data };
    c.header("Cache-Control", "public, s-maxage=600, max-age=300");
    return c.json(data);
  } catch {
    return c.json({ code: "upstream_unreachable", message: "Open-Meteo no disponible" }, 502);
  }
});
