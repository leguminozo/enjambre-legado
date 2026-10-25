/**
 * @enjambre/ui — Narrativas y microcopy humanizado
 * Vocabulario canónico y textos contextuales para guiar al usuario
 * sin jerga técnica de base de datos ni frialdad burocrática.
 */

export interface EmptyStateNarrative {
  title: string;
  description: string;
  suggestion?: string;
  actionLabel?: string;
}

/**
 * Textos canónicos para vistas vacías por dominio o contexto.
 */
export const CANONICAL_EMPTY_STATES: Record<string, EmptyStateNarrative> = {
  // Apicultura y colmenas (Núcleo)
  colmenas: {
    title: 'Tu apiario aguarda la primera colmena',
    description: 'Registra la primera colmena para comenzar el seguimiento de reinas, floración y reservas.',
    suggestion: 'Identifica la colmena con su número de cajón o nombre de fantasía.',
    actionLabel: 'Registrar Colmena',
  },
  cuaderno_campo: {
    title: 'Cuaderno al día',
    description: 'Aún no hay visitas ni observaciones registradas en este periodo.',
    suggestion: 'Anota la entrada de polen, el estado de la cría o tratamientos orgánicos.',
    actionLabel: 'Nueva Entrada de Bitácora',
  },
  cosechas: {
    title: 'Esperando la mielada',
    description: 'Aún no se han registrado recolecciones en esta temporada para este apiario.',
    suggestion: 'El oráculo fenológico te indicará las semanas óptimas de floración.',
    actionLabel: 'Registrar Recolección',
  },

  // Feria y terreno (Campo POS)
  feria_caja: {
    title: 'Caja lista para comenzar',
    description: 'Abre la sesión de caja con tu fondo inicial en efectivo para registrar ventas.',
    suggestion: 'Verifica tu sencillo para dar vuelto antes de la llegada de los primeros clientes.',
    actionLabel: 'Abrir Caja',
  },
  feria_ventas: {
    title: 'Jornada en marcha',
    description: 'Aún no registras ventas en esta sesión. Tu puesto está listo para conectar con los visitantes.',
    suggestion: 'Usa Venta Rápida para registrar un frasco en 4 toques.',
    actionLabel: 'Venta Rápida',
  },
  feria_incentivos: {
    title: 'Comienza a sumar en esta jornada',
    description: 'Aún no se han acumulado comisiones en este periodo.',
    suggestion: 'Cada venta te acerca al siguiente multiplicador de tu tramo.',
    actionLabel: 'Ver Ranking',
  },

  // Tienda y Guardián
  catalogo_vacio: {
    title: 'Néctar en reposo',
    description: 'No encontramos variedades que coincidan con estos filtros específicos.',
    suggestion: 'Prueba quitando algún filtro o explora toda nuestra colección de mieles nativas.',
    actionLabel: 'Ver Todo el Catálogo',
  },
  carrito_vacio: {
    title: 'Tu canasta está esperando',
    description: 'Aún no has sumado mieles o extractos del bosque a tu selección.',
    suggestion: 'Cada frasco financia el resguardo y vínculo de metros cuadrados de bosque virgen en Chiloé.',
    actionLabel: 'Explorar Creaciones',
  },
  historial_pedidos: {
    title: 'Tu legado está por comenzar',
    description: 'Aún no tienes pedidos registrados con esta cuenta.',
    suggestion: 'Al completar tu primer pedido recibirás tu Pasaporte Colmena con la trazabilidad de origen.',
    actionLabel: 'Descubrir Recolecciones',
  },

  // Finanzas y fiscal (Núcleo)
  rcv_vacio: {
    title: 'Periodo sin movimientos tributarios',
    description: 'No se registran documentos de compras o ventas para el mes seleccionado ante el SII.',
    suggestion: 'Los documentos emitidos en el POS y la tienda se sincronizan automáticamente.',
    actionLabel: 'Actualizar con SII',
  },
  suscripciones_vacias: {
    title: 'Planes de reposición en preparación',
    description: 'Aún no hay suscripciones periódicas activas registradas en el sistema.',
    suggestion: 'Configura un intervalo de reposición mensual o trimestral para tus guardianes frecuentes.',
    actionLabel: 'Crear Plan',
  },
} as const;

/**
 * Mensajes de progreso o carga que explican el proceso en lenguaje comprensible.
 */
export const NARRATIVE_LOADING_MESSAGES = {
  sincronizando_offline: 'Guardando en la memoria del dispositivo...',
  sincronizando_colmena: 'Conectando con la colmena central...',
  calculando_origen: 'Consultando la trazabilidad del lote...',
  verificando_pago: 'Confirmando con la pasarela segura...',
  generando_documento: 'Preparando el documento con el SII...',
} as const;

/**
 * Limpia y humaniza cadenas que contienen jerga técnica de base de datos.
 */
export function humanizeTechnicalPhrase(input: string): string {
  if (!input) return '';

  return input
    .replace(/\b\d+_[a-z0-9_]+\.sql\b/gi, 'actualización del sistema')
    .replace(/\b[a-z0-9_]+\.sql\b/gi, 'actualización del sistema')
    .replace(/pnpm (?:db:push|build|dev)/gi, 'sincronización del sistema')
    .replace(/incentivo_ledger/gi, 'historial de incentivos')
    .replace(/colmena_bitacora/gi, 'bitácora de la colmena')
    .replace(/varroa_records/gi, 'registros sanitarios')
    .replace(/batch_uuid/gi, 'código de lote')
    .replace(/user_id/gi, 'identificador de usuario')
    .replace(/\buuid\b/gi, 'código identificador')
    .replace(/data_payload/gi, 'datos registrados')
    .replace(/sha-?256/gi, 'sello digital')
    .replace(/on-chain/gi, 'en red oficial')
    .replace(/public\.[\w_]+/gi, 'registro del sistema')
    .replace(/relation "[^"]+" does not exist/gi, 'información no disponible temporalmente')
    .replace(/Failed to fetch/gi, 'No fue posible conectar con el servidor')
    .replace(/flow\.cl[^\n]*/gi, 'pasarela de pago')
    .replace(/\/payment\/[a-z0-9_]+/gi, 'servicio de pago')
    .replace(/no services available/gi, 'servicio de pagos no disponible temporalmente')
    .replace(/PGRST\d+/gi, 'consulta no completada');
}
