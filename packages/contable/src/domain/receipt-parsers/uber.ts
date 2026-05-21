import type { ReceiptParser, ProveedorConfig, GastoExtranjeroResult } from "../gasto-extranjero";
import { convertirALCLP } from "../gasto-extranjero";

function parseAmount(raw: string): number {
  const hasDotDecimal = /\.\d{2}$/.test(raw) && /,/.test(raw);
  const hasCommaDecimal = /,\d{2}$/.test(raw) && /\./.test(raw);

  if (hasDotDecimal) {
    return parseFloat(raw.replace(/,/g, ""));
  }
  if (hasCommaDecimal) {
    return parseFloat(raw.replace(/\./g, "").replace(",", "."));
  }
  return parseInt(raw.replace(/[.,]/g, ""), 10);
}

function extractDate(text: string): string {
  const slashMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (slashMatch) {
    const [d, m, y] = slashMatch[1].split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  return new Date().toISOString().slice(0, 10);
}

export const uberParser: ReceiptParser = {
  id: "uber",

  detect(text: string): boolean {
    const lower = text.toLowerCase();
    return lower.includes("uber") && (lower.includes("trip") || lower.includes("viaje") || lower.includes("total"));
  },

  parse(text: string, config: ProveedorConfig, tasaCambio: number): GastoExtranjeroResult | null {
    const totalMatch = text.match(/Total\s*\$?\s*([\d.,]+)/i)
      ?? text.match(/Total\s+CLP\s*([\d.,]+)/i)
      ?? text.match(/Total\s+USD\s*([\d.,]+)/i);
    if (!totalMatch) return null;

    const montoOriginal = parseAmount(totalMatch[1]);
    if (!Number.isFinite(montoOriginal) || montoOriginal <= 0) return null;

    const isUsd = /Total\s+USD/i.test(text) || config.moneda === "USD";
    const moneda = isUsd ? "USD" as const : "CLP" as const;
    const montoCLP = convertirALCLP(montoOriginal, moneda, tasaCambio);

    const tripMatch = text.match(/Trip\s+([\d.A-Za-z-]+)/i) ?? text.match(/Viaje\s+([\d.A-Za-z-]+)/i);

    const montoNeto = config.conIva ? Math.round(montoCLP / 1.19) : 0;
    const montoIva = config.conIva ? montoCLP - montoNeto : 0;
    const montoExento = config.conIva ? 0 : montoCLP;

    return {
      proveedorId: config.id,
      proveedorRut: config.rut,
      proveedorNombre: config.nombre,
      proveedorGiro: config.giro,
      montoOriginal,
      monedaOriginal: moneda,
      montoCLP,
      tasaCambio: moneda === "USD" ? tasaCambio : 1,
      montoNeto,
      montoExento,
      montoIva,
      montoTotal: montoCLP,
      fechaEmision: extractDate(text),
      numeroDocumento: tripMatch ? tripMatch[1] : "",
      concepto: "Servicio de transporte Uber Business",
      detalle: `Viaje Uber${tripMatch ? ` ${tripMatch[1]}` : ""}`,
    };
  },
};
