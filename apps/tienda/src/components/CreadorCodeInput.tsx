'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, Check, AlertCircle, Loader2, Tag } from 'lucide-react';

interface CreadorCodeInputProps {
  onCodeValidated?: (data: {
    valido: boolean;
    nombre_publico: string;
    descuento_cliente: number;
    plataforma: string;
  } | null) => void;
  onDiscountChange?: (descuento: number) => void;
}

interface ValidationResult {
  valido: boolean;
  nombre_publico: string;
  descuento_cliente: number;
  plataforma: string;
}

export function CreadorCodeInput({ onCodeValidated, onDiscountChange }: CreadorCodeInputProps) {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const supabase = createClient();

  const validateCode = useCallback(async (codigo: string) => {
    if (codigo.length < 2) {
      setResult(null);
      setError(null);
      onCodeValidated?.(null);
      onDiscountChange?.(0);
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase
        .from('creadores')
        .select('nombre_publico, descuento_cliente, plataforma')
        .ilike('codigo_ref', codigo)
        .eq('estado', 'activo')
        .single();

      if (rpcError || !data) {
        setResult(null);
        setError('Código no válido');
        onCodeValidated?.(null);
        onDiscountChange?.(0);
        return;
      }

      const validated: ValidationResult = {
        valido: true,
        nombre_publico: data.nombre_publico,
        descuento_cliente: data.descuento_cliente,
        plataforma: data.plataforma,
      };

      setResult(validated);
      setError(null);
      onCodeValidated?.(validated);
      onDiscountChange?.(data.descuento_cliente);
    } catch {
      setError('Error al validar código');
      setResult(null);
      onCodeValidated?.(null);
      onDiscountChange?.(0);
    } finally {
      setValidating(false);
    }
  }, [onCodeValidated, onDiscountChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim().length >= 2) {
        validateCode(code.trim());
      } else {
        setResult(null);
        setError(null);
        onCodeValidated?.(null);
        onDiscountChange?.(0);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [code, validateCode, onCodeValidated, onDiscountChange]);

  const handleApply = () => {
    if (result?.valido) {
      setApplied(true);
    }
  };

  const handleRemove = () => {
    setCode('');
    setResult(null);
    setError(null);
    setApplied(false);
    onCodeValidated?.(null);
    onDiscountChange?.(0);
  };

  const plataformaEmoji: Record<string, string> = {
    instagram: '📸',
    tiktok: '🎵',
    youtube: '🎬',
    blog: '✍️',
    podcast: '🎙️',
    otro: '🌐',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag size={16} className="text-oro-miel-dark" />
        <p className="text-sm font-medium text-bosque-ulmo">¿Tienes un código de creador?</p>
      </div>

      {!applied ? (
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Ingresa tu código de referencia"
            maxLength={20}
            className="input-field text-sm font-mono tracking-wider uppercase pr-10"
            disabled={validating}
          />
          {validating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin text-oro-miel-dark" size={16} />
            </div>
          )}
          {!validating && result?.valido && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Check className="text-salud-optima" size={16} />
            </div>
          )}
          {!validating && error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="text-salud-riesgo" size={16} />
            </div>
          )}
        </div>
      ) : null}

      {result?.valido && !applied && (
        <div className="p-4 rounded-xl bg-salud-optima/5 border border-salud-optima/20 animate-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-oro-miel-glow/40 flex items-center justify-center text-sm">
                {plataformaEmoji[result.plataforma] || '🌟'}
              </div>
              <div>
                <p className="text-sm font-bold text-bosque-ulmo">{result.nombre_publico}</p>
                <p className="text-xs text-salud-optima font-medium">
                  <Sparkles size={12} className="inline mr-1" />
                  {result.descuento_cliente}% de descuento en tu compra
                </p>
              </div>
            </div>
            <button
              onClick={handleApply}
              className="btn btn-primary btn-sm"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {applied && result && (
        <div className="p-4 rounded-xl bg-oro-miel-glow/20 border border-oro-miel/20 animate-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-oro-miel-dark" />
              <div>
                <p className="text-sm font-bold text-bosque-ulmo">
                  Código <span className="font-mono text-oro-miel-dark">{code}</span> aplicado
                </p>
                <p className="text-xs text-oro-miel-dark">
                  {result.descuento_cliente}% de descuento cortesía de {result.nombre_publico}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-xs text-text-muted hover:text-salud-riesgo transition-colors underline"
            >
              Quitar
            </button>
          </div>
        </div>
      )}

      {error && !result && (
        <p className="text-xs text-salud-riesgo flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
