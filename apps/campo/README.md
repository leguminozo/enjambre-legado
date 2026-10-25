# @enjambre/campo — Terminal POS Ferial y de Terreno

> **Punto de venta (POS) móvil, ferial y offline-first para representantes comerciales (`rep_ventas`) y administradores de Enjambre Legado.**

---

## 📖 Documentación Canónica

Para un entendimiento técnico profundo del funcionamiento interno de Campo, consulta los documentos rectores:

1. [**Arquitectura e Ingeniería de Campo**](../../docs/CAMPO_ARQUITECTURA_INGENIERIA.md) — Tratado exhaustivo sobre el motor Dexie (v1 a v7), Service Worker Serwist, pipeline bidireccional de sincronización asíncrona, control de memoria en dispositivos legacy (iPhone 7 / 2GB RAM) e integración con el BFF de Núcleo.
2. [**Catálogo Exhaustivo de Herramientas de Campo**](../../docs/CAMPO_HERRAMIENTAS_DETALLE.md) — Análisis minucioso de las 24 herramientas, pantallas, modales y flujos operativos (catálogo rápido, carrito, pistola láser, arqueo ciego de caja, salvoconducto DTE 52, mermas, terminal SumUp, WhatsApp receipts, escuela ferial y comisiones).
3. [**Persistencia Offline en Terreno**](../../docs/CAMPO_OFFLINE.md) — Leyes de persistencia local y válvulas de egress en Supabase Free.

---

## ⚠️ Desambiguación Operativa Crítica

- **Es:** El POS ferial offline-first utilizado por el equipo comercial en ferias, exposiciones y puntos de venta móviles de Chiloé.
- **NO es:** El patio apícola. La gestión de colmenas, apiarios y la bitácora apícola reside en `apps/nucleo` bajo el rol `apicultor`.
- **NO existe:** Ningún paquete `@enjambre/offline`. Toda la persistencia local reside íntegramente en `src/lib/offline/db.ts`.
- **Vocabulario Sagrado:** **Recolección**, jamás "cosecha". Estética de poder silencioso y lujo territorial (sin jerga de ONG, cooperativa o prédica ecológica).

---

## 🏗️ Arquitectura de Flujo de Datos

```
[ Interfaz POS (Catálogo / Carrito) ]
               │
               ▼
   [ Validación de Consignación ]
      (feria-offline.ts)
               │
               ▼
   [ Dexie DB: CampoPOSDatabase ] ◄── (Downsync reactivo con TTL)
    ├── productos & variantes
    ├── feria_context (consignación)
    ├── sync_queue (FIFO idempotente)
    ├── meta, escuela & recibos
               │
               ▼ (Al detectar conexión a internet)
   [ Motor de Sincronización ]
      (use-sync-engine.ts)
               │
               ▼ POST /api/rep-ventas/* (con client_request_id determinista)
   [ Núcleo BFF (:3000) ]
               │
               ▼
   [ Supabase (Postgres 17 RLS) ]
```

---

## 📁 Estructura del Proyecto

```
apps/campo/src/
├── app/
│   ├── api/wallet/qr-resolve/   # Proxy interno BFF para resolución de pasaporte QR
│   ├── auth/callback/           # Callback de autenticación OAuth / Magic link
│   ├── caja/                    # Control de caja, apertura y arqueo ciego
│   ├── comisiones/              # Acceso directo al libro mayor de comisiones
│   ├── escuela/                 # Escuela ferial, modo atril y banco de objeciones
│   ├── leaderboard/             # Ranking semanal del equipo comercial
│   ├── login/                   # Formulario de autenticación sanitizado
│   ├── mi-feria/                # Portal de evento, inventario consignado y DTE 52
│   ├── pos/
│   │   ├── carrito/             # Carrito multi-producto, combos y checkout
│   │   ├── catalogo/            # Catálogo visual de venta rápida de un toque
│   │   └── historial/           # Historial de ventas, comisiones y datos bancarios
│   ├── layout.tsx               # Root layout con Serwist PWA y Auth Provider
│   └── middleware.ts            # Guard de rutas protegidas para rol rep_ventas y admin
├── components/
│   ├── layout/                  # Shells visuales, bottom navigation y header móvil
│   ├── leaderboard/             # Componentes del ranking semanal
│   ├── mi-feria/                # Paneles del portal de feria y salvoconducto
│   └── pos/                     # Componentes del terminal POS:
│       ├── cart-context.tsx     # Contexto global del carrito
│       ├── cart-math.ts         # Cálculo puro de totales, combos y descuentos
│       ├── cash-context.tsx     # Contexto de caja, ventas y arqueo
│       ├── continuous-stream-scanner.tsx # Lector QR/código de barras por cámara
│       ├── guia-cata-modal.tsx  # Modal interactivo de perfil organoléptico
│       ├── retorno-envases-modal.tsx # Canje de frascos retornables ($500 CLP)
│       ├── sumup-context.tsx    # Integración con lectores de tarjeta SumUp
│       ├── sumup-terminal-flow.tsx # Flujo guiado de cobro con terminal
│       ├── sync-queue-modal.tsx # Inspección de la cola de sincronización local
│       └── thermal-receipt.tsx  # Renderizador de recibo térmico 58mm/80mm
├── hooks/
│   ├── use-barcode-gun.ts       # Detección de pistolas lectoras físicas por hardware
│   └── use-sync-engine.ts       # Motor bidireccional de sincronización asíncrona
├── lib/
│   ├── cash-suggestions.ts      # Cálculo inteligente de vuelto en billetes chilenos
│   ├── offline/
│   │   ├── db.ts                # Esquema Dexie v1-v7 y cierre cooperativo
│   │   └── feria-offline.ts     # Validación local y decremento optimista de stock
│   └── pos-receipt.ts           # Generador de comprobantes digitales WhatsApp
└── sw.ts                        # Service Worker Serwist para PWA y notificaciones push
```

---

## 🛠️ Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo en puerto 3002
pnpm --filter @enjambre/campo dev

# Ejecutar suite de pruebas unitarias (Vitest)
pnpm --filter @enjambre/campo test

# Verificación estricta de tipos de TypeScript
pnpm --filter @enjambre/campo exec tsc --noEmit

# Compilación de producción y auditoría de compatibilidad (iOS 15 / Safari)
pnpm --filter @enjambre/campo build
```

---

## 🔐 Variables de Entorno

| Variable | Requerida | Propósito |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Endpoint de la instancia de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima pública de Supabase |
| `NEXT_PUBLIC_NUCLEO_API_URL` | Sí | URL del BFF en Núcleo (ej. `http://localhost:3000`) |
| `NEXT_PUBLIC_URL_TIENDA` | Sí | URL de Tienda para generar enlaces QR de reclamo (`/claim/...`) |
