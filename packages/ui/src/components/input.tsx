import React from 'react';
import { cn } from '../lib/utils';
import { normalizeNumericStringCLP } from '../lib/currency';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  id,
  className = '',
  type,
  value,
  onChange,
  onFocus,
  onBlur,
  inputMode,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const isNumeric = type === 'number';
  const isControlled = value !== undefined;

  const [focused, setFocused] = React.useState(false);
  const [draft, setDraft] = React.useState<string>(() =>
    value != null ? String(value) : ''
  );

  React.useEffect(() => {
    if (!focused && isControlled) {
      setDraft(value != null ? String(value) : '');
    }
  }, [value, focused, isControlled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNumeric) {
      const raw = e.target.value;
      if (isControlled) {
        setDraft(raw);
      }
      const normalized = normalizeNumericStringCLP(raw);
      if (normalized !== raw) {
        e.target.value = normalized;
      }
    }
    onChange?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isNumeric && isControlled) {
      setFocused(true);
      setDraft(value != null ? String(value) : '');
    }
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isNumeric) {
      setFocused(false);
      const normalized = normalizeNumericStringCLP(e.target.value);
      if (normalized !== e.target.value) {
        e.target.value = normalized;
      }
      if (isControlled) {
        setDraft(normalized);
      }
    }
    onBlur?.(e);
  };

  const resolvedValue = isControlled
    ? isNumeric && focused
      ? draft
      : value
    : undefined;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={isNumeric ? 'text' : type}
        inputMode={isNumeric ? (inputMode ?? 'decimal') : inputMode}
        value={resolvedValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          'w-full min-h-11 bg-surface-sunken/50 border border-border rounded-md px-4 py-3 text-foreground text-base placeholder:text-muted-foreground/50 transition-all duration-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-ring focus:ring-miel-glow disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-destructive focus:ring-destructive/30',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  id,
  className = '',
  ...props
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full bg-surface-sunken/50 border border-border rounded-md px-4 py-3 text-foreground text-base placeholder:text-muted-foreground/50 transition-all duration-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-ring focus:ring-miel-glow disabled:opacity-50 disabled:cursor-not-allowed min-h-[120px] resize-y',
          error && 'border-destructive focus:ring-destructive/30',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
