import type {
  AuthToken,
  AuthConfig,
  CuentaBancaria,
  MovimientoBancario,
  TransferenciaRequest,
  TransferenciaResponse,
  CotizacionPrevisional,
  RentaDepurada,
  NominaRequest,
  NominaResponse,
  DocumentoComercial,
  MontoPreaprobado,
  BancoChileResult,
} from './types';

/**
 * Cliente para APIs de Banco Chile Empresas
 * 
 * APIs soportadas:
 * - Movimientos y Saldos
 * - Abono en línea (transferencias)
 * - Cotizaciones Previsionales
 * - Rentas Depuradas
 * - Nominas/Confirming
 * - Documentos (Factoring)
 * - Montos Preaprobados
 * - Autenticación
 * 
 * Documentación: https://apistore.bancochile.cl/banco-chile/sandbox
 */
export class BancoChileClient {
  private baseUrl: string;
  private token: AuthToken | null = null;
  /** Absolute epoch ms when access_token expires (NOT OAuth expires_in seconds). */
  private tokenExpiresAtMs = 0;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production'
      ? 'https://api.bancochile.cl'
      : 'https://apistore.bancochile.cl/banco-chile/sandbox';
  }

  /** Hydrate from DB-persisted token (expires_at ISO). */
  setStoredToken(token: AuthToken, expiresAtIso: string): void {
    this.token = token;
    const ms = Date.parse(expiresAtIso);
    this.tokenExpiresAtMs = Number.isFinite(ms) ? ms : 0;
  }

  getStoredTokenMeta(): { token: AuthToken | null; expiresAtMs: number } {
    return { token: this.token, expiresAtMs: this.tokenExpiresAtMs };
  }

  isAccessTokenFresh(skewMs = 60_000): boolean {
    return Boolean(this.token?.access_token) && Date.now() < this.tokenExpiresAtMs - skewMs;
  }

  // ===========================================================================
  // Autenticación
  // ===========================================================================
  async authenticate(): Promise<BancoChileResult<AuthToken>> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: this.config.username,
          password: this.config.password,
          scope: 'accounts transfers payments documents',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error de autenticación' }));
        return {
          success: false,
          error: {
            code: 'AUTH_FAILED',
            message: error.message || 'Error de autenticación',
          },
        };
      }

      const data = await response.json();
      const expiresInSec = Number(data.expires_in) || 3600;
      this.token = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: expiresInSec,
        token_type: data.token_type || 'Bearer',
        scope: data.scope || '',
      };
      // OAuth expires_in is relative seconds from now
      this.tokenExpiresAtMs = Date.now() + expiresInSec * 1000;

      return { success: true, data: this.token };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Error de red',
        },
      };
    }
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    if (!this.isAccessTokenFresh()) {
      const auth = await this.authenticate();
      if (!auth.success) {
        throw new Error(auth.error.message || 'No se pudo autenticar con Banco Chile');
      }
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token?.access_token || ''}`,
      'Accept': 'application/json',
    };
  }

  // ===========================================================================
  // Movimientos y Saldos
  // ===========================================================================
  private normalizeList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      for (const k of ['items', 'accounts', 'cuentas', 'transactions', 'movimientos', 'data']) {
        if (Array.isArray(o[k])) return o[k] as T[];
      }
    }
    return [];
  }

  async getCuentas(): Promise<BancoChileResult<CuentaBancaria[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/accounts`, { headers });

      if (!response.ok) {
        return { success: false, error: { code: 'API_ERROR', message: 'Error al obtener cuentas' } };
      }

      const data = await response.json();
      return { success: true, data: this.normalizeList<CuentaBancaria>(data) };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  async getMovimientos(
    cuentaId: string,
    options?: { desde?: string; hasta?: string; limite?: number }
  ): Promise<BancoChileResult<MovimientoBancario[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      if (options?.desde) params.append('desde', options.desde);
      if (options?.hasta) params.append('hasta', options.hasta);
      if (options?.limite) params.append('limite', options.limite.toString());

      const response = await fetch(
        `${this.baseUrl}/api/v1/accounts/${cuentaId}/transactions?${params}`,
        { headers }
      );

      if (!response.ok) {
        return { success: false, error: { code: 'API_ERROR', message: 'Error al obtener movimientos' } };
      }

      const data = await response.json();
      return { success: true, data: this.normalizeList<MovimientoBancario>(data) };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  // ===========================================================================
  // Transferencias (Abono en línea)
  // ===========================================================================
  async crearTransferencia(
    transferencia: TransferenciaRequest
  ): Promise<BancoChileResult<TransferenciaResponse>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/transfers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(transferencia),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error en transferencia' }));
        return {
          success: false,
          error: { code: 'TRANSFER_FAILED', message: error.message },
        };
      }

      const data = await response.json();
      return { success: true, data: data as TransferenciaResponse };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  // ===========================================================================
  // Cotizaciones Previsionales
  // ===========================================================================
  async getCotizaciones(
    rutTrabajador: string,
    periodo?: string
  ): Promise<BancoChileResult<CotizacionPrevisional[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      if (periodo) params.append('periodo', periodo);

      const response = await fetch(
        `${this.baseUrl}/api/v1/cotizaciones/${rutTrabajador}?${params}`,
        { headers }
      );

      if (!response.ok) {
        return { success: false, error: { code: 'API_ERROR', message: 'Error al obtener cotizaciones' } };
      }

      const data = await response.json();
      return { success: true, data: data as CotizacionPrevisional[] };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  // ===========================================================================
  // Rentas Depuradas
  // ===========================================================================
  async getRentaDepurada(
    rutPersona: string,
    periodo?: string
  ): Promise<BancoChileResult<RentaDepurada>> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      if (periodo) params.append('periodo', periodo);

      const response = await fetch(
        `${this.baseUrl}/api/v1/rentas/${rutPersona}?${params}`,
        { headers }
      );

      if (!response.ok) {
        return { success: false, error: { code: 'API_ERROR', message: 'Error al obtener renta depurada' } };
      }

      const data = await response.json();
      return { success: true, data: data as RentaDepurada };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  // ===========================================================================
  // Nóminas (Confirming)
  // ===========================================================================
  async procesarNomina(nomina: NominaRequest): Promise<BancoChileResult<NominaResponse>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/payroll`, {
        method: 'POST',
        headers,
        body: JSON.stringify(nomina),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error en nómina' }));
        return { success: false, error: { code: 'PAYROLL_FAILED', message: error.message } };
      }

      const data = await response.json();
      return { success: true, data: data as NominaResponse };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  // ===========================================================================
  // Documentos (Factoring)
  // ===========================================================================
  async consultarDocumentos(
    options?: { tipo?: string; estado?: string; desde?: string; hasta?: string }
  ): Promise<BancoChileResult<DocumentoComercial[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      if (options?.tipo) params.append('tipo', options.tipo);
      if (options?.estado) params.append('estado', options.estado);
      if (options?.desde) params.append('desde', options.desde);
      if (options?.hasta) params.append('hasta', options.hasta);

      const response = await fetch(
        `${this.baseUrl}/api/v1/documents?${params}`,
        { headers }
      );

      if (!response.ok) {
        return { success: false, error: { code: 'API_ERROR', message: 'Error al obtener documentos' } };
      }

      const data = await response.json();
      return { success: true, data: data as DocumentoComercial[] };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  async aceptarDocumento(documentoId: string): Promise<BancoChileResult<{ aceptado: true }>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentoId}/accept`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        return { success: false, error: { code: 'API_ERROR', message: 'Error al aceptar documento' } };
      }

      return { success: true, data: { aceptado: true } };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  // ===========================================================================
  // Montos Preaprobados
  // ===========================================================================
  async getMontosPreaprobados(): Promise<BancoChileResult<MontoPreaprobado[]>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/preapproved-amounts`, { headers });

      if (!response.ok) {
        return { success: false, error: { code: 'API_ERROR', message: 'Error al obtener montos preaprobados' } };
      }

      const data = await response.json();
      return { success: true, data: data as MontoPreaprobado[] };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }

  async getMontoPreaprobado(rutCliente: string): Promise<BancoChileResult<MontoPreaprobado>> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/v1/preapproved-amounts/${rutCliente}`, { headers });

      if (!response.ok) {
        return { success: false, error: { code: 'API_ERROR', message: 'Error al obtener monto preaprobado' } };
      }

      const data = await response.json();
      return { success: true, data: data as MontoPreaprobado };
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Error de red' },
      };
    }
  }
}
