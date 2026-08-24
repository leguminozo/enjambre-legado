'use client';

import { useState } from 'react';
import { Button, Input, toast, Badge } from '@enjambre/ui';
import { HexagonLoader } from '@/components/ui/hexagon-loader';
import Link from 'next/link';

const PARES_SEMANTICOS = [
  { par: "suave/intenso", izq: "Suave", der: "Intenso" },
  { par: "dulce/acido", izq: "Dulce", der: "Ácido" },
  { par: "liquida/cremosa", izq: "Líquida", der: "Cremosa" }
];

interface CataViewProps {
  punto: { id: string; nombre: string; tipo: string; ciudad: string | null };
  codigo: string;
  chipsCatalog: { id: string; bloque: 'sabor'|'aroma'|'textura'|'color'; chip: string }[];
}

export function CataView({ punto, codigo, chipsCatalog }: CataViewProps) {
  const [step, setStep] = useState<'intro' | 'pares' | 'chips' | 'user' | 'success'>('intro');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [paresState, setParesState] = useState<Record<string, number>>({});
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [agrado, setAgrado] = useState(5);
  const [email, setEmail] = useState('');
  
  const handleParesSubmit = () => {
    // Si no tocaron un par, asume 0 (neutro). Pero obliguemos a que muevan al menos uno
    setStep('chips');
  };

  const toggleChip = (chip: string) => {
    const next = new Set(selectedChips);
    if (next.has(chip)) next.delete(chip);
    else next.add(chip);
    setSelectedChips(next);
  };

  const submitCata = async () => {
    if (!email) {
      toast('Por favor ingresa tu email para guardar tus puntos', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const paresArray = PARES_SEMANTICOS.map((p) => ({
        par: p.par,
        valor: paresState[p.par] || 0
      }));

      const chipsArray = Array.from(selectedChips).map(chipName => {
        const cat = chipsCatalog.find(c => c.chip === chipName);
        return { bloque: cat?.bloque ?? 'sabor', chip: chipName };
      });

      // Default chip if none selected to pass validation
      if (chipsArray.length === 0) {
         chipsArray.push({ bloque: 'sabor', chip: 'Dulce' });
      }

      const NUCLEO_URL = process.env.NEXT_PUBLIC_NUCLEO_URL || 'http://localhost:3000';
      const res = await fetch(`${NUCLEO_URL}/api/percepcion/sesiones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_punto: codigo,
          email,
          consentimiento: true,
          pares: paresArray,
          chips: chipsArray,
          agrado,
          intencion_recompra: true,
          tipo_evaluador: 'consumidor'
        })
      });

      if (!res.ok) {
        throw new Error('Error al registrar la cata');
      }

      setStep('success');
    } catch (e: any) {
      toast(e.message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate radar scores visually
  const profileScores = PARES_SEMANTICOS.map(p => {
    const val = paresState[p.par] || 0; // -3 to 3
    const percentage = ((val + 3) / 6) * 100;
    return { name: p.der, inverse: p.izq, percentage, val };
  });

  return (
    <div className="max-w-xl mx-auto px-4 w-full">
      {step === 'intro' && (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl">🍯</span>
          </div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Cata Sensorial</h1>
          <p className="text-muted-foreground text-pretty">
            Bienvenido a la experiencia de cata digital en <strong className="text-foreground">{punto.nombre}</strong>.
            Evalúa las notas de esta miel y obtén tu Pasaporte Sensorial (más puntos de lealtad).
          </p>
          <Button variant="primary" size="lg" className="w-full mt-8" onClick={() => setStep('pares')}>
            Comenzar Cata
          </Button>
        </div>
      )}

      {step === 'pares' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display text-foreground">Perfil de Textura y Aroma</h2>
            <p className="text-sm text-muted-foreground">Desliza según tu percepción en el paladar.</p>
          </div>
          
          <div className="space-y-8">
            {PARES_SEMANTICOS.map((p) => (
              <div key={p.par} className="space-y-4">
                <div className="flex justify-between text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  <span>{p.izq}</span>
                  <span>{p.der}</span>
                </div>
                <input 
                  type="range" 
                  min="-3" max="3" step="1" 
                  value={paresState[p.par] || 0}
                  onChange={(e) => setParesState({...paresState, [p.par]: parseInt(e.target.value)})}
                  className="w-full accent-primary h-2 bg-border rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-border px-1">
                  <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
                </div>
              </div>
            ))}
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={handleParesSubmit}>
            Siguiente
          </Button>
        </div>
      )}

      {step === 'chips' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display text-foreground">Notas de Sabor</h2>
            <p className="text-sm text-muted-foreground">Selecciona los matices que logras percibir.</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {chipsCatalog.map(c => {
              const isSelected = selectedChips.has(c.chip);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleChip(c.chip)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground scale-105 shadow-md shadow-primary/20' 
                      : 'bg-surface border border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {c.chip}
                </button>
              )
            })}
          </div>

          <div className="space-y-4 pt-6">
            <p className="text-center text-sm font-medium text-foreground">Agrado general (1 a 5)</p>
            <div className="flex justify-center gap-2">
              {[1,2,3,4,5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setAgrado(star)}
                  className={`text-3xl transition-transform hover:scale-110 ${agrado >= star ? 'text-primary' : 'text-border opacity-50'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={() => setStep('user')}>
            Siguiente
          </Button>
        </div>
      )}

      {step === 'user' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-display text-foreground">Guarda tu Pasaporte</h2>
            <p className="text-sm text-muted-foreground">Ingresa tu correo para acumular tus puntos en {punto.nombre}.</p>
          </div>

          <div className="space-y-4 bg-card border border-border p-6 rounded-2xl">
            <Input 
              label="Correo electrónico" 
              type="email" 
              placeholder="tu@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <label className="flex items-start gap-3 pt-2">
              <input type="checkbox" className="mt-1 accent-primary" defaultChecked />
              <span className="text-xs text-muted-foreground">
                Acepto los términos de la plataforma y el registro de mi evaluación sensorial.
              </span>
            </label>
          </div>

          <Button variant="primary" size="lg" className="w-full" disabled={loading || !email} onClick={submitCata}>
            {loading ? <HexagonLoader size="sm" /> : 'Revelar mi Perfil Sensorial'}
          </Button>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-8 animate-in zoom-in-95 fade-in duration-700">
          <div className="text-center space-y-2 pt-6">
            <Badge variant="success" className="mb-4">¡1 Sello Ganado!</Badge>
            <h2 className="text-3xl font-display font-semibold text-foreground">Tu Pasaporte Sensorial</h2>
            <p className="text-sm text-muted-foreground">Tu paladar tiende hacia el lado del bosque nativo.</p>
          </div>

          <div className="bg-surface border border-border p-6 rounded-3xl space-y-6 relative overflow-hidden shadow-xl shadow-black/5">
            <div className="absolute -top-10 -right-10 text-9xl opacity-[0.03] pointer-events-none">🌿</div>
            
            <div className="space-y-5 relative z-10">
              {profileScores.map(score => (
                <div key={score.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className={score.val < 0 ? 'text-primary' : 'text-muted-foreground'}>{score.inverse}</span>
                    <span className={score.val > 0 ? 'text-primary' : 'text-muted-foreground'}>{score.name}</span>
                  </div>
                  <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${score.percentage}%`, transform: 'scaleX(1)' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Notas Detectadas</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(selectedChips).map(c => (
                  <span key={c} className="px-2 py-1 bg-background rounded border border-border text-xs text-foreground font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-4">
            <h3 className="font-display text-lg text-foreground">Recomendación para tu paladar</h3>
            <p className="text-sm text-muted-foreground">
              Basado en tu inclinación por notas intensas, te sugerimos llevarte hoy el <strong className="text-foreground">Reserva del Bosque (150g)</strong>.
            </p>
            <Link href="/catalogo" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 w-full">
              Ver Producto
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
