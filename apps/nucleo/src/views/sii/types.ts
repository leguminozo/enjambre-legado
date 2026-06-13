import React from "react";
import { Clock, Send, CheckCircle2, AlertCircle, Car, Globe } from "lucide-react";

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
  };
  const icon = icons[sourceType];
  const label = labels[sourceType] ?? sourceType;
  return icon ? React.createElement("span", { className: "inline-flex items-center gap-1" }, icon, " ", label) : label;
}
