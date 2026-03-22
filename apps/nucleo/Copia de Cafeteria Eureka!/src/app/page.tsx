'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { useAuthStore } from '@/lib/auth-store'
import { User, Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react"
import { Logo, LogoIcon, GlowingLogo } from "@/components/ui/logo"

export default function Home() {
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    localStorage.removeItem('customer')
  }

  return (
    <div className="min-h-screen eureka-theme flex flex-col">
      <header className="eureka-header">
        <div className="eureka-container px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center eureka-spacing">
            <div className="flex items-center gap-3">
              <Logo size="md" variant="dark-theme" />
            </div>
            <div className="flex items-center gap-6">
              <Link href="/nosotros">
                <Button variant="ghost" className="eureka-btn-outline border-0">
                  Sobre Nosotros
                </Button>
              </Link>
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Link href="/admin">
                      <Button variant="outline" className="eureka-btn-outline">
                        Panel Admin
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handleLogout} 
                    className="eureka-btn-outline"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button variant="outline" className="eureka-btn-outline">
                    <User className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

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
                <Button 
                  size="lg" 
                  variant="outline"
                  className="eureka-btn-white px-8 py-3 text-lg font-medium eureka-rounded eureka-transition eureka-hover-scale"
                >
                  Ver Menú
                </Button>
              </Link>
              <Link href="/fidelizacion">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="eureka-btn-outline px-8 py-3 text-lg font-medium eureka-rounded eureka-transition"
                >
                  Unirse al Club
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Compacto */}
      <footer className="eureka-theme border-t border-white/10 py-8 px-4 mt-auto">
        <div className="eureka-container">
          {/* Logo y Descripción */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Logo size="md" variant="dark-theme" />
            </div>
            <p className="eureka-text-secondary max-w-xl mx-auto text-sm">
              Descubre el sabor auténtico de Chiloé en cada taza, cada bocado y cada sorbo
            </p>
          </div>

          {/* Información de Contacto */}
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

          {/* Redes Sociales */}
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

          {/* Línea divisoria */}
          <div className="border-t border-white/10 pt-4 mb-6"></div>

          {/* Copyright y Dirección */}
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
  )
}