// Rate-limit in-memory canónico (antes duplicado en tienda y nucleo).
// El Map es por-proceso: cada app mantiene su propio límite, como antes.

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
}) {
  const bucket = `${options.windowMs}:${options.maxRequests}`;
  return (identifier: string): { success: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const key = `${bucket}:${identifier}`;
    const entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      rateLimitMap.set(key, newEntry);

      return {
        success: true,
        remaining: options.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= options.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    rateLimitMap.set(key, entry);

    return {
      success: true,
      remaining: options.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  };
}

// Alias histórico: nucleo usa `rateLimit`, tienda usa `createRateLimiter`.
export const rateLimit = createRateLimiter;

// Identificador para rutas Next.js (Request estándar).
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return ip;
}

// Identificador para rutas Hono (BFF). Añade el auth header para evitar
// que un cliente con IP compartida (ej. NAT) agote la cuota de otros.
export function getIdentifierFromRequest(c: { req: { header: (name: string) => string | undefined } }): string {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0] || c.req.header('x-real-ip') || 'unknown';
  const authHeader = c.req.header('authorization');
  return authHeader ? `${ip}:${authHeader.slice(0, 10)}` : ip;
}

export function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

if (typeof setInterval !== 'undefined' && process.env.VITEST !== 'true') {
  setInterval(cleanupRateLimitMap, 60000);
}
