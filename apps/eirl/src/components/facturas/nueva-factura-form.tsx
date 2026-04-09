"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Save, X } from "lucide-react";

interface Tercero {
  id: string;
  nombre: string;
  rut: string;
  email?: string;
}

interface NuevaFacturaFormProps {
  onSave: (factura: any) => void;
  onCancel: () => void;
}

export function NuevaFacturaForm({ onSave, onCancel }: NuevaFacturaFormProps) {
  const [formData, setFormData] = useState({
    numero: "",
    fecha: new Date().toISOString().split('T')[0],
    fechaVencimiento: "",
    montoTotal: "",
    montoNeto: "",
    montoIva: "",
    montoExento: "0",
    montoIvaUsado: "0",
    descripcion: "",
    tipoDocumento: "Factura",
    clienteId: ""
  });
  
  const [clientes, setClientes] = useState<Tercero[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    giro: ""
  });
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);

  // Cargar clientes
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await fetch('/api/terceros?tipo=Cliente');
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNuevoClienteChange = (field: string, value: string) => {
    setNuevoCliente(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calcularIVA = () => {
    const montoNeto = parseFloat(formData.montoNeto) || 0;
    const iva = montoNeto * 0.19;
    const total = montoNeto + iva;
    
    setFormData(prev => ({
      ...prev,
      montoIva: iva.toFixed(0),
      montoTotal: total.toFixed(0)
    }));
  };

  const crearNuevoCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.rut) {
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
          tipo: 'Cliente',
          ...nuevoCliente
        })
      });

      if (response.ok) {
        const cliente = await response.json();
        setClientes(prev => [...prev, cliente]);
        setFormData(prev => ({ ...prev, clienteId: cliente.id }));
        setMostrarNuevoCliente(false);
        setNuevoCliente({
          nombre: "",
          rut: "",
          email: "",
          telefono: "",
          direccion: "",
          giro: ""
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear cliente');
      }
    } catch (error) {
      console.error('Error creando cliente:', error);
      alert('Error al crear cliente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero || !formData.fecha || !formData.montoTotal) {
      alert('Número, fecha y monto total son requeridos');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/facturas-emitidas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          empresaId: "temp-empresa-id", // ID temporal
          montoTotal: parseFloat(formData.montoTotal),
          montoNeto: parseFloat(formData.montoNeto),
          montoIva: parseFloat(formData.montoIva),
          montoExento: parseFloat(formData.montoExento),
          montoIvaUsado: parseFloat(formData.montoIvaUsado)
        })
      });

      if (response.ok) {
        const factura = await response.json();
        onSave(factura);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear factura');
      }
    } catch (error) {
      console.error('Error creando factura:', error);
      alert('Error al crear factura');
    } finally {
      setLoading(false);
    }
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número Factura</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                className="bg-black border-gray-700"
                required
              />
            </div>
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
          </div>

          {/* Cliente */}
          <div>
            <Label>Cliente</Label>
            <div className="space-y-2">
              <Select value={formData.clienteId} onValueChange={(value) => handleInputChange('clienteId', value)}>
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
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setMostrarNuevoCliente(!mostrarNuevoCliente)}
                className="w-full border-gray-600"
              >
                {mostrarNuevoCliente ? 'Cancelar' : 'Crear Nuevo Cliente'}
              </Button>
            </div>
          </div>

          {/* Nuevo Cliente Form */}
          {mostrarNuevoCliente && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={nuevoCliente.nombre}
                        onChange={(e) => handleNuevoClienteChange('nombre', e.target.value)}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label>RUT</Label>
                      <Input
                        value={nuevoCliente.rut}
                        onChange={(e) => handleNuevoClienteChange('rut', e.target.value)}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={nuevoCliente.email}
                        onChange={(e) => handleNuevoClienteChange('email', e.target.value)}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label>Teléfono</Label>
                      <Input
                        value={nuevoCliente.telefono}
                        onChange={(e) => handleNuevoClienteChange('telefono', e.target.value)}
                        className="bg-gray-800 border-gray-600"
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={crearNuevoCliente} className="w-full">
                    Crear Cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Montos */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Montos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="montoNeto">Monto Neto</Label>
                <Input
                  id="montoNeto"
                  type="number"
                  value={formData.montoNeto}
                  onChange={(e) => handleInputChange('montoNeto', e.target.value)}
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
                  value={formData.montoIva}
                  onChange={(e) => handleInputChange('montoIva', e.target.value)}
                  className="bg-black border-gray-700"
                  required
                />
              </div>
              <div>
                <Label htmlFor="montoTotal">Monto Total</Label>
                <Input
                  id="montoTotal"
                  type="number"
                  value={formData.montoTotal}
                  onChange={(e) => handleInputChange('montoTotal', e.target.value)}
                  className="bg-black border-gray-700"
                  required
                />
              </div>
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
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-gray-200">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar Factura'}
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