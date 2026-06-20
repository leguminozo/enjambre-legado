import { Hono } from "hono";

export const openapiRoutes = new Hono();

const SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Enjambre Legado — API Fiscal Soberana",
    version: "1.0.0",
    description:
      "API propia de facturación electrónica, bandeja fiscal y RCV. Sin integradores de terceros.",
  },
  servers: [{ url: "/api/sii", description: "Núcleo BFF fiscal" }],
  paths: {
    "/gastos-extranjero/upload": {
      post: {
        summary: "Subir PDF/imagen a fiscal_documents",
        tags: ["Bandeja Fiscal"],
      },
    },
    "/gastos-extranjero/procesar": {
      post: {
        summary: "Pipeline parse → FC46 → SII → RCV",
        tags: ["Bandeja Fiscal"],
      },
    },
    "/gastos-extranjero/bandeja": {
      get: { summary: "Cola de gastos por estado", tags: ["Bandeja Fiscal"] },
    },
    "/gastos-extranjero/import-csv": {
      post: { summary: "Importación masiva de recibos", tags: ["Bandeja Fiscal"] },
    },
    "/facturas-compra/{id}/enviar-sii": {
      post: { summary: "Emitir factura de compra al SII", tags: ["Emisión"] },
    },
    "/rcv/{periodo}/sync": {
      post: { summary: "Sincronizar RCV del período", tags: ["RCV"] },
    },
    "/f29/{anio}/{mes}": {
      get: { summary: "Borrador F29 con FC46 aceptadas", tags: ["Impuestos"] },
    },
    "/certificacion/checklist": {
      get: { summary: "Checklist go-live certificación SII", tags: ["Certificación"] },
    },
    "/trazabilidad/{codigo}": {
      get: { summary: "QR → lote → venta → DTE", tags: ["Trazabilidad"] },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      empresaHeader: { type: "apiKey", in: "header", name: "x-empresa-id" },
    },
  },
  security: [{ bearerAuth: [] }, { empresaHeader: [] }],
} as const;

openapiRoutes.get("/", (c) => c.json(SPEC));
openapiRoutes.get("/json", (c) => c.json(SPEC));