# Certificación SII de Factura Electrónica — Enjambre Legado

Síntesis operativa de la documentación oficial del SII (Manual para Empresas
Usuarias · Ambiente de Certificación, Instrucciones para la Construcción del
Set de Pruebas, Modelo Factura Electrónica, y los manuales de desarrollador
externo de Autenticación Automática, Envío Automático, QueryEstUp,
QueryEstDteAv y wsDTECorreo) y su mapeo a la implementación del monorepo.

---

## 1. Proceso de certificación (6 etapas)

1. **Set de Pruebas** — enviar al SII los DTEs construidos con el set único
   que el SII genera para cada postulante, sin rechazos ni reparos. Junto con
   los DTEs se envían la Información Electrónica de Ventas (IEV) y la de
   Compras (IEC).
2. **Simulación** — 10 a 100 DTEs con datos representativos de la operación
   real de los últimos 2 meses.
3. **Intercambio de Información** — responder acuse de recibo y
   aceptación/rechazo de los DTEs que el SII envía a la casilla del
   contribuyente (`SII_dte_intercambio@sii.cl`).
4. **Pruebas de Impresión** — PDF con la representación impresa de los DTEs
   del set + 10 de la simulación, con timbre electrónico en PDF417
   (`sii_dte_impresos@sii.cl`).
5. **Declaración de Cumplimiento de Requisitos** — la declara el
   Representante Legal (gestión de CAF, foliación controlada, respaldo,
   envío, intercambio, cuadratura, contingencias).
6. **Autorización del Contribuyente** — Resolución SII que autoriza a operar
   en producción desde el período tributario indicado.

Plazo: los envíos del set deben hacerse dentro de **2 meses** desde la
descarga del set. Los envíos de prueba pueden repetirse cuantas veces sea
necesario; un documento aceptado **con reparos** debe reenviarse con **folio
distinto** (folio duplicado = rechazo).

## 2. Reglas del Set de Pruebas (construcción de cada DTE)

- Solicitar folios por tipo de documento (CAF) antes de emitir.
- Un DTE por caso; folio autorizado; **RUT receptor distinto por factura**;
  fecha del día.
- Glosa del ítem **exacta** al caso (acentos, ñ); **sin líneas adicionales**;
  líneas de detalle en el orden especificado.
- Cantidad y precio unitario según el caso:
  - NC por devolución: precio unitario = precio de la factura original.
  - NC por diferencia de precio: la diferencia se aplica a **todas** las
    unidades del ítem.
- Tasa de IVA según la fecha de emisión (18% antes del 01/10/2003, 19%
  desde esa fecha).
- Encabezado: calcular MntNeto, exento y otros; todos los campos
  obligatorios según tipo de documento.
- **Referencias**: línea 1 = `TpoDocRef=SET` + `RazonRef=CASO xxxxx-x`
  (ej. `CASO 1062-1`); otras referencias desde la línea 2.
- Envío final: **todos** los documentos del set en **el mismo orden** en que
  fueron entregados, en un solo EnvioDTE.
- Carátula del envío: Rut Contribuyente, Rut del firmante autorizado,
  Rut Receptor `60803000-K` (SII), N° y fecha de Resolución publicada en el
  ambiente de certificación, tipos de documentos enviados y cantidad.

## 3. IEV / IEC (libros electrónicos del set)

**Formato oficial: "Información Electrónica de Compras y Ventas" v3.0 (marzo 2016).**
Los tags exactos del XML son críticos (un tag equivocado rechaza el envío):

| Zona | Tags (v3.0) |
|---|---|
| Carátula | `<RutEmisorLibro>`, `<RutEnvia>`, `<PeriodoTributario>` (AAAA-MM), `<FchResol>`, `<NroResol>`, `<TipoOperacion>` (VENTA/COMPRA), `<TipoLibro>` (ESPECIAL), `<TipoEnvio>` (TOTAL), `<FolioNotificacion>` (1 ventas / 2 compras) |
| Resumen período | `<TotalesPeriodo>` con `<TpoDoc>`, `<TotDoc>`, `<TotMntExe>`, `<TotMntNeto>`, `<TotMntIVA>`, `<TotMntTotal>` |
| Detalle ventas/compras | `<DetalleVenta>`/`<DetalleCompra>` con `<TpoDoc>`, `<NroDoc>`, `<TasaImp>`, `<FchDoc>`, `<RUTDoc>`, `<RznSoc>`, `<MntExe>`, `<MntNeto>`, `<MntIVA>`, `<MntTotal>` |

> ⚠ No existen en v3.0: `<RutEmisor>`, `<TmstFirmaEnv>`, `<TotIVA>`, `<FolioDoc>`,
> `<FchEmis>`, `<RznSocDoc>`, `<FchRecepcion>`. El resumen período es obligatorio
> en envíos TOTAL/FINAL/AJUSTE; los montos en pesos sin separador de miles.

Reglas del set: **Período Tributario** mismo para todos los documentos (YYYY-MM),
**Tipo de Operación** `VENTA`/`COMPRA`, **Tipo de Libro** `ESPECIAL`, **Tipo de
Envío** `TOTAL`, **Folio Notificación** 1 (ventas) / 2 (compras), RUT del
contribuyente, RUT del firmante, N° y Fecha de Resolución publicados en el
ambiente de certificación.

## 4. Timbre electrónico (TED)

El timbre es una firma RSA estándar (PKCS#1) con hash SHA-1, usando la
**llave privada entregada por el SII dentro del CAF**:

1. Se arma el Mensaje = string `<DD>...</DD>` (RE, TD, F, FE, RR, RSR, MNT,
   IT1…, `<CAF>` completo con DA + FRMA, `<TSTED>`).
2. Se firma el Mensaje con la llave privada del CAF → `FRMT`.
3. El `<DD>` viaja dentro del `<TED version="1.0">` del DTE.

Ejemplo validado del manual (sección 5.2): con RE=97975000-5, TD=33,
F=27, FE=2003-09-08, RR=8414240-9, RSR=JORGE GONZALEZ LTDA, MNT=502946,
IT1=Cajon AFECTO, CAF(DA: RE/RS=RUT DE PRUEBA/TD/RNG 1-200/FA 2003-09-04/
RSAPK/IDK=100 + FRMA) y TSTED=2003-09-08T12:28:31, el FRMT esperado es
`pqjXHHQLJmyFPMRvxScN7tYHvIsty0pqL2LLYaG43jMmnfiZfllLA0wb32lP+HBJ/tf8nziSeorvjlx410ZImw==`
(este vector es un test en `apps/nucleo/src/api/lib/sii-timbre.test.ts`).

## 5. Estructura del EnvioDTE

```
EnvioDTE (xmlns SiiDte, version 1.0)
└─ SetDTE ID="SetDoc"            ← firmado (Signature URI="#SetDoc")
   ├─ Caratula                   ← RutEmisor, RutEnvia, RutReceptor(60803000-K),
   │                               FchResol, NroResol, TmstFirmaEnv, SubTotDTE
   └─ DTE (version 1.0)
      └─ Documento ID="F<folio>T<tipo>"  ← firmado (Signature URI)
         ├─ Encabezado (IdDoc, Emisor, Receptor, Totales)
         ├─ Detalle (1..n, en orden)
         ├─ Referencia (línea 1 = SET/CASO en el set de pruebas)
         ├─ TED (DD + FRMT)
         └─ TmstFirma
```

Validación del SII: (1) schema `EnvioDTE_v10.xsd`, (2) firma digital XML,
(3) timbre electrónico.

## 6. Web services (manuales de desarrollador externo)

Hosts: certificación `https://maullin.sii.cl` · producción
`https://palena.sii.cl`. Base de los WS SOAP: `/DTEWS/`.

### Autenticación Automática (CrSeed + GetTokenFromSeed)

1. `CrSeed.getSeed` (sin parámetros) → `<SEMILLA>` (time-out **2 min**).
2. Firmar la semilla: XML `<getToken><item><Semilla>…</Semilla></item>`
   + `<Signature>` xmldsig RSA-SHA1 con `Reference URI=""` y transform
   `enveloped-signature`, `KeyInfo` con Módulo/Exponente y el certificado.
3. `GetTokenFromSeed.getToken(pszXml)` (XML escapado) → `<TOKEN>`.

Estados GetTokenFromSeed: `00` OK · `01-06` XML/firma inválidos ·
`08` TIME-OUT DEL SEED / parámetros incorrectos · `11` falta Certificate ·
`21` firma inválida (llave pública ≠ certificado) · `-3` error de autenticación.

### QueryEstUp (estado de un envío/upload por TrackId)

`getEstUp(RutCompania, DvCompania, TrackId, Token)`.

| Estado | Glosa |
|---|---|
| RSC | Rechazado por error en Schema |
| SOK | Schema validado |
| CRT | Carátula OK |
| RFR | Rechazado por error en Firma |
| FOK | Firma de envío validada |
| PRD | Envío en proceso |
| RCT | Rechazado por error en Carátula |
| EPR | **Envío procesado** (con TIPO_DOCTO, INFORMADOS, ACEPTADOS, RECHAZADOS, REPAROS) |

### QueryEstDteAv (consulta avanzada de un DTE)

`getEstDteAv(RutEmpresa, DvEmpresa, RutReceptor, DvReceptor, TipoDte,
FolioDte, FechaEmisionDte (DD-MM-AAAA), MontoDte, FirmaDte, Token)`.
`FirmaDte` = `DTE/Signature/SignatureValue` del XML del documento.

Respuesta: `RECIBIDO` (SI/NO) + `ESTADO`: `DOK` datos coinciden · `DNK` datos
no coinciden · `FNA` no autorizado · `FAN` anulado · `FAU` no recibido ·
`EMP` empresa no autorizada · `TMD/TMC/MMD/MMC/AND/ANC` modificado/anulado
por nota de débito/crédito. Errores de operación en `RESP_HDR/ESTADO`
(1 token inactivo, 2 token no existe, 5 parámetros, 9 sin permiso).

### wsDTECorreo (reenvío del correo de diagnóstico)

`reenvioCorreo(Token, RutEmpresa, DvEmpresa, TrackId)`.
`0` = recibido OK · `101` DV rut · `102` faltan datos · `104` token ·
`105` trackid no existe · `106` sin permisos · `114` envío aún no concluye
validación (no existe correo).

### Envío automático (upload RFC1867)

POST multipart a `/cgi_dte/DTEUpload/Enviar` con cookie `TOKEN`, campos
`rutSender/dvSender/rutCompany/dvCompany/archivo`, `User-Agent` con `PROG
1.0`. Respuesta `<RECEPCIONDTE>` con `STATUS` (`0` = OK + `TRACKID`,
`1`/`5`/`6`/`7`/`8`/`9` errores) y `TRACKID`.

## 7. Mapa de implementación (qué ya existía vs. lo nuevo)

### Ya existía en `apps/nucleo/src/api/lib/sii-client.ts`
`signDteXml`/`signNode` (xmldsig RSA-SHA1), `stampDteXml` (TED parcial),
`getSiiToken` (endpoint `U.Datos.LR.GetToken`), `enviarDte` (multipart),
`consultarEstado` (GET), `consultarEstadoDteIndividual` (SOAP
`QueryEstDte.jws`), `parseCafXml`, CAF automático, pipeline
`POST /api/sii/dte/emitir`.

### Nuevo en `packages/contable` (módulos puros, sin crypto)
| Módulo | Contenido |
|---|---|
| `domain/sii-soap.ts` | Sobres SOAP 1.1 (CrSeed, GetTokenFromSeed, QueryEstUp, QueryEstDteAv, wsDTECorreo), `decodeSoapReturn`, `parseSiiRespuesta`, parsers tipados, `formatDateSiiDdMmYyyy`, `DTEWS_PATHS` |
| `domain/iev.ts` | `buildIevVentasXml`, `buildIevComprasXml`, `buildIevResumen` (libro ESPECIAL/TOTAL) |
| `domain/set-pruebas.ts` | `buildDteSetPruebas` (referencia SET/CASO), `tasaIvaParaFecha`, NC devolución/diferencia, `buildSetPruebasEnvio`, `assertRutsReceptorDistintos`, `RUT_RECEPTOR_SII` |
| `domain/dte-xml.ts` | Carátula completa: `RutEnvia`, `TmstFirmaEnv`, `SubTotDTE`; `DteReferencia` con `tipoDocumento: number \| string` (SET) |
| `domain/sii-dte.ts` | `CafFolio.idk?/rutEmisor?`, `QueryEstUpResult`, `QueryEstDteAvResult`, `ReenvioCorreoResult`, `SiiAuthWsRespuesta`, `SiiUploadEstado` |

### Nuevo en `apps/nucleo`
| Archivo | Contenido |
|---|---|
| `api/lib/sii-client.ts` | **Fix TED**: `firmarTimbre` (FRMT = RSA-SHA1 del `<DD>` con la llave privada del CAF), `<DD>` completo con `<CAF>`/`<FRMA>`/`<TSTED>`, `FE` = fecha de emisión del DTE; `signEnvioDteXml` (firma SetDTE); `signSeedXml` (semilla firmada del manual); `getSiiTokenWs` (CrSeed→firma→token); `consultarEstadoUpload`, `consultarEstadoAvanzado`, `reenviarCorreoValidacion` |
| `api/routes/sii/dte.ts` | `GET /consultar-upload/:track_id` (QueryEstUp), `GET /individual-av` (QueryEstDteAv, firma del sii_xml guardado), `POST /reenviar-correo` (wsDTECorreo) — token con fallback WS→legacy |
| `api/routes/sii/certificacion.ts` | `POST /set-pruebas` (casos → DTEs firmados/timbrados → EnvioDTE único en orden → opcional envío), `POST /iev` (IEV ventas/compras firmado) |
| `api/lib/sii-timbre.test.ts` | Vector dorado del manual + verificación criptográfica del FRMT |
| `api/lib/sii-ws.test.ts` | Fetch mockeado + P12 real generado con node-forge (firma de semilla verificada) |

### Diferencias de comportamiento a tener presentes
- El TED ahora firma el `<DD>` con la llave privada del CAF y emite el
  `<CAF>` completo (antes el `FRMT` repetía la `FRMA` del CAF, lo que el SII
  rechaza). La emisión existente (`/api/sii/dte/emitir`) usa el nuevo timbre.
- `sii_caf` no guarda `IDK` (se mapea a `nro_resol` al parsear el CAF); el
  TED omite `<IDK>` cuando no está disponible.
- La firma xmldsig conserva el enfoque del repo (digest sobre contenido
  extraído con colapso de espacios, `latin1`); no se introdujo librería de
  c14n. El timbre TED sí usa el algoritmo exacto del SII (verificado con el
  vector del manual).
- El IEV se genera según el formato IECV documentado; **validar el XML
  contra el XSD oficial** ("Formato Información Electrónica de Compras y
  Ventas") antes del envío de certificación.

## 8. Checklist operativo de certificación

1. Postulación aprobada → descargar el Set de Pruebas único desde
   `https://maullin.sii.cl/cvc/dte/certificacion_dte.html`.
2. Verificar en `GET /api/sii/certificacion/checklist`: identidad del
   emisor, CAF activos (33/39/46), P12 vigente, clave SII, material de
   cifrado.
3. Solicitar folios de certificación (`POST /api/sii/caf/solicitar` o
   import manual) si el checklist no los muestra.
4. Transcribir los casos del set a `POST /api/sii/certificacion/set-pruebas`
   (los casos llegan en PDF/web del SII; el formato del request está
   documentado en la ruta). Enviar con `enviar: true`.
5. Consultar el resultado: `GET /api/sii/dte/consultar-upload/:track_id`
   (QueryEstUp) y, si hay rechazos, `GET /api/sii/dte/individual-av` por
   documento. Ante reparos: reenviar el caso con folio distinto.
6. Cuando el set esté aceptado sin reparos: generar los libros con
   `POST /api/sii/certificacion/iev` (ventas FolioNotificacion 1 y compras 2,
   mismo período tributario) y subirlos al portal de certificación.
7. Declarar avance del Set de Pruebas en el web del SII (fecha y número de
   cada envío = track_id).
8. Seguir con Simulación (10–100 DTEs reales), Intercambio, Impresos PDF417,
   y Declaración del Representante Legal.

## 9. Cesión de Créditos — Registro Público Electrónico (RPETC)

### 9.1 Upload de Archivos Electrónicos de Cesión (AEC)
POST multipart RFC1867 a `/cgi_rtc/RTC/RTCAnotEnvio.cgi` (maullin/palena) con
cookie `TOKEN`, campos `emailNotif`, `rutCompany`, `dvCompany` y `archivo`
(raíz `<AEC>` con `<DocumentoAEC ID="DOCAEC1">`). Respuesta `<RECEPCIONAEC>`
con `STATUS` (0 = OK + `TRACKID`, 1 sin permiso, 2 tamaño, 4 faltan
parámetros, 5 token inválido, 6 empresa no DTE, 9/10 interno).
→ `POST /api/sii/rpetc/aec/enviar`.

### 9.2 wsRPETCConsulta (SOAP, `DTEWS/services/wsRPETCConsulta`)
Namespace `http://DefaultNamespace`, autenticación AUTAUTOM:
- `getEstEnvio(Token, TrackId)` → `ESTADO_ENVIO`: UPL → RCP → RSC/SOK → RFS/FSO
  → RCR/COK → VDC/RDC → VCS/RCS → **EOK** (aceptado) / **EAN** (anulado).
- `getEstCesion(Token, RutEmisor, DVEmisor, TipoDoc, FolioDoc, IdCesion?)` →
  `RUT_TENEDOR`, `FECHA_ULT_ANOT`, `DEC_JURADA`, `RUT_COBRANZA`,
  `DIR_COBRANZA`; sin IdCesion solo indica cedido/no cedido.
- `getEstCesionRelac(Token, …, RutEmpresa, DVEmpresa)` → misma respuesta para
  tenedor/receptor vinculado.

Estados de operación: 0 OK · 1 datos · 2 sin información · 3/4/5 token ·
6-8 interno · 9 permisos · 10 usuario sin permiso · -15 empresa no vinculada.
→ `GET /api/sii/rpetc/envio/:track_id`, `/cesion`, `/cesion-relacionada`.

### 9.3 WSREGISTRORECLAMODTE (ws1/ws2.sii.cl, Ley 20.956)
`https://ws2.sii.cl/WSREGISTRORECLAMODTECERT/...` (certificación) /
`https://ws1.sii.cl/WSREGISTRORECLAMODTE/...` (producción). Métodos:
- `ingresarAceptacionReclamoDoc(rutEmisor, dvEmisor, tipoDoc 33/34/43, folio,
  accionDoc)` — acciones: `ACD` acepta contenido, `RCD` reclama contenido,
  `ERM` recibo de mercaderías, `RFP` falta parcial, `RFT` falta total.
  Regla de **8 días corridos** desde la recepción en el SII; pasado ese plazo
  no se registran eventos. Códigos: 0/1 OK, 2-4 errores de datos, 5-7
  conflictos de estado, 8 fuera de plazo, 10 no emitido/recibido desde
  14/01/2017, 11-13 transiciones inválidas, 17 solo empresa receptora, 18 no
  recibido, -1 error interno.
- `listarEventosHistDoc`, `consultarDocDteCedible` (códigos 20-25:
  `23` cedible sin reclamos, `24` no cedible por reclamo, `25` cedible por
  acuse tácito a los 8 días), `consultarFechaRecepcionSii`.
→ `POST /api/sii/rpetc/reclamo/registrar`, `GET /reclamo/eventos`,
  `/reclamo/cedible`, `/reclamo/fecha-recepcion`.

### 9.4 API-RPETC (2025) — OAuth 2.0 con JWT RS256
Autenticación moderna con `cert_credentials` (documento v3.0, 25/11/2025):
1. **JWT**: header `{"alg":"RS256","x5c":<cert X.509 DER en base64 ESTÁNDAR>}`;
   payload `{"aio":<RUT sin DV>,"exp":<ahora+600s>,"aud":<endpoint token>}`;
   firma RS256 con la llave privada del certificado (el SII valida que `aio`
   coincida con el RUT del certificado).
2. **Token**: POST `https://apicert.sii.cl/oauthsii-v1-ms/extauth/v1/token`
   (cert) / `https://api.sii.cl/...` (prod) con `Authorization: Basic
   <client_id:client_secret>` y form `grant_type=cert_credentials`,
   `scope=RTC_TAR RTC_PRO_RES RTC_PRO_TOD RTC_PRO_PER RTC_PRO_EST`,
   `jwt=<JWT>` → `access_token` (Bearer, ~1h40) + `refresh_token`.
3. **Refresh** (1 día): POST `…/authorization/v1/token` con
   `grant_type=refresh_token&refresh_token=…`.
4. **Tareas asincrónicas** (base `/api/api-rpetc`): `recurso/v1/tarea/{rut}-{dv}/cesiones.deudor|cedente|cesionario` (GET), `…/certificados.cesiones.{rol}` (POST), `recurso/v1/estado|resultado/{rut}-{dv}/{idTarea}`, `recurso/v1/estados/{rut}-{dv}[/periodo/{AAAA-MM}]`.

**Env requeridos**: `RPETC_CLIENT_ID`, `RPETC_CLIENT_SECRET` (Basic auth del
OAuth). El `aio` se extrae del certificado (P12) o se pasa explícito.
→ `POST /api/sii/rpetc/api/tarea`, `GET /api/tarea/estado`,
  `/api/tarea/resultado`, `/api/estados`.

## 10. Mensaje de Respuesta a DTE (intercambio — etapa 3 de certificación)
Formato SII 2005. Raíz `<RespuestaDTE>` (firmada). El mensaje se usa
**excluyentemente** como acuse de recibo o como resultado de revisión:
- Carátula: `<RutResponde>` (DE), `<RutRecibe>` (PARA), `<NroRespuesta>`,
  `<NroDetalles>`, contacto/telefono/correo opcionales, `<FchRespuesta>`.
- `<RecepcionEnvio>`: `<NmbArchivo>`, `<FchRecep>`, `<CodEnvio>`, `<IDEnvio>`,
  `<DigestEnvio>`?, `<RutEmisor>`, `<RutReceptor>`, `<EstadoRecepEnv>`
  (0 conforme, 1 schema, 2 firma, 3 RUT receptor, 90 repetido, 91 ilegible,
  99 otros), `<GlosaEstadoRecepEnv>`, `<NroDocumentos>` + `<Documento>`
  (TipoDocumento, Folio, FchEmis, Ruts, MntTotal, EstadoRecepDoc 0-4/99,
  GlosaObservacion).
- `<ResultadoDTE>`: TipoDTE, Folio, FchEmis, Ruts, MntTotal, CodEnvio,
  `<Estado>` (0 aceptado OK, 1 discrepancia, 2 rechazado), `<Glosa>`
  (ACEPTADO OK / ACEPTADO CON DISCREPANCIAS / RECHAZADO + motivo, con
  referencia a la Ley 19.983 en rechazos), `<CodRchDsc>`?.
→ `buildRespuestaDteXml` en `@enjambre/contable`; firmar con `signNode(xml,
"RespuestaDTE", p12, pwd)` y enviar al emisor del documento.

## 11. Agente Retenedor — Cambio de Sujeto de IVA
Res. Ex. N° 107/2005: los agentes retenedores deben declarar la calidad de
tales en el DTE (factura, NC, ND y factura de compra) para eximirse de la DJ
de Informe Mensual Retenedores. Campos (orden según schema EnvioDTE_v10):
- **Detalle**: `<IndAgente>R</IndAgente>` (obligatorio en toda venta/compra
  del producto), `<CdgItem><TpoCodigo>CPCS</TpoCodigo><VlrCodigo>…</…>`
  (obligatorio si IndAgente), `<UnmdItem>` (columna 7 de la tabla), `<QtyRef>`/
  `<UnmdRef>` (solo faenamiento y ventas de ganado), `<CodImpAdic>` (código
  de retención, columnas 2/3).
- **Encabezado (Totales)**: `<TasaImp>` y `<MontoImp>` de la retención del
  documento. (El `TipoImp` del instructivo 2005 no es elemento del schema
  v10: el código va en `CodImpAdic` del detalle.)
- Tabla completa de los 16 cambios de sujeto (arroz 36/361 10%, berries
  48/481 14%, carne faenamiento 17 5%, carne ventas 18 5%, cartones 47,
  chatarra 38, construcción 41, especies hidrobiológicas 37/371 10%, ganado
  32/321 8%, harina 19 12%, legumbres 30/301 13%, madera 33/331 8%, medios
  de prepago 50, PPA 39, productos silvestres 31, trigo 34/341 11%) en
  `CAMBIOS_DE_SUJETO` (`@enjambre/contable`).

## 12. Mapa de implementación (segunda tanda)
| Módulo | Contenido |
|---|---|
| `contable/domain/iev.ts` | Reescrito al formato v3.0 (tags exactos) |
| `contable/domain/respuesta-dte.ts` | Mensaje de respuesta (acuse / resultado) |
| `contable/domain/cambio-sujeto.ts` | Tabla CPCS completa + búsquedas |
| `contable/domain/rpetc.ts` | `parseRecepcionAec`, SOAP wsRPETCConsulta + WSREGISTRORECLAMODTE, JWT/OAuth puro, rutas de tareas |
| `contable/domain/dte-xml.ts` | Campos de retención en detalle y Totales |
| `nucleo/api/lib/rpetc-client.ts` | Upload AEC + 3 consultas wsRPETCConsulta + 4 métodos de reclamo |
| `nucleo/api/lib/rpetc-api.ts` | `buildRpetcJwt` (RS256 + x5c), `extractRutFromCert`, OAuth2 token/refresh, tareas asincrónicas |
| `nucleo/api/routes/sii/rpetc.ts` | 12 rutas bajo `/api/sii/rpetc` |
