import { describe, expect, it } from 'vitest';
import { z } from 'zod';

/** Mirror of InvitableRoleSchema in invitations.ts / CrearCuentaSchema.role */
const InvitableRoleSchema = z.enum([
  'apicultor',
  'territorial',
  'admin',
  'cliente',
  'rep_ventas',
  'creador',
]);

const CreateInvitationSchema = z
  .object({
    roles: z.array(InvitableRoleSchema).min(1).default(['rep_ventas']),
  })
  .strict();

const CrearCuentaRoleSchema = z.enum([
  'admin',
  'apicultor',
  'territorial',
  'cliente',
  'rep_ventas',
  'creador',
]);

describe('invitation BFF schemas — apicultor patio', () => {
  it('acepta código con roles apicultor', () => {
    const parsed = CreateInvitationSchema.parse({ roles: ['apicultor'] });
    expect(parsed.roles).toEqual(['apicultor']);
  });

  it('acepta crear cuenta con role apicultor', () => {
    expect(CrearCuentaRoleSchema.parse('apicultor')).toBe('apicultor');
  });

  it('rechaza roles legacy no invitables', () => {
    expect(() => CreateInvitationSchema.parse({ roles: ['gerente'] })).toThrow();
    expect(() => CrearCuentaRoleSchema.parse('vendedor')).toThrow();
  });

  it('acepta multi-rol código con apicultor + rep', () => {
    const parsed = CreateInvitationSchema.parse({
      roles: ['apicultor', 'rep_ventas'],
    });
    expect(parsed.roles).toContain('apicultor');
    expect(parsed.roles).toContain('rep_ventas');
  });
});
