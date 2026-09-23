import { describe, expect, it } from 'vitest';
import vm from 'node:vm';
import { legacyBrowserPolyfillsScript } from './legacy-browser-polyfills';

/** Crea un realm fresco (vm) con la API indicada eliminada, ejecuta el script y retorna el contexto. */
function realmWithout(deleteExpr: string): vm.Context {
  const sandbox: Record<string, unknown> = {};
  sandbox.globalThis = sandbox;
  sandbox.URL = URL;
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

  it('instala Array.prototype.toSorted / toReversed / toSpliced cuando faltan', () => {
    const ctx = realmWithout(
      'delete Array.prototype.toSorted; delete Array.prototype.toReversed; delete Array.prototype.toSpliced',
    );
    expect(vm.runInContext('[3,1,2].toSorted()', ctx)).toEqual([1, 2, 3]);
    expect(vm.runInContext('[3,1,2].toSorted(function(a,b){return b-a})', ctx)).toEqual([3, 2, 1]);
    // no muta el original
    expect(vm.runInContext('var a=[1,2];a.toReversed();a.join(",")', ctx)).toBe('1,2');
    expect(vm.runInContext('[1,2,3].toReversed()', ctx)).toEqual([3, 2, 1]);
    expect(vm.runInContext('[1,2,3,4].toSpliced(1,2,"a")', ctx)).toEqual([1, 'a', 4]);
    // deleteCount por defecto = 0 (no borra hasta el final)
    expect(vm.runInContext('[1,2,3].toSpliced(1)', ctx)).toEqual([1, 2, 3]);
    expect(vm.runInContext('[1,2,3,4].toSpliced(-2,1)', ctx)).toEqual([1, 2, 4]);
  });

  it('instala Array.prototype.with cuando falta', () => {
    const ctx = realmWithout('delete Array.prototype.with');
    expect(vm.runInContext('[1,2,3].with(1,9)', ctx)).toEqual([1, 9, 3]);
    expect(vm.runInContext('var a=[1,2];a.with(0,9);a.join(",")', ctx)).toBe('1,2');
    expect(vm.runInContext('[1,2].with(-1,9)', ctx)).toEqual([1, 9]);
    // RangeError del realm vm no es instancia del de vitest → se compara por mensaje
    expect(() => vm.runInContext('[1,2].with(5,9)', ctx)).toThrow(/Invalid index/);
  });

  it('instala String.prototype.isWellFormed / toWellFormed cuando faltan', () => {
    const ctx = realmWithout('delete String.prototype.isWellFormed; delete String.prototype.toWellFormed');
    // \uD800 solo = sustituto huérfano → no bien formado
    expect(vm.runInContext('"a\\uD800b".isWellFormed()', ctx)).toBe(false);
    expect(vm.runInContext('"a\\uD83D\\uDE00b".isWellFormed()', ctx)).toBe(true);
    expect(vm.runInContext('"a\\uD800b".toWellFormed()', ctx)).toBe('a\uFFFDb');
    expect(vm.runInContext('"a\\uD83D\\uDE00".toWellFormed()', ctx)).toBe('a\uD83D\uDE00');
  });

  it('instala Object.groupBy y Map.groupBy cuando faltan', () => {
    const ctx = realmWithout('delete Object.groupBy; delete Map.groupBy');
    const grouped = vm.runInContext(
      'Object.groupBy([1,2,3,4,5],function(n){return n%2===0?"par":"impar"})',
      ctx,
    ) as Record<string, number[]>;
    expect(grouped).toEqual({ par: [2, 4], impar: [1, 3, 5] });
    // objeto con prototipo null (mismo shape que el nativo)
    expect(vm.runInContext('Object.getPrototypeOf(Object.groupBy([1],function(){return "k"})) === null', ctx)).toBe(true);
    const m = vm.runInContext('Map.groupBy([1,2,3,4],function(n){return n%2})', ctx) as Map<number, number[]>;
    expect(m.get(0)).toEqual([2, 4]);
    expect(m.get(1)).toEqual([1, 3]);
  });

  it('instala URL.canParse cuando falta', () => {
    const ctx = realmWithout('delete URL.canParse');
    expect(vm.runInContext('URL.canParse("https://example.com")', ctx)).toBe(true);
    expect(vm.runInContext('URL.canParse("/relative", "https://example.com")', ctx)).toBe(true);
    expect(vm.runInContext('URL.canParse("not a url")', ctx)).toBe(false);
  });

  it('es no-op en motores modernos (todo ya existe)', () => {
    const sandbox: Record<string, unknown> = {};
    sandbox.globalThis = sandbox;
    sandbox.URL = URL;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(legacyBrowserPolyfillsScript(), ctx);
    expect(vm.runInContext('[1,2,3].at(-1)', ctx)).toBe(3);
    expect(vm.runInContext('Object.hasOwn({a:1},"a")', ctx)).toBe(true);
    expect(vm.runInContext('URL.canParse("https://example.com")', ctx)).toBe(true);
  });
});

