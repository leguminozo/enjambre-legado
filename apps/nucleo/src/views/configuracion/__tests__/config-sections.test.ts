import { describe, expect, it } from 'vitest';
import {
  getConfigSectionsForRole,
  CONFIG_SECTIONS_BY_ROLE,
} from '../constants';

describe('getConfigSectionsForRole', () => {
  it('admin ve todas las secciones de cuenta y empresa (sistema migrado a sidebar)', () => {
    const sections = getConfigSectionsForRole('admin');
    expect(sections).toEqual(CONFIG_SECTIONS_BY_ROLE.admin);
    expect(sections).toContain('empresas');
    expect(sections).not.toContain('sistema');
    expect(sections).not.toContain('guardian');
  });

  it('apicultor (patio) solo personal, seguridad, preferencias', () => {
    expect(getConfigSectionsForRole('apicultor')).toEqual([
      'personal',
      'seguridad',
      'preferencias',
    ]);
    expect(getConfigSectionsForRole('apicultor')).not.toContain('empresas');
    expect(getConfigSectionsForRole('apicultor')).not.toContain('sistema');
    expect(getConfigSectionsForRole('apicultor')).not.toContain('territorio');
  });

  it('territorial ve territorio pero no empresas/sistema admin', () => {
    expect(getConfigSectionsForRole('territorial')).toEqual([
      'personal',
      'seguridad',
      'territorio',
      'preferencias',
    ]);
    expect(getConfigSectionsForRole('territorial')).not.toContain('empresas');
    expect(getConfigSectionsForRole('territorial')).not.toContain('sistema');
  });

  it('rol desconocido o vacío cae a default seguro', () => {
    expect(getConfigSectionsForRole(undefined)).toEqual([
      'personal',
      'seguridad',
      'preferencias',
    ]);
    expect(getConfigSectionsForRole('random')).toEqual([
      'personal',
      'seguridad',
      'preferencias',
    ]);
  });
});
