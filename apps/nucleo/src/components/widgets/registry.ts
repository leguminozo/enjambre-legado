import type { WidgetContexto, WidgetDef } from './types';
import { VentanasDeVuelo } from './ventanas-de-vuelo/VentanasDeVuelo';
import { EspectroVivo } from './espectro-vivo/EspectroVivo';
import { WidgetVozColmena } from './voz-colmena/WidgetVozColmena';

/**
 * Registro central de widgets del rail de Colmenas/Apiarios.
 *
 * El Oráculo Fenológico NO vive aquí: es herramienta propia de BOSQUE
 * (`/fenologia` → FenologiaView). Embebido en Campo generaba duplicación y
 * confusión de ownership.
 */
export const WIDGETS: WidgetDef[] = [
  {
    key: 'ventanas-de-vuelo',
    titulo: 'Ventanas de Vuelo',
    descripcion: 'Reloj de pecoreo 24h según Open-Meteo (exploratorio/admin).',
    Componente: VentanasDeVuelo,
    contextos: ['apicultor'],
    roles: ['admin'],
  },
  {
    key: 'espectro-vivo',
    titulo: 'Escucha Profunda',
    descripcion: 'Firma sonora del enjambre (bioacústica local/admin).',
    Componente: EspectroVivo,
    contextos: ['apicultor'],
    roles: ['admin'],
  },
  {
    key: 'voz-colmena',
    titulo: 'Voz de la Colmena',
    descripcion: 'Últimas notificaciones in_app del usuario.',
    Componente: WidgetVozColmena,
    contextos: ['apicultor'],
  },
];

export function widgetsPara(
  contexto: WidgetContexto,
  userRole?: string | null,
): WidgetDef[] {
  return WIDGETS.filter((w) => {
    if (!w.contextos.includes(contexto)) return false;
    if (w.roles && w.roles.length > 0) {
      if (!userRole) return false;
      return w.roles.includes(userRole);
    }
    return true;
  });
}
