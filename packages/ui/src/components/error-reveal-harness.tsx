/**
 * Server-safe: no 'use client'.
 * Harness de diagnóstico: captura window.onerror + unhandledrejection y muestra
 * un panel fijo en pantalla con mensaje y stack. Es la única forma de ver el
 * error real de un dispositivo que no podemos reproducir localmente (iPhone 7,
 * Safari 15.8). Solo aparece cuando hay errores; no interfiere con el layout.
 *
 * Nota "why": el bundle de Next 16 "debería" correr en Safari 15.8 pero el
 * usuario reporta botones muertos — el panel convierte la hipótesis en hecho.
 */

export function errorRevealHarnessScript(): string {
  return `(function(){if(window.__ENJAMBRE_ERROR_REVEAL__){return}window.__ENJAMBRE_ERROR_REVEAL__=true;var errors=[];function push(msg,stack){try{errors.push({t:new Date().toISOString().slice(11,19),m:String(msg).slice(0,400),s:stack?String(stack).slice(0,1200):""});if(errors.length>8){errors.shift()}show()}catch(e){}}function show(){try{if(document.getElementById("enjambre-error-reveal")){return}var p=document.createElement("div");p.id="enjambre-error-reveal";p.setAttribute("style","position:fixed;bottom:0;left:0;right:0;z-index:2147483647;max-height:45vh;overflow:auto;background:#141414;color:#ffb4b4;font:11px/1.45 Menlo,Consolas,monospace;padding:10px 12px;border-top:2px solid #ff3333;white-space:pre-wrap;word-break:break-word;box-shadow:0 -4px 24px rgba(0,0,0,.5)");var h=document.createElement("div");h.textContent="ENJAMBRE DIAGN\u00d3STICO \u00b7 "+(navigator.userAgent||"").slice(0,120)+" \u00b7 "+errors.length+" error(es)";h.setAttribute("style","font-weight:bold;margin-bottom:6px;color:#ff8080");p.appendChild(h);for(var i=0;i<errors.length;i++){var d=document.createElement("div");d.textContent="["+errors[i].t+"] "+errors[i].m+(errors[i].s?"\\n"+errors[i].s:"");d.setAttribute("style","border-top:1px solid #333;padding-top:6px;margin-top:6px");p.appendChild(d)}document.documentElement.appendChild(p)}catch(e){}}window.addEventListener("error",function(ev){push((ev.message||"Error")+(ev.filename?" @ "+String(ev.filename).split("/").pop()+":"+ev.lineNumber:""),ev.error&&ev.error.stack)},true);window.addEventListener("unhandledrejection",function(ev){var r=ev.reason;push(r&&r.message?r.message:String(r),r&&r.stack)},true)})();`;
}

export function ErrorRevealHarness({ nonce }: { nonce?: string }) {
  return (
    <script
      {...(nonce ? { nonce } : {})}
      dangerouslySetInnerHTML={{ __html: errorRevealHarnessScript() }}
    />
  );
}
