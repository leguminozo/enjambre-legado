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
    descripcion: 'Reloj de pecoreo 24h según Open-Meteo.',
    Componente: VentanasDeVuelo,
    contextos: ['apicultor'],
  },
  {
    key: 'espectro-vivo',
    titulo: 'Escucha Profunda',
    descripcion: 'Firma sonora del enjambre (bioacústica local).',
    Componente: EspectroVivo,
    contextos: ['apicultor'],
  },
  {
    key: 'voz-colmena',
    titulo: 'Voz de la Colmena',
    descripcion: 'Últimas notificaciones in_app del usuario.',
    Componente: WidgetVozColmena,
    contextos: ['apicultor'],
  },
];

export function widgetsPara(contexto: WidgetContexto): WidgetDef[] {
  return WIDGETS.filter((w) => w.contextos.includes(contexto));
}
