// Utilidades de RUT para el cliente (validación de formularios).
// La autoridad de validación en el servidor es @enjambre/contable (validarRUT),
// usada en el BFF; aquí se replica el algoritmo módulo 11 para feedback inmediato.

const CLEAN_RUT_REGEX = /[^0-9kK]/g;

export function normalizarRUT(rut: string): string {
  return rut.replace(CLEAN_RUT_REGEX, "").toUpperCase();
}

function calcularDigitoVerificador(cuerpo: number): string {
  let suma = 0;
  let multiplo = 2;
  let resto = cuerpo;
  while (resto > 0) {
    suma += (resto % 10) * multiplo;
    resto = Math.floor(resto / 10);
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const dv = 11 - (suma % 11);
  if (dv === 11) return "0";
  if (dv === 10) return "K";
  return String(dv);
}

export function validarRUT(rut: string): boolean {
  const limpio = normalizarRUT(rut);
  if (limpio.length < 2) return false;
  const cuerpo = parseInt(limpio.slice(0, -1), 10);
  const dv = limpio.slice(-1);
  if (Number.isNaN(cuerpo)) return false;
  return calcularDigitoVerificador(cuerpo) === dv;
}

export function formatearRUT(rut: string): string {
  const limpio = normalizarRUT(rut);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv}`;
}
