import type { NextResponse } from 'next/server';

/** Propaga cookies de sesión Supabase al response final del middleware. */
export function mergeMiddlewareCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach(({ name, value }) => {
    target.cookies.set(name, value);
  });
  return target;
}