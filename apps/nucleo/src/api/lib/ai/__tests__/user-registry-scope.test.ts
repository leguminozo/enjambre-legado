import { describe, expect, it } from 'vitest';
import {
  formatRegistryScopeForPrompt,
  REGISTRY_ASK_SYSTEM,
  type UserRegistryScope,
} from '../user-registry-scope';

const sample: UserRegistryScope = {
  user_id: 'u1',
  profile_role: 'apicultor',
  colmenas: [
    { id: 'c1', name: '15', last_inspection: '2026-08-01', apiario_id: 'a1' },
  ],
  apiarios: [{ id: 'a1', name: 'Patio' }],
  actor_territorial: null,
  recent_inspecciones: [
    {
      id: 'i1',
      colmena_id: 'c1',
      date: '2026-08-01',
      notes: 'ok',
      fase: 'temporada',
    },
  ],
};

describe('user-registry-scope', () => {
  it('serializa solo campos de registro (sin secretos)', () => {
    const json = formatRegistryScopeForPrompt(sample);
    expect(json).toContain('apicultor');
    expect(json).toContain('15');
    expect(json).not.toContain('GROQ');
    expect(json).not.toContain('service_role');
  });

  it('system prompt prohíbe inventar datos ajenos', () => {
    expect(REGISTRY_ASK_SYSTEM).toMatch(/No inventes/i);
    expect(REGISTRY_ASK_SYSTEM).toMatch(/otros usuarios/i);
  });
});
