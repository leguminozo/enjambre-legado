import type { WidgetContexto, WidgetDef } from './types';
import { WidgetOraculoFenologico } from './oraculo-fenologico/WidgetOraculoFenologico';
import { VentanasDeVuelo } from './ventanas-de-vuelo/VentanasDeVuelo';
import { EspectroVivo } from './espectro-vivo/EspectroVivo';
import { WidgetVozColmena } from './voz-colmena/WidgetVozColmena';

/**
 * Registro central de widgets. Para ampliar la lista: agregar un componente
 * autocontenido (se monta y consume sus propios datos) y declararlo aquí con
 * los contextos donde debe aparecer.
 *
 * “Última reflexión” se retiró: era un diario paralelo al Cuaderno de Campo.
 * Las notas de visita viven en hojas del cuaderno.
 */
export const WIDGETS: WidgetDef[] = [
  {
    key: 'oraculo-fenologico',
    titulo: 'Oráculo Fenológico (GDD)',
    descripcion: 'Grados-Día acumulados por especie melífera nativa (GBIF · iNaturalist · ERA5).',
    Componente: WidgetOraculoFenologico,
    contextos: ['apicultor', 'inicio-territorial'],
  },
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
