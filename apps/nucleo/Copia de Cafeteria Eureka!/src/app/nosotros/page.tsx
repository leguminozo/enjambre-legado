'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  Award, 
  Users, 
  Leaf,
  Star,
  ArrowLeft,
  MapPin,
  Phone,
  Clock
} from "lucide-react"
import { Logo, LogoIcon } from "@/components/ui/logo"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-lg font-light">Volver al Inicio</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Logo size="md" variant="default" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-32 px-4 bg-gradient-to-r from-amber-600/20 to-amber-800/20">
        <div className="max-w-4xl mx-auto text-center">
          <Logo size="xl" variant="default" className="mx-auto mb-8" />
          <h1 className="text-6xl md:text-7xl font-light text-white mb-8 tracking-wide">
            Nuestra Historia
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Más que una cafetería, somos un hogar donde el aroma del café se encuentra con la calidez de la amistad
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-full h-96 bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-2xl flex items-center justify-center border border-amber-500/20">
                <LogoIcon size="xl" className="opacity-80" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-light text-white mb-8 tracking-wide">Nuestro Origen</h2>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Eureka! nació en 2015 con un sueño simple: crear un espacio donde cada taza de café cuente una historia. 
                Todo comenzó cuando nuestra fundadora, María, decidió compartir su pasión por el café artesanal con el mundo.
              </p>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Lo que empezó como un pequeño local en el corazón de Castro, Chiloé, se ha convertido en un referente para 
                los amantes del buen café. Cada día, trabajamos con la misma dedicación y amor que nos inspiró desde el primer día.
              </p>
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-amber-400" />
                <span className="text-amber-400 font-medium">Hecho con amor desde 2015</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-light text-white mb-6 tracking-wide">Nuestros Valores</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Los principios que guían cada grano de café que servimos y cada cliente que atendemos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <div className="w-20 h-20 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                  <Leaf className="w-10 h-10 text-amber-400" />
                </div>
                <CardTitle className="text-white font-light">Calidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Seleccionamos los mejores granos de café de origen sostenible, 
                  asegurando la máxima calidad en cada taza que servimos.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <div className="w-20 h-20 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                  <Heart className="w-10 h-10 text-amber-400" />
                </div>
                <CardTitle className="text-white font-light">Pasión</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Cada café es preparado con dedicación y amor, 
                  porque creemos que la pasión se siente en el sabor.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <div className="w-20 h-20 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                  <Users className="w-10 h-10 text-amber-400" />
                </div>
                <CardTitle className="text-white font-light">Comunidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  Creamos un espacio donde las personas se conectan, 
                  comparten momentos y crecen juntos como comunidad.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-24 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-light text-white mb-6 tracking-wide">Nuestro Equipo</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Conoce a las personas que hacen posible la magia de Eureka! cada día
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <div className="w-32 h-32 bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-full mx-auto mb-6 flex items-center justify-center border border-amber-500/30">
                  <span className="text-4xl font-light text-amber-400">M</span>
                </div>
                <CardTitle className="text-white font-light">María González</CardTitle>
                <CardDescription className="text-gray-300">Fundadora & Barista Principal</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Con más de 15 años de experiencia en el mundo del café, 
                  María es el corazón y alma de Eureka!.
                </p>
                <div className="flex justify-center gap-1">
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <div className="w-32 h-32 bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-full mx-auto mb-6 flex items-center justify-center border border-amber-500/30">
                  <span className="text-4xl font-light text-amber-400">C</span>
                </div>
                <CardTitle className="text-white font-light">Carlos Rodríguez</CardTitle>
                <CardDescription className="text-gray-300">Maestro Tostador</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Especialista en tostado de granos, Carlos asegura que 
                  cada café tenga el perfil de sabor perfecto.
                </p>
                <div className="flex justify-center gap-1">
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <div className="w-32 h-32 bg-gradient-to-br from-amber-600/20 to-amber-800/20 rounded-full mx-auto mb-6 flex items-center justify-center border border-amber-500/30">
                  <span className="text-4xl font-light text-amber-400">A</span>
                </div>
                <CardTitle className="text-white font-light">Ana Martínez</CardTitle>
                <CardDescription className="text-gray-300">Gerente de Experiencia</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Ana se asegura que cada visita a Eureka! sea 
                  una experiencia memorable y acogedora.
                </p>
                <div className="flex justify-center gap-1">
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                  <Star className="w-5 h-5 fill-current text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-light text-white mb-6 tracking-wide">Nuestros Logros</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              El reconocimiento que nos motiva a seguir mejorando cada día
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <CardTitle className="text-4xl font-light text-amber-400">50+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Premios y reconocimientos</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <LogoIcon size="lg" className="mx-auto mb-4" />
                <CardTitle className="text-4xl font-light text-amber-400">100K+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Clientes felices</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <Leaf className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <CardTitle className="text-4xl font-light text-amber-400">15</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Orígenes de café sostenible</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-black/40 border-white/10 hover:bg-black/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <CardHeader>
                <Users className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <CardTitle className="text-4xl font-light text-amber-400">25</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Miembros del equipo</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Visit Us */}
      <section className="py-24 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-light text-white mb-10 tracking-wide">Visítanos</h2>
          <p className="text-xl text-gray-300 mb-16 leading-relaxed">
            Te esperamos con los brazos abiertos y el mejor café de Castro, Chiloé
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                <MapPin className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-semibold mb-3 text-white">Dirección</h3>
              <p className="text-gray-300">Blanco Encalada 128<br />Castro, Chiloé</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                <Phone className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-semibold mb-3 text-white">Teléfono</h3>
              <p className="text-gray-300">+56 9 5448 5113<br />WhatsApp disponible</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-semibold mb-3 text-white">Horario</h3>
              <p className="text-gray-300">Lun-Vie: 8:00 - 13:00 / 15:30 - 19:00<br />Sáb: 10:00 - 13:00 / 15:00 - 18:00</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-600/20 to-amber-800/20 rounded-2xl p-10 text-white border border-amber-500/20 backdrop-blur-sm">
            <h3 className="text-3xl font-light mb-6 tracking-wide">¿Listo para la experiencia Eureka!?</h3>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              Ven y descubre por qué somos el lugar favorito de los amantes del café en Chiloé
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/catalogo">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-8 py-3 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105">
                  Ver Menú
                </Button>
              </Link>
              <Link href="/fidelizacion">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-3 text-lg font-medium rounded-full transition-all duration-300">
                  Unirse al Club
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}