'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { crearEmpresa, getEmpresas, type Empresa } from '@/lib/actions/empresas';
import { Loader2, Building, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfiguracionPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Formulario de nueva empresa
  const [nuevaEmpresa, setNuevaEmpresa] = useState({
    rut: '',
    razonSocial: '',
    giro: '',
    email: '',
    telefono: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    region: ''
  });

  const handleCrearEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await crearEmpresa(nuevaEmpresa);
      
      if (result.success && result.data) {
        toast.success('Empresa creada exitosamente');
        setEmpresaId(result.data.id);
        // Recargar lista
        const lista = await getEmpresas();
        setEmpresas(lista);
        // Limpiar formulario
        setNuevaEmpresa({
          rut: '', razonSocial: '', giro: '', email: '', telefono: '',
          direccion: '', comuna: '', ciudad: '', region: ''
        });
      } else {
        toast.error(result.error || 'Error al crear empresa');
      }
    } catch (error) {
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarConfig = () => {
    localStorage.setItem('eirl_empresa_id', empresaId);
    toast.success('Configuración guardada');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-light mb-2">Configuración de Empresa</h2>
          <p className="text-gray-400">
            Configura tu empresa para comenzar a operar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de empresas */}
          <Card className="bg-black border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-light flex items-center gap-2">
                <Building className="h-5 w-5" />
                Empresas Registradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {empresas.length === 0 ? (
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-500">
                    No hay empresas registradas. Crea tu primera empresa.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {empresas.map((empresa) => (
                    <div
                      key={empresa.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        empresaId === empresa.id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-800 hover:border-gray-700'
                      }`}
                      onClick={() => setEmpresaId(empresa.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{empresa.razonSocial}</p>
                          <p className="text-sm text-gray-400">{empresa.rut}</p>
                        </div>
                        {empresaId === empresa.id && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleGuardarConfig}
                  disabled={!empresaId}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Formulario nueva empresa */}
          <Card className="bg-black border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-light">Nueva Empresa</CardTitle>
              <CardDescription>
                Ingresa los datos de tu empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCrearEmpresa} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      value={nuevaEmpresa.rut}
                      onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, rut: e.target.value})}
                      className="bg-black border-gray-700"
                      placeholder="11.111.111-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="razonSocial">Razón Social</Label>
                    <Input
                      id="razonSocial"
                      value={nuevaEmpresa.razonSocial}
                      onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, razonSocial: e.target.value})}
                      className="bg-black border-gray-700"
                      placeholder="EIRL PROPYME SpA"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="giro">Giro</Label>
                  <Input
                    id="giro"
                    value={nuevaEmpresa.giro}
                    onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, giro: e.target.value})}
                    className="bg-black border-gray-700"
                    placeholder="Servicios de consultoría"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={nuevaEmpresa.email}
                      onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, email: e.target.value})}
                      className="bg-black border-gray-700"
                      placeholder="contacto@empresa.cl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={nuevaEmpresa.telefono}
                      onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, telefono: e.target.value})}
                      className="bg-black border-gray-700"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={nuevaEmpresa.direccion}
                    onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, direccion: e.target.value})}
                    className="bg-black border-gray-700"
                    placeholder="Av. Principal 123"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="comuna">Comuna</Label>
                    <Input
                      id="comuna"
                      value={nuevaEmpresa.comuna}
                      onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, comuna: e.target.value})}
                      className="bg-black border-gray-700"
                      placeholder="Santiago"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      value={nuevaEmpresa.ciudad}
                      onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, ciudad: e.target.value})}
                      className="bg-black border-gray-700"
                      placeholder="Santiago"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Región</Label>
                    <Input
                      id="region"
                      value={nuevaEmpresa.region}
                      onChange={(e) => setNuevaEmpresa({...nuevaEmpresa, region: e.target.value})}
                      className="bg-black border-gray-700"
                      placeholder="RM"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !nuevaEmpresa.rut || !nuevaEmpresa.razonSocial}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Empresa'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-tight">EIRL PROPYME</h1>
          <nav className="hidden md:flex space-x-8">
            <a href="/" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
            <a href="/facturas" className="text-gray-300 hover:text-white transition-colors">Facturas</a>
            <a href="/gastos" className="text-gray-300 hover:text-white transition-colors">Gastos</a>
            <a href="/conciliacion" className="text-gray-300 hover:text-white transition-colors">Conciliación</a>
            <a href="/configuracion" className="text-white transition-colors">Configuración</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
