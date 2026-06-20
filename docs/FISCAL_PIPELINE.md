# Especificación técnica — Pipeline fiscal soberano

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

Cron diario: si `restantes < 50` → email gerente.

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