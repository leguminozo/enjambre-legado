# @enjambre/nucleo — Cerebro Operativo, BFF y Gestión Territorial

> **Puerto local:** `:3000` (Next.js 16 App Router)  
> **Arquitectura e ingeniería del sistema:** [`docs/NUCLEO_ARQUITECTURA_INGENIERIA.md`](../../docs/NUCLEO_ARQUITECTURA_INGENIERIA.md)  
> **Catálogo detallado de herramientas:** [`docs/NUCLEO_HERRAMIENTAS_DETALLE.md`](../../docs/NUCLEO_HERRAMIENTAS_DETALLE.md)  
> **Funcionamiento interno por rol en código:** [`docs/NUCLEO_ROLES_Y_FUNCIONAMIENTO_INTERNO.md`](../../docs/NUCLEO_ROLES_Y_FUNCIONAMIENTO_INTERNO.md)  
> **Mapa del repositorio:** [`docs/REPO_MAP.md`](../../docs/REPO_MAP.md) · **Contratos cross-app:** [`docs/CROSS_APP.md`](../../docs/CROSS_APP.md)

---

## 1. Rol en el Monorepo

`@enjambre/nucleo` es el centro de control soberano de **Enjambre Legado**. Alberga el único plano de escritura caro de la plataforma (BFF construido con Hono), la administración de operaciones apícolas, el censo territorial de Chiloé, la emisión tributaria electrónica ante el SII y el motor de contenidos de la tienda web.

```
                      ┌─────────────────────────────────┐
                      │    apps/nucleo (Next 16 :3000)   │
                      ├─────────────────────────────────┤
                      │ • Hono BFF (/api/[[...routes]]) │
                      │ • Dashboard Administrativo      │
                      │ • Patio Apícola & Dexie Sync    │
                      │ • Registro Territorial Chiloé   │
                      │ • DTE Nativo SII & Banco Chile  │
                      │ • Editor Visual CMS Tienda Web  │
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │   17 Packages compartidos        │
                      │   Supabase Postgres 17 + PostGIS│
                      └─────────────────────────────────┘
```

---

## 2. Tecnologías y Arquitectura

- **Framework Web**: Next.js 16 (React 19, App Router, layouts `(auth)` y `(dashboard)`).
- **Backend-for-Frontend (BFF)**: Hono montado en `/api/[[...routes]]/route.ts` con más de 50 módulos de rutas, validación Zod y Zero-Trust JWT verification.
- **Base de Datos & Auth**: Supabase (Postgres 17, PostGIS para geolocalización, Row Level Security estricto, Storage buckets).
- **Persistencia Offline**: Dexie.js (`NucleoBitacoraDB`) para bitácora apícola offline en terreno con cola de sincronización e ingesta de audio.
- **Inteligencia Artificial**: Groq (Whisper STT para transcripción apícola + extracción de entidades bajo contexto cerrado `user_registry_only`).
- **Cartografía**: Leaflet + Open-Meteo proxy para fenología y clima de Chiloé.
- **Estilos**: Tailwind CSS con tokens semánticos de `@enjambre/ui` (`bg-background`, `text-foreground`).
- **Auditoría & Compatibilidad**: Polyfills integrados para Safari/iOS 15.4+ (`LegacyBrowserPolyfills`).

---

## 3. Módulos y Capacidades Operativas

1. **Patio Apícola y Bitácora Offline (`/colmenas`)**:
   - Registro de colmenas, apiarios propios O&Z, estado de reinas, sanidad (varroa) y floración.
   - Motor offline en terreno con Dexie (`NucleoBitacoraDB`): grabación de audio local, reconciliación de IDs al conectar y transcripción asistida por IA.
   - Declaraciones oficiales para el SAG (`/declaracion-sag`).

2. **Gobernanza Territorial de Chiloé (`/registro-territorial`, `/territorio`)**:
   - Registro de apicultores residentes, trashumantes, predios facilitadores e inspectores.
   - Alertas fitosanitarias inmediatas: cálculo geoespacial (Haversine) de apiarios afectados por aplicaciones de pesticidas.
   - Evaluación de distancias legales y capacidad de carga apícola por comuna.

3. **Producción, Alquimia y Costeo (`/produccion`, `/costeo`, `/alambique`, `/hidromiel`)**:
   - Trazabilidad desde la recolección de miel a granel hasta el envasado en lotes.
   - Control de destilaciones en alambique y fermentación de hidromiel con pasaportes públicos verificables (`/alambique/[id]`, `/hidromiel/[id]`).
   - Costeo unitario de producto y piso de costos anti-dumping en checkout.

4. **Packaging, Etiquetas y Phygital (`/portal-imprenta`, `/etiquetas`)**:
   - Especificaciones técnicas vectoriales para imprenta de packaging de lujo.
   - Generación de sellos QR y pasaportes de trazabilidad pública (`/lote/[id]`) con anclaje inmutable en Polygon Amoy.

5. **CMS Visual y Catálogo de Tienda (`/editor-tienda`, `/catalogo`)**:
   - Editor visual WYSIWYG con auto-guardado en vivo sobre `site_content`.
   - Optimización automática de imágenes WebP en el navegador (1600px, multi-step downsampling).
   - Revalidación instantánea ISR de `apps/tienda`.

6. **Monitor de Feria y POS (`/monitor-feria`, `/operadores-feria`)**:
   - Monitoreo en tiempo real de terminales de venta presencial (`apps/campo`).
   - Control de arqueo de caja y alertas delta.
   - Replay idempotente de ventas con clave `client_request_id`.

7. **Soberanía Fiscal SII y Finanzas (`/sii`, `/contable`, `/banco`)**:
   - Emisión nativa de DTEs (boletas 39, facturas 33, notas de crédito 61) con firma digital XML (.pfx).
   - Control estricto de timbres CAF con bloqueo automático del checkout si se agotan folios.
   - Sincronización con el RCV del SII y cálculo automático de propuesta de F29 (IVA 19%, PPM).
   - Conciliación bancaria automática de cartolas de Banco de Chile.

8. **Privacidad y Seguridad (`/arco`, `/salud`)**:
   - Canal de atención de solicitudes ARCO bajo la Ley 21.719 de Chile.
   - Auditoría centralizada de eventos de seguridad (`security_events`).

---

## 4. Estructura de Directorios

```
apps/nucleo/
├── app/                               ← Next.js 16 App Router
│   ├── (auth)/                        ← Flujos de autenticación y reseteo
│   ├── (dashboard)/                   ← Shell administrativa multi-rol
│   ├── api/[[...routes]]/route.ts     ← Handler Edge que monta Hono BFF
│   ├── lote/[id]/                     ← Pasaporte público de lote
│   ├── alambique/[id]/                ← Pasaporte público de alambique
│   ├── hidromiel/[id]/                ← Pasaporte público de hidromiel
│   └── mapa-chiloe/                   ← Visualizador geográfico público
├── src/
│   ├── api/
│   │   ├── app.ts                     ← Instancia central de Hono y middlewares
│   │   ├── lib/                       ← Middleware Zero-Trust, rate limit, payments
│   │   └── routes/                    ← 50+ módulos de endpoints REST
│   ├── components/                    ← Componentes modulares por dominio
│   ├── config/                        ← sidebar-config.ts (Matriz de navegación y roles)
│   ├── hooks/                         ← Hooks de datos, CMS y sync engine offline
│   ├── lib/
│   │   ├── offline/                   ← Dexie NucleoBitacoraDB y cola de audio
│   │   ├── process-image.ts           ← Compresión WebP en cliente (1600px)
│   │   └── territorial-rol.ts         ← Lógica de sub-roles territoriales
│   └── views/                         ← Vistas principales del dashboard
└── vercel.json                        ← Definición de los 3 crons diarios
```

---

## 5. Roles de Acceso

Configurados en `src/config/sidebar-config.ts`:

- `admin`: Gobierno total de la plataforma.
- `apicultor`: Patio apícola, colmenas, sanidad y floración.
- `territorial`: Censo apícola comunal, alertas y trashumancia (adaptado a sub-rol).
- `operador`: Bodega, inventario central, fraccionamiento y envíos.
- `colaborador`: Operaciones generales de producción.
- `disenador`: Packaging, artes de imprenta y catálogo.

---

## 6. Variables de Entorno

Copiar `.env.example` a `.env.local`:

| Variable | Requerida | Propósito |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anónima pública de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave de servicio para el BFF (server-only). |
| `INTERNAL_API_SECRET` | Sí | Clave para comunicación privada entre Tienda/Campo y Núcleo. |
| `FLOW_API_KEY` / `FLOW_SECRET_KEY` | Opcional | Credenciales de Flow para pagos. |
| `TRANSBANK_CC` / `TRANSBANK_API_KEY` | Opcional | Credenciales de Webpay Plus. |
| `GROQ_API_KEY` | Opcional | Transcripción Whisper apícola y LLM. |
| `POLYGON_AMOY_RPC` / `PRIVATE_KEY` | Opcional | Anclaje inmutable de lotes en blockchain. |

---

## 7. Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo en :3000
pnpm --filter @enjambre/nucleo dev

# Ejecutar pruebas unitarias (Vitest)
pnpm --filter @enjambre/nucleo test

# Verificar tipos de TypeScript
pnpm --filter @enjambre/nucleo exec tsc --noEmit

# Compilación de producción y auditoría de compatibilidad
pnpm --filter @enjambre/nucleo build
```
