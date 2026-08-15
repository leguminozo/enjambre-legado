import { describe, expect, it } from 'vitest';
import { legacyDeviceScript } from './legacy-device-detect';

describe('legacyDeviceScript', () => {
  it('no marca legacy solo por 2 núcleos (Mac dual-core con RAM normal)', () => {
    const src = legacyDeviceScript();
    expect(src).toContain('lowMem&&lowCpu');
    expect(src).toContain('deviceMemory<=1');
    expect(src).not.toMatch(/hardwareConcurrency<=2\}else/);
  });
});
