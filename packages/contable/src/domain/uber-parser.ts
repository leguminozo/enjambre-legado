export interface UberReceiptConfig {
  proveedorRut: string;
  proveedorNombre: string;
  proveedorGiro: string;
  conIva: boolean;
}

const DEFAULT_UBER_CL_CONFIG: UberReceiptConfig = {
  proveedorRut: "76059780-K",
  proveedorNombre: "UBER CHILE SPA",
  proveedorGiro: "SERVICIOS DE TRANSPORTE VEHICULAR",
  conIva: false,
};

function parseAmount(raw: string): number {
  const hasDotDecimal = /\.\d{2}$/.test(raw) && /,/.test(raw);
  const hasCommaDecimal = /,\d{2}$/.test(raw) && /\./.test(raw);

  if (hasDotDecimal) {
    const cleaned = raw.replace(/,/g, "");
    return parseFloat(cleaned);
  }

  if (hasCommaDecimal) {
    const cleaned = raw.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  }

  const cleaned = raw.replace(/[.,]/g, "");
  return parseInt(cleaned, 10);
}

export function parseUberReceipt(
  text: string,
  config: UberReceiptConfig = DEFAULT_UBER_CL_CONFIG,
): UberReceiptData | null {
  const totalMatch = text.match(/Total\s*\$?\s*([\d.,]+)/i)
    ?? text.match(/Total\s+CLP\s*([\d.,]+)/i)
    ?? text.match(/Total\s+USD\s*([\d.,]+)/i);
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
    ?? text.match(/(\d{4}-\d{2}-\d{2})/);
  const tripMatch = text.match(/Trip\s+([\d.A-Za-z-]+)/i)
    ?? text.match(/Viaje\s+([\d.A-Za-z-]+)/i);

  if (!totalMatch) return null;

  const montoTotal = parseAmount(totalMatch[1]);

  if (!Number.isFinite(montoTotal) || montoTotal <= 0) return null;

  const fechaEmision = (() => {
    if (dateMatch) {
      const raw = dateMatch[1];
      if (raw.includes("/")) {
        const [d, m, y] = raw.split("/");
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      return raw;
    }
    return new Date().toISOString().slice(0, 10);
  })();

  let montoNeto: number;
  let montoIva: number;
  let montoExento: number;

  if (config.conIva) {
    montoNeto = Math.round(montoTotal / 1.19);
    montoIva = montoTotal - montoNeto;
    montoExento = 0;
  } else {
    montoNeto = 0;
    montoIva = 0;
    montoExento = montoTotal;
  }

  return {
    proveedorRut: config.proveedorRut,
    proveedorNombre: config.proveedorNombre,
    proveedorGiro: config.proveedorGiro,
    montoNeto,
    montoExento,
    montoIva,
    montoTotal,
    fechaEmision,
    tripId: tripMatch ? tripMatch[1] : "",
    concepto: "Servicio de transporte Uber Business",
  };
}

export interface UberReceiptData {
  proveedorRut: string;
  proveedorNombre: string;
  proveedorGiro: string;
  montoNeto: number;
  montoExento: number;
  montoIva: number;
  montoTotal: number;
  fechaEmision: string;
  tripId: string;
  concepto: string;
}

export { DEFAULT_UBER_CL_CONFIG };
