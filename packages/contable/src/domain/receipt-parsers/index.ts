import type { ReceiptParser, GastoExtranjeroResult, ProveedorConfig } from "../gasto-extranjero";
import { detectarProveedor, PROVEEDORES } from "../gasto-extranjero";
import { uberParser } from "./uber";
import { googleAdsParser } from "./google-ads";
import { metaAdsParser } from "./meta-ads";
import { hostingerParser } from "./hostinger";
import { awsParser } from "./aws";
import { shopifyParser } from "./shopify";
import { stripeParser } from "./stripe";

export const ALL_PARSERS: ReceiptParser[] = [
  uberParser,
  googleAdsParser,
  metaAdsParser,
  hostingerParser,
  awsParser,
  shopifyParser,
  stripeParser,
];

const PARSER_BY_ID = new Map(ALL_PARSERS.map((p) => [p.id, p]));

export function getParserById(id: string): ReceiptParser | undefined {
  return PARSER_BY_ID.get(id);
}

export function parseReceipt(
  text: string,
  proveedorOverride?: ProveedorConfig,
  tasaCambio: number = 1,
): GastoExtranjeroResult | null {
  const proveedor = proveedorOverride ?? detectarProveedor(text);
  if (!proveedor) return null;

  const parser = getParserById(proveedor.id);
  if (!parser) return null;

  if (!parser.detect(text)) return null;

  return parser.parse(text, proveedor, tasaCambio);
}

export { PROVEEDORES, detectarProveedor } from "../gasto-extranjero";
export { uberParser } from "./uber";
export { googleAdsParser } from "./google-ads";
export { metaAdsParser } from "./meta-ads";
export { hostingerParser } from "./hostinger";
export { awsParser } from "./aws";
export { shopifyParser } from "./shopify";
export { stripeParser } from "./stripe";
