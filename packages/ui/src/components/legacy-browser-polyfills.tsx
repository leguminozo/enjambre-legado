/**
 * Server-safe: no 'use client'.
 * Capa de compatibilidad para Safari/iOS 15 (piso: iOS 15.4, objetivo iPhone 7).
 * Se inyecta en <head> de los root layouts: corre ANTES que el runtime de Next
 * (scripts async), por lo que las APIs faltantes quedan instaladas cuando la
 * app hidrata.
 *
 * El script es ES5 puro a propósito: si usara sintaxis moderna, un motor viejo
 * no podría parsearlo y el polyfill no haría nada.
 *
 * Cobertura (todas feature-detected; ver compat-audit.mjs → allowlist):
 * - ES2022: Array.at, Object.hasOwn, Array.findLast/Index, String.replaceAll
 * - ES2023 (Safari 16.4+): toSorted, toReversed, toSpliced, with,
 *   String.isWellFormed/toWellFormed
 * - ES2024 (Safari 17.4+): Promise.withResolvers, Object.groupBy, Map.groupBy
 * - API global: structuredClone (fallback JSON; pierde Date/Map/Set/ciclos —
 *   en iOS 15.4+ es nativo, el fallback solo cubre 15.0–15.3)
 *
 * Nota "why": Next.js 16 y supabase-js usan Array.prototype.at / Object.hasOwn
 * sin polyfill (core-js no los inyecta en el target actual). En iOS 15.4+ casi
 * todo es nativo, pero este piso cubre también 15.0–15.3 donde el login muere
 * con TypeError, y las APIs ES2023/2024 no existen en ninguna versión 15.x.
 */

export type LegacyPolyfillKey =
  | 'array.at'
  | 'array.findLast'
  | 'array.findLastIndex'
  | 'array.toSorted'
  | 'array.toReversed'
  | 'array.toSpliced'
  | 'array.with'
  | 'object.hasOwn'
  | 'object.groupBy'
  | 'map.groupBy'
  | 'string.replaceAll'
  | 'string.isWellFormed'
  | 'string.toWellFormed'
  | 'promise.withResolvers'
  | 'structuredClone';

export function legacyBrowserPolyfillsScript(): string {
  return `(function(){var g=typeof globalThis!=="undefined"?globalThis:(typeof window!=="undefined"?window:this);function def(t,p,v){Object.defineProperty(t,p,{configurable:true,writable:true,value:v})}try{if(typeof Array.prototype.at!=="function"){def(Array.prototype,"at",function(n){var l=this.length>>>0;n=Math.trunc(n)||0;if(n<0){n+=l}return n<0||n>=l?undefined:this[n]})}}catch(e){}try{if(typeof Object.hasOwn!=="function"){def(Object,"hasOwn",function(o,k){return Object.prototype.hasOwnProperty.call(o,k)})}}catch(e){}try{if(typeof Array.prototype.findLast!=="function"){def(Array.prototype,"findLast",function(fn,t){for(var i=this.length-1;i>=0;i--){if(fn.call(t,this[i],i,this)){return this[i]}}return undefined})}}catch(e){}try{if(typeof Array.prototype.findLastIndex!=="function"){def(Array.prototype,"findLastIndex",function(fn,t){for(var i=this.length-1;i>=0;i--){if(fn.call(t,this[i],i,this)){return i}}return -1})}}catch(e){}try{if(typeof String.prototype.replaceAll!=="function"){def(String.prototype,"replaceAll",function(s,r){return this.split(s).join(r)})}}catch(e){}try{if(typeof Promise.withResolvers!=="function"){def(Promise,"withResolvers",function(){var d={};d.promise=new Promise(function(res,rej){d.resolve=res;d.reject=rej});return d})}}catch(e){}try{if(typeof g.structuredClone!=="function"){def(g,"structuredClone",function(v){return JSON.parse(JSON.stringify(v))})}}catch(e){}try{if(typeof Array.prototype.toSorted!=="function"){def(Array.prototype,"toSorted",function(cmp){var a=this.slice();a.sort(cmp);return a})}}catch(e){}try{if(typeof Array.prototype.toReversed!=="function"){def(Array.prototype,"toReversed",function(){var a=this.slice();a.reverse();return a})}}catch(e){}try{if(typeof Array.prototype.toSpliced!=="function"){def(Array.prototype,"toSpliced",function(){var args=Array.prototype.slice.call(arguments);if(args.length<2){args.push(0)}var a=this.slice();a.splice.apply(a,args);return a})}}catch(e){}try{if(typeof Array.prototype.with!=="function"){def(Array.prototype,"with",function(idx,v){var l=this.length>>>0;idx=Math.trunc(idx)||0;if(idx<0){idx+=l}if(idx<0||idx>=l){throw new RangeError("Invalid index")}var a=this.slice();a[idx]=v;return a})}}catch(e){}try{if(typeof String.prototype.isWellFormed!=="function"){def(String.prototype,"isWellFormed",function(){var s=String(this);for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c>=0xD800&&c<=0xDBFF){if(i+1>=s.length){return false}var c2=s.charCodeAt(i+1);if(c2<0xDC00||c2>0xDFFF){return false}i++}else if(c>=0xDC00&&c<=0xDFFF){return false}}return true})}}catch(e){}try{if(typeof String.prototype.toWellFormed!=="function"){def(String.prototype,"toWellFormed",function(){var s=String(this);var out=[];for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c>=0xD800&&c<=0xDBFF){if(i+1<s.length){var c2=s.charCodeAt(i+1);if(c2>=0xDC00&&c2<=0xDFFF){out.push(s.charAt(i),s.charAt(i+1));i++;continue}}out.push("\\uFFFD")}else if(c>=0xDC00&&c<=0xDFFF){out.push("\\uFFFD")}else{out.push(s.charAt(i))}}return out.join("")})}}catch(e){}try{if(typeof Object.groupBy!=="function"){def(Object,"groupBy",function(items,cb){var o=Object.create(null);for(var i=0;i<items.length;i++){var k=String(cb(items[i],i));if(!Object.prototype.hasOwnProperty.call(o,k)){o[k]=[]}o[k].push(items[i])}return o})}}catch(e){}try{if(typeof Map.groupBy!=="function"){def(Map,"groupBy",function(items,cb){var m=new Map();for(var i=0;i<items.length;i++){var k=cb(items[i],i);if(!m.has(k)){m.set(k,[])}m.get(k).push(items[i])}return m})}}catch(e){}})();`;
}

export function LegacyBrowserPolyfills({ nonce }: { nonce?: string }) {
  return (
    <script
      {...(nonce ? { nonce } : {})}
      dangerouslySetInnerHTML={{ __html: legacyBrowserPolyfillsScript() }}
    />
  );
}
