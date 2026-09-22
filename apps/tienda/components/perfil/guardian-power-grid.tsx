'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  Wallet,
  Repeat,
  Compass,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export interface GuardianPowerGridProps {
  totalOrders: number;
  hasAddress?: boolean;
  hasSubscription?: boolean;
  pointsBalance?: number;
}

export function GuardianPowerGrid({
  totalOrders,
  hasAddress = false,
  hasSubscription = false,
  pointsBalance = 100,
}: GuardianPowerGridProps) {
  const powers = [
    {
      id: 'billetera',
      title: 'Pase Digital & Billetera',
      badge: 'Sellos & Tarjeta',
      description:
        'Lleva tu Pase del Bosque en el teléfono. Suma sellos en compras reales de sachet y frascos para canjes físicos en feria con tu QR.',
      href: '/perfil/billetera',
      icon: <Wallet className="w-5 h-5 text-accent" />,
      cta: 'Abrir billetera',
    },
    {
      id: 'premios',
      title: 'Catálogo de Canje',
      badge: `${pointsBalance} pts listos`,
      description:
        'Tus puntos acumulados por compras y bienvenida se canjean por frascos exclusivos de autor, mieles de guarda y catas guiadas.',
      href: '/perfil/billetera',
      icon: <Award className="w-5 h-5 text-accent" />,
      cta: 'Explorar canjes',
    },
    {
      id: 'suscripciones',
      title: 'Suscripciones & Reservas',
      badge: hasSubscription ? 'Suscripción Activa' : 'Despensa Protegida',
      description:
        'Reposición programada en tu hogar o reserva anticipada de floraciones de temporada (Ulmo, Tiaca, Quillay) sin intermediarios.',
      href: '/perfil/reposicion',
      icon: <Repeat className="w-5 h-5 text-accent" />,
      cta: 'Gestionar despachos',
    },
    {
      id: 'trazabilidad',
      title: 'Origen & Trazabilidad',
      badge: 'Origen Verificado',
      description:
        'Escanea cualquier frasco con tu cámara para ver su colmena viva, predio en Chiloé, fecha de recolección y pureza polínica.',
      href: '/perfil/trazabilidad',
      icon: <Compass className="w-5 h-5 text-accent" />,
      cta: 'Verificar origen',
    },
    {
      id: 'alertas',
      title: 'Monitoreo de Floración',
      badge: 'Sensores del Bosque',
      description:
        'Avisos tempranos en tu campanita cuando el bosque nativo comienza a florecer en Chiloé y se abren cupos limitados de recolección.',
      href: '/perfil/reposicion',
      icon: <Bell className="w-5 h-5 text-accent" />,
      cta: 'Ver floraciones',
    },
    {
      id: 'membresia',
      title: 'Club Legado del Bosque',
      badge: 'Membresía Activa',
      description:
        'Como usuario registrado, eres parte del patrimonio forestal. Cada frasco financia árboles nativos protegidos en Chiloé.',
      href: '/club-legado-del-bosque',
      icon: <ShieldCheck className="w-5 h-5 text-accent" />,
      cta: 'Conocer el club',
    },
  ];

  // Cálculo de pasos de activación (onboarding)
  const steps = [
    { label: 'Cuenta creada (+100 pts de bienvenida)', done: true },
    { label: 'Dirección de despacho registrada', done: hasAddress },
    { label: 'Pase digital en billetera descubierto', done: true },
    { label: 'Primer ciclo o recolección de temporada', done: totalOrders > 0 },
    { label: 'Suscripción o reserva de floración activa', done: hasSubscription },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <section aria-labelledby="legado-trayectoria-heading" className="space-y-8">
      {/* Barra sobria de progreso y trayectoria */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card/90 to-surface-sunken p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <span className="text-[0.65rem] font-mono uppercase tracking-[0.25em] text-accent-text font-bold">
                Trayectoria en el Ecosistema
              </span>
            </div>
            <h2
              id="legado-trayectoria-heading"
              className="font-display text-2xl sm:text-3xl text-foreground font-light leading-tight"
            >
              Tu Vínculo con el Bosque
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Como miembro de <strong>El Legado</strong>, dispones de herramientas
              para gestionar tu despensa de miel nativa de autor, sellos de recolección y trazabilidad
              directa de colmenas.
            </p>
          </div>

          <div className="bg-secondary/60 border border-border/80 rounded-2xl p-4 sm:p-5 min-w-[220px] text-center space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted-foreground uppercase tracking-wider">Hitos Iniciales</span>
              <span className="font-bold text-accent-text">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-surface-sunken rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {completedSteps} de {steps.length} hitos completados
            </p>
          </div>
        </div>

        {/* Lista resumida de hitos para nuevos clientes */}
        {totalOrders === 0 && (
          <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                {step.done ? (
                  <CheckCircle2 size={14} className="text-success-text shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                )}
                <span className={step.done ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cuadrícula de los 6 Poderes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {powers.map((power) => (
          <Link
            key={power.id}
            href={power.href}
            className="group rounded-2xl bg-card border border-border/70 hover:border-accent/40 p-6 flex flex-col justify-between transition-all hover:bg-surface-raised/50 relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  {power.icon}
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-surface-sunken border border-border/80 text-accent-text uppercase font-bold tracking-wider">
                  {power.badge}
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display text-lg text-foreground font-semibold group-hover:text-accent-text transition-colors">
                  {power.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {power.description}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between text-xs font-mono uppercase tracking-wider text-accent-text group-hover:underline">
              <span>{power.cta}</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
