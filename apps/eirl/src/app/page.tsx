"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricasCards } from "@/components/dashboard/metricas-cards";
import { CalculosIA } from "@/components/dashboard/calculos-ia";
import { ResumenActividad } from "@/components/dashboard/resumen-actividad";
import { TrendingUp, TrendingDown, DollarSign, FileText, Calculator, Brain, RefreshCw, Receipt } from "lucide-react";

interface DashboardData {
  periodo: {
    nombre: string;
    estado: string;
  };
  metricas: {
    ingresosMes: number;
    gastosMes: number;
    utilidadNeta: number;
    margenUtilidad: number;
    ivaDebito: number;
    ivaCredito: number;
    ivaPagar: number;
    ppm: number;
  };
  resumen: {
    totalFacturasEmitidas: number;
    totalFacturasRecibidas: number;
    totalGastos: number;
    facturasPendientes: number;
  };
  calculosIA: Array<{
    id: string;
    tipo: string;
    resultado: string;
    confianza?: number;
    estado: string;
    createdAt: string;
  }>;
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [empresaId] = useState("temp-empresa-id"); // ID temporal, debería venir de autenticación

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard?empresaId=${empresaId}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [empresaId]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-lg">E</span>
              </div>
              <h1 className="text-2xl font-light tracking-tight">EIRL PROPYME</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDashboardData}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Facturas</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Gastos</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">Impuestos</a>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">IA</a>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Período Actual */}
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
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : dashboardData ? (
          <div className="space-y-8">
            {/* Métricas Principales */}
            <section>
              <MetricasCards
                ingresosMes={dashboardData.metricas.ingresosMes}
                gastosMes={dashboardData.metricas.gastosMes}
                utilidadNeta={dashboardData.metricas.utilidadNeta}
                margenUtilidad={dashboardData.metricas.margenUtilidad}
                ivaPagar={dashboardData.metricas.ivaPagar}
                ppm={dashboardData.metricas.ppm}
              />
            </section>

            {/* Resumen de Actividad y Cálculos IA */}
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

            {/* Acciones Rápidas */}
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
          </div>
        ) : (
          <Card className="bg-black border-gray-800">
            <CardContent className="text-center py-12">
              <p className="text-gray-400">No hay datos disponibles</p>
              <Button 
                onClick={fetchDashboardData} 
                className="mt-4"
                variant="outline"
              >
                Reintentar
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 EIRL PROPYME. Sistema de contabilidad existencial para capitalistas salvajes.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}