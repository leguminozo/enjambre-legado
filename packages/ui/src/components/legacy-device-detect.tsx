/**
 * Server-safe: no 'use client'.
 * Detector de dispositivo legacy (iPhone 7 / hardware antiguo). Se inyecta en
 * <head> ANTES del runtime de Next para que el atributo data-legacy exista
 * antes del primer paint (evita flash de efectos pesados).
 *
 * Criterios (heurística documentada en docs/LEGACY_TIER.md):
 * - UA iOS ≤ 15 (iPhone 7 llega hasta iOS 15.8; Safari 15.x no tiene dvh
 *   dinámico, color-mix, toSorted, backdrop-filter sin prefijo, etc.)
 * - navigator.deviceMemory ≤ 2 (Chrome/Android low-end; no existe en iOS)
 * - navigator.hardwareConcurrency ≤ 2 (cubre iPadOS 15, que se reporta como
 *   Macintosh y escapa al parseo de UA)
 * - Override manual: ?legacy=1|0 o localStorage.enj_legacy_override = "1"|"0"
 *
 * Efecto: <html data-legacy="true"> (CSS en tokens.css aplana blur/filtros) +
 * window.__ENJAMBRE_LEGACY__ para JS temprano. data-motion="reduce" se setea
 * aparte (preferencia del usuario, no tier de hardware).
 *
 * El script es ES5 puro a propósito (mismo motivo que legacy-browser-polyfills).
 */

export function legacyDeviceScript(): string {
  return `(function(){try{var r=document.documentElement;function setAttr(k,v){if(v){r.setAttribute(k,v)}else{r.removeAttribute(k)}}var ov=null;var q=(location.search||"").match(/[?&]legacy=(0|1)/);if(q){ov=q[1]==="1"}else{try{var ls=localStorage.getItem("enj_legacy_override");if(ls==="1"||ls==="0"){ov=ls==="1"}}catch(e){}}var legacy=false;if(ov!==null){legacy=ov}else{var ua=navigator.userAgent||"";var m=ua.match(/iPhone OS (\\d+)[_.]/)||ua.match(/CPU OS (\\d+)[_.]/);if(m){legacy=parseInt(m[1],10)<=15}else if(typeof navigator.deviceMemory==="number"&&navigator.deviceMemory<=2){legacy=true}else if(typeof navigator.hardwareConcurrency==="number"&&navigator.hardwareConcurrency<=2){legacy=true}}setAttr("data-legacy",legacy?"true":null);var reduce=false;try{reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}setAttr("data-motion",reduce?"reduce":null);window.__ENJAMBRE_LEGACY__=legacy}catch(e){}})();`;
}

export function LegacyDeviceDetect({ nonce }: { nonce?: string }) {
  return (
    <script
      {...(nonce ? { nonce } : {})}
      dangerouslySetInnerHTML={{ __html: legacyDeviceScript() }}
    />
  );
}
