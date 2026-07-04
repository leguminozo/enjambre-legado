import React from "react";
import { Clock, Send, CheckCircle2, AlertCircle, Car, Globe, FileText } from "lucide-react";

export type FacturaCompraRow = {
  id: string;
  folio: number;
  fecha_emision: string;
  receptor_rut: string;
  receptor_razon_social: string;
  monto_neto: number;
  monto_iva: number;
  monto_total: number;
  estado_sii: "pendiente" | "enviado" | "aceptado" | "rechazado";
  descripcion: string | null;
  source_type: string | null;
  track_id: string | null;
};

export type SiiDashboard = {
  totalComprasNeto: number;
  totalComprasIva: number;
  totalCompras: number;
  totalFacturasCompra: number;
  pendientesEnvio: number;
};

export type GastoParseado = {
  proveedorId: string;
  proveedorRut: string;
  proveedorNombre: string;
  proveedorGiro: string;
  montoOriginal: number;
  monedaOriginal: string;
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
};

export type ParseConfidenceView = {
  score: number;
  parserId: string;
  requiresReview: boolean;
  campos: Record<string, "ok" | "inferido" | "faltante">;
};

export type GastoExtranjeroEstado =
  | "parseado"
  | "pendiente_revision"
  | "facturado"
  | "enviado_sii"
  | "aceptado_sii"
  | "rechazado_sii"
  | "rechazado_parse";

export type BandejaGastoRow = {
  id: string;
  proveedor_id: string;
  proveedor_nombre: string;
  proveedor_rut: string;
  monto_total: number;
  monto_clp: number;
  moneda_original: string;
  fecha_emision: string;
  numero_documento: string | null;
  concepto: string;
  estado: GastoExtranjeroEstado;
  factura_compra_id: string | null;
  fiscal_document_id: string | null;
  parser_id: string | null;
  parse_confidence: number | null;
  requires_review: boolean;
  created_at: string;
  fiscal_documents: {
    id: string;
    storage_path: string;
    mime_type: string;
    sha256: string;
    proveedor_detectado: string | null;
  } | null;
};

export type FiscalUploadResult = {
  id: string;
  sha256: string;
  mime_type: string;
  storage_path: string;
  proveedor_detectado: string | null;
  extracted_text: string | null;
  already_exists: boolean;
};

export type ProveedorInfo = {
  id: string;
  nombre: string;
  rut: string;
  giro: string;
  moneda: string;
  conIva: boolean;
  keywords: string[];
};

export type HonorarioRow = {
  id: string;
  fecha: string;
  monto_bruto: number;
  monto_retencion: number;
  tasa_retencion: number;
  descripcion: string;
  numero_bhe: string | null;
  estado: string;
  incentivo_ledger_id: string | null;
  tercero: { id: string; nombre: string; rut: string } | null;
};

export type RcvSyncRow = {
  id: string;
  periodo: string;
  tipo_registro: string;
  total_documentos: number;
  total_neto: number;
  total_iva: number;
  total_total: number;
  ultimo_sync: string;
  estado: string;
};

export type RcvRegistroRow = {
  id: string;
  tipo_dte: number;
  folio: number;
  fecha_emision: string;
  rut_contraparte: string;
  razon_social_contraparte: string;
  monto_neto: number;
  monto_exento: number;
  monto_iva: number;
  monto_total: number;
  estado_rcv: string;
  reconciliado: boolean;
};

export function gastoEstadoBadge(estado: GastoExtranjeroEstado | string) {
  const map: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
    parseado: { icon: React.createElement(Clock, { size: 14 }), className: "bg-surface-raised text-muted-foreground border-border", label: "Parseado" },
    pendiente_revision: { icon: React.createElement(AlertCircle, { size: 14 }), className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", label: "Revisión" },
    rechazado_parse: { icon: React.createElement(AlertCircle, { size: 14 }), className: "bg-destructive/10 text-destructive border-destructive/20", label: "Parse fallido" },
    facturado: { icon: React.createElement(FileText, { size: 14 }), className: "bg-primary/10 text-primary border-primary/20", label: "Facturado" },
    enviado_sii: { icon: React.createElement(Send, { size: 14 }), className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", label: "Enviado SII" },
    aceptado_sii: { icon: React.createElement(CheckCircle2, { size: 14 }), className: "bg-primary/10 text-primary border-primary/20", label: "Aceptado SII" },
    rechazado_sii: { icon: React.createElement(AlertCircle, { size: 14 }), className: "bg-destructive/10 text-destructive border-destructive/20", label: "Rechazado SII" },
  };
  const cfg = map[estado] ?? map.parseado;
  return React.createElement(
    "span",
    { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cfg.className}` },
    cfg.icon,
    " ",
    cfg.label,
  );
}

export function estadoBadge(estado: string) {
  const map: Record<string, { icon: React.ReactNode; className: string }> = {
    pendiente: { icon: React.createElement(Clock, { size: 14 }), className: "bg-primary/10 text-primary border-primary/20" },
    enviado: { icon: React.createElement(Send, { size: 14 }), className: "bg-surface-raised text-foreground border-border" },
    aceptado: { icon: React.createElement(CheckCircle2, { size: 14 }), className: "bg-primary/10 text-primary border-primary/20" },
    rechazado: { icon: React.createElement(AlertCircle, { size: 14 }), className: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const cfg = map[estado] ?? map.pendiente;
  return React.createElement(
    "span",
    { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cfg.className}` },
    cfg.icon,
    " ",
    estado
  );
}

export function sourceBadge(sourceType: string | null) {
  if (!sourceType) return "Manual";
  const icons: Record<string, React.ReactNode> = {
    uber: React.createElement(Car, { size: 14, className: "text-accent" }),
    "google-ads": React.createElement(Globe, { size: 14, className: "text-foreground" }),
    "meta-ads": React.createElement(Globe, { size: 14, className: "text-foreground" }),
    hostinger: React.createElement(Globe, { size: 14, className: "text-foreground" }),
    aws: React.createElement(Globe, { size: 14, className: "text-destructive" }),
    shopify: React.createElement(Globe, { size: 14, className: "text-primary" }),
    stripe: React.createElement(Globe, { size: 14, className: "text-foreground" }),
  };
  const labels: Record<string, string> = {
    uber: "Uber",
    "google-ads": "Google Ads",
    "meta-ads": "Meta Ads",
    hostinger: "Hostinger",
    aws: "AWS",
    shopify: "Shopify",
    stripe: "Stripe",
    openai: "OpenAI",
    "google-workspace": "Workspace",
    vercel: "Vercel",
    notion: "Notion",
    canva: "Canva",
    microsoft: "Microsoft",
    adobe: "Adobe",
    generic: "Genérico",
  };
  const icon = icons[sourceType];
  const label = labels[sourceType] ?? sourceType;
  return icon ? React.createElement("span", { className: "inline-flex items-center gap-1" }, icon, " ", label) : label;
}
