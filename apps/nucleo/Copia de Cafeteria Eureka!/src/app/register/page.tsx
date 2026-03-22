'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from '@/lib/auth-store'
import { ArrowLeft, Eye, EyeOff, User, Phone, MapPin } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export default function RegisterPage() {
  const { login } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address
        }),
      })

      if (response.ok) {
        const userData = await response.json()
        login(userData)
        
        // Fetch customer data and store it
        const customerResponse = await fetch(`/api/customers?userId=${userData.id}`)
        if (customerResponse.ok) {
          const customerData = await customerResponse.json()
          localStorage.setItem('customer', JSON.stringify(customerData))
        }
        
        // Redirect to loyalty page
        window.location.href = '/fidelizacion'
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al registrarse')
      }
    } catch (error) {
      console.error('Error registering:', error)
      setError('Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo size="xl" variant="default" />
          </Link>
        </div>

        <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white font-light">Crear Cuenta</CardTitle>
            <CardDescription className="text-gray-300">
              Únete a nuestro club de fidelización y disfruta de beneficios exclusivos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="name" className="text-white">Nombre completo</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Tu nombre completo"
                    required
                    className="pl-10 bg-black/40 border-white/20 text-white placeholder-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  className="mt-2 bg-black/40 border-white/20 text-white placeholder-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white">Contraseña</Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="pr-10 bg-black/40 border-white/20 text-white placeholder-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-white">Confirmar contraseña</Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="pr-10 bg-black/40 border-white/20 text-white placeholder-gray-400 focus:ring-amber-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">Teléfono (opcional)</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Tu número de teléfono"
                    className="pl-10 bg-black/40 border-white/20 text-white placeholder-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-white">Dirección (opcional)</Label>
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Tu dirección completa"
                    className="pl-10 bg-black/40 border-white/20 text-white placeholder-gray-400 focus:border-amber-400 focus:ring-amber-400/20"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 py-3 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-300">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>

            <div className="mt-6">
              <Link href="/">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 hover:border-white/40 rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="mt-8 bg-black/40 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm text-amber-400">Beneficios de unirte</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-amber-400 text-lg">•</span>
                <span className="text-gray-300">Acumula puntos con cada compra</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-amber-400 text-lg">•</span>
                <span className="text-gray-300">Canjea recompensas exclusivas</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-amber-400 text-lg">•</span>
                <span className="text-gray-300">Acceso a promociones especiales</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-amber-400 text-lg">•</span>
                <span className="text-gray-300">Seguimiento de tus pedidos</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}