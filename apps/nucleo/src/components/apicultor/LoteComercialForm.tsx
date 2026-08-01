'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Label, Switch, toast, Spinner } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface Lote {
  id: string;
  variedad_floral?: string | null;
  metodo_extraccion?: string | null;
  analisis_humedad?: number | null;
  analisis_hmf?: number | null;
  lab_nombre?: string | null;
  lab_fecha?: string | null;
  canal_destino?: string | null;
  relato_publico?: string | null;
  publico?: boolean | null;
}

interface LoteComercialFormProps {
  lote: Lote;
  onSuccess: () => void;
  onCancel: () => void;
}

export function LoteComercialForm({ lote, onSuccess, onCancel }: LoteComercialFormProps) {
  const apiFetch = useApiFetch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    variedad_floral: lote.variedad_floral || '',
    metodo_extraccion: lote.metodo_extraccion || '',
    analisis_humedad: lote.analisis_humedad?.toString() || '',
    analisis_hmf: lote.analisis_hmf?.toString() || '',
    lab_nombre: lote.lab_nombre || '',
    lab_fecha: lote.lab_fecha || '',
    canal_destino: lote.canal_destino || '',
    relato_publico: lote.relato_publico || '',
    publico: lote.publico || false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        analisis_humedad: formData.analisis_humedad ? parseFloat(formData.analisis_humedad) : null,
        analisis_hmf: formData.analisis_hmf ? parseFloat(formData.analisis_hmf) : null,
        variedad_floral: formData.variedad_floral || null,
        metodo_extraccion: formData.metodo_extraccion || null,
        lab_nombre: formData.lab_nombre || null,
        lab_fecha: formData.lab_fecha || null,
        canal_destino: formData.canal_destino || null,
        relato_publico: formData.relato_publico || null,
      };

      const res = await apiFetch(`/api/produccion/lotes/${lote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al actualizar el lote');
      }

      toast.success('Lote comercial actualizado correctamente');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-card border-border">
      <CardHeader>
        <CardTitle className="text-xl">Trazabilidad Comercial del Lote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Variedad Floral</Label>
              <Input
                value={formData.variedad_floral}
                onChange={(e) => handleChange('variedad_floral', e.target.value)}
                placeholder="Ej: Ulmo, Multiflora"
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Extracción</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.metodo_extraccion}
                onChange={(e) => handleChange('metodo_extraccion', e.target.value)}
              >
                <option value="">Seleccione...</option>
                <option value="centrifugo">Centrífugo</option>
                <option value="manual">Manual</option>
                <option value="prensado">Prensado</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Humedad (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.analisis_humedad}
                onChange={(e) => handleChange('analisis_humedad', e.target.value)}
                placeholder="Ej: 17.5"
              />
            </div>
            <div className="space-y-2">
              <Label>HMF (mg/kg)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.analisis_hmf}
                onChange={(e) => handleChange('analisis_hmf', e.target.value)}
                placeholder="Ej: 14.2"
              />
            </div>
            <div className="space-y-2">
              <Label>Laboratorio Certificador</Label>
              <Input
                value={formData.lab_nombre}
                onChange={(e) => handleChange('lab_nombre', e.target.value)}
                placeholder="Ej: Lab Apícola Sur"
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha de Análisis</Label>
              <Input
                type="date"
                value={formData.lab_fecha}
                onChange={(e) => handleChange('lab_fecha', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Canal de Destino Proyectado</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={formData.canal_destino}
              onChange={(e) => handleChange('canal_destino', e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="individual">Venta Individual (Retail/Directo)</option>
              <option value="colectivo">Venta Colectiva</option>
              <option value="acopio">Acopio Comunitario</option>
              <option value="interno">Consumo Interno</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Relato Público (Visible al escanear QR)</Label>
            <Textarea
              value={formData.relato_publico}
              onChange={(e) => handleChange('relato_publico', e.target.value)}
              placeholder="Escribe la historia de este lote, las floraciones principales o detalles del territorio..."
              className="h-24 resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-raised rounded-lg border border-border">
            <div className="space-y-0.5">
              <Label className="text-base">Página Pública</Label>
              <p className="text-sm text-muted-foreground">
                Hacer visible este lote a través del código QR
              </p>
            </div>
            <Switch
              checked={formData.publico}
              onCheckedChange={(c) => handleChange('publico', c)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="w-4 h-4 mr-2" />}
              Guardar Trazabilidad
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
