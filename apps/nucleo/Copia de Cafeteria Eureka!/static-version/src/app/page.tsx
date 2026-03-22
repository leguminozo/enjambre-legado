"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar si el usuario está logueado
    const userData = localStorage.getItem('eureka-user');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('eureka-user');
    localStorage.removeItem('eureka-cart');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <div className="min-h-screen eureka-theme flex flex-col">
      {/* Header */}
      <header className="eureka-header">
        <div className="eureka-container px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center eureka-spacing">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full bg-white shadow-2xl border-2 border-amber-300/50"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      alt="Eureka Cafe" 
                      src="/eureka-logo-new.png" 
                      className="w-full h-full object-contain p-1 filter brightness-0"
                    />
                  </div>
                </div>
                <span className="font-light tracking-wide text-xl text-white">Eureka!</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Link href="/nosotros">
                <button className="eureka-btn-outline border-0">
                  Sobre Nosotros
                </button>
              </Link>
              
              {isLoggedIn ? (
                <div className="flex items-center gap-4">
                  <span className="text-white text-sm">¡Hola, {user?.name}!</span>
                  <Link href="/carrito">
                    <button className="eureka-btn-white">
                      🛒 Carrito
                    </button>
                  </Link>
                  <button onClick={handleLogout} className="eureka-btn-outline">
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <button className="eureka-btn-outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Iniciar Sesión
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative eureka-spacing-large px-4 flex-1">
        <div className="eureka-container text-center">
          <div className="mb-12">
            <h1 className="eureka-responsive-text font-light eureka-title mb-6 tracking-wide">
              Eureka!
            </h1>
            <p className="text-xl eureka-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed">
              Café de especialidad, Repostería de autor, Juice bar en el corazón de Castro, Chiloé
            </p>
            
            <div className="eureka-responsive-spacing justify-center">
              <Link href="/catalogo">
                <button className="eureka-btn-white px-8 py-3 text-lg font-medium eureka-rounded eureka-transition eureka-hover-scale">
                  Ver Menú
                </button>
              </Link>
              
              <Link href="/fidelizacion">
                <button className="eureka-btn-outline px-8 py-3 text-lg font-medium eureka-rounded eureka-transition">
                  Unirse al Club
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="eureka-theme border-t border-white/10 py-8 px-4 mt-auto">
        <div className="eureka-container">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full bg-white shadow-2xl border-2 border-amber-300/50"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img 
                      alt="Eureka Cafe" 
                      src="/eureka-logo-new.png" 
                      className="w-full h-full object-contain p-1 filter brightness-0"
                    />
                  </div>
                </div>
                <span className="font-light tracking-wide text-xl text-white">Eureka!</span>
              </div>
            </div>
            <p className="eureka-text-secondary max-w-xl mx-auto text-sm">
              Descubre el sabor auténtico de Chiloé en cada taza, cada bocado y cada sorbo
            </p>
          </div>

          <div className="text-center mb-6">
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="eureka-text-secondary text-sm">Blanco Encalada 128, Castro, Chiloé</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" />
                <span className="eureka-text-secondary text-sm">+56 9 1234 5678</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span className="eureka-text-secondary text-sm">hola@eureka.cl</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <div className="flex justify-center gap-4">
              <a href="#" className="eureka-text-secondary hover:text-amber-400 transition-colors p-2 rounded-full hover:bg-white/5">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="eureka-text-secondary hover:text-amber-400 transition-colors p-2 rounded-full hover:bg-white/5">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="eureka-text-secondary hover:text-amber-400 transition-colors p-2 rounded-full hover:bg-white/5">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="eureka-text-secondary hover:text-amber-400 transition-colors p-2 rounded-full hover:bg-white/5">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mb-6"></div>
          
          <div className="text-center">
            <p className="eureka-text-muted text-sm mb-2">
              © 2024 Eureka! Todos los derechos reservados.
            </p>
            <p className="eureka-text-muted text-xs">
              Hecho con ❤️ en el corazón de Chiloé
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
