'use client';

import { useEffect, useState } from 'react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Spinner, toast } from '@enjambre/ui';
import { Check } from 'lucide-react';

interface PlanTerritorial {
  id: string;
  name: string;
  key: string;
  price_clp: number;
  frequency: string;
  description?: string | null;
  included_items: unknown[];
}

const PLAN_KEYS = ['trazabilidad', 'apiario_pro'];

const FEATURE_LABELS: Record<string, string> = {
  pasaportes_qr_ilimitados: 'Pasaportes QR ilimitados por lote',
  estadisticas_escaneos: 'Estadísticas de escaneos',
  cuaderno_campo_res_4590: 'Cuaderno de campo digital conforme a Res. SAG 4590/2025',
};

function featuresDe(items: unknown[]): string[] {
  return items
    .map((i) => (typeof i === 'object' && i !== null ? (i as { feature?: string }).feature : undefined))
    .filter((f): f is string => Boolean(f && FEATURE_LABELS[f]))
    .map((f) => FEATURE_LABELS[f]);
}

const formatCLP = (n: number) => n.toLocaleString('es-CL');

/**
 * Planes digitales del Registro Territorial (Trazabilidad / Apiario Pro).
 * El cobro es mensual vía Flow Pago Automático; las features no tienen gating
 * todavía (decisión de lanzamiento: primero el cobro, el gating después).
 */
export function PlanesTerritorialesView() {
  const apiFetch = useApiFetch();
  const [planes, setPlanes] = useState<PlanTerritorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [contratando, setContratando] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('id, name, key, price_clp, frequency, description, included_items')
          .eq('active', true)
          .in('key', PLAN_KEYS)
          .order('price_clp', { ascending: true });
        if (error) throw error;
        if (!cancelled) setPlanes((data ?? []) as PlanTerritorial[]);
      } catch {
        if (!cancelled) toast.error('Error cargando los planes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const contratar = async (plan: PlanTerritorial) => {
    setContratando(plan.id);
    try {
      const res = await apiFetch('/api/subscriptions/checkout/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          returnUrl: `${window.location.origin}/planes-territoriales/resultado`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message ?? 'No se pudo iniciar el pago');
        return;
      }
      if (json?.url) {
        window.location.href = json.url;
      }
    } catch {
      toast.error('No se pudo iniciar el pago');
    } finally {
      setContratando(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Planes del Registro Territorial</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          La inscripción en el censo es gratis y siempre lo será. Estos planes financian la
          infraestructura de la red: trazabilidad comercial y herramientas de gestión.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {planes.map((plan) => {
          const features = featuresDe(plan.included_items);
          return (
            <Card key={plan.id} className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  ${formatCLP(plan.price_clp)}/mes · pago automático mensual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                {features.length > 0 && (
                  <ul className="space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  className="w-full"
                  disabled={contratando === plan.id}
                  onClick={() => void contratar(plan)}
                >
                  {contratando === plan.id ? 'Redirigiendo al pago…' : 'Contratar'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground max-w-2xl">
        Pagos procesados por Flow (Pago Automático). Puedes pausar o cancelar tu suscripción cuando
        quieras desde tu perfil.
      </p>
    </div>
  );
}
