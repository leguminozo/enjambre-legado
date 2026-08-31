import { BitacoraPayload, TipoAccionBitacora } from "./bitacora-ledger-schema";

export interface ColmenaSnapshot {
  colmena_id: string;
  fecha_calculo: string; // ISO DateTime
  
  // Biometría Actual
  poblacion_cuadros: number;
  cria_abierta: number;
  cria_sellada: number;
  miel: number;
  polen: number;
  vacios_trabajados: number;

  // Estado Vital
  reina_estado: "PRESENTE" | "HUERFANA" | "CELDA_REAL" | "VIRGEN" | "DESCONOCIDA";
  ultima_inspeccion_fecha: string | null;
  ultimo_tratamiento_fecha: string | null;
  ultimo_tratamiento_nombre: string | null;
}

/**
 * Motor CQRS: Toma el estado base (o vacío) y una lista ordenada (ascendente) de eventos inmutables,
 * y aplica las reglas de la física apícola para devolver la foto actual de la colmena.
 */
export function reduceColmenaState(
  colmenaId: string,
  events: Array<{ created_at: string; tipo_accion: TipoAccionBitacora; payload: any }>
): ColmenaSnapshot {
  
  // Estado Inicial
  const state: ColmenaSnapshot = {
    colmena_id: colmenaId,
    fecha_calculo: new Date().toISOString(),
    poblacion_cuadros: 0,
    cria_abierta: 0,
    cria_sellada: 0,
    miel: 0,
    polen: 0,
    vacios_trabajados: 0,
    reina_estado: "DESCONOCIDA",
    ultima_inspeccion_fecha: null,
    ultimo_tratamiento_fecha: null,
    ultimo_tratamiento_nombre: null,
  };

  for (const event of events) {
    const data = event.payload as BitacoraPayload["data"];

    switch (event.tipo_accion) {
      case "INSPECCION":
        // Una inspección sobreescribe la biometría (es una foto de la realidad)
        if (data.poblacion !== undefined) state.poblacion_cuadros = data.poblacion;
        if (data.cria_abierta !== undefined) state.cria_abierta = data.cria_abierta;
        if (data.cria_sellada !== undefined) state.cria_sellada = data.cria_sellada;
        if (data.miel !== undefined) state.miel = data.miel;
        if (data.polen !== undefined) state.polen = data.polen;
        if (data.vacios_trabajados !== undefined) state.vacios_trabajados = data.vacios_trabajados;
        
        if (data.reina_vista) {
          state.reina_estado = "PRESENTE";
        } else if (data.estado_poblacion === "ZANGANERA" || data.estado_poblacion === "MUERTA") {
          state.reina_estado = data.estado_poblacion === "ZANGANERA" ? "HUERFANA" : "DESCONOCIDA";
          state.poblacion_cuadros = data.estado_poblacion === "MUERTA" ? 0 : state.poblacion_cuadros;
        }

        state.ultima_inspeccion_fecha = event.created_at;
        break;

      case "COSECHA":
        // La cosecha resta cuadros de miel físicamente
        if (data.cuadros_cosechados) {
          state.miel = Math.max(0, state.miel - data.cuadros_cosechados);
        }
        break;

      case "ALIMENTACION":
        // Asumimos que no sube los cuadros de miel automáticamente en el snapshot,
        // depende de la próxima inspección confirmarlo.
        break;

      case "TRATAMIENTO":
        state.ultimo_tratamiento_fecha = event.created_at;
        state.ultimo_tratamiento_nombre = data.producto;
        break;

      case "TRANSICION":
        if (data.motivo === "CAMBIO_REINA") {
          state.reina_estado = "PRESENTE"; // Se asume introducida con éxito hasta la prox inspección
        } else if (data.motivo === "ENJAMBRAZON") {
          // Un enjambre que se va baja la población bruscamente a la mitad (heurística)
          state.poblacion_cuadros = Math.floor(state.poblacion_cuadros / 2);
          state.reina_estado = "CELDA_REAL"; // Quedan celdas reales de reemplazo
        } else if (data.motivo === "NUCLEO_CREADO") {
          // Si sacaron un núcleo, restamos los cuadros donados
          if (data.cuadros_donados) {
            state.poblacion_cuadros = Math.max(1, state.poblacion_cuadros - data.cuadros_donados);
          }
        }
        break;
    }
  }

  return state;
}
