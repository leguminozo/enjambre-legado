// Normalizador fonético y léxico apícola para terreno (Chiloé/Chile).
// Resuelve errores comunes de speech-to-text (Whisper/WebSpeech),
// coloquialismos chilenos y números hablados antes de la extracción semántica.

const NUMEROS_ES: Record<string, number> = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  dieciséis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiuno: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
  treinta: 30,
  'treinta y uno': 31,
  'treinta y dos': 32,
  'treinta y tres': 33,
  'treinta y cuatro': 34,
  'treinta y cinco': 35,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
  cien: 100,
};

/** Reemplazos fonéticos y deslices acústicos frecuentes en terreno. */
const REGLAS_FONETICAS_APICOLAS: Array<{ re: RegExp; rep: string }> = [
  // Varroa y ácaros
  { re: /\b(?:barroa|barroas|varroas|acaro|acaros|baroa)\b/gi, rep: 'varroa' },
  // Operculado / perculado
  { re: /\b(?:perculad[ao]s?|operculad[ao]s?)\b/gi, rep: 'operculada' },
  // Realeras / celdas reales
  { re: /\b(?:celdas?\s+reales?|copaceldas?|copa\s+celdas?|realezas?)\b/gi, rep: 'realeras' },
  // Huérfana / sin reina
  { re: /\b(?:hu[eé]rfana|sin\s+madre|muerta\s+la\s+reina|perdi[oó]\s+la\s+reina|no\s+tiene\s+reina)\b/gi, rep: 'sin reina' },
  // Postura fresca / del día / huevos (indicio irrefutable de reina activa en últimas 72h)
  { re: /\b(?:postura\s+del\s+d[ií]a|postura\s+fresca|huevitos|huevecillos|huevos\s+frescos|postura\s+nueva)\b/gi, rep: 'postura fresca' },
  // Cría salteada o zanganera
  { re: /\b(?:cr[ií]a\s+)?(?:salteada|de\s+z[aá]ngano|zanganera)\b/gi, rep: 'cria zanganera' },
  // Marcos / cuadros / panales
  { re: /\b(?:marquitos?|panales?)\b/gi, rep: 'marcos' },
  // Cámara / cajón
  { re: /\b(?:cajones?|cajoncitos?)\b/gi, rep: 'camara' },
  // Alzas y medias alzas
  { re: /\bmedia\s+alza\b/gi, rep: 'alza' },
  { re: /\bprimera\s+alza\b/gi, rep: 'alza 1' },
  { re: /\bsegunda\s+alza\b/gi, rep: 'alza 2' },
  { re: /\btercera\s+alza\b/gi, rep: 'alza 3' },
  // Expresiones de cantidad coloquiales en campo
  { re: /\bun\s+par\s+(?:de\s+)?/gi, rep: '2 ' },
  { re: /\bmedio\s+caj[oó]n\s+(?:de\s+)?/gi, rep: '5 marcos de ' },
  { re: /\b(?:c[aá]mara|caj[oó]n)\s+(?:completo|lleno|a\s+tope|a\s+reventar)\b/gi, rep: '10 marcos cubiertos' },
  { re: /\b(?:a\s+reventar|a\s+tope|poblaci[oó]n\s+total)\b/gi, rep: 'poblacion muy fuerte' },
  // Temperamento
  { re: /\b(?:muy\s+picadora|agresiva|bravas?|enojadas?|atacando)\b/gi, rep: 'defensiva' },
  { re: /\b(?:tranquilas?|d[oó]ciles?)\b/gi, rep: 'mansa' },
];

/**
 * Normaliza un texto de dictado apícola eliminando acentos, estandarizando
 * términos fonéticos de terreno y convirtiendo números coloquiales.
 */
export function normalizeApiculturalText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita diacríticos manteniendo letras base
    .replace(/[.,;:¿?¡!()"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Aplicar reglas fonéticas y dialectales
  for (const { re, rep } of REGLAS_FONETICAS_APICOLAS) {
    text = text.replace(re, rep);
  }

  // Resolver rangos hablados tipo "tres o cuatro" -> toma el valor medio o superior
  text = text.replace(
    /\b(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:o|a)\s+(\d+|un[ao]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/gi,
    (_match, a, b) => {
      const numA = parseSpanishWordNumber(a) ?? parseInt(a, 10);
      const numB = parseSpanishWordNumber(b) ?? parseInt(b, 10);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return String(Math.round((numA + numB) / 2));
      }
      return b;
    },
  );

  return text.replace(/\s+/g, ' ').trim();
}

/** Convierte palabras numéricas a entero (1-100). */
export function parseSpanishWordNumber(word: string): number | null {
  const clean = word.toLowerCase().trim();
  if (/^\d+$/.test(clean)) {
    const n = Number(clean);
    return Number.isInteger(n) && n >= 0 && n <= 100 ? n : null;
  }
  return NUMEROS_ES[clean] ?? null;
}
