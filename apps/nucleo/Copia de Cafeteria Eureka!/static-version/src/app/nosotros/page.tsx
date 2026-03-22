"use client";

import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Heart, Coffee, Cake, GlassWater } from 'lucide-react';

export default function NosotrosPage() {
  return (
    <div className="min-h-screen eureka-theme">
      {/* Header */}
      <header className="eureka-header">
        <div className="eureka-container px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center eureka-spacing">
            <Link href="/" className="flex items-center gap-3">
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
            </Link>
            
            <div className="flex items-center gap-4">
              <Link href="/" className="eureka-btn-outline border-0">
                Inicio
              </Link>
              <Link href="/catalogo" className="eureka-btn-outline border-0">
                Menú
              </Link>
              <Link href="/fidelizacion" className="eureka-btn-outline border-0">
                Club
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="eureka-container">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="eureka-responsive-text font-light eureka-title mb-6 tracking-wide">
              Sobre Eureka!
            </h1>
            <p className="text-xl eureka-text-secondary max-w-4xl mx-auto leading-relaxed">
              Somos más que una cafetería. Somos el corazón palpitante de Castro, Chiloé, 
              donde cada taza cuenta una historia de pasión, tradición e innovación.
            </p>
          </div>

          {/* Historia */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-light text-white mb-6">Nuestra Historia</h2>
                <div className="space-y-4 text-eureka-text-secondary">
                  <p>
                    Eureka! nació en 2020 de la visión de crear un espacio donde la tradición 
                    chilota se encontrara con la innovación culinaria moderna. Fundada por 
                    la familia González, nuestra cafetería se ha convertido en un punto de 
                    encuentro para locales y visitantes.
                  </p>
                  <p>
                    El nombre "Eureka!" representa ese momento de descubrimiento y alegría 
                    que experimentamos cuando probamos algo verdaderamente especial. Es la 
                    exclamación que queremos que nuestros clientes hagan con cada visita.
                  </p>
                  <p>
                    Desde nuestros humildes comienzos, hemos mantenido el compromiso de 
                    ofrecer productos de la más alta calidad, utilizando ingredientes 
                    locales y técnicas artesanales que honran la rica tradición gastronómica 
                    de Chiloé.
                  </p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-center">
                  <Heart className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-light text-white mb-4">Nuestra Misión</h3>
                  <p className="text-eureka-text-secondary">
                    Crear experiencias gastronómicas únicas que conecten a las personas 
                    con la autenticidad de Chiloé, ofreciendo productos de calidad 
                    excepcional en un ambiente acogedor y familiar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Especialidades */}
          <div className="mb-16">
            <h2 className="text-3xl font-light text-white text-center mb-12">Nuestras Especialidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center hover:border-amber-400/50 transition-all">
                <Coffee className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Café de Especialidad</h3>
                <p className="text-eureka-text-secondary">
                  Trabajamos con granos seleccionados de las mejores regiones cafetaleras 
                  de Chile, tostados artesanalmente para resaltar sus características únicas.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center hover:border-amber-400/50 transition-all">
                <Cake className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Repostería de Autor</h3>
                <p className="text-eureka-text-secondary">
                  Nuestros pasteleros crean delicias únicas que combinan técnicas 
                  tradicionales con ingredientes innovadores, siempre respetando la 
                  estacionalidad de los productos locales.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center hover:border-amber-400/50 transition-all">
                <GlassWater className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Juice Bar Natural</h3>
                <p className="text-eureka-text-secondary">
                  Ofrecemos una amplia variedad de jugos naturales y smoothies, 
                  preparados con frutas frescas de la región y sin conservantes artificiales.
                </p>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="mb-16">
            <h2 className="text-3xl font-light text-white text-center mb-12">Nuestros Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Sostenibilidad</h3>
                <p className="text-eureka-text-secondary text-sm">
                  Comprometidos con el medio ambiente y el desarrollo sostenible de Chiloé
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤝</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Comunidad</h3>
                <p className="text-eureka-text-secondary text-sm">
                  Apoyamos a productores locales y fortalecemos la economía regional
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Calidad</h3>
                <p className="text-eureka-text-secondary text-sm">
                  No comprometemos la excelencia en ningún aspecto de nuestro servicio
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Pasión</h3>
                <p className="text-eureka-text-secondary text-sm">
                  Amamos lo que hacemos y eso se refleja en cada producto y experiencia
                </p>
              </div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="mb-16">
            <h2 className="text-3xl font-light text-white text-center mb-12">Visítanos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-light text-white mb-6">Información de Contacto</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <MapPin className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Dirección</p>
                      <p className="text-eureka-text-secondary">Blanco Encalada 128, Castro, Chiloé</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Teléfono</p>
                      <p className="text-eureka-text-secondary">+56 9 1234 5678</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Mail className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Email</p>
                      <p className="text-eureka-text-secondary">hola@eureka.cl</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Clock className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-white font-medium">Horarios</p>
                      <p className="text-eureka-text-secondary">
                        Lunes a Domingo: 8:00 AM - 10:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-light text-white mb-6">¿Por qué elegirnos?</h3>
                <div className="space-y-4 text-eureka-text-secondary">
                  <p>• Ingredientes frescos y locales de Chiloé</p>
                  <p>• Técnicas artesanales y recetas tradicionales</p>
                  <p>• Ambiente acogedor y familiar</p>
                  <p>• Atención personalizada y servicio excepcional</p>
                  <p>• Compromiso con la comunidad local</p>
                  <p>• Experiencia gastronómica única</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-400 rounded-2xl p-8">
              <h2 className="text-3xl font-light text-white mb-4">¿Listo para la experiencia Eureka?</h2>
              <p className="text-white/90 mb-6 text-lg">
                Ven a visitarnos y descubre por qué somos más que una cafetería
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/catalogo" className="eureka-btn-white px-8 py-3 text-lg font-medium">
                  Ver Menú
                </Link>
                <Link href="/fidelizacion" className="eureka-btn-outline px-8 py-3 text-lg font-medium border-white text-white hover:bg-white hover:text-amber-600">
                  Unirse al Club
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
