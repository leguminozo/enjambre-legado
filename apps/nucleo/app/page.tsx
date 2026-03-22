import React from 'react';
import { Leaf, Activity, ArrowRight, TreePine } from 'lucide-react';
import Link from 'next/link';

export default function NucleoLanding() {
  return (
    <main className="min-h-screen bg-[#fef7ee] text-gray-900 font-sans selection:bg-[#D4A017] selection:text-white pb-20">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 sm:px-12 lg:px-24 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-[#0A3D2F]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-[#D4A017]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="z-10 bg-white/40 border border-white/60 backdrop-blur-md px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
          <span className="text-sm font-medium text-[#0A3D2F]">Monitoreo en Tiempo Real Operativo</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-serif text-[#0A3D2F] font-bold tracking-tight mb-6 max-w-4xl">
          El Sistema Nervioso del <br className="hidden md:block"/>
          <span className="text-[#D4A017]">Bosque Nativo</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-10 max-w-2xl font-light leading-relaxed">
          Plataforma central unificada para Apicultores, Gerencia y Operadores Logísticos. Trazabilidad absoluta desde el néctar de la flor hasta la regeneración del suelo.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
          <Link href="/login" className="w-full">
            <button className="w-full px-8 py-4 bg-[#0A3D2F] hover:bg-[#082a21] text-white rounded-2xl font-medium transition-all duration-300 shadow-xl shadow-[#0A3D2F]/20 active:scale-95 flex justify-center items-center gap-2 group">
              Ingresar al Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      </section>

      {/* Access Cards */}
      <section className="px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 p-8 rounded-3xl border border-white backdrop-blur-xl shadow-lg shadow-[#0A3D2F]/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-[#D4A017]/10 rounded-2xl flex items-center justify-center mb-6">
            <Leaf className="w-6 h-6 text-[#D4A017]" />
          </div>
          <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Portal Apicultor</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Gestión cíclica de colmenas, alertas meteorológicas preventivas y registros sanitarios con trazabilidad individual In-Situ.
          </p>
          <a href="/login?role=apicultor" className="text-[#D4A017] font-medium text-sm hover:underline flex items-center gap-1">
            Reclamar acceso <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        <div className="bg-white/60 p-8 rounded-3xl border border-white backdrop-blur-xl shadow-lg shadow-[#0A3D2F]/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-[#0A3D2F]/10 rounded-2xl flex items-center justify-center mb-6">
            <Activity className="w-6 h-6 text-[#0A3D2F]" />
          </div>
          <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Estación Gerente</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Visualización macroscópica de flujos de caja, predicciones generativas de cosechas con IA y auditoría en tiempo real.
          </p>
          <a href="/login?role=gerente" className="text-[#0A3D2F] font-medium text-sm hover:underline flex items-center gap-1">
            Iniciar simulación <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        <div className="bg-white/60 p-8 rounded-3xl border border-white backdrop-blur-xl shadow-lg shadow-[#0A3D2F]/5 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-green-900/10 rounded-2xl flex items-center justify-center mb-6">
            <TreePine className="w-6 h-6 text-green-700" />
          </div>
          <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">Comunidad Guardián</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">
            Transparencia de métricas de CO₂, visor de reforestación territorial y reportes biológicos de floraciones locales.
          </p>
          <a href="http://tienda.obrerayzangano.com" className="text-green-700 font-medium text-sm hover:underline flex items-center gap-1">
            Explorar impacto <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </section>
    </main>
  );
}
