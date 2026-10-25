# NÚCLEO — Roles, Herramientas y Funcionamiento Interno en Código

> **Clase: VIVO.** Especificación técnica exhaustiva del funcionamiento interno a nivel de código para cada rol y herramienta en `@enjambre/nucleo`.
> Complementa: [`docs/NUCLEO_ARQUITECTURA_INGENIERIA.md`](./NUCLEO_ARQUITECTURA_INGENIERIA.md) y [`docs/NUCLEO_HERRAMIENTAS_DETALLE.md`](./NUCLEO_HERRAMIENTAS_DETALLE.md).
> Índice: [`README.md`](./README.md). Mapa del monorepo: [`REPO_MAP.md`](./REPO_MAP.md). Contratos: [`CROSS_APP.md`](./CROSS_APP.md). Dinero: [`MONEY_PATH.md`](./MONEY_PATH.md).

---

## 1. La Matriz de Identidad, Roles y Guardas en Código

Núcleo implementa un modelo de autorización multi-eje que previene la elevación indebida de privilegios y adapta quirúrgicamente las herramientas disponibles.

```
                    ┌──────────────────────────────────────────────┐
                    │               SUPABASE AUTH                  │
                    │        auth.users / JWT Token                │
                    └──────────────────────┬───────────────────────┘
                                           │
                    ┌──────────────────────┴───────────────────────┐
                    ▼                                              ▼
       [EJE A: PLATAFORMA]                            [EJE B: TERRITORIAL]
       profiles.role / app_metadata.role              actores_registro.rol / metadata
       ├── admin                                      ├── api_residente
       ├── apicultor                                  ├── api_trashumante
       ├── territorial                                ├── api_mixto
       ├── operador                                   ├── prop_facilitador
       ├── colaborador                                ├── agri_fitosanitario / agri_aplicador
       ├── disenador                                  ├── institucion_publica
       └── cliente (default / fail-closed)            └── tecnico_inspector / comercial_acopio
```

### 1.1 Resolución de Identidad en Runtime
1. **Verificación Criptográfica (`apps/nucleo/src/api/app.ts`)**:
   - El BFF no confía en el header JWT decodificado en cliente. Todo endpoint protegido ejecuta:
     ```typescript
     const supabase = createSupabaseUserClient(token);
     const { data, error } = await supabase.auth.getUser();
     if (error || !data.user) return c.json({ code: "unauthorized" }, 401);
     ```
2. **Principio de Menor Privilegio (Least Privilege)**:
   - Configurado en [`apps/nucleo/middleware.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/middleware.ts):
     ```typescript
     defaultRole: "cliente" // Usuario sin rol explícito nunca asciende a admin
     ```
3. **Guardas de Ruta a Nivel de Edge**:
   - `createAuthMiddleware()` intercepta cada solicitud, evaluando `ROUTE_ROLE_GUARDS`. Si un usuario intenta acceder a una ruta fuera de su perfil (ej. un `rep_ventas` ingresando a `/contable`), es redirigido a su ruta natural y se emite un evento `access_denied` hacia `POST /api/security-events/internal`.

---

## 2. Herramientas y Funcionamiento Interno: Rol `admin`

El rol `admin` tiene visibilidad completa del sistema (`ROLE_VISIBLE_KEYS = 'all'`) y opera las herramientas de gobierno estratégico, financiero, productivo y de plataforma.

### 2.1 Soberanía Fiscal SII (`/sii`)
- **Archivos de Código**: [`src/api/routes/sii/dte.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/api/routes/sii/dte.ts), `caf.ts`, `certificados.ts`, `impuestos.ts`, `rcv.ts`, `facturas.ts`.
- **Mecánica Interna**:
  1. **Construcción y Firma de DTE XML**:
     - `buildDteXml()` construye el documento electrónico (`DTE_TIPO`: 33 factura, 39 boleta, 46 factura de compra, 61 nota de crédito).
     - `stampDteXml()` inserta el Timbre Electrónico DTE (`<TED>`) calculando la firma RSA SHA-1 sobre los datos del CAF (Código de Autorización de Folios).
     - `signDteXml()` firma el documento completo bajo el estándar W3C XML-DSig con el certificado digital `.pfx` de la empresa.
     - `enviarDte()` transmite el sobre `<EnvioDTE>` al servidor del SII (`palena.sii.cl` o `maullin.sii.cl`) usando el token de sesión obtenido vía `getSiiToken()`.
  2. **Salvaguarda Preventiva de Folios CAF (`caf-guard.ts`)**:
     - Monitorea el rango de folios autorizados vs utilizados. Si los folios disponibles caen por debajo del umbral mínimo (`getCafMinFolios`), bloquea automáticamente nuevas compras en efectivo o boletas en el checkout, impidiendo ventas ilegales no timbradas.
  3. **Liquidación de F29 e Impuestos (`impuestos.ts`)**:
     - Agrega automáticamente el Débito Fiscal (IVA 19% de boletas y facturas emitidas), deduce el Crédito Fiscal de facturas de compras acreditadas en el RCV, calcula la retención de boletas de honorarios y liquida la tasa de Pago Provisional Mensual (PPM).

### 2.2 Integración Bancaria y Conciliación Inteligente (`/banco`, `/conciliacion`)
- **Archivos de Código**: [`src/api/routes/banco-chile/conciliacion-auto.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/api/routes/banco-chile/conciliacion-auto.ts), `routes.ts`, `webhook.ts`.
- **Mecánica Interna**:
  1. **Motor de Reconciliación por Reglas (`reconciliation_rules`)**:
     - Evalúa cada línea de la cartola bancaria descargada vía API Empresas.
     - Aplica matching de 3 vías con un sistema de scoring de confianza:
       - **100% de Confianza**: Monto exacto + RUT de contraparte coincidente + fecha el mismo día.
       - **90% de Confianza**: Monto exacto + fecha $\pm 1$ día con orden de compra pendiente.
       - **80% de Confianza**: Monto exacto + coincidencia de palabras clave en la glosa/concepto bancario.
     - Modo `AutoAceptar`: Si la confianza supera el umbral configurado ($\ge 90\%$), concilia la orden automáticamente y la marca como pagada en `ventas`.
  2. **Liquidaciones de Pasarelas**:
     - Detecta abonos masivos de Flow, Transbank o SumUp, descuenta la comisión de adquirencia retenida y calza el neto con las sesiones de caja de feria o compras web del periodo.

### 2.3 Editor Visual de Tienda CMS (`/editor-tienda`)
- **Archivos de Código**: [`src/views/EditorTiendaView.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/views/EditorTiendaView.tsx), `src/lib/editor-tienda-sections.ts`, `process-image.ts`, `revalidate-tienda.ts`, `src/api/routes/cms.ts`.
- **Mecánica Interna**:
  1. **Estructura de Pares Item/Settings**:
     - Mapea cada bloque visual de la tienda web (carruseles, colecciones, talleres, galerías, landings B2B) en un par relacional: `*_settings` (formato, tipografía, columnas) e `items` (contenido repetible).
  2. **Bloqueo Optimista y Auto-Guardado**:
     - Cada edición persiste de inmediato en `site_content`. El backend valida `expected_updated_at`; si otro operador guardó cambios posteriores, rechaza la mutación con `409 Conflict`.
  3. **Downsampling WebP en el Navegador (`processImage`)**:
     - Antes de transmitir la imagen por red, un canvas HTML5 local ejecuta un downsampling escalonado a 1600 px y la comprime a WebP con calidad 88%, garantizando que no se consuman cuotas de cómputo en Vercel ni se generen artefactos de aliasing.
  4. **Invalidación ISR de Tienda (`revalidateTiendaCms`)**:
     - Dispara una llamada HTTP autenticada con `INTERNAL_API_SECRET` hacia el endpoint `/api/revalidate-cms` de `apps/tienda`, purgando la caché de Next.js en el CDN de Vercel en milisegundos.

### 2.4 Escandallo, Costeo y Piso de Costo (`/costeo`)
- **Archivos de Código**: [`src/views/costeo/CosteoView.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/views/costeo/CosteoView.tsx), `src/api/routes/costeo.ts`, `src/api/lib/payments/cost-floor.ts`.
- **Mecánica Interna**:
  1. **Bill of Materials (BOM) Dinámico**:
     - Suma ponderada de insumos por frasco: miel nativa cruda según peso neto, botánicos de infusión, tarro de vidrio italiano, tapa hermética, etiqueta verjurada, sello de cera, minutos de mano de obra y merma técnica (1.5% a 3%).
  2. **Enforcement del Piso de Costos (`enforceCostFloor`)**:
     - En el checkout web y POS, el servidor intercepta el precio final con descuentos:
       ```typescript
       if (precioFinalCobrado < costoUnitarioBOM) {
         throw new Error("El precio final vulnera el piso de costo del producto");
       }
       ```
     - Protege la viabilidad del negocio impidiendo ventas bajo costo provocadas por combinaciones accidentales de cupones y puntos.

### 2.5 Canal ARCO Ley 21.719 (`/arco`)
- **Archivos de Código**: [`src/views/ArcoAdminView.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/views/ArcoAdminView.tsx), `src/api/routes/arco.ts`.
- **Mecánica Interna**:
  - Control estricto de SLA: temporizador regresivo de 15 días hábiles legales contados desde la recepción de la solicitud de Acceso, Rectificación, Cancelación u Oposición.
  - Al ejecutar una **Cancelación (Derecho al Olvido)**:
    - Anonimiza de forma irreversible los datos personales del usuario (`full_name`, `email`, `telefono`, `avatar_url`) en `profiles` y `auth.users`.
    - Preserva de forma disociada los comprobantes tributarios (DTEs) en `facturas_emitidas` y `ventas`, dando cumplimiento a la retención legal obligatoria de 6 años exigida por el SII.
    - Registra el incidente en `security_events` con el tipo `arco_solicitado`.

---

## 3. Herramientas y Funcionamiento Interno: Rol `apicultor`

El rol `apicultor` está restringido exclusivamente a las operaciones del patio apícola propio de O&Z (`ROLE_VISIBLE_KEYS = ['inicio', 'colmenas', 'cuaderno-campo', 'ciclo-bosque', 'configuracion']`).

```
                    PATIO APÍCOLA O&Z (Rol apicultor)
    ┌──────────────────────────────────────────────────────────────┐
    │  /inicio (InicioApicultorView)                               │
    │  ├── Estado biológico general & Alertas de sanidad           │
    │  └── Previsión microclimática Pureo (/api/meteo)             │
    ├──────────────────────────────────────────────────────────────┤
    │  /colmenas (ApicultorView)                                   │
    │  ├── Gemelo Digital 3D/2D del Apiario                        │
    │  ├── Ficha de Colmena cuadro a cuadro                        │
    │  ├── Monitoreo higiénico & Genética de reina                 │
    │  └── Simulación predictiva HiveWhatIfPanel                   │
    ├──────────────────────────────────────────────────────────────┤
    │  /colmenas/cuaderno (CuadernoCampoView)                      │
    │  ├── Offline-First puro en Dexie (NucleoBitacoraDB)          │
    │  ├── Grabación de notas de audio en el bosque nativo         │
    │  ├── Sincronización useBitacoraSyncEngine                    │
    │  └── Transcripción Groq Whisper + Extracción estructurada IA │
    ├──────────────────────────────────────────────────────────────┤
    │  /declaracion-sag (DeclaracionSagView)                       │
    │  └── Certificación oficial FRNA SAG según colmenas vivas     │
    └──────────────────────────────────────────────────────────────┘
```

### 3.1 Motor de Estado y Máquina de Decisión (`hive-state.ts`, `hive-decision.ts`)
- **Archivos de Código**: [`src/lib/hive-state.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/lib/hive-state.ts), [`src/lib/hive-decision.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/lib/hive-decision.ts).
- **Mecánica Interna**:
  1. **Señales Verificables Puras (Cero Sensores Falsos)**:
     - No inventa telemetría inexistente. Procesa exclusivamente datos confirmados en inspecciones físicas y datos climáticos de zona de Open-Meteo.
  2. **Cálculo de Nivel de Riesgo (`RiskLevel`)**:
     - **Varroa**:
       - `level >= 2` $\to$ Alerta de observación (`watch`).
       - `level >= 3` $\to$ Alerta sanitaria (`alert`).
       - `level >= 4` $\to$ Nivel crítico (`critical`) con recomendación de tratamiento orgánico inmediato.
       - Si hubo tratamiento reciente, aplica `VARROA_GRACIA_POST_TRATAMIENTO_DIAS = 30` para verificar caída de ácaros en vez de sobremedicar.
     - **Tendencia de Peso**:
       - Si el peso cae más de un 15% entre las dos últimas mediciones (`WEIGHT_DROP_ALERT = 0.15`), dispara alerta inmediata por riesgo de pillaje, enjambrazón o inanición invernal.
     - **Antigüedad de Inspección**:
       - $> 30$ días sin revisar $\to$ `watch`.
       - $> 60$ días sin revisar $\to$ `alert`.

### 3.2 Cuaderno de Campo Offline & Audio AI Pipeline
- **Archivos de Código**: [`src/lib/offline/db.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/lib/offline/db.ts), [`src/hooks/use-bitacora-sync-engine.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/hooks/use-bitacora-sync-engine.ts), [`src/api/routes/ai.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/api/routes/ai.ts).
- **Mecánica Interna**:
  1. **Almacenamiento Local en Dexie (`NucleoBitacoraDB`)**:
     - Tabla `sesiones_locales`: UUID local generado con `crypto.randomUUID()`.
     - Tabla `grabaciones`: Almacena el `Blob` de audio binario con `client_request_id` (token de idempotencia).
     - Tabla `sync_queue`: Encola mutaciones pendientes con backoff exponencial ($60\text{s} \times 2^{\text{intentos}}$ hasta 30 min).
  2. **Motor de Sincronización (`useBitacoraSyncEngine`)**:
     - Dispara al montar la vista y al activarse el evento `window.addEventListener('online')`.
     - **Paso 1 (Upload Binario)**: Sube el blob de audio a Supabase Storage (`bitacora-audio/${user.id}/${client_request_id}.m4a`). Si el archivo ya existía por timeout previo, reconcilia sin fallar.
     - **Paso 2 (Reconciliación de IDs)**: Si la sesión fue creada offline, sustituye el UUID local por el ID definitivo creado en Postgres.
     - **Paso 3 (Inferencia IA Groq)**: Invoca `POST /api/ai/bitacora/transcribe`. Groq ejecuta Whisper STT sobre el audio del bucket y un LLM con `REGISTRY_ASK_SYSTEM` extrae cuadros con postura, miel, polen y estado de la reina virgen, insertando el registro estructurado en `bitacora_eventos`.
  3. **Barrera de Confidencialidad (`user_registry_only`)**:
     - La IA tiene prohibido acceder a datos de otros apicultores o del registro general. Solo indexa el subconjunto de datos donde `user_id = auth.uid()`.

---

## 4. Herramientas y Funcionamiento Interno: Rol `territorial` (Chiloé)

El rol `territorial` opera el ordenamiento apícola comunal en el archipiélago de Chiloé frente a la trashumancia y los agroquímicos.

```
                  REGISTRO TERRITORIAL APÍCOLA DE CHILOÉ
    ┌──────────────────────────────────────────────────────────────┐
    │  EJE A: Rol de Plataforma = territorial                      │
    │  EJE B: Sub-Rol en actores_registro.rol                      │
    ├──────────────────────────────────────────────────────────────┤
    │  Gate de Escrituras: resolveTerritorialWriteGate()           │
    │  ├── api_residente / api_trashumante: Censo & Trashumancia   │
    │  ├── agri_fitosanitario: Avisos de Plaguicidas               │
    │  ├── prop_facilitador: Registro de Predios para Colmenas     │
    │  └── institucion_publica: Fiscalización Comunal (SAG/Muni)   │
    ├──────────────────────────────────────────────────────────────┤
    │  Red de Alerta Temprana Fitosanitaria                        │
    │  └── Algoritmo Haversine calcula radio de toxicidad (3 km)   │
    │      y emite notificaciones transaccionales automáticas      │
    ├──────────────────────────────────────────────────────────────┤
    │  Evaluación de Trashumancia (Ley 21.489 / Dto 21/2024)       │
    │  └── distanciaMinimaLegalKm() evalúa bandas (0.5 a 2.2 km)   │
    └──────────────────────────────────────────────────────────────┘
```

### 4.1 Gate de Escrituras Centralizado (`territorial-write-gate.ts`)
- **Código**: [`src/lib/territorial-write-gate.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/lib/territorial-write-gate.ts).
- **Mecánica Interna**:
  - Implementa un patrón **fail-closed**: Si el sub-rol no está resuelto, se deniegan todas las escrituras.
  - Carve-outs específicos por sub-rol:
    - `POST /api/registro-territorial/alertas` $\to$ Permitido únicamente para `agri_fitosanitario`, `agri_aplicador` y `tecnico_inspector`.
    - `POST /api/registro-territorial/predios` $\to$ Permitido únicamente para `prop_facilitador`.
    - `POST /api/registro-territorial/trashumancia` $\to$ Permitido para apicultores (`api_trashumante`, `api_residente`, `api_mixto`).
    - `POST /api/registro-territorial/confirmar` $\to$ Acuse de recibo de alerta permitido para cualquier actor registrado afectado.

### 4.2 Red de Alerta Temprana Fitosanitaria
- **Archivos de Código**: [`src/api/routes/registro-territorial.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/api/routes/registro-territorial.ts), [`src/components/apicultor/AlertaFitosanitariaForm.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/components/apicultor/AlertaFitosanitariaForm.tsx).
- **Mecánica Interna**:
  1. **Ingreso de Aviso Agrícola**:
     - El agricultor declara producto fitosanitario (ingrediente activo, toxicidad para abejas), fecha/hora programada, coordenadas geográficas de aplicación y radio estimado (ej. 3 km).
  2. **Cálculo Espacial Haversine (`haversineKm`)**:
     - El backend itera sobre todos los apiarios registrados en la base de datos (tanto propios de O&Z como de apicultores registrados):
       $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  3. **Disparo Transaccional Inmediato**:
     - Para todo apiario donde $d \le \text{radio}$, invoca `enqueueTransactionalNotification()` enviando correos y notificaciones push urgentes con el detalle del producto y la hora para que el apicultor tome medidas de resguardo.

### 4.3 Control de Trashumancia y Distancias Legales
- **Archivos de Código**: [`src/lib/distancias-legales.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/nucleo/src/lib/distancias-legales.ts).
- **Mecánica Interna**:
  - Al recibir una solicitud de ingreso de colmenas foráneas a Chiloé, evalúa la carga biológica mediante `distanciaMinimaLegalKm(nColmenas)`:
    - $\le 36$ colmenas: Sin restricción obligatoria de distancia.
    - $37 - 100$ colmenas: Exige un buffer mínimo de **$0.5\text{ km}$** respecto a apiarios residentes.
    - $101 - 500$ colmenas: Buffer mínimo de **$1.0\text{ km}$**.
    - $501 - 1000$ colmenas: Buffer mínimo de **$1.5\text{ km}$**.
    - $> 1000$ colmenas: Buffer mínimo de **$2.2\text{ km}$**.
  - Si las coordenadas solicitadas violan la distancia legal contra un apiario preexistente, el sistema bloquea la aprobación y marca la solicitud con causal de objeción técnica territorial.

---

## 5. Herramientas y Funcionamiento Interno: Roles de Operación y Soporte

### 5.1 Rol `operador` (Bodega, Fraccionamiento y Logística)
- **Rutas**: `/inicio`, `/produccion/inventario`, `/produccion/lotes`, `/produccion/recoleccion`, `/despacho/envios`, `/despacho/centros`.
- **Mecánica Interna en Código**:
  1. **Recolección y Envasado**:
     - Registra las recolecciones a granel en `cosechas` y ejecuta la función `attachCosechaToLote()`, vinculando los IDs de manera bidireccional y recalculando el peso neto en `lotes.kg_total`.
  2. **Control de Mermas y Fraccionamiento**:
     - Descuenta automáticamente el stock de materias primas (frascos vacíos, tapas, etiquetas) al fraccionar un lote y registra la merma porcentual resultante.
  3. **Fulfillment de Envíos**:
     - En `/despacho/envios`, selecciona órdenes listas, asigna courier (`@enjambre/logistica`) y actualiza el estado a `en_transito`. Esto ejecuta `PATCH /api/logistica/envios/:id`, deduplicando y enviando el correo con el código de seguimiento al cliente.

### 5.2 Rol `colaborador` (Apoyo en Planta)
- **Rutas**: `/inicio`, `/produccion/inventario`, `/produccion/lotes`, `/configuracion`.
- **Mecánica Interna en Código**:
  - Perfil de solo consulta y registro asistido. Puede chequear stock y lotes, registrar conteos de inventario físico, pero carece de permisos de mutación sobre costos, recetas, emisión de DTEs, conciliación o administración de usuarios.

### 5.3 Rol `disenador` (Packaging, Imprenta y Sellos)
- **Rutas**: `/portal-imprenta`, `/etiquetas/qr`, `/etiquetas/artes`, `/catalogo`, `/configuracion`.
- **Mecánica Interna en Código**:
  1. **Portal Imprenta (`PortalImprentaView.tsx`)**:
     - Interfaz con especificaciones técnicas rigurosas para la industria gráfica: sangrado de 2 mm, perfiles CMYK FOGRA39, reservas de barniz UV y troqueles para frascos y botellas.
  2. **Bóveda de Etiquetas**:
     - Almacena y versiona los archivos PDF/AI de artes finales aprobados para cada producto.
  3. **Generación de Sellos QR**:
     - Emite bloques de identificadores únicos para impresión física de etiquetas que enlazan al pasaporte público `/lote/[id]`.

---

## 6. Integración con Roles Externos (`rep_ventas`, `creador`, `cliente`)

Aunque estos roles operan principalmente fuera de Núcleo, el BFF y los monitores de Núcleo gobiernan su actividad.

### 6.1 Rol `rep_ventas` (Terminal POS Feria en Campo)
- **App Principal**: `apps/campo` (PWA Offline-First con Dexie).
- **Mecánica de Recepción en Núcleo (`src/api/routes/rep-ventas.ts`)**:
  1. **Replay Idempotente de Ventas**:
     - Campo envía ventas offline en ráfagas al recuperar señal con la clave `client_request_id`.
     - El endpoint `POST /api/rep-ventas/quick` busca `buy_order = POS-${client_request_id}`:
       ```typescript
       if (existing) {
         return c.json({ data: existing, meta: { already_processed: true } }, 200);
       }
       ```
     - Si ya fue procesada, responde `200 OK` de forma idempotente sin duplicar boletas ni stock.
  2. **Auto-Provisión de Sesiones de Caja**:
     - Si la venta offline llega antes que el registro de apertura de caja por latencia de red, Núcleo auto-provisiona la sesión con `opening_cash: 0` para asegurar que ninguna venta se pierda.
  3. **Recálculo de Descuentos en Servidor**:
     - `applyPosDiscount()` valida que el descuento ferial no exceda el tope permitido ($50\%$) y recalcula netos e IVA sin confiar en los cálculos enviados por el cliente.
  4. **Monitor en Tiempo Real (`FeriaMonitorView.tsx`)**:
     - Los administradores en Núcleo visualizan las ventas de feria en vivo vía Realtime y reciben alertas delta si el efectivo declarado al cierre no coincide con las transacciones.

### 6.2 Rol `creador` (Embajadores de Marca)
- Gestionado desde `/creadores`. Asigna códigos de descuento personalizados y comisiones por ventas referidas que el checkout de Núcleo rastrea mediante UTMs y cupones exclusivos.

### 6.3 Rol `cliente` (Consumidor Final)
- Si un `cliente` inicia sesión en Núcleo, el middleware lo redirige automáticamente hacia la tienda web (`apps/tienda`).
- En el checkout web, Núcleo gestiona su reserva de stock (`fetchBloqueadosPorProducto`), bonifica el retorno de envases de vidrio limpios (`calculateJarReturnReward`), calcula despachos y acredita sellos en el Club Legado (`loyalty_rewards`).

---

## 7. Pipeline de Ejecución Transversal: Checkout y Liquidación Post-Pago

El flujo de checkout es el proceso más crítico del BFF de Núcleo.

```
[Cliente en apps/tienda]
           │
           ▼
POST /api/checkout/init (Núcleo)
  ├── 1. Valida stock libre (fetchBloqueadosPorProducto)
  ├── 2. Valida timbres CAF disponibles (getCafMinFolios)
  ├── 3. Enforce Cost Floor: valida que precio >= costo unitario
  ├── 4. Aplica recompensa por retorno de frascos (calculateJarReturnReward)
  └── 5. Crea sesión en checkout_sessions con buy_order único
           │
           ▼
[Pasarela de Pago: Flow o Transbank Webpay]
           │
           ▼ (Webhook de Confirmación)
POST /api/webhooks/transbank o /flow
           │
           ▼
settleCheckout() (Núcleo - src/api/lib/payments/settle-checkout.ts)
  ├── 1. Claim Atómico: marca fulfillment_started_at para serializar
  ├── 2. Si ya fue procesado: libera holds y responde éxito idempotente
  ├── 3. fulfillCheckout():
  │       ├── Decrementa inventario definitivo
  │       ├── Emite DTE Boleta 39 electrónica ante el SII
  │       ├── Acredita sellos y puntos de lealtad en loyalty_rewards
  │       └── Encola correo de confirmación y factura en notification_queue
  └── 4. Libera el claim y completa la sesión
```

---

*Documento completado: Octubre 2026. Este documento constituye la especificación de referencia absoluta para el funcionamiento interno y la gobernanza de roles en `@enjambre/nucleo`.*
