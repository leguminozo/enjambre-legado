import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeDataHash } from '@/api/lib/blockchain/provider';
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