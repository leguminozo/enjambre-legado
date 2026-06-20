import type { ReceiptParser, ProveedorConfig, GastoExtranjeroResult } from "../gasto-extranjero";
import { convertirALCLP } from "../gasto-extranjero";
import { buildMontos, extractDate, parseUsdAmount } from "./parser-utils";

export const vercelParser: ReceiptParser = {
  id: "vercel",

  detect(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes("vercel") &&
      (lower.includes("invoice") || lower.includes("billing") || lower.includes("amount") || lower.includes("hobby") || lower.includes("pro plan"));
  },

  parse(text: string, config: ProveedorConfig, tasaCambio: number): GastoExtranjeroResult | null {
    const totalMatch =
      text.match(/(?:Total|Amount due|Amount)\s*:?\s*(?:USD|US\$|\$)\s*([\d,]+\.?\d*)/i) ??
      text.match(/(?:Total|Amount due|Amount)\s*:?\s*\$([\d,]+\.\d{2})/i);
    if (!totalMatch) return null;

    const montoOriginal = parseUsdAmount(totalMatch[1]);
    if (!Number.isFinite(montoOriginal) || montoOriginal <= 0) return null;

    const montoCLP = convertirALCLP(montoOriginal, "USD", tasaCambio);
    const invoiceMatch = text.match(/(?:Invoice|Receipt)\s*(?:#|ID)\s*:?\s*([\w-]+)/i);
    const montos = buildMontos(montoCLP, config.conIva);

    return {
      proveedorId: config.id,
      proveedorRut: config.rut,
      proveedorNombre: config.nombre,
      proveedorGiro: config.giro,
      montoOriginal,
      monedaOriginal: "USD",
      montoCLP,
      tasaCambio,
      ...montos,
      montoTotal: montoCLP,
      fechaEmision: extractDate(text),
      numeroDocumento: invoiceMatch?.[1] ?? "",
      concepto: "Hosting y despliegue Vercel",
      detalle: "Vercel platform billing",
    };
  },
};