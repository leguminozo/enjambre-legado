# Frontend Roadmap — La Experiencia de Lujo

> Vision de producto por aplicacion. Estado actual + lo que falta para alcanzar la excelencia.

---

## 1. Tienda — Experiencia del Cliente (D2C)

### Estado Actual
- [x] Landing editorial con secciones (Hero, Servicios, Colecciones, Impacto, Contacto)
- [x] Catalogo de productos con filtros
- [x] Ficha de producto individual (`/producto/[slug]`)
- [x] Checkout funcional con Transbank Webpay
- [x] Admin dashboard (productos, ordenes, clientes, colecciones)
- [x] Integraciones SII/Bancos/Notificaciones (stub)
- [x] CMS dinamico via `site_content`

### Pendiente

#### [ ] Perfil de Usuario "Guardian"
- Pagina donde el cliente ve: historial de pedidos, impacto ambiental (arboles plantados), nivel de fidelizacion
- Estetica: Tablero minimalista con visualizacion de datos (recharts)
- Ruta: `/perfil` o `/mi-impacto`

#### [ ] Checkout Cinematografico
- El proceso de pago es funcional pero estandar
- Transicion suave hacia el pago con micro-videos del bosque mientras se procesa
- Pagina de exito que se sienta como una "recompensa"
- Animaciones de loading con GSAP

#### [ ] Multi-idioma (i18n)
- La tienda solo habla espanol
- Para exportacion selectiva (Dubai, Asia) es imperativo Ingles
- Implementar `next-intl` (ya usado en EIRL como referencia)
- Traducir el core de la landing + catalogo

#### [ ] Trazabilidad via QR
- Cada producto genera un QR que enlaza a `/producto/[slug]#trazabilidad`
- El cliente ve: colmena de origen, fecha de cosecha, certificaciones, arboles financiados
- Integrar con `blockchain_hash` de la colmena

#### [ ] Fidelizacion "Guardian del Bosque"
- Sistema de puntos por compra
- Niveles con beneficios (descuentos, acceso a ediciones limitadas)
- Visualizacion de impacto acumulado

---

## 2. Nucleo — El Cerebro del Admin

### Estado Actual
- [x] Login con redireccion por rol
- [x] Vista de mapa interactivo (Leaflet + PostGIS)
- [x] Vistas por rol (Apicultor, Vendedor, Gerente, Logistica, Marketing, Cliente, Contable)
- [x] PWA con service worker y manifest
- [x] TanStack Query para datos remotos
- [x] Zustand para estado global

### Pendiente

#### [ ] Dashboard Ejecutivo (Gerente)
- KPIs en tiempo real: produccion, ventas, impacto ambiental, estado de colmenas
- Graficos interactivos con recharts
- Alertas automaticas (colmenas en riesgo, stock bajo)

#### [ ] Visual Theme Configurator
- Panel donde subir fotos del Hero, cambiar mensajes, actualizar fechas
- Vincular con `site_content` en Supabase
- Hook `useCMSContent()` para consumir desde la tienda

#### [ ] Dashboard de Logistica en Tiempo Real
- Mapa con pedidos en transito y colmenas con mayor produccion
- Integrar `packages/maps` para capas adicionales
- Notificaciones push para actualizaciones de envio

#### [ ] CRM de Vendedores
- Historial de interacciones con clientes
- Metricas de conversion por vendedor
- Agenda de ferias y eventos

---

## 3. Campo — Herramienta del Terreno

### Estado Actual
- [x] Landing + Login
- [x] POS Catalogo + Carrito
- [x] API de venta (`/api/pos/venta`)
- [x] Offline-first con `@enjambre/offline`
- [x] Middleware con graceful error handling

### Pendiente

#### [ ] Inspeccion de Colmenas Offline
- Formulario de inspeccion que funciona sin internet
- Fotos que se almacenan localmente y se suben al recuperar conexion
- Sincronizacion con `varroa_records` y `peso_records`

#### [ ] Captura GPS de Apiarios
- Marcar ubicacion exacta de apiarios con GPS del dispositivo
- Guardar como PostGIS Point en Supabase
- Modo mapa offline con tiles cacheados

#### [ ] Modo Oscuro Automatico
- Detectar condiciones de luz (sensor del dispositivo)
- Cambio automatico entre tema claro/oscuro
- Optimizado para lectura en exteriores

#### [ ] Notificaciones Push
- Alertas de inspecciones pendientes
- Avisos de sincronizacion pendiente
- Recordatorios de tareas del calendario

---

## 4. Pulido Editorial y Wow Factor (Transversal)

### [ ] Transiciones de Pagina
- Actualmente hay un salto brusco al navegar
- Implementar GSAP o Framer Motion para fundido a negro
- Transicion tipo "cortina" que mantenga la inmersion

### [ ] Hover Effects Avanzados en Catalogo
- Las tarjetas de productos deben reaccionar organicamente
- Efecto de distorsion sutil con WebGL/Shaders o GSAP
- Parallax en imagenes de producto

### [ ] Modo "Inmersion Bosque"
- Toggle en el header para un diseno aun mas minimalista
- Sonidos ambientales sutiles de Chiloe
- Reduccion de elementos UI, tipografia mas generosa

### [ ] Animaciones de Micro-datos
- Contadores animados (GSAP) para metricas de impacto
- Progress bars animadas para niveles de fidelizacion
- Particle effects sutiles en paginas de exito

---

## 5. Performance y PWA

### [ ] Optimizacion de Imagenes Critica
- Reemplazar placeholders por WebP de ultima generacion
- Pipeline de procesamiento automatico (Sharp en build)
- Lazy loading nativo + blur placeholders

### [ ] Soporte Offline Real (Tienda)
- Navegacion del catalogo sin conexion
- Cache inteligente via Service Worker
- Cola de acciones pendientes (agregar al carrito offline)

### [ ] Performance Budget
- Lighthouse score > 90 en todas las metricas
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Bundle size por app < 200KB gzipped

---

## 6. Accesibilidad

### [ ] Auditoria WCAG 2.1 AA
- Contraste de colores en tema oscuro
- Navegacion por teclado completa
- Labels en formularios
- Alt text en todas las imagenes
- Focus indicators visibles

---

*Este documento es la vision de producto. Priorizar segun impacto en la experiencia del cliente.*
*Ultima actualizacion: Mayo 2026*
