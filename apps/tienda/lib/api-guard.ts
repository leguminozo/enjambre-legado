import type { NextRequest } from 'next/server';
import { validateCsrf } from '@/lib/csrf';

/** CSRF + origin guard for mutating tienda API routes. */
export function guardMutation(request: NextRequest) {
  return validateCsrf(request);
}