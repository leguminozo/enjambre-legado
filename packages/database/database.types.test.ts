import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database, Json } from './database.types';

/**
 * Smoke del package de tipos: no habla con Supabase.
 * Garantiza que typegen exporta la forma esperada y tablas críticas de negocio.
 */
describe('@enjambre/database types', () => {
  const typesSource = readFileSync(join(__dirname, 'database.types.ts'), 'utf8');

  it('exporta Database y Json (import de tipo compilable)', () => {
    // Uso en runtime solo para “anclar” el import de tipos en el graph de tests
    type PublicTables = keyof Database['public']['Tables'];
    const sampleJson: Json = { ok: true };
    expect(sampleJson).toEqual({ ok: true });
    const _tables: PublicTables | undefined = undefined;
    expect(_tables).toBeUndefined();
  });

  it('database.types.ts declara schema public.Tables', () => {
    expect(typesSource).toContain('export type Database');
    expect(typesSource).toContain('export type Json');
    expect(typesSource).toMatch(/public:\s*\{[\s\S]*Tables:\s*\{/);
  });

  it('incluye tablas críticas de tienda / checkout / CMS', () => {
    const required = [
      'productos',
      'ventas',
      'checkout_sessions',
      'profiles',
      'site_content',
      'notification_queue',
      'carrito_items',
      'cash_sessions',
      'security_events',
      'sii_caf',
    ];
    for (const table of required) {
      expect(typesSource, `falta tabla ${table}`).toMatch(
        new RegExp(`\\n\\s+${table}:\\s*\\{`),
      );
    }
  });

  it('tablas tienen Row / Insert / Update', () => {
    for (const table of ['productos', 'ventas', 'profiles'] as const) {
      const block = typesSource.match(
        new RegExp(`${table}:\\s*\\{[\\s\\S]*?Relationships:`),
      )?.[0];
      expect(block, table).toBeTruthy();
      expect(block).toContain('Row:');
      expect(block).toContain('Insert:');
      expect(block).toContain('Update:');
    }
  });

  it('no es un stub vacío (tamaño razonable post-typegen)', () => {
    expect(typesSource.length).toBeGreaterThan(50_000);
  });
});
