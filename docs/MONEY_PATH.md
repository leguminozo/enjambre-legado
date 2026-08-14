# Camino del dinero

> **Clase: VIVO.** Dónde entra plata, dónde se persiste, dónde se emite DTE, dónde se puede perder.
> Specs: [`COMERCIO_SOBERANO.md`](./COMERCIO_SOBERANO.md), [`CIERRES_CAJA_COMISIONES.md`](./CIERRES_CAJA_COMISIONES.md), [`SOBERANIA_FISCAL.md`](./SOBERANIA_FISCAL.md). Contratos: [`CROSS_APP.md`](./CROSS_APP.md).

## Principio

El cliente **nunca** fija el precio que se cobra. Tienda y Campo mandan `product_id` + `qty` (+ rol JWT). El server recalcula. Un mismatch → 409. El estado de pago vive en Postgres (`checkout_sessions`, `ventas`), no en memoria de función.

## 1. Web (Tienda → Núcleo)

```
Carrito (localStorage guest ↔ carrito_items si login)
  → Server Action / preview pricing (@enjambre/pricing)
  → POST {NUCLEO}/api/checkout/init
       · JWT opcional (B2B / oyz_role)
       · precios desde productos
       · hold de stock (TTL)
       · insert checkout_sessions (pending)
       · init Flow | Transbank  (PAYMENT_PROVIDER)
  → usuario paga en el PSP
  → webhook POST /api/webhooks/flow|transbank
       · Flow: firma
       · Transbank: commit(token_ws)  (no HMAC)
  → fulfillCheckout  (idempotente por buy_order)
       · venta
       · decrement_stock (con guard)
       · loyalty / stamps / creador
       · boleta 39 si SII_AUTO_EMIT_BOLETA=true y hay CAF
       · enqueue mail + in_app
  → /checkout/resultado
```

Si el webhook no llega: cron diario `/api/cron/checkout` + trigger admin. No inventes un cron de 60 s.

**Atascadero conocido:** pago capturado en PSP y `checkout_sessions` sigue `pending` (auditoría A-25). Recuperación = replay de fulfill con la misma `buy_order`, nunca un init nuevo.

## 2. POS / feria (Campo)

```
UI → Dexie (CAMPO_OFFLINE)
  → POST {NUCLEO}/api/rep-ventas/quick  (o cola al volver la red)
       · client_request_id ESTABLE (no UUID fresco en retry)
       · consignación feria si aplica
       · decrement_stock_force (puede ir negativo — deuda consciente)
  → comisión / streak / tier
  → QR claim → Tienda
```

Efectivo y SumUp son canales del POS, no un segundo checkout web. Caja: `cash-sessions` (Campo reescribe al BFF).

## 3. Reposición / club

Suscripción en Postgres. Cargo Flow recurrente + dunning en cron 14:00 UTC. Un mail `past_due` con dedupe. Portal del cliente en `/perfil/reposicion`.

## 4. Después de la venta (mismo ledger)

| Paso | Dónde | Idempotencia |
|---|---|---|
| Stock | RPC `decrement_stock` / batch | web con `WHERE stock >= qty`; POS force no |
| Puntos / sellos | pricing + wallet RPCs | por `venta_id` / `buy_order` |
| Código creador | `creadores` + triggers | no confiar en `p_monto` del client — auditoría |
| DTE | `@enjambre/fiscal` jobs | `idempotency_key` por empresa |
| Despacho | `@enjambre/logistica` | mail `shipment_dispatched:{id}:{status}` |
| Banco | matching `banco-chile` | no pisa Flow web aún (ESTADO_DEL_ARTE) |
| Reembolso / NC 61 | fiscal + PSP reverse | no está cerrado de punta a punta |

## 5. Qué no hacer

- Cobrar en Tienda con un SDK de PSP en el browser.
- Confiar en `ventas.total` mandado por Campo/Tienda.
- Re-init de checkout para “recuperar” un pago ya autorizado.
- Service role desde Campo para “saltear RLS” en una venta.
- Segundo provider de facturación (Wasabil, etc.) — decisión soberana.

Pruebas mínimas al tocar esto: Vitest de `checkout*.test.ts`, `webhooks.test.ts`, `subscriptions-checkout.test.ts` + smoke Playwright de checkout. [`QA_STRATEGY.md`](./QA_STRATEGY.md).
