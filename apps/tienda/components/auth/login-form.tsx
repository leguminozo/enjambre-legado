'use client';

import { useAuth } from '@/components/providers/auth-context';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GrainOverlay } from '@/components/shop/grain-overlay';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.message || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      </div>
    );
  }

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
            Identidad <span className="italic text-accent">Legado</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground font-light tracking-wide">Acceso al panel de control y gestión</p>
        </div>

        <form className="mt-8 space-y-8 bg-surface-raised/80 backdrop-blur-xl border border-border p-10 shadow-2xl" onSubmit={handleSubmit}>
          <div className="space-y-6">
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
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Contraseña
                </label>
                <Link href="#" className="text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground hover:text-accent">
                  ¿Olvidaste?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-border pl-8 pr-10 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/50"
                  placeholder="••••••••"
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
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>

          <div className="pt-4 text-center">
            <p className="text-[0.7rem] text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-foreground hover:text-accent underline underline-offset-4 decoration-border">
                Únete al legado
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-[0.6rem] tracking-[0.1em] text-muted-foreground uppercase">
          Acceso Restringido • Tienda Enjambre
        </p>
      </div>
    </div>
  );
}
