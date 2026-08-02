/**
 * Server-safe: no 'use client'.
 * Capa de compatibilidad para Safari/iOS 15 (piso: iOS 15.4, objetivo iPhone 7).
 * Se inyecta como primer hijo de <body> en los root layouts: corre ANTES que el
 * runtime de Next (scripts async), por lo que las APIs faltantes quedan
 * instaladas cuando la app hidrata.
 *
 * El script es ES5 puro a propósito: si usara sintaxis moderna, un motor viejo
 * no podría parsearlo y el polyfill no haría nada.
 *
 * Nota "why": Next.js 16 y supabase-js usan Array.prototype.at / Object.hasOwn
 * sin polyfill (core-js no los inyecta en el target actual). En iOS 15.4+ existen,
 * pero este piso cubre también 15.0–15.3 donde el login muere con TypeError.
 */

export type LegacyPolyfillKey =
  | 'array.at'
  | 'array.findLast'
  | 'array.findLastIndex'
  | 'object.hasOwn'
  | 'string.replaceAll'
  | 'promise.withResolvers'
  | 'structuredClone';

export function legacyBrowserPolyfillsScript(): string {
  return `(function(){var g=typeof globalThis!=="undefined"?globalThis:(typeof window!=="undefined"?window:this);function def(t,p,v){Object.defineProperty(t,p,{configurable:true,writable:true,value:v})}try{if(typeof Array.prototype.at!=="function"){def(Array.prototype,"at",function(n){var l=this.length>>>0;n=Math.trunc(n)||0;if(n<0){n+=l}return n<0||n>=l?undefined:this[n]})}}catch(e){}try{if(typeof Object.hasOwn!=="function"){def(Object,"hasOwn",function(o,k){return Object.prototype.hasOwnProperty.call(o,k)})}}catch(e){}try{if(typeof Array.prototype.findLast!=="function"){def(Array.prototype,"findLast",function(fn,t){for(var i=this.length-1;i>=0;i--){if(fn.call(t,this[i],i,this)){return this[i]}}return undefined})}}catch(e){}try{if(typeof Array.prototype.findLastIndex!=="function"){def(Array.prototype,"findLastIndex",function(fn,t){for(var i=this.length-1;i>=0;i--){if(fn.call(t,this[i],i,this)){return i}}return -1})}}catch(e){}try{if(typeof String.prototype.replaceAll!=="function"){def(String.prototype,"replaceAll",function(s,r){return this.split(s).join(r)})}}catch(e){}try{if(typeof Promise.withResolvers!=="function"){def(Promise,"withResolvers",function(){var d={};d.promise=new Promise(function(res,rej){d.resolve=res;d.reject=rej});return d})}}catch(e){}try{if(typeof g.structuredClone!=="function"){def(g,"structuredClone",function(v){return JSON.parse(JSON.stringify(v))})}}catch(e){}})();`;
}

export function LegacyBrowserPolyfills({ nonce }: { nonce?: string }) {
  return (
    <script
      {...(nonce ? { nonce } : {})}
      dangerouslySetInnerHTML={{ __html: legacyBrowserPolyfillsScript() }}
    />
  );
}
