import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(__dirname, 'supabase/migrations');

/** Prefijo de versión (número corto o timestamp supabase). */
function migrationVersion(filename: string): string {
  if (filename.startsWith('202')) {
    return filename.split('_')[0] ?? filename;
  }
  return filename.split('_')[0] ?? filename;
}

describe('@enjambre/database migrations', () => {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  it('tiene al menos 90 migraciones SQL', () => {
    expect(files.length).toBeGreaterThanOrEqual(90);
  });

  it('todas las migraciones son .sql no vacías', () => {
    for (const file of files) {
      const full = join(MIGRATIONS_DIR, file);
      expect(statSync(full).isFile()).toBe(true);
      const body = readFileSync(full, 'utf8').trim();
      expect(body.length, `${file} vacía`).toBeGreaterThan(10);
    }
  });

  it('prefijos de versión son únicos (sin colisiones)', () => {
    const versions = files.map(migrationVersion);
    const seen = new Map<string, string>();
    for (let i = 0; i < files.length; i++) {
      const v = versions[i]!;
      const f = files[i]!;
      if (seen.has(v)) {
        throw new Error(`Prefijo duplicado ${v}: ${seen.get(v)} vs ${f}`);
      }
      seen.set(v, f);
    }
    expect(seen.size).toBe(files.length);
  });

  it('incluye migraciones críticas de comercio y CMS', () => {
    const joined = files.join('\n');
    expect(joined).toMatch(/checkout_sessions/);
    expect(joined).toMatch(/site_content|store_chrome|menu_cms/);
    expect(joined).toMatch(/carrito_items/);
    expect(joined).toMatch(/ola0_loyalty|loyalty/);
  });

  it('nombres solo [a-z0-9_.]', () => {
    for (const file of files) {
      expect(file).toMatch(/^[a-z0-9_.]+\.sql$/i);
    }
  });
});
