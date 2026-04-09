"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Save, X, Calculator } from "lucide-react";

interface Tercero {
  id: string;
  nombre: string;
  rut: string;
  email?: string;
}

interface NuevoGastoFormProps {
  onSave: (gasto: any) => void;
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

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      const response = await fetch('/api/terceros?tipo=Proveedor');
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

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
      alert('Nombre y RUT son requeridos');
      return;
    }

    try {
      const response = await fetch('/api/terceros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        alert(error.error || 'Error al crear proveedor');
      }
    } catch (error) {
      console.error('Error creando proveedor:', error);
      alert('Error al crear proveedor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fecha || !formData.descripcion || !formData.monto || !formData.categoria) {
      alert('Fecha, descripción, monto y categoría son requeridos');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          empresaId: "temp-empresa-id", // ID temporal
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
        alert(error.error || 'Error al crear gasto');
      }
    } catch (error) {
      console.error('Error creando gasto:', error);
      alert('Error al crear gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-black border-gray-800">
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
                className="bg-black border-gray-700"
                required
              />
            </div>
            <div>
              <Label htmlFor="categoria">Categoría</Label>
              <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                <SelectTrigger className="bg-black border-gray-700">
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
              className="bg-black border-gray-700"
              rows={3}
              required
            />
          </div>

          {/* Proveedor */}
          <div>
            <Label>Proveedor</Label>
            <div className="space-y-2">
              <Select value={formData.proveedorId} onValueChange={(value) => handleInputChange('proveedorId', value)}>
                <SelectTrigger className="bg-black border-gray-700">
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
                variant="outline"
                onClick={() => setMostrarNuevoProveedor(!mostrarNuevoProveedor)}
                className="w-full border-gray-600"
              >
                {mostrarNuevoProveedor ? 'Cancelar' : 'Crear Nuevo Proveedor'}
              </Button>
            </div>
          </div>

          {/* Nuevo Proveedor Form */}
          {mostrarNuevoProveedor && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={nuevoProveedor.nombre}
                        onChange={(e) => handleNuevoProveedorChange('nombre', e.target.value)}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label>RUT</Label>
                      <Input
                        value={nuevoProveedor.rut}
                        onChange={(e) => handleNuevoProveedorChange('rut', e.target.value)}
                        className="bg-gray-800 border-gray-600"
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
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label>Teléfono</Label>
                      <Input
                        value={nuevoProveedor.telefono}
                        onChange={(e) => handleNuevoProveedorChange('telefono', e.target.value)}
                        className="bg-gray-800 border-gray-600"
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
                <SelectTrigger className="bg-black border-gray-700">
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
                className="bg-black border-gray-700"
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
                  className="bg-black border-gray-700"
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
                  className="bg-black border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="montoNeto">Monto Neto</Label>
                <Input
                  id="montoNeto"
                  type="number"
                  value={formData.montoNeto}
                  onChange={(e) => handleInputChange('montoNeto', e.target.value)}
                  className="bg-black border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-gray-200">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}