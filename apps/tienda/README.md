# 🍯 OYZ Tienda - Frontend de E-commerce

## Descripción

**Tienda** es el frontend público del e-commerce de La Obrera y el Zángano. Construido con Next.js 16, enfocado exclusivamente en la experiencia de compra del cliente.

## 🎯 Enfoque Actual

Esta aplicación **SOLO** maneja:
- ✅ Catálogo público de productos
- ✅ Checkout y carritos
- ✅ Perfiles de cliente (pedidos, perfil, ajustes)
- ✅ Landing pages (Nosotros, Contacto, Impacto)
- ✅ API de checkout (webhooks, init, commit)

**NO incluye:**
- ❌ Panel de administración (ver `apps/nucleo`)
- ❌ Gestión de productos (ver `apps/nucleo`)
- ❌ Gestión de pedidos (ver `apps/nucleo`)
- ❌ Dashboard de métricas (ver `apps/nucleo`)

## 🏗️ Arquitectura

```
apps/tienda (Frontend)
  ↓
apps/api (BFF - Backend for Frontend)
  ↓
Supabase (Database)
```

## 📦 Estructura

```
apps/tienda/
├── app/
│   ├── api/
│   │   └── checkout/       # Endpoints de checkout
│   ├── catalogo/           # Página de catálogo
│   ├── checkout/           # Proceso de checkout
│   ├── producto/[slug]/    # Página de producto
│   ├── perfil/             # Perfil de cliente
│   ├── login/              # Login
│   ├── register/           # Registro
│   ├── nosotros/           # Página institucional
│   ├── contacto/           # Contacto
│   ├── impacto/            # Impacto regenerativo
│   └── page.tsx            # Landing page principal
├── components/
│   ├── shop/               # Componentes de tienda
│   ├── auth/               # Componentes de auth
│   └── providers/          # Providers de React
├── lib/                    # Utilidades
└── utils/
    └── supabase/           # Cliente Supabase
```

## 🚀 Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm --filter @enjambre/tienda dev

# Build
pnpm --filter @enjambre/tienda build

# Producción
pnpm --filter @enjambre/tienda start
```

## 🔐 Autenticación

La autenticación usa Supabase Auth. Los clientes pueden:
- Registrarse con email/password
- Iniciar sesión
- Recuperar contraseña
- Gestionar su perfil

## 🛒 Carrito y Checkout

### Carrito (P0 — Jun 2026)

| Capa | Implementación |
|---|---|
| Persistencia local | `localStorage` key `oyz_tienda_cart_v1` |
| Precios server-side | Server Action `calculateCartPricing` (solo `product_id` + `quantity`) |
| Preview en UI | `useCartPricing()` en checkout → debounce 300ms (inactivo en catálogo) |
| Abandono | `POST /api/cart/abandonment` → `cart_abandonment_events` (snapshot validado con Zod) |

El checkout en Núcleo **re-verifica** precios y stock; el preview en tienda es UX, no autoridad de pago.

### Notificaciones (P1)

Tras registro, `POST /api/notifications/welcome` (server, sesión `getUser()`) proxea a Nucleo `POST /api/notifications/internal/welcome`. La cola `notification_queue` registra el evento; `notification_events` alimenta el NotificationBell.

### Checkout

El checkout soporta:
- Transbank Webpay (vía BFF Núcleo `POST /api/checkout/init|commit`)
- Flow.cl (provider alternativo)
- Sesiones en Postgres (`checkout_sessions`, migration 38)

## 📱 Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page principal |
| `/catalogo` | Catálogo de productos |
| `/producto/[slug]` | Detalle de producto |
| `/checkout` | Proceso de compra |
| `/perfil` | Perfil de cliente |
| `/perfil/pedidos` | Historial de pedidos |
| `/login` | Inicio de sesión |
| `/register` | Registro |

## 🌐 Producción

URL: `https://obrerayzangano.com`

## 📚 Documentación Relacionada

- **Panel de Administración:** `apps/nucleo/README.md`
- **API:** `apps/api/README.md`
- **Migración Admin:** `MIGRACION-ADMIN-SHOPIFY.md`

## 🔄 Histórico

- **2025:** Admin panel incluido en esta app
- **2026-05:** Admin movido a `apps/nucleo` para centralización
- **2026-05:** API de admin movida a `apps/api`
- **2026-06:** Auditoría de Arquitectura (Migración a `next/image` nativo por performance LCP, adición de Security Headers en `next.config.ts` y adopción de App Router Error Boundaries en Productos).

## 🛡️ Mejores Prácticas (Obligatorio)

- **Imágenes (LCP & CLS):** Todo asset visual pesado DEBE usar el componente `<Image>` (`next/image`) con soporte para `priority` y atributos `sizes` correctos. Queda estrictamente desaconsejado el uso de `<img>` nativo, ya que Supabase Storage está explícitamente habilitado en el `next.config.ts`.
- **Manejo de Errores (App Router):** En vez de usar envoltorios `try-catch` que retornen UI condicionada, deja que el framework maneje las excepciones. Utiliza `error.tsx` para fallos de red y el comando `notFound()` de `next/navigation` delegando a `not-found.tsx` en páginas dinámicas.
- **Seguridad Perimetral:** Toda nueva ruta o asset asume el control del Content Security Policy y encabezados Strict (HSTS) inyectados automáticamente desde el `next.config.ts`.

---

**Enfoque:** Solo frontend de ventas. Todo el back-office en Nucleo.
