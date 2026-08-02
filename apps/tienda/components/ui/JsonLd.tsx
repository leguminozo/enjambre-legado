'use client';

import { useMemo } from 'react';

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * JSON.stringify NO escapa `<`, `>` ni `&`: un valor como
 * `"</script><script>alert(1)</script>"` cerraría el tag y ejecutaría código.
 * Escapado OWASP para incrustar JSON dentro de <script>.
 */
function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function JsonLd({ data }: JsonLdProps) {
  const json = useMemo(() => escapeJsonForScript(JSON.stringify(data)), [data]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function renderJsonLd(data: Record<string, unknown> | Array<Record<string, unknown>>): string {
  return escapeJsonForScript(JSON.stringify(data));
}
