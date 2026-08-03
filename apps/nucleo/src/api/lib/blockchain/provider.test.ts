import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeDataHash, canonicalizeJson } from '@/api/lib/blockchain/provider';
import { getBlockchainProvider } from '@/api/lib/blockchain/provider';

vi.mock('viem', () => ({
  createWalletClient: vi.fn(),
  createPublicClient: vi.fn(),
  http: vi.fn(),
  parseAbi: vi.fn(),
  privateKeyToAccount: vi.fn(),
  polygonAmoy: { id: 80002 },
  polygon: { id: 137 },
  baseSepolia: { id: 84532 },
  base: { id: 8453 },
}));

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn(),
}));

vi.mock('viem/chains', () => ({
  polygonAmoy: { id: 80002 },
  polygon: { id: 137 },
  baseSepolia: { id: 84532 },
  base: { id: 8453 },
}));

describe('Blockchain Provider', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.BLOCKCHAIN_ANCHOR_PRIVATE_KEY = 'test-key';
    process.env.BLOCKCHAIN_ANCHOR_CONTRACT_POLYGON_AMOY = '0x1234567890123456789012345678901234567890';
  });

  it('computeDataHash generates consistent hash for same input', () => {
    const data = { field1: 'value1', field2: 123 };
    const hash1 = computeDataHash('colmena', 'test-id', data);
    const hash2 = computeDataHash('colmena', 'test-id', data);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('computeDataHash generates different hashes for different data', () => {
    const hash1 = computeDataHash('colmena', 'test-id', { field: 'value1' });
    const hash2 = computeDataHash('colmena', 'test-id', { field: 'value2' });
    expect(hash1).not.toBe(hash2);
  });

  it('computeDataHash includes entity type in hash', () => {
    const hash1 = computeDataHash('colmena', 'same-id', { data: 'test' });
    const hash2 = computeDataHash('lote', 'same-id', { data: 'test' });
    expect(hash1).not.toBe(hash2);
  });

  it('es independiente del orden de llaves (jsonb reordena al persistir)', () => {
    // Bug real: data_payload se guarda como jsonb y Postgres reordena llaves;
    // si el hash dependiera del orden, la página pública no podría recomputarlo.
    const dataA = { nombre_lote: 'X', kg_total: 10, colmenas: ['C1', 'C2'] };
    const dataB = { colmenas: ['C1', 'C2'], kg_total: 10, nombre_lote: 'X' };
    expect(computeDataHash('lote', 'id-1', dataA)).toBe(computeDataHash('lote', 'id-1', dataB));
  });

  it('es independiente del orden en objetos y arrays anidados', () => {
    const a = {
      analisis: { humedad: 17.2, hmf: 8 },
      cosecha_ids: ['c1', 'c2'],
      apiario: 'Pureo',
    };
    const b = {
      cosecha_ids: ['c1', 'c2'],
      apiario: 'Pureo',
      analisis: { hmf: 8, humedad: 17.2 },
    };
    expect(computeDataHash('lote', 'id-1', a)).toBe(computeDataHash('lote', 'id-1', b));
  });

  it('canonicalizeJson ordena llaves y preserva arrays/null/boolean', () => {
    const input = { b: 1, a: { d: 4, c: 3 }, arr: [2, 1], n: null, ok: true };
    const canonical = canonicalizeJson(input) as Record<string, unknown>;
    expect(Object.keys(canonical)).toEqual(['a', 'arr', 'b', 'n', 'ok']);
    expect(canonical.arr).toEqual([2, 1]); // arrays preservan orden
    expect(canonical.n).toBeNull();
    expect(canonical.ok).toBe(true);
    expect(Object.keys(canonical.a as Record<string, unknown>)).toEqual(['c', 'd']);
  });

  it('recomputar desde el payload canónico da el mismo hash (round-trip jsonb)', () => {
    const data = { nombre_lote: 'L1', kg_total: 42, analisis: { hmf: 7 } };
    const original = computeDataHash('lote', 'id-9', data);
    // Simula jsonb: mismo contenido, llaves en otro orden
    const recomputed = computeDataHash('lote', 'id-9', canonicalizeJson(data) as Record<string, unknown>);
    expect(recomputed).toBe(original);
  });
});

describe('Blockchain Provider Factory', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws when contract address not configured', () => {
    delete process.env.BLOCKCHAIN_ANCHOR_CONTRACT_POLYGON_AMOY;
    expect(() => getBlockchainProvider('polygon-amoy')).toThrow('BLOCKCHAIN_ANCHOR_CONTRACT_POLYGON_AMOY not configured');
  });

  it('throws for unsupported chain', () => {
    expect(() => getBlockchainProvider('unsupported' as any)).toThrow('Unsupported chain: unsupported');
  });
});