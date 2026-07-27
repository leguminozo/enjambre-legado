'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSumUp } from './sumup-context';
import { ReaderSelector } from './reader-selector';
import type { SumUpReader, TerminalFlowResult } from './types';
import { HexagonLoader } from '@enjambre/ui';
import { CheckCircle2, XCircle, Clock, Smartphone, Wifi } from 'lucide-react';

interface Props {
  amount: number;
  checkoutReference: string;
  description?: string;
  onComplete: (result: TerminalFlowResult) => void;
  onCancel: () => void;
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

export function SumupTerminalFlow({ amount, checkoutReference, description, onComplete, onCancel }: Props) {
  const {
    terminalStep,
    setTerminalStep,
    activeCheckoutId,
    activeReaderId,
    startReaderCheckout,
    pollCheckoutStatus,
    cancelReaderCheckout,
    terminalResult,
    lastCheckoutError,
  } = useSumUp();

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedReaderRef = useRef<SumUpReader | null>(null);

  const handleSelectReader = useCallback(async (reader: SumUpReader) => {
    selectedReaderRef.current = reader;
    try {
      localStorage.setItem('sumup_preferred_reader_id', reader.id);
    } catch {
      /* ignore */
    }
    setTerminalStep('sending_to_terminal');

    const result = await startReaderCheckout(
      reader.id,
      amount,
      checkoutReference,
      description,
    );

    if (result.alreadyPaid && result.checkoutId) {
      setTerminalStep('paid');
      onComplete({
        checkout_id: result.checkoutId,
        status: 'PAID',
      });
      return;
    }

    if (!result.checkoutId) {
      setTerminalStep('failed');
      return;
    }

    setTerminalStep('waiting_payment');
  }, [amount, checkoutReference, description, startReaderCheckout, setTerminalStep, onComplete]);

  const cleanupPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (terminalStep !== 'waiting_payment' || !activeCheckoutId) return;

    pollRef.current = setInterval(async () => {
      const checkout = await pollCheckoutStatus(activeCheckoutId);
      if (!checkout) return;

      if (checkout.status === 'PAID') {
        cleanupPolling();
        const transactionId = checkout.transactions?.[0]?.id;
        const result: TerminalFlowResult = {
          checkout_id: checkout.id,
          transaction_id: transactionId,
          status: checkout.status,
        };
        setTerminalStep('paid');
        onComplete(result);
      } else if (checkout.status === 'FAILED') {
        cleanupPolling();
        setTerminalStep('failed');
      } else if (checkout.status === 'EXPIRED') {
        cleanupPolling();
        setTerminalStep('expired');
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      cleanupPolling();
      setTerminalStep('expired');
    }, POLL_TIMEOUT_MS);

    return cleanupPolling;
  }, [terminalStep, activeCheckoutId, pollCheckoutStatus, cleanupPolling, setTerminalStep, onComplete]);

  const handleCancel = useCallback(async () => {
    cleanupPolling();
    if (activeReaderId) {
      await cancelReaderCheckout(activeReaderId);
    }
    setTerminalStep('cancelled');
    onCancel();
  }, [cleanupPolling, activeReaderId, cancelReaderCheckout, setTerminalStep, onCancel]);

  const fmtCLP = (n: number) => '$' + n.toLocaleString('es-CL');

  if (terminalStep === 'idle' || terminalStep === 'selecting_reader') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 justify-center">
          <Smartphone className="w-5 h-5 text-primary" />
          <p className="text-sm font-bold text-foreground uppercase tracking-widest">
            Pago con Terminal
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Monto: <strong className="text-foreground">{fmtCLP(amount)}</strong>
        </p>
        <ReaderSelector onSelect={handleSelectReader} selectedReaderId={activeReaderId} />
        <button
          type="button"
          onClick={handleCancel}
          className="w-full min-h-11 inline-flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest hover:text-foreground text-center rounded-xl border border-border/60 bg-background/40"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (terminalStep === 'sending_to_terminal') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative">
          <Wifi className="w-8 h-8 text-primary" />
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-ping" />
        </div>
        <p className="text-sm font-bold text-foreground uppercase tracking-widest">
          Enviando al terminal...
        </p>
        <p className="text-xs text-muted-foreground">
          {selectedReaderRef.current?.name ?? 'Terminal'} · {fmtCLP(amount)}
        </p>
        <HexagonLoader size="sm" />
      </div>
    );
  }

  if (terminalStep === 'waiting_payment') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Clock className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-bold text-foreground uppercase tracking-widest">
          Esperando pago...
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Presenta o inserta la tarjeta en el terminal
        </p>
        <p className="text-2xl font-mono font-bold text-primary">{fmtCLP(amount)}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <HexagonLoader size="sm" />
          Verificando...
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="mt-2 min-h-11 min-w-[44px] px-4 inline-flex items-center justify-center text-xs text-destructive uppercase tracking-widest rounded-xl border border-destructive/30 hover:bg-destructive/10"
        >
          Cancelar cobro
        </button>
      </div>
    );
  }

  if (terminalStep === 'paid') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <p className="text-sm font-bold text-success uppercase tracking-widest">
          Pago Aprobado
        </p>
        {terminalResult?.transaction_id && (
          <p className="text-[10px] text-muted-foreground font-mono">
            TX: {terminalResult.transaction_id.slice(0, 12)}...
          </p>
        )}
      </div>
    );
  }

  if (terminalStep === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-sm font-bold text-destructive uppercase tracking-widest">
          Pago fallido
        </p>
        <p className="text-xs text-muted-foreground text-center px-4">
          {lastCheckoutError ||
            'La tarjeta fue rechazada o el cobro falló. Intentá de nuevo.'}
        </p>
        <button
          type="button"
          onClick={() => setTerminalStep('selecting_reader')}
          className="min-h-11 min-w-[44px] px-5 inline-flex items-center justify-center text-xs font-bold text-primary uppercase tracking-widest rounded-xl border border-primary/30 hover:bg-primary/10"
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="min-h-11 min-w-[44px] px-5 inline-flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    );
  }

  if (terminalStep === 'expired' || terminalStep === 'cancelled') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <p className="text-sm font-bold text-warning uppercase tracking-widest">
          {terminalStep === 'expired' ? 'Cobro Expirado' : 'Cobro Cancelado'}
        </p>
        <p className="text-xs text-muted-foreground text-center">
          {terminalStep === 'expired'
            ? 'El tiempo de espera se agoto. Intenta de nuevo.'
            : 'El cobro fue cancelado manualmente.'}
        </p>
        <button
          type="button"
          onClick={() => setTerminalStep('selecting_reader')}
          className="min-h-11 min-w-[44px] px-5 inline-flex items-center justify-center text-xs font-bold text-primary uppercase tracking-widest rounded-xl border border-primary/30 hover:bg-primary/10"
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="min-h-11 min-w-[44px] px-5 inline-flex items-center justify-center text-xs text-muted-foreground uppercase tracking-widest hover:text-foreground"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return null;
}
