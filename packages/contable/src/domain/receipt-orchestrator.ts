import type { GastoExtranjeroResult, ProveedorConfig } from './gasto-extranjero';
import { detectarProveedor, PROVEEDORES } from './gasto-extranjero';
import { assessParseConfidence, type ParseConfidence } from './parse-confidence';
import { detectarProveedorEnCatalog, findProveedorInCatalog } from './proveedores-catalog';
import { ALL_PARSERS, getParserById } from './receipt-parsers';
import { genericParser, genericParseHints } from './receipt-parsers/generic';

export type ParsedReceipt = {
  gasto: GastoExtranjeroResult;
  confidence: ParseConfidence;
};

export type ParseReceiptOptions = {
  proveedorOverride?: ProveedorConfig;
  catalog?: ProveedorConfig[];
  tasaCambio?: number;
};

function hasExplicitDate(text: string): boolean {
  return (
    /\d{4}-\d{2}-\d{2}/.test(text) ||
    /\d{1,2}\/\d{1,2}\/\d{4}/.test(text) ||
    /\w{3,9}\s+\d{1,2},?\s+\d{4}/i.test(text)
  );
}

function trySpecificParser(
  text: string,
  proveedor: ProveedorConfig,
  tasaCambio: number,
): { gasto: GastoExtranjeroResult; parserId: string } | null {
  const parser = getParserById(proveedor.id);
  if (!parser || !parser.detect(text)) return null;

  const gasto = parser.parse(text, proveedor, tasaCambio);
  if (!gasto) return null;

  return { gasto, parserId: parser.id };
}

function tryGenericParser(
  text: string,
  proveedor: ProveedorConfig,
  tasaCambio: number,
): { gasto: GastoExtranjeroResult; parserId: string; hints: ReturnType<typeof genericParseHints> } | null {
  const gasto = genericParser.parse(text, proveedor, tasaCambio);
  if (!gasto) return null;

  const totalMatch = text.match(/(?:USD|US\$|EUR|CLP)/i);
  const monedaDetectada = totalMatch?.[0]?.toUpperCase().includes('EUR')
    ? 'EUR'
    : totalMatch?.[0]?.toUpperCase().includes('CLP')
      ? 'CLP'
      : 'USD';

  return {
    gasto,
    parserId: 'generic',
    hints: genericParseHints(text, gasto.fechaEmision, monedaDetectada, proveedor.moneda),
  };
}

export function parseReceiptOrchestrated(
  text: string,
  options: ParseReceiptOptions = {},
): ParsedReceipt | null {
  const catalog = options.catalog ?? PROVEEDORES;
  const tasaCambio = options.tasaCambio ?? 1;

  const proveedor =
    options.proveedorOverride ??
    detectarProveedorEnCatalog(catalog, text) ??
    detectarProveedor(text);

  if (!proveedor) return null;

  const specific = trySpecificParser(text, proveedor, tasaCambio);
  if (specific) {
    return {
      gasto: specific.gasto,
      confidence: assessParseConfidence(specific.gasto, specific.parserId, {
        fechaInferida: !hasExplicitDate(text),
      }),
    };
  }

  const generic = tryGenericParser(text, proveedor, tasaCambio);
  if (generic) {
    return {
      gasto: generic.gasto,
      confidence: assessParseConfidence(generic.gasto, generic.parserId, generic.hints),
    };
  }

  return null;
}

export function listRegisteredParsers(): string[] {
  return [...ALL_PARSERS.map((p) => p.id), genericParser.id];
}

export function resolveProveedorForParse(
  text: string,
  catalog: ProveedorConfig[],
  proveedorId?: string,
): ProveedorConfig | undefined {
  if (proveedorId) return findProveedorInCatalog(catalog, proveedorId);
  return detectarProveedorEnCatalog(catalog, text);
}