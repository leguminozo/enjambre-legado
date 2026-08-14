# Tier Legacy — iPhone 7 / hardware antiguo

Capa de degradación automática para dispositivos antiguos (objetivo: iPhone 7,
iOS 15.8, 2GB RAM). El objetivo NO es bloquear: es que la app **siga
funcionando** en hardware viejo, degradando lo que lo mata (blur de GPU,
canvas 30fps, WebGL, mapas raster, websockets persistentes, sync masivo).

## Detección

`LegacyDeviceDetect` (packages/ui, script inline ES5 en `<head>` de los 3 root
layouts) setea en `<html>` antes del primer paint:

- `data-legacy="true"` si: UA iOS ≤ 15, `navigator.deviceMemory ≤ 2`
  (Chrome/Android), o `navigator.hardwareConcurrency ≤ 2` (cubre iPadOS 15,
  que se reporta como Macintosh).
- `data-motion="reduce"` si `prefers-reduced-motion: reduce` (preferencia del
  usuario, independiente del tier de hardware).
- Override manual: `?legacy=1|0` en la URL o `localStorage.enj_legacy_override
  = "1"|"0"` (para testear y para usuarios que quieren forzar el modo ligero).
- Flag JS temprano: `window.__ENJAMBRE_LEGACY__`.

En componentes React: `useLegacyDevice()` (packages/ui) devuelve
`{ legacy, motionReduced }` observando los atributos (MutationObserver +
matchMedia). **No duplicar detección**: si necesitas gatear algo, usa el hook.

## Qué degrada (automático)

| Capa | Mecanismo |
|---|---|
| `backdrop-filter` (sheets, modales, headers) | CSS: `html[data-legacy='true'] * { backdrop-filter: none }` con `@supports` para el prefijo `-webkit-` (Safari 15) — sin `!important` (Lightning CSS lo descarta) |
| Orbes decorativos `blur-3xl` (login/checkout) | Clase `.enj-blur-orb` → `filter: none` en legacy |
| Canvas/rAF continuos (BeeCanvas perfil + landing) | `useLegacyDevice()` → no montar |
| WebGL (GemeloApiario three.js) | Gate `legacy || motionReduced || !webglOk` → fallback lista 2D (`buildHiveState` por colmena) |
| Mapas Leaflet (WorldMapBlock landing) | Móvil/legacy → tarjeta estática con datos CMS + link Google Maps |
| Partículas GSAP (checkout ×20, cinematic ×24) | Legacy/reduced-motion → sin partículas (el resto de la transición queda) |
| GSAP landing (ScrollTrigger) + custom cursor | `motionReduced` → contadores estáticos, cursor nativo |
| GrainOverlay (SVG fixed inset-0) | Legacy → off |
| Realtime global nucleo (canal websocket de badges) | Legacy → sin canal; badges vía refetch manual |
| Sync Dexie campo (clear+bulkAdd completo) | Legacy → TTL 60s → 300s (menos spikes en 2GB) |
| Cytoscape cuaderno (layout `cose`) | Legacy → `grid` (fuerzas físicas es lo más caro) |
| framer-motion nucleo (12 vistas) | `data-motion="reduce"` → `MotionConfig reducedMotion="always"` en `Providers.tsx` |
| QR scanner campo | Ya gateado por `'BarcodeDetector' in window` (iOS no lo tiene → campo manual) |

Los sheets de login (tienda/campo/nucleo) tienen `max-h-[calc(var(--vh-full)-2.5rem)]`
+ `overflow-y-auto` para que el teclado no tape "Entrar" en iPhone 7 — no es
parte del tier, es el fix base de pantallas chicas.

## Cómo gatear algo nuevo

1. `const { legacy, motionReduced } = useLegacyDevice();` (client component).
2. Degrada a un fallback estático con los MISMOS datos (no "quitar y ya"):
   - BeeCanvas → nada (decorativo).
   - GemeloApiario → lista 2D con `buildHiveState`.
   - WorldMapBlock → tarjeta con datos del CMS.
3. Si es CSS (blur/filtros), usa la capa de tokens.css en vez de un gate JS.
4. Añade el caso al e2e `apps/tienda/e2e/legacy-tier.spec.ts` si es verificable
   con el proyecto `iphone-7` (375×667, UA iOS 15.8, chromium).

## Polyfills

`LegacyBrowserPolyfills` cubre (feature-detected, ES5): `at`, `Object.hasOwn`,
`findLast/findLastIndex`, `replaceAll`, `Promise.withResolvers`,
`structuredClone` (fallback JSON — solo < iOS 15.4), `toSorted/toReversed/
toSpliced/with`, `isWellFormed/toWellFormed`, `Object.groupBy`, `Map.groupBy`.

**Regla de oro**: si `compat-audit.mjs` detecta una API nueva, agrégala al
polyfill con su unit test (`legacy-browser-polyfills.test.ts`, patrón realm
`node:vm`) y márcala `covered: true` en el audit. Nunca silenciar.

## Diagnóstico en dispositivo real

- `ErrorRevealHarness` (solo dev/preview): panel con el error JS real.
- Heartbeat de eviction: si la pestaña anterior murió sin unload limpio
  (probable falta de memoria), la siguiente carga muestra un aviso en el panel.
- `?legacy=1` en el dispositivo real → fuerza el tier (verifica que el
  problema persista SIN el tier antes de reportar).

## Verificación

- Unit: `pnpm --filter @enjambre/ui test`.
- Builds con audit: `pnpm --filter @enjambre/<app> build` (compat-audit
  encadenado; también en vercel.json de tienda/campo y CI).
- e2e: `npx playwright test e2e/login-layout.spec.ts e2e/legacy-tier.spec.ts
  --project=chromium --project=iphone-7` (webkit no instalable en macOS 13;
  el proyecto iphone-7 corre en chromium con UA iOS 15.8).
- Regresión visual del login a 375×667 (botones visibles + sheet scrolleable).
