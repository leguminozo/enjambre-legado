import dynamic from 'next/dynamic';
import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import type { TerritorialAlertInput } from '@/lib/hive-state';

interface GemeloApiarioProps {
  colmenas?: ColmenaWithRelations[];
  apiarioName?: string;
  apiarioLat?: number | null;
  apiarioLng?: number | null;
  territorialAlerts?: TerritorialAlertInput[];
  onSelectColmena?: (colmena: ColmenaWithRelations) => void;
}

const GemeloApiarioBase = dynamic(
  () => import('./GemeloApiarioBase').then((mod) => mod.GemeloApiario),
  {
    ssr: false,
    loading: () => (
      <div className="card animate-pulse w-full h-[500px] bg-[#0c1410] border border-accent/15 flex items-center justify-center">
        <div className="text-muted-foreground text-sm font-datos flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          Cargando entorno 3D...
        </div>
      </div>
    ),
  },
);

export function GemeloApiario(props: GemeloApiarioProps) {
  return <GemeloApiarioBase {...props} />;
}
