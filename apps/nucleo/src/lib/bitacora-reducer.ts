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

export function reduceColmenaState(
  colmenaId: string,
  events: Array<{ created_at: string; tipo_accion: TipoAccionBitacora; payload: any }>
): ColmenaSnapshot {
  
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
    // Forzamos el tipado para que TS sepa que la unión es válida según tipo_accion
    const payloadWrapper = { tipo_accion: event.tipo_accion, data: event.payload } as BitacoraPayload;

    switch (payloadWrapper.tipo_accion) {
      case "INSPECCION": {
        const data = payloadWrapper.data;
        if (data.poblacion !== undefined) state.poblacion_cuadros = data.poblacion;
        if (data.cria_abierta !== undefined) state.cria_abierta = data.cria_abierta;
        if (data.cria_sellada !== undefined) state.cria_sellada = data.cria_sellada;
        if (data.miel !== undefined) state.miel = data.miel;
        if (data.polen !== undefined) state.polen = data.polen;
        if (data.vacios_trabajados !== undefined) state.vacios_trabajados = data.vacios_trabajados;
        
        if (data.reina_vista) {
          state.reina_estado = "PRESENTE";
        }

        state.ultima_inspeccion_fecha = event.created_at;
        break;
      }

      case "COSECHA": {
        const data = payloadWrapper.data;
        if (data.unidad === "cuadros" && data.cantidad) {
          state.miel = Math.max(0, state.miel - data.cantidad);
        }
        break;
      }

      case "ALIMENTACION": {
        break;
      }

      case "TRATAMIENTO": {
        const data = payloadWrapper.data;
        state.ultimo_tratamiento_fecha = event.created_at;
        state.ultimo_tratamiento_nombre = data.producto;
        break;
      }

      case "TRANSICION": {
        const data = payloadWrapper.data;
        if (data.tipo_transicion === "CAMBIO_REINA") {
          state.reina_estado = "PRESENTE";
        } else if (data.tipo_transicion === "REINA_ZANGANERA" || data.tipo_transicion === "REINA_AUSENTE") {
          state.reina_estado = "HUERFANA";
        } else if (data.tipo_transicion === "NUCLEO_A_COLMENA") {
          // Crece poblacion asumiendo nucleo estandar de 5
          state.poblacion_cuadros = Math.min(10, state.poblacion_cuadros + 5);
        }
        break;
      }
    }
  }

  return state;
}
