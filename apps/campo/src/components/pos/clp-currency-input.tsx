'use client';

import React, { useCallback, useMemo } from 'react';
import { formatCLP } from '@enjambre/ui';

export interface ClpCurrencyInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
  presets?: number[];
  allowAddPresets?: boolean;
}

export function ClpCurrencyInput({
  value,
  onChange,
  placeholder = 'Ej: $20.000',
  className = '',
  disabled = false,
  autoFocus = false,
  id,
  name,
  presets,
  allowAddPresets = false,
}: ClpCurrencyInputProps) {
  const formattedDisplay = useMemo(() => {
    if (value === '' || value == null || isNaN(value)) return '';
    return new Intl.NumberFormat('es-CL').format(value);
  }, [value]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawDigits = e.target.value.replace(/\D/g, '');
      if (!rawDigits) {
        onChange('');
        return;
      }
      const num = parseInt(rawDigits, 10);
      onChange(isNaN(num) ? '' : num);
    },
    [onChange],
  );

  const handlePresetClick = useCallback(
    (presetValue: number) => {
      if (disabled) return;
      if (allowAddPresets) {
        const current = typeof value === 'number' ? value : 0;
        onChange(current + presetValue);
      } else {
        onChange(presetValue);
      }
    },
    [allowAddPresets, disabled, onChange, value],
  );

  return (
    <div className="space-y-2">
      <div className="relative flex items-center">
        <span
          className="absolute left-4 text-muted-foreground font-mono text-lg font-semibold pointer-events-none select-none"
          aria-hidden
        >
          $
        </span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          disabled={disabled}
          value={formattedDisplay}
          onChange={handleInputChange}
          placeholder={placeholder.replace(/^\$\s?/, '')}
          className={`w-full min-h-11 bg-background/40 border border-border rounded-lg pl-9 pr-4 py-3 text-foreground text-lg font-mono font-medium focus:border-primary focus:outline-none transition-colors disabled:opacity-50 ${className}`}
        />
      </div>

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => handlePresetClick(preset)}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-surface border border-border/70 hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-40"
            >
              {allowAddPresets ? `+${formatCLP(preset)}` : formatCLP(preset)}
            </button>
          ))}
          {allowAddPresets && typeof value === 'number' && value > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange('')}
              className="px-2 py-1 text-[11px] font-sans font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors ml-auto"
            >
              Limpiar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
