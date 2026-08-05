'use client';

import { useEffect, useState } from 'react';
import { Leaf, BookOpen, AlertTriangle, TreePine, Scale } from 'lucide-react';

type Metodologia = {
  version: string;
  actualizado: string;
  territorio: string;
  coeficientes: {
    co2_ton_por_arbol: number;
    co2_emitido_ton_por_arbol: number;
    co2_evitado_kg_por_kg_miel: number;
    co2_evitado_kg_por_frasco_500g: number;
  };
  formulas: {
    co2_ton_plantacion: string;
    irr_simplificado: string;
    co2_frasco_500g: string;
  };
  fuentes: Array<{ id: string; titulo: string; nota: string; url?: string }>;
  limites: Array<{ id: string; texto: string }>;
};

type OpenBook = {
  metodologia_version: string;
  arboles_plantados: number;
  co2_secuestrado_ton: number;
  irr_simplificado: number | null;
  zonas: number;
  especies: number;
  nota: string;
  generado_en?: string;
};

/**
 * Open-book de impacto + metodología publicada (movimientos 7 y 12).
 * Sin login. Sin GPS de predios.
 */
export default function ImpactoPublicoPage() {
  const [metodo, setMetodo] = useState<Metodologia | null>(null);
  const [book, setBook] = useState<OpenBook | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/impacto/metodologia').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/impacto/open-book').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([m, b]) => {
        setMetodo(m?.data ?? null);
        setBook(b?.data ?? null);
        if (!m?.data) setError('No se pudo cargar la metodología');
      })
      .catch(() => setError('Error de red al cargar impacto'));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-primary text-primary-foreground px-6 py-14 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10 max-w-lg mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80 mb-3">Open-book · Regeneración</p>
          <h1 className="text-3xl font-serif font-bold leading-tight">Impacto verificable</h1>
          <p className="mt-3 text-sm opacity-85 leading-relaxed">
            Coeficientes públicos, fórmulas abiertas y agregados sin datos personales.
            No es sello de terceros: es nuestra contabilidad de impacto, con límites explícitos.
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 -mt-6 pb-16 flex flex-col gap-4 relative z-10">
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Open book live */}
        <section className="rounded-2xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TreePine className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Libro abierto (vivo)</h2>
          </div>
          {book ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Árboles plantados" value={book.arboles_plantados.toLocaleString('es-CL')} />
                <Stat
                  label="CO₂ secuestrado"
                  value={`${book.co2_secuestrado_ton} t`}
                />
                <Stat
                  label="IRR simplificado"
                  value={book.irr_simplificado != null ? String(book.irr_simplificado) : '—'}
                />
                <Stat
                  label="Zonas · especies"
                  value={`${book.zonas} · ${book.especies}`}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{book.nota}</p>
              <p className="mt-1 text-[0.65rem] text-muted-foreground font-mono">
                metodología {book.metodologia_version}
                {book.generado_en
                  ? ` · ${new Date(book.generado_en).toLocaleString('es-CL')}`
                  : ''}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Cargando agregados…</p>
          )}
        </section>

        {/* Methodology */}
        <section className="rounded-2xl border border-border bg-card shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Metodología</h2>
          </div>
          {metodo ? (
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Versión</p>
                <p className="font-mono font-medium">
                  {metodo.version} · actualizado {metodo.actualizado}
                </p>
                <p className="text-muted-foreground text-xs mt-1">{metodo.territorio}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" /> Coeficientes
                </p>
                <ul className="space-y-1.5 text-xs font-mono bg-surface-sunken rounded-xl p-3">
                  <li>co2_ton_por_arbol = {metodo.coeficientes.co2_ton_por_arbol}</li>
                  <li>
                    co2_emitido_ton_por_arbol = {metodo.coeficientes.co2_emitido_ton_por_arbol}
                  </li>
                  <li>
                    co2_evitado_kg_por_kg_miel = {metodo.coeficientes.co2_evitado_kg_por_kg_miel}
                  </li>
                  <li>
                    co2_evitado_kg_por_frasco_500g ={' '}
                    {metodo.coeficientes.co2_evitado_kg_por_frasco_500g}
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Fórmulas
                </p>
                <ul className="space-y-2 text-xs font-mono bg-surface-sunken rounded-xl p-3">
                  <li>{metodo.formulas.co2_ton_plantacion}</li>
                  <li>{metodo.formulas.irr_simplificado}</li>
                  <li>{metodo.formulas.co2_frasco_500g}</li>
                </ul>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Fuentes
                </p>
                <ul className="space-y-3">
                  {metodo.fuentes.map((f) => (
                    <li key={f.id} className="text-xs leading-relaxed">
                      <span className="font-semibold text-foreground">{f.titulo}</span>
                      <br />
                      <span className="text-muted-foreground">{f.nota}</span>
                      {f.url && (
                        <>
                          <br />
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {f.url}
                          </a>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
                <div className="flex items-center gap-2 text-warning text-xs font-bold uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Límites (léelos)
                </div>
                <ul className="space-y-1.5 text-xs text-foreground/85">
                  {metodo.limites.map((l) => (
                    <li key={l.id}>· {l.texto}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Cargando metodología…</p>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground px-2 leading-relaxed">
          <Leaf className="inline w-3.5 h-3.5 mr-1 opacity-70" />
          Obrera y Zángano · Red Apícola Territorial · Chiloé
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-sunken rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}
