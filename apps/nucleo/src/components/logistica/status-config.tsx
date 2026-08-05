import { Clock, Package, Navigation, CheckCircle2 } from 'lucide-react';

export const ENVIO_STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  pendiente: { color: 'bg-warning/15 text-warning border-warning/30', icon: <Clock size={14} /> },
  Programado: { color: 'bg-warning/15 text-warning border-warning/30', icon: <Clock size={14} /> },
  Empacando: { color: 'bg-accent/15 text-accent border-accent/30', icon: <Package size={14} /> },
  empacando: { color: 'bg-accent/15 text-accent border-accent/30', icon: <Package size={14} /> },
  'En tránsito': { color: 'bg-info/15 text-info border-info/30', icon: <Navigation size={14} /> },
  en_transito: { color: 'bg-info/15 text-info border-info/30', icon: <Navigation size={14} /> },
  Entregado: { color: 'bg-success/15 text-success border-success/30', icon: <CheckCircle2 size={14} /> },
  entregado: { color: 'bg-success/15 text-success border-success/30', icon: <CheckCircle2 size={14} /> },
};

export function getEnvioStatusConfig(status: string) {
  return (
    ENVIO_STATUS_CONFIG[status] ?? {
      color: 'bg-surface-raised text-muted-foreground border-border',
      icon: <Clock size={14} />,
    }
  );
}
