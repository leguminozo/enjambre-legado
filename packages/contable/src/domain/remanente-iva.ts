export interface RemanenteCF {
empresaId: string;
periodoId: string;
monto: number;
montoReajustado: number;
factorUTM: number;
}

export function calcularReajusteRemanente(
remanenteAnterior: number,
utmPeriodoAnterior: number,
utmPeriodoActual: number,
): { montoReajustado: number; factorUTM: number } {
if (utmPeriodoAnterior <= 0 || remanenteAnterior <= 0) {
return { montoReajustado: remanenteAnterior, factorUTM: 1 };
}

const factor = utmPeriodoActual / utmPeriodoAnterior;
const montoReajustado = Math.round(remanenteAnterior * factor);

return { montoReajustado, factorUTM: factor };
}

export function calcularRemanenteProximo(
debitoFiscal: number,
creditoFiscalTotal: number,
remanenteAnteriorReajustado: number,
): { ivaPagar: number; remanenteProximo: number } {
const creditoDisponible = creditoFiscalTotal + remanenteAnteriorReajustado;

if (debitoFiscal >= creditoDisponible) {
return {
ivaPagar: debitoFiscal - creditoDisponible,
remanenteProximo: 0,
};
}

return {
ivaPagar: 0,
remanenteProximo: creditoDisponible - debitoFiscal,
};
}
