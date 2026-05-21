import type { ReceiptParser, ProveedorConfig, GastoExtranjeroResult } from "../gasto-extranjero";
import { convertirALCLP } from "../gasto-extranjero";

function parseUsdAmount(raw: string): number {
  const cleaned = raw.replace(/[,$]/g, "");
  return parseFloat(cleaned);
}

function extractDate(text: string): string {
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const monthMatch = text.match(/(\w{3,9})\s+(\d{1,2}),?\s+(\d{4})/);
  if (monthMatch) {
    const months: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
      jan: "01", feb: "02", mar: "03", apr: "04",
      jun: "06", jul: "07", aug: "08", sep: "09",
      oct: "10", nov: "11", dec: "12",
    };
    const m = months[monthMatch[1].toLowerCase()];
    if (m) return `${monthMatch[3]}-${m}-${monthMatch[2].padStart(2, "0")}`;
  }

  const slashMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (slashMatch) {
    const [m, d, y] = slashMatch[1].split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return new Date().toISOString().slice(0, 10);
}

export const googleAdsParser: ReceiptParser = {
  id: "google-ads",

  detect(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes("google ads") || lower.includes("google advertising") || lower.includes("adwords") || (lower.includes("google") && (lower.includes("billing") || lower.includes("invoice") || lower.includes("payment")));
  },

  parse(text: string, config: ProveedorConfig, tasaCambio: number): GastoExtranjeroResult | null {
    const totalMatch = text.match(/(?:Total|Amount|Amount due|Total due)\s*:?\s*(?:USD|US\$|\$)\s*([\d,]+\.?\d*)/i)
      ?? text.match(/(?:Total|Amount|Amount due|Total due)\s*:?\s*([\d,]+\.\d{2})/i)
      ?? text.match(/\$\s*([\d,]+\.\d{2})/);
    if (!totalMatch) return null;

    const montoOriginal = parseUsdAmount(totalMatch[1]);
    if (!Number.isFinite(montoOriginal) || montoOriginal <= 0) return null;

    const montoCLP = convertirALCLP(montoOriginal, "USD", tasaCambio);

    const invoiceMatch = text.match(/(?:Invoice|Order|Account)\s*(?:#|number|no\.?)\s*:?\s*([\w-]+)/i)
      ?? text.match(/(\d{3}-\d{3}-\d{4})/);

    const accountIdMatch = text.match(/(?:Customer|Account)\s*ID\s*:?\s*(\d+-\d+-\d+)/i);

    const montoNeto = config.conIva ? Math.round(montoCLP / 1.19) : 0;
    const montoIva = config.conIva ? montoCLP - montoNeto : 0;
    const montoExento = config.conIva ? 0 : montoCLP;

    return {
      proveedorId: config.id,
      proveedorRut: config.rut,
      proveedorNombre: config.nombre,
      proveedorGiro: config.giro,
      montoOriginal,
      monedaOriginal: "USD",
      montoCLP,
      tasaCambio,
      montoNeto,
      montoExento,
      montoIva,
      montoTotal: montoCLP,
      fechaEmision: extractDate(text),
      numeroDocumento: invoiceMatch?.[1] ?? accountIdMatch?.[1] ?? "",
      concepto: "Servicio de publicidad digital Google Ads",
      detalle: `Google Ads${accountIdMatch ? ` - Cuenta ${accountIdMatch[1]}` : ""}`,
    };
  },
};
