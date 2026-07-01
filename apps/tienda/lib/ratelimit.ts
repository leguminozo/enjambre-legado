interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  return (identifier: string): { success: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      rateLimitMap.set(identifier, newEntry);

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
    rateLimitMap.set(identifier, entry);

    return {
      success: true,
      remaining: options.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  };
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return ip;
}

export function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitMap, 60000);
}