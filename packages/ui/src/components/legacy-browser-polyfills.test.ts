import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import { legacyBrowserPolyfillsScript } from './legacy-browser-polyfills';

/** Crea un realm fresco (vm) con la API indicada eliminada, ejecuta el script y retorna el contexto. */
function realmWithout(deleteExpr: string): vm.Context {
  const sandbox: Record<string, unknown> = {};
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(deleteExpr, ctx);
  vm.runInContext(legacyBrowserPolyfillsScript(), ctx);
  return ctx;
}

describe('legacyBrowserPolyfillsScript', () => {
  it('instala Array.prototype.at cuando falta (iOS < 15.4)', () => {
    const ctx = realmWithout('delete Array.prototype.at');
    expect(vm.runInContext('[1,2,3].at(-1)', ctx)).toBe(3);
    expect(vm.runInContext('[1,2,3].at(5)', ctx)).toBeUndefined();
    expect(vm.runInContext('[1,2,3].at(1)', ctx)).toBe(2);
  });

  it('instala Object.hasOwn cuando falta', () => {
    const ctx = realmWithout('delete Object.hasOwn');
    expect(vm.runInContext('Object.hasOwn({a:1},"a")', ctx)).toBe(true);
    expect(vm.runInContext('Object.hasOwn({a:1},"b")', ctx)).toBe(false);
    // comportamiento nativo: Object.hasOwn(null, ...) lanza TypeError (realm vm, se compara por mensaje)
    expect(() => vm.runInContext('Object.hasOwn(null,"a")', ctx)).toThrow(/to object/);
  });

  it('instala Array.prototype.findLast y findLastIndex cuando faltan', () => {
    const ctx = realmWithout('delete Array.prototype.findLast; delete Array.prototype.findLastIndex');
    expect(vm.runInContext('[1,2,3,4].findLast(function(n){return n%2===0})', ctx)).toBe(4);
    expect(vm.runInContext('[1,2,3,4].findLastIndex(function(n){return n%2===0})', ctx)).toBe(3);
    expect(vm.runInContext('[1,3].findLast(function(n){return n%2===0})', ctx)).toBeUndefined();
  });

  it('instala String.prototype.replaceAll cuando falta', () => {
    const ctx = realmWithout('delete String.prototype.replaceAll');
    expect(vm.runInContext('"a-b-c".replaceAll("-","+")', ctx)).toBe('a+b+c');
  });

  it('instala Promise.withResolvers cuando falta', async () => {
    const ctx = realmWithout('delete Promise.withResolvers');
    const p = vm.runInContext(
      '(function(){var r=Promise.withResolvers();r.resolve(42);return r.promise})()',
      ctx,
    ) as Promise<number>;
    await expect(p).resolves.toBe(42);
  });

  it('instala structuredClone con fallback JSON cuando falta', () => {
    const ctx = realmWithout('delete structuredClone');
    const cloned = vm.runInContext('structuredClone({a:1,b:[2,3]})', ctx) as { a: number; b: number[] };
    expect(cloned).toEqual({ a: 1, b: [2, 3] });
    expect(cloned).not.toBe(vm.runInContext('({a:1})', ctx));
  });

  it('es no-op en motores modernos (todo ya existe)', () => {
    const sandbox: Record<string, unknown> = {};
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(legacyBrowserPolyfillsScript(), ctx);
    expect(vm.runInContext('[1,2,3].at(-1)', ctx)).toBe(3);
    expect(vm.runInContext('Object.hasOwn({a:1},"a")', ctx)).toBe(true);
  });
});
