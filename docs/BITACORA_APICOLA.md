# BITACORA_APICOLA.md — Bitácora apícola por voz (módulo Chiloé)

> **Clase: SPEC.** Patio = Núcleo, no Campo. El motor Dexie del POS está documentado en [`CAMPO_OFFLINE.md`](./CAMPO_OFFLINE.md); no crear `@enjambre/offline` “para la bitácora” sin un segundo consumidor real.
>
> Especificación del módulo de bitácora del ciclo de vida completo de la colmena:
> captura por voz, sin correlatividad exigida, tolerante a desconexión, con componente sanitario legal.
> Fuente: conversación de diseño en TENANTE (julio 2026) + protocolo territorial (v0.1).
> **Principio de construcción: reutilizar y adaptar lo localmente existente antes de crear algo nuevo.**
> Cada capacidad de esta spec mapea a un activo ya vivo en el monorepo (§5).
> **Lectura obligatoria antes de tocar migraciones 1006+, `src/api/routes/bitacora.ts`,
> o cualquier componente bajo `src/components/apicultor/` que extienda `ColmenaFicha`.**

---

## 0. Contexto — por qué existe este módulo

El apicultor no llena formularios: tiene las manos ocupadas sosteniendo cuadros, trabaja en apiarios sin señal,
y narra su trabajo como lo piensa —la colmena 20, luego la 1, luego la 15, volviendo a la 20— sin orden correlativo.
La bitácora que ya lleva en papel (o en la cabeza) debe volverse un registro longitudinal estructurado, capturado
por voz y sincronizado cuando vuelve la señal.

**El principio rector:** tratar el habla del apicultor como un texto etnográfico lleno de idas y vueltas, no como
el llenado ordenado de un formulario. El sistema pone orden después, no exige orden antes.

**El anillo temporal:** el estado final de invernada de una temporada es el estado inicial de la siguiente.
La bitácora es una serie temporal —la comparación entre inspecciones sucesivas es lo que permite inferir desarrollo,
no sólo estado puntual. La fecha ancla cada evento.

**La tesis de construcción:** casi ninguna pieza de esta spec se construye de cero. El motor offline-first, el
patrón de parseo con confianza, la ficha de colmena, el cuaderno sanitario, el BFF con contratos zod, el kit de UI
y la disciplina RLS ya existen y funcionan. Este módulo es **ensamblaje y adaptación** de lo que el enjambre ya tiene.

---

## 1. El ciclo de vida documentado (modelo longitudinal)

El registro sigue cinco fases. Cada fase repite un esquema de campos comparable — esa comparabilidad es el valor.

### 1.1 Compra del núcleo — estado basal

Al adquirir un núcleo se fija una línea de referencia contra la que se mide todo el desarrollo posterior:

- Cuadros con cría **abierta** y cría **cerrada** (la proporción informa edad relativa de la postura y salud de la reina).
- Cuadros con miel.
- Reina: **RV** (reina vista), **NV** (no vista), **SR** (sin reina) — nomenclatura estándar de bitácoras apícolas.
- **Cada cuadro se individualiza** (posición + tipo), no basta un total agregado.

### 1.2 Traspaso a cámara de cría

Cada marco del núcleo se reubica en una posición determinada de la cámara de cría (p. ej. marcos 1–4 del núcleo →
posiciones 4–7 de la cámara). Se registra:

- Tamaño de población.
- Cuadros de cría abierta / cerrada.
- Clasificación funcional de bastidores: **C** = cría, **L** = cera labrada (trabajada por la abeja, sin miel),
  **E** = cera estampada, **V** = vacío, **M** = miel.
- Posición de cada cuadro trasvasijado.

### 1.3 Progresión de alzas (1ª, 2ª, 3ª)

Para cada alza agregada se repite el esquema: cuadros vacíos, cuadros con miel, avance de cría si corresponde.
Lógica funcional: el segundo cuerpo opera como extensión de cámara de cría; el tercero como almacén de cosecha.

### 1.4 Cosecha e invernada — registro inverso

Al llegar la cosecha el registro se invierte: se anota **lo que hay** y **lo que falta** para preparar la invernada.

- Kilos extraídos, estado de la reina y sus características.
- Proporción relativa de producción: cera, polen, miel, propóleo.
- Entrada a invernada: tamaño de población, cantidad de alimento suministrado, cuadros con abeja
  diferenciando cría abierta y cerrada — esencialmente el mismo esquema que el registro basal del núcleo.

### 1.5 Inicio de nueva temporada

Ya sin núcleo, con colmena establecida: el primer registro es la **alimentación y su propósito**
(estimular postura / complementar reservas), seguido del monitoreo de reservas mediante el desarrollo
(cuadros con cría, tamaño de población) hasta **normalizar el estado** y habilitar la colocación de la primera alza.

---

## 2. Componente sanitario (subesquema con trazabilidad legal)

El sanitario no es observación de campo: involucra trazabilidad legal y archivo obligatorio.

### 2.1 Muestreo y contramuestreo

- **Varroa:** ~300 abejas adultas, tomadas de 2–3 cuadros de cría evitando a la reina.
- **Nosemosis:** 60 abejas pecoreadoras de la entrada de la colmena.
- **Umbral de muestreo por apiario:** 5 colmenas si el colmenar tiene menos de 50; 10% del total si lo supera.
- **Contramuestreo:** verificación posterior (tras tratamiento o ante sospecha epidemiológica). Debe registrar
  si el resultado **confirma remisión del cuadro sanitario antes de levantar cualquier cuarentena declarada**.

### 2.2 Resultados de laboratorio

Cada muestra enviada a laboratorio acreditado queda vinculada a su resultado: porcentaje de infestación de varroa,
presencia/ausencia de esporas de nosema, u otros patógenos (DWV, ABPV).
**Archivo mínimo: 2 años** según buenas prácticas apícolas.

### 2.3 Tratamientos fitosanitarios

Por cada aplicación se captura: colmena tratada, nombre comercial y genérico, **ingrediente activo**,
dosis recomendada vs. dosis aplicada, enfermedad controlada, vía y forma de administración, y **período de retiro**.
Las abejas son animales productores de alimento: la National Bee Unit (RU) exige conservar estos datos
**al menos 5 años**.

**Alerta automática de retiro:** productos de varroa (Bayvarol, Verostop, Apitraz, Alvar) tienen períodos de
resguardo distintos y no deben aplicarse durante flujos de néctar destinados a consumo humano. El sistema debe
alertar si una alza está puesta durante un período de retiro vigente.

### 2.4 Rotación de principio activo

El principio activo debe rotarse entre temporadas para evitar resistencia de *Varroa destructor*.
El sistema consulta el historial de ingredientes activos aplicados a cada colmena en tratamientos previos.

---

## 3. Captura: voz libre, colmenas no correlativas

### 3.1 El problema específico

Las soluciones existentes fijan "esta colmena" antes de dictar (NFC, QR, lista). El apicultor de Chiloé no
quiere entrar/salir de cada colmena en la pantalla: quiere hablar de la 1, saltar a la 20, volver a la 1,
y que el sistema no se pierda. Es **segmentación y atribución automática de discurso libre a entidades cambiantes**.

### 3.2 Marcadores de colmena

- El modelo identifica expresiones como "colmena veinte", "la veinte", "número veinte", "núcleo cinco"
  como **marcadores de contexto**, tolerando variación hablada.
- Todo lo dicho entre un marcador y el siguiente se agrupa en el registro de esa colmena, aun sin orden correlativo.
- Se construye una **tabla de equivalencias** entre la forma hablada y el identificador interno de la colmena.

### 3.3 Sesiones

Una sesión de inspección se marca con fecha, apiario y contexto ("revisión de primavera") y contiene múltiples
colmenas. Estructura subyacente: **sesión > colmena > evento** (alimentación, colocación de alza, cosecha,
tratamiento sanitario, etc.).

### 3.4 Doble nivel: captura en campo + curaduría en escritorio

1. **Campo:** el apicultor habla libremente, sin tocar la pantalla. El sistema no interrumpe el flujo.
2. **Escritorio (casa o galpón):** el modelo muestra hipótesis de organización ("estas frases parecen pertenecer
   a la colmena 15, ¿confirmas?") y el apicultor acepta o corrige con voz o texto, sin reescribir todo.

Este doble nivel es el diferenciador: captura libre en campo, curaduría asistida en escritorio.

---

## 4. Estado del arte global (y el diferenciador)

| Herramienta | Qué hace | Límite |
|---|---|---|
| **Apian** | Dictado con modelo local offline → campos organizados → diario profesional al sincronizar | Colmena ya seleccionada en UI |
| **HiveSense / BeeKing** | Transcripción en dispositivo, etiquetado automático (reina, cría, varroa, alzas) | Colmena ya seleccionada en UI |
| **BeeKeeper Voice** | 90+ métricas de apiario por comandos de voz | Flujo de formulario guiado |
| **ApiNote / Beeledger / WhisperBee** | Notas habladas → fichas estructuradas, colas locales + sync | Colmena ya seleccionada en UI |
| **Hive Pal** | Stack abierto Whisper + LLM, extracción automática, multilingüe, autohospedaje | Colmena ya seleccionada en UI |

**El giro que ninguna asume:** liberar al apicultor de *seleccionar* cada colmena antes de hablar, y aceptar
su relato errático, circular y no correlativo como entrada válida. La entidad "colmena" se detecta en la propia voz.

---

## 5. Matriz de reutilización — cada capacidad con lo localmente existente

Auditoría 2026-08-03. Cada fila: capacidad de la spec → activo local vivo → archivo → adaptación necesaria.

### 5.1 Offline-first y sincronización diferida (la columna vertebral)

| Capacidad | Activo local | Dónde | Adaptación |
|---|---|---|---|
| Cola de sync con reintentos | `sync_queue` Dexie (payload JSON opaco, `status: pending/error`, backoff `next_retry_at`) | `apps/campo/src/lib/offline/db.ts` (v3, líneas 57-61) | Replicar el esquema en nucleo (o extraer a un paquete `@enjambre/offline`); la semántica ya está resuelta |
| Motor de sync (upsync + downsync) | `useSyncEngine()` → `{ triggerSync }`; dispara en mount y evento `online`; backoff exponencial `min(60s·2^n, 30min)`, `MAX_ATTEMPTS=6`, 200 = replay idempotente | `apps/campo/src/hooks/use-sync-engine.ts` | Adaptar: postear a `bitacora.ts` en vez de `rep-ventas/quick`; downsync de colmenas para equivalencias habladas→id |
| Idempotencia de replay | `client_request_id = crypto.randomUUID()` en el caller → prefijo en columna de dedupe server-side (`ventas.buy_order = 'POS-' + uuid`) | `cash-context.tsx:198,240` · `apps/nucleo/src/api/routes/rep-ventas.ts:79-104` | Mismo patrón: `BITACORA-<uuid>` en columna dedicada de la captura (SELECT pre-insert → 200 con `already_processed`) |
| Simetría online/offline | El mismo objeto `payload` se manda por `apiFetch` o se guarda en `sync_queue` — sin transformación entre paths | `cash-context.tsx:196-236` | Ídem para capturas de voz: el body que iría online es el que se encola |
| UI de estado de sync | `SyncStatusBanner` (polla cada 5s, auto-oculto) + `SyncQueueModal` (Reintentar Todo, Descartar) | `apps/campo/src/components/pos/sync-status-banner.tsx` · `sync-queue-modal.tsx` | Copiar-adaptar: "N capturas pendientes de sync", mismo patrón visual (badge WifiOff ya existe en catálogo POS) |
| Fallback offline de contexto | Leer snapshot local cuando `!navigator.onLine` en vez de API (y re-escribir en cada refresh online) | `apps/campo/src/components/pos/feria-context.tsx:82-104` | Ídem para el catálogo de colmenas del apiario (downsync a Dexie) |

### 5.2 Voz → estructura (la capa semántica)

| Capacidad | Activo local | Dónde | Adaptación |
|---|---|---|---|
| Parseo de texto a campos con confianza | **Patrón `ReceiptParser`**: interfaz `{ id, detect(text): boolean, parse(text) }` + orquestador con **fallback genérico** + `assessParseConfidence` con pesos y **umbral de auto-emisión 0.85** | `packages/contable/src/domain/receipt-parsers/` (15 parsers) · `receipt-orchestrator.ts` · `parse-confidence.ts` | Clonar el pipeline: `bitacora-parsers/` con `detect` = marcadores de colmena ("la veinte", "núcleo cinco") y `parse` = cuadros cría abierta/cerrada, miel, reina RV/NV/SR, alzas. La confianza decide auto-aprobar vs. mandar a curaduría |
| Registro de parsers | `ALL_PARSERS[]` + `PARSER_BY_ID` Map + `getParserById`; agregar un parser = 1 archivo + 3 líneas | `packages/contable/src/domain/receipt-parsers/index.ts` | Ídem: catálogo `BITACORA_PARSERS` por tipo de frase (estado basal, traspaso, alza, sanitario) |
| Confianza y auto-emisión | `assessParseConfidence` puntúa campos con pesos (0.3/0.2…), marca `ok/inferido/faltante` | `packages/contable/src/domain/parse-confidence.ts` | Reusar el concepto: umbral bajo → hipótesis + curaduría; umbral alto → confirmación directa |
| Micrófono (perimiso + señal) | `EspectroVivo`: `navigator.mediaDevices.getUserMedia({ audio: true })` + `AudioContext` + `meyda` (análisis espectral en vivo) | `apps/nucleo/src/components/widgets/espectro-vivo/EspectroVivo.tsx` (movido de `components/apicultor/` en la reestructuración de widgets) | **Semilla del grabador**: extendido en `RecorderVoz` con `MediaRecorder` (Safari iOS soporta desde 14.3 → piso 15.4 cubierto; codec `audio/mp4`/m4a, no webm). No requiere polyfill nuevo en `LegacyBrowserPolyfills` |

### 5.3 UI y dominio apícola (lo que ya existe y se extiende)

| Capacidad | Activo local | Dónde | Adaptación |
|---|---|---|---|
| Ficha de colmena | `ColmenaFicha` con 6 tabs (`resumen | inspecciones | varroa | peso | costos | blockchain`) e inserts directos a `inspecciones`/`varroa_records`/`peso_records` | `apps/nucleo/src/components/apicultor/ColmenaFicha.tsx` (tabs línea 38) | Nueva tab **"Bitácora"** con las 5 fases (§1); el esquema de inserción ya existe |
| Cuaderno sanitario | `CuadernoCampoPanel`: resumen de varroa + inspecciones agregadas por colmena (deriva de props con `useMemo`) | `apps/nucleo/src/components/apicultor/CuadernoCampoPanel.tsx` | **Semilla del módulo sanitario**: extender con tratamientos + muestras + contramuestreos (§2) |
| Planificación del ciclo | `CalendarioCiclico` sobre `calendario_tasks` (categorías `inspeccion | cosecha | tratamiento | reforestacion | transhumancia | cera`, prioridades) | `CalendarioCiclico.tsx` · `00_initial_schema.sql:183` · migración `20260601022355` | Reutilizar categorías para programar alzas/tratamientos por temporada; el tipo `CalendarioTaskRow` ya existe en `apicultor-types.ts` |
| Historia de reinas | Comentario en código apunta a tabla `reina_history` (NO existe aún) | `ColmenaFicha.tsx:121` | La spec exige características de la reina por temporada → crear `reina_history` como parte de la migración |
| Vista apicultor | `ApicultorView` con 6 tabs (`colmenas | apiarios | sanidad | calendario | trazabilidad | territorio`) | `apps/nucleo/src/views/ApicultorView.tsx` (tabs línea 44) | La bitácora se monta como tab (o dentro de `sanidad`/`colmenas`); el tab `calendario` ya redirige a `/calendario?type=apicultura` |
| Formularios territoriales | Wizard + forms con BFF (zod, `useApiFetch`, react-query) | `CensoLegalWizard.tsx`, `InscripcionActorForm.tsx`, etc. | Patrón de referencia para los forms de la bitácora |
| Mapas / contexto de apiario | `MapaLegadoBase`, `MapaTerritorial` (Leaflet) | `apps/nucleo/src/components/map/` | Las sesiones se ligan a `apiarios` existentes; sin trabajo nuevo de mapa |

### 5.4 Plataforma (auth, BFF, datos, storage)

| Capacidad | Activo local | Dónde | Adaptación |
|---|---|---|---|
| BFF con contratos | `registro-territorial.ts`: `authMiddleware` global + validación **zod estricta** (`.strict()`) + `validarRUT` de contable | `apps/nucleo/src/api/routes/registro-territorial.ts` (endpoints líneas 140-674) | Mismo estilo para `bitacora.ts`; además usar `checkRateLimit` (`src/api/lib/ratelimit.ts`, hoy sólo en checkout) para el endpoint de sync |
| Cliente BFF | `useApiFetch` (Bearer + `x-empresa-id` desde `app_metadata`) | `apps/nucleo/src/hooks/use-api-fetch.ts` | Ídem, sin cambios |
| Auth server-side | `createSupabaseUserClient(accessToken)` (BFF), `createServerClientFromCookies`, `logSecurityEvent` | `@enjambre/auth` (`bff.ts`, `server.ts`, `security-events.ts`) | Ídem; re-exports en `apps/nucleo/src/lib/`, nunca clientes ad-hoc |
| Storage de audio | Bucket privado con RLS por owner: `certificados-sanitarios` (`owner = auth.uid()` o `is_admin()`, MIME+size constraints) | migración `1005_certificados_sanitarios_bucket.sql` + `20260614041600_secure_storage_buckets.sql` | Clonar: bucket `bitacora-audio` privado, owner/is_admin, MIME `audio/*`, límite ~25MB |
| Tipos generados | `database.types.ts` cubre `colmenas`, `inspecciones`, `varroa_records`, `peso_records`, `cosechas`, `calendario_tasks`, tablas territoriales | `packages/database/database.types.ts` · `pnpm db:typegen` | Regenerar tras la migración; `apicultor-types.ts` ya tipa `ColmenaWithRelations` |
| RLS apícola | Políticas SELECT existentes para `inspecciones`/`varroa_records`/`peso_records` | `01_rls_policies.sql:57-64` | Extender el mismo estilo a las tablas nuevas |
| UI kit | `@enjambre/ui`: `Dialog`, `Tabs`, `DataTable`, `DatePicker`, `Calendar`, `Select`, `Badge`, `EmptyState`, `StatCard`, `ImmersiveModal`, `ProgressRing`, toasts | `packages/ui/src/` (73 exports) | Sin trabajo nuevo; toda la UI de la bitácora se ensambla con esto |

### 5.5 Brechas reales (lo único genuinamente nuevo)

| Brecha | Por qué | Mitigación |
|---|---|---|
| Grabación de audio persistente | No hay `MediaRecorder` en el monorepo; `EspectroVivo` sólo analiza el espectro en vivo | Extender `EspectroVivo` con grabación; `MediaRecorder` es nativo en iOS 14.3+ |
| Persistencia de blobs en Dexie | `sync_queue` es JSON opaco; no existe ningún ejemplo de Blob/ArrayBuffer en Dexie | Nueva tabla `grabaciones` (Blob + duración + estado); el payload de la cola referencia `grabacion_id` local, nunca el binario |
| Tablas de muestras/tratamientos/cuadros | No existen (grep confirmado); sólo `alertas_fitosanitarias` y campos `cert_*` | Migración nueva (ver §7) |
| Transcripción (audio→texto) | No hay Whisper/LLM/STT en el monorepo (nada que reutilizar) | Servicio externo (API de transcripción) invocado **sólo desde el backend**; el parser de campos es local (patrón contable) |

### 5.6 Riesgos detectados en la auditoría (trabajo previo obligatorio) — RESUELTOS

1. **Divergencia schema↔código**: `ApiarioManager.tsx:172-177` escribe `colmenas.health` y `colmenas.user_id`;
   `ApiarioManager.tsx:101-108` escribe `apiarios.health/details` — columnas ausentes del schema canónico.
   **Resuelto en `1007_fix_colmenas_apiarios_columns.sql`** (idempotente; la BD real ya las tenía — drift).
2. `colmenas` tiene columnas duplicadas (`name`/`nombre`, `notas`/`notes`, `ultima_inspeccion`/`last_inspection`).
   **La BD real usa `last_inspection`** (el typegen no tiene `ultima_inspeccion`) — el BFF escribe `last_inspection`.
3. `reina_history` mencionada en código pero inexistente → **la BD real SÍ la tiene** como stub
   (`generation/origin/since/status`, creada manualmente, nunca canonicada). Resuelto en `1006` con
   CREATE canónico + ALTERs de convergencia (las columnas legacy se conservan).
4. `colmenas.numero_caja` no existe en la BD real → la equivalencia hablada→colmena (§3.2) matchea por `name`.
5. **Colisiones de prefijo en migraciones** (`20260802140000` y `20260802160000` duplicados, ambos del flujo
   paralelo): renombradas a `...140001` / `...160001` — test de migraciones 10/10.
6. `MediaRecorder` en Safari iOS graba `audio/mp4` (m4a); no asumir webm.

---

## 6. Arquitectura técnica adaptada (Supabase + Vercel + BFF Hono)

Pipeline: **grabación local → cola local → sync diferida → transcripción en backend → parseo con confianza → curaduría**.

```
Dispositivo (apiario, sin señal)
├── RecorderVoz (extiende EspectroVivo) → MediaRecorder (m4a)
├── Dexie: tabla `grabaciones` (Blob) + `sync_queue` (payload JSON, patrón Campo)
└── UI: SyncStatusBanner/SyncQueueModal adaptados ("N capturas pendientes")

Backend (Núcleo / Vercel — única vía de escritura)
├── BFF `bitacora.ts` (estilo registro-territorial: auth + zod + rate limit)
├── Upload de audio → bucket `bitacora-audio` (clon de certificados-sanitarios)
├── Transcripción (servicio externo, SOLO server-side) → text
├── `bitacora-parsers/` (patrón ReceiptParser): marcadores → fragmentos por colmena
│   └── confidence ≥ 0.85 → auto-emit · < 0.85 → hipótesis para curaduría
└── Idempotencia: `BITACORA-<client_request_id>` (patrón buy_order)

Escritorio (con señal)
└── Curaduría asistida: hipótesis de atribución, confirmar/corregir (voz o texto)
```

### 6.1 Reglas de diseño

- **La lógica de reconocimiento vive en el backend, nunca en el cliente** (respeta RLS, y los dispositivos
  legacy de iOS 15 no corren modelos).
- **El audio es la fuente de verdad**; transcripción y campos son derivados editables.
- **El esquema apícola base no se reestructura:** se amplía con tablas hijas y detalle de cuadros (ver §7).
- **La sincronización reutiliza la semántica de Campo** (`sync_queue` + `useSyncEngine`), no se crea un motor ad-hoc.
- Acceso vía BFF Hono (`bitacora.ts`), nunca Supabase directo desde el cliente — misma disciplina que el registro
  territorial (el CRUD de colmenas legacy por supabase directo queda como está; la bitácora entra por BFF).

---

## 7. Modelo de datos — reutilización + extensión mínima

### 7.1 Lo que ya existe (base, no se toca)

| Tabla | Campos relevantes | Estado |
|---|---|---|
| `colmenas` | `reina_info JSONB`, `alzas INT`, `nucleos_candidatos`, `estado`, `peso_kg`, `ultima_inspeccion` | Viva (ver §5.6 divergencias) |
| `inspecciones` | `date`, `marcos_cria`, `marcos_miel`, `varroa`, `poblacion`, `reina`, `notes` | Viva — la bitácora la alimenta |
| `varroa_records` / `peso_records` | `date`, `level`/`kg` | Vivas |
| `cosechas` | `fecha`, `kg`, `floracion`, `lote_id` | Viva (BFF `produccion.ts` ya la sirve) |
| `apiarios` | `sector`, `lat/lng`, `created_by` | Viva |
| `calendario_tasks` | categorías incluyen `inspeccion`, `tratamiento`, `cosecha` | Viva — planificación del ciclo |
| RLS | policies SELECT para inspecciones/varroa/peso | `01_rls_policies.sql:57-64` |

### 7.2 Tablas nuevas (migración `1006_bitacora_apicola.sql`, bloque autónomo)

```sql
-- Captura de voz: audio como fuente de verdad
voice_inspection_captures
  id UUID PK
  session_id UUID → sesiones_bitacora(id)
  colmena_id UUID NULL → colmenas(id)      -- NULL hasta atribución semántica
  client_request_id UUID UNIQUE            -- idempotencia de replay (patrón buy_order)
  audio_url TEXT                           -- bucket bitacora-audio
  transcript_raw TEXT
  estado TEXT  -- capturado | transcrito | procesado | en_revision | confirmado
  atribucion_hipotesis JSONB                -- [{colmena_id, fragmento, confianza}]
  dispositivo TEXT, duracion_seg INT
  created_at TIMESTAMPTZ

-- Sesiones de inspección (múltiples colmenas por sesión)
sesiones_bitacora
  id UUID PK
  apiario_id UUID → apiarios(id)
  fecha DATE NOT NULL
  contexto TEXT                             -- "revisión de primavera"
  audio_url TEXT, duracion_seg INT
  user_id UUID → profiles(id)
  sincronizado_at TIMESTAMPTZ

-- Detalle por cuadro (individualización exigida en §1.1 y §1.2)
inspeccion_cuadros
  id UUID PK
  inspeccion_id UUID → inspecciones(id) ON DELETE CASCADE
  posicion INT                              -- 1..10 en cámara, o 1..N en alza
  cuerpo TEXT                               -- nucleo | camara | alza_1 | alza_2 | alza_3
  tipo TEXT                                 -- cria_abierta | cria_cerrada | miel |
                                            -- cera_labrada | cera_estampada | vacio | polen
  notas TEXT

-- Historia de reinas (ya referenciada en ColmenaFicha.tsx:121; exigida por §1.4)
reina_history
  id UUID PK
  colmena_id UUID → colmenas(id) ON DELETE CASCADE
  fecha DATE NOT NULL
  estado TEXT                               -- RV | NV | SR
  caracteristicas JSONB                     -- color, vigor, postura…
  reemplazada_por UUID NULL

-- Tratamientos fitosanitarios (archivo legal ≥5 años)
tratamientos
  id UUID PK
  colmena_id UUID → colmenas(id) ON DELETE CASCADE
  fecha DATE NOT NULL
  producto_comercial TEXT
  principio_activo TEXT NOT NULL            -- para rotación anti-resistencia
  dosis_recomendada TEXT, dosis_aplicada TEXT
  enfermedad TEXT                           -- varroa | nosema | loque | otro
  via TEXT, forma TEXT
  retiro_fin DATE                           -- fin del período de retiro
  contramuestreo_id UUID NULL               -- verificación de remisión

-- Muestras de laboratorio (archivo ≥2 años)
muestras
  id UUID PK
  apiario_id UUID → apiarios(id)
  fecha DATE NOT NULL
  tipo TEXT                                 -- varroa | nosema | otro
  n_abejas INT, cuadros_muestreados INT
  lab_nombre TEXT, lab_fecha DATE
  resultado TEXT                            -- % infestación | presencia/ausencia
  patogeno TEXT                             -- varroa | nosema | DWV | ABPV
  es_contramuestra BOOLEAN DEFAULT false
  confirmado_saneado BOOLEAN                -- habilita levantar cuarentena
  user_id UUID → profiles(id)
```

### 7.3 El núcleo como entidad — DECIDIDO

**Opción elegida: colmena con subtipo (provenance).** Migración `1008_colmena_provenance.sql`: el núcleo comprado
es una `colmenas` con `origen_tipo = 'nucleo'` (+ `origen_fecha`, `origen_colmena_madre` para el linaje de
divisiones/traspasos, `origen_detalle` para criadero/proveedor). El traspaso a cámara de cría conserva el vínculo
de origen en la misma fila; `origen_colmena_madre` encadena el linaje hacia atrás. Expuesto vía
`PATCH /api/bitacora/colmenas/:id/origen` e incluido en el historial `GET /colmenas/:id`.

---

## 8. Reglas de negocio BFF (contratos `bitacora.ts`)

| Regla | Origen |
|---|---|
| No permitir alza puesta mientras un tratamiento con retiro vigente no haya vencido (durante flujo de néctar) | §2.3 |
| Advertir si el principio activo repite la temporada anterior | §2.4 |
| No levantar cuarentena sin contramuestreo con `confirmado_saneado = true` | §2.1 |
| Atribución de fragmentos a colmenas sólo como hipótesis hasta confirmación en curaduría | §3.4 |
| Conservar resultados de laboratorio ≥2 años y tratamientos ≥5 años (archivo, no borrado) | §2.2–2.3 |
| Replay idempotente: `client_request_id` → SELECT pre-insert → 200 con `already_processed` (patrón `rep-ventas.ts:79-104`) | §5.1 |
| Sesión con señal → subir capturas pendientes sin intervención manual | §5.1 |

---

## 9. Hoja de ruta (reutilización primero) — ESTADO 2026-08-03

### Fase 0 — Saneamiento previo ✅ COMPLETADO

- [x] Migración `1007_fix_colmenas_apiarios_columns.sql` — canoniza `apiarios.name/health/details`,
      `colmenas.health/user_id`, `inspecciones.user_id/fase`, `varroa_records.user_id`, `peso_records.user_id`
- [x] Drift documentado y resuelto: `reina_history` stub (1006), `last_inspection` canónico, matching por `name`
- [x] Colisiones de migraciones del flujo paralelo renombradas (test de migraciones 10/10)

### Sprint A — Fundaciones de la bitácora estructurada ✅ COMPLETADO

- [x] Migración `1006_bitacora_apicola.sql` — `sesiones_bitacora`, `voice_inspection_captures` (idempotencia
      `client_request_id UNIQUE`), `inspeccion_cuadros`, `reina_history`, `tratamientos`, `muestras` + RLS
      (owner/is_gerente, estilo 991) + índices
- [x] Migración `1008_colmena_provenance.sql` — §7.3 decidido (sesión paralela)
- [x] BFF `src/api/routes/bitacora.ts` (17 endpoints: sesiones, capturas idempotentes, inspecciones por fase con
      guard de retiro §2.3, tratamientos con aviso de rotación §2.4, muestras/contramuestreo, reinas,
      origen, historial con alerta, procesar, confirmar) + registro en `[[...routes]]`
- [x] `bitacora-types.ts` — aumentación tipada del schema (sin typegen disponible) + `Omit` de `reina_history`
- [x] `CuadernoCampoPanel.tsx` extendido: tratamientos (badge de retiro vigente) + muestras (contramuestra/saneado)
- [x] Tabs Origen/Bitácora/Sanidad en `ColmenaFicha` + fix blockchain — sesión paralela (plan-sess_45afc157)

### Sprint B — Captura por voz y offline-first ✅ COMPLETADO

- [x] Migración `1009_bitacora_audio_bucket.sql` — bucket privado `bitacora-audio` (owner/is_admin, MIME audio)
- [x] `src/lib/offline/db.ts` — Dexie (`NucleoBitacoraDB` v1): `sesiones_locales`, `grabaciones` (Blob),
      `sync_queue` — semántica de Campo (payload opaco, backoff, 200 = replay)
- [x] `src/lib/offline/bitacora-offline.ts` — `crearSesionLocal` (reconciliación `client_local_id`),
      `enqueueCapturaVoz` (uuid idempotente), `cachearSesiones` (downsync)
- [x] `src/hooks/use-bitacora-sync-engine.ts` — upsync en mount/`online`, sesiones primero (reconciliación
      id local → id server reescribiendo capturas pendientes), capturas después (registro → upload bucket →
      PATCH `audio_url`), backoff exponencial cap 30 min
- [x] `RecorderVoz.tsx` — MediaRecorder (m4a/webm), sesiones locales, badge de pendientes, montado en
      `CuadernoCampoPanel` (el cuaderno de campo es donde se dicta)
- [x] BFF: `client_local_id` en POST /sesiones para la reconciliación

### Sprint C — Extracción semántica y curaduría ✅ COMPLETADO

- [x] `src/api/lib/bitacora-parsers.ts` — patrón ReceiptParser de contable: `detectarMarcadores` (voz libre no
      correlativa, números hablados), `segmentarPorColmenas`, parsers de fase/reina/población/cuadros,
      `assessConfidence` con pesos, umbral `PARSE_AUTO_EMIT_THRESHOLD = 0.85` — **15 tests verdes**
- [x] BFF `POST /capturas/:id/procesar` — parseo en backend (nunca en cliente), resolución hablado→`colmena_id`
      por `name`, estado `procesado`/`en_revision`
- [x] `CuraduriaBitacoraPanel.tsx` — curaduría en escritorio (§3.4): hipótesis por fragmento, selector de
      colmena/fase, confirmar → `POST /capturas/:id/confirmar` (materializa inspección + cuadros + reina)
- [x] Alerta de período de retiro (§2.3) en BFF (409 `retiro_vigente` en fase alza) + badge en el cuaderno

### Sprint D — Cuaderno de campo v2: colección + escena + red semántica ✅ COMPLETADO

Workflow de red semántica natural apícola **adaptado 100% al dominio territorial** — el lienzo es un espejo de los registros canónicos y los formularios son específicos (fases, cuadros C/L/E/V/M, retiro, patógeno).

- [x] Migración `1010_cuaderno_crud.sql` — **auditoría RLS completa** (565 políticas): relaja a dueño las
      políticas delete solo-gerente de la migración 40 (`colmenas_delete`, `inspecciones_delete`,
      `varroa_records_delete`, `peso_records_delete`) + `"actores_own_delete"` en `actores_registro`;
      documenta lo que se mantiene y por qué (ledgers inmutables, cosechas/lotes anclados, empresa/sistema).
      Crea la capa manual de la red: `cuaderno_nodos` (observacion/decision/tension/otro, x/y) y
      `cuaderno_aristas` (deriva_de/observa/tension/analogia/otro), RLS dueño o gerente.
- [x] BFF (endpoints en `bitacora.ts`, authz por `requireProfileRole("admin", "apicultor", "territorial")`):
      `GET /hojas` (colección con colmena/apiario, conteos y **brechas**), `GET /hojas/:id` (escena:
      detalle + red local), `GET /red` (red global + brechas por colmena: sin_hoja_14d, sin_varroa_30d,
      retiro_vigente), `PATCH/DELETE /inspecciones/:id` (guard 409 retiro, reemplazo de cuadros),
      CRUD `/varroa`, `PATCH/DELETE /tratamientos/:id` y `/muestras/:id`, `POST/PATCH/DELETE /nodos`,
      `POST/DELETE /aristas`. GETs de tratamientos/muestras enriquecidos con colmena/apiario + hash.
- [x] **Colección** (`/colmenas/cuaderno`, `CuadernoColeccion`): header con descripción funcional,
      toggle Hojas|Red, "Nueva hoja" con **plantillas** (visita, monitoreo varroa, alzas, cosecha,
      traspaso, invernada), filtros fase/colmena/búsqueda, tarjetas de hoja (estilo StudyCard) con
      métricas y chips de brecha, HUD de métricas, captura por voz + curaduría.
- [x] **Escena de hoja** (`/colmenas/cuaderno/[id]`, `EscenaHoja`): header compacto + HUD, rail de campo
      (nueva hoja/varroa/tratamiento/muestra/nodo/conectar), **lienzo semántico Cytoscape** (`LienzoSemantico`,
      layouts radial|cose|grid, nodos por categoría con color token, aristas tipadas, halo de brechas,
      drag persiste nodos manuales), `PanelDetalleNodo` (overlay derecho con **Orígenes y anclaje**:
      registro de origen, fase, linaje, `blockchain_hash` con copiar, autor), dock flotante (Red|Hojas,
      layouts, análisis, conectar, nodo), `AnalisisSheet` (Hoja/Varroa/Tratamientos/Muestras/Trazabilidad).
- [x] "**Lo que no se dice también es información**": brechas como dato de primera clase (chips en
      tarjetas, halos en el lienzo, chip en el HUD, tab Brechas en el sheet).
- [x] `ColmenaBitacoraTab` reutiliza `HojaForm` (misma fuente de verdad para crear/editar hojas).

### Pendiente (fuera de esta iteración)

- [x] Transcripción audio→texto (Groq Whisper neocloud, SOLO server-side) — `POST /api/ai/bitacora/transcribe` (`docs/AI_NUCLEO.md`); path manual sigue disponible
- [ ] `pnpm db:typegen` + `supabase db push` cuando haya proyecto linkeado (aquí no hay token)
- [ ] Aplicar migraciones 1006-1010 a la BD real

---

## 10. Decisiones de diseño y por qué

1. **Reutilizar la semántica de sync de Campo en lugar de un motor nuevo.** `sync_queue` + `useSyncEngine` ya
   resuelven retries, backoff exponencial, replay idempotente y downsync; inventar otro motor sería duplicar la
   clase de bug que Campo ya pagó por resolver.
2. **Atribución en backend, no en el dispositivo.** RLS intacta, modelos pesados fuera de iPhone 7, y la
   corrección es auditable. El dispositivo sólo graba y sincroniza.
3. **Audio como fuente de verdad.** La transcripción automática se equivoca; el audio permite re-transcribir
   con un mejor modelo sin perder el registro original.
4. **El patrón de parseo es el de `packages/contable`, no un LLM ad-hoc.** `detect → parse → confidence → umbral`
   da resultados deterministas, testeables (los parsers de recibos tienen tests) y sin alucinación — coherente con
   "IA cosmética no" del `ESTADO_DEL_ARTE.md`.
5. **El esquema base no se reestructura.** `inspecciones` y `colmenas` se amplían con tablas hijas; el núcleo
   apícola de O&Z y la capa comercial no se contaminan (misma disciplina que el registro territorial).
6. **Comparabilidad entre fases.** El esquema del estado basal del núcleo, del traspaso y de la entrada a
   invernada es el mismo — el anillo temporal cierra y las series se comparan.
7. **Voz como texto etnográfico.** No se obliga al apicultor a renunciar a su manera de narrar el apiario;
   el orden lo pone el sistema después (hipótesis + curaduría), no antes.

---

## 11. Relación con el ecosistema existente

- **Registro territorial** (`docs/NUCLEO_CHILOE.md`): la bitácora alimenta los datos productivos del registro
  (producción declarada por actor y temporada, base para acopio); el registro da identidad a los actores que
  dictan la bitácora.
- **Campo**: su motor offline-first es el patrón a reutilizar (§5.1), no a reinventar.
- **Contable**: su patrón de parsers con confianza es la plantilla del parser de voz (§5.2).
- **Auth**: `@enjambre/auth` — re-exports en `apps/nucleo/src/lib/`, sin clientes ad-hoc.
- **Sanitario**: buckets de certificados (migración `1005`), censo legal (`1004_territorial_censo_legal`).
- **Compatibilidad**: captura por voz en iOS 15.4+ (`MediaRecorder` nativo desde 14.3, codec m4a); el
  procesamiento pesado queda en servidor, nunca en el dispositivo legacy.

---

## 12. Referencias

- Conversación de diseño en TENANTE (julio 2026) — especificación original de la bitácora.
- Protocolo Territorial de Trazabilidad y Prevención, v0.1 (2026-07-30).
- Ordenanza Apícola de la Comuna — propuesta de la Red de Apicultores de Chiloé (julio 2026).
- Carta Constitutiva Apícola Territorial, v0.2 (2026-07-30).
- Estrategia de marca, acopio y trazabilidad para la miel de Chiloé, v0.1.
- Estado del arte global de bitácoras por voz: Apian, HiveSense, BeeKing, BeeKeeper Voice, ApiNote,
  Beeledger, WhisperBee, Hive Pal.
- Normativa de archivo: buenas prácticas apícolas (≥2 años análisis), National Bee Unit RU (≥5 años tratamientos).
- Auditoría de reutilización 2026-08-03 (inventario de activos locales, §5).

---

*Documento de largo horizonte · Obrera y Zángano / Núcleo · Agosto 2026*
*Actualizar cuando cambie el modelo de datos, se decida el modelado del núcleo (§7.3), se resuelva la divergencia
de `colmenas` (§5.6) o avance la hoja de ruta (§9).*
