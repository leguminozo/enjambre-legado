import Link from 'next/link';
import { Leaf, Activity, ArrowRight, TreePine } from 'lucide-react';

export default function NucleoLanding() {
  const urlTienda = process.env.NEXT_PUBLIC_URL_TIENDA?.trim() || '';

  return (
    <main className="min-h-dvh bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground pb-20">
      <section className="relative pt-32 pb-20 px-6 sm:px-12 lg:px-24 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="z-10 bg-surface-raised/40 border border-border/60 backdrop-blur-md px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-primary">Monitoreo en Tiempo Real Operativo</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-existencial text-primary font-bold tracking-tight mb-6 max-w-4xl">
          El Sistema Nervioso del <br className="hidden md:block" />
          <span className="text-accent">Bosque Nativo</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-2xl font-light leading-relaxed">
          Plataforma central unificada para Apicultores, Gerencia y Operadores Logísticos. Trazabilidad absoluta desde el néctar de la flor hasta la regeneración del suelo.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <Link href="/login" className="w-full">
            <button className="w-full px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-medium transition-all duration-300 shadow-xl shadow-primary/20 active:scale-95 flex justify-center items-center gap-2 group">
              Ingresar al Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card/60 p-8 rounded-3xl border border-border backdrop-blur-xl shadow-lg shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
            <Leaf className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-3">Portal Apicultor</h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">Gestión cíclica de colmenas, alertas meteorológicas preventivas y registros sanitarios con trazabilidad individual In-Situ.</p>
          <a href="/login?role=apicultor" className="text-accent font-medium text-sm hover:underline flex items-center gap-1">Reclamar acceso <ArrowRight className="w-3 h-3" /></a>
        </div>
        <div className="bg-card/60 p-8 rounded-3xl border border-border backdrop-blur-xl shadow-lg shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-3">Estación Gerente</h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">Visualización macroscópica de flujos de caja, predicciones generativas de cosechas con IA y auditoría en tiempo real.</p>
          <a href="/login?role=gerente" className="text-primary font-medium text-sm hover:underline flex items-center gap-1">Iniciar simulación <ArrowRight className="w-3 h-3" /></a>
        </div>
        <div className="bg-card/60 p-8 rounded-3xl border border-border backdrop-blur-xl shadow-lg shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center mb-6">
            <TreePine className="w-6 h-6 text-success" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-3">Comunidad Guardián</h3>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">Transparencia de métricas de CO2, visor de reforestación territorial y reportes biológicos de floraciones locales.</p>
          {urlTienda ? (
            <a href={urlTienda} target="_blank" rel="noopener noreferrer" className="text-primary font-medium text-sm hover:underline flex items-center gap-1">Explorar impacto <ArrowRight className="w-3 h-3" /></a>
          ) : (
            <span className="text-muted-foreground font-medium text-sm">Tienda web (configura NEXT_PUBLIC_URL_TIENDA)</span>
          )}
        </div>
      </section>
    </main>
  );
}