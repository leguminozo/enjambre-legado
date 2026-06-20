import type { ReceiptParser, ProveedorConfig, GastoExtranjeroResult } from "../gasto-extranjero";
import { convertirALCLP } from "../gasto-extranjero";
import { buildMontos, extractDate, parseUsdAmount } from "./parser-utils";

export const openaiParser: ReceiptParser = {
  id: "openai",

  detect(text: string): boolean {
    const lower = text.toLowerCase();
    return (
      lower.includes("openai") ||
      lower.includes("chatgpt") ||
      lower.includes("api usage")
    ) && (lower.includes("invoice") || lower.includes("billing") || lower.includes("amount due") || lower.includes("total"));
  },

  parse(text: string, config: ProveedorConfig, tasaCambio: number): GastoExtranjeroResult | null {
    const totalMatch =
      text.match(/(?:Amount due|Total|Total due)\s*:?\s*(?:USD|US\$|\$)\s*([\d,]+\.?\d*)/i) ??
      text.match(/(?:Amount due|Total|Total due)\s*:?\s*([\d,]+\.\d{2})/i);
    if (!totalMatch) return null;

    const montoOriginal = parseUsdAmount(totalMatch[1]);
    if (!Number.isFinite(montoOriginal) || montoOriginal <= 0) return null;

    const montoCLP = convertirALCLP(montoOriginal, "USD", tasaCambio);
    const invoiceMatch = text.match(/(?:Invoice|Receipt)\s*(?:#|number|no\.?)\s*:?\s*([\w-]+)/i);
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
      concepto: "Servicios de inteligencia artificial OpenAI / ChatGPT API",
      detalle: "OpenAI API usage",
    };
  },
};