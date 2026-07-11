import { describe, expect, it } from 'vitest';
import { friendlyApiError, friendlyError, friendlySupabaseError } from './friendly-error';

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

describe('friendlyApiError / friendlyError', () => {
  it('api codes', () => {
    expect(friendlyApiError('unauthorized')).toMatch(/sesión/i);
    expect(friendlyApiError('not_found')).toMatch(/encontró/i);
  });

  it('Error de red', () => {
    expect(friendlyError(new Error('Failed to fetch'))).toMatch(/conexión|internet/i);
  });
});
