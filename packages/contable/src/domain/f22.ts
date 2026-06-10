export interface F22Input {
  anioComercial: number;
  regimen: import("./ppm").RegimenTributario;
  baseImponibleTransparente: number;
  idpcPagada: number;
  ppmTotalPagado: number;
  retencionesHonorariosTotal: number;
  ivaDebitoAnual: number;
  ivaCreditoAnual: number;
}

export interface F22Linea {
  codigo: number;
  descripcion: string;
  monto: number;
}

export interface F22Resultado {
  lineas: F22Linea[];
  baseImponibleTransparente: number;
  idpcExenta: number;
  ppmCreditoPersonal: number;
  atribucionDueno: number;
}

export const F22_CODIGO = {
  BASE_IMPONIBLE_TRANSPARENCIA: 1609,
  IDPC_PAGADA: 1643,
  CREDITO_PPM_DJ1947: 1645,
  RETENCIONES_HONORARIOS: 1665,
  ATRIBUCION_UTILIDADES: 1610,
} as const;

export function calcularF22(input: F22Input): F22Resultado {
  const esTransparente = input.regimen === "pro_pyme_transparente";

  const idpcExenta = esTransparente ? 0 : input.idpcPagada;
  const atribucionDueno = esTransparente ? input.baseImponibleTransparente : 0;
  const ppmCreditoPersonal = esTransparente ? input.ppmTotalPagado : 0;

  const lineas: F22Linea[] = [
    {
      codigo: F22_CODIGO.BASE_IMPONIBLE_TRANSPARENCIA,
      descripcion: "Base imponible regimen transparencia (Art. 14 D N8) - codigo 1609",
      monto: esTransparente ? input.baseImponibleTransparente : 0,
    },
    {
      codigo: F22_CODIGO.ATRIBUCION_UTILIDADES,
      descripcion: "Utilidades atribuidas al dueno (codigo 1610)",
      monto: atribucionDueno,
    },
    {
      codigo: F22_CODIGO.CREDITO_PPM_DJ1947,
      descripcion: "Credito PPM DJ 1947 (codigo 1645 - GC personal dueno)",
      monto: ppmCreditoPersonal,
    },
    {
      codigo: F22_CODIGO.RETENCIONES_HONORARIOS,
      descripcion: "Retenciones honorarios pagadas en el ejercicio (codigo 1665)",
      monto: input.retencionesHonorariosTotal,
    },
  ];

  return {
    lineas,
    baseImponibleTransparente: esTransparente ? input.baseImponibleTransparente : 0,
    idpcExenta,
    ppmCreditoPersonal,
    atribucionDueno,
  };
}
