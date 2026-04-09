const CLEAN_RUT_REGEX = /[^0-9kK]/g;

const calcularDigitoVerificador = (rutNumerico: string): string => {
  let suma = 0;
  let multiplicador = 2;

  for (let i = rutNumerico.length - 1; i >= 0; i--) {
    suma += Number(rutNumerico[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
};

export const normalizarRUT = (rut: string): string => rut.replace(CLEAN_RUT_REGEX, "").toUpperCase();

export const validarRUT = (rut: string): boolean => {
  const normalizado = normalizarRUT(rut);
  if (normalizado.length < 2) return false;

  const cuerpo = normalizado.slice(0, -1);
  const dv = normalizado.slice(-1);

  if (!/^\d+$/.test(cuerpo)) return false;
  return calcularDigitoVerificador(cuerpo) === dv;
};

export const formatearRUT = (rut: string): string => {
  const normalizado = normalizarRUT(rut);
  if (normalizado.length < 2) return rut;

  const cuerpo = normalizado.slice(0, -1);
  const dv = normalizado.slice(-1);
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpoConPuntos}-${dv}`;
};
