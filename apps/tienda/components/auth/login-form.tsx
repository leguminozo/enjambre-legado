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
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a227]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f0e8] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      <GrainOverlay />
      
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c9a227]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-12 relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-[#8a8279] hover:text-[#c9a227] transition-colors mb-12">
            <ArrowLeft size={14} /> Volver a la tienda
          </Link>
          <h1 className="font-display text-4xl font-light tracking-tight text-[#f5f0e8]">
            Identidad <span className="italic text-[#c9a227]">Legado</span>
          </h1>
          <p className="mt-4 text-sm text-[#8a8279] font-light tracking-wide">Acceso al panel de control y gestión</p>
        </div>

        <form className="mt-8 space-y-8 bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/5 p-10 shadow-2xl" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">
                Correo electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8279] group-focus-within:text-[#c9a227] transition-colors" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 pl-8 py-3 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors placeholder:text-zinc-800"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">
                  Contraseña
                </label>
                <Link href="#" className="text-[0.6rem] uppercase tracking-[0.1em] text-[#8a8279] hover:text-[#c9a227]">
                  ¿Olvidaste?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8279] group-focus-within:text-[#c9a227] transition-colors" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 pl-8 pr-10 py-3 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors placeholder:text-zinc-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#8a8279] hover:text-[#c9a227]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-red-900/30 bg-red-950/20 px-4 py-3 text-[0.7rem] text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 border border-[#c9a227] text-[#c9a227] text-[0.7rem] uppercase tracking-[0.3em] hover:bg-[#c9a227] hover:text-black transition-all duration-500 disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>

          <div className="pt-4 text-center">
            <p className="text-[0.7rem] text-[#8a8279]">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-[#f5f0e8] hover:text-[#c9a227] underline underline-offset-4 decoration-white/10">
                Únete al legado
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-[0.6rem] tracking-[0.1em] text-[#8a8279] uppercase">
          Acceso Restringido • Tienda Enjambre
        </p>
      </div>
    </div>
  );
}
