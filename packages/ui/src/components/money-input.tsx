'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import {
  type CurrencyCode,
  extractMoneyDigits,
  formatMoneyDigits,
  getCurrencyDefinition,
  getDefaultCurrency,
  moneyFromDigits,
} from '../lib/currency'

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** Monto en unidad mayor (pesos enteros / dólares). */
  value: number | null | undefined
  onValueChange: (value: number) => void
  /** Override de moneda; por defecto la de plataforma (CLP). */
  currency?: CurrencyCode
  /** Mostrar símbolo a la izquierda/derecha según definición. Default true. */
  showSymbol?: boolean
}

/**
 * Input de dinero as-you-type: el usuario tipea solo dígitos y los separadores
 * de miles (y decimales si aplica) aparecen solos según la moneda configurada.
 *
 * CLP: 8 → 80 → 800 → 8.000 → 80.000 …
 */
export function MoneyInput({
  value,
  onValueChange,
  currency,
  showSymbol = true,
  className,
  disabled,
  id,
  name,
  placeholder,
  onBlur,
  onFocus,
  ...rest
}: MoneyInputProps) {
  const code = currency ?? getDefaultCurrency()
  const def = getCurrencyDefinition(code)

  // Dígitos crudos en estado local para no perder ceros intermedios al tipear
  const [digits, setDigits] = React.useState(() =>
    value != null && value !== 0 ? String(Math.round(Math.abs(value) * Math.pow(10, def.decimalDigits))) : '',
  )
  const focusedRef = React.useRef(false)

  // Sincronizar desde fuera solo cuando no estamos editando
  React.useEffect(() => {
    if (focusedRef.current) return
    if (value == null || value === 0) {
      setDigits('')
      return
    }
    const factor = Math.pow(10, def.decimalDigits)
    setDigits(String(Math.round(Math.abs(value) * factor)))
  }, [value, def.decimalDigits])

  const display = formatMoneyDigits(digits, code)
  const symbolIsPrefix = def.symbolPosition === 'prefix'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = extractMoneyDigits(e.target.value)
    // Límite de seguridad (evita overflow en formularios)
    const capped = nextDigits.slice(0, 15)
    setDigits(capped)
    onValueChange(moneyFromDigits(capped, code))
  }

  const padLeft = showSymbol && symbolIsPrefix
  const padRight = showSymbol && !symbolIsPrefix

  return (
    <div className={cn('relative', className)}>
      {padLeft && (
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none"
          aria-hidden
        >
          {def.symbol}
        </span>
      )}
      <input
        {...rest}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        value={display}
        placeholder={placeholder ?? formatMoneyDigits('0', code)}
        onChange={handleChange}
        onFocus={(e) => {
          focusedRef.current = true
          onFocus?.(e)
        }}
        onBlur={(e) => {
          focusedRef.current = false
          // Normalizar ceros a la izquierda al salir
          if (digits) {
            const n = moneyFromDigits(digits, code)
            const factor = Math.pow(10, def.decimalDigits)
            setDigits(n === 0 ? '' : String(Math.round(Math.abs(n) * factor)))
          }
          onBlur?.(e)
        }}
        className={cn(
          'flex h-11 min-h-[44px] w-full rounded-lg border border-input bg-background py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'font-semibold tabular-nums',
          padLeft ? 'pl-8 pr-3' : padRight ? 'pl-3 pr-10' : 'px-3',
        )}
        aria-label={rest['aria-label'] ?? `Monto en ${def.label}`}
      />
      {padRight && (
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none"
          aria-hidden
        >
          {def.symbol}
        </span>
      )}
    </div>
  )
}
