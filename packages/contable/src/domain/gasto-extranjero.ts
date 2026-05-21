export type Moneda = "CLP" | "USD" | "EUR";

export interface ProveedorConfig {
  id: string;
  nombre: string;
  rut: string;
  giro: string;
  moneda: Moneda;
  conIva: boolean;
  keywords: string[];
}

export interface GastoExtranjeroResult {
  proveedorId: string;
  proveedorRut: string;
  proveedorNombre: string;
  proveedorGiro: string;
  montoOriginal: number;
  monedaOriginal: Moneda;
  montoCLP: number;
  tasaCambio: number;
  montoNeto: number;
  montoExento: number;
  montoIva: number;
  montoTotal: number;
  fechaEmision: string;
  numeroDocumento: string;
  concepto: string;
  detalle: string;
}

export interface ReceiptParser {
  id: string;
  detect(text: string): boolean;
  parse(text: string, config: ProveedorConfig, tasaCambio: number): GastoExtranjeroResult | null;
}

export const PROVEEDORES: ProveedorConfig[] = [
  {
    id: "uber",
    nombre: "UBER CHILE SPA",
    rut: "76059780-K",
    giro: "SERVICIOS DE TRANSPORTE VEHICULAR",
    moneda: "CLP",
    conIva: false,
    keywords: ["uber", "trip", "viaje", "uber business"],
  },
  {
    id: "google-ads",
    nombre: "GOOGLE IRELAND LTD",
    rut: "76253030-2",
    giro: "SERVICIOS DE PUBLICIDAD DIGITAL",
    moneda: "USD",
    conIva: false,
    keywords: ["google ads", "google advertising", "adwords", "google cloud"],
  },
  {
    id: "meta-ads",
    nombre: "META PLATFORMS IRELAND LTD",
    rut: "76301919-3",
    giro: "SERVICIOS DE PUBLICIDAD DIGITAL",
    moneda: "USD",
    conIva: false,
    keywords: ["meta ads", "facebook ads", "instagram ads", "meta for business"],
  },
  {
    id: "hostinger",
    nombre: "HOSTINGER INTERNATIONAL LTD",
    rut: "76350040-1",
    giro: "SERVICIOS DE HOSTING Y DOMINIOS",
    moneda: "USD",
    conIva: false,
    keywords: ["hostinger", "hosting plan", "domain renewal", "hostinger international"],
  },
  {
    id: "aws",
    nombre: "AMAZON WEB SERVICES IRELAND LTD",
    rut: "76302727-K",
    giro: "SERVICIOS DE COMPUTACION EN LA NUBE",
    moneda: "USD",
    conIva: false,
    keywords: ["amazon web services", "aws", "aws billing", "amazon cloudfront"],
  },
  {
    id: "shopify",
    nombre: "SHOPIFY INTERNATIONAL LTD",
    rut: "76350060-6",
    giro: "SERVICIOS DE PLATAFORMA E-COMMERCE",
    moneda: "USD",
    conIva: false,
    keywords: ["shopify", "shopify plus", "shopify billing"],
  },
  {
    id: "stripe",
    nombre: "STRIPE PAYMENTS UK LTD",
    rut: "76350080-4",
    giro: "SERVICIOS DE PROCESAMIENTO DE PAGOS",
    moneda: "USD",
    conIva: false,
    keywords: ["stripe", "stripe payments", "stripe fee"],
  },
];

export function getProveedorById(id: string): ProveedorConfig | undefined {
  return PROVEEDORES.find((p) => p.id === id);
}

export function detectarProveedor(text: string): ProveedorConfig | undefined {
  const lower = text.toLowerCase();
  return PROVEEDORES.find((p) => p.keywords.some((kw) => lower.includes(kw)));
}

export function convertirALCLP(monto: number, moneda: Moneda, tasaCambio: number): number {
  if (moneda === "CLP") return Math.round(monto);
  return Math.round(monto * tasaCambio);
}
