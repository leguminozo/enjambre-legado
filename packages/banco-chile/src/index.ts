/**
 * @enjambre/banco-chile
 * 
 * Cliente oficial para APIs de Banco Chile Empresas
 * 
 * @example
 * ```typescript
 * import { BancoChileClient } from '@enjambre/banco-chile';
 * 
 * const client = new BancoChileClient({
 *   clientId: 'tu_client_id',
 *   clientSecret: 'tu_client_secret',
 *   username: 'tu_username',
 *   password: 'tu_password',
 *   environment: 'sandbox', // o 'production'
 * });
 * 
 * // Obtener cuentas
 * const cuentas = await client.getCuentas();
 * 
 * // Obtener movimientos
 * const movimientos = await client.getMovimientos('123456');
 * 
 * // Crear transferencia
 * const transferencia = await client.crearTransferencia({
 *   cuentaOrigen: '123456',
 *   cuentaDestino: '789012',
 *   rutDestinatario: '76543210-K',
 *   nombreDestinatario: 'Proveedor SPA',
 *   bancoDestino: 'Banco Estado',
 *   monto: 100000,
 *   tipoTransferencia: 'normal',
 * });
 * ```
 */

export { BancoChileClient } from './client';
export * from './types';
