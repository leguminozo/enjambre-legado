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
    <div className="min-h-screen bg-[#050505] text-[#f5f0e8] flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      <GrainOverlay />
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c9a227]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full space-y-12 relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-[#8a8279] hover:text-[#c9a227] transition-colors mb-12">
            <ArrowLeft size={14} /> Volver a la tienda
          </Link>
          <h1 className="font-display text-4xl font-light tracking-tight text-[#f5f0e8]">
            Únete al <span className="italic text-[#c9a227]">Legado</span>
          </h1>
          <p className="mt-4 text-sm text-[#8a8279] font-light tracking-wide">Sé parte de la comunidad guardián del bosque</p>
        </div>

        <form className="mt-8 space-y-8 bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/5 p-10 shadow-2xl" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">
                Nombre completo
              </label>
              <div className="relative group">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8279] group-focus-within:text-[#c9a227] transition-colors" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 pl-8 py-3 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors placeholder:text-zinc-800"
                  placeholder="Tu nombre"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="text-[0.6rem] uppercase tracking-[0.2em] text-[#8a8279]">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8279] group-focus-within:text-[#c9a227] transition-colors" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 pl-8 pr-10 py-3 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#c9a227] transition-colors placeholder:text-zinc-800"
                  placeholder="Mínimo 6 caracteres"
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
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </button>

          <div className="pt-4 text-center">
            <p className="text-[0.7rem] text-[#8a8279]">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-[#f5f0e8] hover:text-[#c9a227] underline underline-offset-4 decoration-white/10">
                Inicia sesión
              </Link>
            </p>
          </div>
        </form>

        <p className="text-center text-[0.6rem] tracking-[0.1em] text-[#8a8279] uppercase">
          Regeneración y Legado • Chiloé
        </p>
      </div>
    </div>
  );
}
