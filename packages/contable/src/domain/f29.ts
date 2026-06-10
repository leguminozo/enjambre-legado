export interface F29Linea {
codigo: number;
descripcion: string;
monto: number;
}

export interface F29Resultado {
lineas: F29Linea[];
ivaPagar: number;
remanenteProximoPeriodo: number;
ppmDeterminado: number;
totalPagar: number;
}

export interface F29Input {
debitoFacturas: number;
debitoBoletasAfectas: number;
debitoNotasDebito: number;
creditoFacturasNacionales: number;
creditoFacturaCompraDigital: number;
remanenteCFAnteriorReajustado: number;
retencionHonorarios: number;
ppmBase: number;
ppmTasa: number;
ppmMonto: number;
}

export const F29_CODIGO = {
DEBITO_FACTURAS_VENTA: 503,
DEBITO_FACTURAS_EXENTAS: 502,
DEBITO_BOLETAS: 110,
DEBITO_BOLETAS_EXENTAS: 111,
TOTAL_DEBITOS: 538,
CREDITO_COMPRAS_NACIONALES: 503,
CANTIDAD_DOCS_DIGITAL: 519,
MONTO_NETO_DIGITAL: 520,
IVA_DIGITAL_CAMBIO_SUJETO: 511,
REMANENTE_CF_ANTERIOR: 504,
TOTAL_CREDITOS: 537,
IVA_PAGAR: 89,
REMANENTE_PROXIMO: 77,
RETENCION_HONORARIOS: 151,
PPM_BASE_INGRESOS: 563,
PPM_TASA: 115,
PPM_MONTO: 62,
} as const;

export function calcularF29(input: F29Input): F29Resultado {
const totalDebitos = input.debitoFacturas + input.debitoBoletasAfectas + input.debitoNotasDebito;

const totalCreditos =
input.creditoFacturasNacionales +
input.creditoFacturaCompraDigital +
input.remanenteCFAnteriorReajustado;

const ivaPagar = Math.max(0, totalDebitos - totalCreditos);
const remanenteProximoPeriodo = Math.max(0, totalCreditos - totalDebitos);

const totalPagar = ivaPagar + input.retencionHonorarios + input.ppmMonto;

const montoNetoDigital = input.creditoFacturaCompraDigital > 0
? Math.round(input.creditoFacturaCompraDigital / 0.19)
: 0;

const lineas: F29Linea[] = [
{
codigo: F29_CODIGO.DEBITO_FACTURAS_VENTA,
descripcion: "Debito fiscal facturas de venta (linea 7)",
monto: input.debitoFacturas,
},
{
codigo: F29_CODIGO.DEBITO_BOLETAS,
descripcion: "Debito fiscal boletas electronicas (linea 10)",
monto: input.debitoBoletasAfectas,
},
{
codigo: F29_CODIGO.DEBITO_BOLETAS_EXENTAS,
descripcion: "Debito boletas exentas (linea 10 cod 111)",
monto: 0,
},
{
codigo: F29_CODIGO.TOTAL_DEBITOS,
descripcion: "Total debitos fiscales (linea 23 cod 538)",
monto: totalDebitos,
},
{
codigo: F29_CODIGO.CREDITO_COMPRAS_NACIONALES,
descripcion: "Credito fiscal compras nacionales (linea 28-29)",
monto: input.creditoFacturasNacionales,
},
{
codigo: F29_CODIGO.CANTIDAD_DOCS_DIGITAL,
descripcion: "Cantidad documentos servicios digitales extranjeros (cambio sujeto)",
monto: 0,
},
{
codigo: F29_CODIGO.MONTO_NETO_DIGITAL,
descripcion: "Monto neto compras servicios digitales extranjeros",
monto: montoNetoDigital,
},
{
codigo: F29_CODIGO.IVA_DIGITAL_CAMBIO_SUJETO,
descripcion: "IVA autoliquidado servicios digitales (cambio sujeto)",
monto: input.creditoFacturaCompraDigital,
},
{
codigo: F29_CODIGO.REMANENTE_CF_ANTERIOR,
descripcion: "Remanente credito fiscal mes anterior reajustado (linea 36 cod 504)",
monto: input.remanenteCFAnteriorReajustado,
},
{
codigo: F29_CODIGO.TOTAL_CREDITOS,
descripcion: "Total creditos fiscales (linea 49 cod 537)",
monto: totalCreditos,
},
{
codigo: F29_CODIGO.IVA_PAGAR,
descripcion: "IVA por pagar (linea 50 cod 89)",
monto: ivaPagar,
},
{
codigo: F29_CODIGO.REMANENTE_PROXIMO,
descripcion: "Remanente credito fiscal para proximo periodo (linea 50 cod 77)",
monto: remanenteProximoPeriodo,
},
{
codigo: F29_CODIGO.RETENCION_HONORARIOS,
descripcion: "Retencion rentas art. 42 N 2 - honorarios (linea 61 cod 151)",
monto: input.retencionHonorarios,
},
{
codigo: F29_CODIGO.PPM_BASE_INGRESOS,
descripcion: "Base ingresos brutos PPM (linea 69 cod 563)",
monto: input.ppmBase,
},
{
codigo: F29_CODIGO.PPM_TASA,
descripcion: "Tasa PPM (linea 69 cod 115)",
monto: input.ppmTasa,
},
{
codigo: F29_CODIGO.PPM_MONTO,
descripcion: "PPM determinado (linea 69 cod 62)",
monto: input.ppmMonto,
},
];

return {
lineas,
ivaPagar,
remanenteProximoPeriodo,
ppmDeterminado: input.ppmMonto,
totalPagar,
};
}
