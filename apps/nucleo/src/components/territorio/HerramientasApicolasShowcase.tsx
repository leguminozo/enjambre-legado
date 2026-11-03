'use client';

import Link from 'next/link';
import { Boxes, BookOpen, ShieldCheck, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import type { TerritorioHerramientasContent } from '@/lib/territorio-cms';

export interface HerramientasApicolasShowcaseProps {
  content?: TerritorioHerramientasContent;
}

export function HerramientasApicolasShowcase({ content }: HerramientasApicolasShowcaseProps = {}) {
  const badge = content?.badge || 'Herramientas gratuitas para el apicultor';
  const title = content?.title || 'Tecnología de precisión y soberanía territorial';
  const description =
    content?.description ||
    'Todo apicultor que inscribe sus apiarios accede a la plataforma de manejo territorial sin costo: visualización espacial de pecoreo, cuaderno de campo y trazabilidad de origen.';

  return (
    <section
      id="herramientas"
      data-cms-section="territorio_herramientas"
      className="px-6 sm:px-10 lg:px-16 xl:px-24 py-20 sm:py-28 border-t border-b border-border/60"
    >
      <div className="max-w-5xl mx-auto">
        {/* Cabecera */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="section-reveal block text-xs font-mono tracking-widest text-primary uppercase font-semibold">
              {badge}
            </span>
            <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-mono font-medium">
              Suelo Base $0
            </span>
          </div>
          <h2 className="section-reveal text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground font-existencial mb-4">
            {title}
          </h2>
          <p className="section-reveal text-muted-foreground leading-relaxed text-base sm:text-lg">
            {description}
          </p>
        </div>

        {/* Tarjetas principales: Apiario Digital + Cuaderno de Campo */}
        <div className="section-reveal grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Tarjeta 1: Apiario digital */}
          <div className="rounded-xl border border-border/70 bg-card p-6 sm:p-8 flex flex-col gap-5">
            <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-existencial text-xl font-semibold text-foreground">
                {content?.tab1_title || 'Colección y Apiario Digital'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content?.tab1_desc ||
                  'Registra cada cajón con su arquitectura real: cámaras de cría, alzas melarias, estado sanitario y peso estimado. La vista de tu patio se construye desde tus notas de inspección, sin sensores invasivos ni hardware costoso.'}
              </p>
            </div>
            <ul className="space-y-2 mt-auto">
              {[
                'Fichas por colmena con historial cronológico',
                'Registro de varroa, peso y estado de reina',
                'Sin instalar hardware en el nido de cría',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Tarjeta 2: Cuaderno de campo digital */}
          <div className="rounded-xl border border-border/70 bg-card p-6 sm:p-8 flex flex-col gap-5">
            <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-existencial text-xl font-semibold text-foreground">
                {content?.tab2_title || 'Cuaderno de Campo Digital'}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content?.tab2_desc ||
                  'Cumple la obligación del cuaderno de manejo sanitario (Res. SAG N° 4.590/2025) sin papeles sueltos que se deterioran en el bosque. Dictado por voz en terreno sin quitarte los guantes, con exportación oficial foliada en PDF.'}
              </p>
            </div>
            <ul className="space-y-2 mt-auto">
              {[
                'Conforme a Res. SAG N° 4.590/2025',
                'Dictado por voz libre, tolerante a desconexión',
                'PDF foliado listo para fiscalización SAG',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Row secundario: 3 características de las capas territoriales */}
        <div className="section-reveal grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-xl border border-border/60 bg-surface-sunken/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-existencial text-sm font-semibold text-foreground mb-1">
                {content?.feat1_title || 'Capa de distanciamiento legal'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {content?.feat1_desc ||
                  'Calcula automáticamente los perímetros mínimos fijados por la Ley 21.489 cuando un colmenar trashumante ingresa a tu comuna.'}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border/60 bg-surface-sunken/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-existencial text-sm font-semibold text-foreground mb-1">
                {content?.feat2_title || 'Alertas fitosanitarias'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {content?.feat2_desc ||
                  'Canal confidencial con hasta 48 horas de anticipación ante fumigaciones agrícolas vecinas (Res. SAG N° 7.068/2024).'}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border/60 bg-surface-sunken/60 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-existencial text-sm font-semibold text-foreground mb-1">
                {content?.feat3_title || 'Asistente declaración SAG octubre'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {content?.feat3_desc ||
                  'Pre-llena tu declaración anual de existencias con los datos del registro. Cómputo en un clic, sin cálculos manuales de última hora.'}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="section-reveal flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 p-6 sm:p-8 rounded-xl border border-primary/30 bg-primary/5">
          <div className="space-y-1 max-w-lg">
            <h4 className="font-existencial text-lg sm:text-xl font-semibold text-foreground">
              {content?.cta_title || 'Accede a todas las herramientas inscribiéndote gratis'}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {content?.cta_description ||
                'Cuaderno digital, fichas de colmenas y mapa de pecoreo disponibles desde el primer inicio de sesión.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href={content?.cta_primary_href || '/login?mode=signup'}
              className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-95 transition-opacity shadow-sm"
            >
              <span>{content?.cta_primary_label || 'Inscribirme y usar herramientas'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {content?.cta_secondary_label ? (
              <Link
                href={content?.cta_secondary_href || '/planes-territoriales'}
                className="w-full sm:w-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {content.cta_secondary_label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
