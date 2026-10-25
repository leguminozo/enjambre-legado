# Catálogo Exhaustivo de Herramientas de Campo (apps/campo)

> **Clase de Documento: VIVO.**
> **Propósito:** Inventario exhaustivo, detallado a nivel de ingeniería y código fuente, de todas las herramientas, pantallas, modales, componentes, hooks y flujos de trabajo de `apps/campo`.
> **Audiencia:** Desarrolladores, operadores feriales (`rep_ventas`), administradores de plataforma y auditores de software de Enjambre Legado.
> **Reglas Inviolables:**
> 1. Vocabulario Sagrado: **Recolección**, jamás "cosecha".
> 2. Poder Silencioso: Elegancia discreta y excelencia técnica; cero jerga de ONG, cooperativa o abnegación obrera.
> 3. Cero fuga técnica en UI: Sin scripts `.sql`, UUIDs crudos ni comandos de terminal expuestos.
> 4. Campo es POS feria / revendedores, NO el patio apícola (el patio vive en Núcleo).

---

## Índice Rápido de Herramientas

1. [Herramienta 1: Catálogo Ferial y Venta Rápida de Un Toque](#herramienta-1-catálogo-ferial-y-venta-rápida-de-un-toque)
2. [Herramienta 2: Carrito POS y Checkout Multi-Producto](#herramienta-2-carrito-pos-y-checkout-multi-producto)
3. [Herramienta 3: Escáner Continuo de Cámara y Soporte para Pistola Láser](#herramienta-3-escáner-continuo-de-cámara-y-soporte-para-pistola-láser)
4. [Herramienta 4: Panel de Control y Arqueo de Caja](#herramienta-4-panel-de-control-y-arqueo-de-caja)
5. [Herramienta 5: Historial y Auditoría de Anulaciones de Sesión](#herramienta-5-historial-y-auditoría-de-anulaciones-de-sesión)
6. [Herramienta 6: Portal de Feria, Contrato y Consignaciones](#herramienta-6-portal-de-feria-contrato-y-consignaciones)
7. [Herramienta 7: Salvoconducto y Guía de Despacho DTE 52](#herramienta-7-salvoconducto-y-guía-de-despacho-dte-52)
8. [Herramienta 8: Declaración de Mermas y Registro de Degustación Ferial](#herramienta-8-declaración-de-mermas-y-registro-de-degustación-ferial)
9. [Herramienta 9: Módulo de Devolución de Frascos y Economía Circular](#herramienta-9-módulo-de-devolución-de-frascos-y-economía-circular)
10. [Herramienta 10: Integración Terminal SumUp (Bluetooth y API Remota)](#herramienta-10-integración-terminal-sumup-bluetooth-y-api-remota)
11. [Herramienta 11: Generador y Emisor de Comprobantes Digitales WhatsApp](#herramienta-11-generador-y-emisor-de-comprobantes-digitales-whatsapp)
12. [Herramienta 12: Motor de Impresión Térmica ESC/POS de 58mm y 80mm](#herramienta-12-motor-de-impresión-térmica-escpos-de-58mm-y-80mm)
13. [Herramienta 13: Búsqueda y Registro Rápido de Clientes en Terreno](#herramienta-13-búsqueda-y-registro-rápido-de-clientes-en-terreno)
14. [Herramienta 14: Escáner y Resolución de Pasaporte de Fidelización](#herramienta-14-escáner-y-resolución-de-pasaporte-de-fidelización)
15. [Herramienta 15: Guía Sensorial de Cata y Argumentario Organoléptico](#herramienta-15-guía-sensorial-de-cata-y-argumentario-organoléptico)
16. [Herramienta 16: Modo Atril de Mesón y Presentación Interactiva](#herramienta-16-modo-atril-de-mesón-y-presentación-interactiva)
17. [Herramienta 17: Escuela Ferial y Banco Canónico de Objeciones](#herramienta-17-escuela-ferial-y-banco-canónico-de-objeciones)
18. [Herramienta 18: Telemetría de Ventas y Outbox de Capacitación](#herramienta-18-telemetría-de-ventas-y-outbox-de-capacitación)
19. [Herramienta 19: Libro Mayor y Desglose de Comisiones del Vendedor](#herramienta-19-libro-mayor-y-desglose-de-comisiones-del-vendedor)
20. [Herramienta 20: Sistema de Tiers, Rachas y Bonos de Fidelidad](#herramienta-20-sistema-de-tiers-rachas-y-bonos-de-fidelidad)
21. [Herramienta 21: Leaderboard y Tabla de Clasificación Semanal](#herramienta-21-leaderboard-y-tabla-de-clasificación-semanal)
22. [Herramienta 22: Registro de Coordenadas Bancarias Chilenas](#herramienta-22-registro-de-coordenadas-bancarias-chilenas)
23. [Herramienta 23: Monitor y Gestor de Cola de Sincronización Local](#herramienta-23-monitor-y-gestor-de-cola-de-sincronización-local)
24. [Herramienta 24: Service Worker PWA y Manejador de Notificaciones de Terreno](#herramienta-24-service-worker-pwa-y-manejador-de-notificaciones-de-terreno)

---

### Herramienta 1: Catálogo Ferial y Venta Rápida de Un Toque
- **Ruta / Archivo:** [`apps/campo/src/app/pos/catalogo/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/pos/catalogo/page.tsx) y [`quick-sale-button.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/pos/catalogo/quick-sale-button.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Interfaz visual ágil orientada a mesón ferial con alto flujo de público. Permite concretar ventas inmediatas de productos unitarios en menos de 2 segundos sin pasar por el carrito.
- **Funcionamiento Interno y Código:**
  - `useLiveQuery` se suscribe reactivamente a `db.productos` en IndexedDB.
  - El componente `ProductoCard` está memoizado (`React.memo`) para evitar re-renderizados costosos del catálogo completo cuando una venta descuenta stock de un solo ítem.
  - `QuickSaleButton` valida si la caja está abierta (`useCashSession`). Si la caja está abierta, permite ejecutar la venta rápida descontando stock consignado y generando la orden de inmediato.
  - Ofrece acceso directo al modal de **Guía de Venta & Cata** por cada producto para apoyar el discurso de degustación.

---

### Herramienta 2: Carrito POS y Checkout Multi-Producto
- **Ruta / Archivo:** [`apps/campo/src/app/pos/carrito/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/pos/carrito/page.tsx) y [`carrito-view.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/pos/carrito/carrito-view.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Terminal de venta para clientes que adquieren múltiples variedades florales, packs de regalo o combinaciones feriales.
- **Funcionamiento Interno y Código:**
  - Gobernado por [`cart-context.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/cart-context.tsx) y la biblioteca de cálculo puro [`cart-math.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/cart-math.ts).
  - **Cálculo de Descuentos Feriales:** Aplica descuentos porcentuales (limitados por seguridad al 50% máximo para evitar abusos no autorizados: `POS_MAX_DISCOUNT_PCT = 50`) o fijos en CLP.
  - **Detección Automática de Combos (`detectFeriaCombos`):** Evalúa las reglas dinámicas configuradas para el evento (ej. *"Lleva 3 variedades distintas con 15% de descuento"*).
  - **Sugerencias de Upsell (`getFeriaUpsellNudge`):** Advierte en pantalla cuántas unidades faltan para desbloquear el siguiente combo promocional.
  - **Selector de Canales:** Permite tipificar la venta (`feria`, `delivery`, `local`, `corporativo`, `referido`) para el posterior cálculo diferenciado de comisiones.

---

### Herramienta 3: Escáner Continuo de Cámara y Soporte para Pistola Láser
- **Ruta / Archivo:** [`apps/campo/src/components/pos/continuous-stream-scanner.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/continuous-stream-scanner.tsx) y [`use-barcode-gun.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/hooks/use-barcode-gun.ts).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Automatizar la adición de productos al carrito escaneando el código de barras o QR impreso en el frasco físico.
- **Funcionamiento Interno y Código:**
  - `ContinuousStreamScanner` inicializa la cámara del dispositivo móvil usando `Html5Qrcode` a 10 fps con detección de códigos 2D y 1D (EAN-13, QR).
  - Al detectar un código válido, emite una vibración táctil y un sonido sintetizado suave (`triggerScanFeedback` en `pos-feedback.ts`).
  - `useBarcodeGun` escucha eventos de teclado (`keydown`) en toda la ventana: si detecta una ráfaga de pulsaciones a alta velocidad (< 50ms entre caracteres) culminada en `Enter`, la interpreta como una pistola lectora USB/Bluetooth física, agregando el producto al carrito sin interferir con inputs de texto normales.

---

### Herramienta 4: Panel de Control y Arqueo de Caja
- **Ruta / Archivo:** [`apps/campo/src/app/caja/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/caja/page.tsx) y [`cash-session-panel.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/cash-session-panel.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Iniciar el turno operativo declarando el efectivo de apertura (cambio) y registrar el balance final de la jornada.
- **Funcionamiento Interno y Código:**
  - Conexión directa a `CashProvider` (`cash-context.tsx`).
  - **Apertura:** Si hay conexión, invoca `POST /api/cash-sessions`. Si no hay red, genera un ID determinista local, lo guarda en `localStorage` y encola la mutación en Dexie.
  - **Input Especializado ([`clp-currency-input.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/clp-currency-input.tsx)):** Formatea montos en pesos chilenos en tiempo real con separadores de miles estándar sin alterar el estado numérico interno.
  - **Cierre con Arqueo Ciego:** El operador digita el efectivo contado. El panel calcula de forma transparente la discrepancia (`cash_difference`).

---

### Herramienta 5: Historial y Auditoría de Anulaciones de Sesión
- **Ruta / Archivo:** [`apps/campo/src/components/pos/session-voids-panel.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/session-voids-panel.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Control de seguridad para transparentar devoluciones, anulaciones de venta o correcciones de cobros erróneos realizados durante la sesión de caja activa.
- **Funcionamiento Interno y Código:**
  - Consulta en tiempo real las ventas anuladas en la sesión actual.
  - Muestra el motivo registrado, monto revertido y hora exacta, garantizando que el arqueo de caja cuadre con los comprobantes anulados físicamente.

---

### Herramienta 6: Portal de Feria, Contrato y Consignaciones
- **Ruta / Archivo:** [`apps/campo/src/app/mi-feria/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/mi-feria/page.tsx) y [`MiFeriaPortal.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/mi-feria/MiFeriaPortal.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Centro de mando del operador para supervisar el evento ferial asignado, su contrato de comisiones y el inventario físico que le fue entregado en custodia ferial.
- **Funcionamiento Interno y Código:**
  - Lee la tabla `participante_consignacion` vinculada al evento vigente.
  - Presenta una tabla con 4 columnas fundamentales: *Entregado*, *Vendido*, *Devuelto* y *Pendiente por Vender*.
  - Advierte discrepancias de inventario y permite al vendedor solicitar reposición antes de que se agote un producto estrella.

---

### Herramienta 7: Salvoconducto y Guía de Despacho DTE 52
- **Ruta / Archivo:** [`apps/campo/src/components/mi-feria/MiFeriaPortal.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/mi-feria/MiFeriaPortal.tsx) (sección Salvoconducto).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Generar e imprimir el salvoconducto de traslado de mercadería para exhibición y venta ferial, respaldado por la Guía de Despacho Electrónica (DTE 52) emitida por Núcleo ante el Servicio de Impuestos Internos (SII).
- **Funcionamiento Interno y Código:**
  - Permite al representante comercial exhibir ante inspectores del SAG, Carabineros o fiscalizadores municipales el documento oficial de origen de las colmenas y autorización de traslado territorial.

---

### Herramienta 8: Declaración de Mermas y Registro de Degustación Ferial
- **Ruta / Archivo:** [`apps/campo/src/components/mi-feria/MiFeriaPortal.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/mi-feria/MiFeriaPortal.tsx) (modal Merma/Degustación).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Justificar el consumo de frascos abiertos para la cata y degustación del público, o pérdidas accidentales por rotura de vidrio en transporte.
- **Funcionamiento Interno y Código:**
  - El vendedor selecciona la consignación afectada e indica la causa: `'degustacion'` o `'rotura_transporte'`.
  - Envía la justificación a la API de Núcleo (`POST /api/inventario/mermas`).
  - Al asentarse, la cantidad consumida en cata se deduce del inventario pendiente sin computarse como venta ni deuda exigible al vendedor en el arqueo final.

---

### Herramienta 9: Módulo de Devolución de Frascos y Economía Circular
- **Ruta / Archivo:** [`apps/campo/src/components/pos/retorno-envases-modal.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/retorno-envases-modal.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Fomentar la reutilización de envases de vidrio de alta gama en Chiloé, abonando \$500 CLP por cada frasco retornado por el cliente.
- **Funcionamiento Interno y Código:**
  - Consulta el catálogo de frascos admitidos (`/api/inventario/envases-retornables`).
  - Registra la recepción física de frascos limpios en mesón.
  - Ofrece dos salidas: descontar el crédito inmediatamente en la compra actual del cliente, o asignar puntos de fidelización directamente al correo del cliente.

---

### Herramienta 10: Integración Terminal SumUp (Bluetooth y API Remota)
- **Ruta / Archivo:** [`apps/campo/src/components/pos/sumup-context.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/sumup-context.tsx) y [`sumup-terminal-flow.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/sumup-terminal-flow.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Cobro con tarjetas de débito y crédito nacionales e internacionales a través de lectores SumUp Solo / Air.
- **Funcionamiento Interno y Código:**
  - `SumUpProvider` sincroniza la lista de terminales emparejados con la cuenta.
  - Al iniciar el checkout, invoca `startReaderCheckout` enviando el monto y el número de orden de compra.
  - Ejecuta un sondeo reactivo (`pollCheckoutStatus`) a intervalos de 2 segundos hasta recibir la confirmación de lectura exitosa (`PAID`).
  - **Modo Manual de Contingencia (`sumupMode: 'manual'`):** Permite al vendedor procesar la tarjeta en un terminal no conectado a la API e ingresar el código de autorización bancario para asentar la venta.

---

### Herramienta 11: Generador y Emisor de Comprobantes Digitales WhatsApp
- **Ruta / Archivo:** [`apps/campo/src/lib/pos-receipt.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/lib/pos-receipt.ts).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Enviar un comprobante ecológico de lujo por WhatsApp inmediatamente después del pago, sin imprimir papel.
- **Funcionamiento Interno y Código:**
  - `generateWhatsAppReceiptText` construye el cuerpo del mensaje respetando el tono sobrio del proyecto.
  - Incorpora el detalle de los productos recolectados, descuentos y el **Enlace de Reclamo Digital** (`https://.../claim/{claim_token}`).
  - `buildWhatsAppShareUrl` genera el deep-link `https://wa.me/{telefono}?text=...` para abrir la aplicación nativa de WhatsApp en el dispositivo del vendedor con un solo clic.

---

### Herramienta 12: Motor de Impresión Térmica ESC/POS de 58mm y 80mm
- **Ruta / Archivo:** [`apps/campo/src/components/pos/thermal-receipt.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/thermal-receipt.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Impresión física instantánea en impresoras térmicas portátiles Bluetooth o USB de 58mm y 80mm de ancho.
- **Funcionamiento Interno y Código:**
  - Utiliza CSS `@media print` optimizado con escala monocromática de alto contraste, márgenes a 0mm y tipografía monospace compacta.
  - Genera el código QR vectorial mediante `QRCodeSVG` embebido para que el comprador pueda escanearlo posteriormente con su celular.

---

### Herramienta 13: Búsqueda y Registro Rápido de Clientes en Terreno
- **Ruta / Archivo:** [`apps/campo/src/components/pos/client-lookup-panel.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/client-lookup-panel.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Capturar o identificar clientes durante la interacción en mesón para acumular compras históricas y personalizar la atención.
- **Funcionamiento Interno y Código:**
  - Búsqueda interactiva por nombre, correo electrónico o teléfono contra la base central.
  - Permite crear un perfil de cliente nuevo en solo 10 segundos, ingresando únicamente su nombre y teléfono/email, asociándolo automáticamente a la venta.

---

### Herramienta 14: Escáner y Resolución de Pasaporte de Fidelización
- **Ruta / Archivo:** [`apps/campo/src/app/api/wallet/qr-resolve/route.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/api/wallet/qr-resolve/route.ts) y [`ContinuousStreamScanner.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/continuous-stream-scanner.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Escanear la tarjeta digital o Apple/Google Wallet que el cliente presenta en su smartphone para aplicar descuentos por lealtad o canjear saldo.
- **Funcionamiento Interno y Código:**
  - La ruta interna valida la sesión del vendedor y reenvía el token criptográfico al BFF de Núcleo (`POST /api/wallet/qr/resolve`).
  - Retorna la identidad del cliente, puntos acumulados y promociones exclusivas vigentes.

---

### Herramienta 15: Guía Sensorial de Cata y Argumentario Organoléptico
- **Ruta / Archivo:** [`apps/campo/src/components/pos/guia-cata-modal.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/guia-cata-modal.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Proporcionar al vendedor el perfil organoléptico exacto del lote que está ofreciendo para conducir catas guiadas profesionales.
- **Funcionamiento Interno y Código:**
  - Lee el objeto `perfil_sensorial` asociado al producto en Dexie.
  - Presenta tres dimensiones sensoriales calibradas:
    1. *Intensidad en Paladar* (de Suave & Floral a Robusto & Boscoso).
    2. *Balance Dulzor / Acidez* (de Dulzor Cálido a Acidez Silvestre).
    3. *Textura & Cristalización* (de Líquida / Sedosa a Cremosa / Untable).
  - Despliega notas aromáticas primarias (madera húmeda, flor de ulmo, toques cítricos) y maridajes gourmet sugeridos (quesos maduros, infusiones nativas).

---

### Herramienta 16: Modo Atril de Mesón y Presentación Interactiva
- **Ruta / Archivo:** [`apps/campo/src/app/escuela/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/escuela/page.tsx) (vista Atril).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Convertir la tablet del punto de venta en un exhibidor digital de mesa cuando no se está cobrando, invitando al cliente a conocer el origen del producto.
- **Funcionamiento Interno y Código:**
  - Modo a pantalla completa con estética oscura de lujo, tipografía Cormorant Garamond y fotografía de alta resolución del apiario.
  - Permite a los clientes tocar cada miel para explorar su historia biocultural sin dar acceso a la caja registradora.

---

### Herramienta 17: Escuela Ferial y Banco Canónico de Objeciones
- **Ruta / Archivo:** [`apps/campo/src/app/escuela/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/escuela/page.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Formación y capacitación permanente en terreno sobre el manejo de objeciones y la superioridad botánica de la miel virgen.
- **Funcionamiento Interno y Código:**
  - Almacenado en Dexie (`escuela_material`) para consulta 100% offline.
  - Incluye las 5 objeciones canónicas del proyecto:
    1. *Cristalización:* Explicación del certificado biológico de pureza (la miel virgen cruda siempre cristaliza).
    2. *Precio:* Justificación de recolección estacional limitada en bosque virgen de fiordos protegidos.
    3. *Pureza:* Garantía de no adulteración, humedad estricta < 18% y centrifugado en frío.
    4. *Lactantes:* Normativa médica internacional de consumo seguro solo a partir de 1 año de edad.
    5. *Conservación:* Recomendación de almacenar en despensa fresca y oscura, jamás en refrigerador.

---

### Herramienta 18: Telemetría de Ventas y Outbox de Capacitación
- **Ruta / Archivo:** [`apps/campo/src/lib/offline/db.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/lib/offline/db.ts) (`escuela_outbox`).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Registrar el nivel de preparación técnica de los representantes feriales y las dudas más frecuentes de los clientes en terreno.
- **Funcionamiento Interno y Código:**
  - Cada vez que el vendedor consulta un argumento, abre el modo atril o completa el quiz de conocimientos, se añade un registro en `escuela_outbox`.
  - El motor de sincronización sube estas métricas de forma silenciosa al servidor cuando detecta conexión.

---

### Herramienta 19: Libro Mayor y Desglose de Comisiones del Vendedor
- **Ruta / Archivo:** [`apps/campo/src/app/pos/historial/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/pos/historial/page.tsx) y [`/comisiones`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/comisiones/page.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Transparentar los ingresos económicos del representante comercial por cada venta concretada.
- **Funcionamiento Interno y Código:**
  - Desglosa la fórmula de remuneración de Enjambre Legado:
    $$\text{Comisión Total} = (\text{Comisión Base} \times \text{Multiplicador Volumen} \times \text{Multiplicador Tier}) + \text{Bono Fidelidad} + \text{Bono Racha}$$
  - Muestra el estado de pago (*Pendiente de Liquidación* vs *Pagado vía Transferencia*).

---

### Herramienta 20: Sistema de Tiers, Rachas y Bonos de Fidelidad
- **Ruta / Archivo:** [`apps/campo/src/components/pos/tier-badge.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/tier-badge.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Gamificación profesional y reconocimiento al compromiso del vendedor en ferias sucesivas.
- **Funcionamiento Interno y Código:**
  - `RepTierBadge` y `RepTierProgressBar` calculan la distancia en volumen de ventas hacia el siguiente nivel (Bronce, Plata, Oro, Embajador Territorial).
  - Otorga multiplicadores de racha por presentarse a tiempo y mantener ventas consecutivas durante la temporada estival.

---

### Herramienta 21: Leaderboard y Tabla de Clasificación Semanal
- **Ruta / Archivo:** [`apps/campo/src/app/leaderboard/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/leaderboard/page.tsx) y [`LeaderboardPanel.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/leaderboard/LeaderboardPanel.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Fomentar el compañerismo y la superación en el equipo de terreno mediante un ranking transparente y metas comunitarias de recolección y venta.
- **Funcionamiento Interno y Código:**
  - Consulta en tiempo real las métricas de la semana.
  - Presenta las ventas totales del equipo y premia al representante con mejor retención de clientes y mejor puntuación en satisfacción ferial.

---

### Herramienta 22: Registro de Coordenadas Bancarias Chilenas
- **Ruta / Archivo:** [`apps/campo/src/app/pos/historial/page.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/app/pos/historial/page.tsx) (pestaña `datos_pago`).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Permitir al vendedor registrar y actualizar su cuenta bancaria para la transferencia periódica de comisiones devengadas.
- **Funcionamiento Interno y Código:**
  - Catálogo validado de bancos chilenos (`BancoEstado CuentaRUT`, `Banco de Chile`, `Santander`, `BCI`, `Mach`, `Tenpo`, etc.).
  - Validador sintáctico de RUT chileno con dígito verificador módulo 11.
  - Guarda los datos de forma segura en el perfil del usuario mediante el BFF de Núcleo.

---

### Herramienta 23: Monitor y Gestor de Cola de Sincronización Local
- **Ruta / Archivo:** [`apps/campo/src/components/pos/sync-queue-modal.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/sync-queue-modal.tsx) y [`sync-status-banner.tsx`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/components/pos/sync-status-banner.tsx).
- **Roles Autorizados:** `rep_ventas`, `admin`.
- **Propósito de Negocio:** Brindar visibilidad y control sobre las operaciones pendientes de subir al servidor central.
- **Funcionamiento Interno y Código:**
  - Muestra un banner discreto en la parte superior del POS indicando el estado del enlace: *Sincronizado*, *Sin conexión (N ventas en cola local)*, o *Sincronizando...*.
  - El modal permite inspeccionar cada transacción encolada, ver si tuvo errores de red y forzar un reintento manual inmediato con un solo botón.

---

### Herramienta 24: Service Worker PWA y Manejador de Notificaciones de Terreno
- **Ruta / Archivo:** [`apps/campo/src/sw.ts`](file:///Users/macbook/Desktop/oyz%20app/apps/campo/src/sw.ts).
- **Roles Autorizados:** Sistema / PWA.
- **Propósito de Negocio:** Habilitar la instalación en pantalla de inicio de tablets y smartphones y garantizar la carga de la interfaz sin red.
- **Funcionamiento Interno y Código:**
  - Basado en `@serwist/next`.
  - Cachea las rutas de navegación críticas y assets estáticos.
  - Intercepta eventos de red, sirviendo la UI desde caché cuando falla la conexión y administrando notificaciones push del sistema operativo.
