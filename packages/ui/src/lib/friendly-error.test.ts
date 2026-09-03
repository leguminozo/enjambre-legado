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

  it('humanizeTechnicalPhrase limpia nombres de tablas y términos técnicos', () => {
    expect(humanizeTechnicalPhrase('Sin registros en incentivo_ledger')).toBe('Sin registros en historial de incentivos');
    expect(humanizeTechnicalPhrase('colmena_bitacora actualizada')).toBe('bitácora de la colmena actualizada');
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

