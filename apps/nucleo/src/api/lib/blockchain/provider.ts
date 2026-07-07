import { createHash } from 'crypto';

export interface BlockchainProvider {
  name: string;
  chainId: number;
  anchor(data: string): Promise<AnchorResult>;
  verify(txHash: string): Promise<VerifyResult>;
  getExplorerUrl(txHash: string): string;
}

export interface AnchorResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  blockTimestamp?: Date;
  error?: string;
}

export interface VerifyResult {
  success: boolean;
  confirmed: boolean;
  blockNumber?: number;
  blockTimestamp?: Date;
  error?: string;
}

export type SupportedChain = 'polygon-amoy' | 'polygon-mainnet' | 'base-sepolia' | 'base-mainnet';

export const CHAIN_CONFIG: Record<SupportedChain, { chainId: number; rpcUrl: string; explorerUrl: string; name: string }> = {
  'polygon-amoy': {
    chainId: 80002,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://www.oklink.com/amoy/tx/',
    name: 'Polygon Amoy',
  },
  'polygon-mainnet': {
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com/tx/',
    name: 'Polygon Mainnet',
  },
  'base-sepolia': {
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org/tx/',
    name: 'Base Sepolia',
  },
  'base-mainnet': {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org/tx/',
    name: 'Base Mainnet',
  },
};

function getRpcUrl(chain: SupportedChain): string {
  const envKey = `BLOCKCHAIN_RPC_${chain.toUpperCase().replace('-', '_')}`;
  return process.env[envKey] || CHAIN_CONFIG[chain].rpcUrl;
}

function getPrivateKey(): string | undefined {
  return process.env.BLOCKCHAIN_ANCHOR_PRIVATE_KEY;
}

async function sendTransaction(
  chain: SupportedChain,
  to: string,
  data: string,
  value: string = '0'
): Promise<AnchorResult> {
  const privateKey = getPrivateKey();
  if (!privateKey) {
    return { success: false, error: 'BLOCKCHAIN_ANCHOR_PRIVATE_KEY not configured' };
  }

  const rpcUrl = getRpcUrl(chain);

  try {
    const { createWalletClient, createPublicClient, http, parseAbi } = await import('viem');
    const { privateKeyToAccount } = await import('viem/accounts');
    const { polygonAmoy, polygon, baseSepolia, base } = await import('viem/chains');

    const chainConfig = chain === 'polygon-amoy' ? polygonAmoy
      : chain === 'polygon-mainnet' ? polygon
      : chain === 'base-sepolia' ? baseSepolia
      : base;

    const account = privateKeyToAccount(`0x${privateKey}`);

    const walletClient = createWalletClient({
      account,
      chain: chainConfig,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(rpcUrl),
    });

    const anchorContractAbi = parseAbi([
      'function anchor(bytes32 dataHash) external returns (bytes32)',
      'function getAnchor(bytes32 dataHash) external view returns (uint256 timestamp, address anchorer)',
    ]);

    const dataHash = `0x${Buffer.from(data).toString('hex').padStart(64, '0')}` as `0x${string}`;

    const hash = await walletClient.writeContract({
      address: to as `0x${string}`,
      abi: anchorContractAbi,
      functionName: 'anchor',
      args: [dataHash],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: Number(receipt.blockNumber),
      blockTimestamp: new Date(Number(receipt.blockTimestamp) * 1000),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export class PolygonAmoyProvider implements BlockchainProvider {
  name = 'Polygon Amoy';
  chainId = 80002;

  constructor(private contractAddress: string) {}

  async anchor(data: string): Promise<AnchorResult> {
    return sendTransaction('polygon-amoy', this.contractAddress, data);
  }

  async verify(txHash: string): Promise<VerifyResult> {
    try {
      const { createPublicClient, http } = await import('viem');
      const { polygonAmoy } = await import('viem/chains');

      const publicClient = createPublicClient({
        chain: polygonAmoy,
        transport: http(getRpcUrl('polygon-amoy')),
      });

      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });

      return {
        success: true,
        confirmed: receipt.status === 'success',
        blockNumber: Number(receipt.blockNumber),
        blockTimestamp: new Date(Number(receipt.blockTimestamp) * 1000),
      };
    } catch (error) {
      return { success: false, confirmed: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  getExplorerUrl(txHash: string): string {
    return `${CHAIN_CONFIG['polygon-amoy'].explorerUrl}${txHash}`;
  }
}

export function getBlockchainProvider(chain: SupportedChain = 'polygon-amoy'): BlockchainProvider {
  if (!(chain in CHAIN_CONFIG)) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  const contractAddress = process.env[`BLOCKCHAIN_ANCHOR_CONTRACT_${chain.toUpperCase().replace('-', '_')}`];
  if (!contractAddress) {
    throw new Error(`BLOCKCHAIN_ANCHOR_CONTRACT_${chain.toUpperCase().replace('-', '_')} not configured`);
  }

  switch (chain) {
    case 'polygon-amoy':
      return new PolygonAmoyProvider(contractAddress);
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}

export function generateMerkleProof(leaves: string[], index: number): string[] {
  const hashedLeaves = leaves.map(leaf => `0x${Buffer.from(leaf).toString('hex').padStart(64, '0')}`);
  const proof: string[] = [];
  let level = hashedLeaves;
  let currentIndex = index;

  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      const combined = `0x${Buffer.from(left + right.slice(2)).toString('hex').padStart(64, '0')}`;
      nextLevel.push(combined);

      if (i === currentIndex || i + 1 === currentIndex) {
        proof.push(i === currentIndex ? right : left);
      }
    }
    level = nextLevel;
    currentIndex = Math.floor(currentIndex / 2);
  }

  return proof;
}

export function computeDataHash(entityType: string, entityId: string, data: Record<string, unknown>): string {
  const canonical = JSON.stringify({ entityType, entityId, data });
  return `0x${createHash('sha256').update(canonical).digest('hex')}`;
}