import Link from 'next/link';
import { TerritorioHeader } from '@/components/territorio/TerritorioHeader';
import { TerritorioFooter } from '@/components/territorio/TerritorioFooter';
import { getTerritorioCmsContent } from '@/lib/territorio-cms';
import { PrintButton } from '@/components/territorio/PrintButton';
import { lineaProveedor, CONTACTO_INSTITUCIONAL } from '@/lib/contacto-institucional';
import {
  FileText,
  Building2,
  CheckCircle2,
  Scale,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Layers,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Minuta Ejecutiva para Alcalde y Concejo — Kit Municipal Chiloé',
  description:
    'Minuta sintética de respaldo legal, técnico y presupuestario del piloto comunal apícola de 90 días (bajo 100 UTM / Compra Ágil) para presentar ante Alcaldía, Concejo o DIDECO.',
  alternates: {
    canonical: 'https://www.registroapicolachiloe.me/municipalidades/minuta',
  },
  openGraph: {
    title: 'Minuta Ejecutiva para Alcalde y Concejo Municipal · Chiloé',
    description:
      'Respaldo técnico y legal para DIDECO y Concejo: piloto apícola de 90 días bajo 100 UTM en Compra Ágil.',
    url: 'https://www.registroapicolachiloe.me/municipalidades/minuta',
    siteName: 'Registro Apícola de Chiloé',
    locale: 'es_CL',
    type: 'website',
  },
};

export default async function MinutaEjecutivaPage() {
  const cms = await getTerritorioCmsContent();

  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans flex flex-col">
      <TerritorioHeader content={cms.header} />

      {/* Barra de navegación superior fija */}
      <div className="border-b border-border/80 bg-surface-raised/40 px-6 sm:px-12 py-3 sticky top-14 z-20 backdrop-blur-md print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/municipalidades/kit"
            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Kit Municipal</span>
          </Link>
          <div className="flex items-center gap-3">
            <PrintButton label="Imprimir Minuta Ejecutiva / PDF" />
          </div>
        </div>
      </div>

      <article className="flex-1 max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 py-12 sm:py-16 space-y-10">
        {/* Cabecera del Documento Ejecutivo */}
        <header className="space-y-4 border-b border-border/80 pb-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary font-bold">
            <Building2 className="w-4 h-4" />
            <span>Documento de Respaldo Institucional</span>
          </div>
          <h1 className="font-existencial text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
            Minuta Ejecutiva: Piloto de Gestión Apícola Comunal (90 Días)
          </h1>
          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
            Documento de síntesis jurídica, operativa y presupuestaria elaborado para consideración del
            <strong> Alcalde</strong>, el <strong>Concejo Municipal</strong> y la dirección de
            <strong> DIDECO / SECPLAN</strong>.
          </p>

          <div className="p-4 rounded-xl bg-surface-sunken border border-border text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Mecanismo</span>
              <span className="font-semibold text-foreground">Compra Ágil (Ley N° 19.886)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Presupuesto</span>
              <span className="font-semibold text-foreground">Bajo 100 UTM ($2,4M a $3,6M + IVA)</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Plazo de Ejecución</span>
              <span className="font-semibold text-foreground">90 días + 12 meses alojamiento</span>
            </div>
          </div>
        </header>

        {/* 1. Diagnóstico */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-existencial text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-mono">1</span>
            <span>El Problema en el Territorio Comunal</span>
          </h2>
          <div className="p-4 rounded-xl bg-card border border-border text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              • <strong>Saturación por trashumancia estival:</strong> Cada verano ingresan a la comuna camiones con colmenas desde el norte del país sin coordinación previa con apicultores locales ni con la municipalidad, saturando la carga de flores nativas (Ulmo, Tiaca).
            </p>
            <p>
              • <strong>Riesgo de mortandad masiva por plaguicidas:</strong> La aplicación de productos fitosanitarios agrícolas sin aviso previo genera mortandad severa de abejas. La Res. SAG N° 7.068/2024 exige aviso con 48 horas de anticipación, pero los aplicadores no cuentan con un mapa ni canal ágil para avisar a los vecinos.
            </p>
            <p>
              • <strong>Vacío de información municipal:</strong> La DIDECO y los equipos de PRODESAL carecen de un catastro georreferenciado para mediar en conflictos de vecindad y orientar programas de fomento productivo rural.
            </p>
          </div>
        </section>

        {/* 2. Fundamentación Legal */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-existencial text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-mono">2</span>
            <span>Fundamentación Legal y Competencias Municipales</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-primary block">Ley N° 18.695 (LOCM)</span>
              <p className="font-semibold text-foreground">Atribuciones Municipales Concretas</p>
              <ul className="text-muted-foreground space-y-1 list-disc pl-4 leading-relaxed">
                <li><strong>Art. 4° letra b):</strong> Salud pública y protección del medio ambiente comunal.</li>
                <li><strong>Art. 4° letra f):</strong> Desarrollo productivo y fomento de la economía rural.</li>
                <li><strong>Art. 4° letra i):</strong> Prevención de emergencias y mitigación de desastres.</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-primary block">Ley N° 21.489 & Res. SAG</span>
              <p className="font-semibold text-foreground">Armonización Sanitaria</p>
              <ul className="text-muted-foreground space-y-1 list-disc pl-4 leading-relaxed">
                <li><strong>No invade potestades:</strong> El SAG conserva la exclusividad de fiscalización y sanidad.</li>
                <li><strong>Complemento local:</strong> La comuna ordena la convivencia y canaliza las alertas tempranas.</li>
                <li><strong>Protección de datos (Ley 21.719):</strong> Anonimización de colmenares (~1 km) para evitar el robo (abigeato).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Mecanismo de Contratación */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-existencial text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-mono">3</span>
            <span>Mecanismo Administrativo: Compra Ágil Mercado Público</span>
          </h2>
          <div className="p-4 rounded-xl bg-surface-sunken border border-border text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              La contratación se enmarca estrictamente en el mecanismo de <strong>Compra Ágil</strong> bajo la Ley N° 19.886 y Ley N° 21.634, por un monto inferior a 100 UTM:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-card border border-border text-center">
                <span className="font-bold text-foreground block">No es Trato Directo</span>
                <span>Proceso abierto y transparente en Mercado Público</span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border text-center">
                <span className="font-bold text-foreground block">≥ 3 Cotizaciones</span>
                <span>Conforme a la normativa de compras del Estado</span>
              </div>
              <div className="p-2.5 rounded-lg bg-card border border-border text-center">
                <span className="font-bold text-foreground block">Prioridad EMT</span>
                <span>Llamado enfocado en Empresas de Menor Tamaño</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Entregables Concretos */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold font-existencial text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-mono">4</span>
            <span>Entregables Tangibles del Piloto (90 Días)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" />
                <span>1. Panel Municipal Georreferenciado</span>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Plataforma web con mapa comunal por zonas difusas (~1 km), con conteo vivo de apiarios, trashumantes y floraciones nativas.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" />
                <span>2. Canal de Alertas Fitosanitarias 48h</span>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Sistema automatizado para registrar avisos de fumigación agrícola y alertar preventivamente a los apicultores de la zona.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" />
                <span>3. Censo Asistido en Terreno</span>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Jornada de capacitación a funcionarios de DIDECO/PRODESAL y registro asistido presencial de apicultores campesinos.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success shrink-0" />
                <span>4. Borrador de Ordenanza y Alojamiento</span>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Proyecto de ordenanza apícola adaptado a la comuna y 12 meses garantizados de soporte y servidor en la nube.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Deslinde Institucional */}
        <section className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground leading-relaxed space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck size={15} className="text-primary" />
            <span>Deslinde de Responsabilidad y Certeza Institucional</span>
          </p>
          <p>
            El Registro Territorial Apícola de Chiloé es una herramienta complementaria y no sustituye la inscripción legal obligatoria en el SIPEC Apícola del Servicio Agrícola y Ganadero (SAG). La ordenanza modelo no nombra proveedor y se somete íntegramente a las normas de compras públicas (Ley N° 19.886).
          </p>
        </section>

        {/* Pie de Firma Institucional */}
        <footer className="pt-6 border-t border-border/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">Operador Técnico de Infraestructura:</p>
            <p>{lineaProveedor()} · Queilén, Chiloé</p>
            <p>Contacto institucional: {CONTACTO_INSTITUCIONAL.email}</p>
          </div>
          <div className="print:hidden">
            <PrintButton label="Imprimir Minuta Oficial / PDF" />
          </div>
        </footer>
      </article>

      <TerritorioFooter />
    </main>
  );
}
