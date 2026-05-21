export const DTE_TIPO = {
  FACTURA_ELECTRONICA: 33,
  FACTURA_NO_AFECTA: 34,
  BOLETA_ELECTRONICA: 39,
  BOLETA_NO_AFECTA: 41,
  FACTURA_COMPRA: 46,
  NOTA_CREDITO: 61,
  NOTA_DEBITO: 56,
  GUIA_DESPACHO: 52,
} as const;

export type DteTipo = (typeof DTE_TIPO)[keyof typeof DTE_TIPO];

export const SII_ENV = {
  CERTIFICACION: "https://maullin.sii.cl",
  PRODUCCION: "https://palena.sii.cl",
} as const;

export type SiiEnvironment = keyof typeof SII_ENV;

export interface DteEmisor {
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  actividadEconomica: number;
}

export interface DteReceptor {
  rut: string;
  razonSocial: string;
  giro: string;
  direccion: string;
  comuna: string;
  ciudad: string;
}

export interface DteDetalle {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  montoItem: number;
}

export interface DteEncabezado {
  tipoDte: DteTipo;
  folio: number;
  fechaEmision: string;
  emisor: DteEmisor;
  receptor: DteReceptor;
  montoNeto: number;
  montoExento: number;
  tasaIva: number;
  montoIva: number;
  montoTotal: number;
}

export interface DteDocumento {
  encabezado: DteEncabezado;
  detalles: DteDetalle[];
  referencias?: DteReferencia[];
}

export interface DteReferencia {
  tipoDocumento: number;
  folio: number;
  fecha: string;
  razonReferencia: string;
}

export interface CafFolio {
  tipoDte: DteTipo;
  desde: number;
  hasta: number;
  fechaAutorizacion: string;
  firma: string;
  privateKey: string;
  publicKey: string;
}

export interface SiiAuthToken {
  token: string;
  expiresAt: number;
}

export interface SiiEnvioResult {
  trackId: string;
  estado: "aceptado" | "rechazado" | "error";
  glosa: string;
}

export interface SiiEstadoResult {
  estado: string;
  glosa: string;
  aceptados: number;
  rechazados: number;
  reparos: number;
}
