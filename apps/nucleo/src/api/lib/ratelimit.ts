import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { rateLimit as createMemoryRateLimit } from "./rate-limit";

let _ratelimit: Ratelimit | null = null;
let _redis: Redis | null = null;
let _memoryFallbackWarned = false;

const memoryLimiters = new Map<string, ReturnType<typeof createMemoryRateLimit>>();

function parseWindowMs(window: string): number {
  const [amount, unit] = window.split(" ");
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 10_000;

  switch (unit) {
    case "s":
      return value * 1_000;
    case "m":
      return value * 60_000;
    case "h":
      return value * 3_600_000;
    case "d":
      return value * 86_400_000;
    default:
      return 10_000;
  }
}

function getMemoryLimiter(limit: number, windowMs: number) {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = memoryLimiters.get(cacheKey);
  if (!limiter) {
    limiter = createMemoryRateLimit({ windowMs, maxRequests: limit });
    memoryLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[ratelimit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Rate limiting disabled.');
    return null;
  }

  _redis = new Redis({ url, token });

  _ratelimit = new Ratelimit({
    redis: _redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "enjambre:ratelimit",
  });

  return _ratelimit;
}

function getRedis(): Redis | null {
  if (_redis) return _redis;
  getRatelimit();
  return _redis;
}

export interface RateLimitConfig {
  identifier: string;
  limit?: number;
  window?: `${number} ${"s" | "m" | "h" | "d"}`;
}

export async function checkRateLimit(config: RateLimitConfig): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}> {
  const limit = config.limit || 10;
  const window = config.window || "10 s";
  const ratelimit = getRatelimit();

  if (!ratelimit) {
    if (!_memoryFallbackWarned) {
      console.warn(
        "[ratelimit] Upstash not configured — using in-memory limiter (single-instance only).",
      );
      _memoryFallbackWarned = true;
    }

    const memoryResult = getMemoryLimiter(limit, parseWindowMs(window))(config.identifier);
    return {
      success: memoryResult.success,
      limit,
      remaining: memoryResult.remaining,
      reset: memoryResult.resetTime,
      retryAfter: memoryResult.success
        ? undefined
        : Math.max(1, Math.ceil((memoryResult.resetTime - Date.now()) / 1000)),
    };
  }

  const redis = getRedis();
  if (!redis) {
    const memoryResult = getMemoryLimiter(limit, parseWindowMs(window))(config.identifier);
    return {
      success: memoryResult.success,
      limit,
      remaining: memoryResult.remaining,
      reset: memoryResult.resetTime,
      retryAfter: memoryResult.success
        ? undefined
        : Math.max(1, Math.ceil((memoryResult.resetTime - Date.now()) / 1000)),
    };
  }

  const customRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit || 10, config.window || "10 s"),
    analytics: true,
    prefix: "enjambre:ratelimit",
  });

  const result = await customRatelimit.limit(config.identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
  };
}

export function getClientIdentifier(c: { req: { header: (name: string) => string | undefined; ip?: string } }): string {
  // En Vercel, la cabecera x-vercel-forwarded-for es confiable y no puede ser inyectada por el cliente directamente
  const vercelForwarded = c.req.header("x-vercel-forwarded-for");
  if (vercelForwarded) {
    return vercelForwarded.split(",")[0]?.trim() || "unknown";
  }

  // Fallback si no estamos en Vercel (ej. local o VPS directo).
  // x-forwarded-for puede ser spoofed, por lo que tomamos la última IP que suele ser la del proxy inverso confiable,
  // aunque sin una lista de proxies confiables, cualquier IP es sospechosa.
  const forwarded = c.req.header("x-forwarded-for");
  const realIp = c.req.header("x-real-ip");
  
  if (forwarded) {
    const parts = forwarded.split(",");
    // La primera IP es la que afirma el cliente, la última es la conectada al proxy de Vercel/Nginx
    return parts[parts.length - 1]?.trim() || "unknown";
  }
  
  return realIp || c.req.ip || "unknown";
}

export const RATE_LIMIT_CONFIGS = {
  checkout: { limit: 5, window: "1 m" },
  auth: { limit: 10, window: "1 m" },
  webhook: { limit: 100, window: "1 m" },
  api: { limit: 30, window: "1 m" },
} as const;