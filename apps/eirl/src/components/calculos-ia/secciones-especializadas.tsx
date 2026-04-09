"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalisisRentabilidadIA } from "@/components/calculos-ia/analisis-rentabilidad";
import { OptimizacionFiscalIA } from "@/components/calculos-ia/optimizacion-fiscal";
import { CalculosIAComponent } from "@/components/calculos-ia/calculos-ia-component";
import { 
  Brain, 
  Target, 
  Shield, 
  TrendingUp, 
  Calculator,
  RefreshCw,
  Settings
} from "lucide-react";

interface SeccionesEspecializadasProps {
  empresaId: string;
}

export function SeccionesEspecializadas({ empresaId }: SeccionesEspecializadasProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  const secciones = [
    {
      id: "dashboard",
      label: "Dashboard IA",
      icon: Brain,
      description: "Vista general de cálculos inteligentes"
    },
    {
      id: "rentabilidad",
      label: "Rentabilidad",
      icon: Target,
      description: "Análisis automático de rentabilidad"
    },
    {
      id: "optimizacion",
      label: "Optimización Fiscal",
      icon: Shield,
      description: "Optimización inteligente de impuestos"
    },
    {
      id: "calculos",
      label: "Cálculos",
      icon: Calculator,
      description: "Cálculos específicos por IA"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-black border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-light flex items-center gap-3">
            <Brain className="h-6 w-6" />
            Secciones Especializadas IA
          </CardTitle>
          <p className="text-gray-400">
            Módulos inteligentes que analizan, optimizan y proyectan automáticamente la salud financiera de tu empresa EIRL PROPYME
          </p>
        </CardHeader>
      </Card>

      {/* Tabs de Navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black border-gray-800">
          {secciones.map((seccion) => {
            const Icon = seccion.icon;
            return (
              <TabsTrigger
                key={seccion.id}
                value={seccion.id}
                className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-white flex flex-col gap-1 p-3 h-auto"
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{seccion.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          {/* Dashboard IA */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card className="bg-black border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl font-light">Estado General IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
                    <CardContent className="p-6 text-center">
                      <Brain className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                      <h3 className="text-lg font-semibold mb-2">IA Activa</h3>
                      <p className="text-sm text-gray-400">
                        Sistema de análisis inteligente operativo y procesando datos en tiempo real
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <CardContent className="p-6 text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-green-400" />
                      <h3 className="text-lg font-semibold mb-2">Análisis Continuo</h3>
                      <p className="text-sm text-gray-400">
                        Monitoreo automático de métricas financieras y detección de oportunidades
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                    <CardContent className="p-6 text-center">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                      <h3 className="text-lg font-semibold mb-2">Optimización Automática</h3>
                      <p className="text-sm text-gray-400">
                        Recomendaciones fiscales y financieras basadas en normativa chilena vigente
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Capacidades Inteligentes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Calculator className="h-8 w-8 text-blue-400" />
                          <div>
                            <h4 className="font-medium">Cálculos Automatizados</h4>
                            <p className="text-sm text-gray-400">
                              IVA, PPM, utilidades, y proyecciones sin intervención manual
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-8 w-8 text-green-400" />
                          <div>
                            <h4 className="font-medium">Análisis Predictivo</h4>
                            <p className="text-sm text-gray-400">
                              Proyecciones de rentabilidad y tendencias futuras
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Shield className="h-8 w-8 text-purple-400" />
                          <div>
                            <h4 className="font-medium">Optimización Fiscal</h4>
                            <p className="text-sm text-gray-400">
                              Maximización de deducciones y minimización de carga tributaria
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-900 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Settings className="h-8 w-8 text-orange-400" />
                          <div>
                            <h4 className="font-medium">Configuración Autónoma</h4>
                            <p className="text-sm text-gray-400">
                              Adaptación automática a cambios en normativa tributaria
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rentabilidad */}
          <TabsContent value="rentabilidad">
            <AnalisisRentabilidadIA empresaId={empresaId} />
          </TabsContent>

          {/* Optimización Fiscal */}
          <TabsContent value="optimizacion">
            <OptimizacionFiscalIA empresaId={empresaId} />
          </TabsContent>

          {/* Cálculos */}
          <TabsContent value="calculos">
            <CalculosIAComponent empresaId={empresaId} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Acción Global */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Análisis Completo IA</h3>
          <p className="text-gray-400 mb-4">
            Ejecuta todos los análisis inteligentes simultáneamente para obtener una visión completa de la salud financiera de tu empresa
          </p>
          <Button className="bg-white text-black hover:bg-gray-200">
            <RefreshCw className="h-4 w-4 mr-2" />
            Ejecutar Análisis Completo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}