'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearLinkPago } from '@/lib/sumup/actions';
import { Loader2, Link as LinkIcon, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function PagosPage() {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'factura' | 'gasto' | 'servicio'>('servicio');
  const [isPending, startTransition] = useTransition();
  const [linkGenerado, setLinkGenerado] = useState<string>('');

  const handleGenerarLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const empresaId = process.env.NEXT_PUBLIC_EIRL_EMPRESA_ID || 'temp-empresa-id';
    
    startTransition(async () => {
      const result = await crearLinkPago({
        monto: parseFloat(monto),
        descripcion,
        tipo,
        empresaId,
      });

      if (result.success && result.checkoutUrl) {
        setLinkGenerado(result.checkoutUrl);
        toast.success('Link de pago generado');
      } else {
        toast.error(result.error || 'Error al generar link');
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(linkGenerado);
    toast.success('Link copiado al portapapeles');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-light mb-2">Links de Pago SumUp</h2>
          <p className="text-gray-400">
            Genera enlaces de pago para tus clientes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-black border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-light flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Generar Link de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerarLink} className="space-y-6">
                <div>
                  <Label htmlFor="monto">Monto (CLP)</Label>
                  <Input
                    id="monto"
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="bg-black border-gray-700"
                    placeholder="10000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="bg-black border-gray-700"
                    placeholder="Concepto del pago"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Tipo</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={tipo === 'factura' ? 'default' : 'outline'}
                      onClick={() => setTipo('factura')}
                      className={tipo === 'factura' ? 'bg-white text-black' : 'border-gray-600'}
                    >
                      Factura
                    </Button>
                    <Button
                      type="button"
                      variant={tipo === 'gasto' ? 'default' : 'outline'}
                      onClick={() => setTipo('gasto')}
                      className={tipo === 'gasto' ? 'bg-white text-black' : 'border-gray-600'}
                    >
                      Gasto
                    </Button>
                    <Button
                      type="button"
                      variant={tipo === 'servicio' ? 'default' : 'outline'}
                      onClick={() => setTipo('servicio')}
                      className={tipo === 'servicio' ? 'bg-white text-black' : 'border-gray-600'}
                    >
                      Servicio
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isPending || !monto || !descripcion}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Generar Link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-black border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-light">Link Generado</CardTitle>
            </CardHeader>
            <CardContent>
              {linkGenerado ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
                    <p className="text-sm text-gray-400 mb-2">URL del link de pago:</p>
                    <p className="text-white break-all">{linkGenerado}</p>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="border-gray-600 flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      onClick={() => window.open(linkGenerado, '_blank')}
                      className="bg-white text-black hover:bg-gray-200 flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-400">
                      💡 <strong>Tip:</strong> Envía este link a tu cliente por email, 
                      WhatsApp o cualquier medio. El cliente podrá pagar con tarjeta de 
                      crédito, débito, Apple Pay o Google Pay.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <LinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">
                    Genera un link de pago para comenzar
                  </p>
                </div>
              )}
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
            <a href="/pagos" className="text-white transition-colors">Pagos SumUp</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
