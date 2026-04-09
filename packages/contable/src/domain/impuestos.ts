export const IVA = 0.19;

const roundCurrency = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error("Monto invalido");
  }
  return Number(value.toFixed(4));
};

export const calcularIVA = (montoNeto: number): number => {
  return roundCurrency(montoNeto * IVA);
};

export const calcularNetoDesdeTotal = (montoTotal: number): number => {
  return roundCurrency(montoTotal / (1 + IVA));
};

export const calcularTotal = (montoNeto: number, montoIva?: number): number => {
  const iva = montoIva ?? calcularIVA(montoNeto);
  return roundCurrency(montoNeto + iva);
};
