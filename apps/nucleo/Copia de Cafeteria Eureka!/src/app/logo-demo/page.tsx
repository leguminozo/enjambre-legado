'use client'

import { Logo, LogoIcon, GlowingLogo } from "@/components/ui/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LogoDemoPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-light text-center mb-12 tracking-wide">
          Demostración del Logo Eureka!
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Logo Default */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white font-light">Logo Default</CardTitle>
              <CardDescription className="text-gray-300">
                Fondo blanco con sombra sutil
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Logo size="lg" variant="default" />
            </CardContent>
          </Card>

          {/* Logo Contrast */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white font-light">Logo Contrast</CardTitle>
              <CardDescription className="text-gray-300">
                Fondo ámbar con máximo contraste
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Logo size="lg" variant="contrast" />
            </CardContent>
          </Card>

          {/* Logo Glowing */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white font-light">Logo Glowing</CardTitle>
              <CardDescription className="text-gray-300">
                Con anillo de luz y animación
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <GlowingLogo size="lg" />
            </CardContent>
          </Card>

          {/* Logo Icon Default */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white font-light">Logo Icon Default</CardTitle>
              <CardDescription className="text-gray-300">
                Solo el ícono sin texto
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <LogoIcon size="lg" variant="default" />
            </CardContent>
          </Card>

          {/* Logo Icon Contrast */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white font-light">Logo Icon Contrast</CardTitle>
              <CardDescription className="text-gray-300">
                Solo el ícono con fondo ámbar
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <LogoIcon size="lg" variant="contrast" />
            </CardContent>
          </Card>

          {/* Comparación de tamaños */}
          <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white font-light">Comparación de Tamaños</CardTitle>
              <CardDescription className="text-gray-300">
                sm, md, lg, xl
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Logo size="sm" variant="contrast" />
              <Logo size="md" variant="contrast" />
              <Logo size="lg" variant="contrast" />
              <Logo size="xl" variant="contrast" />
            </CardContent>
          </Card>

        </div>

        {/* Sección de uso recomendado */}
        <div className="mt-16">
          <Card className="bg-amber-600/20 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-amber-400 font-light">Recomendaciones de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-white mb-2">Header/Navegación:</h3>
                <p className="text-gray-300">Usar <code className="bg-black/40 px-2 py-1 rounded">variant="contrast"</code> para máxima visibilidad</p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">Sección Hero:</h3>
                <p className="text-gray-300">Usar <code className="bg-black/40 px-2 py-1 rounded">GlowingLogo</code> para impacto visual</p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">Tarjetas/Contenido:</h3>
                <p className="text-gray-300">Usar <code className="bg-black/40 px-2 py-1 rounded">variant="default"</code> para elegancia</p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">Iconos pequeños:</h3>
                <p className="text-gray-300">Usar <code className="bg-black/40 px-2 py-1 rounded">LogoIcon</code> para espacios reducidos</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
