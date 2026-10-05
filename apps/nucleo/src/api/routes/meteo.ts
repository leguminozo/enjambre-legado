import { Hono } from "hono";
import type { AppVariables } from "@/api/lib/middleware";
import { rateLimit, getIdentifierFromRequest } from "@/api/lib/rate-limit";

export const meteoRoutes = new Hono<{ Variables: AppVariables }>();

// Coordenadas por defecto (Pureo, Chiloé — misma base que api/lib/fenologia.ts).
const DEFAULT_LAT = -41.86;
const DEFAULT_LNG = -73.82;

const CACHE_TTL_MS = 600_000; // 10 min — los datos cambian hora a hora

const cacheMap = new Map<string, { at: number; body: unknown }>();

const meteoLimit = rateLimit({ windowMs: 60_000, maxRequests: 60 });

/**
 * Proxy público de Open-Meteo. El fetch directo desde el browser falla con
 * adblockers/redes que bloquean api.open-meteo.com; por el propio origin se
 * sirve igual y se cachea en memoria por coordenadas.
 */
meteoRoutes.get("/", async (c) => {
  const { success, remaining, resetTime } = meteoLimit(getIdentifierFromRequest(c));
  if (!success) {
    c.header("Retry-After", String(Math.ceil((resetTime - Date.now()) / 1000)));
    return c.json({ code: "rate_limited", message: "Demasiadas solicitudes" }, 429);
  }
  c.header("X-RateLimit-Remaining", String(remaining));

  let lat = DEFAULT_LAT;
  let lng = DEFAULT_LNG;

  const rawLat = parseFloat(c.req.query("lat") ?? "");
  const rawLng = parseFloat(c.req.query("lng") ?? "");

  // Acotar a coordenadas válidas de Chile (-56 a -17 lat, -76 a -66 lng)
  if (
    Number.isFinite(rawLat) &&
    Number.isFinite(rawLng) &&
    rawLat >= -56 &&
    rawLat <= -17 &&
    rawLng >= -76 &&
    rawLng <= -66
  ) {
    lat = Math.round(rawLat * 100) / 100;
    lng = Math.round(rawLng * 100) / 100;
  }

  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return c.json(cached.body);
  }

  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,precipitation&timezone=America%2FSantiago`;

  try {
    const res = await fetch(openMeteoUrl);
    if (!res.ok) {
      return c.json({ code: "upstream_error", message: `Open-Meteo respondió ${res.status}` }, 502);
    }
    const data = await res.json();
    cacheMap.set(cacheKey, { at: Date.now(), body: data });
    c.header("Cache-Control", "public, s-maxage=600, max-age=300");
    return c.json(data);
  } catch {
    return c.json({ code: "upstream_unreachable", message: "Open-Meteo no disponible" }, 502);
  }
});
