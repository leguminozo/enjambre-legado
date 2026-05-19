'use client';

import { useTransition, useOptimistic } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Save, X, Loader2 } from "lucide-react";
import { createFacturaEmitida } from "@/lib/actions/facturas";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const facturaSchema = z.object({
  numero: z.string().min(1, 'Número es requerido'),
  fecha: z.string(),
  clienteId: z.string().optional(),
  montoNeto: z.string(),
  montoIva: z.string(),
  montoTotal: z.string(),
  descripcion: z.string().optional(),
  tipoDocumento: z.string().default('Factura')
});

type FormData = z.infer<typeof facturaSchema>;

interface Tercero {
  id: string;
  nombre: string;
  rut: string;
  email?: string;
}

interface NuevaFacturaFormProps {
  empresaId: string;
  clientes: Tercero[];
  onSuccess?: () => void;
  onCancel: () => void;
}

export function NuevaFacturaForm({ empresaId, clientes, onSuccess, onCancel }: NuevaFacturaFormProps) {
  const [isPending, startTransition] = useTransition();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      numero: '',
      fecha: new Date().toISOString().split('T')[0],
      clienteId: '',
      montoNeto: '',
      montoIva: '',
      montoTotal: '',
      descripcion: '',
      tipoDocumento: 'Factura'
    }
  });

  const montoNeto = watch('montoNeto');

  const calcularIVA = () => {
    if (montoNeto) {
      const neto = parseFloat(montoNeto);
      const iva = neto * 0.19;
      const total = neto + iva;
      
      setValue('montoIva', iva.toFixed(0));
      setValue('montoTotal', total.toFixed(0));
    }
  };

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      const result = await createFacturaEmitida({
        ...data,
        empresaId,
        montoNeto: parseFloat(data.montoNeto),
        montoIva: parseFloat(data.montoIva),
        montoTotal: parseFloat(data.montoTotal),
      });

      if (result.success) {
        onSuccess?.();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <Card className="bg-black border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-light flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nueva Factura Emitida
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número Factura</Label>
              <Input
                id="numero"
                {...register('numero')}
                className="bg-black border-gray-700"
                required
              />
            </div>
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                {...register('fecha')}
                className="bg-black border-gray-700"
                required
              />
            </div>
          </div>

          <div>
            <Label>Cliente</Label>
            <Select value={watch('clienteId')} onValueChange={(value) => setValue('clienteId', value)}>
              <SelectTrigger className="bg-black border-gray-700">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nombre} - {cliente.rut}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Montos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="montoNeto">Monto Neto</Label>
                <Input
                  id="montoNeto"
                  type="number"
                  {...register('montoNeto')}
                  onBlur={calcularIVA}
                  className="bg-black border-gray-700"
                  required
                />
              </div>
              <div>
                <Label htmlFor="montoIva">IVA (19%)</Label>
                <Input
                  id="montoIva"
                  type="number"
                  {...register('montoIva')}
                  className="bg-black border-gray-700"
                  required
                />
              </div>
              <div>
                <Label htmlFor="montoTotal">Monto Total</Label>
                <Input
                  id="montoTotal"
                  type="number"
                  {...register('montoTotal')}
                  className="bg-black border-gray-700"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              className="bg-black border-gray-700"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={isPending} 
              className="bg-white text-black hover:bg-gray-200"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Factura
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="border-gray-600"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
