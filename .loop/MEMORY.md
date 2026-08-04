# Loop memory — Oyz App (Enjambre Legado)

## Doctrina del loop (actualizar solo si el operador la cambia)

- **Fase v1.4 (activa — pulir · funcionar · capas):** valor = **dejar funcionando y redondeado** el monorepo entero (nucleo + tienda + campo), absorbiendo actualizaciones recientes y cazando bugs (funcionales, ocultos, perf, auth, BFF, entrelazados). UI residual solo si bloquea uso.
- **Metodología en capas (obligatoria por tick):**
  1. **Capa 1 Detectar** — lista P0–P2 de candidatos (hipótesis + path + evidencia parcial).
  2. **Capa 2 Validar** — más código/entrelazados/perspectiva → CONFIRMED | FALSE_POSITIVE | DEFER | ASK_HUMAN | ALREADY_FIXED.
  3. **Capa 3 Intervenir** — solo CONFIRMED; cirugía; o pregunta humana si es producto/diseño.
- **Prioridad de valor (orden fijo — fase v1.4):**
  1. **F — Funciona** — flujos rotos, editor-tienda/CMS, commerce, POS, home por rol
  2. **E — Entrelazados** — nucleo↔tienda↔campo, packages
  3. **B — Bugs / regresión semana** — bitácora, fenología, CAF, subs, territorial, alambique, auth
  4. **C — Coherencia nav/roles** — `/inicio` único; no Alma
  5. **P — Perf** del cono
  6. **U/R/A/T** — layout/responsive/touch/tokens solo si bloquean uso
- **Ámbito multi-app:** cada tick puede tocar nucleo, tienda y/o campo según el cono; no sesgar solo a nucleo ni solo a UI tienda.
- **Señal operador:** editor tienda en línea (`/editor-tienda`) puede estar roto → boost `editor-cms-tienda`.
- **Config-en-UI** sigue vigente; env = secretos plataforma.
- Conos canónicos v1.4: nav-home-roles · editor-cms-tienda · auth-login-recovery · tienda-commerce · tienda-landing-chrome · campo-pos-offline · territorial-registro · colmenas-bitacora · fenologia-traza · alambique-produccion · subs-caf-pagos · deep-followup.
- **v1.3 UI:** congelada como base táctil (backlog abajo histórico ✅); no reabrir rueda de pass 40–82 sin P0 real.
- **v1.2 go-live:** base; no reabrir sin regresión dinero/stock/auth.
- **Loophole:** absorber → Capa1 → Capa2 → Capa3 → redirigir → acrecer. Guardrieles fijos.
- Guardrieles: fail-closed; no RLS/CAF; cirugía; evidencia; no spawnear loops; no WIP ajeno; no Alma/resumen; no monorepo-spray; ASK_HUMAN solo producto/diseño.
- Cadencia: 60s reactivación; investigación **ilimitada** si productiva.
- Identidad: Enjambre Legado — néctar trazable multi-app, editorial dark luxury.

### Backlog v1.4 (activo — pulir / funcionar)

| Superficie | Hallazgo / gap | Estado |
|------------|----------------|--------|
| Editor CMS tienda | pass100 revalidate/admin/legales; **opción 2:** retirados del editor/BFF `hero` + `footer_branding|nav|legal`; tienda sin fetch footerData; pie=StoreChrome; hero=i18n | ✅ 2026-08-04 |
| Home / Alma | pass101: HomeView usa profiles.role; /alma→/inicio; Alma fuera del sidebar VISIÓN; legacy guards OK | ✅ núcleo; ⏳ residual WIP EcosistemaDashboard delete sin commitear |
| Auth multi-app | pass102: nucleo friendlyError; campo OAuth redirectTo /login; recovery checkUser/role path; tienda reset min6 + friendly | ✅ regresión recovery; ⏳ residual auth/callback formal en nucleo/campo |
| Territorial | Registro, mapa, predios, trashumantes, InicioTerritorial | ⏳ absorción UX + roles |
| Colmenas + bitácora | Apiarios/cuaderno/traza + bitácora voz/offline nueva | ⏳ funcionar en terreno |
| Fenología + traza | GDD, oráculo, hashes, `/lote/[id]`, PDP traza tienda | ⏳ entrelazado nucleo↔tienda |
| Alambique | Módulo nuevo | ⏳ shell + rutas |
| Campo offline | Sync backoff, loyalty, feria | ⏳ regresión POS |
| Subs + CAF | Flow recurrente, CAF auto, integrity | ⏳ solo regresión |
| Tienda commerce | pass103: catálogo parse fila-a-fila + coerce num/join; pricing slug/precio; init Number(precio); startCartCheckout json safe | ✅ núcleo flujo; ⏳ smoke e2e pago real |
| sw.js ZCode | Basura otra sesión | 🚫 no tocar |

### Backlog UI (v1.3 — histórico / residual; no cono default)

| Superficie | Hallazgo / gap | Estado |
|------------|----------------|--------|
| Tienda hero | cue overlap (pass40); safe-area cue/pad + metrics clamp 375 + collections rhythm; residual media carousel 40/dots, campaign CTA, youtube a11y; mapa href + editorial pages 375; 404/error btn fantasma + contacto/ulmo; residual contacto catálogo CTA + nosotros evidencia + landing H2 clamp + leaflet 44; residual empty creaciones CTA + ciencia/nosotros H2 densos + claim claimed + youtube focus | ✅ pass 40+47+54+61+68+75+82 |
| Tienda header | nav lg+ (41); residual: lang/social &lt;44, carousel dismiss hover-only, header notch; install py-2, lang hidden xs, drawer sin safe-bottom; auth btn fantasma + perfil safe-top; announcement h36 + legal H1 + footer PWA; residual annou internal blank + auth H1 clamp + recuperar/reset login CTAs | ✅ pass 41+48+55+62+69+76 |
| Tienda conservation | metrics `text-5xl` en 2-col mobile; science 3-col apretado | ✅ pass 40 |
| Campo POS | pb-safe undefined; terminal/retry text-only; logout p-2; cart row crush 375; residual sidebar logout/nav, login py-2, quick-sale text-only back, amber/cyan; residual historial/caja/cliente/feria densos; btn fantasma + card/input CSS; residual setup-error + siguiente venta + threshold dismiss/safe + empty cart CTA; residual post-venta Nueva Venta + client Nuevo/Buscar + comisiones checkbox | ✅ pass 44+51+58+65+72+79 |
| Nucleo shell | header-btn 38 / nav close 40 / bell p-1; ViewShell hero color cascade; residual nav-item pad-xs / logout p-1.5 / avatar 36; residual .btn/.input sin min-h, chips 40, login densos; landing H1/CTAs + rail safe-top + CMS chrome 36; residual dashboard 404/error py-2 + AuthHero 4.5rem + search close; residual login H2 2.4rem + colmena ops pad4 + perfil save py-2 + search Esc | ✅ pass 43+50+57+64+71+78 |
| Nucleo panels | checklists go-live (Card vs div Banco) residual ritmo | ✅ pass 46 |
| Tienda shop | pass42 chips/cart; residual sticky double-safe, promo/pay &lt;44, catalog title scale; wallet/PDP/error/replenish residual; reseñas/QR/checkout resultado; residual not-found text-only + checkout dir nueva + QR manual densos + traza H1/breadcrumb; residual catálogo empty/H1 + términos + reposicion result + address field | ✅ pass 42+49+56+63+70+77 |
| Tokens shared | Calendar hex/#4a4a4a/white; Button sm/md &lt;44; ThemeToggle/Switch/Select h-10; residual stone/amber/emerald tiers+impact, SelectItem py-1.5, Dialog close; residual toast/DataTable checkbox/pill; toast safe-area + notif row a11y; residual toast persistent trap + SectionHeader clamp + ImmersiveModal footer/safe; residual Dialog/Card footer densos + DataTable sort th + OverlayFullscreen safe + SectionHeader action + notif footer | ✅ pass 45+52+59+66+73+80 |
| Tokens apps | Logistica emerald → success; residual canvas/PWA hex OK | ✅ pass 46 (logistica); ⏳ baja canvas/manifest |
| SII bandeja amber | confidence/estado badges amber raw | ✅ pass 53 |
| Tienda perfil residual | direcciones hover-only p-2; reposición/pedidos py-2; notif switch 20px; mi-legado chips + reposición/tracking/reseña links + guardián/ciencia/colmena CTAs | ✅ pass 53+60+67 |
| Editor CMS nucleo | item ops 36; Añadir 36; empty text-only; chrome toggle p-1.5; section chips densos | ✅ pass 60 |
| Nucleo admin icon ops | creadores/invitaciones/reglas/vanguardia w-9; costeo inputs h-9/10; residual CRM aliados w-9 + reseñas mod py-1.5 + pipeline/bandeja chips + banco Actualizar; residual regeneracion pad4 + envio qty p-1 + mapa layers 4px + product img × + copy codes py-1 + banco auto-conciliar | ✅ pass 67+74+81 |

### Backlog go-live ops (v1.2 — congelado; no es cono del tick)

| Integración | Código | Ops pendiente |
|-------------|--------|---------------|
| SII / SumUp / Banco / Pagos / Env / Crons | ✅ stack go-live en main | ⏳ migs 95–99; secrets Vercel; smokes reales |

---

## Evolución del prompt

### Evo 2026-08-04 pass 104 (tienda-landing-chrome)
- Señal: SW cacheaba HTML de /login|/perfil|/checkout|/carrito (sesión/checkout stale); announcement/campaign/hero/social aceptaban javascript: o //evil vía CMS
- Compuesto: colapsar + fail-closed chrome + PWA
- Regla nueva: `sanitizeStoreHref` en @enjambre/shop-chrome (solo /path o http(s)); parsers announcement/campaign/landing/footer_social; SW v2.5 NetworkOnly documentos auth/commerce
- Anti-patrón: cache.put navigate de rutas con sesión; Link Next con href // o javascript: desde CMS
- Guardriel: intacto (no reabrir rueda UI touch residual v1.3)

### Evo 2026-08-04 pass 103 (tienda-commerce)
- Señal: listVisibleProducts devolvía [] silencioso si Zod fallaba (num string / lotes array); pricing pasaba slug null → checkout Zod 400; init sin Number(precio); res.json() sin catch en startCartCheckout
- Compuesto: colapsar + entrelazado tienda↔nucleo pricing
- Regla nueva: catálogo = coerce num/array + parse por fila; fallar ruidoso solo si 0/N filas OK; PricingProductRow siempre slug no vacío y precio finite; checkout init Number(precio); client checkout parse JSON fail-closed
- Anti-patrón: safeParse array completo → return []; cast ciego `as PricingProductRow[]` con slug null
- Guardriel: intacto (no reabrir CAF/pago provider)

### Evo 2026-08-04 pass 102 (auth-login-recovery)
- Señal: nucleo login filtraba errores Auth crudos EN; recovery dejaba loading eterno; campo OAuth redirectTo a /pos (middleware mata ?code=); tienda reset 8 vs 6 y raw message; recovery tienda hardcode /perfil
- Compuesto: colapsar + unificar multi-app + fail-closed UX
- Regla nueva: login/recovery/signup/OAuth → friendlySupabaseError|friendlyError; OAuth redirectTo siempre ruta pública `/login` (o `/auth/callback?next=`); post-recovery checkUser + getRoleRedirect/getTiendaRedirect; min password 6 alineado Supabase
- Anti-patrón: OAuth redirectTo a ruta middleware-protegida; throw AuthApiError sin mapear; setLoading(true) sin false en recovery success
- Guardriel: intacto
- Residual DEFER: callback PKCE dedicado en nucleo/campo (tienda ya tiene /auth/callback)

### Evo 2026-08-04 pass 101 (nav-home-roles)
- Señal: HomeView leía solo `app_metadata.role` → territorial sin metadata veía DashboardEjecutivo; Alma aún en sidebar y page viva; rol vacío pintaba panel admin
- Compuesto: colapsar + unificar home + fail-closed
- Regla nueva: home nucleo = `user.role` (profiles) con fallback metadata; esperar `isLoading`; normalizar LEGACY_ROLE_MAP; no-admin/territorial → getRoleRedirectPath; `/alma` y `/ejecutivo` solo redirect a `/inicio`; sidebar VISIÓN = solo Inicio
- Anti-patrón: `app_metadata.role` como única fuente en HomeView; default `return <DashboardEjecutivo />` para cualquier no-territorial; nav item Alma post-unificación
- Guardriel: intacto (no revivir Alma/widgets; no mezclar delete Ecosistema WIP)
- Residual: WIP tree aún tiene deletes Ecosistema/dashboard-resumen ajenos — no commitear en este tick

### Evo 2026-08-04 pass 100 (editor-cms-tienda)
- Señal: operador preview/editor-tienda «roto»; revalidate fallaba en silencio; legal leía `updated_at` vs template `last_updated`; load CMS sin error UX; BFF sin requireProfileRole(admin); dirty cards reseteadas al invalidar query
- Compuesto: colapsar + entrelazado nucleo↔tienda + fail-closed
- Regla nueva: mutaciones CMS devuelven `revalidated` boolean; toast warning si false; `revalidateTiendaCms` → `{ok,reason}`; CMS routes = auth+tenant+requireProfileRole(admin); legal pages = `resolveLegalLastUpdated` (last_updated||updated_at); EditableItemCard sync por id/updated_at/contentKey no `item` ref
- Anti-patrón: await revalidate fire-and-forget sin señal al editor; confiar que layout revalidate alcanza legales sin paths; `useEffect([item])` en lista multi-card
- Guardriel: intacto (no WIP ajeno; no Alma)
- Residual DEFER residual: nosotros/servicios/talleres aún en editor (posible sin consumidor completo)
- **Decisión producto 2 aplicada:** hero + footer_branding/nav/legal fuera del editor y del allowlist BFF; clean landing footerData

### Evo 2026-08-04 reorient v1.4 (operador)
- Señal: semana de producto (nucleo territorial/bitácora/CAF/subs + auth) dejó loop v1.3 UI desfasado; operador exige monorepo entero (nucleo+tienda+campo), capas Detectar→Validar→Intervenir, profundidad ilimitada, pulir lo existente; editor-tienda posiblemente roto
- Compuesto: redirigir doctrina + unificar conos multi-app
- Regla nueva: todo tick con Capa1 lista + Capa2 veredictos; ASK_HUMAN solo producto/diseño; boost editor-cms-tienda
- Anti-patrón: saltar a fix cosmético sin validación; rueda pass UI sin P0; sesgo solo-nucleo o solo-tienda
- Guardriel: intacto (+ no revivir Alma)


### Evo 2026-07-27 pass 82 (ui-tienda-landing)
- Señal: landing-products empty sin CTA; ciencia/nosotros H2 text-3xl fijo; claim claimed sin escape + H1 4xl; science/catalog CTAs text-only residual; youtube sin focus ring
- Compuesto: colapsar + redirigir + unificar
- Regla nueva: empty creaciones landing = CTA min-h-12 catálogo; editorial H2 = clamp; claim terminal states always CTAs recovery
- Anti-patrón: empty products solo italic; claim claimed sin camino a tienda
- Guardriel: intacto (solo UI tienda; claim no toca lógica token)

### Evo 2026-07-27 pass 81 (deep-followup-ui)
- Señal: RegeneracionView edit/delete padding:4; EnvioComposer qty p-1; MapaLegado layers padding 4px; ProductForm remove img 24px; DashboardBancoChile Auto-conciliar py-1; copy codes invitaciones/creadores py-1
- Compuesto: acrecer + colapsar + unificar
- Regla nueva: deep-follow grepear `padding: 4` en style inline + `p-1 rounded border` qty + copy-code `py-1` mono buttons
- Anti-patrón: style padding:4 en icon ops lista; qty stepper sin min-h/w-11
- Guardriel: intacto (solo UI; WIP banco API no tocado)

### Evo 2026-07-27 pass 80 (ui-shared-tokens)
- Señal: DialogFooter/CardFooter sin [&>*]:min-h; DataTable th sort solo py-2; OverlayFullscreen sin safe-area; SectionHeader action sin hit floor; notif panel footer bajo home bar
- Compuesto: unificar + colapsar
- Regla nueva: footers package (Dialog/Card/Immersive) siempre [&>*]:min-h-11; sort headers DataTable min-h-11 inner; OverlayFullscreen pad safe-area
- Anti-patrón: footer package sin floor touch; th sortable solo text height
- Guardriel: intacto (solo packages/ui)

### Evo 2026-07-27 pass 79 (ui-campo-pos)
- Señal: post-venta «Nueva Venta» py-4 sin min-h + H1 text-4xl; client Nuevo/Buscar text-only residual; comisiones checkbox 20px; total carrito text-4xl; feria devolucion input w-20
- Compuesto: colapsar + redirigir
- Regla nueva: post-venta POS primary min-h-12 + clamp H1; client chrome CTAs border hit; DataTable checkbox outer 44; carrito total clamp
- Anti-patrón: success screen CTA sin min-h; checkbox nativo sin hit-box en comisiones
- Guardriel: intacto (solo UI POS)

### Evo 2026-07-27 pass 78 (ui-nucleo-shell)
- Señal: login form H2 fontSize 2.4rem fijo + sin safe-area; colmena-item sin min-h y icon ops padding 4; perfil Guardar/Actualizar py-2; search panel sin Escape
- Compuesto: colapsar + redirigir
- Regla nueva: login form H2 clamp + safe-area pad; colmena-item min-h 44; icon ops apiario min 44 (nunca padding:4); shell search Esc cierra
- Anti-patrón: `style={{ padding: 4 }}` sobre btn-sm; login `fontSize: 2.4rem` fixed
- Guardriel: intacto (solo shell UI; WIP banco no tocado)

### Evo 2026-07-27 pass 77 (ui-tienda-shop)
- Señal: catálogo empty link sin min-h; error load sin recovery CTA; H1 catálogo text-3xl; checkout términos densos; replenish address sin min-h; resultado reposición py-3 sin min-h
- Compuesto: colapsar + redirigir
- Regla nueva: empty/error catálogo = min-h-11 CTA; catalog/checkout H1 clamp + safe-top; post-funnel reposición min-h-11/12; address field min-h-11
- Anti-patrón: empty catálogo `underline` desnudo; resultado reposición solo `py-3`
- Guardriel: intacto (solo UI shop)

### Evo 2026-07-27 pass 76 (ui-tienda-chrome)
- Señal: announcement link interno `/nosotros` abría `_blank`; AuthShell H1 text-3xl denso 375; recuperar/reset sin camino claro a login tras envío
- Compuesto: colapsar + redirigir
- Regla nueva: announcement href interno = Next Link (sin blank); auth H1 clamp; recovery auth siempre CTA min-h-11/12 → /login
- Anti-patrón: `target=_blank` en slides announcement store-routes; recovery sin escape a login
- Guardriel: intacto

### Evo 2026-07-27 pass 75 (ui-tienda-landing)
- Señal: contacto «Volver al Catálogo» sin min-h y href=/ (404 de catálogo); nosotros evidencia inline-block; H2 collections/products/map text-3xl denso; leaflet zoom ~30px; prose legal links sin hit
- Compuesto: colapsar + redirigir + unificar
- Regla nueva: CTAs editoriales landing = min-h-11/12 + href real store-routes; section H2 clamp; leaflet control a ≥44; prose a min-h-11
- Anti-patrón: CTA contacto con copy catálogo pero href `/`; H2 `text-3xl` fijo en bloques landing
- Guardriel: intacto

### Evo 2026-07-27 pass 74 (deep-followup-ui)
- Señal: AliadosB2B w-9 approve/reject; ResenasSensoriales mod py-1.5; Pipeline/Bandeja chips densos; banco «Actualizar» text-only; creador términos sin hit
- Compuesto: acrecer + colapsar + unificar
- Regla nueva: deep-follow grepear w-9 en CRM + py-1.5 en botones moderación; chips proveedor/pipeline min-h-11 explícito
- Anti-patrón: icon ops CRM 36px; chips solo py-1.5 fuera de .filter-chips-scroll
- Guardriel: intacto (solo UI; WIP banco API no tocado)

### Evo 2026-07-27 pass 73 (ui-shared-tokens)
- Señal: toast persistent (promise error) sin botón cerrar; SectionHeader text-3xl denso 375; ImmersiveModal footer sin min-h + sin safe-bottom; DatePicker border-input/bg-transparent
- Compuesto: unificar + colapsar
- Regla nueva: toast dismiss siempre excepto promise pending; SectionHeader clamp H2; ImmersiveModal footer [&>*]:min-h-11 + safe-area pad
- Anti-patrón: `!persistent &&` dismiss gate atrapa errores; modal footer CTAs sin min-h
- Guardriel: intacto

### Evo 2026-07-27 pass 72 (ui-campo-pos)
- Señal: setup-error link text-only; quick-sale «Siguiente venta» text-[10px]; threshold dismiss × sin hit + bottom-4 sin safe; client rows sin min-h; empty cart sin CTA
- Compuesto: colapsar + redirigir
- Regla nueva: post-venta POS CTAs min-h-11; toasts umbral max(1rem,safe-bottom) + dismiss 44; recovery setup-error min-h-11; empty cart CTA catalogo
- Anti-patrón: post-success text-[10px] sin hit; threshold `bottom-4` + dismiss solo glyph
- Guardriel: intacto (solo UI POS; sin lógica pago)

### Evo 2026-07-27 pass 71 (ui-nucleo-shell)
- Señal: dashboard not-found/error CTA solo py-2; AuthHero H1 fontSize 4.5rem fijo aplasta 375; header search sin dismiss explícito
- Compuesto: colapsar + redirigir
- Regla nueva: recovery shell nucleo = min-h-12 CTAs; AuthHero clamp H1 + safe-top; panel búsqueda header siempre tiene close 44
- Anti-patrón: recovery `px-4 py-2` sin min-h; AuthHero `style={{ fontSize: '4.5rem' }}` fijo
- Guardriel: intacto (solo shell UI; WIP banco no tocado)

### Evo 2026-07-27 pass 70 (ui-tienda-shop)
- Señal: producto not-found link sin min-h; checkout «dirección nueva»/reintenta text-only; qr-scan input/CTA sin min-h ni safe-top; trazabilidad H1 text-4xl/5xl + breadcrumb sin hit; PDP breadcrumb densos
- Compuesto: colapsar + redirigir + unificar
- Regla nueva: recovery shop + breadcrumbs traza/PDP = min-h-11; QR manual form min-h-11 + safe-top; traza H1 clamp
- Anti-patrón: not-found `inline-block underline` sin hit; checkout secondary actions solo `text-xs underline`
- Guardriel: intacto (solo UI shop; no lógica pago)

### Evo 2026-07-27 pass 69 (ui-tienda-chrome)
- Señal: announcement default 36px (min 28) recorta dismiss 44; slide href WP muerto; legal py-32/H1 densos; claim H1 5xl; footer legal bajo bottom-nav PWA
- Compuesto: colapsar + redirigir + unificar
- Regla nueva: announcement height min 44; default slide historia → `/nosotros`; legal pages safe-top + clamp H1; footer PWA pad bottom-nav-stack
- Anti-patrón: announcement height &lt;44; href WP legacy en chrome defaults
- Guardriel: intacto

### Evo 2026-07-27 pass 68 (ui-tienda-landing)
- Señal: not-found/error usan `btn btn-*` (sin CSS en tienda); contacto inputs/submit/maps densos + H1 fijo; ulmo back link desnudo sin min-h; product title sin hit
- Compuesto: colapsar + unificar + redirigir
- Regla nueva: recovery pages (404/error) = CTAs Tailwind min-h-11/12 (nunca `.btn` nucleo); monografías/contacto = safe-top + min-h form
- Anti-patrón: `btn btn-primary` en apps/tienda; link monografía sin className
- Guardriel: intacto

### Evo 2026-07-27 pass 67 (deep-followup-ui)
- Señal: paneles admin nucleo (creadores/invitaciones/reglas/vanguardia) w-9 icon ops; costeo/trazabilidad h-9/h-10 inputs; mi-legado CTAs sin min-h; Marketing/FeriasTab text-only
- Compuesto: acrecer + unificar + colapsar
- Regla nueva: deep-follow grepear `w-9 h-9` en panels nucleo + `flex h-9/h-10 w-full` en forms; icon ops = min-h/w-11
- Anti-patrón: acciones fila admin a 36px; inputs shadcn default h-10 en ops táctil
- Guardriel: intacto (solo UI; WIP banco/migs no tocado)

### Evo 2026-07-27 pass 66 (ui-shared-tokens)
- Señal: toast fixed bottom-4 sin safe-area; notif rows div sin role/teclado + header 3-col justificado; paginación icon-only sin min-w; EmptyState action sin min-h; Button size sin min-w
- Compuesto: unificar + colapsar
- Regla nueva: toasts multi-app `bottom/right max(1rem, safe-area)`; filas notif role=button min-h-11; Button sizes min-w-11/12
- Anti-patrón: toast `bottom-4 right-4` fijo; notif row solo div onClick
- Guardriel: intacto

### Evo 2026-07-27 pass 65 (ui-campo-pos)
- Señal: sync-queue + caja modal usan `btn btn-*` sin CSS en campo; comisiones/caja/feria `.card`/`.input-field`/`.stat-card` fantasma; QR POS sin min-h; login back text-only; landing H1 text-5xl
- Compuesto: unificar + colapsar
- Regla nueva: nunca clases nucleo `.btn` en campo; definir `.card`/`.input-field`/`.stat-card` locales o Tailwind; grepear `btn btn-` en apps/campo
- Anti-patrón: `btn btn-ghost` / `btn btn-primary` en POS sync; inputs feria sin min-height token
- Guardriel: intacto (solo UI POS; sin lógica pago)

### Evo 2026-07-27 pass 64 (ui-nucleo-shell)
- Señal: landing nucleo H1 text-5xl + CTAs text-only; login button nested sin min-h; sidebar-rail sin safe-top; StoreChromeEditors reorder p-0.5 + toggle 36; Perfil nav sin min-h explícito
- Compuesto: colapsar + redirigir
- Regla nueva: entry landing multi-app = clamp H1 + min-h-11/12 CTAs + safe-top; rail shell pad safe-top; CMS section toggle/reorder ≥44
- Anti-patrón: nested `<button>` en `<Link>` landing; `min-h-[36px]` residual en StoreChrome
- Guardriel: intacto (solo shell UI; WIP banco no tocado)

### Evo 2026-07-27 pass 63 (ui-tienda-shop)
- Señal: reseñas tabs/CTA/load py densos; QR cámara sin min-h; checkout login/courier/buyer links; resultado post-pago CTAs py-3 sin min-h; carrito title link sin hit
- Compuesto: colapsar + redirigir
- Regla nueva: funnel post-pago (resultado) min-h-11/12; reseñas PDP chips+CTA 44; courier select min-h-11
- Anti-patrón: tabs reseña `py-1.5` sin min-h; resultado solo `py-3` en primary CTA
- Guardriel: intacto (solo UI; no lógica pagos)

### Evo 2026-07-27 pass 62 (ui-tienda-chrome)
- Señal: recuperar/reset `btn btn-primary` no existe en tienda; login/register cross-links sin min-h; perfil-mobile-header sticky sin safe-top; sidebar guardián sin pad notch; install overlap cart-bar
- Compuesto: colapsar + unificar
- Regla nueva: CTAs auth tienda copian login min-h-12 border-accent (nunca clases nucleo `.btn`); chrome perfil usa safe-top al ocultar ShopHeader
- Anti-patrón: `btn btn-primary` en apps/tienda; sticky chrome sin `var(--safe-top)`
- Guardriel: intacto

### Evo 2026-07-27 pass 61 (ui-tienda-landing)
- Señal: WorldMap CTA `/nuestra-historia` 404 (ruta real `/nosotros`); ciencia/galeria/nosotros H1 `text-5xl` denso 375 sin safe-top; ciencia CTA sin min-h; experiencias back text-only
- Compuesto: colapsar + redirigir
- Regla nueva: CTAs del mapa/landing deben usar rutas de `store-routes`; editorial H1 = clamp + pad safe-top bajo header sticky
- Anti-patrón: href legacy WordPress en bloque landing; H1 `text-5xl` fijo en 375
- Guardriel: intacto

### Evo 2026-07-27 pass 60 (deep-followup-ui)
- Señal: EditorTienda item/Añadir min 36 + empty hover:underline; perfil reposición/tracking/reseña text-only; mi-legado chips sin min-h; POS «Registrar como nuevo» text-only residual
- Compuesto: acrecer + colapsar + unificar
- Regla nueva: deep-follow residual = grepear `min-h-[36` + text-only CTAs en CMS/perfil/POS; hermano sano = min-h-11 (creador-portal chips)
- Anti-patrón: `min-w-[36px] min-h-[36px]` en icon ops editor; chips legado sin min-h-11
- Guardriel: intacto (solo UI; WIP banco/migs no tocado)

### Evo 2026-07-27 pass 59 (ui-shared-tokens)
- Señal: toast close p-0.5 + action text-only; DataTable checkbox 20px + page min-w 36; PredictivePill action sin hit; notif footer py-2; SectionHeader text-4xl denso 375
- Compuesto: unificar + colapsar
- Regla nueva: toast dismiss/action min-h-11; DataTable select hit-box 44 (visual 20); pagination min-w-11; pill actions 44
- Anti-patrón: checkbox `w-5 h-5` como único hit; toast close p-0.5
- Guardriel: intacto

### Evo 2026-07-27 pass 58 (ui-campo-pos)
- Señal: historial tabs py-1.5 sin min-h; caja CSV/eye/reconcile w-9; cash close densos; client-lookup text-only; feria btn-sm; comisiones btn-gold sin CSS hit; sync banner py-2
- Compuesto: colapsar + redirigir
- Regla nueva: tabs/ops Campo min-h-11; icon actions caja 44; client-lookup Nuevo/Buscar/X 44; feria/comisiones CTAs min-h-11/12
- Anti-patrón: w-9 h-9 en ops caja; text-[10px] hover:underline en POS cliente
- Guardriel: intacto (solo UI)

### Evo 2026-07-27 pass 57 (ui-nucleo-shell)
- Señal: `.btn`/`.btn-sm`/`.input-field` sin min-h; override `.nav-item` pad !important sin min-h; filter chips 40; login forgot p-0 + toggle densos; SegmentControl py-2; select local h-10
- Compuesto: colapsar + unificar
- Regla nueva: canónicos nucleo `.btn`/`.input-field` min-h 44; chips scroll 44; login CTAs min-h-11/12; Segment/Select shell 44
- Anti-patrón: override CSS de nav-item que baje hit; chips filter a 40px
- Guardriel: intacto (solo shell UI; sin WIP banco)

### Evo 2026-07-27 pass 56 (ui-tienda-shop)
- Señal: WalletButtons py-2.5; PDP back/QR/traza hover:underline sin min-h; product error text-only; plan picker compact sin min-h; replenish confirm sin min-h-12
- Compuesto: colapsar + redirigir
- Regla nueva: CTAs shop (wallet, error, traza, replenish) min-h-11/12; links «volver» always min-h-11
- Anti-patrón: recovery/error PDP solo `hover:underline`; wallet py-2.5 sin hit
- Guardriel: intacto (solo UI shop)

### Evo 2026-07-27 pass 55 (ui-tienda-chrome)
- Señal: InstallPrompt Instalar py-2 + dismiss p-2; LanguageSelector `hidden sm:block`; logo/account sin aria; drawer mobile sin pad safe-bottom; carousel bosque/crema/miel ad-hoc
- Compuesto: colapsar + unificar
- Regla nueva: chrome PWA prompt min-h-11; lang siempre en actions; drawer pad `safe-bottom`; announcement usa primary/accent no brand utility sueltas
- Anti-patrón: lang solo desktop; install dismiss sin hit box
- Guardriel: intacto

### Evo 2026-07-27 pass 54 (ui-tienda-landing)
- Señal: MediaCarousel flechas w-10 + dots 8px; campaign CTA py-2; YoutubeLite div no button; creaciones/mapa H2 text-4xl denso en 375
- Compuesto: colapsar + redirigir
- Regla nueva: carrusel landing arrows/dots min-h-11 + dots safe-bottom; promo CTA min-h-11; lite video = button con aria-label
- Anti-patrón: dots `w-2 h-2` sin hit box; flechas carousel 40px
- Guardriel: intacto

### Evo 2026-07-27 pass 53 (deep-followup-ui)
- Señal: BandejaFiscal/gasto badges `amber-*`; direcciones edit/delete solo hover + p-2; reposición/pedidos py-2; notif switch 20px alto
- Compuesto: acrecer + unificar + colapsar
- Regla nueva: estados go-live warning = `text-warning`/`bg-warning/*`; acciones perfil siempre visibles min-h-11 (no hover-only)
- Anti-patrón: `group-hover:opacity-0` en CTAs táctiles de direcciones; switch custom h-5
- Guardriel: intacto (solo UI; no WIP banco)

### Evo 2026-07-27 pass 52 (ui-shared-tokens)
- Señal: TierBadge/Achievement stone-amber-rose-violet; ImpactStat emerald/green/amber; SelectItem py-1.5; Dialog close sin min-h; Cinematic zinc/white; DatePicker bg-black
- Compuesto: unificar + colapsar
- Regla nueva: badges/stats package solo muted|warning|accent|info|success|primary; menús Select/Dropdown item min-h-11; Dialog close 44
- Anti-patrón: fork TierBadgeCompact con stone en Achievement; emerald en ImpactStat variant
- Guardriel: intacto

### Evo 2026-07-27 pass 51 (ui-campo-pos)
- Señal: sidebar logout `p-2` + nav sin min-h; login inputs py-2; quick-sale “Cambiar/Cancelar” text-only 10px; sync modal close p-2 / discard h-8; amber/cyan en carrito/feria
- Compuesto: colapsar + redirigir + unificar
- Regla nueva: Campo chrome (sidebar/login/quick-sale steps) min-h-11; warnings POS = `text-warning` / `text-info` no amber/cyan
- Anti-patrón: step back del POS como `text-[10px]` sin hit; logout shell p-2 residual tras pass44
- Guardriel: intacto (solo UI; sin lógica pago)

### Evo 2026-07-27 pass 50 (ui-nucleo-shell)
- Señal: `SidebarNavItem` padding inline `space-xs` pisa CSS y deja ~28px; logout sidebar `p-1.5`; avatar perfil 36; sheet search/result sin min-h explícito
- Compuesto: colapsar + redirigir + unificar
- Regla nueva: nav shell (SidebarSection/MobileNavSheet) min-h 44; footer logout/avatar = mismo hit ThemeToggle; no pad-xs en items de menú
- Anti-patrón: inline `padding: var(--space-xs)` en nav-item; logout `btn-ghost p-1.5` sin min box
- Guardriel: intacto (solo shell UI; sin WIP banco/migs)

### Evo 2026-07-27 pass 49 (ui-tienda-shop)
- Señal: sticky cart/checkout `bottom: safe` + padding-bottom safe → doble inset; promo Aplicar/input sin min-h; pay móvil py-3; empty filter link sin hit; catalog title base en 2-col
- Compuesto: colapsar + redirigir
- Regla nueva: sticky bars `bottom: 0` + pad-bottom safe only; checkout promo/pay min-h-11/12; catalog title `text-sm sm:text-base`
- Anti-patrón: `bottom: env(safe) + padding-bottom: env(safe)` en sticky CTA
- Guardriel: intacto (solo UI; no lógica pagos)

### Evo 2026-07-27 pass 48 (ui-tienda-chrome)
- Señal: LanguageSelector sin hit box; footer social w-10; carousel dismiss solo doble-clic/hover; drawer links sin min-h; header sin pad notch; sticky-top sin safe-top
- Compuesto: colapsar + redirigir
- Regla nueva: chrome actions min-h-11; carousel dismiss button visible; header `padding-top: var(--safe-top)`; sticky-top incluye safe-top; bottom-nav-item min-height 44
- Anti-patrón: dismiss anuncio solo hover desktop; iconos social 40px
- Guardriel: intacto

### Evo 2026-07-27 pass 47 (ui-tienda-landing)
- Señal: hero/cue sin safe-area home bar; metrics 2-col aún anchos en 375; creaciones pager 40px; collection header mb-24 mobile; ciencia link sin min-h
- Compuesto: colapsar + redirigir
- Regla nueva: hero pt/pb `max(..., env(safe-area))`; counters `clamp`+tabular-nums; landing pager min-h-11; collection cards focus-ring
- Anti-patrón: bottom cue fijo sin safe-area; pager w-10 en creaciones
- Guardriel: intacto

### Evo 2026-07-27 pass 46 (deep-followup-ui)
- Señal: backlog panels Banco/conciliación div ad-hoc vs Card de checkout/SII/SumUp; CTAs text-only; Logistica `emerald-500` fuera tokens
- Compuesto: unificar + acrecer
- Regla nueva: go-live checklist = `Card`+lista divide-y+badge+icons; acciones min-h-11; status positivo = `text-success` no emerald
- Anti-patrón: `bg-card rounded-2xl` paralelo al Card package; `emerald-*` en JSX de producto
- Guardriel: intacto (solo UI; sin WIP routes banco)

### Evo 2026-07-27 pass 45 (ui-shared-tokens)
- Señal: Calendar en package con bg-[#4a4a4a]/text-white/hex grises; Button sm py-1.5 y md sin min-h; ThemeToggle sin hit box; Select/DatePicker h-10; Switch 24px alto
- Compuesto: unificar + colapsar
- Regla nueva: controles canónicos `@enjambre/ui` min-h-11; Calendar solo tokens card/muted/accent; cero hex en packages/ui components
- Anti-patrón: Calendar “iOS gray” con hex; Button size sin min-h touch
- Guardriel: intacto

### Evo 2026-07-27 pass 44 (ui-campo-pos)
- Señal: `pb-safe` referenciado sin CSS; bottom shell `pb-16` sin safe-area; SumUp cancel/retry text-only; logout p-2; carrito fila no-wrap aplastada en 375; toggle SumUp 20×36
- Compuesto: colapsar + redirigir
- Regla nueva: definir utilities safe-area en globals campo; CTAs terminal min-h-11; cart line `flex-col sm:flex-row`; header POS pt-safe
- Anti-patrón: clase `pb-safe` sin util; botones de cobro solo underline text-xs
- Guardriel: intacto (solo UI POS; sin lógica pago)

### Evo 2026-07-27 pass 43 (ui-nucleo-shell)
- Señal: header-btn 38×38; sheet close 40; NotificationBell `p-1`; ViewShell hero reusa hero-banner pero `.view-shell-title` pisa color del gradient
- Compuesto: colapsar + redirigir + unificar
- Regla nueva: chrome shell min 44×44 (header-btn, sheet close, bell); `.view-shell--hero .view-shell-title` fuerza primary-foreground
- Anti-patrón: icon btn shell &lt;44; ViewShell hero sin override de color post-cascade
- Guardriel: intacto (solo shell UI; sin WIP banco/migs)

### Evo 2026-07-19 pass 42 (ui-tienda-shop)
- Señal: catálogo 2-col con tipografía grande; filtros min-h 40; cart bar CTA chico; checkout densidades
- Compuesto: colapsar + redirigir
- Regla nueva: cards gap/type scale mobile; chips 44px; image sizes 50vw; cart bar + checkout inputs min-h 44; PDP text-balance
- Anti-patrón: grid 2-col + text-lg + p-4 sin line-clamp
- Guardriel: intacto (solo layout shop)

### Evo 2026-07-19 pass 41 (ui-tienda-chrome)
- Señal: nav horizontal desde md con muchos items → aplastado; actions sin hit 44px; WA sin safe-area
- Compuesto: colapsar + redirigir
- Regla nueva: nav desktop desde **lg**; burger hasta lg; gap clamp CSS; actions min-h/w 44; footer legal touch; WA safe-area
- Anti-patrón: `md:flex` para 8+ links uppercase
- Guardriel: intacto

### Evo 2026-07-19 pass 40 (ui-tienda-landing)
- Señal: cue “Descender” absolute center + hero 70dvh → solapa subtítulo/fórmula; metrics 5xl en 2-col
- Compuesto: colapsar + redirigir
- Regla nueva: hero `min-h-[100svh]` + stack z-20 + cue lateral; formula tracking mobile; science `lg:grid-cols-3`
- Anti-patrón: scroll cue centrado sobre el copy del hero
- Guardriel: intacto (solo UI)

### Evo 2026-07-19 redefinición → v1.3 UI
- Señal: operador reorienta el loop de go-live integración a **pulido de interfaces gráficas** (spacing, responsive, overlap)
- Compuesto: dirección + sectores
- Regla nueva: fase **v1.3-ui**; prioridad U→R→A→T→S→O; sectores `ui-tienda-*` / `ui-nucleo` / `ui-campo` / `ui-shared`; go-live v1.2 congelado como ops
- Sector boost: `ui-tienda-landing` (hero overlap demostrado en prod screenshot)
- Anti-patrón: tick de SII/banco mientras el valor pedido es layout
- Guardriel: intacto (no tocar pago/auth sin regresión)

### Evo 2026-07-19 pass 38 (val-pagos-web residual)
- Señal: expire-stale podía marcar expired órdenes con venta; alreadyProcessed no cerraba sesión/holds; Flow webhook 404 si sesión ya completed
- Compuesto: colapsar + redirigir
- Regla nueva: skip/heal paid en expire; complete+release en alreadyProcessed; webhook already_processed si venta existe; checklist cron checkout
- Anti-patrón: expirar pending ciego sin lookup ventas
- Guardriel: intacto (no re-cobra provider en retry)

### Evo 2026-07-19 pass 37 (val-banco-webhooks residual)
- Señal: reprocesar usaba UUID de fila como event id → no mark/side-effects; race sin unique; process fail 500 tras insert
- Compuesto: colapsar + redirigir
- Regla nueva: resolveWebhookEventId/BusinessId; mig 99 unique event key; process fail → 202 + reprocess; business id desde datos
- Anti-patrón: `procesarNotificacion({ id: notificacion.id })` para event:{…}
- Guardriel: intacto (HMAC timing-safe)

### Evo 2026-07-19 pass 36 (val-banco-chile residual)
- Señal: sync upsert sin unique → movimientos duplicados cada corrida; fecha_valor null vs NOT NULL; cuenta_id a veces no UUID local; auth marcaba last_sync
- Compuesto: colapsar + redirigir
- Regla nueva: mig 98 `external_key` unique; mapMovimientoRow (fecha_valor fallback, tipo normalizado); upsert onConflict; auth ≠ sync
- Anti-patrón: upsert ciego sin clave de negocio; last_sync en OAuth probe
- Guardriel: intacto

### Evo 2026-07-19 pass 35 (val-sumup-pos residual)
- Señal: pending DB reusado aunque SumUp EXPIRADO; already_paid 409 → fail en campo; readers paired/ready invisibles en POS; checklist mig96 siempre verde
- Compuesto: colapsar + redirigir + U
- Regla nueva: revalidate getCheckout en idempotency pending; normalizeReaderStatus paired→online; campo alreadyPaid; checklist probe tabla
- Anti-patrón: confiar status DB sin consultar SumUp; filtrar solo status==='online' literal
- Guardriel: intacto

### Evo 2026-07-19 pass 34 (val-sii-emision residual)
- Señal: reintento job sobre boleta/FC ya enviada → invalid_state → dead_letter; enqueue ignoreDuplicates sin id; processing stuck sin reclaim
- Compuesto: colapsar + redirigir + U
- Regla nueva: emit boleta/FC idempotente en enviado|aceptado; enqueue resuelve id por idempotency_key; worker reclama processing >15m; POST /jobs/process-now + UI
- Anti-patrón: tratar re-envío como error fatal cuando el DTE ya está en SII
- Guardriel: intacto

### Evo 2026-07-19 pass 33 (val-sii-certificacion residual)
- Señal: checklist verde sin RUT/giro/domicilio/acteco; cert “activo” sin password/storage → resolveSiiCredentials falla al emitir
- Compuesto: colapsar + redirigir + U
- Regla nueva: items `emisor-identidad` + `cert-credenciales` críticos en fase certificacion; dead_letter separado en jobs-cola; UI badge de fase
- Anti-patrón: checklist solo CAF/vigencia sin material P12 ni identidad XML
- Guardriel: intacto

### Evo 2026-07-19 pass 32 (deep-followup-golive · crons)
- Señal: notifications cron usaba `===` (timing-leaky); fiscal 1×/día (jobs DTE 24h delay); expire-stale checkout solo admin manual
- Compuesto: colapsar + unificar + redirigir
- Regla nueva: `@/lib/cron-auth` fail-closed multi-secret timing-safe; fiscal `*/15`; checkout cron `*/10` → expireStaleCheckoutSessions; vercel.json 3 crons
- Anti-patrón: auth cron ad-hoc por route con `===`; schedule fiscal diario para cola jobs
- Guardriel: intacto

### Evo 2026-07-19 pass 31 (val-conciliacion-e2e residual)
- Señal: RPC solo matcheaba `facturas_emitidas` (checkout/POS = `ventas` paid invisibles); aceptar no guardaba confianza/regla ni `ventas.conciliado`; empresas nuevas sin seed de reglas; UI crash si entidad null
- Compuesto: colapsar + redirigir + U
- Regla nueva: mig 97 `buscar_venta_por_regla` en `aplicar_reglas` (factura primero, luego venta paid); aceptar/auto marcan ventas; `POST …/reglas/seed-defaults`; null-safe propuesta.entidad
- Anti-patrón: asumir DTE existe antes del abono bancario; seed solo en mig one-shot
- Guardriel: intacto (tenant empresaId)

### Evo 2026-07-19 pass 30 (val-env-secrets residual)
- Señal: runtime marcaba encryption OK con key corta (crypto exige ≥32); sin `SII_AUTO_EMIT_BOLETA` en Entorno; NUCLEO_RUNTIME_GROUPS drift vs runtime; docs/.env.example desfasados
- Compuesto: colapsar + redirigir
- Regla nueva: encryption presence = first candidate **length ≥32** (igual `resolveSiiEncryptionKeyBytes`); auto_emit solo `=== "true"`; cron acepta CRON|FISCAL_WORKER|INTEGRATIONS; matriz/docs/.env.example sincronizados
- Anti-patrón: `present(SII_CLAVE_*)` sin minLength; documentar client_secret banco en env cuando es config-en-UI
- Guardriel: intacto (nunca valores en payload)

### Evo 2026-07-16 pass 29 (val-pagos-web)
- Señal: pending abandonados bloquean stock; no ops para liberar holds ni re-fulfill post-pago fallido
- Compuesto: colapsar + redirigir + U
- Regla nueva: `expireStaleCheckoutSessions` + admin expire-stale/retry-fulfill; checklist stale pending; UI botones
- Anti-patrón: pending eternos sin release_checkout_stock; inventar cobro en retry (solo fulfill sesión)
- Guardriel: intacto

### Evo 2026-07-16 pass 28 (val-banco-webhooks)
- Señal: webhook re-procesaba eventos duplicados; firma solo hex; docs decían ⏳; sin UI de pendientes
- Compuesto: colapsar + redirigir + U
- Regla nueva: dedupe early-return; HMAC hex|base64|sha256=; panel ops en BancoChileView; docs BANCO_CHILE §8 actualizado
- Anti-patrón: procesar de nuevo si ya existe event id; docs desfasados de implementación
- Guardriel: intacto

### Evo 2026-07-16 pass 27 (val-banco-chile)
- Señal: `expires_in` OAuth usado como epoch → re-auth en cada request; tokens DB no hidratados; sync UI solo cuentas no movimientos
- Compuesto: colapsar + redirigir
- Regla nueva: tokenExpiresAtMs absoluto; hydrate from banco_chile_tokens; ensureBancoChileAuth; POST /banco-chile/sync; normalizar listas API
- Anti-patrón: `Date.now() >= expires_in * 1000`; client sin token persistido
- Guardriel: intacto

### Evo 2026-07-16 pass 26 (val-sumup-pos)
- Señal: listReaders puede devolver `{items}` (campo ve 0 terminales); reintento POS re-dispara cobro al terminal; sin preferencia de lector
- Compuesto: colapsar + redirigir
- Regla nueva: normalizar readers a array; `sumup_terminal_checkouts` idempotencia por checkout_reference; preferred reader en localStorage campo
- Anti-patrón: asumir `data` es array; createReaderCheckout sin dedupe de referencia
- Guardriel: intacto

### Evo 2026-07-16 pass 25 (val-sii-emision)
- Señal: cola `sii_document_jobs` sin UI ni retry; checklist sin auto-emit/cola; operador ciego a DTE pendientes
- Compuesto: colapsar + redirigir + U
- Regla nueva: `GET/POST /api/sii/jobs` (+ emission-summary, retry); Dashboard SII muestra cola; checklist items auto-emit + jobs abiertos; SII_AUTO_EMIT_BOLETA en env matrix
- Anti-patrón: jobs solo vía cron sin superficie ops; dead_letter invisible
- Guardriel: intacto

### Evo 2026-07-16 pass 24 (deep-followup-golive / val-banco-webhooks)
- Señal: webhook HMAC con `===` timing-leaky; secret missing → throw 500; GET pendientes/reprocesar en router público sin JWT (service role)
- Compuesto: colapsar + redirigir + S
- Regla nueva: webhooks banco fail-closed (503 sin secret); firma timing-safe; rutas admin en webhook con auth+tenant; BANCO_CHILE_WEBHOOK_SECRET en matriz env
- Anti-patrón: endpoints admin montados antes de auth global; `computed === signature` en HMAC
- Guardriel: intacto
- Cristalizado: ver PLAYBOOK webhook sin verify / timing-safe

### Evo 2026-07-16 pass 23 (val-conciliacion-e2e)
- Señal: POST ejecutar exigía empresa_id en body (UI no lo enviaba → 400); stats leían tabla `conciliaciones` wrong; sin checklist/métricas go-live
- Compuesto: colapsar + método + redirigir
- Regla nueva: conciliación-auto usa **tenant empresaId** (body opcional, mismatch = 403); stats = `banco_chile_*`; checklist en `/conciliacion-stats`; enrich venta fallback `ventas`
- Anti-patrón: schema body con empresa_id required cuando UI usa solo tenant; métricas sobre tabla genérica ajena
- Guardriel: intacto

### Evo 2026-07-16 pass 22 (val-env-secrets)
- Señal: matriz env desactualizada (sin SII_CLAVE_ENCRYPTION_KEY/CRON/pagos); /health/deps sin tienda/encryption; sin UI runtime
- Compuesto: redirigir + config-en-UI (presencia, no valores)
- Regla nueva: `scripts/lib/env-matrix-def.mjs` SoT local; nucleo `buildNucleoEnvRuntimeStatus` + `GET /health/env-status` admin; Configuración → Entorno; deps endurece tienda_url+encryption en prod
- Anti-patrón: documentar keys en MEMORY sin matriz ejecutable; mostrar valores de secrets en API
- Guardriel: intacto

### Evo 2026-07-16 pass 21 (val-pagos-web)
- Señal: checkout Flow/TBK sin panel go-live; operador no veía env readiness ni sesiones pending; keys deben quedarse en Vercel
- Compuesto: método + redirigir + config-en-UI (estado, no secretos)
- Regla nueva: `buildPagosGoLiveChecklist` + `GET /checkout/admin/checklist|sessions` admin-only; hub `/pagos` tab Checkout web; secretos pasarela = env plataforma (no form)
- Anti-patrón: exponer FLOW_SECRET en UI; mock pago en production sin checklist
- Guardriel: intacto (returnUrl allowlist, fulfill idempotente)

### Evo 2026-07-16 pass 20 (val-banco-chile + config-en-UI)
- Señal: BancoChileView escribía client_secret/password directo a Supabase desde el browser; secrets plaintext; sync solo leía cache local; sin checklist
- Compuesto: colapsar + redirigir + S
- Regla nueva: secretos de integración **solo BFF** + cifrado AES; UI usa `useApiFetch`; `resolveBancoChileClient`; checklist + POST /auth; sync cuentas vía GET /cuentas API
- Anti-patrón: `supabase.from('*_config').upsert({ password })` desde cliente; secretos en claro en prod sin encryption key
- Guardriel: intacto

### Evo 2026-07-16 pass 19 (val-sumup-pos + config-en-UI)
- Señal: SumUp API config existía sin pestaña UI; api_key en claro; client duplicado en readers/tx/payouts; sin checklist ni smoke
- Compuesto: colapsar + unificar + redirigir
- Regla nueva: SumUp config-en-UI en `SumUpView` tab Config; `resolveSumUpClient` único; API key cifrada (AES, legacy plaintext OK); `GET /checklist` + `POST /test-connection`
- Anti-patrón: sumup_config solo por SQL/env; plaintext key en prod sin material cifrado; getClient copiado por route
- Guardriel: intacto (fail-closed encrypt en production)

### Evo 2026-07-16 pass 18 (val-sii-emision + config-en-UI)
- Señal: operador pide configurar ecosistema desde la app; empresa PATCH no editaba RUT/giro/domicilio; CAF solo GET; certificados routes sin montar; P12 password solo env
- Compuesto: colapsar + unificar + dirección (regla general)
- Regla nueva: **config-en-UI** — valor de negocio/integración → form+BFF; env = plataforma. SII: identidad completa, import CAF XML, upload P12+clave cifrada, resolveSiiCredentials lee DB
- Anti-patrón: “configurá el RUT en SQL”; certificados API huérfana sin route; password P12 solo en Vercel cuando se puede cifrar en DB
- Guardriel: intacto (AES fail-closed; no secretos en cliente)

### Evo 2026-07-16 pass 17 (val-sii-certificacion)
- Señal: checklist solo CAF 46 + FC; `listoProduccion` exigía Palena junto a pruebas Maullín; sin UI; no medía clave/encryption/DTE venta 33/39
- Compuesto: método + colapsar + unificar (UI operación)
- Regla nueva: checklist SII con fases `certificacion` | `go-live`; críticos 33/39/46 + P12 + clave + encryption + DTE venta + FC; `listoCertificacion` independiente de `listoProduccion`; SettingsTab muestra badges
- Anti-patrón: checklist que solo mira FC46; `storage-docs` hardcoded true; go-live flag sin panel operador
- Guardriel: intacto

### Evo 2026-07-16 reorientación v1.2
- Señal: operador pide enfocar loop a validar SII, SumUp, Banco Chile y funciones casi listas para uso real
- Compuesto: dirección + sectores
- Regla nueva: fase v1.2 prioridad V→R→S; sectores val-sii / val-sumup / val-banco-chile / val-pagos / val-env; no reabrir UI-canon salvo bloqueo de go-live
- Anti-patrón: tick de tokens visuales cuando hay gap de credenciales/ambiente/smoke de dinero o fiscal
- Guardriel: intacto

### Evo 2026-07-16 pass 16
- Señal: GlassPanel exportado solo en WIP; apps usaban `.glass-panel` CSS / `glass` local; SectionHeader 0 usos; Select local muerto en reportes/cálculos
- Compuesto: unificar + acrecer
- Regla nueva: superficies glass en apps → `GlassPanel` de `@enjambre/ui` (no clase CSS nueva ni fork); aterrizar export + ≥1 consumidor en el mismo commit
- Anti-patrón: export en packages/ui sin adopción; `.glass-panel` / `glass shadow-glass` ad-hoc en vistas
- Guardriel: intacto

### Evo 2026-07-16 pass 15
- Señal: herramientas admin (costeo/CRM/pipeline/reportes/cálculos IA/SII/banco/creadores/feria) con ViewShell pero sin CTAs al grafo; reportes/cálculos sin shell
- Compuesto: entrelazado + unificar UI
- Regla nueva: módulos no-néctar usan `ToolActionRail` + `TOOL_ACTION_CONTEXTS` (salidas de rol al entorno); reportes/cálculos con ViewShell compact + rail; acciones primarias marcadas `primary`
- Anti-patrón: herramienta admin solo hero sin riel de entorno; tarjetas generador sin shell de vista
- Guardriel: intacto

### Evo 2026-07-16 pass 14
- Señal: Produccion/Regeneracion/Logistica/Contable/Colmenas sin CTAs al resto del flujo néctar; silos de herramienta
- Compuesto: entrelazado + acrecer
- Regla nueva: módulos del ciclo usan `NectarRail` (colmenas→lotes→productos→despacho→impacto→contable→SII); cliente legado ya enlaza catálogo/ciencia
- Anti-patrón: ViewShell de producción sin salida a colmenas/catálogo
- Guardriel: intacto

### Evo 2026-07-16 pass 13
- Señal: POS Campo usaba font-serif; headers sueltos; sin ViewShell CSS; toggle bg-white
- Compuesto: unificar UI campo
- Regla nueva: Campo display = font-display; cabeceras ViewShell compact + CSS en globals; tool panels (caja/comisiones/feria/pos) misma shell
- Anti-patrón: font-serif en POS; h1 suelto sin shell; bg-white en knobs
- Guardriel: intacto

### Evo 2026-07-16 pass 12
- Señal: perfil tienda con font-serif y h1 ad-hoc por página; direcciones sin EmptyState/Button canónico
- Compuesto: unificar UI tienda
- Regla nueva: páginas /perfil/* usan PerfilPageHeader (ModuleHero); display = font-display no font-serif; empties EmptyState
- Anti-patrón: font-serif en tienda; header inventado por page sin shared shell
- Guardriel: intacto

### Evo 2026-07-16 pass 11
- Señal: CatalogoView/ProductosCatalogoView con inline styles --bosque-ulmo; ContableView doble hero bajo hub; BancoChile h1 ad-hoc sin ViewShell
- Compuesto: unificar UI canónica nucleo
- Regla nueva: módulos admin usan ViewShell (compact/hero) como ContableHub/Costeo; no h1 inline style con vars legacy; tabs anidados usan h2 sección no segundo hero
- Anti-patrón: style={{ color: 'var(--bosque-ulmo)' }}; h1 gigante dentro de hub con ViewShell
- Guardriel: intacto

### Evo 2026-07-16 pass 10
- Señal: portal creador sin link de share a catálogo; código no fluía a checkout; header ad-hoc sin ModuleHero; empty states sin EmptyState
- Compuesto: entrelazado + unificar UI
- Regla nueva: embajador → share `/catalogo?ref=CODE` → CreatorRefCapture → CREATOR_REF_CODE_KEY → checkout prefill; portal con ModuleHero + CTAs legado/pedidos
- Anti-patrón: solo copiar código sin URL; portal desconectado del catálogo
- Guardriel: intacto

### Evo 2026-07-16 pass 9
- Señal: middleware Campo solo protegía /pos; caja/feria/comisiones/ranking abiertos; POS header sin grafo de herramientas; landing duplicaba links; shell doblaba padding en POS
- Compuesto: entrelazado + redirigir + método
- Regla nueva: CAMPO_PROTECTED_PREFIXES = grafo completo rep; middleware Edge importa paths sin lucide; landing/sidebar/bottom/pos-header desde CAMPO_NAV_ROUTES; shell full-bleed en /pos
- Anti-patrón: PROTECTED_PREFIXES=['/pos'] solo; nav ad-hoc en landing
- Guardriel: intacto (authz expandida fail-closed)

### Evo 2026-07-16 pass 8
- Señal: cliente /perfil/resenas y /perfil/trazabilidad pages sin PERFIL_NAV; i18n guardian ausente; Mi Legado KPIs sin deep links a herramientas
- Compuesto: entrelazado + unificar
- Regla nueva: toda page /perfil/* (no resultado/legacy) debe estar en PERFIL_NAV + i18n links; hub Mi Legado CTAs a pedidos/reposicion/guardian/resenas/trazabilidad
- Anti-patrón: labelKey en icons sin href en PERFIL_NAV; KPI card no-click
- Guardriel: intacto

### Evo 2026-07-15 pass 7 (fase v1.1)
- Señal: operador pide reactivar loop hacia herramientas por rol + entrelazado + UI coherente con SOTA del monorepo
- Compuesto: dirección + sectores + unificar
- Regla nueva: sectores v1.1 role-*-tool-graph + ui-canon-*; prioridad E→U→R; canónico packages/ui + Ecosistema
- Anti-patrón: page huérfana sin sidebar; widget sin CTA a herramienta dueña; header h1 ad-hoc si ModuleHero aplica
- Guardriel: intacto
- Hallazgo pass7: `/calculos-ia` page+lazy sin sidebar; Ecosistema widgets sin deep links; typo Guadián → fix `63c4669`

### Evo 2026-07-15 pass 6
- Señal: commission-rules sin requireProfileRole(admin) → rep muta multiplicadores; cash close sin eq status=open; resenas claim race; salt claim/anon hardcoded en prod
- Compuesto: colapsar + método
- Regla nueva: rutas de dinero (comisiones/reglas) admin-only; cierres/claims condicionales; RESENAS_*_SALT obligatorios en production
- Sector boost: —
- Anti-patrón: tenantMiddleware solo en mutators de dinero; update claim/close sin status/claimed_at guard
- Guardriel: intacto
- Claim POS venta: UUID gen_random_uuid + RPC SECURITY DEFINER OK (medido limpio)

### Evo 2026-07-15 pass 5
- Señal: sii-clave cifraba con SERVICE_ROLE??"" (key vacía); checkout CAF solo con flag; POS CAF solo si existía fila sii_caf; cron fiscal === no timing-safe
- Compuesto: colapsar + redirigir + método
- Regla nueva: cifrado SII fail-closed (SII_CLAVE_ENCRYPTION_KEY|service≥32); CAF enforce en VERCEL production (opt-out false); getFoliosRestantes=0 sin CAF → deny; cron secrets timing-safe
- Sector boost: —
- Anti-patrón: `SERVICE_ROLE_KEY ?? ""` como AES key; `if (cafData)` skip when missing; checkout CAF opt-in only
- Guardriel: intacto
- Ops: set SII_CLAVE_ENCRYPTION_KEY en Vercel; SII_ENFORCE_CAF_ON_CHECKOUT=false solo en staging sin CAF

### Evo 2026-07-15 pass 4
- Señal: offline POS retry sin idempotency → doble venta; items_override confiaba precio_unitario del cliente
- Compuesto: colapsar + método
- Regla nueva: toda venta POS con client_request_id (buy_order POS-uuid); items_override siempre reprice desde productos
- Sector boost: —
- Anti-patrón: items_override.precio_unitario del body; sync_queue sin id de request
- Guardriel: intacto

### Evo 2026-07-15 pass 3
- Señal: verifyInternalApiKey usaba `===` (timing-leaky); backlog de pass1
- Compuesto: colapsar + acrecer
- Regla nueva: secretos internal/cron comparar timing-safe; siempre `!expected || !header → false`
- Sector boost: —
- Anti-patrón: `header === expected` en x-internal-key / cron secrets
- Guardriel: intacto
- Nota BFF: publicPaths checkout/webhooks OK con auth en handlers; creadores/cms con authMiddleware en rutas mutadoras

### Evo 2026-07-15 pass 2
- Señal: `POST /checkout/init` y subscriptions init pasaban `returnUrl` del body al provider sin allowlist → open redirect post Webpay/Flow
- Compuesto: método + colapsar + entrelazados hop1 (subs)
- Regla nueva: en checkout/subs, grepear returnUrl; solo orígenes NEXT_PUBLIC_SITE_URL/URL_TIENDA + paths /checkout/resultado|/perfil/reposicion/resultado
- Sector boost: —
- Anti-patrón: confiar `z.string().url()` del cliente como return del pago
- Guardriel: intacto
- Nota: precios init OK (server product.precio + computeUnitPrice); quote usa subtotal client solo preview; CAF enforce solo con flag/auto-emit

### Evo 2026-07-15 pass 1
- Señal: `createAuthMiddleware` devolvía `next()` si anon key inválida (fail-open); nucleo `defaultRole: "admin"` elevaba JWT sin role; `isRouteAllowed` default `true` abría rutas no listadas (monitor-feria/calendario); E2E_SKIP_AUTH sin bloqueo VERCEL production
- Compuesto: método + colapsar + redirigir
- Regla nueva: middleware auth siempre fail-closed si `!isSupabaseConfigured()`; defaultRole nunca admin; unlisted routes admin-only; E2E skip solo si `VERCEL_ENV !== 'production'`
- Sector boost: nucleo-bff-api (APIs siguen con auth local)
- Anti-patrón: `if (!isValidKey) return next()`; `defaultRole: "admin"`; `isRouteAllowed` → true al final
- Guardriel: intacto

### Evo 2026-07-15 pass 0 (bootstrap)
- Señal: creación del loophole Oyz desde plantilla Trama/Ciclo Vivo, reescrito al monorepo real (tienda/núcleo/campo + packages + fiscal + feria)
- Compuesto: absorber + sectores + método
- Regla nueva: sectores rotan 0–10 específicos Oyz; siempre contrastar 5 leyes + CONSTITUTION antes de fix de dinero/auth
- Sector boost: —
- Anti-patrón: copiar sectores de Trama (RSN/destilador) o Ciclo (compost/Minga) a este repo
- Guardriel: intacto
- Nota: primera pasada real debe ejecutar sector `auth-session` (#0) sin mezclar WIP feria/guardian del working tree

---

## Backlog sectorial

### Alta (priorizar en deep-followup o boost)

- [media] **Fiscal cadena**: CAF enforce production + POS fail-closed pass5; residual DTE async ops + SII_CLAVE_ENCRYPTION_KEY en Vercel
- [x] **Crons**: timing-safe unificado + checkout expire + fiscal 15m (pass32)
- [alta] **Checkout residual**: alinear pricing/preview/commit + idempotencia bajo reintentos reales Transbank/Flow
- [media] **Campo/E2E**: `E2E_SKIP_AUTH` bloqueado en `VERCEL_ENV=production` (pass1); residual: documentar en Vercel que no setear el env
- [baja] **verifyInternalApiKey**: timing-safe cerrado pass3

### Media

- [media] **Internal key hygiene**: `x-internal-key` ≠ service_role reuse si se puede separar; timing-safe compare en todos los internal handlers
- [media] **Typegen CRM residual**: `clientes` stub / `interacciones` vs `crm_*` — `db:typegen` + alinear schema
- [media] **Migraciones 93–94**: guardian impact + feria pausa meta — aplicar prod + RLS review
- [media] **Feria WIP**: monitor-feria, rep-ventas, claim — auditar cuando el WIP se estabilice (no pisar WIP ajeno)
- [media] **SW/Serwist campo**: bypass auth/API same-origin; no cache HTML dashboard
- [media] **canWrite solo UI** vs mutaciones BFF hermanas en núcleo
- [media] **Reseñas / wallet / claim** flood y bind de ownership
- [media] **Multi-empresa contable**: `has_empresa_access` en rutas gastos/SII/banco

### Baja / ops

- [baja] Staging Supabase formal (ops, no solo código)
- [baja] Design drift residual hex/stone en apps (auditar cono packages-contracts-ui)
- [baja] Documentar secrets checklist post go-live (`pnpm env:check:prod`)
- [baja] i18n tienda edge cases (en/es) no seguridad

---

## Anti-patrones confirmados (seed + repo doctrine)

- `getSession()` como gate de acceso server-side (usar `getUser()`)
- Roles desde `user_metadata` o solo botones disabled en React
- Precio / total / buyerId / empresa_id confiados desde body del cliente
- `if (CRON_SECRET && auth !== …)` → secret ausente deja cron abierto
- `SERVICE_ROLE` / `createAdminClient` en componentes cliente o sin authz previa
- `E2E_SKIP_AUTH` en `VERCEL_ENV=production` (bypass POS/SII)
- Clientes Supabase ad-hoc fuera de `@enjambre/auth` + re-exports
- Import barrel `@enjambre/auth` en server (Turbopack + hooks)
- Fail-open middleware cuando faltan env Supabase (`!isValidKey → next()`)
- `defaultRole: "admin"` cuando falta `app_metadata.role`
- `isRouteAllowed` default `true` para rutas no listadas (cliente entra a dashboard)
- Checkout fulfill sin filtrar `status = 'pending'`
- CAF/folios agotados pero checkout sigue emitiendo
- Duplicar `store-chrome` / `sale-qr` en apps en vez de packages
- Hex / `text-white` / `bg-black` / `text-stone-*` en JSX de producto
- `export default` en componentes (excepto pages Next)
- `any` / `catch {}` vacío
- Copiar sectores o fixes de **Trama** o **Ciclo Vivo** sin mapear al dominio Oyz
- Mezclar WIP no relacionado (feria/guardian UI) en commits del loop
- `returnUrl` arbitrario en checkout/subscriptions init (open redirect post-pago)

---

## Hallazgos resueltos recientes (import seed — no reabrir sin regresión)

Fuente: `docs/TECHNICAL_DEBT.md` + git log 2026-06/07 + loop passes.

| Tema | Estado / ref |
|------|----------------|
| nectar-crosslinks: NectarRail en colmenas/lotes/productos/despacho/impacto/contable | ✅ pass14 `3df4b0e` |
| ui-canon campo: font-display + ViewShell POS/caja/feria/comisiones | ✅ pass13 `6868f05` |
| ui-canon tienda: PerfilPageHeader + font-display direcciones/alertas/pasaporte/logros | ✅ pass12 `8e88497` |
| ui-canon nucleo: ViewShell catalogo/productos/banco + contable nested | ✅ pass11 `e39619e` |
| creador: share ref→catalogo→checkout + ModuleHero/EmptyState | ✅ pass10 `1a1b58d` |
| rep campo: protect full tool graph + nav unificado + shell POS | ✅ pass9 `71fc124` |
| cliente resenas+trazabilidad nav + legado deep links | ✅ pass8 `e8ac9c6` |
| calculos-ia nav + Ecosistema crosslinks ModuleHero | ✅ pass7 `63c4669` |
| commission-rules admin + cash close race + resenas claim/salt | ✅ pass6 `3ff7e2f` |
| SII clave AES fail-closed + CAF prod/POS + cron fiscal timing-safe | ✅ pass5 `a438dd8` |
| POS client_request_id + server reprice items_override | ✅ pass4 `d681b5b` |
| timing-safe verifyInternalApiKey | ✅ pass3 `3dabf65` |
| checkout/subs returnUrl allowlist (open redirect) | ✅ pass2 `ab77d61` |
| auth middleware fail-closed + defaultRole cliente + unlisted deny | ✅ pass1 `d2a6a9f` |
| E2E_SKIP_AUTH blocked on Vercel production | ✅ pass1 `d2a6a9f` nucleo+campo |
| getSession audit server paths | ✅ client-only residual |
| Transbank verify via commit | ✅ webhooks |
| Banco Chile HMAC | ✅ |
| CAF checkout fail-closed + min folios | ✅ `2685837` área fiscal |
| DTE boleta retry / cron fiscal | ✅ |
| Rate limit auth-events | ✅ |
| shop-chrome / sale-qr unificados | ✅ packages |
| Campo e2e smoke + skip auth test | ✅ |
| Database package tests | ✅ |
| as any cash/cms/invites/SII wave | ✅ refactors tipados |
| Theme script hydration #418 | ✅ `efa5cab` |
| Role redirects relativos tienda | ✅ `d94053` / `1d94053` |
| Editor-tienda ChunkLoadError | ✅ import directo |
| Calendar RLS + harden CRUD | ✅ `486df6e` |

---

## Producto: valor diferencial (loophole debe proteger y potenciar)

### Qué es Oyz
- **Enjambre Legado**: SO de regeneración biocultural — bosque nativo Chiloé, abeja virgen, miel de alta gama.
- Tres superficies: **tienda** (cliente premium) · **núcleo** (ops + BFF + contable + SII) · **campo** (POS feria / rep_ventas, offline path).
- Roles canónicos: `admin` | `cliente` | `creador` | `rep_ventas` (legacy map → admin).

### Flujo del néctar (no romper al “arreglar”)
```
Origen (campo/cosecha) → Lotes (núcleo) → Traza (hash) → Producto (tienda)
  → Venta (Transbank/Flow/SumUp) → Impacto (árboles/CO₂) → Contable/SII
```

### Feria (cadena de valor operativa)
1. `/operadores-feria` — contrato + evento `en_curso` + consignación  
2. Campo POS — `channel=feria`  
3. Devolución stock si aplica  
4. Arqueo rep `/mi-feria`  
5. Claim cliente `/claim/{token}`  
6. Ledger → aprobar → Preparar SII → F29  

### Anti-patrón de producto
- Tratar Oyz como “e-commerce template”: perder traza de lote, feria, DTE o impacto al “simplificar” checkout.
- Unificar tienda+núcleo+campo en un solo next app “para limpiar” — rompe roles y deploys Vercel.
- Quitar fail-closed CAF “para no bloquear ventas” — ilegal/operativo en Chile.

---

## Notas de contexto macro (bootstrap)

- Working tree al crear el loop: **WIP activo** (feria monitor, guardian perfil, ui components nuevos, rep-ventas). El loop **no** debe commitear ese WIP de paso.
- Remote: `main` ahead 1 en snapshot bootstrap — respetar historia; no force-push.
- Superficie BFF grande (`apps/nucleo/src/api/routes/*`): rotar por sector; no auditar todas las routes en un tick.
- Packages de dinero/fiscal: `pricing`, `contable`, `fiscal`, `sumup`, `banco-chile`, `wallet`.
- Go-live scripts: `pnpm go-live:check`, `feria:check`, `env:check` — útiles en absorber, no como teatro cada tick.
- Migraciones recientes foco: 85 security perf, 91–92 calendario RLS, 93 guardian, 94 feria pausa.

---

## Estado del cursor (espejo humano; fuente de verdad = CURSOR.json)

- phase: v1.1-roles-ui  
- pass: 14  
- index: 8  
- last: `nectar-crosslinks`  
- next sector: `packages-ui-adoption`  
- streak_clean: 0  












