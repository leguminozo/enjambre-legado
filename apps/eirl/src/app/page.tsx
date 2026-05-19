import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricasCards } from "@/components/dashboard/metricas-cards";
import { CalculosIA } from "@/components/dashboard/calculos-ia";
import { ResumenActividad } from "@/components/dashboard/resumen-actividad";
import { TrendingUp, TrendingDown, DollarSign, FileText, Calculator, Brain, RefreshCw, Receipt } from "lucide-react";
import { getDashboardData } from "@/lib/actions/dashboard";
import { refreshDashboardData } from "@/lib/actions/dashboard";

interface HomeProps {
  searchParams?: {
    empresaId?: string;
    periodo?: string;
  };
}

const EMPRESA_ID = process.env.EIRL_EMPRESA_ID || 'temp-empresa-id';

export default async function Home({ searchParams }: HomeProps) {
  const empresaId = searchParams?.empresaId || EMPRESA_ID;
  const periodo = searchParams?.periodo || 'actual';

  let dashboardData;
  let error: string | null = null;

  try {
    dashboardData = await getDashboardData(empresaId, periodo);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar datos';
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-light">Dashboard</h2>
              {dashboardData?.periodo && (
                <p className="text-gray-400 mt-1">
                  Período: {dashboardData.periodo.nombre} • Estado: {dashboardData.periodo.estado}
                </p>
              )}
            </div>
            <form action={refreshDashboardData}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </form>
          </div>
        </div>

        {error ? (
          <Card className="bg-black border-gray-800">
            <CardContent className="text-center py-12">
              <p className="text-red-400">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : dashboardData ? (
          <div className="space-y-8">
            <Suspense fallback={<MetricsSkeleton />}>
              <MetricasCards
                ingresosMes={dashboardData.metricas.ingresosMes}
                gastosMes={dashboardData.metricas.gastosMes}
                utilidadNeta={dashboardData.metricas.utilidadNeta}
                margenUtilidad={dashboardData.metricas.margenUtilidad}
                ivaPagar={dashboardData.metricas.ivaPagar}
                ppm={dashboardData.metricas.ppm}
              />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section>
                <ResumenActividad
                  totalFacturasEmitidas={dashboardData.resumen.totalFacturasEmitidas}
                  totalFacturasRecibidas={dashboardData.resumen.totalFacturasRecibidas}
                  totalGastos={dashboardData.resumen.totalGastos}
                  facturasPendientes={dashboardData.resumen.facturasPendientes}
                />
              </section>

              <section>
                <CalculosIA calculos={dashboardData.calculosIA} />
              </section>
            </div>

            <QuickActions />
          </div>
        ) : (
          <Card className="bg-black border-gray-800">
            <CardContent className="text-center py-12">
              <p className="text-gray-400">No hay datos disponibles</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-lg">E</span>
            </div>
            <h1 className="text-2xl font-light tracking-tight">EIRL PROPYME</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
            <a href="/facturas" className="text-gray-300 hover:text-white transition-colors">Facturas</a>
            <a href="/gastos" className="text-gray-300 hover:text-white transition-colors">Gastos</a>
            <a href="/impuestos" className="text-gray-300 hover:text-white transition-colors">Impuestos</a>
            <a href="/ia" className="text-gray-300 hover:text-white transition-colors">IA</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-16">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center text-gray-400">
          <p>&copy; 2024 EIRL PROPYME. Sistema de contabilidad existencial para capitalistas salvajes.</p>
        </div>
      </div>
    </footer>
  );
}

function QuickActions() {
  return (
    <section>
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-light">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="bg-white text-black hover:bg-gray-200 h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              Nueva Factura
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col">
              <Receipt className="h-6 w-6 mb-2" />
              Nuevo Gasto
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col">
              <Calculator className="h-6 w-6 mb-2" />
              Calcular Impuestos
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 h-20 flex-col">
              <Brain className="h-6 w-6 mb-2" />
              Análisis IA
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-black border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
