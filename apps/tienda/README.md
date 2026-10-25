# @enjambre/tienda — Fachada D2C, Portal de Clientes y Experiencia Sensorial

> **Puerto local:** `:3001` (Next.js 16 App Router)  
> **Arquitectura e ingeniería del sistema:** [`docs/TIENDA_ARQUITECTURA_INGENIERIA.md`](../../docs/TIENDA_ARQUITECTURA_INGENIERIA.md)  
> **Catálogo detallado de herramientas:** [`docs/TIENDA_HERRAMIENTAS_DETALLE.md`](../../docs/TIENDA_HERRAMIENTAS_DETALLE.md)  
> **Mapa del repositorio:** [`docs/REPO_MAP.md`](../../docs/REPO_MAP.md) · **Contratos cross-app:** [`docs/CROSS_APP.md`](../../docs/CROSS_APP.md) · **Flujo del dinero:** [`docs/MONEY_PATH.md`](../../docs/MONEY_PATH.md)

---

## 1. Rol en el Monorepo

`@enjambre/tienda` es la superficie pública y comercial de **Enjambre Legado**. Diseñada con una estética de alta gama, dark mode por defecto, tipografía Cormorant Garamond / Geist y poder silencioso (cero lenguaje de ONG o cooperativa).

Prioriza **lecturas ultra-baratas en caché (ISR y Storage CDN)** y delega todas las mutaciones costosas y de alta seguridad (checkout, validación de stock, pasarelas de pago, emisión fiscal SII y auditoría) en el BFF de Núcleo (`:3000`).

```
                    ┌─────────────────────────────────┐
                    │    apps/tienda (Next 16 :3001)  │
                    ├─────────────────────────────────┤
                    │ • E-Commerce D2C & Catálogo ISR │
                    │ • Carrito con Pricing Anti-Tamper│
                    │ • Hub de Clientes & Club Legado │
                    │ • Billetera & Pases Apple/Google│
                    │ • Degustación Sensorial CATA    │
                    │ • Biblioteca Científica & Origen│
                    └────────────────┬────────────────┘
                                     │ HTTP (Checkout / Auth / Webhooks)
                                     ▼
                    ┌─────────────────────────────────┐
                    │    apps/nucleo (Next 16 :3000)  │
                    │   BFF Hono & Soberanía Fiscal   │
                    └─────────────────────────────────┘
```

---

## 2. Tecnologías y Arquitectura

- **Framework Web**: Next.js 16 (React 19, App Router, Server Actions, layouts modulares).
- **Internacionalización**: `next-intl` con soporte nativo bilingüe (`es` / `en`) y detección automática en middleware.
- **Estilos & Diseño**: Tailwind CSS con tokens semánticos de `@enjambre/ui` (`bg-background`, `text-foreground`).
- **Animaciones**: GSAP para movimiento cinematográfico sutil y Framer Motion para micro-interacciones.
- **Imágenes**: Loader local `image-loader.ts` apuntando directamente a WebP en el CDN de Supabase Storage con `Cache-Control: 31536000` (cero transformaciones consumidas en Vercel).
- **Caché & Render**: ISR (Incremental Static Regeneration) con invalidación bajo demanda iniciada por Núcleo (`/api/revalidate` y `/api/cms/revalidate`).
- **Compatibilidad**: Capa de polyfills integrada para Safari / iOS 15.4+ (`LegacyBrowserPolyfills`).

---

## 3. Módulos y Rutas Principales

1. **Vitrina D2C & Catálogo**:
   - `/`: Portada institucional guiada por bloques del CMS.
   - `/catalogo`: Catálogo completo con filtrado por variedad botánica, formato y notas sensoriales.
   - `/producto/[slug]`: Ficha de producto con selector de formatos, atributos de laboratorio (humedad, Brix, HMF), perfil sensorial y trazabilidad de lote.
   - `/producto/[slug]/trazabilidad`: Origen botánico, mapa de recolección y hash de anclaje en blockchain Polygon Amoy.

2. **Carrito y Checkout Omnicanal**:
   - `/carrito`: Carrito persistente en `localStorage` con cálculo server-side anti-tampering (`calculateCartPricing`).
   - `/checkout`: Captura de dirección, cálculo de flete con `@enjambre/logistica`, canje de puntos, compensación por retorno de frascos y conexión con Flow o Transbank Webpay Plus.
   - `/checkout/resultado`: Confirmación de pago, puente de retorno 303 y descarga de Boleta Electrónica 39.

3. **Portal del Cliente (`/perfil`)**:
   - `/perfil`: Dashboard del cliente, nivel de membresía ("Guardián del Bosque") y árboles nativos apadrinados.
   - `/perfil/pedidos`: Historial de compras con tracking de courier en vivo y facturas DTE.
   - `/perfil/reposicion`: Administración de suscripciones recurrentes de miel de bosque.
   - `/perfil/circular`: Registro de devolución de envases de vidrio ($500 CLP por tarro retornado).
   - `/perfil/billetera`: Saldo de sellos y descarga de pases para Apple Wallet y Google Wallet.
   - `/perfil/ajustes`: Preferencias de notificación y solicitudes de privacidad ARCO bajo la Ley 21.719.

4. **Experiencias, Ciencia y B2B**:
   - `/cata/[codigo]`: Ficha interactiva de degustación y evaluación sensorial CATA (*Check-All-That-Apply*).
   - `/club-legado-del-bosque`: Portal de membresía universal y reserva de recolecciones exclusivas.
   - `/ciencia`: Catálogo de afirmaciones científicas botánicas trianguladas (`@enjambre/ciencia`).
   - `/origen`: Narrativa territorial de las colmenas en los bosques nativos de Chiloé.
   - `/experiencias`: Reserva de visitas guiadas, talleres y encuentros en el bosque.
   - `/alianzas/[segmento]` y `/mayorista`: Portales B2B para cafeterías, hoteles y tiendas gourmet.

---

## 4. Estructura de Directorios

```
apps/tienda/
├── app/                               ← Next.js 16 App Router
│   ├── (auth)/                        ← Login, registro y reseteo de clave
│   ├── actions/                       ← Server Actions (cart pricing, perfil, privacidad)
│   ├── alianzas/                      ← Landings para captación B2B
│   ├── api/                           ← Endpoints internos (revalidación ISR, auth, push)
│   ├── cata/[codigo]/                 ← Experiencia sensorial y cata de frascos
│   ├── checkout/                      ← Checkout y confirmación de pago
│   ├── perfil/                        ← Hub privado del cliente y Club Legado
│   ├── producto/[slug]/               ← Ficha técnica de producto y trazabilidad
│   └── page.tsx                       ← Portada principal D2C
├── components/
│   ├── auth/                          ← Formularios de autenticación
│   ├── perfil/                        ← Componentes del dashboard de cliente
│   └── shop/                          ← Componentes visuales de tienda y catálogo
├── lib/
│   ├── cms.ts                         ← Consulta de secciones editoriales cacheadas
│   └── shop/                          ← Servicios de catálogo, carrito, checkout y auth
├── messages/                          ← Diccionarios i18n (es.json, en.json)
└── middleware.ts                      ← Edge middleware (puente POST, seguridad, i18n)
```

---

## 5. Variables de Entorno

Copiar `.env.example` a `.env.local`:

| Variable | Requerida | Propósito |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima pública de Supabase. |
| `NEXT_PUBLIC_URL_NUCLEO` | Sí | URL base del BFF de Núcleo (ej. `http://localhost:3000`). |
| `INTERNAL_API_SECRET` | Sí | Clave para autenticar peticiones de revalidación ISR desde Núcleo. |
| `NEXT_PUBLIC_SITE_URL` | Opcional | URL canónica de la tienda en producción. |

---

## 6. Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo en :3001
pnpm --filter @enjambre/tienda dev

# Ejecutar suite de pruebas unitarias (Vitest)
pnpm --filter @enjambre/tienda test

# Verificar tipos de TypeScript
pnpm --filter @enjambre/tienda exec tsc --noEmit

# Compilar para producción (incluye auditoría de compatibilidad Safari/iOS 15)
pnpm --filter @enjambre/tienda build
```
