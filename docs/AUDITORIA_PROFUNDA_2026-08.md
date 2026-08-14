# Auditoría Profunda Extendida — Enjambre Legado (2026-08-14)

> Extensión de la auditoría de producción. Método: 5 exploradores paralelos (auth/keys, pagos/fiscal, DB/API, offline/frontend, contable/integraciones) + **verificación manual línea a línea de cada hallazgo crítico**. Cada hallazgo incluye archivo:línea. Nada de opiniones: código leído.

## ✅ Implementado (2026-08-14)

| Fix | Archivo |
|---|---|
| C-1 + C-2 (escalada por `app_source` + backdoor admin) — `handle_new_user` endurecido: roles solo desde `app_metadata` (no forjable por el cliente); flujo público territorial conservado; log `suspicious_activity` en intentos de escalada | `packages/database/supabase/migrations/20260814120000_remove_signup_role_escalation.sql` |
| C-3 (códigos de invitación) — lectura anónima cerrada (`TO authenticated` + propio tenant); policy admin compatible con rol `'admin'` actual (antes exigía roles legacy `gerente/tienda_admin`) | misma migración |
| C-4 (role gate SII) — `/dte/*`, `/certificacion/*`, `/caf/*`, `/jobs/*`, `/facturas-compra/*`, `/gastos-extranjero/*`, `/honorarios/*`, `/rcv/*`, `/f29/*`, `/f22/*`, `/certificados/*`, `/rpetc/*`, `/intercambio/*`, `/empresa/*`, `/dashboard`, `/tasa-cambio` → `requireProfileRole("admin")`. Excluidos a propósito: `/boletas` (descarga de clientes), `/openapi`, `/trazabilidad` | `apps/nucleo/src/api/routes/sii/index.ts:26-43` |

Verificado: `tsc --noEmit` nucleo ✓ · `next build` nucleo ✓ (incl. compat-audit) · tests de migraciones ✓ · badge de invitaciones (`useSidebarBadges.ts:190`) no se rompe.

---

## Parte 1 — Veredictos sobre los 10 hallazgos del plan original

| # | Hallazgo plan | Veredicto | Evidencia verificada |
|---|---|---|---|
| 1 | `getSession()` en 10+ archivos | ⚠️ **MAYORMENTE REFUTADO** — 10 de 12 archivos ya hacen `getUser()` antes de `getSession()` (el patrón correcto). Violaciones reales: solo 2 | `redeem-invitation.ts:25` (getSession sin getUser, acción privilegiada: asigna roles) y `useSidebarBadges.ts:322` (gating Realtime, menor). Correctos: payment-commit.ts:69, cart-checkout-client.ts:57, checkout/ui.tsx:186, resenas-api.ts:120, subscription-*.ts:22, ComisionesPanel.tsx:89, api.ts:14-17, use-perfil.ts:216, ResenasSensorialesTab.tsx:65 |
| 2 | DTE XML sin `<Signature>` | ✅ **CONFIRMADO** | `dte-xml.ts:135-152` y `:180-208`: ni `buildDteXml` ni `buildEnvioDteXml` incluyen firma DSig. `IndServicio="3"` siempre en factura/boleta (líneas 40-45) |
| 3 | RUT acepta basura | ⚠️ **Conclusión correcta, ejemplo falso** — `"1K"` NO pasa (el DV de "1" es "9"). Pero `"19"`, `"00"`, `"09"` SÍ pasan `validarRUT` (rut.ts:20-29, solo exige largo ≥ 2) | Falta largo mínimo de cuerpo (7-8 dígitos). Además `terceros.ts:44,70-79` guarda el RUT verbatim (con/sin puntos, k/K) y dedupe por string exacto → terceros duplicados |
| 4 | Tasa de cambio sin fallback | ✅ **CONFIRMADO** + hallazgo nuevo | `tasa-cambio.ts:29-32`: un solo fetch, lanza y muere. **NUEVO**: el path por-fecha está roto — `tasa-cambio.ts:26` envía `YYYY-MM-DD` y mindicador.cl responde **HTTP 500** (solo acepta `DD-MM-YYYY`, verificado en vivo) |
| 5 | Receipt parsers: fecha fallback a hoy | ✅ **CONFIRMADO** | `receipt-parsers/aws.ts:26` → `new Date().toISOString().slice(0,10)` si el parse falla. Un recibo de Enero procesado en Agosto se registra como gasto de Agosto |
| 6 | Sin Idempotency-Key en commit | ⚠️ **PARCIAL** — el BFF sí es idempotente por `buy_order` (checkout.ts:576-648, fulfillCheckout), pero el flujo POS mint un `client_request_id` **nuevo por cada intento** (cash-context.tsx:206,255) → un retry tras respuesta perdida genera venta duplicada (ver C-9) | Sin header Idempotency-Key en el commit Transbank (latente: Webpay rechaza token ya usado) |
| 7 | `<img>` raw en header/footer | ✅ **CONFIRMADO** | `shop-header.tsx:108`, `shop-footer.tsx:136` |
| 8 | 150+ funciones SECURITY DEFINER | ✅ **Superficie real y ahora con ejemplos concretos de explotación** | Ver C-5, C-6, C-7, A-1, A-2, A-3: 6+ funciones SD sin `auth.uid()` llamables por cualquier authenticated vía PostgREST |
| 9 | Dead code | ⚠️ **PARCIAL** — `apps/tienda/ts-prune-report.txt` existe (234 exports). De los 9 citados: 5 reales (AxeAudit, GrainOverlay, runSiiSyncJob, getSeasonalContext, slugify), 4 ya borrados (image-placeholder, landing-loader, page-transition, tienda-sidebar) | Bonus: `requireCsrfHeader` (csrf.ts:44) sin uso — pero `validateCsrf` SÍ se aplica vía `guardMutation` en todas las rutas mutantes (auth, pre-orders, subscriptions, referrals, cart) |
| 10 | CI gaps | ✅ **CONFIRMADO** | `ci.yml`: tests+coverage+Playwright ✓, pero **cero** `compat-audit.mjs`, **cero** `tsc --noEmit` explícito, sin protection de branch |

---

## Parte 2 — Nuevos hallazgos CRÍTICOS (verificados línea a línea)

### C-1. Escalada de privilegios por signup: `app_source` forjado → `rep_ventas`/`territorial`/`apicultor`
**`packages/database/supabase/migrations/20260811010000_invitation_platform_roles.sql:158-175`**
El trigger `handle_new_user` (SECURITY DEFINER) mapea `raw_user_meta_data.app_source` — **controlado por el cliente en el signup** — directamente a roles privilegiados: `'campo'` → `rep_ventas`, `'nucleo_territorial'` → `territorial`, `'nucleo_apicultor'` → `apicultor`, con membresía automática en `usuarios_empresas` de la primera empresa. Cualquiera puede `POST /auth/v1/signup` con `data:{app_source:'campo'}` con la anon key y obtiene acceso completo al POS de Campo. El sistema de invitaciones (`canjear_codigo_invitacion`) existe precisamente para gatear estos roles — esto lo bypasea por completo.

### C-2. Backdoor admin hardcodeado en el signup
**`packages/database/supabase/migrations/20260811010000_invitation_platform_roles.sql:178-179`**
```sql
IF (NEW.email = 'gabriel.cuevas01@alumnos.uach.cl') THEN v_role := 'admin';
```
Cualquier registro con ese email (personal, commiteado en el repo, legible por atacantes) se convierte en **admin de plataforma**. Si la cuenta real del operador se borra/duerme, quien registre ese email primero toma el control total. Debe ser una lista en env/secrets, nunca hardcodeada.

### C-3. Códigos de invitación legibles por ANÓNIMOS + broadcast por Realtime
**`28_cash_sessions_commissions_invitations.sql:723-726` + `20260804000000_publish_realtime_subscribed_tables.sql:59`**
La policy `"Usuarios validan codigo"` es `FOR SELECT USING (active = true)` **sin cláusula `TO`** → aplica a `public` (anon). Expone `code`, `roles`, `tools`, `empresa_id`, `max_uses`, `expires_at` de todos los códigos activos. Y `invitation_codes` está en `supabase_realtime` → los códigos nuevos se empujan a cualquier suscriptor anónimo. Combinado con `canjear_codigo_invitacion` (SD, sin rate limit, `/redeem` solo con authMiddleware, invitations.ts:40-67): un atacante cosecha códigos — **incluidos los de rol `admin`** (InvitableRoleSchema incluye 'admin') — y los canjea antes que el destinatario. `enforceAdminInviteConstraints` (1 uso/7 días) solo estrecha la ventana, no protege el valor.

### C-4. Emisión de DTE al SII sin gate de rol: fraude fiscal por cualquier miembro del tenant
**`apps/nucleo/src/api/routes/sii/index.ts:24` + `sii/dte.ts:165`**
`siiRoutes.use("*", authMiddleware, tenantMiddleware)` — **cero `requireProfileRole`** en todo el directorio (el único match es un test). Cualquier usuario con fila en `usuarios_empresas` (reps, cajeros) puede `POST /api/sii/dte/emitir` con `tipo_dte`, `cantidad`, `precio_unitario` y RUT de receptor controlados por el cliente → emite DTEs **firmados y timbrados** bajo el certificado de la empresa, quema folios CAF legales (bloqueando el checkout real por el guard fail-closed), y opcionalmente los envía al SII (ambiente producción si `empresa.sii_ambiente` lo está). Es el hallazgo de mayor impacto de toda la auditoría.

### C-5. `redeem_loyalty_reward`: robo de puntos de fidelización de cualquier usuario
**`20260802160000_unify_loyalty_redeem.sql:97` (GRANT authenticated) — cuerpo sin `auth.uid()`**
SECURITY DEFINER que toma `p_user_id` del caller y gasta puntos de `puntos_fidelizacion` de ese usuario sin verificar propiedad. El caller legítimo (`perfil-experiences.ts:116`) pasa `user.id`, pero cualquier authenticated puede llamarla vía PostgREST con el UUID de una víctima y drenar su saldo. Los puntos son dinero (descuentos CLP-adyacentes).

### C-6. `agregar_puntos_usuario`: minteo ilimitado de puntos por cualquier authenticated
**`20260803140000_fix_agregar_puntos_tipo.sql:105-106` (GRANT authenticated) — cuerpo sin `auth.uid()`**
Mismo patrón: `p_user_id`, `p_empresa_id`, `p_puntos` controlados por el caller; incluso auto-sube de tier (`niveles_fidelizacion`). `rpc('agregar_puntos_usuario', {p_user_id: self, p_puntos: 1000000})` = moneda gratis. Es el mismo motor que usa el checkout → economía de fidelización completamente comprometible.

### C-7. `solicitar_retiro_creador`: retiro de fondos de un creador víctima con datos de pago del atacante
**`65_red_intercambio.sql:18-85` + `15_creadores_security_patch.sql:12-53`**
SECURITY DEFINER sin `auth.uid()` (verificado: el cuerpo solo filtra `WHERE c.user_id = p_user_id`). Llamado desde `creador-portal-client.tsx:181` con `p_user_id` del cliente. Un atacante puede presentar hasta 3 solicitudes de retiro pendientes contra el saldo de cualquier creador activo, con `datos_pago` (banco/PayPal) propios → si el admin aprueba, el pago va a la cuenta del atacante; en el peor caso el saldo de la víctima queda bloqueado y el cap mensual consumido.

### C-8. Folio CAF fuera de rango en DTE 33: primera factura tras cada rollover rechazada por el SII
**`apps/nucleo/src/api/lib/fiscal/emit-factura-dte-from-row.ts:125,217` vs `sii/caf.ts:80-81`**
`caf.ts` guarda `folio_actual = folio_desde - 1` ("último usado" — correcto para los consumidores del RPC `sii_caf_next_folio` que incrementa primero, migración 25:76-81). Pero `emitFacturaDteFromRow` **lee `folio_actual` directamente** (línea 125) y solo después hace `+1` (línea 217): la primera Factura 33 tras cada import/rollover usa folio `desde-1`, fuera del rango autorizado del CAF → rechazo SII. Sin guard `folio >= desde` en ese path. Además el incremento read-modify-write tras el envío permite que dos emisiones concurrentes lean el mismo folio (uno rechazado como "folio ya utilizado", y un folio se salta silenciosamente). FC46 y Boleta 39 usan el RPC atómico y están bien.

### C-9. Doble loop de sync + índice NO único en `ventas.buy_order` → venta duplicada (doble débito)
**`sync-provider.tsx:6-7` + `sync-queue-modal.tsx:15` + `use-sync-engine.ts:73-76,98-114` + `20260601003855_ventas_web_columns.sql:13`**
`useSyncEngine` se monta **dos veces** (provider del layout + modal de la cola); `isSyncing` es un `useRef` **por instancia** → dos loops pueden leer los mismos items pendientes y POSTearlos en paralelo. Server-side (`rep-ventas.ts:134-159`) el dedup es SELECT-then-INSERT sobre un índice **no único** → dos requests concurrentes con el mismo `client_request_id` pasan el check y ambos insertan: venta duplicada, stock doblemente decrementado, comisión duplicada. Dos pestañas del mismo rep (teléfono + laptop), o el botón "Reintentar Todo" del modal, lo disparan.

### C-10. FC46 internamente inconsistente: `PrcItem = monto_neto` pero `MontoItem = monto_total`
**`apps/nucleo/src/api/lib/fiscal/emit-factura-compra.ts:153-158`**
`cantidad: 1, precioUnitario: monto_neto, montoItem: monto_total`. Con IVA > 0, `MontoItem (neto+IVA) ≠ QtyItem × PrcItem (neto)` → la validación de consistencia SII ("MontoItem debe ser igual a QtyItem por PrcItem") falla. Con gastos exentos (neto=0, el default de los 14 proveedores) emite `PrcItem=0` con `MontoItem=total`. Es el DTE del core gasto-extranjero: riesgo de rechazo en cada FC46 con IVA.

---

## Parte 3 — Nuevos hallazgos ALTOS (verificados por explorador con archivo:línea; los de impacto monetario spot-checkeados)

### A-1. `aplicar_venta_feria_post_venta`: inflar consignaciones/comisiones de feria
**`67_feria_pos_consignacion.sql:114-183`** (GRANT authenticated:183) — toma `p_user_id` + `p_venta_id` arbitrarios, nunca verifica `auth.uid() = p_user_id` ni que la venta sea del vendedor. Con contrato de feria activo se puede re-adjuntar cualquier venta a la propia consignación → `cantidad_vendida` inflada → comisiones/honorarios fraudulentos. Alcanzable desde `MiFeriaPortal.tsx:110-138` y `feria-pos.ts:40-65`.

### A-2. `cerrar_arqueo_feria`: cerrar el evento de otro operador y sabotear su `score_confianza`
**`66_incentivo_ledger.sql:104-161`** (GRANT authenticated:161) — `p_cerrado_por` es suplible por el caller y el guard es `c.user_id = COALESCE(p_cerrado_por, auth.uid())` → pasar el UUID de la víctima pasa el check. El atacante cierra el `participante_evento` ajeno (bloquea ventas de feria) y escribe diferencias de stock/efectivo fabricadas que bajan permanentemente el score del otro. DoS cross-tenant + sabotaje de reputación.

### A-3. `aplicar_codigo_creador`: comisiones forjadas sobre ventas arbitrarias
**`40_rls_hardening_audit.sql:282-330`** (el único guard es `auth.uid() IS NULL` bail) — vía `creadores.ts:87` (`POST /aplicar-codigo`, solo authMiddleware). SECURITY DEFINER con `p_venta_id` y `p_monto_venta` del caller: genera `creador_codigo_usos` + (trigger `on_codigo_uso_create_comision`, `14_creadores_contenido.sql`) filas de `creador_comisiones` 'pendiente' con montos fabricados sobre ventas de otros → contamina el ledger de pagos que el admin aprueba.

### A-4. Quick sale online NO es retry-safe: respuesta perdida → venta duplicada o dinero perdido
**`cash-context.tsx:206,255` + `rep-ventas.ts:134-159`** — cada `quickSale`/`cartSale` online mintea un `client_request_id` **fresco**; el dedup server depende de ese id. Si el request commitea server-side pero la respuesta se pierde (blip), el usuario ve error, la venta no queda ni en UI ni en `sync_queue` (el path online no tiene fallback de encolado). Retry → id nuevo → dedup no aplica → **cobro doble**. Si no retry → el efectivo se tomó sin venta registrada. El path offline es seguro (payload + id persistidos en Dexie); el online no.

### A-5. Errores terminales de sync reintentados para siempre (MAX_ATTEMPTS no se aplica)
**`use-sync-engine.ts:80-84,137-155`** — tras el intento 6, un item 4xx pasa a `status:'error'` **sin `next_retry_at`**, y el query selecciona items con `!next_retry_at || next_retry_at <= now` → se re-POSTea en cada ciclo (mount, evento online, fin de cada upsync) indefinidamente, con `attempts` creciendo sin tope (el banner mostraría "(7/6)"). Igual en la rama 409 `consignacion_insuficiente` (128-135) cuyo comentario dice "no reintentar" pero se reintenta igual. Una venta fallida golpea la API para siempre. **El mismo patrón existe en `use-bitacora-sync-engine.ts:144,224`** — fix compartido.

### A-6. Updates optimistas offline sin rollback: drift permanente de consignación y contadores
**`cash-context.tsx:220-232,277-288` + `feria-context.tsx:94-108`** — decrementa consignaciones locales y sube `todaySales` optimistamente; si la venta encolada falla (409/4xx), ni el snapshot ni el contador se restauran. Peor: `feria-context.tsx:94-108` sobreescribe `db.feria_context` con el snapshot del server en cada refresh online, descartando silenciosamente decrementos de ventas no sincronizadas → ventas offline posteriores validan contra `pendiente` stale y el server las rechaza, sin ruta de reconciliación local.

### A-7. Servicios digitales extranjeros 100% exento: IVA autoliquidación (Ley 21.210) nunca declarado
**`gasto-extranjero.ts:40-167` + `parser-utils.ts:35-44` + `f29.ts:90-95,520`** — los 14 proveedores tienen `conIva: false` → `montoNeto=0, montoExento=total, montoIva=0` en todas las FC46. La maquinaria F29 para el crédito digital (código 511) existe (`impuestos.ts:100-105` la alimenta desde `facturas_compra`) pero recibe cero IVA siempre → `creditoDigital` permanentemente 0 y `montoNetoDigital` sobredeclarado 19%. Solo un override manual de `proveedores_config.con_iva=true` lo corrige.

### A-8. Tasa de cambio aplicada a fecha de PROCESO, no de factura (y el path por-fecha está roto)
**`receipt-parse.ts:48-53`** — siempre `fetchTasaDolar()`/`fetchTasaEuro()` sin fecha (tasa de hoy), mientras el período F29/RCV se deriva de la fecha del recibo (`gasto-pipeline.ts:319`). Batch de fin de mes procesa recibos de semanas atrás con la tasa de hoy → montos CLP, F29 línea 520 e IVA digital mal declarados. Y cualquier fix que use fecha chocará con el bug de formato (`tasa-cambio.ts:26` envía `YYYY-MM-DD`; mindicador solo acepta `DD-MM-YYYY` — ambos verificados en vivo).

### A-9. Transferencias Banco Chile: sin idempotencia y con secrets posiblemente encriptados enviados crudos al banco
**`banco-chile/transferencias.ts:68-74`** — construye `BancoChileClient` con `client_id/client_secret/username/password` leídos directo de la DB, bypaseando `resolveSecret`/`decryptSiiSecret` (usados en `banco-chile-client.ts:22-26`). Si los secrets se guardaron con `sealBancoSecrets` (AES-GCM), el endpoint envía el ciphertext al banco → auth siempre falla. Y el POST no tiene idempotency key ni check de `numero_operacion` existente → transferencias reales duplicadas si el cliente reintenta tras timeout.

### A-10. Cancelación de suscripción fire-and-forget: Flow puede seguir cobrando
**`subscription-manage-client.ts:41-47` + `subscriptions-checkout.ts:310-353`** — `cancelFlowInscription()` corre antes del PATCH, errores tragados (`console.warn`), y el PATCH marca `canceled` igual aunque Flow no canceló. Además `cancel-inscription` apunta a la inscripción **más reciente de cualquier plan** — con multi-plan (soportado explícitamente, :99-102) cancelar el plan A puede detener los cobros del plan B. El cliente cancela y le siguen cobrando mensual.

### A-11. Terminal SumUp cobra ANTES de registrar la venta, con monto del cliente
**`carrito-view.tsx:170-215` + `sumup-context.tsx:114-120` + `sumup/readers.ts:85-131`** — el flujo completa el checkout PAID del terminal primero, luego `cartSale` → `/quick`; si `/quick` falla (409 stock/consignación, 5xx, red) el cliente ya pagó sin venta ni acción compensatoria. El monto cobrado es el total del carrito local (catálogo downsync cada 60s puede estar stale) mientras `/quick` repricifica server-side → monto cobrado ≠ monto registrado. `readers.ts` acepta `amount` del cliente sin revalidar contra `productos.precio`. Solo `conciliacion.ts` (>2% drift) lo detecta post-hoc.

### A-12. `/quick` decrementa stock "forzado" sin guard `stock >= qty`: oversell por diseño
**`rep-ventas.ts:301-324` + `20260812100000_batch_stock_decrement.sql:25-28` + `80_campo_offline_sync.sql:10-13`** — `decrement_stock_force_batch` hace `UPDATE productos SET stock = stock - qty` sin `WHERE stock >= qty`; el caller loguea "Sobregiro de inventario en POS offline" y **continúa**. Cualquier rep (online u offline replay) puede vender cantidades ilimitadas desde un snapshot stale; stock negativo, inventario/DTE divergen, y estos decrementos ignoran los holds del checkout web. (Contraste: `decrement_stock` web SÍ tiene guard — `46_stock_lote_sync.sql:43-45`.)

### A-13. Checkout `/init` ignora los multipliers de `beneficios_enjambre` (usa defaults)
**`checkout.ts:331`** — `computeUnitPrice(basePrice, role, pastOrdersCount)` sin multipliers, mientras `cart-pricing-service.ts:86-100` y `actions/cart.ts:36-48` leen la config central. Si un admin cambia un multiplier (embajador/revendedor/suscriptor), el `unitPrice` del cliente (config) no matchea el del init → 409 `invalid_cart` → checkout roto; y los descuentos configurados mueren silenciosamente en el cobro (siempre usa defaults).

### A-14. `reserve_checkout_stock` es TOCTOU: dos customers pueden reservar las últimas unidades
**`79_ola3_checkout_ritual.sql:64-84`** — `SELECT stock` sin `FOR UPDATE`, suma holds, inserta. Dos `/init` concurrentes reservan los últimos items; el segundo commit cae en `decrement_stock` devolviendo 0 filas → `authorized: true` pero `ok: false` ("Pago autorizado pero no se pudo registrar la venta", checkout.ts:619-634): **dinero capturado sin orden**. Nota menor: si `stock` es NULL el loop hace CONTINUE (reserva silenciosamente saltada).

### A-15. Audit log de seguridad forjable + rate limiting in-memory + login de Campo sin límites
**`37_security_events_phase5.sql:25-32` + `security-events.ts:66-75` + `login-form.tsx:267` (campo) + `rate-limit/src/index.ts`** — (1) cualquier authenticated inserta `security_events` de cualquier tipo/email (anon: `login_failed`/`password_reset_requested`/`signup_success` de cualquier email) → tormentas de falsos `login_failed` contra una víctima contaminan `useSecurityAlerts`/`isRepeatedFailure`; el check de email-matching del BFF solo aplica a la ruta `/`. (2) El rate limit de tienda es un `Map` in-memory por-proceso → en Vercel serverless cada instancia tiene su contador (bypaseable). (3) Campo: login y reset de password llaman a Supabase Auth directo desde el cliente, sin rate limit, sin CSRF, sin BFF; `friendlySupabaseError` filtra mensajes que permiten enumeración de emails. (4) `login/route.ts` de tienda y `authMiddleware` de nucleo devuelven 401 sin registrar `security_events` server-side — la telemetría de fuerza bruta no existe en los paths principales.

### A-16. `is_new_client` controlado por el cliente → +3% de comisión inflada sistemáticamente
**`rep-ventas.ts:33` (`z.boolean().default(true)`) + `cash-context.tsx:214,263` + `30_tier_bonus_commission.sql:105-119`** — el toggle de UI decide el bonus de lealtad (`is_new_client = false` → +3%), nunca verificado contra el historial real del cliente. Un rep puede marcar todo como cliente repetido e inflar su propia comisión.

### A-17. `anular` (venta void): read-modify-write sin guard condicional → doble submit infla stock
**`rep-ventas.ts:812-848`** — el check de estado (`estado === "anulada"`, :776) no es atómico con el UPDATE (:845-848, sin `.eq("estado")`); dos voids concurrentes/reintentados restauran stock dos veces. Además las comisiones quedan en el ledger intencionalmente y el resumen de cierre (`expectedCash`) no se ajusta tras un void post-cierre.

### A-18. `cash_difference` calculada pero NUNCA persistida
**`cash-sessions.ts:126-127,141-151` + `campo/app/api/cash-sessions/[id]/close/route.ts:43-65`** — el UPDATE de cierre escribe `closing_cash_counted/status/closed_at`; la columna `cash_difference NUMERIC(19,4)` (migración 28:36) nunca se escribe. Los faltantes de caja no son auditables post-hoc; el dashboard ejecutivo (`dashboard-ejecutivo.ts:264-269`) y el CSV ven NULL siempre.

### A-19. Errores crudos (`error.message`) devueltos al cliente en ~30 rutas BFF
**Representativos: `inventario.ts:73,113,142,156,188,205,219`; `invitations.ts:65,150,171,...`; `commission-rules.ts:45,70,103,121`; `facturas-emitidas.ts:49,123`; `alambique.ts:105,119,135`; `comisiones.ts:21,89`; `admin-identidades.ts:195`; `notifications.ts:212`; `middleware.ts:84`; `mapa-publico.ts:51` (error de servicio externo); `banco-chile-client.ts:126`** — filtran nombres de constraints/columnas/funciones internas a cualquier usuario autenticado: combustible de reconocimiento para ataques dirigidos.

### A-20. F29: códigos fiscales mal etiquetados (503 para débito Y crédito; 511 para el crédito IVA-digital)
**`f29.ts:57-75`** — `DEBITO_FACTURAS_VENTA: 503` y `CREDITO_COMPRAS_NACIONALES: 503` son el mismo código (en el F29 oficial 503 es débito de ventas; los créditos de compras son 507/508, y 511 es el débito de servicios digitales, siendo el crédito autoliquidación 512). Hoy las líneas solo se despliegan (`impuestos.ts:204-218`), pero cualquier export/declaración futura aterrizaría crédito fiscal en las líneas de débito.

### A-21. Parser genérico: totales chilenos "$" parseados como USD (subvaluación 1000x)
**`receipt-parsers/generic.ts:11-19` + `parser-utils.ts:1-3`** — el patrón `/\$\s*([\d,]+\.?\d*)/` mapeado a USD matchea "Total $ 1.234.567" antes del patrón CLP; `parseUsdAmount` solo quita comas → "1.234.567" → 1.234 → convertido a tasa dólar. El hint `monedaInferida` (`receipt-orchestrator.ts:49-54`) resuelve "$" → "USD" y solo alerta cuando el proveedor es CLP. Montos 1000x menores, base imponible equivocada, sin flag de confianza.

### A-22. Gasto-idempotencia con falsos positivos: recibos legítimos descartados
**`gasto-idempotency.ts:5-20`** — key = `proveedorId | numeroDocumento || 'sin-numero' | fechaEmision | round(montoTotal)`. Los parsers frecuentemente devuelven `numeroDocumento` vacío (ej. Stripe si el regex `ch_/py_` falla, `stripe.ts:48-49`) → dos gastos reales del mismo día y mismo monto colapsan a una key → el segundo se descarta silenciosamente como "alreadyProcessed" → deducción y FC46 perdidas → F29 subdeclarado.

### A-23. Policies UPDATE de Storage sin `owner` check: compliance docs vulnerables
**`1005_certificados_sanitarios_bucket.sql:23-27`, `1009_bitacora_audio_bucket.sql:28-32`, `20260810160000_infusiones_tareas_equipo.sql:108-113`** — las tres `FOR UPDATE` usan `WITH CHECK (bucket_id = ...)` **sin `owner = auth.uid()`** (USING permite owner-or-admin): un usuario puede reescribir el `owner` de su objeto a cualquier UUID (transferir a víctima, o NULL = huérfano) y renombrar paths dentro del bucket. La de `infusiones-evidencias` se creó **después** de la remediación 20260614040700, copiando el patrón defectuoso. Certificados sanitarios y audio de bitácora: integridad/availability comprometida.

### A-24. `config_censo` creada SIN RLS
**`20260808020000_seguridad_p0_registro_territorial.sql:130-141`** — tabla sin `ENABLE ROW LEVEL SECURITY` ni policy. Los defaults de Supabase dan escritura anon/authenticated a tablas públicas nuevas (la convención del propio repo lo documenta en `993_zero_trust...` y `20260812081000_beneficios_enjambre.sql`) → un anónimo puede `UPDATE config_censo SET cierre = ...` y cambiar la fecha oficial de cierre del censo que se muestra en el hero.

### A-25. Órdenes Transbank pagadas-sin-commit: dinero capturado sin orden y sin recuperación automática
**`checkout.ts:576-650` + `lib/payments/types.ts:245-309`** — el commit es la única vía de saber que un pago tuvo éxito (Webpay no tiene webhook). Si el browser se cierra tras pagar, la sesión queda `pending`; `expireStaleCheckoutSessions` solo lo dispara el admin (no está schedulado) y marca `expired` liberando stock **sin crear venta** (no se "cura"); el dashboard `/integrity` solo inspecciona `status = completed` (`checkout.ts:884-967`) → las sesiones pagadas+expiradas son invisibles. Pérdida silenciosa de dinero salvo que el cliente contacte soporte en la ventana; el retry puede doble-cobrar.

---

## Parte 4 — Hallazgos MEDIOS (selección)

| # | Hallazgo | Ubicación |
|---|---|---|
| M-1 | Botones de dinero sin ref de in-flight: doble click = doble cobro/venta (cada click con `client_request_id` distinto → el dedup server no ayuda) | `checkout/ui.tsx:401-485`, `quick-sale-button.tsx:72-95`, `carrito-view.tsx:87-168` |
| M-2 | Reload Realtime del carrito puede tragarse un item recién agregado (lost update; `applyingRemoteRef` suprime el push local ~600ms sin re-encolar) | `cart-lines-context.tsx:146-159,125-138` |
| M-3 | Landing: GSAP/ScrollTrigger creados en `setTimeout` (2s/1.5s) tras cerrar `gsap.context()`, sin check de `cancelled` → leak de listeners al navegar rápido | `landing-view.tsx:216-264` |
| M-4 | `sessionStorage.setItem` sin try/catch: en Safari privado/quota-full lanza fuera de `startCartCheckout` → spinner "Conectando…" infinito (solo el retry del overlay de 18s salva) | `cart-checkout-client.ts:151-158` |
| M-5 | Terminal SumUp PAID pero registro fallido → el flujo vuelve a la grilla de pagos: re-run = 2º cobro; efectivo = doble cargo (terminal + caja); retry pierde el `sumup_checkout_id` (reconciliación rota) | `quick-sale-button.tsx:97-114` |
| M-6 | Errores de apertura/cierre de caja tragados (`console.error`); cierre con respuesta perdida deja la sesión "abierta" en UI para siempre, re-click lanza "Sin sesión" silencioso | `cash-session-panel.tsx:82-92,297-308` |
| M-7 | `cartSale` offline cuenta N ventas (online cuenta 1) y devuelve `total: 0` al consumidor | `cash-context.tsx:286,231` |
| M-8 | Upsync no FIFO entre status (errores viejos después de pendientes nuevos) → validaciones de consignación contra estado stale | `use-sync-engine.ts:80-84` |
| M-9 | Storage del carrito de Campo sin key versionada (tienda sí usa `oyz_tienda_cart_v1`); schema ya evolucionó una vez sin hook de migración | `cart-context.tsx:17-18` |
| M-10 | Wallet: fallback de secrets de dev en producción (`WALLET_QR_SIGNING_SECRET ?? 'oyz-wallet-dev'`, `WALLET_PASS_SECRET ?? 'dev-pass-secret'`) — si env vars faltan, cualquiera forja un QR guardian válido para cualquier userId | `wallet.ts:157,161,237,264` |
| M-11 | `b2b-publico.ts` sin auth: `POST /clientes` responde con `codigo_cliente` (credencial bearer de la tarjeta) + UUID por email/whatsapp sin verificación (ni OTP); `GET /clientes/:codigo` devuelve saldos de puntos/sellos a cualquiera; sin rate limit | `b2b-publico.ts:129-228,231-256` |
| M-12 | RUT de 9+ dígitos pasa `validarRUT` (sin cap de 8) → `RUTRecep` inválido en DTE 33 = rechazo SII; schema `factura-compra.ts:12` permite 12 chars | `rut.ts:20-29` |
| M-13 | Caratula con datos de resolución fabricados en silencio (`nro_resol ?? 0`, `fch_resol ?? '2024-01-01'`) cuando falta metadata CAF → rechazo/mal-asociación SII; debe fallar ruidosamente | `emit-factura-dte-from-row.ts:176-181`, `emit-factura-compra.ts:180-185` |
| M-14 | Fechas fiscales en hora UTC del server: boletas 00:00–03:00 Chile quedan fechadas el día anterior; comisiones diarias agrupadas por `created_at.slice(0,10)` UTC (shift hasta 4h vs día de negocio local) | `checkout-fulfill.ts:264`, `rep-ventas.ts:686-693` |
| M-15 | `validar_consignacion_feria` deja sondear la existencia de contrato/evento de feria de cualquier UUID; sibling read sin self-check | `67_feria_pos_consignacion.sql:22-101` |
| M-16 | N+1 en flujos de retribución B2B (2 awaits por fila; revertir parcial si falla a mitad) | `b2b.ts:270-333` |
| M-17 | Puntos de lealtad otorgados por trigger nunca revertidos en anulación (solo stock y consignación); ciclos void/quick inflan saldos | `41_canje_impacto_silent_loyalty.sql:243-300`, `rep-ventas.ts:754-862` |
| M-18 | SumUp client envía montos float (contrato de minor units no honrado) — latente hoy, futuro checkout off-by-100x | `packages/sumup/src/client.ts:116-131` |
| M-19 | Fallback UF hardcodeado (40766, era 2024) en PPM cuando `fetchTasaUF()` falla → PPM mal declarado | `impuestos.ts:116-121` |
| M-20 | Banco Chile: re-auth password-grant en cada expiración (refresh_token nunca usado; dos concurrentes re-auth, last-write-wins) | `banco-chile/src/client.ts:64-128` |
| M-21 | `roundCurrency` redondea a 4 decimales (sub-centavo CLP) — higiene, no defecto | `impuestos.ts:3-21`, `gastos.ts:65-69` |
| M-22 | `/quote` confía en `subtotal` del cliente (solo estimación; `/init` repricifica) | `checkout.ts:91-98,182-250` |

---

## Parte 5 — Defensas verificadas como correctas (no tocar)

- **Realtime**: todas las tablas de `supabase_realtime` tienen RLS y la entrega de `postgres_changes` se filtra por el RLS del suscriptor. `notification_events` es per-user. Sin publicaciones inseguras.
- **Service role key**: `createAdminClient()` solo en contextos server (route handlers, cron); ningún archivo "use client" lo importa; ninguna `NEXT_PUBLIC_` guarda un secreto real.
- **CSRF**: tienda → `validateCsrf` vía `guardMutation` en todas las rutas mutantes; nucleo → `csrfMiddleware` + CORS allow-list + Bearer; cookies SameSite=Lax.
- **Precios del checkout web**: `/init` recalcula TODO server-side desde `productos.precio` + rol JWT y rechaza cualquier mismatch del cliente (409 `invalid_cart`); el monto cobrado es el del server (`checkout-fulfill.ts:55,113`). Los totales del cliente jamás llegan al cargo.
- **Idempotencia donde importa**: replay offline dedupado por `buy_order = POS-{id}` + `vendedor_id` antes de cualquier side-effect (cuando no hay concurrencia); `decrement_stock` web con `WHERE stock >= qty`; `canjear_puntos_checkout` con `SELECT ... FOR UPDATE` + idempotente por venta; cargos recurrentes Flow dedupados por `flow_order` UNIQUE; jobs SII dedupados por `upsert onConflict empresa_id, idempotency_key`; SumUp sync por `upsert onConflict sumup_id`.
- **Folio FC46/Boleta 39**: RPC `sii_caf_next_folio` atómico con fail-closed al agotar rango + `UNIQUE(empresa_id, tipo_dte, folio)` → doble insert imposible.
- **Webhook Banco Chile**: HMAC-SHA256 sobre body crudo con compare en tiempo constante + dedup por evento con índice único + race manejada.
- **ROI y claims POS**: `/quick` repricifica server-side con cap de descuento 50% y restore de stock en fallo; el claim de venta POS fue endurecido (RPCs token-gated, anon solo lectura).
- **SQL injection en migraciones**: todo el SQL dinámico usa `format()` con `%I`/`%L` o strings estáticos; cero concatenación de input de usuario en EXECUTE.
- **RLS en módulos recientes**: `b2b_*`, `fid_*`, `perc_*`, `infusion_*`, wallet, loyalty — todas habilitadas con USING/WITH CHECK consistentes; `beneficios_enjambre` public-read/admin-write es deliberado.
- **patrón a replicar**: `get_user_impact_footprint` (93_guardian_impact_tier_referral.sql:16-19) y `registrar_devolucion_consignacion_feria` (70_:50) SÍ enforcean `auth.uid()` — el template de fix para C-5..C-7 y A-1..A-3.

---

## Parte 6 — Plan corregido y enriquecido (priorizado por impacto real)

> Diferencia clave con el plan original: el #1 (getSession) está ~90% hecho; las prioridades reales son **escalada de privilegios por signup**, **emisión de DTE sin role gate**, **RPCs de fidelización sin `auth.uid()`**, **folios CAF fuera de rango** y **duplicación de ventas por sync**.

### 🚨 HACER AHORA (riesgo de dinero/seguridad/fiscal — 1-2 días cada uno)

| # | Fix | Hallazgos |
|---|---|---|
| 1 | **Trigger `handle_new_user`**: eliminar el mapeo `app_source → roles privilegiados` (solo `cliente`/`tienda` por signup); quitar el email admin hardcodeado (lista en env/secrets); roles privilegiados solo vía invitación canjeada | C-1, C-2 |
| 2 | **Códigos de invitación**: policy `FOR SELECT` con `TO authenticated` + firmada por tenant y solo para códigos del propio tenant; sacar `invitation_codes` de `supabase_realtime`; rate limit en `/redeem`; nunca exponer `code` en respuestas | C-3 |
| 3 | **Role gate en rutas SII**: `requireProfileRole(["admin"])` (o `is_admin`) en `sii/*` — mínimo en `/dte/emitir`, `/certificacion/*`, `/caf/*` | C-4 |
| 4 | **Gate `auth.uid()` en las 6+ RPCs**: `redeem_loyalty_reward`, `agregar_puntos_usuario`, `solicitar_retiro_creador`, `aplicar_venta_feria_post_venta`, `cerrar_arqueo_feria`, `aplicar_codigo_creador` — forzar `p_user_id = auth.uid()` (o restringir GRANT a service_role; el BFF nucleo pasa `c.get("user")` y sigue funcionando) | C-5, C-6, C-7, A-1, A-2, A-3 |
| 5 | **Folio DTE 33**: usar el RPC atómico `sii_caf_next_folio` en `emitFacturaDteFromRow` (como FC46/39) + guard `folio >= desde` + fail-loud si no hay CAF (quitar `?? 0`/`?? '2024-01-01'`) | C-8, M-13 |
| 6 | **FC46**: `MontoItem = monto_neto` (consistencia `Qty×Prc = MontoItem`) o una sola fuente de verdad para línea/totales | C-10 |
| 7 | **Dedupe de ventas POS**: índice UNIQUE en `ventas(buy_order, vendedor_id)` + `ON CONFLICT DO NOTHING` en el insert + montar `useSyncEngine` una sola vez (quitar del modal o extraer el loop a un singleton) | C-9 |
| 8 | **getSession restante** (plan original #1 corregido): `redeem-invitation.ts:25` → `getUser()` primero; `useSidebarBadges.ts:322` → getUser (o ignorar sesión y suscribir con RLS) | plan #1 |
| 9 | **DTE XML**: bloque `<Signature>` DSig (XAdES) + `IndServicio` dinámico (null para venta de bienes) — coordinar con certificación SII | plan #2 |
| 10 | **Login Campo**: mover a BFF con rate limit + CSRF + logging server-side de `login_failed`; no filtrar mensajes de Supabase Auth al usuario | A-15 |

### 🔴 HACER PRONTO (correctitud y robustez — esta semana)

| # | Fix | Hallazgos |
|---|---|---|
| 11 | Tasa de cambio: retry (3) + fallback a cache expirado + última tasa en DB; **fix formato fecha** (`DD-MM-YYYY`) y aplicar tasa de la fecha de factura | plan #4, A-8 |
| 12 | Receipt parsers: fecha fallback → error explícito con UI de corrección manual | plan #5 |
| 13 | Quick sale retry-safe: `client_request_id` derivado del payload (no fresco por intento) + encolar a `sync_queue` cuando el request online falle ambiguamente | A-4, plan #6 |
| 14 | Errores terminales de sync: setear `next_retry_at` al marcar `error` (topar reintentos) — en `use-sync-engine` y `use-bitacora-sync-engine` | A-5 |
| 15 | Rollback de updates optimistas offline (snapshot + contador) al fallar la venta; no sobreescribir `feria_context` local con snapshot stale que descarte ventas pendientes | A-6 |
| 16 | IVA autoliquidación servicios digitales: `conIva` real por proveedor (Ley 21.210) + línea 511/512 F29 | A-7, A-20 |
| 17 | `reserve_checkout_stock` con `FOR UPDATE` (advisory lock) | A-14 |
| 18 | `/quick` con guard de stock (o flag `force` explícito solo para casos autorizados con alerta visible) | A-12 |
| 19 | `/init` leyendo multipliers de `beneficios_enjambre` (misma fuente que cart/actions) | A-13 |
| 20 | Persistir `cash_difference` en el cierre (ambas rutas, nucleo + campo) + guard `session_status = open` en la ruta de campo | A-18, M-6 |
| 21 | Botones de dinero con ref de in-flight (doble click no dispara 2º request) en checkout, quick-sale y carrito | M-1 |
| 22 | `<Image>` en header/footer de tienda | plan #7 |
| 23 | Limpiar dead code real: AxeAudit, GrainOverlay, runSiiSyncJob, getSeasonalContext, slugify, requireCsrfHeader | plan #9 |
| 24 | CI: agregar `compat-audit.mjs` post-build + `tsc --noEmit` + protection de branch | plan #10 |

### 🟡 HACER DESPUÉS (deuda técnica — próximas semanas)

| # | Fix | Hallazgos |
|---|---|---|
| 25 | RUT: largo mínimo 7 + cap 8 dígitos + normalizar/validar en `terceros.ts` antes de persistir (dedupe por RUT normalizado) | plan #3 corregido, M-12 |
| 26 | Audit trail server-side: registrar `login_failed`/401 en nucleo middleware y login de tienda; restringir INSERT de `security_events` al BFF | A-15 |
| 27 | Sanitizar errores BFF: mapear `error.message` → códigos (30 rutas) | A-19 |
| 28 | Storage buckets: `WITH CHECK (owner = auth.uid())` en las 3 policies UPDATE pendientes | A-23 |
| 29 | `config_censo` con RLS | A-24 |
| 30 | Job schedulado de `expireStaleCheckoutSessions` + integrar sesiones pagadas-expiradas al dashboard `/integrity` | A-25 |
| 31 | Suscripciones: cancelar Flow de la inscripción específica (no la más reciente de cualquier plan) + reintento server-side si el PATCH marca canceled sin confirmación Flow | A-10 |
| 32 | Banco Chile: `resolveSecret`/decrypt en transferencias + idempotency key + `numero_operacion` check | A-9 |
| 33 | F29 códigos 507/508/511/512 correctos | A-20 |
| 34 | Parser genérico: "$" sin moneda → CLP (y hint de moneda solo para USD explícito) | A-21 |
| 35 | Gasto-idempotencia: incluir `numeroDocumento` parseado correctamente (Stripe) y no colapsar `'sin-numero'` con el mismo día/monto | A-22 |
| 36 | Fechas fiscales en TZ Chile (America/Santiago), no UTC | M-14 |
| 37 | `is_new_client` derivado server-side del historial real del cliente | A-16 |
| 38 | `anular` con `.eq("estado", "no_anulada")` + ajuste de expectedCash post-cierre | A-17 |
| 39 | Wallet: fail-fast si faltan `WALLET_*_SECRET` en producción (sin fallbacks de dev) | M-10 |
| 40 | `b2b-publico` con OTP/verificación + rate limit + no devolver `codigo_cliente` sin auth | M-11 |
| 41 | Revertir puntos de lealtad en anulación | M-17 |
| 42 | Versionar storage del carrito de Campo + migración | M-9 |
| 43 | Cleanup GSAP en landing (kill de tweens diferidos) | M-3 |

### 🟢 ESTRATÉGICO (del plan original, sigue vigente)
- Staging Supabase con seed anonimizado · i18n para exportación · blockchain on-chain · GlassPanel unificado (cosmético) · completar `--chart-2/3` (cosmético) · auditoría formal de las 150+ funciones SD (ahora con playbook de las 6+ explotables).
