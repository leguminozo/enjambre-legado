import { NextResponse } from 'next/server';
import { createRateLimiter, getClientIdentifier } from '@/lib/ratelimit';

export function createRouteRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const limiter = createRateLimiter(options);

  return function checkRouteRateLimit(request: Request): NextResponse | null {
    const result = limiter(getClientIdentifier(request));
    if (!result.success) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }
    return null;
  };
}