# Arquitectura e Ingeniería de Campo (apps/campo)

> **Clase de Documento: VIVO.**
> **Propósito:** Tratado exhaustivo de arquitectura, diseño de sistemas, ingeniería de datos offline-first y protocolos de sincronización de `apps/campo`.
> **Audiencia:** Ingenieros de software, arquitectos de sistemas, auditores de seguridad y desarrolladores core de Enjambre Legado.
> **Reglas Inviolables:**
> 1. Vocabulario Sagrado: **Recolección**, jamás "cosecha".
> 2. Estética y Tono: Poder silencioso y lujo territorial de alta gama. Prohibida la retórica de ONG, cooperativa, sacrificio obrero o prédica ambientalista.
> 3. Cero fuga técnica en UI: Sin nombres de scripts `.sql`, UUIDs crudos ni comandos de terminal expuestos al operador.
> 4. Desambiguación Operativa: Campo es el **POS ferial y de revendedores (`rep_ventas`)**. El patio apícola, colmenas y bitácora residen exclusivamente en `apps/nucleo` (rol `apicultor`).
> 5. No existe `@enjambre/offline`: Toda la infraestructura offline reside en `apps/campo/src/lib/offline/`.

---

## 1. Identidad de Sistema y Filosofía de Campo

`apps/campo` es la terminal móvil progresiva (PWA) de alta fidelidad de **Enjambre Legado**, concebida específicamente para operar en terrenos agrestes, ferias artesanales de lujo, boutiques emergentes y zonas remotas del archipiélago de Chiloé donde la conectividad celular es deficiente o completamente inexistente.

A diferencia de un punto de venta convencional de retail masivo, Campo responde a dos imperativos convergentes:
1. **Poder Silencioso y Experiencia Sensorial de Lujo:** Transforma la venta en un ritual de degustación y educación biocultural. Facilita la transmisión de la maestría apícola, las notas organolépticas de mieles monoflorales milenarias (Ulmo, Tiaca, Tepú) y la entrega de un pasaporte digital de trazabilidad verificable sin entorpecer la fluidez del cobro.
2. **Resiliencia Extrema Offline-First:** El operador nunca debe detener una venta por falta de red. Cada catálogo, variación de formato, inventario consignado, cálculo de descuento y apertura de caja se procesa y persiste de manera determinista en el motor de almacenamiento local en el cliente (IndexedDB vía Dexie), drenándose hacia el BFF de Núcleo (`apps/nucleo`) de forma asíncrona y transaccional tan pronto se detecta enlace fiable.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENJAMBRE LEGADO · CAMPO                          │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         INTERFAZ DE VENTA (UI)                      │   │
│   │    - Catálogo Ferial          - Modo Atril & Guía Sensorial de Cata │   │
│   │    - Carrito Multi-Producto   - Comprobante Digital (WhatsApp/QR)   │   │
│   │    - Control de Caja & Arqueo - Mermas, Degustación & Retorno Vidrio│   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │ Mutaciones / Consultas               │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   CLIENT STORAGE ENGINE (IndexedDB)                 │   │
│   │                      Dexie: CampoPOSDatabase (v7)                   │   │
│   │                                                                     │   │
│   │  [productos]        [variantes]         [feria_context]             │   │
│   │  [sync_queue]       [recibo_outbox]     [escuela_material]          │   │
│   │  [meta]             [escuela_outbox]                                │   │
│   └──────────────────────┬──────────────────────▲───────────────────────┘   │
│                          │                      │                           │
│             Replay FIFO  │                      │ Downsync Selectivo        │
│             Idempotente  │                      │ con dynamic TTL           │
│                          ▼                      │                           │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                   MOTOR DE SINCRONIZACIÓN ASÍNCRONO                 │   │
│   │                        (use-sync-engine.ts)                         │   │
│   │   - Detección de enlace online / offline                            │   │
│   │   - Backoff exponencial acotado (1m a 30m, tope 6 intentos)         │   │
│   │   - Idempotencia determinista (posBuyOrder = POS-${uuid})           │   │
│   │   - Bypass de memoria para hardware legacy (iPhone 7 / 2GB RAM)     │   │
│   └──────────────────────┬──────────────────────▲───────────────────────┘   │
└──────────────────────────┼──────────────────────┼───────────────────────────┘
                           │ HTTP REST (BFF)      │ Cache Refresh
                           ▼                      │
┌─────────────────────────────────────────────────┴───────────────────────────┐
│                           NÚCLEO BFF (:3000)                                │
│               /api/rep-ventas/*  ·  /api/cash-sessions/*                    │
│                        Hono Engine + Postgres 17 RLS                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PWA y Runtime de Servicio (Service Worker)

Campo está configurada como una Progressive Web App instalable para iOS y Android, empacada mediante `@serwist/next` en Next.js 16.

### 2.1. Manifiesto y Caching Estratégico ([`sw.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/sw.ts))
El Service Worker opera bajo una estrategia de dos capas:
1. **Precaching Estático:** El manifiesto generado en el build (`self.__SW_MANIFEST`) precachea los chunks JS/CSS críticos de Next.js, iconos de alta resolución y fuentes tipográficas del sistema (incluida Cormorant Garamond).
2. **Filtro de Exclusión Proactiva:**
   ```typescript
   const manifestEntries = (self.__SW_MANIFEST || []).filter((entry) => {
     const url = typeof entry === "string" ? entry : entry.url;
     return !url.includes("static/media/") && !url.includes("leaflet") && !url.includes("layers");
   });
   ```
   *Razón de ingeniería:* Excluye deliberadamente módulos pesados de mapas cartográficos de Núcleo (Leaflet) para no sobrecargar el almacenamiento en caché de navegadores móviles modestos (Safari iOS < 16).
3. **Runtime Caching:** Aplica `defaultCache` de Serwist con `NetworkFirst` para navegación HTML y `StaleWhileRevalidate` para activos estáticos invariantes.

### 2.2. Notificaciones Push y Deep Linking
El Service Worker intercepta eventos `push` desde el servidor para alertar al operador sobre:
- Novedades en la asignación de consignación ferial.
- Metas de comisiones y multiplicadores de racha desbloqueados.
- Notificaciones de cierre o apertura de caja.

Al interactuar con la notificación (`notificationclick`), el service worker busca si ya existe una pestaña abierta con la URL de destino (`/pos`) para otorgarle el foco (`client.focus()`), evitando duplicar instancias de la aplicación en memoria.

---

## 3. Modelo de Datos Local: IndexedDB & Dexie Schema

El núcleo del almacenamiento en cliente es la base de datos `CampoPOSDatabase` administrada por `dexie` en [`apps/campo/src/lib/offline/db.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/lib/offline/db.ts).

### 3.1. Evolución del Schema (Versiones 1 a 7)
El motor respeta una evolución estricta sin pérdida de datos locales:
- **v1:** Tablas base `productos` (`id, nombre, visible`) y `sync_queue` (`++id, status, created_at`).
- **v2:** Incorporación de `feria_context` (`id`) para soporte de consignación por evento.
- **v3:** Optimización de cola con índice compuesto en `sync_queue` (`++id, status, created_at, next_retry_at`).
- **v4:** Creación de `meta` (`key`) para seguimiento de timestamps de sincronización.
- **v5:** Inclusión de `escuela_material` (`id, tipo, orden`) y `escuela_outbox` (`++id, created_at`) para capacitación y telemetría offline de ventas.
- **v6:** Inclusión de `recibo_outbox` (`++id, created_at`) para registrar comprobantes compartidos por WhatsApp o impresos sin conexión.
- **v7:** Inclusión de `variantes` (`id, producto_id, activo`) para soporte de formatos y fortificaciones botánicas.

### 3.2. Estructura de Entidades en Memoria Local

#### Tabla: `productos` (`ProductoLocal`)
Almacena el catálogo de productos disponibles para la venta:
- `id` (UUID del producto en Postgres).
- `nombre`, `slug`, `precio`, `stock`, `formato`, `visible`, `peso_neto_g`, `tags`.
- `fotos`: Array de URLs CDN cacheadas.
- `descripcion_corta`, `descripcion_regenerativa`, `ingredientes`, `origen_apicola`.
- `lote`: Snapshot del lote apícola asociado (`nombre_lote`, `variedad_floral`, `relato_publico`, `analisis_humedad`, `metodo_extraccion`).
- `perfil_sensorial`: Objeto organoléptico con niveles de intensidad, dulzor/acidez, textura, notas aromáticas y sugerencias de maridaje.

#### Tabla: `variantes` (`ProductoVarianteLocal`)
Permite seleccionar variantes de peso, fortificaciones botánicas o ediciones especiales sin necesidad de conexión remota.

#### Tabla: `feria_context` (`FeriaContextLocal`)
Representa el estado operativo de la feria actual (`id: 'current'`):
- `active`: Booleano que indica si el operador está asignado a un evento activo.
- `evento`: Metadatos del evento ferial (`id`, `nombre_evento`, `ubicacion`).
- `contrato`: Términos comerciales acordados (`comision_base_pct`, `score_confianza`, `bono_puntualidad_clp`).
- `consignaciones`: Array de inventario consignado entregado físicamente al vendedor:
  ```typescript
  consignaciones: Array<{
    id: string;
    producto_id: string;
    cantidad_entregada: number;
    cantidad_vendida: number;
    cantidad_devuelta: number;
    pendiente: number;
    productos?: { nombre: string | null } | null;
  }>
  ```
- `whatsapp_template`: Mensaje personalizado de agradecimiento y fidelización.
- `combos_config`: Reglas de descuentos por volumen activas en el evento.

#### Tabla: `sync_queue` (`SyncQueueItem`)
Cola transaccional FIFO de operaciones pendientes de replicación en Núcleo:
- `id`: Entero auto-incremental en Dexie.
- `payload`: Diccionario JSON con los datos de la acción (`_action: 'open_cash_session' | 'close_cash_session' | 'quick_sale'`).
- `status`: `'pending' | 'error'`.
- `error_message`: Mensaje sanitizado del último error de sincronización.
- `created_at`: Epoch timestamp de creación local.
- `attempts`: Conteo de reintentos fallidos.
- `next_retry_at`: Epoch timestamp habilitado para el próximo reintento (backoff exponencial).

### 3.3. Cierre Cooperativo ante Upgrades de Esquema
Para evitar bloqueos y congelamientos de pestañas en navegadores basados en Chromium (que arrojan errores de timeout de 30 segundos si una conexión de base de datos permanece abierta durante un borrado de datos o migración), Campo implementa:
```typescript
if (typeof window !== 'undefined') {
  db.on('versionchange', () => {
    db.close();
    return false;
  });
}
```

---

## 4. Pipeline de Sincronización Bidireccional ([`use-sync-engine.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/hooks/use-sync-engine.ts))

El motor de sincronización (`useSyncEngine`) orquesta la coherencia entre el cliente Dexie y el BFF de Núcleo.

```
                  ┌───────────────────────────────┐
                  │    Evento Trigger: Online,    │
                  │  Montaje o Mutación en Tienda │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                     ¿Hay enlace de red disponible?
                             /          \
                         No /            \ Sí
                           ▼              ▼
                     Modo Offline    ┌─────────────────────────┐
                     Persiste en     │  performUpsync (FIFO)   │
                     Dexie Queue     └────────────┬────────────┘
                                                  │
                                                  ▼
                                      ¿Existen items pendientes?
                                             /          \
                                         No /            \ Sí
                                           ▼              ▼
                                     Ir a Downsync    Procesa cola con
                                                      Idempotencia Determinista
                                                              │
                                     ┌────────────────────────┴────────────────────────┐
                                     ▼                                                 ▼
                          HTTP 200 / 201 / 409 Resuelto                       Error de Red / 5xx / 429
                                     │                                                 │
                                     ▼                                                 ▼
                             Eliminar de Dexie                                 Calcular Backoff Exponencial
                                `sync_queue`                                   `next_retry_at` (1m - 30m)
                                     │                                         Attempts++
                                     ▼                                                 │
                          Disparar performDownsync ◄───────────────────────────────────┘
                          (Actualiza catálogo y stock)
```

### 4.1. Pipeline de Downsync (Descarga de Catálogo y Contexto)
1. **Control de Frecuencia con Dynamic TTL:**
   - Para evitar que la navegación entre rutas re-dispare limpiezas y escrituras masivas en IndexedDB (`db.productos.clear() + bulkAdd()`), se consulta el registro `lastFullDownsync` en la tabla `meta`.
   - **Dispositivos Modernos:** `DOWNSYNC_TTL_MS = 60_000` (1 minuto).
   - **Dispositivos Legacy (iPhone 7 / 2GB RAM):** `DOWNSYNC_TTL_MS_LEGACY = 300_000` (5 minutos). Esto previene picos de consumo de memoria que provoquen el cierre abrupto de la pestaña por el sistema operativo (OOM eviction).
2. **Filtro de Canales:** Descarga únicamente productos con `visible: true` cuyo array de canales incluya `'campo'` (o no especifique restricción).
3. **Atomicidad Transaccional:** El reemplazo del catálogo se ejecuta dentro de una transacción de lectura/escritura de Dexie (`db.transaction('rw', db.productos, ...)`), garantizando que la UI nunca lea un catálogo en blanco a medio escribir.
4. **Contexto de Feria:** Realiza una petición autenticada a `GET /api/rep-ventas/feria-context` para actualizar el contrato del operador, evento vigente y cantidades consignadas.

### 4.2. Pipeline de Upsync (Subida y Replay de Mutaciones)
1. **Control de Concurrencia:** Utiliza banderas `isSyncing.current` y un semáforo global en memoria (`globalCampoSyncing`) para garantizar que múltiples componentes o re-renderizados no ejecuten procesos de subida concurrentes sobre la misma cola.
2. **Selección de Elementos Elegibles:**
   - Todos los items con estado `'pending'`.
   - Items con estado `'error'` cuyo `next_retry_at` haya vencido y cuyo número de intentos sea inferior a `MAX_ATTEMPTS = 6`.
3. **Backoff Exponencial Acotado:**
   ```typescript
   const backoffMs = (attempts: number) => Math.min(60_000 * 2 ** attempts, 1_800_000);
   ```
   *Secuencia:* 1 min, 2 min, 4 min, 8 min, 16 min, con un tope máximo de 30 minutos.
4. **Idempotencia Determinista en el Servidor:**
   - Cada transacción de venta genera un token único en el cliente: `client_request_id` (o `posBuyOrder = POS-${uuid}`).
   - Al recibir la petición `POST /api/rep-ventas/quick`, Núcleo verifica si la orden ya fue procesada anteriormente. Si es así, retorna `200 OK` con `{ already_processed: true }`.
   - Campo interpreta este `200 OK` (o un `409 Conflict` en apertura/cierre de caja ya asentado) como un éxito total y procede a purgar el registro de `sync_queue`.
5. **Clasificación de Errores:**
   - **Error de Negocio Permanente (HTTP 409 con `code === 'consignacion_insuficiente'`):** Se congela el reintento automático (`next_retry_at: undefined`), registrando el mensaje para auditoría manual por el administrador.
   - **Error 4xx (Validación):** Incrementa el contador hasta 6 intentos; al superarlo, queda en estado de error definitivo.
   - **Error 5xx / 429 / Caída de Red:** Aplica backoff exponencial y mantiene el registro activo para el siguiente ciclo.

---

## 5. Control de Caja y Arqueo Operativo ([`cash-context.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/cash-context.tsx))

El flujo de caja física garantiza la trazabilidad del dinero en efectivo recibido en terreno.

### 5.1. Ciclo de Vida de la Sesión de Caja
1. **Apertura de Caja (`openSession`):**
   - El operador declara el monto inicial en efectivo (fondo de caja para cambio).
   - En condiciones online, se invoca `POST /api/cash-sessions`.
   - En condiciones offline, se genera un UUID determinista localmente, se persiste el estado en `localStorage` (`enjambre_campo_active_cash_session`) y se encola la acción en `sync_queue` con `_action: 'open_cash_session'`.
2. **Arqueo Ciego y Cierre de Caja (`closeSession`):**
   - Al finalizar la jornada ferial, el operador ingresa el conteo físico real de billetes y monedas (`closing_cash_counted`).
   - El sistema calcula la diferencia respecto al balance teórico esperado (Fondo Inicial + Ventas en Efectivo - Devoluciones).
   - Si no hay red, la sesión se cierra localmente para permitir que el operador termine su turno, y la orden de cierre se encola con `_action: 'close_cash_session'`.

---

## 6. Motor de Venta y Validación de Consignación

Campo ofrece dos modalidades de venta optimizadas para la velocidad en mesón:

### 6.1. Venta Rápida de un Toque ([`quick-sale-button.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/pos/catalogo/quick-sale-button.tsx))
Diseñado para artículos estrella de alta rotación (ej. Frasco 500g Miel de Ulmo). Con un solo toque, descuenta el stock local, genera el registro de venta y emite el comprobante de inmediato.

### 6.2. Carrito Multi-Producto ([`cart-context.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/cart-context.tsx) & [`cart-math.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/cart-math.ts))
Permite armar pedidos con múltiples variedades florales, aplicar descuentos reglamentados y asociar códigos QR de autenticidad botánica.

### 6.3. Validación Local de Stock Consignado ([`feria-offline.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/lib/offline/feria-offline.ts))
Antes de permitir que una venta se complete o se encole en `sync_queue`:
1. Si el canal es `'feria'` y existe un evento ferial activo, se consulta el stock `pendiente` de la tabla `feria_context`.
2. Si la cantidad solicitada excede el saldo consignado entregado físicamente al operador, la venta es rechazada de inmediato en el cliente:
   ```typescript
   export function validateOfflineFeriaSale(items, channel, snapshot) {
     // Verifica que no haya ventas de productos no consignados o cantidades excedidas
   }
   ```
3. Si la venta es válida, se aplica un **decremento optimista inmediato** en la base de datos local Dexie (`decrementOfflineFeriaStock`). De este modo, ventas consecutivas sin red nunca excederán el límite físico de mercadería asignada.

---

## 7. Medios de Pago y Terminal SumUp

El motor de pagos soporta 4 modalidades de transacción:
1. **Efectivo:** Integrado con el calculador de billetes de alta denominación chilena ([`cash-suggestions.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/lib/cash-suggestions.ts)) para agilizar la entrega de cambio con combinaciones de \$20.000, \$10.000, \$5.000, \$2.000 y \$1.000 CLP.
2. **Transferencia Bancaria:** Genera instrucciones visuales con los datos bancarios del titular de la empresa y confirmación inmediata en mesón.
3. **Terminal de Tarjeta SumUp ([`sumup-context.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/sumup-context.tsx) & [`sumup-terminal-flow.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/sumup-terminal-flow.tsx)):**
   - Conexión vía API BFF a terminales físicos SumUp Air / Solo.
   - Envío remoto del checkout (`startReaderCheckout`).
   - Sondeo reactivo de estado de transacción (`pollCheckoutStatus`) con timeouts seguros.
   - Modo de respaldo manual para ingresar el número de autorización de comprobante emitido por terminales externos.
4. **Pago Mixto / Débito Estándar.**

---

## 8. Comprobantes Digitales y Fidelización Post-Venta

Campo rechaza el desperdicio de papel tradicional pero ofrece compatibilidad total con la normativa ferial chilena y la experiencia de lujo:

### 8.1. Despacho Vía WhatsApp ([`pos-receipt.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/lib/pos-receipt.ts))
Genera un mensaje de texto formateado con tipografía clara y estética que incluye:
- Encabezado de alta gama (*Enjambre Legado · Bosque Nativo de Chiloé*).
- Identificador de Orden (`buy_order`).
- Detalle de ítems recolectados, cantidades y subtotales.
- Descuentos feriales aplicados.
- **Enlace de Reclamo Digital (`claim_token`):**
  Un enlace directo a la Tienda (`https://.../claim/{token}`) que permite al comprador auditar el sello de autenticidad del lote, ver el mapa de origen del apiario y registrar puntos de fidelización en su cuenta de cliente.

### 8.2. Impresión Térmica ESC/POS ([`thermal-receipt.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/thermal-receipt.tsx))
Para ferias con inspectores municipales o clientes que exigen comprobante físico en mano, Campo incluye un motor de renderizado CSS `@media print` a 58mm y 80mm con código QR vectorial renderizado nativamente.

### 8.3. Programa de Retorno de Envases ([`retorno-envases-modal.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/retorno-envases-modal.tsx))
Promueve la economía circular del archipiélago:
- El operador puede registrar la devolución de frascos de vidrio vacíos por parte de los clientes.
- Cada envase otorga un saldo a favor estándar (\$500 CLP / frasco) que puede descontarse en la compra en curso o acumularse como saldo en la cuenta del cliente registrado.

---

## 9. Escuela Ferial y Argumentario de Venta ([`apps/campo/src/app/escuela`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/escuela/page.tsx))

Para garantizar que todo representante comercial proyecte la elegancia y veracidad del proyecto, Campo incluye un módulo de formación continua offline:
1. **Banco Canónico de Objeciones:** Respuestas fundamentadas ante dudas comunes del consumidor (cristalización natural de la miel cruda, comparación de precio frente a mieles adulteradas industriales, restricciones de edad en lactantes menores a 1 año).
2. **Modo Atril:** Interfaz de pantalla completa para disponer sobre el mesón de degustación, mostrando a los visitantes el mapa del apiario, el perfil sensorial interactivo y los relatos bioculturales del lote.
3. **Telemetría y Evaluaciones:** Quiz de conocimientos apícolas precargado en Dexie (`escuela_material`); cada consulta y evaluación superada se registra en `escuela_outbox` para auditar el dominio técnico del equipo de ventas.

---

## 10. Matriz de Integración y Seguridad

| Dominio | Origen de Datos | Protocolo | Tolerancia a Fallos |
|---|---|---|---|
| **Autenticación** | `@enjambre/auth` | JWT Bearer Cookie / Header | Caché local de sesión; refresco transparente |
| **Catálogo** | Supabase `productos` | REST / Downsync por TTL | Dexie `productos` (100% offline) |
| **Variantes** | Supabase `producto_variantes` | REST / Downsync por TTL | Dexie `variantes` (100% offline) |
| **Venta Ferial** | Núcleo BFF `/api/rep-ventas/quick` | REST (POST) idempotente | Cola FIFO en `sync_queue` con backoff |
| **Control de Caja** | Núcleo BFF `/api/cash-sessions` | REST (POST / PATCH) | Persistencia local en `localStorage` + cola |
| **Terminal SumUp** | Núcleo BFF `/api/sumup/*` | REST / Polling | Modo manual con ingreso de voucher |
| **Fidelización** | Núcleo BFF `/api/wallet/qr/resolve` | REST vía Campo Route Handler | Consulta en línea o emisión de claim diferido |

---

## 11. Resumen de Invariantes de Ingeniería

1. **Nunca realizar mutaciones de venta directamente a Supabase:** Todo registro de venta debe entrar a través del BFF de Núcleo o la cola transaccional Dexie.
2. **Preservar el decremento optimista:** Un downsync remoto nunca debe sobreescribir ni revertir los decrementos de consignación locales que aún no han sido confirmados por el servidor.
3. **Respeto irrestricto al Tier Legacy:** En dispositivos móviles con hardware restringido (iPhone 7 / 2GB RAM), la frecuencia de downsync se espacia a 5 minutos para evitar picos de memoria.
4. **Idempotencia Absoluta:** Toda venta encolada porta un identificador `client_request_id` inmutable. Los reintentos del motor jamás generarán órdenes duplicadas en la base de datos central.
