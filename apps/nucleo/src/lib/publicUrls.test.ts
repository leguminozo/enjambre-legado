import { describe, expect, it } from 'vitest';
import { isAllowedOrigin, getAllowedCorsOrigins } from './publicUrls';

describe('publicUrls & CORS', () => {
  it('includes obrerayzangano.store in allowed origins', () => {
    const origins = getAllowedCorsOrigins();
    expect(origins.has('https://obrerayzangano.store')).toBe(true);
    expect(origins.has('https://www.obrerayzangano.store')).toBe(true);
  });

  it('allows production and preview domains via isAllowedOrigin', () => {
    // Exact store domains
    expect(isAllowedOrigin('https://www.obrerayzangano.store')).toBe(true);
    expect(isAllowedOrigin('https://obrerayzangano.store')).toBe(true);

    // Subdomains
    expect(isAllowedOrigin('https://pos.obrerayzangano.store')).toBe(true);
    expect(isAllowedOrigin('https://campo.obrerayzangano.store')).toBe(true);

    // Online and CL domains
    expect(isAllowedOrigin('https://obrerayzangano.online')).toBe(true);
    expect(isAllowedOrigin('https://www.obrerayzangano.cl')).toBe(true);

    // Vercel preview deploys
    expect(isAllowedOrigin('https://campo-git-feat-xyz.vercel.app')).toBe(true);

    // Localhost
    expect(isAllowedOrigin('http://localhost:3002')).toBe(true);
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
  });

  it('rejects unauthorized external domains', () => {
    expect(isAllowedOrigin('https://malicious-site.com')).toBe(false);
    expect(isAllowedOrigin('https://fake-obrerayzangano.com')).toBe(false);
    expect(isAllowedOrigin('https://attacker.org')).toBe(false);
    expect(isAllowedOrigin(null)).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(false);
    expect(isAllowedOrigin('')).toBe(false);
  });
});
