export type Moneda = "CLP" | "USD" | "EUR";

export const RUT_EXTRANJERO_GENERICO = "55555555-5";

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
  {
    id: "openai",
    nombre: "OPENAI LLC",
    rut: "76350100-1",
    giro: "SERVICIOS DE INTELIGENCIA ARTIFICIAL",
    moneda: "USD",
    conIva: false,
    keywords: ["openai", "chatgpt", "api usage"],
  },
  {
    id: "google-workspace",
    nombre: "GOOGLE LLC",
    rut: "76350110-9",
    giro: "SERVICIOS DE PRODUCTIVIDAD Y COMUNICACION",
    moneda: "USD",
    conIva: false,
    keywords: ["google workspace", "g suite", "google llc"],
  },
  {
    id: "vercel",
    nombre: "VERCEL INC",
    rut: "76350120-7",
    giro: "SERVICIOS DE HOSTING Y DESPLIEGUE",
    moneda: "USD",
    conIva: false,
    keywords: ["vercel", "vercel inc", "vercel billing"],
  },
  {
    id: "notion",
    nombre: "NOTION LABS INC",
    rut: "76350130-5",
    giro: "SERVICIOS DE SOFTWARE DE PRODUCTIVIDAD",
    moneda: "USD",
    conIva: false,
    keywords: ["notion", "notion labs", "notion subscription"],
  },
  {
    id: "canva",
    nombre: "CANVA PTY LTD",
    rut: "76350140-3",
    giro: "SERVICIOS DE DISENO DIGITAL",
    moneda: "USD",
    conIva: false,
    keywords: ["canva", "canva pro", "canva pty"],
  },
  {
    id: "microsoft",
    nombre: "MICROSOFT IRELAND OPERATIONS LTD",
    rut: "76350150-1",
    giro: "SERVICIOS DE SOFTWARE Y NUBE",
    moneda: "USD",
    conIva: false,
    keywords: ["microsoft", "azure", "office 365", "microsoft 365"],
  },
  {
    id: "adobe",
    nombre: "ADOBE SYSTEMS SOFTWARE IRELAND LTD",
    rut: "76350160-9",
    giro: "SERVICIOS DE SOFTWARE CREATIVO",
    moneda: "USD",
    conIva: false,
    keywords: ["adobe", "creative cloud", "acrobat"],
  },
];

export function getProveedorById(id: string): ProveedorConfig | undefined {
  return PROVEEDORES.find((p) => p.id === id);
}

export function detectarProveedor(text: string): ProveedorConfig | undefined {
  const lower = text.toLowerCase();
  return PROVEEDORES.find((p) => p.keywords.some((kw) => new RegExp(`\\b${escapeRegex(kw)}\\b`).test(lower)));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function convertirALCLP(monto: number, moneda: Moneda, tasaCambio: number): number {
  if (moneda === "CLP") return Math.round(monto);
  return Math.round(monto * tasaCambio);
}
