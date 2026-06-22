# Comercio Soberano — App OYZ (no Shopify)

> **Enjambre Legado no migra a Shopify.** Construimos una aplicación comercial propia — estética editorial, filosofía biocultural, profundidad territorial chilena — usando las mejores apps de Shopify solo como **referente de mecánica**, nunca como destino.
>
> **Estado:** Especificación viva — Junio 2026  
> **Relacionado:** [`PLAN_COLOSAL.md`](./PLAN_COLOSAL.md) (hoja de ruta ejecutiva), [`CONSTITUTION.md`](./CONSTITUTION.md), [`SOBERANIA_FISCAL.md`](./SOBERANIA_FISCAL.md), [`WALLET_GUARDIAN.md`](./WALLET_GUARDIAN.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

## 1. Manifiesto

### 1.1 Qué rechazamos

- Migrar catálogo, checkout o admin a Shopify / WooCommerce.
- Themes genéricos que podrían ser cualquier marca de miel o skincare.
- Fidelización como “puntos abstractos” desconectados del producto y del bosque.
- Depender de 15 apps de terceros para lograr lo que es el alma del negocio.

### 1.2 Qué construimos

Un **comercio con inspiración**, donde:

1. **Cada pantalla** respira la estética OYZ (dark editorial, GSAP, grain, tipografía display).
2. **Cada transacción** enlaza a trazabilidad, impacto y legado del guardian.
3. **Cada mecánica comercial** (carrito, pago, envío, suscripción) es tan sólida como Shopify, pero **invisible** frente a la narrativa.
4. **Cada diferenciador** (ritual, ciclos, colmena, fiscal CL, feria) es nativo del monorepo, no un plugin.

### 1.3 Regla de oro por feature

> ¿Esto podría vivir en cualquier theme de Shopify?  
> **Sí** → implementarlo bien, sin ruido visual.  
> **No** → ahí vive la inspiración OYZ; prioridad de producto.

---

## 2. Shopify como referente (no como plataforma)

| Dimensión | Shopify | App OYZ |
|-----------|---------|---------|
| Propósito | Vender cualquier cosa | Vender **legado biocultural** |
| Cliente | Customer ID | **Guardian** con pasaporte, ritual, impacto |
| Producto | SKU + variantes | Lote, colmena, historia regenerativa |
| Post-compra | Email tracking | Boleta SII, trazabilidad, ciclos, wallet |
| Admin | Dashboard genérico | Núcleo: mapa, fiscal, feria, logística viva |
| Chile | Apps + integradores | Flow, Transbank, couriers nativos, DTE propio |

**Legacy Shopify en el repo:** purgado (`docs/TECHNICAL_DEBT.md` D1). El parser `shopifyParser` en `@enjambre/contable` sirve solo para **gastos** (factura del SaaS), no para ventas.

---

## 3. Top apps Shopify → inspiración OYZ

Mapeo de las categorías más instaladas en Shopify Plus / D2C premium → **qué ya tenemos**, **qué adaptamos con alma OYZ**, **qué falta**.

| App / categoría Shopify | Qué resuelve | Equivalente OYZ | Estado | Inspiración OYZ (más allá del app) |
|-------------------------|--------------|-----------------|--------|-------------------------------------|
| **ReCharge / Skio / Bold Subscriptions** | Cobro recurrente, skip, dunning | Ritual Mensual (`subscription_plans`, `subscriptions`) | 🟡 1er pago | Ritual con **ciclo regenerativo**, selección de colmena, pausa consciente |
| **Smile.io / LoyaltyLion** | Puntos, tiers, referrals | `ciclos`, `puntos_fidelizacion`, `user_tier_view`, referidos | 🟡 | **Ciclos del néctar** + tier OBRERA→COLMENA, no “bronze/silver” genérico |
| **Stamp Me / Fivestars / Loopy Loyalty** | Tarjeta sellos “compra X, gratis 1” | `descuentos.buy_x_get_y` (schema) | ⬜ | **Sellos por producto** en Wallet + “te falta 3 sachets” — ver [`WALLET_GUARDIAN.md`](./WALLET_GUARDIAN.md) |
| **Klaviyo / Omnisend** | Email flows, segments | `notification_queue`, cart abandonment, transactional | ✅ | Copy biocultural; segmentos por tier guardian y ritual |
| **Judge.me / Okendo** | Reviews + UGC | `resenas_sensoriales`, creadores | 🟡 | **Huella sensorial** (cristalización, familia aromática), no estrellas vacías |
| **Loox / Archive** | UGC en PDP | Portal creador, `creador_contenido` | ✅ | Contenido de guardianes y aliados del bosque |
| **Route / AfterShip / Malomo** | Tracking branded | `@enjambre/logistica`, BlueExpress default | 🟡 | Tracking + narrativa de despacho desde Chiloé |
| **Gorgias / Re:amaze** | Support inbox | — | ⬜ | Fase 2: soporte con contexto de lote y pedido |
| **Privy / Justuno** | Popups descuento | — | ⬜ | Rechazado en landing editorial; descuentos en checkout/perfil |
| **Yotpo SMS** | SMS post-compra | `notification_queue` | 🟡 | WhatsApp/SMS Chile fase 2 |
| **PassKit / Wallet Connect** | Apple/Google Wallet | — | ⬜ | **Tarjeta Guardian** — spec en [`WALLET_GUARDIAN.md`](./WALLET_GUARDIAN.md) |
| **Bold Upsell / ReConvert** | Post-purchase upsell | — | ⬜ | Upsell ritual / reserva cosecha en página éxito |
| **SearchPie / Boost AI Search** | Search & discovery | GIN `productos.nombre`, filtro cliente | 🟡 | Búsqueda por origen, lote, impacto |
| **Shogun / PageFly** | Landing builder | `site_content` + GSAP landing | ✅ | Editorial soberano, no drag-and-drop genérico |
| **Stamped.io** | Social proof | JSON-LD, impacto métricas | 🟡 | Prueba social = **impacto medible** (árboles, CO₂) |

**Leyenda:** ✅ listo · 🟡 parcial · ⬜ por construir

---

## 4. Pilares de la app (profundidad vs Shopify)

### 4.1 Estética — comercio editorial

- Dark mode bosque (`CONSTITUTION.md` §II.1).
- Checkout y perfil como **ritual**, no formulario SaaS.
- Micro-interacciones GSAP; grain en páginas públicas.

**En código:** `apps/tienda/app/landing-view.tsx`, `checkout/ui.tsx`, `GuardianSidebar`.

### 4.2 Filosofía — cada compra es un acto

| Modo | Significado | Implementación |
|------|-------------|----------------|
| **Legado** | Cuenta, historial, impacto, wallet | `buyer_mode: legado`, `/perfil/*` |
| **Privada** | Compra sin cuenta, dignidad del ritual | `buyer_mode: privada` |
| **Ritual** | Suscripción = ciclo, no cargo anónimo | `/perfil/ritual` |

### 4.3 Mecánica soberana (infra invisible)

| Mecánica | Paquete / ruta | Notas |
|----------|----------------|-------|
| Carrito | `carrito_items`, `@enjambre/pricing` | ✅ |
| Checkout + pagos | `checkout.ts`, Flow/Transbank | ✅ |
| Couriers CL | `@enjambre/logistica` | 🟡 costo envío = 0 hoy |
| Fiscal venta | `checkout-fulfill` + DTE 39 | 🟡 |
| Stock | `decrement_stock` at fulfill | 🟡 sin reserva en init |

---

## 5. Sistemas de fidelización (estado honesto)

OYZ tiene **tres capas** que Shopify mezcla en una sola app de loyalty:

| Sistema | Tablas / vistas | Propósito | Estado wiring |
|---------|-----------------|-----------|---------------|
| **Ciclos** | `ciclos`, `ciclos_canjeados`, `user_ciclos_balance` | Ledger inmutable; tier OBRERA→COLMENA | 🟡 trigger POS claim; web fulfill incompleto |
| **Puntos** | `puntos_fidelizacion`, `puntos_transacciones` | Puntos por compra, canje descuento | 🟡 UI checkout cosmética; RPC no en fulfill |
| **Sellos producto** | `descuentos.buy_x_get_y` | Compra X unidades → 1 gratis | ⬜ sin ledger de progreso por usuario/producto |

**Deuda crítica (P0 producto):**

1. ~~`fulfillCheckout` no llama `agregar_puntos_usuario`~~ → **Resuelto Ola 0** (`loyalty-fulfill.ts`).
2. ~~Checkout envía carrito sin `puntosACanjear`~~ → **Resuelto Ola 0** (mig 76 + BFF).
3. Progreso “te falta N de producto X” **no existe** aún — requisito del Wallet Guardian (Ola 2).
4. **Pendiente ops:** aplicar migración `76_ola0_loyalty_checkout.sql` en prod.

---

## 6. Roadmap de profundidad (orden sugerido)

| Fase | Entregable | Supera a Shopify en… |
|------|------------|----------------------|
| **A** | Cerrar loop puntos + ciclos en checkout/fulfill | Honestidad del guardian (hoy promete más de lo que cumple) |
| **B** | Programas sello por producto (`guardian_stamp_progress`) | Stamp apps + narrativa por SKU (sachet, frasco 150g…) |
| **C** | Wallet iOS/Android ([`WALLET_GUARDIAN.md`](./WALLET_GUARDIAN.md)) | PassKit nativo con progreso visible en el bolsillo |
| **D** | Motor Ritual (renovación + entregas) | ReCharge con historia, no solo recurring charge |
| **E** | Tarifas envío + API BlueExpress | Route/AfterShip con couriers CL reales |
| **F** | Variantes SKU + colecciones vivas | Paridad catálogo sin perder trazabilidad por lote |

---

## 7. Arquitectura objetivo (comercio en el monorepo)

```
┌─────────────────────────────────────────────────────────────────┐
│  TIENDA — experiencia guardian (D2C)                            │
│  landing · catálogo · PDP trazabilidad · checkout · perfil      │
│  wallet pass download · ritual · mi-legado                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ BFF Hono (nucleo)
┌────────────────────────────▼────────────────────────────────────┐
│  NÚCLEO — operación + fiscal + logística                        │
│  productos · ventas · logistica_envios · subscriptions cron     │
│  wallet pass signer (Apple/Google) · stamp progress API         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  PACKAGES                                                       │
│  @enjambre/pricing · @enjambre/logistica · @enjambre/contable   │
│  @enjambre/wallet (nuevo) — PassKit + Google Wallet JWT         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  POSTGRES — fuente de verdad                                    │
│  ventas · checkout_sessions · ciclos · puntos_fidelizacion      │
│  guardian_stamp_programs · guardian_stamp_progress (fase B)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Decisiones documentadas

| ID | Decisión | Rationale |
|----|----------|-----------|
| CS-1 | No migrar a Shopify | Soberanía de datos, fiscal CL, trama, marca |
| CS-2 | Shopify apps = checklist inspiración | Evitar reinventar carrito/pagos; sí reinventar significado |
| CS-3 | Tres capas loyalty (ciclos, puntos, sellos) | Shopify usa una; OYZ separa tier vital, descuento y promoción por producto |
| CS-4 | Wallet como canal primario del guardian | Stamp apps viven en email; OYZ en el bolsillo + QR en feria/POS |
| CS-5 | BlueExpress default courier | [`@enjambre/logistica`](../packages/logistica/src/couriers.ts) |

---

*Última actualización: Junio 2026*