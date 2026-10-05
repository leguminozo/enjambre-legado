# DOSSIER JURÍDICO, REGULATORIO Y FISCAL INTEGRAL: ENJAMBRE LEGADO
## Auditoría Profunda de la Arquitectura Físico-Digital, Contingencias y Hoja de Ruta Legal

**Documento para:** Abogado Corporativo / Regulatorio / Tributario  
**Emisor:** Arquitectura de Sistemas y Dirección Operativa de Enjambre Legado  
**Fecha de corte:** Septiembre 2026  
**Jurisdicción principal:** República de Chile (con operaciones transfronterizas SaaS)  
**Ecosistema tecnológico bajo auditoría:**
- **Tienda D2C (`apps/tienda`):** E-commerce de lujo, Club Legado del Bosque, trazabilidad de lote y pasaporte digital.
- **Núcleo BFF & Dashboard (`apps/nucleo`):** Motor BFF, emisión soberana DTE, Registro Territorial Apícola de Chiloé, MRV satelital y gestión contable.
- **Campo PWA (`apps/campo`):** POS offline-first (Dexie), ventas de feria, control de efectivo y liquidación a operadores (`rep_ventas`).
- **Paquetes Compartidos (`packages/*`):** `@enjambre/contable`, `@enjambre/fiscal`, `@enjambre/auth`, `@enjambre/logistica`, `@enjambre/wallet`, `@enjambre/pricing`.

---

## 1. INTRODUCCIÓN Y TESIS DEL SISTEMA

Enjambre Legado no es un e-commerce convencional montado sobre plataformas de terceros (como Shopify o WooCommerce), ni utiliza intermediarios de facturación tercerizados (como Wasabil o Facturacion.cl). Es un **sistema operativo biocultural** que enlaza una realidad física y territorial compleja (apiarios en el archipiélago de Chiloé, salas de extracción, bosque nativo templado lluvioso, ferias itinerantes, operadores independientes y logística nacional en frío/seco) con una infraestructura digital soberana (Postgres con Row Level Security, emisión directa ante el Servicio de Impuestos Internos vía SOAP XML, anclajes criptográficos de integridad de datos y pases móviles Apple/Google Wallet).

Esta convergencia físico-digital genera intersecciones jurídicas en **siete ramas del derecho chileno e internacional**:
1. **Derecho del Consumidor y Comercio Electrónico:** Ley N° 19.496, Ley N° 21.398 (Ley Pro-Consumidor), Decreto Supremo N° 6/2021 del Ministerio de Economía (Reglamento de Comercio Electrónico).
2. **Derecho Sanitario y Alimentario:** DTO N° 977/1996 del Ministerio de Salud (Reglamento Sanitario de los Alimentos - RSA), Ley N° 20.606 (Composición Nutricional y Publicidad de Alimentos) y resoluciones SEREMI de Salud.
3. **Derecho Apícola, Silvoagropecuario y Ambiental:** Ley N° 21.489 (Promoción y Fomento de la Actividad Apícola), Decreto N° 21/2024 de Minagri, Resoluciones del Servicio Agrícola y Ganadero (SAG) como la Res. Exenta 4590/2025, Ley N° 21.455 (Ley Marco de Cambio Climático).
4. **Derecho Tributario y Facturación Electrónica:** Código Tributario, Ley sobre Impuesto a las Ventas y Servicios (DL 825), Ley N° 21.210 (Modernización Tributaria e IVA digital a servicios transfronterizos), circulares y resoluciones operativas del SII.
5. **Protección de Datos Personales y Ciberseguridad:** Ley N° 19.628 y su reforma estructural Ley N° 21.719 (que introduce estándares equivalentes a RGPD y crea la Agencia de Protección de Datos Personales), Ley N° 21.459 sobre Delitos Informáticos y Ley N° 21.663 Marco de Ciberseguridad.
6. **Derecho Laboral y Red de Intercambio Comercial:** Código del Trabajo (presunción de laboralidad en Arts. 7 y 8 vs. arrendamiento de servicios/mandato comercial), retenciones de segunda categoría (Art. 42 N° 2 LIR).
7. **Propiedad Industrial y Gobernanza Territorial:** Ley N° 19.039 de Propiedad Industrial (marcas comerciales, marcas de certificación, marcas colectivas y sellos de origen INAPI), DL N° 2.757 sobre Asociaciones Gremiales y Ley N° 21.595 de Delitos Económicos y Ambientales.

El propósito de este documento es proporcionar al abogado del proyecto la totalidad de los hechos técnicos, el código embebido, los flujos documentales y los **hallazgos de riesgo legal descubiertos en la auditoría** para que puedan ser subsanados de manera inmediata.

---

## 2. MAPA DE PERSONERÍAS, ROLES DEL SISTEMA Y MATRIZ DE RESPONSABILIDAD

### 2.1 La Encrucijada de Personerías Jurídicas: Empresa vs. Ente Comunitario
Existe una tensión estructural entre el vehículo mercantil que comercializa la miel y el ente que certifica el origen:
- **Vehículo Comercial Operativo actual:** Opera bajo la marca comercial *"La Obrera y el Zángano"* (empresa titular del RUT comercial, cuenta bancaria Banco de Chile, contratos con Flow/Transbank y emisor tributario de las boletas y facturas).
- **La Incompatibilidad Orgánica de la Ley 19.039 (INAPI):**
  - Conforme al Artículo 19 de la Ley de Propiedad Industrial de Chile, el titular de una **Marca de Certificación** no puede, bajo ninguna circunstancia, producir, fabricar, extraer ni comercializar el bien o servicio certificado.
  - Si *La Obrera y el Zángano* (empresa) solicitara la titularidad de una Marca de Certificación territorial ("Miel de Chiloé Regenerativa"), la solicitud sería inadmisible o el registro sería nulo de pleno derecho.
  - **Bifurcación Jurídica Requerida:** La titularidad del Sello Territorial debe residir en una entidad colectiva independiente (Asociación Gremial de Apicultores de Chiloé constituida bajo el DL 2.757, o una Corporación Territorial de Desarrollo sin fines de lucro). La empresa comercial (*La Obrera y el Zángano*) y los apicultores locales concurren como **usuarios acreditados y auditados** del sello.

### 2.2 Calificación Sustantiva de Roles en el Sistema

El monorepo clasifica a los usuarios mediante `profiles.role` y tablas accesorias. Su naturaleza jurídica presumida es:

| Rol en Código | Denominación en UI | Naturaleza Jurídica | Riesgo Crítico / Contingencia |
|---|---|---|---|
| `cliente` | Cliente / Guardián del Bosque | Consumidor Final (Ley 19.496) | Cláusulas de adhesión abusivas, derecho de retracto, información veraz de precios. |
| `creador` | Embajador / Creador | Mandatario mercantil / Comisionista | Riesgo de reclasificación como dependiente si existen órdenes continuas; evasión de impuestos si no emite boleta/factura por comisiones. |
| `rep_ventas` | Operador de Feria / Representante | Prestador de servicios a honorarios + consignatario | **Altísimo riesgo de laboralización** (Código del Trabajo Art. 7/8). Debe blindarse con contrato independiente por evento, sin control de jornada. |
| `revendedor` | Aliado B2B / Distribuidor | Comprador mercantil mayorista | Verificación de giro comercial activo en SII; condiciones objetivas de descuento. |
| `territorial` / `apicultor` | Actor Territorial / Apicultor | Proveedor de materia prima / Miembro de censo | Privacidad de datos geoespaciales (apiarios); cesión de derechos sobre series MRV y datos de monitoreo. |
| `admin` | Administrador / Socio | Órgano de administración de la empresa | Responsabilidad penal de administradores (Ley 20.393 y 21.595), deber fiduciario. |

---

## 3. AUDITORÍA CRÍTICA DE COMERCIO ELECTRÓNICO Y CONSUMIDOR (TIENDA D2C)

> [!CAUTION]
> **HALLAZGOS GRAVES DE RIESGO DE SANCIÓN POR EL SERNAC EN LAS PÁGINAS DE LA TIENDA**  
> Durante la auditoría del código fuente en `apps/tienda/app/*`, se detectaron discrepancias jurídicas directas con la legislación vigente de protección al consumidor en Chile.

### 3.1 Hallazgo 1: Garantía Legal de 3 Meses vs. 6 Meses (Infracción a la Ley 21.398)
- **Texto actual en código:**
  - En `apps/tienda/app/garantia/page.tsx` (línea 22): *"Todo producto nuevo que comercializamos cuenta con una garantía legal de 3 meses contados desde la fecha de entrega al consumidor."*
  - En `apps/tienda/app/reembolso/page.tsx` (línea 24): *"nuestros productos cuentan con una garantía legal de 3 meses contados desde la entrega."*
  - En contradicción, `apps/tienda/app/terminos/page.tsx` (línea 143) sí menciona 6 meses.
- **La Ley Aplicable:**
  - La **Ley N° 21.398 ("Ley Pro-Consumidor")**, publicada en diciembre de 2021 y con vigencia en este punto desde el **24 de marzo de 2022**, reformó el Artículo 21 de la Ley N° 19.496, extendiendo el plazo de la garantía legal de **3 a 6 meses**.
  - **Dictámenes y demandas del SERNAC:** El SERNAC fiscaliza activamente sitios web y formula denuncias infraccionales directas ante los Juzgados de Policía Local contra proveedores que publicitan el antiguo plazo de 3 meses, por considerarlo una infracción al deber de información veraz (Art. 3 inc. 1 letra b) y publicidad engañosa (Art. 28 Ley 19.496).
- **Acción Correctora Inmediata:** Actualizar el fallback del CMS y el código estático a 6 meses de manera uniforme.

### 3.2 Hallazgo 2: Cláusula Abusiva de Traspaso de Responsabilidad Logística (Infracción al Art. 16 Ley 19.496 y DS 6/2021)
- **Texto actual en código (`apps/tienda/app/envio/page.tsx`, líneas 52-55):**
  - *"La recepción en conformidad (nombre y RUT del receptor) extingue la responsabilidad del transportista, salvo que el consignatario presente reclamo dentro de 3 días hábiles. El monto máximo de responsabilidad de Blue Express asciende a $85.000 CLP por orden de servicio. Si el valor del bien excede ese monto, puedes adquirir cobertura de riesgo adicional. Si no la adquieres, aceptas que la indemnización máxima será de $85.000 CLP."*
- **La Ley Aplicable y Doctrina SERNAC:**
  - En el comercio electrónico D2C, la relación de consumo es entre el **vendedor (La Obrera y el Zángano)** y el **consumidor final**. La empresa de transporte (Blue Express) es un tercero auxiliar contratado por el vendedor.
  - Conforme al **Artículo 43 de la Ley 19.496** y al **Artículo 8 del Decreto Supremo N° 6 de 2021 del Ministerio de Economía (Reglamento de Comercio Electrónico)**, el proveedor vendedor es **directamente responsable frente al consumidor** por el cumplimiento de la entrega íntegra, oportuna y en perfecto estado del producto.
  - Limitar la indemnización a $85.000 CLP o transferir las restricciones contractuales de Blue Express al cliente constituye una **cláusula abusiva nula de pleno derecho** (Art. 16 letra e) y g) Ley 19.496: exoneración o limitación anticipada de responsabilidad del proveedor).
  - El límite de $85.000 rige exclusivamente en la relación mercantil B2B entre O&Z y Blue Express, pero jamás frente al consumidor final, quien tiene derecho a la reposición total o reembolso íntegro si el envío se pierde o daña.
- **Acción Correctora:** Reformular la política de envío estableciendo que O&Z responderá por el 100% del valor del pedido ante el consumidor y gestionará internamente los seguros con el courier.

### 3.3 Hallazgo 3: Confusión en Cita de Leyes ("Ley 21.315" vs. DS 6 y Ley 21.398)
- **Texto actual en código:** En varias páginas (`reembolso`, `cancelacion`, `terminos`, `envio`), se cita repetidamente *"Ley 21.315 sobre Comercio Electrónico"*.
- **Corrección Jurídica:** La Ley N° 21.315 no es la ley de comercio electrónico (trató sobre portabilidad financiera y servicios financieros). La regulación chilena aplicable al e-commerce radica en:
  1. La **Ley N° 19.496**, con las modificaciones de la **Ley N° 21.398 (Pro-Consumidor)**.
  2. El **Decreto Supremo N° 6 de 2021 del Ministerio de Economía**, formalmente denominado *Reglamento sobre Información al Consumidor en el Comercio Electrónico*.
  3. El Artículo 3 bis letra b) pertenece propiamente a la Ley 19.496.

### 3.4 El Derecho a Retracto y Alimentos Perecibles
- **El Desafío Legal:** El Art. 3 bis letra b) de la Ley 19.496 consagra el retracto de 10 días para compras electrónicas, pero faculta la excepción en aquellos bienes que *"por su naturaleza no puedan ser devueltos o puedan deteriorarse o caducar con rapidez"*.
- **La Solución Armónica Físico-Digital:**
  - La miel sellada en frasco tiene larga duración y no caduca con rapidez en condiciones normales; por tanto, el consumidor tiene derecho a retracto si el producto se mantiene cerrado.
  - Sin embargo, por normas de inocuidad alimentaria del **Reglamento Sanitario de los Alimentos (RSA)**, un frasco con sello de garantía violado o abierto NO puede ser reintroducido a la cadena de consumo.
  - La redacción debe distinguir con precisión: el retracto de 10 días es plenamente válido mientras el precinto o sello de inviolabilidad del frasco permanezca intacto. Si fue abierto, opera la causal de exclusión por razones de higiene y salud pública.

### 3.5 Suscripciones y Recurrencia: "Botón de Baja"
- **Exigencia del Art. 12 B de la Ley 19.496 (introducido por Ley 21.398):** En contratos de adhesión con pagos periódicos (como el *Club Legado del Bosque* o suscripciones de reposición), el proveedor debe ofrecer un mecanismo para terminar el contrato que sea tan fácil y expedito como el mecanismo utilizado para contratarlo.
- **Implementación en el Sistema:**
  - El portal de cliente en `/perfil/reposicion` implementa `subscription-manage-client.ts` con botón de pausa y cancelación que se comunica vía API con Flow.
  - Se debe garantizar que la cancelación sea inmediata en el sistema, enviando confirmación por correo electrónico en menos de 24 horas y sin supeditarla a llamadas telefónicas ni trabas operativas.

---

## 4. DERECHO SANITARIO Y PUBLICIDAD DE ALIMENTOS: EL FRASCO VS. LA WEB

### 4.1 La Normativa del Rótulo Físico (Fuera de Git, en Planta de Envasado)
El frasco físico comercializado debe cumplir estrictamente con el **Título II del Reglamento Sanitario de los Alimentos (DTO 977/1996)**:
- Nombre específico del alimento (*Miel de Ulmo*, *Miel de Bosque Nativo*).
- Contenido neto en unidades del sistema métrico.
- Nombre o razón social y domicilio del fabricante o envasador.
- **Resolución Sanitaria:** Número y fecha de la resolución de la SEREMI de Salud de la sala de extracción y envasado (*"Res. Exenta N° XXX de fecha XX/XX/XXXX de la SEREMI de Salud Región de Los Lagos"*).
- Número de lote de producción y fecha de vencimiento o consumo preferente.
- Tabla de información nutricional obligatoria (Art. 115 RSA).
- Advertencia sobre menores de 1 año (prevención médica contra el botulismo infantil por esporas de *Clostridium botulinum*).

### 4.2 Publicidad Sanitaria en Tienda Web: Ley 20.606 y Artículos 106-114 del RSA
- **El Límite Legal:** El Artículo 106 del RSA y la jurisprudencia del Ministerio de Salud prohíben terminantemente atribuir a los alimentos propiedades terapéuticas, curativas, adelgazantes o medicinales que excedan su valor nutritivo natural.
- **Auditoría de Claims en el Código:**
  - En `catalog-view.tsx` y `pdp-body.tsx`: Existe el badge *"Sustituye azúcar"* y frases asociadas.
  - En páginas de narrativa (`nosotros/page.tsx`, `origen/ulmo/page.tsx`): Se mencionaban conceptos como *"previene el síndrome metabólico"*, *"ansiolítico"*, *"liberación de serotonina"*, *"rompiendo adicciones"*.
- **Riesgo:** Fiscalización sanitaria y sumario sanitario de la SEREMI de Salud, sumado a denuncias de SERNAC por publicidad engañosa respecto a cualidades de salud.
- **Criterio de Redacción Legal Blindada:** Todo claim debe remitirse exclusivamente a atributos organolépticos, botánicos y de origen (ej. *"Miel pura de floración nativa de Ulmo del bosque templado lluvioso"*), citando fuentes científicas generales únicamente a título divulgativo y acompañadas de un *disclaimer* expreso: *"Este alimento no es medicamento ni pretende diagnosticar, tratar, curar o prevenir ninguna enfermedad."*

---

## 5. DERECHO APÍCOLA, TERRITORIO Y EL CUIDADO DE DATOS (NÚCLEO Y SAG)

### 5.1 Marco Regulatorio Apícola: Ley 21.489 y Decretos
La **Ley N° 21.489** (Promoción y Fomento de la Actividad Apícola) y el **Decreto N° 21/2024 de Minagri** imponen obligaciones técnicas que la base de datos de Núcleo soporta activamente:
1. **Registro Oficial ante el SAG:** Todo apicultor debe contar con su Rol Único Pecuario (RUP) y estar inscrito en el Registro Nacional de Apiarios del SAG.
2. **Declaración de Existencia Animal (DEA):** Obligación de declarar anualmente el número de colmenas. En Núcleo, la tabla `actores_registro` incorpora `declaracion_existencia_animal BOOLEAN` (migración 1004).
3. **Control Sanitario Oficial (Varroa):** Registro obligatorio de tratamientos veterinarios autorizados. Núcleo modela `metodo_control_varroa` y `practicas_sanitarias`.
4. **Distancias Legales de Trashumancia:**
   - La Ley 21.489 establece que el ingreso de colmenas trashumantes debe respetar distancias mínimas respecto a los apiarios locales inscritos, para evitar sobrecarga del pecoreo y propagación de plagas.
   - En `apps/nucleo/src/lib/distancias-legales.ts`, el sistema implementa la matriz de distancias según bandas de carga:
     - $\le 36$ colmenas: sin exigencia de distanciamiento.
     - Hasta 100 colmenas: $0.5\text{ km}$.
     - Hasta 500 colmenas: $1.0\text{ km}$.
     - Hasta 1000 colmenas: $1.5\text{ km}$.
     - $> 1000$ colmenas: $2.2\text{ km}$.

### 5.2 Cuaderno de Campo Digital: Resolución SAG N° 4590/2025
- La Resolución Exenta SAG 4590/2025 valida el uso de cuadernos de campo para el registro de manejo fitosanitario y apícola.
- En Núcleo, `CuadernoCampoView` y la bitácora apícola operan como soporte electrónico auditable de estas actividades.
- **Recomendación para el Abogado:** Evaluar si el SAG de la Región de Los Lagos requiere una solicitud de homologación formal para que el cuaderno de campo digital de Núcleo sea admitido como sustituto oficial del formato impreso foliado ante una inspección de inspectores sectoriales.

### 5.3 Privacidad de Datos Geoespaciales Comunitarios (Prevención de Abigeato y Piratería)
- Las coordenadas geográficas exactas de las colmenas en sectores rurales de Chiloé constituyen información altamente sensible: su difusión abierta expone a los apicultores locales al robo de colmenas (abigeato apícola) y al asentamiento clandestino de apiarios trashumantes de gran escala.
- **La Solución en Base de Datos (Migración 1004):**
  - La tabla `apiarios_registro` almacena `lat_aproximada` y `lng_aproximada` con dispersión de $\sim 1\text{ km}$.
  - La política de RLS `apiarios_registro_community_read` solo permite la lectura si el actor consintió expresamente figurar en el mapa comunitario (`a.consentimientos->>'mapa_comunitario' = 'true'`).
  - La visualización comunitaria jamás expone puntos de precisión submétrica.

### 5.4 Sistema de Alertas Fitosanitarias y Notificación Previa de 48 Horas (Art. 29 Ley 21.489 / Res. SAG 7.068/2024)
- **Marco Legal Imperativo (Vigencia 26 de Enero de 2026):**
  - El **Artículo 29 de la Ley N° 21.489** y la **Resolución Exenta SAG N° 7.068/2024** imponen la obligación legal a todo aplicador o predio colindante de notificar con a lo menos **48 horas de anticipación** cualquier aplicación de plaguicidas o productos fitosanitarios con toxicidad para las abejas a todos los apicultores inscritos en el radio de influencia ($3\text{ km}$).
- **Implementación Técnica en Núcleo:**
  - **Migración de Base de Datos (`20260912010000_alertas_fitosanitarias_sipec_ley21489.sql`):** Modifica la tabla `alertas_fitosanitarias` agregando:
    - `sipec_aviso_id TEXT`: Número de registro o comprobante oficial del SAG/SIPEC Apícola.
    - `origen_aviso TEXT CHECK (origen_aviso IN ('sipec', 'predio_vecino', 'sag_oficial', 'comunitario'))`: Identifica la fuente reglamentaria del aviso.
    - `cumple_anticipacion_48h BOOLEAN`: Auditoría algorítmica de cumplimiento del plazo legal.
  - **Lógica de Servidor (`apps/nucleo/src/api/routes/registro-territorial.ts`):**
    - En el endpoint `POST /alertas`, el sistema calcula la diferencia temporal entre la fecha de recepción del aviso y la fecha proyectada de aplicación.
    - Si el margen es inferior a 48 horas, se marca `cumple_anticipacion_48h = false` y se inyecta automáticamente una advertencia legal de infracción sanitaria en las observaciones.
    - El despacho de correos electrónicos y notificaciones hacia los apicultores afectados cita expresamente el Artículo 29 de la Ley 21.489 y los datos del aplicador, habilitando a los productores a interponer las denuncias respectivas ante el SAG en caso de fumigaciones intempestivas.

---

## 6. SOBERANÍA FISCAL, SII Y EL CAMINO DEL DINERO

### 6.1 Modelo de Facturación Electrónica Autonómica
Enjambre Legado no depende de APIs de facturación de terceros. El monorepo contiene su propio pipeline en `@enjambre/contable` y `@enjambre/fiscal`, interactuando con los servidores del Servicio de Impuestos Internos:
- **Autenticación SII:** Web Service SOAP mediante solicitud de semilla (`getSeed`), firma digital del token con Certificado Digital Tributario y obtención de sesión tokenizada.
- **Documentos Electrónicos Implementados (DTE):**
  - Tipo 39: Boleta Electrónica de Ventas y Servicios.
  - Tipo 33: Factura Electrónica.
  - Tipo 34: Factura No Afecta o Exenta.
  - Tipo 46: Factura de Compra (fundamental para servicios digitales extranjeros).
  - Tipo 52: Guía de Despacho Electrónica.
  - Tipo 61: Nota de Crédito Electrónica.
  - Tipo 110: Boleta de Honorarios de Terceros.
- **Gestión de Folios y CAF:** Validación atómica previa a la emisión (`CafGuard`). Alerta ante agotamiento de folios vía `notification_queue`.

### 6.2 El IVA Digital Transfronterizo: Ley 21.210 y Circular N° 42/2020 SII
- **El Problema:** La operación digital utiliza infraestructura tecnológica internacional (Vercel, Supabase, OpenAI, Groq, Meta Ads, Google Ads).
- **El Mecanismo de Cambio de Sujeto:**
  - Conforme al Art. 8 letra n) de la Ley sobre Impuesto a las Ventas y Servicios (incorporado por Ley 21.210), los servicios digitales prestados por empresas sin domicilio ni residencia en Chile están gravados con IVA (19%).
  - Cuando el prestador extranjero no está inscrito en el régimen simplificado del SII, o cuando la empresa compradora chilena es contribuyente de IVA, opera el **Cambio de Sujeto de Derecho del IVA**: la empresa chilena debe emitir una **Factura de Compra Electrónica (DTE tipo 46)**, retener y pagar el 19% de IVA en el Formulario 29.
- **Implementación en Código:**
  - En `@enjambre/contable/domain/gasto-extranjero.ts` y `cambio-sujeto.ts`, el motor detecta la naturaleza del proveedor y clasifica el impuesto.
  - En la propuesta de F29: El débito digital se registra en el **código 511** y el crédito digital correspondiente se deduce en el **código 512** (si el gasto es necesario para producir la renta), mientras que las compras nacionales operan en el código **507** (evitando la mezcla errónea con el código 503).

### 6.3 Ventas en Feria, POS Campo y Flujo de Efectivo
- En eventos y ferias, `apps/campo` opera como punto de venta offline-first.
- **Idempotencia de Venta:** Las ventas se sincronizan hacia Núcleo con `client_request_id` determinista.
- **Manejo de Efectivo y Normativa UAF (Ley 19.913):**
  - Los cierres de caja en feria se registran en `cash-sessions`.
  - Los montos manejados en ferias locales no alcanzan los umbrales de reporte de operaciones en efectivo (USD 10.000 o equivalente), pero el arqueo estricto previene contingencias de cuadratura contable y discrepancia de ingresos ante el SII.

---

## 7. PROTECCIÓN DE DATOS PERSONALES: LEY 19.628 Y LA NUEVA LEY 21.719

> [!IMPORTANT]
> **ESTADO REGULATORIO AL 1 DE SEPTIEMBRE DE 2026 (LEY 21.719)**  
> - **Vigencia Legal Vigente:** La Ley 21.719 fue promulgada para entrar en vigor el **1 de diciembre de 2026**, estableciendo la Agencia de Protección de Datos Personales (APD) y un régimen sancionatorio severo (infracciones gravísimas sancionadas con hasta **20.000 UTM**, aprox. \$1.400 millones CLP, o hasta el 4% de los ingresos anuales).
> - **Proyecto de Postergación:** El 1 de septiembre de 2026, el Ejecutivo ingresó un proyecto de ley con suma urgencia para aplazar la entrada en vigor hasta diciembre de 2027.
> - **Postura Operativa Inviolable de Enjambre Legado:** **Cumplimiento Invariable a Diciembre de 2026**. No se asumen riesgos ante contingencias legislativas; toda la infraestructura técnica y contractual opera como si el plazo original fuese inamovible.

### 7.1 Arquitectura de Derechos ARCO y Portabilidad
- En `apps/nucleo/src/api/routes/arco.ts`:
  - `GET /api/arco/export`: Implementa el **Derecho a la Portabilidad**, entregando un JSON estructurado con la totalidad de los datos del usuario, perfil, apiarios y registros territoriales asociados.
  - `DELETE /api/arco/me`: Implementa el **Derecho a la Cancelación / Supresión**.

### 7.2 Conflicto Jurídico Fundamental: Supresión ARCO vs. Deber Legal de Conservación Tributaria
- **El Problema:** Un usuario que realizó compras o emitió documentos exige la eliminación de su cuenta bajo el derecho al olvido.
- **La Normativa de Retención Obligatoria:**
  - **Artículo 17 y 200 del Código Tributario:** Obligación de conservar la documentación sustentatoria de operaciones tributarias durante el plazo de prescripción (3 a 6 años).
  - **Artículo 44 del Código de Comercio:** Obligación de conservar los libros de contabilidad y comprobantes hasta por 10 años.
- **La Solución Implementada en el Monorepo:**
  - En la migración `20260814210000_profiles_arco_deletion.sql`, se añadió la columna `deletion_requested_at` en la tabla `profiles`.
  - **Regla Inviolable:** Cuando un usuario solicita supresión, **NO se destruyen las filas de `ventas`, `orders` ni los documentos tributarios (DTE)**. Lo que procede es la **disociación y anonimización** de datos identificatorios personales (nombre, teléfono, contraseña, cookies), bloqueando su tratamiento para fines comerciales o perfiles, pero manteniendo el respaldo tributario con acceso restringido exclusivo para auditorías del SII.

### 7.3 Encargados de Tratamiento, Transferencia Internacional y Cláusulas Contractuales Tipo (CCT)
La Política de Privacidad (`apps/tienda/app/privacidad/page.tsx`, Sección 4) formaliza los modelos contractuales de transferencia internacional conforme al estándar del Ministerio de Economía y la Ley 21.719:
- **Modelo Responsable a Encargado (Controller-to-Processor):**
  - Aplica a proveedores de infraestructura que tratan datos exclusivamente por cuenta y orden de Obrera y Zángano SpA, bajo Acuerdos de Procesamiento de Datos (DPA) con Cláusulas Contractuales Tipo:
    - *Alojamiento y CDN:* Vercel, Inc. (EE.UU.).
    - *Base de Datos, Storage y Auth:* Supabase, Inc. (EE.UU.).
    - *Monitoreo de Telemetría y Errores:* Functional Software, Inc. / Sentry (EE.UU.).
    - *Transcripción de Audio de Campo (IA):* Groq, Inc. (EE.UU., exclusivo para audio de bitácora en Núcleo; no opera en la tienda pública).
- **Modelo Responsable a Responsable (Controller-to-Controller):**
  - Aplica a entidades que tratan los datos como responsables autónomos sujetos a sus propios deberes regulatorios y legales:
    - *Pasarelas de Pago Bancarias:* Transbank S.A. y Flow S.A. (Chile / supervisión CMF).
    - *Operadores Postales y Logísticos:* Blue Express S.A. (Chile / normativa de telecomunicaciones y transportes).
- **Garantías de Destino:** Obligación de los mandatarios tecnológicos de contar con cifrado en reposo (AES-256), cifrado en tránsito (TLS 1.3), SOC 2 Type II o ISO 27001, y compromiso de notificación inmediata ante cualquier requerimiento judicial extranjero.

### 7.4 Protocolo de Notificación de Brechas de Seguridad (72 Horas)
La Ley 21.719 exige notificar las brechas de seguridad que afecten derechos de los titulares a la Agencia de Protección de Datos y a los afectados en un plazo máximo de **72 horas**. Se mantiene operativo el runbook de respuesta técnica ante incidentes de ciberseguridad y registro en `security_events`.

---

## 8. DERECHO LABORAL VS. RED DE INTERCAMBIO (BLINDAJE DE INDEPENDENCIA)

Uno de los mayores riesgos patrimoniales en modelos de comercio colaborativo y ferias radica en la **demanda por despido injustificado y cobro de prestaciones laborales** interpuesta por operadores de feria o comisionistas alegando relación de subordinación y dependencia encubierta (Art. 7 y 8 del Código del Trabajo).

### 8.1 Embajadores y Creadores de Contenido (Afiliados)
- **Naturaleza Jurídica:** Mandato comercial o corretaje mercantil atípico.
- **Blindaje en Código:**
  - En `creadores.ts`, las comisiones están topadas por base de datos (`porcentaje_comision <= 30`, `descuento_cliente <= 15`).
  - RPC anti auto-uso: el creador no puede generar comisiones comprando con su propio código.
  - El retiro se realiza a solicitud del creador mediante liquidaciones de comisiones con tope mensual ($500.000 CLP por defecto).
- **Blindaje de Redacción en UI:** Prohibición estricta de términos como *"sueldo"*, *"nómina"*, *"salario"*. Se emplea exclusivamente *"comisión por referido"* y *"liquidación comercial"*.
- **Obligación Tributaria:** Cada creador debe emitir la correspondiente boleta de honorarios electrónica o factura a favor de la empresa para percibir la liquidación.

### 8.2 Operadores de Feria (`rep_ventas`)
- **Los Indicios de Laboralidad que la Jurisprudencia Sanciona:**
  - Control de horario y asistencia a la feria.
  - Imposición de órdenes de trabajo e instrucciones directas sobre el modo de operar.
  - Pago periódico fijo independiente del resultado.
  - Exclusividad en la venta.
- **Mecanismos de Blindaje Implementados en el Monorepo:**
  1. **Ausencia de Órdenes:** El sistema no genera "órdenes de trabajo"; la relación se basa en acuerdos de participación por evento ferial.
  2. **Consignación Mercantil de Existencias:** El stock se entrega bajo la figura de consignación mercantil regulada en el Código de Comercio (`participante_consignacion`). La entrega descuenta temporalmente stock de almacén y la devolución reintegra el remanente de manera atómica (`registrar_devolucion_consignacion_feria`).
  3. **Incentivos Autónomos (No Subordinados):** Los bonos feriales son metas económicas objetivas de venta (`incentivo_ledger`), no sanciones disciplinarias.
  4. **Puente a Honorarios:** El saldo acumulado en el ledger se procesa mediante el endpoint `POST /api/sii/honorarios/desde-ledger` y la RPC `preparar_honorario_desde_ledger`, preparando la retención de segunda categoría del F29 (13,75% o tasa legal aplicable).
- **Tarea Pendiente Obligatoria Fuera de Código:**
  - Suscripción física o con firma electrónica simple/avanzada del **Contrato de Prestación de Servicios a Honorarios y Consignación Mercantil de Existencias** antes del inicio de cada temporada ferial.

### 8.3 Escudo de Consignación e Independencia del Operador de Feria frente al Consumidor Final (Ley 19.496 y Código de Comercio)
- **Deslinde Mercantil:**
  - Los operadores de feria (`rep_ventas`) actúan bajo la figura de **consignación mercantil** (Arts. 233 y siguientes del Código de Comercio) o comercialización autónoma en eventos presenciales.
  - La relación de consumo se perfecciona directamente entre el operador y el cliente de la feria. Obrera y Zángano SpA concurre exclusivamente en calidad de fabricante y envasador del producto, respondiendo de la aptitud para el consumo humano y de la garantía legal de 6 meses (Art. 20 y 21 Ley 19.496) respecto de vicios de origen, pureza botánica o defectos de hermeticidad.
- **Inexistencia de Solidaridad por Actos Propios del Operador:**
  - El operador ferial asume la responsabilidad directa por las condiciones de comercialización presencial, custodia del dinero en efectivo, arqueo de caja y entrega de comprobantes feriales.
  - No existe relación de subordinación ni representación general que obligue a la SpA más allá de la garantía legal alimentaria.
  - Este blindaje quedó consagrado en la **Sección 22 de los Términos y Condiciones de la Tienda** (`apps/tienda/app/terminos/page.tsx`) y en el manual operacional `docs/RED_INTERCAMBIO_LEGAL.md`.

---

## 9. CAPITAL CLIMÁTICO, BOSQUE NATIVO Y PROPIEDAD INDUSTRIAL: EVITAR EL GREENWASHING

> [!WARNING]
> **DELIMITACIÓN CIENTÍFICA Y LEGAL DEL CARBONO Y LA MIEL**  
> Confundir la miel con un crédito de carbono constituye publicidad ambiental engañosa fiscalizable por el SERNAC (Ley 19.496) y sancionable bajo los proyectos de ley de greenwashing en tramitación parlamentaria.

### 9.1 La Falacia Biofísica y Legal del Offset en Alimentos
- Afirmar que *"comprar este frasco de miel neutraliza 2 kg de CO₂"* o que *"en este frasco hay carbono fijado"* es falso e ilegal:
  1. La miel es néctar floral procesado enzimáticamente por abejas; el carbono secuestrado a largo plazo reside en la biomasa leñosa (troncos, ramas, raíces) y en el suelo forestal, no en los carbohidratos del frasco.
  2. Un crédito de carbono formal exige **adicionalidad**, **permanencia**, **línea base contrastada** y **auditoría de un Organismo de Validación y Verificación (OVV)** conforme a los estándares de la Ley Marco de Cambio Climático (Ley 21.455).
  3. La abeja melífera (*Apis mellifera*) es una especie introducida en Chile; no es la creadora biológica de los grandes árboles del dosel nativo (Ulmo, Tepa, Tiaca, Avellano). Su rol es socioeconómico: la apicultura otorga rentabilidad a los custodios locales para evitar que el bosque sea talado o loteado para desarrollo inmobiliario.

### 9.2 La Arquitectura de Tres Capas Desacopladas
Para atraer financiamiento climático y otorgar valor al territorio sin incurrir en contingencias legales, el sistema consagra tres capas independientes:

```
┌────────────────────────────────────────────────────────────────────────┐
│ CAPA 1: SELLO INAPI (Acreditación Territorial y Buenas Prácticas)      │
│ • Titular: Asociación Gremial / Corporación Territorial (Independiente)│
│ • Certifica: Origen Chiloé, buenas prácticas, flora nativa, manejo.   │
│ • Claim comercial lícito: "Miel acreditada bajo estándar territorial". │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ CAPA 2: MRV EN PLATAFORMA (Trazabilidad Técnica en Núcleo)             │
│ • Evidencia de custodia: Lote ↔ Apiario ↔ Predio ↔ Polígono Forestal   │
│ • Serie temporal satelital y de biomasa estimada en @enjambre/impacto. │
│ • Claim comercial lícito: "Lote trazable a X ha de bosque bajo cuidado"│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ CAPA 3: FINANCIAMIENTO CLIMÁTICO (Insetting vs. Bonos de Carbono)      │
│ • Vía A: Insetting / Patrocinio de Custodia de Paisaje (Aporte B2B).   │
│ • Vía B: Proyecto Forestal Agrupado (Créditos formales a nivel predio).│
│ • Regla Inviolable: El bono se emite sobre el predio, NUNCA en la miel │
└────────────────────────────────────────────────────────────────────────┘
```

### 9.3 La Fórmula Canónica de Verdad
Cualquier comunicación comercial, contrato o página web debe ceñirse a la fórmula:

$$\text{Lote } L \xrightarrow{\text{Cosecha}} \text{Apiario } A \xrightarrow{\text{Ubicación}} \text{Predio } P \xrightarrow{\text{Monitoreo}} \text{Serie MRV } S$$

> *"En el lote $L$ producido por el apicultor $A$ queda documentado el predio $P$, el protocolo apícola-forestal y la serie $S$ de monitoreo de bosque nativo. El sello INAPI certifica que las condiciones territoriales y el reglamento de uso se cumplieron. Los créditos de carbono, de emitirse, recaen sobre el predio $P$, jamás sobre el frasco de miel."*

---

## 10. FIDELIZACIÓN, PASES WALLET Y MEDIOS DE PAGO (CMF)

### 10.1 Naturaleza Jurídica del Guardián del Bosque y Pases Apple/Google Wallet
- El paquete `@enjambre/wallet` emite pases móviles para Apple Wallet y Google Wallet (`Wallet Guardian`), mostrando el progreso de programas de sellos (*"10 sachets $\to$ 1 gratis"*), niveles de custodia (*"Guardián del Bosque"*) y saldo de puntos.
- **Riesgo Regulatorio ante la Comisión para el Mercado Financiero (CMF):**
  - Si los puntos o sellos pudieran transferirse entre usuarios por dinero, canjearse por efectivo o utilizarse como medio de pago universal, el sistema entraría en el ámbito de aplicación de la **Ley N° 20.950 sobre Emisión y Operación de Medios de Pago con Provisión de Fondo por Entidades No Bancarias**, lo que exigiría constituirse como empresa emisora supervisada por la CMF.
- **Blindaje Jurídico Exigido:**
  - Los Términos y Condiciones deben estipular expresamente que los puntos y sellos son **beneficios comerciales promocionales y unilaterales**, no acumulables con valor monetario, no transferibles entre cuentas, no convertibles en dinero de curso legal y sujetos a caducidad justificada.

---

## 11. RESPONSABILIDAD PENAL DE PERSONAS JURÍDICAS Y COMPLIANCE: LEY 20.393 Y LEY 21.595

### 11.1 Catálogo de Delitos Críticos en el Ecosistema
1. **Delitos Ambientales:** Afectación grave a áreas protegidas, corta no autorizada de bosque nativo (Ley 20.283), uso ilícito de aguas o aplicación no reglamentaria de plaguicidas agrícolas que dañen ecosistemas o polinizadores (Art. 29 Ley 21.489).
2. **Delitos Informáticos (Ley 21.459):** Acceso ilícito, interceptación o sabotaje de sistemas de información y bases de datos de clientes o apicultores.
3. **Delitos Económicos y de Mercado:** Publicidad engañosa calificada (Art. 50 Ley 19.496 / Ley 21.595), alteración fraudulenta de precios, fraude de subvenciones públicas (Corfo, Indap, Sercotec) y delitos tributarios (Arts. 97 N° 4 Código Tributario).
4. **Lavado de Activos y Financiamiento del Terrorismo (Ley 19.913).**

### 11.2 Canal de Integridad y Protocolo de Investigación Formal (T&C Sección 23)
En cumplimiento de los estándares exigidos por la Ley 21.595 para que el Modelo de Prevención de Delitos (MPD) opere como eximente o atenuante de responsabilidad penal corporativa, se incorporó a las políticas públicas el siguiente protocolo estructurado:
- **Recepción Segura:** Canal exclusivo `contacto@obrerayzangano.cl` con referencia *"Canal de Integridad - Ley 21.595"*, accesible a trabajadores, apicultores colaboradores, comisionistas, proveedores y clientes.
- **Acuse de Recibo Garantizado:** Máximo **48 horas hábiles** desde la recepción de la denuncia, asignando un código alfanumérico confidencial al caso.
- **Plazo Máximo de Investigación:** Plazo perentorio de **30 días corridos**, prorrogable por una sola vez y fundadamente por hasta 15 días adicionales ante materias de alta complejidad pericial o probatoria.
- **Protección contra Represalias y Confidencialidad:** Prohibición absoluta de represalias laborales, contractuales o comerciales contra denunciantes de buena fe. Reserva legal de identidad durante todo el procedimiento.
- **Encargado de Prevención de Delitos (EPD):** Designación formal de un EPD con autonomía de mando respecto de las gerencias comerciales, dotado de facultades directas de investigación, acceso a logs de auditoría en Postgres (`security_events`, `audit_logs`) y deber de reporte directo a los socios administradores.

---

## 12. MATRIZ DE DECISIONES Y ESTADO DE RESOLUCIÓN JURÍDICA

| N° | Área del Derecho | Asunto Crítico | Situación Previa en Software | Estado y Resolución Ejecutada en Código / Planteamiento al Abogado |
|---|---|---|---|---|
| **1** | **Consumidor** | Plazo de Garantía Legal | En `garantia` y `reembolso` figuraba 3 meses; en `terminos` 6 meses. | **RESUELTO EN CÓDIGO:** Unificado en **6 meses** en toda la tienda conforme al Art. 21 de la Ley 19.496 (modificado por Ley 21.398). Se eliminó toda mención a 3 meses. |
| **2** | **Consumidor / Logística** | Cláusula de Tope Blue Express ($85.000) | `envio/page.tsx` transfería el límite indemnizatorio del courier al cliente. | **RESUELTO EN CÓDIGO:** Eliminado el límite de $85.000 frente al consumidor. O&Z responde íntegramente por reenvío o reembolso del 100% (Art. 43 Ley 19.496). |
| **3** | **Alimentos / Consumidor** | Excepción de Retracto en Miel | `cancelacion/page.tsx` no delimitaba el precinto de seguridad. | **RESUELTO EN CÓDIGO:** Se amparó la excepción en el Art. 3 bis letra b) de la Ley 19.496 y Reglamento Sanitario de los Alimentos (DTO 977/96); retracto de 10 días válido con precinto térmico intacto. |
| **4** | **Sanitario / Publicidad** | Claims de Salud de la Miel | Menciones desreguladas a glicemia, serotonina y reemplazo de azúcar. | **RESUELTO EN CÓDIGO:** Inyectado banner en PDP con *disclaimer* médico formal (RSA Art. 110) y enlace directo a la evidencia de divulgación en `/ciencia`. |
| **5** | **Datos Personales** | Supresión ARCO vs. Retención Tributaria | Dudas sobre alcance de borrado en Supabase Auth. | **RESUELTO EN ARQUITECTURA:** Anonimización de PII con preservación estricta de documentos tributarios durante 6 años (Arts. 17 y 200 C. Trib.). |
| **6** | **Datos Personales** | CCT Ley 21.719 / Proveedores Transfronterizos | Ausencia de cláusulas modelo en política de privacidad. | **RESUELTO EN CÓDIGO:** Se incorporaron CCTs MinEconomía en `privacidad/page.tsx` (Controller-to-Processor para Vercel, Supabase, Sentry, Groq; Controller-to-Controller para PSPs y couriers). |
| **7** | **Apícola / SAG** | Alerta Fitosanitaria 48h (Art. 29 Ley 21.489) | Núcleo no validaba anticipación ni código SIPEC. | **RESUELTO EN CÓDIGO:** Migración `20260912010000_alertas_fitosanitarias_sipec_ley21489.sql` y validación automática de 48h con advertencias legales en `registro-territorial.ts`. |
| **8** | **Laboral / Ferias** | Operadores de Feria (`rep_ventas`) | Riesgo de laboralidad encubierta por ventas feriales. | **RESUELTO EN T&C Y MANUAL:** Sección 22 de T&C y `RED_INTERCAMBIO_LEGAL.md` consagran consignación mercantil autónoma (Arts. 233 C.Com) y delimitación de responsabilidad frente al consumidor. |
| **9** | **Penal Corporativo** | Compliance Ley 21.595 | Canal de denuncias informal sin plazos ni procedimiento reglado. | **RESUELTO EN CÓDIGO:** Sección 23 de T&C implementa protocolo con acuse en 48h hábiles, plazo de 30 días, confidencialidad total y figura del EPD. |
| **10** | **Propiedad Industrial** | Sello Territorial de Certificación | O&Z no puede ser titular del Sello ante INAPI (Art. 19 Ley 19.039). | **CONSULTA AL ABOGADO:** Definición de la entidad jurídica titular (Asociación Gremial DL 2.757 vs. Corporación sin fines de lucro en Chiloé). |
| **11** | **Ambiental / Climático** | Contratos de Custodia Forestal e Insetting | Monitoreo MRV en Núcleo requiere anclaje contractual. | **CONSULTA AL ABOGADO:** Redacción de contrato marco de Derecho Real de Conservación (Ley 20.930) con predios facilitadores de bosque nativo. |

---

## 13. CONCLUSIÓN Y HORIZONTES DE IMPLEMENTACIÓN

El ecosistema Enjambre Legado consolida una arquitectura técnico-jurídica pionera en Chile, donde la soberanía fiscal, la inocuidad alimentaria, la protección estricta de datos personales y la prevención penal se encuentran nativamente codificadas en la plataforma:

1. **Horizonte Inmediato (Ejecutado al 100% en Código):**
   - Garantía legal de 6 meses unificada en Cart, PDP, Garantía, Reembolso y Términos.
   - Eliminación del tope de responsabilidad de \$85.000 frente al consumidor en Envíos.
   - Retracto legal de 10 días con salvaguarda sanitaria de precinto térmico intacto.
   - Aislamiento de claims médicos y enlace estructurado a divulgación científica en `/ciencia`.
   - Adopción de Cláusulas Contractuales Tipo (CCT) en la Política de Privacidad bajo Ley 21.719.
   - Protocolo formal de denuncias con plazos perentorios y EPD en Términos de Servicio.
   - Auditoría de anticipación legal de 48 horas en alertas de plaguicidas (Art. 29 Ley 21.489) con metadatos SIPEC Apícola en Núcleo.
   - Escudo de consignación e independencia mercantil de operadores de feria en T&C y documentación legal.
2. **Horizonte de Corto Plazo (Meses 1 a 3 - Firma de Instrumentos Fuera de Software):**
   - Firma de los DPAs definitivos con contrapartes en EE.UU. (Vercel, Supabase, Sentry, Groq).
   - Suscripción de Contratos Marco de Consignación Mercantil con operadores de feria presencial para la temporada.
   - Aprobación formal del acta de Directorio que designa al Encargado de Prevención de Delitos (EPD).
3. **Horizonte Estratégico (Año 1 a 3 - Gobernanza Territorial y Sello INAPI):**
   - Constitución de la Asociación Gremial o Corporación de Apicultores de Chiloé para la titularidad del Sello Territorial ante INAPI.
   - Celebración de los primeros contratos de Derecho Real de Conservación (Ley 20.930) para predios facilitadores del bosque nativo vinculados a series MRV en Núcleo.
