export const DTE_TIPO = {
  FACTURA_ELECTRONICA: 33,
  FACTURA_NO_AFECTA: 34,
  BOLETA_ELECTRONICA: 39,
  BOLETA_NO_AFECTA: 41,
  FACTURA_COMPRA: 46,
  NOTA_CREDITO: 61,
  NOTA_DEBITO: 56,
  GUIA_DESPACHO: 52,
  BOLETA_HONORARIOS: 66,
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
  /** Indicador Agente Retenedor (campo IndAgente, valor "R") — cambio de sujeto de IVA. */
  indAgente?: boolean;
  /** Código del ítem (CdgItem) — obligatorio con TpoCodigo "CPCS" si indAgente. */
  codigoItem?: { tipoCodigo: string; valorCodigo: string };
  /** Unidad de medida (UnmdItem) — obligatoria si indAgente (excepto construcción/maquila). */
  unidadMedida?: string;
  /** Cantidad de referencia (QtyRef) — faenamiento de ganado y ventas de ganado. */
  cantidadReferencia?: number;
  /** Unidad de referencia (UnmdRef) — valor "UNID" para ganado. */
  unidadMedidaReferencia?: string;
  /** Código de impuesto o retención (CodImpAdic) — si hay retención/anticipo asociado. */
  codigoImpuestoAdicional?: number;
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
  /** Tasa de impuesto o retención del documento (TasaImp en Totales) — cambio de sujeto. */
  tasaImp?: number;
  /** Valor del impuesto o retención del documento (MontoImp en Totales). */
  montoImp?: number;
}

export interface DteDocumento {
  encabezado: DteEncabezado;
  detalles: DteDetalle[];
  referencias?: DteReferencia[];
}

export interface DteReferencia {
  /** Tipo de documento referenciado (número DTE, o texto como "SET" en el set de pruebas). */
  tipoDocumento: number | string;
  folio?: number;
  fecha?: string;
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
  /** IDK opcional del CAF (folio de la autorización entregada por el SII). */
  idk?: string;
  /** RUT del emisor declarado dentro del CAF (campo RE del DA). */
  rutEmisor?: string;
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

export type SiiSoapEstado = 
  | "DOK" | "DNK" | "FAU" | "FNA" | "FAN" 
  | "EMP" | "TMD" | "TMC" | "MMD" | "MMC" 
  | "AND" | "ANC" 
  | "001" | "002" | "003"
  | "-1" | "-2" | "-3" | "-4" | "Otros";

export interface SiiQueryEstDteResult {
  estado: SiiSoapEstado;
  glosa: string;
  errCode: string;
  glosaErr: string;
  numAtencion: string;
}

/** Estados de QueryEstUp (consulta de estado de un envío/upload por TrackId). */
export type SiiUploadEstado =
  | "RSC" | "SOK" | "CRT" | "RFR" | "FOK"
  | "PRD" | "RCT" | "EPR"
  | "001" | "002" | "003"
  | "-1" | "-2" | "-3" | "-4" | "-5" | "-6"
  | "-7" | "-8" | "-9" | "-10" | "-11" | "-12"
  | "-13" | "-14" | "Otros";

export interface QueryEstUpResult {
  estado: SiiUploadEstado;
  glosa: string;
  trackId: string;
  tipoDocto?: string;
  informados?: number;
  aceptados?: number;
  rechazados?: number;
  reparos?: number;
  numAtencion: string;
}

/** Respuesta de QueryEstDteAv (RECIBIDO/ESTADO por documento, con verificación de datos). */
export interface QueryEstDteAvResult {
  estado: SiiSoapEstado;
  recibido: "SI" | "NO" | "";
  glosa: string;
  trackId: string;
  numAtencion: string;
}

/** Respuesta de wsDTECorreo (reenvío de correo de diagnóstico de validación). */
export interface ReenvioCorreoResult {
  estado: string;
  glosa: string;
}

/** Respuesta genérica de los WS de autenticación (CrSeed / GetTokenFromSeed). */
export interface SiiAuthWsRespuesta {
  estado: string;
  glosa: string;
  semilla?: string;
  token?: string;
}
