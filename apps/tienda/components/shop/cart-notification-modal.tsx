'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartLines } from '@/components/shop/cart-context';
import { formatCLP } from '@/lib/shop/format';

export function CartNotificationModal() {
  const {
    isCartModalOpen,
    closeCartModal,
    lastNotification,
    itemCount,
    subtotal,
  } = useCartLines();

  const modalRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cierre con tecla Escape
  useEffect(() => {
    if (!isCartModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCartModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartModalOpen, closeCartModal]);

  // Cierre al hacer click fuera del modal
  useEffect(() => {
    if (!isCartModalOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeCartModal();
      }
    };
    // Esperamos un tick para no capturar el click que abrió el modal
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCartModalOpen, closeCartModal]);

  // Pausar auto-dismiss al pasar el mouse por encima
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      closeCartModal();
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  if (!isCartModalOpen) return null;

  return (
    <aside
      ref={modalRef}
      role="status"
      aria-live="polite"
      aria-label="Confirmación de producto añadido al carrito"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed right-3 left-3 sm:left-auto sm:right-6 md:right-8 top-[calc(var(--tienda-header-actual-h,4rem)+0.5rem)] z-[100] sm:w-[380px] max-w-full rounded-2xl border border-border/80 bg-card/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2"
    >
      {/* Triángulo apuntador hacia el ícono del carrito en desktop */}
      <div
        className="hidden sm:block absolute -top-1.5 right-6 w-3 h-3 rotate-45 border-t border-l border-border/80 bg-card"
        aria-hidden="true"
      />

      {/* Cabecera: confirmación y botón cerrar */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent">
            <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Agregado al carrito
          </p>
        </div>
        <button
          type="button"
          onClick={closeCartModal}
          className="rounded-full p-1 text-muted-foreground transition hover:bg-surface-raised hover:text-foreground cursor-pointer"
          aria-label="Cerrar notificación del carrito"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Detalle del producto recién agregado */}
      {lastNotification ? (
        <div className="flex items-center gap-3.5 py-3.5">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-surface-sunken">
            {lastNotification.photo ? (
              <Image
                src={lastNotification.photo}
                alt={lastNotification.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <h4 className="font-display text-sm sm:text-base font-semibold text-foreground line-clamp-1 leading-snug">
              {lastNotification.name}
            </h4>
            {lastNotification.format ? (
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {lastNotification.format}
              </span>
            ) : null}
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Cantidad: <strong className="font-mono text-foreground">{lastNotification.quantity}</strong>
              </span>
              <span className="font-mono font-bold text-accent-text tabular-nums">
                {formatCLP(lastNotification.price * lastNotification.quantity)}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Resumen del carrito */}
      <div className="pt-2 pb-3.5 border-t border-border/60">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">
            Total ({itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}):
          </span>
          <span className="font-mono text-base font-bold text-foreground tabular-nums">
            {formatCLP(subtotal)}
          </span>
        </div>
      </div>

      {/* Acciones para el cliente: Seguir comprando o Ir al carrito */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={closeCartModal}
          className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-border/90 px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-surface-raised active:scale-[0.98] cursor-pointer"
        >
          Seguir explorando
        </button>
        <Link
          href="/carrito"
          onClick={closeCartModal}
          className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <span>Ver carrito</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
