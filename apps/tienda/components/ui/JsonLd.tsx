'use client';

import { useMemo } from 'react';

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function JsonLd({ data }: JsonLdProps) {
  const json = useMemo(() => JSON.stringify(data), [data]);

  return (
    <script
      type="application/ld+json"
      // Safe: JSON.stringify escapes all special characters
      // Script type="application/ld+json" is not executed as HTML
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function renderJsonLd(data: Record<string, unknown> | Array<Record<string, unknown>>): string {
  return JSON.stringify(data);
}