export interface RcvRegistroCompra {
  tipoDte: number;
  folio: number;
  fechaEmision: string;
  rutProveedor: string;
  razonSocialProveedor: string;
  montoNeto: number;
  montoExento: number;
  montoIva: number;
  montoTotal: number;
  estadoRcv: RcvEstadoRegistro;
  fechaRecepcion?: string;
  acuseRecibo?: string;
}

export interface RcvRegistroVenta {
  tipoDte: number;
  folio: number;
  fechaEmision: string;
  rutReceptor: string;
  razonSocialReceptor: string;
  montoNeto: number;
  montoExento: number;
  montoIva: number;
  montoTotal: number;
  estadoRcv: RcvEstadoRegistro;
}

export type RcvEstadoRegistro =
  | "registrar"
  | "pendiente"
  | "aceptado"
  | "reclamado"
  | "anulado";

export type RcvTipoRegistro = "compras" | "ventas";

export interface RcvConsultaInput {
  ambiente: import("./sii-dte").SiiEnvironment;
  rutEmpresa: string;
  periodo: string;
  tipoRegistro: RcvTipoRegistro;
}

export interface RcvResumen {
  periodo: string;
  tipoRegistro: RcvTipoRegistro;
  totalDocumentos: number;
  totalNeto: number;
  totalIva: number;
  totalExento: number;
  totalTotal: number;
  registros: RcvRegistroCompra[] | RcvRegistroVenta[];
}

export const RCV_ESTADO_SII: Record<string, RcvEstadoRegistro> = {
  EPR: "aceptado",
  RCP: "pendiente",
  RCT: "reclamado",
  ANU: "anulado",
  REG: "registrar",
} as const;

export function parsearEstadoRcv(siiCode: string): RcvEstadoRegistro {
  return RCV_ESTADO_SII[siiCode] ?? "pendiente";
}
