import { describe, expect, it } from 'vitest';
import { friendlyApiError, friendlyError, friendlySupabaseError, humanizeTechnicalPhrase } from './friendly-error';

describe('friendlySupabaseError', () => {
  it('mapea códigos conocidos', () => {
    expect(friendlySupabaseError({ code: '23505' })).toMatch(/Ya existe/i);
    expect(friendlySupabaseError({ code: '42501' })).toMatch(/permisos/i);
  });

  it('mapea mensajes de auth', () => {
    expect(friendlySupabaseError({ message: 'Invalid login credentials' })).toMatch(/incorrectos/i);
    expect(friendlySupabaseError({ message: 'User already registered' })).toMatch(/correo/i);
  });

  it('null → unknown', () => {
    expect(friendlySupabaseError(null)).toMatch(/inesperado/i);
  });
});

describe('friendlyError no filtra jerga', () => {
  it('un string SQL no llega al usuario', () => {
    expect(friendlyError('relation public.productos does not exist')).toMatch(/inesperado|interno/i);
    expect(friendlyError('relation public.productos does not exist')).not.toMatch(/relation|productos/i);
  });

  it('un error crudo de pasarela (Flow/Webpay) no llega al usuario', () => {
    const rawError = 'Flow.cl /payment/getStatus failed (400): {"code":105,"message":"No services available"}';
    const friendly = friendlyError(rawError);
    expect(friendly).not.toMatch(/flow|getStatus|code|400|services/i);
    expect(friendly).toMatch(/pasarela/i);

    const apiFriendly = friendlyApiError(undefined, rawError);
    expect(apiFriendly).not.toMatch(/flow|getStatus|code|400|services/i);
    expect(apiFriendly).toMatch(/pasarela/i);
  });

  it('un error crudo de wallet no llega al usuario ni en error ni en fallback', () => {
    const rawWallet = 'Configura APPLE_PASS_CERT_P12_BASE64, APPLE_TEAM_IDENTIFIER y WALLET_PASS_SECRET';
    expect(friendlyError(rawWallet)).toMatch(/billetera móvil|disponible/i);
    expect(friendlyError(new Error(rawWallet))).toMatch(/billetera móvil|disponible/i);
    expect(friendlyError(new Error('err'), rawWallet)).toMatch(/billetera móvil|disponible/i);
  });

  it('un fallback que contenga error SQL o técnico es descartado y saneado', () => {
    const rawSql = 'duplicate key value violates unique constraint "clientes_pkey"';
    expect(friendlyError(new Error('db_fail'), rawSql)).toMatch(/inesperado|interno|datos/i);
    expect(friendlyError(new Error('db_fail'), rawSql)).not.toMatch(/violates|constraint|pkey/i);
  });

  it('humanizeTechnicalPhrase limpia nombres de tablas y términos técnicos', () => {
    expect(humanizeTechnicalPhrase('Sin registros en incentivo_ledger')).toBe('Sin registros en historial de incentivos');
    expect(humanizeTechnicalPhrase('colmena_bitacora actualizada')).toBe('bitácora de la colmena actualizada');
    expect(humanizeTechnicalPhrase('Regla 46_stock_lote_sync.sql')).toBe('Regla actualización del sistema');
    expect(humanizeTechnicalPhrase('Ingresa el UUID del tercero')).toBe('Ingresa el código identificador del tercero');
    expect(humanizeTechnicalPhrase('Ejecuta pnpm db:push')).toBe('Ejecuta sincronización del sistema');
  });
});

describe('friendlyApiError / friendlyError', () => {
  it('api codes', () => {
    expect(friendlyApiError('unauthorized')).toMatch(/sesión/i);
    expect(friendlyApiError('not_found')).toMatch(/encontró/i);
  });

  it('Error de red', () => {
    expect(friendlyError(new Error('Failed to fetch'))).toMatch(/conexión|internet/i);
  });

  it('Error de auth (AuthError extendiendo Error) no es enmascarado por fallback', () => {
    expect(friendlyError(new Error('Invalid login credentials'), 'Error de autenticación')).toMatch(/incorrectos/i);
    expect(friendlyError(new Error('Email not confirmed'), 'Error de autenticación')).toMatch(/confirma/i);
  });
});

