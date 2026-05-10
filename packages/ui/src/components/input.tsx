import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
  ...props
}: InputProps) {
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
      <input
        id={inputId}
        className={`
          w-full
          bg-surface-sunken/50
          border border-border
          rounded-md
          px-4 py-3
          text-foreground text-base
          placeholder:text-muted-foreground/50
          transition-all duration-base
          focus:outline-none focus:border-accent focus:ring-2 focus:ring-miel-glow
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-destructive focus:ring-destructive/30' : ''}
          ${className}
        `}
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
        className={`
          w-full
          bg-surface-sunken/50
          border border-border
          rounded-md
          px-4 py-3
          text-foreground text-base
          placeholder:text-muted-foreground/50
          transition-all duration-base
          focus:outline-none focus:border-accent focus:ring-2 focus:ring-miel-glow
          disabled:opacity-50 disabled:cursor-not-allowed
          min-h-[120px] resize-y
          ${error ? 'border-destructive focus:ring-destructive/30' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
