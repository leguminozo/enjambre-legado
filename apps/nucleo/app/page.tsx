import Link from 'next/link';
import { ShieldAlert, Map, QrCode, ArrowRight, UserCircle2 } from 'lucide-react';


export default function RedApicolaLanding() {
  return (
    <main className="min-h-[var(--vh-full)] bg-background text-foreground font-sans selection:bg-accent selection:text-accent-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold font-serif">
            CH
          </div>
          <span className="font-medium text-sm tracking-wide hidden sm:block">
            Registro Territorial Apícola de Chiloé
          </span>
        </div>
        <div>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-surface-raised">
            <UserCircle2 className="w-4 h-4" />
            Acceso
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-[25vh] pb-20 px-6 sm:px-12 lg:px-24 flex-1 flex flex-col items-center text-center overflow-hidden border-b border-border">
        {/* Background Decorative */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="z-10 bg-surface-raised border border-border px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Censo 2026-2027 Abierto
          </span>
        </div>

        <h1 className="font-existencial text-foreground font-bold tracking-tight mb-6 max-w-4xl text-balance text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1]">
          Protege tu territorio. <br />
          <span className="text-primary italic font-serif">Traza tu origen.</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl font-light leading-relaxed text-pretty">
          Únete a la Red Apícola Territorial de Chiloé. Una herramienta gratuita para ordenar las zonas de pecoreo, defendernos de la trashumancia irresponsable y darle el valor real a nuestra miel.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md z-10">
          <Link
            href="/login?mode=signup"
            className="w-full min-h-12 inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all duration-300 shadow-xl shadow-primary/20 active:scale-95 group"
          >
            Inscribirse · Acceder
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-surface-sunken py-24 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-4">¿Por qué registrarse?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No es solo un mapa. Es una plataforma integral diseñada por y para los apicultores locales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Defensa Territorial</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Recibe alertas si apicultores trashumantes no registrados se instalan cerca de tu zona de pecoreo. Protege la bioseguridad de tus colmenas.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6">
                <Map className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Ordenamiento Municipal</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                El registro territorial permite coordinar con las autoridades locales para exigir el cumplimiento de las normativas vigentes sobre distancias.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">Trazabilidad Comercial</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Cada uno de tus lotes de miel obtendrá un Pasaporte Público con código QR, conectando tu esfuerzo directamente con el consumidor final.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-background py-8 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Registro Territorial Apícola de Chiloé.
        </p>
      </footer>
    </main>
  );
}