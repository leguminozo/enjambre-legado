"use client";

import { useState, useEffect } from "react";
import { Button, Input, Textarea, toast } from "@enjambre/ui";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@enjambre/ui";
import { ShoppingCart, Save, X, Calculator } from "lucide-react";
import { useApiFetch } from '@/lib/use-api-fetch';

interface Tercero {
  id: string;
  nombre: string;
  rut: string;
  email?: string;
}

interface NuevoGastoFormProps {
  onSave: (gasto: Record<string, unknown>) => void;
  onCancel: () => void;
}

const categoriasGasto = [
  "Arriendo",
  "Servicios Básicos",
  "Transporte",
  "Suministros",
  "Honorarios",
  "Publicidad",
  "Seguros",
  "Mantenimiento",
  "Telecomunicaciones",
  "Impuestos",
  "Otros"
];

const tiposComprobante = [
  "Boleta",
  "Factura",
  "Ticket",
  "Nota de Débito",
  "Otro"
];

export function NuevoGastoForm({ onSave, onCancel }: NuevoGastoFormProps) {
  const apiFetch = useApiFetch();
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: "",
    monto: "",
    montoIva: "",
    montoNeto: "",
    categoria: "",
    tipoComprobante: "Boleta",
    numeroComprobante: "",
    proveedorId: ""
  });
  
  const [proveedores, setProveedores] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    giro: ""
  });
  const [mostrarNuevoProveedor, setMostrarNuevoProveedor] = useState(false);

  const cargarProveedores = async () => {
    try {
      const response = await apiFetch('/api/terceros?tipo=Proveedor');
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNuevoProveedorChange = (field: string, value: string) => {
    setNuevoProveedor(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calcularMontos = () => {
    const montoTotal = parseFloat(formData.monto) || 0;
    const iva = montoTotal * 0.19;
    const neto = montoTotal - iva;
    
    setFormData(prev => ({
      ...prev,
      montoIva: iva.toFixed(0),
      montoNeto: neto.toFixed(0)
    }));
  };

  const crearNuevoProveedor = async () => {
    if (!nuevoProveedor.nombre || !nuevoProveedor.rut) {
      toast('Nombre y RUT son requeridos', { type: 'error' });
      return;
    }

    try {
      const response = await apiFetch('/api/terceros', {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'Proveedor',
          ...nuevoProveedor
        })
      });

      if (response.ok) {
        const proveedor = await response.json();
        setProveedores(prev => [...prev, proveedor]);
        setFormData(prev => ({ ...prev, proveedorId: proveedor.id }));
        setMostrarNuevoProveedor(false);
        setNuevoProveedor({
          nombre: "",
          rut: "",
          email: "",
          telefono: "",
          direccion: "",
          giro: ""
        });
      } else {
        const error = await response.json();
        toast(error.error || 'Error al crear proveedor', { type: 'error' });
      }
    } catch (error) {
console.error('Error creando proveedor:', error);
		toast('Error al crear proveedor', { type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fecha || !formData.descripcion || !formData.monto || !formData.categoria) {
      toast('Fecha, descripción, monto y categoría son requeridos', { type: 'error' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiFetch('/api/gastos', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          monto: parseFloat(formData.monto),
          montoIva: parseFloat(formData.montoIva) || 0,
          montoNeto: parseFloat(formData.montoNeto) || 0
        })
      });

      if (response.ok) {
        const gasto = await response.json();
        onSave(gasto);
      } else {
        const error = await response.json();
        toast(error.error || 'Error al crear gasto', { type: 'error' });
      }
    } catch (error) {
console.error('Error creando gasto:', error);
		toast('Error al crear gasto', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-background border-border">
      <CardHeader>
        <CardTitle className="text-xl font-light flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Nuevo Gasto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
className="bg-background border-border"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                    <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasGasto.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
className="bg-background border-border"
                    rows={3}
              required
            />
          </div>

          {/* Proveedor */}
          <div>
            <Label>Proveedor</Label>
            <div className="space-y-2">
              <Select value={formData.proveedorId} onValueChange={(value) => handleInputChange('proveedorId', value)}>
<SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((proveedor) => (
                    <SelectItem key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre} - {proveedor.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                type="button"
                
                onClick={() => setMostrarNuevoProveedor(!mostrarNuevoProveedor)}
                className="w-full border-input"
              >
                {mostrarNuevoProveedor ? 'Cancelar' : 'Crear Nuevo Proveedor'}
              </Button>
            </div>
          </div>

          {/* Nuevo Proveedor Form */}
          {mostrarNuevoProveedor && (
            <Card className="bg-background border-border">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={nuevoProveedor.nombre}
                        onChange={(e) => handleNuevoProveedorChange('nombre', e.target.value)}
className="bg-surface-sunken border-input"
                    />
                  </div>
                  <div>
                    <Label>RUT</Label>
                    <Input
                      value={nuevoProveedor.rut}
                      onChange={(e) => handleNuevoProveedorChange('rut', e.target.value)}
                      className="bg-surface-sunken border-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={nuevoProveedor.email}
                        onChange={(e) => handleNuevoProveedorChange('email', e.target.value)}
className="bg-surface-sunken border-input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={nuevoProveedor.email}
                      onChange={(e) => handleNuevoProveedorChange('email', e.target.value)}
                      className="bg-surface-sunken border-input"
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={nuevoProveedor.telefono}
                      onChange={(e) => handleNuevoProveedorChange('telefono', e.target.value)}
                      className="bg-surface-sunken border-input"
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={crearNuevoProveedor} className="w-full">
                    Crear Proveedor
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comprobante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipoComprobante">Tipo Comprobante</Label>
              <Select value={formData.tipoComprobante} onValueChange={(value) => handleInputChange('tipoComprobante', value)}>
<SelectTrigger className="bg-background border-border">
                        <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposComprobante.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="numeroComprobante">Número Comprobante</Label>
              <Input
                id="numeroComprobante"
                value={formData.numeroComprobante}
                onChange={(e) => handleInputChange('numeroComprobante', e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Montos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Montos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="monto">Monto Total</Label>
                <Input
                  id="monto"
                  type="number"
                  value={formData.monto}
                  onChange={(e) => handleInputChange('monto', e.target.value)}
                  onBlur={calcularMontos}
className="bg-background border-border"
              required
              />
              </div>
              <div>
                <Label htmlFor="montoIva">IVA (19%)</Label>
                <Input
                  id="montoIva"
                  type="number"
                  value={formData.montoIva}
                  onChange={(e) => handleInputChange('montoIva', e.target.value)}
className="bg-background border-border"
            />
          </div>
          <div>
            <Label htmlFor="montoNeto">Monto Neto</Label>
            <Input
              id="montoNeto"
              type="number"
              value={formData.montoNeto}
              onChange={(e) => handleInputChange('montoNeto', e.target.value)}
              className="bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="bg-primary-foreground text-foreground hover:bg-secondary">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
            <Button type="button"  onClick={onCancel} className="border-input">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}