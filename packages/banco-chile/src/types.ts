import { z } from 'zod';

// ============================================================================
// Tipos para Banco Chile Empresas API
// Base: https://apistore.bancochile.cl/banco-chile/sandbox/forum/2
// ============================================================================

// -----------------------------------------------------------------------------
// Autenticación
// -----------------------------------------------------------------------------
export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: 'Bearer';
  scope: string;
}

export interface AuthConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  environment: 'sandbox' | 'production';
}

// -----------------------------------------------------------------------------
// Cuentas y Saldos
// -----------------------------------------------------------------------------
export interface CuentaBancaria {
  id: string;
  numeroCuenta: string;
  tipoCuenta: 'corriente' | 'vista' | 'ahorro' | 'empresas';
  moneda: string;
  saldoDisponible: number;
  saldoContable: number;
  fechaActualizacion: string;
  activa: boolean;
}

export interface MovimientoBancario {
  id: string;
  fechaContable: string;
  fechaValor: string;
  descripcion: string;
  descripcionDetallada?: string;
  monto: number;
  moneda: string;
  tipo: 'abono' | 'cargo' | 'traspaso' | 'nota_debito' | 'nota_credito';
  categoria?: string;
  subcategoria?: string;
  referencia?: string;
  rutContraparte?: string;
  nombreContraparte?: string;
  bancoContraparte?: string;
  numeroOperacion?: string;
  saldoPosterior?: number;
}

// -----------------------------------------------------------------------------
// Transferencias (Abono en línea)
// -----------------------------------------------------------------------------
export interface TransferenciaRequest {
  cuentaOrigen: string;
  cuentaDestino: string;
  rutDestinatario: string;
  nombreDestinatario: string;
  bancoDestino: string;
  monto: number;
  concepto?: string;
  tipoTransferencia: 'normal' | 'urgente' | 'diferida';
}

export interface TransferenciaResponse {
  numeroOperacion: string;
  estado: 'pendiente' | 'procesada' | 'rechazada' | 'fallida';
  comprobante?: string;
  fechaProcesamiento?: string;
}

// -----------------------------------------------------------------------------
// Cotizaciones Previsionales
// -----------------------------------------------------------------------------
export interface CotizacionPrevisional {
  rutTrabajador: string;
  nombreTrabajador: string;
  periodo: string; // YYYY-MM
  sueldoBase: number;
  horasTrabajadas: number;
  afp: string;
  tramoAfp?: string;
  montoAfp?: number;
  isapre: string;
  tramoIsapre?: string;
  montoIsapre?: number;
  seguroCesantia: number;
}

// -----------------------------------------------------------------------------
// Rentas Depuradas
// -----------------------------------------------------------------------------
export interface RentaDepurada {
  rutPersona: string;
  nombrePersona: string;
  periodo: string; // YYYY-MM
  rentaBruta: number;
  rentaLiquida: number;
  ingresosNoRenta: number;
  fuente: string;
  confianza: 'alta' | 'media' | 'baja';
}

// -----------------------------------------------------------------------------
// Nóminas (Confirming)
// -----------------------------------------------------------------------------
export interface NominaRequest {
  numeroNomina: string;
  periodo: string; // YYYY-MM
  detalles: NominaDetalleRequest[];
}

export interface NominaDetalleRequest {
  rutBeneficiario: string;
  nombreBeneficiario: string;
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  monto: number;
  concepto?: string;
}

export interface NominaResponse {
  numeroNomina: string;
  estado: 'pendiente' | 'procesada' | 'parcial' | 'rechazada';
  totalNominas: number;
  comprobante?: string;
}

// -----------------------------------------------------------------------------
// Documentos (Factoring/Web Confirming)
// -----------------------------------------------------------------------------
export interface DocumentoComercial {
  tipoDocumento: 'factura' | 'pagare' | 'letra' | 'pagare_electronico';
  numeroDocumento: string;
  rutLibrador: string;
  nombreLibrador: string;
  rutLibratario?: string;
  nombreLibratario?: string;
  montoNominal: number;
  montoPagar?: number;
  fechaEmision?: string;
  fechaVencimiento: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado' | 'pagado' | 'vencido';
  observaciones?: string;
}

// -----------------------------------------------------------------------------
// Montos Preaprobados
// -----------------------------------------------------------------------------
export interface MontoPreaprobado {
  rutCliente: string;
  nombreCliente: string;
  montoPreaprobado: number;
  montoDisponible: number;
  fechaAprobacion: string;
  fechaVencimiento: string;
  producto?: string;
  tasaInteres?: number;
  condiciones?: string;
}

// -----------------------------------------------------------------------------
// Notificaciones (Webhooks)
// -----------------------------------------------------------------------------
export interface NotificacionBancoChile {
  id: string;
  tipoEvento: string;
  cuentaAfectada?: string;
  monto?: number;
  descripcion?: string;
  fecha: string;
  datosRaw?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Respuestas de API
// -----------------------------------------------------------------------------
export interface BancoChileApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface BancoChileApiResponse<T> {
  success: true;
  data: T;
}

export interface BancoChileApiErrorResponse {
  success: false;
  error: BancoChileApiError;
}

export type BancoChileResult<T> = 
  | { success: true; data: T }
  | { success: false; error: BancoChileApiError };

// -----------------------------------------------------------------------------
// Schemas de validación Zod
// -----------------------------------------------------------------------------
export const TransferenciaRequestSchema = z.object({
  cuentaOrigen: z.string().min(1),
  cuentaDestino: z.string().min(1),
  rutDestinatario: z.string().min(1),
  nombreDestinatario: z.string().min(1),
  bancoDestino: z.string().min(1),
  monto: z.number().positive(),
  concepto: z.string().optional(),
  tipoTransferencia: z.enum(['normal', 'urgente', 'diferida']),
});

export const NominaRequestSchema = z.object({
  numeroNomina: z.string().min(1),
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
  detalles: z.array(z.object({
    rutBeneficiario: z.string().min(1),
    nombreBeneficiario: z.string().min(1),
    banco: z.string().min(1),
    tipoCuenta: z.string().min(1),
    numeroCuenta: z.string().min(1),
    monto: z.number().positive(),
    concepto: z.string().optional(),
  })),
});

export const DocumentoComercialSchema = z.object({
  tipoDocumento: z.enum(['factura', 'pagare', 'letra', 'pagare_electronico']),
  numeroDocumento: z.string().min(1),
  rutLibrador: z.string().min(1),
  nombreLibrador: z.string().min(1),
  rutLibratario: z.string().optional(),
  nombreLibratario: z.string().optional(),
  montoNominal: z.number().positive(),
  montoPagar: z.number().optional(),
  fechaEmision: z.string().optional(),
  fechaVencimiento: z.string(),
  estado: z.enum(['pendiente', 'aceptado', 'rechazado', 'pagado', 'vencido']),
  observaciones: z.string().optional(),
});
