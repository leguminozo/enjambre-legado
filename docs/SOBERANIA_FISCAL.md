# Soberanía Fiscal — Plataforma tributaria y comercio chileno propia

> **Enjambre Legado no integra facturadores de terceros.** Construimos el motor fiscal, el pipeline documental y la operación e-commerce en nuestro monorepo, con nuestra filosofía biocultural y profundidad territorial.
>
> Referencia de mercado (solo competitiva): startups como Wasabil resuelven un subconjunto — Factura de Compra para servicios digitales, emisión gestionada, RCV. **Nuestro objetivo es cubrir ese subconjunto y el ecosistema completo** (venta D2C, POS feria, reps, logística, conciliación, F29, trazabilidad) en una sola fuente de verdad.

**Estado del documento:** Especificación viva — Junio 2026  
**Audiencia:** Producto, ingeniería, contador/a aliado  
**Relacionado:** [`CONSTITUTION.md`](./CONSTITUTION.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md), [`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md)

---

## 1. Manifiesto

### 1.1 Qué rechazamos

- Delegar la **firma, folios o emisión SII** a SaaS externos como capa obligatoria.
- “Pegar” APIs de facturación que nos convierten en revendedores de otro producto.
- UX contable genérica desconectada de **miel, territorio, colmena y tienda**.

### 1.2 Qué construimos

Un **sistema nervioso fiscal soberano** donde:

1. **Todo documento** (invoice Meta, PDF Uber, boleta POS, venta web) entra por el mismo conducto.
2. **Toda lógica tributaria** vive en `@enjambre/contable` (testeable, sin framework).
3. **Toda emisión** pasa por Núcleo BFF + certificado de la empresa (o certificado Enjambre como operador, nunca tercero opaco).
4. **Todo estado** queda en Postgres con RLS — auditable, idempotente, multi-empresa.
5. **Tienda, Campo y Núcleo** comparten ventas, stock, comisiones y obligaciones SII sin duplicar verdad.

### 1.3 Ventaja competitiva (más allá del mercado facturador)

| Dimensión | Facturadores tradicionales | Enjambre Legado |
|-----------|---------------------------|-----------------|
| Origen del gasto/ingreso | Solo documentos subidos | **Venta web + POS + feria + import** unificados |
| Narrativa de producto | Ninguna | **Trazabilidad colmena → lote → QR** |
| Fidelización | Puntos genéricos | **Guardián del bosque** ligado a impacto real |
| Canal Chile | E-commerce desconectado | **Flow + Transbank + ritual suscripción** nativos |
| Territorio | Software commodity | **Marca biocultural** + operación Chiloé |

---

## 2. Principios de ingeniería fiscal

1. **Package-first:** dominio en `packages/contable`, `packages/fiscal` (nuevo), nunca lógica SII en componentes React.
2. **Pipeline explícito:** cada documento tiene `estado` y `idempotency_key` — sin “magia” entre parse y RCV.
3. **Fail closed:** sin CAF, sin certificado o sin folio → no se emite; se encola y se alerta.
4. **Retry con cola:** emisión SII asíncrona con reintentos exponenciales y dead-letter (igual que `notification_queue`).
5. **RCV es lectura oficial:** no “inventamos” el RCV; **emitimos → SII acepta → sincronizamos RCV → reconciliamos**.
6. **Cero `any` en boundaries:** Zod en BFF; parsers con tests Vitest por proveedor.
7. **Soberanía de datos:** PDFs y XML en Storage propio (`sii-documents` bucket), no en silo externo.

---

## 3. Mapa de capacidades objetivo

Leyenda: ✅ existe · 🟡 parcial · ⬜ por construir

### 3.1 Emisión DTE (salida — lo que vendemos)

| Código | Documento | Estado | Ruta / módulo |
|--------|-----------|--------|---------------|
| 33 | Factura electrónica | 🟡 | `sii/dte.ts`, checkout hook pendiente |
| 34 | Factura exenta | 🟡 | `sii/dte.ts` |
| 39 | Boleta electrónica | 🟡 | `emit-boleta-venta.ts` + `fulfillCheckout` (`SII_AUTO_EMIT_BOLETA`) |
| 41 | Boleta exenta | 🟡 | `sii/dte.ts` |
| 52 | Guía de despacho | 🟡 | `sii/dte.ts` + logística |
| 56 | Nota de débito | 🟡 | `sii/dte.ts` |
| 61 | Nota de crédito | 🟡 | `sii/dte.ts` |
| 110 | Boleta honorarios terceros | 🟡 | `sii/honorarios.ts` |

### 3.2 Compras y servicios digitales (entrada — superar facturadores)

| Capacidad | Estado | Hoy en código |
|-----------|--------|---------------|
| Detección proveedor por texto | ✅ | `gasto-extranjero.ts` + 7 parsers |
| Conversión USD/EUR → CLP | ✅ | `tasa-cambio.ts` + `tasas_cambio_historial` |
| Factura de Compra tipo 46 en DB | ✅ | `createFacturaCompraFromGasto` |
| Emisión XML firmado al SII | ✅ | `emit-factura-compra.ts` + `facturas/:id/enviar-sii` |
| **Subida PDF/imagen/email** | ⬜ | — |
| **OCR + extracción estructurada** | ⬜ | — |
| **Pipeline 1-click** parse→emit→poll→RCV | 🟡 | `POST /gastos-extranjero/procesar` + UI; falta bandeja y cola `sii_document_jobs` |
| Proveedores extendidos (OpenAI, Workspace, Vercel…) | ⬜ | extensible vía `ReceiptParser` |
| Ingesta masiva / bandeja | ⬜ | — |
| Conexión billing API (Meta/Google) opcional | ⬜ | fase 3, siempre con export soberano |

### 3.3 RCV, F29 y cierre

| Capacidad | Estado | Hoy en código |
|-----------|--------|---------------|
| Sync RCV compras/ventas desde SII | ✅ | `sii/rcv.ts` |
| Reconciliar folio local ↔ RCV | ✅ | `rcv-sync.ts` → `reconciliarRcv()` |
| F29 borrador / líneas compra | 🟡 | `impuestos.ts`, `f29.ts` |
| Alerta CAF &lt; N folios | ✅ | `caf-guard.ts` + `monitorCafFolios` → `notification_queue` |
| Auto-sync RCV post-emisión aceptada | ✅ | pipeline + cron `/api/cron/fiscal` cada 2 min |

### 3.4 Comercio chileno (potenciadores rentabilidad)

| Capacidad | Estado | App |
|-----------|--------|-----|
| Checkout Flow + Transbank | ✅ | Tienda + Núcleo BFF |
| Stock gate atómico | ✅ | `cart-stock.ts` |
| Comisiones reps + caja + leaderboard | ✅ | Campo + Núcleo |
| Ritual suscripción con pago | ✅ | `subscriptions/checkout` |
| Referidos + loyalty | 🟡 | Perfil + RPC; ver [`COMERCIO_SOBERANO.md`](./COMERCIO_SOBERANO.md) §5 (wiring incompleto) |
| Conciliación banco ↔ documentos | 🟡 | `conciliaciones`, Banco Chile |
| DTE automático post-venta web | 🟡 | en progreso |
| Trazabilidad lote → producto → QR | 🟡 | schema listo, UI parcial |

---

## 4. Arquitectura objetivo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         APPS (experiencia por rol)                          │
├──────────────────┬──────────────────┬───────────────────────────────────────┤
│ Tienda (D2C)     │ Núcleo (fiscal)  │ Campo (POS)                           │
│ checkout, perfil │ /sii bandeja     │ venta → boleta/factura                │
│ impacto guardián │ F29, RCV, caja   │ comisiones en vivo                    │
└────────┬─────────┴────────┬─────────┴───────────────┬───────────────────────┘
         │                  │                         │
         ▼                  ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    packages/fiscal (NUEVO) + contable                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ contable/     IVA, RUT, DTE XML, parsers, F29, RCV types                    │
│ fiscal/       Pipeline, jobs, CAF guard, ingestión documentos (SoT proceso) │
│ pricing/      Precios rol/volumen (ya existe)                                 │
│ auth/         Multi-tenant empresa                                            │
└────────┬────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (verdad + colas)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ fiscal_documents │ gastos_extranjeros │ facturas_* │ sii_caf │ rcv_*        │
│ sii_document_jobs│ notification_queue │ ventas     │ checkout_sessions      │
│ Storage: sii-documents/ (PDF, XML, receipts)                                │
└────────┬────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WORKERS (Vercel Cron / pg_cron futuro)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ processFiscalJobs     emit, poll track_id, sync rcv period                  │
│ monitorCafFolios        alert if folios < threshold                           │
│ processNotificationQueue (ya existe)                                          │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
                    SII Chile (certificación → producción)
```

### 4.1 Nuevo package `@enjambre/fiscal`

Responsabilidades (sin UI):

- `DocumentIngestionService` — PDF/texto/imagen → texto normalizado
- `ReceiptOrchestrator` — delega a parsers `contable`, fallback LLM estructurado (opcional, on-prem friendly)
- `EmissionPipeline` — estados, idempotencia, encolado
- `CafGuard` — validación folios antes de emitir
- `RcvReconciler` — post-aceptación

`@enjambre/contable` permanece **puro** (sin Supabase, sin fetch de red excepto mindicador).

---

## 5. Pipeline soberano: documento → RCV

Flujo canónico que debemos implementar y blindar (reemplaza cualquier UX de facturador externo):

```mermaid
stateDiagram-v2
  [*] --> recibido: upload / paste / venta_hook
  recibido --> extrayendo: OCR o pdf-parse
  extrayendo --> parseado: parser proveedor OK
  parseado --> rechazado: sin match / datos inválidos
  parseado --> facturado: INSERT facturas_compra + gastos_extranjeros
  facturado --> encolado: sii_document_jobs
  encolado --> enviando: worker + CAF guard
  enviando --> enviado_sii: track_id
  enviado_sii --> aceptado_sii: poll SII
  enviado_sii --> rechazado_sii: glosa SII
  aceptado_sii --> rcv_sincronizado: rcv/sync periodo
  rcv_sincronizado --> reconciliado: folio match
  reconciliado --> f29_preparado: líneas F29
  f29_preparado --> [*]
```

### 5.1 Entradas soportadas (fase 1 → 3)

| Fuente | Mecanismo | Prioridad |
|--------|-----------|-----------|
| Pegar texto invoice | `GastoExtranjeroTab` → `POST /procesar` | P0 ✅ cableado (Jun 2026) |
| Subir PDF | `sii-documents` + pdf-parse | P0 |
| Subir imagen (PNG/JPG) | OCR Tesseract o visión local | P1 |
| Email forward `gastos@empresa.enjambrelegado.cl` | Edge ingest → Storage | P2 |
| Webhook venta Tienda/Campo | `fulfillCheckout` → boleta 39 | P0 ✅ (flag `SII_AUTO_EMIT_BOLETA=true`) |
| CSV bulk histórico | Import job | P2 |

### 5.2 Idempotencia

Clave sugerida: `sha256(empresa_id + proveedor_id + numero_documento + fecha_emision + monto_total)`  
Evita duplicar Factura de Compra si el usuario sube el mismo invoice dos veces.

---

## 6. Modelo de datos (extensiones propuestas)

Migración futura `63_fiscal_sovereignty.sql` (borrador):

```sql
-- Cola de emisión SII (paralelo a notification_queue)
CREATE TABLE sii_document_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  source_type text NOT NULL, -- gasto_extranjero | venta | manual
  source_id uuid NOT NULL,
  tipo_dte int NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','dead_letter')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (empresa_id, idempotency_key)
);

-- Documentos fuente (PDF, imágenes)
CREATE TABLE fiscal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  sha256 text NOT NULL,
  extracted_text text,
  proveedor_detectado text,
  gasto_extranjero_id uuid REFERENCES gastos_extranjeros(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Extender gastos_extranjeros
ALTER TABLE gastos_extranjeros
  ADD COLUMN IF NOT EXISTS fiscal_document_id uuid REFERENCES fiscal_documents(id),
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS rcv_registro_id uuid REFERENCES rcv_registros(id);
```

RLS: `has_empresa_access(empresa_id)` en todas. Jobs: solo `service_role` + worker.

---

## 7. API soberana (Núcleo BFF)

Prefijo: `/api/sii` (existente). Endpoints a consolidar:

| Método | Ruta | Acción |
|--------|------|--------|
| `POST` | `/gastos-extranjero/upload` | PDF/imagen → Storage + `fiscal_documents` |
| `POST` | `/gastos-extranjero/procesar` | Pipeline completo (parse → factura → encolar emisión) |
| `POST` | `/gastos-extranjero/procesar/:id/reintentar` | Dead letter recovery |
| `GET` | `/gastos-extranjero/bandeja` | Cola con filtros por estado |
| `POST` | `/facturas/:id/enviar-sii` | Ya existe — llamado por worker |
| `GET` | `/facturas/:id/poll-sii` | Ya existe |
| `POST` | `/rcv/:periodo/sync` | Ya existe — disparado post-aceptación |
| `GET` | `/caf/estado` | Folios restantes por tipo DTE + alertas |
| `POST` | `/ventas/:ventaId/emitir-dte` | Boleta/factura post-checkout |
| `GET` | `/cron/fiscal` | Worker (CRON_SECRET) — procesa `sii_document_jobs` |

**No habrá** `/api/wasabil/*` ni adaptadores a facturadores externos.

---

## 8. Experiencia Núcleo — “Bandeja Fiscal”

Reemplazar tabs dispersos por una **Bandeja Fiscal** unificada en `/sii`:

1. **Entrada** — drag & drop, paste, lista de pendientes
2. **Revisión** — preview montos, proveedor, tasa cambio (humano aprueba o corrige)
3. **Emisión** — progreso en vivo (encolado → SII → aceptado)
4. **RCV** — match automático con registro oficial
5. **Cierre** — vista F29 del período con gaps resaltados

Diseño: misma estética editorial Núcleo (cards, tipografía display, estados con color semántico `success/warning/destructive`).

---

## 9. Sinergia e-commerce Chile

El motor fiscal no vive aislado — es lo que hace rentable el resto:

```
Tienda checkout ──► venta + stock ──► emitir boleta 39 ──► RCV ventas
Campo POS ────────► venta feria ───► boleta/factura ───► comisión rep
Ritual Flow ──────► suscripción ───► factura recurrente (fase 2)
Gasto Meta PDF ───► FC 46 ─────────► crédito IVA ──────► F29 compras
Banco Chile ──────► movimiento ────► conciliación ────► match documento
```

**Meta de margen:** reducir horas contador/a manual de N horas/mes a revisión de excepciones en Bandeja Fiscal.

---

## 10. Roadmap de ejecución

### Ola 1 — Cerrar y blindar (2 semanas)

| ID | Entrega | DoD |
|----|---------|-----|
| S1.1 | Cablear `GastoExtranjeroTab` → `POST /procesar` | ✅ Un click hasta `enviado_sii` (emisión síncrona; poll async vía cron) |
| S1.2 | Worker poll `track_id` → `aceptado_sii` | ✅ `pending-poll-worker` + `/api/cron/fiscal` + tests |
| S1.3 | Post-aceptación: `rcv/sync` automático del período | ✅ `syncRcvPeriod` en pipeline y worker |
| S1.4 | CAF guard + alerta email (`notification_queue`) | ✅ `monitorCafFolios` en cron fiscal; dedupe por lote CAF |
| S1.5 | DTE post-checkout ventas Tienda | ✅ Boleta 39 en `fulfillCheckout` (no bloquea checkout) |
| S1.6 | E2E: compra + FC46 desde texto | ✅ Vitest integración (mock SII) — 101 tests núcleo |

### Ola 2 — Soberanía documental (3 semanas)

| ID | Entrega | DoD |
|----|---------|-----|
| S2.1 | Package `@enjambre/fiscal` + migración 63–64 | ✅ Pipeline en package; RLS jobs fix |
| S2.2 | Upload PDF/imagen + `fiscal_documents` | ✅ Storage RLS; OCR tesseract |
| S2.3 | `POST /procesar` unificado | ✅ `fiscal_document_id` + estados |
| S2.4 | Bandeja Fiscal UI | ✅ Reemplaza textarea-only |
| S2.5 | +5 parsers (OpenAI, Google Workspace, Vercel, Notion, Canva) | ✅ 12 proveedores total |
| S2.6 | F29 líneas desde FC aceptadas | ✅ `impuestos.ts` + `ImpuestosTab` |

### Ola 3 — Escala marca (4–6 semanas)

| ID | Entrega | DoD |
|----|---------|-----|
| S3.1 | Ingesta email + bulk CSV | ✅ `import-csv` + `ingest-email` |
| S3.2 | Conciliación banco auto ≥90% match | 🟡 Métricas API; match auto en progreso |
| S3.3 | API pública documentada (OpenAPI) para partners | 🟡 Esqueleto `/api/sii/openapi/json` |
| S3.4 | Trazabilidad QR → lote → DTE venta | 🟡 `GET /trazabilidad/:codigo` |
| S3.5 | Certificación SII producción checklist | 🟡 Checklist API; go-live pendiente |

---

## 11. Métricas de soberanía

| Métrica | Objetivo 90 días |
|---------|------------------|
| % ventas web con DTE emitido &lt; 5 min | ≥ 95% |
| % invoices digitales extranjeros procesados sin edición manual | ≥ 80% |
| % FC46 aceptadas en primer intento | ≥ 90% |
| Tiempo medio documento → RCV reconciliado | &lt; 24 h |
| Folios CAF agotados sin alerta previa | 0 eventos |
| Dependencia APIs facturación terceros | **0** |

---

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Certificación SII larga | Ambiente certificación + tests automatizados XML |
| Parsers frágiles ante cambio invoice | Tests fixture por proveedor + revisión humana en bandeja |
| OCR impreciso | Siempre mostrar preview antes de emitir; nunca auto-emit sin confianza ≥ umbral |
| Carga serverless | Jobs en Postgres, no en memoria; worker idempotente |
| Complejidad equipo pequeño | Olas secuenciales; package `fiscal` evita spaghetti en routes |

---

## 13. Decisiones relacionadas

Ver entrada en [`DECISIONS.md`](./DECISIONS.md): **Soberanía fiscal — sin facturadores terceros**.

---

## 14. Próximo paso inmediato

1. Aplicar migraciones `63`+`64` en remoto (`pnpm db:push && pnpm db:typegen`).
2. Validar Bandeja Fiscal en staging con `SII_ASYNC_EMIT` (default async).
3. Cerrar certificación SII producción (S3.5) y Playwright E2E bandeja.

---

*“No conectamos con el ecosistema digital chileno. Lo regeneramos desde el bosque.”*

---

# Anexo Técnico: Pipeline Fiscal

> Complemento operativo de [`SOBERANIA_FISCAL.md`](./SOBERANIA_FISCAL.md). Detalle de implementación para ingeniería.

---

## 1. Estados y transiciones

### 1.1 `gastos_extranjeros.estado`

| Estado | Significado | Siguiente acción automática |
|--------|-------------|----------------------------|
| `recibido` | Archivo subido, sin parse | `extrayendo` |
| `parseado` | Montos y proveedor OK | crear `facturas_compra` |
| `facturado` | FC en DB, `estado_sii=pendiente` | encolar job emisión |
| `enviado_sii` | XML enviado, `track_id` | worker poll |
| `aceptado_sii` | SII aceptó | `rcv/sync` período |
| `rcv_ok` | Folio en RCV reconciliado | disponible F29 |
| `rechazado_sii` | Glosa error | bandeja → reintentar/manual |
| `rechazado_parse` | No se pudo interpretar | bandeja → editar manual |

### 1.2 `facturas_compra.estado_sii`

Mantener alineado con gasto: `pendiente` → `enviado` → `aceptado` | `rechazado`.

### 1.3 `sii_document_jobs` (nuevo)

```typescript
type SiiJobPayload = {
  facturaCompraId: string;
  empresaId: string;
  tipoDte: 46 | 33 | 39 /* ... */;
  attempt: number;
};
```

Reintentos: 0→inmediato, 1→30s, 2→2m, 3→10m, 4→1h, 5→dead_letter + alerta.

---

## 2. Secuencia: procesar gasto extranjero

```
Cliente                    Núcleo BFF                 Worker              SII
  |                            |                        |                 |
  | POST /procesar             |                        |                 |
  | (text o fiscal_document_id)|                        |                 |
  |--------------------------->|                        |                 |
  |                            | parseReceipt()         |                 |
  |                            | guardar gastos_extr.   |                 |
  |                            | createFacturaCompra    |                 |
  |                            | INSERT sii_document_job|                 |
  |<---------------------------| 202 { jobId }          |                 |
  |                            |                        |                 |
  |                            |                        | GET /cron/fiscal|
  |                            |                        | enviar-sii int. |
  |                            |                        |---------------->|
  |                            |                        |<----------------|
  |                            |                        | poll-sii        |
  |                            |                        | rcv/sync        |
  |                            |                        | reconciliarRcv  |
```

Implementación inicial de `enviar-sii` **interna**: extraer lógica de `facturas.ts` a `@enjambre/fiscal/emission.ts` invocable desde route y worker (sin HTTP loopback).

---

## 3. Ingestión de archivos

### 3.1 Storage bucket `sii-documents`

```
sii-documents/
  {empresa_id}/
    {yyyy}/{mm}/
      {fiscal_document_id}.pdf
```

RLS Storage: `has_empresa_access` vía policy custom o signed URLs server-side only.

### 3.2 Extracción de texto

| MIME | Estrategia |
|------|------------|
| `text/plain` | directo |
| `application/pdf` | `pdf-parse` (server) |
| `image/*` | fase 1: pedir paste; fase 2: OCR |

### 3.3 Confianza de parse

```typescript
type ParseConfidence = {
  proveedorId: string | null;
  score: number; // 0-1
  campos: Record<string, 'ok' | 'inferido' | 'faltante'>;
};
```

- `score >= 0.85` → puede auto-encolar emisión tras confirmación usuario
- `score < 0.85` → bandeja revisión obligatoria

---

## 4. Parsers — registro extensible

Ubicación actual: `packages/contable/src/domain/receipt-parsers/`

Contrato:

```typescript
interface ReceiptParser {
  id: string;
  detect(text: string): boolean;
  parse(text: string, config: ProveedorConfig, tasaCambio: number): GastoExtranjeroResult | null;
}
```

Añadir proveedores = nuevo archivo + test fixture + entrada en `PROVEEDORES`.

### Fixtures obligatorios por proveedor

```
packages/contable/src/__tests__/fixtures/
  meta-ads-invoice-2026-05.txt
  uber-trip-receipt.txt
  openai-invoice-sample.txt
```

CI falla si parser deja de matchear fixture.

---

## 5. CAF Guard

Antes de `enviarDte`:

```typescript
async function assertCafAvailable(empresaId: string, tipoDte: number, minFolios = 10): Promise<void> {
  const restantes = await getFoliosRestantes(empresaId, tipoDte);
  if (restantes < minFolios) {
    await enqueueCafAlert(empresaId, tipoDte, restantes);
    throw new CafExhaustedError(tipoDte, restantes);
  }
}
```

Cron diario: si `restantes < 50` → email admin.

---

## 6. RCV post-emisión

Tras `facturas_compra.estado_sii = 'aceptado'`:

1. `periodo = YYYYMM(fecha_emision)`
2. `POST /api/sii/rcv/{periodo}/sync?tipo=compras` (idempotente)
3. `reconciliarRcv` ya marca `factura_compra_id` en `rcv_registros`
4. Actualizar `gastos_extranjeros.estado = 'rcv_ok'`

---

## 7. Integración checkout → DTE venta

En `fulfillCheckout` (después de venta persistida):

```typescript
if (process.env.SII_AUTO_EMIT_BOLETA === 'true') {
  await enqueueSiiJob({
    sourceType: 'venta',
    sourceId: ventaId,
    tipoDte: 39,
    idempotencyKey: `venta-${ventaId}`,
  });
}
```

No bloquear checkout si emisión falla — job async + alerta.

---

## 8. Tests mínimos (Definition of Done Ola 1)

| Test | Tipo |
|------|------|
| `parseReceipt` × 7 proveedores | Vitest unit |
| `createFacturaCompraFromGasto` idempotencia | Vitest + DB mock |
| Pipeline estados transición válida | Vitest |
| `enviar-sii` mock SII client | Vitest integration |
| E2E: texto Meta → `/procesar` → aceptado (mock SII) | ✅ Vitest (`gastos-extranjero-fiscal`, `gasto-pipeline`) |
| E2E: checkout → boleta 39 | ✅ Vitest (`checkout-fulfill.fiscal`) |
| `enviar-sii` mock SII client | ✅ Vitest (`emit-factura-compra.integration`) |

---

## 9. Variables de entorno

| Variable | Uso |
|----------|-----|
| `SII_P12_BASE64` / Storage cert | Firma DTE |
| `SII_AUTO_EMIT_BOLETA` | Post-checkout |
| `SII_CAF_MIN_FOLIOS` | Default 10 |
| `SII_CAF_ALERT_THRESHOLD` | Default 50 |
| `CRON_SECRET` | Worker fiscal |
| `FISCAL_OCR_ENABLED` | fase 2 |

---

## 10. Archivos Ola 1 (estado Jun 2026)

| Estado | Path | Rol |
|--------|------|-----|
| ✅ | `apps/nucleo/src/api/lib/fiscal/caf-guard.ts` | Guard folios pre-RPC |
| ✅ | `apps/nucleo/src/api/lib/fiscal/gasto-idempotency.ts` | Clave SHA256 + dedup |
| ✅ | `apps/nucleo/src/api/lib/fiscal/emit-factura-compra.ts` | Emisión DTE 46 |
| ✅ | `apps/nucleo/src/api/lib/fiscal/poll-factura-compra.ts` | Poll con `resolveSiiCredentials` |
| ✅ | `apps/nucleo/src/api/lib/fiscal/rcv-sync.ts` | Sync + reconciliación |
| ✅ | `apps/nucleo/src/api/lib/fiscal/gasto-pipeline.ts` | Orquestador parse→emit→RCV |
| ✅ | `apps/nucleo/src/lib/fiscal/pending-poll-worker.ts` | Cron worker |
| ✅ | `apps/nucleo/app/api/cron/fiscal/route.ts` | Vercel cron `*/2 * * * *` |
| ✅ | `apps/nucleo/src/api/routes/sii/gastos.ts` | `POST /procesar` + rate limit |
| ✅ | `apps/nucleo/src/api/routes/sii/facturas.ts` | Delega a módulos fiscal |
| ✅ | `apps/nucleo/src/api/routes/sii/rcv.ts` | Delega a `syncRcvPeriod` |
| ✅ | `GastoExtranjeroTab.tsx` | Botón “Procesar y enviar al SII” |
| ✅ | `lib/fiscal/caf-alert-worker.ts` | Alerta email CAF bajo (`SII_CAF_ALERT_THRESHOLD`) |
| ✅ | `enqueue-transactional.ts` | `notifyCafLowFolios` (categoría sistema) |
| ✅ | `emit-boleta-venta.ts` | Boleta 39 post-checkout |
| ✅ | `checkout-dte.ts` | `maybeEmitBoletaPostCheckout` |
| ✅ | `poll-factura-emitida.ts` | Poll boletas `enviado` en cron |
| ✅ Ola 2 | `packages/fiscal/` + `63`+`64` migrations | Cola `sii_document_jobs`, upload PDF/imagen, OCR |
| ✅ Ola 2 | `sii-document-jobs.ts` + `BandejaFiscalTab.tsx` | Async emit (`SII_ASYNC_EMIT`), reintentar |
| 🟡 Ola 3 | CSV/email, OpenAPI, trazabilidad, checklist | Base API; prod go-live pendiente |

---

*Referencia cruzada: [`SOBERANIA_FISCAL.md`](./SOBERANIA_FISCAL.md) §5, §10*
