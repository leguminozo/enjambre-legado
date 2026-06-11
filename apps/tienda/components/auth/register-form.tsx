'use client';

import { useAuth } from '@/components/providers/auth-context';
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GrainOverlay } from '@/components/shop/grain-overlay';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(email, password, fullName);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.message || 'Error al crear la cuenta');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      <GrainOverlay />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-12 relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors mb-12">
            <ArrowLeft size={14} /> Volver a la tienda
          </Link>
          <h1 className="font-display text-4xl font-light tracking-tight text-foreground">
            Únete al <span className="italic text-accent">Legado</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground font-light tracking-wide">Sé parte de la comunidad guardián del bosque</p>
        </div>

        <form className="mt-8 space-y-8 bg-surface-raised/80 backdrop-blur-xl border border-border p-10 shadow-2xl" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Nombre completo
              </label>
              <div className="relative group">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-b border-border pl-8 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/50"
                  placeholder="Tu nombre"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Correo electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-border pl-8 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/50"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-border pl-8 pr-10 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/50"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-[0.7rem] text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 border border-accent text-accent text-[0.7rem] uppercase tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-all duration-500 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </button>

          <div className="pt-4 text-center">
            <p className="text-[0.7rem] text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-foreground hover:text-accent underline underline-offset-4 decoration-border">
                Inicia sesión
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-[0.6rem] tracking-[0.1em] text-muted-foreground uppercase">
          Regeneración y Legado • Chiloé
        </p>
      </div>
    </div>
  );
}
