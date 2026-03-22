"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Si ya está logueado, redirigir a home
    const userData = localStorage.getItem('eureka-user');
    if (userData) {
      router.push('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simular validación
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      setIsLoading(false);
      return;
    }

    // Simular delay de login
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Usuarios de prueba (en producción esto vendría de una API)
    const testUsers = [
      { email: 'admin@eureka.cl', password: 'admin123', name: 'Administrador', role: 'admin' },
      { email: 'cliente@eureka.cl', password: 'cliente123', name: 'Cliente', role: 'customer' },
      { email: 'test@eureka.cl', password: 'test123', name: 'Usuario Test', role: 'customer' }
    ];

    const user = testUsers.find(u => u.email === email && u.password === password);

    if (user) {
      // Guardar usuario en localStorage
      const userData = {
        id: Date.now(),
        email: user.email,
        name: user.name,
        role: user.role,
        loyaltyPoints: user.role === 'customer' ? Math.floor(Math.random() * 100) + 50 : 0
      };
      
      localStorage.setItem('eureka-user', JSON.stringify(userData));
      
      // Redirigir a home
      router.push('/');
    } else {
      setError('Email o contraseña incorrectos');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen eureka-theme flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-white shadow-2xl border-2 border-amber-300/50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  alt="Eureka Cafe" 
                  src="/eureka-logo-new.png" 
                  className="w-full h-full object-contain p-2 filter brightness-0"
                />
              </div>
            </div>
            <span className="font-light tracking-wide text-3xl text-white">Eureka!</span>
          </div>
          <h1 className="text-2xl font-light text-white mb-2">Iniciar Sesión</h1>
          <p className="text-eureka-text-secondary">Accede a tu cuenta del Club Eureka</p>
        </div>

        {/* Formulario */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full eureka-btn-white py-3 text-lg font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Usuarios de prueba */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Usuarios de prueba:</p>
            <div className="space-y-1 text-xs text-gray-300">
              <div>admin@eureka.cl / admin123</div>
              <div>cliente@eureka.cl / cliente123</div>
              <div>test@eureka.cl / test123</div>
            </div>
          </div>

          {/* Enlaces */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Volver al inicio */}
        <div className="text-center mt-6">
          <Link href="/" className="text-amber-400 hover:text-amber-300 transition-colors text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
