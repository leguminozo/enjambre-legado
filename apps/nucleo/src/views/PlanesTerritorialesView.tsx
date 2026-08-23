'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';
import {
  Button,
  Spinner,
  toast,
  Badge,
} from '@enjambre/ui';
import {
  Check,
  ArrowLeft,
  Sprout,
  QrCode,
  BookOpen,
  Store,
  Landmark,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TERRITORIAL_PAID_PLAN_KEYS,
} from '@/lib/territorial-rol';

interface PlanTerritorial {
  id: string;
  name: string;
  key: string;
  price_clp: number;
  frequency: string;
  description?: string | null;
  included_items: unknown[];
}

const PLAN_KEYS = [...TERRITORIAL_PAID_PLAN_KEYS];

const formatCLP = (n: number) => n.toLocaleString('es-CL');

/**
 * Vista de Planes y Servicios — Registro Territorial Apícola de Chiloé.
 * Inspirada en la interfaz de precios de Claude (Anthropic), adaptada
 * a la realidad de la apicultura regenerativa y territorial de Chiloé.
 */
export function PlanesTerritorialesView() {
  const apiFetch = useApiFetch();
  const router = useRouter();
  const [planes, setPlanes] = useState<PlanTerritorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [contratando, setContratando] = useState<string | null>(null);
  const [tab, setTab] = useState<'individual' | 'organizaciones'>('individual');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

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

  const planTrazabilidad = planes.find((p) => p.key === 'trazabilidad');
  const planPro = planes.find((p) => p.key === 'apiario_pro');

  const contratar = async (plan: PlanTerritorial | undefined, fallbackKey?: string) => {
    const targetPlan = plan ?? planes.find((p) => p.key === fallbackKey);
    if (!targetPlan) {
      toast.error('Plan no disponible temporalmente');
      return;
    }
    setContratando(targetPlan.id);
    try {
      const res = await apiFetch('/api/subscriptions/checkout/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: targetPlan.id,
          returnUrl: `${window.location.origin}/mis-planes/resultado`,
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

  const FAQS = [
    {
      q: '¿La inscripción en el censo tiene algún costo?',
      a: 'No. El censo comunal, el mapa comunitario y las alertas fitosanitarias de la Red son y seguirán siendo 100% gratuitos para siempre.',
    },
    {
      q: '¿Cómo funciona el pago automático mensual?',
      a: 'Se procesa de manera segura a través de Flow con tarjeta de débito o crédito chilena. Puedes pausar o cancelar en cualquier momento desde tu perfil sin cargos extra.',
    },
    {
      q: '¿Qué ocurre con mis datos si decido pausar mi plan?',
      a: 'Toda tu información, apiarios registrados y declaraciones en el censo permanecen intactos y protegidos en tu cuenta comunitaria gratuita.',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center p-16 gap-3">
        <Spinner />
        <p className="text-xs text-muted-foreground">Cargando planes de la red…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[var(--vh-full)] bg-background text-foreground pb-20">
      {/* Barra superior de navegación */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>

        <a
          href="https://wa.me/56940831358?text=Hola,%20tengo%20dudas%20sobre%20los%20planes%20de%20Enjambre%20Legado"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
        >
          <MessageCircle size={14} className="text-primary" />
          <span className="hidden sm:inline">¿Dudas con los planes?</span>
          <span>Contactar</span>
        </a>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center pt-8 pb-10 space-y-4">
        <h1 className="text-3xl sm:text-5xl font-bold font-serif tracking-tight text-foreground text-balance">
          Planes que crecen contigo
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
          El censo y la defensa territorial son gratuitos para siempre. Estos planes financian la tecnología para agregar valor a tu recolección y cumplir con la ley.
        </p>

        {/* Toggle Pill (Individual / Organizaciones) */}
        <div className="pt-4 flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-card border border-border/80 shadow-inner">
            <button
              type="button"
              onClick={() => setTab('individual')}
              className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                tab === 'individual'
                  ? 'bg-surface-raised text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Individual (Apicultores)
            </button>
            <button
              type="button"
              onClick={() => setTab('organizaciones')}
              className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                tab === 'organizaciones'
                  ? 'bg-surface-raised text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Organizaciones (Cooperativas y Municipios)
            </button>
          </div>
        </div>
      </div>

      {/* Contenido por pestaña */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {tab === 'individual' ? (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
            >
              {/* Tarjeta 1: Red Territorial (Free) */}
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-6 hover:border-border/90 transition-all">
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Sprout size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-serif text-foreground">Red Territorial</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Participa y protege el territorio</p>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground">$0</span>
                      <span className="text-xs text-muted-foreground">CLP / para siempre</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    disabled
                    className="w-full justify-center text-xs font-medium opacity-80"
                  >
                    Plan base incluido
                  </Button>
                </div>

                <div className="border-t border-border/70 pt-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Incluido en el censo:
                  </p>
                  <ul className="space-y-2.5 text-xs text-foreground">
                    {[
                      'Inscripción oficial en Censo Comunal (Ley 21.489)',
                      'Alertas fitosanitarias en tu radio (3 a 5 km)',
                      'Zona de pecoreo en mapa comunitario (~1 km)',
                      'Declaración SAG anual pre-llenada en octubre',
                      '1 Pasaporte QR de cortesía por temporada',
                      'Credencial comunitaria de apicultor registrado',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tarjeta 2: Trazabilidad ($2.990) */}
              <div className="flex flex-col justify-between rounded-2xl border-2 border-primary/40 bg-card p-6 sm:p-7 space-y-6 relative shadow-lg shadow-primary/5 hover:border-primary/60 transition-all">
                <div className="absolute -top-3 right-6">
                  <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 shadow">
                    Más popular
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                    <QrCode size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-serif text-foreground">Trazabilidad</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Diferenciación y valor para tu miel</p>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
                        ${formatCLP(planTrazabilidad?.price_clp ?? 2990)}
                      </span>
                      <span className="text-xs text-muted-foreground">CLP / mes</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">o $29.990 facturado por temporada</p>
                  </div>
                  <Button
                    className="w-full justify-center text-xs font-semibold shadow"
                    disabled={contratando === (planTrazabilidad?.id ?? 'trazabilidad')}
                    onClick={() => void contratar(planTrazabilidad, 'trazabilidad')}
                  >
                    {contratando === (planTrazabilidad?.id ?? 'trazabilidad') ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" /> Redirigiendo…
                      </span>
                    ) : (
                      'Obtener Trazabilidad'
                    )}
                  </Button>
                </div>

                <div className="border-t border-border/70 pt-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Todo lo de Red Territorial, más:
                  </p>
                  <ul className="space-y-2.5 text-xs text-foreground">
                    {[
                      'Pasaportes QR ilimitados por cada lote de recolección',
                      'Página pública interactiva con sello de origen Chiloé',
                      'Descarga de códigos QR en alta resolución para etiquetas',
                      'Estadísticas y analítica en vivo de escaneos de clientes',
                      'Certificado digital de procedencia biocultural',
                      'Cadena de custodia verificable para distribuidores',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tarjeta 3: Apiario Pro ($5.990) */}
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-7 space-y-6 hover:border-border/90 transition-all">
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-serif text-foreground">Apiario Pro</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Gestión técnica y cuaderno SAG digital</p>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
                        ${formatCLP(planPro?.price_clp ?? 5990)}
                      </span>
                      <span className="text-xs text-muted-foreground">CLP / mes</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">o $59.990 facturado por temporada</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-center text-xs font-semibold hover:bg-surface-raised"
                    disabled={contratando === (planPro?.id ?? 'apiario_pro')}
                    onClick={() => void contratar(planPro, 'apiario_pro')}
                  >
                    {contratando === (planPro?.id ?? 'apiario_pro') ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size="sm" /> Redirigiendo…
                      </span>
                    ) : (
                      'Obtener Apiario Pro'
                    )}
                  </Button>
                </div>

                <div className="border-t border-border/70 pt-5 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Todo lo de Trazabilidad, más:
                  </p>
                  <ul className="space-y-2.5 text-xs text-foreground">
                    {[
                      'Cuaderno de campo digital oficial (Res. SAG 4590/2025)',
                      'Respaldo exportable en PDF listo para fiscalización SAG',
                      'Registro sanitario y control de Varroa por colmena',
                      'Bitácora por voz con inteligencia apícola asistida',
                      'Historial fenológico y alertas de floración en bosque',
                      'Soporte técnico prioritario durante la temporada',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={14} className="text-accent mt-0.5 shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="organizaciones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"
            >
              {/* Tarjeta Organizaciones 1: Cooperativas */}
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-7 sm:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Store size={24} />
                    </div>
                    <Badge variant="default" className="border border-border/80 bg-surface-raised text-[11px] text-muted-foreground">
                      2 a 25 apicultores
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-serif text-foreground">Cooperativa / Asociación</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gestión centralizada de socios, apiarios y marcas colectivas.
                    </p>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground">$19.990</span>
                      <span className="text-xs text-muted-foreground">CLP / mes</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Facturación mensual o por temporada</p>
                  </div>
                  <a
                    href="mailto:obrerayzangano@gmail.com?subject=Inter%C3%A9s%20Plan%20Cooperativa%20Enjambre%20Legado"
                    className="inline-flex w-full min-h-11 items-center justify-center px-4 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-95 transition-opacity"
                  >
                    Solicitar plan cooperativo
                  </a>
                </div>

                <div className="border-t border-border/70 pt-6 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Funcionalidades para asociaciones:
                  </p>
                  <ul className="space-y-3 text-xs text-foreground">
                    {[
                      'Panel de control unificado para directorio y administradores',
                      'Emisión de pasaportes QR colectivos bajo marca comunitaria',
                      'Monitoreo sanitario y fitosanitario agregado de la agrupación',
                      'Capacitación presencial o telemática para los socios',
                      'Soporte directo con el equipo técnico de Enjambre Legado',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tarjeta Organizaciones 2: Institucional / Municipalidades */}
              <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-7 sm:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                      <Landmark size={24} />
                    </div>
                    <Badge variant="default" className="border border-border/80 bg-surface-raised text-[11px] text-muted-foreground">
                      Comunal / SAG / INDAP
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-serif text-foreground">Convenio Institucional</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ordenamiento territorial, alertas fitosanitarias y soberanía apícola.
                    </p>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-foreground">Convenio a la medida</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Según escala comunal o provincial</p>
                  </div>
                  <a
                    href="mailto:obrerayzangano@gmail.com?subject=Solicitud%20Convenio%20Institucional%20Registro%20Ap%C3%ADcola"
                    className="inline-flex w-full min-h-11 items-center justify-center px-4 border border-border bg-surface-raised text-foreground text-xs font-semibold rounded-lg hover:bg-card transition-colors"
                  >
                    Solicitar reunión institucional
                  </a>
                </div>

                <div className="border-t border-border/70 pt-6 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Herramientas de gestión pública:
                  </p>
                  <ul className="space-y-3 text-xs text-foreground">
                    {[
                      'Visor territorial para fiscalización de distancias mínimas legales',
                      'Módulo de emisión de avisos fitosanitarios a productores locales',
                      'Generación de estadísticas comunales e informes censales',
                      'Asesoría técnica para ordenanzas municipales apícolas',
                      'Interoperabilidad y respaldo de soberanía de datos',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check size={14} className="text-accent mt-0.5 shrink-0" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nota legal y de seguridad */}
        <p className="text-center text-xs text-muted-foreground mt-10 max-w-2xl mx-auto">
          *Precios en pesos chilenos con IVA incluido. Pagos procesados de forma segura con Flow (Pago Automático). Puedes pausar o cancelar tu suscripción en cualquier momento desde tu perfil.
        </p>

        {/* Preguntas Frecuentes Desplegables */}
        <div className="max-w-3xl mx-auto mt-16 pt-10 border-t border-border/70 space-y-4">
          <h4 className="text-center text-lg font-serif font-semibold text-foreground mb-6">
            Preguntas frecuentes sobre los planes
          </h4>
          <div className="space-y-2.5">
            {FAQS.map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-border/80 bg-card overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-medium text-foreground cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle size={15} className="text-primary shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
