'use client';

import React, { useState, useTransition } from 'react';
import { Calendar, Flower2, ShieldCheck, Sparkles, X, CheckCircle2, Loader2 } from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';

interface FloracionReservaModalProps {
  nombreComun: string;
  nombreCientifico: string;
  temporada: string;
  slug: string;
}

export function FloracionReservaModal({
  nombreComun,
  nombreCientifico,
  temporada,
  slug,
}: FloracionReservaModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [quantity, setQuantity] = useState(2);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast('Ingresa un correo electrónico válido', { type: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/pre-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            quantity,
            floracion_slug: slug,
            temporada,
            notas: `Reserva anticipada desde catálogo de floraciones: ${nombreComun}`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'No se pudo registrar la reserva');
        }

        setSuccess(true);
        toast(`Tu cupo para la recolección de ${nombreComun} ha sido reservado.`, {
          type: 'success',
          duration: 5000,
        });
      } catch (error) {
        toast(friendlyError(error, 'No fue posible registrar la reserva'), { type: 'error' });
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSuccess(false);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-primary/40 hover:border-primary bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold uppercase tracking-wider transition-colors"
      >
        <Calendar size={13} />
        <span>Reservar Próxima Recolección</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar modal"
              className="absolute top-5 right-5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
            >
              <X size={18} />
            </button>

            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-success/10 text-success border border-success/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 id="modal-title" className="font-display text-2xl text-foreground">
                  Cupo Reservado con Éxito
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hemos registrado tu reserva para la recolección de{' '}
                  <strong className="text-foreground">{nombreComun}</strong> ({temporada}). Te avisaremos por correo antes de la salida del lote para confirmar tu dirección de entrega.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:shadow-glow transition-all"
                  >
                    Aceptar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-bold">
                    <Sparkles size={12} />
                    <span>Asignación Anticipada de Origen</span>
                  </div>
                  <h3 className="font-display text-2xl text-foreground">
                    Reserva de {nombreComun}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono italic">
                    {nombreCientifico} · {temporada}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-sunken border border-border/60 text-xs text-muted-foreground space-y-1">
                  <p className="text-foreground font-medium flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-primary" />
                    Sin cobro inmediato
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Las floraciones nativas tienen tiradas limitadas sujetas al clima del bosque. Esta reserva asegura tu turno de compra antes del lanzamiento general.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Tu Correo de Contacto
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className="w-full bg-surface-raised border border-border rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Cantidad de Frascos (Formato 500g)
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuantity(num)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                            quantity === num
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-surface-raised border-border text-foreground hover:border-primary/50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Registrando...</span>
                      </>
                    ) : (
                      <span>Confirmar Reserva de Floración</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
