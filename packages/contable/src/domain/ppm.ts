export type RegimenTributario =
| "pro_pyme_transparente"
| "pro_pyme_general"
| "semi_integrado"
| "general";

export interface EmpresaRegimen {
regimen: RegimenTributario;
fechaInicioActividades: string | null;
ingresosBrutosAnioAnterior: number;
}

export interface PpmResult {
tasa: number;
tasaBase: number;
baseCalculo: number;
monto: number;
codigoBase: number;
codigoTasa: number;
codigoMonto: number;
esAnioInicio: boolean;
aplicaRebaja50: boolean;
}

const TASA_PPM_POR_REGIMEN: Record<RegimenTributario, { bajoUmbral: number; sobreUmbral: number }> = {
pro_pyme_transparente: { bajoUmbral: 0.0025, sobreUmbral: 0.005 },
pro_pyme_general: { bajoUmbral: 0.0025, sobreUmbral: 0.005 },
semi_integrado: { bajoUmbral: 0.01, sobreUmbral: 0.01 },
general: { bajoUmbral: 0.01, sobreUmbral: 0.01 },
};

const TASA_PPM_ANIO_INICIO: Record<RegimenTributario, number> = {
pro_pyme_transparente: 0.002,
pro_pyme_general: 0.002,
semi_integrado: 0.01,
general: 0.01,
};

const UMBRAL_UF_INGRESOS = 50000;

const REBAJA_50_ANIOS_COMERCIALES: ReadonlySet<number> = new Set([2025, 2026, 2027]);

function getAnioComercial(): number {
  const now = new Date();
  const utcYear = now.getUTCFullYear();
  const localYear = now.getFullYear();
  return localYear !== utcYear && now.getMonth() === 0 ? localYear : utcYear;
}

export function calcularPPM(empresa: EmpresaRegimen, ingresosBrutosPeriodo: number, valorUF: number, anioComercial?: number): PpmResult {
  const regimen = empresa.regimen;
  const anio = anioComercial ?? getAnioComercial();

  const esAnioInicio = Boolean(
    empresa.fechaInicioActividades &&
    parseInt(empresa.fechaInicioActividades.slice(0, 4), 10) === anio,
  );

const ingresosUF = empresa.ingresosBrutosAnioAnterior > 0 && valorUF > 0
? empresa.ingresosBrutosAnioAnterior / valorUF
: 0;

const bajoUmbral = ingresosUF <= UMBRAL_UF_INGRESOS;

  const aplicaRebaja50 = REBAJA_50_ANIOS_COMERCIALES.has(anio) &&
(regimen === "pro_pyme_transparente" || regimen === "pro_pyme_general");

let tasaBase: number;
if (esAnioInicio) {
tasaBase = TASA_PPM_ANIO_INICIO[regimen];
} else {
const tasas = TASA_PPM_POR_REGIMEN[regimen];
tasaBase = bajoUmbral ? tasas.bajoUmbral : tasas.sobreUmbral;
}

const tasa = aplicaRebaja50 ? tasaBase * 0.5 : tasaBase;

const monto = Math.round(ingresosBrutosPeriodo * tasa);

return {
tasa,
tasaBase,
baseCalculo: ingresosBrutosPeriodo,
monto,
codigoBase: 563,
codigoTasa: 115,
codigoMonto: 62,
esAnioInicio,
aplicaRebaja50,
};
}

export function esPymeTransparente(regimen: RegimenTributario): boolean {
return regimen === "pro_pyme_transparente";
}

export function esPymeGeneral(regimen: RegimenTributario): boolean {
return regimen === "pro_pyme_general";
}

export function calculaIDPC(regimen: RegimenTributario): boolean {
return regimen !== "pro_pyme_transparente";
}

export function getTasaIDPC(regimen: RegimenTributario, anioComercial: number): number {
if (regimen === "pro_pyme_transparente") return 0;
if (regimen === "pro_pyme_general" || regimen === "semi_integrado") {
if (anioComercial >= 2025 && anioComercial <= 2027) return 0.125;
if (anioComercial === 2028) return 0.15;
return 0.25;
}
return 0.25;
}
