"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@enjambre/ui";
import { FileText, ShoppingCart, Receipt, AlertTriangle } from "lucide-react";

interface ResumenProps {
  totalFacturasEmitidas: number;
  totalFacturasRecibidas: number;
  totalGastos: number;
  facturasPendientes: number;
}

export function ResumenActividad({ 
  totalFacturasEmitidas, 
  totalFacturasRecibidas, 
  totalGastos, 
  facturasPendientes 
}: ResumenProps) {
  
  const actividades = [
    {
      titulo: "Facturas Emitidas",
      valor: totalFacturasEmitidas,
      icono: FileText,
      color: "text-foreground",
      bgColor: "bg-surface-raised"
    },
    {
      titulo: "Facturas Recibidas",
      valor: totalFacturasRecibidas,
      icono: Receipt,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      titulo: "Gastos Registrados",
      valor: totalGastos,
      icono: ShoppingCart,
      color: "text-primary",
      bgColor: "bg-primary/20"
    },
    {
      titulo: "Por Cobrar",
      valor: facturasPendientes,
      icono: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    }
  ];

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="text-lg font-light">Resumen de Actividad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actividades.map((actividad, index) => (
            <div key={index} className="text-center p-4 border border-border rounded-lg">
              <div className={`w-12 h-12 ${actividad.bgColor} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                <actividad.icono className={`h-6 w-6 ${actividad.color}`} />
              </div>
              <div className="text-2xl font-bold">{actividad.valor}</div>
              <div className="text-sm text-muted-foreground mt-1">{actividad.titulo}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}