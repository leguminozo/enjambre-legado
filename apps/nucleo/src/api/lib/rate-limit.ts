interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
}) {
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

setInterval(cleanupRateLimitMap, 60000);
