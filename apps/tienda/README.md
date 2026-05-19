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

## 🛒 Checkout

El checkout soporta:
- Transbank Webpay
- MercadoPago (próximamente)
- Checkout flow asíncrono con webhooks

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

---

**Enfoque:** Solo frontend de ventas. Todo el back-office en Nucleo.
