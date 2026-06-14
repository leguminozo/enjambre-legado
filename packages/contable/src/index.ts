export * from "./domain/impuestos";
export * from "./domain/rut";
export * from "./domain/sii-dte";
export * from "./domain/dte-xml";

// Explicit re-exports for SII DTE formatting helpers (used by nucleo BFF emission path).
// This ensures named members like formatDateSii are always visible to consumers
// (addresses resolution differences in turbopack/next type checking vs direct src).
export {
  escapeXml,
  formatRutSii,
  formatDateSii,
  buildDteXml,
  buildEnvioDteXml,
} from "./domain/dte-xml";
export * from "./domain/gasto-extranjero";
export * from "./domain/tasa-cambio";
export * from "./domain/receipt-parsers";
export * from "./domain/uber-parser";
export * from "./domain/ppm";
export * from "./domain/f29";
export * from "./domain/remanente-iva";
export * from "./domain/rcv";
export * from "./domain/f22";
export * from "./schemas/factura";
export * from "./schemas/factura-compra";
export * from "./contracts/api";
