# NÚCLEO — Catálogo Exhaustivo de Herramientas y Operatoria del Sistema

> **Clase: VIVO.** Desglose técnico y funcional de cada herramienta, vista y módulo existente en `@enjambre/nucleo`.
> Complemento técnico de [`docs/NUCLEO_ARQUITECTURA_INGENIERIA.md`](./NUCLEO_ARQUITECTURA_INGENIERIA.md).
> Índice maestro: [`README.md`](./README.md). Mapa del monorepo: [`REPO_MAP.md`](./REPO_MAP.md). Contratos: [`CROSS_APP.md`](./CROSS_APP.md).

---

## Índice de Herramientas

1. [Visión & Cabina de Mando (`/inicio`, `/calendario`)](#1-visión--cabina-de-mando)
2. [Entorno Apícola, Gemelo Digital & Cuaderno Offline (`/colmenas`)](#2-entorno-apícola-gemelo-digital--cuaderno-offline)
3. [Declaración Oficial SAG (`/declaracion-sag`)](#3-declaración-oficial-sag)
4. [Oráculo Fenológico & Botánica Nativa (`/fenologia`)](#4-oráculo-fenológico--botánica-nativa)
5. [Regeneración, Biomasa & Captura de CO2 (`/regeneracion`)](#5-regeneración-biomasa--captura-de-co2)
6. [Recolección a Granel, Lotes & Fraccionamiento (`/produccion`)](#6-recolección-a-granel-lotes--fraccionamiento)
7. [Alquimia Soberana: Alambique e Hidromiel (`/alambique`, `/hidromiel`)](#7-alquimia-soberana-alambique-e-hidromiel)
8. [Escandallo, Costeo Unitario & Piso de Costo (`/costeo`)](#8-escandallo-costeo-unitario--piso-de-costo)
9. [Packaging, Bóveda de Etiquetas & Portal Imprenta (`/portal-imprenta`, `/etiquetas`)](#9-packaging-bóveda-de-etiquetas--portal-imprenta)
10. [Trazabilidad Phygital & Sellos Criptográficos (`/etiquetas/qr`, `/lote/[id]`)](#10-trazabilidad-phygital--sellos-criptográficos)
11. [Despacho, Envíos & Centros de Stock (`/despacho`)](#11-despacho-envíos--centros-de-stock)
12. [Editor de Tienda Visual & CMS (`/editor-tienda`)](#12-editor-de-tienda-visual--cms)
13. [Catálogo Maestro, Taxonomías & Descuentos (`/catalogo`, `/descuentos`)](#13-catálogo-maestro-taxonomías--descuentos)
14. [Club Legado & Suscripciones de Reposición (`/club-legado`, `/planes-suscripcion`)](#14-club-legado--suscripciones-de-reposición)
15. [Monitor de Feria en Tiempo Real & Arqueo (`/monitor-feria`)](#15-monitor-de-feria-en-tiempo-real--arqueo)
16. [Microcanales B2B, Cotizador & Percepción Sensorial CATA (`/microcanales`)](#16-microcanales-b2b-cotizador--percepción-sensorial-cata)
17. [Pipeline Comercial & CRM B2B (`/pipeline`, `/crm`)](#17-pipeline-comercial--crm-b2b)
18. [Creadores & Embajadores Admin (`/creadores`, `/reglas-comision`)](#18-creadores--embajadores-admin)
19. [Estudio Editorial & Motion RRSS (`/estudio-rrss`, `/estudio-audiovisual`)](#19-estudio-editorial--motion-rrss)
20. [Soberanía Fiscal SII & Facturación Electrónica (`/sii`)](#20-soberanía-fiscal-sii--facturación-electrónica)
21. [Integración Bancaria & Conciliación Automática (`/banco`, `/conciliacion`)](#21-integración-bancaria--conciliación-automática)
22. [Censo Territorial de Chiloé & Alertas Fitosanitarias (`/registro-territorial`, `/territorio`)](#22-censo-territorial-de-chiloé--alertas-fitosanitarias)
23. [Canal de Protección de Datos ARCO Ley 21.719 (`/arco`)](#23-canal-de-protección-de-datos-arco-ley-21719)
24. [Salud, Telemetría & Observabilidad de Plataforma (`/salud`)](#24-salud-telemetría--observabilidad-de-plataforma)

---

## 1. Visión & Cabina de Mando

- **Rutas**: `/inicio`, `/calendario`
- **Vistas**: `HomeView.tsx`, `InicioApicultorView.tsx`, `InicioTerritorialView.tsx`
- **Módulos clave**: `editorial-greeting.ts`, `@enjambre/calendar`

### Mecánica Interna
1. **Saludo Editorial Estacional**: En lugar de saludos genéricos, `editorial-greeting.ts` interpola la hora del día, la estación agroclimática de Chiloé (temporada de floración, invernada, flujo de néctar) y la fase lunar calculada en `moon-phase.ts`.
2. **Dashboard Multi-Rol**:
   - `admin`: KPIs financieros (ingresos netos, margen bruto, órdenes del día), alertas de folios CAF, estado de stock crítico y pedidos pendientes de despacho.
   - `apicultor`: Estado de los apiarios, colmenas que requieren inspección sanitaria prioritaria (varroa, nutrición) y previsiones meteorológicas locales.
   - `territorial`: Solicitudes de trashumancia entrantes, nuevas alertas de plaguicidas agrícolas en la comuna y estado de acreditación de actores locales.
3. **Calendario Ecosistémico (`@enjambre/calendar`)**:
   - Visualización unificada de fechas críticas: floradas nativas (Ulmo, Tiaca, Avellano), fechas de recolección programada, ferias de venta presencial, vencimientos tributarios ante el SII (declaración de F29 los días 20 de cada mes) e inspecciones sanitarias.

---

## 2. Entorno Apícola, Gemelo Digital & Cuaderno Offline

- **Rutas**: `/colmenas`, `/colmenas/cuaderno`, `/colmenas/apiarios`, `/colmenas/trazabilidad`
- **Vistas**: `ApicultorView.tsx`, `CuadernoCampoView.tsx`
- **Componentes clave**: `ApiarioManager.tsx`, `ColmenaFicha.tsx`, `GemeloApiario.tsx`, `RecorderVoz.tsx`, `HiveWhatIfPanel.tsx`, `LedgerReadbackTerminal.tsx`
- **BFF / Rutas**: `/api/bitacora`, `/api/bitacora/ledger`, `/api/ai/bitacora/transcribe`
- **Persistencia**: Supabase (`apiarios`, `colmenas`, `inspecciones`, `bitacora_eventos`) + Dexie (`NucleoBitacoraDB`).

### Mecánica Interna
1. **Gemelo Digital del Apiario (`GemeloApiario.tsx`)**:
   - Representación espacial interactiva de la disposición física de las colmenas en cada apiario.
   - Código cromático según estado de salud biológica: verde (óptima), ámbar (requiere revisión nutricional o espacio), rojo (alerta de varroa, orfandad de reina o enfermedad).
2. **Ficha Completa de Colmena (`ColmenaFicha.tsx`)**:
   - Inspección cuadro por cuadro: cuadros con miel, polen, cría operculada, cría abierta y espacio libre.
   - Trazabilidad genética de la reina (origen virgen local, año, color de marcado internacional, comportamiento higiénico y mansedumbre).
   - Simulación hipotética (`HiveWhatIfPanel.tsx`): Modelamiento de decisiones de manejo apícola (ej. colocar alza melífera vs alimentar) proyectando el riesgo de enjambrazón.
3. **Cuaderno de Campo con Audio Offline & Groq AI**:
   - Diseñado para operar en zonas sin internet en el bosque nativo.
   - `RecorderVoz.tsx` graba notas de voz en formato `Blob` directo a Dexie (`NucleoBitacoraDB`).
   - Al recuperar señal, `useBitacoraSyncEngine` sube el audio al bucket `bitacora-audio`.
   - El endpoint `/api/ai/bitacora/transcribe` procesa el audio con Whisper (Groq) y un LLM extrae entidades estructuradas (reina vista, marcos de postura, conteo de ácaros varroa).
4. **Ledger Inmutable de Bitácora (`LedgerReadbackTerminal.tsx`)**:
   - Terminal para inspeccionar los bloques criptográficos SHA-256 de cada evento de bitácora, previniendo falsificación retroactiva de datos sanitarios.

---

## 3. Declaración Oficial SAG

- **Ruta**: `/declaracion-sag`
- **Vista**: `DeclaracionSagView.tsx`
- **BFF**: `/api/registro-territorial/declaracion-sag`

### Mecánica Interna
1. **Cumplimiento Normativo SAG (Servicio Agrícola y Ganadero)**:
   - Compila automáticamente la información exigida por la Resolución Exenta del SAG para el Registro Nacional Apícola (FRNA).
2. **Cruce de Datos Vivo**:
   - Conecta el RUP (Rol Único Pecuario) del titular con el inventario vivo de colmenas activas registradas en `/colmenas`.
   - Desglosa la aptitud productiva declarada (producción de miel, polinización, cría de reinas).
3. **Formulario Imprimible Oficial**:
   - Genera una vista lista para impresión física o PDF estandarizado según las planillas oficiales del SAG, incluyendo georreferenciación formal (UTM / WGS84) y desglose de movimientos de trashumancia autorizados.

---

## 4. Oráculo Fenológico & Botánica Nativa

- **Rutas**: `/fenologia`, `/fenologia/especies`
- **Vistas**: `FenologiaView.tsx`, `EspeciesNativasView.tsx`
- **Componentes clave**: `CalibracionModal.tsx`, `UbicacionPickerModal.tsx`
- **BFF**: `/api/fenologia`, `/api/meteo`, `/api/floraciones-publicas`

### Mecánica Interna
1. **Cálculo de Grados Día de Desarrollo (GDD)**:
   - Modela la acumulación térmica necesaria para inducir la floración de especies nativas de Chiloé:
     $$\text{GDD} = \max\left(0, \frac{T_{\max} + T_{\min}}{2} - T_{\text{base}}\right)$$
   - Parámetros por especie: Tiaca ($T_{\text{base}} = 7^\circ\text{C}$), Ulmo ($T_{\text{base}} = 8^\circ\text{C}$), Avellano ($T_{\text{base}} = 6^\circ\text{C}$), Tepú ($T_{\text{base}} = 6.5^\circ\text{C}$).
2. **Integración Meteorológica en Tiempo Real (`/api/meteo`)**:
   - Consume datos satelitales y de estaciones locales vía proxy Open-Meteo para coordenadas fijas en Pureo (Queilen, Chiloé).
   - Alerta a los apicultores sobre "ventanas de pecoreo" (días con temperatura $> 14^\circ\text{C}$, humedad $< 75\%$ y viento $< 20\text{ km/h}$).
3. **Calibración Empírica (`CalibracionModal.tsx`)**:
   - Permite ajustar los umbrales de GDD si las observaciones reales de floración en terreno discrepan del modelo matemático, mejorando la precisión año tras año.

---

## 5. Regeneración, Biomasa & Captura de CO2

- **Ruta**: `/regeneracion`
- **Vista**: `RegeneracionView.tsx`
- **Paquete de dominio**: `@enjambre/impacto`
- **BFF**: `/api/produccion/regeneracion`

### Mecánica Interna
1. **Inventario Forestal Georreferenciado**:
   - Registro de parcelas de bosque nativo protegido y árboles plantados en predios asociados.
   - Parámetros dasométricos: Especie botánica, DAP (diámetro a la altura del pecho en cm), altura total en metros y estadio de crecimiento (`plantula`, `juvenil`, `adulto`, `veterano`).
2. **Ecuaciones Alométricas Específicas (`calcularBiomasaYCO2`)**:
   - Aplica coeficientes alométricos validados para el bosque templado lluvioso valdiviano y norpatagónico.
   - Calcula biomasa aérea, biomasa subterránea (raíces) y tasa de secuestro anual de dióxido de carbono ($\text{kg CO}_2\text{e/árbol/año}$).
3. **Métricas Open-Book de Retorno Social (IRR)**:
   - Proyecta el Retorno Interno de Regeneración (`computeIrrSimplificado`), vinculando cada frasco de miel comercializado con el sostenimiento directo de metros cuadrados de bosque nativo.

---

## 6. Recolección a Granel, Lotes & Fraccionamiento

- **Rutas**: `/produccion`, `/produccion/recoleccion`, `/produccion/lotes`, `/produccion/inventario`
- **Vistas**: `ProduccionView.tsx`, `RecoleccionView.tsx`, `InventarioView.tsx`
- **Componentes clave**: `LoteComercialForm.tsx`, `AnalisisLaboratorioPanel.tsx`, `LotePasaporteQR.tsx`
- **BFF**: `/api/produccion`, `/api/inventario`

### Mecánica Interna
1. **Recolección en Origen (Vocabulario Sagrado: Jamás Cosecha)**:
   - Ingreso de alzas y peso bruto cosechado en campo por apiario y colmena.
   - Registro de humedad inicial mediante refractómetro óptico (estándar chileno NCh: máximo 18% para evitar fermentación).
2. **Creación Atómica de Lotes Envasados (`attachCosechaToLote`)**:
   - Asocia una o varias recolecciones a un lote comercial único.
   - Asigna código alfanumérico estandarizado (ej. `L-2026-ULMO-01`).
3. **Análisis de Laboratorio Certificado (`AnalisisLaboratorioPanel.tsx`)**:
   - Registro de parámetros físico-químicos: Humedad (%), Grados Brix ($^\circ\text{Bx} \ge 80$), Hidroximetilfurfural (HMF en $\text{mg/kg}$, indicador de frescura y ausencia de daño térmico), acidez libre y conductividad eléctrica.
   - Perfil de polen dominante (melisopalinología: Tiaca, Ulmo, Meli).
4. **Algoritmo de Fraccionamiento y Empaque Sugerido**:
   - Calcula de forma automática la cantidad de tarros de 250 g, 500 g o 1000 g que pueden envasarse a partir del volumen a granel, descontando un factor de merma técnica parametrizable (1.5% a 3%).
   - Alerta quiebres de stock proyectados (`demanda_30d` vs `dias_stock_estimado`).

---

## 7. Alquimia Soberana: Alambique e Hidromiel

- **Rutas**: `/alambique`, `/alambique/[id]`, `/hidromiel`, `/hidromiel/[id]`
- **Vistas**: `AlambiqueView.tsx`, `AlambiqueDashboard.tsx`, `HidromielView.tsx`
- **Componentes clave**: `DestilacionForm.tsx`, `PlantaForm.tsx`, `ProductoForm.tsx`
- **BFF**: `/api/alambique`, `/api/hidromiel` (rutas públicas `/publico/:id` + rutas admin autenticadas)

### Mecánica Interna
1. **Bitácora de Destilación Botánica (`DestilacionForm.tsx`)**:
   - Maceración de botánicos nativos (Hojas de Canelo, Murta silvestre, Tepú) en alcohol base neutro o aguardiente.
   - Control de destilador de cobre: volumen de carga, temperatura de inicio de hervor, registro de cortes (cabeza descartada por metanol, corazón noble embotellado, colas reutilizadas).
   - Graduación alcohólica final corregida por temperatura ($^\circ\text{GL}$).
2. **Control Enológico de Hidromiel (`HidromielView.tsx`)**:
   - Control de fermentación con miel de bosque: Densidad Inicial (OG), Densidad Final (FG), levaduras seleccionadas (hidromiel seca, semiseca o dulce), nutrientes nitrogenados y pH.
   - Cálculo automático de alcohol por volumen ($\text{ABV} = (\text{OG} - \text{FG}) \times 131.25$).
   - Maduración en barrica o botella de vidrio oscura.
3. **Pasaportes Públicos Escaneables (`/alambique/[id]`, `/hidromiel/[id]`)**:
   - Páginas públicas de lectura directa (sin autenticación requerida) accesibles mediante el código QR de la botella, desplegando botánicos utilizados, fecha de destilación y maestro destilador.

---

## 8. Escandallo, Costeo Unitario & Piso de Costo

- **Ruta**: `/costeo`
- **Vista**: `CosteoView.tsx`
- **Componentes clave**: `RecetaForm.tsx`, `RecetaDetailModal.tsx`, `EscandalloTorta.tsx`, `TemporadaPanel.tsx`
- **BFF**: `/api/costeo`, `/api/payments/cost-floor`
- **Paquete de dominio**: `@enjambre/pricing`

### Mecánica Interna
1. **Escandallo Unitario por Producto (BOM: Bill of Materials)**:
   - Desglosa el costo exacto de producción de cada unidad a la venta:
     - Miel cruda nativa (según kg utilizados).
     - Botánicos de infusión o maceración.
     - Envase de vidrio italiano / tapa metálica con sello hermético.
     - Etiqueta de algodón con textura y barniz sectorizado.
     - Sello de cera de abejas o faja de seguridad.
     - Mano de obra directa de extracción y envasado (minutos/frasco).
     - Amortización de materiales y merma técnica.
2. **Visualización Gráfica (`EscandalloTorta.tsx`)**:
   - Gráfico de torta que descompone el porcentaje de costo de insumos vs packaging vs trabajo humano.
3. **Protección de Piso de Costo Anti-Dumping (`enforceCostFloor`)**:
   - El motor de pagos de Núcleo (`src/api/lib/payments/cost-floor.ts`) valida cada compra en la tienda web o POS:
     $$\text{Precio Final Cobrado} \ge \text{Costo Unitario de Reposición}$$
   - Si una combinación excesiva de cupones, descuentos por volumen o puntos rebaja el precio por debajo del piso de costo, el checkout rechaza la operación automáticamente, impidiendo vender a pérdida.

---

## 9. Packaging, Bóveda de Etiquetas & Portal Imprenta

- **Rutas**: `/portal-imprenta`, `/etiquetas/artes`, `/etiquetas/qr`
- **Vistas**: `PortalImprentaView.tsx`, `BovedaEtiquetasView.tsx`
- **BFF**: `/api/cms/storage`, `/api/lotes-publicos`

### Mecánica Interna
1. **Portal Imprenta Profesional**:
   - Diseñado para comunicarse con imprentas industriales y talleres de encuadernación/etiquetado de lujo.
   - Especificaciones técnicas normalizadas: cotas en milímetros, líneas de troquel, sangrado perimetral (bleed de 2 mm), zona de seguridad de textos, sobreimpresión de negro y perfiles de color CMYK (FOGRA39).
2. **Bóveda de Etiquetas**:
   - Repositorio centralizado de artes vectoriales PDF/AI aprobados para impresión según lote y producto.
   - Historial de cambios y aprobación de pruebas de color de imprenta.

---

## 10. Trazabilidad Phygital & Sellos Criptográficos

- **Rutas**: `/etiquetas/qr`, `/lote/[id]`, `/phygital`
- **Vistas**: `LotePasaporteView.tsx`, `PhygitalView.tsx`
- **BFF**: `/api/phygital`, `/api/blockchain`, `/api/lotes-publicos`

### Mecánica Interna
1. **Emisión de Códigos QR Serializados**:
   - Generación de identificadores criptográficos únicos vinculados a cada unidad física producida.
2. **Pasaporte Digital de Lote (`/lote/[id]`)**:
   - Interfaz web pública ultra-rápida (diseñada para cargar en segundos al ser escaneada en un restaurante o tienda).
   - Despliega:
     - Mapa interactivo Leaflet centrado en el apiario de origen en Chiloé.
     - Fecha y condiciones climáticas de la recolección.
     - Resultados del análisis químico (humedad, HMF, brix).
     - Curva de floración botánica asociada.
3. **Anclaje Inmutable en Blockchain (`blockchain/anchors.ts`)**:
   - El sistema calcula el digest SHA-256 de los datos de trazabilidad del lote:
     $$\text{Hash} = \text{SHA-256}(\text{LoteID} + \text{ApiarioID} + \text{Fecha} + \text{Humedad} + \text{Kg})$$
   - El hash se estampa como una transacción en la red Polygon Amoy, permitiendo a cualquier auditor o consumidor contrastar la autenticidad matemática del certificado sin depender de que la base de datos de la empresa exista en el futuro.

---

## 11. Despacho, Envíos & Centros de Stock

- **Rutas**: `/despacho/envios`, `/despacho/centros`, `/despacho/proveedores`, `/despacho/mapa`
- **Vistas**: `EnviosView.tsx`, `CentrosStockView.tsx`, `ProveedoresView.tsx`, `MapaEnviosView.tsx`
- **BFF**: `/api/logistica`
- **Paquete de dominio**: `@enjambre/logistica`

### Mecánica Interna
1. **Gestión Multibodega (`CentrosStockView.tsx`)**:
   - Administra inventarios separados entre la Bodega Central en Chiloé (origen), el Hub de distribución en Santiago y bodegas en consignación.
   - Transferencias internas entre centros con guía de despacho.
2. **Módulo de Envíos (`EnviosView.tsx`)**:
   - Integración con couriers nacionales (Chilexpress, Starken, Blue Express) y retiro en punto físico.
   - Cálculo de tarifa dinámica según peso volumétrico y comuna de destino (`computeShippingCostWithRates`).
   - Flujo de estados: `pendiente` $\to$ `preparacion` $\to$ `despachado` $\to$ `en_transito` $\to$ `entregado`.
   - Al marcar un paquete como despachado, dispara un evento transaccional que notifica al cliente con su número de seguimiento oficial.
3. **Directorio de Proveedores (`ProveedoresView.tsx`)**:
   - Fichas técnicas de proveedores clave (frascos de vidrio, alcohol etílico de cereal, tapas twist-off, cajas de embalaje reforzadas).

---

## 12. Editor de Tienda Visual & CMS

- **Ruta**: `/editor-tienda`
- **Vista**: `EditorTiendaView.tsx` (191 KB)
- **Módulos clave**: `editor-tienda-sections.ts`, `editor-tienda-schema.ts`, `process-image.ts`, `revalidate-tienda.ts`
- **BFF**: `/api/cms`
- **Persistencia**: Supabase (`site_content`, buckets `cms`) + ISR en `apps/tienda`.

### Mecánica Interna
1. **Pares de Sección (`EDITOR_SECTION_PAIRS`)**:
   - Cada bloque visual de la tienda web se modela como un par de `settings` (estilo, tipografía, columnas, formato) e `items` (fichas, fotos, testimonios, colecciones).
   - Bloques cubiertos: `colecciones`, `nosotros`, `galeria`, `ciencia`, `talleres`, `announcement_slides`, `menu_links`, `footer_social`, `pwa_nav_items`, y las 5 páginas de aterrizaje B2B (`b2b_cafeterias`, `b2b_hoteles`, `b2b_tiendas_gourmet`, `b2b_ferias`, `b2b_revendedores`).
2. **Auto-Guardado en Vivo (Cero Fricción)**:
   - Todo cambio realizado en el panel visual se persiste de inmediato en la base de datos sin requerir que el operador presione un botón de "publicar".
   - **Bloqueo Optimista**: Valida `expected_updated_at` para impedir que dos operadores sobreescriban los cambios del otro en sesiones simultáneas.
3. **Pipeline de Imagen WebP en Cliente (`processImage`)**:
   - Las imágenes subidas por el operador se procesan dentro del navegador con un canvas HTML5 antes de transmitirse por la red:
     - Downsampling escalonado (anti-aliasing) con un tope de 1600 px de ancho.
     - Conversión a WebP con calidad 88%.
     - Almacenamiento en bucket de Supabase con `Cache-Control: 31536000` (inmutable por 1 año).
4. **Revalidación Instantánea ISR (`revalidateTiendaCms`)**:
   - Tras persistir el contenido, Núcleo envía un POST autenticado (`x-internal-key`) al endpoint `/api/revalidate-cms` de `apps/tienda`, purgando la caché de Next.js en el CDN de Vercel en milisegundos.

---

## 13. Catálogo Maestro, Taxonomías & Descuentos

- **Rutas**: `/catalogo`, `/catalogo/taxonomias`, `/catalogo/productos`, `/descuentos`
- **Vistas**: `CatalogoView.tsx`, `DescuentosView.tsx`
- **BFF**: `/api/produccion/catalogo`, `/api/variantes`

### Mecánica Interna
1. **Catálogo Maestro de Productos**:
   - Control centralizado de títulos, descripciones sensoriales, fotos, peso neto, atributos botánicos y precios base.
   - Flags de disponibilidad multicanal: `disponible_tienda_web`, `disponible_pos_feria`, `disponible_b2b`.
2. **Gestión de Variantes y Fortificaciones**:
   - Exposición pública en `/api/variantes` para que tanto Tienda como el POS de Campo consulten formatos (250g, 500g, 1kg) y adiciones botánicas en tiempo real.
3. **Motor de Cupones y Descuentos (`DescuentosView.tsx`)**:
   - Creación de cupones con fecha de vigencia, tope de usos totales y por usuario, monto fijo en CLP o porcentaje.
   - Reglas de exclusión: impedimento de acumulación con descuentos de membresía o promociones activas.

---

## 14. Club Legado & Suscripciones de Reposición

- **Rutas**: `/club-legado`, `/planes-suscripcion`
- **Vistas**: `ClubLegadoView.tsx`, `SubscriptionPlansView.tsx`
- **Componentes clave**: `LoyaltyRewardsPanel.tsx`, `SubscriptionPlanForm.tsx`
- **BFF**: `/api/subscriptions/checkout`, `/api/wallet`

### Mecánica Interna
1. **Club Legado (Membresía Universal Soberana)**:
   - Todo cliente registrado forma parte del Club Legado con niveles de reconocimiento ("Guardián del Bosque").
   - Acredita sellos de origen y puntos por cada compra realizada en la web o en ferias presenciales.
2. **Suscripciones de Reposición Recurrente**:
   - Configuración de planes periódicos de entrega de miel (mensual, bimensual, reserva anual).
   - Integración con pasarelas de pago recurrentes (Flow Suscripciones / Webpay recurrente).
   - Gestión de dunning (reintentos ante tarjetas vencidas o sin fondos) ejecutada diariamente en el cron de las 14:00 UTC.
3. **Catálogo de Canje de Sellos (`LoyaltyRewardsPanel.tsx`)**:
   - Panel donde se definen las recompensas canjeables con sellos acumulados (cucharones de madera nativa de tepú, frascos de miel infusionada exclusiva, visitas guiadas a los apiarios de Chiloé).

---

## 15. Monitor de Feria en Tiempo Real & Arqueo

- **Rutas**: `/monitor-feria`, `/operadores-feria`
- **Vista**: `FeriaMonitorView.tsx`
- **BFF**: `/api/cash-sessions`, `/api/rep-ventas`

### Mecánica Interna
1. **Telemetría de Ventas Presenciales de Campo (`apps/campo`)**:
   - Se suscribe al canal Realtime de Supabase para visualizar en vivo las ventas cerradas en terminales de feria.
   - Desglose por método de pago: Efectivo, Transferencia electrónica, Tarjeta débito/crédito (SumUp).
2. **Auditoría de Sesiones de Caja y Alertas Delta**:
   - Control de apertura de caja (monto inicial de sencillo en efectivo).
   - Declaración de arqueo al cierre de la sesión.
   - **Alerta Delta**: Si el monto físico declarado difiere del saldo esperado según las transacciones del sistema, emite una alerta destacada y solicita justificación formal antes de consolidar el cierre de caja.
3. **Replay Idempotente de Cola Offline**:
   - Cuando un vendedor en una feria rural recupera internet, el motor de Campo dispara su cola de sincronización. Núcleo recibe cada venta con su `client_request_id` (almacenado como `buy_order`), evitando duplicación de inventario o boletas.

---

## 16. Microcanales B2B, Cotizador & Percepción Sensorial CATA

- **Ruta**: `/microcanales`
- **Vista**: `MicrocanalesView.tsx`
- **Componentes clave**: `PuntosVentaPanel.tsx`, `RevendedoresPanel.tsx`, `CondicionesComercialesPanel.tsx`, `SetsPanel.tsx`, `PercepcionPanel.tsx`
- **BFF**: `/api/b2b`, `/api/b2b-publico`, `/api/percepcion`

### Mecánica Interna
1. **Red de Puntos de Venta (Cafés, Hoteles, Tiendas Gourmet)**:
   - Registro de locales comerciales que distribuyen la miel o la utilizan en barra de café de especialidad.
   - Georreferenciación y ficha de contacto institucional.
2. **Condiciones Comerciales y Cotizador B2B**:
   - Escalas de precios al por mayor según volumen de compra (12, 24, 48+ frascos).
   - Generación de cotizaciones formales con validez temporal.
3. **Instrumento Sensorial CATA (Check-All-That-Apply)**:
   - Evaluaciones sensoriales profundas estructuradas:
     - Notas aromáticas: floral, madera húmeda, caramelo, herbal, humo.
     - Textura en boca: cremosa, fina, granulada, líquida.
     - Acidez, astringencia y persistencia gustativa.
   - Construye el mapa radar de cata para enriquecer las fichas de lote y la comunicación de alta gama.

---

## 17. Pipeline Comercial & CRM B2B

- **Rutas**: `/pipeline`, `/crm`
- **Vistas**: `PipelineView.tsx`, `CRMView.tsx`
- **BFF**: `/api/pipeline`, `/api/crm`

### Mecánica Interna
1. **Tablero Kanban Drag & Drop (`@hello-pangea/dnd`)**:
   - Gestión visual del embudo de ventas B2B para distribución mayorista y alianzas comerciales.
   - Etapas: `prospecto` $\to$ `contacto_inicial` $\to$ `propuesta_enviada` $\to$ `negociacion` $\to$ `cerrado_ganado` $\to$ `cerrado_perdido`.
2. **Ponderación de Cartera**:
   - Cada lead registra su valor estimado en CLP y probabilidad de cierre (%), calculando el valor ponderado esperado de la cartera en tiempo real.
3. **Gestión de Tareas y Seguimiento**:
   - Asignación de compromisos con fecha límite (llamadas, envío de muestras físicas, reuniones presenciales).
   - Notificaciones de tareas vencidas.

---

## 18. Creadores & Embajadores Admin

- **Rutas**: `/creadores`, `/reglas-comision`
- **Vistas**: `CreadoresAdminView.tsx`, `ReglasComisionView.tsx`
- **BFF**: `/api/referrals/*`, `/api/b2b`

### Mecánica Interna
1. **Gestión de Solicitudes de Creadores y Embajadores**:
   - Bandeja de entrada para postulaciones enviadas desde la tienda pública (`/embajadores`).
   - Aprobación/rechazo de creadores, asignación de código de enlace personalizado (`?ref=codigo`) y porcentaje de comisión.
2. **Atribución de Comisiones en Checkout**:
   - Cuando un comprador utiliza el código de un embajador, el motor de liquidación asocia la orden y calcula la comisión pactada.
3. **Reglas de Comisión Parametrizables**:
   - Matriz de comisiones por tramo de ventas, periodicidad de pago y deducción de retenciones legales correspondientes.

---

## 19. Estudio Editorial & Motion RRSS

- **Rutas**: `/estudio-rrss`, `/estudio-audiovisual`
- **Vistas**: `EstudioRrssView.tsx`, `EstudioAudiovisualView.tsx`
- **Componentes clave**: `SlideStudioWorkspace.tsx`, `SlideStudioCommandPalette.tsx`, `LivePresenterKioskModal.tsx`, `HardDataInjectorModal.tsx`, `TabletopPrintModal.tsx`
- **Doctrina**: [`docs/ANTI_SLOP.md`](./ANTI_SLOP.md), [`docs/ESTUDIO_RRSS_MOTION.md`](./ESTUDIO_RRSS_MOTION.md)

### Mecánica Interna
1. **Generador Editorial Multiformato (`SlideStudioWorkspace.tsx`)**:
   - Entorno visual en el navegador para maquetar piezas gráficas, carruseles educativos, kits de mesa para cafeterías y fichas botánicas.
   - Formatos estandarizados: 4:5 (Post vertical Instagram), 9:16 (Stories / Reels / TikTok), 1:1 (Cuadrado).
   - **Paleta de Comandos (`SlideStudioCommandPalette.tsx`)**: Acceso directo a atajos, cambio de plantillas, inyección de datos y presets.
   - **Inyector de Datos Duros (`HardDataInjectorModal.tsx`)**: Inyecta métricas territoriales vivas (polen, CO₂, coordenadas de apiario) directamente en las diapositivas.
   - **Kiosco en Vivo e Impresión Tabletop**: Modo presentación interactiva y exportación de fichas físicas para mesas de cata y mesones de emporios.
2. **Constricciones de Marca Anti-Slop (`BrandViolation`)**:
   - Validador en tiempo real que prohíbe el uso de fuentes no autorizadas, gradientes fluorescentes, ilustraciones genéricas o jerga ecologista/hippie.
   - Fuerza tipografía Cormorant Garamond / Geist, texturas de sustrato orgánico (lino, papel algodón, madera de tepú) y tonos oscuros de poder silencioso.
3. **Exportación de Alta Resolución y Video**:
   - Renderiza láminas en alta densidad de píxeles (HiDPI / Retina) y secuencias animadas para Reels y pantallas digitales.

---

## 20. Soberanía Fiscal SII & Facturación Electrónica

- **Rutas**: `/sii`, `/sii/rcv`, `/sii/impuestos`
- **Vistas**: `SiiDteView.tsx`, `RcvView.tsx`, `ImpuestosView.tsx`
- **Componentes clave**: `BandejaFiscalTab.tsx`, `FacturaCompraForm.tsx`, `HonorariosTab.tsx`, `ImpuestosTab.tsx`, `SettingsTab.tsx`
- **BFF**: `/api/sii/*`
- **Paquetes de dominio**: `@enjambre/fiscal`, `@enjambre/contable`

### Mecánica Interna
1. **Emisión y Recepción Directa de DTEs**:
   - Boleta Electrónica (39) y Boleta Exenta (41).
   - Factura Electrónica (33) y Factura Exenta (34).
   - Factura de Compra (46): Usada legalmente para retener el IVA al adquirir miel a pequeños recolectores locales no formalizados en Chiloé.
   - Nota de Crédito (61) y Nota de Débito (56).
   - Guía de Despacho Electrónica (52).
2. **Firma Digital XML (.pfx)**:
   - Carga segura del certificado digital de la empresa (`SettingsTab.tsx`).
   - Construcción del sobre electrónico XML, cálculo de digest SHA-1 y firma digital con clave RSA privada.
3. **Control y Alerta de Timbres CAF (`caf-guard.ts`)**:
   - Administración de folios autorizados por el SII.
   - Monitoreo de folios restantes; genera alertas rojas preventivas y detiene ventas en el checkout si los folios se agotan, evitando sanciones tributarias.
4. **Registro de Compras y Ventas (RCV)**:
   - Sincronización con el catastro oficial del SII para conciliar compras acreditadas de insumos contra facturas físicas.
5. **Propuesta Automática de Formulario 29 (F29)**:
   - Calcula Débito Fiscal (IVA 19% por ventas), Crédito Fiscal (IVA recuperable por insumos), Retención de Boletas de Honorarios (13.75% / 14.5%) y Pago Provisional Mensual (PPM obligatorio).

---

## 21. Integración Bancaria & Conciliación Automática

- **Rutas**: `/banco`, `/conciliacion`
- **Vistas**: `BancoChileView.tsx`, `ConciliacionAutoView.tsx`
- **BFF**: `/api/banco-chile/*`
- **Paquete de dominio**: `@enjambre/banco-chile`

### Mecánica Interna
1. **Conexión API Empresas Banco de Chile**:
   - Autenticación segura mediante credenciales empresariales.
   - Descarga diaria de cartolas bancarias consolidadas y movimientos de cuenta corriente.
2. **Motor Algorítmico de Conciliación (`conciliacion-auto.ts`)**:
   - Realiza matching de tres vías:
     - Cruza abonos bancarios manuales con órdenes pendientes de la tienda web mediante RUT y monto exacto.
     - Cruza liquidaciones agrupadas de Flow / Transbank / SumUp descontando la comisión financiera de adquirencia.
     - Cruza cargos bancarios con pagos a proveedores registrados en `/contable/gastos`.
3. **Nóminas Masivas de Pago**:
   - Generación de archivos TEF (Transferencia Electrónica de Fondos) para liquidación masiva de comisiones a representantes de venta y pagos a cosecheros.

---

## 22. Censo Territorial de Chiloé & Alertas Fitosanitarias

- **Rutas**: `/registro-territorial`, `/territorio`, `/territorio/mapa`, `/territorio/alertas`, `/territorio/trashumancia`
- **Vistas**: `RegistroTerritorialView.tsx`, `TerritorioHomeView.tsx`
- **Componentes clave**: `AlertaFitosanitariaForm.tsx`, `AlertasPanel.tsx`, `InscripcionActorForm.tsx`, `ApiarioExternoForm.tsx`, `PredioForm.tsx`, `MapaTerritorial.tsx`
- **BFF**: `/api/registro-territorial`, `/api/censo-publico`

### Mecánica Interna
1. **Catastro Comunal Apícola**:
   - Registro de apicultores locales, predios rurales disponibles y apiarios foráneos.
   - Validación de RUT chileno con algoritmo Módulo 11 (`@enjambre/contable`).
2. **Red de Alerta Temprana Fitosanitaria**:
   - Cuando un agricultor o empresa registra una aplicación programada de plaguicidas agrícolas (fungicidas, insecticidas neonicotinoides):
     - El sistema ejecuta la fórmula de Haversine (`haversineKm`) para calcular la distancia euclidiana esférica respecto a todos los apiarios registrados.
     - Si un apiario se ubica dentro del radio de toxicidad (ej. 3 km a la redonda), el backend encola una notificación transaccional urgente (correo y mensaje push) para que el apicultor cierre sus piqueras o traslade temporalmente sus colmenas.
3. **Fiscalización de Trashumancia**:
   - Evaluación técnica de solicitudes de trashumancia según distancias mínimas legales (`distanciaMinimaLegalKm`) para evitar sobrecarga del bosque nativo y contagio sanitario.

---

## 23. Canal de Protección de Datos ARCO Ley 21.719

- **Ruta**: `/arco`
- **Vista**: `ArcoAdminView.tsx`
- **BFF**: `/api/arco/*`

### Mecánica Interna
1. **Cumplimiento Legal Estricto (Ley 21.719)**:
   - Canal formal para procesar solicitudes ciudadanas de Acceso, Rectificación, Cancelación y Oposición de datos personales.
2. **Control de Plazos Legales (SLA)**:
   - Temporizador automático de 15 días hábiles contados desde el ingreso de la solicitud.
   - Semáforo visual de días restantes y alerta de solicitudes atrasadas.
3. **Mecanismo de Cancelación (Derecho al Olvido)**:
   - Cuando se aprueba una solicitud de cancelación, el sistema anonimiza de forma irreversible el perfil del usuario, borrando datos personales de contacto pero manteniendo disociadas las transacciones fiscales obligatorias por el plazo de prescripción tributaria del SII (6 años).

---

## 24. Salud, Telemetría & Observabilidad de Plataforma

- **Ruta**: `/salud`
- **Vista**: `SaludPlataformaView.tsx`
- **BFF**: `/api/salud`, `/api/health`

### Mecánica Interna
1. **Monitor de Signos Vitales de Infraestructura**:
   - Conectividad y latencia con el cluster Postgres de Supabase.
   - Estado y disponibilidad de los buckets de Storage (`bitacora-audio`, `cms`, `documentos-sii`).
2. **Semáforo Tributario y Regulatorio**:
   - Saldo de folios CAF disponibles para boletas y facturas electrónicas.
   - Fecha de vencimiento del certificado digital tributario `.pfx`.
3. **Auditoría de Colas y Workers**:
   - Estado de la cola de notificaciones transaccionales (`notification_queue`).
   - Estado de tareas programadas (crons diarios de Vercel).
   - Monitoreo del bus de eventos de seguridad (`security_events`).

---

*Documento completado: Octubre 2026. Este catálogo representa el inventario técnico vivo de todas las herramientas operativas de `@enjambre/nucleo`.*
