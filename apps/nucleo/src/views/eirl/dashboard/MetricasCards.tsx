"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@enjambre/ui";
import { formatCLP } from "@enjambre/ui";
import { TrendingUp, TrendingDown, DollarSign, FileText, Calculator, Brain } from "lucide-react";

interface MetricasProps {
  ingresosMes: number;
  gastosMes: number;
  utilidadNeta: number;
  margenUtilidad: number;
  ivaPagar: number;
  ppm: number;
  ingresosVariacionPct?: number | null;
  gastosVariacionPct?: number | null;
}

function formatVariacion(pct: number | null | undefined): string {
  if (pct == null) return 'Sin período anterior';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct}% vs mes anterior`;
}

export function MetricasCards({
  ingresosMes,
  gastosMes,
  utilidadNeta,
  margenUtilidad,
  ivaPagar,
  ppm,
  ingresosVariacionPct,
  gastosVariacionPct,
}: MetricasProps) {
  


  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card className="bg-background border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Mes</CardTitle>
        <TrendingUp className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCLP(ingresosMes)}</div>
        <p className="text-xs text-muted-foreground">{formatVariacion(ingresosVariacionPct)}</p>
      </CardContent>
    </Card>

    <Card className="bg-background border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Gastos Mes</CardTitle>
        <TrendingDown className="h-4 w-4 text-destructive" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCLP(gastosMes)}</div>
        <p className="text-xs text-muted-foreground">{formatVariacion(gastosVariacionPct)}</p>
      </CardContent>
    </Card>

    <Card className="bg-background border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Utilidad Neta</CardTitle>
        <DollarSign className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCLP(utilidadNeta)}</div>
        <p className="text-xs text-muted-foreground">Margen: {formatPercentage(margenUtilidad)}</p>
      </CardContent>
    </Card>

    <Card className="bg-background border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Impuestos</CardTitle>
        <FileText className="h-4 w-4 text-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-sm font-bold">{formatCLP(ivaPagar)}</div>
          <div className="text-xs text-muted-foreground">IVA a pagar</div>
          <div className="text-xs text-muted-foreground">PPM: {formatCLP(ppm)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}