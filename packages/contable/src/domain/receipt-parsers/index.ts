import type { ReceiptParser, GastoExtranjeroResult, ProveedorConfig } from "../gasto-extranjero";
import { detectarProveedor } from "../gasto-extranjero";
import { parseReceiptOrchestrated } from "../receipt-orchestrator";
import { uberParser } from "./uber";
import { googleAdsParser } from "./google-ads";
import { metaAdsParser } from "./meta-ads";
import { hostingerParser } from "./hostinger";
import { awsParser } from "./aws";
import { shopifyParser } from "./shopify";
import { stripeParser } from "./stripe";
import { openaiParser } from "./openai";
import { googleWorkspaceParser } from "./google-workspace";
import { vercelParser } from "./vercel";
import { notionParser } from "./notion";
import { canvaParser } from "./canva";
import { microsoftParser } from "./microsoft";
import { adobeParser } from "./adobe";

export const ALL_PARSERS: ReceiptParser[] = [
  uberParser,
  googleAdsParser,
  metaAdsParser,
  hostingerParser,
  awsParser,
  shopifyParser,
  stripeParser,
  openaiParser,
  googleWorkspaceParser,
  vercelParser,
  notionParser,
  canvaParser,
  microsoftParser,
  adobeParser,
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
  const parsed = parseReceiptOrchestrated(text, {
    proveedorOverride,
    tasaCambio,
  });
  return parsed?.gasto ?? null;
}

export { parseReceiptOrchestrated } from "../receipt-orchestrator";
export type { ParsedReceipt, ParseReceiptOptions } from "../receipt-orchestrator";

export { PROVEEDORES, detectarProveedor } from "../gasto-extranjero";
export { uberParser } from "./uber";
export { googleAdsParser } from "./google-ads";
export { metaAdsParser } from "./meta-ads";
export { hostingerParser } from "./hostinger";
export { awsParser } from "./aws";
export { shopifyParser } from "./shopify";
export { stripeParser } from "./stripe";
export { openaiParser } from "./openai";
export { googleWorkspaceParser } from "./google-workspace";
export { vercelParser } from "./vercel";
export { notionParser } from "./notion";
export { canvaParser } from "./canva";
export { genericParser } from "./generic";
export { microsoftParser } from "./microsoft";
export { adobeParser } from "./adobe";
