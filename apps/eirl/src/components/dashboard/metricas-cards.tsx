"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, FileText, Calculator, Brain } from "lucide-react";

interface MetricasProps {
  ingresosMes: number;
  gastosMes: number;
  utilidadNeta: number;
  margenUtilidad: number;
  ivaPagar: number;
  ppm: number;
}

export function MetricasCards({ 
  ingresosMes, 
  gastosMes, 
  utilidadNeta, 
  margenUtilidad, 
  ivaPagar, 
  ppm 
}: MetricasProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Ingresos Mes</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(ingresosMes)}</div>
          <p className="text-xs text-gray-400">+0% vs mes anterior</p>
        </CardContent>
      </Card>
      
      <Card className="bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Gastos Mes</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(gastosMes)}</div>
          <p className="text-xs text-gray-400">+0% vs mes anterior</p>
        </CardContent>
      </Card>
      
      <Card className="bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Utilidad Neta</CardTitle>
          <DollarSign className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(utilidadNeta)}</div>
          <p className="text-xs text-gray-400">Margen: {formatPercentage(margenUtilidad)}</p>
        </CardContent>
      </Card>
      
      <Card className="bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Impuestos</CardTitle>
          <FileText className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="text-sm font-bold">{formatCurrency(ivaPagar)}</div>
            <div className="text-xs text-gray-400">IVA a pagar</div>
            <div className="text-xs text-gray-500">PPM: {formatCurrency(ppm)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}