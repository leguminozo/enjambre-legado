import React from 'react';
import { ExternalLink, ShieldCheck, Database, Clock, Fingerprint } from 'lucide-react';
import { formatDate } from '@enjambre/ui';

interface BlockchainAnchor {
  id: string;
  empresa_id: string;
  entity_type: string;
  entity_id: string;
  tx_hash: string;
  chain: string;
  block_number: number | null;
  timestamp: string;
  data_hash: string;
  merkle_proof: any | null;
}

interface BlockchainCardProps {
  anchor: BlockchainAnchor;
}

export function BlockchainCard({ anchor }: BlockchainCardProps) {
  // Mapping network names to explorers
  const getExplorerUrl = (chain: string, txHash: string) => {
    switch (chain.toLowerCase()) {
      case 'polygon-amoy':
        return `https://amoy.polygonscan.com/tx/${txHash}`;
      case 'polygon-mainnet':
        return `https://polygonscan.com/tx/${txHash}`;
      case 'base-sepolia':
        return `https://sepolia.basescan.org/tx/${txHash}`;
      case 'base-mainnet':
        return `https://basescan.org/tx/${txHash}`;
      default:
        // Defaulting to the OKLink explorer used in Nucleo for amoy
        return `https://www.oklink.com/amoy/tx/${txHash}`;
    }
  };

  const getNetworkName = (chain: string) => {
    return chain.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const explorerUrl = getExplorerUrl(anchor.chain, anchor.tx_hash);
  const networkName = getNetworkName(anchor.chain);
  const formattedDate = formatDate(anchor.timestamp, { 
    dateStyle: 'long', 
    timeStyle: 'medium' 
  });

  const typeLabels: Record<string, string> = {
    colmena: 'Colmena de Origen',
    lote: 'Lote de Producción',
    cosecha: 'Cosecha del Bosque Nativo',
    apiario: 'Apiario Protegido'
  };

  const entityTypeLabel = typeLabels[anchor.entity_type] || anchor.entity_type;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
      {/* Decorative background element */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="p-6 md:p-8 relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-accent/20 p-2.5 rounded-xl text-accent">
              <ShieldCheck size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wider uppercase text-accent">Verificado</p>
              <h4 className="font-display text-xl text-foreground capitalize">
                {entityTypeLabel}
              </h4>
            </div>
          </div>
          
          <div className="bg-secondary/80 backdrop-blur-md px-4 py-2 rounded-full border border-border flex items-center gap-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-foreground tracking-wide">
              {networkName}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Timestamp Criptográfico</span>
            </div>
            <p className="text-sm text-foreground font-medium">{formattedDate}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Database size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Bloque</span>
            </div>
            <p className="text-sm font-mono text-foreground">
              {anchor.block_number ? `#${anchor.block_number.toLocaleString()}` : 'Confirmando...'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 bg-secondary/30 p-4 rounded-2xl border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Fingerprint size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">Hash de Transacción</span>
          </div>
          <p className="text-xs md:text-sm font-mono text-foreground break-all opacity-80 select-all">
            {anchor.tx_hash}
          </p>
        </div>

        <div className="pt-4 flex justify-end">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
          >
            Ver en Explorador
            <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
