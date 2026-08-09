/**
 * Tabla anexa del instructivo SII "Agentes Retenedores de Cambios de Sujeto
 * de IVA" (Res. Ex. N° 107/2005): códigos de retención (parcial y total),
 * tasas y códigos CPCS de producto por cambio de sujeto. El código de
 * retención (columna 2/3) va en <CodImpAdic> del detalle del DTE; el código
 * CPCS (columna 6) en <VlrCodigo> con <TpoCodigo>CPCS</TpoCodigo>.
 */

export interface CambioSujetoProducto {
  /** Código del ítem (VlrCodigo, columna 6). */
  codigoItem: string;
  /** Producto según columna 5. */
  nombre: string;
  /** Unidad de medida 1 (columna 7). */
  unidadMedida: string;
  /** Unidad de medida 2 / referencia (columna 8). */
  unidadMedidaRef?: string;
}

export interface CambioSujeto {
  nombre: string;
  /** Código impuesto o retención parcial (columna 2). */
  codigoRetencion: number;
  /** Código cuando se aplica retención total en un cambio de sujeto de retención parcial (columna 3). */
  codigoRetencionTotal?: number;
  /** Tasa de retención parcial o anticipo (columna 4). undefined = siempre retención total del IVA. */
  tasaRetencion?: number;
  productos: CambioSujetoProducto[];
}

const KG = "KG";
const TON = "TON";
const UN = "UNID";
const SIN_UNIDAD = "S/ Unidad de Medida";

export const CAMBIOS_DE_SUJETO: CambioSujeto[] = [
  {
    nombre: "Arroz",
    codigoRetencion: 36,
    codigoRetencionTotal: 361,
    tasaRetencion: 10,
    productos: [{ codigoItem: "3600", nombre: "Arroz", unidadMedida: TON }],
  },
  {
    nombre: "Berries",
    codigoRetencion: 48,
    codigoRetencionTotal: 481,
    tasaRetencion: 14,
    productos: [
      { codigoItem: "4801", nombre: "Frambuesa fresca", unidadMedida: KG },
      { codigoItem: "4802", nombre: "Frambuesa congelada", unidadMedida: KG },
      { codigoItem: "4803", nombre: "Arándano (blueberry)", unidadMedida: KG },
      { codigoItem: "4804", nombre: "Arándano (blueberry) congelado", unidadMedida: KG },
      { codigoItem: "4805", nombre: "Arándana (cranberry)", unidadMedida: KG },
      { codigoItem: "4806", nombre: "Arándana (cranberry) congelada", unidadMedida: KG },
      { codigoItem: "4807", nombre: "Frutilla", unidadMedida: KG },
      { codigoItem: "4808", nombre: "Frutilla congelada", unidadMedida: KG },
      { codigoItem: "4809", nombre: "Mora cultivada y mora híbrida (boysenberry)", unidadMedida: KG },
      { codigoItem: "4810", nombre: "Mora cultivada y mora híbrida (boysenberry) congelada", unidadMedida: KG },
      { codigoItem: "4811", nombre: "Otros", unidadMedida: KG },
      { codigoItem: "4812", nombre: "Servicios de maquila", unidadMedida: SIN_UNIDAD },
    ],
  },
  {
    nombre: "Carne (Servicios de Faenamiento de Ganado)",
    codigoRetencion: 17,
    tasaRetencion: 5,
    productos: [
      { codigoItem: "1701", nombre: "Bovino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "1702", nombre: "Ovino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "1703", nombre: "Porcino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "1704", nombre: "Equino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "1705", nombre: "Caprino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "1706", nombre: "Camélido", unidadMedida: KG, unidadMedidaRef: UN },
    ],
  },
  {
    nombre: "Carne (Ventas de Carne)",
    codigoRetencion: 18,
    tasaRetencion: 5,
    productos: [
      { codigoItem: "1801", nombre: "Bovino", unidadMedida: KG },
      { codigoItem: "1802", nombre: "Ovino", unidadMedida: KG },
      { codigoItem: "1803", nombre: "Porcino", unidadMedida: KG },
      { codigoItem: "1804", nombre: "Equino", unidadMedida: KG },
      { codigoItem: "1805", nombre: "Caprino", unidadMedida: KG },
      { codigoItem: "1806", nombre: "Camélido", unidadMedida: KG },
    ],
  },
  {
    nombre: "Cartones",
    codigoRetencion: 47,
    productos: [
      { codigoItem: "4701", nombre: "Papel blanco", unidadMedida: KG },
      { codigoItem: "4702", nombre: "Cartón corrugado", unidadMedida: KG },
      { codigoItem: "4703", nombre: "Diarios", unidadMedida: KG },
      { codigoItem: "4704", nombre: "Otros", unidadMedida: KG },
    ],
  },
  {
    nombre: "Chatarra",
    codigoRetencion: 38,
    productos: [
      { codigoItem: "3801", nombre: "Acero dulce", unidadMedida: KG },
      { codigoItem: "3802", nombre: "Fierro", unidadMedida: KG },
      { codigoItem: "3803", nombre: "Cobre", unidadMedida: KG },
      { codigoItem: "3804", nombre: "Bronce", unidadMedida: KG },
      { codigoItem: "3805", nombre: "Latón", unidadMedida: KG },
      { codigoItem: "3806", nombre: "Aluminio", unidadMedida: KG },
      { codigoItem: "3807", nombre: "Otros", unidadMedida: KG },
      { codigoItem: "3808", nombre: "Servicios de maquila", unidadMedida: SIN_UNIDAD },
    ],
  },
  {
    nombre: "Construcción",
    codigoRetencion: 41,
    productos: [{ codigoItem: "4100", nombre: "Construcción", unidadMedida: SIN_UNIDAD }],
  },
  {
    nombre: "Especies Hidrobiológicas",
    codigoRetencion: 37,
    codigoRetencionTotal: 371,
    tasaRetencion: 10,
    productos: [
      { codigoItem: "3701", nombre: "Pescado", unidadMedida: TON },
      { codigoItem: "3702", nombre: "Moluscos", unidadMedida: TON },
      { codigoItem: "3703", nombre: "Crustáceos", unidadMedida: TON },
      { codigoItem: "3704", nombre: "Algas", unidadMedida: TON },
      { codigoItem: "3705", nombre: "Otros", unidadMedida: TON },
      { codigoItem: "3706", nombre: "Especies procesadas", unidadMedida: TON },
    ],
  },
  {
    nombre: "Ganado",
    codigoRetencion: 32,
    codigoRetencionTotal: 321,
    tasaRetencion: 8,
    productos: [
      { codigoItem: "3201", nombre: "Bovino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "3202", nombre: "Ovino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "3203", nombre: "Porcino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "3204", nombre: "Equino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "3205", nombre: "Caprino", unidadMedida: KG, unidadMedidaRef: UN },
      { codigoItem: "3206", nombre: "Camélido", unidadMedida: KG, unidadMedidaRef: UN },
    ],
  },
  {
    nombre: "Harina",
    codigoRetencion: 19,
    tasaRetencion: 12,
    productos: [{ codigoItem: "1900", nombre: "Harina", unidadMedida: TON }],
  },
  {
    nombre: "Legumbres",
    codigoRetencion: 30,
    codigoRetencionTotal: 301,
    tasaRetencion: 13,
    productos: [
      { codigoItem: "3001", nombre: "Frejoles", unidadMedida: TON },
      { codigoItem: "3002", nombre: "Lenteja", unidadMedida: TON },
      { codigoItem: "3003", nombre: "Garbanzo", unidadMedida: TON },
      { codigoItem: "3004", nombre: "Arvejas secas", unidadMedida: TON },
    ],
  },
  {
    nombre: "Madera",
    codigoRetencion: 33,
    codigoRetencionTotal: 331,
    tasaRetencion: 8,
    productos: [
      { codigoItem: "3301", nombre: "Bosque en pie", unidadMedida: "M3 o MR" },
      { codigoItem: "3302", nombre: "Astillas", unidadMedida: "M3, TBDM o TBDU" },
      { codigoItem: "3303", nombre: "Trozos pulpables", unidadMedida: "M3 o MR" },
      { codigoItem: "3304", nombre: "Trozos aserrables", unidadMedida: "M3" },
      { codigoItem: "3305", nombre: "Madera aserrada", unidadMedida: "M3, PP o PM" },
      { codigoItem: "3306", nombre: "Leña", unidadMedida: "KG o M3" },
      { codigoItem: "3307", nombre: "Otros", unidadMedida: "M3" },
    ],
  },
  {
    nombre: "Medios de Prepago de Telefonía e Internet",
    codigoRetencion: 50,
    productos: [
      { codigoItem: "5001", nombre: "Tarjeta de prepago para telefonía e Internet", unidadMedida: UN },
      { codigoItem: "5002", nombre: "Recarga electrónica de prepago para telefonía e Internet", unidadMedida: UN },
    ],
  },
  {
    nombre: "Pequeños Productores Agrícolas",
    codigoRetencion: 39,
    productos: [{ codigoItem: "3900", nombre: "Productos vendidos por el Pequeño Productor Agrícola PPA", unidadMedida: SIN_UNIDAD }],
  },
  {
    nombre: "Productos Silvestres",
    codigoRetencion: 31,
    productos: [
      { codigoItem: "3101", nombre: "Rosa mosqueta", unidadMedida: KG },
      { codigoItem: "3102", nombre: "Mora", unidadMedida: KG },
      { codigoItem: "3103", nombre: "Hongos", unidadMedida: KG },
      { codigoItem: "3104", nombre: "Frutos Espino", unidadMedida: KG },
      { codigoItem: "3105", nombre: "Hojas Boldo", unidadMedida: KG },
      { codigoItem: "3106", nombre: "Tilo", unidadMedida: KG },
      { codigoItem: "3107", nombre: "Manzanilla", unidadMedida: KG },
      { codigoItem: "3108", nombre: "Llantén", unidadMedida: KG },
      { codigoItem: "3109", nombre: "Toronjil", unidadMedida: KG },
      { codigoItem: "3110", nombre: "Cedrón", unidadMedida: KG },
      { codigoItem: "3111", nombre: "Hierbas pectorales", unidadMedida: KG },
      { codigoItem: "3112", nombre: "Romero", unidadMedida: KG },
      { codigoItem: "3113", nombre: "Quillay", unidadMedida: KG },
      { codigoItem: "3114", nombre: "Hierba de hipérico", unidadMedida: KG },
      { codigoItem: "3115", nombre: "Cera de abeja", unidadMedida: KG },
    ],
  },
  {
    nombre: "Trigo",
    codigoRetencion: 34,
    codigoRetencionTotal: 341,
    tasaRetencion: 11,
    productos: [{ codigoItem: "3400", nombre: "Trigo", unidadMedida: "TON o QTAL" }],
  },
];

/** Busca el cambio de sujeto al que pertenece un código CPCS (VlrCodigo). */
export function buscarCambioSujeto(codigoItem: string): CambioSujeto | undefined {
  return CAMBIOS_DE_SUJETO.find((cs) => cs.productos.some((p) => p.codigoItem === codigoItem));
}

/** Busca un producto CPCS por su código (VlrCodigo). */
export function buscarProductoCpcs(codigoItem: string): { cambioSujeto: CambioSujeto; producto: CambioSujetoProducto } | undefined {
  for (const cambioSujeto of CAMBIOS_DE_SUJETO) {
    const producto = cambioSujeto.productos.find((p) => p.codigoItem === codigoItem);
    if (producto) return { cambioSujeto, producto };
  }
  return undefined;
}
