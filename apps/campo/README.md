# @enjambre/campo

Punto de venta (POS) móvil y ferial para revendedores (`rep_ventas`) de Enjambre Legado.

## Descripción

**Campo** es una Progressive Web App (PWA) de alta velocidad construida con Next.js 16, diseñada específicamente para operar en ferias rurales, eventos y zonas de Chiloé con conectividad nula o intermitente.

> [!IMPORTANT]
> **Arquitectura Canónica y Desambiguación:**  
> - **Es:** POS ferial offline-first con base de datos local Dexie para operadores y revendedores (`rep_ventas`).
> - **NO es:** El patio apícola. La gestión de apiarios, colmenas y bitácora vive en `apps/nucleo` bajo el rol `apicultor`.
> - **NO usa:** Ningún paquete `@enjambre/offline`. La lógica offline reside íntegramente en `src/lib/offline/`.
> - **Documento rector:** [`docs/CAMPO_OFFLINE.md`](../../docs/CAMPO_OFFLINE.md).

---

## 🏗️ Arquitectura Offline-First

```
UI POS (Carrito / Venta Rápida)
  ↓
Dexie DB Local (IndexedDB: productos, sync_queue, feria_context)
  ↓
useSyncEngine (Detección de red + Replay FIFO con backoff)
  ↓ POST /api/rep-ventas/ventas (con client_request_id idempotente)
Núcleo BFF (:3000)
  ↓
Supabase (Postgres 17 RLS)
```

- **Lecturas locales:** El catálogo ferial y precios se consultan desde Dexie, ahorrando cuota de egress en Supabase Free.
- **Escrituras locales:** Toda venta genera un registro atómico en `sync_queue` y descuenta stock local de consignación inmediatamente.
- **Idempotencia:** Cada transacción viaja con un `client_request_id` determinista para evitar dobles cobros o duplicidad de stock.

---

## 📦 Características Principales

1. **Venta Rápida y Carrito Ferial:** Catálogo visual con imágenes cacheadas y modo de venta por toques.
2. **Medios de Pago Integrados:**
   - Efectivo (con apertura, control de denominaciones y arqueo de caja).
   - Tarjeta (integración nativa con lectores SumUp vía `@enjambre/sumup`).
   - Transferencia bancaria.
3. **Comprobante Digital y Fidelización:** Generación de QR post-venta para canje de puntos y sellos en la Tienda (`/claim/...`).
4. **Cierres de Caja y Comisiones:** Arqueos ciegos, cálculo de incentivos de venta y sincronización con el ledger ferial.
5. **Cero Fuga Técnica:** Sin terminología de base de datos, comandos de consola ni detalles de desarrollo en pantalla.

---

## 🚀 Desarrollo y Ejecución

```bash
# Desde la raíz del monorepo
pnpm --filter @enjambre/campo dev    # Ejecuta en puerto :3002

# Build y auditoría de compatibilidad
pnpm --filter @enjambre/campo build
```

---

## 🔐 Variables de Entorno

| Variable | Obligatoria | Rol |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública anon |
| `NEXT_PUBLIC_NUCLEO_API_URL` | Sí | Origen del BFF en Núcleo para sync y caja |
| `NEXT_PUBLIC_URL_TIENDA` | Sí | URL de Tienda para generar enlaces QR de fidelización |
