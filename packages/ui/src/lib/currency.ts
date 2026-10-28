/**
 * Moneda ampliable: definiciones + formato + parseo as-you-type.
 * La plataforma fija el default (hoy CLP); el futuro USD/EUR solo cambia el code.
 */

export type CurrencyCode = 'CLP' | 'USD' | 'EUR'

export interface CurrencyDefinition {
  code: CurrencyCode
  /** Locale BCP 47 para Intl de respaldo */
  locale: string
  /** Símbolo mostrado junto al monto (prefijo/sufijo) */
  symbol: string
  symbolPosition: 'prefix' | 'suffix'
  /** Decimales en montos canónicos (CLP = 0, USD = 2) */
  decimalDigits: number
  thousandSeparator: string
  decimalSeparator: string
  /** Nombre legible para UI de configuración */
  label: string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyDefinition> = {
  CLP: {
    code: 'CLP',
    locale: 'es-CL',
    symbol: '$',
    symbolPosition: 'prefix',
    decimalDigits: 0,
    thousandSeparator: '.',
    decimalSeparator: ',',
    label: 'Peso chileno (CLP)',
  },
  USD: {
    code: 'USD',
    locale: 'en-US',
    symbol: 'US$',
    symbolPosition: 'prefix',
    decimalDigits: 2,
    thousandSeparator: ',',
    decimalSeparator: '.',
    label: 'Dólar estadounidense (USD)',
  },
  EUR: {
    code: 'EUR',
    locale: 'es-ES',
    symbol: '€',
    symbolPosition: 'suffix',
    decimalDigits: 2,
    thousandSeparator: '.',
    decimalSeparator: ',',
    label: 'Euro (EUR)',
  },
}

/** Default de plataforma — reemplazable vía setDefaultCurrency / config. */
let platformCurrency: CurrencyCode = 'CLP'

export function getDefaultCurrency(): CurrencyCode {
  return platformCurrency
}

export function setDefaultCurrency(code: CurrencyCode): void {
  if (!(code in CURRENCIES)) {
    throw new Error(`Moneda no soportada: ${code}`)
  }
  platformCurrency = code
}

export function getCurrencyDefinition(code?: CurrencyCode): CurrencyDefinition {
  return CURRENCIES[code ?? platformCurrency] ?? CURRENCIES.CLP
}

/**
 * Formatea un monto numérico (unidad mayor: pesos, dólares).
 * CLP: `$8.000` — USD: `US$8,000.50` — EUR: `8.000,50 €`
 */
export function formatMoney(amount: number, code?: CurrencyCode): string {
  const def = getCurrencyDefinition(code)
  if (!Number.isFinite(amount)) amount = 0

  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  let integerPart: string
  let fractionPart = ''

  if (def.decimalDigits === 0) {
    integerPart = String(Math.round(abs))
  } else {
    const fixed = abs.toFixed(def.decimalDigits)
    const [intRaw, fracRaw = ''] = fixed.split('.')
    integerPart = intRaw ?? '0'
    fractionPart = fracRaw
  }

  const grouped = groupThousands(integerPart, def.thousandSeparator)
  const body =
    def.decimalDigits > 0 && fractionPart
      ? `${grouped}${def.decimalSeparator}${fractionPart}`
      : grouped

  if (def.symbolPosition === 'prefix') {
    return `${sign}${def.symbol}${body}`
  }
  return `${sign}${body}\u00a0${def.symbol}`
}

/**
 * Compacto para KPIs: `$1,5K` / `$2,5M` con la moneda activa.
 */
export function formatMoneyCompact(amount: number, code?: CurrencyCode): string {
  const def = getCurrencyDefinition(code)
  if (!Number.isFinite(amount)) amount = 0
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  const dec = def.decimalSeparator

  let body: string
  if (abs >= 1_000_000) {
    const n = abs / 1_000_000
    body = `${n.toFixed(1).replace(/\.0$/, '').replace('.', dec)}M`
  } else if (abs >= 1_000) {
    const n = abs / 1_000
    body = `${n.toFixed(1).replace(/\.0$/, '').replace('.', dec)}K`
  } else {
    return formatMoney(amount, code)
  }

  if (def.symbolPosition === 'prefix') return `${sign}${def.symbol}${body}`
  return `${sign}${body}\u00a0${def.symbol}`
}

/** Solo dígitos de un string (para as-you-type). */
export function extractMoneyDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

/**
 * Dígitos crudos → display con separadores de miles (sin símbolo).
 * CLP: "8000" → "8.000" ; "80000" → "80.000"
 */
export function formatMoneyDigits(digits: string, code?: CurrencyCode): string {
  const def = getCurrencyDefinition(code)
  const clean = extractMoneyDigits(digits)
  if (!clean) return ''

  if (def.decimalDigits === 0) {
    // Evitar ceros a la izquierda salvo "0"
    const normalized = clean.replace(/^0+(?=\d)/, '') || '0'
    return groupThousands(normalized, def.thousandSeparator)
  }

  // Con decimales: últimos N dígitos = fracción
  const padded = clean.padStart(def.decimalDigits + 1, '0')
  const frac = padded.slice(-def.decimalDigits)
  const intPart = padded.slice(0, -def.decimalDigits).replace(/^0+(?=\d)/, '') || '0'
  return `${groupThousands(intPart, def.thousandSeparator)}${def.decimalSeparator}${frac}`
}

/**
 * Display o dígitos → número en unidad mayor (pesos enteros / dólares).
 * "8.000" | "8000" | "$8.000" → 8000
 */
export function parseMoneyInput(raw: string, code?: CurrencyCode): number {
  const def = getCurrencyDefinition(code)
  if (!raw || !String(raw).trim()) return 0

  const digits = extractMoneyDigits(raw)
  if (!digits) return 0

  if (def.decimalDigits === 0) {
    const n = parseInt(digits, 10)
    return Number.isFinite(n) ? n : 0
  }

  const padded = digits.padStart(def.decimalDigits + 1, '0')
  const frac = padded.slice(-def.decimalDigits)
  const intPart = padded.slice(0, -def.decimalDigits) || '0'
  const n = parseFloat(`${intPart}.${frac}`)
  return Number.isFinite(n) ? n : 0
}

/**
 * A partir del valor numérico actual + tecla de dígitos del input controlado.
 * Usado cuando el input muestra texto formateado y el value canónico es number.
 */
export function moneyFromDigits(digits: string, code?: CurrencyCode): number {
  return parseMoneyInput(digits, code)
}

/**
 * Normaliza un string numérico con formato chileno / hispano a formato numérico estándar JS.
 * - "1.000" -> "1000" (miles con punto, siempre que no empiece con 0.)
 * - "1.250.000" -> "1250000"
 * - "15,5" -> "15.5" (decimal con coma)
 * - "1.500,5" -> "1500.5" (miles con punto y decimal con coma)
 * - "0.650" -> "0.650" (fracción menor a 1 con punto decimal)
 * - "$1.290" -> "1290"
 */
export function normalizeNumericStringCLP(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  const str = String(raw).trim().replace(/[$ \s]/g, '')
  if (!str) return ''

  // Patrón de miles con punto: ej. "1.000", "25.000", "1.250.000" (nunca empieza con 0.)
  if (/^-?[1-9]\d{0,2}(\.\d{3})+(,\d*)?$/.test(str)) {
    return str.replace(/\./g, '').replace(',', '.')
  }

  // Si contiene coma decimal (ej. "15,5", "15,", "1.500,5")
  if (str.includes(',')) {
    return str.replace(/\./g, '').replace(',', '.')
  }

  return str
}

/**
 * Parsea un número en contexto chileno / general (admite decimales y miles con punto).
 * Soporta:
 * - "1000" y "1.000" -> 1000
 * - "15.000" -> 15000
 * - "15,5" y "15.5" -> 15.5
 * - "0.650" y "0,650" -> 0.65
 * - "$1.290" -> 1290
 */
export function parseNumberCLP(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback

  const normalized = normalizeNumericStringCLP(value)
  if (!normalized) return fallback

  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * Parsea enteros para montos en CLP o conteos de unidades.
 * "1000" | "1.000" | "1,000" | "$1.290" -> 1000 / 1290
 */
export function parseIntegerCLP(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : fallback

  const clean = String(value).replace(/[$ \s]/g, '').trim()
  if (!clean) return fallback

  const normalized = clean.replace(/[.,]/g, '')
  const parsed = parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function groupThousands(integerDigits: string, sep: string): string {
  if (!integerDigits) return '0'
  // Insertar sep cada 3 dígitos desde la derecha
  return integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}
