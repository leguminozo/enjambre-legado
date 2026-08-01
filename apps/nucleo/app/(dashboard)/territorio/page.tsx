import { Map, QrCode, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Mi Territorio — Registro Apícola de Chiloé',
  description: 'Tu panel en el Registro Territorial Apícola de Chiloé. Gestiona tus apiarios, lotes y alertas fitosanitarias.',
};

export default function TerritorioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Registro Territorial Apícola de Chiloé
        </p>
        <h1 className="text-3xl font-bold font-serif text-foreground">
          Mi Territorio
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          Desde aquí gestionas tu presencia en el registro comunitario. Tu información está protegida y es controlada exclusivamente por ti.
        </p>
      </div>

      {/* Módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <Link
          href="/mapa"
          className="group p-7 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 space-y-4"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Map className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
              Mapa Territorial
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
              Visualiza el territorio apícola de Chiloé. Registra la ubicación aproximada de tus apiarios en el mapa comunitario.
            </p>
          </div>
        </Link>

        {/* Mis Lotes / QR */}
        <Link
          href="/colmenas"
          className="group p-7 rounded-2xl bg-card border border-border hover:border-accent/40 transition-all hover:shadow-lg hover:shadow-accent/5 space-y-4"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2 group-hover:text-accent transition-colors">
              Mis Lotes y QR
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
              Registra tus cosechas y genera el Pasaporte Público con código QR que conecta tu miel con el consumidor final.
            </p>
          </div>
        </Link>

        {/* Alertas */}
        <Link
          href="/registro-territorial"
          className="group p-7 rounded-2xl bg-card border border-border hover:border-destructive/30 transition-all hover:shadow-lg hover:shadow-destructive/5 space-y-4"
        >
          <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2 group-hover:text-destructive transition-colors">
              Alertas Fitosanitarias
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h2>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
              Recibe avisos de fumigaciones y aplica plaguicidas en tu zona de pecoreo. Protege la bioseguridad de tus colmenas.
            </p>
          </div>
        </Link>
      </div>

      {/* Estado del Registro */}
      <div className="p-5 rounded-2xl bg-surface-raised border border-border flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
          <span className="w-3 h-3 rounded-full bg-success animate-pulse block" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Tu cuenta está activa en el Registro Territorial</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nivel Base · Para subir de nivel, documenta tus actividades en el sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
