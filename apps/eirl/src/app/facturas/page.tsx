import { Suspense } from 'react';
import { getFacturasEmitidas } from '@/lib/actions/facturas';
import { ListaFacturas } from '@/components/facturas/lista-facturas';
import { NuevaFacturaForm } from '@/components/facturas/nueva-factura-form';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const EMPRESA_ID = process.env.EIRL_EMPRESA_ID || 'temp-empresa-id';

export default async function FacturasPage() {
  const facturas = await getFacturasEmitidas(EMPRESA_ID);
  
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light tracking-tight">Facturas</h1>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
              <a href="/facturas" className="text-white transition-colors">Facturas</a>
              <a href="/gastos" className="text-gray-300 hover:text-white transition-colors">Gastos</a>
              <a href="/impuestos" className="text-gray-300 hover:text-white transition-colors">Impuestos</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-light mb-2">Facturas Emitidas</h2>
          <p className="text-gray-400">Administra tus facturas emitidas</p>
        </div>

        <Suspense fallback={<FacturasSkeleton />}>
          <FacturasContent facturasInitiales={facturas} />
        </Suspense>
      </main>
    </div>
  );
}

function FacturasSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-900 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function FacturasContent({ facturasInitiales }: { facturasInitiales: any[] }) {
  return (
    <>
      <div className="mb-6">
        <Button className="bg-white text-black hover:bg-gray-200">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      <ListaFacturas facturasInitiales={facturasInitiales} empresaId={EMPRESA_ID} />
    </>
  );
}
