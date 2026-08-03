import type { ColmenaWithRelations } from '@/lib/apicultor-types';
import type { HistorialColmena } from '@/lib/bitacora-types';

/** Props comunes de los tabs de trazabilidad/provenance de ColmenaFicha. */
export interface ColmenaTabProps {
  colmena: ColmenaWithRelations;
  /** Todas las colmenas del usuario (selector de colmena madre del linaje). */
  colmenas: ColmenaWithRelations[];
  /** Historial completo de la colmena (GET /api/bitacora/colmenas/:id). */
  historial: HistorialColmena | undefined;
  refetchHistorial: () => void;
  onUpdate: (c: ColmenaWithRelations) => void;
}
