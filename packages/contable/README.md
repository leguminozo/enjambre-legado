# @enjambre/contable

Logica tributaria chilena pura, sin dependencias de framework. Solo `zod`.

## Instalacion

```bash
pnpm add @enjambre/contable
```

## Modulos

### Impuestos (`impuestos.ts`)

- `IVA` = 0.19
- `calcularIVA(neto)` — 4 decimales
- `calcularNetoDesdeTotal(total)`
- `calcularTotal(neto)`

### RUT (`rut.ts`)

- `normalizarRUT(rut)` — limpia formato
- `validarRUT(rut)` — digito verificador
- `formatearRUT(rut)` — formato legible

### SII DTE (`sii-dte.ts`)

- `DTE_TIPO` — constantes: FACTURA_ELECTRONICA(33), FACTURA_NO_AFECTA(34), BOLETA_ELECTRONICA(39), BOLETA_NO_AFECTA(41), FACTURA_COMPRA(46), NOTA_CREDITO(61), NOTA_DEBITO(56), GUIA_DESPACHO(52)
- `SII_ENV` — URLs certificacion/produccion
- Interfaces: `DteEmisor`, `DteReceptor`, `DteDetalle`, `DteEncabezado`, `DteDocumento`, `DteReferencia`, `CafFolio`, `SiiAuthToken`, `SiiEnvioResult`, `SiiEstadoResult`

### DTE XML (`dte-xml.ts`)

- `DTE_NOMBRES` — Record tipo→nombre
- `buildDteXml(doc)` — genera XML de DTE individual
- `buildEnvioDteXml(dteXmlList, rutEmisor, nroResol, fchResol)` — genera XML de envio SII

### Gasto Extranjero (`gasto-extranjero.ts`)

- `PROVEEDORES` — 7 configuraciones: uber, google-ads, meta-ads, hostinger, aws, shopify, stripe
- `detectarProveedor(texto)` — identifica proveedor por keywords (word-boundary regex)
- `convertirALCLP(monto, moneda, tasa)` — conversion a CLP
- `getProveedorById(id)`
- Tipos: `Moneda`, `ProveedorConfig`, `GastoExtranjeroResult`, `ReceiptParser`

### Receipt Parsers (`receipt-parsers/`)

7 parsers especializados:

| Parser | Proveedor | Datos extraidos |
|---|---|---|
| `uberParser` | Uber | Monto, fecha, tipo viaje |
| `stripeParser` | Stripe | Monto, fee, moneda |
| `shopifyParser` | Shopify | Monto, plan, ciclo |
| `metaAdsParser` | Meta Ads | Spend, campaign, fecha |
| `googleAdsParser` | Google Ads | Spend, campaign ID |
| `hostingerParser` | Hostinger | Monto, plan, dominio |
| `awsParser` | AWS | Monto, servicio, region |

- `ALL_PARSERS` — array de los 7 parsers
- `getParserById(id)` — lookup por proveedor
- `parseReceipt(id, text)` — parse generico

### Tasa de Cambio (`tasa-cambio.ts`)

- `fetchTasaCambio(moneda?, fecha?)` — API mindicador.cl con cache 4h
- `fetchTasaDolar(fecha?)`
- `fetchTasaEuro(fecha?)`

### Uber Parser (`uber-parser.ts`)

- `DEFAULT_UBER_CL_CONFIG` — configuracion Chile
- `parseUberReceipt(text, config?)`

## Schemas (Zod)

| Schema | Uso |
|---|---|
| `FacturaEmitidaInputSchema` / `FacturaEmitidaOutputSchema` | Validacion de facturas emitidas |
| `FacturaCompraInputSchema` / `FacturaCompraOutputSchema` | Validacion de facturas compra (tipo_dte=46, RUT refine) |

## Contracts

- `ApiSuccess<T>` — respuesta exitosa generica
- `ApiError` — respuesta de error generica

## Testing

```bash
pnpm test        # 79 tests en 8 archivos
pnpm test:watch  # Watch mode
```

Cobertura: RUT, IVA, DTE XML, gasto-extranjero, uber parser, tasa-cambio, schemas, receipt parser registry.
