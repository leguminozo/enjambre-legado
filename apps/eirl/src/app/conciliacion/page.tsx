import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generarConciliacion, listarTransacciones } from '@/lib/sumup/actions';
import { formatCurrency, formatDate } from '@/lib/format';
import { RefreshCw, DollarSign, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

const EMPRESA_ID = process.env.EIRL_EMPRESA_ID || 'temp-empresa-id';

export default async function ConciliacionPage() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = now.toISOString();

  let conciliacion;
  let error;

  try {
    const result = await generarConciliacion({
      empresaId: EMPRESA_ID,
      desde: from,
      hasta: to,
    });

    conciliacion = result.data;
    error = result.error;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar conciliación';
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-light">Conciliación SumUp</h2>
              <p className="text-gray-400 mt-1">
                Conciliación automática de transacciones SumUp con facturas
              </p>
            </div>
            <form>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </form>
          </div>
        </div>

        {error ? (
          <Card className="bg-black border-gray-800">
            <CardContent className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        ) : conciliacion ? (
          <div className="space-y-8">
            <Suspense fallback={<MetricsSkeleton />}>
              <ConciliacionMetrics conciliacion={conciliacion} />
            </Suspense>

            <Suspense fallback={<TransactionsSkeleton />}>
              <ConciliacionTable conciliacion={conciliacion} />
            </Suspense>
          </div>
        ) : (
          <Card className="bg-black border-gray-800">
            <CardContent className="text-center py-12">
              <p className="text-gray-400">No hay datos de conciliación</p>
            </CardContent>
          </Card>
        )}
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
            <a href="/conciliacion" className="text-white transition-colors">Conciliación</a>
            <a href="/pagos" className="text-gray-300 hover:text-white transition-colors">Pagos SumUp</a>
          </nav>
        </div>
      </div>
    </header>
  );
}

interface ConciliacionMetricsProps {
  conciliacion: {
    totalTransacciones: number;
    montoTotal: number;
    montoComisiones: number;
    montoNeto: number;
    diferencias: any[];
  };
}

function ConciliacionMetrics({ conciliacion }: ConciliacionMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Transacciones</CardTitle>
          <FileText className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conciliacion.totalTransacciones}</div>
          <p className="text-xs text-gray-400">Mes actual</p>
        </CardContent>
      </Card>

      <Card className="bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Monto Total</CardTitle>
          <DollarSign className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(conciliacion.montoTotal)}</div>
          <p className="text-xs text-gray-400">Antes de comisiones</p>
        </CardContent>
      </Card>

      <Card className="bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Comisiones</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(conciliacion.montoComisiones)}</div>
          <p className="text-xs text-gray-400">Comisiones SumUp</p>
        </CardContent>
      </Card>

      <Card className="bg-black border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-400">Monto Neto</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(conciliacion.montoNeto)}</div>
          <p className="text-xs text-gray-400">Después de comisiones</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface ConciliacionTableProps {
  conciliacion: {
    transacciones: any[];
    diferencias: any[];
  };
}

function ConciliacionTable({ conciliacion }: ConciliacionTableProps) {
  return (
    <Card className="bg-black border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-light">Transacciones del Período</CardTitle>
      </CardHeader>
      <CardContent>
        {conciliacion.transacciones.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No hay transacciones en este período</p>
        ) : (
          <div className="space-y-4">
            {conciliacion.transacciones.map((t) => (
              <div
                key={t.transaction_id}
                className="flex items-center justify-between p-4 border border-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    t.conciliated ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />
                  <div>
                    <p className="font-medium">{t.transaction_id}</p>
                    <p className="text-sm text-gray-400">{formatDate(t.timestamp)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(t.amount)}</p>
                  <p className="text-xs text-gray-400">
                    {t.conciliated ? 'Conciliado' : 'Pendiente'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {conciliacion.diferencias.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Diferencias Detectadas
            </h3>
            <div className="space-y-2">
              {conciliacion.diferencias.map((d: any, i: number) => (
                <div key={i} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400">
                    Transacción {d.transactionId}: {d.tipo}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="bg-black border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <Card className="bg-black border-gray-800">
      <CardContent className="py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-900 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
